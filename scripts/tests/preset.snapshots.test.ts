import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, it, expect } from 'vitest'
import { entityPresets } from '../../src/hooks/entityPresets'

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

describe('Preset snapshots', () => {
  for (const [key, preset] of Object.entries(entityPresets)) {
    it(`matches snapshot: ${key}`, () => {
      const path = join(process.cwd(), 'scripts', '__snapshots__', `${key}.snapshot.json`)
      
      let expected
      try {
        expected = JSON.parse(readFileSync(path, 'utf8'))
      } catch (error) {
        throw new Error(
          `Snapshot not found for ${key}. Run 'npm run presets:snapshot' to generate initial snapshots.`
        )
      }
      
      const actual = normalize(preset)
      expect(actual).toEqual(expected)
    })
  }
})