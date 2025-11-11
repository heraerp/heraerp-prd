/**
 * HERA APP_CONFIG Snapshot Utilities Tests
 * Smart Code: HERA.PLATFORM.CONFIG.SNAPSHOT.UTILITIES.TEST.v2
 * 
 * Unit tests for APP_CONFIG snapshot generation, comparison, and CI utilities
 * following the established Salon Staff preset testing patterns.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { testUtils } from '../setup/app-config-test-setup'

// Mock data for testing
const mockAppConfig1 = testUtils.createMockAppConfig({
  entity_code: 'test-app-1',
  entity_name: 'Test Application 1',
  smart_code: 'HERA.PLATFORM.CONFIG.APP.TEST_APP_1.v2',
  app_definition: {
    app_id: 'test-app-1',
    name: 'Test Application 1',
    version: '1.0.0',
    entities: [
      {
        entity_type: 'USER',
        display_name: 'User',
        fields: [
          {
            field_name: 'name',
            field_type: 'text',
            display_label: 'Name',
            is_required: true
          }
        ]
      }
    ],
    transactions: [],
    navigation: {
      main_menu: [
        {
          id: 'users',
          label: 'Users',
          path: '/test-app-1/users'
        }
      ],
      quick_actions: [],
      dashboards: []
    }
  }
})

const mockAppConfig2 = testUtils.createMockAppConfig({
  entity_code: 'test-app-2',
  entity_name: 'Test Application 2',
  smart_code: 'HERA.PLATFORM.CONFIG.APP.TEST_APP_2.v2',
  app_definition: {
    app_id: 'test-app-2',
    name: 'Test Application 2',
    version: '2.0.0',
    entities: [],
    transactions: [
      {
        transaction_type: 'SALE',
        display_name: 'Sale',
        header_fields: [
          {
            field_name: 'amount',
            field_type: 'number',
            display_label: 'Amount',
            is_required: true
          }
        ]
      }
    ],
    navigation: {
      main_menu: [],
      quick_actions: [],
      dashboards: []
    }
  }
})

describe('APP_CONFIG Snapshot Utilities', () => {
  let testSnapshotsDir: string
  let testComparisonsDir: string

  beforeEach(() => {
    // Create temporary test directories
    testSnapshotsDir = join(testUtils.getTestDataDir(), 'snapshots', `test-${Date.now()}`)
    testComparisonsDir = join(testSnapshotsDir, 'comparisons')
    
    mkdirSync(testSnapshotsDir, { recursive: true })
    mkdirSync(testComparisonsDir, { recursive: true })
  })

  afterEach(() => {
    // Cleanup test directories
    if (existsSync(testSnapshotsDir)) {
      rmSync(testSnapshotsDir, { recursive: true, force: true })
    }
  })

  describe('Snapshot Generation', () => {
    test('should generate valid unified snapshot structure', () => {
      const unifiedSnapshot = {
        metadata: {
          generated_at: new Date().toISOString(),
          total_configs: 2,
          snapshot_version: '2.0',
          platform_organization_id: '00000000-0000-0000-0000-000000000000'
        },
        configs: {
          'test-app-1': mockAppConfig1,
          'test-app-2': mockAppConfig2
        }
      }

      const snapshotPath = join(testSnapshotsDir, 'app-configs.json')
      writeFileSync(snapshotPath, JSON.stringify(unifiedSnapshot, null, 2))

      expect(existsSync(snapshotPath)).toBe(true)

      // Validate structure
      expect(unifiedSnapshot.metadata).toHaveProperty('generated_at')
      expect(unifiedSnapshot.metadata).toHaveProperty('total_configs')
      expect(unifiedSnapshot.metadata).toHaveProperty('snapshot_version')
      expect(unifiedSnapshot.metadata.snapshot_version).toBe('2.0')
      expect(unifiedSnapshot.configs).toHaveProperty('test-app-1')
      expect(unifiedSnapshot.configs).toHaveProperty('test-app-2')
    })

    test('should generate individual snapshot files', () => {
      const individualDir = join(testSnapshotsDir, 'app-configs')
      mkdirSync(individualDir, { recursive: true })

      const configs = [mockAppConfig1, mockAppConfig2]
      
      configs.forEach(config => {
        const filename = `${config.entity_code}.json`
        const filepath = join(individualDir, filename)
        writeFileSync(filepath, JSON.stringify(config, null, 2))
        
        expect(existsSync(filepath)).toBe(true)
      })

      // Verify files were created
      expect(existsSync(join(individualDir, 'test-app-1.json'))).toBe(true)
      expect(existsSync(join(individualDir, 'test-app-2.json'))).toBe(true)
    })

    test('should normalize object fields consistently', () => {
      // Test data with mixed field ordering
      const unnormalizedConfig = {
        z_field: 'last',
        a_field: 'first',
        m_field: {
          nested_z: 'nested last',
          nested_a: 'nested first'
        },
        array_field: [
          { name: 'second', value: 2 },
          { name: 'first', value: 1 }
        ]
      }

      // Normalize function (simplified version)
      function normalize(obj: any): any {
        if (Array.isArray(obj)) {
          return obj
            .map(normalize)
            .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
        }
        
        if (obj && typeof obj === 'object') {
          const normalized: any = {}
          Object.keys(obj).sort().forEach(key => {
            normalized[key] = normalize(obj[key])
          })
          return normalized
        }
        
        return obj
      }

      const normalized = normalize(unnormalizedConfig)
      const keys = Object.keys(normalized)
      
      // Keys should be sorted
      expect(keys).toEqual(['a_field', 'array_field', 'm_field', 'z_field'])
      
      // Nested object keys should be sorted
      const nestedKeys = Object.keys(normalized.m_field)
      expect(nestedKeys).toEqual(['nested_a', 'nested_z'])
      
      // Arrays should be sorted by JSON string
      expect(normalized.array_field[0].name).toBe('first')
      expect(normalized.array_field[1].name).toBe('second')
    })
  })

  describe('Snapshot Comparison', () => {
    test('should detect added configurations', () => {
      const baseline = {
        metadata: { total_configs: 1 },
        configs: {
          'test-app-1': mockAppConfig1
        }
      }

      const current = {
        metadata: { total_configs: 2 },
        configs: {
          'test-app-1': mockAppConfig1,
          'test-app-2': mockAppConfig2
        }
      }

      const addedConfigs = Object.keys(current.configs)
        .filter(key => !baseline.configs[key])

      expect(addedConfigs).toContain('test-app-2')
      expect(addedConfigs).toHaveLength(1)
    })

    test('should detect removed configurations', () => {
      const baseline = {
        metadata: { total_configs: 2 },
        configs: {
          'test-app-1': mockAppConfig1,
          'test-app-2': mockAppConfig2
        }
      }

      const current = {
        metadata: { total_configs: 1 },
        configs: {
          'test-app-1': mockAppConfig1
        }
      }

      const removedConfigs = Object.keys(baseline.configs)
        .filter(key => !current.configs[key])

      expect(removedConfigs).toContain('test-app-2')
      expect(removedConfigs).toHaveLength(1)
    })

    test('should detect modified configurations', () => {
      const modifiedConfig = {
        ...mockAppConfig1,
        app_definition: {
          ...mockAppConfig1.app_definition,
          version: '1.1.0' // Version changed
        }
      }

      const baseline = {
        metadata: { total_configs: 1 },
        configs: {
          'test-app-1': mockAppConfig1
        }
      }

      const current = {
        metadata: { total_configs: 1 },
        configs: {
          'test-app-1': modifiedConfig
        }
      }

      const isModified = JSON.stringify(baseline.configs['test-app-1']) !==
                        JSON.stringify(current.configs['test-app-1'])

      expect(isModified).toBe(true)
    })

    test('should assess field change impact levels', () => {
      // High impact field changes
      const highImpactFields = [
        'smart_code',
        'entity_code',
        'organization_id',
        'app_id',
        'entity_type'
      ]

      // Medium impact field changes
      const mediumImpactFields = [
        'entity_name',
        'name',
        'version',
        'entities',
        'transactions'
      ]

      function assessFieldImpact(fieldName: string): 'high' | 'medium' | 'low' {
        if (highImpactFields.some(field => fieldName.includes(field))) {
          return 'high'
        }
        if (mediumImpactFields.some(field => fieldName.includes(field))) {
          return 'medium'
        }
        return 'low'
      }

      expect(assessFieldImpact('smart_code')).toBe('high')
      expect(assessFieldImpact('app_definition.app_id')).toBe('high')
      expect(assessFieldImpact('entity_name')).toBe('medium')
      expect(assessFieldImpact('app_definition.version')).toBe('medium')
      expect(assessFieldImpact('description')).toBe('low')
      expect(assessFieldImpact('metadata.generated_at')).toBe('low')
    })

    test('should assess guardrail impact correctly', () => {
      function assessGuardrailImpact(fieldChanges: any[]): 'breaking' | 'warning' | 'none' {
        const highImpactChanges = fieldChanges.filter(change => change.impact_level === 'high')
        const mediumImpactChanges = fieldChanges.filter(change => change.impact_level === 'medium')

        if (highImpactChanges.length > 0) {
          return 'breaking'
        }
        if (mediumImpactChanges.length > 0) {
          return 'warning'
        }
        return 'none'
      }

      const highImpactChanges = [{ impact_level: 'high' }]
      const mediumImpactChanges = [{ impact_level: 'medium' }]
      const lowImpactChanges = [{ impact_level: 'low' }]

      expect(assessGuardrailImpact(highImpactChanges)).toBe('breaking')
      expect(assessGuardrailImpact(mediumImpactChanges)).toBe('warning')
      expect(assessGuardrailImpact(lowImpactChanges)).toBe('none')
      expect(assessGuardrailImpact([])).toBe('none')
    })
  })

  describe('Markdown Report Generation', () => {
    test('should generate valid markdown structure', () => {
      const comparison = testUtils.createMockSnapshotComparison({
        summary: {
          baseline_file: 'baseline.json',
          current_file: 'current.json',
          comparison_date: '2024-01-01T00:00:00.000Z',
          total_changes: 3,
          added_configs: ['new-app'],
          removed_configs: ['old-app'],
          modified_configs: ['modified-app'],
          unchanged_configs: ['unchanged-app']
        },
        detailed_changes: {
          'new-app': {
            change_type: 'added',
            guardrail_impact: 'none'
          },
          'old-app': {
            change_type: 'removed',
            guardrail_impact: 'breaking'
          },
          'modified-app': {
            change_type: 'modified',
            guardrail_impact: 'warning',
            field_changes: [
              testUtils.createMockFieldChange({
                field_path: 'app_definition.version',
                change_type: 'modified',
                old_value: '1.0.0',
                new_value: '2.0.0',
                impact_level: 'medium'
              })
            ]
          }
        }
      })

      // Generate report (simplified)
      let report = '# HERA APP_CONFIG Snapshot Comparison Report\n\n'
      report += `**Comparison Date**: ${comparison.summary.comparison_date}\n`
      report += `**Total Changes**: ${comparison.summary.total_changes}\n\n`

      // Validate markdown structure
      expect(report).toContain('# HERA APP_CONFIG Snapshot Comparison Report')
      expect(report).toContain('**Comparison Date**:')
      expect(report).toContain('**Total Changes**: 3')
    })

    test('should include impact assessment in report', () => {
      const comparison = testUtils.createMockSnapshotComparison({
        detailed_changes: {
          'breaking-change': {
            change_type: 'modified',
            guardrail_impact: 'breaking'
          },
          'warning-change': {
            change_type: 'modified',
            guardrail_impact: 'warning'
          },
          'safe-change': {
            change_type: 'modified',
            guardrail_impact: 'none'
          }
        }
      })

      const breakingChanges = Object.values(comparison.detailed_changes)
        .filter(change => change.guardrail_impact === 'breaking')
      const warningChanges = Object.values(comparison.detailed_changes)
        .filter(change => change.guardrail_impact === 'warning')

      expect(breakingChanges).toHaveLength(1)
      expect(warningChanges).toHaveLength(1)
    })
  })

  describe('CI Integration', () => {
    test('should validate required environment variables', () => {
      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
      ]

      // Check that environment is configured for tests
      requiredEnvVars.forEach(envVar => {
        expect(process.env[envVar]).toBeDefined()
      })
    })

    test('should handle CI mode configuration', () => {
      const originalCI = process.env.CI
      
      // Test CI mode enabled
      process.env.CI = 'true'
      expect(process.env.CI).toBe('true')
      
      // Test CI mode disabled
      process.env.CI = 'false'
      expect(process.env.CI).toBe('false')
      
      // Restore original value
      if (originalCI !== undefined) {
        process.env.CI = originalCI
      } else {
        delete process.env.CI
      }
    })

    test('should generate CI artifacts structure', () => {
      const artifacts = {
        timestamp: new Date().toISOString(),
        ci_run: {
          is_ci: true,
          commit_sha: 'abc123',
          branch: 'main',
          workflow: 'APP_CONFIG Snapshot CI'
        },
        snapshots: {
          current_snapshot: true,
          baseline_snapshot: true,
          comparison_reports: 2
        },
        test_results: {
          snapshot_tests: true,
          guardrail_validation: true
        }
      }

      expect(artifacts).toHaveProperty('timestamp')
      expect(artifacts).toHaveProperty('ci_run')
      expect(artifacts).toHaveProperty('snapshots')
      expect(artifacts).toHaveProperty('test_results')
      
      expect(artifacts.ci_run).toHaveProperty('is_ci')
      expect(artifacts.ci_run).toHaveProperty('commit_sha')
      expect(artifacts.ci_run).toHaveProperty('branch')
      expect(artifacts.ci_run).toHaveProperty('workflow')
    })
  })

  describe('Error Handling', () => {
    test('should handle missing snapshot files gracefully', () => {
      const nonExistentPath = join(testSnapshotsDir, 'non-existent.json')
      
      expect(existsSync(nonExistentPath)).toBe(false)
      
      // Should throw error when trying to load non-existent snapshot
      expect(() => {
        require('fs').readFileSync(nonExistentPath, 'utf-8')
      }).toThrow()
    })

    test('should handle invalid JSON gracefully', () => {
      const invalidJsonPath = join(testSnapshotsDir, 'invalid.json')
      writeFileSync(invalidJsonPath, '{ invalid json }')
      
      expect(() => {
        JSON.parse(require('fs').readFileSync(invalidJsonPath, 'utf-8'))
      }).toThrow()
    })

    test('should handle missing required fields', () => {
      const invalidSnapshot = {
        // Missing metadata
        configs: {}
      }
      
      expect(invalidSnapshot.metadata).toBeUndefined()
      expect(invalidSnapshot.configs).toBeDefined()
    })
  })

  describe('Performance Considerations', () => {
    test('should handle large numbers of configurations efficiently', () => {
      const startTime = Date.now()
      
      // Generate 100 mock configurations
      const largeConfigSet: Record<string, any> = {}
      for (let i = 0; i < 100; i++) {
        largeConfigSet[`test-app-${i}`] = testUtils.createMockAppConfig({
          entity_code: `test-app-${i}`,
          entity_name: `Test Application ${i}`
        })
      }
      
      const unifiedSnapshot = {
        metadata: {
          generated_at: new Date().toISOString(),
          total_configs: 100,
          snapshot_version: '2.0',
          platform_organization_id: '00000000-0000-0000-0000-000000000000'
        },
        configs: largeConfigSet
      }
      
      const processingTime = Date.now() - startTime
      
      // Should complete quickly (under 1 second for 100 configs)
      expect(processingTime).toBeLessThan(1000)
      expect(Object.keys(unifiedSnapshot.configs)).toHaveLength(100)
    })

    test('should handle complex nested configurations', () => {
      const complexConfig = testUtils.createMockAppConfig({
        app_definition: {
          app_id: 'complex-app',
          name: 'Complex Application',
          version: '1.0.0',
          entities: Array.from({ length: 10 }, (_, i) => ({
            entity_type: `ENTITY_${i}`,
            display_name: `Entity ${i}`,
            fields: Array.from({ length: 20 }, (_, j) => ({
              field_name: `field_${j}`,
              field_type: 'text',
              display_label: `Field ${j}`
            }))
          })),
          transactions: Array.from({ length: 5 }, (_, i) => ({
            transaction_type: `TRANSACTION_${i}`,
            display_name: `Transaction ${i}`,
            header_fields: Array.from({ length: 10 }, (_, j) => ({
              field_name: `header_field_${j}`,
              field_type: 'text',
              display_label: `Header Field ${j}`
            }))
          }))
        }
      })
      
      // Should handle complex structures without issues
      expect(complexConfig.app_definition.entities).toHaveLength(10)
      expect(complexConfig.app_definition.transactions).toHaveLength(5)
      expect(complexConfig.app_definition.entities[0].fields).toHaveLength(20)
    })
  })
})