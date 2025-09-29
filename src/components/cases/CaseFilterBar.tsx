/**
 * Case Filter Bar Component
 * Provides search and filtering functionality with 300ms debounce
 */

import React, { useState, useCallback, useEffect } from 'react'
import { Search, X, Calendar, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { useDebounce } from '@/hooks/use-debounce'
import type {
  CaseFilters,
  CaseFilterBarProps,
  CaseStatus,
  CasePriority,
  CaseRag
} from '@/types/cases'
import type { DateRange } from 'react-day-picker'

const statusOptions: Array<{ value: CaseStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In Review' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'breach', label: 'Breach' },
  { value: 'closed', label: 'Closed' }
]

const priorityOptions: Array<{ value: CasePriority; label: string; color: string }> = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
]

const ragOptions: Array<{ value: CaseRag; label: string; color: string }> = [
  { value: 'R', label: 'Red', color: 'bg-red-500 text-white' },
  { value: 'A', label: 'Amber', color: 'bg-amber-500 text-white' },
  { value: 'G', label: 'Green', color: 'bg-green-500 text-white' }
]

export function CaseFilterBar({ filters, onFiltersChange, onClear }: CaseFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.q || '')
  const debouncedSearch = useDebounce(searchInput, 300)

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.q) {
      onFiltersChange({ ...filters, q: debouncedSearch || undefined })
    }
  }, [debouncedSearch])

  const handleStatusChange = (status: CaseStatus[]) => {
    onFiltersChange({ ...filters, status })
  }

  const handlePriorityToggle = (priority: CasePriority) => {
    const current = filters.priority || []
    const updated = current.includes(priority)
      ? current.filter(p => p !== priority)
      : [...current, priority]
    onFiltersChange({ ...filters, priority: updated })
  }

  const handleRagToggle = (rag: CaseRag) => {
    const current = filters.rag || []
    const updated = current.includes(rag) ? current.filter(r => r !== rag) : [...current, rag]
    onFiltersChange({ ...filters, rag: updated })
  }

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    onFiltersChange({
      ...filters,
      due_from: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined,
      due_to: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined
    })
  }

  const activeFilterCount = [
    filters.status?.length,
    filters.priority?.length,
    filters.rag?.length,
    filters.owner,
    filters.programId,
    filters.due_from || filters.due_to,
    filters.tags?.length
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status?.join(',') || 'all'}
          onValueChange={value =>
            handleStatusChange(value === 'all' ? [] : (value.split(',') as CaseStatus[]))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Due Date Range */}
        <DatePickerWithRange
          date={{
            from: filters.due_from ? new Date(filters.due_from) : undefined,
            to: filters.due_to ? new Date(filters.due_to) : undefined
          }}
          onDateChange={handleDateRangeChange}
        />

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-10">
            <X className="mr-2 h-4 w-4" />
            Clear all ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Priority Chips */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Priority:</span>
          {priorityOptions.map(option => (
            <Badge
              key={option.value}
              variant={filters.priority?.includes(option.value) ? 'default' : 'outline'}
              className={`cursor-pointer ${ filters.priority?.includes(option.value) ? option.color :''
              }`}
              onClick={() => handlePriorityToggle(option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>

        {/* RAG Status */}
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm font-medium text-muted-foreground">RAG:</span>
          {ragOptions.map(option => (
            <Badge
              key={option.value}
              variant={filters.rag?.includes(option.value) ? 'default' : 'outline'}
              className={`cursor-pointer ${ filters.rag?.includes(option.value) ? option.color :''
              }`}
              onClick={() => handleRagToggle(option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
