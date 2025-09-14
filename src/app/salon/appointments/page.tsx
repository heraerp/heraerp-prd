'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { universalApi } from '@/lib/universal-api'
import { Calendar, Clock, User, Plus, Filter, ChevronLeft, ChevronRight, Edit, Trash2, CheckCircle, XCircle, AlertCircle, DollarSign, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b'

interface Appointment {
  id: string
  transaction_date: string
  customer_id: string
  customer_name: string
  service_name: string
  stylist_id: string
  stylist_name: string
  time: string
  duration: number
  status: string
  amount: number
  notes?: string
}

interface EntityCache {
  [key: string]: any
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
]

// Enterprise-grade glassmorphism stat card component
function StatCard({ title, value, icon: Icon, trend, loading }: { title: string; value: string | number; icon: any; trend?: number; loading?: boolean }) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-purple-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
      <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/80 hover:scale-[1.02] transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend !== undefined && !loading && (
            <span className={cn(
              "text-sm font-semibold",
              trend > 0 ? "text-emerald-600" : "text-rose-600"
            )}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        {loading ? (
          <div className="h-8 bg-gray-200/50 rounded-lg animate-pulse mt-1" />
        ) : (
          <p className="text-gray-900 text-2xl font-bold mt-1">{value}</p>
        )}
      </div>
    </div>
  )
}

