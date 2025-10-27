import { NextRequest, NextResponse } from 'next/server'
import { selectValue, selectRows } from '@/lib/db'
import { validateEntityUpsert } from '@/lib/guardrail'

export const runtime = 'nodejs'

/**
 * Sales Opportunity Management API v2
 * Smart Code: HERA.SALES.CRM.ENT.OPP.v1
 * 
 * Handles CRUD operations for sales opportunities with pipeline management,
 * sales forecasting, probability tracking, and revenue projections.
 */

interface OpportunityRequest {
  organization_id: string
  opportunity_name: string
  customer_id?: string
  lead_id?: string
  account_name?: string
  stage?: string
  probability?: number
  amount?: number
  currency?: string
  expected_close_date?: string
  actual_close_date?: string
  close_reason?: string
  assigned_to?: string
  territory_id?: string
  source?: string
  type?: string
  priority?: string
  competition?: string[]
  next_step?: string
  description?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  actor_user_id?: string
}

interface OpportunityQuery {
  organization_id: string
  stage?: string
  assigned_to?: string
  territory_id?: string
  customer_id?: string
  type?: string
  priority?: string
  probability_min?: number
  probability_max?: number
  amount_min?: number
  amount_max?: number
  expected_close_after?: string
  expected_close_before?: string
  search?: string
  include_closed?: boolean
  limit?: number
  offset?: number
}

const OPPORTUNITY_STAGES = [
  'IDENTIFIED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'
]

const OPPORTUNITY_TYPES = [
  'NEW_BUSINESS', 'EXISTING_BUSINESS', 'UPSELL', 'CROSS_SELL', 'RENEWAL', 'UPGRADE'
]

const OPPORTUNITY_PRIORITIES = [
  'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
]

const STAGE_PROBABILITIES: Record<string, number> = {
  'IDENTIFIED': 10,
  'QUALIFIED': 25,
  'PROPOSAL': 50,
  'NEGOTIATION': 75,
  'WON': 100,
  'LOST': 0
}

