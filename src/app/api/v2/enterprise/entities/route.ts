import { NextRequest, NextResponse } from 'next/server'
import { selectValue, selectRows } from '@/lib/db'
import { validateEntityUpsert } from '@/lib/guardrail'

export const runtime = 'nodejs'

/**
 * Enterprise Entity Management API v2
 * 
 * Handles CRUD operations for all enterprise module entities:
 * - Sales: LEAD, OPP, CUST, CONT, CAMP, TERR, PIPE, FORE
 * - Finance: ACC, COA, JE, CCTR, PCTR, VEND, INV, PAY, TERM, TAX
 * - Manufacturing: BOM, RTG, WC, CAP, PLAN, PO, OP, WO, QC, MAT
 * - Procurement: RFQ, BID, EVAL, CONT, SUPP, REQ, PO, CAT, MATCH, DISC
 */

// Enterprise entity type validation
const ENTERPRISE_ENTITY_TYPES = [
  // Sales & CRM
  'LEAD', 'OPP', 'CUST', 'CONT', 'CAMP', 'TERR', 'PIPE', 'FORE',
  'PROD', 'PRIC', 'SHIP', 'BILL', 'ORD', 'DEL', 'RET',
  
  // Finance
  'ACC', 'COA', 'JE', 'CCTR', 'PCTR', 'VEND', 'INV', 'PAY', 'TERM', 'TAX', 'CRED',
  
  // Manufacturing
  'BOM', 'RTG', 'WC', 'CAP', 'PLAN', 'PO', 'OP', 'WO', 'QC', 'MAT',
  'INSP', 'CERT', 'NC', 'CA',
  
  // Procurement
  'RFQ', 'BID', 'EVAL', 'CONT', 'SUPP', 'REQ', 'CAT', 'MATCH', 'DISC'
]

