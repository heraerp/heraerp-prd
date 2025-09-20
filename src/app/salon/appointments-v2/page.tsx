// ================================================================================
// HERA SALON - APPOINTMENTS PAGE V2 (Charcoal Gold UI Kit)
// Smart Code: HERA.PAGES.SALON.APPOINTMENTS.V2
// Premium appointment management with enhanced UI
// ================================================================================

'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar,
  Clock,
  Users,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  DollarSign,
  Star,
  Scissors,
  User
} from 'lucide-react'
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { useAppointments } from '@/hooks/useAppointments'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useToast } from '@/hooks/use-toast'
import { MouseGlow } from '@/components/salon/MouseGlow'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// --- Types ---
interface Appointment {
  id: string
  date: string
  time: string
  customer: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  service: {
    id: string
    name: string
    duration: number
    price: number
  }
  staff: {
    id: string
    name: string
  }
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
}

// --- KPI Card Component ---
function KpiCard({ icon: Icon, label, value, trend, iconBg }: {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: { value: string; isPositive: boolean }
  iconBg: string
}) {
  return (
    <div className="glass-card p-6 group hover:scale-[1.02] transition-all">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-text-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-semibold text-text-100 tabular-nums">
            {value}
          </p>
          {trend && (
            <p className="text-sm text-text-300 flex items-center gap-1">
              <span className={trend.isPositive ? 'text-gold-500' : 'text-red-400'}>
                {trend.value}
              </span>
              <span>vs last week</span>
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-gold-500" />
        </div>
      </div>
    </div>
  )
}

// --- Time Slot Component ---
function TimeSlot({ time, isAvailable, isSelected, onClick }: {
  time: string
  isAvailable: boolean
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={!isAvailable}
      className={cn(
        "px-3 py-2 rounded-lg text-sm font-medium transition-all",
        isAvailable
          ? isSelected
            ? "bg-gradient-to-r from-gold-500 to-gold-400 text-charcoal-900 shadow-[0_8px_30px_rgba(212,175,55,0.35)]"
            : "bg-white/5 text-text-300 hover:bg-white/10"
          : "bg-charcoal-700 text-text-500 cursor-not-allowed opacity-50"
      )}
    >
      {time}
    </button>
  )
}

// --- Appointment Card Component ---
function AppointmentCard({ appointment, onEdit, onCancel }: {
  appointment: Appointment
  onEdit: () => void
  onCancel: () => void
}) {
  const statusColors = {
    scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    completed: 'bg-gold-500/10 text-gold-400 border-gold-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
    'no-show': 'bg-gray-500/10 text-gray-400 border-gray-500/30'
  }

  const statusIcons = {
    scheduled: Clock,
    confirmed: CheckCircle,
    completed: Star,
    cancelled: XCircle,
    'no-show': AlertCircle
  }

  const StatusIcon = statusIcons[appointment.status]

  return (
    <div className="glass-card p-5 hover:-translate-y-0.5 hover:shadow-xl transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500 to-gold-400 flex items-center justify-center text-charcoal-900 font-semibold shadow-lg">
            {appointment.customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-text-100 group-hover:text-gold-400 transition-colors">
              {appointment.customer.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-text-500">
              {appointment.customer.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {appointment.customer.email}
                </span>
              )}
              {appointment.customer.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {appointment.customer.phone}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <Badge className={cn("flex items-center gap-1", statusColors[appointment.status])}>
          <StatusIcon className="w-3 h-3" />
          {appointment.status}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <Scissors className="w-4 h-4 text-gold-500" />
            <div>
              <p className="font-medium text-text-100">{appointment.service.name}</p>
              <p className="text-xs text-text-500">{appointment.service.duration} mins</p>
            </div>
          </div>
          <p className="text-lg font-semibold text-gold-400">
            £{appointment.service.price}
          </p>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gold-500" />
            <div>
              <p className="text-sm text-text-500">Staff</p>
              <p className="font-medium text-text-100">{appointment.staff.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-500">Time</p>
            <p className="font-medium text-text-100">{appointment.time}</p>
          </div>
        </div>
      </div>

      {appointment.notes && (
        <p className="text-sm text-text-500 mt-3 p-3 bg-white/5 rounded-lg">
          {appointment.notes}
        </p>
      )}

      <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-text-300 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Edit className="w-3 h-3" />
          Edit
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-text-300 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <XCircle className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </div>
  )
}

// --- Calendar Day Component ---
function CalendarDay({ date, appointments, isSelected, onClick }: {
  date: Date
  appointments: Appointment[]
  isSelected: boolean
  onClick: () => void
}) {
  const isToday = isSameDay(date, new Date())
  const hasAppointments = appointments.length > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg transition-all",
        isSelected
          ? "bg-gradient-to-br from-gold-500/20 to-gold-400/20 border-2 border-gold-500"
          : "glass-card hover:scale-[1.02]",
        isToday && !isSelected && "ring-2 ring-gold-500/30"
      )}
    >
      <div className="text-center">
        <p className="text-xs text-text-500 uppercase">
          {format(date, 'EEE')}
        </p>
        <p className={cn(
          "text-2xl font-semibold mt-1",
          isSelected ? "text-gold-400" : "text-text-100"
        )}>
          {format(date, 'd')}
        </p>
        {hasAppointments && (
          <div className="mt-2 flex justify-center gap-1">
            {appointments.slice(0, 3).map((_, idx) => (
              <div
                key={idx}
                className="w-2 h-2 rounded-full bg-gold-500"
              />
            ))}
            {appointments.length > 3 && (
              <span className="text-xs text-text-500">+{appointments.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

export default function SalonAppointmentsV2Page() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrganization, isAuthenticated, contextLoading } = useHERAAuth()
  const organizationId = currentOrganization?.id

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const { appointments, loading, error, cancelAppointment } = useAppointments(organizationId!)

  // Generate week dates
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(apt => 
        apt.customer.name.toLowerCase().includes(search) ||
        apt.service.name.toLowerCase().includes(search) ||
        apt.staff.name.toLowerCase().includes(search)
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus)
    }

    return filtered
  }, [appointments, searchTerm, filterStatus])

  // Get appointments for each day
  const getAppointmentsForDate = (date: Date) => {
    return filteredAppointments.filter(apt => 
      isSameDay(parseISO(apt.date), date)
    )
  }

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date()
    const todayAppts = appointments.filter(apt => isSameDay(parseISO(apt.date), today))
    const revenue = todayAppts.reduce((sum, apt) => sum + apt.service.price, 0)
    const utilization = Math.round((todayAppts.length / 20) * 100) // Assuming 20 slots per day
    
    return {
      todayCount: todayAppts.length,
      revenue,
      utilization,
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length
    }
  }, [appointments])

  // Handle appointment cancellation
  const handleCancelAppointment = async (id: string) => {
    try {
      await cancelAppointment(id)
      toast({
        title: "Appointment cancelled",
        description: "The appointment has been cancelled successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive"
      })
    }
  }

  // Auth checks
  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh text-text-100 bg-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-300">Please log in to access appointments</p>
        </div>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-dvh text-text-100 bg-charcoal-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500 border-t-transparent" />
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="min-h-dvh text-text-100 bg-charcoal-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-300">No organization selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh text-text-100 bg-charcoal-900">
      <MouseGlow />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <div className="text-gold-400 uppercase tracking-[0.12em] text-xs font-semibold">
              Salon Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Appointments</h1>
          </div>
          <div className="flex gap-2">
            <button className="ghost-btn">
              <Calendar className="w-4 h-4" />
              Calendar View
            </button>
            <button 
              className="gold-btn"
              onClick={() => router.push('/salon/appointments/new')}
            >
              <Plus className="w-4 h-4" />
              New Appointment
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            icon={Calendar}
            label="Today's Appointments"
            value={stats.todayCount}
            trend={{ value: '+12%', isPositive: true }}
            iconBg="bg-gold-500/10"
          />
          <KpiCard
            icon={DollarSign}
            label="Today's Revenue"
            value={`£${stats.revenue}`}
            iconBg="bg-emerald-500/10"
          />
          <KpiCard
            icon={CheckCircle}
            label="Confirmed"
            value={stats.confirmed}
            iconBg="bg-blue-500/10"
          />
          <KpiCard
            icon={Clock}
            label="Utilization"
            value={`${stats.utilization}%`}
            iconBg="bg-purple-500/10"
          />
        </div>

        {/* Filter Bar */}
        <div className="glass-card p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-500" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input w-full pl-10"
              />
            </div>
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="glass-select"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('day')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  viewMode === 'day'
                    ? "bg-gold-500/10 text-gold-400 border border-gold-500/30"
                    : "bg-white/5 text-text-300 hover:bg-white/10"
                )}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  viewMode === 'week'
                    ? "bg-gold-500/10 text-gold-400 border border-gold-500/30"
                    : "bg-white/5 text-text-300 hover:bg-white/10"
                )}
              >
                Week
              </button>
            </div>
          </div>
        </div>

        {/* Calendar & Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-text-100">
                  {format(selectedDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedDate(d => addDays(d, -7))}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-3 py-1 text-sm hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setSelectedDate(d => addDays(d, 7))}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {weekDates.map(date => (
                  <CalendarDay
                    key={date.toISOString()}
                    date={date}
                    appointments={getAppointmentsForDate(date)}
                    isSelected={isSameDay(date, selectedDate)}
                    onClick={() => setSelectedDate(date)}
                  />
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-text-100 mb-4">Available Slots</h3>
              <div className="grid grid-cols-3 gap-2">
                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
                  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'].map(time => (
                  <TimeSlot
                    key={time}
                    time={time}
                    isAvailable={Math.random() > 0.3}
                    isSelected={false}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-100">
                {format(selectedDate, 'EEEE, MMMM d')}
              </h2>
              <p className="text-sm text-text-500">
                {getAppointmentsForDate(selectedDate).length} appointments
              </p>
            </div>

            {loading ? (
              <div className="glass-card p-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gold-500 border-t-transparent" />
              </div>
            ) : error ? (
              <div className="glass-card p-12 text-center">
                <p className="text-red-400">Error loading appointments: {error}</p>
              </div>
            ) : getAppointmentsForDate(selectedDate).length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-text-500" />
                <p className="text-text-300 text-lg">No appointments scheduled</p>
                <p className="text-sm mt-2 text-text-500">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your filters' 
                    : `Book your first appointment for ${format(selectedDate, 'MMMM d')}`}
                </p>
                {!(searchTerm || filterStatus !== 'all') && (
                  <button 
                    onClick={() => router.push('/salon/appointments/new')}
                    className="gold-btn mt-4"
                  >
                    <Plus className="w-4 h-4" />
                    Book Appointment
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {getAppointmentsForDate(selectedDate)
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(appointment => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onEdit={() => router.push(`/salon/appointments/${appointment.id}/edit`)}
                      onCancel={() => handleCancelAppointment(appointment.id)}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}