// POST - Create or Update Opportunity
export async function POST(req: NextRequest) {
  try {
    const body: OpportunityRequest = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    // Validate required fields
    if (!body.organization_id || !body.opportunity_name) {
      return NextResponse.json({
        error: 'missing_required_fields',
        required: ['organization_id', 'opportunity_name']
      }, { status: 400 })
    }

    // Validate stage
    if (body.stage && !OPPORTUNITY_STAGES.includes(body.stage)) {
      return NextResponse.json({
        error: 'invalid_stage',
        valid_stages: OPPORTUNITY_STAGES
      }, { status: 400 })
    }

    // Validate type
    if (body.type && !OPPORTUNITY_TYPES.includes(body.type)) {
      return NextResponse.json({
        error: 'invalid_type',
        valid_types: OPPORTUNITY_TYPES
      }, { status: 400 })
    }

    // Validate priority
    if (body.priority && !OPPORTUNITY_PRIORITIES.includes(body.priority)) {
      return NextResponse.json({
        error: 'invalid_priority',
        valid_priorities: OPPORTUNITY_PRIORITIES
      }, { status: 400 })
    }

    // Auto-calculate probability based on stage if not provided
    const stage = body.stage || 'IDENTIFIED'
    const probability = body.probability !== undefined ? body.probability : STAGE_PROBABILITIES[stage]

    // Generate smart code and entity code
    const smart_code = 'HERA.SALES.CRM.ENT.OPP.v1'
    const entity_code = await generateOpportunityCode(body.organization_id)

    // Prepare dynamic data for opportunity-specific fields
    const opportunityDynamicData = {
      customer_id: body.customer_id,
      lead_id: body.lead_id,
      account_name: body.account_name,
      amount: body.amount,
      currency: body.currency || 'USD',
      expected_close_date: body.expected_close_date,
      actual_close_date: body.actual_close_date,
      close_reason: body.close_reason,
      territory_id: body.territory_id,
      source: body.source,
      type: body.type || 'NEW_BUSINESS',
      priority: body.priority || 'MEDIUM',
      competition: body.competition,
      next_step: body.next_step,
      description: body.description,
      ...body.custom_fields
    }

    // Enhanced metadata with opportunity-specific information
    const opportunityMetadata = {
      enterprise_module: 'SALES',
      sub_module: 'CRM',
      workflow_state: stage,
      assigned_to: body.assigned_to,
      stage,
      probability,
      amount: body.amount || 0,
      currency: body.currency || 'USD',
      type: body.type || 'NEW_BUSINESS',
      priority: body.priority || 'MEDIUM',
      created_via: 'sales_api_v2',
      last_activity_date: new Date().toISOString(),
      weighted_amount: calculateWeightedAmount(body.amount || 0, probability),
      days_in_stage: 0,
      stage_changed_date: new Date().toISOString()
    }

    // Create entity using HERA v2.2 CRUD API
    const entitySql = `
      select hera_entities_crud_v1(
        $1::text, $2::uuid, $3::uuid, $4::jsonb,
        $5::jsonb, $6::jsonb, $7::jsonb
      ) as result;
    `

    const entityData = {
      entity_type: 'OPP',
      entity_name: body.opportunity_name,
      entity_code: entity_code,
      entity_description: `Opportunity: ${body.opportunity_name}${body.account_name ? ' - ' + body.account_name : ''}`,
      smart_code: smart_code,
      parent_entity_id: null,
      status: 'active',
      metadata: opportunityMetadata
    }

    const entityParams = [
      'CREATE', // p_action
      body.actor_user_id || body.organization_id, // p_actor_user_id
      body.organization_id, // p_organization_id
      entityData, // p_entity
      opportunityDynamicData, // p_dynamic
      [], // p_relationships
      {} // p_options
    ]

    const result = await selectValue<any>(entitySql, entityParams)
    const entity_id = result?.entity_id || result?.id

    // Create opportunity-specific relationships
    await createOpportunityRelationships(entity_id, body.organization_id, {
      customer_id: body.customer_id,
      lead_id: body.lead_id,
      territory_id: body.territory_id,
      assigned_to: body.assigned_to
    })

    // Create workflow audit trail
    await createOpportunityWorkflowEntry(entity_id, 'SYSTEM', stage, body.actor_user_id)

    // Create sales activity record
    await createSalesActivity(entity_id, body.organization_id, 'OPPORTUNITY_CREATED', body.actor_user_id)

    return NextResponse.json({
      api_version: 'v2',
      opportunity_id: entity_id,
      entity_code,
      stage,
      probability,
      weighted_amount: opportunityMetadata.weighted_amount,
      created_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Opportunity creation error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to create opportunity'
    }, { status: 500 })
  }
}

