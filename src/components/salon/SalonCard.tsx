'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SalonCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'surface' | 'light' | 'accent'
}

export function SalonCard({ children, className, variant = 'surface' }: SalonCardProps) {
  const variants = {
    surface: 'bg-[#762866] border-white/20',
    light: 'bg-[#E7D8D5] border-[#762866]/20',
    accent: 'bg-[#DD97E2] border-white/30'
  }

  return (
    <div
      className={cn(
        'rounded-[20px] p-6 border shadow-[0_10px_30px_rgba(0,0,0,0.25)]',
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  )
}

interface SalonStatCardProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; isPositive: boolean }
  className?: string
}

export function SalonStatCard({ label, value, icon: Icon, trend, className }: SalonStatCardProps) {
  return (
    <SalonCard className={cn('relative', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/60 text-sm mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-[#DD97E2]">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <div
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-green-400' : 'text-red-400'
            )}
          >
            {trend.isPositive ? '+' : '-'}
            {Math.abs(trend.value)}%
          </div>
          <span className="text-xs text-white/40">vs last month</span>
        </div>
      )}
    </SalonCard>
  )
}
