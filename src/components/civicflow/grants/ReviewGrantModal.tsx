'use client'

import { useState } from 'react'

import { CheckCircle, XCircle, Award, Loader2, FileText, DollarSign } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

import type { ReviewGrantModalProps } from './props'
import type {
  GrantReviewAction,
  ReviewGrantRequest,
  ReviewGrantRequestSchema
} from '@/contracts/crm-grants'
import { exact } from '@/utils/exact'
import { useGrant, useReviewGrant } from '@/hooks/use-grants'

const ACTION_CONFIG = {
  approve: {
    label: 'Approve',
    icon: CheckCircle,
    color: 'text-green-600',
    buttonClass: 'bg-green-600 hover:bg-green-700'
  },
  reject: {
    label: 'Reject',
    icon: XCircle,
    color: 'text-red-600',
    buttonClass: 'bg-red-600 hover:bg-red-700'
  },
  award: {
    label: 'Award',
    icon: Award,
    color: 'text-purple-600',
    buttonClass: 'bg-purple-600 hover:bg-purple-700'
  }
} as const

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  awarded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  closed: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
} as const

export function ReviewGrantModal(props: ReviewGrantModalProps): JSX.Element {
  // Validate props at runtime with exact type checking
  const { isOpen, onClose, applicationId } = exact<ReviewGrantModalProps>()(props)
  const { data: application, isLoading } = useGrant(applicationId)
  const reviewGrant = useReviewGrant(applicationId)

  const [formData, setFormData] = useState<ReviewGrantRequest>({
    action: 'approve',
    amount_awarded: undefined,
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      // Validate form data with Zod before submission
      const validatedData = ReviewGrantRequestSchema.parse(formData)
      await reviewGrant.mutateAsync(validatedData)

      // Reset form with exact type safety
      const resetFormData = exact<ReviewGrantRequest>()({
        action: 'approve',
        amount_awarded: undefined,
        notes: ''
      })
      setFormData(resetFormData)
      onClose()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-panel border-border max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-text-100">Review Grant Application</DialogTitle>
          <DialogDescription className="text-text-300">
            Review and make a decision on this grant application.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : application ? (
            <div className="space-y-6">
              {/* Application Overview */}
              <Card className="bg-panel-alt border-border">
                <CardHeader>
                  <CardTitle className="text-lg text-text-100">Application Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-text-100 mb-2">Applicant</h4>
                      <div className="space-y-1">
                        <p className="text-text-200">{application.applicant.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {application.applicant.type === 'constituent'
                            ? 'Constituent'
                            : 'Partner Organization'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-text-100 mb-2">Program & Round</h4>
                      <div className="space-y-1">
                        <p className="text-text-200">{application.program.title}</p>
                        <p className="text-sm text-text-300">
                          Round: {application.round.round_code}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-text-100 mb-2">Status</h4>
                      <Badge className={STATUS_COLORS[application.status]}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-medium text-text-100 mb-2">Created</h4>
                      <p className="text-text-200">{formatDate(application.created_at)}</p>
                    </div>
                  </div>

                  {/* Financial Information */}
                  {(application.amount_requested || application.amount_awarded) && (
                    <div className="space-y-2 pt-4 border-t border-border">
                      <h4 className="font-medium text-text-100">Financial Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {application.amount_requested && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-text-400" />
                            <span className="text-text-300">Requested:</span>
                            <span className="text-text-100 font-medium">
                              {formatCurrency(application.amount_requested)}
                            </span>
                          </div>
                        )}
                        {application.amount_awarded && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-accent" />
                            <span className="text-text-300">Awarded:</span>
                            <span className="text-accent font-medium">
                              {formatCurrency(application.amount_awarded)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {application.summary && (
                    <div className="space-y-2 pt-4 border-t border-border">
                      <h4 className="font-medium text-text-100">Summary</h4>
                      <p className="text-text-200">{application.summary}</p>
                    </div>
                  )}

                  {/* Scoring */}
                  {application.scoring && (
                    <div className="space-y-2 pt-4 border-t border-border">
                      <h4 className="font-medium text-text-100">Scoring</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-text-100">
                            {application.scoring.need}
                          </p>
                          <p className="text-sm text-text-300">Need</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-text-100">
                            {application.scoring.impact}
                          </p>
                          <p className="text-sm text-text-300">Impact</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-text-100">
                            {application.scoring.feasibility}
                          </p>
                          <p className="text-sm text-text-300">Feasibility</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-accent">
                            {application.scoring.total}
                          </p>
                          <p className="text-sm text-text-300">Total</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {application.tags && application.tags.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-border">
                      <h4 className="font-medium text-text-100">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {application.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Step */}
                  {application.pending_step && (
                    <div className="space-y-2 pt-4 border-t border-border">
                      <h4 className="font-medium text-text-100">Workflow Status</h4>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-500" />
                        <span className="text-text-200">
                          Step: {application.pending_step.step_name}
                        </span>
                        {application.pending_step.awaiting_input && (
                          <Badge variant="outline" className="text-xs">
                            Awaiting Input
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Review Form */}
              <Card className="bg-panel-alt border-border">
                <CardHeader>
                  <CardTitle className="text-lg text-text-100">Review Decision</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Action Selection */}
                    <div className="space-y-2">
                      <Label className="text-text-200">Decision</Label>
                      <Select
                        value={formData.action}
                        onValueChange={value =>
                          setFormData(prev => ({
                            ...prev,
                            action: value as GrantReviewAction
                          }))
                        }
                      >
                        <SelectTrigger className="bg-panel-alt border-border text-text-100">
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent className="bg-panel border-border">
                          {Object.entries(ACTION_CONFIG).map(([action, config]) => {
                            const Icon = config.icon
                            return (
                              <SelectItem key={action} value={action} className="hera-select-item">
                                <div className="flex items-center gap-2">
                                  <Icon className={`h-4 w-4 ${config.color}`} />
                                  {config.label}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount Awarded (for award action) */}
                    {formData.action === 'award' && (
                      <div className="space-y-2">
                        <Label className="text-text-200">Amount Awarded</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount to award..."
                          value={formData.amount_awarded || ''}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              amount_awarded: e.target.value ? Number(e.target.value) : undefined
                            }))
                          }
                          className="bg-panel-alt border-border text-text-100"
                        />
                      </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label className="text-text-200">Notes (Optional)</Label>
                      <Textarea
                        placeholder="Add any notes about this decision..."
                        value={formData.notes}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="bg-panel-alt border-border text-text-100 min-h-[100px]"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={reviewGrant.isPending}
                        className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
                      >
                        {reviewGrant.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {ACTION_CONFIG[formData.action].label} Application
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-300">Application not found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
