import { Metadata } from 'next'
import LeadForm from '@/components/LeadForm'

export const metadata: Metadata = {
  title: 'Free SMB Growth Guide | HERA ERP',
  description:
    'Download our free guide: 30 proven tactics to streamline operations, improve cash flow, and scale your business. No credit card required.',
  openGraph: {
    title: 'Free SMB Growth Guide - Transform Your Business in 30 Days',
    description:
      'Practical, no-fluff tactics used by 500+ UK businesses to save 15+ hours per week.',
    type: 'website'
  }
}

export default function FreeGuidePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Benefits */}
          <div>
            <h1 className="mb-6 text-4xl font-bold ink sm:text-5xl">Your Free SMB Growth Guide</h1>
            <p className="mb-8 text-xl ink-muted">
              Join 3,000+ UK business owners who've downloaded our practical guide to streamline
              operations and boost profitability.
            </p>

            <div className="mb-8 space-y-4">
              <h2 className="text-2xl font-semibold ink">What's Inside:</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>
                    <strong>Month-End in Hours, Not Days:</strong> 5-step process to close your
                    books 80% faster
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>
                    <strong>Customer Retention Playbook:</strong> Turn one-time buyers into repeat
                    revenue
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>
                    <strong>Multi-Location Scaling:</strong> Proven framework for managing multiple
                    sites
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>
                    <strong>Cash Flow Forecasting:</strong> Simple templates for 30-day visibility
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>
                    <strong>Team Productivity Hacks:</strong> Cut admin time by 60% with automation
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl bg-white/50 p-6">
              <h3 className="mb-3 font-semibold ink">What Readers Say:</h3>
              <blockquote className="italic ink">
                "This guide helped us reduce month-end from 5 days to 1 day. The cash flow templates
                alone were worth downloading."
              </blockquote>
              <p className="mt-2 text-sm ink-muted">— Sarah M., Restaurant Owner, Manchester</p>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-semibold ink">Get Your Free Guide</h2>
            <LeadForm formId="free-guide-page" />

            <div className="mt-8 space-y-2 text-center text-sm ink-muted">
              <p>🎯 Average read time: 18 minutes</p>
              <p>📊 Includes: Templates, checklists, calculators</p>
              <p>🚀 Instant download to your email</p>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-16 border-t pt-8">
          <div className="flex flex-wrap justify-center gap-8 text-sm ink-muted">
            <span className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              500+ UK businesses
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              4.9/5 customer rating
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              ISO 27001 certified
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              UK data centres
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
