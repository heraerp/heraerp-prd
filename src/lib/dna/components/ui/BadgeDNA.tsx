// ================================================================================
// HERA DNA UI - BADGE COMPONENT
// Smart Code: HERA.DNA.UI.BADGE.v1
// Enhanced badge with proper dark mode contrast
// ================================================================================

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BadgeDNAProps {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  icon?: LucideIcon
  className?: string
}

const variantStyles = {
  default: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700',
  secondary: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
  success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  warning: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  danger: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
}

export function BadgeDNA({
  children,
  variant = 'default',
  icon: Icon,
  className
}: BadgeDNAProps) {
  return (
    <Badge 
      className={cn(
        'gap-1 font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </Badge>
  )
}

// Export preset badges
export const SuccessBadgeDNA = (props: Omit<BadgeDNAProps, 'variant'>) => 
  <BadgeDNA {...props} variant="success" />

export const WarningBadgeDNA = (props: Omit<BadgeDNAProps, 'variant'>) => 
  <BadgeDNA {...props} variant="warning" />

export const DangerBadgeDNA = (props: Omit<BadgeDNAProps, 'variant'>) => 
  <BadgeDNA {...props} variant="danger" />

export const InfoBadgeDNA = (props: Omit<BadgeDNAProps, 'variant'>) => 
  <BadgeDNA {...props} variant="info" />