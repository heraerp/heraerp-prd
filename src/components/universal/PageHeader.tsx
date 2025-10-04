// ================================================================================
// HERA UNIVERSAL PAGE HEADER
// Smart Code: HERA.UI.COMPONENTS.PAGE_HEADER.v1
// Luxury themed page header with consistent typography
// ================================================================================

'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
import { luxuryStyles, LUXURY_COLORS } from '@/lib/theme/luxuryTheme'

interface Breadcrumb {
  label: string
  href?: string
  isActive?: boolean
}

interface PageHeaderProps {
  title: string
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, breadcrumbs = [], actions, className = '' }: PageHeaderProps) {
  // Default breadcrumbs if none provided
  const defaultBreadcrumbs: Breadcrumb[] = [
    { label: 'HERA' },
    { label: 'SALON OS' },
    { label: title, isActive: true }
  ]

  const crumbs = breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs

  return (
    <div
      className={`mb-8 p-6 rounded-xl ${className}`}
      style={{
        backgroundColor: LUXURY_COLORS.charcoalLight,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        border: `1px solid ${LUXURY_COLORS.bronze}20`
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4">
        {crumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4" style={{ color: LUXURY_COLORS.bronze }} />
            )}
            <span
              style={{
                color: crumb.isActive ? LUXURY_COLORS.champagne : LUXURY_COLORS.bronze,
                cursor: crumb.href ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (crumb.href && !crumb.isActive) {
                  window.location.href = crumb.href
                }
              }}
            >
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold" style={{ color: LUXURY_COLORS.champagne }}>
          {title}
        </h1>

        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}

// Export sub-components for consistent styling
export function PageHeaderButton({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  className = ''
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}) {
  const isPrimary = variant === 'primary'

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${className}`}
      style={
        isPrimary
          ? {
              background: `linear-gradient(135deg, ${LUXURY_COLORS.gold} 0%, ${LUXURY_COLORS.goldDark} 100%)`,
              color: LUXURY_COLORS.black,
              boxShadow: '0 2px 4px rgba(212, 175, 55, 0.2)'
            }
          : {
              border: `1px solid ${LUXURY_COLORS.bronze}`,
              color: LUXURY_COLORS.champagne,
              backgroundColor: 'transparent'
            }
      }
      onMouseEnter={e => {
        if (isPrimary) {
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(212, 175, 55, 0.3)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        } else {
          e.currentTarget.style.backgroundColor = `${LUXURY_COLORS.bronze}20`
        }
      }}
      onMouseLeave={e => {
        if (isPrimary) {
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(212, 175, 55, 0.2)'
          e.currentTarget.style.transform = 'translateY(0)'
        } else {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

export function PageHeaderSearch({
  value,
  onChange,
  placeholder = 'Search...',
  className = ''
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
        style={{ color: LUXURY_COLORS.bronze }}
        fill="none"
        strokeWidth="2"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-10 pr-4 py-2 rounded-lg border text-sm w-64 salon-luxe-search-input transition-all"
        style={{
          borderColor: `${LUXURY_COLORS.bronze}33`,
          backgroundColor: LUXURY_COLORS.charcoalDark,
          color: LUXURY_COLORS.lightText,
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
        }}
      />
    </div>
  )
}

export function PageHeaderSelect({
  value,
  onChange,
  options,
  className = ''
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`px-4 py-2 rounded-lg border text-sm ${className}`}
      style={{
        borderColor: `${LUXURY_COLORS.bronze}33`,
        backgroundColor: LUXURY_COLORS.charcoalDark,
        color: LUXURY_COLORS.lightText,
        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
      }}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
