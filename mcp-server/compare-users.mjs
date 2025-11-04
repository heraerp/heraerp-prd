#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function compareUsers() {
  console.log('🔍 Comparing WORKING vs NOT WORKING users...\n');

  const users = [
    {
      email: 'hairtalkz01@gmail.com',
      authUid: '4e1340cf-fefc-4d21-92ee-a8c4a244364b',
      label: '✅ WORKING'
    },
    {
      email: 'salon@heraerp.com',
      authUid: 'ebd0e099-e25a-476b-b6dc-4b3c26fae4a7',
      label: '❌ NOT WORKING'
    }
  ];

  for (const { email, authUid, label } of users) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${label}: ${email}`);
    console.log('='.repeat(70));

    // 1. Check USER entity mapping
    const { data: userEntities } = await supabase
      .from('core_entities')
      .select('id, entity_name, organization_id, metadata')
      .eq('entity_type', 'USER')
      .contains('metadata', { supabase_user_id: authUid });

    console.log(`\n1️⃣ USER Entity Mapping:`);
    if (!userEntities || userEntities.length === 0) {
      console.log(`   ⚠️ NO USER entity found with supabase_user_id: ${authUid}`);
      
      // Try alternative: check if there's a USER entity with ID = authUid
      const { data: directEntity } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', authUid)
        .eq('entity_type', 'USER')
        .single();
      
      if (directEntity) {
        console.log(`   ✅ FOUND USER entity with ID = auth UID (DIRECT MATCH)`);
        console.log(`      Entity ID: ${directEntity.id}`);
        console.log(`      Entity Name: ${directEntity.entity_name}`);
        console.log(`      Org ID: ${directEntity.organization_id}`);
        console.log(`      Metadata:`, JSON.stringify(directEntity.metadata, null, 2));
        
        // Use this entity for rest of checks
        userEntities[0] = directEntity;
      } else {
        console.log(`   ❌ NO USER entity found with ID = auth UID either`);
        continue;
      }
    } else {
      const userEntity = userEntities[0];
      console.log(`   ✅ Found USER entity via metadata lookup`);
      console.log(`      Auth UID: ${authUid}`);
      console.log(`      User Entity ID: ${userEntity.id}`);
      console.log(`      Entity Name: ${userEntity.entity_name}`);
      console.log(`      Org ID: ${userEntity.organization_id}`);
      console.log(`      Metadata:`, JSON.stringify(userEntity.metadata, null, 2));
    }

    const userEntityId = userEntities[0].id;

    // 2. Test introspect with USER entity ID
    const { data: introspectResult } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: userEntityId
    });

    console.log(`\n2️⃣ hera_auth_introspect_v1 (with user entity ID: ${userEntityId}):`);
    if (!introspectResult || !introspectResult.organizations || introspectResult.organizations.length === 0) {
      console.log(`   ❌ Returns 0 organizations`);
    } else {
      console.log(`   ✅ Returns ${introspectResult.organization_count} organization(s)`);
      introspectResult.organizations.forEach(org => {
        console.log(`      - ${org.name} (${org.code})`);
        console.log(`        Roles: ${org.roles?.join(', ')}`);
      });
    }

    // 3. Test introspect with AUTH UID (what would happen if API doesn't map)
    const { data: introspectWithAuthUid } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: authUid
    });

    console.log(`\n3️⃣ hera_auth_introspect_v1 (with auth UID: ${authUid}):`);
    if (!introspectWithAuthUid || !introspectWithAuthUid.organizations || introspectWithAuthUid.organizations.length === 0) {
      console.log(`   ❌ Returns 0 organizations (THIS IS THE BUG if API doesn't map)`);
    } else {
      console.log(`   ✅ Returns ${introspectWithAuthUid.organization_count} organization(s)`);
      introspectWithAuthUid.organizations.forEach(org => {
        console.log(`      - ${org.name} (${org.code})`);
        console.log(`        Roles: ${org.roles?.join(', ')}`);
      });
    }

    // 4. Check org assignment
    console.log(`\n4️⃣ Organization Assignment:`);
    console.log(`   USER entity org_id: ${userEntities[0].organization_id}`);
    if (userEntities[0].organization_id === '00000000-0000-0000-0000-000000000000') {
      console.log(`   ℹ️  Platform organization (standard for USER entities)`);
    }
  }

  console.log(`\n${'='.repeat(70)}\n`);
  console.log('🔍 KEY DIFFERENCE TO FIND:');
  console.log('   Why does hairtalkz01 work but demo doesnt?');
  console.log('   Both should have same USER entity structure...\n');
}

compareUsers().catch(console.error);
