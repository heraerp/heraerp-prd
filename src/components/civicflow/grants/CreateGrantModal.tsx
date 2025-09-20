'use client'

import { useState } from 'react'

import { Plus, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'

import type { CreateGrantModalProps } from './props'
import type {
  CreateGrantApplicationRequest,
  CreateGrantApplicationRequestSchema
} from '@/contracts/crm-grants'
import { exact } from '@/utils/exact'
import { useCreateGrant } from '@/hooks/use-grants'

export function CreateGrantModal(props: CreateGrantModalProps): JSX.Element {
  // Validate props at runtime
  const { isOpen, onClose } = exact<CreateGrantModalProps>()(props)

  const [formData, setFormData] = useState<CreateGrantApplicationRequest>({
    applicant: {
      type: 'constituent',
      id: ''
    },
    round_id: '',
    summary: '',
    amount_requested: undefined,
    tags: [],
    start_run: false
  })
  const [tagInput, setTagInput] = useState('')
  const createGrant = useCreateGrant()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!formData.applicant.id || !formData.round_id) return

    try {
      // Validate form data with Zod before submission
      const validatedData = CreateGrantApplicationRequestSchema.parse(formData)
      await createGrant.mutateAsync(validatedData)

      // Reset form with exact type safety
      const resetFormData = exact<CreateGrantApplicationRequest>()({
        applicant: {
          type: 'constituent',
          id: ''
        },
        round_id: '',
        summary: '',
        amount_requested: undefined,
        tags: [],
        start_run: false
      })
      setFormData(resetFormData)
      setTagInput('')
      onClose()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleAddTag = (): void => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string): void => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-panel border-border">
        <DialogHeader>
          <DialogTitle className="text-text-100">Create Grant Application</DialogTitle>
          <DialogDescription className="text-text-300">
            Submit a new grant application for review and processing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Applicant Type */}
            <div className="space-y-2">
              <Label className="text-text-200">Applicant Type</Label>
              <Select
                value={formData.applicant.type}
                onValueChange={value =>
                  setFormData(prev => ({
                    ...prev,
                    applicant: { ...prev.applicant, type: value as 'constituent' | 'ps_org' }
                  }))
                }
              >
                <SelectTrigger className="bg-bg border-border">
                  <SelectValue placeholder="Select applicant type" />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="constituent" className="hera-select-item">
                    Constituent
                  </SelectItem>
                  <SelectItem value="ps_org" className="hera-select-item">
                    Partner Organization
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Applicant ID */}
            <div className="space-y-2">
              <Label className="text-text-200">Applicant ID</Label>
              <Input
                placeholder="Enter applicant ID..."
                value={formData.applicant.id}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    applicant: { ...prev.applicant, id: e.target.value }
                  }))
                }
                className="bg-bg border-border"
                required
              />
            </div>
          </div>

          {/* Grant Round */}
          <div className="space-y-2">
            <Label className="text-text-200">Grant Round ID</Label>
            <Input
              placeholder="Enter grant round ID..."
              value={formData.round_id}
              onChange={e => setFormData(prev => ({ ...prev, round_id: e.target.value }))}
              className="bg-bg border-border"
              required
            />
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label className="text-text-200">Summary (Optional)</Label>
            <Textarea
              placeholder="Brief description of the grant application..."
              value={formData.summary}
              onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              className="bg-bg border-border min-h-[100px]"
            />
          </div>

          {/* Amount Requested */}
          <div className="space-y-2">
            <Label className="text-text-200">Amount Requested (Optional)</Label>
            <Input
              type="number"
              placeholder="Enter amount..."
              value={formData.amount_requested || ''}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  amount_requested: e.target.value ? Number(e.target.value) : undefined
                }))
              }
              className="bg-bg border-border"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-text-200">Tags (Optional)</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-bg border-border"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="border-border hover:bg-accent-soft"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Start Workflow */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="start_run"
              checked={formData.start_run}
              onChange={e => setFormData(prev => ({ ...prev, start_run: e.target.checked }))}
              className="rounded border-border"
            />
            <label htmlFor="start_run" className="text-sm text-text-200">
              Start workflow process immediately
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border hover:bg-accent-soft"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGrant.isPending || !formData.applicant.id || !formData.round_id}
              className="bg-accent hover:bg-accent/90 text-accent-fg"
            >
              {createGrant.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
