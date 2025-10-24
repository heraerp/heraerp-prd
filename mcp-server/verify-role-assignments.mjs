#!/usr/bin/env node
/**
 * Verify role assignments in database
 * Check that all salon users have correct roles in relationship_data
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SALON_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

const expectedRoles = [
  {
    email: 'hairtalkz2022@gmail.com',
    expectedRole: 'owner',
    userId: '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'
  },
  {
    email: 'hairtalkz01@gmail.com',
    expectedRole: 'receptionist',
    userId: '4578ce6d-db51-4838-9dc9-faca4cbe30bb'
  },
  {
    email: 'hairtalkz02@gmail.com',
    expectedRole: 'receptionist',
    userId: 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7'
  }
];

async function verifyRoles() {
  console.log('🔍 Verifying role assignments in database...\n');
  console.log(`📍 Organization: ${SALON_ORG_ID}\n`);

  let allCorrect = true;

  for (const user of expectedRoles) {
    console.log(`${'='.repeat(70)}`);
    console.log(`Email: ${user.email}`);
    console.log(`User ID: ${user.userId}`);
    console.log(`Expected Role: ${user.expectedRole}`);
    console.log('='.repeat(70));

    try {
      // Query the relationship
      const { data: relationships, error } = await supabase
        .from('core_relationships')
        .select('id, relationship_type, relationship_data, is_active, organization_id')
        .eq('from_entity_id', user.userId)
        .eq('to_entity_id', SALON_ORG_ID)
        .eq('relationship_type', 'MEMBER_OF');

      if (error) {
        console.log('❌ Query Error:', error.message);
        allCorrect = false;
        console.log();
        continue;
      }

      if (!relationships || relationships.length === 0) {
        console.log('❌ NO MEMBERSHIP FOUND');
        console.log('   User is not linked to the organization');
        allCorrect = false;
        console.log();
        continue;
      }

      const relationship = relationships[0];
      const actualRole = relationship.relationship_data?.role;

      console.log('\nRelationship Details:');
      console.log(`   ID: ${relationship.id}`);
      console.log(`   Type: ${relationship.relationship_type}`);
      console.log(`   Active: ${relationship.is_active}`);
      console.log(`   Organization: ${relationship.organization_id}`);
      console.log(`   Role in relationship_data: ${actualRole || 'null'}`);

      // Verify role
      if (actualRole === user.expectedRole) {
        console.log(`\n✅ ROLE CORRECT: ${actualRole}`);
      } else {
        console.log(`\n❌ ROLE MISMATCH:`);
        console.log(`   Expected: ${user.expectedRole}`);
        console.log(`   Actual: ${actualRole || 'null'}`);
        allCorrect = false;
      }

    } catch (err) {
      console.log('❌ Exception:', err.message);
      allCorrect = false;
    }

    console.log();
  }

  console.log('='.repeat(70));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(70));

  if (allCorrect) {
    console.log('\n✅ ALL ROLES CORRECTLY ASSIGNED IN DATABASE');
    console.log('\n💡 Safe to use database roles instead of client-side hardcoding');
    console.log('\n📋 Next Steps:');
    console.log('   1. Update salon-access/page.tsx to fetch role from API');
    console.log('   2. Remove hardcoded email-based role detection');
    console.log('   3. Use role from /api/v2/auth/resolve-membership response');
  } else {
    console.log('\n❌ SOME ROLES ARE INCORRECT OR MISSING');
    console.log('\n🔧 Fix with:');
    console.log('   node assign-salon-roles.mjs');
  }

  console.log();
}

verifyRoles().catch(console.error);
