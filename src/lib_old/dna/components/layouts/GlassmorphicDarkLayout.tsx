'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'

export interface GlassmorphicTheme {
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    danger: string
    dangerDark: string
    darkBase: string
  }
}

interface GlassmorphicDarkLayoutProps {
  children: React.ReactNode
  theme: GlassmorphicTheme
  showBlobs?: boolean
}

export function GlassmorphicDarkLayout({
  children,
  theme,
  showBlobs = true
}: GlassmorphicDarkLayoutProps) {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[var(--primary)] via-slate-950 to-[var(--dark-base)]"
      style={
        {
          '--primary': theme.colors.primary,
          '--secondary': theme.colors.secondary,
          '--accent': theme.colors.accent,
          '--danger': theme.colors.danger,
          '--danger-dark': theme.colors.dangerDark,
          '--dark-base': theme.colors.darkBase
        } as React.CSSProperties
      }
    >
      {/* Animated Background Blobs */}
      {showBlobs && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"
            style={{
              background: `linear-gradient(to bottom right, ${theme.colors.danger}, ${theme.colors.dangerDark})`
            }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"
            style={{
              background: `linear-gradient(to bottom right, ${theme.colors.secondary}, ${theme.colors.primary})`
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"
            style={{
              background: `linear-gradient(to bottom right, ${theme.colors.accent}, ${theme.colors.secondary})`
            }}
          />
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  )
}

interface GlassmorphicCardProps {
  children: React.ReactNode
  theme: GlassmorphicTheme
  className?: string
  glowOnHover?: boolean
}

export function GlassmorphicCard({
  children,
  theme,
  className = '',
  glowOnHover = true
}: GlassmorphicCardProps) {
  return (
    <div className={`relative group ${className}`}>
      {glowOnHover && (
        <div
          className="absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"
          style={{
            background: `linear-gradient(to right, ${theme.colors.secondary}, ${theme.colors.primary})`
          }}
        />
      )}
      <div className="relative bg-background/50 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
        {children}
      </div>
    </div>
  )
}

interface GlassmorphicButtonProps {
  children: React.ReactNode
  theme: GlassmorphicTheme
  variant?: 'primary' | 'secondary' | 'danger'
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function GlassmorphicButton({
  children,
  theme,
  variant = 'primary',
  onClick,
  className = '',
  disabled = false
}: GlassmorphicButtonProps) {
  const gradients = {
    primary: `linear-gradient(to right, ${theme.colors.secondary}, ${theme.colors.primary})`,
    secondary: `linear-gradient(to right, ${theme.colors.accent}, ${theme.colors.secondary})`,
    danger: `linear-gradient(to right, ${theme.colors.danger}, ${theme.colors.dangerDark})`
  }

  const shadowColors = {
    primary: theme.colors.secondary,
    secondary: theme.colors.accent,
    danger: theme.colors.danger
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative group ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div
        className="absolute -inset-0.5 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"
        style={{ background: gradients[variant] }}
      />
      <div
        className="relative flex items-center justify-center space-x-2 px-4 py-2 text-foreground rounded-lg font-medium transition-all duration-300"
        style={{
          background: gradients[variant],
          boxShadow: `0 0 0 0 ${shadowColors[variant]}40`
        }}
        onMouseEnter={e => {
          if (!disabled) {
            e.currentTarget.style.boxShadow = `0 10px 25px -3px ${shadowColors[variant]}40`
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = `0 0 0 0 ${shadowColors[variant]}40`
        }}
      >
        {children}
      </div>
    </button>
  )
}

interface GlassmorphicStatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  theme: GlassmorphicTheme
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function GlassmorphicStatCard({
  label,
  value,
  icon: Icon,
  theme,
  trend,
  className = ''
}: GlassmorphicStatCardProps) {
  return (
    <div className={`relative group ${className}`}>
      <div
        className="absolute -inset-0.5 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"
        style={{
          background: `linear-gradient(to right, ${theme.colors.secondary}, ${theme.colors.primary})`
        }}
      />
      <div className="relative bg-background/50 backdrop-blur-xl border border-border/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground/60 text-sm">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {trend && (
              <p
                className={`text-xs mt-1 ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </p>
            )}
          </div>
          <div
            className="p-2 rounded-lg"
            style={{
              background: `linear-gradient(to bottom right, ${theme.colors.secondary}, ${theme.colors.primary})`
            }}
          >
            <Icon className="h-6 w-6 text-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface GlassmorphicInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  theme: GlassmorphicTheme
  icon?: LucideIcon
  className?: string
}

export function GlassmorphicInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  theme,
  icon: Icon,
  className = ''
}: GlassmorphicInputProps) {
  return (
    <div className={`relative ${className}`}>
      {Icon && (
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2 bg-background/50 border border-border/10 rounded-lg text-foreground placeholder-white/40 focus:outline-none focus:bg-background/10 transition-all duration-200`}
        style={
          {
            '--tw-ring-color': `${theme.colors.secondary}50`,
            borderColor: 'rgba(255, 255, 255, 0.1)'
          } as React.CSSProperties
        }
        onFocus={e => {
          e.currentTarget.style.borderColor = `${theme.colors.secondary}80`
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
        }}
      />
    </div>
  )
}

// Export pre-defined themes
export const glassmorphicThemes = {
  isp: {
    name: 'ISP Broadband',
    colors: {
      primary: '#0049B7',
      secondary: '#0099CC',
      accent: '#FFD700',
      danger: '#E91E63',
      dangerDark: '#C2185B',
      darkBase: '#001A3D'
    }
  },
  healthcare: {
    name: 'Healthcare',
    colors: {
      primary: '#00695C',
      secondary: '#00897B',
      accent: '#64DD17',
      danger: '#D32F2F',
      dangerDark: '#B71C1C',
      darkBase: '#004D40'
    }
  },
  finance: {
    name: 'Finance',
    colors: {
      primary: '#1A237E',
      secondary: '#5C6BC0',
      accent: '#FFC107',
      danger: '#E91E63',
      dangerDark: '#AD1457',
      darkBase: '#0D1642'
    }
  },
  restaurant: {
    name: 'Restaurant',
    colors: {
      primary: '#E65100',
      secondary: '#FF6F00',
      accent: '#FFEB3B',
      danger: '#D32F2F',
      dangerDark: '#B71C1C',
      darkBase: '#3E2723'
    }
  },
  manufacturing: {
    name: 'Manufacturing',
    colors: {
      primary: '#37474F',
      secondary: '#546E7A',
      accent: '#FF9800',
      danger: '#F44336',
      dangerDark: '#C62828',
      darkBase: '#212121'
    }
  },
  retail: {
    name: 'Retail',
    colors: {
      primary: '#6A1B9A',
      secondary: '#AB47BC',
      accent: '#FFD600',
      danger: '#E91E63',
      dangerDark: '#AD1457',
      darkBase: '#311B92'
    }
  }
}
