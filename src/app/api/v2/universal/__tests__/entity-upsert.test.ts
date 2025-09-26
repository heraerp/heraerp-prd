/**
 * Tests for /api/v2/universal/entity-upsert endpoint
 * Testing with salon service entities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../entity-upsert/route'

// Mock the database module
vi.mock('@/lib/db', () => ({
  selectValue: vi.fn()
}))

// Mock the guardrail module
vi.mock('@/lib/guardrail', () => ({
  SMARTCODE_REGEX: /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z0-9]+$/,
  validateEntityUpsert: vi.fn(() => []) // Default to no errors
}))

import { selectValue } from '@/lib/db'
import { validateEntityUpsert } from '@/lib/guardrail'

describe('/api/v2/universal/entity-upsert', () => {
  const mockSelectValue = selectValue as any
  const mockValidateEntityUpsert = validateEntityUpsert as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Test organization ID for all tests
  const TEST_ORG_ID = 'e7c5e6e0-7b4f-4c6f-8e8e-6f5e5e5e5e5e'

  // 5 Salon Services to test
  const salonServices = [
    {
      entity_name: 'Haircut & Blowdry',
      entity_code: 'SVC-HAIRCUT-001',
      smart_code: 'HERA.SALON.SVC.HAIR.CUT.V1',
      metadata: {
        duration_minutes: 45,
        base_price: 65.0,
        category: 'Hair Services',
        requires_stylist: true,
        commission_rate: 0.4
      }
    },
    {
      entity_name: 'Full Color Treatment',
      entity_code: 'SVC-COLOR-001',
      smart_code: 'HERA.SALON.SVC.HAIR.COLOR.V1',
      metadata: {
        duration_minutes: 120,
        base_price: 150.0,
        category: 'Color Services',
        requires_stylist: true,
        commission_rate: 0.45,
        requires_patch_test: true
      }
    },
    {
      entity_name: 'Highlights (Full Head)',
      entity_code: 'SVC-HIGHLIGHT-001',
      smart_code: 'HERA.SALON.SVC.HAIR.HIGHLIGHT.V1',
      metadata: {
        duration_minutes: 180,
        base_price: 250.0,
        category: 'Color Services',
        requires_stylist: true,
        commission_rate: 0.45,
        processing_time: 45
      }
    },
    {
      entity_name: 'Deep Conditioning Treatment',
      entity_code: 'SVC-TREATMENT-001',
      smart_code: 'HERA.SALON.SVC.HAIR.TREATMENT.V1',
      metadata: {
        duration_minutes: 30,
        base_price: 45.0,
        category: 'Treatments',
        requires_stylist: false,
        commission_rate: 0.35,
        can_be_addon: true
      }
    },
    {
      entity_name: 'Bridal Hair Styling',
      entity_code: 'SVC-BRIDAL-001',
      smart_code: 'HERA.SALON.SVC.HAIR.BRIDAL.V1',
      metadata: {
        duration_minutes: 90,
        base_price: 350.0,
        category: 'Special Events',
        requires_stylist: true,
        commission_rate: 0.5,
        includes_trial: true,
        advance_booking_required: true
      }
    }
  ]

  describe('Successful Service Upserts', () => {
    it('should successfully upsert a basic haircut service', async () => {
      const service = salonServices[0]
      const mockEntityId = 'generated-entity-id-1'

      mockSelectValue.mockResolvedValueOnce(mockEntityId)

      const request = new NextRequest('http://localhost:3000/api/v2/universal/entity-upsert', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: TEST_ORG_ID,
          entity_type: 'service',
          entity_name: service.entity_name,
          entity_code: service.entity_code,
          smart_code: service.smart_code,
          metadata: service.metadata,
          status: 'active'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual({
        api_version: 'v2',
        entity_id: mockEntityId
      })

      expect(mockSelectValue).toHaveBeenCalledWith(
        expect.stringContaining('hera_entity_upsert_v1'),
        expect.arrayContaining([TEST_ORG_ID, 'service', service.entity_name, service.smart_code])
      )
    })

    it('should successfully upsert all 5 salon services', async () => {
      const responses = []

      for (let i = 0; i < salonServices.length; i++) {
        const service = salonServices[i]
        const mockEntityId = `generated-entity-id-${i + 1}`

        mockSelectValue.mockResolvedValueOnce(mockEntityId)

        const request = new NextRequest('http://localhost:3000/api/v2/universal/entity-upsert', {
          method: 'POST',
          body: JSON.stringify({
            organization_id: TEST_ORG_ID,
            entity_type: 'service',
            entity_name: service.entity_name,
            entity_code: service.entity_code,
            smart_code: service.smart_code,
            metadata: service.metadata,
            status: 'active',
            business_rules: {
              allow_online_booking: true,
              cancellation_hours: 24
            }
          })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.entity_id).toBe(mockEntityId)
        responses.push(data)
      }

      expect(responses).toHaveLength(5)
      expect(mockSelectValue).toHaveBeenCalledTimes(5)
    })

    it('should handle upsert with existing entity (update scenario)', async () => {
      const existingEntityId = 'existing-entity-123'
      const service = salonServices[1] // Full Color Treatment

      mockSelectValue.mockResolvedValueOnce(existingEntityId)

      const request = new NextRequest('http://localhost:3000/api/v2/universal/entity-upsert', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: TEST_ORG_ID,
          entity_id: existingEntityId, // Providing existing ID for update
          entity_type: 'service',
          entity_name: service.entity_name,
          entity_code: service.entity_code,
          smart_code: service.smart_code,
          metadata: {
            ...service.metadata,
            base_price: 175.0 // Updated price
          },
          status: 'active'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.entity_id).toBe(existingEntityId)

      // Verify entity_id was passed to the database function
      expect(mockSelectValue).toHaveBeenCalledWith(
        expect.stringContaining('hera_entity_upsert_v1'),
        expect.arrayContaining([
          TEST_ORG_ID,
          'service',
          service.entity_name,
          service.smart_code,
          existingEntityId // Should include the existing ID
        ])
      )
    })

    it('should handle service with complex metadata and attributes', async () => {
      const complexService = {
        ...salonServices[4], // Bridal Hair Styling
        attributes: {
          skill_level_required: 'senior',
          equipment_needed: ['curling_iron', 'hairspray', 'pins'],
          preparation_checklist: [
            'Hair consultation 2 weeks prior',
            'Trial run 1 week prior',
            'Final confirmation 48 hours prior'
          ]
        },
        ai_insights: {
          popular_seasons: ['spring', 'summer'],
          average_rating: 4.8,
          repeat_rate: 0.15
        }
      }

      mockSelectValue.mockResolvedValueOnce('complex-entity-id')

      const request = new NextRequest('http://localhost:3000/api/v2/universal/entity-upsert', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: TEST_ORG_ID,
          entity_type: 'service',
          entity_name: complexService.entity_name,
          entity_code: complexService.entity_code,
          smart_code: complexService.smart_code,
          entity_description:
            'Premium bridal hair styling service including consultation and trial',
          metadata: complexService.metadata,
          attributes: complexService.attributes,
          ai_insights: complexService.ai_insights,
          ai_confidence: 0.95,
          ai_classification: 'premium_service',
          tags: ['bridal', 'premium', 'special-event'],
          status: 'active'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.entity_id).toBe('complex-entity-id')
    })
  })

  describe('Validation and Error Handling', () => {
    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/v2/universal/entity-upsert', {
        method: 'POST',
        body: 'invalid json {{'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('invalid_json')
    })

    it('should return 400 when guardrail validation fails', async () => {
      mockValidateEntityUpsert.mockReturnValueOnce([
        'Missing required field: organization_id',
        'Invalid smart_code format'
      ])

      const request = new NextRequest('http://localhost:3000/api/v2/universal/entity-upsert', {
        method: 'POST',
        body: JSON.stringify({
          entity_type: 'service',
          entity_name: 'Invalid Service'
          // Missing organization_id and smart_code
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('guardrail_failed')
      expect(data.details).toEqual([
        'Missing required field: organization_id',
        'Invalid smart_code format'
      ])
    })

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed')
      mockSelectValue.mockRejectedValueOnce(dbError)

      const request = new NextRequest('http://localhost:3000/api/v2/universal/entity-upsert', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: TEST_ORG_ID,
          entity_type: 'service',
          entity_name: 'Test Service',
          smart_code: 'HERA.SALON.SVC.TEST.V1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('database_error')
      expect(data.message).toBe('Database connection failed')
    })

    it('should validate smart code format', async () => {
      const invalidSmartCodes = [
        'invalid.smart.code', // lowercase
        'HERA.SALON', // incomplete
        'HERA_SALON_SVC_TEST_V1', // underscores instead of dots
        '', // empty
        null // null
      ]

      for (const invalidCode of invalidSmartCodes) {
        mockValidateEntityUpsert.mockReturnValueOnce([`Invalid smart_code: ${invalidCode}`])

        const request = new NextRequest('http://localhost:3000/api/v2/universal/entity-upsert', {
          method: 'POST',
          body: JSON.stringify({
            organization_id: TEST_ORG_ID,
            entity_type: 'service',
            entity_name: 'Test Service',
            smart_code: invalidCode
          })
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('guardrail_failed')
      }
    })
  })

  describe('Batch Operations', () => {
    it('should handle rapid sequential upserts of multiple services', async () => {
      const promises = salonServices.map(async (service, index) => {
        const mockEntityId = `batch-entity-${index}`
        mockSelectValue.mockResolvedValueOnce(mockEntityId)

        const request = new NextRequest('http://localhost:3000/api/v2/universal/entity-upsert', {
          method: 'POST',
          body: JSON.stringify({
            organization_id: TEST_ORG_ID,
            entity_type: 'service',
            entity_name: service.entity_name,
            entity_code: service.entity_code,
            smart_code: service.smart_code,
            metadata: service.metadata,
            status: 'active'
          })
        })

        return POST(request)
      })

      const responses = await Promise.all(promises)
      const results = await Promise.all(responses.map(r => r.json()))

      expect(responses).toHaveLength(5)
      responses.forEach(response => {
        expect(response.status).toBe(201)
      })

      results.forEach((result, index) => {
        expect(result.entity_id).toBe(`batch-entity-${index}`)
      })
    })

    it('should handle mixed success and failure in batch operations', async () => {
      const results = []

      for (let i = 0; i < 3; i++) {
        if (i === 1) {
          // Make the second one fail
          mockSelectValue.mockRejectedValueOnce(new Error('Duplicate entity_code'))
        } else {
          mockSelectValue.mockResolvedValueOnce(`entity-${i}`)
        }

        const request = new NextRequest('http://localhost:3000/api/v2/universal/entity-upsert', {
          method: 'POST',
          body: JSON.stringify({
            organization_id: TEST_ORG_ID,
            entity_type: 'service',
            entity_name: `Service ${i}`,
            entity_code: `SVC-${i}`,
            smart_code: `HERA.SALON.SVC.TEST.${i}.V1`
          })
        })

        const response = await POST(request)
        const data = await response.json()
        results.push({ status: response.status, data })
      }

      expect(results[0].status).toBe(201)
      expect(results[1].status).toBe(500)
      expect(results[2].status).toBe(201)
    })
  })

  describe('Special Cases', () => {
    it('should handle service with parent-child relationships', async () => {
      const parentServiceId = 'parent-service-123'

      mockSelectValue.mockResolvedValueOnce('addon-service-id')

      const request = new NextRequest('http://localhost:3000/api/v2/universal/entity-upsert', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: TEST_ORG_ID,
          entity_type: 'service',
          entity_name: 'Toner Add-On',
          entity_code: 'SVC-ADDON-TONER',
          smart_code: 'HERA.SALON.SVC.ADDON.TONER.V1',
          parent_entity_id: parentServiceId,
          metadata: {
            duration_minutes: 15,
            base_price: 25.0,
            is_addon: true,
            parent_service: 'Full Color Treatment'
          },
          status: 'active'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(mockSelectValue).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          TEST_ORG_ID,
          'service',
          'Toner Add-On',
          'HERA.SALON.SVC.ADDON.TONER.V1',
          null, // entity_id
          'SVC-ADDON-TONER', // entity_code
          null, // description
          parentServiceId // parent_entity_id
        ])
      )
    })

    it('should handle draft services with smart_code_status', async () => {
      mockSelectValue.mockResolvedValueOnce('draft-service-id')

      const request = new NextRequest('http://localhost:3000/api/v2/universal/entity-upsert', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: TEST_ORG_ID,
          entity_type: 'service',
          entity_name: 'Experimental Hair Treatment',
          entity_code: 'SVC-EXP-001',
          smart_code: 'HERA.SALON.SVC.EXPERIMENTAL.V1',
          smart_code_status: 'PENDING_APPROVAL',
          status: 'draft',
          metadata: {
            duration_minutes: 60,
            base_price: 0, // Price TBD
            in_testing: true
          }
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.entity_id).toBe('draft-service-id')
    })
  })
})
