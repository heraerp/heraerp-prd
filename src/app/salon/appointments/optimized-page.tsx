/**
 * Optimized Appointments Page Example
 * Shows how to use the new optimized hooks and caching system
 */

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useOptimizedAppointments,
  useOptimizedStaff,
  useOptimizedCustomers,
  useOptimizedBranchFilter,
  useOptimizedDashboardData
} from '@/hooks/useOptimizedSalonData'
import { withSalonData } from '@/app/salon/OptimizedSalonProvider'
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'

function OptimizedAppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today')

  // Get branch filter with persistence
  const { selectedBranchId, setBranchId, hasMultipleBranches, branches } =
    useOptimizedBranchFilter('appointments-page')

  // Get dashboard stats
  const { stats, performanceMetrics, refreshAll, getUpcomingAppointments } =
    useOptimizedDashboardData()

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    const end = new Date(now)

    switch (viewMode) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'week':
        const dayOfWeek = start.getDay()
        start.setDate(start.getDate() - dayOfWeek)
        start.setHours(0, 0, 0, 0)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
        break
      case 'month':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(end.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
        break
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    }
  }, [viewMode])

  // Use optimized hooks with intelligent caching
  const {
    appointments,
    isLoading,
    isValidating,
    lastUpdated,
    updateAppointment,
    createAppointment,
    refresh,
    prefetch
  } = useOptimizedAppointments({
    dateRange,
    branchId: selectedBranchId || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    realTime: viewMode === 'today' // Only real-time for today view
  })

  const { staff, getStaffById } = useOptimizedStaff({
    branchId: selectedBranchId || undefined,
    includeUnavailable: false
  })

  const { customers, searchCustomers } = useOptimizedCustomers()

  // Filter appointments by search term (client-side for performance)
  const filteredAppointments = useMemo(() => {
    if (!searchTerm) return appointments

    const searchLower = searchTerm.toLowerCase()
    return appointments.filter(apt => {
      const customer = customers.find(c => c.id === apt.source_entity_id)
      const stylist = getStaffById(apt.target_entity_id)

      return (
        customer?.entity_name?.toLowerCase().includes(searchLower) ||
        stylist?.entity_name?.toLowerCase().includes(searchLower) ||
        apt.metadata?.notes?.toLowerCase().includes(searchLower)
      )
    })
  }, [appointments, searchTerm, customers, getStaffById])

  // Prefetch data for other views
  React.useEffect(() => {
    if (viewMode === 'today') {
      // Prefetch week view data
      const weekStart = new Date()
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() + 7)

      setTimeout(() => {
        prefetch({
          start: weekStart.toISOString(),
          end: weekEnd.toISOString()
        })
      }, 2000)
    }
  }, [viewMode, prefetch])

  const upcomingAppointments = getUpcomingAppointments(2) // Next 2 hours

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Performance Metrics (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
          <div className="flex gap-4">
            <span>Cache Hit: {performanceMetrics.cacheHitRate.toFixed(1)}%</span>
            <span>Load Time: {performanceMetrics.averageLoadTime}ms</span>
            <span>
              Last Refresh: {new Date(performanceMetrics.lastRefresh).toLocaleTimeString()}
            </span>
            <span>
              Data Age: {lastUpdated ? `${Math.round((Date.now() - lastUpdated) / 1000)}s` : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointments</h1>
          <p className="text-gray-600">Manage your salon appointments efficiently</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshAll} disabled={isValidating}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">{stats.completedToday} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From {stats.completedToday} services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStaff}</div>
            <p className="text-xs text-muted-foreground">of {stats.totalStaff} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming (2hrs)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search customers, staff, notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Branch Filter */}
        {hasMultipleBranches && (
          <select
            value={selectedBranchId || '__ALL__'}
            onChange={e => setBranchId(e.target.value === '__ALL__' ? '' : e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="__ALL__">All Branches</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.entity_name}
              </option>
            ))}
          </select>
        )}

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Status</option>
          <option value="booked">Booked</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* View Mode */}
        <div className="flex border rounded-md">
          {(['today', 'week', 'month'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 text-sm font-medium capitalize ${
                viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Appointments ({filteredAppointments.length})</CardTitle>
            {isValidating && (
              <Badge variant="secondary">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Updating...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first appointment to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map(appointment => {
                const customer = customers.find(c => c.id === appointment.source_entity_id)
                const stylist = getStaffById(appointment.target_entity_id)
                const startTime = new Date(
                  appointment.metadata?.start_time || appointment.transaction_date
                )

                return (
                  <div
                    key={appointment.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {customer?.entity_name || 'Walk-in Customer'}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {stylist?.entity_name || 'Unassigned'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {startTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            AED {appointment.total_amount || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            appointment.metadata?.status === 'completed'
                              ? 'default'
                              : appointment.metadata?.status === 'confirmed'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {appointment.metadata?.status || 'pending'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                    {appointment.metadata?.notes && (
                      <p className="mt-2 text-sm text-gray-600">{appointment.metadata.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Export with salon data wrapper for automatic loading states
export default withSalonData(OptimizedAppointmentsPage, ['branches', 'staff'])
