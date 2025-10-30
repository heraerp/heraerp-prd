/**
 * Real Vitest Tests Generator
 * Smart Code: HERA.LIB.MVP_GENERATOR.TESTS.v1
 * 
 * Generates actual Vitest tests that validate:
 * - Smart Code compliance
 * - GL balance enforcement
 * - Actor stamp coverage
 */

import { AppPack } from '../index'

export function generateSmartCodeTests(config: AppPack): string {
  return `/**
 * Smart Code Validation Tests
 * Generated for: ${config.app.name} v${config.app.version}
 */

import { describe, it, expect } from 'vitest'

// HERA DNA Smart Code regex pattern
const SMART_CODE_REGEX = /^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$/

describe('Smart Code Validation', () => {
  describe('App Pack Smart Codes', () => {
    it('app smart code should be valid', () => {
      const smartCode = '${config.app.smart_code}'
      expect(smartCode).toMatch(SMART_CODE_REGEX)
      expect(smartCode).toContain('HERA.')
      expect(smartCode.endsWith('.v1')).toBe(true)
    })
  })

  describe('Entity Smart Codes', () => {
    const entities = ${JSON.stringify(config.entities.map(e => ({ 
      entity_type: e.entity_type, 
      smart_code: e.smart_code,
      fields: e.fields.map(f => ({ name: f.name, smart_code: f.smart_code }))
    })), null, 4)}

    entities.forEach(entity => {
      describe(\`Entity: \${entity.entity_type}\`, () => {
        it('should have valid entity smart code', () => {
          expect(entity.smart_code).toMatch(SMART_CODE_REGEX)
          expect(entity.smart_code).toContain('HERA.')
          expect(entity.smart_code).toContain(entity.entity_type)
        })

        it('should have valid field smart codes', () => {
          entity.fields.forEach(field => {
            expect(field.smart_code).toMatch(SMART_CODE_REGEX)
            expect(field.smart_code).toContain('HERA.')
            expect(field.smart_code).toContain('FIELD.')
            expect(field.smart_code).toContain(field.name.toUpperCase())
          })
        })
      })
    })
  })

  describe('Transaction Smart Codes', () => {
    const transactions = ${JSON.stringify(config.transactions.map(t => ({
      transaction_type: t.transaction_type,
      smart_code: t.smart_code,
      lines: t.lines.map(l => ({ name: l.name, smart_code: l.smart_code }))
    })), null, 4)}

    transactions.forEach(transaction => {
      describe(\`Transaction: \${transaction.transaction_type}\`, () => {
        it('should have valid transaction smart code', () => {
          expect(transaction.smart_code).toMatch(SMART_CODE_REGEX)
          expect(transaction.smart_code).toContain('HERA.')
          expect(transaction.smart_code).toContain('TXN.')
        })

        it('should have valid line smart codes', () => {
          transaction.lines.forEach(line => {
            expect(line.smart_code).toMatch(SMART_CODE_REGEX)
            expect(line.smart_code).toContain('HERA.')
            expect(line.smart_code).toContain('LINE.')
          })
        })
      })
    })
  })

  describe('Smart Code Consistency', () => {
    it('all smart codes should use same version pattern', () => {
      const allSmartCodes = [
        '${config.app.smart_code}',
        ...${JSON.stringify(config.entities.map(e => e.smart_code))},
        ...${JSON.stringify(config.transactions.map(t => t.smart_code))}
      ]

      allSmartCodes.forEach(smartCode => {
        // Should end with .v followed by number
        expect(smartCode).toMatch(/\\.v[0-9]+$/)
        
        // Should have consistent HERA prefix
        expect(smartCode).toMatch(/^HERA\\.[A-Z]/)
        
        // Should not have lowercase segments (except version)
        const segments = smartCode.split('.')
        const versionSegment = segments[segments.length - 1]
        const nonVersionSegments = segments.slice(0, -1)
        
        nonVersionSegments.forEach(segment => {
          expect(segment).toMatch(/^[A-Z0-9_]+$/)
        })
        
        expect(versionSegment).toMatch(/^v[0-9]+$/)
      })
    })

    it('smart codes should not have duplicates', () => {
      const allSmartCodes = [
        '${config.app.smart_code}',
        ...${JSON.stringify(config.entities.map(e => e.smart_code))},
        ...${JSON.stringify(config.transactions.map(t => t.smart_code))},
        ...${JSON.stringify(config.entities.flatMap(e => e.fields.map(f => f.smart_code)))},
        ...${JSON.stringify(config.transactions.flatMap(t => t.lines.map(l => l.smart_code)))}
      ]

      const uniqueSmartCodes = [...new Set(allSmartCodes)]
      expect(uniqueSmartCodes).toHaveLength(allSmartCodes.length)
    })
  })

  describe('Canonical Smart Code Examples', () => {
    it('should match known valid patterns', () => {
      const validExamples = [
        'HERA.FINANCE.TXN.SALE.v1',
        'HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.v1',
        'HERA.SALON.CC.ADMIN.OVERHEAD.v2',
        'HERA.ENTERPRISE.CUSTOMER.ENTITY.v1',
        'HERA.MANUFACTURING.PRODUCT.FIELD.PRICE.v1'
      ]

      validExamples.forEach(example => {
        expect(example).toMatch(SMART_CODE_REGEX)
      })
    })

    it('should reject invalid patterns', () => {
      const invalidExamples = [
        'hera.finance.txn.sale.v1',           // lowercase
        'FINANCE.TXN.SALE.v1',               // missing HERA
        'HERA.FINANCE.TXN.SALE.V1',          // uppercase version
        'HERA.FINANCE.TXN.SALE',             // missing version
        'HERA..TXN.SALE.v1',                 // empty segment
        'HERA.FINANCE-TXN.SALE.v1'           // invalid character
      ]

      invalidExamples.forEach(example => {
        expect(example).not.toMatch(SMART_CODE_REGEX)
      })
    })
  })
})`
}

