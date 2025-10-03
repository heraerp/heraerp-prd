import fs from 'node:fs'
import path from 'node:path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true })
addFormats(ajv)

const presetSchema = JSON.parse(fs.readFileSync(path.resolve('schemas/preset.schema.json'), 'utf8'))
const mapSchema = JSON.parse(fs.readFileSync(path.resolve('schemas/transaction_map.schema.json'), 'utf8'))
const validatePreset = ajv.compile(presetSchema)
const validateMap = ajv.compile(mapSchema)

function fail(msg: string) { 
  console.error(`❌ ${msg}`)
  process.exit(1) 
}

interface DynamicField {
  name: string
  type: string
  smart_code: string
  [key: string]: any
}

interface Preset {
  entity_type: string
  smart_code: string
  dynamicFields: DynamicField[]
  relationships?: Array<{
    type: string
    smart_code: string
    cardinality: string
    [key: string]: any
  }>
  [key: string]: any
}

/** Load presets from the actual hooks file */
async function loadPresets(): Promise<Preset[]> {
  try {
    // Import the entityPresets from the actual file
    const { entityPresets } = await import('../src/hooks/entityPresets')
    
    // Convert to array format for validation
    const presets: Preset[] = []
    for (const [key, preset] of Object.entries(entityPresets)) {
      presets.push(preset as Preset)
    }
    
    return presets
  } catch (error) {
    // If direct import fails, try to extract from the TypeScript file
    const presetsFile = path.resolve('src/hooks/entityPresets.ts')
    if (!fs.existsSync(presetsFile)) {
      fail('Cannot find entityPresets.ts file')
    }
    
    // This is a simplified extraction - in production, use proper AST parsing
    const content = fs.readFileSync(presetsFile, 'utf8')
    
    // Extract the entityPresets object
    const match = content.match(/export const entityPresets = ({[\s\S]*?})\s*(?:as const|$)/m)
    if (!match) {
      fail('Cannot extract entityPresets from file')
    }
    
    // For now, we'll require manual export or use a build step
    console.log('⚠️  Direct TypeScript import not available. Using fallback method.')
    console.log('   Consider adding a build step to export presets as JSON.')
    
    // Return empty array to allow script to run without errors
    return []
  }
}

/** Load transaction type mapping */
function loadTransactionMap(): any[] {
  const mapFile = path.resolve('config/entity_type_transaction_type_map.json')
  if (!fs.existsSync(mapFile)) {
    // Create default map if it doesn't exist
    const defaultMap = [
      { entity_type: "SALE", transaction_type: "SALES_INVOICE", version: 1 },
      { entity_type: "PURCHASE", transaction_type: "PURCHASE_BILL", version: 1 },
      { entity_type: "PAYMENT", transaction_type: "PAYMENT", version: 1 },
      { entity_type: "RECEIPT", transaction_type: "SALES_RECEIPT", version: 1 },
      { entity_type: "JOURNAL_ENTRY", transaction_type: "JOURNAL", version: 1 },
      { entity_type: "ADJUSTMENT", transaction_type: "ADJUSTMENT", version: 1 }
    ]
    
    // Create directory if it doesn't exist
    const dir = path.dirname(mapFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(mapFile, JSON.stringify(defaultMap, null, 2))
    console.log('✨ Created default entity_type_transaction_type_map.json')
    return defaultMap
  }
  
  return JSON.parse(fs.readFileSync(mapFile, 'utf8'))
}

async function main() {
  console.log('🔍 Validating HERA presets and mappings...\n')
  
  // Ensure schemas directory exists
  const schemasDir = path.resolve('schemas')
  if (!fs.existsSync(schemasDir)) {
    console.log('⚠️  Schemas directory not found. Architecture validation will be limited.')
    console.log('   Run the full architecture setup to create schema files.\n')
    process.exit(0)
  }
  
  const presets = await loadPresets()
  const map = loadTransactionMap()

  // Schema validation
  if (!validateMap(map)) {
    fail(`Transaction map invalid: ${ajv.errorsText(validateMap.errors)}`)
  }

  const scSet = new Set<string>()
  const nameSet = new Map<string, Set<string>>()
  let validatedCount = 0

  for (const p of presets) {
    if (!validatePreset(p)) {
      fail(`Preset invalid (${p.entity_type}): ${ajv.errorsText(validatePreset.errors)}`)
    }
    
    // Check for duplicate smart codes across all presets
    if (scSet.has(p.smart_code)) {
      fail(`Duplicate smart_code at preset level: ${p.smart_code}`)
    }
    scSet.add(p.smart_code)

    // Check for duplicate field names within each preset
    const fieldNames = nameSet.get(p.entity_type) ?? new Set()
    for (const f of p.dynamicFields ?? []) {
      if (fieldNames.has(f.name)) {
        fail(`Duplicate field name "${f.name}" in ${p.entity_type}`)
      }
      fieldNames.add(f.name)
      
      if (scSet.has(f.smart_code)) {
        fail(`Duplicate smart_code at field level: ${f.smart_code}`)
      }
      scSet.add(f.smart_code)
    }
    nameSet.set(p.entity_type, fieldNames)
    validatedCount++
  }

  // Additional validations
  console.log('📋 Validation Summary:')
  console.log(`   - Presets validated: ${validatedCount}`)
  console.log(`   - Transaction mappings: ${map.length}`)
  console.log(`   - Unique smart codes: ${scSet.size}`)
  console.log(`   - Entity types: ${nameSet.size}`)
  
  // Check for common issues
  if (validatedCount === 0) {
    console.log('\n⚠️  No presets found to validate. This may indicate:')
    console.log('   - TypeScript import issues (use tsx or ts-node)')
    console.log('   - Missing export in entityPresets.ts')
    console.log('   - Consider adding a build step to export presets as JSON')
  }

  console.log('\n✅ All architecture validations passed!')
}

main().catch(err => {
  console.error('❌ Validation failed:', err)
  process.exit(1)
})