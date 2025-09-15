/**
 * HERA DNA Migration Version
 * Original: src/components/ui/card.tsx
 * This version uses HERA DNA glass effects while maintaining backward compatibility
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useGlassEffect } from '@/lib/dna/design-system/glass-effects-2.0'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    glassIntensity?: 'subtle' | 'medium' | 'strong' | 'ultra'
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'premium'
    enableDNA?: boolean
  }
>(
  (
    { className, glassIntensity = 'subtle', variant = 'default', enableDNA = true, ...props },
    ref
  ) => {
    // Use glass effects if DNA is enabled
    const { className: glassClassName } = useGlassEffect({
      intensity: glassIntensity,
      variant,
      enableShine: variant === 'premium',
      enableParticles: false,
      enableDepth: false
    })

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border text-card-foreground shadow-sm',
          enableDNA ? glassClassName : 'bg-card', // Use glass effects or fallback to original
          'transition-all duration-300', // Smooth transition
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        'text-gray-900 dark:text-gray-100', // Ensure text visibility
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-muted-foreground',
      'text-gray-600 dark:text-gray-400', // Ensure text visibility
      className
    )}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
