// ============================================================================
// HERA • Salon Appointments Kanban Page with DRAFT support
// ============================================================================

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { format, startOfToday } from 'date-fns'
import { Plus, Calendar, RefreshCw } from 'lucide-react'
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
import { useKanbanPlaybook } from '@/hooks/useKanbanPlaybook'
import { KanbanCard } from '@/schemas/kanban'
import { SalonAuthGuard } from '@/components/salon/auth/SalonAuthGuard'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useAppointmentsPlaybook } from '@/hooks/useAppointmentsPlaybook'

// Salon organization ID
const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

// Mock branch hook - replace with actual branch management
const useBranch = () => ({
  currentBranch: {
    id: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
    name: 'Hair Talkz • Park Regis Kris Kin (Karama)'
  },
  branches: [
    {
      id: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
      name: 'Hair Talkz • Park Regis Kris Kin (Karama)'
    }
  ]
})

export default function KanbanPage() {
  const router = useRouter()
  const { user, organization } = useHERAAuth()
  const { currentBranch, branches } = useBranch()
  const { toast } = useToast()
  // Initialize with today's date
  const [date, setDate] = useState(() => startOfToday())
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

  const {
    cards,
    cardsByColumn,
    loading,
    isMoving,
    moveCard,
    createDraft,
    cancelAppointment,
    reload,
    canTransition
  } = useKanbanPlaybook({
    organization_id: SALON_ORG_ID,
    branch_id: currentBranch.id,
    date: format(date, 'yyyy-MM-dd'),
    userId: userId || 'demo-user'
  })

  const handleCardAction = useCallback(
    async (card: KanbanCard, action: string) => {
      switch (action) {
        case 'confirm':
          // Move to BOOKED column
          const bookedCards = cardsByColumn.BOOKED
          await moveCard(card.id, 'BOOKED', bookedCards.length)
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
    [moveCard, cardsByColumn, cancelAppointment]
  )

  const handleCreateDraft = async () => {
    const { customer_name, service_name, staff_name, start_time, duration } = draftForm

    if (!customer_name || !service_name || !start_time) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    const [hours, minutes] = start_time.split(':').map(Number)
    const start = new Date(date)
    start.setHours(hours, minutes, 0, 0)

    const end = new Date(start)
    end.setMinutes(end.getMinutes() + parseInt(duration))

    await createDraft({
      customer_id: 'draft-' + Date.now(), // Mock ID
      customer_name,
      service_id: 'service-' + Date.now(),
      service_name,
      staff_id: staff_name ? 'staff-' + Date.now() : undefined,
      staff_name: staff_name || undefined,
      start: start.toISOString(),
      end: end.toISOString()
    })

    setDraftModalOpen(false)
    setDraftForm({
      customer_name: '',
      service_name: '',
      staff_name: '',
      start_time: '',
      duration: '60'
    })
  }

  const handleCancelConfirm = async () => {
    if (!cardToCancel) return

    await cancelAppointment(cardToCancel.id, cancelReason || undefined)
    setCancelModalOpen(false)
    setCardToCancel(null)
    setCancelReason('')
  }

  return (
    <SalonAuthGuard requiredRoles={['Owner', 'Receptionist', 'Administrator']}>
      <div
        className="h-screen flex flex-col"
        style={{ background: 'linear-gradient(135deg, #0B0B0B 0%, #1A1A1A 100%)' }}
      >
        {/* Luxe header */}
        <header
          className="px-6 py-4 shadow-xl"
          style={{ backgroundColor: '#1A1A1A', borderBottom: '1px solid #D4AF3740' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1
                className="text-2xl font-light tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, #F5E6C8 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Appointments • {currentBranch.name}
              </h1>

              {/* Date picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                    style={{
                      backgroundColor: '#0B0B0B',
                      borderColor: '#8C7853',
                      color: '#F5E6C8'
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(date, 'EEEE, MMMM d')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={d => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={reload}
                disabled={loading || isMoving}
                style={{ color: '#D4AF37' }}
                className="hover:opacity-80"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>

              <Button
                onClick={() => router.push('/salon/appointments/new')}
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                  color: '#0B0B0B'
                }}
                className="hover:opacity-90 transition-opacity font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </div>
          </div>
        </header>

        {/* Kanban board */}
        <div className="flex-1 overflow-hidden">
          <Board
            cardsByColumn={cardsByColumn}
            onMove={moveCard}
            onCardAction={handleCardAction}
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
          branch_id={currentBranch.id}
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
                <Button
                  variant="outline"
                  onClick={() => setDraftModalOpen(false)}
                  className="flex-1"
                >
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
    </SalonAuthGuard>
  )
}
