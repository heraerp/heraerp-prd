'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Globe2,
  Users,
  Save,
  X,
  Star,
  Briefcase
} from 'lucide-react'
import { MobileButton, MobileInput, MobileSelect, MobileTextarea } from '@/components/mobile'
import { useCreateCRMEntity, useCRMEntities } from '@/hooks/useCRM'
import { CRM_STATUS_VALUES } from '@/lib/crm/smart-codes'

// Form validation schema
const contactFormSchema = z.object({
  entity_name: z.string()
    .min(1, 'Contact name is required')
    .max(255, 'Name must be 255 characters or less'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  account_id: z.string().optional(),
  contact_role: z.string().optional(),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  birthday: z.string().optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional()
})

type ContactFormData = z.infer<typeof contactFormSchema>

export interface CRMContactFormProps {
  onSubmit?: (contactId: string) => void
  onCancel?: () => void
  initialData?: Partial<ContactFormData>
  preselectedAccountId?: string
  className?: string
}

const DEPARTMENTS = [
  'Sales',
  'Marketing',
  'Engineering',
  'Product',
  'Customer Success',
  'Finance',
  'Operations',
  'HR',
  'Legal',
  'Executive',
  'IT',
  'Support'
]

export function CRMContactForm({
  onSubmit,
  onCancel,
  initialData = {},
  preselectedAccountId,
  className = ''
}: CRMContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createEntity = useCreateCRMEntity()
  
  // Get accounts for selection
  const { data: accounts = [] } = useCRMEntities('ACCOUNT')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      entity_name: initialData.entity_name || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      mobile: initialData.mobile || '',
      job_title: initialData.job_title || '',
      department: initialData.department || '',
      account_id: preselectedAccountId || initialData.account_id || '',
      contact_role: initialData.contact_role || '',
      linkedin_url: initialData.linkedin_url || '',
      birthday: initialData.birthday || '',
      notes: initialData.notes || ''
    },
    mode: 'onChange'
  })

  const watchedAccountId = watch('account_id')
  const selectedAccount = accounts.find(acc => acc.entity_id === watchedAccountId)

  const handleFormSubmit = async (data: ContactFormData) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // Prepare dynamic fields
      const dynamicFields: Record<string, { value: any; type: any }> = {
        email: { value: data.email, type: 'text' }
      }

      if (data.phone) dynamicFields.phone = { value: data.phone, type: 'text' }
      if (data.mobile) dynamicFields.mobile = { value: data.mobile, type: 'text' }
      if (data.job_title) dynamicFields.job_title = { value: data.job_title, type: 'text' }
      if (data.department) dynamicFields.department = { value: data.department, type: 'text' }
      if (data.contact_role) dynamicFields.contact_role = { value: data.contact_role, type: 'text' }
      if (data.linkedin_url) dynamicFields.linkedin_url = { value: data.linkedin_url, type: 'text' }
      if (data.birthday) dynamicFields.birthday = { value: data.birthday, type: 'date' }
      if (data.notes) dynamicFields.notes = { value: data.notes, type: 'text' }

      const result = await createEntity.mutateAsync({
        entity_type: 'CONTACT',
        entity_name: data.entity_name,
        dynamic_fields: dynamicFields
      })

      // TODO: Create relationship to account if selected
      // if (data.account_id) {
      //   await createRelationship({
      //     source_entity_id: result.entity_id,
      //     target_entity_id: data.account_id,
      //     relationship_type: 'CONTACT_OF_ACCOUNT'
      //   })
      // }

      // Reset form
      reset()
      
      // Call success callback
      onSubmit?.(result.entity_id)

    } catch (error) {
      console.error('Failed to create contact:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset()
    onCancel?.()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Decision Maker': return 'text-red-600 bg-red-100'
      case 'Influencer': return 'text-blue-600 bg-blue-100'
      case 'Champion': return 'text-purple-600 bg-purple-100'
      case 'User': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <User className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Contact</h2>
            <p className="text-sm text-gray-600">Add a new person to your network</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-green-600" />
            Basic Information
          </h3>

          {/* Contact Name */}
          <MobileInput
            label="Full Name"
            {...register('entity_name')}
            error={errors.entity_name?.message}
            placeholder="e.g., John Smith"
            required
            className="w-full"
          />

          {/* Email */}
          <MobileInput
            label="Email Address"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="john.smith@company.com"
            required
            className="w-full"
            icon={<Mail className="w-4 h-4 text-gray-400" />}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <MobileInput
              label="Business Phone"
              type="tel"
              {...register('phone')}
              error={errors.phone?.message}
              placeholder="+1 (555) 123-4567"
              className="w-full"
              icon={<Phone className="w-4 h-4 text-gray-400" />}
            />

            {/* Mobile */}
            <MobileInput
              label="Mobile Phone"
              type="tel"
              {...register('mobile')}
              error={errors.mobile?.message}
              placeholder="+1 (555) 987-6543"
              className="w-full"
              icon={<Phone className="w-4 h-4 text-gray-400" />}
            />
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            Professional Information
          </h3>

          {/* Account Selection */}
          <MobileSelect
            label="Account"
            {...register('account_id')}
            error={errors.account_id?.message}
            className="w-full"
          >
            <option value="">Select account...</option>
            {accounts.map((account) => (
              <option key={account.entity_id} value={account.entity_id}>
                {account.entity_name}
              </option>
            ))}
          </MobileSelect>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Job Title */}
            <MobileInput
              label="Job Title"
              {...register('job_title')}
              error={errors.job_title?.message}
              placeholder="e.g., VP of Sales"
              className="w-full"
            />

            {/* Department */}
            <MobileSelect
              label="Department"
              {...register('department')}
              error={errors.department?.message}
              className="w-full"
            >
              <option value="">Select department...</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </MobileSelect>
          </div>

          {/* Contact Role */}
          <MobileSelect
            label="Contact Role"
            {...register('contact_role')}
            error={errors.contact_role?.message}
            className="w-full"
          >
            <option value="">Select role...</option>
            {Object.values(CRM_STATUS_VALUES.CONTACT_ROLES).map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </MobileSelect>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-purple-600" />
            Additional Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* LinkedIn */}
            <MobileInput
              label="LinkedIn Profile"
              type="url"
              {...register('linkedin_url')}
              error={errors.linkedin_url?.message}
              placeholder="https://linkedin.com/in/johnsmith"
              className="w-full"
              icon={<Globe2 className="w-4 h-4 text-gray-400" />}
            />

            {/* Birthday */}
            <MobileInput
              label="Birthday"
              type="date"
              {...register('birthday')}
              error={errors.birthday?.message}
              className="w-full"
              icon={<Calendar className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Notes */}
          <MobileTextarea
            label="Notes"
            {...register('notes')}
            error={errors.notes?.message}
            placeholder="Additional information about this contact..."
            rows={3}
            className="w-full"
          />
        </div>

        {/* Selected Account Preview */}
        {selectedAccount && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-900">
                  {selectedAccount.entity_name}
                </div>
                <div className="text-sm text-blue-700">
                  {selectedAccount.dynamic_fields?.industry?.value && (
                    <span>{selectedAccount.dynamic_fields.industry.value}</span>
                  )}
                  {selectedAccount.dynamic_fields?.website?.value && (
                    <span className="ml-2">• {selectedAccount.dynamic_fields.website.value}</span>
                  )}
                </div>
              </div>
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
            {isSubmitting ? 'Creating Contact...' : 'Create Contact'}
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
export function CRMContactFormCompact({
  onSubmit,
  onCancel,
  initialData = {},
  preselectedAccountId,
  className = ''
}: CRMContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createEntity = useCreateCRMEntity()
  const { data: accounts = [] } = useCRMEntities('ACCOUNT')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema.pick({
      entity_name: true,
      email: true,
      job_title: true,
      account_id: true
    })),
    defaultValues: {
      ...initialData,
      account_id: preselectedAccountId || initialData.account_id
    },
    mode: 'onChange'
  })

  const handleFormSubmit = async (data: ContactFormData) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const dynamicFields: Record<string, { value: any; type: any }> = {
        email: { value: data.email, type: 'text' }
      }
      
      if (data.job_title) dynamicFields.job_title = { value: data.job_title, type: 'text' }

      const result = await createEntity.mutateAsync({
        entity_type: 'CONTACT',
        entity_name: data.entity_name,
        dynamic_fields: dynamicFields
      })

      reset()
      onSubmit?.(result.entity_id)
    } catch (error) {
      console.error('Failed to create contact:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-4 ${className}`}>
      <MobileInput
        label="Full Name"
        {...register('entity_name')}
        error={errors.entity_name?.message}
        placeholder="e.g., John Smith"
        required
      />

      <MobileInput
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
        placeholder="john.smith@company.com"
        required
      />

      <MobileInput
        label="Job Title"
        {...register('job_title')}
        placeholder="e.g., VP of Sales"
      />

      <MobileSelect
        label="Account"
        {...register('account_id')}
      >
        <option value="">Select account...</option>
        {accounts.map((account) => (
          <option key={account.entity_id} value={account.entity_id}>
            {account.entity_name}
          </option>
        ))}
      </MobileSelect>

      <div className="flex gap-3 pt-2">
        <MobileButton
          type="submit"
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
          className="flex-1"
          size="small"
        >
          Create Contact
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