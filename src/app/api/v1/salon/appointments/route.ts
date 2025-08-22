import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id') || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    // Fetch appointments for the organization
    const { data: appointments, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'appointment')
      .gte('transaction_date', date)
      .lte('transaction_date', date + 'T23:59:59')
      .order('transaction_date')
    
    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Transform appointments to include metadata
    const transformedAppointments = appointments?.map(apt => ({
      id: apt.id,
      clientName: apt.metadata?.customer_name || 'Unknown Client',
      clientPhone: apt.metadata?.customer_phone || '',
      clientEmail: apt.metadata?.customer_email || '',
      service: apt.metadata?.service_name || 'Service',
      stylist: apt.metadata?.stylist_name || 'Staff',
      date: apt.transaction_date,
      time: apt.metadata?.appointment_time || '10:00 AM',
      duration: apt.metadata?.duration || '60 min',
      price: apt.total_amount || 0,
      status: apt.metadata?.status || 'confirmed',
      notes: apt.metadata?.notes || ''
    })) || []

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

    const orgId = organizationId || '550e8400-e29b-41d4-a716-446655440000'
    console.log('Using organization ID:', orgId)

    // Create appointment transaction
    const { data: appointment, error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: orgId,
        transaction_type: 'appointment',
        transaction_code: `APT-${Date.now()}`,
        transaction_date: date,
        total_amount: servicePrice || 0,
        transaction_status: 'confirmed',
        transaction_currency_code: 'AED',  // Now we can use the currency column!
        base_currency_code: 'AED',
        exchange_rate: 1.0,
        exchange_rate_date: new Date().toISOString().split('T')[0],
        exchange_rate_type: 'SPOT',
        smart_code: 'HERA.SALON.APT.BOOKING.v1',
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
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating appointment:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 500 })
    }

    console.log('Appointment created successfully:', appointment)

    // Create transaction line for the service
    if (appointment && appointment.id) {
      const { data: lineItem, error: lineError } = await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: orgId,
          transaction_id: appointment.id,
          line_number: 1,
          line_type: 'service',
          description: `${serviceName} with ${stylistName}`,
          quantity: 1,
          unit_amount: servicePrice || 0,
          line_amount: servicePrice || 0,
          smart_code: 'HERA.SALON.APT.LINE.SERVICE.v1',
          line_data: {
            service_id: serviceId,
            service_name: serviceName,
            stylist_id: stylistId,
            stylist_name: stylistName,
            duration: duration
          }
        })
        .select()
        .single()

      if (lineError) {
        console.error('Error creating line item:', lineError)
        // Don't fail the whole request if line item fails
      } else {
        console.log('Line item created:', lineItem)
      }
    }

    return NextResponse.json({ 
      success: true, 
      appointment: {
        id: appointment.id,
        clientName,
        service: serviceName,
        stylist: stylistName,
        date,
        time,
        status: 'confirmed'
      }
    })
  } catch (error) {
    console.error('Error in appointments POST:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, ...updates } = body

    const { data, error } = await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          ...updates,
          status: status || 'confirmed',
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating appointment:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      appointment: data 
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

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Appointment ID required' 
      }, { status: 400 })
    }

    // Soft delete by updating status
    const { error } = await supabase
      .from('universal_transactions')
      .update({
        status: 'inactive',
        metadata: {
          cancelled_at: new Date().toISOString(),
          status: 'cancelled'
        }
      })
      .eq('id', id)

    if (error) {
      console.error('Error deleting appointment:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Appointment cancelled successfully'
    })
  } catch (error) {
    console.error('Error in appointments DELETE:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}