/**
 * Luxe Button Component for Salon App
 *
 * Premium button component with glassmorphism effects, gradients,
 * and luxury animations for salon management interface.
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button, ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface LuxeButtonProps extends ButtonProps {
  variant?: 'default' | 'gradient' | 'glass' | 'outline' | 'ghost' | 'luxury'
  gradientType?: 'primary' | 'gold' | 'rose' | 'sunset'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  glow?: boolean
  children: React.ReactNode
}

export function LuxeButton({
  variant = 'default',
  gradientType = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  glow = false,
  className,
  disabled,
  children,
  ...props
}: LuxeButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'gradient':
        const gradients = {
          primary: cn(
            'bg-gradient-to-r from-purple-500 to-purple-600',
            'hover:from-purple-600 hover:to-purple-700',
            'text-white shadow-lg shadow-purple-500/25',
            'hover:shadow-xl hover:shadow-purple-500/30'
          ),
          gold: cn(
            'bg-gradient-to-r from-yellow-400 to-orange-500',
            'hover:from-yellow-500 hover:to-orange-600',
            'text-white shadow-lg shadow-yellow-500/25',
            'hover:shadow-xl hover:shadow-yellow-500/30'
          ),
          rose: cn(
            'bg-gradient-to-r from-rose-400 to-rose-600',
            'hover:from-rose-500 hover:to-rose-700',
            'text-white shadow-lg shadow-rose-500/25',
            'hover:shadow-xl hover:shadow-rose-500/30'
          ),
          sunset: cn(
            'bg-gradient-to-r from-orange-400 via-rose-500 to-purple-600',
            'hover:from-orange-500 hover:via-rose-600 hover:to-purple-700',
            'text-white shadow-lg shadow-purple-500/25',
            'hover:shadow-xl hover:shadow-purple-500/30'
          )
        }
        return gradients[gradientType]

      case 'glass':
        return cn(
          'bg-white/10 backdrop-blur-lg border border-white/20',
          'text-gray-900 dark:text-white',
          'hover:bg-white/20 hover:border-white/30',
          'shadow-lg shadow-black/5'
        )

      case 'luxury':
        return cn(
          'bg-black text-white border border-gray-800',
          'hover:bg-gray-900 hover:border-gray-700',
          'shadow-2xl shadow-black/20',
          'hover:shadow-3xl hover:shadow-black/30'
        )

      case 'outline':
        return cn(
          'border-2 border-purple-500 text-purple-600',
          'hover:bg-purple-50 hover:text-purple-700',
          'dark:text-purple-400 dark:hover:bg-purple-950',
          'hover:border-purple-600'
        )

      case 'ghost':
        return cn(
          'bg-transparent text-gray-700 dark:text-gray-300',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'hover:text-gray-900 dark:hover:text-white'
        )

      default:
        return cn(
          'bg-purple-600 text-white',
          'hover:bg-purple-700',
          'shadow-md shadow-purple-500/20',
          'hover:shadow-lg hover:shadow-purple-500/25'
        )
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-3 text-sm'
      case 'lg':
        return 'h-12 px-8 text-base'
      case 'xl':
        return 'h-14 px-10 text-lg'
      default:
        return 'h-10 px-6 text-sm'
    }
  }

  const glowStyles = glow
    ? cn('hover:glow-purple transition-all duration-300', 'hover:scale-105 active:scale-95')
    : ''

  const LoadingIcon = () => <Loader2 className="w-4 h-4 animate-spin" />

  const renderIcon = () => {
    if (loading) return <LoadingIcon />
    return icon
  }

  return (
    <Button
      className={cn(
        'relative rounded-xl font-semibold',
        'transform transition-all duration-200 ease-out',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-purple-500/20',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        getSizeStyles(),
        getVariantStyles(),
        glowStyles,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      <div className="flex items-center justify-center space-x-2">
        {renderIcon() && iconPosition === 'left' && (
          <span className={cn('flex-shrink-0', loading && 'animate-spin')}>{renderIcon()}</span>
        )}

        <span className={loading ? 'opacity-70' : ''}>{children}</span>

        {renderIcon() && iconPosition === 'right' && !loading && (
          <span className="flex-shrink-0">{renderIcon()}</span>
        )}
      </div>

      {/* Ripple Effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </div>
    </Button>
  )
}

// Specialized Salon Buttons
export function SalonActionButton({
  action,
  count,
  color = 'purple',
  className,
  ...props
}: {
  action: string
  count?: number
  color?: 'purple' | 'gold' | 'rose' | 'blue'
  className?: string
} & Omit<LuxeButtonProps, 'children'>) {
  const colorMap = {
    purple: 'primary',
    gold: 'gold',
    rose: 'rose',
    blue: 'primary'
  } as const

  return (
    <LuxeButton
      variant="gradient"
      gradientType={colorMap[color]}
      glow={true}
      className={className}
      {...props}
    >
      <div className="flex items-center space-x-2">
        <span>{action}</span>
        {count !== undefined && (
          <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">{count}</span>
        )}
      </div>
    </LuxeButton>
  )
}

export function SalonQuickAction({
  icon,
  label,
  variant = 'glass',
  ...props
}: {
  icon: React.ReactNode
  label: string
  variant?: LuxeButtonProps['variant']
} & Omit<LuxeButtonProps, 'children'>) {
  return (
    <LuxeButton variant={variant} size="lg" className="flex-col space-y-2 h-auto py-4" {...props}>
      <div className="text-2xl">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </LuxeButton>
  )
}

export default LuxeButton