// Workflow state mappings
const WORKFLOW_STATES = {
  'LEAD': ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'],
  'OPP': ['IDENTIFIED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
  'PO': ['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'INVOICED', 'PAID'],
  'REQ': ['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'COMPLETED'],
  'WO': ['CREATED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  'DEFAULT': ['DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
}

interface EnterpriseEntityRequest {
  organization_id: string
  entity_type: string
  entity_name: string
  smart_code: string
  entity_id?: string
  entity_code?: string
  entity_description?: string
  parent_entity_id?: string
  status?: string
  workflow_state?: string
  approval_level?: number
  assigned_to?: string
  tags?: string[]
  business_rules?: Record<string, any>
  metadata?: Record<string, any>
  dynamic_data?: Record<string, any>
  actor_user_id?: string
}

interface EnterpriseEntityQuery {
  organization_id: string
  entity_type?: string
  workflow_state?: string
  assigned_to?: string
  status?: string
  search?: string
  tags?: string[]
  limit?: number
  offset?: number
  include_archived?: boolean
}

// POST - Create or Update Enterprise Entity
export async function POST(req: NextRequest) {
  try {
    const body: EnterpriseEntityRequest = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    // Validate required fields
    if (!body.organization_id || !body.entity_type || !body.entity_name || !body.smart_code) {
      return NextResponse.json({ 
        error: 'missing_required_fields',
        required: ['organization_id', 'entity_type', 'entity_name', 'smart_code']
      }, { status: 400 })
    }

    // Validate enterprise entity type
    if (!ENTERPRISE_ENTITY_TYPES.includes(body.entity_type)) {
      return NextResponse.json({
        error: 'invalid_entity_type',
        message: `Entity type '${body.entity_type}' is not a valid enterprise entity type`,
        valid_types: ENTERPRISE_ENTITY_TYPES
      }, { status: 400 })
    }

    // Validate workflow state if provided
    if (body.workflow_state) {
      const validStates = WORKFLOW_STATES[body.entity_type] || WORKFLOW_STATES.DEFAULT
      if (!validStates.includes(body.workflow_state)) {
        return NextResponse.json({
          error: 'invalid_workflow_state',
          message: `Workflow state '${body.workflow_state}' is not valid for entity type '${body.entity_type}'`,
          valid_states: validStates
        }, { status: 400 })
      }
    }

    // Guardrail validation
    const errs = validateEntityUpsert(body)
    if (errs.length) {
      return NextResponse.json({ error: 'guardrail_failed', details: errs }, { status: 400 })
    }

    // Enhanced metadata with enterprise-specific fields
    const enhancedMetadata = {
      ...body.metadata,
      enterprise_module: getModuleFromEntityType(body.entity_type),
      workflow_state: body.workflow_state || getDefaultWorkflowState(body.entity_type),
      approval_level: body.approval_level || 0,
      assigned_to: body.assigned_to,
      created_via: 'enterprise_api_v2'
    }

    // Use correct HERA v2.2 RPC function with CRUD actions
    const action = body.entity_id ? 'UPDATE' : 'CREATE'
    const sql = `
      select hera_entities_crud_v1(
        $1::text, $2::uuid, $3::uuid, $4::jsonb,
        $5::jsonb, $6::jsonb, $7::jsonb
      ) as result;
    `

    const entityData = {
      entity_type: body.entity_type,
      entity_name: body.entity_name,
      entity_code: body.entity_code,
      entity_description: body.entity_description,
      smart_code: body.smart_code,
      parent_entity_id: body.parent_entity_id,
      status: body.status || 'active',
      metadata: enterpriseMetadata
    }

    if (body.entity_id) {
      entityData.entity_id = body.entity_id
    }

    const params = [
      action, // p_action
      body.actor_user_id || body.organization_id, // p_actor_user_id  
      body.organization_id, // p_organization_id
      entityData, // p_entity
      body.dynamic_data || {}, // p_dynamic
      [], // p_relationships
      {} // p_options
    ]

    const result = await selectValue<any>(sql, params)
    const entity_id = result?.entity_id || result?.id

    // Create workflow audit trail if workflow state provided
    if (body.workflow_state && entity_id) {
      await createWorkflowAudit(entity_id, body.workflow_state, body.actor_user_id)
    }

    return NextResponse.json({
      api_version: 'v2',
      entity_id,
      entity_type: body.entity_type,
      workflow_state: enhancedMetadata.workflow_state,
      module: enhancedMetadata.enterprise_module,
      created_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Enterprise entity creation error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to create enterprise entity'
    }, { status: 500 })
  }
}

// GET - Query Enterprise Entities
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query: EnterpriseEntityQuery = {
      organization_id: searchParams.get('organization_id') || '',
      entity_type: searchParams.get('entity_type') || undefined,
      workflow_state: searchParams.get('workflow_state') || undefined,
      assigned_to: searchParams.get('assigned_to') || undefined,
      status: searchParams.get('status') || 'active',
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      include_archived: searchParams.get('include_archived') === 'true'
    }

    if (!query.organization_id) {
      return NextResponse.json({ 
        error: 'missing_organization_id' 
      }, { status: 400 })
    }

    // Build dynamic WHERE clause
    const whereConditions = ['e.organization_id = $1']
    const params: any[] = [query.organization_id]
    let paramIndex = 2

    if (query.entity_type && ENTERPRISE_ENTITY_TYPES.includes(query.entity_type)) {
      whereConditions.push(`e.entity_type = $${paramIndex}`)
      params.push(query.entity_type)
      paramIndex++
    }

    if (query.workflow_state) {
      whereConditions.push(`e.metadata->>'workflow_state' = $${paramIndex}`)
      params.push(query.workflow_state)
      paramIndex++
    }

    if (query.assigned_to) {
      whereConditions.push(`e.metadata->>'assigned_to' = $${paramIndex}`)
      params.push(query.assigned_to)
      paramIndex++
    }

    if (!query.include_archived) {
      whereConditions.push(`e.status = $${paramIndex}`)
      params.push(query.status)
      paramIndex++
    }

    if (query.search) {
      whereConditions.push(`(
        e.entity_name ILIKE $${paramIndex} OR 
        e.entity_description ILIKE $${paramIndex} OR
        e.entity_code ILIKE $${paramIndex}
      )`)
      params.push(`%${query.search}%`)
      paramIndex++
    }

    // Add limit and offset
    params.push(query.limit, query.offset)

    const sql = `
      SELECT 
        e.entity_id,
        e.entity_type,
        e.entity_name,
        e.entity_code,
        e.entity_description,
        e.status,
        e.metadata,
        e.metadata->>'workflow_state' as workflow_state,
        e.metadata->>'enterprise_module' as module,
        e.metadata->>'assigned_to' as assigned_to,
        e.metadata->>'approval_level' as approval_level,
        e.tags,
        e.created_at,
        e.updated_at,
        e.smart_code,
        -- Dynamic data aggregation
        COALESCE(
          json_object_agg(
            dd.field_name, 
            CASE 
              WHEN dd.field_type = 'number' THEN to_jsonb(dd.field_value::numeric)
              WHEN dd.field_type = 'boolean' THEN to_jsonb(dd.field_value::boolean)
              WHEN dd.field_type = 'date' THEN to_jsonb(dd.field_value::date)
              ELSE to_jsonb(dd.field_value)
            END
          ) FILTER (WHERE dd.field_name IS NOT NULL),
          '{}'::json
        ) as dynamic_data
      FROM core_entities e
      LEFT JOIN core_dynamic_data dd ON e.entity_id = dd.entity_id AND dd.status = 'active'
      WHERE ${whereConditions.join(' AND ')}
        AND e.entity_type = ANY($${paramIndex - 1}::text[])
      GROUP BY e.entity_id
      ORDER BY e.updated_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    // Replace the entity type filter with enterprise types
    params[params.length - 3] = ENTERPRISE_ENTITY_TYPES

    const entities = await selectRows(sql, params)

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(DISTINCT e.entity_id) as total
      FROM core_entities e
      WHERE ${whereConditions.join(' AND ')}
        AND e.entity_type = ANY($${paramIndex - 1}::text[])
    `
    
    const countParams = params.slice(0, -2) // Remove limit and offset
    countParams[countParams.length - 1] = ENTERPRISE_ENTITY_TYPES
    const totalResult = await selectValue<number>(countSql, countParams)

    return NextResponse.json({
      api_version: 'v2',
      entities,
      pagination: {
        total: totalResult || 0,
        limit: query.limit,
        offset: query.offset,
        has_more: (query.offset || 0) + (query.limit || 50) < (totalResult || 0)
      },
      filters: {
        entity_type: query.entity_type,
        workflow_state: query.workflow_state,
        assigned_to: query.assigned_to,
        status: query.status
      }
    })

  } catch (error) {
    console.error('Enterprise entity query error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to query enterprise entities'
    }, { status: 500 })
  }
}

// Helper functions
function getModuleFromEntityType(entityType: string): string {
  const moduleMap: Record<string, string> = {
    // Sales & CRM
    'LEAD': 'SALES', 'OPP': 'SALES', 'CUST': 'SALES', 'CONT': 'SALES', 
    'CAMP': 'SALES', 'TERR': 'SALES', 'PIPE': 'SALES', 'FORE': 'SALES',
    'PROD': 'SALES', 'PRIC': 'SALES', 'SHIP': 'SALES', 'BILL': 'SALES',
    'ORD': 'SALES', 'DEL': 'SALES', 'RET': 'SALES',
    
    // Finance
    'ACC': 'FIN', 'COA': 'FIN', 'JE': 'FIN', 'CCTR': 'FIN', 'PCTR': 'FIN',
    'VEND': 'FIN', 'INV': 'FIN', 'PAY': 'FIN', 'TERM': 'FIN', 'TAX': 'FIN', 'CRED': 'FIN',
    
    // Manufacturing
    'BOM': 'MFG', 'RTG': 'MFG', 'WC': 'MFG', 'CAP': 'MFG', 'PLAN': 'MFG',
    'PO': 'MFG', 'OP': 'MFG', 'WO': 'MFG', 'QC': 'MFG', 'MAT': 'MFG',
    'INSP': 'MFG', 'CERT': 'MFG', 'NC': 'MFG', 'CA': 'MFG',
    
    // Procurement
    'RFQ': 'PROC', 'BID': 'PROC', 'EVAL': 'PROC', 'CONT': 'PROC', 'SUPP': 'PROC',
    'REQ': 'PROC', 'CAT': 'PROC', 'MATCH': 'PROC', 'DISC': 'PROC'
  }
  
  return moduleMap[entityType] || 'GENERAL'
}

function getDefaultWorkflowState(entityType: string): string {
  const defaultStates = WORKFLOW_STATES[entityType] || WORKFLOW_STATES.DEFAULT
  return defaultStates[0] || 'DRAFT'
}

async function createWorkflowAudit(entityId: string, workflowState: string, actorUserId?: string) {
  try {
    const auditSql = `
      INSERT INTO entity_workflow_audit (
        entity_id, 
        from_state, 
        to_state, 
        changed_by, 
        changed_at, 
        notes
      ) VALUES (
        $1::uuid, 
        'SYSTEM', 
        $2::text, 
        $3::uuid, 
        NOW(), 
        'Initial workflow state set via Enterprise API v2'
      )
    `
    
    await selectValue(auditSql, [entityId, workflowState, actorUserId])
  } catch (error) {
    console.warn('Failed to create workflow audit trail:', error)
    // Don't throw - audit trail failure shouldn't block entity creation
  }
}