'use client'
/**
 * HERA Salon Calendar Management Page
 * Smart Code: HERA.SALON.CALENDAR.MANAGEMENT.v1
 * 
 * Full-featured calendar management interface for salon operations
 */

import React, { useState, useEffect } from 'react'
import { SalonCalendar } from '@/components/salon/SalonCalendar'
import { SalonBookingWorkflow } from '@/components/salon/SalonBookingWorkflow'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { 
  Calendar,
  Clock,
  Users,
  Settings,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info,
  Scissors,
  MapPin,
  Star,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  List,
  Grid3x3,
  Palette,
  Moon,
  Sun,
  Bell,
  Shield,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarSettings {
  defaultView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'resourceTimeGridDay' | 'listWeek'
  slotDuration: '15' | '30' | '60'
  businessHoursStart: string
  businessHoursEnd: string
  showWeekends: boolean
  enableDragDrop: boolean
  enablePrayerTimes: boolean
  autoConfirmBookings: boolean
  sendReminders: boolean
  reminderHours: number
  bufferTimeMinutes: number
  maxAdvanceBookingDays: number
  allowDoubleBooking: boolean
  requireDeposit: boolean
  depositPercentage: number
}

export default function SalonCalendarManagementPage() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'calendar' | 'appointments' | 'resources' | 'settings'>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<CalendarSettings['defaultView']>('resourceTimeGridDay')
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [settings, setSettings] = useState<CalendarSettings>({
    defaultView: 'resourceTimeGridDay',
    slotDuration: '30',
    businessHoursStart: '10:00',
    businessHoursEnd: '21:00',
    showWeekends: true,
    enableDragDrop: true,
    enablePrayerTimes: true,
    autoConfirmBookings: false,
    sendReminders: true,
    reminderHours: 24,
    bufferTimeMinutes: 30,
    maxAdvanceBookingDays: 90,
    allowDoubleBooking: false,
    requireDeposit: true,
    depositPercentage: 30
  })

  // Sample statistics
  const stats = {
    todayAppointments: 12,
    weekAppointments: 68,
    monthRevenue: 25420,
    activeStylists: 5,
    confirmedRate: 92,
    averageServiceTime: 135
  }

  const upcomingAppointments = [
    {
      id: 1,
      time: '10:30 AM',
      client: 'Sarah Johnson',
      service: 'Brazilian Blowout',
      stylist: 'Rocky',
      duration: '4h',
      status: 'confirmed',
      vip: 'platinum'
    },
    {
      id: 2,
      time: '2:00 PM',
      client: 'Emma Davis',
      service: 'Cut & Style',
      stylist: 'Vinay',
      duration: '1.5h',
      status: 'confirmed',
      vip: 'gold'
    },
    {
      id: 3,
      time: '4:30 PM',
      client: 'Fatima Al Zahra',
      service: 'Balayage',
      stylist: 'Maya',
      duration: '3h',
      status: 'pending',
      vip: null
    }
  ]

  const resources = [
    { id: 1, name: 'Rocky', type: 'stylist', status: 'available', nextBreak: '1:00 PM' },
    { id: 2, name: 'Vinay', type: 'stylist', status: 'busy', nextBreak: '3:30 PM' },
    { id: 3, name: 'Maya', type: 'stylist', status: 'available', nextBreak: '2:00 PM' },
    { id: 4, name: 'VIP Suite 1', type: 'room', status: 'occupied', nextAvailable: '3:00 PM' },
    { id: 5, name: 'Styling Station 2', type: 'station', status: 'available', nextAvailable: 'Now' }
  ]

  const handleExportCalendar = () => {
    toast({
      title: 'Exporting Calendar',
      description: 'Your calendar data is being exported...',
    })
  }

  const handleImportBookings = () => {
    toast({
      title: 'Import Started',
      description: 'Processing booking import file...',
    })
  }

  const handleSettingChange = (key: keyof CalendarSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    toast({
      title: 'Setting Updated',
      description: 'Calendar settings have been updated.',
    })
  }

  if (!isAuthenticated || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Authentication Required</h3>
          <p className="text-gray-600 dark:text-gray-400">Please log in to access the calendar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => router.push('/salon')}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="ml-4">
                <h1 className="text-xl font-semibold !text-gray-900 dark:!text-gray-100">
                  Calendar Management
                </h1>
                <p className="text-sm !text-gray-600 dark:!text-gray-400">
                  {currentOrganization?.name || 'Salon'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleExportCalendar}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportBookings}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={() => setIsBookingOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium !text-gray-600 dark:!text-gray-400">Today</p>
                  <p className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">{stats.todayAppointments}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium !text-gray-600 dark:!text-gray-400">This Week</p>
                  <p className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">{stats.weekAppointments}</p>
                </div>
                <CalendarRange className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium !text-gray-600 dark:!text-gray-400">Revenue</p>
                  <p className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">AED {stats.monthRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium !text-gray-600 dark:!text-gray-400">Stylists</p>
                  <p className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">{stats.activeStylists}</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950 dark:to-sky-950 border-cyan-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium !text-gray-600 dark:!text-gray-400">Confirmed</p>
                  <p className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">{stats.confirmedRate}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950 border-rose-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium !text-gray-600 dark:!text-gray-400">Avg Time</p>
                  <p className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">{stats.averageServiceTime}m</p>
                </div>
                <Clock className="h-8 w-8 text-rose-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
          <TabsList className="grid grid-cols-4 w-full max-w-md mb-6">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Calendar View</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dayGridMonth">Month View</SelectItem>
                        <SelectItem value="timeGridWeek">Week View</SelectItem>
                        <SelectItem value="timeGridDay">Day View</SelectItem>
                        <SelectItem value="resourceTimeGridDay">Resource Day View</SelectItem>
                        <SelectItem value="listWeek">List View</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SalonCalendar className="min-h-[600px]" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Appointment Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Search appointments..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                    <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map(apt => (
                    <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                          <Scissors className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium !text-gray-900 dark:!text-white">{apt.client}</h4>
                            {apt.vip && (
                              <Badge variant="outline" className={
                                apt.vip === 'platinum' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'
                              }>
                                {apt.vip.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm !text-gray-600 dark:!text-gray-400">
                            {apt.service} with {apt.stylist} • {apt.time} ({apt.duration})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                          {apt.status}
                        </Badge>
                        <Button variant="outline" size="sm">Manage</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Management</CardTitle>
                <CardDescription>Manage stylists, rooms, and equipment availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.map(resource => (
                    <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          resource.type === 'stylist' ? "bg-blue-100" : "bg-gray-100"
                        )}>
                          {resource.type === 'stylist' ? 
                            <Users className="w-5 h-5 text-blue-600" /> : 
                            <MapPin className="w-5 h-5 text-gray-600" />
                          }
                        </div>
                        <div>
                          <h4 className="font-medium !text-gray-900 dark:!text-white">{resource.name}</h4>
                          <p className="text-sm !text-gray-600 dark:!text-gray-400">
                            {resource.type === 'stylist' ? 'Hair Stylist' : resource.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant={resource.status === 'available' ? 'default' : 'secondary'}>
                            {resource.status}
                          </Badge>
                          <p className="text-xs !text-gray-500 dark:!text-gray-400 mt-1">
                            {resource.nextBreak || resource.nextAvailable}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendar Settings</CardTitle>
                <CardDescription>Configure calendar behavior and business rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Business Hours */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold !text-gray-900 dark:!text-white">Business Hours</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Opening Time</Label>
                      <Input 
                        type="time" 
                        value={settings.businessHoursStart}
                        onChange={(e) => handleSettingChange('businessHoursStart', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Closing Time</Label>
                      <Input 
                        type="time" 
                        value={settings.businessHoursEnd}
                        onChange={(e) => handleSettingChange('businessHoursEnd', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={settings.showWeekends}
                      onCheckedChange={(checked) => handleSettingChange('showWeekends', checked)}
                    />
                    <Label>Show weekends</Label>
                  </div>
                </div>

                {/* Booking Rules */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold !text-gray-900 dark:!text-white">Booking Rules</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Time Slot Duration</Label>
                      <Select 
                        value={settings.slotDuration} 
                        onValueChange={(value) => handleSettingChange('slotDuration', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Buffer Time (minutes)</Label>
                      <Input 
                        type="number" 
                        value={settings.bufferTimeMinutes}
                        onChange={(e) => handleSettingChange('bufferTimeMinutes', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Advance Booking (days)</Label>
                    <Input 
                      type="number" 
                      value={settings.maxAdvanceBookingDays}
                      onChange={(e) => handleSettingChange('maxAdvanceBookingDays', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold !text-gray-900 dark:!text-white">Features</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={settings.enableDragDrop}
                        onCheckedChange={(checked) => handleSettingChange('enableDragDrop', checked)}
                      />
                      <Label>Enable drag and drop rescheduling</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={settings.enablePrayerTimes}
                        onCheckedChange={(checked) => handleSettingChange('enablePrayerTimes', checked)}
                      />
                      <Label>Show prayer time blocks (UAE)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={settings.autoConfirmBookings}
                        onCheckedChange={(checked) => handleSettingChange('autoConfirmBookings', checked)}
                      />
                      <Label>Auto-confirm new bookings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={settings.allowDoubleBooking}
                        onCheckedChange={(checked) => handleSettingChange('allowDoubleBooking', checked)}
                      />
                      <Label>Allow double booking</Label>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold !text-gray-900 dark:!text-white">Notifications</h3>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={settings.sendReminders}
                      onCheckedChange={(checked) => handleSettingChange('sendReminders', checked)}
                    />
                    <Label>Send appointment reminders</Label>
                  </div>
                  {settings.sendReminders && (
                    <div className="space-y-2 ml-6">
                      <Label>Reminder time (hours before)</Label>
                      <Input 
                        type="number" 
                        value={settings.reminderHours}
                        onChange={(e) => handleSettingChange('reminderHours', parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                {/* Deposits */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold !text-gray-900 dark:!text-white">Deposit Settings</h3>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={settings.requireDeposit}
                      onCheckedChange={(checked) => handleSettingChange('requireDeposit', checked)}
                    />
                    <Label>Require deposit for bookings</Label>
                  </div>
                  {settings.requireDeposit && (
                    <div className="space-y-2 ml-6">
                      <Label>Deposit percentage</Label>
                      <Input 
                        type="number" 
                        value={settings.depositPercentage}
                        onChange={(e) => handleSettingChange('depositPercentage', parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Workflow Dialog */}
      <SalonBookingWorkflow 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        selectedDate={selectedDate}
        onBookingComplete={(booking) => {
          console.log('Booking completed:', booking)
          toast({
            title: 'Booking Created',
            description: 'New appointment has been scheduled successfully.',
          })
          setIsBookingOpen(false)
        }}
      />
    </div>
  )
}