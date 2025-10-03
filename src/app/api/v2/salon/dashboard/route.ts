/**
 * HERA Salon: Secured Dashboard API
 *
 * Provides role-based dashboard data with comprehensive security enforcement
 * using the HERA security framework.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/security-middleware'
import type { SecurityContext } from '@/lib/security/database-context'

/**
 * GET /api/v2/salon/dashboard
 * Fetch salon dashboard data with role-based filtering
 */
async function handleGetSalonDashboard(req: NextRequest, context: SecurityContext) {
  try {
    const { searchParams } = new URL(req.url)
    const timeRange = searchParams.get('timeRange') || 'today'

    console.log('🎯 Salon Dashboard API called with context:', {
      userId: context.userId,
      orgId: context.orgId,
      role: context.role,
      authMode: context.authMode,
      timeRange
    })

    // Role-based permissions
    const canViewFinancials = ['owner', 'manager', 'accountant'].includes(context.role)
    const canViewAllStaff = ['owner', 'manager'].includes(context.role)
    const canViewCustomerDetails = ['owner', 'manager', 'receptionist'].includes(context.role)

    // Static demo data for testing authentication pipeline
    const dashboardData = {
      // Basic stats available to all authenticated users
      todayStats: {
        appointmentsTotal: 8,
        appointmentsCompleted: 5,
        appointmentsPending: 3,
        staffOnDuty: 4
      },

      // Static appointment data for testing
      appointments: [
        {
          id: 'apt-1',
          client: 'Sarah Johnson',
          service: 'Hair Cut & Style',
          time: '10:00 AM',
          stylist: 'Michele',
          duration: '60 min',
          status: 'completed',
          price: canViewFinancials ? 150 : null
        },
        {
          id: 'apt-2',
          client: 'Emma Wilson',
          service: 'Hair Color',
          time: '2:00 PM',
          stylist: 'Michele',
          duration: '120 min',
          status: 'confirmed',
          price: canViewFinancials ? 250 : null
        }
      ],

      // Customer data (role-based access)
      customers: canViewCustomerDetails
        ? [
            {
              id: 'cust-1',
              name: 'Sarah Johnson',
              lastVisit: '2025-10-01',
              totalSpent: canViewFinancials ? 1200 : null,
              visits: 8,
              favorite: 'Hair Cut & Style'
            }
          ]
        : [],

      // Staff data (role-based access)
      staff: canViewAllStaff
        ? [
            {
              id: 'staff-1',
              name: 'Michele',
              role: 'Owner/Stylist',
              status: 'active',
              todayAppointments: 6
            }
          ]
        : [],

      // Services data (available to all)
      services: [
        { id: 'svc-1', entity_name: 'Hair Cut & Style', metadata: { price: 150 } },
        { id: 'svc-2', entity_name: 'Hair Color', metadata: { price: 250 } }
      ],

      // Financial data (restricted access)
      financials: canViewFinancials
        ? {
            todayRevenue: 850,
            avgTicket: 170,
            totalRevenue: 25000
          }
        : null,

      // Context information
      userContext: {
        role: context.role,
        permissions: {
          canViewFinancials,
          canViewAllStaff,
          canViewCustomerDetails
        },
        organization: {
          id: context.orgId,
          name: 'HairTalkz Salon'
        }
      },

      // Metadata
      generatedAt: new Date().toISOString(),
      timeRange,
      demoMode: true
    }

    console.log('✅ Dashboard data generated successfully for role:', context.role)

    return NextResponse.json({
      success: true,
      data: dashboardData
    })
  } catch (error) {
    console.error('Salon dashboard API error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch salon dashboard data',
        code: 'DASHBOARD_FETCH_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v2/salon/dashboard/action
 * Handle dashboard actions with role-based authorization
 */
async function handlePostSalonDashboard(req: NextRequest, context: SecurityContext) {
  try {
    const body = await req.json()
    const { action, data } = body

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // Role-based action permissions
    const actionPermissions = {
      quick_checkin: ['owner', 'manager', 'receptionist'],
      mark_completed: ['owner', 'manager', 'receptionist', 'stylist'],
      add_note: ['owner', 'manager', 'receptionist', 'stylist'],
      cancel_appointment: ['owner', 'manager', 'receptionist'],
      reschedule: ['owner', 'manager', 'receptionist'],
      update_status: ['owner', 'manager'],
      export_data: ['owner', 'manager', 'accountant']
    }

    const allowedRoles = actionPermissions[action]
    if (!allowedRoles || !allowedRoles.includes(context.role)) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions for this action',
          code: 'ACTION_FORBIDDEN',
          required_roles: allowedRoles
        },
        { status: 403 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let result = null

    // Handle different actions
    switch (action) {
      case 'quick_checkin':
        if (!data.appointmentId) {
          throw new Error('Appointment ID is required for check-in')
        }

        // Update appointment status
        const { data: updatedAppointment, error: updateError } = await supabase
          .from('universal_transactions')
          .update({
            metadata: {
              ...data.metadata,
              status: 'checked_in',
              checked_in_at: new Date().toISOString(),
              checked_in_by: context.userId
            }
          })
          .eq('id', data.appointmentId)
          .eq('organization_id', context.orgId)
          .select()
          .single()

        if (updateError) throw updateError
        result = { appointment: updatedAppointment }
        break

      case 'mark_completed':
        if (!data.appointmentId) {
          throw new Error('Appointment ID is required')
        }

        const { data: completedAppointment, error: completeError } = await supabase
          .from('universal_transactions')
          .update({
            metadata: {
              ...data.metadata,
              status: 'completed',
              completed_at: new Date().toISOString(),
              completed_by: context.userId
            }
          })
          .eq('id', data.appointmentId)
          .eq('organization_id', context.orgId)
          .select()
          .single()

        if (completeError) throw completeError
        result = { appointment: completedAppointment }
        break

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Salon dashboard action error:', error)

    return NextResponse.json(
      {
        error: 'Failed to execute dashboard action',
        code: 'ACTION_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Apply security middleware with salon-specific role requirements
export const GET = withSecurity(handleGetSalonDashboard, {
  allowedRoles: ['owner', 'admin', 'manager', 'user'], // Map to salon roles internally
  enableAuditLogging: true,
  enableRateLimit: true
})

export const POST = withSecurity(handlePostSalonDashboard, {
  allowedRoles: ['owner', 'admin', 'manager', 'user'],
  enableAuditLogging: true,
  enableRateLimit: true
})
