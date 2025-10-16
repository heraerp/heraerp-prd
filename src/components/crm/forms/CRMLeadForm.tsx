'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Target, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  DollarSign,
  Calendar,
  Star,
  Save,
  X,
  AlertCircle
} from 'lucide-react'
import { MobileButton, MobileInput, MobileSelect, MobileTextarea } from '@/components/mobile'
import { useCreateLead } from '@/hooks/useCRM'
import { CRM_STATUS_VALUES } from '@/lib/crm/smart-codes'

// Form validation schema
const leadFormSchema = z.object({
  entity_name: z.string()
    .min(1, 'Lead name is required')
    .max(255, 'Name must be 255 characters or less'),
  source: z.string()
    .min(1, 'Lead source is required'),
  company: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  budget: z.number().min(0, 'Budget must be positive').optional(),
  timeline: z.string().optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional()
})

type LeadFormData = z.infer<typeof leadFormSchema>

export interface CRMLeadFormProps {
  onSubmit?: (leadId: string) => void
  onCancel?: () => void
  initialData?: Partial<LeadFormData>
  className?: string
}

const LEAD_SOURCES = [
  'Website',
  'Referral', 
  'Cold Call',
  'Email Campaign',
  'Social Media',
  'Trade Show',
  'Partner',
  'Advertisement'
]

const TIMELINES = [
  'Immediate',
  'This Quarter',
  'Next Quarter', 
  'This Year',
  'Unknown'
]

export function CRMLeadForm({
  onSubmit,
  onCancel,
  initialData = {},
  className = ''
}: CRMLeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createLead = useCreateLead()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      entity_name: initialData.entity_name || '',
      source: initialData.source || '',
      company: initialData.company || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      budget: initialData.budget,
      timeline: initialData.timeline || '',
      notes: initialData.notes || ''
    },
    mode: 'onChange'
  })

  const watchedBudget = watch('budget')

  const handleFormSubmit = async (data: LeadFormData) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // Prepare dynamic fields
      const dynamicFields: Record<string, { value: any; type: any }> = {
        source: { value: data.source, type: 'text' }
      }

      if (data.company) dynamicFields.company = { value: data.company, type: 'text' }
      if (data.email) dynamicFields.email = { value: data.email, type: 'text' }
      if (data.phone) dynamicFields.phone = { value: data.phone, type: 'text' }
      if (data.budget) dynamicFields.budget = { value: data.budget, type: 'number' }
      if (data.timeline) dynamicFields.timeline = { value: data.timeline, type: 'text' }
      if (data.notes) dynamicFields.notes = { value: data.notes, type: 'text' }

      // Set default lead status
      dynamicFields.status = { value: 'New', type: 'text' }

      const result = await createLead.mutateAsync({
        entity_name: data.entity_name,
        source: data.source,
        company: data.company,
        email: data.email,
        phone: data.phone,
        budget: data.budget,
        timeline: data.timeline
      })

      // Reset form
      reset()
      
      // Call success callback
      onSubmit?.(result.entity_id)

    } catch (error) {
      console.error('Failed to create lead:', error)
      // Error handling would go here - show toast, etc.
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset()
    onCancel?.()
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Target className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Lead</h2>
            <p className="text-sm text-gray-600">Add a new prospect to your pipeline</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-600" />
            Basic Information
          </h3>

          {/* Lead Name */}
          <MobileInput
            label="Lead Name"
            {...register('entity_name')}
            error={errors.entity_name?.message}
            placeholder="e.g., John Smith"
            required
            className="w-full"
          />

          {/* Lead Source */}
          <MobileSelect
            label="Lead Source"
            {...register('source')}
            error={errors.source?.message}
            required
            className="w-full"
          >
            <option value="">Select source...</option>
            {LEAD_SOURCES.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </MobileSelect>

          {/* Company */}
          <MobileInput
            label="Company"
            {...register('company')}
            error={errors.company?.message}
            placeholder="e.g., ACME Corp"
            className="w-full"
            icon={<Building2 className="w-4 h-4 text-gray-400" />}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <MobileInput
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="john@company.com"
              className="w-full"
              icon={<Mail className="w-4 h-4 text-gray-400" />}
            />

            {/* Phone */}
            <MobileInput
              label="Phone"
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="+1 (555) 123-4567"
              className="w-full"
              icon={<Phone className="w-4 h-4 text-gray-400" />}
            />
          </div>
        </div>

        {/* Qualification Details */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-600" />
            Qualification Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Budget */}
            <MobileInput
              label="Estimated Budget"
              type="number"
              min="0"
              step="100"
              {...register('budget', { 
                setValueAs: (v) => v === '' ? undefined : parseFloat(v) 
              })}
              error={errors.budget?.message}
              placeholder="10000"
              className="w-full"
              icon={<DollarSign className="w-4 h-4 text-gray-400" />}
            />

            {/* Timeline */}
            <MobileSelect
              label="Purchase Timeline"
              {...register('timeline')}
              error={errors.timeline?.message}
              className="w-full"
            >
              <option value="">Select timeline...</option>
              {TIMELINES.map((timeline) => (
                <option key={timeline} value={timeline}>{timeline}</option>
              ))}
            </MobileSelect>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-600" />
            Additional Notes
          </h3>

          <MobileTextarea
            label="Notes"
            {...register('notes')}
            error={errors.notes?.message}
            placeholder="Any additional information about this lead..."
            rows={3}
            className="w-full"
          />
        </div>

        {/* Budget Display */}
        {watchedBudget && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Estimated Value: {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0
                }).format(watchedBudget)}
              </span>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <MobileButton
            type="submit"
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
            className="flex-1"
            icon={<Save className="w-4 h-4" />}
          >
            {isSubmitting ? 'Creating Lead...' : 'Create Lead'}
          </MobileButton>
          
          <MobileButton
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
            icon={<X className="w-4 h-4" />}
          >
            Cancel
          </MobileButton>
        </div>
      </form>
    </div>
  )
}

// Compact version for modals
export function CRMLeadFormCompact({
  onSubmit,
  onCancel,
  initialData = {},
  className = ''
}: CRMLeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createLead = useCreateLead()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema.pick({
      entity_name: true,
      source: true,
      company: true,
      email: true
    })),
    defaultValues: initialData,
    mode: 'onChange'
  })

  const handleFormSubmit = async (data: LeadFormData) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const result = await createLead.mutateAsync({
        entity_name: data.entity_name,
        source: data.source,
        company: data.company,
        email: data.email
      })

      reset()
      onSubmit?.(result.entity_id)
    } catch (error) {
      console.error('Failed to create lead:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-4 ${className}`}>
      <MobileInput
        label="Lead Name"
        {...register('entity_name')}
        error={errors.entity_name?.message}
        placeholder="e.g., John Smith"
        required
      />

      <MobileSelect
        label="Lead Source"
        {...register('source')}
        error={errors.source?.message}
        required
      >
        <option value="">Select source...</option>
        {LEAD_SOURCES.map((source) => (
          <option key={source} value={source}>{source}</option>
        ))}
      </MobileSelect>

      <MobileInput
        label="Company"
        {...register('company')}
        placeholder="e.g., ACME Corp"
      />

      <MobileInput
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
        placeholder="john@company.com"
      />

      <div className="flex gap-3 pt-2">
        <MobileButton
          type="submit"
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          className="flex-1"
          size="small"
        >
          Create Lead
        </MobileButton>
        
        <MobileButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          size="small"
        >
          Cancel
        </MobileButton>
      </div>
    </form>
  )
}