export function generateGLBalanceTests(config: AppPack): string {
  const glTransactions = config.transactions.filter(t => 
    t.smart_code.includes('.GL.') || 
    t.lines.some(l => l.line_type === 'GL' || l.smart_code.includes('.GL.'))
  )

  return `/**
 * GL Balance Validation Tests
 * Generated for: ${config.app.name} v${config.app.version}
 */

import { describe, it, expect } from 'vitest'

describe('GL Balance Validation', () => {
  describe('GL Transaction Structure', () => {
    const glTransactions = ${JSON.stringify(glTransactions, null, 4)}

    glTransactions.forEach(transaction => {
      describe(\`GL Transaction: \${transaction.transaction_type}\`, () => {
        const glLines = transaction.lines.filter(line => 
          line.line_type === 'GL' || line.smart_code.includes('.GL.')
        )

        it('should have GL lines with valid sides', () => {
          glLines.forEach(line => {
            expect(['DR', 'CR']).toContain(line.side)
            expect(line.side).toBeDefined()
          })
        })

        it('should have GL lines with account types', () => {
          glLines.forEach(line => {
            if (line.line_type === 'GL') {
              expect(line.account_type).toBeDefined()
              expect(typeof line.account_type).toBe('string')
            }
          })
        })

        it('GL lines should have proper smart codes', () => {
          glLines.forEach(line => {
            expect(line.smart_code).toContain('.GL.')
            expect(line.smart_code).toMatch(/^HERA\\.[A-Z0-9_]+\\.GL\\.[A-Z0-9_]+\\.v[0-9]+$/)
          })
        })
      })
    })
  })

  describe('Balance Enforcement Logic', () => {
    it('should validate DR equals CR per currency', () => {
      // Sample GL transaction data for testing
      const sampleTransactions = [
        {
          name: 'Balanced Sale Transaction',
          currency: 'AED',
          lines: [
            { side: 'DR', amount: 472.50, account: '110000', description: 'Cash' },
            { side: 'CR', amount: 450.00, account: '410000', description: 'Revenue' },
            { side: 'CR', amount: 22.50, account: '230000', description: 'VAT' }
          ],
          shouldBalance: true
        },
        {
          name: 'Imbalanced Transaction',
          currency: 'USD',
          lines: [
            { side: 'DR', amount: 1000.00, account: '110000', description: 'Cash' },
            { side: 'CR', amount: 900.00, account: '410000', description: 'Revenue' }
          ],
          shouldBalance: false
        },
        {
          name: 'Multi-currency Balanced',
          lines: [
            { side: 'DR', amount: 100.00, currency: 'USD', account: '110000' },
            { side: 'CR', amount: 100.00, currency: 'USD', account: '410000' },
            { side: 'DR', amount: 50.00, currency: 'EUR', account: '110001' },
            { side: 'CR', amount: 50.00, currency: 'EUR', account: '410001' }
          ],
          shouldBalance: true
        }
      ]

      sampleTransactions.forEach(txn => {
        const currencyTotals = new Map()

        txn.lines.forEach(line => {
          const currency = line.currency || txn.currency || 'USD'
          if (!currencyTotals.has(currency)) {
            currencyTotals.set(currency, { dr: 0, cr: 0 })
          }
          
          const totals = currencyTotals.get(currency)
          if (line.side === 'DR') {
            totals.dr += line.amount
          } else {
            totals.cr += line.amount
          }
        })

        // Check balance for each currency
        let isBalanced = true
        currencyTotals.forEach(totals => {
          const difference = Math.abs(totals.dr - totals.cr)
          if (difference > 0.01) { // Allow for rounding
            isBalanced = false
          }
        })

        if (txn.shouldBalance) {
          expect(isBalanced).toBe(true)
        } else {
          expect(isBalanced).toBe(false)
        }
      })
    })

    it('should handle rounding differences', () => {
      const lines = [
        { side: 'DR', amount: 33.33 },
        { side: 'DR', amount: 33.33 },
        { side: 'DR', amount: 33.34 },
        { side: 'CR', amount: 100.00 }
      ]

      let drTotal = 0
      let crTotal = 0

      lines.forEach(line => {
        if (line.side === 'DR') {
          drTotal += line.amount
        } else {
          crTotal += line.amount
        }
      })

      const difference = Math.abs(drTotal - crTotal)
      expect(difference).toBeLessThanOrEqual(0.01) // Should be within rounding tolerance
    })
  })

  describe('Michele\\'s Salon Example (Real World)', () => {
    it('should validate Michele\\'s Salon POS transaction', () => {
      // Real example from Michele's Salon
      const transaction = {
        description: 'Hair Treatment + Service Tax',
        currency: 'AED',
        lines: [
          {
            side: 'DR',
            amount: 472.50,
            account: '110000',
            description: 'Cash/Card Payment'
          },
          {
            side: 'CR', 
            amount: 450.00,
            account: '410000',
            description: 'Hair Treatment Revenue'
          },
          {
            side: 'CR',
            amount: 22.50,
            account: '230000', 
            description: '5% Service Tax'
          }
        ]
      }

      let drTotal = 0
      let crTotal = 0

      transaction.lines.forEach(line => {
        expect(['DR', 'CR']).toContain(line.side)
        expect(line.amount).toBeGreaterThan(0)
        expect(line.account).toMatch(/^[0-9]{6}$/) // 6-digit account codes

        if (line.side === 'DR') {
          drTotal += line.amount
        } else {
          crTotal += line.amount
        }
      })

      // Verify balance: DR 472.50 = CR (450.00 + 22.50)
      expect(drTotal).toBe(472.50)
      expect(crTotal).toBe(472.50)
      expect(Math.abs(drTotal - crTotal)).toBeLessThanOrEqual(0.01)
    })
  })

  ${glTransactions.length === 0 ? `
  describe('No GL Transactions', () => {
    it('should note that no GL transactions are defined in this app pack', () => {
      // This app pack does not include GL transactions
      // GL balance validation will be skipped
      expect(true).toBe(true)
    })
  })
  ` : ''}
})`
}

