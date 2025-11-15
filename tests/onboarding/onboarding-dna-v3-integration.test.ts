import { createClient } from '@supabase/supabase-js'

/**
 * HERA Onboarding DNA v3.0 - Integration Tests
 * 
 * Comprehensive test suite for onboarding project management system
 * Tests all CRUD operations, checkpoint validation, and rollback scenarios
 */

describe('HERA Onboarding DNA v3.0 Integration Tests', () => {
  let supabase: any
  let testOrgId: string
  let testUserId: string
  let testProjectId: string
  let testCheckpointId: string

  beforeAll(() => {
    // Initialize Supabase client for testing
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Set test organization and user IDs
    testOrgId = process.env.TEST_ORGANIZATION_ID || 'test-org-uuid'
    testUserId = process.env.TEST_USER_ENTITY_ID || 'test-user-uuid'
  })

  describe('Onboarding Project Management', () => {
    test('should create a new onboarding project with default phases', async () => {
      const { data: result, error } = await supabase.rpc('hera_onboarding_project_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_project: {
          project_name: 'Test Customer Onboarding',
          project_description: 'Integration test for onboarding project creation',
          project_type: 'NEW_CUSTOMER',
          target_go_live_date: '2025-12-31',
          estimated_days: 21,
          micro_app_bundle_codes: ['SALON_CORE', 'POS', 'INVENTORY'],
          primary_contact_email: 'test@example.com',
          ai_copilot_enabled: true
        },
        p_options: {}
      })

      expect(error).toBeNull()
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.project_id).toBeDefined()
      expect(result.phases_created).toBe(5)

      testProjectId = result.project_id
    })

    test('should read the created project with all dynamic data', async () => {
      const { data: result, error } = await supabase.rpc('hera_onboarding_project_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_project: null,
        p_options: { project_id: testProjectId }
      })

      expect(error).toBeNull()
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.project).toBeDefined()
      expect(result.project.entity_name).toBe('Test Customer Onboarding')
      expect(result.project.dynamic_data).toBeDefined()
      expect(Array.isArray(result.project.dynamic_data)).toBe(true)
    })

    test('should update project details', async () => {
      const { data: result, error } = await supabase.rpc('hera_onboarding_project_crud_v1', {
        p_action: 'UPDATE',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_project: {
          project_name: 'Updated Test Customer Onboarding',
          project_description: 'Updated description for integration test'
        },
        p_options: { project_id: testProjectId }
      })

      expect(error).toBeNull()
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.project_id).toBe(testProjectId)
    })
  })

  describe('Checkpoint Management', () => {
    test('should create a checkpoint for the project', async () => {
      const { data: result, error } = await supabase.rpc('hera_onboarding_checkpoint_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_checkpoint: {
          project_id: testProjectId,
          checkpoint_step: 'BEFORE_DATA_LOAD',
          checkpoint_name: 'Pre-Data Load Checkpoint',
          checkpoint_description: 'Checkpoint before loading customer data',
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

      expect(error).toBeNull()
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.checkpoint_id).toBeDefined()
      expect(result.project_id).toBe(testProjectId)
      expect(result.can_rollback_to).toBe(true)
      expect(result.snapshot_manifest).toBeDefined()

      testCheckpointId = result.checkpoint_id
    })

    test('should read the created checkpoint with full details', async () => {
      const { data: result, error } = await supabase.rpc('hera_onboarding_checkpoint_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_checkpoint: null,
        p_options: { checkpoint_id: testCheckpointId }
      })

      expect(error).toBeNull()
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.checkpoint).toBeDefined()
      expect(result.checkpoint.entity_name).toContain('Pre-Data Load Checkpoint')
      expect(result.checkpoint.dynamic_data).toBeDefined()
    })

    test('should validate rollback safety for the checkpoint', async () => {
      const { data: result, error } = await supabase.rpc('hera_onboarding_checkpoint_crud_v1', {
        p_action: 'VALIDATE_ROLLBACK',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_checkpoint: null,
        p_options: { checkpoint_id: testCheckpointId }
      })

      expect(error).toBeNull()
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.checkpoint_id).toBe(testCheckpointId)
      expect(result.rollback_assessment).toBeDefined()
      expect(result.rollback_assessment.is_safe).toBeDefined()
      expect(result.rollback_assessment.risk_score).toBeDefined()
      expect(result.rollback_assessment.risk_factors).toBeDefined()
    })
  })

  describe('Rollback Execution', () => {
    let rollbackRequestId: string

    test('should create a rollback request', async () => {
      const { data: result, error } = await supabase.rpc('hera_onboarding_rollback_execution_v1', {
        p_action: 'REQUEST_ROLLBACK',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_rollback_request: {
          checkpoint_id: testCheckpointId,
          rollback_reason: 'Data integrity issue detected during testing',
          org_code: 'TEST'
        },
        p_options: {}
      })

      expect(error).toBeNull()
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.rollback_request_id).toBeDefined()
      expect(result.checkpoint_id).toBe(testCheckpointId)
      expect(result.safety_assessment).toBeDefined()
      expect(result.approval_required).toBeDefined()

      rollbackRequestId = result.rollback_request_id
    })

    test('should list available rollback points for the project', async () => {
      const { data: result, error } = await supabase.rpc('hera_onboarding_rollback_execution_v1', {
        p_action: 'LIST_ROLLBACK_POINTS',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_rollback_request: null,
        p_options: { project_id: testProjectId }
      })

      expect(error).toBeNull()
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.project_id).toBe(testProjectId)
      expect(result.rollback_points).toBeDefined()
      expect(Array.isArray(result.rollback_points)).toBe(true)
    })

    test('should execute rollback (simulation)', async () => {
      const { data: result, error } = await supabase.rpc('hera_onboarding_rollback_execution_v1', {
        p_action: 'EXECUTE_ROLLBACK',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_rollback_request: null,
        p_options: { rollback_request_id: rollbackRequestId }
      })

      expect(error).toBeNull()
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.rollback_request_id).toBe(rollbackRequestId)
      expect(result.checkpoint_id).toBe(testCheckpointId)
      expect(result.rollback_completed_at).toBeDefined()
      expect(result.entities_affected).toBeDefined()
      expect(result.transactions_affected).toBeDefined()
      expect(result.downtime_seconds).toBeDefined()
    })
  })

  describe('Actor-Based Security', () => {
    test('should reject operations with null actor', async () => {
      const { data: result, error } = await supabase.rpc('hera_onboarding_project_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: null,
        p_organization_id: testOrgId,
        p_project: {
          project_name: 'Unauthorized Project',
          target_go_live_date: '2025-12-31'
        },
        p_options: {}
      })

      expect(error).toBeNull() // RPC doesn't error, returns error in result
      expect(result).toBeDefined()
      expect(result.success).toBe(false)
      expect(result.error_code).toBe('HERA_ACTOR_REQUIRED')
    })

    test('should reject operations with null organization', async () => {
      const { data: result, error } = await supabase.rpc('hera_onboarding_project_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: testUserId,
        p_organization_id: null,
        p_project: {
          project_name: 'Unauthorized Project',
          target_go_live_date: '2025-12-31'
        },
        p_options: {}
      })

      expect(error).toBeNull()
      expect(result).toBeDefined()
      expect(result.success).toBe(false)
      expect(result.error_code).toBe('HERA_ORG_REQUIRED')
    })
  })

  describe('Smart Code Validation', () => {
    test('should verify correct smart code patterns are generated', async () => {
      // Read the project to check smart codes
      const { data: result } = await supabase.rpc('hera_onboarding_project_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_project: null,
        p_options: { project_id: testProjectId }
      })

      expect(result.project.smart_code).toMatch(/^HERA\.ONBOARDING\.CORE\.PROJECT\..+\.v1$/)
      
      // Check checkpoint smart code
      const { data: checkpointResult } = await supabase.rpc('hera_onboarding_checkpoint_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_checkpoint: null,
        p_options: { checkpoint_id: testCheckpointId }
      })

      expect(checkpointResult.checkpoint.smart_code).toMatch(/^HERA\.ONBOARDING\.CORE\.CHECKPOINT\..+\.v1$/)
    })
  })

  afterAll(async () => {
    // Clean up test data
    if (testProjectId) {
      await supabase.rpc('hera_onboarding_project_crud_v1', {
        p_action: 'DELETE',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_project: null,
        p_options: { project_id: testProjectId }
      })
    }

    if (testCheckpointId) {
      await supabase.rpc('hera_onboarding_checkpoint_crud_v1', {
        p_action: 'DELETE',
        p_actor_user_id: testUserId,
        p_organization_id: testOrgId,
        p_checkpoint: null,
        p_options: { checkpoint_id: testCheckpointId }
      })
    }
  })
})