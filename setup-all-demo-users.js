const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Demo modules configuration
const DEMO_MODULES = [
  {
    id: 'furniture',
    email: 'demo@keralafurniture.com',
    password: 'FurnitureDemo2025!',
    fullName: 'Kerala Furniture Demo',
    organizationId: 'f0af4ced-9d12-4a55-a649-b484368db249',
    organizationName: 'Kerala Furniture Works'
  },
  {
    id: 'salon',
    email: 'demo@hairtalkz.com',
    password: 'SalonDemo2025!',
    fullName: 'Hair Talkz Demo',
    organizationId: 'c2f7b7a3-7e3d-4c47-9f2e-d3f8a9c2e5f6',
    organizationName: 'Hair Talkz Salon & Spa'
  },
  {
    id: 'restaurant',
    email: 'demo@mariosrestaurant.com',
    password: 'RestaurantDemo2025!',
    fullName: 'Mario\'s Restaurant Demo',
    organizationId: 'a5d9c8f7-8f5e-4b7c-9e3f-f2d8a7c9e4b5',
    organizationName: 'Mario\'s Authentic Italian'
  },
  {
    id: 'crm',
    email: 'demo@techvantage.com',
    password: 'CRMDemo2025!',
    fullName: 'TechVantage CRM Demo',
    organizationId: 'e7f9a5c3-5d8e-4f9c-8b3e-d5f7a9c8e2f4',
    organizationName: 'TechVantage Solutions'
  }
];

async function createOrUpdateDemoUser(module) {
  console.log(`\n📦 Setting up ${module.id} demo user...`);

  try {
    // Step 1: Ensure organization exists FIRST
    console.log('   Ensuring organization exists...');
    
    const { data: orgExists } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('id', module.organizationId)
      .single();
    
    if (!orgExists) {
      const { error: orgError } = await supabase
        .from('core_organizations')
        .insert({
          id: module.organizationId,
          organization_name: module.organizationName,
          organization_code: module.id.toUpperCase(),
          organization_type: 'business',
          industry_classification: module.id,
          settings: {
            industry: module.id,
            country: 'AE',
            currency: 'AED',
            subdomain: module.id
          },
          status: 'active'
        });
      
      if (orgError) {
        console.log('   ❌ Could not create organization:', orgError.message);
        throw orgError;
      } else {
        console.log('   ✅ Created organization');
      }
    } else {
      console.log('   ✅ Organization exists');
    }

    // Step 2: Create or update auth user
    console.log('   Creating/updating auth user...');
    
    let userId;
    
    // Check if user exists
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === module.email);
    
    if (existingUser) {
      // Update existing user
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: module.password,
          user_metadata: {
            full_name: module.fullName,
            organization_id: module.organizationId,
            organization_name: module.organizationName,
            organizations: [module.organizationId],
            default_organization: module.organizationId,
            role: 'admin',
            module: module.id
          }
        }
      );
      
      if (updateError) throw updateError;
      userId = existingUser.id;
      console.log('   ✅ Updated existing user');
    } else {
      // Create new user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: module.email,
        password: module.password,
        email_confirm: true,
        user_metadata: {
          full_name: module.fullName,
          organization_id: module.organizationId,
          organization_name: module.organizationName,
          organizations: [module.organizationId],
          default_organization: module.organizationId,
          role: 'admin',
          module: module.id
        }
      });
      
      if (authError) throw authError;
      userId = authData.user.id;
      console.log('   ✅ Created new user');
    }

    // Step 3: Create/update user entity
    console.log('   Creating/updating user entity...');
    
    const userEntity = {
      id: userId,
      organization_id: module.organizationId,
      entity_type: 'user',
      entity_name: module.fullName,
      entity_code: `USER-DEMO-${module.id.toUpperCase()}`,
      smart_code: `HERA.${module.id.toUpperCase()}.USER.ADMIN.v1`,
      status: 'active',
      metadata: {
        email: module.email,
        role: 'admin',
        module: module.id,
        permissions: [
          `${module.id}:read`,
          `${module.id}:write`,
          `${module.id}:delete`,
          'reports:view'
        ]
      }
    };

    const { error: entityError } = await supabase
      .from('core_entities')
      .upsert(userEntity, { onConflict: 'id' });
    
    if (entityError) {
      console.log('   ⚠️  Could not upsert user entity:', entityError.message);
    } else {
      console.log('   ✅ User entity ready');
    }


    console.log(`   ✅ ${module.id} demo user ready!`);
    
  } catch (error) {
    console.error(`   ❌ Error setting up ${module.id}:`, error.message);
  }
}

async function setupAllDemoUsers() {
  console.log('🚀 Setting up all HERA demo users...\n');
  
  for (const module of DEMO_MODULES) {
    await createOrUpdateDemoUser(module);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ ALL DEMO USERS CONFIGURED!');
  console.log('='.repeat(70));
  console.log('\n📋 Demo Credentials Summary:\n');
  
  DEMO_MODULES.forEach(module => {
    console.log(`${module.id.toUpperCase()}:`);
    console.log(`   Email: ${module.email}`);
    console.log(`   Password: ${module.password}`);
    console.log(`   Route: /${module.id}`);
    console.log('');
  });
  
  console.log('🌐 Access via: http://localhost:3000/auth/login');
  console.log('💡 Click any module tile to instantly access the demo!');
  console.log('='.repeat(70));
}

// Run the setup
setupAllDemoUsers();