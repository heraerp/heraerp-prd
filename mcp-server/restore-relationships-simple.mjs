#!/usr/bin/env node
/**
 * Simple Relationship Restoration Script
 * Restores critical relationships using direct Supabase operations
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('🚨 SIMPLE RELATIONSHIP RESTORATION');
console.log('==================================');
console.log(`📍 Organization: ${ORG_ID}`);
console.log('');

async function checkCurrentState() {
  console.log('🔍 Checking current state...');
  
  const { data: relationships, error } = await supabase
    .from('core_relationships')
    .select('id')
    .eq('organization_id', ORG_ID);
    
  if (error) {
    console.log('❌ Error checking relationships:', error.message);
    return 0;
  }
  
  console.log(`📊 Current relationships: ${relationships?.length || 0}`);
  return relationships?.length || 0;
}

async function findUsersAndOrg() {
  console.log('🔍 Finding users and organization...');
  
  // Find users
  const { data: users, error: usersError } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'user');
    
  if (usersError) {
    console.log('❌ Error finding users:', usersError.message);
    return { users: [], orgEntity: null };
  }
  
  // Find organization entity
  const { data: orgEntities, error: orgError } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'organization')
    .limit(1);
    
  if (orgError) {
    console.log('❌ Error finding organization:', orgError.message);
    return { users: users || [], orgEntity: null };
  }
  
  console.log(`👥 Found ${users?.length || 0} users`);
  console.log(`🏢 Found organization entity: ${orgEntities?.[0]?.id ? 'Yes' : 'No'}`);
  
  return { 
    users: users || [], 
    orgEntity: orgEntities?.[0] || null 
  };
}

async function createStatusEntities() {
  console.log('📋 Creating status entities...');
  
  const statuses = [
    { name: 'active', color: '#10B981', description: 'Active and operational' },
    { name: 'inactive', color: '#6B7280', description: 'Inactive but available' },
    { name: 'draft', color: '#F59E0B', description: 'Draft status' },
    { name: 'pending', color: '#F59E0B', description: 'Pending approval' },
    { name: 'approved', color: '#10B981', description: 'Approved for use' },
    { name: 'completed', color: '#059669', description: 'Completed successfully' }
  ];
  
  const statusEntities = [];
  
  for (const status of statuses) {
    const entityCode = `STATUS-${status.name.toUpperCase()}`;
    
    // Check if it already exists
    const { data: existing } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', entityCode)
      .limit(1);
      
    if (existing && existing.length > 0) {
      console.log(`   ✅ Status '${status.name}' already exists`);
      statusEntities.push({ name: status.name, id: existing[0].id });
      continue;
    }
    
    // Create new status entity
    const { data: newStatus, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'workflow_status',
        entity_name: status.name,
        entity_code: entityCode,
        smart_code: `HERA.UNIVERSAL.WORKFLOW.STATUS.${status.name.toUpperCase()}.v1`,
        metadata: {
          color: status.color,
          description: status.description,
          restored: true
        }
      })
      .select('id')
      .single();
      
    if (error) {
      console.log(`   ❌ Error creating status '${status.name}':`, error.message);
    } else {
      console.log(`   ✅ Created status '${status.name}'`);
      statusEntities.push({ name: status.name, id: newStatus.id });
    }
  }
  
  return statusEntities;
}

async function restoreUserMemberships(users, orgEntity) {
  if (!orgEntity || users.length === 0) {
    console.log('⚠️ Cannot restore user memberships - missing users or org entity');
    return 0;
  }
  
  console.log('👥 Restoring user-organization memberships...');
  
  const memberships = users.map(user => ({
    organization_id: ORG_ID,
    from_entity_id: user.id,
    to_entity_id: orgEntity.id,
    relationship_type: 'user_member_of_org',
    smart_code: 'HERA.UNIVERSAL.MEMBERSHIP.USER.ORG.v1',
    metadata: {
      restored: true,
      restoration_date: new Date().toISOString(),
      reason: 'emergency_restoration_after_finance_dna_cleanup',
      user_name: user.entity_name
    }
  }));
  
  const { data, error } = await supabase
    .from('core_relationships')
    .insert(memberships)
    .select('id');
    
  if (error) {
    console.log('❌ Error restoring user memberships:', error.message);
    return 0;
  }
  
  console.log(`✅ Restored ${data?.length || 0} user memberships`);
  return data?.length || 0;
}

async function restoreStatusRelationships(statusEntities) {
  console.log('📋 Restoring status relationships...');
  
  // Find active status
  const activeStatus = statusEntities.find(s => s.name === 'active');
  if (!activeStatus) {
    console.log('❌ Active status not found, cannot assign statuses');
    return 0;
  }
  
  // Find entities that need status
  const { data: entities, error: entitiesError } = await supabase
    .from('core_entities')
    .select('id, entity_type')
    .eq('organization_id', ORG_ID)
    .in('entity_type', ['gl_account', 'customer', 'vendor', 'product', 'service', 'employee']);
    
  if (entitiesError) {
    console.log('❌ Error finding entities for status assignment:', entitiesError.message);
    return 0;
  }
  
  if (!entities || entities.length === 0) {
    console.log('⚠️ No entities found for status assignment');
    return 0;
  }
  
  // Create status relationships
  const statusRelationships = entities.map(entity => ({
    organization_id: ORG_ID,
    from_entity_id: entity.id,
    to_entity_id: activeStatus.id,
    relationship_type: 'has_status',
    smart_code: 'HERA.UNIVERSAL.WORKFLOW.STATUS.ASSIGN.v1',
    metadata: {
      restored: true,
      restoration_date: new Date().toISOString(),
      entity_type: entity.entity_type,
      default_status: 'active'
    }
  }));
  
  const { data, error } = await supabase
    .from('core_relationships')
    .insert(statusRelationships)
    .select('id');
    
  if (error) {
    console.log('❌ Error restoring status relationships:', error.message);
    return 0;
  }
  
  console.log(`✅ Restored ${data?.length || 0} status relationships`);
  return data?.length || 0;
}

async function restoreAccountHierarchy() {
  console.log('🏦 Restoring account hierarchy...');
  
  // Find GL accounts
  const { data: accounts, error: accountsError } = await supabase
    .from('core_entities')
    .select('id, entity_code')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'gl_account')
    .order('entity_code');
    
  if (accountsError) {
    console.log('❌ Error finding GL accounts:', accountsError.message);
    return 0;
  }
  
  if (!accounts || accounts.length === 0) {
    console.log('⚠️ No GL accounts found for hierarchy');
    return 0;
  }
  
  // Create parent-child relationships based on account codes
  const hierarchyRelationships = [];
  
  for (const parent of accounts) {
    for (const child of accounts) {
      if (parent.id !== child.id && 
          child.entity_code.startsWith(parent.entity_code) &&
          child.entity_code.length === parent.entity_code.length + 2) {
        
        hierarchyRelationships.push({
          organization_id: ORG_ID,
          from_entity_id: parent.id,
          to_entity_id: child.id,
          relationship_type: 'parent_of',
          smart_code: 'HERA.UNIVERSAL.HIERARCHY.ACCOUNT.PARENT.v1',
          metadata: {
            restored: true,
            restoration_date: new Date().toISOString(),
            parent_code: parent.entity_code,
            child_code: child.entity_code,
            hierarchy_type: 'chart_of_accounts'
          }
        });
      }
    }
  }
  
  if (hierarchyRelationships.length === 0) {
    console.log('⚠️ No account hierarchy relationships to create');
    return 0;
  }
  
  const { data, error } = await supabase
    .from('core_relationships')
    .insert(hierarchyRelationships)
    .select('id');
    
  if (error) {
    console.log('❌ Error restoring account hierarchy:', error.message);
    return 0;
  }
  
  console.log(`✅ Restored ${data?.length || 0} account hierarchy relationships`);
  return data?.length || 0;
}

async function verifyRestoration() {
  console.log('🔍 Verifying restoration...');
  
  const { data: finalCount, error } = await supabase
    .from('core_relationships')
    .select('id, relationship_type')
    .eq('organization_id', ORG_ID);
    
  if (error) {
    console.log('❌ Error verifying restoration:', error.message);
    return;
  }
  
  // Group by relationship type
  const typeCounts = {};
  finalCount?.forEach(rel => {
    typeCounts[rel.relationship_type] = (typeCounts[rel.relationship_type] || 0) + 1;
  });
  
  console.log(`📊 Total relationships: ${finalCount?.length || 0}`);
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
}

async function main() {
  try {
    console.log('Simple Relationship Restoration Started');
    console.log('=====================================');
    console.log('');
    
    // Check current state
    const initialCount = await checkCurrentState();
    console.log('');
    
    // Find users and organization
    const { users, orgEntity } = await findUsersAndOrg();
    console.log('');
    
    // Create status entities
    const statusEntities = await createStatusEntities();
    console.log('');
    
    // Restore relationships
    console.log('🔧 Restoring relationships...');
    let totalRestored = 0;
    
    totalRestored += await restoreUserMemberships(users, orgEntity);
    totalRestored += await restoreStatusRelationships(statusEntities);
    totalRestored += await restoreAccountHierarchy();
    
    console.log('');
    
    // Verify final state
    await verifyRestoration();
    console.log('');
    
    // Final summary
    console.log('🎯 RESTORATION SUMMARY');
    console.log('=====================');
    console.log(`📊 Initial relationships: ${initialCount}`);
    console.log(`✅ Relationships created: ${totalRestored}`);
    console.log('');
    
    if (totalRestored > 0) {
      console.log('🎉 RESTORATION SUCCESSFUL!');
      console.log('✅ Critical relationships have been restored');
      console.log('🚀 System should now be functional');
      console.log('');
      console.log('💡 Next steps:');
      console.log('   - Test user authentication');
      console.log('   - Verify Chart of Accounts hierarchy');
      console.log('   - Check entity status workflows');
      process.exit(0);
    } else {
      console.log('⚠️ NO RELATIONSHIPS RESTORED');
      console.log('💡 Check error messages above for issues');
      process.exit(1);
    }
    
  } catch (error) {
    console.log('');
    console.log('🔥 FATAL ERROR:', error.message);
    console.log('🔧 Please check database connection and permissions');
    process.exit(2);
  }
}

// Run the restoration
main();