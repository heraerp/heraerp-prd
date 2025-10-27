'use client'

import React, { useState, useMemo } from 'react'
import { LeavePolicy } from '@/hooks/useHeraLeave'
import { Settings, Calendar, Clock, Users, TrendingUp, CheckCircle, XCircle, Edit2, Archive, RotateCcw, Trash2, MoreVertical } from 'lucide-react'
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

interface LeavePoliciesTabProps {
  policies: LeavePolicy[]
  isLoading: boolean
  onAdd: () => void
  onEdit?: (policy: LeavePolicy) => void
  onArchive?: (policyId: string) => void
  onRestore?: (policyId: string) => void
  onDelete?: (policyId: string) => void
  filters?: {
    leave_type?: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
    status?: 'active' | 'archived' | 'all'
  }
  onFiltersChange?: (filters: {
    leave_type?: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
    status?: 'active' | 'archived' | 'all'
  }) => void
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
      className="inline-flex px-3 py-1 rounded-full text-xs font-medium"
      style={{ color: config.color, backgroundColor: `${config.color}20` }}
    >
      {config.label}
    </span>
  )
}

// Applies to badge
function AppliesToBadge({ appliesTo }: { appliesTo: string }) {
  const config = {
    FULL_TIME: { label: 'Full-Time', icon: Users },
    PART_TIME: { label: 'Part-Time', icon: Users },
    ALL: { label: 'All Staff', icon: Users }
  }

  const item = config[appliesTo as keyof typeof config] || config.ALL
  const Icon = item.icon

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs"
      style={{ color: COLORS.bronze, backgroundColor: `${COLORS.bronze}20` }}
    >
      <Icon className="w-3 h-3" />
      {item.label}
    </span>
  )
}

