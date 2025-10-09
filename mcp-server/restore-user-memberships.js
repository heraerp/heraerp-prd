import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function restoreUserMemberships() {
  console.log('👥 RESTORING USER-ORGANIZATION MEMBERSHIPS');
  console.log('=' .repeat(60) + '\n');

  const targetOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
  const platformOrgId = '00000000-0000-0000-0000-000000000000';

  try {
    // Step 1: Find existing users in platform organization
    console.log('1. FINDING USERS IN PLATFORM ORGANIZATION:');
    const { data: users, error: usersError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, metadata')
      .eq('organization_id', platformOrgId)
      .eq('entity_type', 'user');

    if (usersError) {
      console.error('Error finding users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('   ❌ No users found in platform organization');
      console.log('   Creating a demo user first...');
      
      // Create a demo user if none exists
      const { data: newUser, error: createUserError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: platformOrgId,
          entity_type: 'user',
          entity_name: 'Demo User',
          entity_code: 'USER-DEMO-001',
          smart_code: 'HERA.AUTH.USER.PROFILE.v1',
          metadata: {
            email: 'demo@example.com',
            role: 'admin',
            active: true
          }
        })
        .select()
        .single();

      if (createUserError) {
        console.error('Error creating demo user:', createUserError);
        return;
      }

      console.log('   ✅ Created demo user:', newUser.entity_name);
      users.push(newUser);
    }

    console.log(`   Found ${users.length} user(s):`);
    users.forEach((user, i) => {
      console.log(`     ${i+1}. ${user.entity_name} (${user.entity_code}) - ${user.metadata?.email || 'no email'}`);
    });

    // Step 2: Create user_member_of_org relationships
    console.log('\n2. CREATING USER_MEMBER_OF_ORG RELATIONSHIPS:');
    
    let successCount = 0;
    for (const user of users) {
      try {
        // Check if relationship already exists
        const { data: existingRel, error: checkError } = await supabase
          .from('core_relationships')
          .select('id')
          .eq('from_entity_id', user.id)
          .eq('to_entity_id', targetOrgId)
          .eq('relationship_type', 'user_member_of_org')
          .single();

        if (existingRel) {
          console.log(`   ⏭️  Relationship already exists for ${user.entity_name}`);
          continue;
        }

        // Create the relationship
        const { data: newRel, error: relError } = await supabase
          .from('core_relationships')
          .insert({
            organization_id: targetOrgId, // The target org gets the relationship
            from_entity_id: user.id,
            to_entity_id: targetOrgId,
            relationship_type: 'user_member_of_org',
            smart_code: 'HERA.AUTH.USER.MEMBERSHIP.v1',
            metadata: {
              role: user.metadata?.role || 'user',
              joined_at: new Date().toISOString(),
              permissions: ['entities:read', 'transactions:read'],
              status: 'active'
            }
          })
          .select()
          .single();

        if (relError) {
          console.error(`   ❌ Failed to create relationship for ${user.entity_name}:`, relError.message);
        } else {
          console.log(`   ✅ Created user_member_of_org for ${user.entity_name}`);
          successCount++;
        }

      } catch (error) {
        console.error(`   ❌ Error processing user ${user.entity_name}:`, error.message);
      }
    }

    // Step 3: Create default role entities if they don't exist
    console.log('\n3. ENSURING DEFAULT ROLE ENTITIES EXIST:');
    
    const defaultRoles = [
      { code: 'ROLE-OWNER', name: 'Owner', permissions: ['*'] },
      { code: 'ROLE-ADMIN', name: 'Administrator', permissions: ['entities:*', 'transactions:*', 'reports:*'] },
      { code: 'ROLE-MANAGER', name: 'Manager', permissions: ['entities:read', 'entities:write', 'transactions:read', 'reports:read'] },
      { code: 'ROLE-USER', name: 'User', permissions: ['entities:read', 'transactions:read'] }
    ];

    for (const role of defaultRoles) {
      try {
        // Check if role entity exists
        const { data: existingRole } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', targetOrgId)
          .eq('entity_type', 'role')
          .eq('entity_code', role.code)
          .single();

        if (existingRole) {
          console.log(`   ⏭️  Role ${role.name} already exists`);
          continue;
        }

        // Create role entity
        const { data: newRole, error: roleError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: targetOrgId,
            entity_type: 'role',
            entity_name: role.name,
            entity_code: role.code,
            smart_code: 'HERA.AUTH.ROLE.DEFINITION.v1',
            metadata: {
              permissions: role.permissions,
              description: `Default ${role.name} role`,
              system_role: true
            }
          })
          .select()
          .single();

        if (roleError) {
          console.error(`   ❌ Failed to create role ${role.name}:`, roleError.message);
        } else {
          console.log(`   ✅ Created role: ${role.name}`);
        }

      } catch (error) {
        console.error(`   ❌ Error creating role ${role.name}:`, error.message);
      }
    }

    // Step 4: Verify restoration
    console.log('\n4. VERIFYING RESTORATION:');
    
    const { data: allRelationships, error: verifyError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', targetOrgId)
      .eq('relationship_type', 'user_member_of_org');

    if (verifyError) {
      console.error('Error verifying relationships:', verifyError);
    } else {
      console.log(`   ✅ Found ${allRelationships.length} user membership relationship(s)`);
      
      if (allRelationships.length > 0) {
        console.log('   User memberships restored:');
        allRelationships.forEach((rel, i) => {
          console.log(`     ${i+1}. Relationship ID: ${rel.id}`);
          console.log(`        From: ${rel.from_entity_id}`);
          console.log(`        Role: ${rel.metadata?.role || 'unknown'}`);
        });
      }
    }

    console.log('\n📋 SUMMARY:');
    console.log(`   ✅ Processed ${users.length} user(s)`);
    console.log(`   ✅ Created ${successCount} user membership relationship(s)`);
    console.log(`   ✅ Ensured default role entities exist`);
    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Run restore-status-workflows.js to create status entities');
    console.log('   2. Run restore-account-hierarchy.js to fix chart of accounts');
    console.log('   3. Test user login and access to the organization');

  } catch (error) {
    console.error('Error restoring user memberships:', error);
  }
}

restoreUserMemberships();