// GET - Query Opportunities
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query: OpportunityQuery = {
      organization_id: searchParams.get('organization_id') || '',
      stage: searchParams.get('stage') || undefined,
      assigned_to: searchParams.get('assigned_to') || undefined,
      territory_id: searchParams.get('territory_id') || undefined,
      customer_id: searchParams.get('customer_id') || undefined,
      type: searchParams.get('type') || undefined,
      priority: searchParams.get('priority') || undefined,
      probability_min: searchParams.get('probability_min') ? parseInt(searchParams.get('probability_min')!) : undefined,
      probability_max: searchParams.get('probability_max') ? parseInt(searchParams.get('probability_max')!) : undefined,
      amount_min: searchParams.get('amount_min') ? parseFloat(searchParams.get('amount_min')!) : undefined,
      amount_max: searchParams.get('amount_max') ? parseFloat(searchParams.get('amount_max')!) : undefined,
      expected_close_after: searchParams.get('expected_close_after') || undefined,
      expected_close_before: searchParams.get('expected_close_before') || undefined,
      search: searchParams.get('search') || undefined,
      include_closed: searchParams.get('include_closed') === 'true',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    if (!query.organization_id) {
      return NextResponse.json({ error: 'missing_organization_id' }, { status: 400 })
    }

    // Build dynamic WHERE clause
    const whereConditions = ['e.organization_id = $1', 'e.entity_type = $2', 'e.status = $3']
    const params: any[] = [query.organization_id, 'OPP', 'active']
    let paramIndex = 4

    // Filter out closed opportunities unless specifically requested
    if (!query.include_closed) {
      whereConditions.push(`e.metadata->>'stage' NOT IN ('WON', 'LOST')`)
    }

    if (query.stage) {
      whereConditions.push(`e.metadata->>'stage' = $${paramIndex}`)
      params.push(query.stage)
      paramIndex++
    }

    if (query.assigned_to) {
      whereConditions.push(`e.metadata->>'assigned_to' = $${paramIndex}`)
      params.push(query.assigned_to)
      paramIndex++
    }

    if (query.customer_id) {
      whereConditions.push(`dd_customer.field_value = $${paramIndex}`)
      params.push(query.customer_id)
      paramIndex++
    }

    if (query.territory_id) {
      whereConditions.push(`dd_territory.field_value = $${paramIndex}`)
      params.push(query.territory_id)
      paramIndex++
    }

    if (query.type) {
      whereConditions.push(`e.metadata->>'type' = $${paramIndex}`)
      params.push(query.type)
      paramIndex++
    }

    if (query.priority) {
      whereConditions.push(`e.metadata->>'priority' = $${paramIndex}`)
      params.push(query.priority)
      paramIndex++
    }

    if (query.probability_min !== undefined) {
      whereConditions.push(`(e.metadata->>'probability')::numeric >= $${paramIndex}`)
      params.push(query.probability_min)
      paramIndex++
    }

    if (query.probability_max !== undefined) {
      whereConditions.push(`(e.metadata->>'probability')::numeric <= $${paramIndex}`)
      params.push(query.probability_max)
      paramIndex++
    }

    if (query.amount_min !== undefined) {
      whereConditions.push(`(e.metadata->>'amount')::numeric >= $${paramIndex}`)
      params.push(query.amount_min)
      paramIndex++
    }

    if (query.amount_max !== undefined) {
      whereConditions.push(`(e.metadata->>'amount')::numeric <= $${paramIndex}`)
      params.push(query.amount_max)
      paramIndex++
    }

    if (query.expected_close_after) {
      whereConditions.push(`dd_close_date.field_value::date >= $${paramIndex}::date`)
      params.push(query.expected_close_after)
      paramIndex++
    }

    if (query.expected_close_before) {
      whereConditions.push(`dd_close_date.field_value::date <= $${paramIndex}::date`)
      params.push(query.expected_close_before)
      paramIndex++
    }

    if (query.search) {
      whereConditions.push(`(
        e.entity_name ILIKE $${paramIndex} OR 
        e.entity_description ILIKE $${paramIndex} OR
        dd_account.field_value ILIKE $${paramIndex} OR
        dd_description.field_value ILIKE $${paramIndex}
      )`)
      params.push(`%${query.search}%`)
      paramIndex++
    }

    // Add limit and offset
    params.push(query.limit, query.offset)

    const sql = `
      SELECT 
        e.entity_id as opportunity_id,
        e.entity_name as opportunity_name,
        e.entity_code,
        e.entity_description,
        e.metadata->>'stage' as stage,
        e.metadata->>'probability' as probability,
        e.metadata->>'amount' as amount,
        e.metadata->>'currency' as currency,
        e.metadata->>'type' as type,
        e.metadata->>'priority' as priority,
        e.metadata->>'weighted_amount' as weighted_amount,
        e.metadata->>'assigned_to' as assigned_to,
        e.metadata->>'days_in_stage' as days_in_stage,
        e.metadata->>'stage_changed_date' as stage_changed_date,
        e.tags,
        e.created_at,
        e.updated_at,
        -- Opportunity-specific dynamic data
        dd_customer.field_value as customer_id,
        dd_lead.field_value as lead_id,
        dd_account.field_value as account_name,
        dd_close_date.field_value as expected_close_date,
        dd_actual_close.field_value as actual_close_date,
        dd_close_reason.field_value as close_reason,
        dd_source.field_value as source,
        dd_competition.field_value as competition,
        dd_next_step.field_value as next_step,
        dd_description.field_value as description,
        -- Related entity information
        c_entity.entity_name as customer_name,
        l_entity.entity_name as lead_name,
        t_entity.entity_name as territory_name,
        -- Assigned user information
        u_profile.display_name as assigned_to_name
      FROM core_entities e
      -- Dynamic data joins for opportunity fields
      LEFT JOIN core_dynamic_data dd_customer ON e.entity_id = dd_customer.entity_id 
        AND dd_customer.field_name = 'customer_id' AND dd_customer.status = 'active'
      LEFT JOIN core_dynamic_data dd_lead ON e.entity_id = dd_lead.entity_id 
        AND dd_lead.field_name = 'lead_id' AND dd_lead.status = 'active'
      LEFT JOIN core_dynamic_data dd_account ON e.entity_id = dd_account.entity_id 
        AND dd_account.field_name = 'account_name' AND dd_account.status = 'active'
      LEFT JOIN core_dynamic_data dd_close_date ON e.entity_id = dd_close_date.entity_id 
        AND dd_close_date.field_name = 'expected_close_date' AND dd_close_date.status = 'active'
      LEFT JOIN core_dynamic_data dd_actual_close ON e.entity_id = dd_actual_close.entity_id 
        AND dd_actual_close.field_name = 'actual_close_date' AND dd_actual_close.status = 'active'
      LEFT JOIN core_dynamic_data dd_close_reason ON e.entity_id = dd_close_reason.entity_id 
        AND dd_close_reason.field_name = 'close_reason' AND dd_close_reason.status = 'active'
      LEFT JOIN core_dynamic_data dd_source ON e.entity_id = dd_source.entity_id 
        AND dd_source.field_name = 'source' AND dd_source.status = 'active'
      LEFT JOIN core_dynamic_data dd_competition ON e.entity_id = dd_competition.entity_id 
        AND dd_competition.field_name = 'competition' AND dd_competition.status = 'active'
      LEFT JOIN core_dynamic_data dd_next_step ON e.entity_id = dd_next_step.entity_id 
        AND dd_next_step.field_name = 'next_step' AND dd_next_step.status = 'active'
      LEFT JOIN core_dynamic_data dd_description ON e.entity_id = dd_description.entity_id 
        AND dd_description.field_name = 'description' AND dd_description.status = 'active'
      LEFT JOIN core_dynamic_data dd_territory ON e.entity_id = dd_territory.entity_id 
        AND dd_territory.field_name = 'territory_id' AND dd_territory.status = 'active'
      -- Related entity lookups
      LEFT JOIN core_entities c_entity ON dd_customer.field_value = c_entity.entity_id::text
        AND c_entity.entity_type = 'CUST' AND c_entity.status = 'active'
      LEFT JOIN core_entities l_entity ON dd_lead.field_value = l_entity.entity_id::text
        AND l_entity.entity_type = 'LEAD' AND l_entity.status = 'active'
      LEFT JOIN core_entities t_entity ON dd_territory.field_value = t_entity.entity_id::text
        AND t_entity.entity_type = 'TERR' AND t_entity.status = 'active'
      -- User profile lookup for assigned_to
      LEFT JOIN user_profiles u_profile ON e.metadata->>'assigned_to' = u_profile.user_id::text
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        CASE e.metadata->>'priority'
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
          ELSE 5
        END,
        (e.metadata->>'amount')::numeric DESC,
        e.updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const opportunities = await selectRows(sql, params)

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM core_entities e
      LEFT JOIN core_dynamic_data dd_customer ON e.entity_id = dd_customer.entity_id 
        AND dd_customer.field_name = 'customer_id' AND dd_customer.status = 'active'
      LEFT JOIN core_dynamic_data dd_territory ON e.entity_id = dd_territory.entity_id 
        AND dd_territory.field_name = 'territory_id' AND dd_territory.status = 'active'
      LEFT JOIN core_dynamic_data dd_close_date ON e.entity_id = dd_close_date.entity_id 
        AND dd_close_date.field_name = 'expected_close_date' AND dd_close_date.status = 'active'
      WHERE ${whereConditions.join(' AND ')}
    `
    
    const countParams = params.slice(0, -2) // Remove limit and offset
    const totalResult = await selectValue<number>(countSql, countParams)

    // Calculate opportunity statistics and pipeline metrics
    const stats = await calculateOpportunityStatistics(query.organization_id)
    const pipeline = await calculatePipelineMetrics(query.organization_id)

    return NextResponse.json({
      api_version: 'v2',
      opportunities,
      pagination: {
        total: totalResult || 0,
        limit: query.limit,
        offset: query.offset,
        has_more: (query.offset || 0) + (query.limit || 50) < (totalResult || 0)
      },
      statistics: stats,
      pipeline: pipeline,
      filters: {
        stage: query.stage,
        assigned_to: query.assigned_to,
        territory_id: query.territory_id,
        customer_id: query.customer_id,
        type: query.type,
        priority: query.priority,
        include_closed: query.include_closed
      }
    })

  } catch (error) {
    console.error('Opportunity query error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to query opportunities'
    }, { status: 500 })
  }
}

