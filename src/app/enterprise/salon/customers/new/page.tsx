// ================================================================================
// HERA SALON - NEW CUSTOMER PAGE
// Smart Code: HERA.PAGES.SALON.CUSTOMERS.NEW.V1
// Create new customer with HERA DNA UI
// ================================================================================

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FormFieldDNA,
  PageHeaderDNA,
  CardDNA,
  PrimaryButtonDNA,
  SecondaryButtonDNA
} from '@/lib/dna/components/ui'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  FileText,
  Save,
  ArrowLeft,
  Star,
  Gift
} from 'lucide-react'
import { useCustomers } from '@/hooks/useCustomers'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useToast } from '@/hooks/use-toast'

export default function NewCustomerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrganization } = useHERAAuth()

  // Check for Hair Talkz subdomain
  const getEffectiveOrgId = () => {
    if (currentOrganization?.id) return currentOrganization.id

    // Check if we're on hairtalkz or heratalkz subdomain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (
        hostname.startsWith('hairtalkz.') ||
        hostname === 'hairtalkz.localhost' ||
        hostname.startsWith('heratalkz.') ||
        hostname === 'heratalkz.localhost'
      ) {
        return '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hair Talkz org ID
      }
    }

    return currentOrganization?.id
  }

  const organizationId = getEffectiveOrgId()
  const { createCustomer } = useCustomers(organizationId)

  // Form state
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    preferences: '',
    notes: '',
    loyaltyTier: 'Bronze',
    marketingConsent: false
  })

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required'
    }

    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && formData.phone.length < 8) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please check the form for errors',
        variant: 'destructive'
      })
      return
    }

    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'No organization selected',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const result = await createCustomer({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        preferences: formData.preferences,
        notes: formData.notes
      })

      toast({
        title: 'Customer Created',
        description: `${formData.name} has been added successfully`
      })

      // Navigate to customer details page
      router.push(`/salon/customers/${result.customerId}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create customer. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeaderDNA
        title="New Customer"
        subtitle="Add a new customer to your salon"
        icon={User}
        backUrl="/salon/customers"
        actions={
          <div className="flex gap-3">
            <SecondaryButtonDNA
              icon={ArrowLeft}
              onClick={() => router.push('/salon/customers')}
              disabled={loading}
            >
              Cancel
            </SecondaryButtonDNA>
            <PrimaryButtonDNA
              icon={Save}
              onClick={handleSubmit}
              loading={loading}
              loadingText="Creating..."
            >
              Create Customer
            </PrimaryButtonDNA>
          </div>
        }
      />

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <CardDNA title="Basic Information" icon={User}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormFieldDNA
                    type="text"
                    label="Full Name"
                    value={formData.name}
                    onChange={value => setFormData({ ...formData, name: value })}
                    placeholder="Enter customer's full name"
                    icon={User}
                    error={errors.name}
                    helper="As it should appear on receipts and communications"
                    required
                  />
                </div>

                <FormFieldDNA
                  type="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={value => setFormData({ ...formData, email: value })}
                  placeholder="customer@example.com"
                  icon={Mail}
                  error={errors.email}
                />

                <FormFieldDNA
                  type="tel"
                  label="Phone Number"
                  value={formData.phone}
                  onChange={value => setFormData({ ...formData, phone: value })}
                  placeholder="+971 50 123 4567"
                  icon={Phone}
                  error={errors.phone}
                />

                <div className="md:col-span-2">
                  <FormFieldDNA
                    type="textarea"
                    label="Address"
                    value={formData.address}
                    onChange={value => setFormData({ ...formData, address: value })}
                    placeholder="Street address, apartment, suite, etc."
                    icon={MapPin}
                    rows={2}
                  />
                </div>

                <FormFieldDNA
                  type="date"
                  label="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={value => setFormData({ ...formData, dateOfBirth: value })}
                  icon={Calendar}
                  helper="We'll send birthday wishes and special offers"
                />

                <FormFieldDNA
                  type="select"
                  label="Initial Loyalty Tier"
                  value={formData.loyaltyTier}
                  onChange={value => setFormData({ ...formData, loyaltyTier: value })}
                  icon={Star}
                  options={[
                    { value: 'Bronze', label: 'Bronze (New Customer)' },
                    { value: 'Silver', label: 'Silver (Regular)' },
                    { value: 'Gold', label: 'Gold (VIP)' },
                    { value: 'Platinum', label: 'Platinum (Premium)' }
                  ]}
                />
              </div>
            </CardDNA>

            <CardDNA title="Preferences & Notes" icon={Heart}>
              <div className="space-y-4">
                <FormFieldDNA
                  type="textarea"
                  label="Service Preferences"
                  value={formData.preferences}
                  onChange={value => setFormData({ ...formData, preferences: value })}
                  placeholder="Preferred services, styling preferences, allergies, etc."
                  icon={Heart}
                  rows={3}
                  helper="This helps our stylists provide personalized service"
                />

                <FormFieldDNA
                  type="textarea"
                  label="Internal Notes"
                  value={formData.notes}
                  onChange={value => setFormData({ ...formData, notes: value })}
                  placeholder="Any additional notes about the customer..."
                  icon={FileText}
                  rows={3}
                  helper="These notes are only visible to staff members"
                />
              </div>
            </CardDNA>

            <CardDNA title="Marketing & Communication" icon={Gift}>
              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={e => setFormData({ ...formData, marketingConsent: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Marketing Communications
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Customer agrees to receive promotional emails, SMS messages about special
                      offers, new services, and salon updates. They can unsubscribe at any time.
                    </p>
                  </div>
                </label>
              </div>
            </CardDNA>
          </div>

          {/* Quick Tips Sidebar */}
          <div className="space-y-6">
            <CardDNA title="Quick Tips" icon={Star}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Complete Profile
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The more information you provide, the better service we can offer. Email and
                    phone help with appointment reminders.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Loyalty Benefits
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>
                      • <span className="font-medium">Bronze:</span> Welcome discount
                    </li>
                    <li>
                      • <span className="font-medium">Silver:</span> 5% off all services
                    </li>
                    <li>
                      • <span className="font-medium">Gold:</span> 10% off + priority booking
                    </li>
                    <li>
                      • <span className="font-medium">Platinum:</span> 15% off + exclusive perks
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Birthday Rewards
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customers with birth dates receive special birthday discounts and complimentary
                    services during their birthday month.
                  </p>
                </div>
              </div>
            </CardDNA>

            <CardDNA>
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Customer First</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Building lasting relationships starts with understanding our customers' needs and
                  preferences.
                </p>
              </div>
            </CardDNA>
          </div>
        </div>
      </div>
    </div>
  )
}
