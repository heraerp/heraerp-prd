import React from 'react'
import { cn } from '@/lib/utils'

interface HeraWordmarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'gradient' | 'dark' | 'light' | 'white'
}

export function HeraWordmark({
  className = '',
  size = 'md',
  variant = 'gradient'
}: HeraWordmarkProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }

  const variantClasses = {
    gradient:
      'bg-gradient-to-r from-slate-800 via-blue-500 to-sky-500 bg-clip-text text-transparent',
    dark: 'text-foreground',
    light: 'text-muted-foreground',
    white: 'text-foreground'
  }

  return (
    <span
      className={cn(
        'font-bold tracking-tight select-none',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      HERA
    </span>
  )
}

export default HeraWordmark
