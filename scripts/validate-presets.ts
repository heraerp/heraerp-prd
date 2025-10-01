import { entityPresets } from '../src/hooks/entityPresets'
import { z } from 'zod'

// Smart code: 5+ segments (including version), UPPERCASE (allowing some lowercase), version suffix .v[N] or .V[N] (N>=1)
// Allow 'v' or 'V' for version, and allow underscores in segments
const SMART_CODE = /^[A-Z0-9_]+(?:\.[A-Z0-9_]+){3,}\.[vV][1-9][0-9]*$/

const Relationship = z.object({
  type: z.string().min(1),
  smart_code: z.string().regex(SMART_CODE, 'Invalid relationship smart code'),
  cardinality: z.enum(['one','many'])
})

const DynamicField = z.object({
  name: z.string().min(1),
  type: z.enum(['text','number','boolean','date','json']),
  smart_code: z.string().regex(SMART_CODE, 'Invalid field smart code'),
  required: z.boolean().optional(),
  defaultValue: z.any().optional(),
  ui: z.any().optional() // UI metadata is optional
})

const Preset = z.object({
  entity_type: z.string().min(1),
  labels: z.object({
    singular: z.string(),
    plural: z.string()
  }).optional(),
  permissions: z.object({
    create: z.function(),
    edit: z.function(),
    delete: z.function(),
    view: z.function()
  }).optional(),
  dynamicFields: z.array(DynamicField),
  relationships: z.array(Relationship).optional()
})

function fail(msg: string) { 
  console.error(`❌ ${msg}`)
  process.exitCode = 1
}

function hasDupe<T>(arr: T[], key: (x: T) => string) {
  const set = new Set<string>()
  for (const it of arr) {
    const k = key(it)
    if (set.has(k)) return k
    set.add(k)
  }
  return null
}

let totalPresets = 0
let validPresets = 0

for (const [name, preset] of Object.entries(entityPresets)) {
  totalPresets++
  console.log(`\n🔍 Validating ${name}...`)
  
  const parsed = Preset.safeParse(preset)
  if (!parsed.success) {
    fail(`[${name}] Schema error:\n${JSON.stringify(parsed.error.format(), null, 2)}`)
    continue
  }
  
  const p = parsed.data
  
  // Validate entity-level smart code if present
  const entitySmartCode = (preset as any).smart_code || 
    `HERA.UNIVERSAL.${p.entity_type}.ENTITY.v1`
  
  if (!SMART_CODE.test(entitySmartCode)) {
    fail(`[${name}] Invalid entity smart code: ${entitySmartCode}`)
  }
  
  // Field name duplicates
  const dupeField = hasDupe(p.dynamicFields, f => f.name)
  if (dupeField) {
    fail(`[${name}] Duplicate dynamic field name: ${dupeField}`)
  }

  // Field smart code duplicates
  const dupeFieldSC = hasDupe(p.dynamicFields, f => f.smart_code)
  if (dupeFieldSC) {
    fail(`[${name}] Duplicate dynamic field smart_code: ${dupeFieldSC}`)
  }

  // Relationship type duplicates
  const rels = p.relationships ?? []
  const dupeRelType = hasDupe(rels, r => r.type)
  if (dupeRelType) {
    fail(`[${name}] Duplicate relationship type: ${dupeRelType}`)
  }

  // Relationship smart code duplicates
  const dupeRelSC = hasDupe(rels, r => r.smart_code)
  if (dupeRelSC) {
    fail(`[${name}] Duplicate relationship smart_code: ${dupeRelSC}`)
  }

  // Optional: cardinality sanity (example rule)
  for (const r of rels) {
    if (r.type.endsWith('_ID') && r.cardinality !== 'one') {
      fail(`[${name}] Relationship ${r.type} looks singular (_ID) but cardinality is '${r.cardinality}'`)
    }
  }
  
  // Check for required boolean fields without default values
  for (const field of p.dynamicFields) {
    if (field.type === 'boolean' && field.required && field.defaultValue === undefined) {
      console.warn(`⚠️  [${name}] Boolean field '${field.name}' is required but has no default value`)
    }
  }
  
  // Debug smart code validation
  console.log(`📝 Checking smart codes for ${name}:`)
  for (const field of p.dynamicFields) {
    const isValid = SMART_CODE.test(field.smart_code)
    if (!isValid) {
      console.log(`  ❌ Field '${field.name}': ${field.smart_code}`)
    }
  }
  for (const rel of rels) {
    const isValid = SMART_CODE.test(rel.smart_code)
    if (!isValid) {
      console.log(`  ❌ Relationship '${rel.type}': ${rel.smart_code}`)
    }
  }
  
  if (!process.exitCode || process.exitCode === 0) {
    validPresets++
    console.log(`✅ ${name} validated successfully`)
  }
}

console.log('\n' + '='.repeat(60))
console.log(`📊 Validation Summary: ${validPresets}/${totalPresets} presets valid`)

if (process.exitCode) {
  console.error('\n❌ Preset validation failed.')
  process.exit(process.exitCode)
} else {
  console.log('\n✅ All preset validations passed!')
}