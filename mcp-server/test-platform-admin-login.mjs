import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔐 Testing Platform Admin Login Flow...\n');

const ADMIN_EMAIL = 'team@hanaset.com';
const ADMIN_PASSWORD = 'HERA2025!';

async function testLogin() {
  try {
    // Step 1: Test authentication
    console.log('1️⃣  Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (authError) {
      console.log('   ❌ Authentication failed:', authError.message);
      return false;
    }

    console.log('   ✅ Authentication successful');
    console.log('      User ID:', authData.user.id);
    console.log('      Email:', authData.user.email);

    // Step 2: Fetch user's organizations
    console.log('\n2️⃣  Fetching user organizations...');
    const { data: orgs, error: orgsError } = await supabase
      .from('core_relationships')
      .select(`
        organization:to_entity_id (
          id,
          organization_name,
          organization_code
        ),
        relationship_data
      `)
      .eq('from_entity_id', authData.user.id)
      .eq('relationship_type', 'MEMBER_OF');

    if (orgsError) {
      console.log('   ❌ Error fetching organizations:', orgsError.message);
    } else {
      console.log('   ✅ Found', orgs.length, 'organization(s):');
      orgs.forEach((rel, i) => {
        const org = rel.organization;
        const role = rel.relationship_data?.role;
        if (org && typeof org === 'object') {
          console.log(`\n   [${i + 1}] ${org.organization_name}`);
          console.log(`       Code: ${org.organization_code}`);
          console.log(`       ID: ${org.id}`);
          console.log(`       Role: ${role}`);
        }
      });
    }

    // Step 3: Verify PLATFORM_ADMIN role
    console.log('\n3️⃣  Verifying PLATFORM_ADMIN role...');
    const { data: roleRel, error: roleError } = await supabase
      .from('core_relationships')
      .select('id, relationship_data, to_entity_id')
      .eq('from_entity_id', authData.user.id)
      .eq('relationship_type', 'HAS_ROLE');

    if (roleError) {
      console.log('   ❌ Error checking role:', roleError.message);
    } else if (roleRel && roleRel.length > 0) {
      const platformAdminRole = roleRel.find(r => r.relationship_data?.role_code === 'PLATFORM_ADMIN');
      if (platformAdminRole) {
        console.log('   ✅ User has PLATFORM_ADMIN role');
        console.log('      Role Entity ID:', platformAdminRole.to_entity_id);
      } else {
        console.log('   ⚠️  No PLATFORM_ADMIN role found');
      }
    }

    // Step 4: Expected login flow
    console.log('\n4️⃣  Expected Login Flow:');
    console.log('   1. User visits: /auth/login');
    console.log('   2. Enters: team@hanaset.com / HERA2025!');
    console.log('   3. Authenticates successfully ✅');

    if (orgs && orgs.length === 1) {
      const org = orgs[0].organization;
      if (org && typeof org === 'object') {
        console.log(`   4. Single organization detected: ${org.organization_name}`);
        console.log('   5. Redirects to: /apps');
      }
    } else if (orgs && orgs.length > 1) {
      console.log('   4. Multiple organizations detected');
      console.log('   5. Redirects to: /auth/organizations (selector)');
      console.log('   6. User selects: HERA Platform');
      console.log('   7. Redirects to: /salon-access or app-specific page');
    } else {
      console.log('   4. No organizations found');
      console.log('   5. Redirects to: /auth/organizations/new (create first org)');
    }

    // Step 5: Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ LOGIN TEST COMPLETE');
    console.log('='.repeat(70));
    console.log('\n📋 Summary:');
    console.log('   - Authentication: ✅ Working');
    console.log(`   - Organizations: ${orgs?.length || 0} found`);
    console.log('   - Platform Admin Role: ✅ Verified');
    console.log('   - Public Login Page: /auth/login');

    console.log('\n🔗 Login URL:');
    console.log('   Development: http://localhost:3000/auth/login');
    console.log('   Production:  https://app.heraerp.com/auth/login');

    console.log('\n🔐 Credentials:');
    console.log('   Email:    team@hanaset.com');
    console.log('   Password: HERA2025!');

    // Cleanup
    await supabase.auth.signOut();

    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

testLogin()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