// Helper functions
async function generateOpportunityCode(organizationId: string): Promise<string> {
  const sql = `
    SELECT COUNT(*) + 1 as next_number
    FROM core_entities 
    WHERE organization_id = $1::uuid AND entity_type = 'OPP'
  `
  const nextNumber = await selectValue<number>(sql, [organizationId])
  return `OPP-${String(nextNumber).padStart(6, '0')}`
}

function calculateWeightedAmount(amount: number, probability: number): number {
  return Math.round((amount * probability) / 100)
}

async function createOpportunityRelationships(
  opportunityId: string, 
  organizationId: string, 
  relationships: { 
    customer_id?: string
    lead_id?: string
    territory_id?: string
    assigned_to?: string 
  }
) {
  const relationshipPromises = []

  // Create customer relationship if specified
  if (relationships.customer_id) {
    const customerRelSql = `
      INSERT INTO core_relationships (
        organization_id, from_entity_id, to_entity_id, relationship_type,
        relationship_metadata, status, created_at
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, 'OPPORTUNITY_CUSTOMER',
        '{"description": "Opportunity linked to customer"}'::jsonb, 'active', NOW()
      )
    `
    relationshipPromises.push(
      selectValue(customerRelSql, [organizationId, opportunityId, relationships.customer_id])
    )
  }

  // Create lead relationship if specified
  if (relationships.lead_id) {
    const leadRelSql = `
      INSERT INTO core_relationships (
        organization_id, from_entity_id, to_entity_id, relationship_type,
        relationship_metadata, status, created_at
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, 'OPPORTUNITY_FROM_LEAD',
        '{"description": "Opportunity converted from lead"}'::jsonb, 'active', NOW()
      )
    `
    relationshipPromises.push(
      selectValue(leadRelSql, [organizationId, opportunityId, relationships.lead_id])
    )
  }

  // Create territory relationship if specified
  if (relationships.territory_id) {
    const territoryRelSql = `
      INSERT INTO core_relationships (
        organization_id, from_entity_id, to_entity_id, relationship_type,
        relationship_metadata, status, created_at
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, 'OPPORTUNITY_TERRITORY',
        '{"description": "Opportunity assigned to territory"}'::jsonb, 'active', NOW()
      )
    `
    relationshipPromises.push(
      selectValue(territoryRelSql, [organizationId, opportunityId, relationships.territory_id])
    )
  }

  // Create user assignment relationship if specified
  if (relationships.assigned_to) {
    const userRelSql = `
      INSERT INTO core_relationships (
        organization_id, from_entity_id, to_entity_id, relationship_type,
        relationship_metadata, status, created_at
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, 'OPPORTUNITY_ASSIGNED_TO',
        '{"description": "Opportunity assigned to user"}'::jsonb, 'active', NOW()
      )
    `
    relationshipPromises.push(
      selectValue(userRelSql, [organizationId, opportunityId, relationships.assigned_to])
    )
  }

  await Promise.all(relationshipPromises)
}

