'use client'

import React from 'react'
import { Users, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

interface TeamMemberLeave {
  id: string
  name: string
  role: string
  department: string
  leaveType: string
  startDate: Date
  endDate: Date
  status: 'current' | 'upcoming'
}

interface TeamLeaveOverviewProps {
  organizationId?: string
}

export function TeamLeaveOverview({ organizationId }: TeamLeaveOverviewProps) {
  // Mock data - will be replaced with universal API calls
  const teamLeave: TeamMemberLeave[] = [
    {
      id: '1',
      name: 'Emma Wilson',
      role: 'Hair Stylist',
      department: 'Styling',
      leaveType: 'annual',
      startDate: new Date('2025-09-08'),
      endDate: new Date('2025-09-09'),
      status: 'current'
    },
    {
      id: '2',
      name: 'James Taylor',
      role: 'Receptionist',
      department: 'Front Desk',
      leaveType: 'sick',
      startDate: new Date('2025-09-08'),
      endDate: new Date('2025-09-08'),
      status: 'current'
    },
    {
      id: '3',
      name: 'Lisa Park',
      role: 'Nail Technician',
      department: 'Nail Services',
      leaveType: 'annual',
      startDate: new Date('2025-09-12'),
      endDate: new Date('2025-09-14'),
      status: 'upcoming'
    }
  ]

  const departments = ['Styling', 'Nail Services', 'Front Desk', 'Management']
  const departmentCoverage = {
    'Styling': { total: 8, onLeave: 1 },
    'Nail Services': { total: 4, onLeave: 1 },
    'Front Desk': { total: 2, onLeave: 1 },
    'Management': { total: 3, onLeave: 0 }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    }
  }

  const getCoverageLevel = (dept: string) => {
    const coverage = departmentCoverage[dept as keyof typeof departmentCoverage]
    if (!coverage) return 'good'
    
    const percentage = ((coverage.total - coverage.onLeave) / coverage.total) * 100
    if (percentage >= 75) return 'good'
    if (percentage >= 50) return 'warning'
    return 'critical'
  }

  const getCoverageStyle = (level: string) => {
    switch (level) {
      case 'good':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
    }
  }

  return (
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
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold !text-gray-900 dark:!text-white">
            Team Leave Overview
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
              {teamLeave.filter(l => l.status === 'current').length} On Leave Today
            </span>
          </div>
        </div>

      {/* Department Coverage */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Department Coverage
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {departments.map((dept) => {
            const coverage = departmentCoverage[dept as keyof typeof departmentCoverage]
            const level = getCoverageLevel(dept)
            
            return (
              <div
                key={dept}
                className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {dept}
                  </span>
                  {level === 'critical' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {coverage.total - coverage.onLeave}/{coverage.total} available
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCoverageStyle(level)}`}>
                    {Math.round(((coverage.total - coverage.onLeave) / coverage.total) * 100)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Team Members on Leave */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Team Members
        </h4>
        <div className="space-y-3">
          {teamLeave.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {member.role} • {member.department}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {formatDate(member.startDate, 'MMM d')} - {formatDate(member.endDate, 'MMM d')}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusStyle(
                    member.status
                  )}`}
                >
                  {member.status === 'current' ? 'On Leave' : 'Upcoming'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}