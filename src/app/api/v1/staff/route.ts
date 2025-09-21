import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for bypassing RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, name, role, phone, email, hourly_rate, commission_rate } = body

    // Validate required fields
    if (!organizationId || !name) {
      return NextResponse.json({ error: 'Organization ID and name are required' }, { status: 400 })
    }

    // Create the employee entity
    const entityCode = `EMP-${Date.now()}`
    const { data: staffEntity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'employee',
        entity_name: name,
        entity_code: entityCode,
        smart_code: 'HERA.SALON.HR.EMPLOYEE.PROFILE.v1',
        metadata: { role },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (entityError) {
      console.error('Error creating entity:', entityError)
      return NextResponse.json(
        { error: 'Failed to create staff member', details: entityError },
        { status: 500 }
      )
    }

    // Add dynamic fields
    const dynamicFields = []

    if (phone) {
      dynamicFields.push({
        organization_id: organizationId,
        entity_id: staffEntity.id,
        field_name: 'phone',
        field_value_text: phone,
        field_type: 'text',
        smart_code: 'HERA.SALON.HR.EMPLOYEE.DYN.PHONE.v1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    if (email) {
      dynamicFields.push({
        organization_id: organizationId,
        entity_id: staffEntity.id,
        field_name: 'email',
        field_value_text: email,
        field_type: 'text',
        smart_code: 'HERA.SALON.HR.EMPLOYEE.DYN.EMAIL.v1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    if (hourly_rate) {
      dynamicFields.push({
        organization_id: organizationId,
        entity_id: staffEntity.id,
        field_name: 'hourly_rate',
        field_value_number: hourly_rate,
        field_type: 'number',
        smart_code: 'HERA.SALON.HR.EMPLOYEE.DYN.HOURLY_RATE.v1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    if (commission_rate) {
      dynamicFields.push({
        organization_id: organizationId,
        entity_id: staffEntity.id,
        field_name: 'commission_rate',
        field_value_number: commission_rate,
        field_type: 'number',
        smart_code: 'HERA.SALON.HR.EMPLOYEE.DYN.COMMISSION_RATE.v1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    // Always add role
    dynamicFields.push({
      organization_id: organizationId,
      entity_id: staffEntity.id,
      field_name: 'role',
      field_value_text: role || 'stylist',
      field_type: 'text',
      smart_code: 'HERA.SALON.HR.EMPLOYEE.DYN.ROLE.v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    // Insert dynamic fields
    if (dynamicFields.length > 0) {
      const { error: dynError } = await supabase.from('core_dynamic_data').insert(dynamicFields)

      if (dynError) {
        console.error('Error creating dynamic fields:', dynError)
        // Don't fail the whole operation if dynamic fields fail
      }
    }

    return NextResponse.json({
      success: true,
      data: staffEntity,
      message: 'Staff member created successfully'
    })
  } catch (error) {
    console.error('Staff API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Get all employees for the organization
    const { data: entities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee')
      .order('created_at', { ascending: false })

    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError)
      return NextResponse.json(
        { error: 'Failed to fetch staff members', details: entitiesError },
        { status: 500 }
      )
    }

    // Get dynamic data for all entities
    if (entities && entities.length > 0) {
      const entityIds = entities.map(e => e.id)
      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('organization_id', organizationId)
        .in('entity_id', entityIds)

      if (dynamicError) {
        console.error('Error fetching dynamic data:', dynamicError)
      }

      // Map dynamic data to entities
      const staffWithData = entities.map(entity => {
        const entityDynamics = dynamicData?.filter(d => d.entity_id === entity.id) || []
        const dynamicFields: Record<string, any> = {}

        entityDynamics.forEach(d => {
          if (d.field_value_text) dynamicFields[d.field_name] = d.field_value_text
          if (d.field_value_number !== null) dynamicFields[d.field_name] = d.field_value_number
        })

        return {
          ...entity,
          dynamic_data: dynamicFields
        }
      })

      return NextResponse.json({
        success: true,
        data: staffWithData
      })
    }

    return NextResponse.json({
      success: true,
      data: []
    })
  } catch (error) {
    console.error('Staff API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
