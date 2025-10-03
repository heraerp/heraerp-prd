'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/luxe-card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  Users,
  Phone,
  CheckCircle,
  AlertCircle,
  CreditCard,
  MessageSquare,
  Plus,
  Search,
  User,
  DollarSign,
  Loader2,
  CalendarDays,
  UserPlus,
  Receipt
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#B794F4',
  emerald: '#0F6F5C',
  ruby: '#DC2626',
  sapphire: '#2563EB'
}

const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

interface AppointmentCard {
  id: string
  time: string
  clientName: string
  service: string
  stylist: string
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled'
  amount: number
}

function AppointmentStatusBadge({ status }: { status: AppointmentCard['status'] }) {
  const colors = {
    upcoming: { bg: `${COLORS.sapphire}20`, text: COLORS.sapphire, label: 'Upcoming' },
    'in-progress': { bg: `${COLORS.emerald}20`, text: COLORS.emerald, label: 'In Progress' },
    completed: { bg: `${COLORS.bronze}20`, text: COLORS.bronze, label: 'Completed' },
    cancelled: { bg: `${COLORS.ruby}20`, text: COLORS.ruby, label: 'Cancelled' }
  }

  const config = colors[status]

  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: config.bg,
        color: config.text
      }}
    >
      {config.label}
    </span>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = COLORS.gold
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color?: string
}) {
  return (
    <Card
      style={{
        backgroundColor: COLORS.charcoalLight,
        border: `1px solid ${COLORS.bronze}20`
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: `${color}20`,
              color: color
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p
              className="text-xs font-light uppercase tracking-wider"
              style={{ color: COLORS.bronze }}
            >
              {label}
            </p>
            <p className="text-xl font-light" style={{ color: COLORS.champagne }}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReceptionistDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [appointments, setAppointments] = useState<AppointmentCard[]>([])

  useEffect(() => {
    checkAuth()
    loadAppointments()

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const checkAuth = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session?.user) {
      router.push('/salon/auth')
      return
    }

    const userMetadata = session.user.user_metadata
    const userRole =
      userMetadata?.role?.toLowerCase() || localStorage.getItem('salonRole')?.toLowerCase()

    // Check organization
    if (userMetadata?.organization_id !== HAIRTALKZ_ORG_ID) {
      router.push('/salon/auth')
      return
    }

    // Check role
    if (userRole && userRole !== 'receptionist') {
      // Redirect to appropriate dashboard based on role
      const redirectMap: Record<string, string> = {
        owner: '/salon/dashboard',
        accountant: '/salon/accountant',
        admin: '/salon/admin'
      }

      const redirectPath = redirectMap[userRole] || '/salon/auth'
      router.push(redirectPath)
      return
    }
  }

  const loadAppointments = async () => {
    // Mock appointments for demo
    setAppointments([
      {
        id: '1',
        time: '2:00 PM',
        clientName: 'Emma Wilson',
        service: 'Hair Color & Style',
        stylist: 'Sarah Martinez',
        status: 'upcoming',
        amount: 450
      },
      {
        id: '2',
        time: '2:30 PM',
        clientName: 'Olivia Brown',
        service: 'Haircut & Blowdry',
        stylist: 'Maria Lopez',
        status: 'upcoming',
        amount: 200
      },
      {
        id: '3',
        time: '1:30 PM',
        clientName: 'Sophia Davis',
        service: 'Keratin Treatment',
        stylist: 'Lisa Chen',
        status: 'in-progress',
        amount: 800
      },
      {
        id: '4',
        time: '12:00 PM',
        clientName: 'Isabella Garcia',
        service: 'Highlights',
        stylist: 'Sarah Martinez',
        status: 'completed',
        amount: 550
      }
    ])
    setLoading(false)
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.charcoal }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: COLORS.gold }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.charcoal }}>
      {/* Header */}
      <div
        className="border-b px-6 py-4"
        style={{
          backgroundColor: COLORS.charcoalLight,
          borderColor: `${COLORS.bronze}20`
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-wider" style={{ color: COLORS.champagne }}>
              Reception Dashboard
            </h1>
            <p
              className="text-sm font-light mt-1 flex items-center gap-2"
              style={{ color: COLORS.bronze }}
            >
              <Clock className="h-4 w-4" />
              {currentTime.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="font-light"
              style={{
                borderColor: COLORS.bronze,
                color: COLORS.champagne
              }}
              asChild
            >
              <Link href="/salon/customers/new">
                <UserPlus className="h-4 w-4 mr-2" />
                New Customer
              </Link>
            </Button>

            <Button
              className="font-light"
              style={{
                backgroundColor: COLORS.gold,
                color: COLORS.black
              }}
              asChild
            >
              <Link href="/salon/appointments/new">
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={CalendarDays}
            label="Today's Appointments"
            value="18"
            color={COLORS.sapphire}
          />
          <StatCard icon={Users} label="Walk-ins Today" value="5" color={COLORS.emerald} />
          <StatCard
            icon={DollarSign}
            label="Today's Revenue"
            value="AED 8,450"
            color={COLORS.gold}
          />
          <StatCard icon={MessageSquare} label="Pending Messages" value="3" color={COLORS.plum} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointments List */}
          <div className="lg:col-span-2">
            <Card
              style={{
                backgroundColor: COLORS.charcoalLight,
                border: `1px solid ${COLORS.bronze}20`
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle
                    className="text-lg font-light tracking-wider"
                    style={{ color: COLORS.champagne }}
                  >
                    Today's Appointments
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-light"
                    style={{ color: COLORS.bronze }}
                    asChild
                  >
                    <Link href="/salon/appointments">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments.map(appointment => (
                    <div
                      key={appointment.id}
                      className="p-4 rounded-lg transition-all duration-200 hover:scale-[1.01]"
                      style={{
                        backgroundColor: COLORS.charcoal,
                        border: `1px solid ${COLORS.bronze}20`
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-3">
                            <span
                              className="text-lg font-medium"
                              style={{ color: COLORS.champagne }}
                            >
                              {appointment.time}
                            </span>
                            <AppointmentStatusBadge status={appointment.status} />
                          </div>
                          <h4 className="font-medium mt-1" style={{ color: COLORS.lightText }}>
                            {appointment.clientName}
                          </h4>
                        </div>
                        <span className="text-lg font-light" style={{ color: COLORS.gold }}>
                          AED {appointment.amount}
                        </span>
                      </div>

                      <p className="text-sm font-light" style={{ color: COLORS.bronze }}>
                        {appointment.service} • with {appointment.stylist}
                      </p>

                      <div className="flex items-center gap-2 mt-3">
                        {appointment.status === 'upcoming' && (
                          <>
                            <Button
                              size="sm"
                              className="font-light"
                              style={{
                                backgroundColor: COLORS.emerald,
                                color: COLORS.black
                              }}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Check In
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="font-light"
                              style={{
                                borderColor: COLORS.bronze,
                                color: COLORS.bronze
                              }}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Contact
                            </Button>
                          </>
                        )}
                        {appointment.status === 'in-progress' && (
                          <Button
                            size="sm"
                            className="font-light"
                            style={{
                              backgroundColor: COLORS.gold,
                              color: COLORS.black
                            }}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Process Payment
                          </Button>
                        )}
                        {appointment.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-light"
                            style={{
                              borderColor: COLORS.bronze,
                              color: COLORS.bronze
                            }}
                          >
                            <Receipt className="h-3 w-3 mr-1" />
                            View Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card
              style={{
                backgroundColor: COLORS.charcoalLight,
                border: `1px solid ${COLORS.bronze}20`
              }}
            >
              <CardHeader>
                <CardTitle
                  className="text-lg font-light tracking-wider"
                  style={{ color: COLORS.champagne }}
                >
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    className="w-full justify-start font-light"
                    variant="outline"
                    style={{
                      borderColor: COLORS.bronze,
                      color: COLORS.champagne
                    }}
                    asChild
                  >
                    <Link href="/salon/pos">
                      <CreditCard className="h-4 w-4 mr-3" />
                      Process Payment
                    </Link>
                  </Button>

                  <Button
                    className="w-full justify-start font-light"
                    variant="outline"
                    style={{
                      borderColor: COLORS.bronze,
                      color: COLORS.champagne
                    }}
                    asChild
                  >
                    <Link href="/salon/appointments/calendar">
                      <Calendar className="h-4 w-4 mr-3" />
                      View Calendar
                    </Link>
                  </Button>

                  <Button
                    className="w-full justify-start font-light"
                    variant="outline"
                    style={{
                      borderColor: COLORS.bronze,
                      color: COLORS.champagne
                    }}
                    asChild
                  >
                    <Link href="/salon/whatsapp">
                      <MessageSquare className="h-4 w-4 mr-3" />
                      Send WhatsApp
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Walk-in Queue */}
            <Card
              style={{
                backgroundColor: COLORS.charcoalLight,
                border: `1px solid ${COLORS.bronze}20`
              }}
            >
              <CardHeader>
                <CardTitle
                  className="text-lg font-light tracking-wider"
                  style={{ color: COLORS.champagne }}
                >
                  Walk-in Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Jessica Miller', service: 'Haircut', wait: '15 mins' },
                    { name: 'Amanda Taylor', service: 'Consultation', wait: '30 mins' },
                    { name: 'Rachel Anderson', service: 'Blowdry', wait: '45 mins' }
                  ].map((walkin, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{
                        backgroundColor: COLORS.charcoal,
                        border: `1px solid ${COLORS.bronze}20`
                      }}
                    >
                      <div>
                        <p style={{ color: COLORS.lightText }} className="text-sm font-medium">
                          {walkin.name}
                        </p>
                        <p style={{ color: COLORS.bronze }} className="text-xs">
                          {walkin.service}
                        </p>
                      </div>
                      <span className="text-xs" style={{ color: COLORS.gold }}>
                        {walkin.wait}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
