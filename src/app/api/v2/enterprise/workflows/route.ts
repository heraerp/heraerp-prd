import { NextRequest, NextResponse } from 'next/server'
import { selectValue, selectRows } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * Enterprise Workflow Engine API v2 - Universal Schema Compliant
 * Smart Code: HERA.ENTERPRISE.WORKFLOW.ENGINE.v1
 * 
 * Handles approval workflows and state transitions using the universal 6-table schema:
 * - Workflow configs stored as WORKFLOW_CONFIG entities
 * - Approval requests stored as APPROVAL_REQUEST entities  
 * - Workflow audit stored as WORKFLOW_AUDIT entities
 * - Business rules stored as BUSINESS_RULE entities
 * - All relationships tracked in core_relationships
 * - All dynamic data in core_dynamic_data
 */

interface WorkflowTransitionRequest {
  entity_id: string
  organization_id: string
  from_state: string
  to_state: string
  actor_user_id: string
  notes?: string
  approval_data?: Record<string, any>
  force_transition?: boolean
}

interface WorkflowConfigRequest {
  organization_id: string
  entity_type: string
  workflow_config: WorkflowConfig
  actor_user_id: string
}

interface WorkflowConfig {
  states: WorkflowState[]
  transitions: WorkflowTransition[]
  approval_rules: ApprovalRule[]
  escalation_rules?: EscalationRule[]
  notification_rules?: NotificationRule[]
}

interface WorkflowState {
  state_code: string
  state_name: string
  description?: string
  is_initial?: boolean
  is_final?: boolean
  required_permissions?: string[]
  auto_actions?: string[]
}

interface WorkflowTransition {
  from_state: string
  to_state: string
  transition_name: string
  required_approvals?: number
  approval_roles?: string[]
  conditions?: Record<string, any>
  auto_approve?: boolean
}

interface ApprovalRule {
  rule_name: string
  entity_types: string[]
  conditions: Record<string, any>
  approval_levels: ApprovalLevel[]
}

interface ApprovalLevel {
  level: number
  required_approvals: number
  approver_roles: string[]
  approval_threshold?: number
  escalation_hours?: number
}

interface EscalationRule {
  rule_name: string
  trigger_after_hours: number
  escalate_to_roles: string[]
  notification_template: string
}

interface NotificationRule {
  event: string
  notify_roles: string[]
  notification_template: string
  notification_channels: string[]
}

// POST - Execute Workflow Transition
export async function POST(req: NextRequest) {
  try {
    const body: WorkflowTransitionRequest = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    // Validate required fields
    if (!body.entity_id || !body.organization_id || !body.from_state || !body.to_state || !body.actor_user_id) {
      return NextResponse.json({
        error: 'missing_required_fields',
        required: ['entity_id', 'organization_id', 'from_state', 'to_state', 'actor_user_id']
      }, { status: 400 })
    }

    // Get entity details
    const entity = await getEntityDetails(body.entity_id, body.organization_id)
    if (!entity) {
      return NextResponse.json({
        error: 'entity_not_found',
        message: `Entity ${body.entity_id} not found in organization ${body.organization_id}`
      }, { status: 404 })
    }

    // Get workflow configuration for entity type (stored as WORKFLOW_CONFIG entity)
    const workflowConfig = await getWorkflowConfigFromEntities(body.organization_id, entity.entity_type)
    if (!workflowConfig) {
      return NextResponse.json({
        error: 'workflow_not_configured',
        message: `No workflow configuration found for entity type ${entity.entity_type}`
      }, { status: 400 })
    }

    // Validate transition is allowed
    const isValidTransition = await validateTransition(
      workflowConfig, 
      body.from_state, 
      body.to_state, 
      entity,
      body.actor_user_id
    )

    if (!isValidTransition.valid) {
      return NextResponse.json({
        error: 'invalid_transition',
        message: isValidTransition.reason,
        current_state: entity.workflow_state,
        requested_transition: `${body.from_state} → ${body.to_state}`
      }, { status: 400 })
    }

    // Check if approval is required
    const approvalRequired = await checkApprovalRequired(
      workflowConfig,
      body.from_state,
      body.to_state,
      entity,
      body.actor_user_id
    )

    let transitionResult
    if (approvalRequired.required && !body.force_transition) {
      // Create approval request as APPROVAL_REQUEST entity
      transitionResult = await createApprovalRequestEntity({
        entity_id: body.entity_id,
        organization_id: body.organization_id,
        from_state: body.from_state,
        to_state: body.to_state,
        requested_by: body.actor_user_id,
        approval_rules: approvalRequired.rules,
        notes: body.notes,
        approval_data: body.approval_data
      })
    } else {
      // Execute transition immediately
      transitionResult = await executeTransitionDirectly({
        entity_id: body.entity_id,
        organization_id: body.organization_id,
        from_state: body.from_state,
        to_state: body.to_state,
        actor_user_id: body.actor_user_id,
        notes: body.notes,
        approval_data: body.approval_data
      })
    }

    return NextResponse.json({
      api_version: 'v2',
      transition_id: transitionResult.transition_id,
      entity_id: body.entity_id,
      from_state: body.from_state,
      to_state: body.to_state,
      status: approvalRequired.required ? 'pending_approval' : 'completed',
      approval_required: approvalRequired.required,
      approval_request_id: transitionResult.approval_request_id,
      executed_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Workflow transition error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to execute workflow transition'
    }, { status: 500 })
  }
}

