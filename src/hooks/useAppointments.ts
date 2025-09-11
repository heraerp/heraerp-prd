/**
 * HERA Appointment Management Hook
 * 
 * React hook for appointment functionality
 */

import { useState, useCallback, useEffect } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { appointmentApi } from '@/lib/salon/appointment-api'
import { toast } from '@/hooks/use-toast'

export interface Appointment {
  id: string
  customerName: string
  customerId: string
  serviceName: string
  serviceId: string
  staffName: string
  staffId: string
  appointmentDate: Date
  appointmentTime: string
  duration: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  price: number
  notes?: string
  createdAt: Date
}

export interface AppointmentStats {
  todayTotal: number
  weekTotal: number
  monthTotal: number
  pendingCount: number
  confirmedCount: number
  cancelledCount: number
  revenueToday: number
  revenueMonth: number
}

interface UseAppointmentsOptions {
  organizationId?: string
  autoRefreshInterval?: number
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
  const { currentOrganization, user } = useMultiOrgAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // State for appointment data
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState<AppointmentStats>({
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0,
    pendingCount: 0,
    confirmedCount: 0,
    cancelledCount: 0,
    revenueToday: 0,
    revenueMonth: 0
  })

  // Use provided organizationId or fallback to currentOrganization
  const organizationId = options.organizationId || currentOrganization?.id

  // Create a new appointment
  const createAppointment = useCallback(async (data: {
    customerId: string
    serviceId: string
    staffId: string
    appointmentDate: string
    appointmentTime: string
    duration: number
    notes?: string
  }) => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'No organization context found',
        variant: 'destructive'
      })
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const result = await appointmentApi.createAppointment(data, organizationId)
      
      toast({
        title: 'Success',
        description: 'Appointment created successfully',
      })

      // Refresh data
      await refreshAppointments()

      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  // Confirm an appointment
  const confirmAppointment = useCallback(async (appointmentId: string) => {
    if (!organizationId) return null

    setLoading(true)
    try {
      const result = await appointmentApi.updateAppointmentStatus(
        appointmentId,
        'confirmed',
        organizationId
      )

      toast({
        title: 'Success',
        description: 'Appointment confirmed',
      })

      await refreshAppointments()
      return result
    } catch (err) {
      const error = err as Error
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  // Cancel an appointment
  const cancelAppointment = useCallback(async (appointmentId: string, reason?: string) => {
    if (!organizationId) return null

    setLoading(true)
    try {
      const result = await appointmentApi.updateAppointmentStatus(
        appointmentId,
        'cancelled',
        organizationId,
        reason
      )

      toast({
        title: 'Success',
        description: 'Appointment cancelled',
      })

      await refreshAppointments()
      return result
    } catch (err) {
      const error = err as Error
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  // Complete an appointment
  const completeAppointment = useCallback(async (appointmentId: string) => {
    if (!organizationId) return null

    setLoading(true)
    try {
      const result = await appointmentApi.updateAppointmentStatus(
        appointmentId,
        'completed',
        organizationId
      )

      toast({
        title: 'Success',
        description: 'Appointment marked as completed',
      })

      await refreshAppointments()
      return result
    } catch (err) {
      const error = err as Error
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  // Refresh all appointment data
  const refreshAppointments = useCallback(async () => {
    if (!organizationId) return

    setLoading(true)
    try {
      // Fetch all appointments for this organization
      const appointmentsData = await appointmentApi.getAppointments(organizationId)
      
      // Transform the data to our Appointment interface
      const transformedAppointments = appointmentsData.map((apt: any) => ({
        id: apt.id,
        customerName: (apt.metadata as any)?.customer_name || 'Unknown Customer',
        customerId: apt.from_entity_id || '',
        serviceName: (apt.metadata as any)?.service_name || 'Unknown Service',
        serviceId: (apt.metadata as any)?.service_id || '',
        staffName: (apt.metadata as any)?.staff_name || 'Any Staff',
        staffId: (apt.metadata as any)?.staff_id || '',
        appointmentDate: new Date((apt.metadata as any)?.appointment_date || apt.transaction_date),
        appointmentTime: (apt.metadata as any)?.appointment_time || '00:00',
        duration: (apt.metadata as any)?.duration || 60,
        status: (apt.metadata as any)?.status || 'pending',
        price: apt.total_amount || 0,
        notes: (apt.metadata as any)?.notes,
        createdAt: new Date(apt.created_at)
      }))

      setAppointments(transformedAppointments)

      // Calculate stats
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const todayAppointments = transformedAppointments.filter(
        apt => apt.appointmentDate >= today && apt.appointmentDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
      )

      const weekAppointments = transformedAppointments.filter(
        apt => apt.appointmentDate >= weekAgo
      )

      const monthAppointments = transformedAppointments.filter(
        apt => apt.appointmentDate >= monthStart
      )

      setStats({
        todayTotal: todayAppointments.length,
        weekTotal: weekAppointments.length,
        monthTotal: monthAppointments.length,
        pendingCount: transformedAppointments.filter(apt => apt.status === 'pending').length,
        confirmedCount: transformedAppointments.filter(apt => apt.status === 'confirmed').length,
        cancelledCount: transformedAppointments.filter(apt => apt.status === 'cancelled').length,
        revenueToday: todayAppointments.reduce((sum, apt) => sum + apt.price, 0),
        revenueMonth: monthAppointments.reduce((sum, apt) => sum + apt.price, 0)
      })
    } catch (err) {
      console.error('Failed to refresh appointment data:', err)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  // Auto-refresh if enabled
  useEffect(() => {
    if (options.autoRefreshInterval && organizationId) {
      const interval = setInterval(() => {
        refreshAppointments()
      }, options.autoRefreshInterval)

      return () => clearInterval(interval)
    }
  }, [options.autoRefreshInterval, organizationId, refreshAppointments])

  // Initial data load
  useEffect(() => {
    if (organizationId) {
      refreshAppointments()
    }
  }, [organizationId, refreshAppointments])

  return {
    // State
    loading,
    error,
    appointments,
    stats,
    
    // Actions
    createAppointment,
    confirmAppointment,
    cancelAppointment,
    completeAppointment,
    refreshAppointments,
    
    // Context
    organizationId,
    userId: user?.id
  }
}