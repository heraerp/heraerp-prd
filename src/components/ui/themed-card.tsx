'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useModuleTheme } from '@/hooks/useModuleTheme'
import { cn } from '@/lib/utils'

export interface ThemedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean
  hover?: boolean
}

export const ThemedCard = React.forwardRef<HTMLDivElement, ThemedCardProps>(
  ({ className, gradient = false, hover = false, children, ...props }, ref) => {
    const theme = useModuleTheme()
    
    return (
      <Card
        ref={ref}
        className={cn(
          gradient && `bg-gradient-to-br ${theme.accentGradient} backdrop-blur-sm border-${theme.primaryColor}-200/50`,
          hover && 'hover:shadow-lg transition-all duration-200',
          className
        )}
        {...props}
      >
        {children}
      </Card>
    )
  }
)

ThemedCard.displayName = 'ThemedCard'

// Export themed versions of card components
export const ThemedCardHeader = CardHeader
export const ThemedCardTitle = CardTitle
export const ThemedCardDescription = CardDescription
export const ThemedCardContent = CardContent
export const ThemedCardFooter = CardFooter