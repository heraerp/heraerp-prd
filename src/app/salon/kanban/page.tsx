// ============================================================================
// HERA • Salon Appointments Kanban Page with DRAFT support
// ============================================================================

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { format, startOfToday, addDays } from 'date-fns'
import { Plus, Calendar, RefreshCw, Building2, MapPin, Loader2, CalendarDays } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/luxe-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Board } from '@/components/salon/kanban/Board'
import { ReschedulePanel } from '@/components/salon/kanban/ReschedulePanel'
import {
  useHeraAppointments,
  AppointmentStatus,
  VALID_STATUS_TRANSITIONS,
  canTransitionTo,
  getTransitionErrorMessage
} from '@/hooks/useHeraAppointments'
import { KanbanCard, KanbanStatus } from '@/schemas/kanban'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useMemo } from 'react'

// Luxury color palette
const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#5A2A40',
  rose: '#E8B4B8'
}

// Salon organization ID (fallback)
const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

export default function KanbanPage() {
  const router = useRouter()
  const {
    organizationId,
    organization: authOrganization,
    isAuthenticated,
    isLoading: contextLoading
  } = useSecuredSalonContext()
  const { toast } = useToast()

  // Always reset branch filter to 'all' on page load
  useEffect(() => {
    localStorage.removeItem('branch-filter-salon-kanban')
  }, [])

  // Branch filter hook - no persistence
  const {
    branchId,
    branches,
    loading: branchesLoading,
    setBranchId,
    hasMultipleBranches
  } = useBranchFilter(undefined, undefined, organizationId)

  // Date filter state - default to "all" (show past year to future year)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'week' | 'custom'>(
    'all'
  )
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined)

  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancellationType, setCancellationType] = useState<
    'no_show' | 'customer_request' | 'staff_unavailable' | 'emergency' | 'other'
  >('customer_request')
  const [cardToCancel, setCardToCancel] = useState<KanbanCard | null>(null)
  const [userId, setUserId] = useState<string>('')

  // Get user ID from localStorage for demo
  useEffect(() => {
    const storedUserId = localStorage.getItem('salonUserId') || 'demo-user'
    setUserId(storedUserId)
  }, [])
  const [draftModalOpen, setDraftModalOpen] = useState(false)

  // Draft form state
  const [draftForm, setDraftForm] = useState({
    customer_name: '',
    service_name: '',
    staff_name: '',
    start_time: '',
    duration: '60'
  })

  // Calculate date range based on filter
  const getDateRange = () => {
    const today = startOfToday()

    switch (dateFilter) {
      case 'today':
        return { date: format(today, 'yyyy-MM-dd'), dateFrom: today, dateTo: today }
      case 'tomorrow':
        const tomorrow = addDays(today, 1)
        return { date: format(tomorrow, 'yyyy-MM-dd'), dateFrom: tomorrow, dateTo: tomorrow }
      case 'week':
        const weekEnd = addDays(today, 7)
        return { date: format(today, 'yyyy-MM-dd'), dateFrom: today, dateTo: weekEnd }
      case 'custom':
        if (customDate) {
          return {
            date: format(customDate, 'yyyy-MM-dd'),
            dateFrom: customDate,
            dateTo: customDate
          }
        }
        return { date: format(today, 'yyyy-MM-dd'), dateFrom: today, dateTo: today }
      case 'all':
      default:
        // Show appointments from 1 year ago to 1 year in the future
        const yearAgo = addDays(today, -365)
        const yearAhead = addDays(today, 365)
        return { date: format(today, 'yyyy-MM-dd'), dateFrom: yearAgo, dateTo: yearAhead }
    }
  }

  const dateRange = getDateRange()

  // 🎯 ENTERPRISE: Use proper appointment hook like /appointments page
  const {
    appointments,
    isLoading: loading,
    isUpdating: isMoving,
    updateAppointmentStatus,
    refetch: reload
  } = useHeraAppointments({
    organizationId,
    filters: {
      branch_id: branchId && branchId !== 'all' ? branchId : undefined,
      date_from: format(dateRange.dateFrom, 'yyyy-MM-dd'),
      date_to: format(dateRange.dateTo, 'yyyy-MM-dd')
    }
  })

  // 🎯 ENTERPRISE: Transform appointments to kanban cards
  const cards: KanbanCard[] = useMemo(() => {
    return appointments.map(apt => ({
      id: apt.id,
      customer_name: apt.customer_name,
      service_name: apt.metadata?.service_name || 'Service',
      stylist_name: apt.stylist_name || null,
      start: apt.start_time,
      end: apt.end_time,
      status: apt.status.toUpperCase() as KanbanStatus,
      flags: {
        vip: apt.metadata?.vip || false,
        new: apt.metadata?.new_customer || false
      },
      cancellation_reason: apt.metadata?.cancellation_reason || null
    }))
  }, [appointments])

  // 🎯 ENTERPRISE: Group cards by status column
  const cardsByColumn: Record<KanbanStatus, KanbanCard[]> = useMemo(() => {
    const columns: Record<KanbanStatus, KanbanCard[]> = {
      DRAFT: [],
      BOOKED: [],
      CHECKED_IN: [],
      IN_SERVICE: [], // ✅ FIXED: Correct column name from schema
      TO_PAY: [],
      DONE: [],
      CANCELLED: []
    }

    cards.forEach(card => {
      // Map appointment statuses to kanban columns
      const status = card.status
      if (status === 'PAYMENT_PENDING') {
        columns.TO_PAY.push(card)
      } else if (status === 'COMPLETED') {
        columns.DONE.push(card)
      } else if (status === 'NO_SHOW') {
        columns.CANCELLED.push(card)
      } else if (status === 'IN_PROGRESS') {
        // Map IN_PROGRESS appointment status to IN_SERVICE kanban column
        columns.IN_SERVICE.push(card)
      } else if (columns[status]) {
        columns[status].push(card)
      }
    })

    return columns
  }, [cards])

  // 🎯 ENTERPRISE: Drag and drop handler with flexible forward flow validation
  const moveCard = useCallback(
    async (cardId: string, targetColumn: KanbanStatus, targetIndex: number) => {
      const card = cards.find(c => c.id === cardId)
      if (!card) return

      // Map kanban column to appointment status
      let newStatus: AppointmentStatus
      switch (targetColumn) {
        case 'DRAFT':
          newStatus = 'draft'
          break
        case 'BOOKED':
          newStatus = 'booked'
          break
        case 'CHECKED_IN':
          newStatus = 'checked_in'
          break
        case 'IN_SERVICE':
          newStatus = 'in_progress'
          break
        case 'TO_PAY':
          newStatus = 'payment_pending'
          break
        case 'DONE':
          newStatus = 'completed'
          break
        case 'CANCELLED':
          newStatus = 'cancelled'
          break
        default:
          return
      }

      // Get current status (normalize uppercase to lowercase)
      const currentStatus = card.status.toLowerCase() as AppointmentStatus

      // 🎯 ENTERPRISE: Validate transition with detailed error messages
      if (!canTransitionTo(currentStatus, newStatus)) {
        const errorMessage = getTransitionErrorMessage(currentStatus, newStatus)
        toast({
          title: 'Invalid Status Transition',
          description: errorMessage,
          variant: 'destructive'
        })
        return
      }

      try {
        await updateAppointmentStatus({ id: cardId, status: newStatus })
        toast({
          title: '✅ Status Updated',
          description: `Appointment moved to ${targetColumn.replace('_', ' ').toLowerCase()}`,
          duration: 2000
        })
      } catch (error: any) {
        toast({
          title: 'Failed to update status',
          description: error.message || 'Please try again',
          variant: 'destructive'
        })
      }
    },
    [cards, updateAppointmentStatus, toast]
  )

  // 🎯 ENTERPRISE: Quick action to move card to next logical status
  const handleMoveToNext = useCallback(
    async (card: KanbanCard) => {
      const currentStatus = card.status.toLowerCase() as AppointmentStatus
      const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus]

      if (validTransitions.length === 0) {
        toast({
          title: 'No further transitions',
          description: 'This appointment is in a terminal state',
          variant: 'default'
        })
        return
      }

      // Get next logical status (first non-cancelled option)
      const nextStatus = validTransitions.find(s => s !== 'cancelled' && s !== 'no_show')
      if (!nextStatus) {
        toast({
          title: 'No next status available',
          description: 'Only cancellation is available for this appointment',
          variant: 'default'
        })
        return
      }

      // Map status to column
      let targetColumn: KanbanStatus
      switch (nextStatus) {
        case 'booked':
          targetColumn = 'BOOKED'
          break
        case 'checked_in':
          targetColumn = 'CHECKED_IN'
          break
        case 'in_progress':
          targetColumn = 'IN_SERVICE'
          break
        case 'payment_pending':
          targetColumn = 'TO_PAY'
          break
        case 'completed':
          targetColumn = 'DONE'
          break
        default:
          return
      }

      await moveCard(card.id, targetColumn, 0)
    },
    [moveCard, toast]
  )

  const handleCardAction = useCallback(
    async (card: KanbanCard, action: string) => {
      switch (action) {
        case 'confirm':
          await moveCard(card.id, 'BOOKED', 0)
          break

        case 'edit':
          setSelectedCard(card)
          setRescheduleOpen(true)
          break

        case 'reschedule':
          setSelectedCard(card)
          setRescheduleOpen(true)
          break

        case 'cancel':
          setCardToCancel(card)
          setCancelModalOpen(true)
          break
      }
    },
    [moveCard]
  )

  const handleCreateDraft = async () => {
    toast({
      title: 'Create Draft',
      description: 'Use the main appointments page to create new appointments',
      variant: 'default'
    })
    setDraftModalOpen(false)
  }

  const handleCancelConfirm = async () => {
    if (!cardToCancel) return

    try {
      await updateAppointmentStatus({ id: cardToCancel.id, status: 'cancelled' })
      toast({
        title: 'Appointment cancelled',
        description: 'The appointment has been cancelled successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Failed to cancel',
        description: error.message || 'Please try again',
        variant: 'destructive'
      })
    }

    setCancelModalOpen(false)
    setCardToCancel(null)
    setCancelReason('')
  }

  // Check authorization layers
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Please log in to access this page
          </h2>
        </div>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div
        className="min-h-screen"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.black} 0%, ${LUXE_COLORS.charcoal} 100%)`
        }}
      >
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-center animate-fadeIn">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold}40 0%, ${LUXE_COLORS.goldDark}40 100%)`,
                  boxShadow: `0 8px 32px ${LUXE_COLORS.gold}20`
                }}
              >
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
              </div>
              <p className="mt-4" style={{ color: LUXE_COLORS.bronze }}>
                Loading organization context...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            No organization context found
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Please ensure you are properly authenticated
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, ${LUXE_COLORS.black} 0%, ${LUXE_COLORS.charcoal} 100%)`
      }}
    >
      {/* Luxe header */}
      <header
        className="px-6 py-4 shadow-xl backdrop-blur transition-all duration-300 animate-slideDown"
        style={{
          backgroundColor: `${LUXE_COLORS.charcoal}E6`,
          borderBottom: `1px solid ${LUXE_COLORS.gold}40`,
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transform transition-transform duration-300 hover:scale-110 animate-fadeIn"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                  boxShadow: `0 8px 32px ${LUXE_COLORS.gold}40`
                }}
              >
                <CalendarDays className="w-6 h-6" style={{ color: LUXE_COLORS.black }} />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight transition-all duration-300"
                  style={{ color: LUXE_COLORS.champagne }}
                >
                  Kanban Board
                </h1>
                <p
                  className="text-sm mt-1 opacity-80 transition-opacity duration-300 hover:opacity-100"
                  style={{ color: LUXE_COLORS.bronze }}
                >
                  Drag and drop appointments to manage workflow
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 animate-slideLeft">
            {/* Branch Filter */}
            <Select
              value={branchId === undefined || branchId === 'all' ? 'all' : branchId}
              onValueChange={value => setBranchId(value === 'all' ? undefined : value)}
            >
              <SelectTrigger
                className="w-[200px] transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: `${LUXE_COLORS.black}CC`,
                  borderColor: LUXE_COLORS.bronze,
                  color: LUXE_COLORS.champagne
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = LUXE_COLORS.gold
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${LUXE_COLORS.gold}20`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = LUXE_COLORS.bronze
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" style={{ color: LUXE_COLORS.gold }} />
                  <SelectValue placeholder="All Locations" />
                </div>
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">
                  All Locations
                </SelectItem>
                {branchesLoading ? (
                  <div className="px-2 py-3 text-center">
                    <Loader2
                      className="h-4 w-4 animate-spin mx-auto"
                      style={{ color: LUXE_COLORS.gold }}
                    />
                  </div>
                ) : branches.length === 0 ? (
                  <div
                    className="px-2 py-3 text-center text-sm"
                    style={{ color: LUXE_COLORS.bronze }}
                  >
                    No branches configured
                  </div>
                ) : (
                  branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id} className="hera-select-item">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" style={{ color: LUXE_COLORS.gold }} />
                        <div className="flex flex-col">
                          <span className="font-medium">{branch.name}</span>
                          {branch.code && <span className="text-xs opacity-60">{branch.code}</span>}
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
              <SelectTrigger
                className="w-[180px] transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: `${LUXE_COLORS.black}CC`,
                  borderColor: LUXE_COLORS.bronze,
                  color: LUXE_COLORS.champagne
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = LUXE_COLORS.gold
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${LUXE_COLORS.gold}20`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = LUXE_COLORS.bronze
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">
                  All appointments
                </SelectItem>
                <SelectItem value="today" className="hera-select-item">
                  Today
                </SelectItem>
                <SelectItem value="tomorrow" className="hera-select-item">
                  Tomorrow
                </SelectItem>
                <SelectItem value="week" className="hera-select-item">
                  Next 7 days
                </SelectItem>
                <SelectItem value="custom" className="hera-select-item">
                  Custom date...
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Date Picker */}
            {dateFilter === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      backgroundColor: `${LUXE_COLORS.black}CC`,
                      borderColor: LUXE_COLORS.bronze,
                      color: LUXE_COLORS.champagne
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = LUXE_COLORS.gold
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${LUXE_COLORS.gold}20`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = LUXE_COLORS.bronze
                      e.currentTarget.style.boxShadow = ''
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" style={{ color: LUXE_COLORS.gold }} />
                    {customDate ? format(customDate, 'MMM d, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customDate}
                    onSelect={d => setCustomDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={reload}
              disabled={loading || isMoving}
              style={{ color: LUXE_COLORS.gold }}
              className="hover:opacity-80 transition-all duration-300 hover:scale-110"
              onMouseEnter={e => {
                e.currentTarget.style.color = LUXE_COLORS.champagne
                e.currentTarget.style.transform = 'rotate(180deg) scale(1.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = LUXE_COLORS.gold
                e.currentTarget.style.transform = ''
              }}
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>

            <Button
              onClick={() => router.push('/salon/appointments')}
              variant="outline"
              style={{
                backgroundColor: LUXE_COLORS.black,
                borderColor: LUXE_COLORS.bronze,
                color: LUXE_COLORS.champagne
              }}
              className="hover:opacity-80 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = LUXE_COLORS.gold
                e.currentTarget.style.boxShadow = `0 4px 16px ${LUXE_COLORS.gold}30`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = LUXE_COLORS.bronze
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              List View
            </Button>

            <Button
              onClick={() => router.push('/salon/appointments/calendar')}
              variant="outline"
              style={{
                backgroundColor: LUXE_COLORS.black,
                borderColor: LUXE_COLORS.emerald,
                color: LUXE_COLORS.champagne
              }}
              className="hover:opacity-80 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = LUXE_COLORS.gold
                e.currentTarget.style.boxShadow = `0 4px 16px ${LUXE_COLORS.gold}30`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = LUXE_COLORS.emerald
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendar View
            </Button>

            <Button
              onClick={() => router.push('/salon/appointments/new')}
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
                color: LUXE_COLORS.black,
                boxShadow: `0 4px 16px ${LUXE_COLORS.gold}40`
              }}
              className="hover:opacity-90 transition-all duration-300 font-semibold hover:scale-105 hover:shadow-2xl"
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                e.currentTarget.style.boxShadow = `0 8px 24px ${LUXE_COLORS.gold}60`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = `0 4px 16px ${LUXE_COLORS.gold}40`
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>
      </header>

      {/* Active Filters Indicator */}
      {branchId && branchId !== 'all' && (
        <div
          className="px-6 py-2 flex items-center gap-2 animate-slideDown"
          style={{ backgroundColor: `${LUXE_COLORS.charcoal}CC` }}
        >
          <span className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Active Filters:
          </span>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105"
            style={{
              background: `${LUXE_COLORS.gold}20`,
              border: `1px solid ${LUXE_COLORS.gold}40`,
              boxShadow: `0 2px 8px ${LUXE_COLORS.gold}20`
            }}
          >
            {branchId && branchId !== 'all' && (
              <>
                <Building2 className="h-3 w-3" style={{ color: LUXE_COLORS.gold }} />
                <span className="text-sm font-medium" style={{ color: LUXE_COLORS.champagne }}>
                  {branches.find(b => b.id === branchId)?.name || branchId}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden">
        <Board
          cardsByColumn={cardsByColumn}
          onMove={moveCard}
          onCardAction={handleCardAction}
          onMoveToNext={handleMoveToNext}
          loading={loading}
          isMoving={isMoving}
        />
      </div>

      {/* Reschedule panel */}
      <ReschedulePanel
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        appointment={selectedCard}
        organization_id={SALON_ORG_ID}
        branch_id={
          branchId && branchId !== 'all'
            ? branchId
            : branches.length > 0
              ? branches[0].id
              : undefined
        }
        branches={branches}
        staff={[
          { id: 'staff1', name: 'Sarah' },
          { id: 'staff2', name: 'Emma' },
          { id: 'staff3', name: 'Lisa' }
        ]}
        currentUserId={userId || 'demo-user'}
      />

      {/* New Draft Modal */}
      <Dialog open={draftModalOpen} onOpenChange={setDraftModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Draft Appointment</DialogTitle>
            <DialogDescription>
              Create a draft appointment that can be confirmed later
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={draftForm.customer_name}
                onChange={e => setDraftForm(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label>Service *</Label>
              <Input
                value={draftForm.service_name}
                onChange={e => setDraftForm(prev => ({ ...prev, service_name: e.target.value }))}
                placeholder="Enter service name"
              />
            </div>

            <div className="space-y-2">
              <Label>Staff Member (optional)</Label>
              <Input
                value={draftForm.staff_name}
                onChange={e => setDraftForm(prev => ({ ...prev, staff_name: e.target.value }))}
                placeholder="Enter staff name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={draftForm.start_time}
                  onChange={e => setDraftForm(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={draftForm.duration}
                  onChange={e => setDraftForm(prev => ({ ...prev, duration: e.target.value }))}
                  min="15"
                  step="15"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setDraftModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCreateDraft}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                Create Draft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment for {cardToCancel?.customer_name}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Cancellation Type *</Label>
              <Select
                value={cancellationType}
                onValueChange={(value: any) => setCancellationType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_show">No Show</SelectItem>
                  <SelectItem value="customer_request">Customer Request</SelectItem>
                  <SelectItem value="staff_unavailable">Staff Unavailable</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional Notes (optional)</Label>
              <Textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Add any additional details..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCancelModalOpen(false)
                  setCardToCancel(null)
                  setCancelReason('')
                  setCancellationType('customer_request')
                }}
                className="flex-1"
              >
                Keep Appointment
              </Button>
              <Button onClick={handleCancelConfirm} variant="destructive" className="flex-1">
                Cancel Appointment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
