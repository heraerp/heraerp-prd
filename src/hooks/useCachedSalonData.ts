/**
 * Cached Salon Data Hooks
 * Adds React Query caching to existing salon data fetching
 * WITHOUT breaking the existing SecuredSalonProvider
 */

import { useQuery } from '@tanstack/react-query'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { useHeraAppointments } from './useHeraAppointments'
import { useHeraStaff } from './useHeraStaff'
import { useHeraCustomers } from './useHeraCustomers'
import { useHeraServices } from './useHeraServices'

// Query keys for consistent caching
const SALON_QUERY_KEYS = {
  appointments: (orgId: string, filters?: any) => ['salon', 'appointments', orgId, filters],
  staff: (orgId: string, filters?: any) => ['salon', 'staff', orgId, filters],
  customers: (orgId: string, filters?: any) => ['salon', 'customers', orgId, filters],
  services: (orgId: string, filters?: any) => ['salon', 'services', orgId, filters],
} as const

/**
 * Cached appointments hook - uses existing useHeraAppointments with caching
 */
export function useCachedAppointments(filters?: any) {
  const { organizationId } = useSecuredSalonContext()
  
  return useQuery({
    queryKey: SALON_QUERY_KEYS.appointments(organizationId || '', filters),
    queryFn: () => {
      // This will use the existing useHeraAppointments logic
      const { appointments } = useHeraAppointments()
      return appointments
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Cached staff hook - uses existing useHeraStaff with caching
 */
export function useCachedStaff(filters?: any) {
  const { organizationId } = useSecuredSalonContext()
  
  return useQuery({
    queryKey: SALON_QUERY_KEYS.staff(organizationId || '', filters),
    queryFn: () => {
      const { staff } = useHeraStaff()
      return staff
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Cached customers hook - uses existing useHeraCustomers with caching
 */
export function useCachedCustomers(filters?: any) {
  const { organizationId } = useSecuredSalonContext()
  
  return useQuery({
    queryKey: SALON_QUERY_KEYS.customers(organizationId || '', filters),
    queryFn: () => {
      const { customers } = useHeraCustomers()
      return customers
    },
    enabled: !!organizationId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
  })
}

/**
 * Cached services hook - uses existing useHeraServices with caching
 */
export function useCachedServices(filters?: any) {
  const { organizationId } = useSecuredSalonContext()
  
  return useQuery({
    queryKey: SALON_QUERY_KEYS.services(organizationId || '', filters),
    queryFn: () => {
      const { services } = useHeraServices()
      return services
    },
    enabled: !!organizationId,
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

/**
 * Dashboard data aggregator with caching
 */
export function useCachedDashboardData() {
  const { organizationId } = useSecuredSalonContext()
  
  const appointmentsQuery = useCachedAppointments()
  const staffQuery = useCachedStaff()
  const customersQuery = useCachedCustomers()
  const servicesQuery = useCachedServices()
  
  const isLoading = appointmentsQuery.isLoading || staffQuery.isLoading || 
                   customersQuery.isLoading || servicesQuery.isLoading
  
  const error = appointmentsQuery.error || staffQuery.error || 
               customersQuery.error || servicesQuery.error
  
  return {
    appointments: appointmentsQuery.data || [],
    staff: staffQuery.data || [],
    customers: customersQuery.data || [],
    services: servicesQuery.data || [],
    isLoading,
    error,
    refetch: () => {
      appointmentsQuery.refetch()
      staffQuery.refetch()
      customersQuery.refetch()
      servicesQuery.refetch()
    }
  }
}