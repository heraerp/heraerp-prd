'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Building2,
  Users,
  FileCheck,
  Mail,
  Lock,
  User,
  Briefcase,
  MapPin,
  Calendar,
  Award,
  Eye,
  EyeOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: React.ElementType
}

interface AuditFirmData {
  // Personal Info
  full_name: string
  email: string
  password: string
  phone: string

  // Firm Details
  firm_name: string
  firm_code: string
  license_number: string
  established_year: string
  registration_country: string
  website: string

  // Firm Size & Type
  firm_type: 'sole_practitioner' | 'small_practice' | 'mid_tier' | 'big_four'
  partner_count: string
  staff_count: string
  office_locations: string[]

  // Specializations
  specializations: string[]
  quality_control_system: string
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Personal Information',
    description: 'Tell us about yourself',
    icon: User
  },
  {
    id: 2,
    title: 'Firm Details',
    description: 'Your audit practice information',
    icon: Building2
  },
  {
    id: 3,
    title: 'Firm Profile',
    description: 'Size, specializations & setup',
    icon: Briefcase
  },
  {
    id: 4,
    title: 'Complete Setup',
    description: 'Review and create account',
    icon: CheckCircle
  }
]

const FIRM_TYPES = [
  { value: 'sole_practitioner', label: 'Sole Practitioner', icon: User },
  { value: 'small_practice', label: 'Small Practice (2-10)', icon: Users },
  { value: 'mid_tier', label: 'Mid-Tier Firm (11-100)', icon: Building2 },
  { value: 'big_four', label: 'Large Firm (100+)', icon: Briefcase }
]

const SPECIALIZATIONS = [
  'Statutory Audit',
  'Financial Services',
  'Real Estate',
  'Manufacturing',
  'Trading & Distribution',
  'Healthcare',
  'Education',
  'Non-Profit',
  'Government',
  'Tax Advisory',
  'Forensic Accounting',
  'Due Diligence'
]

