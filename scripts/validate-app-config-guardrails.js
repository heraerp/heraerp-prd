#!/usr/bin/env node

/**
 * HERA APP_CONFIG Guardrail Validation for CI/CD Pipeline
 * Smart Code: HERA.PLATFORM.CONFIG.CI.VALIDATOR.v2
 * 
 * Validates all APP_CONFIG entities in the database against Guardrail 2.0 rules
 * and generates comprehensive reports with autofix suggestions.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// Import validation functions (in real scenario, these would be compiled JS)
// For now, we'll recreate the core validation logic in JS

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

// Smart Code validation patterns
const SMART_CODE_PATTERNS = {
  PLATFORM: /^HERA\.PLATFORM\.[A-Z]+(\.[A-Z_]+)*\.v2$/,
  GENERAL: /^HERA\.[A-Z0-9_]{3,30}(?:\.[A-Z0-9_]{2,40}){3,8}\.v[0-9]+$/
}

class AppConfigGuardrailValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      validation_type: 'APP_CONFIG_GUARDRAILS',
      total_configs: 0,
      valid_configs: 0,
      invalid_configs: 0,
      warnings: 0,
      violations: [],
      autofix_suggestions: [],
      summary: {
        smart_code_compliance: 0,
        required_fields_compliance: 0,
        organization_isolation_compliance: 0,
        actor_stamping_compliance: 0,
        app_definition_structure_compliance: 0
      }
    }
  }

  /**
   * Main validation entry point
   */
  async validate() {
    console.log('🔍 HERA APP_CONFIG Guardrail Validation Starting...')
    console.log('=====================================================')

    try {
      // Load all APP_CONFIG entities
      const appConfigs = await this.loadAppConfigs()
      console.log(`📊 Found ${appConfigs.length} APP_CONFIG entities to validate`)

      this.results.total_configs = appConfigs.length

      // Validate each configuration
      for (const config of appConfigs) {
        await this.validateSingleConfig(config)
      }

      // Generate summary
      this.generateSummary()

      // Output results
      this.outputResults()

      // Return exit code
      return this.results.invalid_configs > 0 ? 1 : 0

    } catch (error) {
      console.error('💥 Error during APP_CONFIG validation:', error)
      return 1
    }
  }

  /**
   * Load all APP_CONFIG entities from database
   */
  async loadAppConfigs() {
    const { data: entities, error } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_type,
        entity_code,
        entity_name,
        smart_code,
        organization_id,
        created_by,
        updated_by,
        created_at,
        updated_at
      `)
      .in('entity_type', ['APP_CONFIG', 'APP_CONFIG_OVERRIDE'])
      .eq('status', 'active')

    if (error) {
      throw new Error(`Failed to load APP_CONFIG entities: ${error.message}`)
    }

    // Load dynamic data for each entity
    const configs = []
    for (const entity of entities || []) {
      const { data: dynamicData } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_json')
        .eq('entity_id', entity.id)
        .in('field_name', ['app_definition', 'app_override'])

      const appDefinition = dynamicData?.find(d => d.field_name === 'app_definition')?.field_value_json
      const appOverride = dynamicData?.find(d => d.field_name === 'app_override')?.field_value_json

      configs.push({
        ...entity,
        app_definition: appDefinition,
        app_override: appOverride
      })
    }

    return configs
  }

  /**
   * Validate a single APP_CONFIG entity
   */
  async validateSingleConfig(config) {
    console.log(`\n🔍 Validating ${config.entity_type}: ${config.entity_code}`)
    
    const violations = []
    const suggestions = []
    let isValid = true

    // 1. Smart Code Compliance
    const smartCodeResult = this.validateSmartCode(config)
    if (!smartCodeResult.isValid) {
      isValid = false
      violations.push(...smartCodeResult.violations)
      suggestions.push(...smartCodeResult.suggestions)
    }

    // 2. Required Fields
    const requiredFieldsResult = this.validateRequiredFields(config)
    if (!requiredFieldsResult.isValid) {
      isValid = false
      violations.push(...requiredFieldsResult.violations)
      suggestions.push(...requiredFieldsResult.suggestions)
    }

    // 3. Organization Isolation
    const orgIsolationResult = this.validateOrganizationIsolation(config)
    if (!orgIsolationResult.isValid) {
      isValid = false
      violations.push(...orgIsolationResult.violations)
      suggestions.push(...orgIsolationResult.suggestions)
    }

    // 4. Actor Stamping
    const actorStampingResult = this.validateActorStamping(config)
    if (!actorStampingResult.isValid) {
      isValid = false
      violations.push(...actorStampingResult.violations)
      suggestions.push(...actorStampingResult.suggestions)
    }

    // 5. App Definition Structure (if present)
    if (config.app_definition || config.app_override) {
      const structureResult = this.validateAppDefinitionStructure(config)
      if (!structureResult.isValid) {
        isValid = false
        violations.push(...structureResult.violations)
        suggestions.push(...structureResult.suggestions)
      }
    }

    // Record results
    if (isValid) {
      this.results.valid_configs++
      console.log(`✅ ${config.entity_code}: PASSED`)
    } else {
      this.results.invalid_configs++
      console.log(`❌ ${config.entity_code}: FAILED (${violations.length} violations)`)
    }

    // Store violations and suggestions
    this.results.violations.push(...violations.map(v => ({ ...v, entity_code: config.entity_code })))
    this.results.autofix_suggestions.push(...suggestions.map(s => ({ ...s, entity_code: config.entity_code })))
  }

  /**
   * Validate Smart Code compliance
   */
  validateSmartCode(config) {
    const violations = []
    const suggestions = []

    // 1. Format validation
    if (!SMART_CODE_PATTERNS.GENERAL.test(config.smart_code)) {
      violations.push({
        code: 'APP_CONFIG_INVALID_SMART_CODE',
        message: `Invalid Smart Code format: ${config.smart_code}`,
        severity: 'error',
        field: 'smart_code'
      })

      suggestions.push({
        violation_code: 'APP_CONFIG_INVALID_SMART_CODE',
        description: 'Generate valid Smart Code using SmartCodeValidationService',
        fix_type: 'automatic',
        confidence: 'high'
      })
    }

    // 2. Domain validation for APP_CONFIG
    if (config.entity_type === 'APP_CONFIG' && !SMART_CODE_PATTERNS.PLATFORM.test(config.smart_code)) {
      violations.push({
        code: 'APP_CONFIG_WRONG_DOMAIN',
        message: `APP_CONFIG entities must use PLATFORM domain. Found: ${config.smart_code}`,
        severity: 'error',
        field: 'smart_code'
      })

      suggestions.push({
        violation_code: 'APP_CONFIG_WRONG_DOMAIN',
        description: 'Regenerate Smart Code with PLATFORM domain',
        fix_type: 'automatic',
        confidence: 'high'
      })
    }

    // 3. Version validation
    const versionMatch = config.smart_code.match(/\.v(\d+)$/)
    if (!versionMatch || parseInt(versionMatch[1]) < 1) {
      violations.push({
        code: 'APP_CONFIG_INVALID_VERSION',
        message: 'Smart Code must have valid version (v1, v2, etc.)',
        severity: 'error',
        field: 'smart_code'
      })
    }

    return {
      isValid: violations.length === 0,
      violations,
      suggestions
    }
  }

  /**
   * Validate required fields
   */
  validateRequiredFields(config) {
    const violations = []
    const suggestions = []

    // 1. Entity code
    if (!config.entity_code || config.entity_code.trim() === '') {
      violations.push({
        code: 'APP_CONFIG_MISSING_ENTITY_CODE',
        message: 'entity_code is required',
        severity: 'error',
        field: 'entity_code'
      })
    }

    // 2. Entity name
    if (!config.entity_name || config.entity_name.trim() === '') {
      violations.push({
        code: 'APP_CONFIG_MISSING_ENTITY_NAME',
        message: 'entity_name is required',
        severity: 'error',
        field: 'entity_name'
      })

      suggestions.push({
        violation_code: 'APP_CONFIG_MISSING_ENTITY_NAME',
        description: 'Generate entity_name from entity_code',
        fix_type: 'automatic',
        confidence: 'high'
      })
    }

    // 3. Smart code
    if (!config.smart_code || config.smart_code.trim() === '') {
      violations.push({
        code: 'APP_CONFIG_MISSING_SMART_CODE',
        message: 'smart_code is required',
        severity: 'error',
        field: 'smart_code'
      })
    }

    // 4. App definition for main configs
    if (config.entity_type === 'APP_CONFIG' && !config.app_definition) {
      violations.push({
        code: 'APP_CONFIG_MISSING_DEFINITION',
        message: 'APP_CONFIG entities must have app_definition in dynamic data',
        severity: 'error',
        field: 'app_definition'
      })

      suggestions.push({
        violation_code: 'APP_CONFIG_MISSING_DEFINITION',
        description: 'Add app_definition field to core_dynamic_data',
        fix_type: 'manual',
        confidence: 'medium'
      })
    }

    return {
      isValid: violations.length === 0,
      violations,
      suggestions
    }
  }

  /**
   * Validate organization isolation
   */
  validateOrganizationIsolation(config) {
    const violations = []
    const suggestions = []

    // 1. UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(config.organization_id)) {
      violations.push({
        code: 'APP_CONFIG_INVALID_ORG_ID',
        message: 'organization_id must be a valid UUID',
        severity: 'error',
        field: 'organization_id'
      })
    }

    // 2. Platform configs in platform org
    if (config.entity_type === 'APP_CONFIG' && config.organization_id !== PLATFORM_ORG_ID) {
      violations.push({
        code: 'APP_CONFIG_WRONG_ORGANIZATION',
        message: 'APP_CONFIG entities must be in Platform Organization',
        severity: 'error',
        field: 'organization_id'
      })

      suggestions.push({
        violation_code: 'APP_CONFIG_WRONG_ORGANIZATION',
        description: 'Move to Platform Organization',
        fix_type: 'review_required',
        confidence: 'medium'
      })
    }

    return {
      isValid: violations.length === 0,
      violations,
      suggestions
    }
  }

  /**
   * Validate actor stamping
   */
  validateActorStamping(config) {
    const violations = []
    const suggestions = []

    // 1. Created by
    if (!config.created_by) {
      violations.push({
        code: 'APP_CONFIG_MISSING_CREATED_BY',
        message: 'created_by actor stamp is required',
        severity: 'error',
        field: 'created_by'
      })

      suggestions.push({
        violation_code: 'APP_CONFIG_MISSING_CREATED_BY',
        description: 'Use hera_entities_crud_v1 RPC for all writes',
        fix_type: 'manual',
        confidence: 'high'
      })
    }

    // 2. Updated by
    if (!config.updated_by) {
      violations.push({
        code: 'APP_CONFIG_MISSING_UPDATED_BY',
        message: 'updated_by actor stamp is required',
        severity: 'error',
        field: 'updated_by'
      })

      suggestions.push({
        violation_code: 'APP_CONFIG_MISSING_UPDATED_BY',
        description: 'Use hera_entities_crud_v1 RPC for all writes',
        fix_type: 'manual',
        confidence: 'high'
      })
    }

    return {
      isValid: violations.length === 0,
      violations,
      suggestions
    }
  }

  /**
   * Validate app definition structure
   */
  validateAppDefinitionStructure(config) {
    const violations = []
    const suggestions = []
    
    const definition = config.app_definition || config.app_override
    if (!definition) return { isValid: true, violations, suggestions }

    // 1. Required app metadata
    if (!definition.app_id) {
      violations.push({
        code: 'APP_CONFIG_MISSING_APP_ID',
        message: 'app_definition must include app_id',
        severity: 'error',
        field: 'app_definition.app_id'
      })

      suggestions.push({
        violation_code: 'APP_CONFIG_MISSING_APP_ID',
        description: 'Add app_id matching entity_code',
        fix_type: 'automatic',
        confidence: 'high'
      })
    }

    if (!definition.name) {
      violations.push({
        code: 'APP_CONFIG_MISSING_NAME',
        message: 'app_definition must include name',
        severity: 'error',
        field: 'app_definition.name'
      })
    }

    if (!definition.version) {
      violations.push({
        code: 'APP_CONFIG_MISSING_VERSION',
        message: 'app_definition should include version',
        severity: 'warn',
        field: 'app_definition.version'
      })

      suggestions.push({
        violation_code: 'APP_CONFIG_MISSING_VERSION',
        description: 'Add version field (e.g., "1.0.0")',
        fix_type: 'automatic',
        confidence: 'high'
      })
    }

    // 2. Validate entities if present
    if (definition.entities && Array.isArray(definition.entities)) {
      definition.entities.forEach((entity, index) => {
        if (!entity.entity_type) {
          violations.push({
            code: 'APP_CONFIG_ENTITY_MISSING_TYPE',
            message: `Entity at index ${index} missing entity_type`,
            severity: 'error',
            field: `app_definition.entities[${index}].entity_type`
          })
        }

        if (!entity.display_name) {
          violations.push({
            code: 'APP_CONFIG_ENTITY_MISSING_DISPLAY_NAME',
            message: `Entity ${entity.entity_type} missing display_name`,
            severity: 'warn',
            field: `app_definition.entities[${index}].display_name`
          })
        }
      })
    }

    // 3. Validate transactions if present
    if (definition.transactions && Array.isArray(definition.transactions)) {
      definition.transactions.forEach((transaction, index) => {
        if (!transaction.transaction_type) {
          violations.push({
            code: 'APP_CONFIG_TXN_MISSING_TYPE',
            message: `Transaction at index ${index} missing transaction_type`,
            severity: 'error',
            field: `app_definition.transactions[${index}].transaction_type`
          })
        }

        if (!transaction.display_name) {
          violations.push({
            code: 'APP_CONFIG_TXN_MISSING_DISPLAY_NAME',
            message: `Transaction ${transaction.transaction_type} missing display_name`,
            severity: 'warn',
            field: `app_definition.transactions[${index}].display_name`
          })
        }
      })
    }

    return {
      isValid: violations.filter(v => v.severity === 'error').length === 0,
      violations,
      suggestions
    }
  }

  /**
   * Generate validation summary
   */
  generateSummary() {
    const errorViolations = this.results.violations.filter(v => v.severity === 'error')
    const warnViolations = this.results.violations.filter(v => v.severity === 'warn')

    this.results.warnings = warnViolations.length

    // Calculate compliance rates
    const totalConfigs = this.results.total_configs
    if (totalConfigs > 0) {
      this.results.summary.smart_code_compliance = Math.round(
        ((totalConfigs - errorViolations.filter(v => v.code.includes('SMART_CODE')).length) / totalConfigs) * 100
      )
      this.results.summary.required_fields_compliance = Math.round(
        ((totalConfigs - errorViolations.filter(v => v.code.includes('MISSING')).length) / totalConfigs) * 100
      )
      this.results.summary.organization_isolation_compliance = Math.round(
        ((totalConfigs - errorViolations.filter(v => v.code.includes('ORG')).length) / totalConfigs) * 100
      )
      this.results.summary.actor_stamping_compliance = Math.round(
        ((totalConfigs - errorViolations.filter(v => v.code.includes('CREATED_BY') || v.code.includes('UPDATED_BY')).length) / totalConfigs) * 100
      )
      this.results.summary.app_definition_structure_compliance = Math.round(
        ((totalConfigs - errorViolations.filter(v => v.code.includes('APP_CONFIG_MISSING') || v.code.includes('ENTITY_MISSING') || v.code.includes('TXN_MISSING')).length) / totalConfigs) * 100
      )
    }
  }

  /**
   * Output validation results
   */
  outputResults() {
    console.log('\n📊 FINAL RESULTS:')
    console.log('==================')
    console.log(`Total Configurations: ${this.results.total_configs}`)
    console.log(`✅ Valid: ${this.results.valid_configs}`)
    console.log(`❌ Invalid: ${this.results.invalid_configs}`)
    console.log(`⚠️  Warnings: ${this.results.warnings}`)

    console.log('\n📈 COMPLIANCE RATES:')
    console.log('=====================')
    console.log(`Smart Code Compliance: ${this.results.summary.smart_code_compliance}%`)
    console.log(`Required Fields Compliance: ${this.results.summary.required_fields_compliance}%`)
    console.log(`Organization Isolation Compliance: ${this.results.summary.organization_isolation_compliance}%`)
    console.log(`Actor Stamping Compliance: ${this.results.summary.actor_stamping_compliance}%`)
    console.log(`App Definition Structure Compliance: ${this.results.summary.app_definition_structure_compliance}%`)

    // Show violations
    if (this.results.violations.length > 0) {
      console.log('\n🚨 VIOLATIONS:')
      console.log('===============')
      
      const errorViolations = this.results.violations.filter(v => v.severity === 'error')
      const warnViolations = this.results.violations.filter(v => v.severity === 'warn')

      if (errorViolations.length > 0) {
        console.log(`\n❌ ERRORS (${errorViolations.length}):`);
        errorViolations.forEach(violation => {
          console.log(`  ${violation.entity_code}: ${violation.code} - ${violation.message}`)
        })
      }

      if (warnViolations.length > 0) {
        console.log(`\n⚠️  WARNINGS (${warnViolations.length}):`);
        warnViolations.forEach(violation => {
          console.log(`  ${violation.entity_code}: ${violation.code} - ${violation.message}`)
        })
      }
    }

    // Show autofix suggestions
    if (this.results.autofix_suggestions.length > 0) {
      console.log('\n🔧 AUTOFIX SUGGESTIONS:')
      console.log('========================')
      
      const automaticFixes = this.results.autofix_suggestions.filter(s => s.fix_type === 'automatic')
      const manualFixes = this.results.autofix_suggestions.filter(s => s.fix_type === 'manual')

      if (automaticFixes.length > 0) {
        console.log(`\n🔧 AUTOMATIC FIXES (${automaticFixes.length}):`);
        automaticFixes.forEach(suggestion => {
          console.log(`  ${suggestion.entity_code}: ${suggestion.description}`)
        })
      }

      if (manualFixes.length > 0) {
        console.log(`\n✋ MANUAL FIXES REQUIRED (${manualFixes.length}):`);
        manualFixes.forEach(suggestion => {
          console.log(`  ${suggestion.entity_code}: ${suggestion.description}`)
        })
      }
    }

    // Save results to file
    this.saveResults()
  }

  /**
   * Save results to JSON file
   */
  saveResults() {
    const resultsDir = path.join(__dirname, 'guardrail-results')
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true })
    }

    const filename = `app-config-guardrail-results-${Date.now()}.json`
    const filepath = path.join(resultsDir, filename)

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2))
    console.log(`\n📄 Results saved: ${filename}`)

    // Also generate CI report
    const reportFilename = `app-config-guardrail-report-${Date.now()}.md`
    const reportFilepath = path.join(resultsDir, reportFilename)
    
    const ciReport = this.generateCIReport()
    fs.writeFileSync(reportFilepath, ciReport)
    console.log(`📄 CI Report saved: ${reportFilename}`)
  }

  /**
   * Generate CI-friendly markdown report
   */
  generateCIReport() {
    let report = '# HERA APP_CONFIG Guardrail Validation Report\n\n'
    report += `**Date**: ${new Date().toISOString()}\n`
    report += `**Validation Type**: APP_CONFIG Guardrails\n\n`

    // Summary
    report += '## Summary\n\n'
    report += `- **Total Configurations**: ${this.results.total_configs}\n`
    report += `- **Valid Configurations**: ${this.results.valid_configs} ✅\n`
    report += `- **Invalid Configurations**: ${this.results.invalid_configs} ❌\n`
    report += `- **Warnings**: ${this.results.warnings} ⚠️\n`
    report += `- **Overall Status**: ${this.results.invalid_configs === 0 ? 'PASSED ✅' : 'FAILED ❌'}\n\n`

    // Compliance rates
    report += '## Compliance Rates\n\n'
    report += `| Check | Compliance Rate |\n`
    report += `|-------|----------------|\n`
    report += `| Smart Code | ${this.results.summary.smart_code_compliance}% |\n`
    report += `| Required Fields | ${this.results.summary.required_fields_compliance}% |\n`
    report += `| Organization Isolation | ${this.results.summary.organization_isolation_compliance}% |\n`
    report += `| Actor Stamping | ${this.results.summary.actor_stamping_compliance}% |\n`
    report += `| App Definition Structure | ${this.results.summary.app_definition_structure_compliance}% |\n\n`

    // Violations
    if (this.results.violations.length > 0) {
      const errorViolations = this.results.violations.filter(v => v.severity === 'error')
      const warnViolations = this.results.violations.filter(v => v.severity === 'warn')

      if (errorViolations.length > 0) {
        report += `## Errors (${errorViolations.length})\n\n`
        errorViolations.forEach(violation => {
          report += `**${violation.entity_code}**: \`${violation.code}\`\n`
          report += `- ${violation.message}\n`
          if (violation.field) {
            report += `- Field: \`${violation.field}\`\n`
          }
          report += '\n'
        })
      }

      if (warnViolations.length > 0) {
        report += `## Warnings (${warnViolations.length})\n\n`
        warnViolations.forEach(violation => {
          report += `**${violation.entity_code}**: \`${violation.code}\`\n`
          report += `- ${violation.message}\n`
          if (violation.field) {
            report += `- Field: \`${violation.field}\`\n`
          }
          report += '\n'
        })
      }
    }

    // Autofix suggestions
    if (this.results.autofix_suggestions.length > 0) {
      report += `## Autofix Suggestions (${this.results.autofix_suggestions.length})\n\n`
      
      const automaticFixes = this.results.autofix_suggestions.filter(s => s.fix_type === 'automatic')
      const manualFixes = this.results.autofix_suggestions.filter(s => s.fix_type === 'manual')

      if (automaticFixes.length > 0) {
        report += `### Automatic Fixes (${automaticFixes.length})\n\n`
        automaticFixes.forEach(suggestion => {
          report += `**${suggestion.entity_code}**: ${suggestion.description}\n`
          report += `- Confidence: ${suggestion.confidence}\n\n`
        })
      }

      if (manualFixes.length > 0) {
        report += `### Manual Fixes Required (${manualFixes.length})\n\n`
        manualFixes.forEach(suggestion => {
          report += `**${suggestion.entity_code}**: ${suggestion.description}\n`
          report += `- Confidence: ${suggestion.confidence}\n\n`
        })
      }
    }

    return report
  }
}

// Main execution
async function main() {
  console.log('HERA APP_CONFIG Guardrail Validation')
  console.log('====================================')

  const validator = new AppConfigGuardrailValidator()
  const exitCode = await validator.validate()

  process.exit(exitCode)
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Validation failed:', error)
    process.exit(1)
  })
}

module.exports = { AppConfigGuardrailValidator }