import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get recent appointments
    const { data: appointments, error } = await supabase
      .from('core_entities')
      .select('id, entity_name, created_at, metadata')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'appointment')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Recent bookings error:', error)
      throw error
    }

    // Process appointments to extract information
    const processedAppointments = (appointments || []).map((appointment) => {
      // Parse entity_name which typically contains customer and service info
      const nameParts = appointment.entity_name.split(' - ')
      const customerName = nameParts[0] || 'Unknown Customer'
      const serviceName = nameParts[1] || 'Unknown Service'
      
      // Extract metadata if available
      const metadata = appointment.metadata || {}
      
      return {
        id: appointment.id,
        customerName,
        serviceName,
        staffName: metadata.stylist_name || 'Unassigned',
        date: metadata.appointment_date || appointment.created_at,
        time: '09:00', // Default time
        duration: metadata.duration_minutes || 60,
        status: metadata.status || 'scheduled',
        price: metadata.price || 0
      }
    })

    return NextResponse.json({
      success: true,
      data: processedAppointments
    })
  } catch (error) {
    console.error('Recent bookings API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent bookings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}