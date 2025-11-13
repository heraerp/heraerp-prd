#!/usr/bin/env node

/**
 * DETAILED POS DEBUG TEST
 * 
 * Comprehensive debugging of POS transaction creation
 * Identifies specific guardrail violations and provides actionable feedback
 */

import { createClient } from '@supabase/supabase-js'

const CONFIG = {
  supabaseUrl: 'https://ralywraqvuqgdezttfde.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w'
}

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey)

class POSDetailedDebugger {
  constructor() {
    this.organizationId = null
    this.userId = null
    this.debugInfo = []
  }

  log(message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      data
    }
    this.debugInfo.push(entry)
    console.log(`🔍 ${message}`)
    if (data) {
      console.log('   Data:', JSON.stringify(data, null, 2).slice(0, 200) + '...')
    }
  }

  async initialize() {
    this.log('Starting POS Debug Session')

    try {
      // Get organization data
      const { data: orgData, error: orgError } = await supabase
        .from('core_organizations')
        .select('id, organization_name, organization_code, settings')
        .limit(1)

      if (orgError) throw new Error(`Organization query failed: ${orgError.message}`)
      if (!orgData || orgData.length === 0) throw new Error('No organizations found')

      this.organizationId = orgData[0].id
      this.log('Organization found', {
        id: orgData[0].id,
        name: orgData[0].organization_name,
        code: orgData[0].organization_code
      })

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('core_entities')
        .select('id, entity_name, entity_type, smart_code')
        .eq('entity_type', 'USER')
        .eq('organization_id', this.organizationId)
        .limit(1)

      if (userError) throw new Error(`User query failed: ${userError.message}`)
      if (!userData || userData.length === 0) {
        this.log('No users found in organization, checking all users...')
        
        // Try to find any user in any organization
        const { data: anyUserData } = await supabase
          .from('core_entities')
          .select('id, entity_name, entity_type, organization_id, smart_code')
          .eq('entity_type', 'USER')
          .limit(5)

        if (anyUserData && anyUserData.length > 0) {
          this.userId = anyUserData[0].id
          this.organizationId = anyUserData[0].organization_id // Use the user's org
          this.log('Using user from different organization', {
            userId: anyUserData[0].id,
            userName: anyUserData[0].entity_name,
            organizationId: anyUserData[0].organization_id,
            totalUsersFound: anyUserData.length
          })
        } else {
          throw new Error('No users found in database')
        }
      } else {
        this.userId = userData[0].id
        this.log('User found', {
          id: userData[0].id,
          name: userData[0].entity_name,
          smartCode: userData[0].smart_code
        })
      }

      return true
    } catch (error) {
      this.log('Initialization failed', { error: error.message })
      return false
    }
  }

  async testBasicTransaction() {
    this.log('Testing basic transaction creation')

    const transactionPayload = {
      p_action: 'CREATE',
      p_actor_user_id: this.userId,
      p_organization_id: this.organizationId,
      p_payload: {
        header: {
          transaction_type: 'SALE',
          smart_code: 'HERA.SALON.TXN.SALE.CREATE.v1',
          transaction_date: new Date().toISOString(),
          total_amount: 126.00,
          transaction_status: 'completed',
          metadata: {
            test_type: 'debug_session',
            timestamp: new Date().toISOString()
          }
        },
        lines: [
          {
            line_number: 1,
            line_type: 'service',
            description: 'Basic Haircut',
            quantity: 1,
            unit_amount: 120.00,
            line_amount: 120.00,
            smart_code: 'HERA.SALON.SVC.LINE.STANDARD.v1'
          },
          {
            line_number: 2,
            line_type: 'tax',
            description: 'VAT (5.0%)',
            quantity: 1,
            unit_amount: 6.00,
            line_amount: 6.00,
            smart_code: 'HERA.SALON.TAX.AE.VAT.STANDARD.v1'
          },
          {
            line_number: 3,
            line_type: 'payment',
            description: 'Payment - CASH',
            quantity: 1,
            unit_amount: 126.00,
            line_amount: 126.00,
            smart_code: 'HERA.SALON.PAYMENT.CAPTURE.CASH.v1'
          }
        ]
      }
    }

    this.log('Payload prepared', {
      action: transactionPayload.p_action,
      actorUserId: transactionPayload.p_actor_user_id,
      organizationId: transactionPayload.p_organization_id,
      headerSmartCode: transactionPayload.p_payload.header.smart_code,
      lineCount: transactionPayload.p_payload.lines.length
    })

    try {
      const startTime = performance.now()
      
      const { data, error } = await supabase.rpc('hera_txn_crud_v1', transactionPayload)
      
      const duration = performance.now() - startTime
      
      this.log(`RPC call completed in ${Math.round(duration)}ms`)

      if (error) {
        this.log('RPC error occurred', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        return { success: false, error: error.message, duration }
      }

      if (!data) {
        this.log('RPC returned no data')
        return { success: false, error: 'No data returned', duration }
      }

      this.log('RPC data received', {
        success: data.success,
        hasError: !!data.error,
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : null
      })

      if (!data.success) {
        this.log('RPC failed with business logic error', {
          error: data.error,
          violations: data.violations,
          details: data.details
        })

        // Detailed violation analysis
        if (data.violations && Array.isArray(data.violations)) {
          this.log('Analyzing guardrail violations', { violationCount: data.violations.length })
          
          data.violations.forEach((violation, index) => {
            this.log(`Violation ${index + 1}`, {
              rule: violation.rule,
              message: violation.message,
              field: violation.field,
              value: violation.value,
              expected: violation.expected
            })
          })
        }

        return { success: false, error: data.error, violations: data.violations, duration }
      }

      // Success case
      const transactionId = data.data?.header?.id || data.data?.transaction_id
      this.log('Transaction created successfully', {
        transactionId,
        hasHeader: !!data.data?.header,
        hasLines: !!data.data?.lines,
        lineCount: data.data?.lines?.length
      })

      return { success: true, transactionId, data: data.data, duration }

    } catch (error) {
      this.log('Exception during RPC call', {
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      })
      return { success: false, error: error.message, duration: 0 }
    }
  }

  async testValidationSteps() {
    this.log('Testing individual validation steps')

    // Test 1: Smart code validation
    const testSmartCodes = [
      'HERA.SALON.TXN.SALE.CREATE.v1',
      'HERA.SALON.SVC.LINE.STANDARD.v1',
      'HERA.SALON.TAX.AE.VAT.STANDARD.v1',
      'HERA.SALON.PAYMENT.CAPTURE.CASH.v1'
    ]

    this.log('Testing smart code patterns', { codes: testSmartCodes })

    // Test 2: Organization membership
    try {
      const { data: membershipData } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('from_entity_id', this.userId)
        .eq('to_entity_id', this.organizationId)
        .eq('relationship_type', 'USER_MEMBER_OF_ORG')

      this.log('User membership check', {
        userId: this.userId,
        organizationId: this.organizationId,
        membershipFound: membershipData?.length > 0,
        relationships: membershipData
      })
    } catch (error) {
      this.log('Membership check failed', { error: error.message })
    }

    // Test 3: Basic data validation
    this.log('Data validation summary', {
      hasUserId: !!this.userId,
      hasOrgId: !!this.organizationId,
      userIdFormat: this.userId?.length === 36 ? 'UUID' : 'Invalid',
      orgIdFormat: this.organizationId?.length === 36 ? 'UUID' : 'Invalid'
    })
  }

  generateReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📋 DETAILED POS DEBUG REPORT')
    console.log('='.repeat(60))

    console.log('\n🔍 Debug Session Summary:')
    console.log(`  Total Steps: ${this.debugInfo.length}`)
    console.log(`  Organization ID: ${this.organizationId}`)
    console.log(`  User ID: ${this.userId}`)

    console.log('\n📝 Debug Timeline:')
    this.debugInfo.forEach((entry, index) => {
      const time = new Date(entry.timestamp).toLocaleTimeString()
      console.log(`  ${index + 1}. [${time}] ${entry.message}`)
      if (entry.data && Object.keys(entry.data).length > 0) {
        const dataStr = JSON.stringify(entry.data, null, 2)
        if (dataStr.length > 200) {
          console.log(`     ${dataStr.slice(0, 200)}...`)
        } else {
          console.log(`     ${dataStr}`)
        }
      }
    })

    console.log('\n💡 Recommendations:')
    
    if (!this.userId || !this.organizationId) {
      console.log('  🔴 CRITICAL: Missing user or organization context')
      console.log('     - Ensure proper authentication setup')
      console.log('     - Verify user exists in target organization')
    }

    console.log('\n🎯 Next Steps:')
    console.log('  1. Review guardrail violations above')
    console.log('  2. Fix any smart code pattern issues')
    console.log('  3. Ensure user membership relationships exist')
    console.log('  4. Test with valid organization context')
    console.log('  5. Re-run with corrected payload')
  }

  async runDebugSession() {
    console.log('🚀 Starting Detailed POS Debug Session')
    console.log('====================================')

    // Initialize
    const initialized = await this.initialize()
    if (!initialized) {
      console.error('💥 Debug session failed to initialize')
      this.generateReport()
      return
    }

    // Run validation tests
    await this.testValidationSteps()

    // Test transaction creation
    const result = await this.testBasicTransaction()
    
    this.log('Debug session completed', {
      finalResult: result.success,
      error: result.error,
      duration: result.duration
    })

    // Generate report
    this.generateReport()

    console.log('\n✅ Debug session completed!')
    if (result.success) {
      console.log('🎯 Transaction creation successful! POS system is working correctly.')
      console.log(`📄 Transaction ID: ${result.transactionId}`)
    } else {
      console.log('❌ Transaction creation failed. Review violations above for specific issues.')
      console.log('🔧 Focus on fixing guardrail violations for successful POS operations.')
    }
  }
}

// Run the debug session
async function main() {
  const posDebugger = new POSDetailedDebugger()
  await posDebugger.runDebugSession()
}

main().catch(console.error)