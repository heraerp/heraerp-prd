/**
 * Comprehensive Jest tests for entityClientV2.upsert() - Salon Service Edge Cases
 * Tests all possible scenarios, edge cases, and error conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EntityClientV2, EntityV2 } from '../entity-client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('EntityClientV2.upsert() - Salon Service Edge Cases', () => {
  let client: EntityClientV2

  beforeEach(() => {
    client = new EntityClientV2()
    client.setOrganizationId('salon-test-org-123')
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Test organization ID for all tests
  const TEST_ORG_ID = 'salon-test-org-123'

  // Base salon service structure
  const baseService: EntityV2 = {
    organization_id: TEST_ORG_ID,
    entity_type: 'service',
    entity_name: 'Basic Haircut',
    entity_code: 'SVC-HAIRCUT-001',
    smart_code: 'HERA.SALON.SVC.HAIR.CUT.V1',
    status: 'active'
  }

  describe('✅ Successful Upsert Scenarios', () => {
    it('should successfully create a new basic salon service', async () => {
      const mockResponse = {
        api_version: 'v2',
        entity_id: 'new-service-id-123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse
      })

      const result = await client.upsert(baseService)

      expect(result.success).toBe(true)
      expect(result.data?.entity_id).toBe('new-service-id-123')
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v2/universal/entity-upsert',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            ...baseService,
            organization_id: TEST_ORG_ID
          })
        })
      )
    })

    it('should successfully update an existing service (entity_id provided)', async () => {
      const existingServiceId = 'existing-service-456'
      const updateService: EntityV2 = {
        ...baseService,
        id: existingServiceId,
        entity_id: existingServiceId,
        entity_name: 'Premium Haircut Updated',
        metadata: {
          base_price: 75.00,
          updated: true
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          api_version: 'v2',
          entity_id: existingServiceId
        })
      })

      const result = await client.upsert(updateService)

      expect(result.success).toBe(true)
      expect(result.data?.entity_id).toBe(existingServiceId)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.entity_id).toBe(existingServiceId)
      expect(requestBody.entity_name).toBe('Premium Haircut Updated')
      expect(requestBody.metadata.base_price).toBe(75.00)
    })

    it('should handle service with business rules and attributes (without pricing/duration in metadata)', async () => {
      const comprehensiveService: EntityV2 = {
        ...baseService,
        entity_name: 'Full Color & Style Package',
        entity_code: 'SVC-COLOR-PACKAGE-001',
        entity_description: 'Complete hair transformation with color and styling',
        smart_code: 'HERA.SALON.SVC.HAIR.COLOR.PACKAGE.V1',
        metadata: {
          // NOTE: pricing, duration, category moved to dynamic data
          requires_consultation: true,
          color_services: ['highlights', 'lowlights', 'toner'],
          included_services: ['wash', 'cut', 'color', 'style', 'blowdry'],
          skill_level_required: 'senior',
          cancellation_policy: '48 hours notice required',
          seasonal_availability: {
            spring: true,
            summer: true,
            fall: true,
            winter: false // Color services suspended in winter
          }
        },
        business_rules: {
          requires_patch_test: true,
          patch_test_hours: 48,
          max_bookings_per_day: 3,
          allow_online_booking: false,
          requires_deposit: true,
          deposit_percentage: 0.5
        },
        attributes: {
          chemical_services: true,
          allergies_required: ['hair_dye', 'ammonia', 'peroxide'],
          aftercare_products: ['color_safe_shampoo', 'deep_conditioner'],
          follow_up_recommended: '6 weeks'
        },
        tags: ['premium', 'color-service', 'consultation-required', 'chemical'],
        ai_insights: {
          popularity_score: 0.85,
          profit_margin: 0.60,
          customer_satisfaction: 4.7,
          repeat_booking_rate: 0.65,
          seasonal_demand_multiplier: 1.3
        },
        ai_confidence: 0.92,
        ai_classification: 'premium_chemical_service'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          api_version: 'v2',
          entity_id: 'comprehensive-service-789'
        })
      })

      const result = await client.upsert(comprehensiveService)

      expect(result.success).toBe(true)
      expect(result.data?.entity_id).toBe('comprehensive-service-789')

      // Verify business rules and attributes were sent correctly
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.metadata.color_services).toEqual(['highlights', 'lowlights', 'toner'])
      expect(requestBody.business_rules.requires_patch_test).toBe(true)
      expect(requestBody.attributes.chemical_services).toBe(true)
      expect(requestBody.ai_insights.popularity_score).toBe(0.85)
      // Verify pricing/duration are NOT in metadata
      expect(requestBody.metadata.base_price).toBeUndefined()
      expect(requestBody.metadata.duration_minutes).toBeUndefined()
    })

    it('should handle service with parent-child relationship', async () => {
      const parentServiceId = 'parent-color-service-123'
      const addonService: EntityV2 = {
        ...baseService,
        entity_name: 'Deep Conditioning Add-On',
        entity_code: 'SVC-ADDON-CONDITIONING',
        smart_code: 'HERA.SALON.SVC.ADDON.CONDITIONING.V1',
        parent_entity_id: parentServiceId,
        metadata: {
          base_price: 35.00,
          duration_minutes: 20,
          is_addon: true,
          parent_service_required: true,
          can_standalone: false
        },
        business_rules: {
          requires_parent_service: true,
          parent_service_types: ['color', 'chemical'],
          discount_when_bundled: 0.15
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          api_version: 'v2',
          entity_id: 'addon-service-456'
        })
      })

      const result = await client.upsert(addonService)

      expect(result.success).toBe(true)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.parent_entity_id).toBe(parentServiceId)
      expect(requestBody.metadata.is_addon).toBe(true)
      expect(requestBody.business_rules.requires_parent_service).toBe(true)
    })

    it('should handle service with complex metadata (without pricing/duration/category)', async () => {
      const complexMetadataService: EntityV2 = {
        ...baseService,
        entity_name: 'Complex Metadata Test Service',
        metadata: {
          // NOTE: base_price, duration_minutes, category should be in dynamic data
          commission_rate: 0.40,
          tax_rate: 0.0875,
          max_capacity: 1,

          // Strings
          description: 'Service with complex metadata',
          skill_level: 'intermediate',

          // Booleans
          active: true,
          requires_booking: true,
          walk_ins_allowed: false,
          seasonal_service: false,

          // Arrays
          tags: ['test', 'comprehensive', 'metadata'],
          equipment_needed: ['chair', 'tools', 'products'],

          // Objects
          schedule: {
            available_days: ['monday', 'tuesday', 'wednesday'],
            time_slots: {
              morning: ['09:00', '10:00', '11:00'],
              afternoon: ['13:00', '14:00', '15:00']
            }
          },

          // Nested complex object (non-pricing structure)
          booking_rules: {
            advance_notice: { hours: 24, required: true },
            cancellation: {
              student: { notice_hours: 12, fee: 0 },
              regular: { notice_hours: 24, fee: 25 },
              premium: { notice_hours: 48, fee: 50 }
            }
          },

          // Null and undefined handling
          special_notes: null,
          temporary_field: undefined
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          api_version: 'v2',
          entity_id: 'complex-metadata-service-789'
        })
      })

      const result = await client.upsert(complexMetadataService)

      expect(result.success).toBe(true)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.metadata.booking_rules.cancellation.premium.fee).toBe(50)
      expect(requestBody.metadata.schedule.time_slots.morning).toHaveLength(3)
      expect(requestBody.metadata.special_notes).toBeNull()
      expect(requestBody.metadata).not.toHaveProperty('temporary_field')
      // Verify pricing/duration/category are NOT in metadata
      expect(requestBody.metadata.base_price).toBeUndefined()
      expect(requestBody.metadata.duration_minutes).toBeUndefined()
      expect(requestBody.metadata.category).toBeUndefined()
    })
  })

  describe('❌ Error Conditions & Edge Cases', () => {
    it('should fail when organization_id is not set', async () => {
      const clientWithoutOrg = new EntityClientV2()
      // Don't set organization ID

      const result = await clientWithoutOrg.upsert(baseService)

      expect(result.success).toBe(false)
      expect(result.error).toBe('organization_id is required')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should fail when required fields are missing', async () => {
      const incompleteService = {
        organization_id: TEST_ORG_ID,
        entity_type: 'service'
        // Missing entity_name and smart_code
      } as EntityV2

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'guardrail_failed',
          details: [
            'Missing required field: entity_name',
            'Missing required field: smart_code'
          ]
        })
      })

      const result = await client.upsert(incompleteService)

      expect(result.success).toBe(false)
      expect(result.error).toBe('guardrail_failed')
      expect(result.message).toBeDefined()
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'))

      const result = await client.upsert(baseService)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network connection failed')
    })

    it('should handle API server errors (500)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'database_error',
          message: 'Connection to database failed'
        })
      })

      const result = await client.upsert(baseService)

      expect(result.success).toBe(false)
      expect(result.error).toBe('database_error')
      expect(result.message).toBe('Connection to database failed')
    })

    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => {
          throw new SyntaxError('Invalid JSON')
        }
      })

      const result = await client.upsert(baseService)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid JSON')
    })

    it('should handle malformed API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          // Missing required entity_id field
          api_version: 'v2',
          success: true
        })
      })

      const result = await client.upsert(baseService)

      expect(result.success).toBe(true)
      expect(result.data?.entity_id).toBeUndefined()
    })

    it('should handle extremely large metadata objects', async () => {
      const largeMetadata = {
        huge_array: Array(10000).fill(0).map((_, i) => `item-${i}`),
        nested_object: {}
      }

      // Create deeply nested object
      let current = largeMetadata.nested_object
      for (let i = 0; i < 100; i++) {
        current[`level_${i}`] = {}
        current = current[`level_${i}`]
      }
      current.final_value = 'deeply_nested'

      const largeService: EntityV2 = {
        ...baseService,
        metadata: largeMetadata
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: async () => ({
          error: 'payload_too_large',
          message: 'Request body exceeds size limit'
        })
      })

      const result = await client.upsert(largeService)

      expect(result.success).toBe(false)
      expect(result.error).toBe('payload_too_large')
    })
  })

  describe('🔍 Validation & Business Rule Edge Cases', () => {
    it('should handle invalid smart_code formats', async () => {
      const invalidSmartCodes = [
        'hera.salon.svc.invalid', // lowercase
        'HERA.SALON', // incomplete
        'HERA_SALON_SVC_TEST', // underscores
        '', // empty
        'HERA..SVC..TEST', // double dots
        'HERA.SALON.SVC.TEST.', // trailing dot
        '.HERA.SALON.SVC.TEST', // leading dot
        'HERA.SALON.SVC.TEST.V1.EXTRA' // too many segments
      ]

      for (const smartCode of invalidSmartCodes) {
        const invalidService: EntityV2 = {
          ...baseService,
          smart_code: smartCode
        }

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'guardrail_failed',
            details: [`Invalid smart_code format: ${smartCode}`]
          })
        })

        const result = await client.upsert(invalidService)

        expect(result.success).toBe(false)
        expect(result.error).toBe('guardrail_failed')
      }

      expect(mockFetch).toHaveBeenCalledTimes(invalidSmartCodes.length)
    })

    it('should handle invalid entity_code formats', async () => {
      const invalidEntityCodes = [
        'svc with spaces', // spaces not allowed
        'SVC-ÄÖÜ-001', // special characters
        'svc-toolong-' + 'x'.repeat(100), // extremely long
        '', // empty string
        '123-STARTS-WITH-NUMBER'
      ]

      for (const entityCode of invalidEntityCodes) {
        const invalidService: EntityV2 = {
          ...baseService,
          entity_code: entityCode
        }

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'guardrail_failed',
            details: [`Invalid entity_code format: ${entityCode}`]
          })
        })

        const result = await client.upsert(invalidService)

        expect(result.success).toBe(false)
      }
    })

    it('should handle conflicting business rules', async () => {
      const conflictingService: EntityV2 = {
        ...baseService,
        entity_name: 'Conflicting Rules Service',
        business_rules: {
          allow_online_booking: true,
          requires_in_person_consultation: true, // Conflict!
          walk_ins_allowed: true,
          requires_advance_booking: true, // Another conflict!
          min_age_requirement: 18,
          max_age_requirement: 16, // Impossible constraint!
          duration_minutes: 30,
          buffer_time_minutes: 45 // Buffer longer than service
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'business_rule_conflict',
          details: [
            'Cannot allow online booking and require in-person consultation',
            'Cannot allow walk-ins and require advance booking',
            'max_age_requirement cannot be less than min_age_requirement',
            'buffer_time_minutes should not exceed duration_minutes'
          ]
        })
      })

      const result = await client.upsert(conflictingService)

      expect(result.success).toBe(false)
      expect(result.error).toBe('business_rule_conflict')
    })

    it('should handle duplicate entity_code within organization', async () => {
      const duplicateService: EntityV2 = {
        ...baseService,
        entity_code: 'SVC-DUPLICATE-001' // Assume this already exists
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'duplicate_entity_code',
          message: 'Entity code SVC-DUPLICATE-001 already exists in organization',
          existing_entity_id: 'existing-service-123'
        })
      })

      const result = await client.upsert(duplicateService)

      expect(result.success).toBe(false)
      expect(result.error).toBe('duplicate_entity_code')
    })

    it('should handle invalid status transitions', async () => {
      const invalidStatusService: EntityV2 = {
        ...baseService,
        id: 'existing-service-456',
        entity_id: 'existing-service-456',
        status: 'invalid_status_value'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_status',
          message: 'Status must be one of: active, inactive, draft, archived',
          valid_statuses: ['active', 'inactive', 'draft', 'archived']
        })
      })

      const result = await client.upsert(invalidStatusService)

      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_status')
    })

    it('should fail when trying to set invalid dynamic field types', async () => {
      // First create the service
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'validation-service-123' })
      })

      await client.upsert(baseService)

      // Try to set invalid field types
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_field_type',
          message: 'field_type must be one of: text, number, boolean, date, datetime, json',
          valid_types: ['text', 'number', 'boolean', 'date', 'datetime', 'json']
        })
      })

      const result = await client.upsertDynamicField({
        entity_id: 'validation-service-123',
        field_name: 'base_price',
        field_type: 'invalid_type' as any,
        field_value_text: '99.99'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_field_type')
    })

    it('should validate pricing values in dynamic fields', async () => {
      // Create service first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'price-validation-service' })
      })

      await client.upsert(baseService)

      // Try to set negative pricing
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_price',
          message: 'base_price must be a positive number',
          field_name: 'base_price',
          invalid_value: -50.00
        })
      })

      const result = await client.setDynamicFieldValue(
        'price-validation-service',
        'base_price',
        -50.00,
        'number'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_price')
    })

    it('should validate duration values in dynamic fields', async () => {
      // Create service first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'duration-validation-service' })
      })

      await client.upsert(baseService)

      // Try to set invalid duration (must be positive integer)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_duration',
          message: 'duration_minutes must be a positive integer between 5 and 480 minutes',
          field_name: 'duration_minutes',
          invalid_value: 0,
          valid_range: { min: 5, max: 480 }
        })
      })

      const result = await client.setDynamicFieldValue(
        'duration-validation-service',
        'duration_minutes',
        0,
        'number'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_duration')
    })

    it('should validate category values in dynamic fields', async () => {
      // Create service first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'category-validation-service' })
      })

      await client.upsert(baseService)

      // Try to set invalid category
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_category',
          message: 'category must be one of the predefined salon service categories',
          field_name: 'category',
          invalid_value: 'Invalid Category',
          valid_categories: [
            'Hair Services',
            'Chemical Services',
            'Styling Services',
            'Treatment Services',
            'Consultation Services'
          ]
        })
      })

      const result = await client.setDynamicFieldValue(
        'category-validation-service',
        'category',
        'Invalid Category',
        'text'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_category')
    })
  })

  describe('🎯 Boundary Conditions & Data Limits', () => {
    it('should handle minimum required data', async () => {
      const minimalService: EntityV2 = {
        organization_id: TEST_ORG_ID,
        entity_type: 'service',
        entity_name: 'Min',
        smart_code: 'HERA.SALON.SVC.MIN.V1'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          api_version: 'v2',
          entity_id: 'minimal-service-123'
        })
      })

      const result = await client.upsert(minimalService)

      expect(result.success).toBe(true)
      expect(result.data?.entity_id).toBe('minimal-service-123')
    })

    it('should handle extremely long entity names', async () => {
      const longNameService: EntityV2 = {
        ...baseService,
        entity_name: 'A'.repeat(1000), // Very long name
        entity_description: 'B'.repeat(5000) // Very long description
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'field_too_long',
          details: {
            entity_name: 'Maximum length is 255 characters',
            entity_description: 'Maximum length is 2000 characters'
          }
        })
      })

      const result = await client.upsert(longNameService)

      expect(result.success).toBe(false)
      expect(result.error).toBe('field_too_long')
    })

    it('should handle special characters and unicode', async () => {
      const unicodeService: EntityV2 = {
        ...baseService,
        entity_name: '🎨 Premium Styling Service 💇‍♀️',
        entity_code: 'SVC-UNICODE-001',
        smart_code: 'HERA.SALON.SVC.UNICODE.V1',
        metadata: {
          description: 'Service with émojis and spëcial çharacters 中文 العربية',
          pricing: {
            base_price: 99.99,
            currency: '€',
            notes: 'Prices include VAT @ 20%'
          }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          api_version: 'v2',
          entity_id: 'unicode-service-456'
        })
      })

      const result = await client.upsert(unicodeService)

      expect(result.success).toBe(true)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.entity_name).toBe('🎨 Premium Styling Service 💇‍♀️')
      expect(requestBody.metadata.description).toContain('中文')
    })

    it('should demonstrate INCORRECT pattern - pricing in metadata (anti-pattern)', async () => {
      // This test shows what NOT to do - for educational purposes
      const antiPatternService: EntityV2 = {
        ...baseService,
        entity_name: 'Anti-Pattern Service (Wrong Approach)',
        entity_code: 'SVC-ANTI-PATTERN-001',
        smart_code: 'HERA.SALON.SVC.ANTI.PATTERN.V1',
        metadata: {
          // ❌ WRONG: These should be in dynamic data
          base_price: 99.99,
          duration_minutes: 60,
          category: 'Hair Services',

          // ✅ CORRECT: Business process data can stay in metadata
          includes_consultation: true,
          skill_level: 'intermediate'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'anti-pattern-service' })
      })

      const result = await client.upsert(antiPatternService)
      expect(result.success).toBe(true)

      // This test passes but demonstrates the WRONG approach
      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      // These should NOT be in metadata - they should be dynamic fields!
      expect(requestBody.metadata.base_price).toBe(99.99) // ❌ Anti-pattern
      expect(requestBody.metadata.duration_minutes).toBe(60) // ❌ Anti-pattern
      expect(requestBody.metadata.category).toBe('Hair Services') // ❌ Anti-pattern

      // Note: This test is for educational purposes to show what NOT to do
      // The correct approach is demonstrated in previous tests
    })

    it('should handle null and undefined values appropriately', async () => {
      const nullValueService: EntityV2 = {
        ...baseService,
        entity_description: null as any,
        parent_entity_id: undefined,
        metadata: {
          base_price: null,
          duration_minutes: undefined,
          active: true,
          notes: null,
          tags: null,
          empty_object: {},
          empty_array: [],
          zero_value: 0,
          false_value: false
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          api_version: 'v2',
          entity_id: 'null-values-service-789'
        })
      })

      const result = await client.upsert(nullValueService)

      expect(result.success).toBe(true)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.entity_description).toBeNull()
      expect(requestBody).not.toHaveProperty('parent_entity_id')
      expect(requestBody.metadata.base_price).toBeNull()
      expect(requestBody.metadata).not.toHaveProperty('duration_minutes')
      expect(requestBody.metadata.zero_value).toBe(0)
      expect(requestBody.metadata.false_value).toBe(false)
      // Verify no pricing/duration/category in metadata
      expect(requestBody.metadata.base_price).toBeUndefined()
      expect(requestBody.metadata.duration_minutes).toBeUndefined()
      expect(requestBody.metadata.category).toBeUndefined()
    })

    it('should handle dynamic field conflicts with entity properties', async () => {
      // Create service first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'conflict-test-service' })
      })

      await client.upsert(baseService)

      // Try to create dynamic field with same name as entity property
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'field_name_conflict',
          message: 'Dynamic field name conflicts with entity property',
          field_name: 'entity_name',
          conflicting_property: 'entity_name'
        })
      })

      const result = await client.setDynamicFieldValue(
        'conflict-test-service',
        'entity_name', // This conflicts with the entity's entity_name property
        'Conflicting Name',
        'text'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('field_name_conflict')
    })

    it('should handle concurrent upsert attempts', async () => {
      const services = Array.from({ length: 10 }, (_, i) => ({
        ...baseService,
        entity_name: `Concurrent Service ${i + 1}`,
        entity_code: `SVC-CONCURRENT-${String(i + 1).padStart(3, '0')}`,
        smart_code: `HERA.SALON.SVC.CONCURRENT.${i + 1}.V1`
      }))

      // Mock responses for all concurrent calls
      services.forEach((_, i) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            api_version: 'v2',
            entity_id: `concurrent-service-${i + 1}`
          })
        })
      })

      const promises = services.map(service => client.upsert(service))
      const results = await Promise.all(promises)

      expect(results).toHaveLength(10)
      results.forEach((result, i) => {
        expect(result.success).toBe(true)
        expect(result.data?.entity_id).toBe(`concurrent-service-${i + 1}`)
      })

      expect(mockFetch).toHaveBeenCalledTimes(10)
    })

    it('should handle extremely large dynamic field values', async () => {
      // Create service first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'large-field-service' })
      })

      await client.upsert(baseService)

      // Try to create very large JSON field
      const largeJsonValue = {
        huge_array: Array(5000).fill(0).map((_, i) => `item-${i}`),
        nested_data: {}
      }

      // Create deeply nested structure
      let current = largeJsonValue.nested_data
      for (let i = 0; i < 50; i++) {
        current[`level_${i}`] = { data: `level-${i}-data` }
        current = current[`level_${i}`]
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: async () => ({
          error: 'dynamic_field_too_large',
          message: 'Dynamic field value exceeds maximum size limit',
          field_name: 'large_data',
          size_limit: '64KB',
          actual_size: '128KB'
        })
      })

      const result = await client.setDynamicFieldValue(
        'large-field-service',
        'large_data',
        largeJsonValue,
        'json'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('dynamic_field_too_large')
    })
  })

  describe('🔧 Client Configuration Edge Cases', () => {
    it('should use custom base URL when provided', async () => {
      const customClient = new EntityClientV2('https://custom-api.example.com/v2/universal')
      customClient.setOrganizationId(TEST_ORG_ID)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'custom-service-123' })
      })

      await customClient.upsert(baseService)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-api.example.com/v2/universal/entity-upsert',
        expect.any(Object)
      )
    })

    it('should include authorization header when token is set', async () => {
      const authToken = 'Bearer jwt-token-12345'
      client.setAuthToken(authToken)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'auth-service-456' })
      })

      await client.upsert(baseService)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': authToken
          })
        })
      )
    })

    it('should override organization_id from entity when client org is set', async () => {
      const differentOrgService: EntityV2 = {
        ...baseService,
        organization_id: 'different-org-456'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'org-override-service' })
      })

      await client.upsert(differentOrgService)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.organization_id).toBe(TEST_ORG_ID) // Should use client org
    })
  })

  describe('🔗 Entity + Dynamic Data Integration Tests', () => {
    it('should create service entity and then add pricing/duration/category as dynamic data', async () => {
      // 1. Create the basic service entity (without pricing/duration in metadata)
      const serviceEntity: EntityV2 = {
        ...baseService,
        entity_name: 'Premium Haircut & Style',
        entity_code: 'SVC-PREMIUM-HAIRCUT-001',
        smart_code: 'HERA.SALON.SVC.HAIR.CUT.PREMIUM.V1',
        entity_description: 'Professional haircut with styling for all hair types',
        metadata: {
          skill_level: 'intermediate',
          includes_products: true,
          includes_consultation: false
        }
      }

      // Mock entity creation response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          api_version: 'v2',
          entity_id: 'service-entity-123'
        })
      })

      const entityResult = await client.upsert(serviceEntity)
      expect(entityResult.success).toBe(true)
      expect(entityResult.data?.entity_id).toBe('service-entity-123')

      // Verify metadata doesn't contain pricing/duration/category
      const entityRequestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(entityRequestBody.metadata.base_price).toBeUndefined()
      expect(entityRequestBody.metadata.duration_minutes).toBeUndefined()
      expect(entityRequestBody.metadata.category).toBeUndefined()

      // 2. Add dynamic data fields
      const serviceId = entityResult.data!.entity_id

      // Mock dynamic field creation responses
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          api_version: 'v2',
          dynamic_field_id: 'field-price-456',
          is_update: false
        })
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          api_version: 'v2',
          dynamic_field_id: 'field-duration-789',
          is_update: false
        })
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          api_version: 'v2',
          dynamic_field_id: 'field-category-012',
          is_update: false
        })
      })

      // Create pricing dynamic field
      const priceResult = await client.setDynamicFieldValue(
        serviceId,
        'base_price',
        85.00,
        'number'
      )
      expect(priceResult.success).toBe(true)

      // Create duration dynamic field
      const durationResult = await client.setDynamicFieldValue(
        serviceId,
        'duration_minutes',
        60,
        'number'
      )
      expect(durationResult.success).toBe(true)

      // Create category dynamic field
      const categoryResult = await client.setDynamicFieldValue(
        serviceId,
        'category',
        'Hair Services',
        'text'
      )
      expect(categoryResult.success).toBe(true)

      // Verify all dynamic field calls were made correctly
      expect(mockFetch).toHaveBeenCalledTimes(4) // 1 entity + 3 dynamic fields

      // Check the dynamic field requests
      const priceRequest = JSON.parse(mockFetch.mock.calls[1][1].body)
      expect(priceRequest.field_name).toBe('base_price')
      expect(priceRequest.field_type).toBe('number')
      expect(priceRequest.field_value_number).toBe(85.00)
      expect(priceRequest.entity_id).toBe(serviceId)

      const durationRequest = JSON.parse(mockFetch.mock.calls[2][1].body)
      expect(durationRequest.field_name).toBe('duration_minutes')
      expect(durationRequest.field_type).toBe('number')
      expect(durationRequest.field_value_number).toBe(60)

      const categoryRequest = JSON.parse(mockFetch.mock.calls[3][1].body)
      expect(categoryRequest.field_name).toBe('category')
      expect(categoryRequest.field_type).toBe('text')
      expect(categoryRequest.field_value_text).toBe('Hair Services')
    })

    it('should use batch upsert for multiple service dynamic fields', async () => {
      // 1. Create service entity first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'batch-service-456' })
      })

      const serviceEntity: EntityV2 = {
        ...baseService,
        entity_name: 'Full Color Treatment',
        entity_code: 'SVC-COLOR-FULL-001',
        smart_code: 'HERA.SALON.SVC.HAIR.COLOR.FULL.V1'
      }

      const entityResult = await client.upsert(serviceEntity)
      expect(entityResult.success).toBe(true)

      // 2. Batch create dynamic fields
      const serviceId = entityResult.data!.entity_id
      const dynamicFields = [
        {
          field_name: 'base_price',
          field_type: 'number' as const,
          field_value_number: 180.00,
          smart_code: 'HERA.SALON.SVC.DYN.PRICE.V1'
        },
        {
          field_name: 'duration_minutes',
          field_type: 'number' as const,
          field_value_number: 150,
          smart_code: 'HERA.SALON.SVC.DYN.DURATION.V1'
        },
        {
          field_name: 'category',
          field_type: 'text' as const,
          field_value_text: 'Chemical Services',
          smart_code: 'HERA.SALON.SVC.DYN.CATEGORY.V1'
        },
        {
          field_name: 'commission_rate',
          field_type: 'number' as const,
          field_value_number: 0.45,
          smart_code: 'HERA.SALON.SVC.DYN.COMMISSION.V1'
        },
        {
          field_name: 'requires_patch_test',
          field_type: 'boolean' as const,
          field_value_boolean: true,
          smart_code: 'HERA.SALON.SVC.DYN.PATCH.TEST.V1'
        }
      ]

      // Mock batch upsert response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          api_version: 'v2',
          success: true,
          results: dynamicFields.map((_, i) => ({
            success: true,
            dynamic_field_id: `field-${i + 1}`,
            is_update: false
          })),
          total: 5,
          succeeded: 5,
          failed: 0
        })
      })

      const batchResult = await client.batchUpsertDynamicFields(serviceId, dynamicFields)
      expect(batchResult.success).toBe(true)
      expect(batchResult.metadata?.succeeded).toBe(5)
      expect(batchResult.metadata?.failed).toBe(0)

      // Verify batch request structure
      const batchRequest = JSON.parse(mockFetch.mock.calls[1][1].body)
      expect(batchRequest.entity_id).toBe(serviceId)
      expect(batchRequest.fields).toHaveLength(5)
      expect(batchRequest.fields[0].field_name).toBe('base_price')
      expect(batchRequest.fields[1].field_name).toBe('duration_minutes')
      expect(batchRequest.fields[2].field_name).toBe('category')
    })

    it('should handle complex service pricing structure as dynamic JSON field', async () => {
      // Create service entity
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'complex-pricing-service-789' })
      })

      const serviceEntity: EntityV2 = {
        ...baseService,
        entity_name: 'VIP Membership Service',
        entity_code: 'SVC-VIP-MEMBERSHIP-001',
        smart_code: 'HERA.SALON.SVC.VIP.MEMBERSHIP.V1'
      }

      await client.upsert(serviceEntity)

      // Create complex pricing structure as JSON dynamic field
      const complexPricing = {
        base_price: 250.00,
        member_pricing: {
          bronze: { price: 237.50, discount: 0.05 },
          silver: { price: 225.00, discount: 0.10 },
          gold: { price: 212.50, discount: 0.15 },
          platinum: { price: 200.00, discount: 0.20 }
        },
        add_ons: {
          deep_conditioning: { price: 35.00, duration: 20 },
          scalp_treatment: { price: 45.00, duration: 30 },
          take_home_products: { price: 75.00 }
        },
        cancellation_fees: {
          less_than_24h: 50.00,
          less_than_48h: 25.00,
          more_than_48h: 0.00
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          api_version: 'v2',
          dynamic_field_id: 'complex-pricing-field',
          is_update: false
        })
      })

      const pricingResult = await client.setDynamicFieldValue(
        'complex-pricing-service-789',
        'pricing_structure',
        complexPricing,
        'json'
      )

      expect(pricingResult.success).toBe(true)

      // Verify JSON field was created correctly
      const jsonRequest = JSON.parse(mockFetch.mock.calls[1][1].body)
      expect(jsonRequest.field_type).toBe('json')
      expect(jsonRequest.field_value_json.member_pricing.platinum.price).toBe(200.00)
      expect(jsonRequest.field_value_json.add_ons.scalp_treatment.duration).toBe(30)
    })

    it('should handle service with standard salon dynamic fields (pricing, duration, category)', async () => {
      // This test demonstrates the CORRECT pattern for salon services

      // 1. Create basic service entity (minimal metadata)
      const salonService: EntityV2 = {
        ...baseService,
        entity_name: 'Signature Cut & Blowdry',
        entity_code: 'SVC-SIGNATURE-CUT-001',
        smart_code: 'HERA.SALON.SVC.HAIR.CUT.SIGNATURE.V1',
        entity_description: 'Our signature haircut service with professional blowdry finish',
        metadata: {
          // Only business process data in metadata
          includes_consultation: true,
          includes_wash: true,
          includes_styling_advice: true,
          skill_level_required: 'senior',
          suitable_for_all_hair_types: true
        },
        business_rules: {
          advance_booking_recommended: true,
          walk_ins_accepted: true,
          max_daily_bookings: 8,
          allow_online_booking: true
        }
      }

      // Mock entity creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'salon-service-standard-123' })
      })

      const entityResult = await client.upsert(salonService)
      expect(entityResult.success).toBe(true)

      // 2. Add standard salon dynamic fields via batch
      const standardFields = [
        {
          field_name: 'base_price',
          field_type: 'number' as const,
          field_value_number: 65.00,
          smart_code: 'HERA.SALON.SVC.DYN.PRICE.V1'
        },
        {
          field_name: 'duration_minutes',
          field_type: 'number' as const,
          field_value_number: 45,
          smart_code: 'HERA.SALON.SVC.DYN.DURATION.V1'
        },
        {
          field_name: 'category',
          field_type: 'text' as const,
          field_value_text: 'Hair Services',
          smart_code: 'HERA.SALON.SVC.DYN.CATEGORY.V1'
        },
        {
          field_name: 'commission_rate',
          field_type: 'number' as const,
          field_value_number: 0.35,
          smart_code: 'HERA.SALON.SVC.DYN.COMMISSION.V1'
        },
        {
          field_name: 'booking_buffer_minutes',
          field_type: 'number' as const,
          field_value_number: 15,
          smart_code: 'HERA.SALON.SVC.DYN.BUFFER.V1'
        }
      ]

      // Mock batch dynamic field creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          results: standardFields.map((_, i) => ({
            success: true,
            dynamic_field_id: `std-field-${i + 1}`,
            is_update: false
          })),
          total: 5,
          succeeded: 5,
          failed: 0
        })
      })

      const fieldsResult = await client.batchUpsertDynamicFields(
        'salon-service-standard-123',
        standardFields
      )

      expect(fieldsResult.success).toBe(true)
      expect(fieldsResult.metadata?.succeeded).toBe(5)

      // 3. Verify the correct separation
      const entityRequest = JSON.parse(mockFetch.mock.calls[0][1].body)
      const dynamicRequest = JSON.parse(mockFetch.mock.calls[1][1].body)

      // Entity should NOT have pricing/duration/category in metadata
      expect(entityRequest.metadata.base_price).toBeUndefined()
      expect(entityRequest.metadata.duration_minutes).toBeUndefined()
      expect(entityRequest.metadata.category).toBeUndefined()
      expect(entityRequest.metadata.commission_rate).toBeUndefined()

      // But should have business process data
      expect(entityRequest.metadata.includes_consultation).toBe(true)
      expect(entityRequest.metadata.skill_level_required).toBe('senior')
      expect(entityRequest.business_rules.allow_online_booking).toBe(true)

      // Dynamic fields should have all the operational data
      expect(dynamicRequest.fields[0].field_name).toBe('base_price')
      expect(dynamicRequest.fields[0].field_value_number).toBe(65.00)
      expect(dynamicRequest.fields[1].field_name).toBe('duration_minutes')
      expect(dynamicRequest.fields[1].field_value_number).toBe(45)
      expect(dynamicRequest.fields[2].field_name).toBe('category')
      expect(dynamicRequest.fields[2].field_value_text).toBe('Hair Services')
    })
  })

  describe('🎭 Real-World Salon Service Scenarios', () => {
    it('should handle seasonal service with complex availability rules', async () => {
      const seasonalService: EntityV2 = {
        ...baseService,
        entity_name: 'Summer Hair Lightening Package',
        entity_code: 'SVC-SUMMER-LIGHTEN-001',
        smart_code: 'HERA.SALON.SVC.SEASONAL.LIGHTEN.V1',
        metadata: {
          seasonal: true,
          season: 'summer',
          availability_start: '2024-05-01',
          availability_end: '2024-09-30',
          // NOTE: base_price moved to dynamic data
          peak_season_surcharge: 0.20,
          includes: [
            'consultation',
            'color_analysis',
            'lightening_treatment',
            'toning',
            'deep_conditioning',
            'styling'
          ]
        },
        business_rules: {
          requires_patch_test: true,
          patch_test_hours: 48,
          max_lightening_levels: 4,
          not_suitable_for_pregnant: true,
          requires_skin_sensitivity_test: true,
          follow_up_required: '4-6 weeks'
        },
        attributes: {
          chemical_process: true,
          processing_time_hours: 3,
          aftercare_critical: true,
          color_wheel_expertise_required: true
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'seasonal-service-summer' })
      })

      const result = await client.upsert(seasonalService)

      expect(result.success).toBe(true)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(requestBody.metadata.includes).toContain('lightening_treatment')
      expect(requestBody.business_rules.requires_patch_test).toBe(true)
      expect(requestBody.attributes.chemical_process).toBe(true)
    })

    it('should handle membership-based service with tiered pricing', async () => {
      const membershipService: EntityV2 = {
        ...baseService,
        entity_name: 'VIP Platinum Service Experience',
        entity_code: 'SVC-VIP-PLATINUM-001',
        smart_code: 'HERA.SALON.SVC.VIP.PLATINUM.V1',
        metadata: {
          membership_required: 'platinum',
          // NOTE: base_price and member_pricing moved to dynamic data
          // This should be handled via pricing_structure JSON field
          includes: {
            services: [
              'personal_consultation',
              'custom_hair_analysis',
              'premium_products',
              'scalp_treatment',
              'precision_cut',
              'luxury_styling',
              'photos_for_portfolio'
            ],
            amenities: [
              'private_suite',
              'refreshments',
              'wifi_access',
              'parking_validation',
              'take_home_products'
            ]
          },
          duration: {
            consultation: 30,
            service: 180,
            photos: 15,
            total: 225
          }
        },
        business_rules: {
          membership_verification_required: true,
          advance_booking_days: 14,
          cancellation_fee_hours: 72,
          cancellation_fee_amount: 100.00,
          reschedule_limit: 2,
          no_show_policy: 'charge_full_amount'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ api_version: 'v2', entity_id: 'vip-platinum-service' })
      })

      const result = await client.upsert(membershipService)

      expect(result.success).toBe(true)

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      // Verify pricing is NOT in metadata (should be in dynamic data)
      expect(requestBody.metadata.member_pricing).toBeUndefined()
      expect(requestBody.metadata.base_price).toBeUndefined()
      expect(requestBody.metadata.includes.amenities).toContain('private_suite')
      expect(requestBody.business_rules.cancellation_fee_amount).toBe(100.00)
    })
  })

  describe('📋 Service Dynamic Data Best Practices Summary', () => {
    it('should document the correct approach for salon service data architecture', () => {
      // This is a documentation test - no API calls, just validation of patterns

      const correctSalonServicePattern = {
        // ✅ ENTITY DATA (core_entities table)
        entity: {
          entity_type: 'service',
          entity_name: 'Premium Haircut & Blowdry',
          entity_code: 'SVC-PREMIUM-001',
          smart_code: 'HERA.SALON.SVC.HAIR.CUT.PREMIUM.V1',
          entity_description: 'Professional haircut with blowdry finish',

          // Business process metadata (stays in entity)
          metadata: {
            includes_consultation: true,
            includes_wash: true,
            skill_level_required: 'intermediate',
            suitable_for_hair_types: ['all']
          },

          // Business rules (stays in entity)
          business_rules: {
            advance_booking_recommended: true,
            walk_ins_accepted: true,
            allow_online_booking: true
          }
        },

        // ✅ DYNAMIC DATA (core_dynamic_data table)
        dynamicFields: [
          { field_name: 'base_price', field_type: 'number', field_value_number: 65.00 },
          { field_name: 'duration_minutes', field_type: 'number', field_value_number: 45 },
          { field_name: 'category', field_type: 'text', field_value_text: 'Hair Services' },
          { field_name: 'commission_rate', field_type: 'number', field_value_number: 0.35 },
          { field_name: 'booking_buffer_minutes', field_type: 'number', field_value_number: 15 }
        ],

        // ❌ ANTI-PATTERN: These should NOT be in entity metadata
        antiPatterns: {
          // Don't put these in entity.metadata:
          base_price: 'WRONG - use dynamic data',
          duration_minutes: 'WRONG - use dynamic data',
          category: 'WRONG - use dynamic data',
          commission_rate: 'WRONG - use dynamic data'
        }
      }

      // Validate the pattern structure
      expect(correctSalonServicePattern.entity.entity_type).toBe('service')
      expect(correctSalonServicePattern.entity.metadata).not.toHaveProperty('base_price')
      expect(correctSalonServicePattern.entity.metadata).not.toHaveProperty('duration_minutes')
      expect(correctSalonServicePattern.entity.metadata).not.toHaveProperty('category')

      expect(correctSalonServicePattern.dynamicFields).toHaveLength(5)
      expect(correctSalonServicePattern.dynamicFields[0].field_name).toBe('base_price')
      expect(correctSalonServicePattern.dynamicFields[1].field_name).toBe('duration_minutes')
      expect(correctSalonServicePattern.dynamicFields[2].field_name).toBe('category')

      // This test serves as documentation for the correct approach
    })
  })
})