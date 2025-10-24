#!/usr/bin/env node
/**
 * Assign roles to salon users in relationship_data
 * Updates existing MEMBER_OF relationships with role metadata
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SALON_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

// User role assignments based on email
const userRoles = [
  {
    email: 'hairtalkz2022@gmail.com',
    role: 'owner',
    id: '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'
  },
  {
    email: 'hairtalkz01@gmail.com',
    role: 'receptionist',
    id: '4578ce6d-db51-4838-9dc9-faca4cbe30bb'
  },
  {
    email: 'hairtalkz02@gmail.com',
    role: 'receptionist',
    id: 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7'
  }
];

async function assignRoles() {
  console.log('🎭 Assigning roles to salon users...\n');
  console.log(`📍 Organization: ${SALON_ORG_ID}\n`);

  for (const user of userRoles) {
    console.log(`${'='.repeat(70)}`);
    console.log(`User: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`User ID: ${user.id}`);
    console.log('='.repeat(70));

    try {
      // Update the MEMBER_OF relationship with role in relationship_data
      const { data, error } = await supabase
        .from('core_relationships')
        .update({
          relationship_data: { role: user.role }
        })
        .eq('from_entity_id', user.id)
        .eq('to_entity_id', SALON_ORG_ID)
        .eq('relationship_type', 'MEMBER_OF')
        .select();

      if (error) {
        console.log('❌ Role assignment FAILED');
        console.log(`   Error: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log('✅ Role assigned SUCCESSFULLY');
        console.log(`   Relationship ID: ${data[0].id}`);
        console.log(`   Role stored: ${data[0].relationship_data?.role}`);
      } else {
        console.log('⚠️  No relationship found to update');
        console.log('   User may not be linked to organization');
      }
    } catch (err) {
      console.log('❌ Exception:', err.message);
    }

    console.log();
  }

  console.log('='.repeat(70));
  console.log('VERIFYING ROLE ASSIGNMENTS');
  console.log('='.repeat(70) + '\n');

  // Verify all roles are stored correctly
  for (const user of userRoles) {
    const { data, error } = await supabase
      .from('core_relationships')
      .select('id, relationship_type, relationship_data')
      .eq('from_entity_id', user.id)
      .eq('to_entity_id', SALON_ORG_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .single();

    if (data) {
      const storedRole = data.relationship_data?.role;
      const match = storedRole === user.role;
      console.log(`${match ? '✅' : '❌'} ${user.email}`);
      console.log(`   Expected: ${user.role}`);
      console.log(`   Stored: ${storedRole || 'null'}`);
      console.log();
    } else {
      console.log(`❌ ${user.email}`);
      console.log(`   Error: ${error?.message || 'No relationship found'}\n`);
    }
  }

  console.log('='.repeat(70));
  console.log('ROLE-BASED REDIRECTS');
  console.log('='.repeat(70) + '\n');

  console.log('👑 OWNER: hairtalkz2022@gmail.com');
  console.log('   Password: Hairtalkz2025!');
  console.log('   Redirect: /salon/owner/dashboard\n');

  console.log('📋 RECEPTIONIST: hairtalkz01@gmail.com');
  console.log('   Password: Hairtalkz');
  console.log('   Redirect: /salon/receptionist\n');

  console.log('📋 RECEPTIONIST: hairtalkz02@gmail.com');
  console.log('   Password: Hairtalkz');
  console.log('   Redirect: /salon/receptionist\n');

  console.log('🔗 Login at: http://localhost:3000/salon-access\n');
}

assignRoles().catch(console.error);
