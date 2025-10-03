import { describe, it, expect } from 'vitest'
import { entityPresets } from '../../src/hooks/entityPresets'

describe('Entity Presets Validation', () => {
  it('should have valid entity types', () => {
    Object.entries(entityPresets).forEach(([key, preset]) => {
      expect(preset.entity_type).toHaveValidEntityType()
    })
  })

  it('should have valid smart codes', () => {
    Object.entries(entityPresets).forEach(([key, preset]) => {
      expect(preset.smart_code).toHaveValidSmartCode()
      
      // Check dynamic field smart codes
      preset.dynamicFields?.forEach(field => {
        expect(field.smart_code).toHaveValidSmartCode()
      })
      
      // Check relationship smart codes
      preset.relationships?.forEach(rel => {
        expect(rel.smart_code).toHaveValidSmartCode()
      })
    })
  })

  it('should have unique smart codes', () => {
    const smartCodes = new Set<string>()
    
    Object.entries(entityPresets).forEach(([key, preset]) => {
      // Entity level
      expect(smartCodes.has(preset.smart_code)).toBe(false)
      smartCodes.add(preset.smart_code)
      
      // Field level
      preset.dynamicFields?.forEach(field => {
        expect(smartCodes.has(field.smart_code)).toBe(false)
        smartCodes.add(field.smart_code)
      })
      
      // Relationship level
      preset.relationships?.forEach(rel => {
        expect(smartCodes.has(rel.smart_code)).toBe(false)
        smartCodes.add(rel.smart_code)
      })
    })
  })

  it('should have valid field names', () => {
    const fieldNamePattern = /^[a-z0-9_]{2,40}$/
    
    Object.entries(entityPresets).forEach(([key, preset]) => {
      preset.dynamicFields?.forEach(field => {
        expect(field.name).toMatch(fieldNamePattern)
      })
    })
  })

  it('should have valid field types', () => {
    const validTypes = ['text', 'number', 'boolean', 'date', 'json']
    
    Object.entries(entityPresets).forEach(([key, preset]) => {
      preset.dynamicFields?.forEach(field => {
        expect(validTypes).toContain(field.type)
      })
    })
  })

  it('should have valid relationship cardinality', () => {
    const validCardinality = ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_MANY']
    
    Object.entries(entityPresets).forEach(([key, preset]) => {
      preset.relationships?.forEach(rel => {
        expect(validCardinality).toContain(rel.cardinality)
      })
    })
  })

  it('should match snapshot', () => {
    // This will create/update snapshots for regression testing
    expect(entityPresets).toMatchSnapshot()
  })
})

// Individual preset tests
describe('Individual Preset Validation', () => {
  it('CUSTOMER preset should be valid', () => {
    const customer = entityPresets.customer
    expect(customer).toBeDefined()
    expect(customer.entity_type).toBe('CUSTOMER')
    expect(customer.dynamicFields).toBeInstanceOf(Array)
    expect(customer.dynamicFields.length).toBeGreaterThan(0)
  })

  it('ROLE preset should be valid', () => {
    const role = entityPresets.role
    expect(role).toBeDefined()
    expect(role.entity_type).toBe('ROLE')
    
    // Check for permissions field
    const permissionsField = role.dynamicFields?.find(f => f.name === 'permissions')
    expect(permissionsField).toBeDefined()
    expect(permissionsField?.type).toBe('json')
  })
})