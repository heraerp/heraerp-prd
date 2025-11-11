/**
 * Retail POS Customer Creation Wizard
 * Using HERA Master Data Template with Sacred Six Integration
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { HERAMasterDataTemplate, type FormSection, type FormField } from '@/components/hera/HERAMasterDataTemplate'
import { 
  Users, 
  Mail, 
  Phone,
  MapPin,
  Gift,
  CreditCard,
  Settings,
  User
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Customer creation sections for the wizard
const customerSections: FormSection[] = [
  {
    id: 'personal',
    label: 'Personal Information',
    icon: User,
    required: true,
    description: 'Customer contact details and basic information'
  },
  {
    id: 'contact',
    label: 'Contact & Address',
    icon: MapPin,
    required: false,
    description: 'Address, phone numbers, and communication preferences'
  },
  {
    id: 'loyalty',
    label: 'Loyalty Program',
    icon: Gift,
    required: false,
    description: 'Loyalty membership and reward preferences'
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: Settings,
    required: false,
    description: 'Shopping preferences and additional settings'
  }
]

// Customer form fields for the wizard
const customerFields: FormField[] = [
  // Personal Information Section
  {
    id: 'first_name',
    label: 'First Name',
    type: 'text',
    required: true,
    placeholder: 'Enter first name...',
    section: 'personal',
    validation: (value: string) => {
      if (!value || value.trim().length < 1) {
        return 'First name is required'
      }
      return null
    }
  },
  {
    id: 'last_name',
    label: 'Last Name',
    type: 'text',
    required: true,
    placeholder: 'Enter last name...',
    section: 'personal',
    validation: (value: string) => {
      if (!value || value.trim().length < 1) {
        return 'Last name is required'
      }
      return null
    }
  },
  {
    id: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
    placeholder: 'customer@email.com',
    section: 'personal',
    validation: (value: string) => {
      if (!value) {
        return 'Email is required'
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address'
      }
      return null
    }
  },
  {
    id: 'phone',
    label: 'Phone Number',
    type: 'phone',
    required: false,
    placeholder: '+1 (555) 123-4567',
    section: 'personal',
    validation: (value: string) => {
      if (value && value.length > 0) {
        // Basic phone validation - allow various formats
        const cleaned = value.replace(/\D/g, '')
        if (cleaned.length < 10 || cleaned.length > 15) {
          return 'Please enter a valid phone number'
        }
      }
      return null
    }
  },
  {
    id: 'date_of_birth',
    label: 'Date of Birth',
    type: 'text',
    required: false,
    placeholder: 'YYYY-MM-DD (optional)',
    section: 'personal',
    validation: (value: string) => {
      if (value && value.length > 0) {
        const date = new Date(value)
        if (isNaN(date.getTime())) {
          return 'Please enter a valid date (YYYY-MM-DD)'
        }
        if (date > new Date()) {
          return 'Date of birth cannot be in the future'
        }
      }
      return null
    }
  },

  // Contact & Address Section
  {
    id: 'address_line1',
    label: 'Address Line 1',
    type: 'text',
    required: false,
    placeholder: 'Street address...',
    section: 'contact'
  },
  {
    id: 'address_line2',
    label: 'Address Line 2',
    type: 'text',
    required: false,
    placeholder: 'Apartment, suite, etc...',
    section: 'contact'
  },
  {
    id: 'city',
    label: 'City',
    type: 'text',
    required: false,
    placeholder: 'City...',
    section: 'contact'
  },
  {
    id: 'state_province',
    label: 'State/Province',
    type: 'text',
    required: false,
    placeholder: 'State or province...',
    section: 'contact'
  },
  {
    id: 'postal_code',
    label: 'Postal Code',
    type: 'text',
    required: false,
    placeholder: 'ZIP/Postal code...',
    section: 'contact'
  },
  {
    id: 'country',
    label: 'Country',
    type: 'select',
    required: false,
    section: 'contact',
    options: [
      { value: '', label: 'Select country...' },
      { value: 'US', label: 'United States' },
      { value: 'CA', label: 'Canada' },
      { value: 'GB', label: 'United Kingdom' },
      { value: 'AU', label: 'Australia' },
      { value: 'DE', label: 'Germany' },
      { value: 'FR', label: 'France' },
      { value: 'AE', label: 'United Arab Emirates' },
      { value: 'SG', label: 'Singapore' },
      { value: 'JP', label: 'Japan' },
      { value: 'other', label: 'Other' }
    ]
  },
  {
    id: 'secondary_phone',
    label: 'Secondary Phone',
    type: 'phone',
    required: false,
    placeholder: 'Alternative phone number...',
    section: 'contact'
  },

  // Loyalty Program Section
  {
    id: 'loyalty_tier',
    label: 'Initial Loyalty Tier',
    type: 'select',
    required: false,
    section: 'loyalty',
    options: [
      { value: 'bronze', label: 'Bronze (Default)', description: 'Standard benefits and rewards' },
      { value: 'silver', label: 'Silver', description: '5% additional rewards' },
      { value: 'gold', label: 'Gold', description: '10% additional rewards + priority support' },
      { value: 'platinum', label: 'Platinum', description: '15% additional rewards + exclusive offers' },
      { value: 'vip', label: 'VIP', description: '20% additional rewards + personal shopper' }
    ]
  },
  {
    id: 'initial_points',
    label: 'Initial Loyalty Points',
    type: 'number',
    required: false,
    placeholder: '0',
    section: 'loyalty',
    validation: (value: string) => {
      if (value) {
        const num = parseInt(value)
        if (isNaN(num) || num < 0) {
          return 'Points must be a positive number'
        }
      }
      return null
    }
  },
  {
    id: 'referral_code',
    label: 'Referral Code',
    type: 'text',
    required: false,
    placeholder: 'Referred by...',
    section: 'loyalty'
  },
  {
    id: 'signup_source',
    label: 'How did they hear about us?',
    type: 'select',
    required: false,
    section: 'loyalty',
    options: [
      { value: '', label: 'Select source...' },
      { value: 'social_media', label: 'Social Media' },
      { value: 'google_search', label: 'Google Search' },
      { value: 'referral', label: 'Friend Referral' },
      { value: 'advertisement', label: 'Advertisement' },
      { value: 'walk_in', label: 'Walk-in' },
      { value: 'email_campaign', label: 'Email Campaign' },
      { value: 'other', label: 'Other' }
    ]
  },

  // Preferences Section
  {
    id: 'preferred_contact',
    label: 'Preferred Contact Method',
    type: 'select',
    required: false,
    section: 'preferences',
    options: [
      { value: 'email', label: 'Email' },
      { value: 'phone', label: 'Phone' },
      { value: 'sms', label: 'SMS/Text' },
      { value: 'none', label: 'No Marketing Contact' }
    ]
  },
  {
    id: 'preferred_language',
    label: 'Preferred Language',
    type: 'select',
    required: false,
    section: 'preferences',
    options: [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Spanish' },
      { value: 'fr', label: 'French' },
      { value: 'de', label: 'German' },
      { value: 'ar', label: 'Arabic' },
      { value: 'zh', label: 'Chinese' },
      { value: 'ja', label: 'Japanese' },
      { value: 'other', label: 'Other' }
    ]
  },
  {
    id: 'marketing_consent',
    label: 'Marketing Communications',
    type: 'select',
    required: false,
    section: 'preferences',
    options: [
      { value: 'yes', label: 'Yes, send me promotional emails' },
      { value: 'no', label: 'No marketing emails' }
    ]
  },
  {
    id: 'special_instructions',
    label: 'Special Instructions',
    type: 'textarea',
    required: false,
    placeholder: 'Any special notes or instructions for this customer...',
    section: 'preferences'
  },
  {
    id: 'tags',
    label: 'Customer Tags',
    type: 'text',
    required: false,
    placeholder: 'e.g., vip, frequent_buyer, corporate',
    section: 'preferences'
  }
]

export default function NewCustomerPage() {
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Authentication guards
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-champagne mb-2">Authentication Required</h1>
          <p className="text-bronze">Please log in to create customers</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-champagne mb-2">Organization Required</h1>
          <p className="text-bronze">Please select an organization to continue</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (formData: Record<string, any>) => {
    setIsSubmitting(true)
    
    try {
      console.log('Creating customer with data:', formData)
      
      // Generate customer name and code
      const customerName = `${formData.first_name} ${formData.last_name}`.trim()
      const entityCode = `CUST${Date.now()}`
      
      // Prepare entity data for Sacred Six tables
      const entityData = {
        entity_type: 'CUSTOMER',
        entity_name: customerName,
        entity_code: entityCode,
        entity_description: `Retail customer - ${customerName}`,
        smart_code: 'HERA.RETAIL.CUSTOMER.ENTITY.POS.v1',
        organization_id: organization.id
      }

      // Prepare dynamic fields
      const dynamicFields = []

      // Personal information fields
      if (formData.first_name) {
        dynamicFields.push({
          field_name: 'first_name',
          field_value_text: formData.first_name,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.FIRST_NAME.v1'
        })
      }

      if (formData.last_name) {
        dynamicFields.push({
          field_name: 'last_name',
          field_value_text: formData.last_name,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.LAST_NAME.v1'
        })
      }

      if (formData.email) {
        dynamicFields.push({
          field_name: 'email',
          field_value_text: formData.email,
          field_type: 'email',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.EMAIL.v1'
        })
      }

      if (formData.phone) {
        dynamicFields.push({
          field_name: 'phone',
          field_value_text: formData.phone,
          field_type: 'phone',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.PHONE.v1'
        })
      }

      if (formData.date_of_birth) {
        dynamicFields.push({
          field_name: 'date_of_birth',
          field_value_text: formData.date_of_birth,
          field_type: 'date',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.DOB.v1'
        })
      }

      // Address fields
      if (formData.address_line1) {
        const address = [
          formData.address_line1,
          formData.address_line2,
          formData.city,
          formData.state_province,
          formData.postal_code,
          formData.country
        ].filter(Boolean).join(', ')
        
        dynamicFields.push({
          field_name: 'address',
          field_value_text: address,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.ADDRESS.v1'
        })
      }

      // Loyalty program fields
      if (formData.loyalty_tier) {
        dynamicFields.push({
          field_name: 'loyalty_tier',
          field_value_text: formData.loyalty_tier,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.LOYALTY_TIER.v1'
        })
      }

      if (formData.initial_points) {
        dynamicFields.push({
          field_name: 'loyalty_points',
          field_value_number: parseInt(formData.initial_points),
          field_type: 'number',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.LOYALTY_POINTS.v1'
        })
      }

      if (formData.referral_code) {
        dynamicFields.push({
          field_name: 'referral_code',
          field_value_text: formData.referral_code,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.REFERRAL.v1'
        })
      }

      if (formData.signup_source) {
        dynamicFields.push({
          field_name: 'signup_source',
          field_value_text: formData.signup_source,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.SIGNUP_SOURCE.v1'
        })
      }

      // Preference fields
      if (formData.preferred_contact) {
        dynamicFields.push({
          field_name: 'preferred_contact',
          field_value_text: formData.preferred_contact,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.CONTACT_PREF.v1'
        })
      }

      if (formData.preferred_language) {
        dynamicFields.push({
          field_name: 'preferred_language',
          field_value_text: formData.preferred_language,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.LANGUAGE.v1'
        })
      }

      if (formData.marketing_consent) {
        dynamicFields.push({
          field_name: 'marketing_consent',
          field_value_text: formData.marketing_consent === 'yes' ? 'true' : 'false',
          field_type: 'boolean',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.MARKETING_CONSENT.v1'
        })
      }

      if (formData.special_instructions) {
        dynamicFields.push({
          field_name: 'special_instructions',
          field_value_text: formData.special_instructions,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.INSTRUCTIONS.v1'
        })
      }

      if (formData.tags) {
        dynamicFields.push({
          field_name: 'tags',
          field_value_text: formData.tags,
          field_type: 'text',
          smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.TAGS.v1'
        })
      }

      // Add registration date
      dynamicFields.push({
        field_name: 'registration_date',
        field_value_text: new Date().toISOString(),
        field_type: 'date',
        smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.REGISTRATION_DATE.v1'
      })

      // Add initial total spent
      dynamicFields.push({
        field_name: 'total_spent',
        field_value_number: 0,
        field_type: 'number',
        smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.TOTAL_SPENT.v1'
      })

      // TODO: In real implementation, call the Universal Masterdata API
      // const response = await apiV2.post('entities', {
      //   operation: 'CREATE',
      //   entity_data: entityData,
      //   dynamic_fields: dynamicFields,
      //   organization_id: organization.id
      // })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Customer ${customerName} created successfully!`)
      console.log('Customer created:', { entityData, dynamicFields })
      
      // Navigate back to customer list
      router.push('/apps/retail/pos/customers')
      
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error('Failed to create customer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultValues = {
    loyalty_tier: 'bronze',
    initial_points: '0',
    preferred_contact: 'email',
    preferred_language: 'en',
    marketing_consent: 'yes'
  }

  return (
    <HERAMasterDataTemplate
      entityType="CUSTOMER"
      entityLabel="Customer"
      sections={customerSections}
      fields={customerFields}
      backUrl="/apps/retail/pos/customers"
      onSubmit={handleSubmit}
      defaultValues={defaultValues}
      className="min-h-screen bg-gradient-to-br from-black via-charcoal to-black"
    />
  )
}