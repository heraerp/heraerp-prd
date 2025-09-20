'use client'

// HERA Universal Resource Pencil Modal
// Handles editing existing calendar resources

import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Users, CheckCircle } from 'lucide-react'

import { UniversalResource } from '@/types/calendar.types'

interface ResourceEditModalProps {
  organization_id: string
  resource: UniversalResource
  is_open: boolean
  on_close: () => void
  on_save: (resource: UniversalResource) => Promise<void>
}

const INDUSTRY_SKILL_SETS = {
  healthcare: [
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Surgery',
    'Emergency Medicine',
    'Internal Medicine',
    'Radiology',
    'Pathology',
    'Anesthesiology',
    'Patient Care',
    'Medical Procedures',
    'Lab Work',
    'Diagnostics'
  ],
  restaurant: [
    'Italian Cuisine',
    'French Cuisine',
    'Asian Cuisine',
    'Pastry',
    'Grilling',
    'Wine Service',
    'Customer Service',
    'Food Safety',
    'Kitchen Management',
    'Bartending',
    'Sommelier',
    'Event Planning',
    'Catering'
  ],
  professional: [
    'Project Management',
    'Strategy Consulting',
    'Financial Analysis',
    'Legal Advisory',
    'Marketing',
    'Sales',
    'IT Consulting',
    'HR Consulting',
    'Change Management',
    'Business Development',
    'Public Speaking',
    'Training'
  ],
  manufacturing: [
    'CNC Operation',
    'Quality Control',
    'Welding',
    'Assembly',
    'Maintenance',
    'Safety Inspection',
    'Production Planning',
    'Equipment Calibration',
    'Process Engineering',
    'Lean Manufacturing',
    'Six Sigma'
  ],
  universal: [
    'Communication',
    'Problem Solving',
    'Leadership',
    'Time Management',
    'Customer Service',
    'Technical Skills',
    'Organization',
    'Teamwork'
  ]
}

export function ResourceEditModal({
  organization_id,
  resource,
  is_open,
  on_close,
  on_save
}: ResourceEditModalProps) {
  // ==================== STATE MANAGEMENT ====================
  const [formData, setFormData] = useState<UniversalResource>(resource)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    if (resource) {
      setFormData(resource)
    }
  }, [resource])

  // ==================== COMPUTED VALUES ====================
  const availableSkills = useMemo(() => {
    return (
      INDUSTRY_SKILL_SETS[resource.industry_type as keyof typeof INDUSTRY_SKILL_SETS] ||
      INDUSTRY_SKILL_SETS.universal
    )
  }, [resource.industry_type])

  // ==================== FORM HANDLERS ====================
  const handleInputChange = (field: keyof UniversalResource, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear validation error
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...(prev.skills || []), skill]
    }))
  }

  // ==================== VALIDATION ====================
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.entity_name?.trim()) {
      errors.entity_name = 'Resource name is required'
    }

    if (!formData.entity_code?.trim()) {
      errors.entity_code = 'Resource code is required'
    }

    if (formData.capacity && formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1'
    }

    if (formData.cost_per_hour && formData.cost_per_hour < 0) {
      errors.cost_per_hour = 'Cost per hour cannot be negative'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ==================== SAVE HANDLER ====================
  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      await on_save(formData)
    } catch (error) {
      console.error('Failed to update resource:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== RENDER ====================
  return (
    <Dialog open={is_open} onOpenChange={on_close}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Pencil Resource</span>
            <Badge variant="outline">{resource.industry_type}</Badge>
          </DialogTitle>
          <DialogDescription>Update resource information and settings</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entity_name">Resource Name *</Label>
                  <Input
                    id="entity_name"
                    value={formData.entity_name}
                    onChange={e => handleInputChange('entity_name', e.target.value)}
                    className={validationErrors.entity_name ? 'border-red-500' : ''}
                  />
                  {validationErrors.entity_name && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.entity_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="entity_code">Resource Code *</Label>
                  <Input
                    id="entity_code"
                    value={formData.entity_code}
                    onChange={e => handleInputChange('entity_code', e.target.value)}
                    className={validationErrors.entity_code ? 'border-red-500' : ''}
                  />
                  {validationErrors.entity_code && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.entity_code}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="resource_type">Resource Type</Label>
                  <Input
                    id="resource_type"
                    value={formData.resource_type}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Cannot change resource type</p>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={value => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={e => handleInputChange('capacity', parseInt(e.target.value) || 1)}
                    className={validationErrors.capacity ? 'border-red-500' : ''}
                  />
                  {validationErrors.capacity && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.capacity}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={e => handleInputChange('location', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="cost_per_hour">Cost per Hour ($)</Label>
                  <Input
                    id="cost_per_hour"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_per_hour || 0}
                    onChange={e =>
                      handleInputChange('cost_per_hour', parseFloat(e.target.value) || 0)
                    }
                    className={validationErrors.cost_per_hour ? 'border-red-500' : ''}
                  />
                  {validationErrors.cost_per_hour && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.cost_per_hour}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Capabilities */}
          {availableSkills.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Skills & Capabilities</h3>
                <div className="grid grid-cols-3 gap-2">
                  {availableSkills.map(skill => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={`skill_${skill}`}
                        checked={formData.skills?.includes(skill) || false}
                        onCheckedChange={() => handleSkillToggle(skill)}
                      />
                      <Label htmlFor={`skill_${skill}`} className="text-sm cursor-pointer">
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>

                {formData.skills && formData.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Selected Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Smart Code Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Classification Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Smart Code:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{formData.smart_code}</code>
                </div>
                {formData.ai_confidence && (
                  <div className="flex items-center justify-between">
                    <span>AI Confidence:</span>
                    <span>{Math.round(formData.ai_confidence * 100)}%</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Industry:</span>
                  <Badge variant="outline">{formData.industry_type}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={on_close} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
