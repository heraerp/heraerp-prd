'use client'

import React, { forwardRef } from 'react'

interface ISPInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: React.ReactNode
  error?: string
}

export const ISPInput = forwardRef<HTMLInputElement, ISPInputProps>(
  ({ label, icon, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && <label className="text-sm font-medium text-[#F5E6C8]">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</div>}
          <input
            ref={ref}
            className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#0099CC] focus:bg-slate-800 transition-all duration-200 ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    )
  }
)

ISPInput.displayName = 'ISPInput'

interface ISPSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  error?: string
}

export const ISPSelect = forwardRef<HTMLSelectElement, ISPSelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && <label className="text-sm font-medium text-[#F5E6C8]">{label}</label>}
        <select
          ref={ref}
          className={`w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-[#0099CC] focus:bg-slate-800 transition-all duration-200 ${className}`}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value} className="bg-slate-800">
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    )
  }
)

ISPSelect.displayName = 'ISPSelect'

interface ISPButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const ISPButton = forwardRef<HTMLButtonElement, ISPButtonProps>(
  (
    { variant = 'primary', size = 'md', loading, className = '', children, disabled, ...props },
    ref
  ) => {
    const variants = {
      primary:
        'bg-gradient-to-r from-[#0099CC] to-[#0049B7] text-white hover:shadow-lg hover:shadow-[#0099CC]/40',
      secondary:
        'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white',
      danger:
        'bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:shadow-red-600/40'
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg'
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`font-medium rounded-lg transition-all duration-300 ${variants[variant]} ${sizes[size]} ${
          disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
        {...props}
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </button>
    )
  }
)

ISPButton.displayName = 'ISPButton'

interface ISPFormProps {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
  children: React.ReactNode
  className?: string
}

export function ISPForm({ onSubmit, children, className = '' }: ISPFormProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
      {children}
    </form>
  )
}
