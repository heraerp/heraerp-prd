'use client'

import React, { useState, useMemo } from 'react'
import { LeaveRequest } from '@/hooks/useHeraLeave'
import { Calendar, Clock, CheckCircle, XCircle, Ban, User, FileText, ChevronDown, ChevronUp, Edit2, Trash2, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

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

interface LeaveRequestsTabProps {
  requests: LeaveRequest[]
  staff: Array<{ id: string; entity_name: string }>
  isLoading: boolean
  onApprove: (requestId: string, notes?: string) => Promise<void>
  onReject: (requestId: string, reason?: string) => Promise<void>
  onCancel: (requestId: string) => Promise<void>
  onEdit?: (request: LeaveRequest) => void // ✅ NEW: Edit functionality
  onDelete?: (requestId: string) => void // ✅ NEW: Delete functionality
  onWithdraw?: (requestId: string) => void // ✅ NEW: Withdraw (same as cancel, but different terminology)
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    submitted: { label: 'Pending', icon: Clock, color: COLORS.bronze, bgColor: `${COLORS.bronze}20` },
    approved: { label: 'Approved', icon: CheckCircle, color: COLORS.emerald, bgColor: `${COLORS.emerald}20` },
    rejected: { label: 'Rejected', icon: XCircle, color: COLORS.rose, bgColor: `${COLORS.rose}20` },
    cancelled: { label: 'Cancelled', icon: Ban, color: '#666', bgColor: '#66666620' }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted
  const Icon = config.icon

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  )
}

// Leave type badge
function LeaveTypeBadge({ type }: { type: string }) {
  const typeConfig = {
    ANNUAL: { label: 'Annual', color: COLORS.plum },
    SICK: { label: 'Sick', color: COLORS.rose },
    UNPAID: { label: 'Unpaid', color: COLORS.bronze },
    OTHER: { label: 'Other', color: '#666' }
  }

  const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.OTHER

  return (
    <span
      className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
      style={{ color: config.color, backgroundColor: `${config.color}20` }}
    >
      {config.label}
    </span>
  )
}

