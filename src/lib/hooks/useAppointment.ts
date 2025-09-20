// ================================================================================
// HERA APPOINTMENT HOOKS
// Smart Code: HERA.HOOKS.APPOINTMENT.v1
// React Query hooks for appointment operations with optimistic updates
// ================================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/utils'
import { AppointmentsApi } from '@/lib/api/appointments'
import { 
  AppointmentCreate, 
  AppointmentTransition, 
  AppointmentFilters,
  ACTION_TO_STATUS,
  Appointment
} from '@/lib/schemas/appointment'

// Single appointment hook
export function useAppointment(id: string, api: AppointmentsApi) {
  const queryClient = useQueryClient()

  // Fetch appointment
  const get = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => api.get(id),
    enabled: !!id,
  })

  // Update appointment
  const update = useMutation({
    mutationKey: ['appointment-update', id],
    mutationFn: (data: Partial<AppointmentCreate>) => api.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] })
      toast.success('Appointment updated')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update appointment')
    },
  })

  // Transition appointment
  const transition = useMutation({
    mutationKey: ['appointment-transition', id],
    mutationFn: (body: AppointmentTransition) => api.transition(id, body),
    onMutate: async (body) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['appointment', id] })
      
      // Snapshot the previous value
      const previousAppointment = queryClient.getQueryData(['appointment', id])
      
      // Optimistically update to the new value
      if (previousAppointment && typeof previousAppointment === 'object') {
        const newStatus = ACTION_TO_STATUS[body.action]
        queryClient.setQueryData(['appointment', id], {
          ...(previousAppointment as any),
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
      }

      // Show optimistic toast
      const messages: Record<string, string> = {
        confirm: 'Appointment confirmed',
        start: 'Appointment started',
        complete: 'Service completed',
        mark_paid: 'Payment recorded',
        close: 'Appointment closed',
        cancel: 'Appointment cancelled',
        no_show: 'Marked as no-show',
      }
      toast.success(messages[body.action] || 'Status updated')

      // Show WhatsApp side-effect toasts
      if (body.action === 'confirm') {
        setTimeout(() => toast.info('WhatsApp: Confirmation message queued'), 1000)
      }
      if (body.action === 'close') {
        setTimeout(() => toast.info('WhatsApp: Thank you message sent'), 1000)
      }

      return { previousAppointment }
    },
    onError: (error, _, context) => {
      // If mutation fails, use the context to roll back
      if (context?.previousAppointment) {
        queryClient.setQueryData(['appointment', id], context.previousAppointment)
      }
      toast.error(error instanceof Error ? error.message : 'Failed to update status')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['appointment', id] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  return {
    appointment: get.data,
    isLoading: get.isLoading,
    error: get.error,
    update,
    transition,
  }
}

// Appointment list hook
export function useAppointments(filters: AppointmentFilters, api: AppointmentsApi) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => api.list(filters),
  })
}

// Create appointment hook
export function useCreateAppointment(api: AppointmentsApi) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationKey: ['appointment-create'],
    mutationFn: (payload: AppointmentCreate) => api.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Appointment booked successfully')
      setTimeout(() => toast.info('WhatsApp: Confirmation message queued'), 1000)
      router.push(`/appointments/${data.id}`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to book appointment')
    },
  })
}

// Appointment activity hook
export function useAppointmentActivity(appointmentId: string, api: AppointmentsApi) {
  return useQuery({
    queryKey: ['appointment-activity', appointmentId],
    queryFn: () => api.getActivity(appointmentId),
    enabled: !!appointmentId,
  })
}

// Available slots hook
export function useAvailableSlots(params: {
  branch_code: string
  stylist_code: string
  date: string
  service_duration: number
}, api: AppointmentsApi) {
  return useQuery({
    queryKey: ['available-slots', params],
    queryFn: () => api.getAvailableSlots(params),
    enabled: !!(params.branch_code && params.stylist_code && params.date),
  })
}

// Upcoming appointments count
export function useUpcomingCount(organizationId: string, api: AppointmentsApi) {
  return useQuery({
    queryKey: ['appointments-upcoming-count', organizationId],
    queryFn: () => api.getUpcomingCount(organizationId),
    enabled: !!organizationId,
  })
}

// Appointment navigation hook
export function useAppointmentNavigation() {
  const router = useRouter()

  return {
    goToDetail: (id: string) => router.push(`/appointments/${id}`),
    goToActivity: (id: string) => router.push(`/appointments/${id}/activity`),
    goToCalendar: () => router.push('/appointments/calendar'),
    goToBoard: () => router.push('/appointments/board'),
    goToNew: () => router.push('/appointments/new'),
    goToPOS: (appointmentId: string) => router.push(`/pos/sale?apptId=${appointmentId}`),
    goToCustomer: (customerId: string) => router.push(`/customers/${customerId}`),
    goToStaff: (staffId: string) => router.push(`/staff/${staffId}`),
  }
}