export function AuditOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<AuditFirmData>({
    // Personal Info
    full_name: '',
    email: '',
    password: '',
    phone: '',

    // Firm Details
    firm_name: '',
    firm_code: '',
    license_number: '',
    established_year: '',
    registration_country: 'Bahrain',
    website: '',

    // Firm Profile
    firm_type: 'small_practice',
    partner_count: '1',
    staff_count: '1',
    office_locations: [''],
    specializations: [],
    quality_control_system: 'ISQC1'
  })

  const updateFormData = (field: keyof AuditFirmData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required'
        if (!formData.email.trim()) newErrors.email = 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
          newErrors.email = 'Valid email is required'
        if (!formData.password) newErrors.password = 'Password is required'
        if (formData.password.length < 8)
          newErrors.password = 'Password must be at least 8 characters'
        break

      case 2:
        if (!formData.firm_name.trim()) newErrors.firm_name = 'Firm name is required'
        if (!formData.firm_code.trim()) newErrors.firm_code = 'Firm code is required'
        if (formData.firm_code.length > 10)
          newErrors.firm_code = 'Firm code must be 10 characters or less'
        if (!formData.license_number.trim()) newErrors.license_number = 'License number is required'
        if (!formData.established_year) newErrors.established_year = 'Established year is required'
        break

      case 3:
        if (!formData.partner_count || parseInt(formData.partner_count) < 1) {
          newErrors.partner_count = 'At least 1 partner required'
        }
        if (!formData.staff_count || parseInt(formData.staff_count) < 1) {
          newErrors.staff_count = 'At least 1 staff member required'
        }
        if (formData.specializations.length === 0) {
          newErrors.specializations = 'Select at least one specialization'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, ONBOARDING_STEPS.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSpecializationToggle = (spec: string) => {
    const current = formData.specializations
    const updated = current.includes(spec) ? current.filter(s => s !== spec) : [...current, spec]
    updateFormData('specializations', updated)
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setIsSubmitting(true)
    try {
      console.log('🚀 Starting audit firm onboarding...')

      // Step 1: Register with Supabase
      console.log('📧 Registering with Supabase...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            user_type: 'audit_firm_admin'
          }
        }
      })

      if (authError) {
        throw new Error(`Supabase registration failed: ${authError.message}`)
      }

      console.log('✅ Supabase registration successful')

      // Step 2: Register audit firm with HERA
      console.log('🏢 Registering audit firm with HERA...')
      const firmRegistration = {
        action: 'register_firm',
        data: {
          // User info
          supabase_user_id: authData.user?.id,
          admin_email: formData.email,
          admin_name: formData.full_name,
          admin_phone: formData.phone,

          // Firm info
          entity_name: formData.firm_name,
          entity_code: formData.firm_code.toUpperCase(),
          license_number: formData.license_number,
          established_year: parseInt(formData.established_year),
          registration_country: formData.registration_country,
          website: formData.website,

          // Firm profile
          firm_type: formData.firm_type,
          partner_count: parseInt(formData.partner_count),
          staff_count: parseInt(formData.staff_count),
          office_locations: formData.office_locations.filter(loc => loc.trim()),
          specializations: formData.specializations,
          quality_control_system: formData.quality_control_system
        }
      }

      const firmResponse = await fetch('/api/v1/audit/firm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.session?.access_token}`
        },
        body: JSON.stringify(firmRegistration)
      })

      const firmResult = await firmResponse.json()

      if (!firmResult.success) {
        throw new Error(`Firm registration failed: ${firmResult.message}`)
      }

      console.log('✅ Audit firm registration successful')

      // Step 3: Set up initial audit system configuration
      console.log('⚙️ Setting up audit system configuration...')

      const configResponse = await fetch('/api/v1/audit/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'initialize_firm',
          firm_id: firmResult.data.id,
          setup_options: {
            create_demo_data: true,
            setup_templates: true,
            configure_workflows: true
          }
        })
      })

      if (configResponse.ok) {
        console.log('✅ Audit system configuration complete')
      }

      // Step 4: Success - move to final step
      setCurrentStep(4)

      // Auto-redirect after showing success
      setTimeout(() => {
        window.location.href = '/login'
      }, 3000)
    } catch (error) {
      console.error('❌ Onboarding error:', error)
      setErrors({ general: error instanceof Error ? error.message : 'Registration failed' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium ink mb-2">Full Name *</label>
              <Input
                value={formData.full_name}
                onChange={e => updateFormData('full_name', e.target.value)}
                placeholder="Enter your full name"
                className={errors.full_name ? 'border-red-300' : ''}
              />
              {errors.full_name && <p className="text-red-600 text-sm mt-1">{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium ink mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => updateFormData('email', e.target.value)}
                placeholder="your.email@firm.com"
                className={errors.email ? 'border-red-300' : ''}
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium ink mb-2">Password *</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => updateFormData('password', e.target.value)}
                  placeholder="Create a secure password"
                  className={errors.password ? 'border-red-300' : ''}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium ink mb-2">Phone Number</label>
              <Input
                value={formData.phone}
                onChange={e => updateFormData('phone', e.target.value)}
                placeholder="+973 1234 5678"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium ink mb-2">Firm Name *</label>
                <Input
                  value={formData.firm_name}
                  onChange={e => updateFormData('firm_name', e.target.value)}
                  placeholder="ABC Audit Partners"
                  className={errors.firm_name ? 'border-red-300' : ''}
                />
                {errors.firm_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.firm_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium ink mb-2">Firm Code *</label>
                <Input
                  value={formData.firm_code}
                  onChange={e => updateFormData('firm_code', e.target.value.toUpperCase())}
                  placeholder="ABC"
                  maxLength={10}
                  className={errors.firm_code ? 'border-red-300' : ''}
                />
                {errors.firm_code && (
                  <p className="text-red-600 text-sm mt-1">{errors.firm_code}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium ink mb-2">
                  License Number *
                </label>
                <Input
                  value={formData.license_number}
                  onChange={e => updateFormData('license_number', e.target.value)}
                  placeholder="AUD-BH-2025-001"
                  className={errors.license_number ? 'border-red-300' : ''}
                />
                {errors.license_number && (
                  <p className="text-red-600 text-sm mt-1">{errors.license_number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium ink mb-2">
                  Established Year *
                </label>
                <Input
                  type="number"
                  value={formData.established_year}
                  onChange={e => updateFormData('established_year', e.target.value)}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear()}
                  className={errors.established_year ? 'border-red-300' : ''}
                />
                {errors.established_year && (
                  <p className="text-red-600 text-sm mt-1">{errors.established_year}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium ink mb-2">Website</label>
              <Input
                value={formData.website}
                onChange={e => updateFormData('website', e.target.value)}
                placeholder="https://www.yourfirm.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium ink mb-2">
                Registration Country
              </label>
              <select
                value={formData.registration_country}
                onChange={e => updateFormData('registration_country', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Bahrain">Bahrain</option>
                <option value="UAE">United Arab Emirates</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Kuwait">Kuwait</option>
                <option value="Qatar">Qatar</option>
                <option value="Oman">Oman</option>
              </select>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium ink mb-3">Firm Type *</label>
              <div className="grid grid-cols-2 gap-3">
                {FIRM_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateFormData('firm_type', type.value)}
                    className={`p-4 border rounded-lg text-left transition-all ${ formData.firm_type === type.value ?'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-border hover:border-border'
                    }`}
                  >
                    <type.icon className="w-5 h-5 mb-2" />
                    <div className="font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium ink mb-2">
                  Number of Partners *
                </label>
                <Input
                  type="number"
                  value={formData.partner_count}
                  onChange={e => updateFormData('partner_count', e.target.value)}
                  min="1"
                  className={errors.partner_count ? 'border-red-300' : ''}
                />
                {errors.partner_count && (
                  <p className="text-red-600 text-sm mt-1">{errors.partner_count}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium ink mb-2">
                  Total Staff Count *
                </label>
                <Input
                  type="number"
                  value={formData.staff_count}
                  onChange={e => updateFormData('staff_count', e.target.value)}
                  min="1"
                  className={errors.staff_count ? 'border-red-300' : ''}
                />
                {errors.staff_count && (
                  <p className="text-red-600 text-sm mt-1">{errors.staff_count}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium ink mb-3">
                Specializations * (Select all that apply)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SPECIALIZATIONS.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => handleSpecializationToggle(spec)}
                    className={`p-2 text-xs border rounded-md transition-all ${ formData.specializations.includes(spec) ?'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-border hover:border-border'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
              {errors.specializations && (
                <p className="text-red-600 text-sm mt-1">{errors.specializations}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium ink mb-2">
                Main Office Location
              </label>
              <Input
                value={formData.office_locations[0]}
                onChange={e => updateFormData('office_locations', [e.target.value])}
                placeholder="Manama, Bahrain"
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center space-y-6">
            {isSubmitting ? (
              <div className="space-y-4">
                <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                <h3 className="text-xl font-semibold text-gray-100">
                  Setting up your audit firm...
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✅ Creating Supabase account</p>
                  <p>✅ Registering audit firm</p>
                  <p>⏳ Configuring audit system</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-100">Registration Successful!</h3>
                <p className="text-muted-foreground">
                  Your audit firm has been successfully registered. You'll be redirected to the
                  login page shortly.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">What's Next?</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Check your email for verification link</li>
                    <li>• Log in with your credentials</li>
                    <li>• Start creating audit engagements</li>
                    <li>• Invite your team members</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-2xl border-0 bg-background/90 backdrop-blur-xl">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-foreground" />
            </div>

            <CardTitle className="text-2xl font-light text-gray-100">
              Join HERA Audit Platform
            </CardTitle>

            <p className="text-muted-foreground mt-2">Set up your audit firm in minutes</p>

            {/* Progress Steps */}
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-4">
                {ONBOARDING_STEPS.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${ currentStep >= step.id ?'border-blue-500 bg-blue-500 text-foreground'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </div>
                    {index < ONBOARDING_STEPS.length - 1 && (
                      <div
                        className={`w-8 h-0.5 ${ currentStep > step.id ?'bg-blue-500' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium text-gray-100">
                {ONBOARDING_STEPS[currentStep - 1]?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {ONBOARDING_STEPS[currentStep - 1]?.description}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}

            {renderStep()}

            {/* Navigation Buttons */}
            {currentStep < 4 && (
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>

                {currentStep === 3 ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleNext} className="flex items-center gap-2">
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
