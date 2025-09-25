'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useOrgStore } from '@/state/org'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { CalendarFilters } from '@/components/calendar/CalendarFilters'
import { MonthView } from '@/components/calendar/MonthView'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { AgendaView } from '@/components/calendar/AgendaView'
import { HeatmapView } from '@/components/calendar/HeatmapView'
import { CalendarEventModal } from '@/components/calendar/CalendarEventModal'
import { useToast } from '@/components/ui/use-toast'
import { CalendarItem } from '@/types/calendar'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns'

type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'heatmap'

interface CalendarFiltersState {
  sources: string[]
  categories: string[]
  status: string
  assignee: string
  search: string
}

export default function CivicFlowCalendarPage() {
  const { currentOrgId } = useOrgStore()
  const { toast } = useToast()

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filters state
  const [filters, setFilters] = useState<CalendarFiltersState>({
    sources: ['grants', 'cases', 'playbooks', 'payments', 'consultations', 'events'],
    categories: [],
    status: 'all',
    assignee: 'all',
    search: ''
  })

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    let start: Date, end: Date

    switch (view) {
      case 'month':
        start = startOfMonth(currentDate)
        end = endOfMonth(currentDate)
        break
      case 'week':
        start = startOfWeek(currentDate)
        end = endOfWeek(currentDate)
        break
      case 'day':
        start = new Date(currentDate.setHours(0, 0, 0, 0))
        end = new Date(currentDate.setHours(23, 59, 59, 999))
        break
      case 'agenda':
        start = new Date()
        end = new Date()
        end.setMonth(end.getMonth() + 3) // 3 months ahead
        break
      case 'heatmap':
        start = new Date()
        start.setFullYear(start.getFullYear() - 1) // 1 year back
        end = new Date()
        break
      default:
        start = startOfMonth(currentDate)
        end = endOfMonth(currentDate)
    }

    return { start, end }
  }, [currentDate, view])

  // Fetch calendar items
  const fetchCalendarItems = useCallback(async () => {
    if (!currentOrgId) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        organization_id: currentOrgId,
        start_date: dateRange.start.toISOString(),
        end_date: dateRange.end.toISOString(),
        sources: filters.sources.join(','),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.assignee !== 'all' && { assignee: filters.assignee }),
        ...(filters.search && { q: filters.search })
      })

      const response = await fetch(`/api/civicflow/calendar?${params}`, {
        headers: {
          'X-Organization-Id': currentOrgId
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch calendar items')
      }

      const data = await response.json()
      setItems(data.items)
    } catch (error) {
      console.error('Error fetching calendar items:', error)
      toast({
        title: 'Error loading calendar',
        description: 'Failed to load calendar items. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, dateRange, filters, toast])

  // Load items on mount and when dependencies change
  useEffect(() => {
    fetchCalendarItems()
  }, [fetchCalendarItems])

  // Navigation handlers
  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate)

    if (direction === 'today') {
      setCurrentDate(new Date())
      return
    }

    const multiplier = direction === 'next' ? 1 : -1

    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + multiplier)
        break
      case 'week':
        newDate.setDate(newDate.getDate() + 7 * multiplier)
        break
      case 'day':
        newDate.setDate(newDate.getDate() + multiplier)
        break
    }

    setCurrentDate(newDate)
  }

  // Export handlers
  const handleExport = async (format: 'csv' | 'ics') => {
    try {
      const params = new URLSearchParams({
        organization_id: currentOrgId!,
        format,
        start_date: dateRange.start.toISOString(),
        end_date: dateRange.end.toISOString(),
        sources: filters.sources.join(',')
      })

      const response = await fetch(`/api/civicflow/calendar/export?${params}`, {
        headers: {
          'X-Organization-Id': currentOrgId!
        }
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `calendar-${format}-${format(new Date(), 'yyyy-MM-dd')}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Export successful',
        description: `Calendar exported as ${format.toUpperCase()}`
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: 'Failed to export calendar. Please try again.',
        variant: 'destructive'
      })
    }
  }

  // Item click handler
  const handleItemClick = (item: CalendarItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  // Filter update handler
  const updateFilters = (newFilters: Partial<CalendarFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // Render current view
  const renderView = () => {
    switch (view) {
      case 'month':
        return <MonthView currentDate={currentDate} items={items} onItemClick={handleItemClick} />
      case 'week':
        return <WeekView currentDate={currentDate} items={items} onItemClick={handleItemClick} />
      case 'day':
        return <DayView currentDate={currentDate} items={items} onItemClick={handleItemClick} />
      case 'agenda':
        return <AgendaView items={items} onItemClick={handleItemClick} />
      case 'heatmap':
        return <HeatmapView items={items} onItemClick={handleItemClick} />
    }
  }

  if (!currentOrgId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2">No Organization Selected</h2>
          <p className="text-muted-foreground">
            Please select an organization to view the calendar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onNavigate={navigateDate}
        onExport={handleExport}
        onPrint={() => window.print()}
      />

      {/* Filters */}
      <CalendarFilters
        filters={filters}
        onFiltersChange={updateFilters}
        loading={loading}
        itemCount={items.length}
      />

      {/* Calendar View */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading calendar items...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">No calendar items found</p>
              <p className="text-muted-foreground">Try adjusting your filters or date range.</p>
            </div>
          </div>
        ) : (
          renderView()
        )}
      </div>

      {/* Event Modal */}
      <CalendarEventModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedItem(null)
        }}
      />
    </div>
  )
}
