'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

export interface MobileButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export function MobileButton({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  onClick,
  type = 'button',
  className = ''
}: MobileButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 touch-manipulation focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800",
    outline: "border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 focus:ring-blue-500 active:bg-blue-100",
    ghost: "text-gray-600 bg-transparent hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800"
  }

  const sizeClasses = {
    small: "px-3 py-2 text-sm min-h-[36px]",
    medium: "px-4 py-3 text-sm min-h-[44px]",
    large: "px-6 py-4 text-base min-h-[52px]"
  }

  const widthClass = fullWidth ? "w-full" : ""

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && icon}
      {children}
    </button>
  )
}

export interface MobileButtonGroupProps {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function MobileButtonGroup({
  children,
  orientation = 'horizontal',
  className = ''
}: MobileButtonGroupProps) {
  const orientationClasses = {
    horizontal: "flex flex-row gap-2",
    vertical: "flex flex-col gap-2"
  }

  return (
    <div className={`${orientationClasses[orientation]} ${className}`}>
      {children}
    </div>
  )
}

export interface MobileFloatingActionButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
}

export function MobileFloatingActionButton({
  children,
  onClick,
  className = '',
  position = 'bottom-right'
}: MobileFloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': "fixed bottom-6 right-6",
    'bottom-left': "fixed bottom-6 left-6", 
    'bottom-center': "fixed bottom-6 left-1/2 transform -translate-x-1/2"
  }

  return (
    <button
      onClick={onClick}
      className={`
        ${positionClasses[position]}
        w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl
        hover:bg-blue-700 active:bg-blue-800 transition-all duration-200
        flex items-center justify-center z-50 touch-manipulation
        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
    >
      {children}
    </button>
  )
}