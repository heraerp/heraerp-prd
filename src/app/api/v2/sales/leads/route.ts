import { NextRequest, NextResponse } from 'next/server'
import { selectValue, selectRows } from '@/lib/db'
import { validateEntityUpsert } from '@/lib/guardrail'

export const runtime = 'nodejs'

/**
 * Sales Lead Management API v2
 * Smart Code: HERA.SALES.CRM.ENT.LEAD.v1
 * 
 * Handles CRUD operations for sales leads with workflow integration,
 * lead scoring, territory assignment, and qualification tracking.
 */

interface LeadRequest {
  organization_id: string
  lead_name: string
  company_name?: string
  contact_email?: string
  contact_phone?: string
  source?: string
  territory_id?: string
  assigned_to?: string
  lead_score?: number
  qualification_status?: string
  expected_revenue?: number
  expected_close_date?: string
  notes?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  actor_user_id?: string
}

interface LeadQuery {
  organization_id: string
  assigned_to?: string
  territory_id?: string
  source?: string
  qualification_status?: string
  lead_score_min?: number
  lead_score_max?: number
  search?: string
  created_after?: string
  created_before?: string
  limit?: number
  offset?: number
}

const LEAD_QUALIFICATION_STATUSES = [
  'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST', 'NURTURING'
]

const LEAD_SOURCES = [
  'WEBSITE', 'REFERRAL', 'COLD_CALL', 'EMAIL_CAMPAIGN', 'SOCIAL_MEDIA', 
  'TRADE_SHOW', 'PARTNER', 'ADVERTISEMENT', 'DIRECT_MAIL', 'OTHER'
]

// POST - Create or Update Lead
export async function POST(req: NextRequest) {
  try {
    const body: LeadRequest = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    // Validate required fields
    if (!body.organization_id || !body.lead_name) {
      return NextResponse.json({
        error: 'missing_required_fields',
        required: ['organization_id', 'lead_name']
      }, { status: 400 })
    }

    // Validate qualification status
    if (body.qualification_status && !LEAD_QUALIFICATION_STATUSES.includes(body.qualification_status)) {
      return NextResponse.json({
        error: 'invalid_qualification_status',
        valid_statuses: LEAD_QUALIFICATION_STATUSES
      }, { status: 400 })
    }

    // Validate lead source
    if (body.source && !LEAD_SOURCES.includes(body.source)) {
      return NextResponse.json({
        error: 'invalid_lead_source',
        valid_sources: LEAD_SOURCES
      }, { status: 400 })
    }

    // Generate smart code for lead
    const smart_code = 'HERA.SALES.CRM.ENT.LEAD.v1'
    
    // Build entity code
    const entity_code = await generateLeadCode(body.organization_id)

    // Prepare dynamic data for lead-specific fields
    const leadDynamicData = {
      company_name: body.company_name,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone,
      source: body.source || 'OTHER',
      territory_id: body.territory_id,
      lead_score: body.lead_score || 0,
      expected_revenue: body.expected_revenue,
      expected_close_date: body.expected_close_date,
      notes: body.notes,
      ...body.custom_fields
    }

    // Enhanced metadata with lead-specific information
    const leadMetadata = {
      enterprise_module: 'SALES',
      sub_module: 'CRM',
      workflow_state: body.qualification_status || 'NEW',
      assigned_to: body.assigned_to,
      source: body.source || 'OTHER',
      lead_score: body.lead_score || 0,
      created_via: 'sales_api_v2',
      last_activity_date: new Date().toISOString(),
      lead_temperature: calculateLeadTemperature(body.lead_score || 0)
    }

    // Create entity using HERA v2.2 CRUD API
    const entitySql = `
      select hera_entities_crud_v1(
        $1::text, $2::uuid, $3::uuid, $4::jsonb,
        $5::jsonb, $6::jsonb, $7::jsonb
      ) as result;
    `

    const entityData = {
      entity_type: 'LEAD',
      entity_name: body.lead_name,
      entity_code: entity_code,
      entity_description: `Lead: ${body.lead_name}${body.company_name ? ' from ' + body.company_name : ''}`,
      smart_code: smart_code,
      parent_entity_id: null,
      status: 'active',
      metadata: leadMetadata
    }

    const entityParams = [
      'CREATE', // p_action
      body.actor_user_id || body.organization_id, // p_actor_user_id
      body.organization_id, // p_organization_id
      entityData, // p_entity
      leadDynamicData, // p_dynamic
      [], // p_relationships
      {} // p_options
    ]

    const result = await selectValue<any>(entitySql, entityParams)
    const entity_id = result?.entity_id || result?.id

    // Create lead-specific relationships if territory or assigned user specified
    if (body.territory_id || body.assigned_to) {
      await createLeadRelationships(entity_id, body.organization_id, {
        territory_id: body.territory_id,
        assigned_to: body.assigned_to
      })
    }

    // Auto-calculate and update lead score if not provided
    if (!body.lead_score) {
      const calculatedScore = await calculateLeadScore(entity_id, leadDynamicData)
      await updateLeadScore(entity_id, calculatedScore)
    }

    // Create workflow audit trail
    await createLeadWorkflowEntry(entity_id, 'SYSTEM', leadMetadata.workflow_state, body.actor_user_id)

    return NextResponse.json({
      api_version: 'v2',
      lead_id: entity_id,
      entity_code,
      qualification_status: leadMetadata.workflow_state,
      lead_score: leadMetadata.lead_score,
      lead_temperature: leadMetadata.lead_temperature,
      created_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Lead creation error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to create lead'
    }, { status: 500 })
  }
}

