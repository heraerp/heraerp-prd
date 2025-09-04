'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/hera-salon/Button'
import { Input } from '@/components/ui/hera-salon/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/hera-salon/Card'
import { Badge } from '@/components/ui/hera-salon/Badge'
import { Alert, AlertDescription } from '@/components/ui/hera-salon/Alert'
import { Label } from '@/components/ui/hera-salon/Label'
import { 
  Calendar,
  Clock,
  User,
  Scissors,
  Search,
  Plus,
  Filter,
  RefreshCw,
  CalendarCheck,
  CalendarX,
  Heart,
  Sparkles,
  Star,
  Phone,
  Mail,
  MapPin,
  ChevronRight
} from 'lucide-react'
import { formatCurrency, formatDuration } from '@/lib/utils-hera-salon'

interface Booking {
  id: string
  clientName: string
  clientEmail: string
  clientPhone: string
  service: string
  serviceCategory: 'hair' | 'spa' | 'nails' | 'bridal'
  stylist: string
  date: string
  time: string
  duration: number
  price: number
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  vip: boolean
  notes?: string
}

type ViewState = 'loading' | 'empty' | 'populated' | 'error'

export default function HERASalonBookings() {
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Sample booking data
  const sampleBookings: Booking[] = [
    {
      id: '1',
      clientName: 'Sarah Johnson',
      clientEmail: 'sarah@example.com',
      clientPhone: '+1 (555) 123-4567',
      service: 'Brazilian Blowout + Deep Conditioning',
      serviceCategory: 'hair',
      stylist: 'Maya Rodriguez',
      date: '2024-01-15',
      time: '10:00 AM',
      duration: 270, // 4.5 hours
      price: 545,
      status: 'confirmed',
      vip: true,
      notes: 'Client prefers organic products, sensitive scalp'
    },
    {
      id: '2',
      clientName: 'Emma Davis',
      clientEmail: 'emma.davis@example.com',
      clientPhone: '+1 (555) 987-6543',
      service: 'Luxury Facial + Spa Package',
      serviceCategory: 'spa',
      stylist: 'Isabella Chen',
      date: '2024-01-15',
      time: '2:00 PM',
      duration: 120, // 2 hours
      price: 285,
      status: 'confirmed',
      vip: false
    },
    {
      id: '3',
      clientName: 'Victoria Martinez',
      clientEmail: 'victoria.m@example.com',
      clientPhone: '+1 (555) 456-7890',
      service: 'Complete Bridal Package',
      serviceCategory: 'bridal',
      stylist: 'Sofia Williams',
      date: '2024-01-16',
      time: '9:00 AM',
      duration: 360, // 6 hours
      price: 850,
      status: 'pending',
      vip: true,
      notes: 'Wedding on Saturday, trial run needed'
    },
    {
      id: '4',
      clientName: 'Amanda Foster',
      clientEmail: 'amanda.foster@example.com',
      clientPhone: '+1 (555) 321-0987',
      service: 'Gel Manicure + Pedicure',
      serviceCategory: 'nails',
      stylist: 'Lucia Santos',
      date: '2024-01-14',
      time: '4:00 PM',
      duration: 90, // 1.5 hours
      price: 125,
      status: 'completed',
      vip: false
    }
  ]

  // Simulate different loading states
  useEffect(() => {
    const timer = setTimeout(() => {
      setViewState('populated')
      setBookings(sampleBookings)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const switchToState = (state: ViewState) => {
    setViewState('loading')
    setTimeout(() => {
      setViewState(state)
      if (state === 'populated') {
        setBookings(sampleBookings)
      } else {
        setBookings([])
      }
    }, 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'destructive'
      case 'completed':
        return 'teal'
      default:
        return 'secondary'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hair':
        return <Scissors className="w-4 h-4" />
      case 'spa':
        return <Sparkles className="w-4 h-4" />
      case 'nails':
        return <Heart className="w-4 h-4" />
      case 'bridal':
        return <Star className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.stylist.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-hera-bg-50 dark:bg-hera-bg">
      
      {/* Header */}
      <div className="bg-white dark:bg-hera-card border-b border-hera-line-200 dark:border-hera-border">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-hera-primary-500 to-hera-pink-500 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="hera-h1">Bookings</h1>
                <p className="hera-subtle">Manage your salon appointments</p>
              </div>
            </div>
            <Button leftIcon={<Plus />}>
              New Booking
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        
        {/* State Toggle Buttons (for demo) */}
        <Card className="mb-8 border-hera-teal-200 bg-hera-teal-50 dark:bg-hera-teal-950/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-hera-teal-800 dark:text-hera-teal-200">
              Demo State Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={viewState === 'loading' ? 'primary' : 'outline'}
                onClick={() => switchToState('loading')}
              >
                Loading State
              </Button>
              <Button
                size="sm"
                variant={viewState === 'empty' ? 'primary' : 'outline'}
                onClick={() => switchToState('empty')}
              >
                Empty State
              </Button>
              <Button
                size="sm"
                variant={viewState === 'populated' ? 'primary' : 'outline'}
                onClick={() => switchToState('populated')}
              >
                Populated State
              </Button>
              <Button
                size="sm"
                variant={viewState === 'error' ? 'primary' : 'outline'}
                onClick={() => switchToState('error')}
              >
                Error State
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        {(viewState === 'populated' || viewState === 'loading') && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search bookings..."
                    leftIcon={<Search />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-2 rounded-md border border-hera-line-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-hera-primary-400"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <Button variant="outline" size="sm" leftIcon={<Filter />}>
                    More Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {viewState === 'loading' && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-hera-bg-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-hera-bg-200 rounded mb-2 w-1/3"></div>
                      <div className="h-3 bg-hera-bg-100 rounded w-1/2"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-hera-bg-200 rounded mb-2 w-16"></div>
                      <div className="h-3 bg-hera-bg-100 rounded w-12"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {viewState === 'empty' && (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-hera-bg-100 dark:bg-hera-bg-subtle flex items-center justify-center">
                <CalendarX className="w-12 h-12 text-hera-ink-muted" />
              </div>
              <h3 className="hera-h3 mb-2">No bookings yet</h3>
              <p className="hera-body text-hera-ink-muted mb-6 max-w-sm mx-auto">
                Start accepting appointments from your clients. Create your first booking to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button leftIcon={<Plus />}>
                  Create First Booking
                </Button>
                <Button variant="outline" leftIcon={<RefreshCw />}>
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {viewState === 'error' && (
          <Alert variant="destructive">
            <AlertDescription>
              Unable to load bookings. Please check your connection and try again.
              <Button variant="link" size="sm" className="ml-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Populated State */}
        {viewState === 'populated' && (
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Search className="w-12 h-12 text-hera-ink-muted mx-auto mb-4" />
                  <h3 className="hera-h4 mb-2">No bookings found</h3>
                  <p className="hera-body text-hera-ink-muted">
                    Try adjusting your search or filter criteria.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-hera-ink-muted">Total Today</p>
                          <p className="text-2xl font-bold text-hera-ink">
                            {bookings.filter(b => b.date === '2024-01-15').length}
                          </p>
                        </div>
                        <CalendarCheck className="w-8 h-8 text-hera-primary-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-hera-ink-muted">Revenue Today</p>
                          <p className="text-2xl font-bold text-hera-ink">
                            {formatCurrency(bookings.filter(b => b.date === '2024-01-15').reduce((sum, b) => sum + b.price, 0))}
                          </p>
                        </div>
                        <Sparkles className="w-8 h-8 text-hera-pink-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-hera-ink-muted">VIP Clients</p>
                          <p className="text-2xl font-bold text-hera-ink">
                            {bookings.filter(b => b.vip).length}
                          </p>
                        </div>
                        <Star className="w-8 h-8 text-hera-teal-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-hera-ink-muted">Avg Duration</p>
                          <p className="text-2xl font-bold text-hera-ink">
                            {formatDuration(Math.round(bookings.reduce((sum, b) => sum + b.duration, 0) / bookings.length))}
                          </p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bookings List */}
                {filteredBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-hera-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        
                        {/* Service Icon */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          booking.serviceCategory === 'hair' ? 'bg-hera-primary-100 text-hera-primary-600' :
                          booking.serviceCategory === 'spa' ? 'bg-hera-pink-100 text-hera-pink-600' :
                          booking.serviceCategory === 'nails' ? 'bg-red-100 text-red-600' :
                          'bg-hera-teal-100 text-hera-teal-600'
                        }`}>
                          {getCategoryIcon(booking.serviceCategory)}
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-hera-ink">{booking.clientName}</h3>
                                {booking.vip && (
                                  <Badge variant="pink" className="text-xs">VIP</Badge>
                                )}
                                <Badge variant={getStatusColor(booking.status) as any} className="text-xs capitalize">
                                  {booking.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-hera-ink-muted">{booking.service}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-hera-ink text-lg">
                                {formatCurrency(booking.price)}
                              </p>
                              <p className="text-sm text-hera-ink-muted">
                                {formatDuration(booking.duration)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-hera-ink-muted">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(booking.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{booking.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{booking.stylist}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{booking.clientPhone}</span>
                            </div>
                          </div>

                          {booking.notes && (
                            <div className="mt-3 p-2 bg-hera-bg-50 dark:bg-hera-bg-subtle rounded text-sm text-hera-ink-muted">
                              <strong>Notes:</strong> {booking.notes}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col space-y-2">
                          <Button size="sm" variant="ghost">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}