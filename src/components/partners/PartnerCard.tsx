'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Partner } from '@/data/partners'

interface PartnerCardProps {
  partner: Partner
}

export default function PartnerCard({ partner }: PartnerCardProps) {
  const router = useRouter()

  const handleWebsiteClick = () => {
    if (typeof window !== 'undefined' && (window as any).track) {
      ;(window as any).track('partners_website_click', { slug: partner.slug })
    }
  }

  const handleProfileClick = () => {
    if (typeof window !== 'undefined' && (window as any).track) {
      ;(window as any).track('partners_card_click', { slug: partner.slug })
    }
  }

  return (
    <article
      className="group relative cursor-pointer transform transition-all duration-300 hover:scale-[1.02]"
      tabIndex={0}
      role="link"
      aria-labelledby={`${partner.slug}-title`}
      onClick={e => {
        const t = e.target as HTMLElement
        if (t.closest('a,button,[role="button"]')) return // let real buttons/links work
        router.push(`/partners/${partner.slug}`)
        handleProfileClick()
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          router.push(`/partners/${partner.slug}`)
          handleProfileClick()
        }
      }}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-indigo-500/10 group-hover:via-purple-500/10 group-hover:to-cyan-500/10 rounded-2xl blur-xl transition-all duration-300" />

      <div className="relative card-glass p-6 rounded-2xl h-full flex flex-col border border-border group-hover:border-indigo-500/30 transition-all duration-300 shadow-lg group-hover:shadow-xl">
        {/* Header with Logo and Region */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {partner.logo ? (
              <img
                src={partner.logo}
                alt={`${partner.name} logo`}
                className="h-14 w-14 rounded-xl object-contain border border-border p-2 bg-background"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">{partner.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <span className="px-3 py-1 text-[10px] font-semibold rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            {partner.region}
          </span>
        </div>

        {/* Content */}
        <h3
          id={`${partner.slug}-title`}
          className="ink text-xl font-bold mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
        >
          {partner.name}
        </h3>
        <p className="ink-muted text-sm leading-relaxed mb-4 flex-grow">{partner.summary}</p>

        {/* Specialization Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {partner.tags.map(tag => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Metrics (if available) */}
        {partner.metrics && (
          <div className="flex gap-4 mb-4 pb-4 border-b border-border">
            {partner.metrics.customers && (
              <div className="text-center">
                <div className="ink text-lg font-bold">{partner.metrics.customers}</div>
                <div className="ink-muted text-[10px] uppercase tracking-wider">Clients</div>
              </div>
            )}
            {partner.metrics.projects && (
              <div className="text-center">
                <div className="ink text-lg font-bold">{partner.metrics.projects}</div>
                <div className="ink-muted text-[10px] uppercase tracking-wider">Projects</div>
              </div>
            )}
            {partner.metrics.years && (
              <div className="text-center">
                <div className="ink text-lg font-bold">{partner.metrics.years}</div>
                <div className="ink-muted text-[10px] uppercase tracking-wider">Years</div>
              </div>
            )}
          </div>
        )}

        {/* CTA Row */}
        <div className="mt-auto flex gap-2">
          <Link
            href={`/partners/${partner.slug}`}
            className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border transition-all"
            onClick={handleProfileClick}
          >
            View Profile
          </Link>
          {partner.website && (
            <a
              href={partner.website}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 border border-border shadow-md hover:shadow-lg transition-all"
              onClick={handleWebsiteClick}
            >
              Visit Website
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
