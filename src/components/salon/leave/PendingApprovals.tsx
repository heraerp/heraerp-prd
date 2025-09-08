'use client'

import React, { useEffect } from 'react'
import { Check, X, Clock, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { useLeaveManagement } from '@/hooks/useLeaveManagement'

interface PendingLeaveRequest {
  id: string
  employeeName: string
  employeeRole: string
  leaveType: string
  startDate: Date
  endDate: Date
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

interface PendingApprovalsProps {
  organizationId?: string
}

export function PendingApprovals({ organizationId }: PendingApprovalsProps) {
  const { pendingApprovals, approveLeaveRequest, cancelLeaveRequest, loading, refreshLeaveData } = useLeaveManagement({ organizationId })
  
  // Use real data from the hook
  const pendingRequests: PendingLeaveRequest[] = pendingApprovals || []

  const getLeaveTypeStyle = (type: string) => {
    switch (type) {
      case 'annual':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'sick':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
      case 'unpaid':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    }
  }

  const handleApprove = async (requestId: string) => {
    await approveLeaveRequest(requestId)
    refreshLeaveData()
  }

  const handleReject = async (requestId: string) => {
    await cancelLeaveRequest(requestId, 'Rejected by manager')
    refreshLeaveData()
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
            Pending Approvals
          </h3>
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            {pendingRequests.length} Pending
          </span>
        </div>

      <div className="space-y-4">
        {pendingRequests.map((request) => (
          <div
            key={request.id}
            className="p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800/70 transition-all duration-300 border border-gray-700/50"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {request.employeeName}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {request.employeeRole}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {format(request.startDate, 'MMM d')} - {format(request.endDate, 'MMM d, yyyy')}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ({request.days} {request.days === 1 ? 'day' : 'days'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-md border ${getLeaveTypeStyle(
                        request.leaveType
                      )}`}
                    >
                      {request.leaveType.charAt(0).toUpperCase() + request.leaveType.slice(1)} Leave
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    <span className="font-medium">Reason:</span> {request.reason}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(request.id)}
                  className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(request.id)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {pendingRequests.length === 0 && (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="!text-gray-600 dark:!text-gray-400">No pending leave requests</p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}