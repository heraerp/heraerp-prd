/**
 * HERA UIKit - ActionBar
 * Generic action execution component
 */

'use client'

import React from 'react'
import { Play, Check, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAction } from '@/lib/ui-binder'
import type { ActionConfig } from '@/lib/ui-binder/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

interface ActionBarProps {
  actions: ActionConfig[]
  context: Record<string, any>
  onActionComplete?: (actionKey: string, result: any) => void
  onActionError?: (actionKey: string, error: any) => void
  className?: string
}

export function ActionBar({
  actions,
  context,
  onActionComplete,
  onActionError,
  className = ''
}: ActionBarProps) {
  const [pendingAction, setPendingAction] = useState<ActionConfig | null>(null)
  const [executingAction, setExecutingAction] = useState<string | null>(null)
  const [lastSuccess, setLastSuccess] = useState<string | null>(null)

  const { executeAction, isLoading } = useAction()
  const { toast } = useToast()

  const handleActionClick = (action: ActionConfig) => {
    if (action.confirm) {
      setPendingAction(action)
    } else {
      executeActionInternal(action)
    }
  }

  const handleConfirmAction = () => {
    if (pendingAction) {
      executeActionInternal(pendingAction)
      setPendingAction(null)
    }
  }

  const executeActionInternal = async (action: ActionConfig) => {
    try {
      setExecutingAction(action.key)
      setLastSuccess(null)

      // Build payload using action configuration
      const payload = action.buildPayload(context)

      // Execute the action
      const result = await executeAction({
        smart_code: payload.smart_code,
        payload
      })

      // Success handling
      setLastSuccess(action.key)
      onActionComplete?.(action.key, result)

      toast({
        title: 'Action Completed',
        description: `${action.label} executed successfully`,
        variant: 'default'
      })

      // Clear success indicator after 3 seconds
      setTimeout(() => {
        setLastSuccess(null)
      }, 3000)
    } catch (error) {
      console.error(`Action ${action.key} failed:`, error)
      onActionError?.(action.key, error)

      toast({
        title: 'Action Failed',
        description: `Failed to execute ${action.label}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      })
    } finally {
      setExecutingAction(null)
    }
  }

  if (actions.length === 0) {
    return null
  }

  return (
    <>
      <div className={`flex items-center space-x-3 ${className}`}>
        {actions.map(action => {
          const isExecuting = executingAction === action.key
          const wasSuccessful = lastSuccess === action.key
          const isDisabled = isLoading || isExecuting

          return (
            <Button
              key={action.key}
              variant={action.variant || 'default'}
              size="sm"
              disabled={isDisabled}
              onClick={() => handleActionClick(action)}
              className="flex items-center space-x-2 min-w-[100px] relative"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : wasSuccessful ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>{action.label}</span>
                </>
              )}
            </Button>
          )
        })}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pendingAction} onOpenChange={() => setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>Confirm Action</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.confirmMessage ||
                `Are you sure you want to execute "${pendingAction?.label}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Helper to create common action configurations
export const ActionBarPresets = {
  /**
   * Create a simple action configuration
   */
  createAction: (
    key: string,
    label: string,
    smart_code: string,
    buildPayload: (context: any) => any,
    options?: {
      variant?: 'default' | 'destructive' | 'outline' | 'secondary'
      confirm?: boolean
      confirmMessage?: string
    }
  ): ActionConfig => ({
    key,
    label,
    buildPayload: context => ({
      smart_code,
      ...buildPayload(context)
    }),
    ...options
  }),

  /**
   * Create a sale action
   */
  sale: (smart_code: string): ActionConfig => ({
    key: 'sale',
    label: 'Process Sale',
    variant: 'default',
    buildPayload: ctx => ({
      organization_id: ctx.orgId,
      transaction_type: 'sale',
      smart_code,
      transaction_date: new Date().toISOString(),
      lines: ctx.lines || []
    })
  }),

  /**
   * Create a purchase action
   */
  purchase: (smart_code: string): ActionConfig => ({
    key: 'purchase',
    label: 'Process Purchase',
    variant: 'secondary',
    buildPayload: ctx => ({
      organization_id: ctx.orgId,
      transaction_type: 'purchase',
      smart_code,
      transaction_date: new Date().toISOString(),
      lines: ctx.lines || []
    })
  }),

  /**
   * Create a delete action with confirmation
   */
  delete: (smart_code: string): ActionConfig => ({
    key: 'delete',
    label: 'Delete',
    variant: 'destructive',
    confirm: true,
    confirmMessage: 'This will permanently delete the record. Are you sure?',
    buildPayload: ctx => ({
      organization_id: ctx.orgId,
      transaction_type: 'delete',
      smart_code,
      transaction_date: new Date().toISOString(),
      entity_id: ctx.entityId
    })
  })
}
