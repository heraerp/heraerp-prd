'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { NavigationLink } from '@/components/navigation/NavigationLink'

interface FurnitureNavigationLinkProps {
  href: string
  icon: React.ElementType
  title: string
  badge?: string
  badgeColor?: string
  active?: boolean
  onClick?: () => void
}

export function FurnitureNavigationLink({
  href,
  icon: Icon,
  title,
  badge,
  badgeColor,
  active,
  onClick
}: FurnitureNavigationLinkProps) {
  return (
    <NavigationLink
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center lg:flex-col lg:items-center justify-start lg:justify-center py-3 lg:py-2 px-4 lg:px-0 group relative',
        'text-gray-400 hover:text-white hover:bg-gray-700/50'
      )}
      activeClassName="!bg-gradient-to-r from-amber-600/20 to-orange-600/20 !text-white"
    >
      <div className="relative">
        <Icon
          className={cn(
            'h-5 w-5 transition-colors duration-300',
            active ? 'text-amber-400' : 'text-gray-400 group-hover:text-amber-400'
          )}
        />

        {/* Badge indicator */}
        {badge && (
          <span
            className={cn(
              'absolute -top-2 -right-2 text-[9px] px-1 py-0.5 rounded-full text-white min-w-[16px] text-center',
              badgeColor || 'bg-gray-600'
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Text label - full text on mobile, abbreviated on desktop */}
      <span
        className={cn(
          'ml-3 lg:ml-0 lg:mt-0.5 font-medium text-sm lg:text-[9px] lg:text-center leading-tight transition-colors duration-300',
          active
            ? 'text-amber-400'
            : 'text-gray-300 lg:text-gray-500 group-hover:text-gray-100 lg:group-hover:text-gray-300'
        )}
      >
        {title}
      </span>

      {/* Tooltip for full title - desktop only */}
      <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
        <p className="font-medium">{title}</p>
        {badge && (
          <p className="text-xs text-gray-400 mt-1">
            {badge}{' '}
            {title === 'Sales' ? 'active orders' : title === 'Production' ? 'in queue' : 'alerts'}
          </p>
        )}
      </div>
    </NavigationLink>
  )
}
