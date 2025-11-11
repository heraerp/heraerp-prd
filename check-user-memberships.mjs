#!/usr/bin/env node
/**
 * Check user memberships and organization details
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';
const DEFAULT_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';
const TARGET_ORG_ID = 'ff837c4c-95f2-43ac-a498-39597018b10c';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkMemberships() {
  console.log('🔍 Checking User Memberships and Organization Details\n');
  
  console.log('📋 Configuration:');
  console.log(`   User ID: ${DEFAULT_USER_ID}`);
  console.log(`   Target Org: ${TARGET_ORG_ID}\n`);

  try {
    // 1. Check if target organization exists
    console.log('1️⃣ Checking Target Organization');
    console.log('================================');
    
    const { data: targetOrg, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', TARGET_ORG_ID)
      .single();
      
    if (orgError || !targetOrg) {
      console.log('❌ Target organization not found!');
      console.log('   Error:', orgError?.message || 'Not found');
    } else {
      console.log('✅ Target organization found:');
      console.log(`   Name: ${targetOrg.organization_name}`);
      console.log(`   Type: ${targetOrg.organization_type || 'N/A'}`);
      console.log(`   Status: ${targetOrg.status || 'N/A'}`);
    }

    // 2. Check if user entity exists
    console.log('\n2️⃣ Checking User Entity');
    console.log('========================');
    
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', DEFAULT_USER_ID)
      .eq('entity_type', 'USER')
      .single();
      
    if (userError || !userEntity) {
      console.log('❌ User entity not found!');
      console.log('   Error:', userError?.message || 'Not found');
      
      // Check if there are any USER entities
      const { data: allUsers } = await supabase
        .from('core_entities')
        .select('id, entity_name, entity_code, organization_id')
        .eq('entity_type', 'USER')
        .limit(5);
        
      console.log(`\n📋 Available USER entities (showing first 5):`);
      allUsers?.forEach(user => {
        console.log(`   - ${user.entity_name} (${user.id}) - Org: ${user.organization_id}`);
      });
    } else {
      console.log('✅ User entity found:');
      console.log(`   Name: ${userEntity.entity_name}`);
      console.log(`   Code: ${userEntity.entity_code}`);
      console.log(`   Organization: ${userEntity.organization_id}`);
    }

    // 3. Check user memberships via relationships
    console.log('\n3️⃣ Checking User Memberships (Relationships)');
    console.log('============================================');
    
    const { data: memberships, error: memberError } = await supabase
      .from('core_relationships')
      .select(`
        *,
        target_org:to_entity_id(id, entity_name, entity_type)
      `)
      .eq('from_entity_id', DEFAULT_USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG');
      
    if (memberError) {
      console.log('❌ Error checking memberships:', memberError.message);
    } else if (!memberships || memberships.length === 0) {
      console.log('❌ No memberships found for this user');
    } else {
      console.log(`✅ Found ${memberships.length} membership(s):`);
      memberships.forEach(membership => {
        console.log(`   - Target: ${membership.to_entity_id}`);
        console.log(`     Status: ${membership.relationship_status || 'active'}`);
        console.log(`     Created: ${membership.created_at}`);
      });
    }

    // 4. Check if there are any users in the target organization
    console.log('\n4️⃣ Checking Users in Target Organization');
    console.log('========================================');
    
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('core_relationships')
      .select(`
        from_entity_id,
        user_entity:from_entity_id(id, entity_name, entity_type, organization_id)
      `)
      .eq('to_entity_id', TARGET_ORG_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG');
      
    if (orgUsersError) {
      console.log('❌ Error checking organization users:', orgUsersError.message);
    } else if (!orgUsers || orgUsers.length === 0) {
      console.log('❌ No users found in target organization');
      console.log('   This might explain the HERA_ACTOR_NOT_MEMBER error');
    } else {
      console.log(`✅ Found ${orgUsers.length} user(s) in target organization:`);
      orgUsers.forEach(orgUser => {
        console.log(`   - User ID: ${orgUser.from_entity_id}`);
        if (orgUser.user_entity) {
          console.log(`     Name: ${orgUser.user_entity.entity_name}`);
          console.log(`     User Org: ${orgUser.user_entity.organization_id}`);
        }
      });
      
      // Suggest using one of these users
      if (orgUsers.length > 0) {
        console.log(`\n💡 Suggestion: Use one of these user IDs instead of ${DEFAULT_USER_ID}`);
        console.log(`   Recommended: ${orgUsers[0].from_entity_id}`);
      }
    }

    // 5. Check all organizations available
    console.log('\n5️⃣ Available Organizations (showing first 10)');
    console.log('==============================================');
    
    const { data: allOrgs } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_type')
      .limit(10);
      
    allOrgs?.forEach(org => {
      const marker = org.id === TARGET_ORG_ID ? '🎯' : '  ';
      console.log(`${marker} ${org.organization_name} (${org.id})`);
    });

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkMemberships();