// ================================================================================
// RULE EDITOR DIALOG COMPONENT
// Smart Code: HERA.UI.FINANCE.RULE_EDITOR_DIALOG.V1
// Modal dialog for editing Finance DNA posting rules
// ================================================================================

'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Save, X, Info } from 'lucide-react'
import { PostingRule, Mapping } from '@/lib/schemas/financeRules'
import { RuleMappingsTable } from './RuleMappingsTable'
import { JsonView } from '@/components/common/JsonView'

interface RuleEditorDialogProps {
  rule: PostingRule | null
  isOpen: boolean
  onClose: () => void
  onSave: (rule: PostingRule) => void
  isSaving?: boolean
  mode?: 'edit' | 'create'
}

export function RuleEditorDialog({
  rule,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  mode = 'edit'
}: RuleEditorDialogProps) {
  const [formData, setFormData] = React.useState<PostingRule | null>(null)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [mappingErrors, setMappingErrors] = React.useState<Record<number, string>>({})
  const [activeTab, setActiveTab] = React.useState('general')

  React.useEffect(() => {
    if (rule) {
      setFormData({ ...rule })
      setErrors({})
      setMappingErrors({})
      setActiveTab('general')
    }
  }, [rule])

  if (!formData) return null

  const updateField = (field: keyof PostingRule, value: any) => {
    setFormData(prev => (prev ? { ...prev, [field]: value } : null))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const updateAppliesTo = (value: string) => {
    const codes = value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    updateField('applies_to', codes)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const newMappingErrors: Record<number, string> = {}

    // Basic validation
    if (!formData.title || formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters'
    }

    if (!formData.smart_code || !formData.smart_code.startsWith('HERA.')) {
      newErrors.smart_code = 'Smart code must start with HERA.'
    }

    if (!formData.applies_to || formData.applies_to.length === 0) {
      newErrors.applies_to = 'At least one transaction code required'
    }

    if (!formData.mappings || formData.mappings.length === 0) {
      newErrors.mappings = 'At least one mapping required'
    }

    // Validate mappings
    formData.mappings?.forEach((mapping, index) => {
      if (!mapping.account || mapping.account.length < 2) {
        newMappingErrors[index] = 'Account code required (min 2 chars)'
      }
    })

    setErrors(newErrors)
    setMappingErrors(newMappingErrors)

    return Object.keys(newErrors).length === 0 && Object.keys(newMappingErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return

    if (mode === 'edit' && formData.key !== rule?.key) {
      setErrors({ key: 'Cannot change key. Use "Clone to new version" instead.' })
      return
    }

    onSave(formData)
  }

  const formatConditions = () => {
    try {
      const formatted = JSON.stringify(formData.conditions, null, 2)
      updateField('conditions', JSON.parse(formatted))
    } catch (e) {
      setErrors({ conditions: 'Invalid JSON format' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Posting Rule' : 'Edit Posting Rule'}
          </DialogTitle>
          <DialogDescription>
            Define how transactions are posted to the general ledger
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="mappings">Mappings</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            {/* Key (read-only in edit mode) */}
            <div className="space-y-2">
              <Label htmlFor="rule-key">Rule Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="rule-key"
                  value={formData.key}
                  onChange={e => updateField('key', e.target.value)}
                  disabled={mode === 'edit'}
                  className="font-mono"
                  placeholder="FIN_DNA.RULES.EXAMPLE.V1"
                />
                <Badge variant="outline">{formData.version}</Badge>
              </div>
              {mode === 'edit' && (
                <p className="text-xs dark:ink-muted">
                  Key cannot be changed. Use "Clone to new version" for breaking changes.
                </p>
              )}
              {errors.key && <p className="text-xs text-red-600 dark:text-red-400">{errors.key}</p>}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="rule-title">Title</Label>
              <Input
                id="rule-title"
                value={formData.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="POS Sale Posting"
              />
              {errors.title && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="rule-description">Description (optional)</Label>
              <Textarea
                id="rule-description"
                value={formData.description || ''}
                onChange={e => updateField('description', e.target.value || undefined)}
                placeholder="Describe what this rule does..."
                rows={2}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="rule-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={value => updateField('category', value)}
              >
                <SelectTrigger id="rule-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="pos" className="hera-select-item">
                    POS
                  </SelectItem>
                  <SelectItem value="payments" className="hera-select-item">
                    Payments
                  </SelectItem>
                  <SelectItem value="inventory" className="hera-select-item">
                    Inventory
                  </SelectItem>
                  <SelectItem value="commissions" className="hera-select-item">
                    Commissions
                  </SelectItem>
                  <SelectItem value="fiscal" className="hera-select-item">
                    Fiscal
                  </SelectItem>
                  <SelectItem value="other" className="hera-select-item">
                    Other
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Smart Code */}
            <div className="space-y-2">
              <Label htmlFor="rule-smart-code">Smart Code</Label>
              <Input
                id="rule-smart-code"
                value={formData.smart_code}
                onChange={e => updateField('smart_code', e.target.value)}
                placeholder="HERA.FIN.POSTING.RULE.V1"
                className="font-mono"
              />
              {errors.smart_code && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.smart_code}</p>
              )}
            </div>

            {/* Applies To */}
            <div className="space-y-2">
              <Label htmlFor="rule-applies-to">Applies To (comma-separated)</Label>
              <Textarea
                id="rule-applies-to"
                value={formData.applies_to.join(', ')}
                onChange={e => updateAppliesTo(e.target.value)}
                placeholder="HERA.POS.SALE.V1, HERA.POS.SALE.LINE.V1"
                rows={2}
                className="font-mono text-sm"
              />
              {errors.applies_to && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.applies_to}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mappings" className="mt-4">
            <RuleMappingsTable
              mappings={formData.mappings}
              onChange={mappings => updateField('mappings', mappings)}
              errors={mappingErrors}
            />
            {errors.mappings && (
              <Alert className="mt-4 border-red-200 bg-red-50 dark:bg-red-950/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-600 dark:text-red-400">
                  {errors.mappings}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="conditions" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Conditions (JSON)</Label>
              <Textarea
                value={JSON.stringify(formData.conditions, null, 2)}
                onChange={e => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    updateField('conditions', parsed)
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                placeholder="{}"
                rows={10}
                className="font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs dark:ink-muted">
                  Optional conditional logic for when this rule applies
                </p>
                <Button type="button" size="sm" variant="outline" onClick={formatConditions}>
                  Format JSON
                </Button>
              </div>
              {errors.conditions && (
                <p className="text-xs text-red-600 dark:text-red-400">{errors.conditions}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <JsonView data={formData} title="Rule Preview" defaultExpanded={true} />
          </TabsContent>
        </Tabs>

        {/* Runtime Note */}
        <Alert className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Note:</strong> Rule changes affect future transactions only. Existing journal
            entries will not be modified.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
