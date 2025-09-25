import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'
import type { OrgFundingRow } from '@/types/organizations'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const entityId = params.id
    const searchParams = request.nextUrl.searchParams
    const isDemo = isDemoMode(orgId)

    const status = searchParams.get('status')
    const program = searchParams.get('program')
    const year = searchParams.get('year')

    if (isDemo) {
      const mockGrants: OrgFundingRow[] = [
        {
          id: 'grant-1',
          grant_name: 'Community Health Initiative Grant',
          grant_code: 'CHI-2024-001',
          status: 'active',
          amount_requested: 150000,
          amount_awarded: 120000,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          program: 'Health & Wellness',
          case_id: 'case-123'
        },
        {
          id: 'grant-2',
          grant_name: 'Youth Education Support Fund',
          grant_code: 'YESF-2023-045',
          status: 'completed',
          amount_requested: 100000,
          amount_awarded: 100000,
          start_date: '2023-07-01',
          end_date: '2024-06-30',
          program: 'Education'
        },
        {
          id: 'grant-3',
          grant_name: 'Digital Literacy Program Grant',
          grant_code: 'DLP-2024-012',
          status: 'active',
          amount_requested: 250000,
          amount_awarded: 230000,
          start_date: '2024-03-01',
          end_date: '2025-02-28',
          program: 'Technology',
          case_id: 'case-456'
        }
      ]

      // Apply filters
      let filteredGrants = mockGrants
      if (status) {
        filteredGrants = filteredGrants.filter(g => g.status === status)
      }
      if (program) {
        filteredGrants = filteredGrants.filter(g => g.program === program)
      }
      if (year) {
        filteredGrants = filteredGrants.filter(g => {
          const grantYear = new Date(g.start_date || '').getFullYear()
          return grantYear === parseInt(year)
        })
      }

      const summary = {
        total_requested: filteredGrants.reduce((sum, g) => sum + (g.amount_requested || 0), 0),
        total_awarded: filteredGrants.reduce((sum, g) => sum + (g.amount_awarded || 0), 0),
        active_count: filteredGrants.filter(g => g.status === 'active').length,
        completed_count: filteredGrants.filter(g => g.status === 'completed').length,
        success_rate: 85 // Mock success rate
      }

      return NextResponse.json({
        data: filteredGrants,
        summary
      })
    }

    // Production: Fetch grant applications and awards related to this org
    const { data: grantEntities } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*)
      `
      )
      .in('entity_type', ['grant_application', 'grant_award'])
      .eq('organization_id', orgId)

    // Filter by organization relationship
    const grants: OrgFundingRow[] = []
    let totalRequested = 0
    let totalAwarded = 0

    for (const grant of grantEntities || []) {
      // Check if this grant is related to the organization
      const { data: orgRel } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('from_entity_id', grant.id)
        .eq('to_entity_id', entityId)
        .eq('relationship_type', 'grant_for_org')
        .eq('organization_id', orgId)
        .single()

      if (!orgRel) continue

      // Parse dynamic data
      const dynamicData: any = {}
      grant.core_dynamic_data?.forEach((field: any) => {
        const value = field.field_value_text || field.field_value_number || field.field_value_json
        dynamicData[field.field_name] = value
      })

      // Apply filters
      if (status && dynamicData.status !== status) continue
      if (program && dynamicData.program !== program) continue
      if (year && new Date(dynamicData.start_date || '').getFullYear() !== parseInt(year)) continue

      const fundingRow: OrgFundingRow = {
        id: grant.id,
        grant_name: grant.entity_name,
        grant_code: grant.entity_code,
        status: dynamicData.status || 'applied',
        amount_requested: dynamicData.amount_requested,
        amount_awarded: dynamicData.amount_awarded,
        start_date: dynamicData.start_date,
        end_date: dynamicData.end_date,
        program: dynamicData.program,
        case_id: dynamicData.case_id
      }

      grants.push(fundingRow)
      totalRequested += fundingRow.amount_requested || 0
      totalAwarded += fundingRow.amount_awarded || 0
    }

    const summary = {
      total_requested: totalRequested,
      total_awarded: totalAwarded,
      active_count: grants.filter(g => g.status === 'active').length,
      completed_count: grants.filter(g => g.status === 'completed').length,
      success_rate: totalRequested > 0 ? Math.round((totalAwarded / totalRequested) * 100) : 0
    }

    return NextResponse.json({
      data: grants,
      summary
    })
  } catch (error) {
    console.error('Error fetching funding data:', error)
    return NextResponse.json({ error: 'Failed to fetch funding data' }, { status: 500 })
  }
}
