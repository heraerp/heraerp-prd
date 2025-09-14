'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { universalApi } from '@/lib/universal-api'
import { Calendar, Clock, User, Plus, Filter, ChevronLeft, ChevronRight, Edit, Trash2, CheckCircle, XCircle, AlertCircle, DollarSign, Loader2, Scissors, Heart } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SalonCard, SalonStatCard } from '@/components/salon/SalonCard'

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

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<'day' | 'week'>('day')
  const [entityCache, setEntityCache] = useState<EntityCache>({})

  // Statistics
  const stats = useMemo(() => {
    const todayAppointments = appointments.filter(apt => 
      apt.transaction_date === selectedDate.toISOString().split('T')[0]
    )
    
    return {
      total: todayAppointments.length,
      confirmed: todayAppointments.filter(apt => apt.status === 'confirmed').length,
      completed: todayAppointments.filter(apt => apt.status === 'completed').length,
      revenue: todayAppointments.reduce((sum, apt) => sum + apt.amount, 0)
    }
  }, [appointments, selectedDate])

  // Load entity data (customers and stylists)
  const loadEntities = useCallback(async () => {
    try {
      universalApi.setOrganizationId(SALON_ORG_ID)
      
      // Load customers and employees
      const [customersResponse, employeesResponse] = await Promise.all([
        universalApi.getEntities({ filters: { entity_type: 'customer' } }),
        universalApi.getEntities({ filters: { entity_type: 'employee' } })
      ])

      const cache: EntityCache = {}
      
      if (customersResponse.success && customersResponse.data) {
        customersResponse.data.forEach(customer => {
          cache[customer.id] = customer
        })
      }
      
      if (employeesResponse.success && employeesResponse.data) {
        employeesResponse.data.forEach(employee => {
          cache[employee.id] = employee
        })
      }
      
      setEntityCache(cache)
    } catch (err) {
      console.error('Failed to load entities:', err)
    }
  }, [])

  // Load appointments
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      universalApi.setOrganizationId(SALON_ORG_ID)
      
      const response = await universalApi.getTransactions({
        filters: {
          transaction_type: 'appointment'
        }
      })

      if (response.success && response.data) {
        const formattedAppointments: Appointment[] = response.data.map(apt => ({
          id: apt.id,
          transaction_date: apt.transaction_date,
          customer_id: apt.from_entity_id || '',
          customer_name: apt.metadata?.customer_name || entityCache[apt.from_entity_id]?.entity_name || 'Customer',
          service_name: apt.metadata?.service_name || 'Service',
          stylist_id: apt.to_entity_id || '',
          stylist_name: apt.metadata?.stylist_name || entityCache[apt.to_entity_id]?.entity_name || 'Stylist',
          time: apt.metadata?.appointment_time || '09:00',
          duration: apt.metadata?.duration || 60,
          status: apt.metadata?.status || 'scheduled',
          amount: apt.total_amount || 0,
          notes: apt.metadata?.notes
        }))
        
        setAppointments(formattedAppointments)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [entityCache])

  useEffect(() => {
    loadEntities()
  }, [loadEntities])

  useEffect(() => {
    if (Object.keys(entityCache).length > 0) {
      loadAppointments()
    }
  }, [entityCache, loadAppointments])

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    }
    setSelectedDate(newDate)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-[#8FBC8F]/20 text-[#8FBC8F] border-[#8FBC8F]/30'
      case 'completed': return 'bg-[#D2B48C]/20 text-[#D2B48C] border-[#D2B48C]/30'
      case 'cancelled': return 'bg-[#DC143C]/20 text-[#DC143C] border-[#DC143C]/30'
      default: return 'bg-[#9370DB]/20 text-[#9370DB] border-[#9370DB]/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return CheckCircle
      case 'completed': return DollarSign
      case 'cancelled': return XCircle
      default: return Clock
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#DC143C] mx-auto mb-4" />
          <p className="text-white/60">Loading appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Appointments
          </h1>
          <p className="text-white/60 mt-1">Manage your salon appointments and schedule</p>
        </div>
        <GlassmorphicButton theme={theme} variant="primary" className="ml-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span>New Appointment</span>
        </GlassmorphicButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassmorphicStatCard
          label="Today's Appointments"
          value={stats.total}
          icon={Calendar}
          theme={theme}
        />
        <GlassmorphicStatCard
          label="Confirmed"
          value={stats.confirmed}
          icon={CheckCircle}
          theme={theme}
        />
        <GlassmorphicStatCard
          label="Completed"
          value={stats.completed}
          icon={Heart}
          theme={theme}
        />
        <GlassmorphicStatCard
          label="Today's Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          icon={DollarSign}
          theme={theme}
        />
      </div>

      {/* Calendar Controls */}
      <GlassmorphicCard theme={theme}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-lg font-semibold text-white">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('day')}
              className={cn(
                "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                view === 'day' 
                  ? "bg-gradient-to-r from-[#DC143C] to-[#9370DB] text-white" 
                  : "bg-white/10 text-white/60 hover:text-white"
              )}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={cn(
                "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                view === 'week' 
                  ? "bg-gradient-to-r from-[#DC143C] to-[#9370DB] text-white" 
                  : "bg-white/10 text-white/60 hover:text-white"
              )}
            >
              Week
            </button>
          </div>
        </div>

        {/* Time Slots Grid */}
        <div className="space-y-2">
          {timeSlots.map(time => {
            const dayAppointments = appointments.filter(apt => 
              apt.transaction_date === selectedDate.toISOString().split('T')[0] &&
              apt.time === time
            )
            
            return (
              <div key={time} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-16 text-sm font-medium text-white/60">{time}</div>
                <div className="flex-1">
                  {dayAppointments.length > 0 ? (
                    <div className="space-y-2">
                      {dayAppointments.map(apt => (
                        <div 
                          key={apt.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-[#DC143C] to-[#9370DB]">
                              <Scissors className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{apt.customer_name}</p>
                              <p className="text-sm text-white/60">{apt.service_name} • {apt.stylist_name}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1",
                              getStatusColor(apt.status)
                            )}>
                              {React.createElement(getStatusIcon(apt.status), { className: 'w-3 h-3' })}
                              {apt.status}
                            </span>
                            <span className="text-sm font-medium text-[#FFE4B5]">₹{apt.amount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-12 flex items-center">
                      <div className="w-full h-0.5 bg-white/5 rounded" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </GlassmorphicCard>
    </div>
  )
}