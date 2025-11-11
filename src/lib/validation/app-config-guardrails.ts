/**
 * HERA APP_CONFIG Guardrail Validation Rules
 * Smart Code: HERA.PLATFORM.CONFIG.GUARDRAIL.VALIDATOR.v2
 * 
 * Provides comprehensive validation for APP_CONFIG entities with automatic
 * autofix suggestions and integration with HERA Guardrail 2.0 framework.
 */

import { z } from 'zod'
import { GuardrailViolation, gv } from '@/lib/universal/guardrails'
import { SmartCodeValidationService } from './smart-code-validation-service'
import type { HeraAppConfig, EntityDefinition, TransactionDefinition } from '@/types/app-config'

export interface AppConfigGuardrailContext {
  entity_id: string
  organization_id: string
  entity_type: 'APP_CONFIG' | 'APP_CONFIG_OVERRIDE'
  entity_code: string
  smart_code: string
  app_definition?: HeraAppConfig
  created_by?: string
  updated_by?: string
}

export interface AppConfigValidationResult {
  isValid: boolean
  violations: GuardrailViolation[]
  autofix_suggestions: AutofixSuggestion[]
  validation_summary: {
    total_checks: number
    passed: number
    failed: number
    warnings: number
  }
}

export interface AutofixSuggestion {
  violation_code: string
  description: string
  fix_type: 'automatic' | 'manual' | 'review_required'
  fix_command?: string
  fix_data?: any
  confidence: 'high' | 'medium' | 'low'
}

/**
 * HERA APP_CONFIG Guardrail Validation Engine
 * 
 * Enforces all Guardrail 2.0 compliance rules for APP_CONFIG entities:
 * - Smart Code format validation
 * - Required field presence
 * - Organization isolation
 * - Actor stamping verification
 * - Business rule compliance
 */
export class AppConfigGuardrails {
  /**
   * Validate complete APP_CONFIG entity with comprehensive checks
   */
  static validateAppConfig(context: AppConfigGuardrailContext): AppConfigValidationResult {
    const violations: GuardrailViolation[] = []
    const autofixSuggestions: AutofixSuggestion[] = []

    // Run all validation checks
    violations.push(...this.validateSmartCodeCompliance(context, autofixSuggestions))
    violations.push(...this.validateRequiredFields(context, autofixSuggestions))
    violations.push(...this.validateOrganizationIsolation(context, autofixSuggestions))
    violations.push(...this.validateActorStamping(context, autofixSuggestions))
    violations.push(...this.validateAppDefinitionStructure(context, autofixSuggestions))
    violations.push(...this.validateEntityDefinitions(context, autofixSuggestions))
    violations.push(...this.validateTransactionDefinitions(context, autofixSuggestions))
    violations.push(...this.validateNavigationStructure(context, autofixSuggestions))

    // Calculate summary
    const totalChecks = 8 // Number of validation methods
    const failedViolations = violations.filter(v => v.severity === 'error')
    const warningViolations = violations.filter(v => v.severity === 'warn')
    const passed = totalChecks - failedViolations.length

    return {
      isValid: failedViolations.length === 0,
      violations,
      autofix_suggestions: autofixSuggestions,
      validation_summary: {
        total_checks: totalChecks,
        passed,
        failed: failedViolations.length,
        warnings: warningViolations.length
      }
    }
  }

