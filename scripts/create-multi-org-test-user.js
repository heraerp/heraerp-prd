const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createMultiOrgTestUser() {
  try {
    console.log('🚀 Creating test user with multiple organizations...');

    // Step 1: Create a test user
    const testEmail = `test-multi-org-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    console.log('✅ Created auth user:', testEmail);

    // Step 2: Create organizations
    const orgs = [
      {
        organization_name: 'Bella Beauty Salon',
        organization_type: 'salon',
        organization_code: `BELLA-${Date.now()}`,
        status: 'active',
        settings: {
          subscription_tier: 'professional',
          business_hours: { mon: '9-6', tue: '9-6', wed: '9-6', thu: '9-8', fri: '9-8', sat: '9-5' }
        }
      },
      {
        organization_name: 'Luxe Spa & Wellness',
        organization_type: 'spa',
        organization_code: `LUXE-${Date.now()}`,
        status: 'active',
        settings: {
          subscription_tier: 'enterprise',
          features: ['appointments', 'inventory', 'loyalty', 'marketing']
        }
      },
      {
        organization_name: 'Hair Studio Elite',
        organization_type: 'salon',
        organization_code: `ELITE-${Date.now()}`,
        status: 'active',
        settings: {
          subscription_tier: 'starter',
          max_staff: 5
        }
      }
    ];

    const createdOrgs = [];
    for (const org of orgs) {
      const { data, error } = await supabase
        .from('core_organizations')
        .insert(org)
        .select()
        .single();

      if (error) {
        console.error('Failed to create organization:', error);
        continue;
      }

      createdOrgs.push(data);
      console.log(`✅ Created organization: ${data.organization_name}`);

      // Create organization entity
      const { error: entityError } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'organization',
          entity_name: data.organization_name,
          entity_code: data.organization_code,
          organization_id: data.id,
          smart_code: 'HERA.ORG.ENTITY.SALON.v1',
          smart_code_status: 'active',
          metadata: {
            org_type: data.organization_type,
            settings: data.settings
          }
        });

      if (entityError) {
        console.error('Failed to create organization entity:', entityError);
      }
    }

    // Step 3: Create user entity
    const { data: userEntity, error: userEntityError } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'user',
        entity_name: 'Test Multi-Org User',
        entity_code: `USER-${testEmail}`,
        organization_id: createdOrgs[0].id, // Primary org
        smart_code: 'HERA.AUTH.USER.PROFILE.MULTI_ORG.v1',
        smart_code_status: 'active',
        metadata: {
          auth_user_id: authData.user.id,
          email: testEmail,
          is_test_user: true
        }
      })
      .select()
      .single();

    if (userEntityError) {
      throw new Error(`Failed to create user entity: ${userEntityError.message}`);
    }

    console.log('✅ Created user entity');

    // Step 4: Create relationships (user member_of organizations)
    const roles = ['owner', 'admin', 'manager'];
    for (let i = 0; i < createdOrgs.length; i++) {
      // First, get the organization entity
      const { data: orgEntity } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', createdOrgs[i].id)
        .eq('entity_type', 'organization')
        .single();

      const toEntityId = orgEntity?.id || createdOrgs[i].id; // Use org ID as fallback

      const { error: relError } = await supabase
        .from('core_relationships')
        .insert({
          from_entity_id: userEntity.id,
          to_entity_id: toEntityId,
          organization_id: createdOrgs[i].id,
          relationship_type: 'member_of',
          relationship_strength: 1.0,
          is_active: true,
          smart_code: 'HERA.AUTH.USER.ORG.MEMBERSHIP.v1',
          relationship_data: {
            role: roles[i],
            permissions: ['entities:*', 'transactions:*', 'settings:*'],
            is_primary: i === 0,
            joined_at: new Date().toISOString()
          }
        });

      if (relError) {
        console.error('Failed to create relationship:', relError);
        continue;
      }

      console.log(`✅ Added user to ${createdOrgs[i].organization_name} as ${roles[i]}`);
    }

    console.log('\n🎉 Test user created successfully!');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('🏢 Organizations:', createdOrgs.map(o => o.organization_name).join(', '));
    console.log('\n📝 Test the organization switcher at: http://localhost:3001/test-org-switcher');
    console.log('   Login with the credentials above');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
createMultiOrgTestUser();