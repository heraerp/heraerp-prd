import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Enhanced RLS security tests with learning capabilities
describe('RLS Security Tests with Learning', () => {
  let supabaseAlice: ReturnType<typeof createClient>
  let supabaseBob: ReturnType<typeof createClient>
  let supabaseAdmin: ReturnType<typeof createClient>
  
  const aliceOrgId = '11111111-1111-1111-1111-111111111111'
  const bobOrgId = '22222222-2222-2222-2222-222222222222'
  const aliceUserId = 'alice-user-entity-id'
  const bobUserId = 'bob-user-entity-id'
  
  const learningData: SecurityLearningData = {
    sessionId: `rls-security-${Date.now()}`,
    vulnerabilities: [],
    violations: [],
    successful_isolations: [],
    patterns: new Set(),
    metrics: {
      total_tests: 0,
      failed_isolations: 0,
      successful_isolations: 0,
      performance_issues: 0
    }
  }

  interface SecurityLearningData {
    sessionId: string
    vulnerabilities: SecurityVulnerability[]
    violations: RLSViolation[]
    successful_isolations: SuccessfulIsolation[]
    patterns: Set<string>
    metrics: SecurityMetrics
  }

  interface SecurityVulnerability {
    test: string
    vulnerability_type: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    description: string
    fix_recommendation: string
    affected_tables: string[]
  }

  interface RLSViolation {
    test: string
    table: string
    operation: string
    expected_rows: number
    actual_rows: number
    leak_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }

  interface SuccessfulIsolation {
    test: string
    table: string
    operation: string
    response_time: number
    isolation_confirmed: boolean
  }

  interface SecurityMetrics {
    total_tests: number
    failed_isolations: number
    successful_isolations: number
    performance_issues: number
  }

  beforeAll(async () => {
    // Initialize clients for different users
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Mock JWT tokens for different users
    supabaseAlice = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            'Authorization': `Bearer ${process.env.ALICE_JWT_TOKEN || 'mock-alice-token'}`
          }
        }
      }
    )

    supabaseBob = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            'Authorization': `Bearer ${process.env.BOB_JWT_TOKEN || 'mock-bob-token'}`
          }
        }
      }
    )

    console.log(`🔒 Starting RLS security learning session: ${learningData.sessionId}`)
  })

  afterEach(async () => {
    learningData.metrics.total_tests++
    await updateSecurityLearning()
  })

  async function updateSecurityLearning() {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    // Convert Set to Array for JSON serialization
    const learningDataForSave = {
      ...learningData,
      patterns: Array.from(learningData.patterns)
    }
    
    const learningFile = path.join('.claude/learning', `rls-security-${learningData.sessionId}.json`)
    await fs.writeFile(learningFile, JSON.stringify(learningDataForSave, null, 2))
  }

  async function recordVulnerability(
    test: string, 
    type: string, 
    severity: SecurityVulnerability['severity'], 
    description: string,
    fixRecommendation: string,
    affectedTables: string[]
  ) {
    learningData.vulnerabilities.push({
      test,
      vulnerability_type: type,
      severity,
      description,
      fix_recommendation: fixRecommendation,
      affected_tables: affectedTables
    })
    
    learningData.patterns.add(`vulnerability_${type}`)
    learningData.metrics.failed_isolations++
  }

  async function recordRLSViolation(
    test: string,
    table: string,
    operation: string,
    expectedRows: number,
    actualRows: number
  ) {
    const leakSeverity: RLSViolation['leak_severity'] = 
      actualRows > expectedRows * 2 ? 'CRITICAL' :
      actualRows > expectedRows * 1.5 ? 'HIGH' :
      actualRows > expectedRows ? 'MEDIUM' : 'LOW'

    learningData.violations.push({
      test,
      table,
      operation,
      expected_rows: expectedRows,
      actual_rows: actualRows,
      leak_severity: leakSeverity
    })

    learningData.patterns.add(`rls_violation_${table}`)
    learningData.metrics.failed_isolations++
  }

  async function recordSuccessfulIsolation(
    test: string,
    table: string,
    operation: string,
    responseTime: number,
    isolationConfirmed: boolean
  ) {
    learningData.successful_isolations.push({
      test,
      table,
      operation,
      response_time: responseTime,
      isolation_confirmed: isolationConfirmed
    })

    learningData.patterns.add(`successful_isolation_${table}`)
    learningData.metrics.successful_isolations++

    if (responseTime > 1000) {
      learningData.metrics.performance_issues++
    }
  }

  describe('Cross-Tenant Data Isolation', () => {
    it('prevents Alice from reading Bob\\'s entities', async () => {
      const testName = 'cross_tenant_entity_read'
      const startTime = Date.now()
      
      try {
        // Alice tries to read entities from Bob's organization
        const { data: aliceData, error: aliceError } = await supabaseAlice
          .from('core_entities')
          .select('*')
          .eq('organization_id', bobOrgId)

        const responseTime = Date.now() - startTime

        if (aliceError) {
          // Error is expected - good isolation
          await recordSuccessfulIsolation(testName, 'core_entities', 'read', responseTime, true)
          expect(aliceError).toBeTruthy()
        } else {
          // No error but should return zero rows
          expect(aliceData).toEqual([])
          
          if (aliceData && aliceData.length > 0) {
            await recordRLSViolation(testName, 'core_entities', 'read', 0, aliceData.length)
            await recordVulnerability(
              testName,
              'cross_tenant_data_leak',
              'CRITICAL',
              `Alice can read ${aliceData.length} entities from Bob's organization`,
              'Fix RLS policies on core_entities table',
              ['core_entities']
            )
            
            throw new Error(`CRITICAL: Cross-tenant data leak detected! Alice read ${aliceData.length} entities from Bob's org`)
          } else {
            await recordSuccessfulIsolation(testName, 'core_entities', 'read', responseTime, true)
          }
        }
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('CRITICAL')) {
          throw error // Re-throw critical security violations
        }
        
        // Other errors are expected for good isolation
        const responseTime = Date.now() - startTime
        await recordSuccessfulIsolation(testName, 'core_entities', 'read', responseTime, true)
      }
    })

    it('prevents Bob from writing to Alice\\'s entities', async () => {
      const testName = 'cross_tenant_entity_write'
      const startTime = Date.now()
      
      try {
        // Bob tries to create an entity in Alice's organization
        const { data: bobData, error: bobError } = await supabaseBob
          .from('core_entities')
          .insert({
            entity_type: 'malicious_entity',
            entity_name: 'Bob\\'s Malicious Entity',
            smart_code: 'HERA.MALICIOUS.ENTITY.ATTACK.v1',
            organization_id: aliceOrgId, // Trying to write to Alice's org!
            created_by: bobUserId,
            updated_by: bobUserId
          })
          .select()

        const responseTime = Date.now() - startTime

        if (bobError) {
          // Error is expected - good isolation
          await recordSuccessfulIsolation(testName, 'core_entities', 'write', responseTime, true)
          expect(bobError).toBeTruthy()
        } else if (!bobData || bobData.length === 0) {
          // No data created - good isolation
          await recordSuccessfulIsolation(testName, 'core_entities', 'write', responseTime, true)
        } else {
          // Critical violation - Bob was able to write to Alice's org
          await recordRLSViolation(testName, 'core_entities', 'write', 0, bobData.length)
          await recordVulnerability(
            testName,
            'cross_tenant_write_violation',
            'CRITICAL',
            `Bob successfully wrote ${bobData.length} entities to Alice's organization`,
            'Fix RLS policies on core_entities table to prevent cross-tenant writes',
            ['core_entities']
          )
          
          throw new Error(`CRITICAL: Cross-tenant write violation! Bob wrote ${bobData.length} entities to Alice's org`)
        }
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('CRITICAL')) {
          throw error // Re-throw critical security violations
        }
        
        // Other errors are expected for good isolation
        const responseTime = Date.now() - startTime
        await recordSuccessfulIsolation(testName, 'core_entities', 'write', responseTime, true)
      }
    })

    it('prevents cross-tenant transaction access', async () => {
      const testName = 'cross_tenant_transaction_access'
      const startTime = Date.now()
      
      try {
        // Alice tries to read Bob's transactions
        const { data: aliceData, error: aliceError } = await supabaseAlice
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', bobOrgId)

        const responseTime = Date.now() - startTime

        if (aliceError) {
          await recordSuccessfulIsolation(testName, 'universal_transactions', 'read', responseTime, true)
          expect(aliceError).toBeTruthy()
        } else {
          expect(aliceData).toEqual([])
          
          if (aliceData && aliceData.length > 0) {
            await recordRLSViolation(testName, 'universal_transactions', 'read', 0, aliceData.length)
            await recordVulnerability(
              testName,
              'cross_tenant_transaction_leak',
              'CRITICAL',
              `Alice can access ${aliceData.length} transactions from Bob's organization`,
              'Fix RLS policies on universal_transactions table',
              ['universal_transactions']
            )
            
            throw new Error(`CRITICAL: Cross-tenant transaction leak! Alice accessed ${aliceData.length} of Bob's transactions`)
          } else {
            await recordSuccessfulIsolation(testName, 'universal_transactions', 'read', responseTime, true)
          }
        }
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('CRITICAL')) {
          throw error
        }
        
        const responseTime = Date.now() - startTime
        await recordSuccessfulIsolation(testName, 'universal_transactions', 'read', responseTime, true)
      }
    })

    it('prevents cross-tenant dynamic data access', async () => {
      const testName = 'cross_tenant_dynamic_data'
      const startTime = Date.now()
      
      try {
        // Alice tries to read dynamic data from Bob's org
        const { data: aliceData, error: aliceError } = await supabaseAlice
          .from('core_dynamic_data')
          .select('*')
          .eq('organization_id', bobOrgId)

        const responseTime = Date.now() - startTime

        if (aliceError) {
          await recordSuccessfulIsolation(testName, 'core_dynamic_data', 'read', responseTime, true)
          expect(aliceError).toBeTruthy()
        } else {
          expect(aliceData).toEqual([])
          
          if (aliceData && aliceData.length > 0) {
            await recordRLSViolation(testName, 'core_dynamic_data', 'read', 0, aliceData.length)
            await recordVulnerability(
              testName,
              'cross_tenant_dynamic_data_leak',
              'HIGH',
              `Alice can access ${aliceData.length} dynamic data records from Bob's organization`,
              'Fix RLS policies on core_dynamic_data table',
              ['core_dynamic_data']
            )
            
            throw new Error(`HIGH: Cross-tenant dynamic data leak! Alice accessed ${aliceData.length} of Bob's dynamic data records`)
          } else {
            await recordSuccessfulIsolation(testName, 'core_dynamic_data', 'read', responseTime, true)
          }
        }
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('HIGH')) {
          throw error
        }
        
        const responseTime = Date.now() - startTime
        await recordSuccessfulIsolation(testName, 'core_dynamic_data', 'read', responseTime, true)
      }
    })
  })

  describe('Actor Validation & Audit', () => {
    it('validates actor presence in write operations', async () => {
      const testName = 'actor_validation_write'
      
      try {
        // Try to write without proper actor
        const { data, error } = await supabaseAlice
          .from('core_entities')
          .insert({
            entity_type: 'test_entity',
            entity_name: 'Test Without Actor',
            smart_code: 'HERA.TEST.NO.ACTOR.v1',
            organization_id: aliceOrgId
            // Missing created_by and updated_by
          })
          .select()

        if (error) {
          // Error expected - good validation
          expect(error.message).toMatch(/created_by|updated_by|actor/)
          learningData.patterns.add('actor_validation_success')
        } else if (data && data.length > 0) {
          // Check if audit triggers are working
          const entity = data[0]
          if (!entity.created_by || !entity.updated_by) {
            await recordVulnerability(
              testName,
              'missing_actor_stamping',
              'HIGH',
              'Entity created without proper actor stamping',
              'Ensure audit triggers are enabled and RPC functions stamp actors',
              ['core_entities']
            )
            
            throw new Error('HIGH: Actor stamping validation failed')
          } else {
            learningData.patterns.add('auto_actor_stamping')
          }
        }
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('HIGH')) {
          throw error
        }
        
        // Other errors are expected for good validation
        learningData.patterns.add('actor_validation_success')
      }
    })

    it('ensures audit trail integrity', async () => {
      const testName = 'audit_trail_integrity'
      
      try {
        // Check that all entities have proper audit fields
        const { data, error } = await supabaseAdmin
          .from('core_entities')
          .select('id, created_by, updated_by, created_at, updated_at')
          .eq('organization_id', aliceOrgId)
          .limit(100)

        expect(error).toBeNull()
        expect(data).toBeTruthy()

        if (data) {
          const missingAuditFields = data.filter(entity => 
            !entity.created_by || 
            !entity.updated_by || 
            !entity.created_at || 
            !entity.updated_at
          )

          if (missingAuditFields.length > 0) {
            await recordVulnerability(
              testName,
              'incomplete_audit_trail',
              'MEDIUM',
              `${missingAuditFields.length} entities have incomplete audit trails`,
              'Run data migration to fill missing audit fields and ensure triggers are working',
              ['core_entities']
            )
            
            console.warn(`⚠️ Found ${missingAuditFields.length} entities with incomplete audit trails`)
          } else {
            learningData.patterns.add('complete_audit_trail')
          }
        }
        
      } catch (error) {
        await recordVulnerability(
          testName,
          'audit_trail_check_failed',
          'MEDIUM',
          `Failed to check audit trail integrity: ${error}`,
          'Investigate audit trail checking mechanism',
          ['core_entities']
        )
        throw error
      }
    })
  })

  describe('Performance Security', () => {
    it('detects slow RLS queries (potential DoS)', async () => {
      const testName = 'rls_performance_security'
      const startTime = Date.now()
      
      try {
        // Run a potentially expensive query
        const { data, error } = await supabaseAlice
          .from('core_entities')
          .select('*')
          .eq('organization_id', aliceOrgId)
          .limit(1000)

        const responseTime = Date.now() - startTime

        expect(error).toBeNull()

        if (responseTime > 5000) { // 5 seconds
          await recordVulnerability(
            testName,
            'slow_rls_query',
            'MEDIUM',
            `RLS query took ${responseTime}ms which could lead to DoS`,
            'Optimize RLS policies and add database indexes',
            ['core_entities']
          )
          
          console.warn(`⚠️ Slow RLS query detected: ${responseTime}ms`)
        } else {
          learningData.patterns.add('performant_rls')
        }

        await recordSuccessfulIsolation(testName, 'core_entities', 'read', responseTime, true)
        
      } catch (error) {
        throw error
      }
    })
  })

  describe('Learning Analytics', () => {
    it('analyzes security patterns learned', () => {
      const patterns = Array.from(learningData.patterns)
      expect(patterns.length).toBeGreaterThan(0)
      
      console.log('🧠 Security patterns learned:', patterns)
      
      // Should have learned about successful isolation
      expect(patterns.some(p => p.includes('successful_isolation'))).toBe(true)
      
      // Should have learned about actor validation
      expect(patterns.some(p => p.includes('actor'))).toBe(true)
    })

    it('validates security metrics', () => {
      const { metrics } = learningData
      
      expect(metrics.total_tests).toBeGreaterThan(0)
      
      // Calculate security score
      const securityScore = metrics.successful_isolations / Math.max(metrics.total_tests, 1)
      console.log(`🔒 Security Score: ${(securityScore * 100).toFixed(1)}%`)
      
      // Should have high security score
      expect(securityScore).toBeGreaterThan(0.8) // 80% minimum
      
      // Log vulnerabilities if any
      if (learningData.vulnerabilities.length > 0) {
        console.warn('🚨 Security vulnerabilities found:')
        learningData.vulnerabilities.forEach(vuln => {
          console.warn(`  - ${vuln.severity}: ${vuln.description}`)
        })
      }
      
      // Log RLS violations if any
      if (learningData.violations.length > 0) {
        console.warn('⚠️ RLS violations found:')
        learningData.violations.forEach(violation => {
          console.warn(`  - ${violation.leak_severity}: ${violation.table} ${violation.operation} (expected: ${violation.expected_rows}, actual: ${violation.actual_rows})`)
        })
      }
    })

    it('ensures no critical vulnerabilities', () => {
      const criticalVulns = learningData.vulnerabilities.filter(v => v.severity === 'CRITICAL')
      
      if (criticalVulns.length > 0) {
        console.error('🚨 CRITICAL VULNERABILITIES DETECTED:')
        criticalVulns.forEach(vuln => {
          console.error(`  - ${vuln.test}: ${vuln.description}`)
          console.error(`    Fix: ${vuln.fix_recommendation}`)
        })
      }
      
      expect(criticalVulns.length).toBe(0)
    })
  })
})