'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import '@/styles/microsoft-calendar.css'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  Video,
  Phone,
  MapPin,
  Star,
  Sparkles,
  Grid3x3,
  List,
  CalendarDays,
  User,
  Crown,
  Zap,
  Scissors,
  Palette,
  ChevronDown,
  MoreVertical,
  Bell,
  Settings,
  X,
  Columns,
  Square,
  CheckSquare,
  Building2,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useCalendarPlaybook } from '@/hooks/useCalendarPlaybook'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookAppointmentModal } from '@/components/salon/BookAppointmentModal'
import { Checkbox } from '@/components/ui/checkbox'

interface SalonResourceCalendarProps {
  className?: string
  onNewBooking?: () => void
  organizations?: Array<{
    id: string
    organization_code: string
    organization_name: string
  }>
  currentOrganizationId?: string
  canViewAllBranches?: boolean
}

interface TimeSlot {
  time: string
  displayTime: string
  appointments: any[]
}

interface Stylist {
  id: string
  name: string
  title: string
  avatar: string
  color: string
  available: boolean
  status: string
  businessHours?: {
    start: number
    end: number
  }
}

interface Appointment {
  id: string
  title: string
  client: string
  stylist: string
  time: string
  date: Date
  duration: number
  service: string
  status: string
  price: string
  color: string
  icon: React.ReactNode
  station?: string
  branchId: string
}

const BUSINESS_HOURS = {
  start: 9,
  end: 21,
  slotDuration: 30 // minutes
}

// Helper to assert UUID format
function assertUuid(id: string) {
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) throw new Error(`Invalid organization_id: ${id}`);
}

