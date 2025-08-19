#!/usr/bin/env node
/**
 * Create Demo User with Organization
 * Sets up a complete demo user with entity profile and organization
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function createDemoUser() {
  console.log('🎯 Creating Demo User with Organization...\n');

  try {
    // 1. Create Supabase auth user
    console.log('Creating Supabase auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'demo@hera.com',
      password: 'demo123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo User',
        organization_id: organizationId
      }
    });

    if (authError) {
      // User might already exist
      console.log('Auth user might already exist:', authError.message);
      
      // Try to get existing user
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === 'demo@hera.com');
      
      if (existingUser) {
        console.log('✓ Found existing auth user');
        authData.user = existingUser;
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Created Supabase auth user');
    }

    const supabaseUserId = authData.user.id;

    // 2. Create user entity
    console.log('\nCreating user entity...');
    
    // Check if user entity already exists
    const { data: existingUserEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'user')
      .eq('entity_code', 'USER-demo@hera.com')
      .single();

    let userEntity;
    if (existingUserEntity) {
      userEntity = existingUserEntity;
      console.log('✓ Found existing user entity');
    } else {
      const { data: newUserEntity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'user',
          entity_name: 'Demo User',
          entity_code: 'USER-demo@hera.com',
          smart_code: 'HERA.AUTH.USER.PROFILE.v1',
          metadata: {
            supabase_id: supabaseUserId,
            email: 'demo@hera.com',
            created_at: new Date().toISOString()
          },
          status: 'active'
        })
        .select()
        .single();

      if (entityError) throw entityError;
      userEntity = newUserEntity;
      console.log('✅ Created user entity');
    }

    // 3. Add user dynamic fields
    console.log('\nAdding user profile fields...');
    const profileFields = [
      { field_name: 'role', field_value_text: 'admin', field_type: 'text' },
      { field_name: 'department', field_value_text: 'Management', field_type: 'text' },
      { field_name: 'phone', field_value_text: '(555) 100-0001', field_type: 'text' },
      { field_name: 'timezone', field_value_text: 'America/New_York', field_type: 'text' }
    ];

    for (const field of profileFields) {
      // Check if field already exists
      const { data: existing } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_id', userEntity.id)
        .eq('field_name', field.field_name)
        .single();

      if (!existing) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: userEntity.id,
            ...field,
            smart_code: `HERA.AUTH.USER.FIELD.${field.field_name.toUpperCase()}.v1`
          });
        console.log(`  ✅ Added ${field.field_name}: ${field.field_value_text}`);
      } else {
        console.log(`  ✓ ${field.field_name} already exists`);
      }
    }

    // 4. Create or verify organization
    console.log('\nVerifying organization...');
    const { data: org } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (org) {
      console.log(`✅ Organization found: ${org.organization_name}`);
    } else {
      console.log('❌ Organization not found! Please run setup-business first.');
      return;
    }

    // 5. Store organization ID in user metadata
    console.log('\nStoring organization reference in user metadata...');
    
    // Update user entity with organization reference
    const { error: updateError } = await supabase
      .from('core_entities')
      .update({
        metadata: {
          ...userEntity.metadata,
          organization_id: organizationId,
          organization_name: org.organization_name
        }
      })
      .eq('id', userEntity.id);

    if (updateError) throw updateError;
    console.log('✅ Updated user with organization reference');

    // 6. Summary
    console.log('\n✨ Demo User Setup Complete!\n');
    console.log('📧 Email: demo@hera.com');
    console.log('🔑 Password: demo123');
    console.log(`🏢 Organization: ${org.organization_name}`);
    console.log(`🆔 Organization ID: ${organizationId}`);
    console.log(`👤 User Entity ID: ${userEntity.id}`);
    console.log(`🔐 Supabase User ID: ${supabaseUserId}`);
    console.log('\n🌐 You can now login at: http://localhost:3007/auth/login');

  } catch (error) {
    console.error('❌ Error creating demo user:', error);
  }
}

// Run the setup
createDemoUser().catch(console.error);