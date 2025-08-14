'use client'

import React, { useState } from 'react'
import { useAuth } from './DualAuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  Apple, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle, 
  Loader2, 
  User, 
  Building2,
  Sparkles,
  Coffee,
  ShoppingBag,
  Stethoscope,
  Hammer,
  GraduationCap,
  Utensils
} from 'lucide-react'

interface JobsRegistrationWizardProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
  className?: string
}

interface FormData {
  // Step 1: Personal Info
  fullName: string
  email: string
  password: string
  confirmPassword: string
  
  // Step 2: Business Info
  businessName: string
  businessType: string
}

interface FormErrors {
  [key: string]: string
}

type WizardStep = 1 | 2 | 3

const businessTypes = [
  { id: 'restaurant', name: 'Restaurant', icon: Utensils, color: 'from-orange-500 to-red-500' },
  { id: 'retail', name: 'Retail Store', icon: ShoppingBag, color: 'from-blue-500 to-purple-500' },
  { id: 'healthcare', name: 'Healthcare', icon: Stethoscope, color: 'from-green-500 to-emerald-500' },
  { id: 'manufacturing', name: 'Manufacturing', icon: Hammer, color: 'from-gray-600 to-gray-800' },
  { id: 'education', name: 'Education', icon: GraduationCap, color: 'from-indigo-500 to-blue-600' },
  { id: 'services', name: 'Professional Services', icon: Coffee, color: 'from-amber-500 to-orange-500' },
]