// PUT - Configure Workflow for Entity Type
export async function PUT(req: NextRequest) {
  try {
    const body: WorkflowConfigRequest = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    // Validate required fields
    if (!body.organization_id || !body.entity_type || !body.workflow_config || !body.actor_user_id) {
      return NextResponse.json({
        error: 'missing_required_fields',
        required: ['organization_id', 'entity_type', 'workflow_config', 'actor_user_id']
      }, { status: 400 })
    }

    // Validate workflow configuration
    const validationResult = validateWorkflowConfig(body.workflow_config)
    if (!validationResult.valid) {
      return NextResponse.json({
        error: 'invalid_workflow_config',
        message: validationResult.errors
      }, { status: 400 })
    }

    // Save workflow configuration as WORKFLOW_CONFIG entity
    const configId = await saveWorkflowConfigAsEntity({
      organization_id: body.organization_id,
      entity_type: body.entity_type,
      workflow_config: body.workflow_config,
      created_by: body.actor_user_id
    })

    return NextResponse.json({
      api_version: 'v2',
      config_id: configId,
      organization_id: body.organization_id,
      entity_type: body.entity_type,
      status: 'configured',
      created_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Workflow configuration error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to configure workflow'
    }, { status: 500 })
  }
}

// GET - Query Workflow Status and History
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const entityId = searchParams.get('entity_id')
    const organizationId = searchParams.get('organization_id')
    const showHistory = searchParams.get('include_history') === 'true'
    const showPendingApprovals = searchParams.get('include_pending') === 'true'

    if (!entityId || !organizationId) {
      return NextResponse.json({
        error: 'missing_required_params',
        required: ['entity_id', 'organization_id']
      }, { status: 400 })
    }

    // Get current workflow state
    const currentState = await getCurrentWorkflowStateFromEntity(entityId, organizationId)
    if (!currentState) {
      return NextResponse.json({
        error: 'entity_not_found'
      }, { status: 404 })
    }

    const response: any = {
      api_version: 'v2',
      entity_id: entityId,
      entity_type: currentState.entity_type,
      current_state: currentState.workflow_state,
      state_changed_at: currentState.state_changed_at,
      state_changed_by: currentState.state_changed_by
    }

    // Include workflow history if requested (from WORKFLOW_AUDIT entities)
    if (showHistory) {
      response.workflow_history = await getWorkflowHistoryFromEntities(entityId, organizationId)
    }

    // Include pending approvals if requested (from APPROVAL_REQUEST entities)
    if (showPendingApprovals) {
      response.pending_approvals = await getPendingApprovalsFromEntities(entityId, organizationId)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Workflow query error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to query workflow status'
    }, { status: 500 })
  }
}

