/**
 * Salon DNA API Route
 * Uses HERA DNA SDK with MCP for all operations
 * Smart Code: HERA.SALON.API.DNA.V1
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHybridSalonDNAClient } from '@/lib/salon/salon-dna-client-hybrid'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('org_id')
    const action = searchParams.get('action') || 'dashboard'

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization ID is required',
          smartCode: 'HERA.SALON.API.ERROR.MISSING_ORG.V1'
        },
        { status: 400 }
      )
    }

    // Create hybrid DNA client for this organization with proper baseUrl for server-side requests
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`
    const salonClient = createHybridSalonDNAClient(organizationId, baseUrl)

    switch (action) {
      case 'dashboard':
        const dashboardData = await salonClient.getDashboardData()
        return NextResponse.json({
          success: true,
          data: dashboardData,
          smartCode: 'HERA.SALON.API.DASHBOARD.SUCCESS.V1'
        })

      case 'customers':
        const customers = await salonClient.getCustomers()
        return NextResponse.json({
          success: true,
          data: customers,
          count: customers.length,
          smartCode: 'HERA.SALON.API.CUSTOMERS.SUCCESS.V1'
        })

      case 'appointments':
        const appointments = await salonClient.getTodayAppointments()
        return NextResponse.json({
          success: true,
          data: appointments,
          count: appointments.length,
          smartCode: 'HERA.SALON.API.APPOINTMENTS.SUCCESS.V1'
        })

      case 'staff':
        const staff = await salonClient.getStaffMembers()
        return NextResponse.json({
          success: true,
          data: staff,
          count: staff.length,
          smartCode: 'HERA.SALON.API.STAFF.SUCCESS.V1'
        })

      case 'services':
        const services = await salonClient.getServices()
        return NextResponse.json({
          success: true,
          data: services,
          count: services.length,
          smartCode: 'HERA.SALON.API.SERVICES.SUCCESS.V1'
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            smartCode: 'HERA.SALON.API.ERROR.UNKNOWN_ACTION.V1'
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Salon DNA API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        smartCode: 'HERA.SALON.API.ERROR.INTERNAL.V1'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, action, data } = body

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization ID is required',
          smartCode: 'HERA.SALON.API.ERROR.MISSING_ORG.V1'
        },
        { status: 400 }
      )
    }

    // Create hybrid DNA client for this organization with proper baseUrl for server-side requests
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`
    const salonClient = createHybridSalonDNAClient(organizationId, baseUrl)

    switch (action) {
      case 'create-appointment':
        const appointmentId = await salonClient.createAppointment(data)
        return NextResponse.json({
          success: true,
          data: { id: appointmentId },
          smartCode: 'HERA.SALON.API.APPOINTMENT.CREATED.V1'
        })

      case 'update-appointment-status':
        await salonClient.updateAppointmentStatus(data.appointmentId, data.status)
        return NextResponse.json({
          success: true,
          smartCode: 'HERA.SALON.API.APPOINTMENT.STATUS_UPDATED.V1'
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            smartCode: 'HERA.SALON.API.ERROR.UNKNOWN_ACTION.V1'
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Salon DNA API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        smartCode: 'HERA.SALON.API.ERROR.INTERNAL.V1'
      },
      { status: 500 }
    )
  }
}