export function JobsRegistrationWizard({ onSuccess, onSwitchToLogin, className = '' }: JobsRegistrationWizardProps) {
  const { register, isLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Update form data
  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Validate current step
  const validateStep = (step: WizardStep): boolean => {
    const newErrors: FormErrors = {}

    if (step === 1) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required'
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }

      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    if (step === 2) {
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business name is required'
      }

      if (!formData.businessType) {
        newErrors.businessType = 'Please select a business type'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => (prev + 1) as WizardStep)
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(prev => (prev - 1) as WizardStep)
    setErrors({})
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(2)) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        business_name: formData.businessName,
        business_type: formData.businessType
      })

      if (result.success) {
        setCurrentStep(3) // Show success step
        setTimeout(() => {
          onSuccess?.()
        }, 2000)
      } else {
        setErrors({ general: result.error || 'Registration failed. Please try again.' })
        setCurrentStep(2) // Go back to business info step
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
      setCurrentStep(2)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormDisabled = isLoading || isSubmitting

  // Step 1: Personal Information
  const renderPersonalInfo = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">Let's start with your details</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => updateFormData('fullName', e.target.value)}
            onFocus={() => setFocusedField('fullName')}
            onBlur={() => setFocusedField(null)}
            disabled={isFormDisabled}
            className={`h-14 rounded-2xl border-2 bg-white/70 backdrop-blur-sm transition-all duration-200 ${
              errors.fullName 
                ? 'border-red-300 focus:border-red-500' 
                : focusedField === 'fullName'
                ? 'border-blue-400 shadow-lg shadow-blue-400/20'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            placeholder="Enter your full name"
            autoComplete="name"
          />
          {errors.fullName && (
            <p className="text-sm text-red-600">{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            disabled={isFormDisabled}
            className={`h-14 rounded-2xl border-2 bg-white/70 backdrop-blur-sm transition-all duration-200 ${
              errors.email 
                ? 'border-red-300 focus:border-red-500' 
                : focusedField === 'email'
                ? 'border-blue-400 shadow-lg shadow-blue-400/20'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            placeholder="Enter your email"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              disabled={isFormDisabled}
              className={`h-14 rounded-2xl border-2 bg-white/70 backdrop-blur-sm transition-all duration-200 pr-14 ${
                errors.password 
                  ? 'border-red-300 focus:border-red-500' 
                  : focusedField === 'password'
                  ? 'border-blue-400 shadow-lg shadow-blue-400/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="Create a password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isFormDisabled}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => updateFormData('confirmPassword', e.target.value)}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
              disabled={isFormDisabled}
              className={`h-14 rounded-2xl border-2 bg-white/70 backdrop-blur-sm transition-all duration-200 pr-14 ${
                errors.confirmPassword 
                  ? 'border-red-300 focus:border-red-500' 
                  : focusedField === 'confirmPassword'
                  ? 'border-blue-400 shadow-lg shadow-blue-400/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isFormDisabled}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Next Button */}
      <Button
        onClick={handleNext}
        disabled={isFormDisabled}
        className="w-full h-14 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-medium rounded-2xl shadow-lg shadow-gray-900/25 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Continue
        <ArrowRight className="w-5 h-5 ml-3" />
      </Button>
    </div>
  )

  // Step 2: Business Information
  const renderBusinessInfo = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-lg">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">Business Information</h2>
        <p className="text-gray-600">Tell us about your business</p>
      </div>

      {/* Business Name */}
      <div className="space-y-2">
        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
          Business Name
        </label>
        <Input
          id="businessName"
          type="text"
          value={formData.businessName}
          onChange={(e) => updateFormData('businessName', e.target.value)}
          onFocus={() => setFocusedField('businessName')}
          onBlur={() => setFocusedField(null)}
          disabled={isFormDisabled}
          className={`h-14 rounded-2xl border-2 bg-white/70 backdrop-blur-sm transition-all duration-200 ${
            errors.businessName 
              ? 'border-red-300 focus:border-red-500' 
              : focusedField === 'businessName'
              ? 'border-blue-400 shadow-lg shadow-blue-400/20'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          placeholder="Enter your business name"
        />
        {errors.businessName && (
          <p className="text-sm text-red-600">{errors.businessName}</p>
        )}
      </div>

      {/* Business Type */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Business Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {businessTypes.map((type) => {
            const IconComponent = type.icon
            const isSelected = formData.businessType === type.id
            
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => updateFormData('businessType', type.id)}
                disabled={isFormDisabled}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-400/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white/70'
                } backdrop-blur-sm`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-center leading-tight">
                    {type.name}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        {errors.businessType && (
          <p className="text-sm text-red-600">{errors.businessType}</p>
        )}
      </div>

      {/* Error Alert */}
      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
          <p className="text-sm text-red-700 text-center">{errors.general}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={handlePrevious}
          disabled={isFormDisabled}
          variant="outline"
          className="flex-1 h-14 rounded-2xl border-2 border-gray-200 hover:border-gray-300 bg-white/70 backdrop-blur-sm text-gray-700 font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="w-5 h-5 mr-3" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isFormDisabled || !formData.businessName || !formData.businessType}
          className="flex-1 h-14 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-medium rounded-2xl shadow-lg shadow-gray-900/25 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="w-5 h-5 ml-3" />
            </>
          )}
        </Button>
      </div>
    </div>
  )

  // Step 3: Success
  const renderSuccess = () => (
    <div className="text-center space-y-8">
      {/* Success Icon */}
      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>

      {/* Success Message */}
      <div>
        <h2 className="text-3xl font-light text-gray-900 mb-3">Welcome to HERA!</h2>
        <p className="text-gray-600 leading-relaxed">
          Your account has been created successfully.<br />
          We're setting up your business profile now.
        </p>
      </div>

      {/* Loading Animation */}
      <div className="flex justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 ${className}`}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md mx-4">
        {/* Main Card */}
        <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl shadow-black/5 overflow-hidden">
          {/* Logo Header */}
          <div className="p-8 pb-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
              <Apple className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-light text-gray-900 tracking-tight">Create Account</h1>
          </div>

          {/* Progress Indicator */}
          <div className="px-8 pb-6">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-8 h-0.5 mx-2 transition-all duration-200 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 pb-8">
            {currentStep === 1 && renderPersonalInfo()}
            {currentStep === 2 && renderBusinessInfo()}
            {currentStep === 3 && renderSuccess()}
          </div>

          {/* Login Link */}
          {currentStep < 3 && onSwitchToLogin && (
            <div className="px-8 pb-8 pt-4 border-t border-gray-100 text-center">
              <p className="text-gray-600 mb-4">
                Already have an account?
              </p>
              <Button
                type="button"
                onClick={onSwitchToLogin}
                disabled={isFormDisabled}
                variant="outline"
                className="w-full h-12 rounded-2xl border-2 border-gray-200 hover:border-gray-300 bg-white/70 backdrop-blur-sm text-gray-700 font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign In Instead
              </Button>
            </div>
          )}
        </div>

        {/* API Status */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Powered by Supabase + HERA
          </p>
        </div>
      </div>
    </div>
  )
}

export default JobsRegistrationWizard