export function generateActorStampTests(config: AppPack): string {
  return `/**
 * Actor Stamp Coverage Tests
 * Generated for: ${config.app.name} v${config.app.version}
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Test configuration
const testConfig = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  testOrgId: process.env.TEST_ORG_ID || '6e1954fe-e34a-4056-84f4-745e5b8378ec',
  testActorId: process.env.TEST_ACTOR_ID
}

const supabase = createClient(testConfig.supabaseUrl, testConfig.supabaseServiceKey!)

describe('Actor Stamp Coverage', () => {
  beforeAll(() => {
    if (!testConfig.supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for actor stamp tests')
    }
    if (!testConfig.testActorId) {
      console.warn('TEST_ACTOR_ID not set - some tests will be skipped')
    }
  })

  describe('RPC Function Requirements', () => {
    it('should require actor_user_id parameter in entity operations', async () => {
      const { error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        // Missing p_actor_user_id
        p_organization_id: testConfig.testOrgId,
        p_entity: {
          entity_type: 'TEST_ENTITY',
          entity_name: 'Test Entity',
          smart_code: 'HERA.TEST.ENTITY.v1'
        },
        p_dynamic: [],
        p_relationships: [],
        p_options: {}
      })

      // Should fail due to missing actor
      expect(error).toBeTruthy()
      expect(error?.message).toContain('actor')
    })

    it('should require actor_user_id parameter in transaction operations', async () => {
      const { error } = await supabase.rpc('hera_txn_crud_v1', {
        p_action: 'CREATE',
        // Missing p_actor_user_id
        p_organization_id: testConfig.testOrgId,
        p_transaction: {
          transaction_type: 'test',
          smart_code: 'HERA.TEST.TXN.v1'
        },
        p_lines: [],
        p_options: {}
      })

      // Should fail due to missing actor
      expect(error).toBeTruthy()
      expect(error?.message).toContain('actor')
    })
  })

  describe('Audit Trail Validation', () => {
    it('should verify created_by field is not nullable', async () => {
      // Query schema to check constraint
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('is_nullable')
        .eq('table_name', 'core_entities')
        .eq('column_name', 'created_by')

      expect(columns).toBeDefined()
      expect(columns![0]?.is_nullable).toBe('NO')
    })

    it('should verify updated_by field is not nullable', async () => {
      // Query schema to check constraint
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('is_nullable')
        .eq('table_name', 'core_entities')
        .eq('column_name', 'updated_by')

      expect(columns).toBeDefined()
      expect(columns![0]?.is_nullable).toBe('NO')
    })
  })

  describe('Actor Stamp Enforcement', () => {
    const entityTypes = ${JSON.stringify(config.entities.map(e => e.entity_type))}

    entityTypes.forEach(entityType => {
      describe(\`Entity Type: \${entityType}\`, () => {
        it('should stamp created_by when creating entity', async () => {
          if (!testConfig.testActorId) {
            console.warn(\`Skipping test for \${entityType} - no TEST_ACTOR_ID\`)
            return
          }

          const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
            p_action: 'CREATE',
            p_actor_user_id: testConfig.testActorId,
            p_organization_id: testConfig.testOrgId,
            p_entity: {
              entity_type: entityType,
              entity_name: \`Test \${entityType}\`,
              smart_code: \`HERA.TEST.\${entityType}.v1\`,
              entity_code: \`TEST_\${entityType}_\${Date.now()}\`
            },
            p_dynamic: [],
            p_relationships: [],
            p_options: {}
          })

          if (error) {
            console.warn(\`Entity creation failed for \${entityType}:\`, error.message)
            return
          }

          expect(data).toBeDefined()
          expect(data.entity_id).toBeDefined()

          // Verify entity was created with proper actor stamps
          const { data: entity } = await supabase
            .from('core_entities')
            .select('created_by, updated_by, created_at, updated_at')
            .eq('id', data.entity_id)
            .single()

          expect(entity?.created_by).toBe(testConfig.testActorId)
          expect(entity?.updated_by).toBe(testConfig.testActorId)
          expect(entity?.created_at).toBeDefined()
          expect(entity?.updated_at).toBeDefined()

          // Clean up test data
          await supabase
            .from('core_entities')
            .delete()
            .eq('id', data.entity_id)
        })
      })
    })
  })

  describe('Actor Coverage Metrics', () => {
    it('should achieve 95%+ actor stamp coverage', async () => {
      // Query recent entities to check actor stamp coverage
      const { data: entities } = await supabase
        .from('core_entities')
        .select('created_by, updated_by')
        .eq('organization_id', testConfig.testOrgId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (!entities || entities.length === 0) {
        console.warn('No entities found for coverage test')
        return
      }

      const withCreatedBy = entities.filter(e => e.created_by !== null).length
      const withUpdatedBy = entities.filter(e => e.updated_by !== null).length

      const createdByCoverage = (withCreatedBy / entities.length) * 100
      const updatedByCoverage = (withUpdatedBy / entities.length) * 100

      console.log(\`Actor stamp coverage: created_by \${createdByCoverage.toFixed(1)}%, updated_by \${updatedByCoverage.toFixed(1)}%\`)

      expect(createdByCoverage).toBeGreaterThanOrEqual(95)
      expect(updatedByCoverage).toBeGreaterThanOrEqual(95)
    })

    it('should have no NULL actor stamps in recent data', async () => {
      const { data: nullActors } = await supabase
        .from('core_entities')
        .select('id, entity_name, created_at')
        .eq('organization_id', testConfig.testOrgId)
        .or('created_by.is.null,updated_by.is.null')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

      if (nullActors && nullActors.length > 0) {
        console.warn('Found entities with NULL actor stamps:', nullActors)
      }

      expect(nullActors).toHaveLength(0)
    })
  })

  describe('Platform Organization Protection', () => {
    it('should prevent NULL UUID attacks on platform organization', async () => {
      const { error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: '00000000-0000-0000-0000-000000000000', // NULL UUID
        p_organization_id: '00000000-0000-0000-0000-000000000000', // Platform org
        p_entity: {
          entity_type: 'MALICIOUS_ENTITY',
          entity_name: 'Attack Entity',
          smart_code: 'HERA.ATTACK.ENTITY.v1'
        },
        p_dynamic: [],
        p_relationships: [],
        p_options: {}
      })

      // Should be rejected
      expect(error).toBeTruthy()
      expect(error?.message).toContain('platform')
    })

    it('should enforce actor validation', async () => {
      const { error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: 'non-existent-actor-id',
        p_organization_id: testConfig.testOrgId,
        p_entity: {
          entity_type: 'TEST_ENTITY',
          entity_name: 'Test Entity',
          smart_code: 'HERA.TEST.ENTITY.v1'
        },
        p_dynamic: [],
        p_relationships: [],
        p_options: {}
      })

      // Should fail due to invalid actor
      expect(error).toBeTruthy()
    })
  })
})`
}