// Policy card (Mobile)
function PolicyCardMobile({
  policy,
  onEdit,
  onArchive,
  onRestore,
  onDelete
}: {
  policy: LeavePolicy
  onEdit?: (policy: LeavePolicy) => void
  onArchive?: (policyId: string) => void
  onRestore?: (policyId: string) => void
  onDelete?: (policyId: string) => void
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
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <LeaveTypeBadge type={policy.leave_type} />
            {policy.active ? (
              <CheckCircle className="w-4 h-4" style={{ color: COLORS.emerald }} />
            ) : (
              <XCircle className="w-4 h-4" style={{ color: COLORS.rose }} />
            )}
          </div>
          <h3 className="font-semibold text-base" style={{ color: COLORS.champagne }}>
            {policy.entity_name}
          </h3>
          {policy.description && (
            <p className="text-xs mt-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
              {policy.description}
            </p>
          )}
        </div>
        {/* Action menu */}
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
            {onEdit && (
              <DropdownMenuItem
                onClick={() => onEdit(policy)}
                style={{ color: COLORS.champagne }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Policy
              </DropdownMenuItem>
            )}
            {policy.active ? (
              onArchive && (
                <DropdownMenuItem
                  onClick={() => onArchive(policy.id)}
                  style={{ color: COLORS.bronze }}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )
            ) : (
              onRestore && (
                <DropdownMenuItem
                  onClick={() => onRestore(policy.id)}
                  style={{ color: COLORS.emerald }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore
                </DropdownMenuItem>
              )
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator style={{ backgroundColor: `${COLORS.bronze}30` }} />
                <DropdownMenuItem
                  onClick={() => onDelete(policy.id)}
                  style={{ color: COLORS.rose }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Entitlement
          </div>
          <div className="text-lg font-bold" style={{ color: COLORS.champagne }}>
            {policy.annual_entitlement} days
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Carry Over
          </div>
          <div className="text-lg font-bold" style={{ color: COLORS.champagne }}>
            {policy.carry_over_cap} days
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Min Notice
          </div>
          <div className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
            {policy.min_notice_days} days
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Max Consecutive
          </div>
          <div className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
            {policy.max_consecutive_days} days
          </div>
        </div>
      </div>

      {/* Applies To */}
      <div className="mb-3">
        <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
          Applies To
        </div>
        <AppliesToBadge appliesTo={policy.applies_to} />
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 text-sm font-medium transition-colors text-left"
        style={{ color: COLORS.gold }}
      >
        {expanded ? '▼ Hide Details' : '▶ Show Details'}
      </button>

      {expanded && (
        <div
          className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
          style={{
            backgroundColor: `${COLORS.black}40`,
            padding: '12px',
            borderRadius: '8px'
          }}
        >
          <div>
            <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
              Minimum Leave Days
            </div>
            <div className="text-sm" style={{ color: COLORS.champagne }}>
              {policy.min_leave_days} days
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
              Accrual Method
            </div>
            <div className="text-sm" style={{ color: COLORS.champagne }}>
              {policy.accrual_method === 'IMMEDIATE' ? 'Immediate' : 'Monthly'}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
              Probation Period
            </div>
            <div className="text-sm" style={{ color: COLORS.champagne }}>
              {policy.probation_period_months} months
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
              Effective Period
            </div>
            <div className="text-sm" style={{ color: COLORS.champagne }}>
              {(() => {
                try {
                  if (!policy.effective_from) return 'Not set'
                  const fromDate = new Date(policy.effective_from)
                  if (isNaN(fromDate.getTime())) return 'Invalid date'

                  let dateStr = format(fromDate, 'dd MMM yyyy')

                  if (policy.effective_to) {
                    const toDate = new Date(policy.effective_to)
                    if (!isNaN(toDate.getTime())) {
                      dateStr += ` - ${format(toDate, 'dd MMM yyyy')}`
                    }
                  }

                  return dateStr
                } catch (error) {
                  console.error('Date formatting error:', error, policy)
                  return 'Invalid date'
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Policy row (Desktop)
function PolicyRowDesktop({
  policy,
  onEdit,
  onArchive,
  onRestore,
  onDelete
}: {
  policy: LeavePolicy
  onEdit?: (policy: LeavePolicy) => void
  onArchive?: (policyId: string) => void
  onRestore?: (policyId: string) => void
  onDelete?: (policyId: string) => void
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
            <Settings className="w-5 h-5" style={{ color: COLORS.gold }} />
          </div>
          <div>
            <div className="font-medium" style={{ color: COLORS.champagne }}>
              {policy.entity_name}
            </div>
            {policy.description && (
              <div className="text-xs mt-0.5" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                {policy.description}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <LeaveTypeBadge type={policy.leave_type} />
      </td>
      <td className="px-4 py-4">
        <div className="text-sm font-medium" style={{ color: COLORS.champagne }}>
          {policy.annual_entitlement} days
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm" style={{ color: COLORS.champagne }}>
          {policy.carry_over_cap} days
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm" style={{ color: COLORS.champagne }}>
          {policy.min_notice_days} days
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="text-sm" style={{ color: COLORS.champagne }}>
          {policy.max_consecutive_days} days
        </div>
      </td>
      <td className="px-4 py-4">
        <AppliesToBadge appliesTo={policy.applies_to} />
      </td>
      <td className="px-4 py-4">
        {policy.active ? (
          <div
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
            style={{ color: COLORS.emerald, backgroundColor: `${COLORS.emerald}20` }}
          >
            <CheckCircle className="w-3 h-3" />
            Active
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
            style={{ color: COLORS.rose, backgroundColor: `${COLORS.rose}20` }}
          >
            <XCircle className="w-3 h-3" />
            Inactive
          </div>
        )}
      </td>
      <td className="px-4 py-4">
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
            {onEdit && (
              <DropdownMenuItem
                onClick={() => onEdit(policy)}
                style={{ color: COLORS.champagne }}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Policy
              </DropdownMenuItem>
            )}
            {policy.active ? (
              onArchive && (
                <DropdownMenuItem
                  onClick={() => onArchive(policy.id)}
                  style={{ color: COLORS.bronze }}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )
            ) : (
              onRestore && (
                <DropdownMenuItem
                  onClick={() => onRestore(policy.id)}
                  style={{ color: COLORS.emerald }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore
                </DropdownMenuItem>
              )
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator style={{ backgroundColor: `${COLORS.bronze}30` }} />
                <DropdownMenuItem
                  onClick={() => onDelete(policy.id)}
                  style={{ color: COLORS.rose }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

export function LeavePoliciesTab({
  policies,
  isLoading,
  onAdd,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  filters = { status: 'all' },
  onFiltersChange
}: LeavePoliciesTabProps) {
  // ✅ ENTERPRISE PATTERN: Client-side filtering (data loaded once from server)
  // Use controlled filters if provided, otherwise fall back to local state
  const [localFilterType, setLocalFilterType] = useState<string>('all')
  const [localFilterActive, setLocalFilterActive] = useState<string>('all')

  // Convert filter values, treating undefined as 'all'
  const filterType = filters?.leave_type || (filters ? 'all' : localFilterType)
  const filterActive = filters?.status || (filters ? filters.status || 'all' : localFilterActive)

  // Filter handler
  const handleFilterTypeChange = (value: string) => {
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        leave_type: value === 'all' ? undefined : value as 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
      })
    } else {
      setLocalFilterType(value)
    }
  }

  const handleFilterActiveChange = (value: string) => {
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        status: value as 'active' | 'archived' | 'all'
      })
    } else {
      setLocalFilterActive(value)
    }
  }

  // ✅ OPTIMIZED: Filter policies client-side (all data loaded once)
  const filteredPolicies = useMemo(() => {
    let filtered = [...policies]

    // Type filter
    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(p => p.leave_type === filterType)
    }

    // Active filter
    if (filterActive === 'active') {
      filtered = filtered.filter(p => p.active)
    } else if (filterActive === 'archived') {
      filtered = filtered.filter(p => !p.active)
    }

    return filtered
  }, [policies, filterType, filterActive])

  // Summary stats
  const stats = useMemo(() => {
    return {
      total: policies.length,
      active: policies.filter(p => p.active).length,
      annual: policies.filter(p => p.leave_type === 'ANNUAL').length,
      sick: policies.filter(p => p.leave_type === 'SICK').length
    }
  }, [policies])

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
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.gold}30`
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5" style={{ color: COLORS.gold }} />
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: COLORS.champagne }}>
            {stats.total}
          </div>
          <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Total Policies
          </div>
        </div>

        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.emerald}30`
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5" style={{ color: COLORS.emerald }} />
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: COLORS.champagne }}>
            {stats.active}
          </div>
          <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Active Policies
          </div>
        </div>

        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.plum}30`
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5" style={{ color: COLORS.plum }} />
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: COLORS.champagne }}>
            {stats.annual}
          </div>
          <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Annual Leave
          </div>
        </div>

        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.rose}30`
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" style={{ color: COLORS.rose }} />
          </div>
          <div className="text-2xl font-bold mb-1" style={{ color: COLORS.champagne }}>
            {stats.sick}
          </div>
          <div className="text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            Sick Leave
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-6">
        <select
          value={filterType || 'all'}
          onChange={e => handleFilterTypeChange(e.target.value)}
          className="w-full md:w-auto px-4 py-2 rounded-lg border text-sm transition-all duration-300"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: `${COLORS.bronze}30`,
            color: COLORS.champagne
          }}
        >
          <option value="all">All Types</option>
          <option value="ANNUAL">Annual</option>
          <option value="SICK">Sick</option>
          <option value="UNPAID">Unpaid</option>
          <option value="OTHER">Other</option>
        </select>

        <select
          value={filterActive || 'all'}
          onChange={e => handleFilterActiveChange(e.target.value)}
          className="w-full md:w-auto px-4 py-2 rounded-lg border text-sm transition-all duration-300"
          style={{
            backgroundColor: COLORS.charcoal,
            borderColor: `${COLORS.bronze}30`,
            color: COLORS.champagne
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="archived">Archived Only</option>
        </select>
      </div>

      {/* Empty State */}
      {filteredPolicies.length === 0 && (
        <div
          className="text-center py-12 rounded-xl"
          style={{ backgroundColor: COLORS.charcoal }}
        >
          <Settings
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: COLORS.bronze, opacity: 0.3 }}
          />
          <h3 className="text-lg font-medium mb-2" style={{ color: COLORS.champagne }}>
            No policies found
          </h3>
          <p className="text-sm mb-4" style={{ color: COLORS.bronze, opacity: 0.7 }}>
            {filterType !== 'all' || filterActive !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first leave policy'}
          </p>
          {policies.length === 0 && (
            <button
              onClick={onAdd}
              className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ backgroundColor: COLORS.gold, color: COLORS.black }}
            >
              Add Your First Policy
            </button>
          )}
        </div>
      )}

      {/* Mobile Cards */}
      <div className="md:hidden">
        {filteredPolicies.map(policy => (
          <PolicyCardMobile
            key={policy.id}
            policy={policy}
            onEdit={onEdit}
            onArchive={onArchive}
            onRestore={onRestore}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Desktop Table */}
      {filteredPolicies.length > 0 && (
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
                  Policy Name
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
                  Entitlement
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.gold }}
                >
                  Carry Over
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.gold }}
                >
                  Min Notice
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.gold }}
                >
                  Max Days
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: COLORS.gold }}
                >
                  Applies To
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
              {filteredPolicies.map(policy => (
                <PolicyRowDesktop
                  key={policy.id}
                  policy={policy}
                  onEdit={onEdit}
                  onArchive={onArchive}
                  onRestore={onRestore}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
