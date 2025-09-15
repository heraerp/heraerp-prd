'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  ChevronRight,
  Plus,
  Filter,
  Download,
  CalendarOff,
  Briefcase,
  Sun
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LeaveRequestForm } from './LeaveRequestForm'
import { LeaveCalendar } from './LeaveCalendar'
import { LeaveBalanceCard } from './LeaveBalanceCard'
import { TeamLeaveOverview } from './TeamLeaveOverview'
import { PendingApprovals } from './PendingApprovals'
import { AnnualLeaveReport } from './AnnualLeaveReport'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { cn } from '@/lib/utils'

interface LeaveManagementDashboardProps {
  organizationId?: string
}

export function LeaveManagementDashboard({ organizationId }: LeaveManagementDashboardProps) {
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [activeView, setActiveView] = useState<'dashboard' | 'calendar' | 'reports'>('dashboard')
  const { currentOrganization } = useMultiOrgAuth()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Use provided organizationId or fallback to currentOrganization
  const effectiveOrgId = organizationId || currentOrganization?.id

  // These will be populated from the hook
  const leaveStats = {
    annualBalance: 21,
    annualUsed: 0,
    sickBalance: 10,
    sickUsed: 0,
    upcomingLeave: 0,
    teamOnLeave: 0
  }

  // Track mouse for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setMousePosition({ x, y })
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      return () => container.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(0, 0, 0, 0.95) 0%, 
            rgba(17, 24, 39, 0.95) 25%,
            rgba(31, 41, 55, 0.9) 50%,
            rgba(17, 24, 39, 0.95) 75%,
            rgba(0, 0, 0, 0.95) 100%
          ),
          radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(147, 51, 234, 0.08) 0%, 
            rgba(59, 130, 246, 0.05) 25%,
            rgba(16, 185, 129, 0.03) 50%,
            transparent 70%
          ),
          #0a0a0a
        `
      }}
    >
      {/* WSAG Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Primary Light Orb */}
        <div
          className="absolute w-96 h-96 rounded-full transition-all duration-[3000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(147, 51, 234, 0.15) 0%, 
              rgba(147, 51, 234, 0.08) 30%, 
              rgba(147, 51, 234, 0.02) 60%, 
              transparent 100%
            )`,
            filter: 'blur(60px)',
            left: `${20 + mousePosition.x * 0.1}%`,
            top: `${10 + mousePosition.y * 0.05}%`,
            transform: `translate(-50%, -50%) scale(${1 + mousePosition.x * 0.002})`
          }}
        />

        {/* Secondary Light Orb */}
        <div
          className="absolute w-80 h-80 rounded-full transition-all duration-[4000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(59, 130, 246, 0.12) 0%, 
              rgba(59, 130, 246, 0.06) 30%, 
              rgba(59, 130, 246, 0.02) 60%, 
              transparent 100%
            )`,
            filter: 'blur(70px)',
            right: `${15 + mousePosition.x * 0.08}%`,
            top: `${60 + mousePosition.y * 0.03}%`,
            transform: `translate(50%, -50%) scale(${1 + mousePosition.y * 0.002})`
          }}
        />

        {/* Tertiary Light Orb */}
        <div
          className="absolute w-64 h-64 rounded-full transition-all duration-[5000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(16, 185, 129, 0.1) 0%, 
              rgba(16, 185, 129, 0.05) 40%, 
              rgba(16, 185, 129, 0.01) 70%, 
              transparent 100%
            )`,
            filter: 'blur(50px)',
            left: `${70 + mousePosition.y * 0.06}%`,
            bottom: `${20 + mousePosition.x * 0.04}%`,
            transform: `translate(-50%, 50%) scale(${1 + (mousePosition.x + mousePosition.y) * 0.001})`
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold !text-gray-900 dark:!text-foreground flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(147, 51, 234, 0.15) 0%, 
                    rgba(59, 130, 246, 0.1) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(120%)',
                WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.4),
                  0 4px 16px rgba(147, 51, 234, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `
              }}
            >
              <CalendarOff className="w-6 h-6 text-foreground drop-shadow-md" />
            </div>
            Leave Management
          </h1>
          <p className="!text-muted-foreground dark:!text-muted-foreground mt-2">
            Manage time off requests, balances, and team coverage for {currentOrganization?.name}
          </p>
        </div>

        {/* Navigation Tabs with WSAG Glassmorphism */}
        <div className="mb-8">
          <div
            className="inline-flex rounded-lg p-1"
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
                0 4px 16px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `
            }}
          >
            <button
              onClick={() => setActiveView('dashboard')}
              className={cn(
                'px-6 py-2 rounded-md transition-all duration-200 font-medium',
                activeView === 'dashboard'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-foreground shadow-lg'
                  : '!text-gray-700 dark:!text-gray-300 hover:bg-background/10'
              )}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={cn(
                'px-6 py-2 rounded-md transition-all duration-200 font-medium',
                activeView === 'calendar'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-foreground shadow-lg'
                  : '!text-gray-700 dark:!text-gray-300 hover:bg-background/10'
              )}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveView('reports')}
              className={cn(
                'px-6 py-2 rounded-md transition-all duration-200 font-medium',
                activeView === 'reports'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-foreground shadow-lg'
                  : '!text-gray-700 dark:!text-gray-300 hover:bg-background/10'
              )}
            >
              Reports
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex gap-4">
          <Button
            onClick={() => setShowRequestForm(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </Button>
          <Button
            variant="outline"
            className="backdrop-blur-xl bg-background/10 dark:bg-background/30 border-border/20 dark:border-border/30 hover:bg-background/20 dark:hover:bg-background/50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button
            variant="outline"
            className="backdrop-blur-xl bg-background/10 dark:bg-background/30 border-border/20 dark:border-border/30 hover:bg-background/20 dark:hover:bg-background/50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {activeView === 'dashboard' && (
          <>
            {/* Balance Overview with WSAG Glassmorphism */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <LeaveBalanceCard
                type="Annual Leave"
                icon={<Sun className="h-5 w-5" />}
                balance={leaveStats.annualBalance}
                used={leaveStats.annualUsed}
                color="from-purple-500 to-purple-700"
                organizationId={effectiveOrgId}
              />
              <LeaveBalanceCard
                type="Sick Leave"
                icon={<Clock className="h-5 w-5" />}
                balance={leaveStats.sickBalance}
                used={leaveStats.sickUsed}
                color="from-blue-500 to-indigo-600"
                organizationId={effectiveOrgId}
              />
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
                    <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">Upcoming Leave</p>
                    <p className="text-2xl font-bold !text-gray-900 dark:!text-foreground">
                      {leaveStats.upcomingLeave}
                    </p>
                    <p className="text-xs !text-muted-foreground dark:!text-muted-foreground mt-1">Next 30 days</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-foreground">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </div>
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
                    <p className="text-sm !text-muted-foreground dark:!text-muted-foreground">Team on Leave</p>
                    <p className="text-2xl font-bold !text-gray-900 dark:!text-foreground">
                      {leaveStats.teamOnLeave}
                    </p>
                    <p className="text-xs !text-muted-foreground dark:!text-muted-foreground mt-1">Today</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-foreground">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <PendingApprovals organizationId={effectiveOrgId} />
              <TeamLeaveOverview organizationId={effectiveOrgId} />
            </div>
          </>
        )}

        {activeView === 'calendar' && (
          <div
            className="rounded-xl overflow-hidden"
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
                0 4px 16px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `
            }}
          >
            <LeaveCalendar organizationId={effectiveOrgId} />
          </div>
        )}

        {activeView === 'reports' && <AnnualLeaveReport organizationId={effectiveOrgId} />}

        {/* Leave Request Modal */}
        {showRequestForm && (
          <LeaveRequestForm
            onClose={() => setShowRequestForm(false)}
            organizationId={effectiveOrgId}
          />
        )}
      </div>
    </div>
  )
}
