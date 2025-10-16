'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Building2, 
  Globe, 
  Users, 
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Save,
  X,
  Star,
  TrendingUp
} from 'lucide-react'
import { MobileButton, MobileInput, MobileSelect, MobileTextarea } from '@/components/mobile'
import { useCreateCRMEntity } from '@/hooks/useCRM'

// Form validation schema
const accountFormSchema = z.object({
  entity_name: z.string()
    .min(1, 'Account name is required')
    .max(255, 'Name must be 255 characters or less'),
  industry: z.string().optional(),
  account_type: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  annual_revenue: z.number().min(0, 'Revenue must be positive').optional(),
  employee_count: z.number().int().min(1, 'Must have at least 1 employee').optional(),
  rating: z.string().optional(),
  billing_address: z.string().optional(),
  shipping_address: z.string().optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional()
})

type AccountFormData = z.infer<typeof accountFormSchema>

export interface CRMAccountFormProps {
  onSubmit?: (accountId: string) => void
  onCancel?: () => void
  initialData?: Partial<AccountFormData>
  className?: string
}

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance', 
  'Manufacturing',
  'Retail',
  'Education',
  'Real Estate',
  'Consulting',
  'Media',
  'Government',
  'Agriculture',
  'Energy',
  'Transportation',
  'Hospitality',
  'Non-Profit'
]

const ACCOUNT_TYPES = [
  'Prospect',
  'Customer', 
  'Partner',
  'Competitor',
  'Former Customer',
  'Vendor'
]

const RATINGS = [
  'Hot',
  'Warm',
  'Cold'
]

