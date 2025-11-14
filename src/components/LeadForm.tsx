'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'

interface LeadFormProps {
  redirectTo?: string
  formId?: string
  className?: string
}

function LeadFormContent({
  redirectTo = '/thank-you',
  formId = 'blog-lead-form',
  className = ''
}: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Add UTM parameters
    searchParams.forEach((value, key) => {
      if (key.startsWith('utm_')) {
        formData.append(key, value)
      }
    })

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        // Track conversion if GTM is available
        if (typeof window !== 'undefined' && (window as any).dataLayer) {
          ;(window as any).dataLayer.push({
            event: 'lead_capture',
            form_id: formId,
            lead_source: 'blog'
          })
        }

        window.location.href = redirectTo
      } else {
        throw new Error('Failed to submit form')
      }
    } catch (err) {
      setError('Something went wrong. Please try again or email us directly.')
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`max-w-lg space-y-4 ${className}`}
      data-form-id={formId}
    >
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium ink">
          Your Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="John Smith"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-colors focus:border-blue-500 focus:outline-none"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium ink">
          Work Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="john@company.co.uk"
          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-colors focus:border-blue-500 focus:outline-none"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="company" className="mb-1 block text-sm font-medium ink">
          Company Name
        </label>
        <input
          id="company"
          name="company"
          type="text"
          placeholder="Acme Ltd (optional)"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-colors focus:border-blue-500 focus:outline-none"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium ink">
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="07123 456789 (optional)"
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-colors focus:border-blue-500 focus:outline-none"
          disabled={isSubmitting}
        />
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-semibold text-white transition-all hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Get Your Free Guide'}
      </button>

      <p className="text-center text-xs ink-muted">
        🔒 Your data is safe. No spam, ever.
        <br />
        By submitting, you agree to our{' '}
        <a href="/privacy" className="underline hover:ink">
          Privacy Policy
        </a>
      </p>
    </form>
  )
}

export default function LeadForm(props: LeadFormProps) {
  return (
    <Suspense fallback={<div />}>
      <LeadFormContent {...props} />
    </Suspense>
  )
}
