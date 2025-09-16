'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getHeraAPI } from '@/src/lib/hera-api'

/**
 * HERA Financial Module - Accounting Periods API
 * Smart Code: HERA.FIN.GL.ENT.PERIOD.v1
 *
 * Manages fiscal years, quarters, months, and custom periods
 * Integrates with existing Mario demo setup
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const fiscalYear = searchParams.get('fiscal_year')
    const periodType = searchParams.get('period_type') // year, quarter, month, custom
    const status = searchParams.get('status') // open, closed, locked

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const heraApi = getHeraAPI()

    // Get accounting periods using universal patterns
    const periods = await heraApi.getEntities('accounting_period')

    // Format periods with financial-specific data
    const formattedPeriods = periods.map(period => ({
      ...period,
      smart_code: 'HERA.FIN.GL.ENT.PERIOD.v1',
      period_id: period.entity_code,
      period_name: period.entity_name,
      fiscal_year: period.fiscal_year || new Date().getFullYear(),
      period_type: period.period_type || 'month',
      period_number: period.period_number || 1,
      start_date: period.start_date,
      end_date: period.end_date,
      status: period.period_status || 'open',
      is_adjusting_period: period.is_adjusting_period || false,
      budget_period: period.budget_period || false,
      created_at: period.created_at,
      closed_by: period.closed_by || null,
      closed_date: period.closed_date || null
    }))

    // Calculate period statistics
    const currentPeriod = formattedPeriods.find(p => {
      const now = new Date()
      const start = new Date(p.start_date)
      const end = new Date(p.end_date)
      return now >= start && now <= end
    })

    return NextResponse.json({
      success: true,
      data: formattedPeriods,
      smart_code: 'HERA.FIN.GL.ENT.PERIOD.v1',
      period_summary: {
        total_periods: formattedPeriods.length,
        current_period: currentPeriod?.period_name || 'No active period',
        fiscal_year: fiscalYear || new Date().getFullYear(),
        by_status: {
          open: formattedPeriods.filter(p => p.status === 'open').length,
          closed: formattedPeriods.filter(p => p.status === 'closed').length,
          locked: formattedPeriods.filter(p => p.status === 'locked').length
        },
        by_type: {
          months: formattedPeriods.filter(p => p.period_type === 'month').length,
          quarters: formattedPeriods.filter(p => p.period_type === 'quarter').length,
          years: formattedPeriods.filter(p => p.period_type === 'year').length
        }
      },
      mario_demo_ready: true,
      hera_advantages: {
        period_setup_time: '< 30ms vs SAP 5-10 minutes',
        flexibility: 'Custom period types supported',
        real_time_status: 'Live period status tracking'
      }
    })
  } catch (error) {
    console.error('Accounting Periods API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve accounting periods',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, period_data, setup_type = 'create_period' } = body

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const heraApi = getHeraAPI()

    if (setup_type === 'setup_fiscal_year') {
      // Create complete fiscal year with all periods
      const { fiscal_year, start_date, period_type = 'month' } = period_data
      const fiscalStart = new Date(start_date)
      const periods = []

      if (period_type === 'month') {
        // Create 12 monthly periods + 1 adjusting period
        for (let i = 0; i < 13; i++) {
          const periodStart = new Date(fiscalStart)
          periodStart.setMonth(fiscalStart.getMonth() + i)

          const periodEnd = new Date(periodStart)
          if (i < 12) {
            periodEnd.setMonth(periodStart.getMonth() + 1)
            periodEnd.setDate(0) // Last day of month
          } else {
            // Adjusting period - same as last month
            periodEnd.setMonth(periodStart.getMonth())
            periodEnd.setDate(periodStart.getDate())
          }

          const period = await heraApi.createEntity({
            organization_id,
            entity_type: 'accounting_period',
            entity_name:
              i < 12 ? `Period ${i + 1} - ${fiscal_year}` : `Adjusting Period - ${fiscal_year}`,
            entity_code: `${fiscal_year}-${String(i + 1).padStart(2, '0')}`,
            smart_code: 'HERA.FIN.GL.ENT.PERIOD.v1',
            fiscal_year,
            period_type: 'month',
            period_number: i + 1,
            start_date: periodStart.toISOString().split('T')[0],
            end_date: periodEnd.toISOString().split('T')[0],
            period_status: 'open',
            is_adjusting_period: i === 12,
            budget_period: false
          })

          periods.push(period)
        }
      }

      return NextResponse.json({
        success: true,
        data: periods,
        message: `Fiscal year ${fiscal_year} setup completed`,
        smart_code: 'HERA.FIN.GL.ENT.PERIOD.v1',
        periods_created: periods.length,
        fiscal_year,
        mario_demo_compatible: true
      })
    }

    if (setup_type === 'create_period') {
      // Create individual period
      const newPeriod = await heraApi.createEntity({
        organization_id,
        entity_type: 'accounting_period',
        entity_name: period_data.period_name,
        entity_code: period_data.period_code,
        smart_code: 'HERA.FIN.GL.ENT.PERIOD.v1',
        fiscal_year: period_data.fiscal_year,
        period_type: period_data.period_type || 'month',
        period_number: period_data.period_number,
        start_date: period_data.start_date,
        end_date: period_data.end_date,
        period_status: 'open',
        is_adjusting_period: period_data.is_adjusting_period || false,
        budget_period: period_data.budget_period || false
      })

      return NextResponse.json({
        success: true,
        data: newPeriod,
        message: 'Accounting period created successfully',
        smart_code: 'HERA.FIN.GL.ENT.PERIOD.v1'
      })
    }

    return NextResponse.json(
      { error: 'Invalid setup_type. Use "setup_fiscal_year" or "create_period"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Accounting Periods creation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create accounting periods',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, period_id, action, user_id } = body

    if (!organization_id || !period_id) {
      return NextResponse.json(
        { error: 'organization_id and period_id are required' },
        { status: 400 }
      )
    }

    const heraApi = getHeraAPI()

    let updatedPeriod
    let message = ''

    switch (action) {
      case 'close_period':
        updatedPeriod = await heraApi.updateEntity(period_id, {
          organization_id,
          period_status: 'closed',
          closed_by: user_id,
          closed_date: new Date().toISOString()
        })
        message = 'Period closed successfully'
        break

      case 'reopen_period':
        updatedPeriod = await heraApi.updateEntity(period_id, {
          organization_id,
          period_status: 'open',
          closed_by: null,
          closed_date: null,
          reopened_by: user_id,
          reopened_date: new Date().toISOString()
        })
        message = 'Period reopened successfully'
        break

      case 'lock_period':
        updatedPeriod = await heraApi.updateEntity(period_id, {
          organization_id,
          period_status: 'locked',
          locked_by: user_id,
          locked_date: new Date().toISOString()
        })
        message = 'Period locked successfully'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "close_period", "reopen_period", or "lock_period"' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: updatedPeriod,
      message,
      smart_code: 'HERA.FIN.GL.ENT.PERIOD.v1',
      action_performed: action,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Accounting Periods update error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update period',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