// Helper functions using Universal Schema
async function getEntityDetails(entityId: string, organizationId: string) {
  const sql = `
    SELECT entity_id, entity_type, entity_name, status, 
           metadata->>'workflow_state' as workflow_state,
           metadata->>'assigned_to' as assigned_to,
           metadata
    FROM core_entities 
    WHERE entity_id = $1::uuid AND organization_id = $2::uuid AND status = 'active'
  `
  return await selectValue(sql, [entityId, organizationId])
}

async function getWorkflowConfigFromEntities(organizationId: string, entityType: string) {
  // Get workflow config stored as WORKFLOW_CONFIG entity with entity_type in dynamic data
  const sql = `
    SELECT dd_config.field_value as workflow_config_json
    FROM core_entities e
    JOIN core_dynamic_data dd_entity_type ON e.entity_id = dd_entity_type.entity_id
      AND dd_entity_type.field_name = 'target_entity_type' 
      AND dd_entity_type.field_value = $2
      AND dd_entity_type.status = 'active'
    JOIN core_dynamic_data dd_config ON e.entity_id = dd_config.entity_id
      AND dd_config.field_name = 'workflow_config'
      AND dd_config.status = 'active'
    WHERE e.organization_id = $1::uuid 
      AND e.entity_type = 'WORKFLOW_CONFIG' 
      AND e.status = 'active'
    ORDER BY e.created_at DESC
    LIMIT 1
  `
  const result = await selectValue(sql, [organizationId, entityType])
  return result ? JSON.parse(result.workflow_config_json) : null
}

async function validateTransition(
  workflowConfig: WorkflowConfig,
  fromState: string,
  toState: string,
  entity: any,
  actorUserId: string
): Promise<{ valid: boolean; reason?: string }> {
  // Check if transition exists in configuration
  const transition = workflowConfig.transitions.find(
    t => t.from_state === fromState && t.to_state === toState
  )

  if (!transition) {
    return {
      valid: false,
      reason: `Transition from ${fromState} to ${toState} is not allowed`
    }
  }

  // Check if current state matches
  if (entity.workflow_state !== fromState) {
    return {
      valid: false,
      reason: `Entity is in state ${entity.workflow_state}, not ${fromState}`
    }
  }

  return { valid: true }
}

async function checkApprovalRequired(
  workflowConfig: WorkflowConfig,
  fromState: string,
  toState: string,
  entity: any,
  actorUserId: string
): Promise<{ required: boolean; rules?: ApprovalRule[] }> {
  const transition = workflowConfig.transitions.find(
    t => t.from_state === fromState && t.to_state === toState
  )

  if (!transition || transition.auto_approve) {
    return { required: false }
  }

  if (transition.required_approvals && transition.required_approvals > 0) {
    const applicableRules = workflowConfig.approval_rules.filter(
      rule => rule.entity_types.includes(entity.entity_type)
    )

    return {
      required: true,
      rules: applicableRules
    }
  }

  return { required: false }
}

