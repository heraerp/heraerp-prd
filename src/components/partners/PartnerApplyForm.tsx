'use client'

import { useState, useRef } from 'react'

interface FormData {
  firmName: string
  contactName: string
  jobTitle: string
  email: string
  phone: string
  website: string
  region: string
  city: string
  firmSize: string
  specializations: string
  clientBase: string
  erpExperience: string
  message: string
  consent: boolean
  honeypot: string
}

interface FormErrors {
  [key: string]: string
}

interface ValidationModalProps {
  onClose: () => void
}

// Modal Component (matching pricing-request style)
function ValidationModal({ onClose }: ValidationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-card border border-border shadow-xl">
        <div className="p-6">
          <h3 className="ink text-lg font-semibold mb-2">Complete Required Fields</h3>
          <p className="ink-muted text-sm mb-4">
            Please fill in all required fields marked with an asterisk (*) to submit your application.
          </p>
          <button
            onClick={onClose}
            className="btn-gradient w-full border border-border"
            autoFocus
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PartnerApplyForm() {
  const [formData, setFormData] = useState<FormData>({
    firmName: '',
    contactName: '',
    jobTitle: '',
    email: '',
    phone: '',
    website: '',
    region: '',
    city: '',
    firmSize: '',
    specializations: '',
    clientBase: '',
    erpExperience: '',
    message: '',
    consent: false,
    honeypot: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const firstErrorFieldRef = useRef<HTMLElement | null>(null)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firmName.trim() || formData.firmName.length < 2) {
      newErrors.firmName = 'Accounting firm name must be at least 2 characters'
    }
    if (!formData.contactName.trim() || formData.contactName.length < 2) {
      newErrors.contactName = 'Contact name must be at least 2 characters'
    }
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.region) {
      newErrors.region = 'Please select your region'
    }
    if (!formData.firmSize) {
      newErrors.firmSize = 'Please select your firm size'
    }
    if (!formData.specializations) {
      newErrors.specializations = 'Please select at least one specialization'
    }
    if (!formData.erpExperience) {
      newErrors.erpExperience = 'Please select your ERP experience level'
    }
    if (!formData.message.trim() || formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }
    if (!formData.consent) {
      newErrors.consent = 'You must accept the privacy policy to continue'
    }
    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL'
    }

    setErrors(newErrors)

    // Show modal if there are errors
    if (Object.keys(newErrors).length > 0) {
      setShowModal(true)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/partners/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firmName: formData.firmName,
          contactName: formData.contactName,
          jobTitle: formData.jobTitle,
          email: formData.email,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
          region: formData.region,
          city: formData.city || undefined,
          firmSize: formData.firmSize,
          specializations: formData.specializations,
          clientBase: formData.clientBase || undefined,
          erpExperience: formData.erpExperience,
          message: formData.message,
          honeypot: formData.honeypot
        })
      })

      const result = await response.json()

      if (response.ok && result.ok) {
        setIsSuccess(true)
        if (typeof window !== 'undefined' && (window as any).track) {
          (window as any).track('partners_apply_submit', {
            region: formData.region,
            firmSize: formData.firmSize,
            erpExperience: formData.erpExperience
          })
        }
      } else if (response.status === 429) {
        setErrors({ submit: 'Too many requests. Please try again in a few minutes.' })
      } else {
        throw new Error(result.error || 'Failed to submit')
      }
    } catch (error) {
      setErrors({ submit: 'Failed to submit application. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setFormData(prev => ({ ...prev, [name]: newValue }))

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  if (isSuccess) {
    return (
      <main className="mx-auto my-16 w-[92%] max-w-3xl">
        <div className="mx-auto mb-6 h-20 w-full max-w-3xl bg-gradient-to-r from-indigo-500/20 via-fuchsia-400/15 to-cyan-400/20 blur-2xl rounded-3xl" />
        <div className="rounded-3xl bg-card border border-border shadow-xl p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="ink text-2xl font-semibold mb-3">
            Application Received
          </h1>
          <p className="ink-muted mb-6 max-w-lg mx-auto">
            Thank you for your interest in the HERA Accounting Partner Program.
            Our partnership team will review your application and contact you within 1-2 business days.
          </p>
          <div className="flex justify-center gap-3">
            <a href="/partners" className="btn-quiet border border-border">
              Back to partners
            </a>
            <a href="/book-a-meeting" className="btn-gradient border border-border">
              Schedule a call
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <>
      {showModal && <ValidationModal onClose={() => setShowModal(false)} />}

      <main className="mx-auto my-16 w-[92%] max-w-3xl">
        {/* Gradient blur effect */}
        <div className="mx-auto mb-6 h-20 w-full max-w-3xl bg-gradient-to-r from-indigo-500/20 via-fuchsia-400/15 to-cyan-400/20 blur-2xl rounded-3xl" />

        {/* Main content card */}
        <div className="rounded-3xl bg-card border border-border shadow-xl p-6 md:p-8">
          <header className="text-center mb-8">
            <h1 className="ink text-3xl font-semibold mb-3">Accounting Partner Application</h1>
            <p className="ink-muted">
              Join our exclusive network of certified accounting firms implementing HERA ERP solutions
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Honeypot field - hidden from users */}
            <input
              type="text"
              name="company_website"
              value={formData.honeypot}
              onChange={(e) => setFormData(prev => ({ ...prev, honeypot: e.target.value }))}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            {/* Firm Name */}
            <div>
              <label htmlFor="firmName" className="block text-sm font-medium ink mb-1.5">
                Accounting Firm Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firmName"
                name="firmName"
                value={formData.firmName}
                onChange={handleChange}
                placeholder="e.g., Smith & Associates CPAs"
                aria-invalid={!!errors.firmName}
                aria-describedby={errors.firmName ? "firmName-err" : undefined}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink placeholder:ink-muted focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.firmName && (
                <p id="firmName-err" className="text-red-500 text-sm mt-1">{errors.firmName}</p>
              )}
            </div>

            {/* Contact Name and Job Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium ink mb-1.5">
                  Primary Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="Full name"
                  aria-invalid={!!errors.contactName}
                  aria-describedby={errors.contactName ? "contactName-err" : undefined}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink placeholder:ink-muted focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.contactName && (
                  <p id="contactName-err" className="text-red-500 text-sm mt-1">{errors.contactName}</p>
                )}
              </div>

              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium ink mb-1.5">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="e.g., Partner, Managing Director"
                  aria-invalid={!!errors.jobTitle}
                  aria-describedby={errors.jobTitle ? "jobTitle-err" : undefined}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink placeholder:ink-muted focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.jobTitle && (
                  <p id="jobTitle-err" className="text-red-500 text-sm mt-1">{errors.jobTitle}</p>
                )}
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium ink mb-1.5">
                  Business Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="work@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-err" : undefined}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink placeholder:ink-muted focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.email && (
                  <p id="email-err" className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium ink mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink placeholder:ink-muted focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium ink mb-1.5">
                Firm Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.yourfirm.com"
                aria-invalid={!!errors.website}
                aria-describedby={errors.website ? "website-err" : undefined}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink placeholder:ink-muted focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.website && (
                <p id="website-err" className="text-red-500 text-sm mt-1">{errors.website}</p>
              )}
            </div>

            {/* Region and City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="region" className="block text-sm font-medium ink mb-1.5">
                  Region <span className="text-red-500">*</span>
                </label>
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  aria-invalid={!!errors.region}
                  aria-describedby={errors.region ? "region-err" : undefined}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a region</option>
                  <option value="EMEA">EMEA</option>
                  <option value="APAC">APAC</option>
                  <option value="Americas">Americas</option>
                  <option value="Global">Global</option>
                </select>
                {errors.region && (
                  <p id="region-err" className="text-red-500 text-sm mt-1">{errors.region}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium ink mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Dubai, Singapore, London"
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink placeholder:ink-muted focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Firm Size and ERP Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firmSize" className="block text-sm font-medium ink mb-1.5">
                  Firm Size <span className="text-red-500">*</span>
                </label>
                <select
                  id="firmSize"
                  name="firmSize"
                  value={formData.firmSize}
                  onChange={handleChange}
                  aria-invalid={!!errors.firmSize}
                  aria-describedby={errors.firmSize ? "firmSize-err" : undefined}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select firm size</option>
                  <option value="1-10">1-10 Accountants</option>
                  <option value="11-50">11-50 Accountants</option>
                  <option value="51-200">51-200 Accountants</option>
                  <option value="200+">200+ Accountants</option>
                </select>
                {errors.firmSize && (
                  <p id="firmSize-err" className="text-red-500 text-sm mt-1">{errors.firmSize}</p>
                )}
              </div>

              <div>
                <label htmlFor="erpExperience" className="block text-sm font-medium ink mb-1.5">
                  ERP Implementation Experience <span className="text-red-500">*</span>
                </label>
                <select
                  id="erpExperience"
                  name="erpExperience"
                  value={formData.erpExperience}
                  onChange={handleChange}
                  aria-invalid={!!errors.erpExperience}
                  aria-describedby={errors.erpExperience ? "erpExperience-err" : undefined}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select experience level</option>
                  <option value="none">No prior ERP experience</option>
                  <option value="basic">1-5 ERP implementations</option>
                  <option value="intermediate">6-20 ERP implementations</option>
                  <option value="expert">20+ ERP implementations</option>
                </select>
                {errors.erpExperience && (
                  <p id="erpExperience-err" className="text-red-500 text-sm mt-1">{errors.erpExperience}</p>
                )}
              </div>
            </div>

            {/* Specializations */}
            <div>
              <label htmlFor="specializations" className="block text-sm font-medium ink mb-1.5">
                Accounting Specializations <span className="text-red-500">*</span>
              </label>
              <select
                id="specializations"
                name="specializations"
                value={formData.specializations}
                onChange={handleChange}
                aria-invalid={!!errors.specializations}
                aria-describedby={errors.specializations ? "specializations-err" : undefined}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select your primary specialization</option>
                <option value="audit">Audit & Assurance</option>
                <option value="tax">Tax Advisory</option>
                <option value="bookkeeping">Bookkeeping Services</option>
                <option value="consulting">Business Consulting</option>
                <option value="cfo">Virtual CFO Services</option>
                <option value="forensic">Forensic Accounting</option>
                <option value="international">International Tax & Compliance</option>
              </select>
              {errors.specializations && (
                <p id="specializations-err" className="text-red-500 text-sm mt-1">{errors.specializations}</p>
              )}
            </div>

            {/* Client Base */}
            <div>
              <label htmlFor="clientBase" className="block text-sm font-medium ink mb-1.5">
                Primary Client Industries (Optional)
              </label>
              <input
                type="text"
                id="clientBase"
                name="clientBase"
                value={formData.clientBase}
                onChange={handleChange}
                placeholder="e.g., Restaurant, Healthcare, Manufacturing, Professional Services"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink placeholder:ink-muted focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium ink mb-1.5">
                Why do you want to partner with HERA? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "message-err" : undefined}
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border ink placeholder:ink-muted focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Tell us about your firm's experience with ERP implementations, your client base, and how HERA aligns with your business goals..."
              />
              {errors.message && (
                <p id="message-err" className="text-red-500 text-sm mt-1">{errors.message}</p>
              )}
            </div>

            {/* Consent */}
            <div className="p-4 rounded-xl bg-surface-veil border border-border">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                  aria-invalid={!!errors.consent}
                  aria-describedby={errors.consent ? "consent-err" : undefined}
                  className="mt-1 h-4 w-4 rounded border-border bg-background text-indigo-600 focus:ring-2 focus:ring-ring"
                />
                <span className="ink text-sm">
                  I agree to be contacted about the HERA Accounting Partner Program and accept the{' '}
                  <a href="/policy" className="text-indigo-600 hover:text-indigo-700 underline">
                    Privacy Policy
                  </a>
                  . I understand that partnership approval is subject to HERA's qualification criteria.
                  <span className="text-red-500"> *</span>
                </span>
              </label>
              {errors.consent && (
                <p id="consent-err" className="text-red-500 text-sm mt-2 ml-7">{errors.consent}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-gradient px-8 py-3 border border-border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting Application...' : 'Submit Partner Application'}
              </button>
              <a href="/partners" className="btn-quiet px-6 py-3 text-center border border-border">
                Back to Partners
              </a>
            </div>

            {/* Privacy Note */}
            <p className="ink-muted text-xs text-center pt-4">
              Your information will be handled in accordance with our privacy policy.
              Applications are reviewed within 1-2 business days. Qualified firms will be contacted for an initial consultation.
            </p>
          </form>
        </div>
      </main>
    </>
  )
}