// Optimized appointment card component
const AppointmentCard = React.memo(({ 
  appointment, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: { 
  appointment: Appointment
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'from-emerald-100 to-green-100 text-emerald-700 border-emerald-300'
      case 'pending': return 'from-amber-100 to-yellow-100 text-amber-700 border-amber-300'
      case 'completed': return 'from-blue-100 to-sky-100 text-blue-700 border-blue-300'
      case 'cancelled': return 'from-rose-100 to-red-100 text-rose-700 border-rose-300'
      case 'no-show': return 'from-gray-100 to-slate-100 text-gray-700 border-gray-300'
      default: return 'from-gray-100 to-slate-100 text-gray-600 border-gray-300'
    }
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/70 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-900 font-semibold text-lg">{appointment.customer_name}</p>
          <p className="text-violet-600 font-medium mt-1">{appointment.service_name}</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1.5 text-gray-700">
              <User className="w-4 h-4 text-violet-500" />
              {appointment.stylist_name}
            </span>
            <span className="flex items-center gap-1.5 text-gray-700">
              <Clock className="w-4 h-4 text-violet-500" />
              {appointment.duration} min
            </span>
            <span className="font-semibold text-violet-600">
              AED {appointment.amount}
            </span>
          </div>
          {appointment.notes && (
            <p className="text-gray-600 text-sm mt-2 italic">{appointment.notes}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold border bg-gradient-to-r",
            getStatusColor(appointment.status)
          )}>
            {appointment.status}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(appointment.id)}
              className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-600 transition-colors"
              title="Edit appointment"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(appointment.id)}
              className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
              title="Cancel appointment"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

AppointmentCard.displayName = 'AppointmentCard'

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'day' | 'week' | 'month'>('day')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Cache for entities to avoid reloading
  const [entityCache, setEntityCache] = useState<EntityCache>({})
  const [cacheLoaded, setCacheLoaded] = useState(false)

  // Load entities and services once on mount
  useEffect(() => {
    universalApi.setOrganizationId(SALON_ORG_ID)
    loadEntityCache()
  }, [])

  // Load appointments when cache is ready or date changes
  useEffect(() => {
    if (cacheLoaded) {
      loadAppointmentsForDate(selectedDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, cacheLoaded])

  const loadEntityCache = async () => {
    try {
      // Load all entities in one call
      const entitiesData = await universalApi.read('core_entities')
      
      // Filter relevant entities by type
      const allEntities = entitiesData.data.filter(
        (e: any) => e.organization_id === SALON_ORG_ID
      )
      
      const customers = allEntities.filter((e: any) => e.entity_type === 'customer')
      const stylists = allEntities.filter((e: any) => e.entity_type === 'stylist')
      const services = allEntities.filter((e: any) => e.entity_type === 'service')

      // Build cache map
      const cache: EntityCache = {}
      ;[...customers, ...stylists, ...services].forEach((entity: any) => {
        cache[entity.id] = entity
      })

      setEntityCache(cache)
      setCacheLoaded(true)
    } catch (error) {
      console.error('Error loading entity cache:', error)
      setCacheLoaded(true) // Continue even if cache fails
    }
  }

  const loadAppointmentsForDate = async (date: Date) => {
    try {
      setLoading(true)
      
      // Calculate date range for the query (load 3 days: yesterday, today, tomorrow)
      const startDate = new Date(date)
      startDate.setDate(startDate.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      endDate.setHours(23, 59, 59, 999)

      // Load appointments for date range
      const appointmentsData = await universalApi.read('universal_transactions')
      const dayAppointments = appointmentsData.data.filter((t: any) => {
        if (t.transaction_type !== 'appointment' || t.organization_id !== SALON_ORG_ID) return false
        
        const aptDate = new Date(t.transaction_date)
        return aptDate >= startDate && aptDate <= endDate
      })

      // If we have appointments, load their transaction lines
      let linesMap: any = {}
      if (dayAppointments.length > 0) {
        const appointmentIds = dayAppointments.map((apt: any) => apt.id)
        const linesData = await universalApi.read('universal_transaction_lines')
        const appointmentLines = linesData.data.filter((line: any) => 
          appointmentIds.includes(line.transaction_id)
        )
        
        // Create lines map
        linesMap = appointmentLines.reduce((map: any, line: any) => {
          if (!map[line.transaction_id]) map[line.transaction_id] = []
          map[line.transaction_id].push(line)
          return map
        }, {})
      }

      // Transform appointments with cached entity data
      const transformedAppointments = dayAppointments.map((apt: any) => {
        const customer = entityCache[apt.source_entity_id] || { entity_name: 'Walk-in Customer' }
        const stylist = entityCache[apt.target_entity_id] || { entity_name: 'Any Stylist' }
        const lines = linesMap[apt.id] || []
        const serviceEntity = lines[0] ? entityCache[lines[0].line_entity_id] : null
        
        const transactionDate = new Date(apt.transaction_date)
        return {
          id: apt.id,
          transaction_date: apt.transaction_date,
          customer_id: apt.source_entity_id,
          customer_name: customer.entity_name,
          service_name: serviceEntity?.entity_name || apt.business_context?.services?.[0] || 'Hair Service',
          stylist_id: apt.target_entity_id,
          stylist_name: stylist.entity_name,
          time: transactionDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          duration: apt.business_context?.duration_minutes || 60,
          status: apt.business_context?.status || 'confirmed',
          amount: apt.total_amount || 0,
          notes: apt.business_context?.notes
        }
      })

      // Filter for selected date only
      const selectedDateStr = date.toDateString()
      const filtered = transformedAppointments.filter((apt: Appointment) => {
        const aptDate = new Date(apt.transaction_date).toDateString()
        return aptDate === selectedDateStr
      })

      setAppointments(filtered)
    } catch (error) {
      console.error('Error loading appointments:', error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = useCallback(async (appointmentId: string, newStatus: string) => {
    try {
      // Update the appointment status
      const appointment = appointments.find(a => a.id === appointmentId)
      if (!appointment) return

      // Get the full transaction to preserve all data
      const transactionData = await universalApi.read('universal_transactions')
      const transaction = transactionData.data.find((t: any) => t.id === appointmentId)
      
      if (!transaction) return

      // Update business context with new status
      const updatedContext = {
        ...(transaction.business_context || {}),
        status: newStatus,
        status_updated_at: new Date().toISOString()
      }

      // Update transaction with new status
      await universalApi.update('universal_transactions', appointmentId, {
        business_context: updatedContext
      })

      // Update local state optimistically
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      ))
    } catch (error) {
      console.error('Error updating appointment status:', error)
      // Reload on error to ensure consistency
      loadAppointmentsForDate(selectedDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, selectedDate])

  const handleDelete = useCallback(async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    
    try {
      await handleStatusChange(appointmentId, 'cancelled')
    } catch (error) {
      console.error('Error cancelling appointment:', error)
    }
  }, [handleStatusChange])

  const handleEdit = useCallback((appointmentId: string) => {
    window.location.href = `/salon/appointments/edit/${appointmentId}`
  }, [])

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setSelectedDate(newDate)
  }, [selectedDate, view])

  // Memoized filtered appointments
  const filteredAppointments = useMemo(() => {
    return filterStatus === 'all' 
      ? appointments 
      : appointments.filter(apt => apt.status === filterStatus)
  }, [appointments, filterStatus])

  // Memoized stats calculations
  const stats = useMemo(() => ({
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    totalHours: (appointments.reduce((sum, apt) => sum + apt.duration, 0) / 60).toFixed(1),
    revenue: appointments.reduce((sum, apt) => sum + apt.amount, 0).toFixed(0)
  }), [appointments])

  if (!cacheLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading salon data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Appointments
          </h1>
          <p className="text-gray-700 mt-2 font-medium">Manage your salon appointments</p>
        </div>
        <Link
          href="/salon/appointments/book"
          className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.02] flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Book Appointment
        </Link>
      </div>

      {/* Controls */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 rounded-lg bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 hover:text-violet-600 transition-all border border-white/20 shadow-md"
              disabled={loading}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center min-w-[250px]">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h2>
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 rounded-lg bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 hover:text-violet-600 transition-all border border-white/20 shadow-md"
              disabled={loading}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* View Selector */}
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-lg p-1 border border-white/20">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all",
                  view === v 
                    ? "bg-violet-600 text-white shadow-lg" 
                    : "text-gray-700 hover:text-violet-600 hover:bg-white/50"
                )}
                disabled={loading}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-violet-500 focus:bg-white/70 transition-all"
              disabled={loading}
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Appointments"
          value={stats.total}
          icon={Calendar}
          trend={12}
          loading={loading}
        />
        <StatCard
          title="Confirmed"
          value={stats.confirmed}
          icon={CheckCircle}
          loading={loading}
        />
        <StatCard
          title="Total Hours"
          value={`${stats.totalHours}h`}
          icon={Clock}
          loading={loading}
        />
        <StatCard
          title="Expected Revenue"
          value={`AED ${stats.revenue}`}
          icon={DollarSign}
          trend={8}
          loading={loading}
        />
      </div>

      {/* Calendar/List View */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden relative min-h-[600px]">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-violet-600 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Loading appointments...</p>
            </div>
          </div>
        )}
        
        {view === 'day' ? (
          <div className="p-6">
            {/* Time Slots Grid */}
            <div className="space-y-3">
              {timeSlots.map((time) => {
                const slotAppointments = filteredAppointments.filter(apt => apt.time === time)
                return (
                  <div key={time} className="flex gap-4">
                    <div className="w-20 text-gray-700 text-sm font-semibold pt-4">
                      {time}
                    </div>
                    <div className="flex-1 min-h-[80px] bg-white/30 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      {slotAppointments.length > 0 ? (
                        <div className="space-y-2">
                          {slotAppointments.map((apt) => (
                            <AppointmentCard
                              key={apt.id}
                              appointment={apt}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              onStatusChange={handleStatusChange}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-gray-500 text-sm">Available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="bg-violet-100/50 backdrop-blur-sm rounded-2xl p-8 border border-violet-200/50 inline-block">
              <Calendar className="w-16 h-16 text-violet-600 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">Week and Month views coming soon...</p>
              <p className="text-gray-600 text-sm mt-2">We're working on advanced calendar views</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
        <div>
          <p className="text-gray-700 font-semibold">Quick Actions</p>
          <p className="text-gray-600 text-sm mt-1">Manage today's appointments</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white/50 backdrop-blur-sm text-gray-700 rounded-lg font-medium hover:bg-white/70 transition-all border border-white/20">
            Print Schedule
          </button>
          <button className="px-4 py-2 bg-white/50 backdrop-blur-sm text-gray-700 rounded-lg font-medium hover:bg-white/70 transition-all border border-white/20">
            Export CSV
          </button>
          <button className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-all shadow-lg">
            Send Reminders
          </button>
        </div>
      </div>
    </div>
  )
}