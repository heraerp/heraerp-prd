import React from 'react'
import { cn } from '@/lib/utils'

interface HeraGradientBackgroundDNAProps {
  children: React.ReactNode
  className?: string
  showBlobs?: boolean
  blobCount?: number
}

/**
 * HERA Gradient Background DNA Component
 * Standard gradient background with animated blobs for all HERA applications
 * Part of HERA Design System DNA
 */
export function HeraGradientBackgroundDNA({
  children,
  className,
  showBlobs = true,
  blobCount = 3
}: HeraGradientBackgroundDNAProps) {
  return (
    <div className={cn("h-screen flex items-center justify-center relative overflow-hidden", className)}>
      {/* Primary gradient background */}
      <div 
        className="absolute inset-0 animate-gradient-x" 
        style={{
          background: 'linear-gradient(135deg, #7dd3fc 0%, #c084fc 50%, #f0f4f8 100%)'
        }}
      />
      
      {/* Animated blobs for depth */}
      {showBlobs && (
        <div className="absolute inset-0">
          {blobCount >= 1 && (
            <div className="absolute top-10 left-10 w-32 h-32 md:w-48 md:h-48 bg-violet-500 rounded-full filter blur-3xl animate-subtle-pulse opacity-15" />
          )}
          {blobCount >= 2 && (
            <div className="absolute top-1/3 right-10 w-32 h-32 md:w-48 md:h-48 bg-sky-500 rounded-full filter blur-3xl animate-subtle-pulse animation-delay-2000 opacity-10" />
          )}
          {blobCount >= 3 && (
            <div className="absolute bottom-20 left-1/3 w-32 h-32 md:w-48 md:h-48 bg-purple-500 rounded-full filter blur-3xl animate-subtle-pulse animation-delay-4000 opacity-10" />
          )}
        </div>
      )}
      
      {/* White gradient overlay for bottom readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60" />
      
      {/* Content */}
      {children}
    </div>
  )
}

// Export blob component for individual use
export function HeraBlob({
  className,
  color = 'violet',
  size = 'sm',
  opacity = 'light',
  animationDelay = 0
}: {
  className?: string
  color?: 'violet' | 'sky' | 'purple' | 'cyan' | 'blue'
  size?: 'sm' | 'md' | 'lg'
  opacity?: 'subtle' | 'light' | 'medium'
  animationDelay?: number
}) {
  const colorClasses = {
    violet: 'bg-violet-500',
    sky: 'bg-sky-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
    blue: 'bg-blue-500'
  }

  const sizeClasses = {
    sm: 'w-32 h-32 md:w-48 md:h-48',
    md: 'w-48 h-48 md:w-64 md:h-64',
    lg: 'w-64 h-64 md:w-80 md:h-80'
  }

  const opacityClasses = {
    subtle: 'opacity-10',
    light: 'opacity-15',
    medium: 'opacity-20'
  }

  return (
    <div 
      className={cn(
        "rounded-full filter blur-3xl animate-subtle-pulse",
        colorClasses[color],
        sizeClasses[size],
        opacityClasses[opacity],
        className
      )}
      style={{
        animationDelay: `${animationDelay}ms`
      }}
    />
  )
}