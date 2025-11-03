'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Sparkles,
  ChevronDown,
  X
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import AIAssistant from './AIAssistant'

// Professional Toast Component
const Toast = ({ message, type, isVisible, onClose }: {
  message: string
  type: 'success' | 'error' | 'info'
  isVisible: boolean
  onClose: () => void
}) => {
  if (!isVisible) return null

  const getToastStyles = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'info': return <Building2 className="w-5 h-5 text-blue-600" />
      default: return null
    }
  }

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right duration-300">
      <div className={`${getToastStyles()} rounded-xl border p-4 shadow-lg backdrop-blur-xl bg-white/90 min-w-[320px] max-w-md`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-relaxed">{message}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Section Definition Interface
interface FormSection {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  required: boolean
  description: string
}

// Field Definition Interface
interface FormField {
  id: string
  label: string
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'number' | 'url'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string; description?: string }>
  validation?: (value: string) => string | null
  section: string
}

// Master Data Template Props
interface HERAMasterDataTemplateProps {
  entityType: string
  entityLabel: string
  sections: FormSection[]
  fields: FormField[]
  backUrl: string
  onSubmit: (data: Record<string, any>) => Promise<void>
  defaultValues?: Record<string, any>
  className?: string
}

export function HERAMasterDataTemplate({
  entityType,
  entityLabel,
  sections,
  fields,
  backUrl,
  onSubmit,
  defaultValues = {},
  className = ''
}: HERAMasterDataTemplateProps) {
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()

  const [currentSection, setCurrentSection] = useState(sections[0]?.id || '')
  const [formData, setFormData] = useState<Record<string, any>>(defaultValues)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  })
  const [aiInsights, setAiInsights] = useState<any[]>([])

  // Toast helper functions
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 5000)
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])

  // Update form data with validation
  const updateFormData = useCallback((fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    
    // Auto-generate entity code from name
    if (fieldId.includes('name') && value) {
      const codeField = fieldId.replace('name', 'code')
      const code = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)
      setFormData(prev => ({ ...prev, [codeField]: code }))
    }
    
    // Clear validation error
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }, [validationErrors])

  // Validate section
  const validateSection = useCallback((sectionId: string): boolean => {
    const sectionFields = fields.filter(field => field.section === sectionId)
    const errors: Record<string, string> = {}
    
    sectionFields.forEach(field => {
      const value = formData[field.id] || ''
      
      if (field.required && !value.trim()) {
        errors[field.id] = `${field.label} is required`
      } else if (field.validation && value) {
        const validationError = field.validation(value)
        if (validationError) {
          errors[field.id] = validationError
        }
      }
    })
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, fields])

  // Section navigation
  const handleSectionNavigation = useCallback((direction: 'next' | 'prev') => {
    const currentIndex = sections.findIndex(section => section.id === currentSection)
    
    if (direction === 'next') {
      if (!validateSection(currentSection)) return
      if (currentIndex < sections.length - 1) {
        setCurrentSection(sections[currentIndex + 1].id)
      }
    } else {
      if (currentIndex > 0) {
        setCurrentSection(sections[currentIndex - 1].id)
      }
    }
  }, [currentSection, validateSection, sections])

  // Submit handler
  const handleSubmit = useCallback(async () => {
    // Validate all required sections
    const requiredSections = sections.filter(section => section.required)
    let isValid = true
    
    for (const section of requiredSections) {
      if (!validateSection(section.id)) {
        isValid = false
      }
    }
    
    if (!isValid) {
      showToast('Please complete all required fields before submitting.', 'error')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
      showToast(
        `${entityLabel} "${formData[`${entityType}_name`] || formData.entity_name}" has been successfully created. Redirecting...`,
        'success'
      )
      
      setTimeout(() => router.push(backUrl), 2000)
    } catch (error) {
      console.error('Submit error:', error)
      showToast('Failed to create entity. Please check your inputs and try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, entityLabel, entityType, router, backUrl, onSubmit, sections, validateSection, showToast])

  // Authentication checks
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access master data management.</p>
        </div>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Organization Context Required</h2>
          <p className="text-gray-600">Please select an organization to continue.</p>
        </div>
      </div>
    )
  }

  // Get current section data
  const currentSectionData = sections.find(s => s.id === currentSection)
  const currentSectionFields = fields.filter(f => f.section === currentSection)

  // Render field based on type
  const renderField = (field: FormField) => {
    const value = formData[field.id] || ''
    const hasError = !!validationErrors[field.id]

    const baseInputClass = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`

    switch (field.type) {
      case 'select':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && '*'}
            </label>
            <select
              value={value}
              onChange={(e) => updateFormData(field.id, e.target.value)}
              className={baseInputClass}
            >
              <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.description && ` - ${option.description}`}
                </option>
              ))}
            </select>
          </div>
        )

      case 'textarea':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && '*'}
            </label>
            <textarea
              value={value}
              onChange={(e) => updateFormData(field.id, e.target.value)}
              rows={3}
              className={baseInputClass}
              placeholder={field.placeholder}
            />
          </div>
        )

      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && '*'}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => updateFormData(field.id, e.target.value)}
              className={baseInputClass}
              placeholder={field.placeholder}
            />
          </div>
        )
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">New {entityLabel}</h1>
              <p className="text-xs text-gray-600">HERA Master Data</p>
            </div>
          </div>
          <button 
            onClick={() => router.push(backUrl)}
            className="min-w-[44px] min-h-[44px] rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 lg:p-6">
          
          {/* Left sidebar - Section navigation */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6">
              <div className="bg-white backdrop-blur-xl bg-white/80 rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Create {entityLabel}</h2>
                
                <nav className="space-y-2">
                  {sections.map((section, index) => {
                    const Icon = section.icon
                    const isActive = currentSection === section.id
                    const isCompleted = index < sections.findIndex(s => s.id === currentSection)
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => setCurrentSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                          isCompleted 
                            ? 'bg-green-100 text-green-600'
                            : isActive 
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{section.label}</div>
                          {section.required && (
                            <div className="text-xs text-gray-500">Required</div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </nav>
                
                {/* Progress indicator */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round((sections.findIndex(s => s.id === currentSection) + 1) / sections.length * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(sections.findIndex(s => s.id === currentSection) + 1) / sections.length * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-6">
            <div className="bg-white backdrop-blur-xl bg-white/80 rounded-2xl border border-gray-200/50 shadow-xl">
              
              {/* Section header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {currentSectionData && (
                    <>
                      <currentSectionData.icon className="w-6 h-6 text-blue-600" />
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">{currentSectionData.label}</h1>
                        <p className="text-gray-600">{currentSectionData.description}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Form content */}
              <div className="p-6">
                <div className="space-y-6">
                  {currentSectionFields.map(field => (
                    <div key={field.id}>
                      {renderField(field)}
                      {validationErrors[field.id] && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors[field.id]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Navigation footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => handleSectionNavigation('prev')}
                  disabled={currentSection === sections[0]?.id}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex items-center gap-3">
                  {currentSection === sections[sections.length - 1]?.id ? (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Create {entityLabel}
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSectionNavigation('next')}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right sidebar - AI Assistant */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6">
              <AIAssistant
                entityType={entityType}
                formData={formData}
                onInsightUpdate={setAiInsights}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile bottom spacing */}
      <div className="h-24 lg:h-0" />

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}

export default HERAMasterDataTemplate