'use client'

/**
 * Universal Relationship Editor Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.RELATIONSHIP_EDITOR.v1
 * 
 * Comprehensive relationship creation and editing interface with:
 * - Entity selection with search and filtering
 * - Relationship type configuration
 * - Effective/expiration date management
 * - Real-time validation and preview
 * - Mobile-first responsive design
 * - Smart suggestions and auto-completion
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  Save, 
  X, 
  Search,
  Calendar,
  Link,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Users,
  Building,
  Package,
  Target,
  MapPin,
  Sparkles,
  Clock,
  Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export interface Entity {
  id: string
  entity_id: string
  entity_name: string
  entity_type: string
  entity_code?: string
  smart_code: string
  metadata?: Record<string, any>
}

export interface RelationshipType {
  code: string
  label: string
  description: string
  direction: 'bidirectional' | 'unidirectional'
  inverse_label?: string
  allowed_source_types: string[]
  allowed_target_types: string[]
  default_duration?: number // in days
  requires_approval?: boolean
}

export interface RelationshipData {
  id?: string
  from_entity_id: string
  to_entity_id: string
  relationship_type: string
  relationship_data?: Record<string, any>
  effective_date: string
  expiration_date?: string
  smart_code: string
  metadata?: Record<string, any>
}

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

interface UniversalRelationshipEditorProps {
  // Data
  entities: Entity[]
  relationshipTypes: RelationshipType[]
  initialData?: Partial<RelationshipData>
  
  // Behavior
  mode: 'create' | 'edit'
  onSave: (relationship: RelationshipData) => Promise<void>
  onCancel: () => void
  onValidation?: (errors: ValidationError[]) => void
  
  // UI Configuration
  showPreview?: boolean
  allowBulkCreate?: boolean
  readonly?: boolean
  className?: string
}

const defaultRelationshipTypes: RelationshipType[] = [
  {
    code: 'PARENT_OF',
    label: 'Parent Of',
    description: 'Hierarchical parent relationship',
    direction: 'unidirectional',
    inverse_label: 'Child Of',
    allowed_source_types: ['ORGANIZATION', 'DEPARTMENT', 'COST_CENTER'],
    allowed_target_types: ['ORGANIZATION', 'DEPARTMENT', 'COST_CENTER', 'USER'],
    requires_approval: false
  },
  {
    code: 'MEMBER_OF',
    label: 'Member Of',
    description: 'Membership in a group or organization',
    direction: 'unidirectional',
    inverse_label: 'Has Member',
    allowed_source_types: ['USER', 'ENTITY'],
    allowed_target_types: ['ORGANIZATION', 'DEPARTMENT', 'GROUP'],
    requires_approval: true
  },
  {
    code: 'OWNS',
    label: 'Owns',
    description: 'Ownership relationship',
    direction: 'unidirectional',
    inverse_label: 'Owned By',
    allowed_source_types: ['USER', 'ORGANIZATION'],
    allowed_target_types: ['ASSET', 'PRODUCT', 'LOCATION'],
    requires_approval: false
  },
  {
    code: 'ASSIGNED_TO',
    label: 'Assigned To',
    description: 'Assignment or allocation relationship',
    direction: 'unidirectional',
    inverse_label: 'Has Assignment',
    allowed_source_types: ['TASK', 'PROJECT', 'ASSET'],
    allowed_target_types: ['USER', 'DEPARTMENT'],
    default_duration: 90,
    requires_approval: true
  }
]

const entityTypeIcons: Record<string, React.ComponentType<any>> = {
  'CUSTOMER': Users,
  'VENDOR': Building,
  'PRODUCT': Package,
  'ACCOUNT': Target,
  'LOCATION': MapPin,
  'USER': Users,
  'ORGANIZATION': Building,
  default: Target
}

const entityTypeColors: Record<string, string> = {
  'CUSTOMER': 'text-blue-600 bg-blue-50',
  'VENDOR': 'text-purple-600 bg-purple-50',
  'PRODUCT': 'text-green-600 bg-green-50',
  'ACCOUNT': 'text-yellow-600 bg-yellow-50',
  'LOCATION': 'text-red-600 bg-red-50',
  'USER': 'text-cyan-600 bg-cyan-50',
  'ORGANIZATION': 'text-lime-600 bg-lime-50',
  default: 'text-slate-600 bg-slate-50'
}

export function UniversalRelationshipEditor({
  entities,
  relationshipTypes = defaultRelationshipTypes,
  initialData = {},
  mode = 'create',
  onSave,
  onCancel,
  onValidation,
  showPreview = true,
  allowBulkCreate = false,
  readonly = false,
  className = ''
}: UniversalRelationshipEditorProps) {
  const [relationshipData, setRelationshipData] = useState<RelationshipData>({
    from_entity_id: '',
    to_entity_id: '',
    relationship_type: '',
    effective_date: new Date().toISOString().split('T')[0],
    smart_code: 'HERA.UNIVERSAL.RELATIONSHIP.GENERIC.v1',
    ...initialData
  })

  const [fromEntitySearch, setFromEntitySearch] = useState('')
  const [toEntitySearch, setToEntitySearch] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Filter entities based on search
  const filteredFromEntities = useMemo(() => {
    const selectedRelType = relationshipTypes.find(rt => rt.code === relationshipData.relationship_type)
    let filtered = entities

    // Filter by allowed source types
    if (selectedRelType?.allowed_source_types.length) {
      filtered = filtered.filter(entity => 
        selectedRelType.allowed_source_types.includes(entity.entity_type)
      )
    }

    // Filter by search
    if (fromEntitySearch) {
      filtered = filtered.filter(entity =>
        entity.entity_name.toLowerCase().includes(fromEntitySearch.toLowerCase()) ||
        entity.entity_type.toLowerCase().includes(fromEntitySearch.toLowerCase()) ||
        entity.entity_code?.toLowerCase().includes(fromEntitySearch.toLowerCase())
      )
    }

    return filtered.slice(0, 10) // Limit results for performance
  }, [entities, relationshipData.relationship_type, fromEntitySearch, relationshipTypes])

  const filteredToEntities = useMemo(() => {
    const selectedRelType = relationshipTypes.find(rt => rt.code === relationshipData.relationship_type)
    let filtered = entities.filter(entity => entity.id !== relationshipData.from_entity_id)

    // Filter by allowed target types
    if (selectedRelType?.allowed_target_types.length) {
      filtered = filtered.filter(entity => 
        selectedRelType.allowed_target_types.includes(entity.entity_type)
      )
    }

    // Filter by search
    if (toEntitySearch) {
      filtered = filtered.filter(entity =>
        entity.entity_name.toLowerCase().includes(toEntitySearch.toLowerCase()) ||
        entity.entity_type.toLowerCase().includes(toEntitySearch.toLowerCase()) ||
        entity.entity_code?.toLowerCase().includes(toEntitySearch.toLowerCase())
      )
    }

    return filtered.slice(0, 10) // Limit results for performance
  }, [entities, relationshipData.relationship_type, relationshipData.from_entity_id, toEntitySearch, relationshipTypes])

  // Get selected entities
  const fromEntity = entities.find(e => e.id === relationshipData.from_entity_id)
  const toEntity = entities.find(e => e.id === relationshipData.to_entity_id)
  const selectedRelType = relationshipTypes.find(rt => rt.code === relationshipData.relationship_type)

  // Validation
  const validateRelationship = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = []

    if (!relationshipData.from_entity_id) {
      errors.push({
        field: 'from_entity_id',
        message: 'Source entity is required',
        severity: 'error'
      })
    }

    if (!relationshipData.to_entity_id) {
      errors.push({
        field: 'to_entity_id',
        message: 'Target entity is required',
        severity: 'error'
      })
    }

    if (!relationshipData.relationship_type) {
      errors.push({
        field: 'relationship_type',
        message: 'Relationship type is required',
        severity: 'error'
      })
    }

    if (relationshipData.from_entity_id === relationshipData.to_entity_id) {
      errors.push({
        field: 'to_entity_id',
        message: 'Source and target entities cannot be the same',
        severity: 'error'
      })
    }

    if (relationshipData.effective_date && relationshipData.expiration_date) {
      const effectiveDate = new Date(relationshipData.effective_date)
      const expirationDate = new Date(relationshipData.expiration_date)
      
      if (expirationDate <= effectiveDate) {
        errors.push({
          field: 'expiration_date',
          message: 'Expiration date must be after effective date',
          severity: 'error'
        })
      }
    }

    // Type-specific validation
    if (selectedRelType && fromEntity && toEntity) {
      if (!selectedRelType.allowed_source_types.includes(fromEntity.entity_type)) {
        errors.push({
          field: 'from_entity_id',
          message: `${selectedRelType.label} relationship not allowed from ${fromEntity.entity_type}`,
          severity: 'error'
        })
      }

      if (!selectedRelType.allowed_target_types.includes(toEntity.entity_type)) {
        errors.push({
          field: 'to_entity_id',
          message: `${selectedRelType.label} relationship not allowed to ${toEntity.entity_type}`,
          severity: 'error'
        })
      }
    }

    // Warnings
    if (selectedRelType?.requires_approval) {
      errors.push({
        field: 'relationship_type',
        message: 'This relationship type requires approval',
        severity: 'warning'
      })
    }

    const today = new Date().toISOString().split('T')[0]
    if (relationshipData.effective_date < today) {
      errors.push({
        field: 'effective_date',
        message: 'Effective date is in the past',
        severity: 'warning'
      })
    }

    return errors
  }, [relationshipData, selectedRelType, fromEntity, toEntity])

  // Update validation errors
  useEffect(() => {
    const errors = validateRelationship()
    setValidationErrors(errors)
    onValidation?.(errors)
  }, [validateRelationship, onValidation])

  // Update smart code when relationship type changes
  useEffect(() => {
    if (relationshipData.relationship_type) {
      setRelationshipData(prev => ({
        ...prev,
        smart_code: `HERA.UNIVERSAL.RELATIONSHIP.${relationshipData.relationship_type}.v1`
      }))
    }
  }, [relationshipData.relationship_type])

  // Set default expiration date based on relationship type
  useEffect(() => {
    if (selectedRelType?.default_duration && relationshipData.effective_date && !relationshipData.expiration_date) {
      const effectiveDate = new Date(relationshipData.effective_date)
      const expirationDate = new Date(effectiveDate)
      expirationDate.setDate(effectiveDate.getDate() + selectedRelType.default_duration)
      
      setRelationshipData(prev => ({
        ...prev,
        expiration_date: expirationDate.toISOString().split('T')[0]
      }))
    }
  }, [selectedRelType, relationshipData.effective_date, relationshipData.expiration_date])

  // Handle field changes
  const updateField = useCallback((field: keyof RelationshipData, value: any) => {
    setRelationshipData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  // Handle save
  const handleSave = useCallback(async () => {
    if (readonly || isSaving) return

    const errors = validateRelationship()
    const hasErrors = errors.some(e => e.severity === 'error')
    
    if (hasErrors) {
      return
    }

    setIsSaving(true)
    try {
      await onSave(relationshipData)
    } catch (error) {
      console.error('Error saving relationship:', error)
    } finally {
      setIsSaving(false)
    }
  }, [readonly, isSaving, validateRelationship, onSave, relationshipData])

  // Entity selection component
  const EntitySelector = ({ 
    label, 
    value, 
    onChange, 
    search, 
    onSearchChange, 
    entities, 
    placeholder 
  }: {
    label: string
    value: string
    onChange: (value: string) => void
    search: string
    onSearchChange: (value: string) => void
    entities: Entity[]
    placeholder: string
  }) => {
    const selectedEntity = entities.find(e => e.id === value)

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        
        {selectedEntity ? (
          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
            <div className="flex items-center gap-3">
              {React.createElement(
                entityTypeIcons[selectedEntity.entity_type] || entityTypeIcons.default,
                { size: 20, className: entityTypeColors[selectedEntity.entity_type]?.split(' ')[0] || 'text-slate-600' }
              )}
              <div>
                <div className="font-medium">{selectedEntity.entity_name}</div>
                <div className="text-sm text-slate-500">
                  {selectedEntity.entity_type}
                  {selectedEntity.entity_code && ` • ${selectedEntity.entity_code}`}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange('')}
              className="text-slate-500 hover:text-slate-700"
            >
              <X size={16} />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder={placeholder}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {entities.length > 0 && (
              <div className="border border-slate-200 rounded-lg bg-white max-h-48 overflow-y-auto">
                {entities.map((entity) => {
                  const IconComponent = entityTypeIcons[entity.entity_type] || entityTypeIcons.default
                  const colorClass = entityTypeColors[entity.entity_type] || entityTypeColors.default
                  
                  return (
                    <button
                      key={entity.id}
                      onClick={() => onChange(entity.id)}
                      className="w-full p-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
                    >
                      <div className={cn("p-2 rounded-lg", colorClass)}>
                        <IconComponent size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{entity.entity_name}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {entity.entity_type}
                          </Badge>
                          {entity.entity_code && (
                            <span className="text-xs">{entity.entity_code}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("max-w-4xl mx-auto", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Link size={24} className="text-blue-600" />
          {mode === 'create' ? 'Create Relationship' : 'Edit Relationship'}
          {selectedRelType?.requires_approval && (
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              <Shield size={12} className="mr-1" />
              Requires Approval
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert className={cn(
            validationErrors.some(e => e.severity === 'error') ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
          )}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-sm">
                    <span className={cn(
                      "font-medium",
                      error.severity === 'error' ? "text-red-800" : "text-amber-800"
                    )}>
                      {error.field}:
                    </span>
                    <span className={cn(
                      "ml-1",
                      error.severity === 'error' ? "text-red-700" : "text-amber-700"
                    )}>
                      {error.message}
                    </span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Relationship Type Selection */}
        <div>
          <Label htmlFor="relationship_type">Relationship Type *</Label>
          <Select 
            value={relationshipData.relationship_type} 
            onValueChange={(value) => updateField('relationship_type', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select relationship type..." />
            </SelectTrigger>
            <SelectContent>
              {relationshipTypes.map((relType) => (
                <SelectItem key={relType.code} value={relType.code}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{relType.label}</span>
                    {relType.requires_approval && (
                      <Shield size={12} className="text-amber-500" />
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{relType.description}</div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EntitySelector
            label="Source Entity *"
            value={relationshipData.from_entity_id}
            onChange={(value) => updateField('from_entity_id', value)}
            search={fromEntitySearch}
            onSearchChange={setFromEntitySearch}
            entities={filteredFromEntities}
            placeholder="Search source entity..."
          />

          <EntitySelector
            label="Target Entity *"
            value={relationshipData.to_entity_id}
            onChange={(value) => updateField('to_entity_id', value)}
            search={toEntitySearch}
            onSearchChange={setToEntitySearch}
            entities={filteredToEntities}
            placeholder="Search target entity..."
          />
        </div>

        {/* Relationship Preview */}
        {showPreview && fromEntity && toEntity && selectedRelType && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="font-medium text-blue-700">{fromEntity.entity_name}</div>
                  <div className="text-xs text-blue-600">{fromEntity.entity_type}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <ArrowRight className="text-blue-600" size={20} />
                  <Badge variant="secondary" className="bg-white/80">
                    {selectedRelType.label}
                  </Badge>
                  <ArrowRight className="text-blue-600" size={20} />
                </div>
                
                <div className="text-center">
                  <div className="font-medium text-purple-700">{toEntity.entity_name}</div>
                  <div className="text-xs text-purple-600">{toEntity.entity_type}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="effective_date">Effective Date *</Label>
            <Input
              id="effective_date"
              type="date"
              value={relationshipData.effective_date}
              onChange={(e) => updateField('effective_date', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="expiration_date">Expiration Date</Label>
            <Input
              id="expiration_date"
              type="date"
              value={relationshipData.expiration_date || ''}
              onChange={(e) => updateField('expiration_date', e.target.value || undefined)}
              className="mt-1"
            />
            {selectedRelType?.default_duration && (
              <p className="text-xs text-slate-500 mt-1">
                Default duration: {selectedRelType.default_duration} days
              </p>
            )}
          </div>
        </div>

        {/* Advanced Options */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Checkbox
              id="show_advanced"
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
            <Label htmlFor="show_advanced" className="cursor-pointer">
              Advanced Options
            </Label>
          </div>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <Label htmlFor="smart_code">Smart Code</Label>
                <Input
                  id="smart_code"
                  value={relationshipData.smart_code}
                  onChange={(e) => updateField('smart_code', e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="metadata">Additional Data (JSON)</Label>
                <Textarea
                  id="metadata"
                  value={JSON.stringify(relationshipData.relationship_data || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const data = JSON.parse(e.target.value)
                      updateField('relationship_data', data)
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"key": "value"}'
                  className="mt-1 font-mono text-sm"
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center gap-2">
            {validationErrors.length === 0 ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle size={16} />
                Ready to save
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-500 text-sm">
                <AlertTriangle size={16} />
                {validationErrors.filter(e => e.severity === 'error').length} error(s)
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={readonly || isSaving || validationErrors.some(e => e.severity === 'error')}
            >
              {isSaving ? (
                <>
                  <Clock size={16} className="mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-1" />
                  {mode === 'create' ? 'Create Relationship' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default UniversalRelationshipEditor