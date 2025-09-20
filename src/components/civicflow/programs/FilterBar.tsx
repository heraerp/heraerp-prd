'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { ProgramFilters } from '@/types/crm-programs'

interface FilterBarProps {
  filters: ProgramFilters
  onFiltersChange: (filters: ProgramFilters) => void
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'paused', label: 'Paused', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-100 text-gray-800 border-gray-200' }
]

const TAG_OPTIONS = [
  'SNAP',
  'HOUSING',
  'HEALTHCARE',
  'EDUCATION',
  'VETERANS',
  'YOUTH',
  'SENIORS',
  'WORKFORCE',
  'ENVIRONMENT',
  'TRANSPORTATION'
]

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [searchValue, setSearchValue] = useState(filters.q || '')
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set(filters.status || [])
  )
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(filters.tags || []))
  const [budgetMin, setBudgetMin] = useState(filters.budget_min?.toString() || '')
  const [budgetMax, setBudgetMax] = useState(filters.budget_max?.toString() || '')

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange({
        ...filters,
        q: searchValue || undefined
      })
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchValue])

  const handleStatusToggle = (status: string) => {
    const newStatuses = new Set(selectedStatuses)
    if (newStatuses.has(status)) {
      newStatuses.delete(status)
    } else {
      newStatuses.add(status)
    }
    setSelectedStatuses(newStatuses)
    onFiltersChange({
      ...filters,
      status: newStatuses.size > 0 ? (Array.from(newStatuses) as any) : undefined
    })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = new Set(selectedTags)
    if (newTags.has(tag)) {
      newTags.delete(tag)
    } else {
      newTags.add(tag)
    }
    setSelectedTags(newTags)
    onFiltersChange({
      ...filters,
      tags: newTags.size > 0 ? Array.from(newTags) : undefined
    })
  }

  const applyBudgetFilter = () => {
    onFiltersChange({
      ...filters,
      budget_min: budgetMin ? parseInt(budgetMin) : undefined,
      budget_max: budgetMax ? parseInt(budgetMax) : undefined
    })
  }

  const clearFilters = () => {
    setSearchValue('')
    setSelectedStatuses(new Set())
    setSelectedTags(new Set())
    setBudgetMin('')
    setBudgetMax('')
    onFiltersChange({
      page: filters.page,
      page_size: filters.page_size
    })
  }

  const hasActiveFilters =
    searchValue || selectedStatuses.size > 0 || selectedTags.size > 0 || budgetMin || budgetMax

  return (
    <div className="bg-panel border border-border rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-500" />
            <Input
              className="pl-9 bg-panel-alt border-border"
              placeholder="Search programs by title, code, tags, or sponsor..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
            />
          </div>
        </div>

        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-border">
              <Filter className="h-4 w-4 mr-2" />
              Status
              {selectedStatuses.size > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {selectedStatuses.size}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              {STATUS_OPTIONS.map(status => (
                <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedStatuses.has(status.value)}
                    onCheckedChange={() => handleStatusToggle(status.value)}
                  />
                  <span className={`text-sm px-2 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Tags Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-border">
              <Filter className="h-4 w-4 mr-2" />
              Tags
              {selectedTags.size > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {selectedTags.size}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid grid-cols-2 gap-2">
              {TAG_OPTIONS.map(tag => (
                <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedTags.has(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  />
                  <span className="text-sm">{tag}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Budget Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="border-border">
              <Filter className="h-4 w-4 mr-2" />
              Budget
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-4">
              <div>
                <Label htmlFor="budget-min">Min Budget</Label>
                <Input
                  id="budget-min"
                  type="number"
                  placeholder="0"
                  value={budgetMin}
                  onChange={e => setBudgetMin(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="budget-max">Max Budget</Label>
                <Input
                  id="budget-max"
                  type="number"
                  placeholder="1000000"
                  value={budgetMax}
                  onChange={e => setBudgetMax(e.target.value)}
                />
              </div>
              <Button onClick={applyBudgetFilter} className="w-full">
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-text-500 hover:text-text-100"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchValue && (
            <Badge variant="secondary" className="bg-panel-alt">
              Search: {searchValue}
            </Badge>
          )}
          {Array.from(selectedStatuses).map(status => {
            const statusOption = STATUS_OPTIONS.find(s => s.value === status)
            return (
              <Badge key={status} className={statusOption?.color}>
                {statusOption?.label}
              </Badge>
            )
          })}
          {Array.from(selectedTags).map(tag => (
            <Badge key={tag} variant="secondary" className="bg-secondary/10 text-secondary">
              {tag}
            </Badge>
          ))}
          {(budgetMin || budgetMax) && (
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              Budget: ${budgetMin || '0'} - ${budgetMax || '∞'}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
