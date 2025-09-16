'use client'

import React from 'react'
import {
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppointmentStats {
  todayTotal: number
  weekTotal: number
  monthTotal: number
  pendingCount: number
  confirmedCount: number
  cancelledCount: number
  revenueToday: number
  revenueMonth: number
}

interface AppointmentStatsProps {
  stats: AppointmentStats
  organizationId?: string
}

export function AppointmentStats({ stats }: AppointmentStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Today's Appointments */}
      <div
        className="relative overflow-hidden rounded-xl p-6 cursor-pointer group transition-all duration-700 hover:-translate-y-2"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(31, 41, 55, 0.85) 0%, 
              rgba(17, 24, 39, 0.9) 100%
            )
          `,
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 4px 16px rgba(147, 51, 234, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">Today</p>
            <p className="text-3xl font-bold !text-gray-100 dark:!text-foreground">{stats.todayTotal}</p>
            <p className="text-xs !text-muted-foreground dark:!text-muted-foreground mt-1">appointments</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-foreground">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Pending Appointments */}
      <div
        className="relative overflow-hidden rounded-xl p-6 cursor-pointer group transition-all duration-700 hover:-translate-y-2"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(31, 41, 55, 0.85) 0%, 
              rgba(17, 24, 39, 0.9) 100%
            )
          `,
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 4px 16px rgba(245, 158, 11, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold !text-gray-100 dark:!text-foreground">
              {stats.pendingCount}
            </p>
            <p className="text-xs !text-muted-foreground dark:!text-muted-foreground mt-1">awaiting confirmation</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-foreground">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Today's Revenue */}
      <div
        className="relative overflow-hidden rounded-xl p-6 cursor-pointer group transition-all duration-700 hover:-translate-y-2"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(31, 41, 55, 0.85) 0%, 
              rgba(17, 24, 39, 0.9) 100%
            )
          `,
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 4px 16px rgba(16, 185, 129, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">Today's Revenue</p>
            <p className="text-3xl font-bold !text-gray-100 dark:!text-foreground">
              AED {stats.revenueToday.toLocaleString()}
            </p>
            <p className="text-xs !text-muted-foreground dark:!text-muted-foreground mt-1">from confirmed</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-foreground">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Month Total */}
      <div
        className="relative overflow-hidden rounded-xl p-6 cursor-pointer group transition-all duration-700 hover:-translate-y-2"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(31, 41, 55, 0.85) 0%, 
              rgba(17, 24, 39, 0.9) 100%
            )
          `,
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 4px 16px rgba(59, 130, 246, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">This Month</p>
            <p className="text-3xl font-bold !text-gray-100 dark:!text-foreground">{stats.monthTotal}</p>
            <p className="text-xs !text-muted-foreground dark:!text-muted-foreground mt-1">total appointments</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-foreground">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-3 gap-4">
        {/* Confirmed */}
        <div
          className="relative overflow-hidden rounded-xl p-4"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(16, 185, 129, 0.1) 0%, 
                rgba(16, 185, 129, 0.05) 100%
              )
            `,
            backdropFilter: 'blur(20px) saturate(120%)',
            WebkitBackdropFilter: 'blur(20px) saturate(120%)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-bold !text-gray-100 dark:!text-foreground">
                {stats.confirmedCount}
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        </div>

        {/* Cancelled */}
        <div
          className="relative overflow-hidden rounded-xl p-4"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(239, 68, 68, 0.1) 0%, 
                rgba(239, 68, 68, 0.05) 100%
              )
            `,
            backdropFilter: 'blur(20px) saturate(120%)',
            WebkitBackdropFilter: 'blur(20px) saturate(120%)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">Cancelled</p>
              <p className="text-2xl font-bold !text-gray-100 dark:!text-foreground">
                {stats.cancelledCount}
              </p>
            </div>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
        </div>

        {/* Month Revenue */}
        <div
          className="relative overflow-hidden rounded-xl p-4"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(147, 51, 234, 0.1) 0%, 
                rgba(147, 51, 234, 0.05) 100%
              )
            `,
            backdropFilter: 'blur(20px) saturate(120%)',
            WebkitBackdropFilter: 'blur(20px) saturate(120%)',
            border: '1px solid rgba(147, 51, 234, 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">Month Revenue</p>
              <p className="text-2xl font-bold !text-gray-100 dark:!text-foreground">
                AED {Math.round(stats.revenueMonth).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-5 w-5 text-purple-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
