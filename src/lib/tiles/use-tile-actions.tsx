/**
 * HERA Universal Tile System - React Hook for Tile Actions
 * Provides action execution with confirmation, permissions, and telemetry
 * Smart Code: HERA.PLATFORM.UI.HOOK.TILE_ACTIONS.v1
 */

import React, { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiV2 } from '@/lib/client/fetchV2'
import { ResolvedTileAction } from '@/lib/tiles/resolved-tile-config'

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
  
  result?: {
    type: 'navigation' | 'api_response' | 'modal' | 'file_download'
    data?: any
    url?: string
    redirectTo?: string
  }
  
  confirmation?: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    token: string
  }
  
  error?: {
    code: string
    message: string
    details?: any
  }
  
  executionTime: number
  executedAt: string
  actorUserId: string
}

export interface UseTileActionsOptions {
  tileId: string
  organizationId: string
  workspacePath?: string
  onActionComplete?: (response: ActionExecutionResponse) => void
  onConfirmationRequired?: (confirmation: ActionExecutionResponse['confirmation']) => void
  onError?: (error: ActionExecutionResponse['error']) => void
}

export interface UseTileActionsResult {
  executeAction: (
    actionId: string, 
    options?: ActionExecutionRequest
  ) => Promise<ActionExecutionResponse>
  
  isExecuting: boolean
  lastExecution: ActionExecutionResponse | null
  confirmPendingAction: (token: string) => Promise<ActionExecutionResponse>
  cancelPendingAction: () => void
  
  // Convenience methods for common actions
  navigate: (actionId: string, parameters?: Record<string, any>) => Promise<void>
  callApi: (actionId: string, parameters?: Record<string, any>) => Promise<any>
  openModal: (actionId: string, parameters?: Record<string, any>) => Promise<void>
}

interface PendingConfirmation {
  actionId: string
  originalRequest: ActionExecutionRequest
  confirmation: ActionExecutionResponse['confirmation']
}

// ================================================================================
// MAIN HOOK
// ================================================================================

/**
 * Hook to execute tile actions with full lifecycle management
 */
