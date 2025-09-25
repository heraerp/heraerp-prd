import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CommKpis } from '@/types/communications'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const isDemoMode =
      request.nextUrl.pathname.includes('/civicflow') && !request.headers.get('X-Organization-Id')

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // In a real implementation, these would be calculated from actual data
    // For demo, returning mock KPIs
    const kpis: CommKpis = {
      outbound_today: 1234,
      inbound_today: 89,
      bounces_7d: 45,
      opt_outs_7d: 12,
      queue_size: 234,
      deliverability_percent: 96.5,
      campaigns_running: 3,
      campaigns_scheduled: 7,
      campaigns_completed_7d: 15,
      avg_open_rate_7d: 28.5
    }

    return NextResponse.json(kpis, {
      headers: {
        'X-Demo-Mode': isDemoMode ? 'true' : 'false'
      }
    })
  } catch (error) {
    console.error('Error fetching communication KPIs:', error)
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 })
  }
}
