'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Target, 
  Building2, 
  User, 
  DollarSign, 
  Calendar, 
  Percent,
  TrendingUp,
  Save,
  X,
  Star,
  AlertCircle
} from 'lucide-react'
import { MobileButton, MobileInput, MobileSelect, MobileTextarea } from '@/components/mobile'
import { useCreateOpportunity } from '@/hooks/useCRM'
import { useCRMEntities } from '@/hooks/useCRM'
import { CRM_STATUS_VALUES } from '@/lib/crm/smart-codes'

// Form validation schema
const opportunityFormSchema = z.object({
  entity_name: z.string()
    .min(1, 'Opportunity name is required')
    .max(255, 'Name must be 255 characters or less'),
  stage: z.string().min(1, 'Stage is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  probability: z.number().min(0, 'Probability must be at least 0').max(100, 'Probability cannot exceed 100'),
  close_date: z.string().min(1, 'Close date is required'),
  account_id: z.string().optional(),
  contact_id: z.string().optional(),
  source: z.string().optional(),
  type: z.string().optional(),
  next_step: z.string().max(500, 'Next step must be 500 characters or less').optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional()
})

type OpportunityFormData = z.infer<typeof opportunityFormSchema>

export interface CRMOpportunityFormProps {
  onSubmit?: (opportunityId: string) => void
  onCancel?: () => void
  initialData?: Partial<OpportunityFormData>
  preselectedAccountId?: string
  preselectedContactId?: string
  className?: string
}

const OPPORTUNITY_SOURCES = [
  'Website',
  'Referral',
  'Cold Call',
  'Email Campaign',
  'Social Media',
  'Trade Show',
  'Partner',
  'Advertisement',
  'Inbound Lead',
  'Existing Customer'
]

const OPPORTUNITY_TYPES = [
  'New Business',
  'Existing Business',
  'Renewal',
  'Upsell',
  'Cross-sell'
]

export function CRMOpportunityForm({
  onSubmit,
  onCancel,
  initialData = {},
  preselectedAccountId,
  preselectedContactId,
  className = ''
}: CRMOpportunityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createOpportunity = useCreateOpportunity()
  
  // Get accounts and contacts for selection
  const { data: accounts = [] } = useCRMEntities('ACCOUNT')
  const { data: contacts = [] } = useCRMEntities('CONTACT')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset
  } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      entity_name: initialData.entity_name || '',
      stage: initialData.stage || Object.values(CRM_STATUS_VALUES.OPPORTUNITY_STAGES)[0],
      amount: initialData.amount || 0,
      probability: initialData.probability || 25,
      close_date: initialData.close_date || (() => {
        const date = new Date()
        date.setMonth(date.getMonth() + 3) // Default to 3 months from now
        return date.toISOString().split('T')[0]
      })(),
      account_id: preselectedAccountId || initialData.account_id || '',
      contact_id: preselectedContactId || initialData.contact_id || '',
      source: initialData.source || '',
      type: initialData.type || '',
      next_step: initialData.next_step || '',
      description: initialData.description || ''
    },
    mode: 'onChange'
  })

  const watchedAmount = watch('amount')
  const watchedProbability = watch('probability')
  const watchedStage = watch('stage')
  const watchedAccountId = watch('account_id')
  const watchedContactId = watch('contact_id')

  const selectedAccount = accounts.find(acc => acc.entity_id === watchedAccountId)
  const selectedContact = contacts.find(con => con.entity_id === watchedContactId)

  // Auto-adjust probability based on stage
  const handleStageChange = (stage: string) => {
    setValue('stage', stage)
    
    // Auto-adjust probability based on typical stage probabilities
    const stageProbabilities: Record<string, number> = {
      'Prospecting': 10,
      'Qualification': 25,
      'Needs Analysis': 40,
      'Value Proposition': 60,
      'Proposal': 75,
      'Negotiation': 90,
      'Closed Won': 100,
      'Closed Lost': 0
    }
    
    if (stageProbabilities[stage] !== undefined) {
      setValue('probability', stageProbabilities[stage])
    }
  }

  const handleFormSubmit = async (data: OpportunityFormData) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    
    try {
      const result = await createOpportunity.mutateAsync({
        entity_name: data.entity_name,
        stage: data.stage,
        amount: data.amount,
        close_date: data.close_date,
        probability: data.probability,
        accountId: data.account_id,
        contactId: data.contact_id
      })

      // Reset form
      reset()
      
      // Call success callback
      onSubmit?.(result.entity_id)

    } catch (error) {
      console.error('Failed to create opportunity:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset()
    onCancel?.()
  }

  const getWeightedValue = () => {
    return (watchedAmount * watchedProbability) / 100
  }

  const getStageColor = (stage: string) => {
    const stageColors: Record<string, string> = {
      'Prospecting': 'text-blue-600 bg-blue-100',
      'Qualification': 'text-yellow-600 bg-yellow-100',
      'Needs Analysis': 'text-orange-600 bg-orange-100',
      'Value Proposition': 'text-purple-600 bg-purple-100',
      'Proposal': 'text-indigo-600 bg-indigo-100',
      'Negotiation': 'text-green-600 bg-green-100',
      'Closed Won': 'text-emerald-600 bg-emerald-100',
      'Closed Lost': 'text-red-600 bg-red-100'
    }
    return stageColors[stage] || 'text-gray-600 bg-gray-100'
  }

  const isPastDue = () => {
    const closeDate = watch('close_date')
    if (!closeDate) return false
    return new Date(closeDate) < new Date()
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Opportunity</h2>
            <p className="text-sm text-gray-600">Add a new sales opportunity to your pipeline</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            Basic Information
          </h3>

          {/* Opportunity Name */}
          <MobileInput
            label="Opportunity Name"
            {...register('entity_name')}
            error={errors.entity_name?.message}
            placeholder="e.g., ACME Corp - CRM Implementation"
            required
            className="w-full"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stage */}
            <div className="space-y-2">
              <MobileSelect
                label="Sales Stage"
                value={watchedStage}
                onChange={(e) => handleStageChange(e.target.value)}
                error={errors.stage?.message}
                required
                className="w-full"
              >
                {Object.values(CRM_STATUS_VALUES.OPPORTUNITY_STAGES).map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </MobileSelect>
              {watchedStage && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStageColor(watchedStage)}`}>
                  {watchedStage}
                </span>
              )}
            </div>

            {/* Type */}
            <MobileSelect
              label="Opportunity Type"
              {...register('type')}
              error={errors.type?.message}
              className="w-full"
            >
              <option value="">Select type...</option>
              {OPPORTUNITY_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </MobileSelect>
          </div>
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            Financial Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <MobileInput
              label="Opportunity Value"
              type="number"
              min="0"
              step="100"
              {...register('amount', { 
                setValueAs: (v) => v === '' ? 0 : parseFloat(v) 
              })}
              error={errors.amount?.message}
              placeholder="50000"
              required
              className="w-full"
              icon={<DollarSign className="w-4 h-4 text-gray-400" />}
            />

            {/* Probability */}
            <MobileInput
              label="Win Probability (%)"
              type="number"
              min="0"
              max="100"
              step="5"
              {...register('probability', { 
                setValueAs: (v) => v === '' ? 0 : parseInt(v) 
              })}
              error={errors.probability?.message}
              required
              className="w-full"
              icon={<Percent className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Close Date */}
          <MobileInput
            label="Expected Close Date"
            type="date"
            {...register('close_date')}
            error={errors.close_date?.message}
            required
            className="w-full"
            icon={<Calendar className="w-4 h-4 text-gray-400" />}
          />

          {isPastDue() && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">
                  Close date is in the past. Consider updating the timeline.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Relationships */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Related Records
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account */}
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

            {/* Contact */}
            <MobileSelect
              label="Primary Contact"
              {...register('contact_id')}
              error={errors.contact_id?.message}
              className="w-full"
            >
              <option value="">Select contact...</option>
              {contacts.map((contact) => (
                <option key={contact.entity_id} value={contact.entity_id}>
                  {contact.entity_name}
                  {contact.dynamic_fields?.company?.value && ` (${contact.dynamic_fields.company.value})`}
                </option>
              ))}
            </MobileSelect>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            Additional Information
          </h3>

          {/* Source */}
          <MobileSelect
            label="Lead Source"
            {...register('source')}
            error={errors.source?.message}
            className="w-full"
          >
            <option value="">Select source...</option>
            {OPPORTUNITY_SOURCES.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </MobileSelect>

          {/* Next Step */}
          <MobileInput
            label="Next Step"
            {...register('next_step')}
            error={errors.next_step?.message}
            placeholder="e.g., Schedule demo with decision makers"
            className="w-full"
          />

          {/* Description */}
          <MobileTextarea
            label="Description"
            {...register('description')}
            error={errors.description?.message}
            placeholder="Additional details about this opportunity..."
            rows={3}
            className="w-full"
          />
        </div>

        {/* Opportunity Summary */}
        {watchedAmount > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span className="text-base font-medium text-purple-900">Opportunity Summary</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-purple-600 font-medium">Total Value</div>
                  <div className="text-xl font-bold text-purple-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0
                    }).format(watchedAmount)}
                  </div>
                </div>
                
                <div>
                  <div className="text-purple-600 font-medium">Win Probability</div>
                  <div className="text-xl font-bold text-purple-900">{watchedProbability}%</div>
                </div>
                
                <div>
                  <div className="text-purple-600 font-medium">Weighted Value</div>
                  <div className="text-xl font-bold text-purple-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0
                    }).format(getWeightedValue())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Related Records Preview */}
        {(selectedAccount || selectedContact) && (
          <div className="space-y-3">
            {selectedAccount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">
                      {selectedAccount.entity_name}
                    </div>
                    <div className="text-sm text-blue-700">
                      {selectedAccount.dynamic_fields?.industry?.value && (
                        <span>{selectedAccount.dynamic_fields.industry.value}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedContact && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-green-900">
                      {selectedContact.entity_name}
                    </div>
                    <div className="text-sm text-green-700">
                      {selectedContact.dynamic_fields?.job_title?.value && (
                        <span>{selectedContact.dynamic_fields.job_title.value}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            {isSubmitting ? 'Creating Opportunity...' : 'Create Opportunity'}
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
export function CRMOpportunityFormCompact({
  onSubmit,
  onCancel,
  initialData = {},
  preselectedAccountId,
  className = ''
}: Omit<CRMOpportunityFormProps, 'preselectedContactId'>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createOpportunity = useCreateOpportunity()
  const { data: accounts = [] } = useCRMEntities('ACCOUNT')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunityFormSchema.pick({
      entity_name: true,
      stage: true,
      amount: true,
      close_date: true,
      account_id: true
    })),
    defaultValues: {
      ...initialData,
      account_id: preselectedAccountId || initialData.account_id,
      stage: initialData.stage || Object.values(CRM_STATUS_VALUES.OPPORTUNITY_STAGES)[0],
      close_date: initialData.close_date || (() => {
        const date = new Date()
        date.setMonth(date.getMonth() + 3)
        return date.toISOString().split('T')[0]
      })()
    },
    mode: 'onChange'
  })

  const handleFormSubmit = async (data: OpportunityFormData) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const result = await createOpportunity.mutateAsync({
        entity_name: data.entity_name,
        stage: data.stage,
        amount: data.amount,
        close_date: data.close_date,
        accountId: data.account_id
      })

      reset()
      onSubmit?.(result.entity_id)
    } catch (error) {
      console.error('Failed to create opportunity:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-4 ${className}`}>
      <MobileInput
        label="Opportunity Name"
        {...register('entity_name')}
        error={errors.entity_name?.message}
        placeholder="e.g., ACME Corp - CRM Implementation"
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MobileSelect
          label="Stage"
          {...register('stage')}
          required
        >
          {Object.values(CRM_STATUS_VALUES.OPPORTUNITY_STAGES).map((stage) => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </MobileSelect>

        <MobileInput
          label="Value"
          type="number"
          min="0"
          {...register('amount', { setValueAs: (v) => v === '' ? 0 : parseFloat(v) })}
          error={errors.amount?.message}
          placeholder="50000"
          required
        />
      </div>

      <MobileInput
        label="Close Date"
        type="date"
        {...register('close_date')}
        error={errors.close_date?.message}
        required
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
          Create Opportunity
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