// GET - Query Leads
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query: LeadQuery = {
      organization_id: searchParams.get('organization_id') || '',
      assigned_to: searchParams.get('assigned_to') || undefined,
      territory_id: searchParams.get('territory_id') || undefined,
      source: searchParams.get('source') || undefined,
      qualification_status: searchParams.get('qualification_status') || undefined,
      lead_score_min: searchParams.get('lead_score_min') ? parseInt(searchParams.get('lead_score_min')!) : undefined,
      lead_score_max: searchParams.get('lead_score_max') ? parseInt(searchParams.get('lead_score_max')!) : undefined,
      search: searchParams.get('search') || undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    if (!query.organization_id) {
      return NextResponse.json({ error: 'missing_organization_id' }, { status: 400 })
    }

    // Build dynamic WHERE clause
    const whereConditions = ['e.organization_id = $1', 'e.entity_type = $2', 'e.status = $3']
    const params: any[] = [query.organization_id, 'LEAD', 'active']
    let paramIndex = 4

    if (query.assigned_to) {
      whereConditions.push(`e.metadata->>'assigned_to' = $${paramIndex}`)
      params.push(query.assigned_to)
      paramIndex++
    }

    if (query.territory_id) {
      whereConditions.push(`dd_territory.field_value = $${paramIndex}`)
      params.push(query.territory_id)
      paramIndex++
    }

    if (query.source) {
      whereConditions.push(`dd_source.field_value = $${paramIndex}`)
      params.push(query.source)
      paramIndex++
    }

    if (query.qualification_status) {
      whereConditions.push(`e.metadata->>'workflow_state' = $${paramIndex}`)
      params.push(query.qualification_status)
      paramIndex++
    }

    if (query.lead_score_min !== undefined) {
      whereConditions.push(`(e.metadata->>'lead_score')::numeric >= $${paramIndex}`)
      params.push(query.lead_score_min)
      paramIndex++
    }

    if (query.lead_score_max !== undefined) {
      whereConditions.push(`(e.metadata->>'lead_score')::numeric <= $${paramIndex}`)
      params.push(query.lead_score_max)
      paramIndex++
    }

    if (query.search) {
      whereConditions.push(`(
        e.entity_name ILIKE $${paramIndex} OR 
        e.entity_description ILIKE $${paramIndex} OR
        dd_company.field_value ILIKE $${paramIndex} OR
        dd_email.field_value ILIKE $${paramIndex}
      )`)
      params.push(`%${query.search}%`)
      paramIndex++
    }

    if (query.created_after) {
      whereConditions.push(`e.created_at >= $${paramIndex}::timestamptz`)
      params.push(query.created_after)
      paramIndex++
    }

    if (query.created_before) {
      whereConditions.push(`e.created_at <= $${paramIndex}::timestamptz`)
      params.push(query.created_before)
      paramIndex++
    }

    // Add limit and offset
    params.push(query.limit, query.offset)

    const sql = `
      SELECT 
        e.entity_id as lead_id,
        e.entity_name as lead_name,
        e.entity_code,
        e.entity_description,
        e.metadata->>'workflow_state' as qualification_status,
        e.metadata->>'assigned_to' as assigned_to,
        e.metadata->>'source' as source,
        e.metadata->>'lead_score' as lead_score,
        e.metadata->>'lead_temperature' as lead_temperature,
        e.metadata->>'last_activity_date' as last_activity_date,
        e.tags,
        e.created_at,
        e.updated_at,
        -- Lead-specific dynamic data
        dd_company.field_value as company_name,
        dd_email.field_value as contact_email,
        dd_phone.field_value as contact_phone,
        dd_revenue.field_value as expected_revenue,
        dd_close_date.field_value as expected_close_date,
        dd_notes.field_value as notes,
        -- Territory information
        t_entity.entity_name as territory_name,
        -- Assigned user information
        u_profile.display_name as assigned_to_name
      FROM core_entities e
      -- Dynamic data joins for lead fields
      LEFT JOIN core_dynamic_data dd_company ON e.entity_id = dd_company.entity_id 
        AND dd_company.field_name = 'company_name' AND dd_company.status = 'active'
      LEFT JOIN core_dynamic_data dd_email ON e.entity_id = dd_email.entity_id 
        AND dd_email.field_name = 'contact_email' AND dd_email.status = 'active'
      LEFT JOIN core_dynamic_data dd_phone ON e.entity_id = dd_phone.entity_id 
        AND dd_phone.field_name = 'contact_phone' AND dd_phone.status = 'active'
      LEFT JOIN core_dynamic_data dd_revenue ON e.entity_id = dd_revenue.entity_id 
        AND dd_revenue.field_name = 'expected_revenue' AND dd_revenue.status = 'active'
      LEFT JOIN core_dynamic_data dd_close_date ON e.entity_id = dd_close_date.entity_id 
        AND dd_close_date.field_name = 'expected_close_date' AND dd_close_date.status = 'active'
      LEFT JOIN core_dynamic_data dd_notes ON e.entity_id = dd_notes.entity_id 
        AND dd_notes.field_name = 'notes' AND dd_notes.status = 'active'
      LEFT JOIN core_dynamic_data dd_territory ON e.entity_id = dd_territory.entity_id 
        AND dd_territory.field_name = 'territory_id' AND dd_territory.status = 'active'
      LEFT JOIN core_dynamic_data dd_source ON e.entity_id = dd_source.entity_id 
        AND dd_source.field_name = 'source' AND dd_source.status = 'active'
      -- Territory entity lookup
      LEFT JOIN core_entities t_entity ON dd_territory.field_value = t_entity.entity_id::text
        AND t_entity.entity_type = 'TERR' AND t_entity.status = 'active'
      -- User profile lookup for assigned_to
      LEFT JOIN user_profiles u_profile ON e.metadata->>'assigned_to' = u_profile.user_id::text
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY e.updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const leads = await selectRows(sql, params)

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM core_entities e
      LEFT JOIN core_dynamic_data dd_territory ON e.entity_id = dd_territory.entity_id 
        AND dd_territory.field_name = 'territory_id' AND dd_territory.status = 'active'
      LEFT JOIN core_dynamic_data dd_source ON e.entity_id = dd_source.entity_id 
        AND dd_source.field_name = 'source' AND dd_source.status = 'active'
      WHERE ${whereConditions.join(' AND ')}
    `
    
    const countParams = params.slice(0, -2) // Remove limit and offset
    const totalResult = await selectValue<number>(countSql, countParams)

    // Calculate lead statistics
    const stats = await calculateLeadStatistics(query.organization_id)

    return NextResponse.json({
      api_version: 'v2',
      leads,
      pagination: {
        total: totalResult || 0,
        limit: query.limit,
        offset: query.offset,
        has_more: (query.offset || 0) + (query.limit || 50) < (totalResult || 0)
      },
      statistics: stats,
      filters: {
        assigned_to: query.assigned_to,
        territory_id: query.territory_id,
        source: query.source,
        qualification_status: query.qualification_status,
        lead_score_range: query.lead_score_min || query.lead_score_max 
          ? [query.lead_score_min, query.lead_score_max] 
          : null
      }
    })

  } catch (error) {
    console.error('Lead query error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to query leads'
    }, { status: 500 })
  }
}

