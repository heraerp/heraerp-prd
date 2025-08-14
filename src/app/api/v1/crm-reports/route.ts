import { NextRequest, NextResponse } from 'next/server'

// CRM Reports API - Analytics and Dashboard Data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id') || 'demo_org'
    const reportType = searchParams.get('type') || 'dashboard'
    
    // Demo analytics data
    const salesData = {
      total_contacts: 156,
      total_customers: 47,
      total_prospects: 109,
      total_opportunities: 23,
      total_pipeline_value: 485000,
      weighted_pipeline: 267500,
      average_deal_size: 21087,
      conversion_rate: 0.68,
      pending_tasks: 12,
      overdue_tasks: 3,
      activities_this_month: 89,
      deals_closed_this_month: 8,
      revenue_this_month: 125000,
      revenue_last_month: 98000
    }

    const salesFunnel = [
      { stage: 'lead', count: 45, value: 225000, conversion_rate: 0.75 },
      { stage: 'qualified', count: 34, value: 187000, conversion_rate: 0.68 },
      { stage: 'discovery', count: 23, value: 142000, conversion_rate: 0.58 },
      { stage: 'proposal', count: 15, value: 98000, conversion_rate: 0.45 },
      { stage: 'negotiation', count: 12, value: 87000, conversion_rate: 0.78 },
      { stage: 'closed_won', count: 8, value: 67000, conversion_rate: 1.0 },
      { stage: 'closed_lost', count: 4, value: 0, conversion_rate: 0.0 }
    ]

    const topPerformers = [
      {
        name: 'John Smith',
        role: 'Senior Sales Rep',
        deals_closed: 12,
        revenue_generated: 185000,
        conversion_rate: 0.75,
        avg_deal_size: 15417
      },
      {
        name: 'Jane Doe',
        role: 'Sales Rep',
        deals_closed: 8,
        revenue_generated: 98000,
        conversion_rate: 0.62,
        avg_deal_size: 12250
      },
      {
        name: 'Mike Johnson',
        role: 'Junior Sales Rep',
        deals_closed: 5,
        revenue_generated: 45000,
        conversion_rate: 0.58,
        avg_deal_size: 9000
      }
    ]

    const leadSources = [
      { source: 'Website', count: 45, conversion_rate: 0.67, avg_value: 18500 },
      { source: 'Referrals', count: 32, conversion_rate: 0.78, avg_value: 25000 },
      { source: 'Trade Shows', count: 28, conversion_rate: 0.85, avg_value: 35000 },
      { source: 'Cold Outreach', count: 23, conversion_rate: 0.43, avg_value: 12000 },
      { source: 'Social Media', count: 18, conversion_rate: 0.52, avg_value: 8500 },
      { source: 'Partners', count: 10, conversion_rate: 0.90, avg_value: 45000 }
    ]

    const monthlyTrends = [
      { month: 'Aug 2023', contacts: 134, deals: 6, revenue: 78000 },
      { month: 'Sep 2023', contacts: 142, deals: 7, revenue: 89000 },
      { month: 'Oct 2023', contacts: 138, deals: 5, revenue: 67000 },
      { month: 'Nov 2023', contacts: 145, deals: 8, revenue: 98000 },
      { month: 'Dec 2023', contacts: 151, deals: 9, revenue: 112000 },
      { month: 'Jan 2024', contacts: 156, deals: 8, revenue: 125000 }
    ]

    const reportData = {
      dashboard: {
        summary: salesData,
        sales_funnel: salesFunnel,
        top_performers: topPerformers.slice(0, 3),
        recent_activity: {
          new_contacts_today: 3,
          tasks_completed_today: 7,
          meetings_scheduled: 5,
          proposals_sent: 2
        }
      },
      
      sales_performance: {
        summary: salesData,
        monthly_trends: monthlyTrends,
        top_performers: topPerformers,
        team_metrics: {
          total_team_members: 8,
          active_team_members: 7,
          avg_deals_per_rep: 6.8,
          team_conversion_rate: 0.68
        }
      },
      
      lead_analysis: {
        lead_sources: leadSources,
        conversion_funnel: salesFunnel,
        lead_quality_score: 7.8,
        time_to_conversion: {
          avg_days: 45,
          median_days: 38,
          fastest_conversion: 12,
          slowest_conversion: 120
        }
      },
      
      pipeline_forecast: {
        current_quarter: {
          target: 350000,
          actual: 267500,
          projected: 315000,
          confidence: 0.82
        },
        next_quarter: {
          target: 400000,
          projected: 285000,
          confidence: 0.65
        },
        monthly_breakdown: [
          { month: 'Feb 2024', target: 120000, projected: 98000 },
          { month: 'Mar 2024', target: 130000, projected: 117000 },
          { month: 'Apr 2024', projected: 95000 }
        ]
      }
    }

    const selectedReport = reportData[reportType] || reportData.dashboard

    return NextResponse.json({
      success: true,
      data: selectedReport,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      organization_id: organizationId,
      message: `${reportType.replace('_', ' ')} report generated successfully`
    })

  } catch (error) {
    console.error('CRM Reports API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, report_type, date_range, filters } = body

    if (!report_type) {
      return NextResponse.json(
        { success: false, message: 'Report type is required' },
        { status: 400 }
      )
    }

    // Generate custom report based on parameters
    const customReport = {
      id: Date.now(),
      entity_type: 'crm_report',
      entity_name: `Custom ${report_type} Report`,
      entity_code: `RPT-${Date.now().toString().slice(-6)}`,
      organization_id: organization_id || 'demo_org',
      status: 'generated',
      created_at: new Date().toISOString(),
      dynamic_fields: {
        report_type,
        date_range,
        filters,
        generated_by: 'System User',
        file_format: 'json',
        schedule: 'on_demand'
      }
    }

    return NextResponse.json({
      success: true,
      data: customReport,
      message: 'Custom report generated successfully'
    })

  } catch (error) {
    console.error('Generate custom report error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to generate custom report' },
      { status: 500 }
    )
  }
}