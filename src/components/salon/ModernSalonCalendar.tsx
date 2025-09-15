'use client'

import React, { useState, useMemo } from 'react'
import { SimpleCalendar } from '@/components/calendar/SimpleCalendar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Palette
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ModernSalonCalendarProps {
  className?: string
  onNewBooking?: () => void
}

export function ModernSalonCalendar({ className, onNewBooking }: ModernSalonCalendarProps) {
  const { currentOrganization } = useMultiOrgAuth()
  const [selectedView, setSelectedView] = useState<'day' | 'week' | 'month'>('week')
  const [selectedStylist, setSelectedStylist] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Sample stylists
  const stylists = [
    { id: 'all', name: 'All Stylists', avatar: 'A', color: 'bg-gray-9000' },
    { id: 'rocky', name: 'Rocky', avatar: 'R', color: 'bg-purple-500', available: true },
    { id: 'vinay', name: 'Vinay', avatar: 'V', color: 'bg-blue-500', available: true },
    { id: 'maya', name: 'Maya', avatar: 'M', color: 'bg-pink-500', available: false },
    { id: 'sophia', name: 'Sophia', avatar: 'S', color: 'bg-amber-500', available: true }
  ]

  // Sample events with service types
  const events = useMemo(
    () => [
      {
        id: '1',
        title: 'Brazilian Blowout - Sarah J.',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
        backgroundColor: '#8b5cf6',
        extendedProps: {
          service: 'brazilian',
          stylist: 'Rocky',
          client: 'Sarah Johnson',
          vip: 'platinum',
          price: 'AED 500'
        }
      },
      {
        id: '2',
        title: 'Premium Cut & Style - Emma D.',
        start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000).toISOString(),
        backgroundColor: '#14b8a6',
        extendedProps: {
          service: 'cut',
          stylist: 'Vinay',
          client: 'Emma Davis',
          vip: 'gold',
          price: 'AED 150'
        }
      },
      {
        id: '3',
        title: 'Bridal Package - Aisha K.',
        start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
        backgroundColor: '#ec4899',
        extendedProps: {
          service: 'bridal',
          stylist: 'Sophia',
          client: 'Aisha Khan',
          vip: 'regular',
          price: 'AED 800'
        }
      }
    ],
    []
  )

  // Quick stats
  const todayStats = {
    appointments: 8,
    revenue: 'AED 2,350',
    newClients: 3,
    vipClients: 2
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Modern Header */}
      <div className="bg-background dark:bg-muted rounded-xl border border-border dark:border-border p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-100 dark:text-foreground">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* View Switcher */}
            <Tabs value={selectedView} onValueChange={(v: any) => setSelectedView(v)}>
              <TabsList className="bg-muted dark:bg-background">
                <TabsTrigger
                  value="day"
                  className="data-[state=active]:bg-background dark:data-[state=active]:bg-muted"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Day
                </TabsTrigger>
                <TabsTrigger
                  value="week"
                  className="data-[state=active]:bg-background dark:data-[state=active]:bg-muted"
                >
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Week
                </TabsTrigger>
                <TabsTrigger
                  value="month"
                  className="data-[state=active]:bg-background dark:data-[state=active]:bg-muted"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Month
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-64 rounded-lg"
              />
            </div>

            {/* Filter Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-lg"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {selectedStylist !== 'all' && (
                <Badge className="ml-2 bg-pink-100 text-pink-800">1</Badge>
              )}
            </Button>

            {/* New Appointment Button */}
            <Button
              onClick={onNewBooking}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-foreground rounded-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border dark:border-border">
            <div className="flex flex-wrap items-center gap-4">
              {/* Stylist Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stylist:
                </span>
                <Select value={selectedStylist} onValueChange={setSelectedStylist}>
                  <SelectTrigger className="w-48 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stylists.map(stylist => (
                      <SelectItem key={stylist.id} value={stylist.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarFallback className={cn(stylist.color, 'text-foreground text-xs')}>
                              {stylist.avatar}
                            </AvatarFallback>
                          </Avatar>
                          {stylist.name}
                          {stylist.available !== undefined && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'ml-auto text-xs',
                                stylist.available
                                  ? 'border-green-500 text-green-700'
                                  : 'border-gray-400 text-muted-foreground'
                              )}
                            >
                              {stylist.available ? 'Available' : 'Busy'}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Service:
                </span>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="brazilian">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-600" />
                        Brazilian Blowout
                      </div>
                    </SelectItem>
                    <SelectItem value="cut">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-teal-600" />
                        Cut & Style
                      </div>
                    </SelectItem>
                    <SelectItem value="color">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-rose-600" />
                        Color & Highlights
                      </div>
                    </SelectItem>
                    <SelectItem value="bridal">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-pink-600" />
                        Bridal Package
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* VIP Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Client Type:
                </span>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    <SelectItem value="platinum">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        Platinum VIP
                      </div>
                    </SelectItem>
                    <SelectItem value="gold">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-600" />
                        Gold VIP
                      </div>
                    </SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/10 border-pink-200 dark:border-pink-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-700 dark:text-pink-300">
                  Today's Bookings
                </p>
                <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                  {todayStats.appointments}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-pink-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Revenue</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {todayStats.revenue}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  New Clients
                </p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {todayStats.newClients}
                </p>
              </div>
              <Users className="w-8 h-8 text-amber-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  VIP Clients
                </p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {todayStats.vipClients}
                </p>
              </div>
              <Crown className="w-8 h-8 text-emerald-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Calendar */}
      <Card className="bg-background dark:bg-muted border-border dark:border-border overflow-hidden">
        <CardContent className="p-0">
          <SimpleCalendar events={events} className="modern-salon-calendar" />
        </CardContent>
      </Card>

      {/* Quick Actions Footer */}
      <div className="flex items-center justify-between bg-background dark:bg-muted rounded-xl border border-border dark:border-border p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground dark:text-muted-foreground">
            <Clock className="w-4 h-4 mr-2" />
            Working Hours
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground dark:text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2" />
            Salon Location
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground dark:text-muted-foreground">
            <List className="w-4 h-4 mr-2" />
            Export Schedule
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Phone className="w-4 h-4 mr-2" />
            Call Client
          </Button>
          <Button variant="outline" size="sm">
            <Video className="w-4 h-4 mr-2" />
            Virtual Consultation
          </Button>
        </div>
      </div>
    </div>
  )
}
