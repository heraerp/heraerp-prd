import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Enterprise-grade configuration with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('CRITICAL: Supabase configuration missing. Check environment variables.')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'x-application-name': 'HERA-ERP',
      'x-module': 'salon-clients'
    }
  }
})

// Enterprise logging
const log = {
  info: (message: string, data?: any) => console.log(`[SALON-CLIENTS] ${message}`, data || ''),
  error: (message: string, error?: any) =>
    console.error(`[SALON-CLIENTS ERROR] ${message}`, error || ''),
  warn: (message: string, data?: any) => console.warn(`[SALON-CLIENTS WARN] ${message}`, data || '')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId =
      searchParams.get('organization_id') || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'active'

    // Build query
    let query = supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data!entity_id(*)
      `
      )
      .eq('organization_id', organizationId)
      .eq('entity_type', 'customer')

    // Add status filter
    if (status === 'active') {
      query = query.or('status.eq.active,status.is.null')
    } else if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Add search filter
    if (search) {
      query = query.or(`entity_name.ilike.%${search}%,entity_code.ilike.%${search}%`)
    }

    const { data: clients, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Transform clients to include dynamic data
    const transformedClients =
      clients?.map(client => {
        const dynamicData = client.core_dynamic_data || []
        const phoneData = dynamicData.find(d => d.field_name === 'phone')
        const emailData = dynamicData.find(d => d.field_name === 'email')
        const birthDateData = dynamicData.find(d => d.field_name === 'birth_date')
        const loyaltyPointsData = dynamicData.find(d => d.field_name === 'loyalty_points')
        const preferredStylistData = dynamicData.find(d => d.field_name === 'preferred_stylist')
        const notesData = dynamicData.find(d => d.field_name === 'notes')
        const lastVisitData = dynamicData.find(d => d.field_name === 'last_visit')
        const totalSpentData = dynamicData.find(d => d.field_name === 'total_spent')

        return {
          id: client.id,
          name: client.entity_name,
          code: client.entity_code,
          phone: phoneData?.field_value_text || '',
          email: emailData?.field_value_text || '',
          birthDate: birthDateData?.field_value_date || null,
          loyaltyPoints: loyaltyPointsData?.field_value_number || 0,
          preferredStylist: preferredStylistData?.field_value_text || '',
          notes: notesData?.field_value_text || '',
          lastVisit: lastVisitData?.field_value_date || null,
          totalSpent: totalSpentData?.field_value_number || 0,
          status: client.status || 'active',
          createdAt: client.created_at,
          metadata: client.metadata || {}
        }
      }) || []

    return NextResponse.json({
      success: true,
      clients: transformedClients
    })
  } catch (error) {
    console.error('Error in clients GET:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Client POST request body:', body)

    const {
      organizationId,
      name,
      phone,
      email,
      birthDate,
      preferredStylist,
      notes,
      emergencyContact,
      allergies,
      preferences
    } = body

    const orgId = organizationId || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || ''

    // Generate client code
    const clientCode = `CLIENT-${Date.now()}`

    // Create client entity
    const { data: client, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'customer',
        entity_name: name,
        entity_code: clientCode,
        smart_code: 'HERA.SALON.CLIENT.PROFILE.V1',
        status: 'active',
        metadata: {
          source: 'salon_app',
          created_by: 'salon_staff',
          tags: ['salon_client'],
          emergency_contact: emergencyContact
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      )
    }

    // Create dynamic data fields
    const dynamicFields = [
      { field_name: 'phone', field_value_text: phone, smart_code: 'HERA.SALON.CLIENT.PHONE.V1' },
      { field_name: 'email', field_value_text: email, smart_code: 'HERA.SALON.CLIENT.EMAIL.V1' },
      {
        field_name: 'birth_date',
        field_value_date: birthDate,
        smart_code: 'HERA.SALON.CLIENT.BIRTHDATE.V1'
      },
      {
        field_name: 'preferred_stylist',
        field_value_text: preferredStylist || '',
        smart_code: 'HERA.SALON.CLIENT.STYLIST.V1'
      },
      {
        field_name: 'notes',
        field_value_text: notes || '',
        smart_code: 'HERA.SALON.CLIENT.NOTES.V1'
      },
      {
        field_name: 'loyalty_points',
        field_value_number: 0,
        smart_code: 'HERA.SALON.CLIENT.LOYALTY.V1'
      },
      {
        field_name: 'total_spent',
        field_value_number: 0,
        smart_code: 'HERA.SALON.CLIENT.SPENT.V1'
      },
      {
        field_name: 'visit_count',
        field_value_number: 0,
        smart_code: 'HERA.SALON.CLIENT.VISITS.V1'
      },
      {
        field_name: 'allergies',
        field_value_text: allergies || '',
        smart_code: 'HERA.SALON.CLIENT.ALLERGIES.V1'
      },
      {
        field_name: 'preferences',
        field_value_text: preferences || '',
        smart_code: 'HERA.SALON.CLIENT.PREFERENCES.V1'
      }
    ].filter(
      field =>
        field.field_value_text !== undefined ||
        field.field_value_number !== undefined ||
        field.field_value_date !== undefined
    )

    if (dynamicFields.length > 0) {
      const { error: dynamicError } = await supabase.from('core_dynamic_data').insert(
        dynamicFields.map(field => ({
          ...field,
          organization_id: orgId,
          entity_id: client.id
        }))
      )

      if (dynamicError) {
        console.error('Error creating dynamic fields:', dynamicError)
        // Don't fail the whole request if dynamic fields fail
      }
    }

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.entity_name,
        code: client.entity_code,
        phone,
        email,
        status: 'active'
      }
    })
  } catch (error) {
    console.error('Error in clients POST:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, phone, email, birthDate, preferredStylist, notes, status } = body

    // Update client entity
    const { data: client, error } = await supabase
      .from('core_entities')
      .update({
        entity_name: name,
        status: status || 'active',
        metadata: supabase.sql`
          metadata || jsonb_build_object(
            'updated_at', '${new Date().toISOString()}'
          )`
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      )
    }

    // Update dynamic fields
    const fieldsToUpdate = [
      { field_name: 'phone', field_value_text: phone },
      { field_name: 'email', field_value_text: email },
      { field_name: 'birth_date', field_value_date: birthDate },
      { field_name: 'preferred_stylist', field_value_text: preferredStylist },
      { field_name: 'notes', field_value_text: notes }
    ]

    for (const field of fieldsToUpdate) {
      if (field.field_value_text !== undefined || field.field_value_date !== undefined) {
        await supabase.from('core_dynamic_data').upsert(
          {
            organization_id: client.organization_id,
            entity_id: id,
            field_name: field.field_name,
            ...field
          },
          {
            onConflict: 'organization_id,entity_id,field_name'
          }
        )
      }
    }

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.entity_name,
        status: client.status
      }
    })
  } catch (error) {
    console.error('Error in clients PUT:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
