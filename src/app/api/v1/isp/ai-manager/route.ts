import { NextResponse } from 'next/server'

// Smart Code: HERA.ISP.AI.MANAGER.API.v1
// Minimal, deterministic AI-like responder for ISP domain without external dependencies

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const query: string = String(body?.query || '').toLowerCase()
    const organizationId = body?.organizationId || null
    const category = body?.context?.category || 'overview'

    const now = new Date().toISOString()

    // Simple keyword routing to craft deterministic responses
    let message =
      'I analyzed your ISP operations. Ask about revenue, uptime, churn, ARPU, or outages for focused insights.'
    let priority: 'high' | 'medium' | 'low' = 'medium'
    const metrics: any[] = []
    const insights: any[] = []
    const recommendations: any[] = []

    const pushMetric = (
      label: string,
      value: string | number,
      trend: 'up' | 'down' | 'stable' = 'stable',
      change?: number
    ) => metrics.push({ label, value, trend, change })

    const pushRec = (
      title: string,
      description: string,
      impact: 'high' | 'medium' | 'low' = 'medium'
    ) => recommendations.push({ title, description, impact })

    const pushInsight = (content: string, level: 'high' | 'medium' | 'low' = 'medium') =>
      insights.push({ content, priority: level, timestamp: now })

    if (query.includes('arpu')) {
      message = 'Average Revenue Per User (ARPU) grew 3.2% MoM to ₹928.'
      pushMetric('ARPU (current)', '₹928', 'up', 3.2)
      pushMetric('ARPU (last month)', '₹899')
      pushRec('Upsell 150 Mbps tier', 'Target top quartile users in Kochi and TVM regions.', 'high')
    }

    if (query.includes('churn')) {
      message = 'Churn rate is 2.1% this month, slightly above target (≤ 2%).'
      priority = 'high'
      pushMetric('Churn rate', 2.1, 'up', 0.3)
      pushRec(
        'Save offers for at-risk users',
        'Offer 10% discount or speed boost to users with >3 tickets in 60 days.',
        'high'
      )
      pushInsight('Rising churn in Kozhikode linked to outage cluster last week.', 'high')
    }

    if (query.includes('uptime') || query.includes('outage') || query.includes('downtime')) {
      message = 'Network uptime remains strong at 99.82%. Two minor outages detected this week.'
      pushMetric('Network uptime (30d)', '99.82%', 'stable')
      pushMetric('Open outages', 0)
      pushRec(
        'Proactive fiber maintenance',
        'Schedule preventive checks on trunk lines in Thiruvananthapuram region.',
        'medium'
      )
      pushInsight('Mean time to restore (MTTR) improved to 23 minutes (↓ 11%).', 'medium')
    }

    if (query.includes('revenue') || query.includes('growth') || query.includes('sales')) {
      message = 'Monthly revenue trend is healthy with 11.8% YoY growth.'
      pushMetric('Monthly revenue', '₹4.6 Cr', 'up', 2.4)
      pushMetric('YoY growth', '11.8%', 'up')
      pushRec('Expand SMB leased lines', 'High-margin pipeline in Kochi’s tech parks.', 'high')
    }

    if (metrics.length === 0 && insights.length === 0 && recommendations.length === 0) {
      // Overview default
      pushMetric('Active subscribers', 46210, 'up', 1.9)
      pushMetric('ARPU', '₹916', 'up', 1.4)
      pushMetric('Network uptime', '99.8%', 'stable')
      pushMetric('Churn rate', '2.3%', 'down', 0.2)
      pushRec(
        'Onboard agents in new wards',
        'Increase presence in underpenetrated panchayats.',
        'medium'
      )
    }

    return NextResponse.json({
      type: 'assistant',
      message,
      category,
      priority,
      actionable: true,
      metrics,
      recommendations,
      insights,
      visualData: { type: 'chart', data: { ts: now, series: [] } },
      smart_code: 'HERA.ISP.AI.MANAGER.API.v1',
      organizationId
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Failed to process AI query',
        details: err?.message || String(err)
      },
      { status: 500 }
    )
  }
}
