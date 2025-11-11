#!/usr/bin/env node
/**
 * Create user membership in target organization
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';
const USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';
const TARGET_ORG_ID = 'ff837c4c-95f2-43ac-a498-39597018b10c';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createMembership() {
  console.log('🔗 Creating User Membership in Target Organization\n');
  
  console.log('📋 Configuration:');
  console.log(`   User ID: ${USER_ID}`);
  console.log(`   Target Org: ${TARGET_ORG_ID} (HERA Retail Demo)\n`);

  try {
    // Check if membership already exists
    console.log('1️⃣ Checking Existing Membership');
    console.log('=================================');
    
    const { data: existingMembership, error: checkError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('to_entity_id', TARGET_ORG_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .single();
      
    if (existingMembership && !checkError) {
      console.log('✅ Membership already exists!');
      console.log(`   Relationship ID: ${existingMembership.id}`);
      console.log(`   Status: ${existingMembership.relationship_status || 'active'}`);
      console.log(`   Created: ${existingMembership.created_at}`);
      console.log('\n🎯 No action needed - membership is active');
      return;
    } else {
      console.log('❌ No existing membership found');
      console.log('   Will create new membership...\n');
    }

    // Create membership relationship
    console.log('2️⃣ Creating Membership Relationship');
    console.log('====================================');
    
    const { data: newMembership, error: createError } = await supabase
      .from('core_relationships')
      .insert({
        from_entity_id: USER_ID,
        to_entity_id: TARGET_ORG_ID,
        relationship_type: 'USER_MEMBER_OF_ORG',
        smart_code: 'HERA.PLATFORM.USER.MEMBER.ORG.v1',
        organization_id: TARGET_ORG_ID,
        created_by: USER_ID,
        updated_by: USER_ID
      })
      .select()
      .single();
      
    if (createError) {
      console.error('❌ Error creating membership:', createError.message);
      return;
    }
    
    console.log('✅ Membership created successfully!');
    console.log(`   Relationship ID: ${newMembership.id}`);
    console.log(`   From: ${newMembership.from_entity_id} (User)`);
    console.log(`   To: ${newMembership.to_entity_id} (Organization)`);
    console.log(`   Type: ${newMembership.relationship_type}`);
    console.log(`   Status: ${newMembership.relationship_status}`);

    // Verify membership
    console.log('\n3️⃣ Verifying Membership');
    console.log('========================');
    
    const { data: verifyMembership, error: verifyError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('to_entity_id', TARGET_ORG_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG');
      
    if (verifyError) {
      console.error('❌ Error verifying membership:', verifyError.message);
    } else {
      console.log(`✅ Verification successful - Found ${verifyMembership.length} membership(s)`);
      verifyMembership.forEach(membership => {
        console.log(`   - ID: ${membership.id}`);
        console.log(`     Status: ${membership.relationship_status}`);
        console.log(`     Created: ${membership.created_at}`);
      });
    }

    console.log('\n🎉 MEMBERSHIP CREATION COMPLETE!');
    console.log('==================================');
    console.log('✅ User is now a member of HERA Retail Demo organization');
    console.log('✅ Ready to create PRODUCT entities');
    console.log('\n📝 Next Steps:');
    console.log('1. Re-run create-product-entities.mjs script');
    console.log('2. Should now work without HERA_ACTOR_NOT_MEMBER error');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

createMembership();