  /**
   * Validate Smart Code compliance using the validation service
   */
  private static validateSmartCodeCompliance(
    context: AppConfigGuardrailContext,
    autofixSuggestions: AutofixSuggestion[]
  ): GuardrailViolation[] {
    const violations: GuardrailViolation[] = []

    // 1. Validate Smart Code format
    const validation = SmartCodeValidationService.validateSmartCode(context.smart_code)
    if (!validation.isValid) {
      violations.push(gv({
        code: 'APP_CONFIG_INVALID_SMART_CODE',
        message: `Invalid Smart Code format: ${validation.errorMessage}`,
        field: 'smart_code',
        context: { current: context.smart_code, expected_pattern: validation.expectedPattern }
      }))

      // Generate autofix suggestion
      const suggestedCode = SmartCodeValidationService.generateAppConfigSmartCode(
        'ENTITY',
        undefined,
        context.entity_code
      )
      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_INVALID_SMART_CODE',
        description: `Replace invalid Smart Code with properly formatted one`,
        fix_type: 'automatic',
        fix_command: `UPDATE core_entities SET smart_code = '${suggestedCode}' WHERE id = '${context.entity_id}'`,
        fix_data: { suggested_smart_code: suggestedCode },
        confidence: 'high'
      })
    }

    // 2. Validate domain compliance
    if (validation.isValid && validation.domain !== 'PLATFORM') {
      violations.push(gv({
        code: 'APP_CONFIG_WRONG_DOMAIN',
        message: `APP_CONFIG entities must use PLATFORM domain, found: ${validation.domain}`,
        field: 'smart_code',
        context: { current_domain: validation.domain, required_domain: 'PLATFORM' }
      }))

      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_WRONG_DOMAIN',
        description: 'Regenerate Smart Code with correct PLATFORM domain',
        fix_type: 'automatic',
        fix_command: 'SmartCodeValidationService.generateAppConfigSmartCode()',
        confidence: 'high'
      })
    }

    return violations
  }

  /**
   * Validate required fields for APP_CONFIG entities
   */
  private static validateRequiredFields(
    context: AppConfigGuardrailContext,
    autofixSuggestions: AutofixSuggestion[]
  ): GuardrailViolation[] {
    const violations: GuardrailViolation[] = []

    // 1. Entity code is required
    if (!context.entity_code || context.entity_code.trim() === '') {
      violations.push(gv({
        code: 'APP_CONFIG_MISSING_ENTITY_CODE',
        message: 'APP_CONFIG entities must have a valid entity_code',
        field: 'entity_code',
        context: { current: context.entity_code }
      }))

      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_MISSING_ENTITY_CODE',
        description: 'Generate entity_code from app_id in the configuration',
        fix_type: 'manual',
        confidence: 'medium'
      })
    }

    // 2. Smart code is required
    if (!context.smart_code || context.smart_code.trim() === '') {
      violations.push(gv({
        code: 'APP_CONFIG_MISSING_SMART_CODE',
        message: 'APP_CONFIG entities must have a valid smart_code',
        field: 'smart_code',
        context: { current: context.smart_code }
      }))

      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_MISSING_SMART_CODE',
        description: 'Generate Smart Code using SmartCodeValidationService',
        fix_type: 'automatic',
        fix_command: 'SmartCodeValidationService.generateAppConfigSmartCode("ENTITY", undefined, entity_code)',
        confidence: 'high'
      })
    }

    // 3. App definition is required for non-override entities
    if (context.entity_type === 'APP_CONFIG' && !context.app_definition) {
      violations.push(gv({
        code: 'APP_CONFIG_MISSING_DEFINITION',
        message: 'APP_CONFIG entities must have app_definition in dynamic data',
        field: 'app_definition',
        context: { entity_type: context.entity_type }
      }))

      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_MISSING_DEFINITION',
        description: 'Add app_definition field to core_dynamic_data',
        fix_type: 'manual',
        confidence: 'low'
      })
    }

    return violations
  }

  /**
   * Validate organization isolation compliance
   */
  private static validateOrganizationIsolation(
    context: AppConfigGuardrailContext,
    autofixSuggestions: AutofixSuggestion[]
  ): GuardrailViolation[] {
    const violations: GuardrailViolation[] = []
    const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

    // 1. Platform configs must be in Platform Organization
    if (context.entity_type === 'APP_CONFIG' && context.organization_id !== PLATFORM_ORG_ID) {
      violations.push(gv({
        code: 'APP_CONFIG_WRONG_ORGANIZATION',
        message: 'APP_CONFIG entities must be stored in Platform Organization',
        field: 'organization_id',
        context: { 
          current: context.organization_id, 
          required: PLATFORM_ORG_ID,
          entity_type: context.entity_type
        }
      }))

      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_WRONG_ORGANIZATION',
        description: 'Move APP_CONFIG to Platform Organization',
        fix_type: 'review_required',
        fix_command: `UPDATE core_entities SET organization_id = '${PLATFORM_ORG_ID}' WHERE id = '${context.entity_id}'`,
        confidence: 'medium'
      })
    }

    // 2. Organization ID must be valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(context.organization_id)) {
      violations.push(gv({
        code: 'APP_CONFIG_INVALID_ORG_ID',
        message: 'organization_id must be a valid UUID',
        field: 'organization_id',
        context: { current: context.organization_id }
      }))

      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_INVALID_ORG_ID',
        description: 'Fix organization_id format',
        fix_type: 'manual',
        confidence: 'low'
      })
    }

    return violations
  }

  /**
   * Validate actor stamping compliance
   */
  private static validateActorStamping(
    context: AppConfigGuardrailContext,
    autofixSuggestions: AutofixSuggestion[]
  ): GuardrailViolation[] {
    const violations: GuardrailViolation[] = []

    // 1. created_by is required
    if (!context.created_by) {
      violations.push(gv({
        code: 'APP_CONFIG_MISSING_CREATED_BY',
        message: 'APP_CONFIG entities must have created_by actor stamp',
        field: 'created_by',
        context: { current: context.created_by }
      }))

      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_MISSING_CREATED_BY',
        description: 'Ensure all writes use hera_entities_crud_v1 RPC with actor_user_id',
        fix_type: 'manual',
        confidence: 'high'
      })
    }

    // 2. updated_by is required
    if (!context.updated_by) {
      violations.push(gv({
        code: 'APP_CONFIG_MISSING_UPDATED_BY',
        message: 'APP_CONFIG entities must have updated_by actor stamp',
        field: 'updated_by',
        context: { current: context.updated_by }
      }))

      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_MISSING_UPDATED_BY',
        description: 'Ensure all writes use hera_entities_crud_v1 RPC with actor_user_id',
        fix_type: 'manual',
        confidence: 'high'
      })
    }

    return violations
  }

  /**
   * Validate app definition structure
   */
  private static validateAppDefinitionStructure(
    context: AppConfigGuardrailContext,
    autofixSuggestions: AutofixSuggestion[]
  ): GuardrailViolation[] {
    const violations: GuardrailViolation[] = []

    if (!context.app_definition) {
      return violations // Already flagged in required fields
    }

    const config = context.app_definition

    // 1. Required app metadata
    if (!config.app_id) {
      violations.push(gv({
        code: 'APP_CONFIG_MISSING_APP_ID',
        message: 'app_definition must include app_id',
        field: 'app_definition.app_id',
        severity: 'error'
      }))

      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_MISSING_APP_ID',
        description: 'Add app_id field matching entity_code',
        fix_type: 'automatic',
        fix_data: { app_id: context.entity_code },
        confidence: 'high'
      })
    }

    if (!config.name) {
      violations.push(gv({
        code: 'APP_CONFIG_MISSING_NAME',
        message: 'app_definition must include name',
        field: 'app_definition.name',
        severity: 'error'
      }))

      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_MISSING_NAME',
        description: 'Add descriptive name for the application',
        fix_type: 'manual',
        confidence: 'medium'
      })
    }

    if (!config.version) {
      violations.push(gv({
        code: 'APP_CONFIG_MISSING_VERSION',
        message: 'app_definition must include version',
        field: 'app_definition.version',
        severity: 'warn'
      }))

      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_MISSING_VERSION',
        description: 'Add version field (e.g., "1.0.0")',
        fix_type: 'automatic',
        fix_data: { version: '1.0.0' },
        confidence: 'high'
      })
    }

    return violations
  }

  /**
   * Validate entity definitions within app config
   */
  private static validateEntityDefinitions(
    context: AppConfigGuardrailContext,
    autofixSuggestions: AutofixSuggestion[]
  ): GuardrailViolation[] {
    const violations: GuardrailViolation[] = []

    if (!context.app_definition?.entities) {
      return violations // Entities are optional
    }

    context.app_definition.entities.forEach((entity, index) => {
      // 1. Required entity fields
      if (!entity.entity_type) {
        violations.push(gv({
          code: 'APP_CONFIG_ENTITY_MISSING_TYPE',
          message: `Entity at index ${index} missing entity_type`,
          field: `app_definition.entities[${index}].entity_type`,
          severity: 'error'
        }))
      }

      if (!entity.display_name) {
        violations.push(gv({
          code: 'APP_CONFIG_ENTITY_MISSING_DISPLAY_NAME',
          message: `Entity ${entity.entity_type} missing display_name`,
          field: `app_definition.entities[${index}].display_name`,
          severity: 'warn'
        }))

        autofixSuggestions.push({
          violation_code: 'APP_CONFIG_ENTITY_MISSING_DISPLAY_NAME',
          description: 'Generate display_name from entity_type',
          fix_type: 'automatic',
          fix_data: { 
            display_name: entity.entity_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          },
          confidence: 'high'
        })
      }

      // 2. Validate entity fields
      if (entity.fields) {
        entity.fields.forEach((field, fieldIndex) => {
          if (!field.field_name) {
            violations.push(gv({
              code: 'APP_CONFIG_FIELD_MISSING_NAME',
              message: `Field at index ${fieldIndex} in entity ${entity.entity_type} missing field_name`,
              field: `app_definition.entities[${index}].fields[${fieldIndex}].field_name`,
              severity: 'error'
            }))
          }

          if (!field.field_type) {
            violations.push(gv({
              code: 'APP_CONFIG_FIELD_MISSING_TYPE',
              message: `Field ${field.field_name} missing field_type`,
              field: `app_definition.entities[${index}].fields[${fieldIndex}].field_type`,
              severity: 'error'
            }))
          }
        })
      }
    })

    return violations
  }

  /**
   * Validate transaction definitions within app config
   */
  private static validateTransactionDefinitions(
    context: AppConfigGuardrailContext,
    autofixSuggestions: AutofixSuggestion[]
  ): GuardrailViolation[] {
    const violations: GuardrailViolation[] = []

    if (!context.app_definition?.transactions) {
      return violations // Transactions are optional
    }

    context.app_definition.transactions.forEach((transaction, index) => {
      // 1. Required transaction fields
      if (!transaction.transaction_type) {
        violations.push(gv({
          code: 'APP_CONFIG_TXN_MISSING_TYPE',
          message: `Transaction at index ${index} missing transaction_type`,
          field: `app_definition.transactions[${index}].transaction_type`,
          severity: 'error'
        }))
      }

      if (!transaction.display_name) {
        violations.push(gv({
          code: 'APP_CONFIG_TXN_MISSING_DISPLAY_NAME',
          message: `Transaction ${transaction.transaction_type} missing display_name`,
          field: `app_definition.transactions[${index}].display_name`,
          severity: 'warn'
        }))

        autofixSuggestions.push({
          violation_code: 'APP_CONFIG_TXN_MISSING_DISPLAY_NAME',
          description: 'Generate display_name from transaction_type',
          fix_type: 'automatic',
          fix_data: { 
            display_name: transaction.transaction_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          },
          confidence: 'high'
        })
      }

      // 2. Validate header fields
      if (!transaction.header_fields || transaction.header_fields.length === 0) {
        violations.push(gv({
          code: 'APP_CONFIG_TXN_MISSING_HEADER_FIELDS',
          message: `Transaction ${transaction.transaction_type} must have header_fields`,
          field: `app_definition.transactions[${index}].header_fields`,
          severity: 'warn'
        }))

        autofixSuggestions.push({
          violation_code: 'APP_CONFIG_TXN_MISSING_HEADER_FIELDS',
          description: 'Add basic header fields for transaction',
          fix_type: 'manual',
          confidence: 'medium'
        })
      }
    })

    return violations
  }

  /**
   * Validate navigation structure
   */
  private static validateNavigationStructure(
    context: AppConfigGuardrailContext,
    autofixSuggestions: AutofixSuggestion[]
  ): GuardrailViolation[] {
    const violations: GuardrailViolation[] = []

    if (!context.app_definition?.navigation) {
      violations.push(gv({
        code: 'APP_CONFIG_MISSING_NAVIGATION',
        message: 'app_definition should include navigation configuration',
        field: 'app_definition.navigation',
        severity: 'warn'
      }))

      autofixSuggestions.push({
        violation_code: 'APP_CONFIG_MISSING_NAVIGATION',
        description: 'Add basic navigation structure',
        fix_type: 'automatic',
        fix_data: {
          navigation: {
            main_menu: [],
            quick_actions: [],
            dashboards: []
          }
        },
        confidence: 'high'
      })

      return violations
    }

    const nav = context.app_definition.navigation

    // Validate main menu structure
    if (nav.main_menu && Array.isArray(nav.main_menu)) {
      nav.main_menu.forEach((item, index) => {
        if (!item.id) {
          violations.push(gv({
            code: 'APP_CONFIG_MENU_ITEM_MISSING_ID',
            message: `Menu item at index ${index} missing id`,
            field: `app_definition.navigation.main_menu[${index}].id`,
            severity: 'error'
          }))
        }

        if (!item.label) {
          violations.push(gv({
            code: 'APP_CONFIG_MENU_ITEM_MISSING_LABEL',
            message: `Menu item ${item.id} missing label`,
            field: `app_definition.navigation.main_menu[${index}].label`,
            severity: 'error'
          }))
        }

        if (!item.path) {
          violations.push(gv({
            code: 'APP_CONFIG_MENU_ITEM_MISSING_PATH',
            message: `Menu item ${item.id} missing path`,
            field: `app_definition.navigation.main_menu[${index}].path`,
            severity: 'error'
          }))
        }
      })
    }

    return violations
  }

  /**
   * Generate autofix script for all violations
   */
  static generateAutofixScript(result: AppConfigValidationResult): string {
    const automaticFixes = result.autofix_suggestions.filter(fix => fix.fix_type === 'automatic')
    
    if (automaticFixes.length === 0) {
      return '-- No automatic fixes available'
    }

    let script = '-- HERA APP_CONFIG Autofix Script\n'
    script += `-- Generated: ${new Date().toISOString()}\n`
    script += `-- Fixes: ${automaticFixes.length} automatic violations\n\n`

    automaticFixes.forEach((fix, index) => {
      script += `-- Fix ${index + 1}: ${fix.description}\n`
      if (fix.fix_command) {
        script += `${fix.fix_command};\n`
      }
      script += '\n'
    })

    return script
  }

  /**
   * Format validation report for CI output
   */
  static formatCIReport(result: AppConfigValidationResult): string {
    let report = '## HERA APP_CONFIG Guardrail Validation Report\n\n'
    
    // Summary
    report += '### Summary\n'
    report += `- **Total Checks**: ${result.validation_summary.total_checks}\n`
    report += `- **Passed**: ${result.validation_summary.passed} ✅\n`
    report += `- **Failed**: ${result.validation_summary.failed} ❌\n`
    report += `- **Warnings**: ${result.validation_summary.warnings} ⚠️\n`
    report += `- **Overall Status**: ${result.isValid ? 'PASSED ✅' : 'FAILED ❌'}\n\n`

    // Violations
    if (result.violations.length > 0) {
      report += '### Violations\n\n'
      result.violations.forEach(violation => {
        const icon = violation.severity === 'error' ? '❌' : violation.severity === 'warn' ? '⚠️' : 'ℹ️'
        report += `${icon} **${violation.code}**: ${violation.message}\n`
        if (violation.field) {
          report += `  - Field: \`${violation.field}\`\n`
        }
        if (violation.context) {
          report += `  - Context: ${JSON.stringify(violation.context, null, 2)}\n`
        }
        report += '\n'
      })
    }

    // Autofix suggestions
    if (result.autofix_suggestions.length > 0) {
      report += '### Autofix Suggestions\n\n'
      result.autofix_suggestions.forEach(fix => {
        const icon = fix.fix_type === 'automatic' ? '🔧' : fix.fix_type === 'manual' ? '✋' : '🔍'
        report += `${icon} **${fix.violation_code}**: ${fix.description}\n`
        report += `  - Type: ${fix.fix_type}\n`
        report += `  - Confidence: ${fix.confidence}\n`
        if (fix.fix_command) {
          report += `  - Command: \`${fix.fix_command}\`\n`
        }
        report += '\n'
      })
    }

    return report
  }
}

// Export schema for validation
export const AppConfigSchema = z.object({
  app_id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  industry: z.string().optional(),
  entities: z.array(z.object({
    entity_type: z.string().min(1),
    display_name: z.string().min(1),
    display_name_plural: z.string().optional(),
    fields: z.array(z.object({
      field_name: z.string().min(1),
      field_type: z.string().min(1),
      display_label: z.string().min(1),
      is_required: z.boolean().optional(),
      field_order: z.number().optional()
    })).optional()
  })).optional(),
  transactions: z.array(z.object({
    transaction_type: z.string().min(1),
    display_name: z.string().min(1),
    display_name_plural: z.string().optional(),
    header_fields: z.array(z.object({
      field_name: z.string().min(1),
      field_type: z.string().min(1),
      display_label: z.string().min(1),
      is_required: z.boolean().optional(),
      field_order: z.number().optional()
    }))
  })).optional(),
  navigation: z.object({
    main_menu: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      path: z.string().min(1),
      icon: z.string().optional()
    })).optional(),
    quick_actions: z.array(z.any()).optional(),
    dashboards: z.array(z.any()).optional()
  }).optional()
})