async function createApprovalRequestEntity(params: {
  entity_id: string
  organization_id: string
  from_state: string
  to_state: string
  requested_by: string
  approval_rules: ApprovalRule[]
  notes?: string
  approval_data?: Record<string, any>
}) {
  // Create APPROVAL_REQUEST entity
  const entitySql = `
    select hera_entity_upsert_v1(
      $1::uuid, $2::text, $3::text, $4::text,
      $5::uuid, $6::text, $7::text, $8::uuid, $9::text, $10::text[],
      $11::text, $12::jsonb, $13::jsonb, $14::numeric, $15::text, $16::jsonb, $17::jsonb, $18::uuid
    ) as entity_id;
  `

  const approvalRequestId = await selectValue<string>(entitySql, [
    params.organization_id,
    'APPROVAL_REQUEST',
    `Approval Request: ${params.from_state} → ${params.to_state}`,
    'HERA.ENTERPRISE.WORKFLOW.ENT.APPROVAL_REQUEST.v1',
    null, // entity_id (new request)
    null, // entity_code (auto-generated)
    `Workflow approval request for transition from ${params.from_state} to ${params.to_state}`,
    null, // parent_entity_id
    'active',
    null, // tags
    'ACTIVE', // smart_code_status
    {}, // business_rules
    {
      enterprise_module: 'WORKFLOW',
      sub_module: 'APPROVAL',
      workflow_state: 'PENDING',
      requested_by: params.requested_by,
      priority: 1,
      created_via: 'workflow_api_v2'
    },
    0, // ai_confidence
    null, // ai_classification
    {}, // ai_insights
    {}, // attributes (will use dynamic data)
    params.requested_by
  ])

  // Store approval request details in dynamic data
  const dynamicDataPromises = [
    setDynamicData(approvalRequestId, 'target_entity_id', params.entity_id),
    setDynamicData(approvalRequestId, 'from_state', params.from_state),
    setDynamicData(approvalRequestId, 'to_state', params.to_state),
    setDynamicData(approvalRequestId, 'approval_rules', JSON.stringify(params.approval_rules)),
    setDynamicData(approvalRequestId, 'notes', params.notes || ''),
    setDynamicData(approvalRequestId, 'approval_data', JSON.stringify(params.approval_data || {})),
    setDynamicData(approvalRequestId, 'status', 'pending')
  ]

  await Promise.all(dynamicDataPromises)

  // Create relationship between original entity and approval request
  await createRelationship(
    params.organization_id,
    params.entity_id,
    approvalRequestId,
    'REQUIRES_APPROVAL',
    { description: 'Entity requires approval for workflow transition' }
  )

  return {
    transition_id: null,
    approval_request_id: approvalRequestId
  }
}

async function executeTransitionDirectly(params: {
  entity_id: string
  organization_id: string
  from_state: string
  to_state: string
  actor_user_id: string
  notes?: string
  approval_data?: Record<string, any>
}) {
  // Create WORKFLOW_AUDIT entity
  const auditEntitySql = `
    select hera_entity_upsert_v1(
      $1::uuid, $2::text, $3::text, $4::text,
      $5::uuid, $6::text, $7::text, $8::uuid, $9::text, $10::text[],
      $11::text, $12::jsonb, $13::jsonb, $14::numeric, $15::text, $16::jsonb, $17::jsonb, $18::uuid
    ) as entity_id;
  `

  const auditId = await selectValue<string>(auditEntitySql, [
    params.organization_id,
    'WORKFLOW_AUDIT',
    `Workflow Transition: ${params.from_state} → ${params.to_state}`,
    'HERA.ENTERPRISE.WORKFLOW.ENT.WORKFLOW_AUDIT.v1',
    null, // entity_id (new audit)
    null, // entity_code (auto-generated)
    `Workflow audit trail for transition from ${params.from_state} to ${params.to_state}`,
    null, // parent_entity_id
    'active',
    null, // tags
    'ACTIVE', // smart_code_status
    {}, // business_rules
    {
      enterprise_module: 'WORKFLOW',
      sub_module: 'AUDIT',
      workflow_state: 'COMPLETED',
      changed_by: params.actor_user_id,
      system_generated: false,
      created_via: 'workflow_api_v2'
    },
    0, // ai_confidence
    null, // ai_classification
    {}, // ai_insights
    {}, // attributes (will use dynamic data)
    params.actor_user_id
  ])

  // Store audit details in dynamic data
  const auditDataPromises = [
    setDynamicData(auditId, 'target_entity_id', params.entity_id),
    setDynamicData(auditId, 'from_state', params.from_state),
    setDynamicData(auditId, 'to_state', params.to_state),
    setDynamicData(auditId, 'notes', params.notes || ''),
    setDynamicData(auditId, 'approval_data', JSON.stringify(params.approval_data || {})),
    setDynamicData(auditId, 'changed_at', new Date().toISOString())
  ]

  await Promise.all(auditDataPromises)

  // Update entity metadata with new workflow state
  const updateEntitySql = `
    UPDATE core_entities 
    SET metadata = metadata || jsonb_build_object(
          'workflow_state', $2, 
          'last_state_change', NOW()::text,
          'last_changed_by', $3
        ),
        updated_at = NOW()
    WHERE entity_id = $1::uuid
  `

  await selectValue(updateEntitySql, [params.entity_id, params.to_state, params.actor_user_id])

  // Create relationship between original entity and audit record
  await createRelationship(
    params.organization_id,
    params.entity_id,
    auditId,
    'WORKFLOW_AUDIT',
    { description: 'Workflow audit trail for entity transition' }
  )

  return {
    transition_id: auditId,
    approval_request_id: null
  }
}

