'use client'

import React from 'react'
import Link from 'next/link'
import { track } from '@/lib/analytics'
import type { Solution } from '@/data/solutions'

export default function SolutionCard(props: Solution) {
  const { slug, name, tagline, bullets, demoHref, bookHref, image, smart_code } = props

  return (
    <article className="card h-card" tabIndex={0} data-solution={slug}>
      <div className="g-shell g-animated">
        <div className="g-inner card-glass">
          {image && (
            <div className="p-2">
              <div className="h-36 w-full rounded-xl overflow-hidden">
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
          <div className="px-6 pt-6 pb-6">
            <h3 className="ink text-xl font-semibold">{name}</h3>
            <p className="ink-muted text-sm mt-2 leading-relaxed">{tagline}</p>
            <ul className="ink-muted text-sm mt-3 space-y-1 list-disc pl-5">
              {bullets.map(b => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="pop mt-6 flex gap-3">
              <Link
                href={demoHref}
                className="btn-quiet"
                data-event="solutions_demo_click"
                data-solution={slug}
                onClick={() => track('solutions_demo_click', { solution: slug, smart_code })}
              >
                <span className="relative z-10">View demo</span>
              </Link>
              <Link
                href={bookHref}
                className="btn-gradient"
                data-event="solutions_book_call_click"
                data-solution={slug}
                onClick={() => track('solutions_book_call_click', { solution: slug, smart_code })}
              >
                <span className="relative z-10">Book a call</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
