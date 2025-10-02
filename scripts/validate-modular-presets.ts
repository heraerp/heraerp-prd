#!/usr/bin/env ts-node
/**
 * Validate modular entity presets from packages
 */

import { join } from 'path'
import { existsSync } from 'fs'

// Import types and validators from core package
async function validateModularPresets() {
  const errors: string[] = []
  const warnings: string[] = []
  let checkedCount = 0

  try {
    // Dynamically import after packages are built
    const corePath = join(process.cwd(), 'packages/hera-entities-core/dist/index.js')
    const modulesPath = join(process.cwd(), 'packages/hera-entities-modules/dist/index.js')

    if (!existsSync(corePath)) {
      errors.push('Core package not built. Run npm run packages:build first.')
      return { errors, warnings, checkedCount }
    }

    const core = await import(corePath)
    const modules = existsSync(modulesPath) ? await import(modulesPath) : null

    // Validate core presets
    const corePresets = ['PRODUCT_PRESET', 'CATEGORY_PRESET']
    for (const presetName of corePresets) {
      if (core[presetName]) {
        checkedCount++
        validatePreset(core[presetName], `core/${presetName}`, errors, warnings)
      }
    }

    // Validate module presets
    if (modules) {
      // Check salon module
      if (modules.salon) {
        const salonPresets = ['SALON_PRODUCT', 'SALON_CATEGORY']
        for (const presetName of salonPresets) {
          if (modules.salon[presetName]) {
            checkedCount++
            validatePreset(modules.salon[presetName], `salon/${presetName}`, errors, warnings)
          }
        }
      }

      // Check jewelry module
      if (modules.jewelry) {
        const jewelryPresets = ['JEWELRY_PRODUCT']
        for (const presetName of jewelryPresets) {
          if (modules.jewelry[presetName]) {
            checkedCount++
            validatePreset(modules.jewelry[presetName], `jewelry/${presetName}`, errors, warnings)
          }
        }
      }
    }
  } catch (error) {
    errors.push(`Failed to import packages: ${error}`)
  }

  return { errors, warnings, checkedCount }
}

function validatePreset(preset: any, name: string, errors: string[], warnings: string[]) {
  // Basic structure validation
  if (!preset.entity_type) {
    errors.push(`${name}: missing entity_type`)
  }
  
  if (!preset.smart_code) {
    errors.push(`${name}: missing smart_code`)
  }
  
  if (!preset.version) {
    warnings.push(`${name}: missing version`)
  }
  
  if (!Array.isArray(preset.dynamicFields)) {
    errors.push(`${name}: dynamicFields must be an array`)
    return
  }

  // Validate each field
  const fieldNames = new Set<string>()
  const fieldSmartCodes = new Set<string>()
  
  for (const field of preset.dynamicFields) {
    if (!field.name) {
      errors.push(`${name}: field missing name`)
      continue
    }
    
    if (fieldNames.has(field.name)) {
      errors.push(`${name}: duplicate field name '${field.name}'`)
    }
    fieldNames.add(field.name)
    
    if (!field.smart_code) {
      errors.push(`${name}: field '${field.name}' missing smart_code`)
      continue
    }
    
    if (fieldSmartCodes.has(field.smart_code)) {
      errors.push(`${name}: duplicate smart_code '${field.smart_code}'`)
    }
    fieldSmartCodes.add(field.smart_code)
    
    if (!field.type) {
      errors.push(`${name}: field '${field.name}' missing type`)
    }
  }

  // Validate relationships if present
  if (preset.relationships && Array.isArray(preset.relationships)) {
    const relTypes = new Set<string>()
    const relSmartCodes = new Set<string>()
    
    for (const rel of preset.relationships) {
      if (!rel.type) {
        errors.push(`${name}: relationship missing type`)
        continue
      }
      
      if (relTypes.has(rel.type)) {
        errors.push(`${name}: duplicate relationship type '${rel.type}'`)
      }
      relTypes.add(rel.type)
      
      if (!rel.smart_code) {
        errors.push(`${name}: relationship '${rel.type}' missing smart_code`)
        continue
      }
      
      if (relSmartCodes.has(rel.smart_code)) {
        errors.push(`${name}: duplicate relationship smart_code '${rel.smart_code}'`)
      }
      relSmartCodes.add(rel.smart_code)
      
      if (!rel.cardinality || !['one', 'many'].includes(rel.cardinality)) {
        errors.push(`${name}: relationship '${rel.type}' has invalid cardinality`)
      }
    }
  }
}

// Run validation
async function main() {
  console.log('🔍 Validating modular entity presets...\n')
  
  const { errors, warnings, checkedCount } = await validateModularPresets()
  
  // Show warnings
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:')
    warnings.forEach(w => console.log(`   ${w}`))
    console.log('')
  }
  
  // Show errors
  if (errors.length > 0) {
    console.log('❌ Errors:')
    errors.forEach(e => console.log(`   ${e}`))
    console.log('')
    console.log(`\n❌ Validation failed with ${errors.length} errors`)
    process.exit(1)
  }
  
  console.log(`\n✅ All ${checkedCount} modular presets validated successfully!`)
}

main().catch(console.error)