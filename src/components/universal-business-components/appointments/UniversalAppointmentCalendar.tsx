'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Calendar,
  Clock,
  User,
  Plus,
  Search
} from 'lucide-react'

export interface UniversalAppointment {
  id: string
  title: string
  description?: string
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  client_name: string
  client_email?: string
  client_phone?: string
  service_type: string
  location?: string
  status: 'draft' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  notes?: string
  metadata?: any
  created_at: string
  updated_at: string
}

export interface IndustryConfig {
  name: string
  icon: string
  primaryColor: string
  serviceTypes: string[]
  appointmentLabels: {
    singular: string
    plural: string
  }
  statusLabels: Record<string, string>
  priorityLabels: Record<string, string>
}

export interface UniversalAppointmentCalendarProps {
  organizationId: string
  industry?: string
  customization?: {
    primaryColor?: string
    brandName?: string
    logo?: string
  }
  onAppointmentClick?: (appointment: UniversalAppointment) => void
  onSlotClick?: (date: string, time: string) => void
  onAppointmentCreate?: (appointment: Partial<UniversalAppointment>) => Promise<void>
  onAppointmentUpdate?: (id: string, updates: Partial<UniversalAppointment>) => Promise<void>
  onAppointmentDelete?: (id: string) => Promise<void>
  view?: 'month' | 'week' | 'day' | 'agenda'
  readonly?: boolean
}

// Industry-specific configurations
const INDUSTRY_CONFIGS: Record<string, IndustryConfig> = {
  jewelry: {
    name: 'Jewelry Store',
    icon: '💎',
    primaryColor: '#8B5CF6',
    serviceTypes: ['Design Consultation', 'Jewelry Appraisal', 'Repair Service', 'Custom Design', 'Ring Sizing'],
    appointmentLabels: { singular: 'Consultation', plural: 'Consultations' },
    statusLabels: {
      draft: 'Draft',
      scheduled: 'Scheduled',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show'
    },
    priorityLabels: {
      low: 'Standard',
      medium: 'Important',
      high: 'High Priority',
      urgent: 'Rush Order'
    }
  },
  healthcare: {
    name: 'Healthcare',
    icon: '🏥',
    primaryColor: '#10B981',
    serviceTypes: ['General Checkup', 'Specialist Consultation', 'Laboratory Test', 'Vaccination', 'Follow-up'],
    appointmentLabels: { singular: 'Appointment', plural: 'Appointments' },
    statusLabels: {
      draft: 'Draft',
      scheduled: 'Scheduled',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show'
    },
    priorityLabels: {
      low: 'Routine',
      medium: 'Standard',
      high: 'Urgent',
      urgent: 'Emergency'
    }
  },
  default: {
    name: 'General Business',
    icon: '📅',
    primaryColor: '#6366F1',
    serviceTypes: ['Meeting', 'Consultation', 'Service', 'Follow-up'],
    appointmentLabels: { singular: 'Appointment', plural: 'Appointments' },
    statusLabels: {
      draft: 'Draft',
      scheduled: 'Scheduled',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show'
    },
    priorityLabels: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    }
  }
}

export function UniversalAppointmentCalendar({
  organizationId,
  industry = 'default',
  customization,
  onAppointmentClick,
  onSlotClick,
  view = 'month',
  readonly = false
}: UniversalAppointmentCalendarProps) {
  const [appointments, setAppointments] = useState<UniversalAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Get industry configuration
  const config = INDUSTRY_CONFIGS[industry] || INDUSTRY_CONFIGS.default
  const primaryColor = customization?.primaryColor || config.primaryColor

  // Load appointments
  useEffect(() => {
    loadAppointments()
  }, [organizationId])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockAppointments: UniversalAppointment[] = [
        {
          id: '1',
          title: 'Diamond Ring Consultation',
          description: 'Custom engagement ring design consultation',
          start_date: '2024-12-15',
          start_time: '10:00',
          end_date: '2024-12-15',
          end_time: '11:00',
          client_name: 'Sarah Johnson',
          client_email: 'sarah@example.com',
          client_phone: '+1-555-0123',
          service_type: 'Design Consultation',
          location: 'Main Showroom',
          status: 'confirmed',
          priority: 'high',
          assigned_to: 'Emma Wilson',
          notes: 'Prefers vintage styles, budget $5,000-8,000',
          created_at: '2024-12-10T09:00:00Z',
          updated_at: '2024-12-10T09:00:00Z'
        }
      ]

      setAppointments(mockAppointments)
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const matchesSearch = !searchTerm || 
        appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.service_type.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }, [appointments, searchTerm])

  // Get status color
  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customization?.brandName || config.name} {config.appointmentLabels.plural}
            </h1>
            <p className="text-gray-600">
              Universal appointment management for {config.name.toLowerCase()}
            </p>
          </div>
        </div>

        {!readonly && (
          <button
            onClick={() => onSlotClick?.('', '')}
            style={{ backgroundColor: primaryColor }}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New {config.appointmentLabels.singular}</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search appointments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Appointments Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="bg-white rounded-lg border p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg border p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {config.appointmentLabels.plural} Found
            </h3>
            {!readonly && (
              <button 
                onClick={() => onSlotClick?.('', '')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule {config.appointmentLabels.singular}</span>
              </button>
            )}
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div 
              key={appointment.id} 
              className="bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onAppointmentClick?.(appointment)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                  {appointment.title}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(appointment.status)}`}>
                  {config.statusLabels[appointment.status]}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{appointment.client_name}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{appointment.start_time} - {appointment.end_time}</span>
                </div>
              </div>

              {appointment.notes && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  <span className="line-clamp-2">{appointment.notes}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid gap-4 md:grid-cols-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {filteredAppointments.length}
            </div>
            <div className="text-sm text-gray-600">
              Total {config.appointmentLabels.plural}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {filteredAppointments.filter(a => a.status === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {filteredAppointments.filter(a => a.priority === 'high' || a.priority === 'urgent').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {filteredAppointments.filter(a => a.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UniversalAppointmentCalendar