'use client'

/**
 * HERA Employee Manager View
 * Smart Code: HERA.HR.EMPLOYEE.MANAGER.VIEW.v1
 *
 * Dedicated interface for employee leave management with role-based access:
 * - Employee View: Request own leave, view own schedule
 * - Manager View: Approve/deny requests, view team schedules
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  Calendar,
  Clock,
  CheckSquare,
  X,
  UserX,
  Bell,
  Eye,
  UserCheck,
  AlertCircle,
  Plus,
  Filter,
  Search,
  ChevronRight,
  Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { HeraDnaUniversalResourceCalendar } from '@/components/calendar/HeraDnaUniversalResourceCalendar'

interface EmployeeManagerViewProps {
  className?: string
  userRole: 'employee' | 'manager' | 'admin'
  currentUserId: string
  businessType: 'salon' | 'healthcare' | 'consulting' | 'manufacturing'
  organizations?: Array<{
    id: string
    organization_code: string
    organization_name: string
  }>
}

interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  employeeTitle: string
  employeeAvatar: string
  leaveType: string
  leaveTypeName: string
  leaveTypeColor: string
  startDate: Date
  endDate: Date
  duration: string
  reason: string
  description?: string
  status: 'pending' | 'approved' | 'denied'
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  branchId: string
  branchName: string
}

// Mock leave requests data
const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave-001',
    employeeId: 'resource1',
    employeeName: 'Rocky',
    employeeTitle: 'Celebrity Hair Artist',
    employeeAvatar: 'R',
    leaveType: 'sick',
    leaveTypeName: 'Sick Leave',
    leaveTypeColor: '#EF4444',
    startDate: new Date(2024, 2, 15),
    endDate: new Date(2024, 2, 15),
    duration: 'Full Day',
    reason: 'medical',
    description: 'Doctor appointment for routine checkup',
    status: 'pending',
    submittedAt: new Date(2024, 2, 10),
    branchId: 'branch-1',
    branchName: 'Hair Talkz • Park Regis'
  },
  {
    id: 'leave-002',
    employeeId: 'resource2',
    employeeName: 'Maya',
    employeeTitle: 'Color Specialist',
    employeeAvatar: 'M',
    leaveType: 'vacation',
    leaveTypeName: 'Vacation',
    leaveTypeColor: '#06B6D4',
    startDate: new Date(2024, 2, 20),
    endDate: new Date(2024, 2, 22),
    duration: '3 Days',
    reason: 'vacation',
    description: 'Family wedding in India',
    status: 'approved',
    submittedAt: new Date(2024, 2, 5),
    reviewedAt: new Date(2024, 2, 6),
    reviewedBy: 'Manager',
    branchId: 'branch-1',
    branchName: 'Hair Talkz • Park Regis'
  },
  {
    id: 'leave-003',
    employeeId: 'resource3',
    employeeName: 'Sophia',
    employeeTitle: 'Bridal Specialist',
    employeeAvatar: 'S',
    leaveType: 'training',
    leaveTypeName: 'Training',
    leaveTypeColor: '#8B5CF6',
    startDate: new Date(2024, 2, 25),
    endDate: new Date(2024, 2, 25),
    duration: 'Half Day (Afternoon)',
    reason: 'training',
    description: 'Advanced Bridal Styling Workshop',
    status: 'pending',
    submittedAt: new Date(2024, 2, 12),
    branchId: 'branch-2',
    branchName: 'Hair Talkz • Mercure Gold'
  }
]

export function EmployeeManagerView({
  className,
  userRole = 'employee',
  currentUserId,
  businessType,
  organizations = []
}: EmployeeManagerViewProps) {
  const { currentOrganization } = useMultiOrgAuth()
  const [selectedTab, setSelectedTab] = useState<'calendar' | 'requests' | 'team'>('calendar')
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all')

  // Filter requests based on role
  const getFilteredRequests = () => {
    let filtered = leaveRequests

    // Employee sees only their own requests
    if (userRole === 'employee') {
      filtered = filtered.filter(req => req.employeeId === currentUserId)
    }

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(req => req.status === filter)
    }

    return filtered
  }

  const pendingCount = leaveRequests.filter(
    req => req.status === 'pending' && (userRole !== 'employee' || req.employeeId === currentUserId)
  ).length

  const handleApproval = (requestId: string, approved: boolean) => {
    setLeaveRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: approved ? 'approved' : 'denied',
              reviewedAt: new Date(),
              reviewedBy: 'Current User'
            }
          : req
      )
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
      case 'denied':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
      default:
        return 'bg-muted text-gray-800 dark:bg-muted-foreground/10 dark:text-gray-200'
    }
  }

  const formatDuration = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return '1 Day'
    } else if (diffDays > 1) {
      return `${diffDays} Days`
    } else {
      return 'Same Day'
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">
              {userRole === 'employee' ? 'My Schedule & Leave' : 'Team Management'}
            </h1>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {userRole === 'employee'
                ? 'Request leave and view your schedule'
                : 'Manage team schedules and approve leave requests'}
            </p>
          </div>
        </div>

        {/* Notification Badge for Managers */}
        {(userRole === 'manager' || userRole === 'admin') && pendingCount > 0 && (
          <Alert className="w-auto bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10">
            <Bell className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-300 font-medium">
              {pendingCount} pending leave request{pendingCount > 1 ? 's' : ''} require approval
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Navigation Tabs */}
      <Tabs value={selectedTab} onValueChange={v => setSelectedTab(v as any)}>
        <TabsList className="bg-muted dark:bg-muted">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendar
          </TabsTrigger>

          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserX className="w-4 h-4" />
            Leave Requests
            {pendingCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30"
              >
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>

          {(userRole === 'manager' || userRole === 'admin') && (
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Overview
            </TabsTrigger>
          )}
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-6">
          <Card className="bg-background dark:bg-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {userRole === 'employee' ? 'My Schedule' : 'Team Calendar'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <HeraDnaUniversalResourceCalendar
                businessType={businessType}
                organizations={organizations}
                canViewAllBranches={userRole !== 'employee'}
                className="min-h-[600px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Requests View */}
        <TabsContent value="requests" className="mt-6">
          <Card className="bg-background dark:bg-muted">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-orange-600" />
                  {userRole === 'employee' ? 'My Leave Requests' : 'Leave Requests'}
                </CardTitle>

                <div className="flex items-center gap-2">
                  {/* Status Filter */}
                  <div className="flex items-center gap-1">
                    {['all', 'pending', 'approved', 'denied'].map(status => (
                      <Button
                        key={status}
                        variant={filter === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(status as any)}
                        className="text-xs"
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-4">
                  {getFilteredRequests().length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground dark:text-muted-foreground">
                      <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No leave requests found</p>
                      <p className="text-sm">
                        {userRole === 'employee'
                          ? "You haven't submitted any leave requests yet"
                          : 'No leave requests to review'}
                      </p>
                    </div>
                  ) : (
                    getFilteredRequests().map(request => (
                      <div
                        key={request.id}
                        className="border border-border dark:border-border rounded-lg p-4 space-y-4"
                      >
                        {/* Request Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 bg-purple-600">
                              <AvatarFallback className="text-foreground font-semibold">
                                {request.employeeAvatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-foreground">
                                {request.employeeName}
                              </h3>
                              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                {request.employeeTitle} • {request.branchName}
                              </p>
                            </div>
                          </div>
                          <Badge className={cn('text-xs', getStatusColor(request.status))}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>

                        {/* Leave Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: request.leaveTypeColor }}
                            >
                              <UserX className="w-4 h-4 text-foreground" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                                {request.leaveTypeName}
                              </p>
                              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                {request.reason.charAt(0).toUpperCase() + request.reason.slice(1)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                                {request.startDate.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                                {request.startDate.toDateString() !==
                                  request.endDate.toDateString() &&
                                  ` - ${request.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                              </p>
                              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                {request.duration}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                                Submitted
                              </p>
                              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                {request.submittedAt.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {request.description && (
                          <div className="bg-muted dark:bg-muted-foreground/10 rounded-lg p-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Note: </span>
                              {request.description}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons for Managers */}
                        {(userRole === 'manager' || userRole === 'admin') &&
                          request.status === 'pending' && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproval(request.id, true)}
                                className="bg-green-600 hover:bg-green-700 text-foreground"
                              >
                                <CheckSquare className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproval(request.id, false)}
                                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300"
                              >
                                <X className="w-4 h-4 mr-2" />
                                Deny
                              </Button>
                            </div>
                          )}

                        {/* Review Status */}
                        {request.status !== 'pending' && request.reviewedAt && (
                          <div className="text-xs text-muted-foreground dark:text-muted-foreground border-t border-border dark:border-border pt-2">
                            {request.status === 'approved' ? 'Approved' : 'Denied'} by{' '}
                            {request.reviewedBy} on{' '}
                            {request.reviewedAt.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Overview (Manager/Admin Only) */}
        {(userRole === 'manager' || userRole === 'admin') && (
          <TabsContent value="team" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Team Member Cards */}
              {['Rocky', 'Maya', 'Sophia'].map((member, idx) => (
                <Card key={member} className="bg-background dark:bg-muted">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12 bg-purple-600">
                        <AvatarFallback className="text-foreground font-bold">
                          {member[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-foreground">{member}</h3>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                          {idx === 0
                            ? 'Celebrity Hair Artist'
                            : idx === 1
                              ? 'Color Specialist'
                              : 'Bridal Specialist'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground dark:text-muted-foreground">This Month</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.floor(Math.random() * 3)} days off
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                          Pending Requests
                        </span>
                        <Badge variant={idx === 0 ? 'default' : 'secondary'} className="text-xs">
                          {idx === 0 ? '1' : '0'}
                        </Badge>
                      </div>

                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
