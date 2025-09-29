'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Filter, X } from 'lucide-react'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'

interface CalendarFiltersState {
  sources: string[]
  categories: string[]
  status: string
  assignee: string
  search: string
}

interface CalendarFiltersProps {
  filters: CalendarFiltersState
  onFiltersChange: (filters: Partial<CalendarFiltersState>) => void
  loading: boolean
  itemCount: number
}

const SOURCE_OPTIONS = [
  { value: 'grants', label: 'Grants', color: 'bg-blue-500' },
  { value: 'cases', label: 'Cases', color: 'bg-green-500' },
  { value: 'playbooks', label: 'Playbooks', color: 'bg-purple-500' },
  { value: 'payments', label: 'Payments', color: 'bg-yellow-500' },
  { value: 'consultations', label: 'Consultations', color: 'bg-pink-500' },
  { value: 'events', label: 'Events', color: 'bg-indigo-500' }
]

const CATEGORY_OPTIONS = [
  { value: 'deadline', label: 'Deadline' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'review', label: 'Review' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'payment', label: 'Payment' },
  { value: 'submission', label: 'Submission' }
]

export function CalendarFilters({
  filters,
  onFiltersChange,
  loading,
  itemCount
}: CalendarFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const activeFilterCount = [
    filters.sources.length < SOURCE_OPTIONS.length ? 1 : 0,
    filters.categories.length > 0 ? 1 : 0,
    filters.status !== 'all' ? 1 : 0,
    filters.assignee !== 'all' ? 1 : 0,
    filters.search ? 1 : 0
  ].reduce((a, b) => a + b, 0)

  const handleSourceToggle = (source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter(s => s !== source)
      : [...filters.sources, source]
    onFiltersChange({ sources: newSources })
  }

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    onFiltersChange({ categories: newCategories })
  }

  const resetFilters = () => {
    onFiltersChange({
      sources: SOURCE_OPTIONS.map(s => s.value),
      categories: [],
      status: 'all',
      assignee: 'all',
      search: ''
    })
  }

  return (
    <div className="border-b bg-card">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Quick Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={filters.search}
              onChange={e => onFiltersChange({ search: e.target.value })}
              className="pl-9 w-full"
            />
          </div>

          {/* Source Badges */}
          <div className="flex items-center gap-2">
            {SOURCE_OPTIONS.map(source => (
              <Badge
                key={source.value}
                variant={filters.sources.includes(source.value) ? 'default' : 'outline'}
                className={`cursor-pointer ${ filters.sources.includes(source.value) ? source.color +' text-white hover:opacity-90'
                    : 'hover:bg-accent'
                }`}
                onClick={() => handleSourceToggle(source.value)}
              >
                {source.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Filter Button & Item Count */}
        <div className="flex items-center gap-4">
          {/* Item Count */}
          <div className="text-sm text-muted-foreground">
            {loading ? <span>Loading...</span> : <span>{itemCount} items</span>}
          </div>

          {/* Advanced Filters */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Calendar Filters</SheetTitle>
                <SheetDescription>Filter calendar items by various criteria</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Event Sources */}
                <div>
                  <Label className="mb-3 block">Event Sources</Label>
                  <div className="space-y-2">
                    {SOURCE_OPTIONS.map(source => (
                      <div key={source.value} className="flex items-center gap-2">
                        <Checkbox
                          id={source.value}
                          checked={filters.sources.includes(source.value)}
                          onCheckedChange={() => handleSourceToggle(source.value)}
                        />
                        <Label
                          htmlFor={source.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <div className={`h-3 w-3 rounded-full ${source.color}`} />
                          {source.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event Categories */}
                <div>
                  <Label className="mb-3 block">Event Categories</Label>
                  <div className="space-y-2">
                    {CATEGORY_OPTIONS.map(category => (
                      <div key={category.value} className="flex items-center gap-2">
                        <Checkbox
                          id={category.value}
                          checked={filters.categories.includes(category.value)}
                          onCheckedChange={() => handleCategoryToggle(category.value)}
                        />
                        <Label htmlFor={category.value} className="cursor-pointer">
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <Label className="mb-2 block">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={value => onFiltersChange({ status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div>
                  <Label className="mb-2 block">Assignee</Label>
                  <Select
                    value={filters.assignee}
                    onValueChange={value => onFiltersChange({ assignee: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All assignees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All assignees</SelectItem>
                      <SelectItem value="me">Assigned to me</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={resetFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button className="flex-1" onClick={() => setIsOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}
