import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { GrantKpis } from '@/types/crm-grants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Demo organization fallback
const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

function getOrgId(request: NextRequest): string {
  return request.headers.get('X-Organization-Id') || DEMO_ORG_ID
}

// GET /api/crm/grants/kpis - Get grant KPI metrics
export async function GET(request: NextRequest) {
  try {
    const orgId = getOrgId(request)

    // Get all grant applications for this organization
    const { data: applications, error } = await supabase
      .from('core_entities')
      .select('status, metadata, created_at')
      .eq('organization_id', orgId)
      .eq('entity_type', 'grant_application')

    if (error) {
      console.error('Error fetching grant applications for KPIs:', error)
      return NextResponse.json({ error: 'Failed to fetch grant applications' }, { status: 500 })
    }

    // Get grant rounds count (active rounds)
    const { data: rounds } = await supabase
      .from('core_entities')
      .select('status')
      .eq('organization_id', orgId)
      .eq('entity_type', 'grant_round')
      .eq('status', 'active')

    const openRounds = rounds?.length || 0

    // Calculate metrics from applications
    const totalApplications = applications?.length || 0

    // Applications in review (submitted or in_review status)
    const inReview =
      applications?.filter(app => ['submitted', 'in_review'].includes(app.status || '')).length || 0

    // Calculate approval rate (approved + awarded vs total)
    const approvedCount =
      applications?.filter(app => ['approved', 'awarded'].includes(app.status || '')).length || 0
    const approvalRate = totalApplications > 0 ? approvedCount / totalApplications : 0

    // Calculate average award amount
    const awardedApplications =
      applications?.filter(app => {
        return (
          app.status === 'awarded' &&
          (app.metadata?.amount_awarded || app.metadata?.amount_awarded === 0)
        )
      }) || []

    const totalAwarded = awardedApplications.reduce((sum, app) => {
      return sum + (app.metadata?.amount_awarded || 0)
    }, 0)

    const avgAward = awardedApplications.length > 0 ? totalAwarded / awardedApplications.length : 0

    const kpis: GrantKpis = {
      open_rounds: openRounds,
      in_review: inReview,
      approval_rate: approvalRate,
      avg_award: avgAward,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(kpis)
  } catch (error) {
    console.error('Error calculating grant KPIs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
