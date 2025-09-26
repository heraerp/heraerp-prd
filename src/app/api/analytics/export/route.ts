import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Parser } from 'json2csv'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'

    // Parse filters
    const filters = {
      date_from:
        searchParams.get('date_from') ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      date_to: searchParams.get('date_to') || new Date().toISOString(),
      program_ids: searchParams.get('program_ids')?.split(','),
      channels: searchParams.get('channels')?.split(','),
      tags: searchParams.get('tags')?.split(','),
      segment: searchParams.get('segment')
    }

    // Fetch analytics data (reuse the same logic from panels route)
    const analyticsResponse = await fetch(`${request.nextUrl.origin}/api/analytics/panels`, {
      headers: { 'X-Organization-Id': orgId }
    })

    if (!analyticsResponse.ok) {
      throw new Error('Failed to fetch analytics data')
    }

    const analyticsData = await analyticsResponse.json()

    if (format === 'json') {
      return new NextResponse(JSON.stringify(analyticsData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="civicflow-analytics-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    }

    if (format === 'csv') {
      // Transform analytics data to flat structure for CSV
      const csvData = []

      // Deliverability metrics
      csvData.push({
        category: 'Deliverability',
        metric: 'Sent',
        value: analyticsData.deliverability.sent,
        rate: null,
        timestamp: new Date().toISOString()
      })
      csvData.push({
        category: 'Deliverability',
        metric: 'Delivered',
        value: analyticsData.deliverability.delivered,
        rate: analyticsData.deliverability.delivery_rate,
        timestamp: new Date().toISOString()
      })
      csvData.push({
        category: 'Deliverability',
        metric: 'Opened',
        value: analyticsData.deliverability.opened,
        rate: analyticsData.deliverability.open_rate,
        timestamp: new Date().toISOString()
      })
      csvData.push({
        category: 'Deliverability',
        metric: 'Clicked',
        value: analyticsData.deliverability.clicked,
        rate: analyticsData.deliverability.click_rate,
        timestamp: new Date().toISOString()
      })

      // Engagement funnel
      analyticsData.engagement_funnel.stages.forEach((stage: any) => {
        csvData.push({
          category: 'Engagement Funnel',
          metric: stage.stage_name,
          value: stage.count,
          rate: stage.conversion_rate,
          timestamp: new Date().toISOString()
        })
      })

      // Event attendance
      csvData.push({
        category: 'Events',
        metric: 'Total Events',
        value: analyticsData.event_attendance.total_events,
        rate: null,
        timestamp: new Date().toISOString()
      })
      csvData.push({
        category: 'Events',
        metric: 'Total Attended',
        value: analyticsData.event_attendance.total_attended,
        rate: analyticsData.event_attendance.attendance_rate,
        timestamp: new Date().toISOString()
      })

      // KPI contribution
      analyticsData.kpi_contribution.kpis.forEach((kpi: any) => {
        csvData.push({
          category: 'KPI',
          metric: kpi.kpi_name,
          value: kpi.current_value,
          rate: kpi.achievement_rate,
          timestamp: new Date().toISOString()
        })
      })

      const parser = new Parser({
        fields: ['category', 'metric', 'value', 'rate', 'timestamp']
      })
      const csv = parser.parse(csvData)

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="civicflow-analytics-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    if (format === 'pdf') {
      // For PDF, would need to implement proper PDF generation
      // For now, return a formatted text summary
      let content = 'CivicFlow Analytics Report\n'
      content += `Generated: ${new Date().toISOString()}\n`
      content += `Organization: ${orgId}\n\n`

      content += 'DELIVERABILITY METRICS\n'
      content += `- Sent: ${analyticsData.deliverability.sent}\n`
      content += `- Delivered: ${analyticsData.deliverability.delivered} (${analyticsData.deliverability.delivery_rate}%)\n`
      content += `- Opened: ${analyticsData.deliverability.opened} (${analyticsData.deliverability.open_rate}%)\n`
      content += `- Clicked: ${analyticsData.deliverability.clicked} (${analyticsData.deliverability.click_rate}%)\n\n`

      content += 'ENGAGEMENT FUNNEL\n'
      analyticsData.engagement_funnel.stages.forEach((stage: any) => {
        content += `- ${stage.stage_name}: ${stage.count} (${stage.percentage}%)\n`
      })
      content += '\n'

      content += 'EVENT ATTENDANCE\n'
      content += `- Total Events: ${analyticsData.event_attendance.total_events}\n`
      content += `- Total Attended: ${analyticsData.event_attendance.total_attended}\n`
      content += `- Attendance Rate: ${analyticsData.event_attendance.attendance_rate}%\n\n`

      content += 'KPI PERFORMANCE\n'
      analyticsData.kpi_contribution.kpis.forEach((kpi: any) => {
        content += `- ${kpi.kpi_name}: ${kpi.current_value}/${kpi.target_value} (${kpi.achievement_rate}%)\n`
      })

      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="civicflow-analytics-${new Date().toISOString().split('T')[0]}.txt"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid export format' }, { status: 400 })
  } catch (error) {
    console.error('Error exporting analytics:', error)
    return NextResponse.json({ error: 'Failed to export analytics' }, { status: 500 })
  }
}
