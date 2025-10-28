'use client'

import React, { useMemo, useState } from 'react'
import { LeaveRequest, LeaveBalance } from '@/hooks/useHeraLeave'
import { User, TrendingUp, TrendingDown, Calendar, FileText, Download, Zap, Clock, FileSpreadsheet, CalendarDays } from 'lucide-react'
import { exportLeaveReportToExcel, exportLeaveReportToPDF } from '@/lib/reports/leaveReportExport'
import { format, startOfYear, endOfYear } from 'date-fns'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#9B59B6',
  rose: '#E8B4B8'
}

interface LeaveReportTabProps {
  staff: Array<{ id: string; entity_name: string }>
  balances: Record<string, LeaveBalance>
  requests: LeaveRequest[]
  users: Array<{ id: string; entity_name: string }> // ✅ Users for approver name resolution
  branchId?: string
}

// Progress bar component
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${color}20` }}>
      <div
        className="h-full transition-all duration-500 rounded-full"
        style={{
          width: `${percentage}%`,
          backgroundColor: color
        }}
      />
    </div>
  )
}

// Staff balance card (Mobile)
function StaffBalanceCardMobile({ balance }: { balance: LeaveBalance }) {
  const utilizationRate = (balance.used_days / balance.total_allocation) * 100

  return (
    <div
      className="rounded-xl p-4 mb-3 transition-all duration-300"
      style={{
        backgroundColor: COLORS.charcoal,
        border: `1px solid ${COLORS.bronze}30`
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${COLORS.gold}20` }}
        >
          <User className="w-6 h-6" style={{ color: COLORS.gold }} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-base" style={{ color: COLORS.champagne }}>
            {balance.staff_name}
          </div>
          <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            {utilizationRate.toFixed(0)}% utilized
          </div>
        </div>
      </div>

      {/* Balances Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Entitlement
          </div>
          <div className="text-lg font-bold" style={{ color: COLORS.champagne }}>
            {balance.entitlement}
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Used
          </div>
          <div className="text-lg font-bold" style={{ color: COLORS.rose }}>
            {balance.used_days}
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Pending
          </div>
          <div className="text-lg font-bold" style={{ color: COLORS.bronze }}>
            {balance.pending_days}
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Available
          </div>
          <div className="text-lg font-bold" style={{ color: COLORS.emerald }}>
            {balance.available_days}
          </div>
        </div>
      </div>

      {/* Policy & Accrual Info */}
      <div
        className="rounded-lg p-2 mb-3"
        style={{ backgroundColor: `${COLORS.gold}10`, border: `1px solid ${COLORS.gold}20` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-3 h-3" style={{ color: COLORS.gold }} />
          <span className="text-xs font-medium" style={{ color: COLORS.champagne }}>
            {balance.policy_name}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: COLORS.bronze }}>
          <div className="flex items-center gap-1">
            {balance.accrual_method === 'MONTHLY' ? (
              <Clock className="w-3 h-3" />
            ) : (
              <Zap className="w-3 h-3" />
            )}
            <span>
              {balance.accrual_method === 'MONTHLY'
                ? `${(balance.annual_entitlement / 12).toFixed(1)} days/mo`
                : 'Immediate'}
            </span>
          </div>
          <span style={{ opacity: 0.5 }}>•</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{balance.months_worked} months</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs" style={{ color: COLORS.bronze }}>
          <span>Utilization</span>
          <span>{utilizationRate.toFixed(1)}%</span>
        </div>
        <ProgressBar value={balance.used_days} max={balance.total_allocation} color={COLORS.gold} />
      </div>
    </div>
  )
}

