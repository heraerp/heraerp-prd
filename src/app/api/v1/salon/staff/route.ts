import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('CRITICAL: Supabase configuration missing')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id') || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
    const role = searchParams.get('role') || 'all' // all, stylist, manager, etc.
    
    // Build query for staff members
    let query = supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!entity_id(*)
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee')
      .eq('status', 'active')
    
    const { data: staff, error } = await query.order('entity_name')
    
    if (error) {
      console.error('Error fetching staff:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Transform staff data
    const transformedStaff = staff?.map(member => {
      const dynamicData = member.core_dynamic_data || []
      const roleData = dynamicData.find(d => d.field_name === 'role')
      const specialtiesData = dynamicData.find(d => d.field_name === 'specialties')
      
      // Filter by role if specified
      const memberRole = roleData?.field_value_text || 'staff'
      if (role !== 'all' && memberRole !== role) {
        return null
      }
      
      return {
        id: member.id,
        name: member.entity_name,
        code: member.entity_code,
        role: memberRole,
        specialties: specialtiesData?.field_value_text?.split(',').map(s => s.trim()) || [],
        status: member.status || 'active'
      }
    }).filter(Boolean) || []

    return NextResponse.json({ 
      success: true, 
      staff: transformedStaff 
    })
  } catch (error) {
    console.error('Error in staff GET:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      name,
      role,
      specialties,
      phone,
      email
    } = body

    const orgId = organizationId || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || ''
    
    // Generate staff code
    const staffCode = `STAFF-${Date.now()}`

    // Create staff entity
    const { data: staffMember, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'employee',
        entity_name: name,
        entity_code: staffCode,
        smart_code: 'HERA.SALON.STAFF.PROFILE.v1',
        status: 'active',
        metadata: {
          source: 'salon_app',
          created_by: 'salon_admin'
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating staff:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    // Create dynamic data fields
    const dynamicFields = [
      { field_name: 'role', field_value_text: role || 'stylist', smart_code: 'HERA.SALON.STAFF.ROLE.v1' },
      { field_name: 'specialties', field_value_text: specialties || '', smart_code: 'HERA.SALON.STAFF.SPECIALTIES.v1' },
      { field_name: 'phone', field_value_text: phone || '', smart_code: 'HERA.SALON.STAFF.PHONE.v1' },
      { field_name: 'email', field_value_text: email || '', smart_code: 'HERA.SALON.STAFF.EMAIL.v1' }
    ].filter(field => field.field_value_text)

    if (dynamicFields.length > 0) {
      await supabase
        .from('core_dynamic_data')
        .insert(
          dynamicFields.map(field => ({
            ...field,
            organization_id: orgId,
            entity_id: staffMember.id
          }))
        )
    }

    return NextResponse.json({ 
      success: true, 
      staff: {
        id: staffMember.id,
        name: staffMember.entity_name,
        code: staffMember.entity_code,
        role: role || 'stylist'
      }
    })
  } catch (error) {
    console.error('Error in staff POST:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}