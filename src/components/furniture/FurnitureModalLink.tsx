'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { NavigationLink } from '@/components/navigation/NavigationLink'

interface FurnitureModalLinkProps {
  href: string
  icon: React.ElementType
  title: string
  active?: boolean
  onClose: () => void
  onNavigate?: () => void
}

export function FurnitureModalLink({
  href,
  icon: Icon,
  title,
  active,
  onClose,
  onNavigate
}: FurnitureModalLinkProps) {
  return (
    <NavigationLink
      href={href}
      onClick={() => {
        onClose()
        if (onNavigate) onNavigate()
      }}
      className={cn(
        'flex flex-col items-center justify-center p-4 rounded-xl group',
        'bg-muted-foreground/10/30 hover:bg-gradient-to-br hover:from-amber-600/20 hover:to-orange-600/20',
        'border border-[var(--color-border)]/50 hover:border-[var(--color-accent-teal)]/30'
      )}
      activeClassName="!bg-gradient-to-br from-[var(--color-accent-indigo)]/20 to-[var(--color-accent-teal)]/20 !border-[var(--color-accent-teal)]/30"
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all duration-300',
          'bg-gradient-to-br from-gray-700 to-gray-800',
          'group-hover:from-amber-600 group-hover:to-orange-600',
          active && 'from-[var(--color-accent-indigo)] to-[var(--color-accent-teal)]'
        )}
      >
        <Icon
          className={cn(
            'h-6 w-6 transition-colors duration-300',
            active
              ? 'text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'
          )}
        />
      </div>
      <span
        className={cn(
          'text-xs font-medium text-center transition-colors duration-300',
          active
            ? 'text-[var(--color-text-secondary)]'
            : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]'
        )}
      >
        {title}
      </span>
    </NavigationLink>
  )
}
