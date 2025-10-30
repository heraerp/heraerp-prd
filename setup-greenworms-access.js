#!/usr/bin/env node

/**
 * HERA User Access Setup for Greenworms Organization
 * 
 * This script will:
 * 1. Check if Greenworms organization exists, create if needed
 * 2. Check if team@hanaset.com user exists in Supabase Auth
 * 3. Create user entity in platform organization if needed
 * 4. Assign user to Greenworms organization with admin role
 * 
 * Organization ID: d4f50007-269b-4525-b534-cb5ddeed1d7e
 * User Email: team@hanaset.com
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4'
);

const GREENWORMS_ORG_ID = 'd4f50007-269b-4525-b534-cb5ddeed1d7e';
const USER_EMAIL = 'team@hanaset.com';
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';
const SYSTEM_USER_ID = '9339bd4b-9112-422e-9fbf-d9af86199b63'; // HERA Platform Bootstrap

async function main() {
  console.log('🚀 HERA User Access Setup for Greenworms Organization');
  console.log('=====================================================\n');
  
  try {
    // Step 1: Check/Create Greenworms Organization
    console.log('1. Checking Greenworms organization...');
    const orgResult = await ensureGreenwormOrganization();
    if (!orgResult.success) {
      console.error('❌ Failed to ensure organization exists:', orgResult.error);
      return;
    }
    console.log('✅ Greenworms organization ready\n');

    // Step 2: Check/Create User in Supabase Auth
    console.log('2. Checking user in Supabase Auth...');
    const userResult = await ensureUserExists();
    if (!userResult.success) {
      console.error('❌ Failed to ensure user exists:', userResult.error);
      return;
    }
    console.log(`✅ User ready: ${userResult.user.id} (${userResult.user.email})\n`);

    // Step 3: Check/Create User Entity in Platform Organization
    console.log('3. Checking user entity in platform organization...');
    const entityResult = await ensureUserEntity(userResult.user.id, userResult.user.email);
    if (!entityResult.success) {
      console.error('❌ Failed to ensure user entity exists:', entityResult.error);
      return;
    }
    console.log(`✅ User entity ready: ${entityResult.entity_id}\n`);

    // Step 4: Assign User to Greenworms Organization
    console.log('4. Assigning user to Greenworms organization...');
    const assignResult = await assignUserToOrganization(userResult.user.id);
    if (!assignResult.success) {
      console.error('❌ Failed to assign user to organization:', assignResult.error);
      return;
    }
    console.log('✅ User successfully assigned to organization\n');

    // Step 5: Verify Assignment
    console.log('5. Verifying access...');
    const verifyResult = await verifyUserAccess(userResult.user.id);
    if (!verifyResult.success) {
      console.error('❌ Failed to verify access:', verifyResult.error);
      return;
    }
    console.log('✅ Access verified successfully\n');

    console.log('🎉 SUCCESS! User access setup complete');
    console.log('=====================================');
    console.log(`   Organization: Greenworms Waste Management`);
    console.log(`   Organization ID: ${GREENWORMS_ORG_ID}`);
    console.log(`   User Email: ${USER_EMAIL}`);
    console.log(`   User Role: admin`);
    console.log(`   User can now log in and access the Greenworms organization`);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

async function ensureGreenwormOrganization() {
  // Check if organization exists
  const { data: existing, error: checkError } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', GREENWORMS_ORG_ID)
    .maybeSingle();

  if (checkError) {
    return { success: false, error: checkError.message };
  }

  if (existing) {
    console.log(`   ✅ Organization exists: ${existing.organization_name}`);
    
    // Check if organization entity also exists
    const { data: existingEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', GREENWORMS_ORG_ID)
      .eq('entity_type', 'ORGANIZATION')
      .maybeSingle();
    
    if (!existingEntity) {
      console.log('   🚧 Creating missing organization entity...');
      const { data: orgEntity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          id: GREENWORMS_ORG_ID,
          organization_id: GREENWORMS_ORG_ID,
          entity_type: 'ORGANIZATION',
          entity_name: 'Greenworms Waste Management',
          entity_code: 'GREENWORMS',
          smart_code: 'HERA.PLATFORM.ORG.ENTITY.GREENWORMS.v1',
          status: 'active',
          metadata: {
            organization_type: 'waste_management',
            industry_classification: 'waste_management'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: SYSTEM_USER_ID,
          updated_by: SYSTEM_USER_ID
        })
        .select()
        .single();

      if (entityError) {
        console.warn(`   ⚠️ Organization entity creation failed: ${entityError.message}`);
      } else {
        console.log(`   ✅ Organization entity created: ${orgEntity.entity_name}`);
      }
    } else {
      console.log(`   ✅ Organization entity exists: ${existingEntity.entity_name}`);
    }
    
    return { success: true, organization: existing };
  }

  // Create organization
  console.log('   🚧 Creating Greenworms organization...');
  const { data: created, error: createError } = await supabase
    .from('core_organizations')
    .insert({
      id: GREENWORMS_ORG_ID,
      organization_name: 'Greenworms Waste Management',
      organization_code: 'GREENWORMS',
      organization_type: 'waste_management', 
      industry_classification: 'waste_management',
      status: 'active',
      settings: {
        subscription_tier: 'enterprise',
        features: ['waste_tracking', 'route_optimization', 'customer_portal']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: SYSTEM_USER_ID,
      updated_by: SYSTEM_USER_ID
    })
    .select()
    .single();

  if (createError) {
    return { success: false, error: createError.message };
  }

  console.log(`   ✅ Organization created: ${created.organization_name}`);
  
  // Also create organization entity for relationships
  console.log('   🚧 Creating organization entity...');
  const { data: orgEntity, error: entityError } = await supabase
    .from('core_entities')
    .insert({
      id: GREENWORMS_ORG_ID,
      organization_id: GREENWORMS_ORG_ID,
      entity_type: 'ORGANIZATION',
      entity_name: 'Greenworms Waste Management',
      entity_code: 'GREENWORMS',
      smart_code: 'HERA.PLATFORM.ORG.ENTITY.GREENWORMS.v1',
      status: 'active',
      metadata: {
        organization_type: 'waste_management',
        industry_classification: 'waste_management'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: SYSTEM_USER_ID,
      updated_by: SYSTEM_USER_ID
    })
    .select()
    .single();

  if (entityError) {
    console.warn(`   ⚠️ Organization entity creation failed: ${entityError.message}`);
  } else {
    console.log(`   ✅ Organization entity created: ${orgEntity.entity_name}`);
  }

  return { success: true, organization: created };
}

async function ensureUserExists() {
  // Check if user exists in Supabase Auth
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
      return { success: false, error: error.message };
    }

    const existingUser = users.users.find(user => user.email === USER_EMAIL);
    if (existingUser) {
      console.log(`   ✅ User exists in auth: ${existingUser.email}`);
      return { success: true, user: existingUser };
    }

    // Create user in Supabase Auth
    console.log('   🚧 Creating user in Supabase Auth...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: USER_EMAIL,
      password: 'TempPassword123!', // User should reset this on first login
      email_confirm: true,
      user_metadata: {
        full_name: 'Greenworms Admin'
      }
    });

    if (createError) {
      return { success: false, error: createError.message };
    }

    console.log(`   ✅ User created in auth: ${newUser.user.email}`);
    return { success: true, user: newUser.user };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function ensureUserEntity(authUserId, email) {
  // Check if user entity exists in platform organization
  const { data: existing, error: checkError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'USER')
    .eq('organization_id', PLATFORM_ORG_ID)
    .eq('metadata->>auth_user_id', authUserId)
    .maybeSingle();

  if (checkError) {
    return { success: false, error: checkError.message };
  }

  if (existing) {
    console.log(`   ✅ User entity exists: ${existing.entity_name}`);
    return { success: true, entity_id: existing.id };
  }

  // Create user entity in platform organization
  console.log('   🚧 Creating user entity in platform organization...');
  const { data: created, error: createError } = await supabase
    .from('core_entities')
    .insert({
      id: authUserId, // Use same ID as auth user for consistency
      organization_id: PLATFORM_ORG_ID,
      entity_type: 'USER',
      entity_name: 'Greenworms Admin',
      entity_code: email.split('@')[0], // Use email prefix as code
      smart_code: 'HERA.PLATFORM.USER.ENTITY.ADMIN.v1',
      status: 'active',
      metadata: {
        auth_user_id: authUserId,
        email: email,
        full_name: 'Greenworms Admin'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: SYSTEM_USER_ID,
      updated_by: SYSTEM_USER_ID
    })
    .select()
    .single();

  if (createError) {
    return { success: false, error: createError.message };
  }

  console.log(`   ✅ User entity created: ${created.entity_name}`);
  return { success: true, entity_id: created.id };
}

async function assignUserToOrganization(authUserId) {
  // Check if relationship already exists
  const { data: existing, error: checkError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', authUserId)
    .eq('to_entity_id', GREENWORMS_ORG_ID)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .maybeSingle();

  if (checkError) {
    return { success: false, error: checkError.message };
  }

  if (existing) {
    console.log(`   ✅ User already assigned with role: ${existing.relationship_data?.role || 'unknown'}`);
    return { success: true, data: existing };
  }

  // Create USER_MEMBER_OF_ORG relationship manually
  console.log('   🚧 Creating USER_MEMBER_OF_ORG relationship...');
  const { data: relationship, error: createError } = await supabase
    .from('core_relationships')
    .insert({
      organization_id: GREENWORMS_ORG_ID,
      from_entity_id: authUserId,
      to_entity_id: GREENWORMS_ORG_ID,
      relationship_type: 'USER_MEMBER_OF_ORG',
      relationship_direction: 'BIDIRECTIONAL',
      relationship_strength: 1.0,
      relationship_data: {
        role: 'admin',
        permissions: ["read", "write", "admin", "delete"],
        assigned_at: new Date().toISOString(),
        assigned_by: SYSTEM_USER_ID,
        status: 'active'
      },
      smart_code: 'HERA.PLATFORM.REL.USER_MEMBER_OF_ORG.v1',
      is_active: true,
      effective_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: SYSTEM_USER_ID,
      updated_by: SYSTEM_USER_ID,
      version: 1
    })
    .select()
    .single();

  if (createError) {
    return { success: false, error: createError.message };
  }

  // Note: Audit transaction creation skipped due to schema differences
  console.log(`   ℹ️ Relationship created without audit transaction (schema compatibility)`);

  console.log(`   ✅ User assigned with role: admin`);
  return { success: true, data: relationship };
}

async function verifyUserAccess(authUserId) {
  // Verify the relationship was created correctly
  const { data: relationships, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', authUserId)
    .eq('to_entity_id', GREENWORMS_ORG_ID)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG');

  if (relError) {
    return { success: false, error: relError.message };
  }

  if (relationships.length === 0) {
    return { success: false, error: 'No relationship found' };
  }

  const relationship = relationships[0];
  console.log(`   ✅ Relationship verified:`);
  console.log(`     - User ID: ${relationship.from_entity_id}`);
  console.log(`     - Organization ID: ${relationship.to_entity_id}`);
  console.log(`     - Relationship Type: ${relationship.relationship_type}`);
  console.log(`     - Role: ${relationship.relationship_data?.role || 'Unknown'}`);
  console.log(`     - Permissions: ${JSON.stringify(relationship.relationship_data?.permissions || [])}`);
  console.log(`     - Status: ${relationship.relationship_data?.status || 'Unknown'}`);
  console.log(`     - Active: ${relationship.is_active}`);
  console.log(`     - Created: ${relationship.created_at}`);

  return { success: true, relationship };
}

main().catch(console.error);