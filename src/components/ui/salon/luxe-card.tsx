/**
 * Luxe Card Component for Salon App
 *
 * Extends HERA Card with glassmorphism effects, luxury gradients,
 * and smooth animations for a premium salon management experience.
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { salonTheme } from '@/lib/design/salon-theme'

interface LuxeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient' | 'glow' | 'floating'
  gradientType?: 'primary' | 'gold' | 'rose' | 'sunset'
  glowColor?: 'purple' | 'gold' | 'rose'
  children: React.ReactNode
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  animated?: boolean
}

export function LuxeCard({
  variant = 'default',
  gradientType = 'primary',
  glowColor = 'purple',
  children,
  title,
  description,
  icon,
  action,
  animated = true,
  className,
  ...props
}: LuxeCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'glass':
        return cn(
          'bg-white/10 backdrop-blur-lg border-white/20',
          'shadow-lg shadow-black/5',
          'dark:bg-white/5 dark:border-white/10'
        )

      case 'gradient':
        const gradients = {
          primary: 'bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-purple-700/20',
          gold: 'bg-gradient-to-br from-yellow-400/20 via-yellow-500/10 to-orange-500/20',
          rose: 'bg-gradient-to-br from-rose-400/20 via-rose-500/10 to-rose-600/20',
          sunset: 'bg-gradient-to-br from-orange-400/20 via-rose-500/10 to-purple-600/20'
        }
        return cn(gradients[gradientType], 'border-white/30 shadow-xl', 'dark:border-white/20')

      case 'glow':
        const glows = {
          purple: 'shadow-purple-500/25 border-purple-200 dark:border-purple-800',
          gold: 'shadow-yellow-500/25 border-yellow-200 dark:border-yellow-800',
          rose: 'shadow-rose-500/25 border-rose-200 dark:border-rose-800'
        }
        return cn(
          'bg-white dark:bg-gray-900',
          'shadow-2xl border-2',
          glows[glowColor],
          'hover:shadow-3xl transition-shadow duration-300'
        )

      case 'floating':
        return cn(
          'bg-white dark:bg-gray-900',
          'shadow-xl shadow-black/10',
          'border-0',
          'hover:shadow-2xl hover:-translate-y-1',
          'transition-all duration-300 ease-out'
        )

      default:
        return cn(
          'bg-white dark:bg-gray-900',
          'border border-gray-200 dark:border-gray-800',
          'shadow-md'
        )
    }
  }

  const animationStyles = animated
    ? cn(
        'transform transition-all duration-300 ease-out',
        'hover:scale-[1.02] hover:shadow-lg',
        'active:scale-[0.98]'
      )
    : ''

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-2xl',
        getVariantStyles(),
        animationStyles,
        className
      )}
      {...props}
    >
      {/* Background Pattern for Glass variant */}
      {variant === 'glass' && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      )}

      {/* Card Header with Icon */}
      {(title || description || icon || action) && (
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {icon && (
                <div
                  className={cn(
                    'p-2 rounded-xl',
                    variant === 'glass' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <CardTitle
                    className={cn(
                      'text-lg font-semibold',
                      variant === 'glass' ? 'text-white' : 'text-gray-900 dark:text-white'
                    )}
                  >
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription
                    className={cn(
                      'mt-1',
                      variant === 'glass' ? 'text-white/70' : 'text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        </CardHeader>
      )}

      {/* Card Content */}
      <CardContent className={cn(title || description || icon || action ? 'pt-0' : 'pt-6')}>
        {children}
      </CardContent>
    </Card>
  )
}

// Specialized Salon Cards
export function SalonStatsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'purple',
  animated = true,
  className,
  ...props
}: {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  color?: 'purple' | 'gold' | 'rose' | 'blue'
  animated?: boolean
} & Omit<LuxeCardProps, 'children'>) {
  const colorStyles = {
    purple: 'from-purple-500 to-purple-600',
    gold: 'from-yellow-400 to-orange-500',
    rose: 'from-rose-400 to-rose-600',
    blue: 'from-blue-500 to-blue-600'
  }

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <LuxeCard variant="floating" animated={animated} className={cn('group', className)} {...props}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p
            className={cn(
              'text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
              colorStyles[color]
            )}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p
              className={cn(
                'text-sm mt-1',
                trend ? trendColors[trend] : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              'p-3 rounded-2xl bg-gradient-to-br',
              colorStyles[color],
              'text-white shadow-lg',
              'group-hover:scale-110 transition-transform duration-300'
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </LuxeCard>
  )
}

export function SalonTeamCard({
  name,
  role,
  avatar,
  stats,
  online = false,
  className,
  onClick,
  ...props
}: {
  name: string
  role: string
  avatar?: string
  stats?: { label: string; value: string }[]
  online?: boolean
  onClick?: () => void
} & Omit<LuxeCardProps, 'children'>) {
  return (
    <LuxeCard
      variant="floating"
      animated={true}
      className={cn(
        'cursor-pointer group',
        onClick && 'hover:ring-2 hover:ring-purple-500/20',
        className
      )}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-center space-x-4">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-lg overflow-hidden">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              name
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
            )}
          </div>
          {online && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{role}</p>

          {stats && stats.length > 0 && (
            <div className="flex space-x-4 mt-2">
              {stats.map((stat, index) => (
                <div key={index} className="text-xs">
                  <span className="text-gray-500">{stat.label}: </span>
                  <span className="font-medium text-gray-900 dark:text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LuxeCard>
  )
}

export default LuxeCard
