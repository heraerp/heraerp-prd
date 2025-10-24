import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createIntegratedAppointment } from '@/lib/salon/integrated-appointment-booking'
import { ServerWorkflow } from '@/lib/salon/server-workflow'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId =
      searchParams.get('organization_id') || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const branchId = searchParams.get('branch_id')

    // Build base query
    let query = supabase
      .from('universal_transactions')
      .select(
        `
        *,
        client:source_entity_id(id, entity_name, entity_type),
        stylist:target_entity_id(id, entity_name, entity_type)
      `
      )
      .eq('organization_id', organizationId as string)
      .eq('transaction_type', 'APPOINTMENT')

    // Optional branch filter
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    // Date filters: prefer range if provided, otherwise single day
    if (dateFrom && dateTo) {
      query = query
        .gte('transaction_date', `${dateFrom}T00:00:00.000Z`)
        .lte('transaction_date', `${dateTo}T23:59:59.999Z`)
    } else {
      query = query
        .gte('transaction_date', `${date}T00:00:00.000Z`)
        .lte('transaction_date', `${date}T23:59:59.999Z`)
    }

    // Execute
    const { data: appointments, error } = await query.order('transaction_date')

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Transform appointments to include proper entity data
    const transformedAppointments =
      appointments?.map(apt => {
        // Get client contact info from dynamic data if needed
        return {
          id: apt.id,
          clientId: apt.client?.id,
          clientName:
            apt.client?.entity_name || (apt.metadata as any)?.customer_name || 'Unknown Client',
          clientPhone: (apt.metadata as any)?.customer_phone || '',
          clientEmail: (apt.metadata as any)?.customer_email || '',
          service: (apt.metadata as any)?.service_name || 'Service',
          stylistId: apt.stylist?.id,
          stylist: apt.stylist?.entity_name || (apt.metadata as any)?.stylist_name || 'Staff',
          date: apt.transaction_date,
          time: (apt.metadata as any)?.appointment_time || '10:00 AM',
          duration: (apt.metadata as any)?.duration || '60 min',
          price: apt.total_amount || 0,
          status: (apt.metadata as any)?.status || 'confirmed',
          statusCode: '',
          notes: (apt.metadata as any)?.notes || ''
        }
      }) || []

    return NextResponse.json({
      success: true,
      appointments: transformedAppointments
    })
  } catch (error) {
    console.error('Error in appointments GET:', error)
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

    const orgId =
      organizationId ||
      process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID ||
      '550e8400-e29b-41d4-a716-446655440000'

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
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to create appointment'
        },
        { status: 500 }
      )
    }

    // Get the full appointment with relationships for the response
    const { data: fullAppointment } = await supabase
      .from('universal_transactions')
      .select(
        `
        *,
        client:source_entity_id(id, entity_name),
        stylist:target_entity_id(id, entity_name)
      `
      )
      .eq('id', result.appointmentId)
      .single()

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
        status: 'Scheduled',
        statusCode: 'STATUS-APPOINTMENT-SCHEDULED',
        message: result.message
      }
    })
  } catch (error) {
    console.error('Error in appointments POST:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, organizationId, userId, ...updates } = body

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization ID required'
        },
        { status: 400 }
      )
    }

    const workflow = new ServerWorkflow(organizationId)

    // If status change requested, update appointment status directly
    if (status) {
      // First get the current appointment to preserve existing metadata
      const { data: currentAppointment } = await supabase
        .from('universal_transactions')
        .select('metadata')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single()

      // Update the appointment status in metadata for compatibility with kanban
      const { error: updateError } = await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            ...currentAppointment?.metadata, // Preserve existing metadata
            status: status.toUpperCase(), // Store in uppercase for kanban compatibility
            updated_at: new Date().toISOString(),
            updated_by: userId || 'system'
          }
        })
        .eq('id', id)
        .eq('organization_id', organizationId)

      if (updateError) {
        console.error('Error updating appointment status:', updateError)
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to update appointment status'
          },
          { status: 500 }
        )
      }

      // Also try the workflow transition if the status entities exist
      try {
        const statusMap: Record<string, string> = {
          draft: 'STATUS-APPOINTMENT-DRAFT',
          booked: 'STATUS-APPOINTMENT-BOOKED',
          scheduled: 'STATUS-APPOINTMENT-SCHEDULED',
          checked_in: 'STATUS-APPOINTMENT-CHECKED_IN',
          in_service: 'STATUS-APPOINTMENT-IN_SERVICE',
          to_pay: 'STATUS-APPOINTMENT-TO_PAY',
          review: 'STATUS-APPOINTMENT-REVIEW',
          done: 'STATUS-APPOINTMENT-DONE',
          completed: 'STATUS-APPOINTMENT-COMPLETED',
          no_show: 'STATUS-APPOINTMENT-NO_SHOW',
          cancelled: 'STATUS-APPOINTMENT-CANCELLED'
        }

        const targetStatusCode = statusMap[status.toLowerCase()]
        if (targetStatusCode) {
          const { data: targetStatus } = await supabase
            .from('core_entities')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('entity_type', 'workflow_status')
            .eq('entity_code', targetStatusCode)
            .single()

          if (targetStatus) {
            await workflow.transitionStatus(id, targetStatus.id, {
              userId: userId || 'system',
              reason: updates.reason || 'Status updated'
            })
          }
        }
      } catch (workflowError) {
        // Workflow update failed, but main status update succeeded
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
      .select(
        `
        *,
        client:source_entity_id(id, entity_name),
        stylist:target_entity_id(id, entity_name)
      `
      )
      .eq('id', id)
      .single()

    return NextResponse.json({
      success: true,
      appointment: {
        ...updatedAppointment,
        currentStatus: status || 'updated',
        statusCode: ''
      }
    })
  } catch (error) {
    console.error('Error in appointments PUT:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const organizationId =
      searchParams.get('organization_id') || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
    const userId = searchParams.get('user_id')
    const reason = searchParams.get('reason') || 'Cancelled by user'

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Appointment ID required'
        },
        { status: 400 }
      )
    }

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization ID required'
        },
        { status: 400 }
      )
    }

    const workflow = new ServerWorkflow(organizationId)

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
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
