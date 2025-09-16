/**
 * HERA CRM Advanced Search & Filter Component
 * Professional search and filtering capabilities for production CRM
 *
 * Project Manager Task: Advanced Search and Filtering Capabilities (Task #7)
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import {
  Search,
  Filter,
  X,
  Calendar,
  DollarSign,
  Users,
  Building,
  Target,
  CheckSquare,
  Star,
  ArrowUpDown,
  Sliders,
  Save,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Zap
} from 'lucide-react'

// Types for search and filtering
export interface SearchFilters {
  // Global search
  globalSearch: string

  // Entity-specific filters
  entityType: 'contact' | 'opportunity' | 'task' | 'all'

  // Contact filters
  contactName: string
  company: string
  email: string
  phone: string
  contactStatus: string[]
  contactTags: string[]

  // Opportunity filters
  opportunityName: string
  stage: string[]
  valueRange: { min: number; max: number }
  probabilityRange: { min: number; max: number }
  closeDate: { start: string; end: string }

  // Task filters
  taskTitle: string
  taskStatus: string[]
  priority: string[]
  assignee: string[]
  dueDate: { start: string; end: string }

  // Universal filters
  dateRange: { start: string; end: string }
  createdBy: string[]
  updatedBy: string[]
  tags: string[]
}

export interface SortOptions {
  field: string
  direction: 'asc' | 'desc'
  secondary?: {
    field: string
    direction: 'asc' | 'desc'
  }
}

export interface SearchResult<T = any> {
  results: T[]
  totalCount: number
  filteredCount: number
  searchTime: number
  facets: {
    [key: string]: Array<{ value: string; count: number }>
  }
}

interface AdvancedSearchFilterProps {
  onFiltersChange: (filters: SearchFilters, sort: SortOptions) => void
  onSearch: (filters: SearchFilters, sort: SortOptions) => Promise<SearchResult>
  initialFilters?: Partial<SearchFilters>
  availableFilters?: {
    contactStatuses: string[]
    stages: string[]
    priorities: string[]
    assignees: string[]
    tags: string[]
  }
  isLoading?: boolean
  resultCount?: number
}

export function AdvancedSearchFilter({
  onFiltersChange,
  onSearch,
  initialFilters = {},
  availableFilters = {
    contactStatuses: ['prospect', 'customer', 'inactive'],
    stages: ['discovery', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
    priorities: ['low', 'medium', 'high', 'urgent'],
    assignees: ['Me', 'Team Lead', 'Sales Rep'],
    tags: ['Hot Lead', 'Enterprise', 'VIP', 'Renewal', 'Cold Lead']
  },
  isLoading = false,
  resultCount = 0
}: AdvancedSearchFilterProps) {
  // State for filters
  const [filters, setFilters] = useState<SearchFilters>({
    globalSearch: '',
    entityType: 'all',
    contactName: '',
    company: '',
    email: '',
    phone: '',
    contactStatus: [],
    contactTags: [],
    opportunityName: '',
    stage: [],
    valueRange: { min: 0, max: 1000000 },
    probabilityRange: { min: 0, max: 100 },
    closeDate: { start: '', end: '' },
    taskTitle: '',
    taskStatus: [],
    priority: [],
    assignee: [],
    dueDate: { start: '', end: '' },
    dateRange: { start: '', end: '' },
    createdBy: [],
    updatedBy: [],
    tags: [],
    ...initialFilters
  })

  // State for sorting
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: 'name',
    direction: 'asc'
  })

  // State for UI
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [savedSearches, setSavedSearches] = useState<
    Array<{ name: string; filters: SearchFilters; sort: SortOptions }>
  >([])
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [quickFilters, setQuickFilters] = useState({
    showActiveOnly: false,
    showHighValue: false,
    showRecentActivity: false,
    showMyItems: false
  })

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.globalSearch.length > 2 || hasAdvancedFilters()) {
        handleSearch()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [filters, sortOptions])

  // Check if advanced filters are applied
  const hasAdvancedFilters = () => {
    return (
      filters.contactStatus.length > 0 ||
      filters.stage.length > 0 ||
      filters.priority.length > 0 ||
      filters.tags.length > 0 ||
      filters.valueRange.min > 0 ||
      filters.valueRange.max < 1000000 ||
      filters.dateRange.start ||
      filters.dateRange.end
    )
  }

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.globalSearch) count++
    if (filters.entityType !== 'all') count++
    if (filters.contactStatus.length > 0) count++
    if (filters.stage.length > 0) count++
    if (filters.priority.length > 0) count++
    if (filters.tags.length > 0) count++
    if (filters.dateRange.start || filters.dateRange.end) count++
    if (filters.valueRange.min > 0 || filters.valueRange.max < 1000000) count++
    return count
  }, [filters])

  // Handle search
  const handleSearch = async () => {
    try {
      const results = await onSearch(filters, sortOptions)
      setSearchResults(results)
      onFiltersChange(filters, sortOptions)
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  // Update filters
  const updateFilters = (updates: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      globalSearch: '',
      entityType: 'all',
      contactName: '',
      company: '',
      email: '',
      phone: '',
      contactStatus: [],
      contactTags: [],
      opportunityName: '',
      stage: [],
      valueRange: { min: 0, max: 1000000 },
      probabilityRange: { min: 0, max: 100 },
      closeDate: { start: '', end: '' },
      taskTitle: '',
      taskStatus: [],
      priority: [],
      assignee: [],
      dueDate: { start: '', end: '' },
      dateRange: { start: '', end: '' },
      createdBy: [],
      updatedBy: [],
      tags: []
    })
  }

  // Save current search
  const saveCurrentSearch = () => {
    const name = prompt('Enter a name for this saved search:')
    if (name) {
      setSavedSearches(prev => [
        ...prev,
        {
          name,
          filters: { ...filters },
          sort: { ...sortOptions }
        }
      ])
    }
  }

  // Apply quick filters
  const applyQuickFilter = (filterType: keyof typeof quickFilters) => {
    setQuickFilters(prev => ({ ...prev, [filterType]: !prev[filterType] }))

    // Apply the actual filter logic
    switch (filterType) {
      case 'showActiveOnly':
        updateFilters({
          contactStatus: quickFilters.showActiveOnly ? [] : ['customer', 'prospect']
        })
        break
      case 'showHighValue':
        updateFilters({
          valueRange: quickFilters.showHighValue
            ? { min: 0, max: 1000000 }
            : { min: 10000, max: 1000000 }
        })
        break
      case 'showRecentActivity':
        const lastWeek = new Date()
        lastWeek.setDate(lastWeek.getDate() - 7)
        updateFilters({
          dateRange: quickFilters.showRecentActivity
            ? { start: '', end: '' }
            : { start: lastWeek.toISOString().split('T')[0], end: '' }
        })
        break
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Advanced Search & Filters
            </CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </Badge>
            )}
            {searchResults && (
              <Badge variant="outline">
                {searchResults.filteredCount} of {searchResults.totalCount} results
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {isExpanded ? 'Hide Filters' : 'Show Filters'}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts, opportunities, tasks..."
            value={filters.globalSearch}
            onChange={e => updateFilters({ globalSearch: e.target.value })}
            className="pl-10 pr-12"
          />
          {isLoading && (
            <RefreshCw className="absolute right-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={quickFilters.showActiveOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyQuickFilter('showActiveOnly')}
          >
            <Users className="h-4 w-4 mr-1" />
            Active Only
          </Button>
          <Button
            variant={quickFilters.showHighValue ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyQuickFilter('showHighValue')}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            High Value
          </Button>
          <Button
            variant={quickFilters.showRecentActivity ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyQuickFilter('showRecentActivity')}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Recent Activity
          </Button>
          <Button
            variant={quickFilters.showMyItems ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyQuickFilter('showMyItems')}
          >
            <Star className="h-4 w-4 mr-1" />
            My Items
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Entity Type</Label>
                  <Select
                    value={filters.entityType}
                    onValueChange={(value: any) => updateFilters({ entityType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="contact">Contacts Only</SelectItem>
                      <SelectItem value="opportunity">Opportunities Only</SelectItem>
                      <SelectItem value="task">Tasks Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={e =>
                        updateFilters({
                          dateRange: { ...filters.dateRange, start: e.target.value }
                        })
                      }
                    />
                    <Input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={e =>
                        updateFilters({
                          dateRange: { ...filters.dateRange, end: e.target.value }
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Sort By</Label>
                  <div className="flex gap-2">
                    <Select
                      value={sortOptions.field}
                      onValueChange={field => setSortOptions(prev => ({ ...prev, field }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="value">Value</SelectItem>
                        <SelectItem value="created_at">Created Date</SelectItem>
                        <SelectItem value="updated_at">Updated Date</SelectItem>
                        <SelectItem value="last_contact">Last Contact</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setSortOptions(prev => ({
                          ...prev,
                          direction: prev.direction === 'asc' ? 'desc' : 'asc'
                        }))
                      }
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableFilters.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const newTags = filters.tags.includes(tag)
                          ? filters.tags.filter(t => t !== tag)
                          : [...filters.tags, tag]
                        updateFilters({ tags: newTags })
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    value={filters.contactName}
                    onChange={e => updateFilters({ contactName: e.target.value })}
                    placeholder="Search by name..."
                  />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input
                    value={filters.company}
                    onChange={e => updateFilters({ company: e.target.value })}
                    placeholder="Search by company..."
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={filters.email}
                    onChange={e => updateFilters({ email: e.target.value })}
                    placeholder="Search by email..."
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={filters.phone}
                    onChange={e => updateFilters({ phone: e.target.value })}
                    placeholder="Search by phone..."
                  />
                </div>
              </div>

              {/* Contact Status */}
              <div>
                <Label>Contact Status</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableFilters.contactStatuses.map(status => (
                    <Badge
                      key={status}
                      variant={filters.contactStatus.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => {
                        const newStatuses = filters.contactStatus.includes(status)
                          ? filters.contactStatus.filter(s => s !== status)
                          : [...filters.contactStatus, status]
                        updateFilters({ contactStatus: newStatuses })
                      }}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Opportunities Tab */}
            <TabsContent value="opportunities" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Opportunity Name</Label>
                  <Input
                    value={filters.opportunityName}
                    onChange={e => updateFilters({ opportunityName: e.target.value })}
                    placeholder="Search opportunities..."
                  />
                </div>
                <div>
                  <Label>Close Date Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={filters.closeDate.start}
                      onChange={e =>
                        updateFilters({
                          closeDate: { ...filters.closeDate, start: e.target.value }
                        })
                      }
                    />
                    <Input
                      type="date"
                      value={filters.closeDate.end}
                      onChange={e =>
                        updateFilters({
                          closeDate: { ...filters.closeDate, end: e.target.value }
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Value Range */}
              <div>
                <Label>Value Range ($)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min value"
                    value={filters.valueRange.min || ''}
                    onChange={e =>
                      updateFilters({
                        valueRange: {
                          ...filters.valueRange,
                          min: parseInt(e.target.value) || 0
                        }
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max value"
                    value={filters.valueRange.max === 1000000 ? '' : filters.valueRange.max}
                    onChange={e =>
                      updateFilters({
                        valueRange: {
                          ...filters.valueRange,
                          max: parseInt(e.target.value) || 1000000
                        }
                      })
                    }
                  />
                </div>
              </div>

              {/* Stages */}
              <div>
                <Label>Stages</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableFilters.stages.map(stage => (
                    <Badge
                      key={stage}
                      variant={filters.stage.includes(stage) ? 'default' : 'outline'}
                      className="cursor-pointer capitalize"
                      onClick={() => {
                        const newStages = filters.stage.includes(stage)
                          ? filters.stage.filter(s => s !== stage)
                          : [...filters.stage, stage]
                        updateFilters({ stage: newStages })
                      }}
                    >
                      {stage.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableFilters.priorities.map(priority => (
                      <Badge
                        key={priority}
                        variant={filters.priority.includes(priority) ? 'default' : 'outline'}
                        className="cursor-pointer capitalize"
                        onClick={() => {
                          const newPriorities = filters.priority.includes(priority)
                            ? filters.priority.filter(p => p !== priority)
                            : [...filters.priority, priority]
                          updateFilters({ priority: newPriorities })
                        }}
                      >
                        {priority}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Assignee</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableFilters.assignees.map(assignee => (
                      <Badge
                        key={assignee}
                        variant={filters.assignee.includes(assignee) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const newAssignees = filters.assignee.includes(assignee)
                            ? filters.assignee.filter(a => a !== assignee)
                            : [...filters.assignee, assignee]
                          updateFilters({ assignee: newAssignees })
                        }}
                      >
                        {assignee}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Saved Searches */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Saved Searches</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveCurrentSearch}
                    disabled={!hasAdvancedFilters() && !filters.globalSearch}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Current Search
                  </Button>
                </div>

                {savedSearches.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {savedSearches.map((search, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => {
                          setFilters(search.filters)
                          setSortOptions(search.sort)
                        }}
                      >
                        {search.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No saved searches yet. Apply filters and save for quick access.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
              <Button
                variant="outline"
                onClick={clearAllFilters}
                disabled={activeFilterCount === 0}
              >
                Clear All
              </Button>
            </div>

            {searchResults && (
              <div className="text-sm text-muted-foreground">
                Found {searchResults.filteredCount} results in {searchResults.searchTime}ms
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default AdvancedSearchFilter
