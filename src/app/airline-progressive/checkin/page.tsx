'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { AirlineTeamsSidebar } from '@/components/airline-progressive/AirlineTeamsSidebar'
import { 
  CreditCard, Search, User, Plane, Calendar, Clock, MapPin,
  QrCode, Download, Printer, Mail, MessageSquare, ChevronRight,
  Check, AlertCircle, Luggage, Users, Shield, Wifi, Coffee,
  ArrowRight, Info, CheckCircle, X, Trophy, ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AirlineCheckInPage() {
  const { user, workspace } = useAuth()
  const [searchMethod, setSearchMethod] = useState<'booking' | 'ticket' | 'frequent'>('booking')
  const [isSearching, setIsSearching] = useState(false)
  const [bookingFound, setBookingFound] = useState(false)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [boardingPassReady, setBoardingPassReady] = useState(false)

  // Mock booking data
  const mockBooking = {
    confirmationCode: 'ABC123',
    bookingReference: 'BOOK-AA101-001',
    passengers: [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        seat: '12A',
        checkedIn: false,
        tsa: true,
        boardingGroup: 'B',
        loyaltyTier: 'Gold'
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Doe',
        seat: '12B',
        checkedIn: false,
        tsa: false,
        boardingGroup: 'B',
        loyaltyTier: null
      }
    ],
    flight: {
      number: 'AA101',
      route: 'JFK → LAX',
      departure: '2025-12-17T08:00:00',
      arrival: '2025-12-17T11:30:00',
      gate: 'B24',
      terminal: '2',
      aircraft: 'Boeing 787-9',
      status: 'On Time',
      boardingTime: '07:20 AM'
    },
    lotteryStatus: {
      entered: true,
      drawTime: '2025-12-15T20:00:00',
      status: 'pending'
    }
  }

  // Seat map for seat selection
  const seatMap = {
    first: [
      ['1A', '1B', null, '1D', '1E'],
      ['2A', '2B', null, '2D', '2E']
    ],
    business: [
      ['3A', '3B', '3C', null, '3D', '3E', '3F'],
      ['4A', '4B', '4C', null, '4D', '4E', '4F'],
      ['5A', '5B', '5C', null, '5D', '5E', '5F']
    ],
    economy: [
      ['10A', '10B', '10C', null, '10D', '10E', '10F'],
      ['11A', '11B', '11C', null, '11D', '11E', '11F'],
      ['12A', '12B', '12C', null, '12D', '12E', '12F'],
      ['13A', '13B', '13C', null, '13D', '13E', '13F'],
      ['14A', '14B', '14C', null, '14D', '14E', '14F']
    ]
  }

  const handleSearch = () => {
    setIsSearching(true)
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false)
      setBookingFound(true)
    }, 1500)
  }

  const handleCheckIn = () => {
    setIsCheckedIn(true)
    setBoardingPassReady(true)
  }

  const getSeatStatus = (seat: string) => {
    if (selectedSeats.includes(seat)) return 'selected'
    if (mockBooking.passengers.some(p => p.seat === seat)) return 'occupied'
    if (seat.includes('A') || seat.includes('F')) return 'window'
    if (seat.includes('C') || seat.includes('D')) return 'aisle'
    return 'middle'
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
                <h1 className="text-3xl font-bold text-gray-900">Online Check-In</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Check in 24 hours before your flight departure
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <Clock className="w-3 h-3 mr-1" />
                  Opens 24hrs Before
                </Badge>
                <Button variant="outline" size="sm">
                  <Info className="w-4 h-4 mr-2" />
                  Check-In Help
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 max-w-6xl mx-auto">
            {!bookingFound ? (
              // Search Form
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Find Your Booking</CardTitle>
                  <CardDescription>
                    Enter your booking details to check in for your flight
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={searchMethod} onValueChange={(value: any) => setSearchMethod(value)}>
                    <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
                      <TabsTrigger value="booking">Booking Reference</TabsTrigger>
                      <TabsTrigger value="ticket">Ticket Number</TabsTrigger>
                      <TabsTrigger value="frequent">Frequent Flyer</TabsTrigger>
                    </TabsList>

                    <TabsContent value="booking" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="surname">Passenger Surname</Label>
                          <Input
                            id="surname"
                            placeholder="Enter surname"
                            defaultValue="Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pnr">Booking Reference (PNR)</Label>
                          <Input
                            id="pnr"
                            placeholder="6-character code"
                            defaultValue="ABC123"
                            className="uppercase"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="ticket" className="space-y-4">
                      <div>
                        <Label htmlFor="ticket">13-Digit Ticket Number</Label>
                        <Input
                          id="ticket"
                          placeholder="e.g., 0012345678901"
                          maxLength={13}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="frequent" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ffnumber">Frequent Flyer Number</Label>
                          <Input
                            id="ffnumber"
                            placeholder="AA123456789"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ffsurname">Surname</Label>
                          <Input
                            id="ffsurname"
                            placeholder="Enter surname"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600">
                      Need help finding your booking? <a href="#" className="text-blue-600 hover:underline">Contact support</a>
                    </p>
                    <Button 
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
                    >
                      {isSearching ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Find Booking
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : !isCheckedIn ? (
              // Booking Found - Check In Process
              <>
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Booking Found!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your flight {mockBooking.flight.number} is eligible for online check-in
                  </AlertDescription>
                </Alert>

                {/* Flight Details */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Flight Details</CardTitle>
                        <CardDescription>
                          {new Date(mockBooking.flight.departure).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </CardDescription>
                      </div>
                      <Badge className={mockBooking.flight.status === 'On Time' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {mockBooking.flight.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-8 mb-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{mockBooking.flight.departure.slice(11, 16)}</p>
                        <p className="text-lg font-medium">JFK</p>
                        <p className="text-sm text-gray-600">Terminal {mockBooking.flight.terminal}</p>
                      </div>
                      
                      <div className="flex-1">
                        <div className="relative">
                          <div className="h-px bg-gray-300"></div>
                          <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-center text-sm text-gray-600 mt-2">
                          {mockBooking.flight.number} • {mockBooking.flight.aircraft}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-3xl font-bold">{mockBooking.flight.arrival.slice(11, 16)}</p>
                        <p className="text-lg font-medium">LAX</p>
                        <p className="text-sm text-gray-600">5h 30m</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">Gate</p>
                        <p className="font-semibold">{mockBooking.flight.gate}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">Boarding Time</p>
                        <p className="font-semibold">{mockBooking.flight.boardingTime}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-600">Confirmation</p>
                        <p className="font-semibold">{mockBooking.confirmationCode}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Passengers */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Passengers</CardTitle>
                    <CardDescription>
                      Select passengers to check in
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockBooking.passengers.map((passenger) => (
                        <div key={passenger.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Checkbox id={`pax-${passenger.id}`} defaultChecked />
                            <div>
                              <p className="font-medium">
                                {passenger.firstName} {passenger.lastName}
                                {passenger.loyaltyTier && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    {passenger.loyaltyTier} Member
                                  </Badge>
                                )}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span>Seat: {passenger.seat}</span>
                                <span>Group: {passenger.boardingGroup}</span>
                                {passenger.tsa && (
                                  <Badge variant="outline" className="text-xs">
                                    <Shield className="w-3 h-3 mr-1" />
                                    TSA Pre✓
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Change Seat
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Seat Selection */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Seat Selection</CardTitle>
                    <CardDescription>
                      Choose your preferred seats or keep current selection
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-500 rounded"></div>
                          <span>Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-300 rounded"></div>
                          <span>Occupied</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
                          <span>Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
                          <span>Premium</span>
                        </div>
                      </div>
                    </div>

                    <div className="max-w-md mx-auto">
                      {/* First Class */}
                      <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-2">First Class</p>
                        {seatMap.first.map((row, rowIndex) => (
                          <div key={rowIndex} className="flex items-center justify-center gap-2 mb-2">
                            {row.map((seat, seatIndex) => (
                              seat ? (
                                <button
                                  key={seatIndex}
                                  className={`w-10 h-10 text-xs font-medium rounded transition-all ${
                                    getSeatStatus(seat) === 'selected' ? 'bg-blue-500 text-white' :
                                    getSeatStatus(seat) === 'occupied' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                                    'bg-yellow-100 border-2 border-yellow-300 hover:bg-yellow-200'
                                  }`}
                                  disabled={getSeatStatus(seat) === 'occupied'}
                                >
                                  {seat}
                                </button>
                              ) : (
                                <div key={seatIndex} className="w-10"></div>
                              )
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* Business Class */}
                      <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-2">Business Class</p>
                        {seatMap.business.map((row, rowIndex) => (
                          <div key={rowIndex} className="flex items-center justify-center gap-2 mb-2">
                            {row.map((seat, seatIndex) => (
                              seat ? (
                                <button
                                  key={seatIndex}
                                  className={`w-8 h-8 text-xs font-medium rounded transition-all ${
                                    getSeatStatus(seat) === 'selected' ? 'bg-blue-500 text-white' :
                                    getSeatStatus(seat) === 'occupied' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                                    'bg-purple-100 border-2 border-purple-300 hover:bg-purple-200'
                                  }`}
                                  disabled={getSeatStatus(seat) === 'occupied'}
                                >
                                  {seat}
                                </button>
                              ) : (
                                <div key={seatIndex} className="w-8"></div>
                              )
                            ))}
                          </div>
                        ))}
                      </div>

                      {/* Economy Class */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Economy Class</p>
                        {seatMap.economy.map((row, rowIndex) => (
                          <div key={rowIndex} className="flex items-center justify-center gap-1 mb-1">
                            {row.map((seat, seatIndex) => (
                              seat ? (
                                <button
                                  key={seatIndex}
                                  className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                                    getSeatStatus(seat) === 'selected' ? 'bg-blue-500 text-white' :
                                    getSeatStatus(seat) === 'occupied' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
                                    'bg-white border-2 border-gray-300 hover:bg-gray-100'
                                  }`}
                                  disabled={getSeatStatus(seat) === 'occupied'}
                                >
                                  {seat}
                                </button>
                              ) : (
                                <div key={seatIndex} className="w-7"></div>
                              )
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Services */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Additional Services</CardTitle>
                    <CardDescription>
                      Add extra services to enhance your journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Luggage className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium">Extra Checked Bag</p>
                            <p className="text-sm text-gray-600">Add one additional checked bag (50 lbs)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">$35</span>
                          <Checkbox />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Wifi className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium">Premium Wi-Fi</p>
                            <p className="text-sm text-gray-600">High-speed internet for entire flight</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">$19</span>
                          <Checkbox />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Coffee className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium">Priority Meal Selection</p>
                            <p className="text-sm text-gray-600">Choose your meal before boarding</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">$12</span>
                          <Checkbox />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lottery Status */}
                {mockBooking.lotteryStatus.entered && (
                  <Alert className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200">
                    <Trophy className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800">You're in the Lottery!</AlertTitle>
                    <AlertDescription className="text-orange-700">
                      Your booking is entered in the upgrade lottery. Winners will be notified 36 hours before departure.
                      <span className="block mt-1 font-medium">Draw time: {new Date(mockBooking.lotteryStatus.drawTime).toLocaleString()}</span>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Check In Button */}
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => setBookingFound(false)}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Search
                  </Button>
                  <Button 
                    size="lg"
                    onClick={handleCheckIn}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
                  >
                    Complete Check-In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              // Check-In Complete - Boarding Pass
              <>
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Check-In Complete!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your boarding passes are ready. You can download or print them below.
                  </AlertDescription>
                </Alert>

                {/* Boarding Passes */}
                {mockBooking.passengers.map((passenger, index) => (
                  <Card key={passenger.id} className="mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold">HERA Airlines</h3>
                          <p className="text-blue-100">Boarding Pass</p>
                        </div>
                        <Badge className="bg-white text-blue-600">
                          {passenger.boardingGroup}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-blue-100">Passenger</p>
                          <p className="text-lg font-semibold">{passenger.firstName} {passenger.lastName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-100">Flight</p>
                          <p className="text-lg font-semibold">{mockBooking.flight.number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-100">Date</p>
                          <p className="text-lg font-semibold">Dec 17, 2025</p>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-gray-600">From</p>
                          <p className="font-semibold">JFK</p>
                          <p className="text-sm text-gray-600">New York</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">To</p>
                          <p className="font-semibold">LAX</p>
                          <p className="text-sm text-gray-600">Los Angeles</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Departure</p>
                          <p className="font-semibold">08:00 AM</p>
                          <p className="text-sm text-gray-600">Gate {mockBooking.flight.gate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Seat</p>
                          <p className="font-semibold text-2xl">{passenger.seat}</p>
                          <p className="text-sm text-gray-600">Economy</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <QrCode className="w-16 h-16" />
                          <div>
                            <p className="text-sm text-gray-600">Boarding Time</p>
                            <p className="font-semibold">{mockBooking.flight.boardingTime}</p>
                            <p className="text-sm text-gray-600">Terminal {mockBooking.flight.terminal}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Confirmation</p>
                          <p className="font-mono font-semibold">{mockBooking.confirmationCode}</p>
                          {passenger.tsa && (
                            <Badge variant="outline" className="mt-2">
                              <Shield className="w-3 h-3 mr-1" />
                              TSA Pre✓
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Boarding Pass Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                        <Download className="w-5 h-5" />
                        <span>Download PDF</span>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                        <Printer className="w-5 h-5" />
                        <span>Print</span>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                        <Mail className="w-5 h-5" />
                        <span>Email</span>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        <span>Text to Phone</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-8 text-center">
                  <Button 
                    onClick={() => window.location.href = '/airline/bookings'}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
                  >
                    View All Bookings
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}