'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Phone,
  Mail,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Timer,
  MapPin,
  MessageSquare,
  DollarSign,
  UserCheck,
  History
} from 'lucide-react'
import { formatDate, isTodaySafe } from '@/lib/date-utils'
import { addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns'

interface Reservation {
  id: string
  table_id: string
  table_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  party_size: number
  reservation_date: string
  reservation_time: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show'
  special_requests?: string
  deposit_amount?: number
  deposit_paid?: boolean
  created_at: string
  confirmed_at?: string
  seated_at?: string
  completed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
}

interface TableReservationsProps {
  tables: any[]
  onReservationUpdate: () => void
}

export function TableReservations({ tables, onReservationUpdate }: TableReservationsProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTable, setFilterTable] = useState<string>('all')
  
  // Form state
  const [formData, setFormData] = useState({
    table_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    party_size: 2,
    reservation_date: formatDate(new Date(), 'yyyy-MM-dd'),
    reservation_time: '19:00',
    duration_minutes: 120,
    special_requests: '',
    deposit_amount: 0
  })

  // Load reservations
  const loadReservations = async () => {
    try {
      const response = await fetch('/api/v1/restaurant/reservations')
      const result = await response.json()
      
      if (result.success) {
        setReservations(result.data || [])
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Error loading reservations:', error)
      toast.error('Failed to load reservations')
    }
  }

  useEffect(() => {
    loadReservations()
  }, [])

  // Filter reservations
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reservation.customer_phone.includes(searchQuery) ||
                         reservation.table_number.includes(searchQuery)
    const matchesStatus = filterStatus === 'all' || reservation.status === filterStatus
    const matchesTable = filterTable === 'all' || reservation.table_id === filterTable
    const matchesDate = viewMode === 'day' ? isSameDay(parseISO(reservation.reservation_date), selectedDate) :
                       viewMode === 'week' ? reservation.reservation_date >= formatDate(startOfWeek(selectedDate), 'yyyy-MM-dd') &&
                                            reservation.reservation_date <= formatDate(endOfWeek(selectedDate), 'yyyy-MM-dd') :
                       true // For month view, show all
    
    return matchesSearch && matchesStatus && matchesTable && matchesDate
  })

  // CRUD Operations
  const createReservation = async () => {
    try {
      const response = await fetch('/api/v1/restaurant/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('Reservation created successfully')
        setIsAddDialogOpen(false)
        resetForm()
        loadReservations()
        onReservationUpdate()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Failed to create reservation')
    }
  }

  const updateReservationStatus = async (reservationId: string, status: string) => {
    try {
      const response = await fetch(`/api/v1/restaurant/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success(`Reservation ${status}`)
        loadReservations()
        onReservationUpdate()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Failed to update reservation')
    }
  }

  const cancelReservation = async (reservationId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/v1/restaurant/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'cancelled',
          cancellation_reason: reason 
        })
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('Reservation cancelled')
        loadReservations()
        onReservationUpdate()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Failed to cancel reservation')
    }
  }

  // Helper functions
  const resetForm = () => {
    setFormData({
      table_id: '',
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      party_size: 2,
      reservation_date: formatDate(new Date(), 'yyyy-MM-dd'),
      reservation_time: '19:00',
      duration_minutes: 120,
      special_requests: '',
      deposit_amount: 0
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      seated: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getAvailableTables = (date: string, time: string, duration: number) => {
    // Filter tables that don't have conflicting reservations
    return tables.filter(table => {
      const conflictingReservation = reservations.find(res => {
        if (res.table_id !== table.id || res.status === 'cancelled') return false
        if (res.reservation_date !== date) return false
        
        // Check time overlap
        const resStart = parseInt(res.reservation_time.split(':')[0]) * 60 + parseInt(res.reservation_time.split(':')[1])
        const resEnd = resStart + res.duration_minutes
        const newStart = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])
        const newEnd = newStart + duration
        
        return (newStart < resEnd && newEnd > resStart)
      })
      
      return !conflictingReservation
    })
  }

  // Calendar view
  const renderCalendarView = () => {
    if (viewMode === 'day') {
      return (
        <div className="space-y-4">
          {/* Time slots */}
          {Array.from({ length: 14 }, (_, i) => i + 9).map(hour => (
            <div key={hour} className="flex items-start space-x-4">
              <div className="w-16 text-sm text-gray-500 pt-2">
                {hour}:00
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {filteredReservations
                  .filter(res => parseInt(res.reservation_time.split(':')[0]) === hour)
                  .map(reservation => (
                    <div
                      key={reservation.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        reservation.status === 'confirmed' ? 'bg-blue-50 border-blue-200' :
                        reservation.status === 'seated' ? 'bg-green-50 border-green-200' :
                        reservation.status === 'cancelled' ? 'bg-red-50 border-red-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => {
                        setSelectedReservation(reservation)
                        setIsDetailsDialogOpen(true)
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">Table {reservation.table_number}</span>
                        <Badge className={getStatusBadge(reservation.status)} variant="secondary">
                          {reservation.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <Users className="w-3 h-3" />
                          <span>{reservation.party_size} guests</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>{reservation.reservation_time} ({reservation.duration_minutes}min)</span>
                        </div>
                        <div className="text-xs font-medium truncate">{reservation.customer_name}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )
    }
    
    return null // Week and month views would be implemented similarly
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Reservations</h3>
            <p className="text-sm text-gray-600 mt-1">Manage table reservations and bookings</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => setViewMode('day')} className={viewMode === 'day' ? 'bg-gray-100' : ''}>
              Day
            </Button>
            <Button variant="outline" onClick={() => setViewMode('week')} className={viewMode === 'week' ? 'bg-gray-100' : ''}>
              Week
            </Button>
            <Button variant="outline" onClick={() => setViewMode('month')} className={viewMode === 'month' ? 'bg-gray-100' : ''}>
              Month
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Reservation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>New Reservation</DialogTitle>
                  <DialogDescription>
                    Create a new table reservation
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reservation_date">Date</Label>
                      <Input
                        id="reservation_date"
                        type="date"
                        value={formData.reservation_date}
                        onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reservation_time">Time</Label>
                      <Input
                        id="reservation_time"
                        type="time"
                        value={formData.reservation_time}
                        onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="party_size">Party Size</Label>
                      <Input
                        id="party_size"
                        type="number"
                        value={formData.party_size}
                        onChange={(e) => setFormData({ ...formData, party_size: parseInt(e.target.value) })}
                        min="1"
                        max="20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                      <Input
                        id="duration_minutes"
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                        min="30"
                        max="480"
                        step="30"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="table_id">Table</Label>
                    <select
                      id="table_id"
                      value={formData.table_id}
                      onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a table</option>
                      {getAvailableTables(formData.reservation_date, formData.reservation_time, formData.duration_minutes).map(table => (
                        <option key={table.id} value={table.id}>
                          Table {table.table_number} (Capacity: {table.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="customer_name">Customer Name</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_phone">Phone</Label>
                      <Input
                        id="customer_phone"
                        value={formData.customer_phone}
                        onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_email">Email (optional)</Label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="special_requests">Special Requests</Label>
                    <Input
                      id="special_requests"
                      value={formData.special_requests}
                      onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                      placeholder="Allergies, celebrations, preferences..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deposit_amount">Deposit Amount (optional)</Label>
                    <Input
                      id="deposit_amount"
                      type="number"
                      value={formData.deposit_amount}
                      onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createReservation}>
                    Create Reservation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-lg font-medium">
              {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            {!isTodaySafe(selectedDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Input
              placeholder="Search reservations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="seated">Seated</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
        </div>
      </Card>
      
      {/* Calendar View */}
      <Card className="p-6">
        {renderCalendarView()}
      </Card>
      
      {/* Reservation Details Dialog */}
      {selectedReservation && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Reservation Details</DialogTitle>
              <DialogDescription>
                Table {selectedReservation.table_number} • {formatDate(parseISO(selectedReservation.reservation_date), 'MMM d, yyyy')} at {selectedReservation.reservation_time}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={getStatusBadge(selectedReservation.status)}>
                  {selectedReservation.status}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{selectedReservation.customer_name}</p>
                    <p className="text-sm text-gray-600">{selectedReservation.party_size} guests</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-sm">{selectedReservation.customer_phone}</p>
                </div>
                
                {selectedReservation.customer_email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-sm">{selectedReservation.customer_email}</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Timer className="w-4 h-4 text-gray-400" />
                  <p className="text-sm">{selectedReservation.duration_minutes} minutes</p>
                </div>
                
                {selectedReservation.special_requests && (
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-sm">{selectedReservation.special_requests}</p>
                  </div>
                )}
                
                {(selectedReservation.deposit_amount || 0) > 0 && (
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <p className="text-sm">
                      Deposit: ${selectedReservation.deposit_amount}
                      {selectedReservation.deposit_paid && (
                        <Badge className="ml-2 bg-green-100 text-green-800">Paid</Badge>
                      )}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t space-y-2">
                {selectedReservation.status === 'pending' && (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => {
                        updateReservationStatus(selectedReservation.id, 'confirmed')
                        setIsDetailsDialogOpen(false)
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Reservation
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        cancelReservation(selectedReservation.id)
                        setIsDetailsDialogOpen(false)
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Reservation
                    </Button>
                  </>
                )}
                
                {selectedReservation.status === 'confirmed' && (
                  <>
                    <Button
                      className="w-full"
                      onClick={() => {
                        updateReservationStatus(selectedReservation.id, 'seated')
                        setIsDetailsDialogOpen(false)
                      }}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Mark as Seated
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        updateReservationStatus(selectedReservation.id, 'no_show')
                        setIsDetailsDialogOpen(false)
                      }}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Mark as No Show
                    </Button>
                  </>
                )}
                
                {selectedReservation.status === 'seated' && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      updateReservationStatus(selectedReservation.id, 'completed')
                      setIsDetailsDialogOpen(false)
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Reservation
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}