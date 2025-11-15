'use client'

import React, { useState } from 'react'
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
import { BRANCH_PRESET } from '@/hooks/entityPresets'

interface BranchFormProps {
  entity?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export function BranchForm({ entity, onSubmit, onCancel }: BranchFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    entity_name: entity?.entity_name || '',
    entity_code: entity?.entity_code || entity?.dynamic_fields?.code?.value || '',
    smart_code: BRANCH_PRESET.smart_code,
    dynamic_fields: {
      code: entity?.dynamic_fields?.code?.value || '',
      address: entity?.dynamic_fields?.address?.value || '',
      phone: entity?.dynamic_fields?.phone?.value || '',
      timezone: entity?.dynamic_fields?.timezone?.value || 'Asia/Dubai',
      status: entity?.dynamic_fields?.status?.value || 'active'
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const submitData = {
        entity_type: 'BRANCH',
        entity_name: formData.entity_name,
        entity_code: formData.dynamic_fields.code,
        smart_code: formData.smart_code,
        dynamic_fields: Object.entries(formData.dynamic_fields).reduce((acc, [key, value]) => {
          const field = BRANCH_PRESET.dynamicFields.find(f => f.name === key)
          if (field && value) {
            acc[key] = {
              value,
              type: field.type,
              smart_code: field.smart_code
            }
          }
          return acc
        }, {} as any)
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        <div>
          <Label htmlFor="entity_name">Branch Name</Label>
          <Input
            id="entity_name"
            value={formData.entity_name}
            onChange={e => setFormData({ ...formData, entity_name: e.target.value })}
            placeholder="e.g., Downtown Branch"
            required
          />
        </div>

        <div>
          <Label htmlFor="code">Branch Code</Label>
          <Input
            id="code"
            value={formData.dynamic_fields.code}
            onChange={e =>
              setFormData({
                ...formData,
                dynamic_fields: { ...formData.dynamic_fields, code: e.target.value }
              })
            }
            placeholder="BR-001"
            required
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.dynamic_fields.status}
            onValueChange={value =>
              setFormData({
                ...formData,
                dynamic_fields: { ...formData.dynamic_fields, status: value }
              })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Location Details</h3>

        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.dynamic_fields.address}
            onChange={e =>
              setFormData({
                ...formData,
                dynamic_fields: { ...formData.dynamic_fields, address: e.target.value }
              })
            }
            placeholder="123 Main St, City, State ZIP"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.dynamic_fields.phone}
            onChange={e =>
              setFormData({
                ...formData,
                dynamic_fields: { ...formData.dynamic_fields, phone: e.target.value }
              })
            }
            placeholder="+971 4 123 4567"
          />
        </div>

        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            value={formData.dynamic_fields.timezone}
            onValueChange={value =>
              setFormData({
                ...formData,
                dynamic_fields: { ...formData.dynamic_fields, timezone: value }
              })
            }
          >
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asia/Dubai">Asia/Dubai (UAE)</SelectItem>
              <SelectItem value="America/New_York">America/New_York</SelectItem>
              <SelectItem value="America/Chicago">America/Chicago</SelectItem>
              <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
              <SelectItem value="Europe/London">Europe/London</SelectItem>
              <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
              <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
              <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : entity ? 'Update Branch' : 'Create Branch'}
        </Button>
      </div>
    </form>
  )
}
