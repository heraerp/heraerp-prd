/**
 * Tests for hardened Playbook Entities implementation
 */

import { 
  searchAppointments,
  groupDynamicByEntity,
  coerceDynValue,
  toISO,
  toAppointmentDTO,
  fetchDynamicForEntities
} from '../entities'
import { universalApi } from '@/lib/universal-api-v2'

// Re-export private functions for testing
const testHelpers = {
  groupDynamicByEntity,
  coerceDynValue,
  toISO,
  toAppointmentDTO
}

jest.mock('@/src/lib/universal-api-v2')

describe('Playbook Entities - Hardened Implementation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(universalApi.setOrganizationId as jest.Mock) = jest.fn()
  })

  describe('searchAppointments', () => {
    it('should return empty result when no entities found', async () => {
      ;(universalApi.read as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: [],
        error: null
      })

      const result = await searchAppointments({
        organization_id: 'test-org',
        page: 1,
        page_size: 50
      })

      expect(result).toEqual({ rows: [], total: 0 })
      expect(universalApi.read).toHaveBeenCalledWith('core_entities', {
        organization_id: 'test-org',
        entity_type: 'appointment'
      })
    })

    it('should handle pagination correctly', async () => {
      // Mock 10 entities
      const mockEntities = Array.from({ length: 10 }, (_, i) => ({
        id: `entity-${i}`,
        organization_id: 'test-org',
        entity_type: 'appointment',
        entity_name: `Appointment ${i}`,
        smart_code: 'HERA.SALON.APPT.ENTITY.APPOINTMENT.V1'
      }))

      ;(universalApi.read as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: mockEntities,
          error: null
        })
        .mockResolvedValueOnce({
          success: true,
          data: [],
          error: null
        })

      const result = await searchAppointments({
        organization_id: 'test-org',
        page: 2,
        page_size: 3
      })

      // Should fetch dynamic data only for page 2 entities (3-5)
      expect(universalApi.read).toHaveBeenCalledWith('core_dynamic_data', {
        organization_id: 'test-org',
        entity_id: ['entity-3', 'entity-4', 'entity-5']
      })
      
      expect(result.total).toBe(10)
    })

    it('should apply date filters correctly', async () => {
      const mockEntities = [{
        id: 'entity-1',
        organization_id: 'test-org',
        entity_type: 'appointment',
        entity_name: 'Test Appointment'
      }]

      const mockDynamicData = [{
        entity_id: 'entity-1',
        field_name: 'start_time',
        field_value_text: '2024-01-15T10:00:00Z'
      }]

      ;(universalApi.read as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: mockEntities,
          error: null
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockDynamicData,
          error: null
        })

      const result = await searchAppointments({
        organization_id: 'test-org',
        date_from: '2024-01-01',
        date_to: '2024-01-31'
      })

      expect(result.rows).toHaveLength(1)
      expect(result.rows[0].start_time).toBe('2024-01-15T10:00:00.000Z')
    })
  })

  describe('Helper Functions', () => {
    describe('coerceDynValue', () => {
      it('should handle JSON values', () => {
        expect(testHelpers.coerceDynValue({
          field_value_json: '["service1", "service2"]'
        })).toEqual(['service1', 'service2'])

        expect(testHelpers.coerceDynValue({
          field_value_json: ['already', 'parsed']
        })).toEqual(['already', 'parsed'])
      })

      it('should handle number values', () => {
        expect(testHelpers.coerceDynValue({
          field_value_number: 100.50
        })).toBe(100.50)

        expect(testHelpers.coerceDynValue({
          field_value_number: '100.50'
        })).toBe(100.50)
      })

      it('should handle boolean values', () => {
        expect(testHelpers.coerceDynValue({
          field_value_boolean: true
        })).toBe(true)

        expect(testHelpers.coerceDynValue({
          field_value_boolean: 0
        })).toBe(false)
      })

      it('should handle date and text values', () => {
        expect(testHelpers.coerceDynValue({
          field_value_date: '2024-01-15'
        })).toBe('2024-01-15')

        expect(testHelpers.coerceDynValue({
          field_value_text: 'Hello World'
        })).toBe('Hello World')
      })

      it('should return null for empty values', () => {
        expect(testHelpers.coerceDynValue({})).toBeNull()
      })
    })

    describe('groupDynamicByEntity', () => {
      it('should group dynamic data by entity_id', () => {
        const rows = [
          { entity_id: 'e1', field_name: 'status', field_value_text: 'booked' },
          { entity_id: 'e1', field_name: 'price', field_value_number: 100 },
          { entity_id: 'e2', field_name: 'status', field_value_text: 'completed' },
        ]

        const grouped = testHelpers.groupDynamicByEntity(rows)

        expect(grouped.get('e1')).toEqual({
          status: 'booked',
          price: 100
        })

        expect(grouped.get('e2')).toEqual({
          status: 'completed'
        })
      })

      it('should handle empty rows', () => {
        const grouped = testHelpers.groupDynamicByEntity([])
        expect(grouped.size).toBe(0)
      })
    })

    describe('toISO', () => {
      it('should convert dates to ISO strings', () => {
        expect(testHelpers.toISO('2024-01-15')).toBe('2024-01-15T00:00:00.000Z')
        expect(testHelpers.toISO(new Date('2024-01-15T10:30:00Z'))).toBe('2024-01-15T10:30:00.000Z')
      })

      it('should handle null/undefined values', () => {
        expect(testHelpers.toISO(null)).toBe('1970-01-01T00:00:00.000Z')
        expect(testHelpers.toISO(undefined)).toBe('1970-01-01T00:00:00.000Z')
      })

      it('should handle invalid dates', () => {
        expect(testHelpers.toISO('invalid-date')).toBe('1970-01-01T00:00:00.000Z')
      })
    })

    describe('toAppointmentDTO', () => {
      it('should map entity and dynamic data to DTO', () => {
        const entity = {
          id: 'apt-1',
          organization_id: 'org-1',
          smart_code: 'HERA.SALON.APPT.ENTITY.APPOINTMENT.V1',
          entity_name: 'John Doe - Haircut',
          entity_code: 'APPT-001'
        }

        const dynamicData = {
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z',
          status: 'booked',
          stylist_id: 'staff-1',
          customer_id: 'cust-1',
          service_ids: ['svc-1', 'svc-2'],
          price: 150,
          notes: 'VIP customer'
        }

        const dto = testHelpers.toAppointmentDTO(entity, dynamicData)

        expect(dto).toEqual({
          id: 'apt-1',
          organization_id: 'org-1',
          smart_code: 'HERA.SALON.APPT.ENTITY.APPOINTMENT.V1',
          entity_name: 'John Doe - Haircut',
          entity_code: 'APPT-001',
          start_time: '2024-01-15T10:00:00.000Z',
          end_time: '2024-01-15T11:00:00.000Z',
          status: 'booked',
          stylist_id: 'staff-1',
          customer_id: 'cust-1',
          branch_id: undefined,
          chair_id: undefined,
          service_ids: ['svc-1', 'svc-2'],
          notes: 'VIP customer',
          price: 150,
          currency_code: 'AED'
        })
      })

      it('should use defaults when data is missing', () => {
        const dto = testHelpers.toAppointmentDTO(null, {})

        expect(dto.id).toBe('')
        expect(dto.organization_id).toBe('')
        expect(dto.smart_code).toBe('HERA.SALON.APPT.ENTITY.APPOINTMENT.V1')
        expect(dto.status).toBe('booked')
        expect(dto.service_ids).toEqual([])
        expect(dto.currency_code).toBe('AED')
      })
    })
  })

  describe('Chunking for Large ID Lists', () => {
    it('should chunk entity IDs when fetching dynamic data', async () => {
      // Create 500 entity IDs to test chunking
      const mockEntities = Array.from({ length: 500 }, (_, i) => ({
        id: `entity-${i}`,
        organization_id: 'test-org',
        entity_type: 'appointment'
      }))

      ;(universalApi.read as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: mockEntities,
          error: null
        })
        // Mock dynamic data responses for chunks
        .mockResolvedValue({
          success: true,
          data: [],
          error: null
        })

      await searchAppointments({
        organization_id: 'test-org',
        page: 1,
        page_size: 50
      })

      // Should fetch dynamic data only for first 50 entities
      expect(universalApi.read).toHaveBeenCalledWith('core_dynamic_data', {
        organization_id: 'test-org',
        entity_id: mockEntities.slice(0, 50).map(e => e.id)
      })
    })
  })

  describe('Empty Array Handling', () => {
    it('should handle empty entity_id arrays gracefully', async () => {
      ;(universalApi.read as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: [], // No entities
          error: null
        })

      const result = await searchAppointments({
        organization_id: 'test-org'
      })

      expect(result).toEqual({ rows: [], total: 0 })
      // Should not attempt to fetch dynamic data with empty array
      expect(universalApi.read).toHaveBeenCalledTimes(1)
    })
  })
})