#!/usr/bin/env node

/**
 * Check if Michele's user entity exists in production database
 * This will help determine if production uses a different DB
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const USER_ID = '3ced4979-4c09-4e1e-8667-6707cfe6ec77';

async function checkProductionDatabase() {
  console.log('🔍 Production Database Check');
  console.log('============================');
  console.log(`Target User: ${USER_ID}`);
  console.log();

  try {
    // Use same credentials as local to check if they point to same DB
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1️⃣ Checking database connection...');
    console.log(`   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

    // Check if we can access tables
    const { data: orgCount, error: orgError } = await supabase
      .from('core_organizations')
      .select('*', { count: 'exact', head: true });

    if (orgError) {
      console.log('❌ Cannot access core_organizations:', orgError.message);
      return;
    }

    console.log(`✅ Database accessible - ${orgCount} organizations found`);
    console.log();

    // Check specific user entity
    console.log('2️⃣ Checking Michele\'s user entity...');
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .eq('smart_code', `HERA.PLATFORM.USER.ENTITY.${USER_ID.toUpperCase()}.V1`);

    if (userError) {
      console.log('❌ User entity check failed:', userError.message);
      return;
    }

    if (!userEntity || userEntity.length === 0) {
      console.log('❌ Michele\'s user entity NOT FOUND in this database');
      console.log('💡 This suggests production might be using a DIFFERENT database');
      console.log();
      
      // Check what organizations exist
      console.log('📋 Available organizations in this database:');
      const { data: orgs } = await supabase
        .from('core_organizations')
        .select('id, organization_name, organization_type')
        .limit(10);
      
      orgs?.forEach((org, i) => {
        console.log(`   ${i + 1}. ${org.organization_name} (${org.organization_type})`);
      });
    } else {
      console.log('✅ Michele\'s user entity FOUND:', {
        id: userEntity[0].id,
        name: userEntity[0].entity_name,
        org_id: userEntity[0].organization_id
      });

      // Check membership
      console.log();
      console.log('3️⃣ Checking membership...');
      const { data: membership, error: membershipError } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('from_entity_id', userEntity[0].id)
        .eq('relationship_type', 'USER_MEMBER_OF_ORG');

      if (membershipError) {
        console.log('❌ Membership check failed:', membershipError.message);
      } else if (!membership || membership.length === 0) {
        console.log('❌ No membership found for Michele');
      } else {
        console.log('✅ Membership found:', {
          id: membership[0].id,
          target_org: membership[0].to_entity_id
        });
      }
    }

    console.log();
    console.log('4️⃣ Environment Analysis:');
    console.log('   Current database appears to be:', 
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('awfcrncxngqwbhqapffb') ? 'LOCAL/DEV' : 'UNKNOWN'
    );
    
    console.log();
    console.log('🎯 If user entity is missing, production likely uses different env vars:');
    console.log('   • NEXT_PUBLIC_SUPABASE_URL might be different in production');
    console.log('   • SUPABASE_SERVICE_ROLE_KEY might point to different project');
    console.log('   • Production might need environment-specific user setup');

  } catch (error) {
    console.error('💥 Database check failed:', error.message);
  }
}

await checkProductionDatabase();