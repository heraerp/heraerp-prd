// ================================================================================
// HERA DNA UI - BUTTON COMPONENT
// Smart Code: HERA.DNA.UI.BUTTON.v1
// Enhanced button with consistent dark mode styling
// ================================================================================

import React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ButtonDNAProps extends ButtonProps {
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  loadingText?: string
}

export function ButtonDNA({
  children,
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  loadingText = 'Loading...',
  disabled,
  className,
  ...props
}: ButtonDNAProps) {
  const isDisabled = disabled || loading

  return (
    <Button
      {...props}
      disabled={isDisabled}
      className={cn(
        'gap-2 font-medium transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          {loadingText}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </Button>
  )
}

// Preset button variants with proper dark mode support
export function PrimaryButtonDNA(props: ButtonDNAProps) {
  return (
    <ButtonDNA
      {...props}
      className={cn(
        'bg-violet-600 hover:bg-violet-700 text-white',
        'dark:bg-violet-600 dark:hover:bg-violet-700',
        props.className
      )}
    />
  )
}

export function SecondaryButtonDNA(props: ButtonDNAProps) {
  return (
    <ButtonDNA
      {...props}
      variant="outline"
      className={cn(
        'border-gray-300 dark:border-gray-600',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'text-gray-700 dark:text-gray-300',
        props.className
      )}
    />
  )
}

export function DangerButtonDNA(props: ButtonDNAProps) {
  return (
    <ButtonDNA
      {...props}
      className={cn(
        'bg-red-600 hover:bg-red-700 text-white',
        'dark:bg-red-600 dark:hover:bg-red-700',
        props.className
      )}
    />
  )
}

export function GhostButtonDNA(props: ButtonDNAProps) {
  return (
    <ButtonDNA
      {...props}
      variant="ghost"
      className={cn(
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'text-gray-700 dark:text-gray-300',
        props.className
      )}
    />
  )
}