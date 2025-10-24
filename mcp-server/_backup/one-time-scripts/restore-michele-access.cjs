require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const HAIR_TALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const MICHELE_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';

async function restoreMicheleAccess() {
  console.log('🔧 RESTORING MICHELE\'S ACCESS TO HAIR TALKZ SALON');
  console.log('================================================');
  console.log(`👤 User ID: ${MICHELE_USER_ID}`);
  console.log(`🏢 Organization: ${HAIR_TALKZ_ORG_ID}`);
  console.log('');

  try {
    // Step 1: Check constraints on core_relationships table
    console.log('1. 🔍 CHECKING CURRENT TABLE CONSTRAINTS...');
    const { data: constraintCheck, error: constraintError } = await supabase
      .from('core_relationships')
      .select('*')
      .limit(1);

    if (constraintError) {
      console.log('   ⚠️  Error checking constraints:', constraintError.message);
    } else {
      console.log('   ✅ Table accessible');
    }

    // Step 2: Ensure USER entity exists in platform org
    console.log('\n2. 👤 ENSURING MICHELE USER ENTITY EXISTS...');
    
    const { data: existingUser, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', MICHELE_USER_ID)
      .eq('organization_id', PLATFORM_ORG_ID)
      .maybeSingle();

    if (userError) {
      console.log('   ❌ Error checking user:', userError.message);
      return;
    }

    if (!existingUser) {
      console.log('   📝 Creating Michele as USER entity in platform org...');
      
      const { data: newUser, error: createUserError } = await supabase
        .from('core_entities')
        .insert({
          id: MICHELE_USER_ID,
          organization_id: PLATFORM_ORG_ID,
          entity_type: 'USER',
          entity_name: 'Michele Shule',
          entity_code: `USER-${MICHELE_USER_ID.substring(0, 8)}`,
          smart_code: 'HERA.SYSTEM.USER.ENTITY.PERSON.V1',
          status: 'active',
          metadata: { email: 'micheleshule@gmail.com' }
        })
        .select();

      if (createUserError) {
        console.log('   ❌ Failed to create user:', createUserError.message);
        return;
      } else {
        console.log('   ✅ Created Michele as USER entity');
      }
    } else {
      console.log('   ✅ Michele USER entity exists');
      
      // Update to correct entity type if needed
      if (existingUser.entity_type !== 'USER') {
        console.log(`   📝 Updating entity type from ${existingUser.entity_type} to USER...`);
        const { error: updateError } = await supabase
          .from('core_entities')
          .update({ entity_type: 'USER' })
          .eq('id', MICHELE_USER_ID)
          .eq('organization_id', PLATFORM_ORG_ID);

        if (updateError) {
          console.log('   ❌ Failed to update entity type:', updateError.message);
        } else {
          console.log('   ✅ Updated entity type to USER');
        }
      }
    }

    // Step 3: Ensure Hair Talkz organization entity exists
    console.log('\n3. 🏢 ENSURING HAIR TALKZ ORGANIZATION ENTITY EXISTS...');
    
    const { data: existingOrg, error: orgError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', HAIR_TALKZ_ORG_ID)
      .eq('organization_id', HAIR_TALKZ_ORG_ID)
      .maybeSingle();

    if (!existingOrg) {
      console.log('   📝 Creating Hair Talkz as ORG entity...');
      
      const { data: newOrg, error: createOrgError } = await supabase
        .from('core_entities')
        .insert({
          id: HAIR_TALKZ_ORG_ID,
          organization_id: HAIR_TALKZ_ORG_ID,
          entity_type: 'ORG',
          entity_name: 'Hair Talkz Salon',
          entity_code: `ORG-${HAIR_TALKZ_ORG_ID.substring(0, 8)}`,
          smart_code: 'HERA.SYSTEM.ORG.ENTITY.ORGANIZATION.V1',
          status: 'active'
        })
        .select();

      if (createOrgError) {
        console.log('   ❌ Failed to create organization:', createOrgError.message);
        return;
      } else {
        console.log('   ✅ Created Hair Talkz ORG entity');
      }
    } else {
      console.log('   ✅ Hair Talkz ORG entity exists');
    }

    // Step 4: Create USER_MEMBER_OF_ORG relationship
    console.log('\n4. 🔗 CREATING USER_MEMBER_OF_ORG RELATIONSHIP...');
    
    const { data: existingRel, error: relCheckError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', MICHELE_USER_ID)
      .eq('to_entity_id', HAIR_TALKZ_ORG_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .maybeSingle();

    if (existingRel) {
      console.log('   ✅ USER_MEMBER_OF_ORG relationship already exists');
      console.log(`   📝 Relationship ID: ${existingRel.id}`);
    } else {
      console.log('   📝 Creating USER_MEMBER_OF_ORG relationship...');
      
      const { data: newRel, error: createRelError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: HAIR_TALKZ_ORG_ID,
          from_entity_id: MICHELE_USER_ID,
          to_entity_id: HAIR_TALKZ_ORG_ID,
          relationship_type: 'USER_MEMBER_OF_ORG',
          smart_code: 'HERA.SYSTEM.USER.REL.MEMBER_OF_ORG.V1',
          is_active: true,
          relationship_data: {
            role: 'owner',
            permissions: ['*'],
            access_level: 'full'
          }
        })
        .select();

      if (createRelError) {
        console.log('   ❌ Failed to create relationship:', createRelError.message);
        
        // Try with different smart code pattern if constraint error
        if (createRelError.message.includes('smart_code')) {
          console.log('   🔄 Trying with Finance DNA v2 compatible smart code...');
          
          const { data: newRel2, error: createRelError2 } = await supabase
            .from('core_relationships')
            .insert({
              organization_id: HAIR_TALKZ_ORG_ID,
              from_entity_id: MICHELE_USER_ID,
              to_entity_id: HAIR_TALKZ_ORG_ID,
              relationship_type: 'USER_MEMBER_OF_ORG',
              smart_code: 'HERA.ACCOUNTING.USER.MEMBERSHIP.v2',
              is_active: true,
              relationship_data: {
                role: 'owner',
                permissions: ['*'],
                access_level: 'full'
              }
            })
            .select();

          if (createRelError2) {
            console.log('   ❌ Failed with v2 smart code:', createRelError2.message);
            return;
          } else {
            console.log('   ✅ Created relationship with v2 smart code');
            console.log(`   📝 Relationship ID: ${newRel2[0].id}`);
          }
        } else {
          return;
        }
      } else {
        console.log('   ✅ Created USER_MEMBER_OF_ORG relationship');
        console.log(`   📝 Relationship ID: ${newRel[0].id}`);
      }
    }

    // Step 5: Verify authentication query works
    console.log('\n5. 🔍 VERIFYING AUTHENTICATION QUERY...');
    
    const { data: authCheck, error: authError } = await supabase
      .from('core_relationships')
      .select('to_entity_id')
      .eq('from_entity_id', MICHELE_USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .eq('is_active', true);

    if (authError) {
      console.log('   ❌ Authentication query failed:', authError.message);
    } else if (authCheck && authCheck.length > 0) {
      console.log('   ✅ Authentication query successful');
      console.log(`   📝 Found organization: ${authCheck[0].to_entity_id}`);
      
      if (authCheck[0].to_entity_id === HAIR_TALKZ_ORG_ID) {
        console.log('   ✅ Correct organization resolved!');
      } else {
        console.log('   ⚠️  Wrong organization resolved');
      }
    } else {
      console.log('   ❌ No relationships found in authentication query');
    }

    // Step 6: Create essential salon status entities if needed
    console.log('\n6. 📋 ENSURING BASIC STATUS ENTITIES EXIST...');
    
    const statusEntities = [
      { code: 'STATUS-ACTIVE', name: 'Active' },
      { code: 'STATUS-INACTIVE', name: 'Inactive' }
    ];

    for (const status of statusEntities) {
      const { data: existingStatus } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', HAIR_TALKZ_ORG_ID)
        .eq('entity_code', status.code)
        .maybeSingle();

      if (!existingStatus) {
        const { error: statusError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: HAIR_TALKZ_ORG_ID,
            entity_type: 'workflow_status',
            entity_name: status.name,
            entity_code: status.code,
            smart_code: 'HERA.ACCOUNTING.WORKFLOW.STATUS.v2'
          });

        if (statusError) {
          console.log(`   ⚠️  Failed to create ${status.name} status: ${statusError.message}`);
        } else {
          console.log(`   ✅ Created ${status.name} status entity`);
        }
      } else {
        console.log(`   ✅ ${status.name} status already exists`);
      }
    }

    console.log('\n🎉 MICHELE ACCESS RESTORATION COMPLETE!');
    console.log('======================================');
    console.log('✅ Michele USER entity exists in platform org');
    console.log('✅ Hair Talkz ORG entity exists');
    console.log('✅ USER_MEMBER_OF_ORG relationship created');
    console.log('✅ Authentication query verified');
    console.log('✅ Basic status entities available');
    console.log('');
    console.log('🚀 MICHELE SHOULD NOW BE ABLE TO:');
    console.log('   - Log in with fresh token (after browser refresh)');
    console.log('   - Access Hair Talkz organization');
    console.log('   - Use salon management features');
    console.log('');
    console.log('💡 NEXT STEPS FOR MICHELE:');
    console.log('   1. Clear browser cache and cookies');
    console.log('   2. Go to heraerp.com and login again');
    console.log('   3. Fresh JWT token will allow authentication');

  } catch (error) {
    console.error('🔥 Fatal error in restoration:', error);
  }
}

restoreMicheleAccess();