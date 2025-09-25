/**
 * Case Actions Component
 * Provides action buttons and modals for case operations
 */

import React, { useState } from 'react'
import { CheckCircle, Edit, Shield, AlertTriangle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { JsonSchemaForm } from '@/components/forms/JsonSchemaForm'
import {
  useActionApprove,
  useActionVary,
  useActionWaive,
  useActionBreach,
  useActionClose
} from '@/hooks/use-cases'
import type { CaseActionsProps, CaseActionType } from '@/types/cases'

// Import schemas
import approveSchema from '@/lib/schemas/cases/action_approve.schema.json'
import varySchema from '@/lib/schemas/cases/action_vary.schema.json'
import waiveSchema from '@/lib/schemas/cases/action_waive.schema.json'
import breachSchema from '@/lib/schemas/cases/action_breach.schema.json'
import closeSchema from '@/lib/schemas/cases/action_close.schema.json'

const actionConfig = {
  approve: {
    title: 'Approve Case',
    icon: CheckCircle,
    color: 'text-green-600',
    schema: approveSchema
  },
  vary: {
    title: 'Request Variation',
    icon: Edit,
    color: 'text-yellow-600',
    schema: varySchema
  },
  waive: {
    title: 'Apply Waiver',
    icon: Shield,
    color: 'text-purple-600',
    schema: waiveSchema
  },
  breach: {
    title: 'Record Breach',
    icon: AlertTriangle,
    color: 'text-red-600',
    schema: breachSchema
  },
  close: {
    title: 'Close Case',
    icon: XCircle,
    color: 'text-gray-600',
    schema: closeSchema
  }
}

export function CaseActions({ caseId, status, onActionComplete }: CaseActionsProps) {
  const [activeAction, setActiveAction] = useState<CaseActionType | null>(null)

  // Mutations
  const approveMutation = useActionApprove(caseId)
  const varyMutation = useActionVary(caseId)
  const waiveMutation = useActionWaive(caseId)
  const breachMutation = useActionBreach(caseId)
  const closeMutation = useActionClose(caseId)

  const mutations = {
    approve: approveMutation,
    vary: varyMutation,
    waive: waiveMutation,
    breach: breachMutation,
    close: closeMutation
  }

  const handleAction = (action: CaseActionType) => {
    setActiveAction(action)
  }

  const handleSubmit = async (data: any) => {
    if (!activeAction) return

    try {
      await mutations[activeAction].mutateAsync(data)
      setActiveAction(null)
      if (onActionComplete) {
        onActionComplete(activeAction)
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleCancel = () => {
    setActiveAction(null)
  }

  const isLoading = Object.values(mutations).some(m => m.isPending)

  // Available actions based on status
  const availableActions: CaseActionType[] = []
  if (status === 'new' || status === 'in_review') {
    availableActions.push('approve')
  }
  if (status !== 'closed') {
    availableActions.push('vary', 'waive', 'breach', 'close')
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {availableActions.map(action => {
          const config = actionConfig[action]
          const Icon = config.icon

          return (
            <Button
              key={action}
              variant="outline"
              size="sm"
              onClick={() => handleAction(action)}
              disabled={isLoading}
              className={config.color}
            >
              <Icon className="mr-2 h-4 w-4" />
              {config.title}
            </Button>
          )
        })}
      </div>

      {/* Action Dialog */}
      {activeAction && (
        <Dialog open={true} onOpenChange={() => setActiveAction(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = actionConfig[activeAction].icon
                  return (
                    <>
                      <Icon className={`h-5 w-5 ${actionConfig[activeAction].color}`} />
                      {actionConfig[activeAction].title}
                    </>
                  )
                })()}
              </DialogTitle>
            </DialogHeader>

            <JsonSchemaForm
              schema={actionConfig[activeAction].schema}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              submitLabel={
                mutations[activeAction].isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Submit'
                )
              }
              disabled={mutations[activeAction].isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
