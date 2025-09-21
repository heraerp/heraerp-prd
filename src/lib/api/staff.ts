// ================================================================================
// HERA STAFF API
// Smart Code: HERA.API.STAFF.v1
// Staff utilization and management API
// ================================================================================

import { useQuery } from '@tanstack/react-query'
import { universalApi } from '@/lib/universal-api'

interface StaffUtilizationData {
  id: string
  name: string
  utilization: number // percentage 0-100
  appointments_count: number
  hours_booked: number
  hours_available: number
}

interface StaffUtilizationParams {
  organizationId: string
  date: string
}

// Mock data for development
const mockStaffData: StaffUtilizationData[] = [
  {
    id: 'staff-001',
    name: 'Lisa Chen',
    utilization: 87.5,
    appointments_count: 7,
    hours_booked: 7,
    hours_available: 8
  },
  {
    id: 'staff-002',
    name: 'Maria Rodriguez',
    utilization: 75.0,
    appointments_count: 6,
    hours_booked: 6,
    hours_available: 8
  },
  {
    id: 'staff-003',
    name: 'Ahmed Hassan',
    utilization: 62.5,
    appointments_count: 5,
    hours_booked: 5,
    hours_available: 8
  },
  {
    id: 'staff-004',
    name: 'Sarah Johnson',
    utilization: 50.0,
    appointments_count: 4,
    hours_booked: 4,
    hours_available: 8
  },
  {
    id: 'staff-005',
    name: 'Emily Brown',
    utilization: 37.5,
    appointments_count: 3,
    hours_booked: 3,
    hours_available: 8
  }
]

// ================================================================================
// REACT QUERY HOOKS
// ================================================================================

export function useStaffUtilization({ organizationId, date }: StaffUtilizationParams) {
  return useQuery({
    queryKey: ['staff', 'utilization', organizationId, date],
    queryFn: async () => {
      // In production, this would query:
      // 1. Get staff entities (entity_type = 'employee', role includes 'stylist')
      // 2. Get appointments for the date
      // 3. Calculate utilization based on booked hours vs available hours

      // For now, return mock data
      return {
        staff: mockStaffData
      }
    },
    enabled: !!organizationId && !!date
  })
}
