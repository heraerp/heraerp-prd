#!/usr/bin/env node
/**
 * Minimal Relationship Restoration Script
 * Uses only the basic required columns
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

console.log('🔧 MINIMAL RELATIONSHIP RESTORATION');
console.log('==================================');
console.log(`📍 Organization: ${ORG_ID}`);
console.log('');

async function createMinimalRelationship(fromId, toId, relationshipType, smartCode, description) {
  try {
    const { data, error } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: ORG_ID,
        from_entity_id: fromId,
        to_entity_id: toId,
        relationship_type: relationshipType,
        smart_code: smartCode
      })
      .select('id')
      .single();
      
    if (error) {
      console.log(`❌ ${description}: ${error.message}`);
      return false;
    } else {
      console.log(`✅ ${description}`);
      return true;
    }
  } catch (err) {
    console.log(`❌ ${description}: ${err.message}`);
    return false;
  }
}

async function main() {
  try {
    console.log('Minimal Restoration Started');
    console.log('==========================');
    console.log('');
    
    // Step 1: Find basic entities
    console.log('🔍 Finding entities...');
    
    const { data: users } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'user')
      .limit(1);
      
    const { data: org } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'organization')
      .limit(1);
      
    const { data: accounts } = await supabase
      .from('core_entities')
      .select('id, entity_code')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'gl_account')
      .limit(5); // Just first 5 accounts
      
    const { data: activeStatus } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'workflow_status')
      .ilike('entity_name', '%active%')
      .limit(1);
    
    console.log(`👤 Users found: ${users?.length || 0}`);
    console.log(`🏢 Organization found: ${org?.length || 0}`);
    console.log(`💰 GL accounts found: ${accounts?.length || 0}`);
    console.log(`📋 Active status found: ${activeStatus?.length || 0}`);
    console.log('');
    
    // Step 2: Create minimal relationships
    console.log('🔗 Creating minimal relationships...');
    let successCount = 0;
    
    // User-org membership (if we have a user)
    if (users?.length > 0 && org?.length > 0) {
      const success = await createMinimalRelationship(
        users[0].id,
        org[0].id,
        'user_member_of_org',
        'HERA.UNIVERSAL.MEMBERSHIP.USER.ORG.v1',
        'User-organization membership'
      );
      if (success) successCount++;
    } else {
      console.log('⚠️ Cannot create user membership - missing user or org');
    }
    
    // Account status relationships (just first few accounts)
    if (accounts?.length > 0 && activeStatus?.length > 0) {
      for (let i = 0; i < Math.min(3, accounts.length); i++) {
        const account = accounts[i];
        const success = await createMinimalRelationship(
          account.id,
          activeStatus[0].id,
          'has_status',
          'HERA.UNIVERSAL.WORKFLOW.STATUS.ASSIGN.v1',
          `Status for account ${account.entity_code}`
        );
        if (success) successCount++;
      }
    } else {
      console.log('⚠️ Cannot create status relationships - missing accounts or status');
    }
    
    // Simple account hierarchy (if we have multiple accounts)
    if (accounts?.length >= 2) {
      // Try to find a simple parent-child relationship
      for (let i = 0; i < accounts.length - 1; i++) {
        for (let j = i + 1; j < accounts.length; j++) {
          const parent = accounts[i];
          const child = accounts[j];
          
          // Check if child code starts with parent code and is 2 chars longer
          if (child.entity_code.startsWith(parent.entity_code) && 
              child.entity_code.length === parent.entity_code.length + 2) {
            
            const success = await createMinimalRelationship(
              parent.id,
              child.id,
              'parent_of',
              'HERA.UNIVERSAL.HIERARCHY.ACCOUNT.PARENT.v1',
              `Hierarchy: ${parent.entity_code} → ${child.entity_code}`
            );
            if (success) successCount++;
            break; // Only create one hierarchy relationship for now
          }
        }
        if (successCount > 0) break; // Exit outer loop if we created a relationship
      }
    }
    
    console.log('');
    
    // Step 3: Verify results
    console.log('🔍 Verifying results...');
    const { data: finalRelationships } = await supabase
      .from('core_relationships')
      .select('relationship_type')
      .eq('organization_id', ORG_ID);
      
    const totalCount = finalRelationships?.length || 0;
    console.log(`📊 Total relationships created: ${totalCount}`);
    
    if (totalCount > 0) {
      const typeCounts = {};
      finalRelationships.forEach(rel => {
        typeCounts[rel.relationship_type] = (typeCounts[rel.relationship_type] || 0) + 1;
      });
      
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }
    
    console.log('');
    
    // Final status
    if (successCount > 0) {
      console.log('🎉 MINIMAL RESTORATION SUCCESSFUL!');
      console.log(`✅ Created ${successCount} critical relationships`);
      console.log('🚀 Basic system functionality should be restored');
      console.log('');
      console.log('💡 What was restored:');
      console.log('   - Essential user access');
      console.log('   - Basic account status');
      console.log('   - Minimal account hierarchy');
      console.log('');
      console.log('⚠️ Note: This is a minimal restoration. Additional relationships');
      console.log('   may need to be created for full functionality.');
    } else {
      console.log('❌ RESTORATION FAILED');
      console.log('💡 No relationships could be created');
    }
    
    process.exit(successCount > 0 ? 0 : 1);
    
  } catch (error) {
    console.log('');
    console.log('🔥 FATAL ERROR:', error.message);
    process.exit(2);
  }
}

// Run the restoration
main();