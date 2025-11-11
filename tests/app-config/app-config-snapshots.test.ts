/**
 * HERA APP_CONFIG Snapshot Validation Tests
 * Smart Code: HERA.PLATFORM.CONFIG.SNAPSHOT.TEST.v2
 * 
 * Comprehensive snapshot testing for APP_CONFIG entities following
 * the established Salon Staff preset testing patterns.
 */

import { describe, test, expect, beforeAll } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { AppConfigGuardrails } from '@/lib/validation/app-config-guardrails'
import { SmartCodeValidationService } from '@/lib/validation/smart-code-validation-service'

// Configure test environment
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AppConfigSnapshot {
  entity_id: string
  entity_code: string
  entity_name: string
  smart_code: string
  organization_id: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  app_definition: any
  metadata: {
    snapshot_version: string
    generated_at: string
    validation_status: 'valid' | 'invalid' | 'unknown'
    guardrail_compliance: boolean
  }
}

interface UnifiedSnapshot {
  metadata: {
    generated_at: string
    total_configs: number
    snapshot_version: string
    platform_organization_id: string
  }
  configs: Record<string, AppConfigSnapshot>
}

// Custom vitest matchers for APP_CONFIG validation
expect.extend({
  toHaveValidSmartCode(received: string) {
    const validation = SmartCodeValidationService.validateSmartCode(received)
    return {
      pass: validation.isValid,
      message: () => validation.isValid 
        ? `Expected ${received} to be invalid Smart Code`
        : `Expected ${received} to be valid Smart Code: ${validation.errorMessage}`
    }
  },

  toHaveValidAppConfigStructure(received: any) {
    const requiredFields = ['app_id', 'name', 'version']
    const missingFields = requiredFields.filter(field => !received[field])
    
    return {
      pass: missingFields.length === 0,
      message: () => missingFields.length === 0
        ? `Expected app config to be invalid`
        : `App config missing required fields: ${missingFields.join(', ')}`
    }
  },

  toHaveValidEntityDefinitions(received: any[]) {
    if (!Array.isArray(received)) {
      return {
        pass: false,
        message: () => `Expected entities to be an array, got ${typeof received}`
      }
    }

    const invalidEntities = received.filter(entity => !entity.entity_type || !entity.display_name)
    
    return {
      pass: invalidEntities.length === 0,
      message: () => invalidEntities.length === 0
        ? `Expected entities to be invalid`
        : `Found ${invalidEntities.length} invalid entities missing entity_type or display_name`
    }
  },

  toBeGuardrailCompliant(received: AppConfigSnapshot) {
    const context = {
      entity_id: received.entity_id,
      organization_id: received.organization_id,
      entity_type: 'APP_CONFIG' as const,
      entity_code: received.entity_code,
      smart_code: received.smart_code,
      app_definition: received.app_definition,
      created_by: received.created_by,
      updated_by: received.updated_by
    }

    const result = AppConfigGuardrails.validateAppConfig(context)
    
    return {
      pass: result.isValid,
      message: () => result.isValid
        ? `Expected APP_CONFIG to be non-compliant`
        : `APP_CONFIG failed guardrail validation: ${result.violations.map(v => v.message).join(', ')}`
    }
  }
})

// Declare custom matchers for TypeScript
declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveValidSmartCode(): T
    toHaveValidAppConfigStructure(): T
    toHaveValidEntityDefinitions(): T
    toBeGuardrailCompliant(): T
  }
}