// Helper functions
async function generateLeadCode(organizationId: string): Promise<string> {
  const sql = `
    SELECT COUNT(*) + 1 as next_number
    FROM core_entities 
    WHERE organization_id = $1::uuid AND entity_type = 'LEAD'
  `
  const nextNumber = await selectValue<number>(sql, [organizationId])
  return `LEAD-${String(nextNumber).padStart(6, '0')}`
}

function calculateLeadTemperature(leadScore: number): string {
  if (leadScore >= 80) return 'HOT'
  if (leadScore >= 60) return 'WARM'
  if (leadScore >= 40) return 'COOL'
  return 'COLD'
}

async function createLeadRelationships(
  leadId: string, 
  organizationId: string, 
  relationships: { territory_id?: string; assigned_to?: string }
) {
  // Create territory relationship if specified
  if (relationships.territory_id) {
    const territoryRelSql = `
      INSERT INTO core_relationships (
        organization_id, from_entity_id, to_entity_id, relationship_type,
        relationship_metadata, status, created_at
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, 'LEAD_TERRITORY',
        '{"description": "Lead assigned to territory"}'::jsonb, 'active', NOW()
      )
    `
    await selectValue(territoryRelSql, [organizationId, leadId, relationships.territory_id])
  }

  // Create user assignment relationship if specified
  if (relationships.assigned_to) {
    const userRelSql = `
      INSERT INTO core_relationships (
        organization_id, from_entity_id, to_entity_id, relationship_type,
        relationship_metadata, status, created_at
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, 'LEAD_ASSIGNED_TO',
        '{"description": "Lead assigned to user"}'::jsonb, 'active', NOW()
      )
    `
    await selectValue(userRelSql, [organizationId, leadId, relationships.assigned_to])
  }
}

