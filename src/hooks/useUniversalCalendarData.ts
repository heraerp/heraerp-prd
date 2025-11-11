/**
 * HERA Universal Calendar Data Hook
 * Smart Code: HERA.HOOKS.CALENDAR.DATA.UNIVERSAL.v1
 *
 * Fetches real HERA data for any business vertical (salon, healthcare, consulting, manufacturing)
 * Transforms data into universal calendar format for industry-agnostic display
 *
 * Features:
 * - Real-time data from Sacred Six tables
 * - Industry-aware entity type mapping
 * - Full month caching for performance
 * - Automatic data transformation
 * - Update/refetch support
 */

import { useMemo } from 'react'
import { useHeraAppointments } from './useHeraAppointments'
import { useHeraStaff } from './useHeraStaff'
import { useHeraCustomers } from './useHeraCustomers'
import { useHeraServices } from './useHeraServices'
import {
  transformAppointmentsToUniversal,
  transformResourcesToUniversal,
  transformClientsToUniversal,
  transformServicesToUniversal
} from '@/lib/calendar/universal-transformers'

// Industry-to-HERA entity type mappings
const ENTITY_TYPE_MAP = {
  salon: {
    appointment: 'salon_appointment',
    resource: 'stylist',
    client: 'customer',
    service: 'service',
    resourceIdField: 'stylist_id'
  },
  healthcare: {
    appointment: 'medical_appointment',
    resource: 'doctor',
    client: 'patient',
    service: 'treatment',
    resourceIdField: 'doctor_id'
  },
  consulting: {
    appointment: 'consulting_session',
    resource: 'consultant',
    client: 'client',
    service: 'session_type',
    resourceIdField: 'consultant_id'
  },
  manufacturing: {
    appointment: 'production_job',
    resource: 'operator',
    client: 'work_order',
    service: 'job_type',
    resourceIdField: 'operator_id'
  }
} as const

export interface UseUniversalCalendarDataParams {
  businessType: keyof typeof ENTITY_TYPE_MAP
  organizationId: string
  dateRange: {
    from: string
    to: string
  }
  branchId?: string
  canViewAllBranches?: boolean
}

export function useUniversalCalendarData({
  businessType,
  organizationId,
  dateRange,
  branchId,
  canViewAllBranches = false
}: UseUniversalCalendarDataParams) {
  // Get entity type mappings for this business vertical
  const entityTypes = ENTITY_TYPE_MAP[businessType]

  // ✅ HERA DATA: Fetch appointments from universal_transactions
  const {
    appointments: rawAppointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    updateAppointment,
    refetch: refetchAppointments
  } = useHeraAppointments({
    organizationId,
    filters: {
      // Branch filtering (only if not viewing all branches)
      ...(branchId && !canViewAllBranches ? { branch_id: branchId } : {}),
      // Date range for performance
      date_from: dateRange.from,
      date_to: dateRange.to
      // Note: Entity type filtering can be added if needed
      // entity_type: entityTypes.appointment
    }
  })

  // ✅ HERA DATA: Fetch resources (staff/doctors/consultants/operators) from core_entities
  const { staff: rawResources, isLoading: resourcesLoading } = useHeraStaff({
    organizationId,
    filters: {
      ...(branchId && !canViewAllBranches ? { branch_id: branchId } : {})
      // entity_type: entityTypes.resource
    }
  })

  // ✅ HERA DATA: Fetch clients/customers/patients from core_entities
  const { customers: rawClients, isLoading: clientsLoading } = useHeraCustomers({
    organizationId
    // All clients for selection, no branch filter
  })

  // ✅ HERA DATA: Fetch services/treatments/sessions from core_entities
  const { services: rawServices, isLoading: servicesLoading } = useHeraServices({
    organizationId
    // All services for selection
  })

  // ✅ TRANSFORM: Convert HERA data to universal calendar format
  const appointments = useMemo(() => {
    if (!rawAppointments) return []
    return transformAppointmentsToUniversal(rawAppointments, businessType, entityTypes)
  }, [rawAppointments, businessType, entityTypes])

  const resources = useMemo(() => {
    if (!rawResources) return []
    return transformResourcesToUniversal(rawResources, businessType)
  }, [rawResources, businessType])

  const clients = useMemo(() => {
    if (!rawClients) return []
    return transformClientsToUniversal(rawClients, businessType)
  }, [rawClients, businessType])

  const services = useMemo(() => {
    if (!rawServices) return []
    return transformServicesToUniversal(rawServices, businessType)
  }, [rawServices, businessType])

  // ✅ LOADING: Aggregate loading states
  const loading = appointmentsLoading || resourcesLoading || clientsLoading || servicesLoading

  // ✅ ERROR: Return first error encountered
  const error = appointmentsError

  return {
    // Transformed data
    appointments,
    resources,
    clients,
    services,

    // Loading & error states
    loading,
    error,

    // Mutations
    updateAppointment,
    refetchAppointments,

    // Metadata
    entityTypes,
    resourceIdField: entityTypes.resourceIdField
  }
}
