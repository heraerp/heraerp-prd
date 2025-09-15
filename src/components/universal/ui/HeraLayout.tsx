'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// Universal Layout Container
export interface HeraLayoutProps {
  children: React.ReactNode
  variant?: 'default' | 'centered' | 'sidebar' | 'full-width'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function HeraLayout({
  children,
  variant = 'default',
  padding = 'md',
  gap = 'md',
  className
}: HeraLayoutProps) {
  const variantClasses = {
    default: 'container mx-auto',
    centered: 'container mx-auto flex items-center justify-center min-h-screen bg-gray-900',
    sidebar: 'flex min-h-screen bg-gray-900',
    'full-width': 'w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
    xl: 'p-8 md:p-12'
  }

  const gapClasses = {
    none: '',
    sm: 'space-y-2',
    md: 'space-y-4 md:space-y-6',
    lg: 'space-y-6 md:space-y-8',
    xl: 'space-y-8 md:space-y-12'
  }

  return (
    <div
      className={cn(
        variantClasses[variant],
        paddingClasses[padding],
        variant !== 'sidebar' ? gapClasses[gap] : '',
        className
      )}
    >
      {children}
    </div>
  )
}

// Grid System Components
export interface HeraGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: boolean
  className?: string
}

export function HeraGrid({
  children,
  cols = 3,
  gap = 'md',
  responsive = true,
  className
}: HeraGridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: responsive ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2',
    3: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-3',
    4: responsive ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-4',
    6: responsive ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-6',
    12: responsive ? 'grid-cols-1 md:grid-cols-6 lg:grid-cols-12' : 'grid-cols-12'
  }

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
    xl: 'gap-8 md:gap-12'
  }

  return <div className={cn('grid', colClasses[cols], gapClasses[gap], className)}>{children}</div>
}

// Stack Components
export interface HeraStackProps {
  children: React.ReactNode
  direction?: 'vertical' | 'horizontal'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  wrap?: boolean
  className?: string
}

export function HeraStack({
  children,
  direction = 'vertical',
  align = 'stretch',
  justify = 'start',
  gap = 'md',
  wrap = false,
  className
}: HeraStackProps) {
  const directionClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  }

  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        alignClasses[align],
        justifyClasses[justify],
        gapClasses[gap],
        wrap ? 'flex-wrap' : '',
        className
      )}
    >
      {children}
    </div>
  )
}

// Responsive Break Points
export interface HeraResponsiveProps {
  children: React.ReactNode
  hideOn?: ('mobile' | 'tablet' | 'desktop')[]
  showOn?: ('mobile' | 'tablet' | 'desktop')[]
  className?: string
}

export function HeraResponsive({
  children,
  hideOn = [],
  showOn = [],
  className
}: HeraResponsiveProps) {
  const responsiveClasses = [
    hideOn.includes('mobile') ? 'hidden sm:block' : '',
    hideOn.includes('tablet') ? 'sm:hidden lg:block' : '',
    hideOn.includes('desktop') ? 'lg:hidden' : '',
    showOn.includes('mobile') && !showOn.includes('tablet') ? 'sm:hidden' : '',
    showOn.includes('tablet') && !showOn.includes('mobile') && !showOn.includes('desktop')
      ? 'hidden sm:block lg:hidden'
      : '',
    showOn.includes('desktop') && !showOn.includes('mobile') && !showOn.includes('tablet')
      ? 'hidden lg:block'
      : ''
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={cn(responsiveClasses, className)}>{children}</div>
}

// Specialized Layout Components
export function HeraDashboardLayout({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <HeraLayout variant="full-width" padding="lg" className={cn('min-h-screen bg-gray-900', className)}>
      <div className="dashboard-grid">{children}</div>
    </HeraLayout>
  )
}

export function HeraPageHeader({
  title,
  subtitle,
  actions,
  className
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-4 pb-8 border-b border-border', className)}>
      <HeraStack direction="horizontal" justify="between" align="end">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-hera-500 to-hera-cyan-500 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && <p className="text-lg text-muted-foreground max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </HeraStack>
    </div>
  )
}

export function HeraSection({
  title,
  subtitle,
  children,
  className
}: {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('space-y-6', className)}>
      {(title || subtitle) && (
        <div className="space-y-2">
          {title && <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>}
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  )
}
