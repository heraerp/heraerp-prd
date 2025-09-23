/**
 * Unit tests for useAppointmentsPlaybook hook
 * Verifies proper organization_id passing and filter building
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useAppointmentsPlaybook } from '../useAppointmentsPlaybook'
import * as PlaybookEntities from '@/lib/playbook/entities'

// Mock the dependencies
jest.mock('@/components/auth/HERAAuthProvider', () => ({
  useHERAAuth: jest.fn(() => ({
    currentOrganization: { id: 'test-org-123' },
    isAuthenticated: true,
    isLoading: false
  }))
}))

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}))

// Mock the Playbook API
jest.spyOn(PlaybookEntities, 'searchAppointments')

describe('useAppointmentsPlaybook', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful API response
    ;(PlaybookEntities.searchAppointments as jest.Mock).mockResolvedValue({
      rows: [
        {
          id: 'apt-1',
          organization_id: 'test-org-123',
          smart_code: 'HERA.SALON.APPT.ENTITY.APPOINTMENT.V1',
          entity_name: 'Appointment - John Doe',
          entity_code: 'APPT-001',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          status: 'booked',
          customer_id: 'cust-1',
          stylist_id: 'staff-1',
          service_ids: ['svc-1'],
          price: 150,
          currency_code: 'AED'
        }
      ],
      total: 1
    })
  })

  it('should pass organization_id to searchAppointments', async () => {
    const { result } = renderHook(() => useAppointmentsPlaybook())

    // Wait for the initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verify searchAppointments was called with organization_id
    expect(PlaybookEntities.searchAppointments).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 'test-org-123'
      })
    )
  })

  it('should include date filters by default', async () => {
    const { result } = renderHook(() => useAppointmentsPlaybook())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should have date_from and date_to in the params
    expect(PlaybookEntities.searchAppointments).toHaveBeenCalledWith(
      expect.objectContaining({
        date_from: expect.any(String),
        date_to: expect.any(String)
      })
    )
  })

  it('should pass status filter when provided', async () => {
    const { result } = renderHook(() =>
      useAppointmentsPlaybook({
        status: ['booked', 'checked_in']
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(PlaybookEntities.searchAppointments).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ['booked', 'checked_in']
      })
    )
  })

  it('should pass search query when provided', async () => {
    const { result } = renderHook(() =>
      useAppointmentsPlaybook({
        q: 'John Doe'
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(PlaybookEntities.searchAppointments).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'John Doe'
      })
    )
  })

  it('should handle empty results', async () => {
    ;(PlaybookEntities.searchAppointments as jest.Mock).mockResolvedValueOnce({
      rows: [],
      total: 0
    })

    const { result } = renderHook(() => useAppointmentsPlaybook())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual([])
    expect(result.current.total).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to load appointments'
    ;(PlaybookEntities.searchAppointments as jest.Mock).mockRejectedValueOnce(
      new Error(errorMessage)
    )

    const { result } = renderHook(() => useAppointmentsPlaybook())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.data).toEqual([])
  })
})
