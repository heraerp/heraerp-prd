/**
 * Unit tests for HERA APP_CONFIG Guardrail Validation
 * Smart Code: HERA.PLATFORM.CONFIG.GUARDRAIL.TEST.v2
 * 
 * Comprehensive test suite for APP_CONFIG guardrail validation covering:
 * - Smart Code compliance
 * - Required fields validation
 * - Organization isolation
 * - Actor stamping
 * - App definition structure
 * - Autofix suggestions
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { 
  AppConfigGuardrails, 
  type AppConfigGuardrailContext,
  type AppConfigValidationResult,
  AppConfigSchema
} from '@/lib/validation/app-config-guardrails'
import type { HeraAppConfig } from '@/types/app-config'

describe('AppConfigGuardrails', () => {
  let validContext: AppConfigGuardrailContext
  let validAppDefinition: HeraAppConfig

  beforeEach(() => {
    validAppDefinition = {
      app_id: 'test-app',
      name: 'Test Application',
      version: '1.0.0',
      description: 'Test application for guardrail validation',
      industry: 'testing',
      entities: [
        {
          entity_type: 'TEST_ENTITY',
          display_name: 'Test Entity',
          display_name_plural: 'Test Entities',
          description: 'Test entity for validation',
          fields: [
            {
              field_name: 'name',
              field_type: 'text',
              display_label: 'Name',
              is_required: true,
              field_order: 1
            },
            {
              field_name: 'email',
              field_type: 'email',
              display_label: 'Email Address',
              is_required: false,
              field_order: 2
            }
          ]
        }
      ],
      transactions: [
        {
          transaction_type: 'TEST_TRANSACTION',
          display_name: 'Test Transaction',
          display_name_plural: 'Test Transactions',
          description: 'Test transaction for validation',
          header_fields: [
            {
              field_name: 'amount',
              field_type: 'number',
              display_label: 'Amount',
              is_required: true,
              field_order: 1
            }
          ]
        }
      ],
      navigation: {
        main_menu: [
          {
            id: 'test-menu',
            label: 'Test Menu',
            path: '/test-app/test',
            icon: 'Test'
          }
        ],
        quick_actions: [],
        dashboards: []
      }
    }

    validContext = {
      entity_id: '123e4567-e89b-12d3-a456-426614174000',
      organization_id: '00000000-0000-0000-0000-000000000000', // Platform org
      entity_type: 'APP_CONFIG',
      entity_code: 'test-app',
      smart_code: 'HERA.PLATFORM.CONFIG.APP.TEST_APP.v2',
      app_definition: validAppDefinition,
      created_by: '123e4567-e89b-12d3-a456-426614174001',
      updated_by: '123e4567-e89b-12d3-a456-426614174001'
    }
  })

  describe('validateAppConfig', () => {
    test('should pass validation for valid APP_CONFIG', () => {
      const result = AppConfigGuardrails.validateAppConfig(validContext)

      expect(result.isValid).toBe(true)
      expect(result.violations).toHaveLength(0)
      expect(result.validation_summary.failed).toBe(0)
      expect(result.validation_summary.passed).toBe(8) // All 8 checks passed
    })

    test('should return comprehensive validation result structure', () => {
      const result = AppConfigGuardrails.validateAppConfig(validContext)

      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('violations')
      expect(result).toHaveProperty('autofix_suggestions')
      expect(result).toHaveProperty('validation_summary')
      
      expect(result.validation_summary).toHaveProperty('total_checks')
      expect(result.validation_summary).toHaveProperty('passed')
      expect(result.validation_summary).toHaveProperty('failed')
      expect(result.validation_summary).toHaveProperty('warnings')
    })
  })

  describe('Smart Code Compliance', () => {
    test('should fail for invalid Smart Code format', () => {
      const context = {
        ...validContext,
        smart_code: 'invalid-smart-code'
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_INVALID_SMART_CODE',
          severity: 'error',
          field: 'smart_code'
        })
      )
      expect(result.autofix_suggestions).toContainEqual(
        expect.objectContaining({
          violation_code: 'APP_CONFIG_INVALID_SMART_CODE',
          fix_type: 'automatic',
          confidence: 'high'
        })
      )
    })

    test('should fail for wrong domain in Smart Code', () => {
      const context = {
        ...validContext,
        smart_code: 'HERA.SALON.CONFIG.APP.TEST_APP.v2' // Wrong domain
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_WRONG_DOMAIN',
          severity: 'error',
          field: 'smart_code'
        })
      )
    })

    test('should accept valid PLATFORM domain Smart Codes', () => {
      const validCodes = [
        'HERA.PLATFORM.CONFIG.APP.TEST_APP.v2',
        'HERA.PLATFORM.CONFIG.ENTITY.USER.v2',
        'HERA.PLATFORM.CONFIG.DATA.DEFINITION.v2'
      ]

      validCodes.forEach(smart_code => {
        const context = { ...validContext, smart_code }
        const result = AppConfigGuardrails.validateAppConfig(context)
        
        const smartCodeViolations = result.violations.filter(v => 
          v.code === 'APP_CONFIG_INVALID_SMART_CODE' || v.code === 'APP_CONFIG_WRONG_DOMAIN'
        )
        expect(smartCodeViolations).toHaveLength(0)
      })
    })
  })

  describe('Required Fields Validation', () => {
    test('should fail for missing entity_code', () => {
      const context = {
        ...validContext,
        entity_code: ''
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_MISSING_ENTITY_CODE',
          severity: 'error',
          field: 'entity_code'
        })
      )
    })

    test('should fail for missing smart_code', () => {
      const context = {
        ...validContext,
        smart_code: ''
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_MISSING_SMART_CODE',
          severity: 'error',
          field: 'smart_code'
        })
      )
    })

    test('should fail for APP_CONFIG without app_definition', () => {
      const context = {
        ...validContext,
        app_definition: undefined
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_MISSING_DEFINITION',
          severity: 'error',
          field: 'app_definition'
        })
      )
    })

    test('should allow APP_CONFIG_OVERRIDE without app_definition', () => {
      const context = {
        ...validContext,
        entity_type: 'APP_CONFIG_OVERRIDE' as const,
        app_definition: undefined
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      const missingDefinitionViolations = result.violations.filter(v => 
        v.code === 'APP_CONFIG_MISSING_DEFINITION'
      )
      expect(missingDefinitionViolations).toHaveLength(0)
    })
  })

  describe('Organization Isolation', () => {
    test('should fail for APP_CONFIG not in Platform Organization', () => {
      const context = {
        ...validContext,
        organization_id: '123e4567-e89b-12d3-a456-426614174999' // Non-platform org
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_WRONG_ORGANIZATION',
          severity: 'error',
          field: 'organization_id'
        })
      )
    })

    test('should fail for invalid UUID format in organization_id', () => {
      const context = {
        ...validContext,
        organization_id: 'invalid-uuid'
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_INVALID_ORG_ID',
          severity: 'error',
          field: 'organization_id'
        })
      )
    })

    test('should allow APP_CONFIG_OVERRIDE in any organization', () => {
      const context = {
        ...validContext,
        entity_type: 'APP_CONFIG_OVERRIDE' as const,
        organization_id: '123e4567-e89b-12d3-a456-426614174999' // Non-platform org
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      const wrongOrgViolations = result.violations.filter(v => 
        v.code === 'APP_CONFIG_WRONG_ORGANIZATION'
      )
      expect(wrongOrgViolations).toHaveLength(0)
    })
  })

  describe('Actor Stamping Validation', () => {
    test('should fail for missing created_by', () => {
      const context = {
        ...validContext,
        created_by: undefined
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_MISSING_CREATED_BY',
          severity: 'error',
          field: 'created_by'
        })
      )
    })

    test('should fail for missing updated_by', () => {
      const context = {
        ...validContext,
        updated_by: undefined
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_MISSING_UPDATED_BY',
          severity: 'error',
          field: 'updated_by'
        })
      )
    })

    test('should provide manual fix suggestions for missing actor stamps', () => {
      const context = {
        ...validContext,
        created_by: undefined,
        updated_by: undefined
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.autofix_suggestions).toContainEqual(
        expect.objectContaining({
          violation_code: 'APP_CONFIG_MISSING_CREATED_BY',
          fix_type: 'manual',
          confidence: 'high'
        })
      )
      expect(result.autofix_suggestions).toContainEqual(
        expect.objectContaining({
          violation_code: 'APP_CONFIG_MISSING_UPDATED_BY',
          fix_type: 'manual',
          confidence: 'high'
        })
      )
    })
  })

  describe('App Definition Structure Validation', () => {
    test('should fail for missing app_id', () => {
      const context = {
        ...validContext,
        app_definition: {
          ...validAppDefinition,
          app_id: undefined as any
        }
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_MISSING_APP_ID',
          severity: 'error',
          field: 'app_definition.app_id'
        })
      )
    })

    test('should fail for missing name', () => {
      const context = {
        ...validContext,
        app_definition: {
          ...validAppDefinition,
          name: undefined as any
        }
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_MISSING_NAME',
          severity: 'error',
          field: 'app_definition.name'
        })
      )
    })

    test('should warn for missing version', () => {
      const context = {
        ...validContext,
        app_definition: {
          ...validAppDefinition,
          version: undefined as any
        }
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_MISSING_VERSION',
          severity: 'warn',
          field: 'app_definition.version'
        })
      )
    })
  })

  describe('Entity Definition Validation', () => {
    test('should fail for entity missing entity_type', () => {
      const context = {
        ...validContext,
        app_definition: {
          ...validAppDefinition,
          entities: [
            {
              entity_type: undefined as any,
              display_name: 'Test Entity',
              fields: []
            }
          ]
        }
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_ENTITY_MISSING_TYPE',
          severity: 'error',
          field: 'app_definition.entities[0].entity_type'
        })
      )
    })

    test('should warn for entity missing display_name', () => {
      const context = {
        ...validContext,
        app_definition: {
          ...validAppDefinition,
          entities: [
            {
              entity_type: 'TEST_ENTITY',
              display_name: undefined as any,
              fields: []
            }
          ]
        }
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_ENTITY_MISSING_DISPLAY_NAME',
          severity: 'warn',
          field: 'app_definition.entities[0].display_name'
        })
      )
    })

    test('should validate entity fields', () => {
      const context = {
        ...validContext,
        app_definition: {
          ...validAppDefinition,
          entities: [
            {
              entity_type: 'TEST_ENTITY',
              display_name: 'Test Entity',
              fields: [
                {
                  field_name: undefined as any,
                  field_type: 'text',
                  display_label: 'Test Field'
                },
                {
                  field_name: 'test_field_2',
                  field_type: undefined as any,
                  display_label: 'Test Field 2'
                }
              ]
            }
          ]
        }
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_FIELD_MISSING_NAME',
          severity: 'error'
        })
      )
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_FIELD_MISSING_TYPE',
          severity: 'error'
        })
      )
    })
  })

  describe('Transaction Definition Validation', () => {
    test('should fail for transaction missing transaction_type', () => {
      const context = {
        ...validContext,
        app_definition: {
          ...validAppDefinition,
          transactions: [
            {
              transaction_type: undefined as any,
              display_name: 'Test Transaction',
              header_fields: []
            }
          ]
        }
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_TXN_MISSING_TYPE',
          severity: 'error',
          field: 'app_definition.transactions[0].transaction_type'
        })
      )
    })

    test('should warn for missing header_fields', () => {
      const context = {
        ...validContext,
        app_definition: {
          ...validAppDefinition,
          transactions: [
            {
              transaction_type: 'TEST_TRANSACTION',
              display_name: 'Test Transaction',
              header_fields: undefined as any
            }
          ]
        }
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_TXN_MISSING_HEADER_FIELDS',
          severity: 'warn'
        })
      )
    })
  })

  describe('Navigation Structure Validation', () => {
    test('should warn for missing navigation', () => {
      const context = {
        ...validContext,
        app_definition: {
          ...validAppDefinition,
          navigation: undefined
        }
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_MISSING_NAVIGATION',
          severity: 'warn',
          field: 'app_definition.navigation'
        })
      )
    })

    test('should validate menu item structure', () => {
      const context = {
        ...validContext,
        app_definition: {
          ...validAppDefinition,
          navigation: {
            main_menu: [
              {
                id: undefined as any,
                label: 'Test Menu',
                path: '/test'
              },
              {
                id: 'test-2',
                label: undefined as any,
                path: '/test-2'
              },
              {
                id: 'test-3',
                label: 'Test Menu 3',
                path: undefined as any
              }
            ],
            quick_actions: [],
            dashboards: []
          }
        }
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      expect(result.isValid).toBe(false)
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_MENU_ITEM_MISSING_ID',
          severity: 'error'
        })
      )
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_MENU_ITEM_MISSING_LABEL',
          severity: 'error'
        })
      )
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          code: 'APP_CONFIG_MENU_ITEM_MISSING_PATH',
          severity: 'error'
        })
      )
    })
  })

  describe('Autofix Suggestions', () => {
    test('should generate automatic fix suggestions where applicable', () => {
      const context = {
        ...validContext,
        smart_code: 'invalid-code',
        app_definition: {
          ...validAppDefinition,
          app_id: undefined as any,
          version: undefined as any
        }
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      const automaticFixes = result.autofix_suggestions.filter(s => s.fix_type === 'automatic')
      expect(automaticFixes.length).toBeGreaterThan(0)
      
      expect(automaticFixes).toContainEqual(
        expect.objectContaining({
          violation_code: 'APP_CONFIG_INVALID_SMART_CODE',
          fix_type: 'automatic',
          confidence: 'high'
        })
      )
    })

    test('should generate manual fix suggestions for complex issues', () => {
      const context = {
        ...validContext,
        created_by: undefined,
        updated_by: undefined
      }

      const result = AppConfigGuardrails.validateAppConfig(context)

      const manualFixes = result.autofix_suggestions.filter(s => s.fix_type === 'manual')
      expect(manualFixes.length).toBeGreaterThan(0)
      
      expect(manualFixes).toContainEqual(
        expect.objectContaining({
          violation_code: 'APP_CONFIG_MISSING_CREATED_BY',
          fix_type: 'manual',
          confidence: 'high'
        })
      )
    })
  })

  describe('Utility Functions', () => {
    test('generateAutofixScript should create valid SQL script', () => {
      const context = {
        ...validContext,
        smart_code: 'invalid-code'
      }

      const result = AppConfigGuardrails.validateAppConfig(context)
      const script = AppConfigGuardrails.generateAutofixScript(result)

      expect(script).toContain('-- HERA APP_CONFIG Autofix Script')
      expect(script).toContain('-- Generated:')
      expect(script).toContain('UPDATE core_entities')
    })

    test('formatCIReport should create valid markdown report', () => {
      const context = {
        ...validContext,
        smart_code: 'invalid-code'
      }

      const result = AppConfigGuardrails.validateAppConfig(context)
      const report = AppConfigGuardrails.formatCIReport(result)

      expect(report).toContain('## HERA APP_CONFIG Guardrail Validation Report')
      expect(report).toContain('### Summary')
      expect(report).toContain('### Violations')
      expect(report).toContain('### Autofix Suggestions')
      expect(report).toContain('❌')
      expect(report).toContain('🔧')
    })
  })

  describe('AppConfigSchema', () => {
    test('should validate correct app config structure', () => {
      const result = AppConfigSchema.safeParse(validAppDefinition)
      expect(result.success).toBe(true)
    })

    test('should fail for missing required fields', () => {
      const invalidConfig = {
        ...validAppDefinition,
        app_id: undefined,
        name: undefined
      }

      const result = AppConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
    })

    test('should validate nested entity structure', () => {
      const configWithInvalidEntity = {
        ...validAppDefinition,
        entities: [
          {
            entity_type: undefined,
            display_name: undefined,
            fields: [
              {
                field_name: undefined,
                field_type: undefined,
                display_label: undefined
              }
            ]
          }
        ]
      }

      const result = AppConfigSchema.safeParse(configWithInvalidEntity)
      expect(result.success).toBe(false)
    })
  })
})