// Desktop table row
function DesktopTableRow({
  request,
  onApprove,
  onReject,
  onCancel,
  onEdit,
  onDelete,
  onWithdraw
}: {
  request: LeaveRequest
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onCancel: (id: string) => void
  onEdit?: (request: LeaveRequest) => void
  onDelete?: (id: string) => void
  onWithdraw?: (id: string) => void
}) {
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
              {request.staff_name}
            </div>
            <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
              {request.transaction_code}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <LeaveTypeBadge type={request.leave_type} />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2" style={{ color: COLORS.champagne }}>
          <Calendar className="w-4 h-4" style={{ color: COLORS.bronze }} />
          <span className="text-sm">
            {(() => {
              try {
                if (!request.start_date) return 'Not set'
                const date = new Date(request.start_date)
                if (isNaN(date.getTime())) return 'Invalid date'
                return format(date, 'dd MMM yyyy')
              } catch {
                return 'Invalid date'
              }
            })()}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2" style={{ color: COLORS.champagne }}>
          <Calendar className="w-4 h-4" style={{ color: COLORS.bronze }} />
          <span className="text-sm">
            {(() => {
              try {
                if (!request.end_date) return 'Not set'
                const date = new Date(request.end_date)
                if (isNaN(date.getTime())) return 'Invalid date'
                return format(date, 'dd MMM yyyy')
              } catch {
                return 'Invalid date'
              }
            })()}
          </span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm font-medium" style={{ color: COLORS.champagne }}>
          {request.total_days} {request.total_days === 1 ? 'day' : 'days'}
        </div>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={request.status} />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {/* ✅ Quick Actions for Pending Requests */}
          {request.status === 'submitted' && (
            <>
              <button
                onClick={() => onApprove(request.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: `${COLORS.emerald}20`,
                  color: COLORS.emerald
                }}
              >
                Approve
              </button>
              <button
                onClick={() => onReject(request.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: `${COLORS.rose}20`,
                  color: COLORS.rose
                }}
              >
                Reject
              </button>
            </>
          )}

          {/* ✅ CRUD Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: `${COLORS.gold}20`,
                  color: COLORS.gold
                }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              style={{
                backgroundColor: COLORS.charcoal,
                border: `1px solid ${COLORS.bronze}30`
              }}
            >
              {/* Edit - Only for submitted requests */}
              {request.status === 'submitted' && onEdit && (
                <DropdownMenuItem
                  onClick={() => onEdit(request)}
                  style={{ color: COLORS.champagne }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Request
                </DropdownMenuItem>
              )}

              {/* Withdraw - For submitted or approved requests */}
              {(request.status === 'submitted' || request.status === 'approved') && onWithdraw && (
                <DropdownMenuItem
                  onClick={() => onWithdraw(request.id)}
                  style={{ color: COLORS.bronze }}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Withdraw Request
                </DropdownMenuItem>
              )}

              {/* Delete - Only for rejected/cancelled requests */}
              {(request.status === 'rejected' || request.status === 'cancelled') && onDelete && (
                <>
                  <DropdownMenuSeparator style={{ backgroundColor: `${COLORS.bronze}30` }} />
                  <DropdownMenuItem
                    onClick={() => onDelete(request.id)}
                    style={{ color: COLORS.rose }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Request
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}

// Mobile card
function MobileCard({
  request,
  onApprove,
  onReject,
  onCancel,
  onEdit,
  onDelete,
  onWithdraw
}: {
  request: LeaveRequest
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onCancel: (id: string) => void
  onEdit?: (request: LeaveRequest) => void
  onDelete?: (id: string) => void
  onWithdraw?: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-xl p-4 mb-3 transition-all duration-300"
      style={{
        backgroundColor: COLORS.charcoal,
        border: `1px solid ${COLORS.bronze}30`,
        boxShadow: expanded ? `0 8px 24px ${COLORS.black}80` : `0 2px 8px ${COLORS.black}40`
      }}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.gold}20` }}
          >
            <User className="w-6 h-6" style={{ color: COLORS.gold }} />
          </div>
          <div>
            <div className="font-semibold text-base" style={{ color: COLORS.champagne }}>
              {request.staff_name}
            </div>
            <div className="text-xs mt-0.5" style={{ color: COLORS.bronze, opacity: 0.7 }}>
              {request.transaction_code}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={request.status} />
          {/* ✅ CRUD Actions Menu for Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center transition-all duration-200 active:scale-95"
                style={{
                  backgroundColor: `${COLORS.gold}20`,
                  color: COLORS.gold
                }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              style={{
                backgroundColor: COLORS.charcoal,
                border: `1px solid ${COLORS.bronze}30`
              }}
            >
              {/* Edit - Only for submitted requests */}
              {request.status === 'submitted' && onEdit && (
                <DropdownMenuItem
                  onClick={() => onEdit(request)}
                  style={{ color: COLORS.champagne }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Request
                </DropdownMenuItem>
              )}

              {/* Withdraw - For submitted or approved requests */}
              {(request.status === 'submitted' || request.status === 'approved') && onWithdraw && (
                <DropdownMenuItem
                  onClick={() => onWithdraw(request.id)}
                  style={{ color: COLORS.bronze }}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Withdraw Request
                </DropdownMenuItem>
              )}

              {/* Delete - Only for rejected/cancelled requests */}
              {(request.status === 'rejected' || request.status === 'cancelled') && onDelete && (
                <>
                  <DropdownMenuSeparator style={{ backgroundColor: `${COLORS.bronze}30` }} />
                  <DropdownMenuItem
                    onClick={() => onDelete(request.id)}
                    style={{ color: COLORS.rose }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Request
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Leave Type
          </div>
          <LeaveTypeBadge type={request.leave_type} />
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Duration
          </div>
          <div className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
            {request.total_days} {request.total_days === 1 ? 'day' : 'days'}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Start Date
          </div>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.champagne }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: COLORS.bronze }} />
            {(() => {
              try {
                if (!request.start_date) return 'Not set'
                const date = new Date(request.start_date)
                if (isNaN(date.getTime())) return 'Invalid date'
                return format(date, 'dd MMM yyyy')
              } catch {
                return 'Invalid date'
              }
            })()}
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            End Date
          </div>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.champagne }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: COLORS.bronze }} />
            {(() => {
              try {
                if (!request.end_date) return 'Not set'
                const date = new Date(request.end_date)
                if (isNaN(date.getTime())) return 'Invalid date'
                return format(date, 'dd MMM yyyy')
              } catch {
                return 'Invalid date'
              }
            })()}
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {request.reason && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between py-2 text-sm font-medium transition-colors"
            style={{ color: COLORS.gold }}
          >
            <span>View Details</span>
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expanded && (
            <div
              className="mt-2 p-3 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300"
              style={{ backgroundColor: `${COLORS.black}40` }}
            >
              <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                Reason
              </div>
              <div className="text-sm" style={{ color: COLORS.champagne }}>
                {request.reason}
              </div>
              {request.notes && (
                <div className="mt-2">
                  <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                    Notes
                  </div>
                  <div className="text-sm" style={{ color: COLORS.champagne }}>
                    {request.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Action Buttons */}
      {(request.status === 'submitted' ||
        request.status === 'approved') && (
        <div className="mt-3 flex flex-col gap-2">
          {request.status === 'submitted' && (
            <>
              <button
                onClick={() => onApprove(request.id)}
                className="w-full min-h-[44px] rounded-lg text-sm font-semibold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: COLORS.emerald,
                  color: '#fff'
                }}
              >
                <CheckCircle className="w-4 h-4" />
                Approve Request
              </button>
              <button
                onClick={() => onReject(request.id)}
                className="w-full min-h-[44px] rounded-lg text-sm font-semibold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: `${COLORS.rose}20`,
                  color: COLORS.rose
                }}
              >
                <XCircle className="w-4 h-4" />
                Reject Request
              </button>
            </>
          )}
          <button
            onClick={() => onCancel(request.id)}
            className="w-full min-h-[44px] rounded-lg text-sm font-medium transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#66666620',
              color: '#999',
              border: '1px solid #66666640'
            }}
          >
            <Ban className="w-4 h-4" />
            Cancel Request
          </button>
        </div>
      )}
    </div>
  )
}

export function LeaveRequestsTab({
  requests,
  staff,
  isLoading,
  onApprove,
  onReject,
  onCancel,
  onEdit,
  onDelete,
  onWithdraw
}: LeaveRequestsTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter requests
  const filteredRequests = useMemo(() => {
    let filtered = [...requests]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        r =>
          r.staff_name.toLowerCase().includes(query) ||
          r.transaction_code.toLowerCase().includes(query) ||
          r.leave_type.toLowerCase().includes(query)
      )
    }

    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

    return filtered
  }, [requests, statusFilter, searchQuery])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: COLORS.gold }}
        />
      </div>
    )
  }

  return (
    <div>
      {/* Filters - Mobile */}
      <div className="md:hidden mb-4 space-y-3">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: `${COLORS.bronze}30`,
            color: COLORS.champagne
          }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: `${COLORS.bronze}30`,
            color: COLORS.champagne
          }}
        >
          <option value="all">All Statuses</option>
          <option value="submitted">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Filters - Desktop */}
      <div className="hidden md:flex items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border text-sm transition-all duration-300"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: `${COLORS.bronze}30`,
            color: COLORS.champagne
          }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border text-sm transition-all duration-300"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: `${COLORS.bronze}30`,
            color: COLORS.champagne
          }}
        >
          <option value="all">All Statuses</option>
          <option value="submitted">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <div
          className="text-center py-12 rounded-xl"
          style={{ backgroundColor: COLORS.charcoal }}
        >
          <FileText
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: COLORS.bronze, opacity: 0.3 }}
          />
          <h3 className="text-lg font-medium mb-2" style={{ color: COLORS.champagne }}>
            No leave requests found
          </h3>
          <p className="text-sm" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Leave requests will appear here'}
          </p>
        </div>
      )}

      {/* Mobile Cards */}
      <div className="md:hidden">
        {filteredRequests.map(request => (
          <MobileCard
            key={request.id}
            request={request}
            onApprove={onApprove}
            onReject={onReject}
            onCancel={onCancel}
            onEdit={onEdit}
            onDelete={onDelete}
            onWithdraw={onWithdraw}
          />
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-xl" style={{ backgroundColor: COLORS.charcoal }}>
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
                Type
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: COLORS.gold }}
              >
                Start Date
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: COLORS.gold }}
              >
                End Date
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: COLORS.gold }}
              >
                Duration
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: COLORS.gold }}
              >
                Status
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: COLORS.gold }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map(request => (
              <DesktopTableRow
                key={request.id}
                request={request}
                onApprove={onApprove}
                onReject={onReject}
                onCancel={onCancel}
                onEdit={onEdit}
                onDelete={onDelete}
                onWithdraw={onWithdraw}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