async function calculateLeadScore(leadId: string, dynamicData: Record<string, any>): Promise<number> {
  let score = 0

  // Email provided = +20 points
  if (dynamicData.contact_email) score += 20

  // Phone provided = +15 points
  if (dynamicData.contact_phone) score += 15

  // Company name provided = +10 points
  if (dynamicData.company_name) score += 10

  // Expected revenue provided = +25 points
  if (dynamicData.expected_revenue) score += 25

  // Source scoring
  const sourceScores: Record<string, number> = {
    'REFERRAL': 30,
    'WEBSITE': 20,
    'TRADE_SHOW': 25,
    'PARTNER': 20,
    'SOCIAL_MEDIA': 15,
    'EMAIL_CAMPAIGN': 15,
    'COLD_CALL': 10,
    'ADVERTISEMENT': 10,
    'DIRECT_MAIL': 5,
    'OTHER': 0
  }
  
  if (dynamicData.source && sourceScores[dynamicData.source]) {
    score += sourceScores[dynamicData.source]
  }

  // Cap at 100
  return Math.min(score, 100)
}

async function updateLeadScore(leadId: string, score: number) {
  const sql = `
    UPDATE core_entities 
    SET metadata = metadata || jsonb_build_object(
      'lead_score', $2,
      'lead_temperature', $3,
      'score_updated_at', NOW()::text
    ),
    updated_at = NOW()
    WHERE entity_id = $1::uuid
  `
  await selectValue(sql, [leadId, score, calculateLeadTemperature(score)])
}

async function createLeadWorkflowEntry(
  leadId: string, 
  fromState: string, 
  toState: string, 
  changedBy?: string
) {
  const sql = `
    INSERT INTO entity_workflow_audit (
      entity_id, from_state, to_state, changed_by, changed_at, 
      notes, system_generated
    ) VALUES (
      $1::uuid, $2, $3, $4::uuid, NOW(), 
      'Lead created with initial status', true
    )
  `
  await selectValue(sql, [leadId, fromState, toState, changedBy])
}

async function calculateLeadStatistics(organizationId: string) {
  const sql = `
    SELECT 
      COUNT(*) as total_leads,
      COUNT(*) FILTER (WHERE e.metadata->>'workflow_state' = 'NEW') as new_leads,
      COUNT(*) FILTER (WHERE e.metadata->>'workflow_state' = 'CONTACTED') as contacted_leads,
      COUNT(*) FILTER (WHERE e.metadata->>'workflow_state' = 'QUALIFIED') as qualified_leads,
      COUNT(*) FILTER (WHERE e.metadata->>'workflow_state' = 'CONVERTED') as converted_leads,
      COUNT(*) FILTER (WHERE e.metadata->>'workflow_state' = 'LOST') as lost_leads,
      COUNT(*) FILTER (WHERE (e.metadata->>'lead_score')::numeric >= 80) as hot_leads,
      COUNT(*) FILTER (WHERE (e.metadata->>'lead_score')::numeric BETWEEN 60 AND 79) as warm_leads,
      COUNT(*) FILTER (WHERE (e.metadata->>'lead_score')::numeric BETWEEN 40 AND 59) as cool_leads,
      COUNT(*) FILTER (WHERE (e.metadata->>'lead_score')::numeric < 40) as cold_leads,
      ROUND(AVG((e.metadata->>'lead_score')::numeric), 2) as avg_lead_score,
      COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '30 days') as leads_this_month,
      COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '7 days') as leads_this_week
    FROM core_entities e
    WHERE e.organization_id = $1::uuid 
      AND e.entity_type = 'LEAD' 
      AND e.status = 'active'
  `
  
  return await selectValue(sql, [organizationId])
}