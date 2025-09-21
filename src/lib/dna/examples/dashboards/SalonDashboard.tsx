'use client'

// ================================================================================
// HERA DNA SALON DASHBOARD EXAMPLE
// Smart Code: HERA.DNA.EXAMPLE.DASHBOARD.SALON.V1
// Complete salon & spa operations dashboard with appointment management
// ================================================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Scissors,
  DollarSign,
  Users,
  Clock,
  Calendar,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  MapPin,
  Heart,
  Sparkles,
  Timer,
  UserCheck,
  Package
} from 'lucide-react'
import { StatCardDNA } from '../../components/ui/stat-card-dna'
import { EnterpriseDataTable } from '../../components/organisms/EnterpriseDataTable'
import { motion } from 'framer-motion'

// ================================================================================
// TYPES AND INTERFACES
// ================================================================================

interface SalonMetrics {
  dailyRevenue: number
  revenueChange: number
  appointmentsToday: number
  appointmentsChange: number
  clientsServed: number
  clientsChange: number
  utilization: number
  utilizationChange: number
}

interface Appointment {
  id: string
  clientName: string
  service: string
  stylist: string
  time: string
  duration: number
  price: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

interface Service {
  id: string
  name: string
  category: string
  price: number
  duration: number
  bookingsToday: number
  revenue: number
  popularityScore: number
}

interface Stylist {
  id: string
  name: string
  avatar: string
  specialties: string[]
  appointmentsToday: number
  revenue: number
  rating: number
  availability: 'available' | 'busy' | 'break' | 'off'
}

interface SalonDashboardProps {
  organizationId?: string
  className?: string
}

// ================================================================================
// MOCK DATA
// ================================================================================

const mockMetrics: SalonMetrics = {
  dailyRevenue: 3250.75,
  revenueChange: 18.5,
  appointmentsToday: 28,
  appointmentsChange: 12.0,
  clientsServed: 24,
  clientsChange: 9.5,
  utilization: 85,
  utilizationChange: 7.2
}

const mockAppointments: Appointment[] = [
  {
    id: 'apt-001',
    clientName: 'Sarah Johnson',
    service: 'Hair Cut & Color',
    stylist: 'Emma',
    time: '10:30 AM',
    duration: 120,
    price: 185.0,
    status: 'in_progress'
  },
  {
    id: 'apt-002',
    clientName: 'Michelle Davis',
    service: 'Manicure & Pedicure',
    stylist: 'Lisa',
    time: '11:00 AM',
    duration: 90,
    price: 85.0,
    status: 'scheduled'
  },
  {
    id: 'apt-003',
    clientName: 'Jennifer Wilson',
    service: 'Facial Treatment',
    stylist: 'Anna',
    time: '11:30 AM',
    duration: 60,
    price: 120.0,
    status: 'scheduled'
  },
  {
    id: 'apt-004',
    clientName: 'Amanda Brown',
    service: 'Hair Styling',
    stylist: 'Emma',
    time: '12:00 PM',
    duration: 45,
    price: 65.0,
    status: 'completed'
  }
]

const mockServices: Service[] = [
  {
    id: 'svc-001',
    name: 'Hair Cut & Color',
    category: 'Hair Services',
    price: 185.0,
    duration: 120,
    bookingsToday: 8,
    revenue: 1480.0,
    popularityScore: 95
  },
  {
    id: 'svc-002',
    name: 'Manicure & Pedicure',
    category: 'Nail Services',
    price: 85.0,
    duration: 90,
    bookingsToday: 6,
    revenue: 510.0,
    popularityScore: 88
  },
  {
    id: 'svc-003',
    name: 'Facial Treatment',
    category: 'Skincare',
    price: 120.0,
    duration: 60,
    bookingsToday: 5,
    revenue: 600.0,
    popularityScore: 82
  },
  {
    id: 'svc-004',
    name: 'Hair Styling',
    category: 'Hair Services',
    price: 65.0,
    duration: 45,
    bookingsToday: 4,
    revenue: 260.0,
    popularityScore: 76
  },
  {
    id: 'svc-005',
    name: 'Eyebrow Threading',
    category: 'Beauty Services',
    price: 35.0,
    duration: 30,
    bookingsToday: 7,
    revenue: 245.0,
    popularityScore: 90
  }
]

const mockStylists: Stylist[] = [
  {
    id: 'sty-001',
    name: 'Emma Rodriguez',
    avatar: '/avatars/emma.jpg',
    specialties: ['Hair Color', 'Cutting', 'Styling'],
    appointmentsToday: 8,
    revenue: 1240.0,
    rating: 4.9,
    availability: 'busy'
  },
  {
    id: 'sty-002',
    name: 'Lisa Chen',
    avatar: '/avatars/lisa.jpg',
    specialties: ['Nails', 'Manicure', 'Pedicure'],
    appointmentsToday: 6,
    revenue: 680.0,
    rating: 4.8,
    availability: 'available'
  },
  {
    id: 'sty-003',
    name: 'Anna Thompson',
    avatar: '/avatars/anna.jpg',
    specialties: ['Skincare', 'Facials', 'Anti-aging'],
    appointmentsToday: 5,
    revenue: 750.0,
    rating: 4.9,
    availability: 'busy'
  },
  {
    id: 'sty-004',
    name: 'Maria Santos',
    avatar: '/avatars/maria.jpg',
    specialties: ['Hair Styling', 'Makeup', 'Bridal'],
    appointmentsToday: 4,
    revenue: 520.0,
    rating: 4.7,
    availability: 'break'
  }
]

// ================================================================================
// UTILITY FUNCTIONS
// ================================================================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

const getStatusColor = (status: string) => {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    busy: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    break: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    off: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const getStatusIcon = (status: string) => {
  const icons = {
    scheduled: Clock,
    in_progress: Timer,
    completed: CheckCircle,
    cancelled: AlertCircle,
    available: UserCheck,
    busy: User,
    break: Clock,
    off: User
  }
  return icons[status as keyof typeof icons] || Clock
}

// ================================================================================
// MAIN COMPONENT
// ================================================================================

export function SalonDashboard({ organizationId, className }: SalonDashboardProps) {
  const [metrics, setMetrics] = useState<SalonMetrics>(mockMetrics)
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments)
  const [services, setServices] = useState<Service[]>(mockServices)
  const [stylists, setStylists] = useState<Stylist[]>(mockStylists)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Table columns for services
  const serviceColumns = [
    {
      accessorKey: 'name',
      header: 'Service',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-sm text-muted-foreground">{row.original.category}</p>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }: { row: any }) => formatCurrency(row.original.price)
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }: { row: any }) => formatDuration(row.original.duration)
    },
    {
      accessorKey: 'bookingsToday',
      header: 'Bookings',
      cell: ({ row }: { row: any }) => (
        <div className="text-center">{row.original.bookingsToday}</div>
      )
    },
    {
      accessorKey: 'revenue',
      header: 'Revenue',
      cell: ({ row }: { row: any }) => formatCurrency(row.original.revenue)
    },
    {
      accessorKey: 'popularityScore',
      header: 'Popularity',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Progress value={row.original.popularityScore} className="w-16" />
          <span className="text-sm">{row.original.popularityScore}%</span>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold !text-gray-900 dark:!text-gray-100">Salon Dashboard</h1>
          <p className="text-muted-foreground">
            Hair Talkz Salon & Spa • {currentTime.toLocaleDateString()}{' '}
            {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="w-3 h-3 mr-1" />
          Open
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCardDNA
            title="Daily Revenue"
            value={formatCurrency(metrics.dailyRevenue)}
            trend={
              metrics.revenueChange > 0 ? `+${metrics.revenueChange}%` : `${metrics.revenueChange}%`
            }
            trendDirection={metrics.revenueChange > 0 ? 'up' : 'down'}
            icon={DollarSign}
            description="Today's total earnings"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCardDNA
            title="Appointments"
            value={metrics.appointmentsToday.toString()}
            trend={
              metrics.appointmentsChange > 0
                ? `+${metrics.appointmentsChange}%`
                : `${metrics.appointmentsChange}%`
            }
            trendDirection={metrics.appointmentsChange > 0 ? 'up' : 'down'}
            icon={Calendar}
            description="Scheduled today"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCardDNA
            title="Clients Served"
            value={metrics.clientsServed.toString()}
            trend={
              metrics.clientsChange > 0 ? `+${metrics.clientsChange}%` : `${metrics.clientsChange}%`
            }
            trendDirection={metrics.clientsChange > 0 ? 'up' : 'down'}
            icon={Users}
            description="Completed services"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatCardDNA
            title="Utilization"
            value={`${metrics.utilization}%`}
            trend={
              metrics.utilizationChange > 0
                ? `+${metrics.utilizationChange}%`
                : `${metrics.utilizationChange}%`
            }
            trendDirection={metrics.utilizationChange > 0 ? 'up' : 'down'}
            icon={TrendingUp}
            description="Staff utilization rate"
          />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.map(appointment => {
                const StatusIcon = getStatusIcon(appointment.status)
                return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          appointment.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-600'
                            : appointment.status === 'in_progress'
                              ? 'bg-orange-100 text-orange-600'
                              : appointment.status === 'completed'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-red-100 text-red-600'
                        }`}
                      >
                        <StatusIcon className="w-5 h-5" />
                      </div>

                      <div>
                        <p className="font-medium">{appointment.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.service} • {appointment.stylist}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">{appointment.time}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(appointment.duration)} • {formatCurrency(appointment.price)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Staff Status */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Staff Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stylists.map(stylist => {
                const StatusIcon = getStatusIcon(stylist.availability)
                return (
                  <div key={stylist.id} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={stylist.avatar} />
                      <AvatarFallback>
                        {stylist.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{stylist.name}</p>
                        <Badge className={`${getStatusColor(stylist.availability)} text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {stylist.availability}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">
                          {stylist.rating} • {stylist.appointmentsToday} appts
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Hair Products</span>
                <Badge variant="outline">Good</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Nail Supplies</span>
                <Badge className="bg-yellow-100 text-yellow-800">Low</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Skincare Products</span>
                <Badge variant="outline">Good</Badge>
              </div>
              <Button size="sm" className="w-full">
                Manage Inventory
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Service Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Service Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnterpriseDataTable
            data={services}
            columns={serviceColumns}
            searchable={true}
            exportable={true}
            pagination={true}
          />
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Rating</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">4.9</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Reviews Today</span>
              <span className="font-medium">18</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Client Retention</span>
              <span className="font-medium text-green-600">94%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Referral Rate</span>
              <span className="font-medium text-blue-600">68%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Salon Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm">456 Beauty Boulevard</p>
                <p className="text-sm text-muted-foreground">Fashion District, City 54321</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">(555) 987-6543</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">9:00 AM - 7:00 PM</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">4 Stylists • 12 Service Rooms</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ================================================================================
// EXPORTS
// ================================================================================

export default SalonDashboard

// Export types for external use
export type { SalonDashboardProps, SalonMetrics, Appointment, Service, Stylist }
