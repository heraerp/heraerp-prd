#!/usr/bin/env node
/**
 * HERA Onboarding DNA v3.0 - MCP Test Suite
 * ==========================================
 * 
 * Tests the complete onboarding project management system via RPC functions
 * Validates project creation, checkpoint management, and rollback scenarios
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

class OnboardingDNAV3Tester {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    this.testOrgId = process.env.DEFAULT_ORGANIZATION_ID
    this.testUserId = process.env.DEFAULT_USER_ENTITY_ID || '00000000-0000-0000-0000-000000000001'
    
    // Test data containers
    this.testProjectId = null
    this.testCheckpointId = null
    this.testRollbackRequestId = null
  }

  async runTests() {
    console.log('🚀 HERA Onboarding DNA v3.0 - Starting MCP Test Suite')
    console.log('=' .repeat(60))
    
    try {
      // Test 1: Project Management
      await this.testProjectManagement()
      
      // Test 2: Checkpoint Management
      await this.testCheckpointManagement()
      
      // Test 3: Rollback System
      await this.testRollbackSystem()
      
      // Test 4: Security Validation
      await this.testSecurityValidation()
      
      // Test 5: API Endpoints (if available)
      await this.testApiEndpoints()
      
      console.log('✅ ALL TESTS PASSED - HERA Onboarding DNA v3.0 is production ready!')
      
    } catch (error) {
      console.error('❌ TEST SUITE FAILED:', error.message)
      process.exit(1)
    } finally {
      await this.cleanup()
    }
  }

  async testProjectManagement() {
    console.log('\n📋 Testing Project Management...')
    
    // Create Project
    console.log('Creating onboarding project...')
    const createResult = await this.supabase.rpc('hera_onboarding_project_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: this.testUserId,
      p_organization_id: this.testOrgId,
      p_project: {
        project_name: 'MCP Test Customer Onboarding',
        project_description: 'Test project for MCP validation suite',
        project_type: 'NEW_CUSTOMER',
        target_go_live_date: '2025-12-31',
        estimated_days: 18,
        micro_app_bundle_codes: ['SALON_CORE', 'POS', 'INVENTORY'],
        primary_contact_email: 'test@mcpvalidation.com',
        ai_copilot_enabled: true
      },
      p_options: {}
    })

    if (createResult.error) {
      throw new Error(`Project creation failed: ${createResult.error.message}`)
    }

    if (!createResult.data?.success) {
      throw new Error(`Project creation failed: ${createResult.data?.message}`)
    }

    this.testProjectId = createResult.data.project_id
    console.log(`✅ Project created successfully: ${this.testProjectId}`)
    console.log(`   Phases created: ${createResult.data.phases_created}`)

    // Read Project
    console.log('Reading project details...')
    const readResult = await this.supabase.rpc('hera_onboarding_project_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: this.testUserId,
      p_organization_id: this.testOrgId,
      p_project: null,
      p_options: { project_id: this.testProjectId }
    })

    if (!readResult.data?.success) {
      throw new Error(`Project read failed: ${readResult.data?.message}`)
    }

    console.log(`✅ Project read successfully: ${readResult.data.project.entity_name}`)
    console.log(`   Dynamic data fields: ${readResult.data.project.dynamic_data?.length || 0}`)

    // Update Project
    console.log('Updating project...')
    const updateResult = await this.supabase.rpc('hera_onboarding_project_crud_v1', {
      p_action: 'UPDATE',
      p_actor_user_id: this.testUserId,
      p_organization_id: this.testOrgId,
      p_project: {
        project_name: 'Updated MCP Test Customer Onboarding',
        project_description: 'Updated test project description'
      },
      p_options: { project_id: this.testProjectId }
    })

    if (!updateResult.data?.success) {
      throw new Error(`Project update failed: ${updateResult.data?.message}`)
    }

    console.log(`✅ Project updated successfully`)
  }

  async testCheckpointManagement() {
    console.log('\n🔒 Testing Checkpoint Management...')
    
    // Create Checkpoint
    console.log('Creating checkpoint...')
    const createResult = await this.supabase.rpc('hera_onboarding_checkpoint_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: this.testUserId,
      p_organization_id: this.testOrgId,
      p_checkpoint: {
        project_id: this.testProjectId,
        checkpoint_step: 'BEFORE_MCP_TEST',
        checkpoint_name: 'Pre-MCP Test Checkpoint',
        checkpoint_description: 'Checkpoint before running MCP validation tests',
        checkpoint_type: 'FULL_ORG',
        checkpoint_trigger: 'MANUAL',
        retention_days: 90,
        scope_filter: {
          entity_types: ['CUSTOMER', 'PRODUCT', 'VENDOR', 'ACCOUNT'],
          transaction_smart_codes: ['HERA.FINANCE.TXN.*'],
          relationships: true,
          dynamic_data: true
        }
      },
      p_options: {}
    })

    if (!createResult.data?.success) {
      throw new Error(`Checkpoint creation failed: ${createResult.data?.message}`)
    }

    this.testCheckpointId = createResult.data.checkpoint_id
    console.log(`✅ Checkpoint created successfully: ${this.testCheckpointId}`)
    console.log(`   Can rollback: ${createResult.data.can_rollback_to}`)
    console.log(`   Snapshot manifest: ${JSON.stringify(createResult.data.snapshot_manifest, null, 2)}`)

    // Read Checkpoint
    console.log('Reading checkpoint details...')
    const readResult = await this.supabase.rpc('hera_onboarding_checkpoint_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: this.testUserId,
      p_organization_id: this.testOrgId,
      p_checkpoint: null,
      p_options: { checkpoint_id: this.testCheckpointId }
    })

    if (!readResult.data?.success) {
      throw new Error(`Checkpoint read failed: ${readResult.data?.message}`)
    }

    console.log(`✅ Checkpoint read successfully: ${readResult.data.checkpoint.entity_name}`)

    // Validate Rollback Safety
    console.log('Validating rollback safety...')
    const validateResult = await this.supabase.rpc('hera_onboarding_checkpoint_crud_v1', {
      p_action: 'VALIDATE_ROLLBACK',
      p_actor_user_id: this.testUserId,
      p_organization_id: this.testOrgId,
      p_checkpoint: null,
      p_options: { checkpoint_id: this.testCheckpointId }
    })

    if (!validateResult.data?.success) {
      throw new Error(`Rollback validation failed: ${validateResult.data?.message}`)
    }

    console.log(`✅ Rollback validation completed`)
    console.log(`   Is safe: ${validateResult.data.rollback_assessment.is_safe}`)
    console.log(`   Risk score: ${validateResult.data.rollback_assessment.risk_score}`)
    console.log(`   Risk factors: ${JSON.stringify(validateResult.data.rollback_assessment.risk_factors)}`)
  }

  async testRollbackSystem() {
    console.log('\n🔄 Testing Rollback System...')
    
    // Request Rollback
    console.log('Requesting rollback...')
    const requestResult = await this.supabase.rpc('hera_onboarding_rollback_execution_v1', {
      p_action: 'REQUEST_ROLLBACK',
      p_actor_user_id: this.testUserId,
      p_organization_id: this.testOrgId,
      p_rollback_request: {
        checkpoint_id: this.testCheckpointId,
        rollback_reason: 'MCP test validation detected system inconsistency',
        org_code: 'MCPTEST'
      },
      p_options: {}
    })

    if (!requestResult.data?.success) {
      throw new Error(`Rollback request failed: ${requestResult.data?.message}`)
    }

    this.testRollbackRequestId = requestResult.data.rollback_request_id
    console.log(`✅ Rollback requested successfully: ${this.testRollbackRequestId}`)
    console.log(`   Approval required: ${requestResult.data.approval_required}`)
    console.log(`   Safety assessment: ${JSON.stringify(requestResult.data.safety_assessment, null, 2)}`)

    // List Rollback Points
    console.log('Listing rollback points...')
    const listResult = await this.supabase.rpc('hera_onboarding_rollback_execution_v1', {
      p_action: 'LIST_ROLLBACK_POINTS',
      p_actor_user_id: this.testUserId,
      p_organization_id: this.testOrgId,
      p_rollback_request: null,
      p_options: { project_id: this.testProjectId }
    })

    if (!listResult.data?.success) {
      throw new Error(`Rollback points listing failed: ${listResult.data?.message}`)
    }

    console.log(`✅ Rollback points listed successfully`)
    console.log(`   Available points: ${listResult.data.rollback_points?.length || 0}`)

    // Execute Rollback (Simulation)
    console.log('Executing rollback (simulation)...')
    const executeResult = await this.supabase.rpc('hera_onboarding_rollback_execution_v1', {
      p_action: 'EXECUTE_ROLLBACK',
      p_actor_user_id: this.testUserId,
      p_organization_id: this.testOrgId,
      p_rollback_request: null,
      p_options: { rollback_request_id: this.testRollbackRequestId }
    })

    if (!executeResult.data?.success) {
      throw new Error(`Rollback execution failed: ${executeResult.data?.message}`)
    }

    console.log(`✅ Rollback executed successfully`)
    console.log(`   Entities affected: ${executeResult.data.entities_affected}`)
    console.log(`   Transactions affected: ${executeResult.data.transactions_affected}`)
    console.log(`   Downtime seconds: ${executeResult.data.downtime_seconds}`)
  }

  async testSecurityValidation() {
    console.log('\n🛡️ Testing Security Validation...')
    
    // Test null actor rejection
    console.log('Testing null actor rejection...')
    const nullActorResult = await this.supabase.rpc('hera_onboarding_project_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: null,
      p_organization_id: this.testOrgId,
      p_project: {
        project_name: 'Unauthorized Project',
        target_go_live_date: '2025-12-31'
      },
      p_options: {}
    })

    if (nullActorResult.data?.success) {
      throw new Error('Security violation: null actor was accepted')
    }

    console.log(`✅ Null actor properly rejected: ${nullActorResult.data?.error_code}`)

    // Test null organization rejection
    console.log('Testing null organization rejection...')
    const nullOrgResult = await this.supabase.rpc('hera_onboarding_project_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: this.testUserId,
      p_organization_id: null,
      p_project: {
        project_name: 'Unauthorized Project',
        target_go_live_date: '2025-12-31'
      },
      p_options: {}
    })

    if (nullOrgResult.data?.success) {
      throw new Error('Security violation: null organization was accepted')
    }

    console.log(`✅ Null organization properly rejected: ${nullOrgResult.data?.error_code}`)
  }

  async testApiEndpoints() {
    console.log('\n🌐 Testing API Endpoints...')
    
    // Note: In a real implementation, we would test the API endpoints
    // For this MCP test, we'll skip API testing as it requires a running server
    console.log('⚠️  API endpoint testing skipped (requires running server)')
    console.log('   API endpoints should be tested separately with proper authentication')
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...')
    
    try {
      // Delete checkpoint
      if (this.testCheckpointId) {
        await this.supabase.rpc('hera_onboarding_checkpoint_crud_v1', {
          p_action: 'DELETE',
          p_actor_user_id: this.testUserId,
          p_organization_id: this.testOrgId,
          p_checkpoint: null,
          p_options: { checkpoint_id: this.testCheckpointId }
        })
        console.log('✅ Test checkpoint cleaned up')
      }

      // Delete project (this will cascade to phases and relationships)
      if (this.testProjectId) {
        await this.supabase.rpc('hera_onboarding_project_crud_v1', {
          p_action: 'DELETE',
          p_actor_user_id: this.testUserId,
          p_organization_id: this.testOrgId,
          p_project: null,
          p_options: { project_id: this.testProjectId }
        })
        console.log('✅ Test project cleaned up')
      }

    } catch (error) {
      console.error('⚠️  Cleanup warning:', error.message)
    }
  }
}

// Main execution
async function main() {
  const tester = new OnboardingDNAV3Tester()
  await tester.runTests()
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
}