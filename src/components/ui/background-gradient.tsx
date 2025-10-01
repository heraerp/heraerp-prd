'use client'
import React, { ReactNode, useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface BackgroundGradientProps {
  children: ReactNode
  className?: string
  containerClassName?: string
  animate?: boolean
  gradientSize?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'hera' | 'enterprise' | 'rainbow' | 'aurora'
}

export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = true,
  gradientSize = 'md',
  variant = 'hera'
}: BackgroundGradientProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !animate) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!divRef.current) return

      const rect = divRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      divRef.current.style.setProperty('--mouse-x', `${x}px`)
      divRef.current.style.setProperty('--mouse-y', `${y}px`)
    }

    const element = divRef.current
    if (element) {
      element.addEventListener('mousemove', handleMouseMove)
      return () => element.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isMounted, animate])

  // Size variations
  const sizeClasses = {
    sm: 'p-[1px]',
    md: 'p-[2px]',
    lg: 'p-[3px]'
  }

  // Gradient variants using HERA design tokens
  const gradientVariants = {
    default: 'bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500',
    hera: 'bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-500',
    enterprise:
      'bg-[conic-gradient(from_var(--gradient-angle,0deg),var(--surface-glass),var(--ink-primary),var(--surface-glass))]',
    rainbow:
      'bg-[conic-gradient(from_var(--gradient-angle,0deg),#ff0000,#ff8c00,#ffd700,#008000,#0000ff,#4b0082,#8b00ff,#ff0000)]',
    aurora: 'bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600'
  }

  return (
    <div
      ref={divRef}
      className={cn(
        'relative rounded-3xl group/card',
        sizeClasses[gradientSize],
        animate && 'transition-all duration-500 ease-out',
        containerClassName
      )}
      style={
        {
          background:
            variant === 'enterprise' && animate
              ? `conic-gradient(from var(--gradient-angle, ${Math.random() * 360}deg), var(--surface-glass), var(--ink-primary), var(--surface-glass))`
              : undefined,
          '--gradient-angle': animate ? '0deg' : undefined
        } as React.CSSProperties
      }
    >
      {/* Animated gradient border */}
      <div
        className={cn(
          'absolute inset-0 rounded-3xl opacity-75 group-hover/card:opacity-100 transition-all duration-500',
          !animate && gradientVariants[variant],
          animate &&
            variant !== 'enterprise' && [
              'bg-[conic-gradient(from_var(--gradient-angle,0deg),var(--tw-gradient-stops))]',
              variant === 'hera' && 'from-indigo-600 via-fuchsia-600 to-cyan-500',
              variant === 'default' && 'from-blue-500 via-purple-500 to-cyan-500',
              variant === 'rainbow' &&
                'from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
              variant === 'aurora' && 'from-emerald-500 via-blue-500 to-purple-600'
            ],
          animate &&
            variant === 'enterprise' &&
            'bg-[conic-gradient(from_var(--gradient-angle,0deg),rgba(255,255,255,0.1),var(--ink-primary),rgba(255,255,255,0.1))]'
        )}
        style={
          animate
            ? ({
                animation: 'rotate 6s linear infinite',
                '--gradient-angle': 'var(--gradient-angle, 0deg)'
              } as React.CSSProperties)
            : undefined
        }
      />

      {/* Content container with glassmorphism */}
      <div
        className={cn(
          'relative rounded-3xl h-full w-full overflow-hidden',
          'bg-[var(--surface-glass)] backdrop-blur-xl',
          'border border-[var(--border-strong)]',
          'shadow-[var(--shadow-elev)]',
          className
        )}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

        {/* Mouse tracking light effect (only if animate is true) */}
        {animate && (
          <div
            className="absolute pointer-events-none opacity-0 group-hover/card:opacity-20 transition-opacity duration-500 rounded-full blur-xl"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
              width: '100px',
              height: '100px',
              left: 'var(--mouse-x, 50%)',
              top: 'var(--mouse-y, 50%)',
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}

        {children}
      </div>

      {/* Keyframe styles */}
      <style jsx>{`
        @keyframes rotate {
          from {
            --gradient-angle: 0deg;
          }
          to {
            --gradient-angle: 360deg;
          }
        }
      `}</style>
    </div>
  )
}
