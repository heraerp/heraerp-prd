'use client'

import React, { useState } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { AirlineTeamsSidebar } from '@/components/airline-progressive/AirlineTeamsSidebar'
import { 
  Search, Calendar, Users, MapPin, Plane, ArrowRight, 
  ChevronLeft, ChevronRight, Filter, TrendingUp, Clock,
  Wifi, Coffee, Briefcase, Baby, AccessibilityIcon,
  DollarSign, Star, Shield, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function FlightSearchPage() {
  const { user, workspace } = useMultiOrgAuth()
  const [searchType, setSearchType] = useState<'roundtrip' | 'oneway' | 'multicity'>('roundtrip')
  const [showFilters, setShowFilters] = useState(false)

  // Sample flight results
  const flightResults = [
    {
      id: 'AA101',
      airline: 'American Airlines',
      departure: 'JFK',
      arrival: 'LAX',
      departureTime: '08:00',
      arrivalTime: '11:30',
      duration: '5h 30m',
      stops: 'Nonstop',
      price: 299,
      originalPrice: 399,
      class: 'Economy',
      lotteryEligible: true,
      amenities: ['wifi', 'meals', 'entertainment'],
      co2: '142 kg',
      onTimeRate: '94%'
    },
    {
      id: 'UA456',
      airline: 'United Airlines',
      departure: 'JFK',
      arrival: 'LAX',
      departureTime: '10:15',
      arrivalTime: '13:55',
      duration: '5h 40m',
      stops: 'Nonstop',
      price: 325,
      class: 'Economy',
      lotteryEligible: true,
      amenities: ['wifi', 'entertainment'],
      co2: '138 kg',
      onTimeRate: '92%'
    },
    {
      id: 'DL789',
      airline: 'Delta Airlines',
      departure: 'JFK',
      arrival: 'LAX',
      departureTime: '14:30',
      arrivalTime: '18:15',
      duration: '5h 45m',
      stops: 'Nonstop',
      price: 279,
      originalPrice: 379,
      class: 'Economy',
      lotteryEligible: true,
      amenities: ['wifi', 'meals', 'entertainment', 'power'],
      co2: '145 kg',
      onTimeRate: '96%'
    }
  ]

  // Calendar dates for price view
  const calendarDates = [
    { date: 'Dec 15', price: 299, day: 'Fri' },
    { date: 'Dec 16', price: 325, day: 'Sat' },
    { date: 'Dec 17', price: 279, day: 'Sun', lowest: true },
    { date: 'Dec 18', price: 299, day: 'Mon' },
    { date: 'Dec 19', price: 345, day: 'Tue' },
    { date: 'Dec 20', price: 389, day: 'Wed' },
    { date: 'Dec 21', price: 425, day: 'Thu' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
      <AirlineTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Flight Search</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Find your perfect flight with lottery upgrade opportunities
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Lottery Active Today
                </Badge>
                <Button variant="outline" size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Recent Searches
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Search Form */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Search Flights</CardTitle>
                <CardDescription>
                  Enter your travel details to find available flights
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Trip Type Tabs */}
                <Tabs value={searchType} onValueChange={(value: any) => setSearchType(value)} className="mb-6">
                  <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="roundtrip">Round Trip</TabsTrigger>
                    <TabsTrigger value="oneway">One Way</TabsTrigger>
                    <TabsTrigger value="multicity">Multi-City</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Search Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label htmlFor="from">From</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="from"
                        placeholder="New York (JFK)"
                        className="pl-10"
                        defaultValue="New York (JFK)"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="to">To</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="to"
                        placeholder="Los Angeles (LAX)"
                        className="pl-10"
                        defaultValue="Los Angeles (LAX)"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="depart">Depart</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="depart"
                        type="date"
                        className="pl-10"
                        defaultValue="2025-12-17"
                      />
                    </div>
                  </div>
                  
                  {searchType === 'roundtrip' && (
                    <div>
                      <Label htmlFor="return">Return</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="return"
                          type="date"
                          className="pl-10"
                          defaultValue="2025-12-24"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label htmlFor="passengers">Passengers</Label>
                    <Select defaultValue="1">
                      <SelectTrigger id="passengers">
                        <Users className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Passenger</SelectItem>
                        <SelectItem value="2">2 Passengers</SelectItem>
                        <SelectItem value="3">3 Passengers</SelectItem>
                        <SelectItem value="4">4+ Passengers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="class">Cabin Class</Label>
                    <Select defaultValue="economy">
                      <SelectTrigger id="class">
                        <Briefcase className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economy">Economy</SelectItem>
                        <SelectItem value="premium">Premium Economy</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="first">First Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg">
                      <Search className="w-4 h-4 mr-2" />
                      Search Flights
                    </Button>
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="flexible" />
                      <Label htmlFor="flexible" className="text-sm">Flexible Dates (±3 days)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="lottery" defaultChecked />
                      <Label htmlFor="lottery" className="text-sm">Lottery Eligible Only</Label>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Price Calendar */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Price Calendar
                </CardTitle>
                <CardDescription>
                  Lowest prices for your selected route
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-2">
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 grid grid-cols-7 gap-2">
                    {calendarDates.map((date, index) => (
                      <div
                        key={index}
                        className={`text-center p-3 rounded-lg cursor-pointer transition-all ${
                          date.lowest 
                            ? 'bg-green-100 border-2 border-green-500' 
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <p className="text-xs text-gray-600">{date.day}</p>
                        <p className="font-medium text-sm">{date.date}</p>
                        <p className={`text-lg font-bold ${date.lowest ? 'text-green-600' : 'text-gray-900'}`}>
                          ${date.price}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Available Flights ({flightResults.length})
                </h2>
                <Select defaultValue="price">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price (Low to High)</SelectItem>
                    <SelectItem value="duration">Duration (Shortest)</SelectItem>
                    <SelectItem value="departure">Departure Time</SelectItem>
                    <SelectItem value="arrival">Arrival Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {flightResults.map((flight) => (
                <Card key={flight.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Flight Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <Badge variant="secondary">{flight.airline}</Badge>
                          <span className="text-sm text-gray-600">Flight {flight.id}</span>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {flight.onTimeRate} on-time
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{flight.departureTime}</p>
                            <p className="text-sm text-gray-600">{flight.departure}</p>
                          </div>
                          
                          <div className="flex-1">
                            <div className="relative">
                              <div className="h-px bg-gray-300"></div>
                              <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white w-6 h-6 text-gray-600" />
                            </div>
                            <p className="text-center text-sm text-gray-600 mt-2">
                              {flight.duration} • {flight.stops}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-bold">{flight.arrivalTime}</p>
                            <p className="text-sm text-gray-600">{flight.arrival}</p>
                          </div>
                        </div>
                        
                        {/* Amenities */}
                        <div className="flex items-center gap-4 mt-4">
                          {flight.amenities.includes('wifi') && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Wifi className="w-4 h-4 mr-1" />
                              Wi-Fi
                            </div>
                          )}
                          {flight.amenities.includes('meals') && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Coffee className="w-4 h-4 mr-1" />
                              Meals
                            </div>
                          )}
                          {flight.amenities.includes('power') && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Briefcase className="w-4 h-4 mr-1" />
                              Power
                            </div>
                          )}
                          <div className="flex items-center text-sm text-gray-600">
                            <Shield className="w-4 h-4 mr-1" />
                            {flight.co2} CO₂
                          </div>
                        </div>
                      </div>
                      
                      {/* Price and Action */}
                      <div className="text-right ml-8">
                        <div className="mb-2">
                          {flight.originalPrice && (
                            <p className="text-sm text-gray-500 line-through">
                              ${flight.originalPrice}
                            </p>
                          )}
                          <p className="text-3xl font-bold text-gray-900">
                            ${flight.price}
                          </p>
                          <p className="text-sm text-gray-600">{flight.class}</p>
                        </div>
                        
                        {flight.lotteryEligible && (
                          <Badge className="mb-3 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-200">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Lottery Eligible
                          </Badge>
                        )}
                        
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg">
                          Select Flight
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}