export function useTileActions({
  tileId,
  organizationId,
  workspacePath,
  onActionComplete,
  onConfirmationRequired,
  onError
}: UseTileActionsOptions): UseTileActionsResult {
  
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [lastExecution, setLastExecution] = useState<ActionExecutionResponse | null>(null)
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null)
  
  // Main action execution mutation
  const executeMutation = useMutation({
    mutationFn: async ({
      actionId,
      request
    }: {
      actionId: string
      request: ActionExecutionRequest
    }) => {
      const response = await apiV2.post<ActionExecutionResponse>(
        `/tiles/${tileId}/actions/${actionId}`,
        {
          ...request,
          context: {
            ...request.context,
            workspacePath
          }
        }
      )
      return response.data
    },
    onSuccess: (response) => {
      setLastExecution(response)
      handleActionResponse(response)
    },
    onError: (error) => {
      console.error('Action execution failed:', error)
      const errorDetails = {
        code: 'EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }
      onError?.(errorDetails)
    }
  })

  // Handle action response based on status
  const handleActionResponse = useCallback((response: ActionExecutionResponse) => {
    switch (response.status) {
      case 'success':
        handleSuccessResponse(response)
        onActionComplete?.(response)
        break
      
      case 'confirmation_required':
        if (response.confirmation) {
          setPendingConfirmation({
            actionId: response.actionId,
            originalRequest: executeMutation.variables?.request || {},
            confirmation: response.confirmation
          })
          onConfirmationRequired?.(response.confirmation)
        }
        break
      
      case 'error':
        if (response.error) {
          onError?.(response.error)
        }
        break
      
      case 'redirect':
        if (response.result?.redirectTo) {
          router.push(response.result.redirectTo)
        }
        break
    }
  }, [router, onActionComplete, onConfirmationRequired, onError, executeMutation.variables])

  // Handle successful action responses
  const handleSuccessResponse = useCallback((response: ActionExecutionResponse) => {
    if (!response.result) return

    switch (response.result.type) {
      case 'navigation':
        if (response.result.redirectTo || response.result.url) {
          const url = response.result.redirectTo || response.result.url!
          router.push(url)
        }
        break
      
      case 'modal':
        // Modal handling would be implemented by the consumer
        // This hook just provides the data
        break
      
      case 'api_response':
        // API response data is available in response.result.data
        break
      
      case 'file_download':
        if (response.result.url) {
          // Trigger file download
          const link = document.createElement('a')
          link.href = response.result.url
          link.download = 'download'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        break
    }

    // Invalidate related queries after successful actions
    queryClient.invalidateQueries({
      queryKey: ['tile-stats', tileId]
    })
    queryClient.invalidateQueries({
      queryKey: ['resolved-tiles']
    })
  }, [router, queryClient, tileId])

  // Execute an action
  const executeAction = useCallback(async (
    actionId: string,
    options: ActionExecutionRequest = {}
  ): Promise<ActionExecutionResponse> => {
    const response = await executeMutation.mutateAsync({
      actionId,
      request: options
    })
    return response
  }, [executeMutation])

  // Confirm pending action
  const confirmPendingAction = useCallback(async (token: string): Promise<ActionExecutionResponse> => {
    if (!pendingConfirmation) {
      throw new Error('No pending confirmation')
    }

    const response = await executeMutation.mutateAsync({
      actionId: pendingConfirmation.actionId,
      request: {
        ...pendingConfirmation.originalRequest,
        context: {
          ...pendingConfirmation.originalRequest.context,
          confirmationToken: token
        }
      }
    })

    setPendingConfirmation(null)
    return response
  }, [pendingConfirmation, executeMutation])

  // Cancel pending action
  const cancelPendingAction = useCallback(() => {
    setPendingConfirmation(null)
  }, [])

  // Convenience methods
  const navigate = useCallback(async (actionId: string, parameters?: Record<string, any>) => {
    await executeAction(actionId, { parameters })
  }, [executeAction])

  const callApi = useCallback(async (actionId: string, parameters?: Record<string, any>): Promise<any> => {
    const response = await executeAction(actionId, { parameters })
    return response.result?.data
  }, [executeAction])

  const openModal = useCallback(async (actionId: string, parameters?: Record<string, any>) => {
    await executeAction(actionId, { parameters })
  }, [executeAction])

  return {
    executeAction,
    isExecuting: executeMutation.isPending,
    lastExecution,
    confirmPendingAction,
    cancelPendingAction,
    navigate,
    callApi,
    openModal
  }
}

// ================================================================================
// ACTION HELPERS
// ================================================================================

/**
 * Hook for a specific action with convenience methods
 */
export function useTileAction({
  tileId,
  organizationId,
  actionId,
  action,
  workspacePath
}: {
  tileId: string
  organizationId: string
  actionId: string
  action: ResolvedTileAction
  workspacePath?: string
}) {
  
  const {
    executeAction,
    isExecuting,
    lastExecution,
    confirmPendingAction,
    cancelPendingAction
  } = useTileActions({
    tileId,
    organizationId,
    workspacePath
  })

  const execute = useCallback(async (parameters?: Record<string, any>) => {
    return await executeAction(actionId, { parameters })
  }, [executeAction, actionId])

  const isLastExecution = lastExecution?.actionId === actionId

  return {
    execute,
    isExecuting: isExecuting && isLastExecution,
    lastExecution: isLastExecution ? lastExecution : null,
    confirmPendingAction,
    cancelPendingAction,
    action
  }
}

/**
 * Hook for batch action execution
 */
export function useBatchTileActions({
  actions,
  tileId,
  organizationId,
  workspacePath
}: {
  actions: Array<{ actionId: string; parameters?: Record<string, any> }>
  tileId: string
  organizationId: string
  workspacePath?: string
}) {
  
  const { executeAction } = useTileActions({
    tileId,
    organizationId,
    workspacePath
  })

  const [results, setResults] = useState<ActionExecutionResponse[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  const executeBatch = useCallback(async (): Promise<ActionExecutionResponse[]> => {
    setIsExecuting(true)
    setResults([])
    
    try {
      const batchResults: ActionExecutionResponse[] = []
      
      // Execute actions sequentially to avoid overwhelming the server
      for (const action of actions) {
        try {
          const result = await executeAction(action.actionId, {
            parameters: action.parameters
          })
          batchResults.push(result)
        } catch (error) {
          // Continue with other actions even if one fails
          console.error(`Batch action ${action.actionId} failed:`, error)
        }
      }
      
      setResults(batchResults)
      return batchResults
    } finally {
      setIsExecuting(false)
    }
  }, [actions, executeAction])

  return {
    executeBatch,
    isExecuting,
    results,
    successCount: results.filter(r => r.status === 'success').length,
    errorCount: results.filter(r => r.status === 'error').length
  }
}

// ================================================================================
// CONFIRMATION DIALOG UTILITIES
// ================================================================================

/**
 * Utility function to create a confirmation dialog
 */
export function createConfirmationDialog({
  confirmation,
  onConfirm,
  onCancel
}: {
  confirmation: NonNullable<ActionExecutionResponse['confirmation']>
  onConfirm: (token: string) => void
  onCancel: () => void
}) {
  return {
    title: confirmation.title,
    message: confirmation.message,
    confirmText: confirmation.confirmText || 'Confirm',
    cancelText: confirmation.cancelText || 'Cancel',
    onConfirm: () => onConfirm(confirmation.token),
    onCancel
  }
}

// ================================================================================
// EXAMPLE USAGE COMPONENTS
// ================================================================================

/**
 * Example: Action button component
 */
export function ExampleTileActionButton({
  tileId,
  organizationId,
  action,
  workspacePath,
  parameters
}: {
  tileId: string
  organizationId: string
  action: ResolvedTileAction
  workspacePath?: string
  parameters?: Record<string, any>
}) {
  
  const { execute, isExecuting, action: resolvedAction } = useTileAction({
    tileId,
    organizationId,
    actionId: action.actionId,
    action,
    workspacePath
  })

  const handleClick = async () => {
    try {
      await execute(parameters)
    } catch (error) {
      console.error('Action failed:', error)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isExecuting}
      className={`
        px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${resolvedAction.isPrimary 
          ? 'bg-blue-600 text-white hover:bg-blue-700' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {isExecuting ? 'Executing...' : action.label}
    </button>
  )
}

/**
 * Example: Actions menu component
 */
export function ExampleTileActionsMenu({
  tileId,
  organizationId,
  actions,
  workspacePath
}: {
  tileId: string
  organizationId: string
  actions: ResolvedTileAction[]
  workspacePath?: string
}) {
  
  const { executeAction, isExecuting } = useTileActions({
    tileId,
    organizationId,
    workspacePath
  })

  return (
    <div className="space-y-1">
      {actions.map(action => (
        <button
          key={action.actionId}
          onClick={() => executeAction(action.actionId)}
          disabled={isExecuting}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <span>{action.label}</span>
            {action.isPrimary && (
              <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                Primary
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

// Export everything
export default useTileActions