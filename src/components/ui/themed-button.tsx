'use client'

import * as React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { useModuleTheme } from '@/hooks/useModuleTheme'
import { cn } from '@/lib/utils'

export interface ThemedButtonProps extends ButtonProps {
  gradient?: boolean
}

export const ThemedButton = React.forwardRef<HTMLButtonElement, ThemedButtonProps>(
  ({ className, variant = 'default', gradient = false, ...props }, ref) => {
    const theme = useModuleTheme()

    if (gradient && variant === 'default') {
      return (
        <Button
          ref={ref}
          className={cn(
            `bg-gradient-to-r ${theme.brandGradient} text-white hover:opacity-90 transition-opacity`,
            className
          )}
          variant="ghost"
          {...props}
        />
      )
    }

    return <Button ref={ref} className={className} variant={variant} {...props} />
  }
)

ThemedButton.displayName = 'ThemedButton'
