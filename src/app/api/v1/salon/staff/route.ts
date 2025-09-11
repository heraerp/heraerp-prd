import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    
    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
    }

    // Fetch staff entities
    const { data: staffEntities, error: staffError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'staff')
      .neq('status', 'deleted')
      .order('entity_name')

    if (staffError) throw staffError

    // Fetch dynamic data for all staff
    const staffIds = staffEntities?.map(s => s.id) || []
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .in('entity_id', staffIds)

    if (dynamicError) throw dynamicError

    // Enrich staff with dynamic data
    const enrichedStaff = staffEntities?.map(staff => {
      const staffDynamicData = dynamicData?.filter(d => d.entity_id === staff.id) || []
      const dynamicFields: any = {}
      
      staffDynamicData.forEach(field => {
        if (field.field_value_text) dynamicFields[field.field_name] = field.field_value_text
        if (field.field_value_number !== null) dynamicFields[field.field_name] = field.field_value_number
        if (field.field_value_boolean !== null) dynamicFields[field.field_name] = field.field_value_boolean
        if (field.field_value_json) dynamicFields[field.field_name] = field.field_value_json
      })
      
      return {
        ...staff,
        ...dynamicFields
      }
    }) || []

    // Calculate analytics
    const analytics = {
      total_staff: enrichedStaff.length,
      full_time: enrichedStaff.filter(s => (s.metadata as any)?.employment_type === 'full_time').length,
      part_time: enrichedStaff.filter(s => (s.metadata as any)?.employment_type === 'part_time').length,
      contractors: enrichedStaff.filter(s => (s.metadata as any)?.employment_type === 'contractor').length,
      by_role: {} as Record<string, number>
    }

    // Count by role
    enrichedStaff.forEach(staff => {
      const role = staff.role || 'unassigned'
      analytics.by_role[role] = (analytics.by_role[role] || 0) + 1
    })

    return NextResponse.json({
      staff: enrichedStaff,
      analytics
    })
  } catch (error: any) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, name, email, phone, role, ...otherFields } = body

    if (!organization_id || !name || !role) {
      return NextResponse.json(
        { error: 'organization_id, name, and role are required' },
        { status: 400 }
      )
    }

    // Check if email already exists for another staff member
    if (email) {
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('entity_type', 'staff')
        .neq('status', 'deleted')
        .single()

      if (existing) {
        const { data: emailCheck } = await supabase
          .from('core_dynamic_data')
          .select('entity_id')
          .eq('field_name', 'email')
          .eq('field_value_text', email)
          .neq('entity_id', existing.id)
          .single()

        if (emailCheck) {
          return NextResponse.json(
            { error: 'A staff member with this email already exists' },
            { status: 400 }
          )
        }
      }
    }

    // Create staff entity
    const entityCode = `STAFF_${name.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`
    const smartCode = `HERA.SALON.STAFF.${role.toUpperCase()}.v1`

    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id,
        entity_type: 'staff',
        entity_name: name,
        entity_code: entityCode,
        smart_code: smartCode,
        status: 'active',
        metadata: {
          employment_type: otherFields.employment_type || 'full_time',
          start_date: otherFields.start_date || new Date().toISOString(),
          created_via: 'staff_management_api'
        }
      })
      .select()
      .single()

    if (entityError) throw entityError

    // Create dynamic fields
    const fields = { email, phone, role, ...otherFields }
    const dynamicInserts = Object.entries(fields)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => ({
        organization_id,
        entity_id: entity.id,
        field_name: key,
        ...(typeof value === 'string' ? { field_value_text: value } :
            typeof value === 'number' ? { field_value_number: value } :
            typeof value === 'boolean' ? { field_value_boolean: value } :
            { field_value_json: value }),
        smart_code: `HERA.SALON.STAFF.FIELD.${key.toUpperCase()}.v1`,
        created_at: new Date().toISOString()
      }))

    if (dynamicInserts.length > 0) {
      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicInserts)

      if (dynamicError) throw dynamicError
    }

    return NextResponse.json({
      message: 'Staff member created successfully',
      data: { ...entity, ...fields }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating staff:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create staff member' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
    }

    const { name, ...dynamicFields } = body

    // Update entity if name changed
    if (name) {
      const { error: entityError } = await supabase
        .from('core_entities')
        .update({
          entity_name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (entityError) throw entityError
    }

    // Update dynamic fields
    for (const [key, value] of Object.entries(dynamicFields)) {
      // Check if field exists
      const { data: existing } = await supabase
        .from('core_dynamic_data')
        .select('id')
        .eq('entity_id', id)
        .eq('field_name', key)
        .single()

      if (existing) {
        // Update existing field
        const updateData: any = { updated_at: new Date().toISOString() }
        if (typeof value === 'string') updateData.field_value_text = value
        else if (typeof value === 'number') updateData.field_value_number = value
        else if (typeof value === 'boolean') updateData.field_value_boolean = value
        else updateData.field_value_json = value

        const { error } = await supabase
          .from('core_dynamic_data')
          .update(updateData)
          .eq('id', existing.id)

        if (error) throw error
      } else {
        // Create new field
        const { data: entity } = await supabase
          .from('core_entities')
          .select('organization_id')
          .eq('id', id)
          .single()

        if (entity) {
          const insertData: any = {
            organization_id: entity.organization_id,
            entity_id: id,
            field_name: key,
            smart_code: `HERA.SALON.STAFF.FIELD.${key.toUpperCase()}.v1`,
            created_at: new Date().toISOString()
          }
          
          if (typeof value === 'string') insertData.field_value_text = value
          else if (typeof value === 'number') insertData.field_value_number = value
          else if (typeof value === 'boolean') insertData.field_value_boolean = value
          else insertData.field_value_json = value

          const { error } = await supabase
            .from('core_dynamic_data')
            .insert(insertData)

          if (error) throw error
        }
      }
    }

    return NextResponse.json({
      message: 'Staff member updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating staff:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
    }

    // Check if staff has appointments
    const { data: appointments } = await supabase
      .from('core_relationships')
      .select('id')
      .eq('to_entity_id', id)
      .eq('relationship_type', 'appointment_staff')
      .limit(1)

    if (appointments && appointments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete staff member with existing appointments' },
        { status: 400 }
      )
    }

    // Soft delete
    const { error } = await supabase
      .from('core_entities')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      message: 'Staff member deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting staff:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete staff member' },
      { status: 500 }
    )
  }
}