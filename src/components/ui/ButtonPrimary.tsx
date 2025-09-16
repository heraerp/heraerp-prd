// ================================================================================
// HERA BUTTON PRIMARY - SALON THEME
// Smart Code: HERA.UI.BUTTON.PRIMARY.SALON.v1
// Reusable primary button component with salon theme styling
// ================================================================================

import React from 'react'
import { cn } from '@/src/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonPrimaryProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const ButtonPrimary = React.forwardRef<HTMLButtonElement, ButtonPrimaryProps>(
  ({
    className,
    children,
    loading = false,
    loadingText,
    size = 'md',
    variant = 'primary',
    icon,
    iconPosition = 'left',
    disabled,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading

    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    }

    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className={cn(
            'animate-spin',
            size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
            children || loadingText ? 'mr-2' : ''
          )} />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className={cn(
            size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
            children ? 'mr-2' : ''
          )}>
            {icon}
          </span>
        )}
        
        {loading ? (loadingText || children) : children}
        
        {!loading && icon && iconPosition === 'right' && (
          <span className={cn(
            size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
            children ? 'ml-2' : ''
          )}>
            {icon}
          </span>
        )}
      </button>
    )
  }
)

ButtonPrimary.displayName = 'ButtonPrimary'

export { ButtonPrimary }