'use client'

// HERA Universal Resource Creation Modal
// Handles creating new calendar resources across all industries

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Badge } from '@/src/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Checkbox } from '@/src/components/ui/checkbox'
import {
  Users,
  Wrench,
  MapPin,
  Activity,
  Settings,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Clock,
  Calendar
} from 'lucide-react'

import { UniversalResource } from '@/src/types/calendar.types'
import { calendarSmartCodeService } from '@/services/calendarSmartCodeService'

interface ResourceCreateModalProps {
  organization_id: string
  industry_type: string
  is_open: boolean
  on_close: () => void
  on_save: (resource: Partial<UniversalResource>) => Promise<void>
}

const RESOURCE_TYPES = [
  {
    value: 'STAFF',
    label: 'Staff',
    icon: Users,
    description: 'People resources (doctors, chefs, consultants)'
  },
  {
    value: 'EQUIPMENT',
    label: 'Equipment',
    icon: Wrench,
    description: 'Machines, tools, medical devices'
  },
  {
    value: 'ROOM',
    label: 'Room/Space',
    icon: MapPin,
    description: 'Physical spaces (rooms, tables, venues)'
  },
  { value: 'VEHICLE', label: 'Vehicle', icon: Activity, description: 'Transportation resources' },
  {
    value: 'VIRTUAL',
    label: 'Virtual',
    icon: Settings,
    description: 'Online resources (video calls, virtual spaces)'
  }
]

const BUSINESS_DAYS = [
  { id: 'MON', label: 'Monday' },
  { id: 'TUE', label: 'Tuesday' },
  { id: 'WED', label: 'Wednesday' },
  { id: 'THU', label: 'Thursday' },
  { id: 'FRI', label: 'Friday' },
  { id: 'SAT', label: 'Saturday' },
  { id: 'SUN', label: 'Sunday' }
]

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

