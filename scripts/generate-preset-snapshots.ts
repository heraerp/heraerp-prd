import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { entityPresets } from '../src/hooks/entityPresets'

const outDir = join(process.cwd(), 'scripts', '__snapshots__')
mkdirSync(outDir, { recursive: true })

function normalize(obj: any): any {
  // Handle functions by converting to string representation
  if (typeof obj === 'function') {
    return `[Function: ${obj.name || 'anonymous'}]`
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj
      .map(normalize)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  }
  
  // Handle objects
  if (obj && typeof obj === 'object') {
    const o: any = {}
    Object.keys(obj).sort().forEach(k => {
      o[k] = normalize(obj[k])
    })
    return o
  }
  
  return obj
}

console.log('📸 Generating preset snapshots...\n')

let count = 0
for (const [key, preset] of Object.entries(entityPresets)) {
  try {
    const normalized = normalize(preset)
    const file = join(outDir, `${key}.snapshot.json`)
    writeFileSync(file, JSON.stringify(normalized, null, 2) + '\n')
    console.log(`✅ ${key} → ${file}`)
    count++
  } catch (error) {
    console.error(`❌ Failed to snapshot ${key}:`, error)
    process.exitCode = 1
  }
}

console.log(`\n📝 Generated ${count} snapshots in ${outDir}`)