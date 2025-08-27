import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createIntegratedAppointment } from '@/lib/salon/integrated-appointment-booking'
import { UniversalWorkflow } from '@/lib/universal-workflow'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id') || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    // Fetch appointments with proper relationships
    const { data: appointments, error } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        client:source_entity_id(id, entity_name, entity_type),
        stylist:target_entity_id(id, entity_name, entity_type),
        status_relationships:core_relationships!from_entity_id(
          to_entity:to_entity_id(id, entity_name, entity_code)
        )
      `)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'appointment')
      .gte('transaction_date', date)
      .lte('transaction_date', date + 'T23:59:59')
      .eq('status_relationships.relationship_type', 'has_workflow_status')
      .eq('status_relationships.relationship_data->is_active', 'true')
      .order('transaction_date')
    
    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Transform appointments to include proper entity data
    const transformedAppointments = appointments?.map(apt => {
      // Get current workflow status
      const currentStatus = apt.status_relationships?.find(
        rel => rel.relationship_data?.is_active === true
      )?.to_entity
      
      // Get client contact info from dynamic data if needed
      return {
        id: apt.id,
        clientId: apt.client?.id,
        clientName: apt.client?.entity_name || apt.metadata?.customer_name || 'Unknown Client',
        clientPhone: apt.metadata?.customer_phone || '',
        clientEmail: apt.metadata?.customer_email || '',
        service: apt.metadata?.service_name || 'Service',
        stylistId: apt.stylist?.id,
        stylist: apt.stylist?.entity_name || apt.metadata?.stylist_name || 'Staff',
        date: apt.transaction_date,
        time: apt.metadata?.appointment_time || '10:00 AM',
        duration: apt.metadata?.duration || '60 min',
        price: apt.total_amount || 0,
        status: currentStatus?.entity_name || apt.metadata?.status || 'confirmed',
        statusCode: currentStatus?.entity_code || '',
        notes: apt.metadata?.notes || ''
      }
    }) || []

    return NextResponse.json({ 
      success: true, 
      appointments: transformedAppointments 
    })
  } catch (error) {
    console.error('Error in appointments GET:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Appointment POST request body:', body)
    
    const {
      organizationId,
      clientName,
      clientPhone,
      clientEmail,
      serviceId,
      serviceName,
      servicePrice,
      stylistId,
      stylistName,
      date,
      time,
      duration,
      notes
    } = body

    const orgId = organizationId || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
    console.log('Using organization ID:', orgId)

    // Use the truly integrated appointment booking
    const result = await createIntegratedAppointment({
      organizationId: orgId,
      clientName,
      clientPhone,
      clientEmail,
      serviceId,
      serviceName,
      servicePrice: servicePrice || 0,
      stylistId,
      stylistName,
      date,
      time,
      duration: duration || 60,
      notes
    })

    if (!result.success) {
      console.error('Failed to create integrated appointment:', result.error)
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to create appointment'
      }, { status: 500 })
    }

    console.log('Integrated appointment created successfully:', result)

    // Get the full appointment with relationships for the response
    const { data: fullAppointment } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        client:source_entity_id(id, entity_name),
        stylist:target_entity_id(id, entity_name),
        status_relationships:core_relationships!from_entity_id(
          to_entity:to_entity_id(entity_name, entity_code)
        )
      `)
      .eq('id', result.appointmentId)
      .eq('status_relationships.relationship_type', 'has_workflow_status')
      .eq('status_relationships.relationship_data->is_active', 'true')
      .single()

    const currentStatus = fullAppointment?.status_relationships?.[0]?.to_entity

    return NextResponse.json({ 
      success: true, 
      appointment: {
        id: result.appointmentId,
        clientId: result.clientId,
        clientName: fullAppointment?.client?.entity_name || clientName,
        service: serviceName,
        stylist: fullAppointment?.stylist?.entity_name || stylistName,
        date,
        time,
        status: currentStatus?.entity_name || 'Scheduled',
        statusCode: currentStatus?.entity_code || 'STATUS-APPOINTMENT-SCHEDULED',
        message: result.message
      }
    })
  } catch (error) {
    console.error('Error in appointments POST:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, organizationId, userId, ...updates } = body

    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Organization ID required' 
      }, { status: 400 })
    }

    const workflow = new UniversalWorkflow(organizationId)

    // If status change requested, use workflow transition
    if (status) {
      // Map status strings to workflow status codes
      const statusMap: Record<string, string> = {
        'scheduled': 'STATUS-APPOINTMENT-SCHEDULED',
        'checked_in': 'STATUS-APPOINTMENT-CHECKED_IN',
        'in_service': 'STATUS-APPOINTMENT-IN_SERVICE',
        'completed': 'STATUS-APPOINTMENT-COMPLETED',
        'no_show': 'STATUS-APPOINTMENT-NO_SHOW',
        'cancelled': 'STATUS-APPOINTMENT-CANCELLED'
      }

      const targetStatusCode = statusMap[status.toLowerCase()] || status

      // Find the target status entity
      const { data: targetStatus } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'workflow_status')
        .eq('entity_code', targetStatusCode)
        .single()

      if (targetStatus) {
        // Transition to new status
        await workflow.transitionStatus(id, targetStatus.id, {
          userId: userId || 'system',
          reason: updates.reason || 'Status updated'
        })
        console.log(`Transitioned appointment ${id} to ${targetStatusCode}`)
      }
    }

    // Update appointment metadata if other fields changed
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            ...updates,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', id)
    }

    // Get updated appointment with relationships
    const { data: updatedAppointment } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        client:source_entity_id(id, entity_name),
        stylist:target_entity_id(id, entity_name),
        status_relationships:core_relationships!from_entity_id(
          to_entity:to_entity_id(entity_name, entity_code)
        )
      `)
      .eq('id', id)
      .eq('status_relationships.relationship_type', 'has_workflow_status')
      .eq('status_relationships.relationship_data->is_active', 'true')
      .single()

    const currentStatus = updatedAppointment?.status_relationships?.[0]?.to_entity

    return NextResponse.json({ 
      success: true, 
      appointment: {
        ...updatedAppointment,
        currentStatus: currentStatus?.entity_name,
        statusCode: currentStatus?.entity_code
      }
    })
  } catch (error) {
    console.error('Error in appointments PUT:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const organizationId = searchParams.get('organization_id') || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
    const userId = searchParams.get('user_id')
    const reason = searchParams.get('reason') || 'Cancelled by user'

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Appointment ID required' 
      }, { status: 400 })
    }

    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Organization ID required' 
      }, { status: 400 })
    }

    const workflow = new UniversalWorkflow(organizationId)

    // Find CANCELLED status
    const { data: cancelledStatus } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', 'STATUS-APPOINTMENT-CANCELLED')
      .single()

    if (cancelledStatus) {
      // Transition to cancelled status
      await workflow.transitionStatus(id, cancelledStatus.id, {
        userId: userId || 'system',
        reason: reason
      })

      // Update metadata with cancellation info
      await supabase
        .from('universal_transactions')
        .update({
          status: 'inactive',
          metadata: {
            cancelled_at: new Date().toISOString(),
            cancelled_by: userId || 'system',
            cancellation_reason: reason
          }
        })
        .eq('id', id)

      console.log(`Cancelled appointment ${id} with workflow transition`)
    } else {
      // Fallback if no workflow status found
      await supabase
        .from('universal_transactions')
        .update({
          status: 'inactive',
          metadata: {
            cancelled_at: new Date().toISOString(),
            status: 'cancelled'
          }
        })
        .eq('id', id)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Appointment cancelled successfully with workflow update'
    })
  } catch (error) {
    console.error('Error in appointments DELETE:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}