#!/usr/bin/env node

// ================================================================================
// CREATE SALON TEST USERS
// Smart Code: HERA.SALON.TEST.USERS.v1
// Creates test users with different roles for testing RBAC
// ================================================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo organization ID (from CLAUDE.md)
const DEMO_ORG_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';
const DEMO_ORG_NAME = 'Demo Salon - Hair Talkz';

// Test users with different roles
const testUsers = [
  {
    email: 'owner@herasalon.demo',
    password: 'HeraSalon123!',
    name: 'Sarah Owner',
    role: 'owner',
    description: 'Salon Owner - Full access to all features',
    smartCode: 'HERA.SALON.USER.OWNER.v1'
  },
  {
    email: 'admin@herasalon.demo',
    password: 'HeraSalon123!',
    name: 'Adam Admin',
    role: 'admin',
    description: 'Administrator - System configuration access',
    smartCode: 'HERA.SALON.USER.ADMIN.v1'
  },
  {
    email: 'manager@herasalon.demo',
    password: 'HeraSalon123!',
    name: 'Maria Manager',
    role: 'manager',
    description: 'Salon Manager - Operational management',
    smartCode: 'HERA.SALON.USER.MANAGER.v1'
  },
  {
    email: 'stylist@herasalon.demo',
    password: 'HeraSalon123!',
    name: 'Sophie Stylist',
    role: 'stylist',
    description: 'Hair Stylist - Appointments and schedule only',
    smartCode: 'HERA.SALON.USER.STYLIST.v1'
  },
  {
    email: 'cashier@herasalon.demo',
    password: 'HeraSalon123!',
    name: 'Charlie Cashier',
    role: 'cashier',
    description: 'Cashier - POS and appointment viewing',
    smartCode: 'HERA.SALON.USER.CASHIER.v1'
  },
  {
    email: 'customer@herasalon.demo',
    password: 'HeraSalon123!',
    name: 'Clara Customer',
    role: 'customer',
    description: 'Customer - Portal access only',
    smartCode: 'HERA.SALON.USER.CUSTOMER.v1'
  },
  {
    email: 'accountant@herasalon.demo',
    password: 'HeraSalon123!',
    name: 'Alex Accountant',
    role: 'accountant',
    description: 'Accountant - Financial reports and GL access',
    smartCode: 'HERA.SALON.USER.ACCOUNTANT.v1'
  }
];

async function createTestUsers() {
  console.log('🎭 Creating Salon Test Users...\n');
  console.log(`📍 Demo Organization: ${DEMO_ORG_NAME}`);
  console.log(`🆔 Organization ID: ${DEMO_ORG_ID}\n`);

  for (const userData of testUsers) {
    try {
      console.log(`Creating ${userData.role}: ${userData.email}`);

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role
        }
      });

      if (authError) {
        if (authError.message.includes('already exists')) {
          console.log(`  ⚠️  User already exists, skipping...`);
          continue;
        }
        throw authError;
      }

      const userId = authData.user.id;

      // 2. Create user entity in core_entities
      const { data: userEntity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'user',
          entity_name: userData.name,
          entity_code: `USER-${userData.role.toUpperCase()}-${Date.now()}`,
          organization_id: DEMO_ORG_ID,
          created_by: userId,
          smart_code: userData.smartCode,
          classification: userData.role,
          status: 'active',
          metadata: {
            email: userData.email,
            role: userData.role,
            auth_user_id: userId,
            description: userData.description
          }
        })
        .select()
        .single();

      if (entityError) throw entityError;

      // 3. Create organization membership
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: DEMO_ORG_ID,
          user_id: userId,
          entity_id: userEntity.id,
          role: userData.role,
          is_active: true
        });

      if (memberError) {
        // If membership already exists, update it
        if (memberError.message.includes('duplicate')) {
          await supabase
            .from('organization_members')
            .update({
              role: userData.role,
              entity_id: userEntity.id,
              is_active: true
            })
            .eq('organization_id', DEMO_ORG_ID)
            .eq('user_id', userId);
        } else {
          throw memberError;
        }
      }

      // 4. Set role in dynamic data for RBAC
      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .insert({
          entity_id: userEntity.id,
          field_name: 'system_role',
          field_value_text: userData.role,
          organization_id: DEMO_ORG_ID,
          created_by: userId,
          smart_code: 'HERA.SALON.RBAC.ROLE.ASSIGN.v1',
          metadata: {
            assigned_at: new Date().toISOString(),
            role_permissions: getRolePermissions(userData.role)
          }
        });

      if (dynamicError && !dynamicError.message.includes('duplicate')) throw dynamicError;

      console.log(`  ✅ Created successfully!`);
      console.log(`     ID: ${userId}`);
      console.log(`     Entity: ${userEntity.id}`);
      
    } catch (error) {
      console.error(`  ❌ Error creating ${userData.email}:`, error.message);
    }
  }

  console.log('\n📋 Test User Summary:\n');
  console.log('┌─────────────────────────────┬──────────────────┬────────────────────────────────┐');
  console.log('│ Email                       │ Password         │ Access                         │');
  console.log('├─────────────────────────────┼──────────────────┼────────────────────────────────┤');
  
  testUsers.forEach(user => {
    const email = user.email.padEnd(27);
    const password = 'HeraSalon123!'.padEnd(16);
    const access = getAccessSummary(user.role).padEnd(30);
    console.log(`│ ${email} │ ${password} │ ${access} │`);
  });
  
  console.log('└─────────────────────────────┴──────────────────┴────────────────────────────────┘');

  console.log('\n🚀 Test Instructions:\n');
  console.log('1. Go to http://localhost:3000/auth/login');
  console.log('2. Login with any test user above');
  console.log('3. You will be redirected to the role-specific landing page');
  console.log('4. Navigation will show only allowed items for that role');
  console.log('\n💡 Tip: Open multiple incognito windows to test different roles simultaneously');
}

function getRolePermissions(role) {
  const permissions = {
    owner: ['*'], // All permissions
    admin: ['settings:*', 'users:*', 'finance:closing', 'finance:rules'],
    manager: ['dashboard:view', 'appointments:*', 'pos:*', 'inventory:*', 'reports:*', 'whatsapp:*'],
    stylist: ['appointments:view', 'appointments:update', 'staff:schedule:view'],
    cashier: ['pos:*', 'appointments:view'],
    customer: ['customer:*'],
    accountant: ['accountant:dashboard', 'reports:*', 'finance:closing', 'finance:rules']
  };
  
  return permissions[role] || [];
}

function getAccessSummary(role) {
  const summaries = {
    owner: 'Full access to all features',
    admin: 'Admin & system settings',
    manager: 'Operations management',
    stylist: 'Appointments only',
    cashier: 'POS & appointments',
    customer: 'Customer portal only',
    accountant: 'Financial reports & GL'
  };
  
  return summaries[role] || 'Limited access';
}

// Run the script
createTestUsers()
  .then(() => {
    console.log('\n✅ Test users creation complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });