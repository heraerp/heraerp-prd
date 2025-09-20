'use client'

import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { GrantFilters } from '@/types/crm-grants'

interface FilterBarProps {
  filters: GrantFilters
  onFiltersChange: (filters: GrantFilters) => void
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'closed', label: 'Closed' }
]

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  const updateFilter = (key: keyof GrantFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: GrantFilters = {
      page: 1,
      page_size: filters.page_size
    }
    onFiltersChange(clearedFilters)
    setLocalFilters(clearedFilters)
  }

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.status?.length ||
      filters.round_id ||
      filters.program_id ||
      filters.amount_min !== undefined ||
      filters.amount_max !== undefined ||
      filters.tags?.length
  )

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.q) count++
    if (filters.status?.length) count++
    if (filters.round_id) count++
    if (filters.program_id) count++
    if (filters.amount_min !== undefined) count++
    if (filters.amount_max !== undefined) count++
    if (filters.tags?.length) count++
    return count
  }

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-400 h-4 w-4" />
          <Input
            placeholder="Search applications..."
            value={filters.q || ''}
            onChange={e => updateFilter('q', e.target.value || undefined)}
            className="pl-10 bg-panel border-border"
          />
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="border-border hover:bg-accent-soft">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-panel rounded-lg border border-border">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-text-200">Status</Label>
                <Select
                  value={filters.status?.length === 1 ? filters.status[0] : 'all'}
                  onValueChange={value =>
                    updateFilter('status', value === 'all' ? undefined : [value])
                  }
                >
                  <SelectTrigger className="bg-bg border-border">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="hera-select-item"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-text-200">Min Amount</Label>
                <Input
                  type="number"
                  placeholder="Min amount..."
                  value={filters.amount_min || ''}
                  onChange={e =>
                    updateFilter('amount_min', e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="bg-bg border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-text-200">Max Amount</Label>
                <Input
                  type="number"
                  placeholder="Max amount..."
                  value={filters.amount_max || ''}
                  onChange={e =>
                    updateFilter('amount_max', e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="bg-bg border-border"
                />
              </div>

              {/* Round ID Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-text-200">Round ID</Label>
                <Input
                  placeholder="Round ID..."
                  value={filters.round_id || ''}
                  onChange={e => updateFilter('round_id', e.target.value || undefined)}
                  className="bg-bg border-border"
                />
              </div>

              {/* Program ID Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-text-200">Program ID</Label>
                <Input
                  placeholder="Program ID..."
                  value={filters.program_id || ''}
                  onChange={e => updateFilter('program_id', e.target.value || undefined)}
                  className="bg-bg border-border"
                />
              </div>

              {/* Tags Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-text-200">Tags</Label>
                <Input
                  placeholder="Enter tags (comma-separated)..."
                  value={filters.tags?.join(', ') || ''}
                  onChange={e => {
                    const tags = e.target.value
                      .split(',')
                      .map(tag => tag.trim())
                      .filter(tag => tag.length > 0)
                    updateFilter('tags', tags.length > 0 ? tags : undefined)
                  }}
                  className="bg-bg border-border"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full border-border hover:bg-accent-soft"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.q && (
            <Badge variant="secondary" className="text-xs">
              Search: {filters.q}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('q', undefined)}
              />
            </Badge>
          )}
          {filters.status?.map(status => (
            <Badge key={status} variant="secondary" className="text-xs">
              Status: {STATUS_OPTIONS.find(s => s.value === status)?.label}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('status', undefined)}
              />
            </Badge>
          ))}
          {filters.round_id && (
            <Badge variant="secondary" className="text-xs">
              Round: {filters.round_id}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('round_id', undefined)}
              />
            </Badge>
          )}
          {filters.program_id && (
            <Badge variant="secondary" className="text-xs">
              Program: {filters.program_id}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => updateFilter('program_id', undefined)}
              />
            </Badge>
          )}
          {(filters.amount_min !== undefined || filters.amount_max !== undefined) && (
            <Badge variant="secondary" className="text-xs">
              Amount:{' '}
              {filters.amount_min
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                    filters.amount_min
                  )
                : '0'}{' '}
              -{' '}
              {filters.amount_max
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                    filters.amount_max
                  )
                : '∞'}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  updateFilter('amount_min', undefined)
                  updateFilter('amount_max', undefined)
                }}
              />
            </Badge>
          )}
          {filters.tags?.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              Tag: {tag}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  const newTags = filters.tags?.filter(t => t !== tag)
                  updateFilter('tags', newTags?.length ? newTags : undefined)
                }}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
