/**
 * HERA Universal Tile System - Tile Action Handler API
 * POST /api/v2/tiles/:tileId/actions/:actionId
 * Executes tile actions with proper validation, permissions, and telemetry
 * Smart Code: HERA.PLATFORM.API.TILE.ACTION_HANDLER.v1
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  ResolvedTileConfig,
  ResolvedTileAction 
} from '@/lib/tiles/resolved-tile-config'
import { 
  evaluateConditionExpression,
  EvaluationContext
} from '@/lib/tiles/dsl-evaluator'

// ================================================================================
// TYPES
// ================================================================================

export interface ActionExecutionRequest {
  parameters?: Record<string, any>
  context?: {
    workspacePath?: string
    entityId?: string
    filters?: Record<string, any>
    confirmationToken?: string
  }
  dryRun?: boolean
}

export interface ActionExecutionResponse {
  actionId: string
  tileId: string
  executionId: string
  status: 'success' | 'error' | 'redirect' | 'confirmation_required'
  
  // For successful executions
  result?: {
    type: 'navigation' | 'api_response' | 'modal' | 'file_download'
    data?: any
    url?: string
    redirectTo?: string
  }
  
  // For confirmations
  confirmation?: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    token: string
  }
  
  // Error details
  error?: {
    code: string
    message: string
    details?: any
  }
  
  // Execution metadata
  executionTime: number
  executedAt: string
  actorUserId: string
}

interface ActionContext extends EvaluationContext {
  action: ResolvedTileAction
  tileConfig: ResolvedTileConfig
  parameters: Record<string, any>
  workspacePath?: string
  entityId?: string
}

// ================================================================================
// ROUTE HANDLER
// ================================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { tileId: string; actionId: string } }
) {
  const startTime = Date.now()
  const executionId = generateExecutionId()
  
  try {
    const { tileId, actionId } = params
    
    // Get organization_id and actor from headers (set by API v2 gateway)
    const organizationId = request.headers.get('x-organization-id')
    const actorUserId = request.headers.get('x-actor-user-id')
    
    if (!organizationId) {
      return Response.json(
        { error: 'Missing organization context' },
        { status: 400 }
      )
    }

    if (!actorUserId) {
      return Response.json(
        { error: 'Missing actor context' },
        { status: 401 }
      )
    }

    // Parse request body
    let requestBody: ActionExecutionRequest = {}
    try {
      requestBody = await request.json()
    } catch {
      // Empty body is OK for some actions
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get tile configuration and action
    const { tileConfig, action } = await getTileConfigurationAndAction({
      tileId,
      actionId,
      organizationId,
      supabase
    })

    if (!tileConfig || !action) {
      return Response.json(
        { error: 'Tile or action not found' },
        { status: 404 }
      )
    }

    // Build action context
    const actionContext = await buildActionContext({
      organizationId,
      actorUserId,
      tileConfig,
      action,
      parameters: requestBody.parameters || {},
      requestContext: requestBody.context,
      supabase
    })

    // Check permissions and visibility
    const permissionCheck = await checkActionPermissions({
      action,
      context: actionContext,
      supabase
    })

    if (!permissionCheck.allowed) {
      return Response.json({
        actionId,
        tileId,
        executionId,
        status: 'error',
        error: {
          code: 'PERMISSION_DENIED',
          message: permissionCheck.reason || 'Action not permitted',
          details: permissionCheck
        },
        executionTime: Date.now() - startTime,
        executedAt: new Date().toISOString(),
        actorUserId
      } as ActionExecutionResponse, {
        status: 403
      })
    }

    // Check if confirmation is required
    if (action.requiresConfirmation && !requestBody.context?.confirmationToken) {
      const confirmationToken = generateConfirmationToken()
      
      return Response.json({
        actionId,
        tileId,
        executionId,
        status: 'confirmation_required',
        confirmation: {
          title: action.confirmation?.title || `Confirm ${action.label}`,
          message: action.confirmation?.message || `Are you sure you want to ${action.label.toLowerCase()}?`,
          confirmText: action.confirmation?.confirm_text || 'Confirm',
          cancelText: action.confirmation?.cancel_text || 'Cancel',
          token: confirmationToken
        },
        executionTime: Date.now() - startTime,
        executedAt: new Date().toISOString(),
        actorUserId
      } as ActionExecutionResponse, {
        status: 200
      })
    }

    // Validate confirmation token if provided
    if (action.requiresConfirmation && requestBody.context?.confirmationToken) {
      const isValidToken = await validateConfirmationToken({
        token: requestBody.context.confirmationToken,
        actionId,
        tileId,
        actorUserId,
        supabase
      })
      
      if (!isValidToken) {
        return Response.json({
          actionId,
          tileId,
          executionId,
          status: 'error',
          error: {
            code: 'INVALID_CONFIRMATION_TOKEN',
            message: 'Invalid or expired confirmation token'
          },
          executionTime: Date.now() - startTime,
          executedAt: new Date().toISOString(),
          actorUserId
        } as ActionExecutionResponse, {
          status: 400
        })
      }
    }

    // Execute the action
    const executionResult = await executeAction({
      action,
      context: actionContext,
      dryRun: requestBody.dryRun || false,
      supabase
    })

    // Log telemetry
    await logActionTelemetry({
      executionId,
      tileId,
      actionId,
      organizationId,
      actorUserId,
      executionTime: Date.now() - startTime,
      status: executionResult.status,
      supabase
    })

    const response: ActionExecutionResponse = {
      actionId,
      tileId,
      executionId,
      status: executionResult.status,
      result: executionResult.result,
      executionTime: Date.now() - startTime,
      executedAt: new Date().toISOString(),
      actorUserId
    }

    return Response.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Execution-Id': executionId,
        'X-Execution-Time': (Date.now() - startTime).toString()
      }
    })

  } catch (error) {
    console.error('Error executing tile action:', error)
    
    const totalExecutionTime = Date.now() - startTime
    
    return Response.json({
      actionId: params.actionId,
      tileId: params.tileId,
      executionId,
      status: 'error',
      error: {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      },
      executionTime: totalExecutionTime,
      executedAt: new Date().toISOString(),
      actorUserId: 'unknown'
    } as ActionExecutionResponse, {
      status: 500
    })
  }
}

// ================================================================================
// ACTION EXECUTION LOGIC
// ================================================================================

interface ExecutionResult {
  status: 'success' | 'error' | 'redirect'
  result?: {
    type: 'navigation' | 'api_response' | 'modal' | 'file_download'
    data?: any
    url?: string
    redirectTo?: string
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}

async function executeAction({
  action,
  context,
  dryRun,
  supabase
}: {
  action: ResolvedTileAction
  context: ActionContext
  dryRun: boolean
  supabase: any
}): Promise<ExecutionResult> {
  
  if (dryRun) {
    return {
      status: 'success',
      result: {
        type: 'api_response',
        data: {
          message: 'Dry run completed successfully',
          action: action.actionId,
          wouldExecute: action.actionType
        }
      }
    }
  }

  switch (action.actionType) {
    case 'NAVIGATE':
      return await executeNavigationAction(action, context)
    
    case 'API_CALL':
      return await executeApiCallAction(action, context, supabase)
    
    case 'MODAL':
      return await executeModalAction(action, context)
    
    case 'DRAWER':
      return await executeDrawerAction(action, context)
    
    case 'WIZARD':
      return await executeWizardAction(action, context)
    
    default:
      return {
        status: 'error',
        error: {
          code: 'UNSUPPORTED_ACTION_TYPE',
          message: `Action type '${action.actionType}' is not supported`,
          details: { actionType: action.actionType }
        }
      }
  }
}

async function executeNavigationAction(
  action: ResolvedTileAction,
  context: ActionContext
): Promise<ExecutionResult> {
  
  if (!action.routePattern) {
    return {
      status: 'error',
      error: {
        code: 'MISSING_ROUTE_PATTERN',
        message: 'Navigation action requires routePattern'
      }
    }
  }

  // Interpolate route pattern with context
  const interpolatedRoute = interpolateTemplate(action.routePattern, {
    workspace_path: context.workspacePath || '',
    entity_id: context.entityId || '',
    organization_id: context.organization.id,
    user_id: context.user.id,
    ...context.parameters
  })

  return {
    status: 'success',
    result: {
      type: 'navigation',
      url: interpolatedRoute,
      redirectTo: interpolatedRoute
    }
  }
}

async function executeApiCallAction(
  action: ResolvedTileAction,
  context: ActionContext,
  supabase: any
): Promise<ExecutionResult> {
  
  if (!action.apiEndpoint) {
    return {
      status: 'error',
      error: {
        code: 'MISSING_API_ENDPOINT',
        message: 'API call action requires apiEndpoint'
      }
    }
  }

  try {
    // Interpolate endpoint with context
    const endpoint = interpolateTemplate(action.apiEndpoint, {
      organization_id: context.organization.id,
      user_id: context.user.id,
      entity_id: context.entityId || '',
      ...context.parameters
    })

    // For demo purposes, simulate API call
    // In production, this would make actual HTTP requests
    const simulatedResponse = {
      success: true,
      endpoint: endpoint,
      method: action.apiMethod || 'POST',
      parameters: context.parameters,
      executedAt: new Date().toISOString()
    }

    return {
      status: 'success',
      result: {
        type: 'api_response',
        data: simulatedResponse,
        url: endpoint
      }
    }
    
  } catch (error) {
    return {
      status: 'error',
      error: {
        code: 'API_CALL_FAILED',
        message: error instanceof Error ? error.message : 'API call failed',
        details: error
      }
    }
  }
}

async function executeModalAction(
  action: ResolvedTileAction,
  context: ActionContext
): Promise<ExecutionResult> {
  
  if (!action.modal_component) {
    return {
      status: 'error',
      error: {
        code: 'MISSING_MODAL_COMPONENT',
        message: 'Modal action requires modal_component'
      }
    }
  }

  return {
    status: 'success',
    result: {
      type: 'modal',
      data: {
        component: action.modal_component,
        props: {
          tileId: context.tileConfig.tileId,
          actionId: action.actionId,
          parameters: context.parameters,
          context: {
            organizationId: context.organization.id,
            userId: context.user.id,
            workspacePath: context.workspacePath,
            entityId: context.entityId
          }
        }
      }
    }
  }
}

async function executeDrawerAction(
  action: ResolvedTileAction,
  context: ActionContext
): Promise<ExecutionResult> {
  
  return {
    status: 'success',
    result: {
      type: 'modal', // Drawers use similar pattern to modals
      data: {
        component: action.modal_component || 'DefaultDrawer',
        type: 'drawer',
        props: {
          tileId: context.tileConfig.tileId,
          actionId: action.actionId,
          parameters: context.parameters,
          context: {
            organizationId: context.organization.id,
            userId: context.user.id,
            workspacePath: context.workspacePath
          }
        }
      }
    }
  }
}

async function executeWizardAction(
  action: ResolvedTileAction,
  context: ActionContext
): Promise<ExecutionResult> {
  
  return {
    status: 'success',
    result: {
      type: 'navigation',
      url: `/wizard/${action.actionId}`,
      data: {
        wizardType: action.actionId,
        parameters: context.parameters,
        context: {
          tileId: context.tileConfig.tileId,
          organizationId: context.organization.id,
          userId: context.user.id
        }
      }
    }
  }
}

// ================================================================================
// PERMISSION & VALIDATION
// ================================================================================

interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  details?: any
}

async function checkActionPermissions({
  action,
  context,
  supabase
}: {
  action: ResolvedTileAction
  context: ActionContext
  supabase: any
}): Promise<PermissionCheckResult> {
  
  // Check required permission
  if (action.requiresPermission) {
    const requiredPermission = interpolateTemplate(action.requiresPermission, {
      entity_type: context.tileConfig.entityScope?.include?.[0] || 'entity',
      organization_id: context.organization.id
    })
    
    if (!context.user.permissions.includes(requiredPermission)) {
      return {
        allowed: false,
        reason: `Missing required permission: ${requiredPermission}`,
        details: { requiredPermission, userPermissions: context.user.permissions }
      }
    }
  }

  // Check visibility conditions
  if (action.visibleWhen) {
    const isVisible = evaluateConditionExpression(action.visibleWhen, context)
    if (!isVisible) {
      return {
        allowed: false,
        reason: 'Action not visible based on visibility conditions',
        details: { visibleWhen: action.visibleWhen }
      }
    }
  }

  // Check disabled conditions
  if (action.disabledWhen) {
    const isDisabled = evaluateConditionExpression(action.disabledWhen, context)
    if (isDisabled) {
      return {
        allowed: false,
        reason: 'Action is disabled based on disabled conditions',
        details: { disabledWhen: action.disabledWhen }
      }
    }
  }

  return { allowed: true }
}

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

async function getTileConfigurationAndAction({
  tileId,
  actionId,
  organizationId,
  supabase
}: {
  tileId: string
  actionId: string
  organizationId: string
  supabase: any
}): Promise<{ tileConfig: ResolvedTileConfig | null; action: ResolvedTileAction | null }> {
  
  // This is a simplified version - in production, would call resolved tiles endpoint
  // For now, create a mock configuration with the action
  const mockAction: ResolvedTileAction = {
    actionId,
    label: `Action ${actionId}`,
    icon: 'Play',
    actionType: 'NAVIGATE',
    routePattern: '/{workspace_path}/action/{actionId}',
    isPrimary: actionId === 'primary'
  }

  const mockTileConfig: ResolvedTileConfig = {
    tileId,
    workspaceId: 'mock-workspace',
    organizationId,
    tileCode: 'MOCK_TILE',
    tileName: 'Mock Tile',
    tileType: 'ENTITIES',
    operationCategory: 'MASTER_DATA',
    templateCode: 'MOCK_TEMPLATE',
    templateSmartCode: 'HERA.MOCK.TEMPLATE.v1',
    layout: { position: 1, size: 'medium', resizable: true },
    ui: { icon: 'Database', color: '#6B7280', title: 'Mock Tile' },
    actions: [mockAction],
    stats: []
  }

  return {
    tileConfig: mockTileConfig,
    action: mockAction
  }
}

async function buildActionContext({
  organizationId,
  actorUserId,
  tileConfig,
  action,
  parameters,
  requestContext,
  supabase
}: {
  organizationId: string
  actorUserId: string
  tileConfig: ResolvedTileConfig
  action: ResolvedTileAction
  parameters: Record<string, any>
  requestContext?: any
  supabase: any
}): Promise<ActionContext> {
  
  // TODO: Load actual user and organization data
  return {
    user: {
      id: actorUserId,
      entity_id: actorUserId,
      organization_id: organizationId,
      role: 'admin',
      permissions: ['entity.read', 'entity.create', 'entity.update', 'entity.delete'],
    },
    organization: {
      id: organizationId,
      name: 'Test Organization',
      type: 'BUSINESS',
      plan: 'pro',
      settings: {},
      features: [],
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV as any || 'development',
      FEATURE_FLAGS: {},
    },
    templates: {
      organization_id: organizationId,
      user_id: actorUserId,
      tile_id: tileConfig.tileId,
      action_id: action.actionId,
      ...parameters
    },
    action,
    tileConfig,
    parameters,
    workspacePath: requestContext?.workspacePath,
    entityId: requestContext?.entityId
  }
}

function interpolateTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    return variables[key] || match
  })
}

function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateConfirmationToken(): string {
  return `conf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

async function validateConfirmationToken({
  token,
  actionId,
  tileId,
  actorUserId,
  supabase
}: {
  token: string
  actionId: string
  tileId: string
  actorUserId: string
  supabase: any
}): Promise<boolean> {
  
  // Simple validation - in production would store tokens temporarily
  return token.startsWith('conf_') && token.length > 20
}

async function logActionTelemetry({
  executionId,
  tileId,
  actionId,
  organizationId,
  actorUserId,
  executionTime,
  status,
  supabase
}: {
  executionId: string
  tileId: string
  actionId: string
  organizationId: string
  actorUserId: string
  executionTime: number
  status: string
  supabase: any
}) {
  try {
    await supabase
      .from('universal_transactions')
      .insert({
        transaction_type: 'TILE_ACTION_EXECUTED',
        smart_code: 'HERA.PLATFORM.TELEMETRY.TILE.ACTION.v1',
        organization_id: organizationId,
        source_entity_id: tileId,
        created_by: actorUserId,
        updated_by: actorUserId,
        metadata: {
          execution_id: executionId,
          action_id: actionId,
          execution_time: executionTime,
          status: status
        }
      })
  } catch (error) {
    console.error('Failed to log action telemetry:', error)
    // Don't fail the request for telemetry errors
  }
}