// Helper functions for universal schema operations
async function setDynamicData(entityId: string, fieldName: string, fieldValue: string) {
  const sql = `
    INSERT INTO core_dynamic_data (entity_id, field_name, field_value, field_type, status, created_at, updated_at)
    VALUES ($1::uuid, $2, $3, 'text', 'active', NOW(), NOW())
    ON CONFLICT (entity_id, field_name) WHERE status = 'active'
    DO UPDATE SET field_value = EXCLUDED.field_value, updated_at = NOW()
  `
  return await selectValue(sql, [entityId, fieldName, fieldValue])
}

async function createRelationship(
  organizationId: string,
  fromEntityId: string,
  toEntityId: string,
  relationshipType: string,
  metadata: Record<string, any>
) {
  const sql = `
    INSERT INTO core_relationships (
      organization_id, from_entity_id, to_entity_id, relationship_type,
      relationship_metadata, status, created_at
    ) VALUES (
      $1::uuid, $2::uuid, $3::uuid, $4,
      $5::jsonb, 'active', NOW()
    )
  `
  return await selectValue(sql, [
    organizationId, fromEntityId, toEntityId, relationshipType, JSON.stringify(metadata)
  ])
}

function validateWorkflowConfig(config: WorkflowConfig): { valid: boolean; errors?: string[] } {
  const errors: string[] = []

  if (!config.states || config.states.length === 0) {
    errors.push('Workflow must have at least one state')
  }

  if (!config.transitions || config.transitions.length === 0) {
    errors.push('Workflow must have at least one transition')
  }

  // Validate states have unique codes
  if (config.states) {
    const stateCodes = config.states.map(s => s.state_code)
    if (new Set(stateCodes).size !== stateCodes.length) {
      errors.push('State codes must be unique')
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

async function saveWorkflowConfigAsEntity(params: {
  organization_id: string
  entity_type: string
  workflow_config: WorkflowConfig
  created_by: string
}) {
  // Create WORKFLOW_CONFIG entity
  const entitySql = `
    select hera_entity_upsert_v1(
      $1::uuid, $2::text, $3::text, $4::text,
      $5::uuid, $6::text, $7::text, $8::uuid, $9::text, $10::text[],
      $11::text, $12::jsonb, $13::jsonb, $14::numeric, $15::text, $16::jsonb, $17::jsonb, $18::uuid
    ) as entity_id;
  `

  const configId = await selectValue<string>(entitySql, [
    params.organization_id,
    'WORKFLOW_CONFIG',
    `Workflow Config: ${params.entity_type}`,
    'HERA.ENTERPRISE.WORKFLOW.ENT.WORKFLOW_CONFIG.v1',
    null, // entity_id (new config)
    null, // entity_code (auto-generated)
    `Workflow configuration for ${params.entity_type} entities`,
    null, // parent_entity_id
    'active',
    [params.entity_type], // tags
    'ACTIVE', // smart_code_status
    {}, // business_rules
    {
      enterprise_module: 'WORKFLOW',
      sub_module: 'CONFIG',
      workflow_state: 'ACTIVE',
      created_via: 'workflow_api_v2',
      target_entity_type: params.entity_type
    },
    0, // ai_confidence
    null, // ai_classification
    {}, // ai_insights
    {}, // attributes (will use dynamic data)
    params.created_by
  ])

  // Store workflow configuration in dynamic data
  await Promise.all([
    setDynamicData(configId, 'target_entity_type', params.entity_type),
    setDynamicData(configId, 'workflow_config', JSON.stringify(params.workflow_config)),
    setDynamicData(configId, 'is_active', 'true')
  ])

  return configId
}

async function getCurrentWorkflowStateFromEntity(entityId: string, organizationId: string) {
  const sql = `
    SELECT e.entity_id, e.entity_type, e.metadata->>'workflow_state' as workflow_state,
           e.updated_at as state_changed_at, e.metadata->>'last_changed_by' as state_changed_by
    FROM core_entities e
    WHERE e.entity_id = $1::uuid AND e.organization_id = $2::uuid AND e.status = 'active'
  `
  return await selectValue(sql, [entityId, organizationId])
}

async function getWorkflowHistoryFromEntities(entityId: string, organizationId: string) {
  // Get workflow audit records from WORKFLOW_AUDIT entities related to this entity
  const sql = `
    SELECT 
      wa.entity_id as workflow_audit_id,
      dd_from.field_value as from_state,
      dd_to.field_value as to_state,
      wa.metadata->>'changed_by' as changed_by,
      dd_changed_at.field_value as changed_at,
      dd_notes.field_value as notes
    FROM core_entities wa
    JOIN core_relationships r ON wa.entity_id = r.to_entity_id 
      AND r.from_entity_id = $1::uuid 
      AND r.relationship_type = 'WORKFLOW_AUDIT'
      AND r.status = 'active'
    LEFT JOIN core_dynamic_data dd_from ON wa.entity_id = dd_from.entity_id 
      AND dd_from.field_name = 'from_state' AND dd_from.status = 'active'
    LEFT JOIN core_dynamic_data dd_to ON wa.entity_id = dd_to.entity_id 
      AND dd_to.field_name = 'to_state' AND dd_to.status = 'active'
    LEFT JOIN core_dynamic_data dd_changed_at ON wa.entity_id = dd_changed_at.entity_id 
      AND dd_changed_at.field_name = 'changed_at' AND dd_changed_at.status = 'active'
    LEFT JOIN core_dynamic_data dd_notes ON wa.entity_id = dd_notes.entity_id 
      AND dd_notes.field_name = 'notes' AND dd_notes.status = 'active'
    WHERE wa.organization_id = $2::uuid 
      AND wa.entity_type = 'WORKFLOW_AUDIT' 
      AND wa.status = 'active'
    ORDER BY wa.created_at DESC
  `
  return await selectRows(sql, [entityId, organizationId])
}

async function getPendingApprovalsFromEntities(entityId: string, organizationId: string) {
  // Get pending approval requests from APPROVAL_REQUEST entities related to this entity
  const sql = `
    SELECT 
      ar.entity_id as approval_request_id,
      dd_from.field_value as from_state,
      dd_to.field_value as to_state,
      ar.metadata->>'requested_by' as requested_by,
      ar.created_at,
      dd_notes.field_value as notes,
      dd_status.field_value as status
    FROM core_entities ar
    JOIN core_relationships r ON ar.entity_id = r.to_entity_id 
      AND r.from_entity_id = $1::uuid 
      AND r.relationship_type = 'REQUIRES_APPROVAL'
      AND r.status = 'active'
    LEFT JOIN core_dynamic_data dd_from ON ar.entity_id = dd_from.entity_id 
      AND dd_from.field_name = 'from_state' AND dd_from.status = 'active'
    LEFT JOIN core_dynamic_data dd_to ON ar.entity_id = dd_to.entity_id 
      AND dd_to.field_name = 'to_state' AND dd_to.status = 'active'
    LEFT JOIN core_dynamic_data dd_notes ON ar.entity_id = dd_notes.entity_id 
      AND dd_notes.field_name = 'notes' AND dd_notes.status = 'active'
    LEFT JOIN core_dynamic_data dd_status ON ar.entity_id = dd_status.entity_id 
      AND dd_status.field_name = 'status' AND dd_status.status = 'active'
    WHERE ar.organization_id = $2::uuid 
      AND ar.entity_type = 'APPROVAL_REQUEST' 
      AND ar.status = 'active'
      AND dd_status.field_value = 'pending'
    ORDER BY ar.created_at DESC
  `
  return await selectRows(sql, [entityId, organizationId])
}