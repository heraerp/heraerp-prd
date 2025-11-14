/**
 * HERA UIKit - FilterBar
 * Generic filter and search component
 */

'use client'

import React, { useCallback, useState } from 'react'
import { Search, Filter, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import type { FilterConfig } from '@/lib/ui-binder/types'

interface FilterBarProps {
  onFilterChange: (params: {
    filter?: string
    order?: string
    pageSize?: number
    page?: number
    search?: string
  }) => void
  filters?: FilterConfig[]
  searchPlaceholder?: string
  defaultPageSize?: number
  pageSizeOptions?: number[]
  className?: string
}

export function FilterBar({
  onFilterChange,
  filters = [],
  searchPlaceholder = 'Search...',
  defaultPageSize = 50,
  pageSizeOptions = [25, 50, 100, 200],
  className = ''
}: FilterBarProps) {
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      onFilterChange({
        search: value || undefined,
        filter: buildFilterString(activeFilters),
        order: buildOrderString(sortColumn, sortDirection),
        pageSize,
        page: 1 // Reset to first page on search
      })
    },
    [activeFilters, sortColumn, sortDirection, pageSize, onFilterChange]
  )

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const newFilters = { ...activeFilters }
      if (value && value !== '__all__') {
        newFilters[key] = value
      } else {
        delete newFilters[key]
      }

      setActiveFilters(newFilters)
      onFilterChange({
        search: search || undefined,
        filter: buildFilterString(newFilters),
        order: buildOrderString(sortColumn, sortDirection),
        pageSize,
        page: 1 // Reset to first page on filter
      })
    },
    [search, activeFilters, sortColumn, sortDirection, pageSize, onFilterChange]
  )

  const handleSortChange = useCallback(
    (column: string, direction: 'asc' | 'desc') => {
      setSortColumn(column)
      setSortDirection(direction)
      onFilterChange({
        search: search || undefined,
        filter: buildFilterString(activeFilters),
        order: buildOrderString(column, direction),
        pageSize,
        page: 1 // Reset to first page on sort
      })
    },
    [search, activeFilters, pageSize, onFilterChange]
  )

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize)
      onFilterChange({
        search: search || undefined,
        filter: buildFilterString(activeFilters),
        order: buildOrderString(sortColumn, sortDirection),
        pageSize: newPageSize,
        page: 1 // Reset to first page on page size change
      })
    },
    [search, activeFilters, sortColumn, sortDirection, onFilterChange]
  )

  const handleReset = useCallback(() => {
    setSearch('')
    setActiveFilters({})
    setSortColumn('')
    setSortDirection('asc')
    setPageSize(defaultPageSize)
    onFilterChange({
      page: 1
    })
  }, [defaultPageSize, onFilterChange])

  const buildFilterString = (filters: Record<string, string>): string | undefined => {
    const filterPairs = Object.entries(filters)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}:${value}`)

    return filterPairs.length > 0 ? filterPairs.join(',') : undefined
  }

  const buildOrderString = (column: string, direction: 'asc' | 'desc'): string | undefined => {
    return column ? `${column} ${direction}` : undefined
  }

  const activeFilterCount = Object.keys(activeFilters).filter(key => activeFilters[key]).length
  const hasActiveFilters = activeFilterCount > 0 || search || sortColumn

  return (
    <div
      className={`flex items-center space-x-4 p-4 bg-white dark:bg-gray-900 border-b ${className}`}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="pl-10"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => handleSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveFilters({})
                      onFilterChange({
                        search: search || undefined,
                        order: buildOrderString(sortColumn, sortDirection),
                        pageSize,
                        page: 1
                      })
                    }}
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {filters.map(filter => (
                <div key={filter.key} className="space-y-2">
                  <Label htmlFor={filter.key}>{filter.label}</Label>
                  {filter.type === 'select' ? (
                    <Select
                      value={activeFilters[filter.key] || '__all__'}
                      onValueChange={value => handleFilterChange(filter.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All</SelectItem>
                        {filter.options?.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={filter.key}
                      type={filter.type}
                      placeholder={filter.placeholder}
                      value={activeFilters[filter.key] || ''}
                      onChange={e => handleFilterChange(filter.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Sort */}
      <Select
        value={sortColumn || '__none__'}
        onValueChange={column =>
          handleSortChange(column === '__none__' ? '' : column, sortDirection)
        }
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No sorting</SelectItem>
          <SelectItem value="entity_name">Name</SelectItem>
          <SelectItem value="entity_code">Code</SelectItem>
          <SelectItem value="created_at">Created</SelectItem>
          <SelectItem value="updated_at">Modified</SelectItem>
        </SelectContent>
      </Select>

      {sortColumn && (
        <Select
          value={sortDirection}
          onValueChange={(direction: 'asc' | 'desc') => handleSortChange(sortColumn, direction)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Page Size */}
      <div className="flex items-center space-x-2">
        <Label htmlFor="pageSize" className="text-sm whitespace-nowrap">
          Show:
        </Label>
        <Select
          value={pageSize.toString()}
          onValueChange={value => handlePageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map(size => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      )}
    </div>
  )
}
