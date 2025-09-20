import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type {
  GrantKpis,
  PaginatedGrants,
  GrantApplicationListItem,
  GrantApplicationDetail,
  CreateGrantRequest,
  GrantFilters,
  ExportGrantsRequest
} from '@/types/crm-grants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Demo organization fallback
const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

function getOrgId(request: NextRequest): string {
  return request.headers.get('X-Organization-Id') || DEMO_ORG_ID
}

// GET /api/crm/grants - List grant applications
// GET /api/crm/grants/kpis - Get KPI metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = getOrgId(request)

    // Handle KPI requests
    if (request.url.includes('/kpis')) {
      return getGrantKpis(orgId)
    }

    // Parse filters
    const filters: GrantFilters = {
      q: searchParams.get('q') || undefined,
      status: searchParams
        .get('status')
        ?.split(',')
        .filter(s => s) as any,
      round_id: searchParams.get('round_id') || undefined,
      program_id: searchParams.get('program_id') || undefined,
      amount_min: searchParams.get('amount_min')
        ? Number(searchParams.get('amount_min'))
        : undefined,
      amount_max: searchParams.get('amount_max')
        ? Number(searchParams.get('amount_max'))
        : undefined,
      tags:
        searchParams
          .get('tags')
          ?.split(',')
          .filter(t => t.trim()) || undefined,
      page: Number(searchParams.get('page')) || 1,
      page_size: Number(searchParams.get('page_size')) || 20
    }

    return getGrantApplications(orgId, filters)
  } catch (error) {
    console.error('Error in grants GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/crm/grants - Create grant application
export async function POST(request: NextRequest) {
  try {
    const orgId = getOrgId(request)
    const body: CreateGrantRequest = await request.json()

    // Generate smart code for grant application
    const smartCode = `HERA.CIVICFLOW.GRANTS.APPLICATION.${body.applicant.type.toUpperCase()}.v1`
    const entityCode = `GRANT-${Date.now()}`

    // Create grant application entity
    const { data: applicationEntity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'grant_application',
        entity_name: `Grant Application - ${entityCode}`,
        entity_code: entityCode,
        smart_code: smartCode,
        status: 'draft',
        metadata: {
          applicant_type: body.applicant.type,
          applicant_id: body.applicant.id,
          round_id: body.round_id,
          summary: body.summary,
          amount_requested: body.amount_requested,
          tags: body.tags,
          start_run: body.start_run,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (entityError) {
      console.error('Error creating grant application entity:', entityError)
      return NextResponse.json({ error: 'Failed to create grant application' }, { status: 500 })
    }

    // Store dynamic fields for searchability
    if (body.summary) {
      await supabase.from('core_dynamic_data').insert({
        organization_id: orgId,
        entity_id: applicationEntity.id,
        field_name: 'summary',
        field_value_text: body.summary,
        smart_code: `${smartCode}.SUMMARY`
      })
    }

    if (body.amount_requested) {
      await supabase.from('core_dynamic_data').insert({
        organization_id: orgId,
        entity_id: applicationEntity.id,
        field_name: 'amount_requested',
        field_value_number: body.amount_requested,
        smart_code: `${smartCode}.AMOUNT_REQUESTED`
      })
    }

    if (body.tags && body.tags.length > 0) {
      for (const tag of body.tags) {
        await supabase.from('core_dynamic_data').insert({
          organization_id: orgId,
          entity_id: applicationEntity.id,
          field_name: 'tag',
          field_value_text: tag,
          smart_code: `${smartCode}.TAG`
        })
      }
    }

    // Create relationships for applicant and round
    await supabase.from('core_relationships').insert([
      {
        organization_id: orgId,
        from_entity_id: applicationEntity.id,
        to_entity_id: body.applicant.id,
        relationship_type: 'has_applicant',
        smart_code: `${smartCode}.APPLICANT_RELATIONSHIP`
      },
      {
        organization_id: orgId,
        from_entity_id: applicationEntity.id,
        to_entity_id: body.round_id,
        relationship_type: 'belongs_to_round',
        smart_code: `${smartCode}.ROUND_RELATIONSHIP`
      }
    ])

    // Log creation transaction
    await supabase.from('universal_transactions').insert({
      organization_id: orgId,
      transaction_type: 'grant_application_created',
      transaction_code: `GRANT-CREATE-${Date.now()}`,
      smart_code: `${smartCode}.CREATION`,
      subject_entity_id: applicationEntity.id,
      total_amount: body.amount_requested || 0,
      metadata: {
        action: 'created',
        applicant_type: body.applicant.type,
        applicant_id: body.applicant.id,
        round_id: body.round_id
      }
    })

    // Return the created application
    const application: GrantApplicationDetail = {
      id: applicationEntity.id,
      applicant: {
        id: body.applicant.id,
        type: body.applicant.type,
        name: `${body.applicant.type} - ${body.applicant.id}` // Would normally fetch from entity
      },
      round: {
        id: body.round_id,
        round_code: `ROUND-${body.round_id}` // Would normally fetch from entity
      },
      program: {
        id: 'program-id', // Would normally fetch from round relationship
        title: 'Program Title',
        code: 'PROG-CODE'
      },
      status: 'draft',
      amount_requested: body.amount_requested,
      summary: body.summary,
      tags: body.tags,
      smart_code: smartCode,
      created_at: applicationEntity.created_at
    }

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error('Error in grants POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getGrantKpis(orgId: string): Promise<NextResponse> {
  try {
    // Get grants count by status
    const { data: statusCounts } = await supabase
      .from('core_entities')
      .select('status, metadata')
      .eq('organization_id', orgId)
      .eq('entity_type', 'grant_application')

    // Calculate KPIs
    const totalApplications = statusCounts?.length || 0
    const openRounds = 3 // Would calculate from active grant rounds
    const inReview =
      statusCounts?.filter(app => ['submitted', 'in_review'].includes(app.status || '')).length || 0

    const approvedCount =
      statusCounts?.filter(app => ['approved', 'awarded'].includes(app.status || '')).length || 0
    const approvalRate = totalApplications > 0 ? approvedCount / totalApplications : 0

    // Calculate average award from metadata
    const awardedApplications =
      statusCounts?.filter(app => app.status === 'awarded' && app.metadata?.amount_awarded) || []
    const totalAwarded = awardedApplications.reduce(
      (sum, app) => sum + (app.metadata?.amount_awarded || 0),
      0
    )
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
    console.error('Error getting grant KPIs:', error)
    return NextResponse.json({ error: 'Failed to fetch grant KPIs' }, { status: 500 })
  }
}

async function getGrantApplications(orgId: string, filters: GrantFilters): Promise<NextResponse> {
  try {
    let query = supabase
      .from('core_entities')
      .select(
        `
        id,
        entity_name,
        entity_code,
        status,
        smart_code,
        created_at,
        metadata
      `
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'grant_application')

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    // Apply search filter
    if (filters.q) {
      query = query.or(`entity_name.ilike.%${filters.q}%,entity_code.ilike.%${filters.q}%`)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('entity_type', 'grant_application')

    // Apply pagination
    const offset = (filters.page! - 1) * filters.page_size!
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + filters.page_size! - 1)

    const { data: entities, error } = await query

    if (error) {
      console.error('Error fetching grant applications:', error)
      return NextResponse.json({ error: 'Failed to fetch grant applications' }, { status: 500 })
    }

    // Transform entities to grant applications
    const applications: GrantApplicationListItem[] =
      entities?.map(entity => ({
        id: entity.id,
        applicant: {
          id: entity.metadata?.applicant_id || '',
          type: entity.metadata?.applicant_type || 'constituent',
          name:
            entity.metadata?.applicant_name ||
            `${entity.metadata?.applicant_type} - ${entity.metadata?.applicant_id}`
        },
        round: {
          id: entity.metadata?.round_id || '',
          round_code: entity.metadata?.round_code || `ROUND-${entity.metadata?.round_id}`
        },
        program: {
          id: entity.metadata?.program_id || 'program-id',
          title: entity.metadata?.program_title || 'Program Title',
          code: entity.metadata?.program_code || 'PROG-CODE'
        },
        status: (entity.status as any) || 'draft',
        amount_requested: entity.metadata?.amount_requested,
        amount_awarded: entity.metadata?.amount_awarded,
        score: entity.metadata?.score,
        last_action_at: entity.metadata?.last_action_at,
        smart_code: entity.smart_code,
        created_at: entity.created_at
      })) || []

    // Apply additional filters in JavaScript (for complex filtering)
    let filteredApplications = applications

    if (filters.round_id) {
      filteredApplications = filteredApplications.filter(app => app.round.id === filters.round_id)
    }

    if (filters.program_id) {
      filteredApplications = filteredApplications.filter(
        app => app.program.id === filters.program_id
      )
    }

    if (filters.amount_min !== undefined) {
      filteredApplications = filteredApplications.filter(
        app => app.amount_requested && app.amount_requested >= filters.amount_min!
      )
    }

    if (filters.amount_max !== undefined) {
      filteredApplications = filteredApplications.filter(
        app => app.amount_requested && app.amount_requested <= filters.amount_max!
      )
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredApplications = filteredApplications.filter(app =>
        filters.tags!.some(tag => JSON.stringify(app).toLowerCase().includes(tag.toLowerCase()))
      )
    }

    const response: PaginatedGrants = {
      items: filteredApplications,
      total: count || 0,
      page: filters.page!,
      page_size: filters.page_size!,
      total_pages: Math.ceil((count || 0) / filters.page_size!)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching grant applications:', error)
    return NextResponse.json({ error: 'Failed to fetch grant applications' }, { status: 500 })
  }
}
