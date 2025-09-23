/**
 * HERA Appointment Management Hook - Playbook Version
 * Smart Code: HERA.HOOKS.APPOINTMENTS.PLAYBOOK.v1
 *
 * Uses Playbook API for appointment operations
 * Follows HERA guardrails with Sacred Six tables
 */

import { useState, useCallback, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import {
  searchAppointments,
  AppointmentDTO,
  AppointmentStatus,
  AppointmentSearchParams
} from '@/lib/playbook/entities'
import { toast } from '@/hooks/use-toast'
import { addDays, startOfDay, endOfDay } from 'date-fns'

export interface UseAppointmentsFilters {
  date_from?: string
  date_to?: string
  status?: AppointmentStatus[]
  stylist_id?: string
  customer_id?: string
  branch_id?: string
  q?: string
  page?: number
  page_size?: number
}

export interface UseAppointmentsReturn {
  // Data
  data: AppointmentDTO[]
  total: number
  loading: boolean
  error: string | null

  // Filters
  filters: UseAppointmentsFilters
  setFilters: (filters: UseAppointmentsFilters) => void

  // Actions
  refresh: () => Promise<void>

  // Context
  organizationId: string | null
}

export function useAppointmentsPlaybook(
  initialFilters?: Partial<UseAppointmentsFilters>
): UseAppointmentsReturn {
  const { organization, isAuthenticated, isLoading: contextLoading } = useHERAAuth()

  // State
  const [data, setData] = useState<AppointmentDTO[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default filters: today to +14 days
  const defaultFilters: UseAppointmentsFilters = {
    date_from: startOfDay(new Date()).toISOString(),
    date_to: endOfDay(addDays(new Date(), 14)).toISOString(),
    page: 1,
    page_size: 20,
    ...initialFilters
  }

  const [filters, setFilters] = useState<UseAppointmentsFilters>(defaultFilters)

  // Use organization ID from context or demo
  const organizationId = organization?.id || null

  // Check for demo organization in cookies or localStorage
  const getDemoOrgId = useCallback(() => {
    if (typeof window === 'undefined') return null

    // Check if we're on hairtalkz subdomain
    const hostname = window.location.hostname
    if (hostname.startsWith('hairtalkz.') || hostname === 'hairtalkz.localhost') {
      return '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hair Talkz org ID
    }

    // First try localStorage
    const localStorageOrgId = localStorage.getItem('organizationId')
    if (localStorageOrgId) {
      return localStorageOrgId
    }

    // Then try cookies
    const cookies = document.cookie.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      },
      {} as Record<string, string>
    )

    return cookies['hera-demo-org'] || null
  }, [])

  const effectiveOrgId = organizationId || getDemoOrgId()

  // Load appointments
  const loadAppointments = useCallback(async () => {
    if (!effectiveOrgId) {
      console.log('⚠️ No organization ID available')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params: AppointmentSearchParams = {
        organization_id: effectiveOrgId,
        ...filters
      }

      console.log('📅 Loading appointments with params:', params)

      const result = await searchAppointments(params)

      console.log(`✅ Loaded ${result.rows.length} appointments (total: ${result.total})`)

      setData(result.rows)
      setTotal(result.total)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load appointments'
      console.error('❌ Error loading appointments:', err)
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [effectiveOrgId, filters])

  // Load appointments when filters or org changes
  useEffect(() => {
    if (effectiveOrgId && !contextLoading) {
      loadAppointments()
    }
  }, [effectiveOrgId, contextLoading, loadAppointments])

  return {
    data,
    total,
    loading: loading || contextLoading,
    error,
    filters,
    setFilters,
    refresh: loadAppointments,
    organizationId: effectiveOrgId
  }
}
