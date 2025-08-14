'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Calendar, Clock, Users, Phone, Mail, MapPin,
  Check, X, AlertCircle, Star, ChefHat, Wine
} from 'lucide-react'

// Restaurant configuration
interface RestaurantConfig {
  name: string
  openingHours: {
    [key: string]: { open: string; close: string; closed?: boolean }
  }
  tables: Table[]
  reservationSettings: {
    maxAdvanceDays: number
    minAdvanceHours: number
    defaultDurationMinutes: number
    slotInterval: number
  }
}

interface Table {
  id: string
  number: number
  capacity: number
  location: 'indoor' | 'outdoor' | 'private'
  features: string[]
  status: 'available' | 'reserved' | 'occupied' | 'maintenance'
}

interface Reservation {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  date: string
  time: string
  partySize: number
  tableId?: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no-show'
  specialRequests?: string
  createdAt: string
}

interface TimeSlot {
  time: string
  available: boolean
  availableTables: Table[]
  totalCapacity: number
}

export default function RestaurantReservationsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedPartySize, setSelectedPartySize] = useState(2)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingData, setBookingData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    specialRequests: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Restaurant configuration
  const restaurantConfig: RestaurantConfig = {
    name: "Mario's Restaurant",
    openingHours: {
      monday: { open: '11:00', close: '22:00' },
      tuesday: { open: '11:00', close: '22:00' },
      wednesday: { open: '11:00', close: '22:00' },
      thursday: { open: '11:00', close: '22:00' },
      friday: { open: '11:00', close: '23:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '10:00', close: '21:00' }
    },
    tables: [
      { id: '1', number: 1, capacity: 2, location: 'indoor', features: ['window'], status: 'available' },
      { id: '2', number: 2, capacity: 4, location: 'indoor', features: ['booth'], status: 'available' },
      { id: '3', number: 3, capacity: 6, location: 'indoor', features: ['round'], status: 'available' },
      { id: '4', number: 4, capacity: 2, location: 'outdoor', features: ['patio'], status: 'available' },
      { id: '5', number: 5, capacity: 4, location: 'outdoor', features: ['garden'], status: 'available' },
      { id: '6', number: 6, capacity: 8, location: 'private', features: ['private dining'], status: 'available' },
      { id: '7', number: 7, capacity: 4, location: 'indoor', features: ['bar view'], status: 'available' },
      { id: '8', number: 8, capacity: 2, location: 'indoor', features: ['intimate'], status: 'available' }
    ],
    reservationSettings: {
      maxAdvanceDays: 30,
      minAdvanceHours: 2,
      defaultDurationMinutes: 90,
      slotInterval: 15
    }
  }

  useEffect(() => {
    fetchReservationsAndAvailability()
  }, [selectedDate, selectedPartySize])

  const fetchReservationsAndAvailability = async () => {
    try {
      setLoading(true)
      
      // Fetch availability from API
      const availabilityResponse = await fetch(
        `/api/v1/restaurant/reservations?action=get_availability&date=${selectedDate}&partySize=${selectedPartySize}`
      )
      
      if (availabilityResponse.ok) {
        const availabilityResult = await availabilityResponse.json()
        if (availabilityResult.success) {
          setTimeSlots(availabilityResult.data.timeSlots || [])
        }
      }
      
      // Fetch existing reservations
      const reservationsResponse = await fetch(
        `/api/v1/restaurant/reservations?action=get_reservations&date=${selectedDate}`
      )
      
      if (reservationsResponse.ok) {
        const reservationsResult = await reservationsResponse.json()
        if (reservationsResult.success) {
          setReservations(reservationsResult.data.reservations || [])
        }
      }
      
      setLoading(false)
      
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
      // Fallback to mock data
      setTimeSlots(generateFallbackTimeSlots())
      setReservations(getFallbackReservations())
      setLoading(false)
    }
  }

  const generateFallbackTimeSlots = (): TimeSlot[] => {
    const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'lowercase' })
    const dayHours = restaurantConfig.openingHours[dayOfWeek]
    
    if (dayHours?.closed) return []
    
    const slots: TimeSlot[] = []
    const startHour = parseInt(dayHours.open.split(':')[0])
    const endHour = parseInt(dayHours.close.split(':')[0])
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time: timeString,
          available: Math.random() > 0.3, // 70% availability
          availableTables: restaurantConfig.tables.filter(t => t.capacity >= selectedPartySize),
          totalCapacity: restaurantConfig.tables.reduce((sum, t) => sum + t.capacity, 0)
        })
      }
    }
    
    return slots
  }

  const getFallbackReservations = (): Reservation[] => [
    {
      id: '1',
      customerName: 'John Smith',
      customerPhone: '+1 (555) 123-4567',
      customerEmail: 'john@example.com',
      date: selectedDate,
      time: '19:00',
      partySize: 4,
      tableId: '2',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      customerName: 'Sarah Johnson',
      customerPhone: '+1 (555) 987-6543',
      customerEmail: 'sarah@example.com',
      date: selectedDate,
      time: '20:30',
      partySize: 2,
      tableId: '1',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    }
  ]

  const generateTimeSlots = (openTime: string, closeTime: string, date: string): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const startHour = parseInt(openTime.split(':')[0])
    const startMinute = parseInt(openTime.split(':')[1])
    const endHour = parseInt(closeTime.split(':')[0])
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += restaurantConfig.reservationSettings.slotInterval) {
        if (hour === startHour && minute < startMinute) continue
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const availableTables = getAvailableTablesForSlot(timeString, date)
        const totalCapacity = availableTables.reduce((sum, table) => sum + table.capacity, 0)
        
        slots.push({
          time: timeString,
          available: availableTables.length > 0 && totalCapacity >= selectedPartySize,
          availableTables,
          totalCapacity
        })
      }
    }
    
    return slots
  }

  const getAvailableTablesForSlot = (time: string, date: string): Table[] => {
    // Filter out tables that are already reserved for this time slot
    const reservedTableIds = reservations
      .filter(r => r.date === date && isTimeConflict(r.time, time))
      .map(r => r.tableId)
      .filter(Boolean)
    
    return restaurantConfig.tables
      .filter(table => 
        table.status === 'available' && 
        !reservedTableIds.includes(table.id) &&
        table.capacity >= selectedPartySize
      )
  }

  const isTimeConflict = (existingTime: string, newTime: string): boolean => {
    const existing = new Date(`2000-01-01T${existingTime}:00`)
    const newReservation = new Date(`2000-01-01T${newTime}:00`)
    const duration = restaurantConfig.reservationSettings.defaultDurationMinutes * 60 * 1000
    
    return (
      (newReservation >= existing && newReservation < new Date(existing.getTime() + duration)) ||
      (existing >= newReservation && existing < new Date(newReservation.getTime() + duration))
    )
  }

  const handleTimeSlotClick = (time: string) => {
    setSelectedTime(time)
    setShowBookingForm(true)
    // Reset form data when opening new booking
    setBookingData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      specialRequests: ''
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleReservationSubmit = async () => {
    try {
      setIsSubmitting(true)

      // Validate required fields
      if (!bookingData.customerName || !bookingData.customerPhone) {
        alert('Please fill in your name and phone number')
        return
      }

      // Submit reservation
      const response = await fetch('/api/v1/restaurant/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_reservation',
          customerName: bookingData.customerName,
          customerPhone: bookingData.customerPhone,
          customerEmail: bookingData.customerEmail,
          date: selectedDate,
          time: selectedTime,
          partySize: selectedPartySize,
          specialRequests: bookingData.specialRequests
        })
      })

      const result = await response.json()

      if (result.success) {
        // Success - show confirmation and refresh data
        alert(`Reservation confirmed! Reference: ${result.data.reservationNumber}`)
        setShowBookingForm(false)
        fetchReservationsAndAvailability() // Refresh availability
      } else {
        alert(`Reservation failed: ${result.message}`)
      }

    } catch (error) {
      console.error('Error creating reservation:', error)
      alert('Failed to create reservation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'outdoor': return <MapPin className="h-4 w-4" />
      case 'private': return <Star className="h-4 w-4" />
      default: return <ChefHat className="h-4 w-4" />
    }
  }

  const getLocationColor = (location: string) => {
    switch (location) {
      case 'outdoor': return 'bg-green-100 text-green-800'
      case 'private': return 'bg-purple-100 text-purple-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reservations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
            Table Reservations
          </h1>
          <p className="text-muted-foreground mt-2">
            Book your perfect dining experience. Effortlessly simple.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date and Party Size Selection */}
            <Card className="hera-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  Select Date & Party Size
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(Date.now() + restaurantConfig.reservationSettings.maxAdvanceDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="partySize">Party Size</Label>
                    <select
                      value={selectedPartySize}
                      onChange={(e) => setSelectedPartySize(parseInt(e.target.value))}
                      className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(size => (
                        <option key={size} value={size}>{size} {size === 1 ? 'person' : 'people'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Time Slots */}
            <Card className="hera-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Available Times - {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeSlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>We're closed on this day</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={slot.available ? 'outline' : 'ghost'}
                        disabled={!slot.available}
                        onClick={() => handleTimeSlotClick(slot.time)}
                        className={`h-12 ${
                          slot.available 
                            ? 'hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700' 
                            : 'opacity-50 cursor-not-allowed'
                        } ${selectedTime === slot.time ? 'bg-orange-100 border-orange-400' : ''}`}
                      >
                        <div className="text-center">
                          <div className="font-medium">{slot.time}</div>
                          {slot.available && (
                            <div className="text-xs text-muted-foreground">
                              {slot.availableTables.length} tables
                            </div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Form */}
            {showBookingForm && selectedTime && (
              <Card className="hera-card border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-500" />
                    Complete Your Reservation
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedPartySize} people on {new Date(selectedDate).toLocaleDateString()} at {selectedTime}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Full Name</Label>
                      <Input 
                        id="customerName" 
                        placeholder="Enter your name" 
                        className="mt-1"
                        value={bookingData.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Phone Number</Label>
                      <Input 
                        id="customerPhone" 
                        placeholder="+1 (555) 123-4567" 
                        className="mt-1"
                        value={bookingData.customerPhone}
                        onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email Address</Label>
                    <Input 
                      id="customerEmail" 
                      type="email" 
                      placeholder="your@email.com" 
                      className="mt-1"
                      value={bookingData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                    <Input 
                      id="specialRequests" 
                      placeholder="Allergies, celebration, seating preferences..." 
                      className="mt-1"
                      value={bookingData.specialRequests}
                      onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button 
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                      onClick={handleReservationSubmit}
                      disabled={isSubmitting || !bookingData.customerName || !bookingData.customerPhone}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Confirm Reservation
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowBookingForm(false)}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Restaurant Info */}
            <Card className="hera-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wine className="h-5 w-5 text-orange-500" />
                  {restaurantConfig.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium mb-2">Opening Hours</p>
                  {Object.entries(restaurantConfig.openingHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between py-1">
                      <span className="capitalize">{day}</span>
                      <span className="text-muted-foreground">
                        {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Available Tables */}
            {selectedTime && (
              <Card className="hera-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-500" />
                    Available Tables
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">For {selectedTime} on {new Date(selectedDate).toLocaleDateString()}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {timeSlots
                      .find(slot => slot.time === selectedTime)
                      ?.availableTables.map((table) => (
                        <div key={table.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            {getLocationIcon(table.location)}
                            <div>
                              <p className="font-medium">Table {table.number}</p>
                              <p className="text-sm text-muted-foreground">
                                Up to {table.capacity} people
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={getLocationColor(table.location)}>
                              {table.location}
                            </Badge>
                            {table.features.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {table.features.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Reservations */}
            <Card className="hera-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Today's Reservations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reservations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No reservations for this date
                    </p>
                  ) : (
                    reservations.map((reservation) => (
                      <div key={reservation.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{reservation.customerName}</p>
                          <Badge variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}>
                            {reservation.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {reservation.time} - {reservation.partySize} people
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {reservation.customerPhone}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}