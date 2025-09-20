import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api-v2'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const expand = searchParams.get('expand')?.split(',') || []
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    // Set organization context
    universalApi.setOrganizationId(organizationId)

    // Fetch appointment from universal_transactions
    const appointmentResult = await universalApi.read('universal_transactions', {
      id: params.id,
      organization_id: organizationId,
      smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.v1'
    })

    if (!appointmentResult.success || !appointmentResult.data?.length) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const appointmentTxn = appointmentResult.data[0]
    
    // Fetch appointment lines (services)
    const linesResult = await universalApi.read('universal_transaction_lines', {
      transaction_id: appointmentTxn.id,
      organization_id: organizationId
    })

    const lines = linesResult.data || []

    // Build response with expanded data
    const response: any = {
      appointment: {
        id: appointmentTxn.id,
        smart_code: appointmentTxn.smart_code || 'HERA.SALON.APPT.STANDARD.V1',
        organization_id: appointmentTxn.organization_id,
        code: appointmentTxn.transaction_code,
        status: appointmentTxn.metadata?.status || 'SCHEDULED',
        start_time: appointmentTxn.metadata?.start_time,
        end_time: appointmentTxn.metadata?.end_time,
        planned_services: []
      }
    }

    // Expand customer data
    if (expand.includes('customer') && appointmentTxn.from_entity_id) {
      const customerResult = await universalApi.read('core_entities', {
        id: appointmentTxn.from_entity_id,
        organization_id: organizationId
      })
      if (customerResult.data?.length) {
        const customer = customerResult.data[0]
        response.appointment.customer = {
          id: customer.id,
          name: customer.entity_name,
          code: customer.entity_code,
          phone: customer.metadata?.phone,
          email: customer.metadata?.email
        }
      }
    }

    // Expand staff data
    if (expand.includes('staff') && appointmentTxn.metadata?.stylist_id) {
      const staffResult = await universalApi.read('core_entities', {
        id: appointmentTxn.metadata.stylist_id,
        organization_id: organizationId,
        entity_type: 'employee'
      })
      if (staffResult.data?.length) {
        const staff = staffResult.data[0]
        response.appointment.staff = [{
          id: staff.id,
          name: staff.entity_name
        }]
      }
    }

    // Expand resources (chair/station)
    if (appointmentTxn.metadata?.chair_id) {
      response.appointment.resources = [{
        id: appointmentTxn.metadata.chair_id,
        slug: appointmentTxn.metadata.chair_slug || `chair-${appointmentTxn.metadata.chair_id}`
      }]
    }

    // Expand deposits
    if (expand.includes('deposits')) {
      // Check for deposit transactions linked to this appointment
      const depositResult = await universalApi.read('universal_transactions', {
        organization_id: organizationId,
        transaction_type: 'deposit',
        metadata: { appointment_id: appointmentTxn.id }
      })
      if (depositResult.data?.length) {
        response.appointment.deposits = depositResult.data.map(dep => ({
          id: dep.id,
          amount: dep.total_amount,
          currency: dep.currency || 'AED'
        }))
      }
    }

    // Expand packages
    if (expand.includes('packages') && appointmentTxn.metadata?.package_id) {
      const packageResult = await universalApi.read('core_entities', {
        id: appointmentTxn.metadata.package_id,
        organization_id: organizationId,
        entity_type: 'package'
      })
      if (packageResult.data?.length) {
        const pkg = packageResult.data[0]
        response.appointment.packages = [{
          id: pkg.id,
          name: pkg.entity_name,
          remaining_uses: pkg.metadata?.remaining_uses || 0
        }]
      }
    }

    // Map service lines to planned_services
    if (expand.includes('planned_services') && lines.length > 0) {
      response.appointment.planned_services = await Promise.all(
        lines.map(async (line) => {
          // Fetch service entity details
          let serviceName = 'Service'
          let duration = 30
          let staffSplit = [{ staff_id: appointmentTxn.metadata?.stylist_id, pct: 100 }]
          
          if (line.line_entity_id) {
            const serviceResult = await universalApi.read('core_entities', {
              id: line.line_entity_id,
              organization_id: organizationId
            })
            if (serviceResult.data?.length) {
              const service = serviceResult.data[0]
              serviceName = service.entity_name
              duration = service.metadata?.duration || 30
            }
          }

          // Check for staff split in line metadata
          if (line.metadata?.staff_split) {
            staffSplit = line.metadata.staff_split
          }

          return {
            appointment_line_id: line.id,
            entity_id: line.line_entity_id,
            name: line.metadata?.service_name || serviceName,
            duration_min: line.metadata?.duration || duration,
            price: line.unit_price || 0,
            assigned_staff: staffSplit
          }
        })
      )
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}