// Staff balance row (Desktop)
function StaffBalanceRowDesktop({ balance }: { balance: LeaveBalance }) {
  const utilizationRate = (balance.used_days / balance.total_allocation) * 100

  return (
    <tr
      className="border-b transition-colors hover:bg-gold/5"
      style={{ borderColor: `${COLORS.bronze}30` }}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.gold}20` }}
          >
            <User className="w-5 h-5" style={{ color: COLORS.gold }} />
          </div>
          <div>
            <div className="font-medium" style={{ color: COLORS.champagne }}>
              {balance.staff_name}
            </div>
            <div className="text-xs mt-0.5" style={{ color: COLORS.bronze, opacity: 0.7 }}>
              {balance.months_worked} months worked
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm" style={{ color: COLORS.champagne }}>
          {balance.policy_name}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {balance.accrual_method === 'MONTHLY' ? (
            <>
              <Clock className="w-3 h-3" style={{ color: COLORS.bronze }} />
              <span className="text-xs" style={{ color: COLORS.bronze }}>
                {(balance.annual_entitlement / 12).toFixed(1)} days/mo
              </span>
            </>
          ) : (
            <>
              <Zap className="w-3 h-3" style={{ color: COLORS.gold }} />
              <span className="text-xs" style={{ color: COLORS.bronze }}>
                Immediate
              </span>
            </>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm font-medium" style={{ color: COLORS.champagne }}>
          {balance.entitlement}
        </div>
        {balance.entitlement < balance.annual_entitlement && (
          <div className="text-xs mt-0.5" style={{ color: COLORS.plum, opacity: 0.8 }}>
            Prorated from {balance.annual_entitlement}
          </div>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="text-sm font-medium" style={{ color: COLORS.rose }}>
          {balance.used_days}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm font-medium" style={{ color: COLORS.bronze }}>
          {balance.pending_days}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm font-medium" style={{ color: COLORS.emerald }}>
          {balance.available_days}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1">
          <div className="text-xs" style={{ color: COLORS.bronze }}>
            {utilizationRate.toFixed(1)}%
          </div>
          <ProgressBar value={balance.used_days} max={balance.total_allocation} color={COLORS.gold} />
        </div>
      </td>
    </tr>
  )
}

export function LeaveReportTab({ staff, balances, requests, users, branchId }: LeaveReportTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Summary report date range (defaults to current year)
  const [summaryStartDate, setSummaryStartDate] = useState(format(startOfYear(new Date()), 'yyyy-MM-dd'))
  const [summaryEndDate, setSummaryEndDate] = useState(format(endOfYear(new Date()), 'yyyy-MM-dd'))

  // Detailed report date range (defaults to current year)
  const [detailedStartDate, setDetailedStartDate] = useState(format(startOfYear(new Date()), 'yyyy-MM-dd'))
  const [detailedEndDate, setDetailedEndDate] = useState(format(endOfYear(new Date()), 'yyyy-MM-dd'))
  const [showDetailedOptions, setShowDetailedOptions] = useState(false)

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const allBalances = Object.values(balances)

    const totalEntitlement = allBalances.reduce((sum, b) => sum + b.entitlement, 0)
    const totalUsed = allBalances.reduce((sum, b) => sum + b.used_days, 0)
    const totalPending = allBalances.reduce((sum, b) => sum + b.pending_days, 0)
    const totalAvailable = allBalances.reduce((sum, b) => sum + b.available_days, 0)

    const avgUtilization = totalEntitlement > 0 ? (totalUsed / totalEntitlement) * 100 : 0

    return {
      totalEntitlement,
      totalUsed,
      totalPending,
      totalAvailable,
      avgUtilization
    }
  }, [balances])

  // Filter balances by search
  const filteredBalances = useMemo(() => {
    const balanceArray = Object.values(balances)

    if (!searchQuery.trim()) return balanceArray

    const query = searchQuery.toLowerCase()
    return balanceArray.filter(b => b.staff_name.toLowerCase().includes(query))
  }, [balances, searchQuery])

  // Sort by utilization (highest first)
  const sortedBalances = useMemo(() => {
    return [...filteredBalances].sort((a, b) => {
      const aUtil = (a.used_days / a.total_allocation) * 100
      const bUtil = (b.used_days / b.total_allocation) * 100
      return bUtil - aUtil
    })
  }, [filteredBalances])

  // ✅ Filter requests for report generation based on date range, leave type, and status
  const filteredRequestsForReport = useMemo(() => {
    return requests.filter(request => {
      // Filter by date range (check if request start_date falls within the selected range)
      const requestDate = new Date(request.start_date)
      const startDate = new Date(summaryStartDate)
      const endDate = new Date(summaryEndDate)
      const isInDateRange = requestDate >= startDate && requestDate <= endDate

      // Filter by leave type
      const matchesLeaveType = leaveTypeFilter === 'all' || request.leave_type === leaveTypeFilter

      // Filter by status
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter

      return isInDateRange && matchesLeaveType && matchesStatus
    })
  }, [requests, summaryStartDate, summaryEndDate, leaveTypeFilter, statusFilter])

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div
          className="rounded-xl p-4 md:p-6"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.gold}30`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5" style={{ color: COLORS.gold }} />
            <TrendingUp className="w-4 h-4" style={{ color: COLORS.emerald }} />
          </div>
          <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: COLORS.champagne }}>
            {summaryStats.totalEntitlement}
          </div>
          <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Total Entitlement
          </div>
        </div>

        <div
          className="rounded-xl p-4 md:p-6"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.rose}30`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5" style={{ color: COLORS.rose }} />
            <TrendingDown className="w-4 h-4" style={{ color: COLORS.rose }} />
          </div>
          <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: COLORS.champagne }}>
            {summaryStats.totalUsed}
          </div>
          <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Total Used
          </div>
        </div>

        <div
          className="rounded-xl p-4 md:p-6"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.bronze}30`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5" style={{ color: COLORS.bronze }} />
          </div>
          <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: COLORS.champagne }}>
            {summaryStats.totalPending}
          </div>
          <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Pending Requests
          </div>
        </div>

        <div
          className="rounded-xl p-4 md:p-6"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.emerald}30`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5" style={{ color: COLORS.emerald }} />
          </div>
          <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: COLORS.champagne }}>
            {summaryStats.totalAvailable}
          </div>
          <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Total Available
          </div>
        </div>
      </div>

      {/* Average Utilization Card */}
      <div
        className="rounded-xl p-4 md:p-6 mb-6"
        style={{
          background: `linear-gradient(135deg, ${COLORS.charcoal} 0%, ${COLORS.black} 100%)`,
          border: `1px solid ${COLORS.gold}30`
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
              Average Utilization
            </h3>
            <p className="text-xs mt-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
              Across all staff members
            </p>
          </div>
          <div className="text-3xl font-bold" style={{ color: COLORS.gold }}>
            {summaryStats.avgUtilization.toFixed(1)}%
          </div>
        </div>
        <ProgressBar
          value={summaryStats.totalUsed}
          max={summaryStats.totalEntitlement}
          color={COLORS.gold}
        />
      </div>

      {/* Unified Filters & Report Export Section */}
      <div
        className="rounded-xl p-4 md:p-6 mb-6"
        style={{
          background: `linear-gradient(135deg, ${COLORS.plum}20 0%, ${COLORS.charcoal} 100%)`,
          border: `1px solid ${COLORS.plum}30`
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-5 h-5" style={{ color: COLORS.plum }} />
              <h3 className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
                Leave Reports & Filters
              </h3>
            </div>
            <p className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
              Configure filters and generate comprehensive leave reports (Summary or Detailed)
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ backgroundColor: `${COLORS.plum}20`, color: COLORS.plum }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border text-sm transition-all duration-300"
            style={{
              backgroundColor: COLORS.black,
              borderColor: `${COLORS.plum}30`,
              color: COLORS.champagne
            }}
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="space-y-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Date Range Section */}
            <div>
              <label className="text-xs mb-2 block font-semibold" style={{ color: COLORS.plum }}>
                📅 Report Date Range
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: COLORS.bronze }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={summaryStartDate}
                    onChange={e => {
                      setSummaryStartDate(e.target.value)
                      setDetailedStartDate(e.target.value)
                    }}
                    className="w-full px-3 py-2 rounded-lg border text-sm transition-all duration-300"
                    style={{
                      backgroundColor: COLORS.black,
                      borderColor: `${COLORS.plum}30`,
                      color: COLORS.champagne
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs mb-1 block" style={{ color: COLORS.bronze }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={summaryEndDate}
                    onChange={e => {
                      setSummaryEndDate(e.target.value)
                      setDetailedEndDate(e.target.value)
                    }}
                    className="w-full px-3 py-2 rounded-lg border text-sm transition-all duration-300"
                    style={{
                      backgroundColor: COLORS.black,
                      borderColor: `${COLORS.plum}30`,
                      color: COLORS.champagne
                    }}
                  />
                </div>
              </div>

              {/* Quick date range presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const now = new Date()
                    const start = format(startOfYear(now), 'yyyy-MM-dd')
                    const end = format(endOfYear(now), 'yyyy-MM-dd')
                    setSummaryStartDate(start)
                    setSummaryEndDate(end)
                    setDetailedStartDate(start)
                    setDetailedEndDate(end)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: `${COLORS.plum}20`, color: COLORS.plum }}
                >
                  Current Year
                </button>
                <button
                  onClick={() => {
                    const lastYear = new Date()
                    lastYear.setFullYear(lastYear.getFullYear() - 1)
                    const start = format(startOfYear(lastYear), 'yyyy-MM-dd')
                    const end = format(endOfYear(lastYear), 'yyyy-MM-dd')
                    setSummaryStartDate(start)
                    setSummaryEndDate(end)
                    setDetailedStartDate(start)
                    setDetailedEndDate(end)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: `${COLORS.plum}20`, color: COLORS.plum }}
                >
                  Last Year
                </button>
                <button
                  onClick={() => {
                    const now = new Date()
                    const sixMonthsAgo = new Date()
                    sixMonthsAgo.setMonth(now.getMonth() - 6)
                    const start = format(sixMonthsAgo, 'yyyy-MM-dd')
                    const end = format(now, 'yyyy-MM-dd')
                    setSummaryStartDate(start)
                    setSummaryEndDate(end)
                    setDetailedStartDate(start)
                    setDetailedEndDate(end)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: `${COLORS.plum}20`, color: COLORS.plum }}
                >
                  Last 6 Months
                </button>
                <button
                  onClick={() => {
                    const now = new Date()
                    const threeMonthsAgo = new Date()
                    threeMonthsAgo.setMonth(now.getMonth() - 3)
                    const start = format(threeMonthsAgo, 'yyyy-MM-dd')
                    const end = format(now, 'yyyy-MM-dd')
                    setSummaryStartDate(start)
                    setSummaryEndDate(end)
                    setDetailedStartDate(start)
                    setDetailedEndDate(end)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: `${COLORS.plum}20`, color: COLORS.plum }}
                >
                  Last 3 Months
                </button>
              </div>
            </div>

            {/* Leave Type and Status Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs mb-2 block" style={{ color: COLORS.bronze }}>
                  Leave Type
                </label>
                <select
                  value={leaveTypeFilter}
                  onChange={e => setLeaveTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm transition-all duration-300"
                  style={{
                    backgroundColor: COLORS.black,
                    borderColor: `${COLORS.plum}30`,
                    color: COLORS.champagne
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs mb-2 block" style={{ color: COLORS.bronze }}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm transition-all duration-300"
                  style={{
                    backgroundColor: COLORS.black,
                    borderColor: `${COLORS.plum}30`,
                    color: COLORS.champagne
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setLeaveTypeFilter('all')
                    setStatusFilter('all')
                    const now = new Date()
                    const start = format(startOfYear(now), 'yyyy-MM-dd')
                    const end = format(endOfYear(now), 'yyyy-MM-dd')
                    setSummaryStartDate(start)
                    setSummaryEndDate(end)
                    setDetailedStartDate(start)
                    setDetailedEndDate(end)
                  }}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: `${COLORS.plum}30`, color: COLORS.champagne }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Buttons Section */}
        <div className="space-y-3">
          {/* Report Export */}
          <div>
            <label className="text-xs mb-2 block font-semibold" style={{ color: COLORS.plum }}>
              📊 Leave Reports (Comprehensive Analytics)
            </label>
            <div className="flex flex-col md:flex-row gap-2">
              <SalonLuxeButton
                size="sm"
                variant="outline"
                icon={<FileSpreadsheet className="w-4 h-4" />}
                onClick={() => {
                  // 🔍 ENHANCED DEBUG: Log complete data snapshot
                  console.log('📊 [Excel Export] Complete data snapshot:', {
                    users: {
                      count: users?.length || 0,
                      array: users,
                      sampleUser: users?.[0],
                      allUserIds: users?.map(u => u.id).slice(0, 5),
                      allUserNames: users?.map(u => u.entity_name).slice(0, 5)
                    },
                    requests: {
                      count: requests?.length || 0,
                      sampleRequest: requests?.[0],
                      approvedRequests: requests?.filter(r => r.approved_by)?.length || 0,
                      sampleApprovedBy: requests?.find(r => r.approved_by)?.approved_by,
                      allApprovedByIds: requests?.filter(r => r.approved_by).map(r => r.approved_by).slice(0, 5)
                    }
                  })

                  const reportData = {
                    balances,
                    requests: filteredRequestsForReport, // ✅ Use filtered requests instead of all requests
                    staff,
                    users, // ✅ Pass users for approver name resolution
                    filters: {
                      startDate: summaryStartDate,
                      endDate: summaryEndDate,
                      leaveTypes: leaveTypeFilter !== 'all' ? [leaveTypeFilter as any] : undefined,
                      status: statusFilter !== 'all' ? [statusFilter as any] : undefined
                    },
                    organizationName: 'HERA Organization',
                    generatedAt: format(new Date(), 'dd MMM yyyy HH:mm')
                  }

                  console.log('📊 [Excel Export] Final report payload:', {
                    hasUsers: !!reportData.users,
                    usersCount: reportData.users?.length || 0,
                    totalRequestsCount: requests?.length || 0, // ✅ Log total requests for comparison
                    filteredRequestsCount: reportData.requests?.length || 0, // ✅ Log filtered count
                    balancesCount: Object.keys(reportData.balances || {}).length,
                    staffCount: reportData.staff?.length || 0
                  })

                  exportLeaveReportToExcel(reportData)
                }}
                title={`Export comprehensive report from ${summaryStartDate} to ${summaryEndDate}`}
                className="flex-1"
              >
                Download Excel
              </SalonLuxeButton>

              <SalonLuxeButton
                size="sm"
                variant="outline"
                icon={<Download className="w-4 h-4" />}
                onClick={() => {
                  const reportData = {
                    balances,
                    requests: filteredRequestsForReport, // ✅ Use filtered requests instead of all requests
                    staff,
                    users, // ✅ Pass users for approver name resolution
                    filters: {
                      startDate: summaryStartDate,
                      endDate: summaryEndDate,
                      leaveTypes: leaveTypeFilter !== 'all' ? [leaveTypeFilter as any] : undefined,
                      status: statusFilter !== 'all' ? [statusFilter as any] : undefined
                    },
                    organizationName: 'HERA Organization',
                    generatedAt: format(new Date(), 'dd MMM yyyy HH:mm')
                  }
                  exportLeaveReportToPDF(reportData)
                }}
                title={`Print/Save report from ${summaryStartDate} to ${summaryEndDate}`}
                className="flex-1"
              >
                Print / Save PDF
              </SalonLuxeButton>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sortedBalances.length === 0 && (
        <div
          className="text-center py-12 rounded-xl"
          style={{ backgroundColor: COLORS.charcoal }}
        >
          <FileText
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: COLORS.bronze, opacity: 0.3 }}
          />
          <h3 className="text-lg font-medium mb-2" style={{ color: COLORS.champagne }}>
            No staff found
          </h3>
          <p className="text-sm" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            {searchQuery ? 'Try adjusting your search' : 'Staff balances will appear here'}
          </p>
        </div>
      )}

      {/* Mobile Cards */}
      <div className="md:hidden">
        {sortedBalances.map(balance => (
          <StaffBalanceCardMobile key={balance.staff_id} balance={balance} />
        ))}
      </div>

      {/* Desktop Table */}
      {sortedBalances.length > 0 && (
        <div
          className="hidden md:block overflow-x-auto rounded-xl"
          style={{ backgroundColor: COLORS.charcoal }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.gold}30` }}>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.gold }}
                >
                  Staff Member
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.gold }}
                >
                  Policy & Accrual
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.gold }}
                >
                  Entitlement
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.gold }}
                >
                  Used
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.gold }}
                >
                  Pending
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.gold }}
                >
                  Available
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.gold }}
                >
                  Utilization
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedBalances.map(balance => (
                <StaffBalanceRowDesktop key={balance.staff_id} balance={balance} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
