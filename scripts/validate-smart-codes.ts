/**
 * Smart Code Validation Script
 *
 * Validates all smart codes in entityPresets.ts against HERA DNA pattern
 * Reports any violations and suggests corrections
 */

import { validateSmartCode, SmartCodeBuilder } from '../src/lib/dna/smart-code-generator'
import { entityPresets } from '../src/hooks/entityPresets'

interface ValidationResult {
  location: string
  smartCode: string
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestion?: string
}

function validateAllSmartCodes() {
  const results: ValidationResult[] = []

  // Validate all entity presets
  for (const [entityType, preset] of Object.entries(entityPresets)) {
    // Validate dynamic field smart codes
    if (preset.dynamicFields) {
      for (const field of preset.dynamicFields) {
        const validation = validateSmartCode(field.smart_code)

        if (!validation.valid || validation.warnings.length > 0) {
          // Generate suggestion by parsing the smart code
          const parts = field.smart_code.split('.')
          let suggestion: string | undefined

          if (parts.length >= 4) {
            const industry = parts[1]
            const module = parts[2]
            const type = 'DYN' // Dynamic field
            const subtype = parts.slice(3, -1).join('_').toUpperCase() // Combine remaining parts before version

            suggestion = SmartCodeBuilder.dynamic(industry, module, subtype)
          }

          results.push({
            location: `${entityType}.dynamicFields.${field.name}`,
            smartCode: field.smart_code,
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
            suggestion
          })
        }
      }
    }

    // Validate relationship smart codes
    if (preset.relationships) {
      for (const rel of preset.relationships) {
        const validation = validateSmartCode(rel.smart_code)

        if (!validation.valid || validation.warnings.length > 0) {
          // Generate suggestion
          const parts = rel.smart_code.split('.')
          let suggestion: string | undefined

          if (parts.length >= 4) {
            const industry = parts[1]
            const module = parts[2]
            const type = 'REL' // Relationship
            const subtype = parts.slice(3, -1).join('_').toUpperCase()

            suggestion = SmartCodeBuilder.relationship(industry, module, subtype)
          }

          results.push({
            location: `${entityType}.relationships.${rel.type}`,
            smartCode: rel.smart_code,
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
            suggestion
          })
        }
      }
    }

    // Validate preset smart_code if present
    if ('smart_code' in preset) {
      const validation = validateSmartCode(preset.smart_code as string)

      if (!validation.valid || validation.warnings.length > 0) {
        results.push({
          location: `${entityType}.smart_code`,
          smartCode: preset.smart_code as string,
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings
        })
      }
    }
  }

  return results
}

// Run validation
const results = validateAllSmartCodes()

console.log('🔍 Smart Code Validation Results\n')
console.log('=' .repeat(80))

if (results.length === 0) {
  console.log('✅ All smart codes are valid!')
} else {
  console.log(`❌ Found ${results.length} smart codes with issues:\n`)

  // Group by validity
  const invalid = results.filter(r => !r.valid)
  const warnings = results.filter(r => r.valid && r.warnings.length > 0)

  if (invalid.length > 0) {
    console.log(`\n🚨 INVALID SMART CODES (${invalid.length}):`)
    console.log('=' .repeat(80))

    for (const result of invalid) {
      console.log(`\n📍 Location: ${result.location}`)
      console.log(`   Current:   ${result.smartCode}`)
      if (result.suggestion) {
        console.log(`   Suggested: ${result.suggestion}`)
      }
      console.log(`   Errors:`)
      result.errors.forEach(e => console.log(`     - ${e}`))
      if (result.warnings.length > 0) {
        console.log(`   Warnings:`)
        result.warnings.forEach(w => console.log(`     - ${w}`))
      }
    }
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`)
    console.log('=' .repeat(80))

    for (const result of warnings) {
      console.log(`\n📍 Location: ${result.location}`)
      console.log(`   Current:   ${result.smartCode}`)
      if (result.suggestion) {
        console.log(`   Suggested: ${result.suggestion}`)
      }
      console.log(`   Warnings:`)
      result.warnings.forEach(w => console.log(`     - ${w}`))
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\n📊 Summary:`)
  console.log(`   Total Issues: ${results.length}`)
  console.log(`   Invalid:      ${invalid.length}`)
  console.log(`   Warnings:     ${warnings.length}`)
}

console.log('\n' + '='.repeat(80))

// Exit with error code if invalid smart codes found
if (results.some(r => !r.valid)) {
  process.exit(1)
}