async function createOpportunityWorkflowEntry(
  opportunityId: string, 
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
      'Opportunity created with initial stage', true
    )
  `
  await selectValue(sql, [opportunityId, fromState, toState, changedBy])
}

async function createSalesActivity(
  opportunityId: string,
  organizationId: string,
  activityType: string,
  userId?: string
) {
  const sql = `
    INSERT INTO sales_activities (
      organization_id, entity_id, entity_type, activity_type,
      activity_description, created_by, created_at
    ) VALUES (
      $1::uuid, $2::uuid, 'OPP', $3,
      'Opportunity ' || $3 || ' activity logged', $4::uuid, NOW()
    )
  `
  await selectValue(sql, [organizationId, opportunityId, activityType, userId])
}

async function calculateOpportunityStatistics(organizationId: string) {
  const sql = `
    SELECT 
      COUNT(*) as total_opportunities,
      COUNT(*) FILTER (WHERE e.metadata->>'stage' = 'IDENTIFIED') as identified_opportunities,
      COUNT(*) FILTER (WHERE e.metadata->>'stage' = 'QUALIFIED') as qualified_opportunities,
      COUNT(*) FILTER (WHERE e.metadata->>'stage' = 'PROPOSAL') as proposal_opportunities,
      COUNT(*) FILTER (WHERE e.metadata->>'stage' = 'NEGOTIATION') as negotiation_opportunities,
      COUNT(*) FILTER (WHERE e.metadata->>'stage' = 'WON') as won_opportunities,
      COUNT(*) FILTER (WHERE e.metadata->>'stage' = 'LOST') as lost_opportunities,
      COALESCE(SUM((e.metadata->>'amount')::numeric), 0) as total_pipeline_value,
      COALESCE(SUM((e.metadata->>'weighted_amount')::numeric), 0) as total_weighted_value,
      COALESCE(SUM((e.metadata->>'amount')::numeric) FILTER (WHERE e.metadata->>'stage' = 'WON'), 0) as won_amount,
      COALESCE(SUM((e.metadata->>'amount')::numeric) FILTER (WHERE e.metadata->>'stage' = 'LOST'), 0) as lost_amount,
      ROUND(AVG((e.metadata->>'probability')::numeric), 2) as avg_probability,
      COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '30 days') as opportunities_this_month,
      COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '7 days') as opportunities_this_week,
      -- Win rate calculation
      CASE 
        WHEN COUNT(*) FILTER (WHERE e.metadata->>'stage' IN ('WON', 'LOST')) > 0 
        THEN ROUND(
          (COUNT(*) FILTER (WHERE e.metadata->>'stage' = 'WON')::numeric / 
           COUNT(*) FILTER (WHERE e.metadata->>'stage' IN ('WON', 'LOST'))::numeric) * 100, 2
        )
        ELSE 0
      END as win_rate_percentage
    FROM core_entities e
    WHERE e.organization_id = $1::uuid 
      AND e.entity_type = 'OPP' 
      AND e.status = 'active'
  `
  
  return await selectValue(sql, [organizationId])
}

async function calculatePipelineMetrics(organizationId: string) {
  const sql = `
    SELECT 
      e.metadata->>'stage' as stage,
      COUNT(*) as opportunity_count,
      COALESCE(SUM((e.metadata->>'amount')::numeric), 0) as stage_value,
      COALESCE(SUM((e.metadata->>'weighted_amount')::numeric), 0) as stage_weighted_value,
      ROUND(AVG((e.metadata->>'probability')::numeric), 2) as avg_probability,
      ROUND(AVG(EXTRACT(days FROM NOW() - e.created_at)), 0) as avg_days_in_stage
    FROM core_entities e
    WHERE e.organization_id = $1::uuid 
      AND e.entity_type = 'OPP' 
      AND e.status = 'active'
      AND e.metadata->>'stage' IS NOT NULL
    GROUP BY e.metadata->>'stage'
    ORDER BY 
      CASE e.metadata->>'stage'
        WHEN 'IDENTIFIED' THEN 1
        WHEN 'QUALIFIED' THEN 2
        WHEN 'PROPOSAL' THEN 3
        WHEN 'NEGOTIATION' THEN 4
        WHEN 'WON' THEN 5
        WHEN 'LOST' THEN 6
        ELSE 7
      END
  `
  
  return await selectRows(sql, [organizationId])
}