'use client'

import { useState } from 'react'

interface NewsletterSignupProps {
  className?: string
}

export default function NewsletterSignup({ className = '' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'blog_sidebar' })
      })

      if (response.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch (error) {
      setStatus('error')
    }
  }

  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 ${className}`}
    >
      <h3 className="mb-2 text-lg font-semibold ink dark:text-gray-100">Weekly Growth Tips</h3>
      <p className="mb-4 text-sm ink-muted dark:text-gray-300">
        Join 3,000+ UK business owners getting actionable insights.
      </p>

      {status === 'success' ? (
        <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3 text-sm text-green-700 dark:text-green-300">
          ✓ Thanks! Check your inbox to confirm.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={status === 'loading'}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm ink dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:dark:bg-gray-600"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
          </button>

          {status === 'error' && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Something went wrong. Please try again.
            </p>
          )}

          <p className="text-xs dark:ink-muted">No spam. Unsubscribe anytime.</p>
        </form>
      )}
    </div>
  )
}
