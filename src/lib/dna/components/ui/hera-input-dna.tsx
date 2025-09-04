import React from 'react'
import { cn } from '@/lib/utils'
import { InputHTMLAttributes } from 'react'

interface HeraInputDNAProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  helperText?: string
}

/**
 * HERA Input DNA Component
 * Standard input field styles for all HERA applications
 * Part of HERA Design System DNA
 */
export function HeraInputDNA({
  className,
  label,
  error,
  icon,
  rightIcon,
  helperText,
  id,
  ...props
}: HeraInputDNAProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={inputId}
          className="text-sm font-semibold text-gray-800"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full h-10 md:h-12 bg-gray-50 border-gray-200",
            "focus:ring-2 focus:ring-violet-500 focus:border-transparent",
            "transition-all rounded-md",
            {
              "pl-10": icon,
              "pr-10": rightIcon,
              "border-red-500 focus:ring-red-500": error
            },
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-600">{helperText}</p>
      )}
    </div>
  )
}