describe('APP_CONFIG Snapshot Tests', () => {
  let unifiedSnapshot: UnifiedSnapshot | null = null
  let snapshotsDir: string
  let unifiedSnapshotPath: string

  beforeAll(() => {
    snapshotsDir = join(process.cwd(), 'snapshots')
    unifiedSnapshotPath = join(snapshotsDir, 'app-configs.json')
  })

  describe('Snapshot File Existence', () => {
    test('should have snapshots directory', () => {
      expect(existsSync(snapshotsDir)).toBe(true)
    })

    test('should have unified snapshot file', () => {
      expect(existsSync(unifiedSnapshotPath)).toBe(true)
    })

    test('should load unified snapshot successfully', () => {
      if (existsSync(unifiedSnapshotPath)) {
        const content = readFileSync(unifiedSnapshotPath, 'utf-8')
        unifiedSnapshot = JSON.parse(content)
        expect(unifiedSnapshot).toBeDefined()
        expect(unifiedSnapshot?.metadata).toBeDefined()
        expect(unifiedSnapshot?.configs).toBeDefined()
      }
    })
  })

  describe('Snapshot Structure Validation', () => {
    test('should have valid metadata structure', () => {
      if (!unifiedSnapshot) return

      expect(unifiedSnapshot.metadata).toHaveProperty('generated_at')
      expect(unifiedSnapshot.metadata).toHaveProperty('total_configs')
      expect(unifiedSnapshot.metadata).toHaveProperty('snapshot_version')
      expect(unifiedSnapshot.metadata).toHaveProperty('platform_organization_id')
      
      expect(unifiedSnapshot.metadata.snapshot_version).toBe('2.0')
      expect(unifiedSnapshot.metadata.platform_organization_id).toBe('00000000-0000-0000-0000-000000000000')
      expect(typeof unifiedSnapshot.metadata.total_configs).toBe('number')
    })

    test('should have consistent config count', () => {
      if (!unifiedSnapshot) return

      const actualConfigCount = Object.keys(unifiedSnapshot.configs).length
      expect(actualConfigCount).toBe(unifiedSnapshot.metadata.total_configs)
    })

    test('should have valid config keys', () => {
      if (!unifiedSnapshot) return

      Object.keys(unifiedSnapshot.configs).forEach(configKey => {
        // Config keys should match entity_code pattern
        expect(configKey).toMatch(/^[a-z0-9-]+$/)
        
        // Config should have matching entity_code
        const config = unifiedSnapshot.configs[configKey]
        expect(config.entity_code).toBe(configKey)
      })
    })
  })

  describe('Individual Config Validation', () => {
    test('should have valid Smart Codes for all configs', () => {
      if (!unifiedSnapshot) return

      Object.values(unifiedSnapshot.configs).forEach(config => {
        expect(config.smart_code).toHaveValidSmartCode()
      })
    })

    test('should have required entity fields for all configs', () => {
      if (!unifiedSnapshot) return

      Object.values(unifiedSnapshot.configs).forEach(config => {
        expect(config).toHaveProperty('entity_id')
        expect(config).toHaveProperty('entity_code')
        expect(config).toHaveProperty('entity_name')
        expect(config).toHaveProperty('smart_code')
        expect(config).toHaveProperty('organization_id')
        expect(config).toHaveProperty('created_by')
        expect(config).toHaveProperty('updated_by')
        
        expect(config.entity_id).toBeTruthy()
        expect(config.entity_code).toBeTruthy()
        expect(config.entity_name).toBeTruthy()
        expect(config.smart_code).toBeTruthy()
        expect(config.organization_id).toBeTruthy()
      })
    })

    test('should have valid timestamps for all configs', () => {
      if (!unifiedSnapshot) return

      Object.values(unifiedSnapshot.configs).forEach(config => {
        expect(config).toHaveProperty('created_at')
        expect(config).toHaveProperty('updated_at')
        
        // Should be valid ISO dates
        expect(() => new Date(config.created_at)).not.toThrow()
        expect(() => new Date(config.updated_at)).not.toThrow()
        
        // updated_at should be >= created_at
        const createdDate = new Date(config.created_at)
        const updatedDate = new Date(config.updated_at)
        expect(updatedDate.getTime()).toBeGreaterThanOrEqual(createdDate.getTime())
      })
    })

    test('should have valid organization IDs for all configs', () => {
      if (!unifiedSnapshot) return

      const validOrgIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      Object.values(unifiedSnapshot.configs).forEach(config => {
        expect(config.organization_id).toMatch(validOrgIdPattern)
      })
    })

    test('should have valid metadata for all configs', () => {
      if (!unifiedSnapshot) return

      Object.values(unifiedSnapshot.configs).forEach(config => {
        expect(config).toHaveProperty('metadata')
        expect(config.metadata).toHaveProperty('snapshot_version')
        expect(config.metadata).toHaveProperty('generated_at')
        expect(config.metadata).toHaveProperty('validation_status')
        expect(config.metadata).toHaveProperty('guardrail_compliance')
        
        expect(config.metadata.snapshot_version).toBe('2.0')
        expect(['valid', 'invalid', 'unknown']).toContain(config.metadata.validation_status)
        expect(typeof config.metadata.guardrail_compliance).toBe('boolean')
      })
    })
  })

  describe('App Definition Structure Validation', () => {
    test('should have valid app definitions where present', () => {
      if (!unifiedSnapshot) return

      Object.values(unifiedSnapshot.configs).forEach(config => {
        if (config.app_definition) {
          expect(config.app_definition).toHaveValidAppConfigStructure()
        }
      })
    })

    test('should have valid entity definitions where present', () => {
      if (!unifiedSnapshot) return

      Object.values(unifiedSnapshot.configs).forEach(config => {
        if (config.app_definition?.entities) {
          expect(config.app_definition.entities).toHaveValidEntityDefinitions()
        }
      })
    })

    test('should have valid transaction definitions where present', () => {
      if (!unifiedSnapshot) return

      Object.values(unifiedSnapshot.configs).forEach(config => {
        if (config.app_definition?.transactions) {
          expect(Array.isArray(config.app_definition.transactions)).toBe(true)
          
          config.app_definition.transactions.forEach((transaction: any) => {
            expect(transaction).toHaveProperty('transaction_type')
            expect(transaction).toHaveProperty('display_name')
            expect(transaction.transaction_type).toBeTruthy()
            expect(transaction.display_name).toBeTruthy()
          })
        }
      })
    })

    test('should have valid navigation structure where present', () => {
      if (!unifiedSnapshot) return

      Object.values(unifiedSnapshot.configs).forEach(config => {
        if (config.app_definition?.navigation) {
          const nav = config.app_definition.navigation
          
          if (nav.main_menu) {
            expect(Array.isArray(nav.main_menu)).toBe(true)
            
            nav.main_menu.forEach((menuItem: any) => {
              expect(menuItem).toHaveProperty('id')
              expect(menuItem).toHaveProperty('label')
              expect(menuItem).toHaveProperty('path')
              expect(menuItem.id).toBeTruthy()
              expect(menuItem.label).toBeTruthy()
              expect(menuItem.path).toBeTruthy()
            })
          }
        }
      })
    })
  })

  describe('Guardrail Compliance Validation', () => {
    test('should pass guardrail validation for compliant configs', () => {
      if (!unifiedSnapshot) return

      const compliantConfigs = Object.values(unifiedSnapshot.configs)
        .filter(config => config.metadata.guardrail_compliance)

      compliantConfigs.forEach(config => {
        expect(config).toBeGuardrailCompliant()
      })
    })

    test('should have Smart Codes with PLATFORM domain for APP_CONFIG', () => {
      if (!unifiedSnapshot) return

      Object.values(unifiedSnapshot.configs).forEach(config => {
        if (config.app_definition) { // APP_CONFIG entities have app_definition
          expect(config.smart_code).toContain('.PLATFORM.')
        }
      })
    })

    test('should have proper actor stamping', () => {
      if (!unifiedSnapshot) return

      Object.values(unifiedSnapshot.configs).forEach(config => {
        expect(config.created_by).toBeTruthy()
        expect(config.updated_by).toBeTruthy()
        
        // Should be valid UUIDs
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        expect(config.created_by).toMatch(uuidPattern)
        expect(config.updated_by).toMatch(uuidPattern)
      })
    })
  })

  describe('Individual Snapshot Files', () => {
    test('should have individual snapshot files for each config', () => {
      if (!unifiedSnapshot) return

      const individualSnapshotsDir = join(snapshotsDir, 'app-configs')
      expect(existsSync(individualSnapshotsDir)).toBe(true)

      Object.keys(unifiedSnapshot.configs).forEach(configKey => {
        const individualSnapshotPath = join(individualSnapshotsDir, `${configKey}.json`)
        expect(existsSync(individualSnapshotPath)).toBe(true)
      })
    })

    test('should have matching content between unified and individual snapshots', () => {
      if (!unifiedSnapshot) return

      const individualSnapshotsDir = join(snapshotsDir, 'app-configs')
      if (!existsSync(individualSnapshotsDir)) return

      Object.entries(unifiedSnapshot.configs).forEach(([configKey, expectedConfig]) => {
        const individualSnapshotPath = join(individualSnapshotsDir, `${configKey}.json`)
        
        if (existsSync(individualSnapshotPath)) {
          const individualContent = readFileSync(individualSnapshotPath, 'utf-8')
          const individualSnapshot = JSON.parse(individualContent)
          
          // Content should match (excluding timestamp differences)
          expect(individualSnapshot.entity_code).toBe(expectedConfig.entity_code)
          expect(individualSnapshot.smart_code).toBe(expectedConfig.smart_code)
          expect(individualSnapshot.organization_id).toBe(expectedConfig.organization_id)
        }
      })
    })
  })

  describe('Regression Testing', () => {
    test('should match expected snapshot structure', () => {
      if (!unifiedSnapshot) return

      // This test will create a vitest snapshot for regression testing
      // The snapshot will capture the current state and detect future changes
      expect(unifiedSnapshot).toMatchSnapshot('app-configs-unified.json')
    })

    test('should have consistent config ordering', () => {
      if (!unifiedSnapshot) return

      const configKeys = Object.keys(unifiedSnapshot.configs)
      const sortedKeys = [...configKeys].sort()
      
      // Config keys should already be sorted
      expect(configKeys).toEqual(sortedKeys)
    })

    test('should have deterministic field ordering', () => {
      if (!unifiedSnapshot) return

      Object.values(unifiedSnapshot.configs).forEach(config => {
        const configKeys = Object.keys(config)
        const sortedKeys = [...configKeys].sort()
        
        // Object keys should be sorted for deterministic snapshots
        expect(configKeys).toEqual(sortedKeys)
      })
    })
  })

  describe('Summary Report Validation', () => {
    test('should have summary report file', () => {
      const reportPath = join(snapshotsDir, 'app-configs-report.md')
      expect(existsSync(reportPath)).toBe(true)
    })

    test('should have valid markdown report content', () => {
      const reportPath = join(snapshotsDir, 'app-configs-report.md')
      
      if (existsSync(reportPath)) {
        const reportContent = readFileSync(reportPath, 'utf-8')
        
        expect(reportContent).toContain('# HERA APP_CONFIG Snapshot Report')
        expect(reportContent).toContain('## Configuration Types')
        expect(reportContent).toContain('## Organization Distribution')
        expect(reportContent).toContain('## Guardrail Compliance')
        expect(reportContent).toContain('## Individual Snapshots')
      }
    })
  })
})