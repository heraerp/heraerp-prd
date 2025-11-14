'use client'

import React from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useCreateProgram } from '@/hooks/use-programs'
import { api } from '@/lib/api-client'
import type { CreateProgramRequest } from '@/types/crm-programs'

interface CreateProgramModalProps {
  isOpen: boolean
  onClose: () => void
}

const AVAILABLE_TAGS = [
  'SNAP',
  'HOUSING',
  'HEALTHCARE',
  'EDUCATION',
  'VETERANS',
  'YOUTH',
  'SENIORS',
  'WORKFORCE',
  'ENVIRONMENT',
  'TRANSPORTATION'
]

export function CreateProgramModal({ isOpen, onClose }: CreateProgramModalProps) {
  const [formData, setFormData] = useState<CreateProgramRequest>({
    code: '',
    title: '',
    description: '',
    budget: undefined,
    tags: [],
    sponsor_org_id: '',
    status: 'active'
  })
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

  const createProgram = useCreateProgram()
  const orgId = api.getOrgId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgId) return

    await createProgram.mutateAsync({
      ...formData,
      tags: Array.from(selectedTags)
    })

    onClose()
    // Reset form
    setFormData({
      code: '',
      title: '',
      description: '',
      budget: undefined,
      tags: [],
      sponsor_org_id: '',
      status: 'active'
    })
    setSelectedTags(new Set())
  }

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags)
    if (newTags.has(tag)) {
      newTags.delete(tag)
    } else {
      newTags.add(tag)
    }
    setSelectedTags(newTags)
  }

  const generateCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    setFormData(prev => ({ ...prev, code: `PROG-${timestamp}-${random}` }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] bg-panel border-border overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold text-text-100">
            Create New Program
          </DialogTitle>
          <DialogDescription className="text-text-500">
            Define a new grant program with funding opportunities
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto flex-1 px-1">
          {/* Program Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Program Code</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={formData.code}
                onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="PROG-2024-SNAP"
                required
                className="bg-panel-alt border-border"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateCode}
                className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
              >
                Generate
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Program Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Supplemental Nutrition Assistance Program"
              required
              className="bg-panel-alt border-border"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the program's goals and objectives..."
              rows={3}
              className="bg-panel-alt border-border"
            />
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget Amount</Label>
            <Input
              id="budget"
              type="number"
              value={formData.budget || ''}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  budget: e.target.value ? parseFloat(e.target.value) : undefined
                }))
              }
              placeholder="1000000"
              min="0"
              step="1000"
              className="bg-panel-alt border-border"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={value =>
                setFormData(prev => ({
                  ...prev,
                  status: value as 'active' | 'paused' | 'archived'
                }))
              }
            >
              <SelectTrigger className="bg-panel-alt border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Program Tags</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.has(tag) ? 'default' : 'outline'}
                  className={
                    selectedTags.has(tag)
                      ? 'bg-secondary text-white border-secondary cursor-pointer'
                      : 'cursor-pointer hover:bg-secondary/10'
                  }
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
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
              disabled={createProgram.isPending || !formData.code || !formData.title}
              className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
            >
              {createProgram.isPending ? 'Creating...' : 'Create Program'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
