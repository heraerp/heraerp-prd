'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { AirlineTeamsSidebar } from '@/components/airline-progressive/AirlineTeamsSidebar'
import { 
  Plane, Calendar, Clock, MapPin, Users, CreditCard, 
  Download, Edit, X, CheckCircle, AlertCircle, Trophy,
  Mail, Phone, User, Luggage, Wifi, Coffee, Star,
  ArrowRight, ChevronRight, Filter, Search, Plus,
  Copy, Printer, Share, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AirlineBookingsPage() {
  const { user, workspace } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')

  // Mock bookings data
  const bookings = [
    {
      id: 'BOOK-AA101-001',
      confirmationCode: 'ABC123',
      bookingDate: '2025-12-10T14:30:00',
      status: 'confirmed',
      flight: {
        number: 'AA101',
        route: 'JFK → LAX',
        departure: '2025-12-17T08:00:00',
        arrival: '2025-12-17T11:30:00',
        aircraft: 'Boeing 787-9',
        duration: '5h 30m'
      },
      passengers: [
        { name: 'John Doe', seat: '12A', checkedIn: false },
        { name: 'Jane Doe', seat: '12B', checkedIn: false }
      ],
      totalAmount: 598.00,
      paymentMethod: 'Visa ****1234',
      lotteryStatus: {
        entered: true,
        drawDate: '2025-12-15T20:00:00',
        status: 'pending'
      },
      canCheckIn: true,
      canModify: true,
      canCancel: true
    },
    {
      id: 'BOOK-UA456-002',
      confirmationCode: 'XYZ789',
      bookingDate: '2025-11-28T09:15:00',
      status: 'completed',
      flight: {
        number: 'UA456',
        route: 'LAX → JFK',
        departure: '2025-12-05T22:30:00',
        arrival: '2025-12-06T07:15:00',
        aircraft: 'Boeing 737 MAX 9',
        duration: '5h 45m'
      },
      passengers: [
        { name: 'John Doe', seat: '8A', checkedIn: true }
      ],
      totalAmount: 325.00,
      paymentMethod: 'Mastercard ****5678',
      lotteryStatus: {
        entered: true,
        result: 'won',
        upgrade: 'Premium Economy',
        value: 250
      },
      canCheckIn: false,
      canModify: false,
      canCancel: false
    },
    {
      id: 'BOOK-DL789-003',
      confirmationCode: 'DEF456',
      bookingDate: '2025-12-12T16:45:00',
      status: 'pending_payment',
      flight: {
        number: 'DL789',
        route: 'JFK → MIA',
        departure: '2026-01-05T14:20:00',
        arrival: '2026-01-05T17:30:00',
        aircraft: 'Airbus A350-900',
        duration: '3h 10m'
      },
      passengers: [
        { name: 'John Doe', seat: 'Pending', checkedIn: false }
      ],
      totalAmount: 189.00,
      paymentMethod: 'Payment Required',
      canCheckIn: false,
      canModify: true,
      canCancel: true
    }
  ]

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.confirmationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.flight.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.flight.number.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700'
      case 'completed': return 'bg-gray-100 text-gray-700'
      case 'pending_payment': return 'bg-yellow-100 text-yellow-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').toUpperCase()
  }

  const handleBookingAction = (bookingId: string, action: string) => {
    console.log(`${action} for booking ${bookingId}`)
    
    switch (action) {
      case 'check_in':
        window.location.href = '/airline-progressive/checkin'
        break
      case 'manage':
        window.location.href = `/airline-progressive/bookings/${bookingId}`
        break
      case 'cancel':
        // Handle cancellation
        break
      default:
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
      <AirlineTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your flight bookings and check-in status
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => window.location.href = '/airline-progressive'}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Booking
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by confirmation code, route, or flight number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Newest First</SelectItem>
                <SelectItem value="date_asc">Oldest First</SelectItem>
                <SelectItem value="departure_desc">Departure Date</SelectItem>
                <SelectItem value="amount_desc">Amount (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto px-8">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Plane className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold">{bookings.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confirmed</p>
                    <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'confirmed').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lottery Wins</p>
                    <p className="text-2xl font-bold">{bookings.filter(b => b.lotteryStatus?.result === 'won').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold">${bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings List */}
          <div className="space-y-6">
            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Plane className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filterStatus !== 'all' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'You haven\'t made any flight bookings yet.'}
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/airline-progressive'}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Book Your First Flight
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Flight {booking.flight.number}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Booking: {booking.confirmationCode}
                          </p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {formatStatus(booking.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-2xl font-bold text-gray-900">
                          ${booking.totalAmount.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleBookingAction(booking.id, 'manage')}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Manage
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(booking.confirmationCode)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {/* Flight Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Flight Information</h4>
                        <div className="flex items-center gap-8 mb-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">
                              {new Date(booking.flight.departure).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                            <p className="text-lg font-medium">
                              {booking.flight.route.split(' → ')[0]}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.flight.departure).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          
                          <div className="flex-1">
                            <div className="relative">
                              <div className="h-px bg-gray-300"></div>
                              <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white w-6 h-6 text-gray-600" />
                            </div>
                            <p className="text-center text-sm text-gray-600 mt-2">
                              {booking.flight.duration} • {booking.flight.aircraft}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-bold">
                              {new Date(booking.flight.arrival).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                            <p className="text-lg font-medium">
                              {booking.flight.route.split(' → ')[1]}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.flight.arrival).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Passengers</h4>
                        <div className="space-y-3">
                          {booking.passengers.map((passenger, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-gray-600" />
                                <div>
                                  <p className="font-medium">{passenger.name}</p>
                                  <p className="text-sm text-gray-600">Seat: {passenger.seat}</p>
                                </div>
                              </div>
                              {passenger.checkedIn ? (
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Checked In
                                </Badge>
                              ) : booking.canCheckIn ? (
                                <Badge variant="outline">
                                  Check-in Available
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Lottery Status */}
                    {booking.lotteryStatus && (
                      <div className="mb-6">
                        {booking.lotteryStatus.result === 'won' ? (
                          <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200">
                            <Trophy className="h-4 w-4 text-orange-600" />
                            <AlertTitle className="text-orange-800">Lottery Winner! 🎉</AlertTitle>
                            <AlertDescription className="text-orange-700">
                              You won a {booking.lotteryStatus.upgrade} upgrade worth ${booking.lotteryStatus.value}! 
                              Your seat has been automatically upgraded.
                            </AlertDescription>
                          </Alert>
                        ) : booking.lotteryStatus.entered ? (
                          <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-purple-200">
                            <Star className="h-4 w-4 text-purple-600" />
                            <AlertTitle className="text-purple-800">Lottery Entry Active</AlertTitle>
                            <AlertDescription className="text-purple-700">
                              Your booking is entered in the upgrade lottery. 
                              Draw date: {new Date(booking.lotteryStatus.drawDate).toLocaleString()}
                            </AlertDescription>
                          </Alert>
                        ) : null}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Booked: {new Date(booking.bookingDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Payment: {booking.paymentMethod}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {booking.canCheckIn && (
                          <Button 
                            onClick={() => handleBookingAction(booking.id, 'check_in')}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Check In
                          </Button>
                        )}
                        {booking.canModify && (
                          <Button 
                            variant="outline"
                            onClick={() => handleBookingAction(booking.id, 'manage')}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Manage
                          </Button>
                        )}
                        <Button variant="outline">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="py-8">
            <div className="text-center">
              <Button 
                onClick={() => window.location.href = '/airline'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Book Another Flight
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}