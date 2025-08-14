'use client'

// HERA Universal Appointment Modal
// Handles appointment creation/editing across all industries

import React, { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle,
  Settings,
  Trash2,
  Copy
} from 'lucide-react'

import { 
  AppointmentModalProps,
  UniversalAppointment,
  UniversalResource,
  AppointmentLine,
  IndustryCalendarConfig
} from '@/types/calendar.types'
import { calendarSmartCodeService } from '@/services/calendarSmartCodeService'

export function AppointmentModal({
  organization_id,
  appointment,
  resources,
  is_open,
  on_close,
  on_save,
  on_delete,
  mode,
  industry_config,
  initial_start_time,
  initial_end_time
}: AppointmentModalProps) {

  // ==================== STATE MANAGEMENT ====================
  const [formData, setFormData] = useState<Partial<UniversalAppointment>>({
    title: '',
    description: '',
    start_time: initial_start_time || new Date(),
    end_time: initial_end_time || new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    duration_minutes: 60,
    appointment_type: industry_config.appointment_types[0] || 'appointment',
    priority: 'medium',
    status: 'draft',
    notes: '',
    industry_data: {}
  })

  const [selectedResources, setSelectedResources] = useState<AppointmentLine[]>([])
  const [customerData, setCustomerData] = useState<any>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    if (appointment && mode === 'edit') {
      setFormData({
        ...appointment,
        start_time: new Date(appointment.start_time),
        end_time: new Date(appointment.end_time)
      })
      
      // Load resource allocations
      if (appointment.industry_data?.resource_allocations) {
        setSelectedResources(appointment.industry_data.resource_allocations)
      }
      
      // Load customer data
      if (appointment.industry_data?.customer_data) {
        setCustomerData(appointment.industry_data.customer_data)
      }
    } else {
      // Reset for new appointment
      setFormData({
        title: '',
        description: '',
        start_time: initial_start_time || new Date(),
        end_time: initial_end_time || new Date(Date.now() + (industry_config.default_duration * 60 * 1000)),
        duration_minutes: industry_config.default_duration,
        appointment_type: industry_config.appointment_types[0] || 'appointment',
        priority: 'medium',
        status: 'draft',
        notes: '',
        industry_data: {}
      })
      setSelectedResources([])
      setCustomerData({})
    }
    setValidationErrors({})
  }, [appointment, mode, is_open, industry_config, initial_start_time, initial_end_time])

  // ==================== COMPUTED VALUES ====================
  const availableResources = useMemo(() => {
    return resources.filter(resource => resource.status === 'active')
  }, [resources])

  const smartCodeSuggestion = useMemo(() => {
    if (formData.title) {
      return calendarSmartCodeService.autoClassifyAppointment(
        formData.title,
        industry_config.industry
      )
    }
    return null
  }, [formData.title, industry_config.industry])

  const totalDuration = useMemo(() => {
    if (formData.start_time && formData.end_time) {
      return Math.round((formData.end_time.getTime() - formData.start_time.getTime()) / (1000 * 60))
    }
    return industry_config.default_duration
  }, [formData.start_time, formData.end_time, industry_config.default_duration])

  // ==================== FORM HANDLERS ====================
  const handleInputChange = (field: keyof UniversalAppointment, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleDateTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    const date = new Date(value)
    setFormData(prev => {
      const updated = { ...prev, [field]: date }
      
      // Auto-adjust duration when times change
      if (updated.start_time && updated.end_time) {
        updated.duration_minutes = Math.round(
          (updated.end_time.getTime() - updated.start_time.getTime()) / (1000 * 60)
        )
      }
      
      return updated
    })
  }

  const handleDurationChange = (minutes: number) => {
    setFormData(prev => ({
      ...prev,
      duration_minutes: minutes,
      end_time: prev.start_time ? 
        new Date(prev.start_time.getTime() + minutes * 60 * 1000) : 
        prev.end_time
    }))
  }

  const handleResourceToggle = (resource: UniversalResource) => {
    setSelectedResources(prev => {
      const existing = prev.find(r => r.entity_id === resource.entity_id)
      
      if (existing) {
        // Remove resource
        return prev.filter(r => r.entity_id !== resource.entity_id)
      } else {
        // Add resource
        return [...prev, {
          line_id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          transaction_id: appointment?.transaction_id || '',
          entity_id: resource.entity_id,
          line_type: 'resource_allocation',
          quantity: 1,
          duration_minutes: totalDuration,
          allocation_type: 'primary',
          smart_code: calendarSmartCodeService.generateAllocationSmartCode(
            industry_config.industry,
            'resource'
          )
        } as AppointmentLine]
      }
    })
  }

  const handleCustomerDataChange = (field: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }))
  }

  // ==================== VALIDATION ====================
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    // Required fields validation
    industry_config.required_fields.forEach(field => {
      if (!formData[field as keyof UniversalAppointment]) {
        errors[field] = `${field.replace('_', ' ')} is required`
      }
    })

    // Time validation
    if (formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        errors.end_time = 'End time must be after start time'
      }
      
      if (formData.start_time < new Date() && mode === 'create') {
        errors.start_time = 'Cannot schedule appointments in the past'
      }
    }

    // Resource validation
    if (selectedResources.length === 0) {
      errors.resources = 'At least one resource must be selected'
    }

    // Duration validation
    if (totalDuration < 5) {
      errors.duration = 'Appointment must be at least 5 minutes long'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ==================== SAVE HANDLER ====================
  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const appointmentData: Partial<UniversalAppointment> = {
        ...formData,
        duration_minutes: totalDuration,
        industry_data: {
          ...formData.industry_data,
          resource_allocations: selectedResources,
          customer_data: customerData,
          industry: industry_config.industry
        }
      }

      // Auto-generate smart code if not set
      if (!appointmentData.smart_code && smartCodeSuggestion) {
        appointmentData.smart_code = smartCodeSuggestion.smartCode
      }

      await on_save(appointmentData)
    } catch (error) {
      console.error('Failed to save appointment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!appointment || !on_delete) return
    
    setIsLoading(true)
    try {
      await on_delete(appointment.transaction_id)
    } catch (error) {
      console.error('Failed to delete appointment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== INDUSTRY-SPECIFIC FIELDS ====================
  const renderIndustrySpecificFields = () => {
    switch (industry_config.industry) {
      case 'healthcare':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="patient_name">Patient Name</Label>
              <Input
                id="patient_name"
                value={customerData.patient_name || ''}
                onChange={(e) => handleCustomerDataChange('patient_name', e.target.value)}
                placeholder="Enter patient name"
              />
            </div>
            <div>
              <Label htmlFor="procedure_type">Procedure Type</Label>
              <Select
                value={customerData.procedure_type || ''}
                onValueChange={(value) => handleCustomerDataChange('procedure_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select procedure type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="examination">Examination</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="insurance_info">Insurance Information</Label>
              <Input
                id="insurance_info"
                value={customerData.insurance_info || ''}
                onChange={(e) => handleCustomerDataChange('insurance_info', e.target.value)}
                placeholder="Insurance provider and policy number"
              />
            </div>
          </div>
        )
      
      case 'restaurant':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="party_size">Party Size</Label>
              <Input
                id="party_size"
                type="number"
                min="1"
                max="20"
                value={customerData.party_size || ''}
                onChange={(e) => handleCustomerDataChange('party_size', e.target.value)}
                placeholder="Number of guests"
              />
            </div>
            <div>
              <Label htmlFor="special_requests">Special Requests</Label>
              <Textarea
                id="special_requests"
                value={customerData.special_requests || ''}
                onChange={(e) => handleCustomerDataChange('special_requests', e.target.value)}
                placeholder="Dietary restrictions, seating preferences, etc."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="occasion">Occasion</Label>
              <Select
                value={customerData.occasion || ''}
                onValueChange={(value) => handleCustomerDataChange('occasion', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select occasion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dining">Regular Dining</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="business">Business Meeting</SelectItem>
                  <SelectItem value="celebration">Celebration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      
      case 'professional':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                value={customerData.client_name || ''}
                onChange={(e) => handleCustomerDataChange('client_name', e.target.value)}
                placeholder="Enter client name"
              />
            </div>
            <div>
              <Label htmlFor="meeting_type">Meeting Type</Label>
              <Select
                value={customerData.meeting_type || ''}
                onValueChange={(value) => handleCustomerDataChange('meeting_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="strategy">Strategy Session</SelectItem>
                  <SelectItem value="review">Review Meeting</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="project_reference">Project Reference</Label>
              <Input
                id="project_reference"
                value={customerData.project_reference || ''}
                onChange={(e) => handleCustomerDataChange('project_reference', e.target.value)}
                placeholder="Related project or case number"
              />
            </div>
          </div>
        )
      
      case 'manufacturing':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="work_order">Work Order</Label>
              <Input
                id="work_order"
                value={customerData.work_order || ''}
                onChange={(e) => handleCustomerDataChange('work_order', e.target.value)}
                placeholder="Work order number"
              />
            </div>
            <div>
              <Label htmlFor="maintenance_type">Maintenance Type</Label>
              <Select
                value={customerData.maintenance_type || ''}
                onValueChange={(value) => handleCustomerDataChange('maintenance_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select maintenance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventive</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="technician_notes">Technician Notes</Label>
              <Textarea
                id="technician_notes"
                value={customerData.technician_notes || ''}
                onChange={(e) => handleCustomerDataChange('technician_notes', e.target.value)}
                placeholder="Technical requirements, parts needed, etc."
                rows={3}
              />
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  // ==================== RENDER ====================
  return (
    <Dialog open={is_open} onOpenChange={on_close}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>
              {mode === 'create' ? 'New Appointment' : 
               mode === 'edit' ? 'Edit Appointment' : 'View Appointment'}
            </span>
            {smartCodeSuggestion && (
              <Badge variant="outline" className="ml-2">
                {smartCodeSuggestion.suggestedType} ({Math.round(smartCodeSuggestion.confidence * 100)}%)
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Create a new appointment in your calendar' :
             mode === 'edit' ? 'Edit appointment details' : 'View appointment information'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Appointment title"
                  className={validationErrors.title ? 'border-red-500' : ''}
                />
                {validationErrors.title && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="appointment_type">Type</Label>
                <Select
                  value={formData.appointment_type || ''}
                  onValueChange={(value) => handleInputChange('appointment_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {industry_config.appointment_types.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Appointment description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time ? format(formData.start_time, "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => handleDateTimeChange('start_time', e.target.value)}
                  className={validationErrors.start_time ? 'border-red-500' : ''}
                />
                {validationErrors.start_time && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.start_time}</p>
                )}
              </div>

              <div>
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time ? format(formData.end_time, "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) => handleDateTimeChange('end_time', e.target.value)}
                  className={validationErrors.end_time ? 'border-red-500' : ''}
                />
                {validationErrors.end_time && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.end_time}</p>
                )}
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  step="5"
                  value={totalDuration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                />
                {validationErrors.duration && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.duration}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority || 'medium'}
                  onValueChange={(value) => handleInputChange('priority', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'draft'}
                  onValueChange={(value) => handleInputChange('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <div>
              <Label>Select Resources *</Label>
              {validationErrors.resources && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.resources}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {availableResources.map(resource => {
                const isSelected = selectedResources.some(r => r.entity_id === resource.entity_id)
                
                return (
                  <Card 
                    key={resource.entity_id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleResourceToggle(resource)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{resource.entity_name}</h4>
                          <p className="text-sm text-gray-600">
                            {resource.resource_type} • {resource.status}
                          </p>
                          {resource.skills && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {resource.skills.slice(0, 3).map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="customer" className="space-y-4">
            {renderIndustrySpecificFields()}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes or instructions"
                rows={4}
              />
            </div>

            {smartCodeSuggestion && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">AI Classification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Suggested Type:</span>
                      <Badge>{smartCodeSuggestion.suggestedType}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence:</span>
                      <span className="text-sm">{Math.round(smartCodeSuggestion.confidence * 100)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Smart Code:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {smartCodeSuggestion.smartCode}
                      </code>
                    </div>
                    <p className="text-xs text-gray-600">{smartCodeSuggestion.reasoning}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <div>
            {mode === 'edit' && on_delete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
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
                  {mode === 'create' ? 'Create' : 'Save'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}