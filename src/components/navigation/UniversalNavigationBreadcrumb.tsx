'use client'

/**
 * Universal Navigation Breadcrumb
 * Smart Code: HERA.UNIVERSAL.NAVIGATION.BREADCRUMB.v1
 * 
 * Dynamic breadcrumb component that works with all navigation levels
 * Integrates with useNavigationConfig for automatic breadcrumb generation
 */

import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home, Building2, LucideIcon } from 'lucide-react'
import { useNavigationConfig } from '@/hooks/useNavigationConfig'
import { Badge } from '@/components/ui/badge'

// Icon mapping for dynamic icon resolution
const ICON_MAP: Record<string, LucideIcon> = {
  'home': Home,
  'building-2': Building2,
  'banknote': Building2, // fallback
  'shopping-cart': Building2, // fallback
  'trending-up': Building2, // fallback
  'book-open': Building2, // fallback
  'credit-card': Building2, // fallback
  'wallet': Building2, // fallback
  'file-text': Building2, // fallback
  'users': Building2, // fallback
  'shield': Building2, // fallback
  'calculator': Building2, // fallback
  'receipt': Building2, // fallback
  'pie-chart': Building2, // fallback
  'target': Building2, // fallback
  'clock': Building2, // fallback
  'check-circle': Building2, // fallback
  'zap': Building2, // fallback
  'activity': Building2 // fallback
}

interface UniversalNavigationBreadcrumbProps {
  className?: string
  showIcons?: boolean
  showIndustryBadge?: boolean
  maxItems?: number
}

export function UniversalNavigationBreadcrumb({
  className = '',
  showIcons = true,
  showIndustryBadge = true,
  maxItems = 5
}: UniversalNavigationBreadcrumbProps) {
  const navigation = useNavigationConfig()

  // Handle case where route is invalid
  if (!navigation.isValidRoute) {
    return (
      <nav className={`flex items-center space-x-1 text-sm text-gray-500 ${className}`}>
        <Link href="/apps" className="flex items-center hover:text-gray-700">
          <Home className="w-4 h-4 mr-1" />
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-red-600">Invalid Route</span>
        {navigation.routeError && (
          <span className="text-xs text-red-500 ml-2">({navigation.routeError})</span>
        )}
      </nav>
    )
  }

  // Truncate breadcrumbs if they exceed maxItems
  let breadcrumbs = navigation.breadcrumbs
  if (breadcrumbs.length > maxItems) {
    breadcrumbs = [
      breadcrumbs[0], // Always keep first (Home)
      { label: '...', href: '#', icon: undefined }, // Ellipsis
      ...breadcrumbs.slice(-(maxItems - 2)) // Keep last (maxItems - 2) items
    ]
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Industry Badge */}
      {showIndustryBadge && navigation.currentIndustry && (
        <Badge 
          variant="secondary" 
          className="bg-violet-100 text-violet-700 border-violet-200 text-xs"
        >
          {navigation.currentIndustry.name}
        </Badge>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-1 text-sm text-gray-600">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1
          const isEllipsis = crumb.label === '...'
          
          // Get icon component
          const IconComponent = crumb.icon ? ICON_MAP[crumb.icon] || Building2 : null

          if (isEllipsis) {
            return (
              <React.Fragment key={index}>
                <span className="text-gray-400">...</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </React.Fragment>
            )
          }

          return (
            <React.Fragment key={index}>
              {isLast ? (
                <span className={`flex items-center font-medium ${
                  crumb.isActive ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  {showIcons && IconComponent && (
                    <IconComponent className="w-4 h-4 mr-1" />
                  )}
                  {crumb.label}
                </span>
              ) : (
                <Link 
                  href={crumb.href}
                  className="flex items-center hover:text-gray-900 transition-colors"
                >
                  {showIcons && IconComponent && (
                    <IconComponent className="w-4 h-4 mr-1" />
                  )}
                  {crumb.label}
                </Link>
              )}

              {!isLast && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </React.Fragment>
          )
        })}
      </nav>
    </div>
  )
}

export default UniversalNavigationBreadcrumb