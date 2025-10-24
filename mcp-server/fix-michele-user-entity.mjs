#!/usr/bin/env node

/**
 * Fix Michele's User Entity and Membership
 * Creates missing user entity and organization membership
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const USER_ID = '3ced4979-4c09-4e1e-8667-6707cfe6ec77';
const USER_EMAIL = 'michele@hairtalkz.ae';

async function fixMicheleUser() {
  console.log('🔧 Fixing Michele\'s User Entity and Membership');
  console.log('===============================================');
  console.log(`User ID: ${USER_ID}`);
  console.log(`Email: ${USER_EMAIL}`);
  console.log();

  try {
    // Step 1: Get the Hair Talkz organization
    console.log('1️⃣ Finding Hair Talkz organization...');
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('organization_name', 'Premium Hair & Beauty Salon')
      .single();

    if (orgError || !org) {
      console.log('❌ Could not find Hair Talkz organization');
      console.log('📋 Available organizations:');
      
      const { data: allOrgs } = await supabase
        .from('core_organizations')
        .select('id, organization_name, organization_type')
        .limit(5);
      
      allOrgs?.forEach(o => console.log(`  - ${o.organization_name} (${o.organization_type})`));
      return;
    }

    console.log('✅ Found organization:', {
      id: org.id,
      name: org.organization_name,
      type: org.organization_type
    });
    console.log();

    // Step 2: Create user entity in the organization
    console.log('2️⃣ Creating user entity...');
    
    // First check if user entity already exists
    const { data: existingUser } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .eq('smart_code', `HERA.PLATFORM.USER.ENTITY.${USER_ID.toUpperCase()}.V1`)
      .single();

    let userEntity;
    if (existingUser) {
      console.log('ℹ️ User entity already exists, updating...');
      userEntity = existingUser;
    } else {
      const userEntityData = {
        entity_type: 'user',
        entity_name: 'Michele Bellomo',
        smart_code: `HERA.PLATFORM.USER.ENTITY.${USER_ID.toUpperCase()}.V1`,
        organization_id: org.id,
        created_by: USER_ID,
        updated_by: USER_ID
      };

      const { data: newEntity, error: entityError } = await supabase
        .from('core_entities')
        .insert(userEntityData)
        .select()
        .single();

      if (entityError) {
        console.log('❌ Failed to create user entity:', entityError.message);
        return;
      }
      userEntity = newEntity;
    }

    console.log('✅ User entity created:', {
      id: userEntity.id,
      entity_name: userEntity.entity_name,
      smart_code: userEntity.smart_code
    });
    console.log();

    // Step 3: Create organization entity (if not exists)
    console.log('3️⃣ Ensuring organization entity exists...');
    
    const { data: existingOrg } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'organization')
      .eq('smart_code', `HERA.ORG.ENTITY.${org.id.toUpperCase()}.V1`)
      .single();

    let orgEntity;
    if (existingOrg) {
      console.log('ℹ️ Organization entity already exists');
      orgEntity = existingOrg;
    } else {
      const orgEntityData = {
        entity_type: 'organization',
        entity_name: org.organization_name,
        smart_code: `HERA.ORG.ENTITY.${org.id.toUpperCase()}.V1`,
        organization_id: org.id,
        created_by: USER_ID,
        updated_by: USER_ID
      };

      const { data: newOrgEntity, error: orgEntityError } = await supabase
        .from('core_entities')
        .insert(orgEntityData)
        .select()
        .single();

      if (orgEntityError) {
        console.log('❌ Failed to create org entity:', orgEntityError.message);
        return;
      }
      orgEntity = newOrgEntity;
    }

    console.log('✅ Organization entity ready:', {
      id: orgEntity.id,
      entity_name: orgEntity.entity_name
    });
    console.log();

    // Step 4: Create membership relationship
    console.log('4️⃣ Creating membership relationship...');
    
    const { data: existingMembership } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userEntity.id)
      .eq('to_entity_id', orgEntity.id)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .single();

    let membership;
    if (existingMembership) {
      console.log('ℹ️ Membership already exists');
      membership = existingMembership;
    } else {
      const membershipData = {
        from_entity_id: userEntity.id,
        to_entity_id: orgEntity.id,
        relationship_type: 'USER_MEMBER_OF_ORG',
        organization_id: org.id,
        created_by: USER_ID,
        updated_by: USER_ID
      };

      const { data: newMembership, error: membershipError } = await supabase
        .from('core_relationships')
        .insert(membershipData)
        .select()
        .single();

      if (membershipError) {
        console.log('❌ Failed to create membership:', membershipError.message);
        return;
      }
      membership = newMembership;
    }

    console.log('✅ Membership relationship created:', {
      id: membership.id,
      relationship_type: membership.relationship_type
    });
    console.log();

    // Step 5: Add user role data
    console.log('5️⃣ Adding user role data...');
    
    const { data: existingRole } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', userEntity.id)
      .eq('field_name', 'business_role')
      .single();

    let role;
    if (existingRole) {
      console.log('ℹ️ User role already exists');
      role = existingRole;
    } else {
      const roleData = {
        entity_id: userEntity.id,
        field_name: 'business_role',
        field_type: 'text',
        field_value_text: 'salon_manager',
        smart_code: 'HERA.USER.ROLE.SALON_MANAGER.V1',
        organization_id: org.id,
        created_by: USER_ID,
        updated_by: USER_ID
      };

      const { data: newRole, error: roleError } = await supabase
        .from('core_dynamic_data')
        .insert(roleData)
        .select()
        .single();

      if (roleError) {
        console.log('⚠️ Failed to add role data:', roleError.message);
      } else {
        role = newRole;
      }
    }

    if (role) {
      console.log('✅ User role data ready:', {
        field_name: role.field_name,
        field_value_text: role.field_value_text
      });
    }

    console.log();
    console.log('🎉 SUCCESS! Michele\'s user entity and membership fixed!');
    console.log('💡 The user should now be able to log in successfully.');
    console.log();
    console.log('📋 Summary:');
    console.log(`   User Entity ID: ${userEntity.id}`);
    console.log(`   Organization: ${org.organization_name}`);
    console.log(`   Membership ID: ${membership.id}`);

  } catch (error) {
    console.error('💥 Fix failed:', error);
  }
}

// Run the fix
await fixMicheleUser();