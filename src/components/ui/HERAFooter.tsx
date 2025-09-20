'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface HERAFooterProps {
  variant?: 'light' | 'dark' | 'transparent'
  showNetworkBadge?: boolean
  className?: string
}

export function HERAFooter({
  variant = 'light',
  showNetworkBadge = true,
  className
}: HERAFooterProps) {
  const baseClasses = 'flex items-center justify-center py-6'

  return (
    <footer className={cn(baseClasses, className)}>
      <div className="flex items-center justify-center">
        {showNetworkBadge && (
          <Link
            href="https://www.heraerp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: variant === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              backdropFilter: 'blur(10px)',
              border:
                variant === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.05)'
            }}
          >
            {/* HERA Logo */}
            <div className="w-5 h-5 relative">
              <svg
                width="20"
                height="20"
                viewBox="0 0 200 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <defs>
                  <linearGradient id="heraGradientFooter" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#3B82F6' }} />
                    <stop offset="50%" style={{ stopColor: '#06B6D4' }} />
                    <stop offset="100%" style={{ stopColor: '#10B981' }} />
                  </linearGradient>
                </defs>

                {/* Simplified H for small size */}
                <path
                  d="M15 12 L15 48 M15 30 L35 30 M35 12 L35 48"
                  stroke="url(#heraGradientFooter)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            {/* Powered by text */}
            <span
              className={cn(
                'text-xs font-medium tracking-wide transition-colors duration-200',
                variant === 'dark'
                  ? 'text-foreground/70 group-hover:text-foreground/90'
                  : 'text-muted-foreground group-hover:text-foreground'
              )}
            >
              Powered by
              <span
                className={cn(
                  'ml-1 font-semibold bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent'
                )}
              >
                HERA
              </span>
            </span>

            {/* Network effect indicator */}
            <div className="flex items-center gap-0.5 ml-1">
              <div
                className={cn(
                  'w-1 h-1 rounded-full transition-all duration-300',
                  variant === 'dark' ? 'bg-background/40' : 'bg-gray-400',
                  'group-hover:bg-emerald-400 group-hover:scale-125'
                )}
              />
              <div
                className={cn(
                  'w-1 h-1 rounded-full transition-all duration-300 delay-75',
                  variant === 'dark' ? 'bg-background/40' : 'bg-gray-400',
                  'group-hover:bg-blue-400 group-hover:scale-125'
                )}
              />
              <div
                className={cn(
                  'w-1 h-1 rounded-full transition-all duration-300 delay-150',
                  variant === 'dark' ? 'bg-background/40' : 'bg-gray-400',
                  'group-hover:bg-cyan-400 group-hover:scale-125'
                )}
              />
            </div>
          </Link>
        )}
      </div>
    </footer>
  )
}

// Steve Jobs-inspired minimal footer variant for login pages
export function MinimalHERAFooter({ className }: { className?: string }) {
  return (
    <div className={cn('text-center space-y-2', className)}>
      <Link
        href="https://www.heraerp.com"
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-muted-foreground transition-colors duration-200"
      >
        <div className="w-4 h-4">
          <svg
            width="16"
            height="16"
            viewBox="0 0 200 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="heraGradientMinimal" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#9CA3AF' }} />
                <stop offset="50%" style={{ stopColor: '#6B7280' }} />
                <stop offset="100%" style={{ stopColor: '#4B5563' }} />
              </linearGradient>
            </defs>
            <path
              d="M15 12 L15 48 M15 30 L35 30 M35 12 L35 48"
              stroke="url(#heraGradientMinimal)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <span>Powered by HERA</span>
        <div className="flex gap-0.5">
          <div className="w-0.5 h-0.5 rounded-full bg-current opacity-40 group-hover:opacity-70 transition-opacity" />
          <div className="w-0.5 h-0.5 rounded-full bg-current opacity-40 group-hover:opacity-70 transition-opacity delay-75" />
          <div className="w-0.5 h-0.5 rounded-full bg-current opacity-40 group-hover:opacity-70 transition-opacity delay-150" />
        </div>
      </Link>
      <p className="text-xs text-muted-foreground">
        Join the network of leading businesses powered by universal architecture
      </p>
    </div>
  )
}
