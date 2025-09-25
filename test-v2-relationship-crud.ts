/**
 * Test script for HERA V2 API - Relationship CRUD Operations
 * Run: npx tsx test-v2-relationship-crud.ts
 */

import { relationshipClientV2, relationshipHelpers } from './src/lib/v2/client/relationship-client';
import { v4 as uuidv4 } from 'uuid';

// Test configuration
const TEST_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || '11111111-1111-1111-1111-111111111111';
const BASE_URL = 'http://localhost:3000';

// Test entities (we'll create these first)
const entity1Id = uuidv4();
const entity2Id = uuidv4();
const statusEntityId = uuidv4();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const colorMap = {
    info: colors.cyan,
    success: colors.green,
    error: colors.red,
    warn: colors.yellow
  };
  console.log(`${colorMap[type]}${message}${colors.reset}`);
}

async function createTestEntities() {
  log('\n📦 Creating test entities...', 'info');

  // Note: In a real scenario, you'd use entityClientV2 to create these
  // For now, we'll assume they exist or create them manually

  log(`Entity 1 ID: ${entity1Id}`, 'info');
  log(`Entity 2 ID: ${entity2Id}`, 'info');
  log(`Status Entity ID: ${statusEntityId}`, 'info');

  return { entity1Id, entity2Id, statusEntityId };
}

