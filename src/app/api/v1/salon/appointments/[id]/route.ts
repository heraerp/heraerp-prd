import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// GET single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params
    
    const { data: appointment, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('id', appointmentId)
      .eq('transaction_type', 'appointment')
      .single()
    
    if (error) {
      console.error('Error fetching appointment:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      appointment 
    })
  } catch (error) {
    console.error('Error in appointment GET:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// UPDATE appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params
    const body = await request.json()
    
    console.log('Updating appointment:', appointmentId, body)

    const {
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

    // Update the appointment
    const { data: appointment, error } = await supabase
      .from('universal_transactions')
      .update({
        transaction_date: date,
        total_amount: servicePrice || 0,
        metadata: {
          customer_name: clientName,
          customer_phone: clientPhone,
          customer_email: clientEmail,
          service_id: serviceId,
          service_name: serviceName,
          stylist_id: stylistId,
          stylist_name: stylistName,
          appointment_time: time,
          duration: duration,
          notes: notes,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', appointmentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating appointment:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    // Update transaction line if it exists
    await supabase
      .from('universal_transaction_lines')
      .update({
        description: `${serviceName} with ${stylistName}`,
        unit_amount: servicePrice || 0,
        line_amount: servicePrice || 0,
        line_data: {
          service_id: serviceId,
          service_name: serviceName,
          stylist_id: stylistId,
          stylist_name: stylistName,
          duration: duration
        }
      })
      .eq('transaction_id', appointmentId)

    return NextResponse.json({ 
      success: true, 
      appointment,
      message: 'Appointment updated successfully'
    })
  } catch (error) {
    console.error('Error in appointment PUT:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// CANCEL appointment (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || 'Customer request'
    
    console.log('Cancelling appointment:', appointmentId, 'Reason:', reason)

    // Update appointment status to cancelled
    const { data: appointment, error } = await supabase
      .from('universal_transactions')
      .update({
        transaction_status: 'cancelled',
        metadata: supabase.sql`
          metadata || jsonb_build_object(
            'status', 'cancelled',
            'cancelled_at', '${new Date().toISOString()}',
            'cancellation_reason', '${reason}'
          )
        `
      })
      .eq('id', appointmentId)
      .select()
      .single()

    if (error) {
      console.error('Error cancelling appointment:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      appointment,
      message: 'Appointment cancelled successfully'
    })
  } catch (error) {
    console.error('Error in appointment DELETE:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// RESCHEDULE appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params
    const body = await request.json()
    const { date, time } = body
    
    console.log('Rescheduling appointment:', appointmentId, 'to', date, time)

    // Update appointment date and time only
    const { data: appointment, error } = await supabase
      .from('universal_transactions')
      .update({
        transaction_date: date,
        metadata: supabase.sql`
          metadata || jsonb_build_object(
            'appointment_time', '${time}',
            'rescheduled_at', '${new Date().toISOString()}',
            'status', 'rescheduled'
          )
        `
      })
      .eq('id', appointmentId)
      .select()
      .single()

    if (error) {
      console.error('Error rescheduling appointment:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      appointment,
      message: 'Appointment rescheduled successfully'
    })
  } catch (error) {
    console.error('Error in appointment PATCH:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}