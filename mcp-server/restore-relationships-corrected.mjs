#!/usr/bin/env node
/**
 * Corrected Relationship Restoration Script
 * Uses actual core_relationships table schema
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('🔧 CORRECTED RELATIONSHIP RESTORATION');
console.log('====================================');
console.log(`📍 Organization: ${ORG_ID}`);
console.log('');

async function checkCurrentState() {
  console.log('🔍 Checking current state...');
  
  const { data: relationships, error } = await supabase
    .from('core_relationships')
    .select('id')
    .eq('organization_id', ORG_ID);
    
  console.log(`📊 Current relationships: ${relationships?.length || 0}`);
  return relationships?.length || 0;
}

async function findGLAccounts() {
  console.log('🏦 Finding GL accounts for hierarchy...');
  
  const { data: accounts, error } = await supabase
    .from('core_entities')
    .select('id, entity_code, entity_name')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'gl_account')
    .order('entity_code');
    
  if (error) {
    console.log('❌ Error finding GL accounts:', error.message);
    return [];
  }
  
  console.log(`💰 Found ${accounts?.length || 0} GL accounts`);
  return accounts || [];
}

async function findStatusEntities() {
  console.log('📋 Finding status entities...');
  
  const { data: statuses, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'workflow_status');
    
  if (error) {
    console.log('❌ Error finding status entities:', error.message);
    return [];
  }
  
  console.log(`📋 Found ${statuses?.length || 0} status entities`);
  return statuses || [];
}

async function restoreAccountStatusRelationships(accounts, statuses) {
  console.log('🔗 Restoring account status relationships...');
  
  const activeStatus = statuses.find(s => s.entity_name === 'active' || s.entity_code === 'STATUS-ACTIVE');
  
  if (!activeStatus) {
    console.log('❌ Active status not found');
    return 0;
  }
  
  if (accounts.length === 0) {
    console.log('⚠️ No GL accounts to assign status to');
    return 0;
  }
  
  // Create status relationships using actual schema
  const statusRelationships = accounts.map(account => ({
    organization_id: ORG_ID,
    from_entity_id: account.id,
    to_entity_id: activeStatus.id,
    relationship_type: 'has_status',
    smart_code: 'HERA.UNIVERSAL.WORKFLOW.STATUS.ASSIGN.v1',
    context: {
      restored: true,
      restoration_date: new Date().toISOString(),
      account_code: account.entity_code,
      account_name: account.entity_name
    },
    status: 'ACTIVE',
    is_active: true,
    strength: 1.0
  }));
  
  let successCount = 0;
  let errorCount = 0;
  
  // Insert in batches to avoid issues
  for (const relationship of statusRelationships) {
    try {
      const { data, error } = await supabase
        .from('core_relationships')
        .insert(relationship)
        .select('id')
        .single();
        
      if (error) {
        console.log(`❌ Error creating status relationship for ${relationship.from_entity_id}: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Exception creating status relationship: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`✅ Created ${successCount} status relationships (${errorCount} errors)`);
  return successCount;
}

async function restoreAccountHierarchy(accounts) {
  console.log('🏗️ Restoring account hierarchy...');
  
  if (accounts.length < 2) {
    console.log('⚠️ Need at least 2 accounts for hierarchy');
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
          context: {
            restored: true,
            restoration_date: new Date().toISOString(),
            parent_code: parent.entity_code,
            child_code: child.entity_code,
            hierarchy_type: 'chart_of_accounts'
          },
          status: 'ACTIVE',
          is_active: true,
          strength: 1.0
        });
      }
    }
  }
  
  if (hierarchyRelationships.length === 0) {
    console.log('⚠️ No hierarchy relationships found to create');
    return 0;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  // Insert hierarchy relationships
  for (const relationship of hierarchyRelationships) {
    try {
      const { data, error } = await supabase
        .from('core_relationships')
        .insert(relationship)
        .select('id')
        .single();
        
      if (error) {
        console.log(`❌ Error creating hierarchy relationship: ${error.message}`);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Exception creating hierarchy relationship: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`✅ Created ${successCount} hierarchy relationships (${errorCount} errors)`);
  return successCount;
}

async function createBasicUserEntity() {
  console.log('👤 Creating basic user entity (if needed)...');
  
  // Check if there are any users
  const { data: existingUsers } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'user')
    .limit(1);
    
  if (existingUsers && existingUsers.length > 0) {
    console.log('✅ User entity already exists');
    return existingUsers[0];
  }
  
  // Create a basic user entity
  const { data: newUser, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: ORG_ID,
      entity_type: 'user',
      entity_name: 'System User',
      entity_code: 'USER-SYSTEM',
      smart_code: 'HERA.UNIVERSAL.USER.SYSTEM.v1'
    })
    .select('id')
    .single();
    
  if (error) {
    console.log('❌ Error creating user entity:', error.message);
    return null;
  }
  
  console.log('✅ Created basic user entity');
  return newUser;
}

async function createUserOrgMembership(userEntity) {
  if (!userEntity) {
    console.log('⚠️ No user entity to create membership for');
    return 0;
  }
  
  console.log('🔗 Creating user-organization membership...');
  
  // Find organization entity
  const { data: orgEntity, error: orgError } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'organization')
    .limit(1)
    .single();
    
  if (orgError || !orgEntity) {
    console.log('❌ Organization entity not found');
    return 0;
  }
  
  // Create membership relationship
  const { data, error } = await supabase
    .from('core_relationships')
    .insert({
      organization_id: ORG_ID,
      from_entity_id: userEntity.id,
      to_entity_id: orgEntity.id,
      relationship_type: 'user_member_of_org',
      smart_code: 'HERA.UNIVERSAL.MEMBERSHIP.USER.ORG.v1',
      context: {
        restored: true,
        restoration_date: new Date().toISOString(),
        membership_type: 'system_user'
      },
      status: 'ACTIVE',
      is_active: true,
      strength: 1.0
    })
    .select('id')
    .single();
    
  if (error) {
    console.log('❌ Error creating user membership:', error.message);
    return 0;
  }
  
  console.log('✅ Created user-organization membership');
  return 1;
}

async function verifyRestoration() {
  console.log('🔍 Verifying restoration...');
  
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select('relationship_type')
    .eq('organization_id', ORG_ID);
    
  // Group by relationship type
  const typeCounts = {};
  relationships?.forEach(rel => {
    typeCounts[rel.relationship_type] = (typeCounts[rel.relationship_type] || 0) + 1;
  });
  
  console.log(`📊 Total relationships: ${relationships?.length || 0}`);
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });
  
  return relationships?.length || 0;
}

async function main() {
  try {
    console.log('Corrected Relationship Restoration Started');
    console.log('========================================');
    console.log('');
    
    // Check current state
    const initialCount = await checkCurrentState();
    console.log('');
    
    // Find data for restoration
    const accounts = await findGLAccounts();
    const statuses = await findStatusEntities();
    console.log('');
    
    // Perform restoration
    console.log('🔧 Starting restoration...');
    let totalRestored = 0;
    
    // Create user entity and membership
    const userEntity = await createBasicUserEntity();
    totalRestored += await createUserOrgMembership(userEntity);
    
    // Restore account relationships
    totalRestored += await restoreAccountStatusRelationships(accounts, statuses);
    totalRestored += await restoreAccountHierarchy(accounts);
    
    console.log('');
    
    // Verify final state
    const finalCount = await verifyRestoration();
    console.log('');
    
    // Final summary
    console.log('🎯 RESTORATION SUMMARY');
    console.log('=====================');
    console.log(`📊 Initial relationships: ${initialCount}`);
    console.log(`✅ Relationships created: ${totalRestored}`);
    console.log(`📈 Final relationships: ${finalCount}`);
    console.log('');
    
    if (totalRestored > 0) {
      console.log('🎉 RESTORATION SUCCESSFUL!');
      console.log('✅ Critical relationships have been restored');
      console.log('🚀 System should now be functional');
      console.log('');
      console.log('💡 Restored:');
      console.log('   - User-organization membership');
      console.log('   - GL account status relationships');
      console.log('   - Chart of accounts hierarchy');
    } else {
      console.log('⚠️ NO RELATIONSHIPS RESTORED');
      console.log('💡 Check error messages above');
    }
    
    process.exit(totalRestored > 0 ? 0 : 1);
    
  } catch (error) {
    console.log('');
    console.log('🔥 FATAL ERROR:', error.message);
    console.log('🔧 Check database connection and permissions');
    process.exit(2);
  }
}

// Run the restoration
main();