async function testRelationshipCRUD() {
  log('\n🧪 Testing HERA V2 Relationship CRUD Operations\n', 'info');

  let createdRelationshipId: string | null = null;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Setup - Create test entities
    const entities = await createTestEntities();

    // Test 1: Upsert (Create) a new relationship
    log('\n1️⃣ Testing Relationship Upsert (Create)...', 'info');
    try {
      const createResult = await relationshipClientV2.upsert({
        organization_id: TEST_ORG_ID,
        from_entity_id: entities.entity1Id,
        to_entity_id: entities.entity2Id,
        relationship_type: 'parent_of',
        relationship_subtype: 'ownership',
        relationship_name: 'Test Parent-Child Relationship',
        relationship_code: `REL-TEST-${Date.now()}`,
        smart_code: 'HERA.TEST.REL.PARENT.CHILD.v1',
        is_active: true,
        effective_date: new Date().toISOString(),
        relationship_data: {
          ownership_percentage: 100,
          control_type: 'full'
        },
        metadata: {
          test_run: true,
          created_by: 'test_script'
        }
      });

      if (createResult.success) {
        createdRelationshipId = createResult.data.id;
        log(`✅ Relationship created with ID: ${createdRelationshipId}`, 'success');
        testsPassed++;
      } else {
        throw new Error(createResult.error || 'Failed to create relationship');
      }
    } catch (error) {
      log(`❌ Failed to create relationship: ${error}`, 'error');
      testsFailed++;
    }

    // Test 2: Read the created relationship
    if (createdRelationshipId) {
      log('\n2️⃣ Testing Relationship Read...', 'info');
      try {
        const readResult = await relationshipClientV2.read(TEST_ORG_ID, createdRelationshipId);

        if (readResult.success && readResult.data) {
          log(`✅ Relationship read successfully`, 'success');
          log(`   Type: ${readResult.data.relationship_type}`, 'info');
          log(`   From: ${readResult.data.from_entity_id}`, 'info');
          log(`   To: ${readResult.data.to_entity_id}`, 'info');
          testsPassed++;
        } else {
          throw new Error(readResult.error || 'Failed to read relationship');
        }
      } catch (error) {
        log(`❌ Failed to read relationship: ${error}`, 'error');
        testsFailed++;
      }
    }

    // Test 3: Query relationships
    log('\n3️⃣ Testing Relationship Query...', 'info');
    try {
      const queryResult = await relationshipClientV2.query({
        organization_id: TEST_ORG_ID,
        entity_id: entities.entity1Id,
        side: 'from',
        active_only: true,
        limit: 10
      });

      if (queryResult.success) {
        log(`✅ Query successful, found ${queryResult.data.length} relationships`, 'success');
        testsPassed++;
      } else {
        throw new Error(queryResult.error || 'Query failed');
      }
    } catch (error) {
      log(`❌ Failed to query relationships: ${error}`, 'error');
      testsFailed++;
    }

    // Test 4: Update the relationship (upsert with existing ID)
    if (createdRelationshipId) {
      log('\n4️⃣ Testing Relationship Update...', 'info');
      try {
        const updateResult = await relationshipClientV2.upsert({
          organization_id: TEST_ORG_ID,
          id: createdRelationshipId,
          from_entity_id: entities.entity1Id,
          to_entity_id: entities.entity2Id,
          relationship_type: 'parent_of',
          smart_code: 'HERA.TEST.REL.PARENT.CHILD.v1',
          relationship_data: {
            ownership_percentage: 75,
            control_type: 'majority',
            updated_at: new Date().toISOString()
          }
        });

        if (updateResult.success) {
          log(`✅ Relationship updated successfully`, 'success');
          testsPassed++;
        } else {
          throw new Error(updateResult.error || 'Failed to update');
        }
      } catch (error) {
        log(`❌ Failed to update relationship: ${error}`, 'error');
        testsFailed++;
      }
    }

    // Test 5: Create status relationship using helper
    log('\n5️⃣ Testing Status Relationship Helper...', 'info');
    try {
      const statusResult = await relationshipHelpers.createStatusRelationship(
        TEST_ORG_ID,
        entities.entity1Id,
        entities.statusEntityId,
        'HERA.WORKFLOW.STATUS.ACTIVE.v1'
      );

      if (statusResult.success) {
        log(`✅ Status relationship created`, 'success');
        testsPassed++;
      } else {
        throw new Error(statusResult.error || 'Failed to create status relationship');
      }
    } catch (error) {
      log(`❌ Failed to create status relationship: ${error}`, 'error');
      testsFailed++;
    }

    // Test 6: Batch upsert
    log('\n6️⃣ Testing Batch Upsert...', 'info');
    try {
      const batchResult = await relationshipClientV2.upsertBatch(TEST_ORG_ID, [
        {
          from_entity_id: entities.entity1Id,
          to_entity_id: uuidv4(),
          relationship_type: 'related_to',
          smart_code: 'HERA.TEST.REL.BATCH.v1',
          relationship_name: 'Batch Relationship 1'
        },
        {
          from_entity_id: entities.entity2Id,
          to_entity_id: uuidv4(),
          relationship_type: 'connected_with',
          smart_code: 'HERA.TEST.REL.BATCH.v1',
          relationship_name: 'Batch Relationship 2'
        }
      ]);

      if (batchResult.success || batchResult.status === 207) {
        const summary = batchResult.summary;
        log(`✅ Batch upsert completed: ${summary.success_count} succeeded, ${summary.error_count} failed`, 'success');
        testsPassed++;
      } else {
        throw new Error('Batch upsert failed');
      }
    } catch (error) {
      log(`❌ Failed batch upsert: ${error}`, 'error');
      testsFailed++;
    }

    // Test 7: Soft delete relationship
    if (createdRelationshipId) {
      log('\n7️⃣ Testing Relationship Delete (Soft)...', 'info');
      try {
        const deleteResult = await relationshipClientV2.delete(
          TEST_ORG_ID,
          createdRelationshipId,
          new Date().toISOString()
        );

        if (deleteResult.success) {
          log(`✅ Relationship soft deleted`, 'success');
          testsPassed++;
        } else {
          throw new Error(deleteResult.error || 'Failed to delete');
        }
      } catch (error) {
        log(`❌ Failed to delete relationship: ${error}`, 'error');
        testsFailed++;
      }

      // Verify deletion
      log('\n   Verifying soft deletion...', 'info');
      try {
        const verifyResult = await relationshipClientV2.read(TEST_ORG_ID, createdRelationshipId);
        if (verifyResult.success && verifyResult.data) {
          log(`   is_active: ${verifyResult.data.is_active}`, 'info');
          log(`   expiration_date: ${verifyResult.data.expiration_date}`, 'info');
        }
      } catch (error) {
        log(`   Could not verify deletion: ${error}`, 'warn');
      }
    }

    // Test 8: Query with various filters
    log('\n8️⃣ Testing Advanced Query Filters...', 'info');
    try {
      // Query all relationships for an entity
      const allRelationships = await relationshipHelpers.getEntityRelationships(
        TEST_ORG_ID,
        entities.entity1Id,
        false // Include inactive
      );

      log(`✅ Found ${allRelationships.data?.length || 0} total relationships for entity`, 'success');

      // Query parent-child relationships
      const parentChildRels = await relationshipHelpers.getParentChildRelationships(
        TEST_ORG_ID,
        entities.entity1Id,
        'parent_of'
      );

      log(`✅ Found ${parentChildRels.data?.length || 0} parent-child relationships`, 'success');
      testsPassed++;
    } catch (error) {
      log(`❌ Failed advanced queries: ${error}`, 'error');
      testsFailed++;
    }

  } catch (error) {
    log(`\n❌ Test suite error: ${error}`, 'error');
  }

  // Summary
  log('\n' + '='.repeat(50), 'info');
  log(`📊 Test Results Summary`, 'info');
  log(`✅ Passed: ${testsPassed}`, 'success');
  log(`❌ Failed: ${testsFailed}`, 'error');
  log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`, 'info');
  log('='.repeat(50), 'info');
}

// Run tests
log(`${colors.bright}🚀 HERA V2 Relationship CRUD Test Suite${colors.reset}`, 'info');
log(`Organization ID: ${TEST_ORG_ID}`, 'info');
log(`API Base URL: ${BASE_URL}`, 'info');

testRelationshipCRUD().catch(error => {
  log(`\n💥 Fatal error: ${error}`, 'error');
  process.exit(1);
});