export function CRMAccountForm({
  onSubmit,
  onCancel,
  initialData = {},
  className = ''
}: CRMAccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createEntity = useCreateCRMEntity()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      entity_name: initialData.entity_name || '',
      industry: initialData.industry || '',
      account_type: initialData.account_type || '',
      website: initialData.website || '',
      phone: initialData.phone || '',
      email: initialData.email || '',
      annual_revenue: initialData.annual_revenue,
      employee_count: initialData.employee_count,
      rating: initialData.rating || '',
      billing_address: initialData.billing_address || '',
      shipping_address: initialData.shipping_address || '',
      description: initialData.description || ''
    },
    mode: 'onChange'
  })

  const watchedRevenue = watch('annual_revenue')
  const watchedEmployees = watch('employee_count')

  const handleFormSubmit = async (data: AccountFormData) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // Prepare dynamic fields
      const dynamicFields: Record<string, { value: any; type: any }> = {}

      if (data.industry) dynamicFields.industry = { value: data.industry, type: 'text' }
      if (data.account_type) dynamicFields.account_type = { value: data.account_type, type: 'text' }
      if (data.website) dynamicFields.website = { value: data.website, type: 'text' }
      if (data.phone) dynamicFields.phone = { value: data.phone, type: 'text' }
      if (data.email) dynamicFields.email = { value: data.email, type: 'text' }
      if (data.annual_revenue) dynamicFields.annual_revenue = { value: data.annual_revenue, type: 'number' }
      if (data.employee_count) dynamicFields.employee_count = { value: data.employee_count, type: 'number' }
      if (data.rating) dynamicFields.rating = { value: data.rating, type: 'text' }
      if (data.billing_address) dynamicFields.billing_address = { value: data.billing_address, type: 'text' }
      if (data.shipping_address) dynamicFields.shipping_address = { value: data.shipping_address, type: 'text' }
      if (data.description) dynamicFields.description = { value: data.description, type: 'text' }

      const result = await createEntity.mutateAsync({
        entity_type: 'ACCOUNT',
        entity_name: data.entity_name,
        dynamic_fields: dynamicFields
      })

      // Reset form
      reset()
      
      // Call success callback
      onSubmit?.(result.entity_id)

    } catch (error) {
      console.error('Failed to create account:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset()
    onCancel?.()
  }

  const getCompanySize = (employees?: number) => {
    if (!employees) return null
    if (employees < 10) return 'Startup'
    if (employees < 50) return 'Small'
    if (employees < 200) return 'Medium'
    if (employees < 1000) return 'Large'
    return 'Enterprise'
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Account</h2>
            <p className="text-sm text-gray-600">Add a new company or organization</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Basic Information
          </h3>

          {/* Account Name */}
          <MobileInput
            label="Account Name"
            {...register('entity_name')}
            error={errors.entity_name?.message}
            placeholder="e.g., ACME Corporation"
            required
            className="w-full"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Industry */}
            <MobileSelect
              label="Industry"
              {...register('industry')}
              error={errors.industry?.message}
              className="w-full"
            >
              <option value="">Select industry...</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </MobileSelect>

            {/* Account Type */}
            <MobileSelect
              label="Account Type"
              {...register('account_type')}
              error={errors.account_type?.message}
              className="w-full"
            >
              <option value="">Select type...</option>
              {ACCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </MobileSelect>
          </div>

          {/* Website */}
          <MobileInput
            label="Website"
            type="url"
            {...register('website')}
            error={errors.website?.message}
            placeholder="https://company.com"
            className="w-full"
            icon={<Globe className="w-4 h-4 text-gray-400" />}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-600" />
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Email */}
            <MobileInput
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="info@company.com"
              className="w-full"
              icon={<Mail className="w-4 h-4 text-gray-400" />}
            />
          </div>
        </div>

        {/* Company Details */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Company Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Annual Revenue */}
            <MobileInput
              label="Annual Revenue"
              type="number"
              min="0"
              step="10000"
              {...register('annual_revenue', { 
                setValueAs: (v) => v === '' ? undefined : parseFloat(v) 
              })}
              error={errors.annual_revenue?.message}
              placeholder="1000000"
              className="w-full"
              icon={<DollarSign className="w-4 h-4 text-gray-400" />}
            />

            {/* Employee Count */}
            <MobileInput
              label="Number of Employees"
              type="number"
              min="1"
              step="1"
              {...register('employee_count', { 
                setValueAs: (v) => v === '' ? undefined : parseInt(v) 
              })}
              error={errors.employee_count?.message}
              placeholder="50"
              className="w-full"
              icon={<Users className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Rating */}
          <MobileSelect
            label="Account Rating"
            {...register('rating')}
            error={errors.rating?.message}
            className="w-full"
          >
            <option value="">Select rating...</option>
            {RATINGS.map((rating) => (
              <option key={rating} value={rating}>{rating}</option>
            ))}
          </MobileSelect>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            Address Information
          </h3>

          {/* Billing Address */}
          <MobileTextarea
            label="Billing Address"
            {...register('billing_address')}
            error={errors.billing_address?.message}
            placeholder="123 Main St, City, State, ZIP"
            rows={2}
            className="w-full"
          />

          {/* Shipping Address */}
          <MobileTextarea
            label="Shipping Address"
            {...register('shipping_address')}
            error={errors.shipping_address?.message}
            placeholder="Same as billing or different address"
            rows={2}
            className="w-full"
          />
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900">Additional Information</h3>

          <MobileTextarea
            label="Description"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Additional notes about this account..."
            rows={3}
            className="w-full"
          />
        </div>

        {/* Company Insights */}
        {(watchedRevenue || watchedEmployees) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Company Insights</span>
              </div>
              
              {watchedRevenue && (
                <div className="text-sm text-blue-700">
                  Annual Revenue: {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0
                  }).format(watchedRevenue)}
                </div>
              )}
              
              {watchedEmployees && (
                <div className="text-sm text-blue-700">
                  Company Size: {getCompanySize(watchedEmployees)} ({watchedEmployees.toLocaleString()} employees)
                </div>
              )}
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
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
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
export function CRMAccountFormCompact({
  onSubmit,
  onCancel,
  initialData = {},
  className = ''
}: CRMAccountFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createEntity = useCreateCRMEntity()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema.pick({
      entity_name: true,
      industry: true,
      website: true,
      phone: true
    })),
    defaultValues: initialData,
    mode: 'onChange'
  })

  const handleFormSubmit = async (data: AccountFormData) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const dynamicFields: Record<string, { value: any; type: any }> = {}
      if (data.industry) dynamicFields.industry = { value: data.industry, type: 'text' }
      if (data.website) dynamicFields.website = { value: data.website, type: 'text' }
      if (data.phone) dynamicFields.phone = { value: data.phone, type: 'text' }

      const result = await createEntity.mutateAsync({
        entity_type: 'ACCOUNT',
        entity_name: data.entity_name,
        dynamic_fields: dynamicFields
      })

      reset()
      onSubmit?.(result.entity_id)
    } catch (error) {
      console.error('Failed to create account:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-4 ${className}`}>
      <MobileInput
        label="Account Name"
        {...register('entity_name')}
        error={errors.entity_name?.message}
        placeholder="e.g., ACME Corporation"
        required
      />

      <MobileSelect
        label="Industry"
        {...register('industry')}
      >
        <option value="">Select industry...</option>
        {INDUSTRIES.map((industry) => (
          <option key={industry} value={industry}>{industry}</option>
        ))}
      </MobileSelect>

      <MobileInput
        label="Website"
        type="url"
        {...register('website')}
        error={errors.website?.message}
        placeholder="https://company.com"
      />

      <MobileInput
        label="Phone"
        type="tel"
        {...register('phone')}
        placeholder="+1 (555) 123-4567"
      />

      <div className="flex gap-3 pt-2">
        <MobileButton
          type="submit"
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          className="flex-1"
          size="small"
        >
          Create Account
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