export function ResourceCreateModal({
  organization_id,
  industry_type,
  is_open,
  on_close,
  on_save
}: ResourceCreateModalProps) {
  // ==================== STATE MANAGEMENT ====================
  const [formData, setFormData] = useState<Partial<UniversalResource>>({
    entity_name: '',
    entity_code: '',
    resource_type: 'STAFF',
    status: 'active',
    capacity: 1,
    cost_per_hour: 0,
    location: '',
    skills: [],
    industry_type: industry_type
  })

  const [availabilityWindows, setAvailabilityWindows] = useState([
    { start: '09:00', end: '17:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'] }
  ])

  const [maintenanceSchedule, setMaintenanceSchedule] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // ==================== COMPUTED VALUES ====================
  const smartCodeSuggestion = useMemo(() => {
    if (formData.entity_name && formData.resource_type) {
      return calendarSmartCodeService.autoClassifyResource(formData.entity_name, industry_type)
    }
    return null
  }, [formData.entity_name, formData.resource_type, industry_type])

  const availableSkills = useMemo(() => {
    return (
      INDUSTRY_SKILL_SETS[industry_type as keyof typeof INDUSTRY_SKILL_SETS] ||
      INDUSTRY_SKILL_SETS.universal
    )
  }, [industry_type])

  // ==================== FORM HANDLERS ====================
  const handleInputChange = (field: keyof UniversalResource, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-generate entity code if name changes
    if (field === 'entity_name' && value) {
      const code = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .substring(0, 15)
      setFormData(prev => ({ ...prev, entity_code: code }))
    }

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

  const handleAvailabilityChange = (index: number, field: string, value: any) => {
    setAvailabilityWindows(prev =>
      prev.map((window, i) => (i === index ? { ...window, [field]: value } : window))
    )
  }

  const handleDayToggle = (windowIndex: number, dayId: string) => {
    setAvailabilityWindows(prev =>
      prev.map((window, i) =>
        i === windowIndex
          ? {
              ...window,
              days: window.days.includes(dayId)
                ? window.days.filter(d => d !== dayId)
                : [...window.days, dayId]
            }
          : window
      )
    )
  }

  const addAvailabilityWindow = () => {
    setAvailabilityWindows(prev => [
      ...prev,
      { start: '09:00', end: '17:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'] }
    ])
  }

  const removeAvailabilityWindow = (index: number) => {
    setAvailabilityWindows(prev => prev.filter((_, i) => i !== index))
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

    if (!formData.resource_type) {
      errors.resource_type = 'Resource type is required'
    }

    if (formData.capacity && formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1'
    }

    if (formData.cost_per_hour && formData.cost_per_hour < 0) {
      errors.cost_per_hour = 'Cost per hour cannot be negative'
    }

    if (availabilityWindows.length === 0) {
      errors.availability = 'At least one availability window is required'
    }

    // Check for valid availability windows
    availabilityWindows.forEach((window, index) => {
      if (window.start >= window.end) {
        errors[`availability_${index}`] = 'End time must be after start time'
      }
      if (window.days.length === 0) {
        errors[`availability_days_${index}`] = 'At least one day must be selected'
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ==================== SAVE HANDLER ====================
  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const resourceData: Partial<UniversalResource> = {
        ...formData,
        organization_id,
        entity_type: 'calendar_resource',
        industry_type,
        availability_windows: JSON.stringify(availabilityWindows),
        maintenance_schedule: JSON.stringify(maintenanceSchedule),
        booking_rules: JSON.stringify({
          advance_booking_days: 30,
          cancellation_hours: 24,
          preparation_minutes: 10,
          cleanup_minutes: 10
        })
      }

      // Auto-generate smart code if not set
      if (!resourceData.smart_code && smartCodeSuggestion) {
        resourceData.smart_code = smartCodeSuggestion.smartCode
        resourceData.ai_confidence = smartCodeSuggestion.confidence
      }

      await on_save(resourceData)

      // Reset form
      setFormData({
        entity_name: '',
        entity_code: '',
        resource_type: 'STAFF',
        status: 'active',
        capacity: 1,
        cost_per_hour: 0,
        location: '',
        skills: [],
        industry_type: industry_type
      })
      setAvailabilityWindows([
        { start: '09:00', end: '17:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'] }
      ])
      setMaintenanceSchedule([])
    } catch (error) {
      console.error('Failed to create resource:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== RENDER HELPERS ====================
  const getResourceTypeIcon = (type: string) => {
    const resourceType = RESOURCE_TYPES.find(rt => rt.value === type)
    if (!resourceType) return <Users className="h-4 w-4" />

    const IconComponent = resourceType.icon
    return <IconComponent className="h-4 w-4" />
  }

  // ==================== RENDER ====================
  return (
    <Dialog open={is_open} onOpenChange={on_close}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Create New Resource</span>
            <Badge variant="outline">{industry_type}</Badge>
          </DialogTitle>
          <DialogDescription>
            Create a new calendar resource for your {industry_type} organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entity_name">Resource Name *</Label>
                  <Input
                    id="entity_name"
                    value={formData.entity_name || ''}
                    onChange={e => handleInputChange('entity_name', e.target.value)}
                    placeholder="e.g., Dr. Smith, Table 5, Conference Room A"
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
                    value={formData.entity_code || ''}
                    onChange={e => handleInputChange('entity_code', e.target.value)}
                    placeholder="e.g., DR_SMITH, TBL_005, CONF_A"
                    className={validationErrors.entity_code ? 'border-red-500' : ''}
                  />
                  {validationErrors.entity_code && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.entity_code}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="resource_type">Resource Type *</Label>
                  <Select
                    value={formData.resource_type || ''}
                    onValueChange={value => handleInputChange('resource_type', value)}
                  >
                    <SelectTrigger
                      className={validationErrors.resource_type ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <type.icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.resource_type && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.resource_type}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || 'active'}
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
                    value={formData.capacity || 1}
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
                    placeholder="e.g., Floor 3, Kitchen, Building A"
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
              <CardHeader>
                <CardTitle className="text-lg">Skills & Capabilities</CardTitle>
                <CardDescription>Select skills and capabilities for this resource</CardDescription>
              </CardHeader>
              <CardContent>
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

          {/* Availability Windows */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Availability Schedule</span>
                </span>
                <Button variant="outline" size="sm" onClick={addAvailabilityWindow}>
                  Add Window
                </Button>
              </CardTitle>
              <CardDescription>Define when this resource is available for booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availabilityWindows.map((window, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Availability Window {index + 1}</h4>
                    {availabilityWindows.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAvailabilityWindow(index)}
                        className="text-red-600"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <Label htmlFor={`start_${index}`}>Start Time</Label>
                      <Input
                        id={`start_${index}`}
                        type="time"
                        value={window.start}
                        onChange={e => handleAvailabilityChange(index, 'start', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`end_${index}`}>End Time</Label>
                      <Input
                        id={`end_${index}`}
                        type="time"
                        value={window.end}
                        onChange={e => handleAvailabilityChange(index, 'end', e.target.value)}
                        className={
                          validationErrors[`availability_${index}`] ? 'border-red-500' : ''
                        }
                      />
                    </div>
                  </div>

                  {validationErrors[`availability_${index}`] && (
                    <p className="text-sm text-red-600 mb-3">
                      {validationErrors[`availability_${index}`]}
                    </p>
                  )}

                  <div>
                    <Label>Available Days</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {BUSINESS_DAYS.map(day => (
                        <div key={day.id} className="flex items-center space-x-1">
                          <Checkbox
                            id={`${index}_${day.id}`}
                            checked={window.days.includes(day.id)}
                            onCheckedChange={() => handleDayToggle(index, day.id)}
                          />
                          <Label htmlFor={`${index}_${day.id}`} className="text-sm cursor-pointer">
                            {day.label.substring(0, 3)}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {validationErrors[`availability_days_${index}`] && (
                      <p className="text-sm text-red-600 mt-1">
                        {validationErrors[`availability_days_${index}`]}
                      </p>
                    )}
                  </div>
                </Card>
              ))}

              {validationErrors.availability && (
                <p className="text-sm text-red-600">{validationErrors.availability}</p>
              )}
            </CardContent>
          </Card>

          {/* Smart Code Preview */}
          {smartCodeSuggestion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>AI Classification</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Suggested Classification:</span>
                    <Badge variant="secondary">{smartCodeSuggestion.suggestedType}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Confidence Score:</span>
                    <span className="text-sm">
                      {Math.round(smartCodeSuggestion.confidence * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Smart Code:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {smartCodeSuggestion.smartCode}
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground">{smartCodeSuggestion.reasoning}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={on_close} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </div>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Create Resource
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
