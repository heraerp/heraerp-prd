/**
 * HERA v3.0 Organization Setup Page
 * Multi-step organization creation with industry selection and branding
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuthV3 } from '@/components/auth/HERAAuthProviderV3'
import { platformOrgManager } from '@/lib/platform/organization-manager'
import { 
  getAvailableIndustries,
  getIndustryConfig,
  type IndustryType
} from '@/lib/platform/constants'
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Truck,
  ChefHat,
  Heart,
  ShoppingBag,
  Hammer,
  Palette,
  Upload,
  Globe
} from 'lucide-react'

const INDUSTRY_ICONS = {
  waste_management: Truck,
  salon_beauty: Sparkles,
  restaurant: ChefHat,
  healthcare: Heart,
  retail: ShoppingBag,
  construction: Hammer,
  generic_business: Building2
}

interface OrganizationData {
  name: string
  industry: IndustryType | null
  branding: {
    logo_url?: string
    primary_color: string
    secondary_color: string
    custom_domain?: string
  }
}

export default function OrganizationSetupPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useHERAAuthV3()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orgData, setOrgData] = useState<OrganizationData>({
    name: '',
    industry: null,
    branding: {
      primary_color: '#3b82f6',
      secondary_color: '#1d4ed8'
    }
  })

  const availableIndustries = getAvailableIndustries()

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    router.push('/auth/login')
    return null
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!orgData.name || !orgData.industry) {
      alert('Please complete all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await platformOrgManager.createOrganization({
        name: orgData.name,
        industry: orgData.industry,
        owner_user_id: user.id,
        settings: {
          branding: orgData.branding
        }
      })

      console.log('✅ Organization created successfully:', result)
      
      // Redirect to the new organization
      router.push('/dashboard')
    } catch (error) {
      console.error('❌ Failed to create organization:', error)
      alert('Failed to create organization. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateOrgData = (updates: Partial<OrganizationData>) => {
    setOrgData(prev => ({ ...prev, ...updates }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return orgData.name.trim().length > 0
      case 2: return orgData.industry !== null
      case 3: return true // Branding is optional
      case 4: return true // Review step
      default: return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Create Your Organization</h1>
              <p className="text-blue-100">Step {currentStep} of 4</p>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-75">Setting up for</div>
              <div className="font-semibold">{user.name}</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="w-full bg-blue-500/30 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Step 1: Organization Name */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  What's your organization name?
                </h2>
                <p className="text-gray-600">
                  This will be displayed throughout your workspace
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={orgData.name}
                  onChange={(e) => updateOrgData({ name: e.target.value })}
                  placeholder="e.g., ACME Corporation, Green Waste Solutions"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-2">
                  You can change this later in settings
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Industry Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  What industry are you in?
                </h2>
                <p className="text-gray-600">
                  This helps us customize your experience with industry-specific features
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableIndustries.map((industry) => {
                  const IconComponent = INDUSTRY_ICONS[industry.value] || Building2
                  const isSelected = orgData.industry === industry.value
                  
                  return (
                    <button
                      key={industry.value}
                      onClick={() => updateOrgData({ 
                        industry: industry.value,
                        branding: {
                          ...orgData.branding,
                          primary_color: industry.primaryColor,
                          secondary_color: getIndustryConfig(industry.value).secondaryColor
                        }
                      })}
                      className={`
                        p-6 rounded-xl border-2 text-left transition-all duration-200 group hover:scale-105
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: industry.primaryColor }}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-2">
                        {industry.label}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {industry.description}
                      </p>
                      
                      <div className="text-xs text-gray-500">
                        Industry-specific templates included
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Branding */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Customize Your Brand
                </h2>
                <p className="text-gray-600">
                  Make it yours with colors and logo (optional)
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      Upload your logo (optional)
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG up to 2MB
                    </p>
                  </div>
                </div>

                {/* Color Scheme */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={orgData.branding.primary_color}
                        onChange={(e) => updateOrgData({
                          branding: { ...orgData.branding, primary_color: e.target.value }
                        })}
                        className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={orgData.branding.primary_color}
                        onChange={(e) => updateOrgData({
                          branding: { ...orgData.branding, primary_color: e.target.value }
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={orgData.branding.secondary_color}
                        onChange={(e) => updateOrgData({
                          branding: { ...orgData.branding, secondary_color: e.target.value }
                        })}
                        className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={orgData.branding.secondary_color}
                        onChange={(e) => updateOrgData({
                          branding: { ...orgData.branding, secondary_color: e.target.value }
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Domain */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Domain (Optional)
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">
                      https://
                    </span>
                    <input
                      type="text"
                      value={orgData.branding.custom_domain || ''}
                      onChange={(e) => updateOrgData({
                        branding: { ...orgData.branding, custom_domain: e.target.value }
                      })}
                      placeholder="app.yourcompany.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    You can set this up later with DNS configuration
                  </p>
                </div>

                {/* Preview */}
                <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                  <div 
                    className="h-16 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: orgData.branding.primary_color }}
                  >
                    {orgData.name || 'Your Organization'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Review & Create
                </h2>
                <p className="text-gray-600">
                  Confirm your organization details
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Organization Summary</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-600">Name</label>
                      <p className="font-medium">{orgData.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-600">Industry</label>
                      <p className="font-medium">
                        {orgData.industry ? getIndustryConfig(orgData.industry).name : 'Not selected'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-600">Primary Color</label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: orgData.branding.primary_color }}
                        />
                        <span className="font-medium">{orgData.branding.primary_color}</span>
                      </div>
                    </div>

                    {orgData.branding.custom_domain && (
                      <div>
                        <label className="text-sm text-gray-600">Custom Domain</label>
                        <p className="font-medium">https://{orgData.branding.custom_domain}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Your organization will be created instantly</li>
                    <li>• Industry-specific templates will be loaded</li>
                    <li>• You'll be redirected to your new workspace</li>
                    <li>• You can invite team members and start working</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Organization
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}