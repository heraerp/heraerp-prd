'use client'

import React from 'react'

const FAQ_ITEMS = [
  {
    q: 'Is pricing per-user or per-site?',
    a: 'We scope by modules and usage. User count and locations are inputs to determine the right package and pricing for your needs.'
  },
  {
    q: "What's the minimum term?",
    a: 'Choose monthly or annual contracts. Annual commitments unlock significant discounts and priority support.'
  },
  {
    q: 'How does onboarding work?',
    a: 'We plan onboarding based on complexity. Use the configurator above to see your estimated timeline. All packages include guided onboarding.'
  },
  {
    q: 'Are there discounts available?',
    a: 'Yes, discounts are available for annual commitments, multi-site deployments, and early-stage startups.'
  },
  {
    q: 'Can we start with a pilot?',
    a: 'Absolutely. Many clients start with the Essential package for a pilot team, then expand to Growth or Enterprise.'
  },
  {
    q: 'What about custom requirements?',
    a: 'Enterprise packages include custom module development, integrations, and compliance features tailored to your industry.'
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, idx) => (
        <div key={idx} className="card-glass rounded-xl border border-border">
          <button
            className="w-full px-6 py-4 text-left flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-ring rounded-xl"
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            aria-expanded={openIndex === idx}
            aria-controls={`faq-answer-${idx}`}
          >
            <span className="ink font-medium">{item.q}</span>
            <svg
              className={`h-5 w-5 ink-muted transition-transform ${openIndex === idx ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {openIndex === idx && (
            <div id={`faq-answer-${idx}`} className="px-6 pb-4">
              <p className="ink-muted text-sm">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
