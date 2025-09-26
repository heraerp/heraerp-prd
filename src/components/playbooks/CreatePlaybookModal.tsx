'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useCreatePlaybookNew } from '@/hooks/use-playbooks'
import type { PlaybookCategory, CreatePlaybookPayload } from '@/types/playbooks'

interface CreatePlaybookModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreatePlaybookModal({ open, onOpenChange, onSuccess }: CreatePlaybookModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const createMutation = useCreatePlaybookNew()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'constituent' as PlaybookCategory,
    status: 'draft' as const
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const payload: CreatePlaybookPayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        status: formData.status,
        steps: [], // Start with empty steps
        service_ids: [],
        program_ids: []
      }

      const result = await createMutation.mutateAsync(payload)

      toast({
        title: 'Playbook Created',
        description: 'Your new playbook has been created successfully'
      })

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'constituent',
        status: 'draft'
      })
      setErrors({})

      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      } else {
        onOpenChange(false)
      }

      // Navigate to edit the new playbook
      router.push(`/civicflow/playbooks/${result.id}/edit`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create playbook',
        variant: 'destructive'
      })
    }
  }

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      category: 'constituent',
      status: 'draft'
    })
    setErrors({})
    onOpenChange(false)
  }

  const categoryOptions = [
    { value: 'constituent', label: 'Constituent Services' },
    { value: 'grants', label: 'Grants Management' },
    { value: 'service', label: 'Service Delivery' },
    { value: 'case', label: 'Case Management' },
    { value: 'outreach', label: 'Outreach' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Playbook</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Constituent Intake Process"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={value =>
                  setFormData({ ...formData, category: value as PlaybookCategory })
                }
              >
                <SelectTrigger
                  id="category"
                  className={errors.category ? 'border-destructive' : ''}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this playbook does..."
                rows={4}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select
                value={formData.status}
                onValueChange={value =>
                  setFormData({ ...formData, status: value as 'draft' | 'active' })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (recommended)</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Draft playbooks can be edited and tested before activation
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Playbook'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
