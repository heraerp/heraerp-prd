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

const DEMO_USER_EMAIL = 'demo@keralafurniture.com';
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

async function fixDemoUserOrganization() {
  console.log('🔧 Fixing Demo User Organization Association...\n');

  try {
    // Step 1: Get the demo user
    console.log('1️⃣ Finding demo user...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const demoUser = users.find(u => u.email === DEMO_USER_EMAIL);
    
    if (!demoUser) {
      console.error('❌ Demo user not found!');
      return;
    }
    
    console.log('   ✅ Found demo user:', demoUser.id);
    
    // Step 2: Check core_organizations table
    console.log('\n2️⃣ Checking organizations table...');
    const { data: orgs, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', FURNITURE_ORG_ID);
    
    if (orgError || !orgs || orgs.length === 0) {
      console.log('   ❌ Organization not found in core_organizations');
      console.log('   Creating organization...');
      
      const { error: createOrgError } = await supabase
        .from('core_organizations')
        .insert({
          id: FURNITURE_ORG_ID,
          name: 'Kerala Furniture Works',
          settings: {
            industry: 'furniture',
            country: 'AE',
            currency: 'AED'
          }
        });
      
      if (createOrgError) {
        console.error('   ❌ Error creating organization:', createOrgError.message);
      } else {
        console.log('   ✅ Created organization');
      }
    } else {
      console.log('   ✅ Organization exists:', orgs[0].name);
    }
    
    // Step 3: Create user_organizations relationship
    console.log('\n3️⃣ Creating user-organization relationship...');
    
    // Check if relationship exists
    const { data: existingRel, error: checkRelError } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', demoUser.id)
      .eq('organization_id', FURNITURE_ORG_ID)
      .single();
    
    if (checkRelError?.code === 'PGRST116' || !existingRel) {
      // Table doesn't exist or no relationship found
      console.log('   Creating user_organizations entry...');
      
      const { error: relError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: demoUser.id,
          organization_id: FURNITURE_ORG_ID,
          role: 'admin'
        });
      
      if (relError) {
        console.log('   ⚠️  Could not create user_organizations entry:', relError.message);
        console.log('   This table might not exist in your schema');
      } else {
        console.log('   ✅ Created user-organization relationship');
      }
    } else {
      console.log('   ✅ User-organization relationship already exists');
    }
    
    // Step 4: Alternative - Create relationship in core_relationships
    console.log('\n4️⃣ Creating relationship in core_relationships...');
    
    // Check if relationship exists
    const { data: coreRel } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', demoUser.id)
      .eq('to_entity_id', FURNITURE_ORG_ID)
      .eq('relationship_type', 'member_of')
      .single();
    
    if (!coreRel) {
      const { error: coreRelError } = await supabase
        .from('core_relationships')
        .insert({
          from_entity_id: demoUser.id,
          to_entity_id: FURNITURE_ORG_ID,
          relationship_type: 'member_of',
          smart_code: 'HERA.USER.ORGANIZATION.MEMBERSHIP.v1',
          metadata: {
            role: 'admin',
            joined_at: new Date().toISOString()
          }
        });
      
      if (coreRelError) {
        console.log('   ⚠️  Could not create core_relationships entry:', coreRelError.message);
      } else {
        console.log('   ✅ Created membership relationship');
      }
    } else {
      console.log('   ✅ Membership relationship already exists');
    }
    
    // Step 5: Update user metadata to ensure organization is set
    console.log('\n5️⃣ Updating user metadata...');
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      demoUser.id,
      {
        user_metadata: {
          ...demoUser.user_metadata,
          organization_id: FURNITURE_ORG_ID,
          organization_name: 'Kerala Furniture Works',
          default_organization: FURNITURE_ORG_ID,
          organizations: [FURNITURE_ORG_ID]
        }
      }
    );
    
    if (updateError) {
      console.log('   ❌ Error updating user metadata:', updateError.message);
    } else {
      console.log('   ✅ Updated user metadata with organization info');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DEMO USER ORGANIZATION FIXED!');
    console.log('='.repeat(60));
    console.log('\nThe demo user should now:');
    console.log('- Have organization metadata set');
    console.log('- Be associated with Kerala Furniture Works');
    console.log('- Go directly to /furniture on login');
    console.log('\nTry logging in again with the demo account.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Details:', error);
  }
}

// Run the fix
fixDemoUserOrganization();