const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

async function setupFurnitureDemoUser() {
  console.log('🪑 Setting up Furniture Module Demo User...\n');

  // Demo user credentials
  const demoUser = {
    email: 'demo@keralafurniture.com',
    password: 'FurnitureDemo2025!',
    fullName: 'Kerala Furniture Demo',
    phone: '+91-9876543210',
    role: 'admin'
  };

  try {
    // Step 1: Create auth user
    console.log('1️⃣ Creating authentication user...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: demoUser.email,
      password: demoUser.password,
      email_confirm: true,
      user_metadata: {
        full_name: demoUser.fullName,
        organization_id: FURNITURE_ORG_ID,
        role: demoUser.role,
        module: 'furniture'
      }
    });

    if (authError) {
      if (authError.message?.includes('already exists')) {
        console.log('   ℹ️  User already exists, updating instead...');
        
        // Get existing user
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === demoUser.email);
        
        if (existingUser) {
          // Update user metadata
          const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
              user_metadata: {
                full_name: demoUser.fullName,
                organization_id: FURNITURE_ORG_ID,
                role: demoUser.role,
                module: 'furniture'
              }
            }
          );
          
          if (updateError) {
            throw updateError;
          }
          
          console.log('   ✅ Updated existing user:', existingUser.id);
          
          // Use existing user for next steps
          authData.user = existingUser;
        }
      } else {
        throw authError;
      }
    } else {
      console.log('   ✅ Created auth user:', authData.user.id);
    }

    const userId = authData.user.id;

    // Step 2: Create user entity in core_entities
    console.log('\n2️⃣ Creating user entity...');
    
    const userEntity = {
      id: userId, // Use same ID as auth user
      organization_id: FURNITURE_ORG_ID,
      entity_type: 'user',
      entity_name: demoUser.fullName,
      entity_code: 'USER-DEMO-001',
      smart_code: 'HERA.FURNITURE.USER.ADMIN.v1',
      status: 'active',
      metadata: {
        email: demoUser.email,
        phone: demoUser.phone,
        role: demoUser.role,
        department: 'Management',
        permissions: [
          'furniture:read',
          'furniture:write',
          'furniture:delete',
          'tender:manage',
          'inventory:manage',
          'reports:view'
        ]
      }
    };

    // Check if user entity exists
    const { data: existingEntity, error: checkError } = await supabase
      .from('core_entities')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingEntity) {
      console.log('   ℹ️  User entity already exists, updating...');
      const { error: updateError } = await supabase
        .from('core_entities')
        .update(userEntity)
        .eq('id', userId);
      
      if (updateError) throw updateError;
      console.log('   ✅ Updated user entity');
    } else {
      const { error: insertError } = await supabase
        .from('core_entities')
        .insert(userEntity);
      
      if (insertError) throw insertError;
      console.log('   ✅ Created user entity');
    }

    // Step 3: Create organization membership
    console.log('\n3️⃣ Creating organization membership...');
    
    const membershipData = {
      organization_id: FURNITURE_ORG_ID,
      user_id: userId,
      role: demoUser.role,
      status: 'active',
      permissions: {
        modules: ['furniture', 'tender', 'inventory'],
        features: ['all']
      }
    };

    // Check if membership exists
    const { data: existingMembership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', FURNITURE_ORG_ID)
      .single();

    if (existingMembership) {
      console.log('   ℹ️  Membership already exists');
    } else {
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert(membershipData);
      
      if (memberError) {
        console.log('   ⚠️  Could not create membership (table might not exist)');
      } else {
        console.log('   ✅ Created organization membership');
      }
    }

    // Step 4: Set some demo preferences
    console.log('\n4️⃣ Setting user preferences...');
    
    const preferences = [
      { field_name: 'theme', field_value_text: 'dark' },
      { field_name: 'language', field_value_text: 'en' },
      { field_name: 'notifications', field_value_text: 'enabled' },
      { field_name: 'dashboard_layout', field_value_text: 'compact' }
    ];

    for (const pref of preferences) {
      await supabase
        .from('core_dynamic_data')
        .upsert({
          entity_id: userId,
          organization_id: FURNITURE_ORG_ID,
          ...pref,
          smart_code: `HERA.USER.PREFERENCE.${pref.field_name.toUpperCase()}.v1`
        }, {
          onConflict: 'entity_id,organization_id,field_name'
        });
    }
    console.log('   ✅ Set user preferences');

    // Step 5: Create a welcome notification
    console.log('\n5️⃣ Creating welcome notification...');
    
    const { error: notifError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: FURNITURE_ORG_ID,
        transaction_type: 'notification',
        transaction_code: `NOTIF-${Date.now()}`,
        smart_code: 'HERA.SYSTEM.NOTIFICATION.WELCOME.v1',
        from_entity_id: userId, // System
        to_entity_id: userId, // User
        total_amount: 0,
        metadata: {
          title: 'Welcome to Kerala Furniture Works',
          message: 'Your demo account has been set up successfully. Explore the tender management, inventory, and reporting features.',
          type: 'info',
          read: false
        }
      });

    if (notifError) {
      console.log('   ⚠️  Could not create notification');
    } else {
      console.log('   ✅ Created welcome notification');
    }

    // Display credentials
    console.log('\n' + '='.repeat(60));
    console.log('✅ FURNITURE MODULE DEMO USER CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📧 Login Credentials:');
    console.log(`   Email: ${demoUser.email}`);
    console.log(`   Password: ${demoUser.password}`);
    console.log('\n🏢 Organization:');
    console.log('   Name: Kerala Furniture Works');
    console.log(`   ID: ${FURNITURE_ORG_ID}`);
    console.log('\n🔑 Access:');
    console.log('   Role: Admin');
    console.log('   Modules: Furniture, Tender Management, Inventory');
    console.log('\n🌐 Login URL:');
    console.log('   http://localhost:3000/auth/login');
    console.log('\n💡 Tips:');
    console.log('   - Use these credentials to test the furniture module');
    console.log('   - All operations will be properly authenticated');
    console.log('   - RLS policies will automatically apply');
    console.log('   - Organization context is set automatically');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error setting up demo user:', error.message);
    console.error('Details:', error);
  }
}

// Run the setup
setupFurnitureDemoUser();