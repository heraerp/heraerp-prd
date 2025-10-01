import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Enterprise-grade configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('CRITICAL: Supabase configuration missing')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: true, persistSession: true }
})

// GET single client with complete history
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params

    // Fetch client entity with all related data
    const { data: client, error: clientError } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data!entity_id(*),
        from_transactions:universal_transactions!from_entity_id(
          id,
          transaction_type,
          transaction_date,
          total_amount,
          transaction_status,
          metadata
        ),
        to_transactions:universal_transactions!to_entity_id(
          id,
          transaction_type,
          transaction_date,
          total_amount,
          transaction_status,
          metadata
        )
      `
      )
      .eq('id', clientId)
      .eq('entity_type', 'customer')
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found'
        },
        { status: 404 }
      )
    }

    // Transform client data
    const dynamicData = client.core_dynamic_data || []
    const appointments = [...(client.from_transactions || []), ...(client.to_transactions || [])]
      .filter(t => t.transaction_type === 'appointment')
      .sort(
        (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      )

    const transformedClient = {
      id: client.id,
      name: client.entity_name,
      code: client.entity_code,
      phone: dynamicData.find(d => d.field_name === 'phone')?.field_value_text || '',
      email: dynamicData.find(d => d.field_name === 'email')?.field_value_text || '',
      birthDate: dynamicData.find(d => d.field_name === 'birth_date')?.field_value_date || null,
      loyaltyPoints:
        dynamicData.find(d => d.field_name === 'loyalty_points')?.field_value_number || 0,
      preferredStylist:
        dynamicData.find(d => d.field_name === 'preferred_stylist')?.field_value_text || '',
      notes: dynamicData.find(d => d.field_name === 'notes')?.field_value_text || '',
      allergies: dynamicData.find(d => d.field_name === 'allergies')?.field_value_text || '',
      preferences: dynamicData.find(d => d.field_name === 'preferences')?.field_value_text || '',
      emergencyContact: (client.metadata as any)?.emergency_contact || '',
      totalSpent: dynamicData.find(d => d.field_name === 'total_spent')?.field_value_number || 0,
      visitCount: dynamicData.find(d => d.field_name === 'visit_count')?.field_value_number || 0,
      status: client.status || 'active',
      createdAt: client.created_at,
      appointmentHistory: appointments.map(apt => ({
        id: apt.id,
        date: apt.transaction_date,
        service: (apt.metadata as any)?.service_name || 'Service',
        stylist: (apt.metadata as any)?.stylist_name || 'Staff',
        amount: apt.total_amount,
        status: apt.transaction_status
      }))
    }

    return NextResponse.json({
      success: true,
      client: transformedClient
    })
  } catch (error) {
    console.error('Error in client GET:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// UPDATE client
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params
    const body = await request.json()

    const {
      name,
      phone,
      email,
      birthDate,
      preferredStylist,
      notes,
      emergencyContact,
      allergies,
      preferences,
      status
    } = body

    // Update client entity
    const { data: client, error } = await supabase
      .from('core_entities')
      .update({
        entity_name: name,
        status: status || 'active',
        metadata: supabase.sql`
          metadata || jsonb_build_object(
            'updated_at', '${new Date().toISOString()}',
            'emergency_contact', '${emergencyContact || ''}'
          )`
      })
      .eq('id', clientId)
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
      { field_name: 'phone', field_value_text: phone, smart_code: 'HERA.SALON.CLIENT.PHONE.V1' },
      { field_name: 'email', field_value_text: email, smart_code: 'HERA.SALON.CLIENT.EMAIL.V1' },
      {
        field_name: 'birth_date',
        field_value_date: birthDate,
        smart_code: 'HERA.SALON.CLIENT.BIRTHDATE.V1'
      },
      {
        field_name: 'preferred_stylist',
        field_value_text: preferredStylist,
        smart_code: 'HERA.SALON.CLIENT.STYLIST.V1'
      },
      { field_name: 'notes', field_value_text: notes, smart_code: 'HERA.SALON.CLIENT.NOTES.V1' },
      {
        field_name: 'allergies',
        field_value_text: allergies,
        smart_code: 'HERA.SALON.CLIENT.ALLERGIES.V1'
      },
      {
        field_name: 'preferences',
        field_value_text: preferences,
        smart_code: 'HERA.SALON.CLIENT.PREFERENCES.V1'
      }
    ]

    // Batch upsert dynamic fields
    for (const field of fieldsToUpdate) {
      if (field.field_value_text !== undefined || field.field_value_date !== undefined) {
        await supabase.from('core_dynamic_data').upsert(
          {
            organization_id: client.organization_id,
            entity_id: clientId,
            field_name: field.field_name,
            field_value_text: field.field_value_text || null,
            field_value_date: field.field_value_date || null,
            smart_code: field.smart_code
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
      },
      message: 'Client updated successfully'
    })
  } catch (error) {
    console.error('Error in client PUT:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// DELETE client (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || 'No reason provided'

    // Soft delete by updating status
    const { data: client, error } = await supabase
      .from('core_entities')
      .update({
        status: 'inactive',
        metadata: supabase.sql`
          metadata || jsonb_build_object(
            'deleted_at', '${new Date().toISOString()}',
            'deletion_reason', '${reason}'
          )`
      })
      .eq('id', clientId)
      .select()
      .single()

    if (error) {
      console.error('Error deleting client:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Client deactivated successfully',
      client: {
        id: client.id,
        name: client.entity_name,
        status: client.status
      }
    })
  } catch (error) {
    console.error('Error in client DELETE:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// PATCH for partial updates (e.g., loyalty points)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'add_loyalty_points': {
        // Get current points
        const { data: currentData } = await supabase
          .from('core_dynamic_data')
          .select('field_value_number')
          .eq('entity_id', clientId)
          .eq('field_name', 'loyalty_points')
          .single()

        const currentPoints = currentData?.field_value_number || 0
        const newPoints = currentPoints + (data.points || 0)

        // Update points
        await supabase.from('core_dynamic_data').upsert(
          {
            organization_id: data.organizationId,
            entity_id: clientId,
            field_name: 'loyalty_points',
            field_value_number: newPoints,
            smart_code: 'HERA.SALON.CLIENT.LOYALTY.V1'
          },
          {
            onConflict: 'organization_id,entity_id,field_name'
          }
        )

        // Create transaction record for points
        await supabase.from('universal_transactions').insert({
          organization_id: data.organizationId,
          transaction_type: 'loyalty_points',
          transaction_code: `PTS-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          total_amount: data.points,
          from_entity_id: data.salonId,
          to_entity_id: clientId,
          smart_code: 'HERA.SALON.LOYALTY.EARNED.V1',
          metadata: {
            reason: data.reason || 'Service completion',
            previous_balance: currentPoints,
            new_balance: newPoints
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Loyalty points updated',
          newBalance: newPoints
        })
      }

      case 'update_visit_count': {
        // Update visit count and last visit
        await supabase.from('core_dynamic_data').upsert(
          [
            {
              organization_id: data.organizationId,
              entity_id: clientId,
              field_name: 'visit_count',
              field_value_number: data.visitCount,
              smart_code: 'HERA.SALON.CLIENT.VISITS.V1'
            },
            {
              organization_id: data.organizationId,
              entity_id: clientId,
              field_name: 'last_visit',
              field_value_date: new Date().toISOString(),
              smart_code: 'HERA.SALON.CLIENT.LASTVISIT.V1'
            }
          ],
          {
            onConflict: 'organization_id,entity_id,field_name'
          }
        )

        return NextResponse.json({
          success: true,
          message: 'Visit count updated'
        })
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action'
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in client PATCH:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
