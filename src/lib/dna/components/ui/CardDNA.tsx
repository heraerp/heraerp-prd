// ================================================================================
// HERA DNA UI - CARD COMPONENT
// Smart Code: HERA.DNA.UI.CARD.v1
// Enhanced card with hover effects and proper dark mode
// ================================================================================

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CardDNAProps {
  title?: string
  icon?: LucideIcon
  iconColor?: string
  iconBgColor?: string
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  borderColor?: string
  onClick?: () => void
}

export function CardDNA({
  title,
  icon: Icon,
  iconColor = 'text-violet-600 dark:text-violet-400',
  iconBgColor = 'bg-violet-100 dark:bg-violet-900',
  children,
  className,
  hoverable = true,
  borderColor = 'hover:border-violet-200 dark:hover:border-violet-800',
  onClick
}: CardDNAProps) {
  return (
    <Card
      className={cn(
        'border-2 transition-all',
        hoverable && borderColor,
        hoverable && 'hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            {Icon && (
              <div
                className={cn('w-8 h-8 rounded-full flex items-center justify-center', iconBgColor)}
              >
                <Icon className={cn('w-4 h-4', iconColor)} />
              </div>
            )}
            <span className="text-base font-medium">{title}</span>
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className={!title ? 'pt-6' : ''}>{children}</CardContent>
    </Card>
  )
}

// Preset card types
export function InfoCardDNA(
  props: Omit<CardDNAProps, 'iconColor' | 'iconBgColor' | 'borderColor'>
) {
  return (
    <CardDNA
      {...props}
      iconColor="text-blue-600 dark:text-blue-400"
      iconBgColor="bg-blue-100 dark:bg-blue-900"
      borderColor="hover:border-blue-200 dark:hover:border-blue-800"
    />
  )
}

export function SuccessCardDNA(
  props: Omit<CardDNAProps, 'iconColor' | 'iconBgColor' | 'borderColor'>
) {
  return (
    <CardDNA
      {...props}
      iconColor="text-green-600 dark:text-green-400"
      iconBgColor="bg-green-100 dark:bg-green-900"
      borderColor="hover:border-green-200 dark:hover:border-green-800"
    />
  )
}

export function WarningCardDNA(
  props: Omit<CardDNAProps, 'iconColor' | 'iconBgColor' | 'borderColor'>
) {
  return (
    <CardDNA
      {...props}
      iconColor="text-amber-600 dark:text-amber-400"
      iconBgColor="bg-amber-100 dark:bg-amber-900"
      borderColor="hover:border-amber-200 dark:hover:border-amber-800"
    />
  )
}

export function DangerCardDNA(
  props: Omit<CardDNAProps, 'iconColor' | 'iconBgColor' | 'borderColor'>
) {
  return (
    <CardDNA
      {...props}
      iconColor="text-red-600 dark:text-red-400"
      iconBgColor="bg-red-100 dark:bg-red-900"
      borderColor="hover:border-red-200 dark:hover:border-red-800"
    />
  )
}
