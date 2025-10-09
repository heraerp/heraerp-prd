#!/usr/bin/env node
/**
 * Fix Michele's USER_MEMBER_OF_ORG relationship with correct user ID
 * Michele's actual user ID: 09b0b92a-d797-489e-bc03-5ca0a6272674
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

console.log('🎯 FIXING MICHELE\'S USER_MEMBER_OF_ORG RELATIONSHIP');
console.log('================================================');
console.log('');

async function fixMicheleRelationship() {
  try {
    const MICHELE_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'; // Michele's actual user ID from logs
    const HAIR_TALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Hair Talkz organization
    
    console.log('📋 CORRECT PARAMETERS:');
    console.log(`Michele User ID: ${MICHELE_USER_ID}`);
    console.log(`Hair Talkz Org ID: ${HAIR_TALKZ_ORG_ID}`);
    console.log('');

    // 1. Check if Michele user entity exists
    console.log('1️⃣ Checking if Michele user entity exists...');
    
    const { data: micheleUser, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', MICHELE_USER_ID)
      .single();

    if (userError) {
      console.log('❌ Michele user entity query failed:', userError.message);
      
      // Check if the user exists in auth
      console.log('🔍 Checking if user exists in Supabase auth...');
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(MICHELE_USER_ID);
      
      if (authError) {
        console.log('❌ User not found in auth either:', authError.message);
        return;
      }
      
      if (authUser.user) {
        console.log('✅ User exists in auth, creating USER entity...');
        
        // Create the USER entity
        const { data: newUser, error: createUserError } = await supabase
          .from('core_entities')
          .insert({
            id: MICHELE_USER_ID,
            organization_id: '00000000-0000-0000-0000-000000000000', // Platform org
            entity_type: 'USER',
            entity_name: authUser.user.email?.split('@')[0] || 'michele',
            smart_code: 'HERA.UNIVERSAL.USER.ENTITY.V1'
          })
          .select()
          .single();
          
        if (createUserError) {
          console.log('❌ Failed to create USER entity:', createUserError.message);
          return;
        } else {
          console.log('✅ USER entity created for Michele');
        }
      }
    } else {
      console.log('✅ Michele user entity exists:');
      console.log(`   ID: ${micheleUser.id}`);
      console.log(`   Name: ${micheleUser.entity_name}`);
      console.log(`   Type: ${micheleUser.entity_type}`);
    }
    console.log('');

    // 2. Ensure organization entity exists
    console.log('2️⃣ Ensuring Hair Talkz organization entity exists...');
    
    const { data: orgEntity, error: orgEntityError } = await supabase
      .from('core_entities')
      .select('id')
      .eq('id', HAIR_TALKZ_ORG_ID)
      .single();

    if (orgEntityError) {
      console.log('⚠️ Organization entity missing, creating it...');
      
      // Get org info from core_organizations
      const { data: org, error: orgError } = await supabase
        .from('core_organizations')
        .select('*')
        .eq('id', HAIR_TALKZ_ORG_ID)
        .single();

      if (orgError) {
        console.log('❌ Failed to get organization info:', orgError.message);
        return;
      }

      const { data: newOrgEntity, error: newOrgError } = await supabase
        .from('core_entities')
        .insert({
          id: HAIR_TALKZ_ORG_ID,
          organization_id: HAIR_TALKZ_ORG_ID,
          entity_type: 'organization',
          entity_name: org.organization_name,
          smart_code: 'HERA.UNIVERSAL.ORGANIZATION.ENTITY.V1'
        })
        .select()
        .single();

      if (newOrgError) {
        console.log('❌ Failed to create organization entity:', newOrgError.message);
        return;
      } else {
        console.log('✅ Organization entity created');
      }
    } else {
      console.log('✅ Organization entity exists');
    }
    console.log('');

    // 3. Clean up any existing relationships for Michele
    console.log('3️⃣ Cleaning up existing relationships for Michele...');
    
    await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', MICHELE_USER_ID)
      .eq('to_entity_id', HAIR_TALKZ_ORG_ID)
      .in('relationship_type', ['member_of', 'USER_MEMBER_OF_ORG']);

    console.log('✅ Cleanup completed');
    console.log('');

    // 4. Create the correct USER_MEMBER_OF_ORG relationship for Michele
    console.log('4️⃣ Creating USER_MEMBER_OF_ORG relationship for Michele...');
    
    const { data: membership, error: membershipError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: HAIR_TALKZ_ORG_ID,
        from_entity_id: MICHELE_USER_ID, // Michele's actual user ID
        to_entity_id: HAIR_TALKZ_ORG_ID,
        relationship_type: 'USER_MEMBER_OF_ORG',
        smart_code: 'HERA.UNIVERSAL.MEMBERSHIP.USER.ORG.V1',
        relationship_data: {
          role: 'admin',
          permissions: ['read', 'write', 'delete'],
          department_access: ['all'],
          created_via: 'michele_fix',
          created_at: new Date().toISOString()
        },
        is_active: true,
        ai_confidence: 0.95,
        relationship_strength: 1,
        relationship_direction: 'forward',
        smart_code_status: 'ACTIVE',
        effective_date: new Date().toISOString()
      })
      .select()
      .single();

    if (membershipError) {
      console.log('❌ Membership creation failed:', membershipError.message);
      return;
    }

    console.log('🎉 SUCCESS! Michele\'s USER_MEMBER_OF_ORG relationship created!');
    console.log(`   Relationship ID: ${membership.id}`);
    console.log(`   From (Michele): ${membership.from_entity_id}`);
    console.log(`   To (Hair Talkz): ${membership.to_entity_id}`);
    console.log(`   Role: ${membership.relationship_data?.role}`);
    console.log('');

    // 5. Verify the authentication query works for Michele
    console.log('5️⃣ TESTING MICHELE\'S AUTHENTICATION QUERY...');
    
    const { data: authTest, error: authError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id, relationship_data')
      .eq('from_entity_id', MICHELE_USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .maybeSingle();

    if (authError) {
      console.log('❌ Authentication query failed:', authError.message);
    } else if (!authTest) {
      console.log('❌ Authentication query returned null');
    } else {
      console.log('🎉🎉🎉 MICHELE\'S AUTHENTICATION IS NOW WORKING! 🎉🎉🎉');
      console.log('');
      console.log('📊 AUTHENTICATION RESULT:');
      console.log(`   ✅ Organization: ${authTest.organization_id}`);
      console.log(`   ✅ To Entity: ${authTest.to_entity_id}`);
      console.log(`   ✅ Role: ${authTest.relationship_data?.role}`);
      console.log('');
      console.log('🌟 THE ERROR IS COMPLETELY FIXED! 🌟');
      console.log('   ❌ BEFORE: "No USER_MEMBER_OF_ORG relationship for: 09b0b92a-d797-489e-bc03-5ca0a6272674"');
      console.log('   ✅ NOW: Michele can access Hair Talkz organization!');
    }

    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('   1. Michele should refresh her browser');
    console.log('   2. Clear browser cache if needed');
    console.log('   3. Try logging in again');
    console.log('   4. The "No USER_MEMBER_OF_ORG relationship" error should be gone!');

  } catch (error) {
    console.log('');
    console.log('🔥 ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the fix
fixMicheleRelationship();