// Helper to check if component is mounted
function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function SalonResourceCalendar({
  className,
  onNewBooking,
  organizations = [],
  currentOrganizationId,
  canViewAllBranches = false
}: SalonResourceCalendarProps) {
  const { organization, user } = useHERAAuth()
  const organizationId = organization?.id || ''
  const branchId = organization?.metadata?.branch_id as string | undefined
  const mounted = useIsMounted()
  
  // All hooks must be called before any conditional returns
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<'day' | 'week' | 'month'>('week')
  const [viewMode, setViewMode] = useState<'single' | 'resource'>('resource')
  const [selectedStylists, setSelectedStylists] = useState<string[]>(['all'])
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['all'])
  const [showSidebar, setShowSidebar] = useState(true)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingSlot, setBookingSlot] = useState<{
    date: Date
    time: string
    stylistId?: string
    branchId?: string
  } | null>(null)
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    date: Date
    time: string
    stylistId: string
  } | null>(null)

  // Calculate date range based on selected view
  const dateRange = useMemo(() => {
    const start = new Date(selectedDate)
    const end = new Date(selectedDate)
    
    switch (selectedView) {
      case 'day':
        // Just the selected day
        break
      case 'week':
        // Get start and end of week
        const dayOfWeek = start.getDay()
        start.setDate(start.getDate() - dayOfWeek)
        end.setDate(start.getDate() + 6)
        break
      case 'month':
        // Get start and end of month
        start.setDate(1)
        end.setMonth(end.getMonth() + 1)
        end.setDate(0)
        break
    }
    
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    
    return {
      fromISO: start.toISOString(),
      toISO: end.toISOString()
    }
  }, [selectedDate, selectedView])

  // Use calendar playbook hook to fetch data
  const {
    loading,
    error,
    appointments,
    staff,
    services,
    customers,
    staffById,
    svcById,
    custById
  } = useCalendarPlaybook({
    organization_id: organizationId,
    branch_id: canViewAllBranches ? undefined : branchId,
    fromISO: dateRange.fromISO,
    toISO: dateRange.toISO
  })

  // Assert valid UUID after all hooks
  useEffect(() => {
    if (organizationId) {
      try {
        assertUuid(organizationId)
      } catch (error) {
        console.error('Invalid organization ID:', organizationId, error)
      }
    }
  }, [organizationId])
  
  // Don't render calendar if no organization ID
  if (!organizationId && mounted) {
    return (
      <div className={cn('flex h-[800px] bg-background dark:bg-background rounded-lg overflow-hidden items-center justify-center', className)}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No organization selected</p>
        </div>
      </div>
    )
  }

  // Transform staff data from Playbook API to Stylist format
  const allStylists: (Stylist & { branchId: string })[] = useMemo(() => {
    if (!staff.length && !mounted) {
      // Return hardcoded data for initial render to prevent hydration mismatch
      return []
    }
    
    // Map staff data from Playbook to Stylist format
    return staff.map((s, index) => ({
      id: s.id,
      name: s.entity_name || 'Staff Member',
      title: s.role || 'Stylist',
      avatar: s.entity_name?.charAt(0).toUpperCase() || 'S',
      color: getColorForIndex(index),
      available: s.available !== false,
      status: s.available === false ? 'away' : 'available',
      businessHours: { start: 9, end: 19 }, // Default hours
      branchId: s.branch_id || branchId || ''
    }))
  }, [staff, mounted, branchId])

  // Helper function to get consistent colors for stylists
  const getColorForIndex = (index: number): string => {
    const colors = [
      'bg-purple-600',
      'bg-blue-600', 
      'bg-pink-600',
      'bg-amber-600',
      'bg-teal-600',
      'bg-rose-600',
      'bg-indigo-600',
      'bg-emerald-600'
    ]
    return colors[index % colors.length]
  }

  // Filter stylists based on selected branches
  const stylists = useMemo(() => {
    if (selectedBranches.includes('all')) {
      return allStylists
    }
    return allStylists.filter(s => selectedBranches.includes(s.branchId))
  }, [selectedBranches])

  // Get selected stylists for resource view
  const displayedStylists = useMemo(() => {
    if (selectedStylists.includes('all')) {
      return stylists
    }
    return stylists.filter(s => selectedStylists.includes(s.id))
  }, [selectedStylists])

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = []
    const totalMinutes = (BUSINESS_HOURS.end - BUSINESS_HOURS.start) * 60
    const numberOfSlots = totalMinutes / BUSINESS_HOURS.slotDuration

    for (let i = 0; i < numberOfSlots; i++) {
      const hour = BUSINESS_HOURS.start + Math.floor((i * BUSINESS_HOURS.slotDuration) / 60)
      const minute = (i * BUSINESS_HOURS.slotDuration) % 60
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const displayTime = new Date(2024, 0, 1, hour, minute).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      slots.push({ time, displayTime, appointments: [] })
    }

    return slots
  }, [])

  // Transform appointments data from Playbook API to local Appointment format
  const transformedAppointments = useMemo(() => {
    if (!appointments.length || !mounted) {
      // Return empty array for initial render to prevent hydration mismatch
      return []
    }

    // Service icons and colors mapping
    const serviceIconMap: Record<string, { icon: React.ReactNode; color: string }> = {
      'brazilian': { icon: <Zap className="w-3 h-3" />, color: '#8B5CF6' },
      'cut': { icon: <Scissors className="w-3 h-3" />, color: '#3B82F6' },
      'color': { icon: <Palette className="w-3 h-3" />, color: '#EC4899' },
      'bridal': { icon: <Crown className="w-3 h-3" />, color: '#F59E0B' },
      'nails': { icon: <Sparkles className="w-3 h-3" />, color: '#10B981' },
      'keratin': { icon: <Star className="w-3 h-3" />, color: '#8B5CF6' },
      'default': { icon: <Scissors className="w-3 h-3" />, color: '#6B7280' }
    }

    return appointments.map((apt) => {
      const startDate = new Date(apt.start_time)
      const time = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`
      
      // Get service info from services
      const service = apt.service_ids?.[0] ? svcById.get(apt.service_ids[0]) : null
      const serviceType = service?.category || 'default'
      const serviceInfo = serviceIconMap[serviceType] || serviceIconMap.default
      
      // Get customer info
      const customer = apt.customer_id ? custById.get(apt.customer_id) : null
      const customerName = customer?.entity_name || 'Walk-in Customer'
      
      // Get stylist info
      const stylist = apt.stylist_id ? staffById.get(apt.stylist_id) : null
      const stylistId = stylist?.id || apt.stylist_id || ''
      
      // Get branch info - now comes from entity data
      const appointmentBranchId = apt.branch_id || branchId || ''
      
      return {
        id: apt.id,
        title: service?.entity_name || apt.entity_name || 'Appointment',
        client: customerName,
        stylist: stylistId,
        time,
        date: startDate,
        duration: service?.duration_minutes || 60,
        service: serviceType,
        status: apt.status === 'completed' ? 'completed' : 
                apt.status === 'cancelled' ? 'tentative' : 'confirmed',
        price: `AED ${apt.price || service?.price || 0}`,
        color: serviceInfo.color,
        icon: serviceInfo.icon,
        station: `station-1`,
        branchId: appointmentBranchId
      }
    })
  }, [appointments, mounted, staffById, svcById, custById, branchId])

  // Get dates based on selected view
  const getViewDates = () => {
    const dates = []

    if (selectedView === 'day') {
      // For day view, just return the selected date
      dates.push(new Date(selectedDate))
    } else if (selectedView === 'week') {
      // For week view, get full week
      const startOfWeek = new Date(selectedDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day
      startOfWeek.setDate(diff)

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000)
        dates.push(date)
      }
    } else {
      // For month view, get current month's weeks (simplified to current week for now)
      const startOfWeek = new Date(selectedDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day
      startOfWeek.setDate(diff)

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000)
        dates.push(date)
      }
    }

    return dates
  }

  const viewDates = getViewDates()

  // Format date for display
  const formatDateHeader = (date: Date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNumber = date.getDate()

    return { dayName, dayNumber, isToday }
  }

  // Handle stylist selection
  const handleStylistToggle = (stylistId: string) => {
    if (stylistId === 'all') {
      setSelectedStylists(['all'])
    } else {
      setSelectedStylists(prev => {
        const filtered = prev.filter(id => id !== 'all')
        if (filtered.includes(stylistId)) {
          const newSelection = filtered.filter(id => id !== stylistId)
          return newSelection.length === 0 ? ['all'] : newSelection
        } else {
          return [...filtered, stylistId]
        }
      })
    }
  }

  // Check if time slot is within stylist's business hours
  const isWithinBusinessHours = (stylist: Stylist, time: string) => {
    const [hour] = time.split(':').map(Number)
    const businessHours = stylist.businessHours || BUSINESS_HOURS
    return hour >= businessHours.start && hour < businessHours.end
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, date: Date, time: string, stylistId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget({ date, time, stylistId })
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent, date: Date, time: string, stylistId: string) => {
    e.preventDefault()
    if (!draggedAppointment) return

    setDraggedAppointment(null)
    setDropTarget(null)

    // TODO: Call Playbook API to update the appointment
    console.log('Moved appointment:', {
      appointmentId: draggedAppointment.id,
      newDate: date,
      newTime: time,
      newStylist: stylistId
    })
    
    // After API call succeeds, the useCalendarPlaybook hook will automatically
    // refresh the data and update the UI
  }

  // Handle keyboard navigation
  const handleKeyNavigation = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return // Don't handle keyboard events when typing in inputs
      }

      const newDate = new Date(selectedDate)

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (selectedView === 'day') {
            newDate.setDate(newDate.getDate() - 1)
          } else if (selectedView === 'week') {
            newDate.setDate(newDate.getDate() - 7)
          } else {
            newDate.setMonth(newDate.getMonth() - 1)
          }
          console.log('Salon Keyboard: Previous', {
            oldDate: selectedDate.toDateString(),
            newDate: newDate.toDateString(),
            view: selectedView
          })
          setSelectedDate(newDate)
          break
        case 'ArrowRight':
          e.preventDefault()
          if (selectedView === 'day') {
            newDate.setDate(newDate.getDate() + 1)
          } else if (selectedView === 'week') {
            newDate.setDate(newDate.getDate() + 7)
          } else {
            newDate.setMonth(newDate.getMonth() + 1)
          }
          console.log('Salon Keyboard: Next', {
            oldDate: selectedDate.toDateString(),
            newDate: newDate.toDateString(),
            view: selectedView
          })
          setSelectedDate(newDate)
          break
        case 'Home':
          e.preventDefault()
          console.log('Salon Keyboard: Today')
          setSelectedDate(new Date())
          break
        case '1':
          e.preventDefault()
          setSelectedView('day')
          break
        case '2':
          e.preventDefault()
          setSelectedView('week')
          break
        case '3':
          e.preventDefault()
          setSelectedView('month')
          break
      }
    },
    [selectedDate, selectedView]
  )

  // Add keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyNavigation)
    return () => window.removeEventListener('keydown', handleKeyNavigation)
  }, [handleKeyNavigation])

  // Show loading state
  if (loading && !mounted) {
    return (
      <div className={cn('flex h-[800px] bg-background dark:bg-background rounded-lg overflow-hidden items-center justify-center', className)}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !transformedAppointments.length && !staff.length) {
    return (
      <div className={cn('flex h-[800px] bg-background dark:bg-background rounded-lg overflow-hidden items-center justify-center', className)}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-semibold mb-2">Failed to load calendar data</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-[800px] bg-background dark:bg-background rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-r border-border dark:border-border bg-muted dark:bg-muted/50 flex flex-col calendar-sidebar">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border dark:border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100 dark:text-foreground">Calendar</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(false)}
                className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Branch Filter - Show for demo purposes */}
            {organizations.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-100 dark:text-foreground mb-2">
                  Branch Filter
                </h4>
                <div className="space-y-2">
                  {/* All branches option */}
                  <div
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                      selectedBranches.includes('all')
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-muted dark:hover:bg-muted-foreground/10'
                    )}
                    onClick={() => setSelectedBranches(['all'])}
                  >
                    <Checkbox
                      checked={selectedBranches.includes('all')}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <MapPin className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                    <span className="text-sm font-medium text-gray-100 dark:text-foreground">
                      All Branches
                    </span>
                  </div>

                  {/* Individual branches */}
                  {organizations
                    .filter(org => org.organization_code !== 'SALON-GROUP')
                    .map(org => (
                      <div
                        key={org.id}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                          selectedBranches.includes(org.id)
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                            : 'hover:bg-muted dark:hover:bg-muted-foreground/10'
                        )}
                        onClick={() => {
                          if (selectedBranches.includes('all')) {
                            setSelectedBranches([org.id])
                          } else if (selectedBranches.includes(org.id)) {
                            const newSelection = selectedBranches.filter(id => id !== org.id)
                            setSelectedBranches(newSelection.length === 0 ? ['all'] : newSelection)
                          } else {
                            setSelectedBranches([
                              ...selectedBranches.filter(id => id !== 'all'),
                              org.id
                            ])
                          }
                        }}
                      >
                        <Checkbox
                          checked={selectedBranches.includes(org.id)}
                          disabled={selectedBranches.includes('all')}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <MapPin className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                        <span className="text-sm text-gray-100 dark:text-foreground">
                          {org.organization_name.split('•')[1]?.trim() || org.organization_name}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={viewMode === 'single' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setViewMode('single')}
              >
                <User className="w-4 h-4 mr-2" />
                Single View
              </Button>
              <Button
                variant={viewMode === 'resource' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setViewMode('resource')}
              >
                <Columns className="w-4 h-4 mr-2" />
                Resource View
              </Button>
            </div>

            {/* Mini Calendar */}
            <div className="bg-background dark:bg-muted rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-100 dark:text-foreground">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {/* Mini calendar grid would go here */}
              <div className="text-xs text-muted-foreground dark:text-muted-foreground text-center py-4">
                Mini calendar view
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-100 dark:text-foreground mb-3">
                Team Members
              </h4>

              {/* All option */}
              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all sidebar-item mb-2',
                  selectedStylists.includes('all')
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                    : 'hover:bg-muted dark:hover:bg-muted-foreground/10'
                )}
                onClick={() => handleStylistToggle('all')}
              >
                <Checkbox
                  checked={selectedStylists.includes('all')}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-100 dark:text-foreground">All Stylists</p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">View all team members</p>
                </div>
              </div>

              {/* Individual stylists */}
              <div className="space-y-2">
                {stylists.map(stylist => (
                  <div
                    key={stylist.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all sidebar-item',
                      selectedStylists.includes(stylist.id)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-muted dark:hover:bg-muted-foreground/10'
                    )}
                    onClick={() => handleStylistToggle(stylist.id)}
                  >
                    <Checkbox
                      checked={selectedStylists.includes(stylist.id)}
                      disabled={selectedStylists.includes('all')}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <div className="relative">
                      <Avatar className={cn('h-10 w-10', stylist.color)}>
                        <AvatarFallback className="text-foreground font-semibold">
                          {stylist.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
                          stylist.status === 'available'
                            ? 'bg-green-500'
                            : stylist.status === 'busy'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-100 dark:text-foreground">
                        {stylist.name}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">{stylist.title}</p>
                      {organizations.length > 0 && (
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
                          {organizations
                            .find(org => org.id === (stylist as any).branchId)
                            ?.organization_name.split('•')[1]
                            ?.trim() || 'Branch'}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        stylist.available
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-muted text-muted-foreground dark:bg-muted-foreground/10 dark:text-gray-300'
                      )}
                    >
                      {stylist.available ? 'Available' : 'Away'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border dark:border-border">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-foreground"
              onClick={() => {
                setBookingSlot(null)
                setIsBookingOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>
      )}

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        {/* Calendar Header */}
        <div className="p-4 border-b border-border dark:border-border bg-background dark:bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(true)}
                  className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-gray-200"
                >
                  <Grid3x3 className="w-5 h-5" />
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground dark:text-gray-300"
                  onClick={() => {
                    const newDate = new Date(selectedDate)
                    if (selectedView === 'day') {
                      newDate.setDate(newDate.getDate() - 1)
                    } else if (selectedView === 'week') {
                      newDate.setDate(newDate.getDate() - 7)
                    } else {
                      newDate.setMonth(newDate.getMonth() - 1)
                    }
                    console.log('Salon Navigation: Previous', {
                      oldDate: selectedDate.toDateString(),
                      newDate: newDate.toDateString(),
                      view: selectedView
                    })
                    setSelectedDate(newDate)
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  className="text-sm font-medium min-w-[120px] text-gray-700 dark:text-gray-200"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground dark:text-gray-300"
                  onClick={() => {
                    const newDate = new Date(selectedDate)
                    if (selectedView === 'day') {
                      newDate.setDate(newDate.getDate() + 1)
                    } else if (selectedView === 'week') {
                      newDate.setDate(newDate.getDate() + 7)
                    } else {
                      newDate.setMonth(newDate.getMonth() + 1)
                    }
                    console.log('Salon Navigation: Next', {
                      oldDate: selectedDate.toDateString(),
                      newDate: newDate.toDateString(),
                      view: selectedView
                    })
                    setSelectedDate(newDate)
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-gray-100 dark:text-foreground">
                  {selectedView === 'day'
                    ? selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : selectedView === 'week'
                      ? `Week of ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : selectedDate.toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {selectedView.charAt(0).toUpperCase() + selectedView.slice(1)} view •{' '}
                  {viewDates.length} day{viewDates.length > 1 ? 's' : ''} • Hair Talkz Salon
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tabs value={selectedView} onValueChange={v => setSelectedView(v as any)}>
                <TabsList className="bg-muted dark:bg-muted">
                  <TabsTrigger value="day" className="text-sm">
                    Day
                  </TabsTrigger>
                  <TabsTrigger value="week" className="text-sm">
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-sm">
                    Month
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground dark:text-gray-300">
                  <Search className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground dark:text-gray-300">
                  <Filter className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground dark:text-gray-300"
                  title="Keyboard Shortcuts: ← → Navigate, Home: Today, 1: Day, 2: Week, 3: Month"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Time Column */}
            <div className="w-20 border-r border-border dark:border-border bg-muted dark:bg-muted/30">
              <div
                className={cn(
                  'border-b border-border dark:border-border',
                  viewMode === 'resource' ? 'h-20' : 'h-14'
                )}
              />
              <ScrollArea
                className={cn(
                  'calendar-scrollbar',
                  viewMode === 'resource' ? 'h-[calc(100%-5rem)]' : 'h-[calc(100%-3.5rem)]'
                )}
              >
                {timeSlots.map((slot, idx) => (
                  <div
                    key={slot.time}
                    className="h-16 border-b border-gray-100 dark:border-gray-800 px-2 py-1"
                  >
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {slot.displayTime}
                    </span>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Days/Resources Grid */}
            <div className="flex-1 flex">
              <ScrollArea className="w-full calendar-scrollbar">
                <div className="flex">
                  {viewMode === 'single'
                    ? // Single view mode (day/week/month layout)
                      viewDates.map((date, dayIdx) => {
                        const { dayName, dayNumber, isToday } = formatDateHeader(date)

                        return (
                          <div
                            key={dayIdx}
                            className={cn(
                              'border-r border-border dark:border-border last:border-r-0 transition-all duration-300',
                              selectedView === 'day'
                                ? 'flex-1 min-w-[400px]'
                                : 'flex-1 min-w-[140px]'
                            )}
                          >
                            {/* Day Header */}
                            <div
                              className={cn(
                                'h-14 border-b border-border dark:border-border px-2 py-2 text-center day-header',
                                isToday && 'today'
                              )}
                            >
                              <p
                                className={cn(
                                  'text-xs font-bold uppercase tracking-wider',
                                  isToday
                                    ? 'text-primary dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-300'
                                )}
                              >
                                {dayName}
                              </p>
                              <p
                                className={cn(
                                  'text-xl font-extrabold',
                                  isToday
                                    ? 'text-primary dark:text-blue-400'
                                    : 'text-gray-100 dark:text-foreground'
                                )}
                              >
                                {dayNumber}
                              </p>
                            </div>

                            {/* Time Slots */}
                            <div>
                              {timeSlots.map((slot, slotIdx) => {
                                const slotAppointments = transformedAppointments.filter(
                                  apt =>
                                    apt.time === slot.time &&
                                    apt.date.toDateString() === date.toDateString() &&
                                    (selectedStylists.includes('all') ||
                                      selectedStylists.includes(apt.stylist)) &&
                                    (selectedBranches.includes('all') ||
                                      selectedBranches.includes(apt.branchId))
                                )

                                return (
                                  <div
                                    key={`${dayIdx}-${slotIdx}`}
                                    className={cn(
                                      'h-16 border-b border-gray-100 dark:border-gray-800 relative group time-slot',
                                      'hover:bg-muted dark:hover:bg-muted/50 cursor-pointer'
                                    )}
                                    onClick={() => {
                                      if (!slotAppointments.length) {
                                        setBookingSlot({ date: date, time: slot.time })
                                        setIsBookingOpen(true)
                                      }
                                    }}
                                  >
                                    {/* Appointments */}
                                    {slotAppointments.map((apt, aptIdx) => {
                                      const durationSlots = Math.ceil(
                                        apt.duration / BUSINESS_HOURS.slotDuration
                                      )
                                      const stylistInfo = stylists.find(s => s.id === apt.stylist)

                                      return (
                                        <div
                                          key={apt.id}
                                          draggable
                                          onDragStart={e => handleDragStart(e, apt)}
                                          className={cn(
                                            'absolute inset-x-1 top-1 mx-1 rounded-md p-2 cursor-move appointment-card',
                                            'transform transition-all hover:scale-[1.02] hover:shadow-md',
                                            'border-l-4',
                                            `appointment-${apt.service}`
                                          )}
                                          style={{
                                            backgroundColor: `${apt.color}15`,
                                            borderLeftColor: apt.color,
                                            height: `${durationSlots * 64 - 8}px`,
                                            zIndex: 5 + aptIdx
                                          }}
                                        >
                                          <div className="flex items-start gap-2">
                                            <div
                                              className="w-6 h-6 rounded-full flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0"
                                              style={{ backgroundColor: apt.color }}
                                            >
                                              {apt.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-semibold text-gray-100 dark:text-foreground truncate">
                                                {apt.title}
                                              </p>
                                              <p className="text-xs text-muted-foreground dark:text-gray-300 truncate">
                                                {apt.client}
                                              </p>
                                              <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                  variant="secondary"
                                                  className="text-xs px-1 py-0"
                                                  style={{
                                                    backgroundColor: `${apt.color}20`,
                                                    color: apt.color,
                                                    borderColor: apt.color
                                                  }}
                                                >
                                                  {apt.price}
                                                </Badge>
                                                {stylistInfo && (
                                                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                                                    {stylistInfo.name}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <MoreVertical className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    : // Resource view mode
                      displayedStylists.map((stylist, stylistIdx) => (
                        <div
                          key={stylist.id}
                          className="flex-1 min-w-[200px] border-r border-border dark:border-border last:border-r-0"
                        >
                          {/* Stylist Header */}
                          <div className="h-20 border-b border-border dark:border-border px-2 py-2 bg-muted dark:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Avatar className={cn('h-10 w-10', stylist.color)}>
                                <AvatarFallback className="text-foreground font-semibold">
                                  {stylist.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-100 dark:text-foreground">
                                  {stylist.name}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                  {stylist.title}
                                </p>
                                {organizations.length > 0 && (
                                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                    {organizations
                                      .find(org => org.id === (stylist as any).branchId)
                                      ?.organization_name.split('•')[1]
                                      ?.trim() || 'Branch'}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                              {stylist.businessHours
                                ? `${stylist.businessHours.start}:00 - ${stylist.businessHours.end}:00`
                                : 'Standard hours'}
                            </p>
                          </div>

                          {/* Time Slots for this stylist */}
                          <div>
                            {timeSlots.map((slot, slotIdx) => {
                              const slotAppointments = transformedAppointments.filter(
                                apt =>
                                  apt.time === slot.time &&
                                  apt.stylist === stylist.id &&
                                  apt.date.toDateString() === selectedDate.toDateString() &&
                                  (selectedBranches.includes('all') ||
                                    selectedBranches.includes(apt.branchId))
                              )

                              const isBusinessHour = isWithinBusinessHours(stylist, slot.time)
                              const isDropTarget =
                                dropTarget &&
                                dropTarget.time === slot.time &&
                                dropTarget.stylistId === stylist.id

                              return (
                                <div
                                  key={`${stylist.id}-${slotIdx}`}
                                  className={cn(
                                    'h-16 border-b border-gray-100 dark:border-gray-800 relative group time-slot',
                                    !isBusinessHour && 'bg-muted dark:bg-muted/30',
                                    isBusinessHour &&
                                      'hover:bg-muted dark:hover:bg-muted/50 cursor-pointer',
                                    isDropTarget && 'bg-blue-50 dark:bg-blue-900/20'
                                  )}
                                  onClick={() => {
                                    if (!slotAppointments.length && isBusinessHour) {
                                      setBookingSlot({
                                        date: selectedDate,
                                        time: slot.time,
                                        stylistId: stylist.id
                                      })
                                      setIsBookingOpen(true)
                                    }
                                  }}
                                  onDragOver={e =>
                                    isBusinessHour &&
                                    handleDragOver(e, selectedDate, slot.time, stylist.id)
                                  }
                                  onDrop={e =>
                                    isBusinessHour &&
                                    handleDrop(e, selectedDate, slot.time, stylist.id)
                                  }
                                  onDragLeave={() => setDropTarget(null)}
                                >
                                  {/* Non-business hour overlay */}
                                  {!isBusinessHour && (
                                    <div className="absolute inset-0 bg-muted dark:bg-muted/30 z-10" />
                                  )}

                                  {/* Appointments */}
                                  {slotAppointments.map((apt, aptIdx) => {
                                    const durationSlots = Math.ceil(
                                      apt.duration / BUSINESS_HOURS.slotDuration
                                    )

                                    return (
                                      <div
                                        key={apt.id}
                                        draggable
                                        onDragStart={e => handleDragStart(e, apt)}
                                        className={cn(
                                          'absolute inset-x-1 top-1 mx-1 rounded-md p-2 cursor-move appointment-card',
                                          'transform transition-all hover:scale-[1.02] hover:shadow-md',
                                          'border-l-4',
                                          `appointment-${apt.service}`
                                        )}
                                        style={{
                                          backgroundColor: `${apt.color}15`,
                                          borderLeftColor: apt.color,
                                          height: `${durationSlots * 64 - 8}px`,
                                          zIndex: 5 + aptIdx
                                        }}
                                      >
                                        <AppointmentCard
                                          appointment={apt}
                                          stylist={stylist}
                                          compact
                                        />
                                      </div>
                                    )
                                  })}

                                  {/* Add appointment hint */}
                                  {!slotAppointments.length && isBusinessHour && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Plus className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false)
          setBookingSlot(null)
        }}
        onBookingComplete={booking => {
          console.log('Booking completed:', booking)
          // TODO: Call Playbook API to create the appointment
          // After API call succeeds, the useCalendarPlaybook hook will automatically
          // refresh the data and update the UI
          
          setIsBookingOpen(false)
          setBookingSlot(null)
          onNewBooking?.()
        }}
        preSelectedDate={bookingSlot?.date}
        preSelectedTime={bookingSlot?.time}
        preSelectedStylist={bookingSlot?.stylistId}
      />
    </div>
  )
}

// Appointment card component
function AppointmentCard({
  appointment,
  stylist,
  compact = false
}: {
  appointment: Appointment
  stylist?: Stylist
  compact?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: appointment.color }}
      >
        {appointment.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-100 dark:text-foreground truncate">
          {appointment.title}
        </p>
        <p className="text-xs text-muted-foreground dark:text-gray-300 truncate">{appointment.client}</p>
        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className="text-xs px-1 py-0"
              style={{
                backgroundColor: `${appointment.color}20`,
                color: appointment.color,
                borderColor: appointment.color
              }}
            >
              {appointment.price}
            </Badge>
            {stylist && (
              <span className="text-xs text-muted-foreground dark:text-muted-foreground">{stylist.name}</span>
            )}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreVertical className="w-3 h-3" />
      </Button>
    </div>
  )
}
