'use client'

import React from 'react'
import { Search, Filter, Download, Plus, Calendar, User, Diamond } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { canExportData, canEditGradingJob } from '@/lib/acl'
import type { UserRole } from '@/lib/acl'

type GradingStatus = 'pipeline' | 'in_progress' | 'graded' | 'pending_review'
type Priority = 'low' | 'normal' | 'urgent'

interface GradingFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: 'all' | GradingStatus
  onStatusFilterChange: (value: 'all' | GradingStatus) => void
  priorityFilter: 'all' | Priority
  onPriorityFilterChange: (value: 'all' | Priority) => void
  gradeBand: 'all' | 'D-F' | 'G-H' | 'I-J' | 'K-L'
  onGradeBandChange: (value: 'all' | 'D-F' | 'G-H' | 'I-J' | 'K-L') => void
  dateRange?: { from?: Date; to?: Date }
  onDateRangeChange?: (range: { from?: Date; to?: Date }) => void
  userRole?: UserRole
  onNewJob?: () => void
  onExport?: () => void
  totalCount?: number
  filteredCount?: number
}

export default function GradingFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  gradeBand,
  onGradeBandChange,
  dateRange,
  onDateRangeChange,
  userRole,
  onNewJob,
  onExport,
  totalCount = 0,
  filteredCount = 0
}: GradingFiltersProps) {
  const hasActiveFilters = 
    search.length > 0 ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    gradeBand !== 'all' ||
    (dateRange?.from && dateRange?.to)

  const clearAllFilters = () => {
    onSearchChange('')
    onStatusFilterChange('all')
    onPriorityFilterChange('all')
    onGradeBandChange('all')
    onDateRangeChange?.({ from: undefined, to: undefined })
  }

  return (
    <div className="jewelry-glass-panel">
      {/* Main Filter Row */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 jewelry-icon-muted" size={16} />
          <Input
            placeholder="Search by item name, SKU, or certificate..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="jewelry-input pl-10"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEditGradingJob(userRole) && (
            <Button
              onClick={onNewJob}
              className="jewelry-btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              New Job
            </Button>
          )}
          
          {canExportData(userRole) && (
            <Button
              variant="outline"
              onClick={onExport}
              className="jewelry-btn-secondary flex items-center gap-2"
            >
              <Download size={16} />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="jewelry-text-muted text-sm font-medium">Status:</span>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="jewelry-select w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pipeline">Pipeline</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="jewelry-text-muted text-sm font-medium">Priority:</span>
          <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
            <SelectTrigger className="jewelry-select w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grade Band Filter */}
        <div className="flex items-center gap-2">
          <Diamond className="jewelry-icon-gold" size={16} />
          <span className="jewelry-text-muted text-sm font-medium">Color:</span>
          <Select value={gradeBand} onValueChange={onGradeBandChange}>
            <SelectTrigger className="jewelry-select w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="D-F">D-F</SelectItem>
              <SelectItem value="G-H">G-H</SelectItem>
              <SelectItem value="I-J">I-J</SelectItem>
              <SelectItem value="K-L">K-L</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        {onDateRangeChange && (
          <div className="flex items-center gap-2">
            <Calendar className="jewelry-icon-gold" size={16} />
            <span className="jewelry-text-muted text-sm font-medium">Date:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="jewelry-btn-secondary text-left font-normal">
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd')} - {format(dateRange.to, 'LLL dd')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={{ from: dateRange?.from, to: dateRange?.to }}
                  onSelect={(range) => onDateRangeChange(range || {})}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Active Filters & Results Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <>
              <Filter className="jewelry-icon-gold" size={16} />
              <span className="jewelry-text-muted text-sm">Active filters:</span>
              
              {search && (
                <Badge variant="secondary" className="jewelry-status-pending">
                  Search: "{search.length > 20 ? search.slice(0, 20) + '...' : search}"
                </Badge>
              )}
              
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="jewelry-status-pending">
                  Status: {statusFilter.replace('_', ' ')}
                </Badge>
              )}
              
              {priorityFilter !== 'all' && (
                <Badge variant="secondary" className="jewelry-status-pending">
                  Priority: {priorityFilter}
                </Badge>
              )}
              
              {gradeBand !== 'all' && (
                <Badge variant="secondary" className="jewelry-status-pending">
                  Color: {gradeBand}
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="jewelry-text-muted hover:jewelry-text-high-contrast text-xs"
              >
                Clear all
              </Button>
            </>
          )}
        </div>

        {/* Results Count */}
        <div className="jewelry-text-muted text-sm">
          {hasActiveFilters ? (
            <>Showing {filteredCount} of {totalCount} jobs</>
          ) : (
            <>{totalCount} total jobs</>
          )}
        </div>
      </div>
    </div>
  )
}