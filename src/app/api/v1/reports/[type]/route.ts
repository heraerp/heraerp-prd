import { NextRequest, NextResponse } from 'next/server'
import { smartCodeReporting } from '@/src/lib/financial/smart-code-reporting'

/**
 * GET /api/v1/reports/:type
 * Generate financial reports dynamically based on smart codes
 *
 * Example: GET /api/v1/reports/pl?period=2025-Q1&organization_id=org-123
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { type } = await params
    const reportType = type as 'pl' | 'balance_sheet' | 'cashflow' | 'trial_balance'
    const { searchParams } = new URL(request.url)

    const organizationId = searchParams.get('organization_id')
    const period = searchParams.get('period')
    const branchId = searchParams.get('branch_id')
    const currency = searchParams.get('currency') || 'USD'
    const includeDetails = searchParams.get('include_details') === 'true'
    const comparisonPeriod = searchParams.get('comparison_period')

    if (!organizationId || !period) {
      return NextResponse.json(
        { error: 'organization_id and period are required' },
        { status: 400 }
      )
    }

    // Validate report type
    const validTypes = ['pl', 'balance_sheet', 'cashflow', 'trial_balance']
    if (!validTypes.includes(reportType)) {
      return NextResponse.json(
        { error: `Invalid report type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const options = {
      branch_id: branchId,
      currency,
      include_details: includeDetails,
      comparison_period: comparisonPeriod
    }

    const report = await smartCodeReporting.generateReport(
      organizationId,
      reportType,
      period,
      options
    )

    // If comparison period is provided, generate comparative data
    let comparison = null
    if (comparisonPeriod) {
      const comparativeResult = await smartCodeReporting.generateComparativeReport(
        organizationId,
        reportType,
        [comparisonPeriod, period],
        options
      )
      comparison = comparativeResult.comparison
    }

    return NextResponse.json({
      success: true,
      report,
      comparison,
      metadata: {
        generated_at: new Date().toISOString(),
        report_type: reportType,
        period,
        organization_id: organizationId,
        branch_id: branchId
      }
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

/**
 * POST /api/v1/reports/:type
 * Store custom report configuration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params
    const reportType = type as 'pl' | 'balance_sheet' | 'cashflow' | 'trial_balance'
    const body = await request.json()
    const { organization_id, custom_config } = body

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    await smartCodeReporting.storeReportConfig(organization_id, reportType, custom_config)

    return NextResponse.json({
      success: true,
      message: `Custom configuration for ${reportType} report stored successfully`
    })
  } catch (error) {
    console.error('Error storing report config:', error)
    return NextResponse.json({ error: 'Failed to store report configuration' }, { status: 500 })
  }
}
