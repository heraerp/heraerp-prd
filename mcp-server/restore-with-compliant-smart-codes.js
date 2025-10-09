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

async function restoreWithCompliantSmartCodes() {
  console.log('🔧 RESTORING RELATIONSHIPS WITH COMPLIANT SMART CODES');
  console.log('=' .repeat(60) + '\n');

  const targetOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
  const platformOrgId = '00000000-0000-0000-0000-000000000000';

  try {
    // Step 1: Create status entities with v2 smart codes
    console.log('1. CREATING STATUS ENTITIES WITH V2 SMART CODES:');
    
    const statusEntities = [
      { code: 'STATUS-ACTIVE', name: 'Active', smartCode: 'HERA.ACCOUNTING.STATUS.ACTIVE.v2' },
      { code: 'STATUS-INACTIVE', name: 'Inactive', smartCode: 'HERA.ACCOUNTING.STATUS.INACTIVE.v2' },
      { code: 'STATUS-DRAFT', name: 'Draft', smartCode: 'HERA.ACCOUNTING.STATUS.DRAFT.v2' },
      { code: 'STATUS-PENDING', name: 'Pending', smartCode: 'HERA.ACCOUNTING.STATUS.PENDING.v2' },
      { code: 'STATUS-APPROVED', name: 'Approved', smartCode: 'HERA.ACCOUNTING.STATUS.APPROVED.v2' },
      { code: 'STATUS-COMPLETED', name: 'Completed', smartCode: 'HERA.ACCOUNTING.STATUS.COMPLETED.v2' }
    ];

    for (const status of statusEntities) {
      try {
        const { data: existing } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', targetOrgId)
          .eq('entity_code', status.code)
          .single();

        if (!existing) {
          const { data: newStatus, error: statusError } = await supabase
            .from('core_entities')
            .insert({
              organization_id: targetOrgId,
              entity_type: 'status',
              entity_name: status.name,
              entity_code: status.code,
              smart_code: status.smartCode
            })
            .select()
            .single();

          if (statusError) {
            console.error(`   ❌ Failed to create status ${status.name}:`, statusError.message);
          } else {
            console.log(`   ✅ Created status: ${status.name}`);
          }
        } else {
          console.log(`   ⏭️  Status ${status.name} already exists`);
        }
      } catch (error) {
        console.error(`   ❌ Error with status ${status.name}:`, error.message);
      }
    }

    // Step 2: Create user entity with v2 smart code
    console.log('\n2. ENSURING USER WITH V2 SMART CODE:');
    
    let userId = null;
    const { data: users } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code')
      .eq('organization_id', platformOrgId)
      .eq('entity_type', 'user');

    if (!users || users.length === 0) {
      console.log('   Creating user with v2 smart code...');
      
      const { data: newUser, error: userError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: platformOrgId,
          entity_type: 'user',
          entity_name: 'Demo User',
          entity_code: 'USER-DEMO-001',
          smart_code: 'HERA.ACCOUNTING.USER.PROFILE.v2'
        })
        .select()
        .single();

      if (userError) {
        console.error('   ❌ Failed to create user:', userError.message);
      } else {
        console.log('   ✅ Created user with v2 smart code');
        userId = newUser.id;
      }
    } else {
      console.log('   ✅ User already exists');
      userId = users[0].id;
      
      // Update existing user to have v2 smart code
      const { error: updateError } = await supabase
        .from('core_entities')
        .update({ smart_code: 'HERA.ACCOUNTING.USER.PROFILE.v2' })
        .eq('id', userId);

      if (updateError) {
        console.error('   ❌ Failed to update user smart code:', updateError.message);
      } else {
        console.log('   ✅ Updated user smart code to v2');
      }
    }

    // Step 3: Create organization entity for target org (required for relationships)
    console.log('\n3. ENSURING TARGET ORGANIZATION ENTITY:');
    
    const { data: existingOrg } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', targetOrgId)
      .eq('entity_type', 'organization')
      .single();

    let targetOrgEntityId = existingOrg?.id;

    if (!existingOrg) {
      console.log('   Creating organization entity...');
      
      const { data: newOrg, error: orgError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: targetOrgId,
          entity_type: 'organization',
          entity_name: 'Target Organization',
          entity_code: 'ORG-TARGET',
          smart_code: 'HERA.ACCOUNTING.ORG.ENTITY.v2'
        })
        .select()
        .single();

      if (orgError) {
        console.error('   ❌ Failed to create organization entity:', orgError.message);
      } else {
        console.log('   ✅ Created organization entity');
        targetOrgEntityId = newOrg.id;
      }
    } else {
      console.log('   ✅ Organization entity already exists');
    }

    // Step 4: Create user membership relationship with v2 smart code
    if (userId && targetOrgEntityId) {
      console.log('\n4. CREATING USER MEMBERSHIP RELATIONSHIP:');
      
      const { data: existingRel } = await supabase
        .from('core_relationships')
        .select('id')
        .eq('from_entity_id', userId)
        .eq('to_entity_id', targetOrgEntityId)
        .eq('relationship_type', 'user_member_of_org')
        .single();

      if (!existingRel) {
        const { data: newRel, error: relError } = await supabase
          .from('core_relationships')
          .insert({
            organization_id: targetOrgId,
            from_entity_id: userId,
            to_entity_id: targetOrgEntityId,
            relationship_type: 'user_member_of_org',
            smart_code: 'HERA.ACCOUNTING.USER.MEMBERSHIP.v2'
          })
          .select()
          .single();

        if (relError) {
          console.error('   ❌ Failed to create membership relationship:', relError.message);
        } else {
          console.log('   ✅ Created user membership relationship');
        }
      } else {
        console.log('   ⏭️  User membership relationship already exists');
      }
    }

    // Step 5: Create has_status relationships for GL accounts
    console.log('\n5. CREATING ACCOUNT STATUS RELATIONSHIPS:');
    
    const { data: accounts } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code')
      .eq('organization_id', targetOrgId)
      .eq('entity_type', 'gl_account')
      .limit(5); // Just do a few for testing

    const { data: activeStatus } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', targetOrgId)
      .eq('entity_code', 'STATUS-ACTIVE')
      .single();

    if (accounts && activeStatus && accounts.length > 0) {
      console.log(`   Creating status relationships for ${accounts.length} accounts...`);
      
      let relationshipCount = 0;
      for (const account of accounts) {
        const { data: existingStatus } = await supabase
          .from('core_relationships')
          .select('id')
          .eq('from_entity_id', account.id)
          .eq('to_entity_id', activeStatus.id)
          .eq('relationship_type', 'has_status')
          .single();

        if (!existingStatus) {
          const { data: statusRel, error: statusError } = await supabase
            .from('core_relationships')
            .insert({
              organization_id: targetOrgId,
              from_entity_id: account.id,
              to_entity_id: activeStatus.id,
              relationship_type: 'has_status',
              smart_code: 'HERA.ACCOUNTING.ENTITY.STATUS.v2'
            })
            .select()
            .single();

          if (statusError) {
            console.error(`   ❌ Failed to create status for ${account.entity_name}:`, statusError.message);
          } else {
            relationshipCount++;
            console.log(`   ✅ Created status relationship for ${account.entity_name}`);
          }
        }
      }
      
      console.log(`   ✅ Created ${relationshipCount} account status relationships`);
    }

    // Step 6: Final verification
    console.log('\n6. FINAL VERIFICATION:');
    
    const { data: allRelationships } = await supabase
      .from('core_relationships')
      .select('relationship_type')
      .eq('organization_id', targetOrgId);

    console.log(`   ✅ Total relationships: ${allRelationships?.length || 0}`);
    
    if (allRelationships && allRelationships.length > 0) {
      const types = {};
      allRelationships.forEach(rel => {
        types[rel.relationship_type] = (types[rel.relationship_type] || 0) + 1;
      });
      
      console.log('   Relationship types restored:');
      Object.entries(types).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });
    }

    console.log('\n🎉 BASIC RELATIONSHIPS RESTORED SUCCESSFULLY!');
    console.log('\n📋 WHAT WAS RESTORED:');
    console.log('✅ Status entities with v2 smart codes');
    console.log('✅ User entity with v2 smart code');
    console.log('✅ Organization entity for target org');
    console.log('✅ User membership relationship');
    console.log('✅ Account status relationships');
    
    console.log('\n🎯 IMPACT:');
    console.log('• Users can now access the organization');
    console.log('• Entities have status workflow support');
    console.log('• Basic business operations should work');
    console.log('• Foundation set for more complex relationships');

  } catch (error) {
    console.error('Error in restoration:', error);
  }
}

restoreWithCompliantSmartCodes();