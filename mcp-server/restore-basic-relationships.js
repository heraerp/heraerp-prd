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

async function restoreBasicRelationships() {
  console.log('🔄 RESTORING BASIC CRITICAL RELATIONSHIPS');
  console.log('=' .repeat(60) + '\n');

  const targetOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
  const platformOrgId = '00000000-0000-0000-0000-000000000000';

  try {
    // First, let's check the core_relationships schema
    console.log('1. CHECKING CORE_RELATIONSHIPS SCHEMA:');
    const { data: schemaInfo, error: schemaError } = await supabase
      .from('core_relationships')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.log('   Schema check failed, continuing with basic columns...');
    } else {
      console.log('   ✅ Schema accessible');
    }

    // Step 1: Create basic status entities first
    console.log('\n2. CREATING BASIC STATUS ENTITIES:');
    
    const statusEntities = [
      { code: 'STATUS-ACTIVE', name: 'Active', type: 'active' },
      { code: 'STATUS-INACTIVE', name: 'Inactive', type: 'inactive' },
      { code: 'STATUS-DRAFT', name: 'Draft', type: 'draft' },
      { code: 'STATUS-PENDING', name: 'Pending', type: 'pending' },
      { code: 'STATUS-APPROVED', name: 'Approved', type: 'approved' },
      { code: 'STATUS-COMPLETED', name: 'Completed', type: 'completed' },
      { code: 'STATUS-CANCELLED', name: 'Cancelled', type: 'cancelled' }
    ];

    for (const status of statusEntities) {
      try {
        // Check if status entity exists
        const { data: existingStatus } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', targetOrgId)
          .eq('entity_type', 'status')
          .eq('entity_code', status.code)
          .single();

        if (existingStatus) {
          console.log(`   ⏭️  Status ${status.name} already exists`);
          continue;
        }

        // Create status entity
        const { data: newStatus, error: statusError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: targetOrgId,
            entity_type: 'status',
            entity_name: status.name,
            entity_code: status.code,
            smart_code: 'HERA.WORKFLOW.STATUS.v1'
          })
          .select()
          .single();

        if (statusError) {
          console.error(`   ❌ Failed to create status ${status.name}:`, statusError.message);
        } else {
          console.log(`   ✅ Created status: ${status.name}`);
        }

      } catch (error) {
        console.error(`   ❌ Error creating status ${status.name}:`, error.message);
      }
    }

    // Step 2: Create user in platform org if needed and link to target org
    console.log('\n3. ENSURING USER EXISTS AND IS LINKED:');
    
    // Check for existing users in platform org
    const { data: users } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code')
      .eq('organization_id', platformOrgId)
      .eq('entity_type', 'user');

    let userId = null;
    
    if (!users || users.length === 0) {
      console.log('   Creating demo user in platform organization...');
      
      const { data: newUser, error: createUserError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: platformOrgId,
          entity_type: 'user',
          entity_name: 'Demo User',
          entity_code: 'USER-DEMO-001',
          smart_code: 'HERA.AUTH.USER.PROFILE.v1'
        })
        .select()
        .single();

      if (createUserError) {
        console.error('   ❌ Failed to create user:', createUserError.message);
      } else {
        console.log('   ✅ Created demo user');
        userId = newUser.id;
      }
    } else {
      console.log(`   ✅ Found ${users.length} existing user(s)`);
      userId = users[0].id;
    }

    // Create user membership relationship (without metadata for now)
    if (userId) {
      console.log('   Creating user membership relationship...');
      
      const { data: existingRel } = await supabase
        .from('core_relationships')
        .select('id')
        .eq('from_entity_id', userId)
        .eq('relationship_type', 'user_member_of_org')
        .single();

      if (!existingRel) {
        const { data: newRel, error: relError } = await supabase
          .from('core_relationships')
          .insert({
            organization_id: targetOrgId,
            from_entity_id: userId,
            to_entity_id: targetOrgId,
            relationship_type: 'user_member_of_org',
            smart_code: 'HERA.AUTH.USER.MEMBERSHIP.v1'
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

    // Step 3: Create basic account hierarchy relationships
    console.log('\n4. CREATING BASIC ACCOUNT HIERARCHY:');
    
    // Get all GL accounts
    const { data: accounts } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, metadata')
      .eq('organization_id', targetOrgId)
      .eq('entity_type', 'gl_account')
      .order('entity_code');

    if (accounts && accounts.length > 0) {
      console.log(`   Found ${accounts.length} GL accounts`);
      
      // Create basic parent accounts and relationships
      const accountGroups = {
        'ASSETS': { codes: ['1100', '1200'], parent: null },
        'LIABILITIES': { codes: ['2100'], parent: null },
        'EQUITY': { codes: ['3000'], parent: null },
        'REVENUE': { codes: ['4100'], parent: null },
        'EXPENSES': { codes: ['5100'], parent: null }
      };

      // Create basic parent-child relationships based on account codes
      for (const account of accounts) {
        if (account.entity_code) {
          const accountType = account.metadata?.account_type;
          const activeStatusId = await getEntityIdByCode(targetOrgId, 'STATUS-ACTIVE');
          
          if (activeStatusId) {
            // Create has_status relationship for each account
            await createRelationshipSafe(
              targetOrgId,
              account.id,
              activeStatusId,
              'has_status',
              'HERA.WORKFLOW.ENTITY.STATUS.v1'
            );
          }
        }
      }
    }

    // Step 4: Verify what we've restored
    console.log('\n5. VERIFICATION:');
    
    const { data: allRelationships } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', targetOrgId);

    console.log(`   ✅ Total relationships restored: ${allRelationships?.length || 0}`);
    
    if (allRelationships && allRelationships.length > 0) {
      const relationshipTypes = {};
      allRelationships.forEach(rel => {
        relationshipTypes[rel.relationship_type] = (relationshipTypes[rel.relationship_type] || 0) + 1;
      });
      
      console.log('   Relationship types:');
      Object.entries(relationshipTypes).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });
    }

    console.log('\n📋 BASIC RESTORATION COMPLETE');
    console.log('✅ Status entities created');
    console.log('✅ User membership relationship created');
    console.log('✅ Basic account status relationships created');
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Test user access to the organization');
    console.log('2. Create more specific business relationships as needed');
    console.log('3. Add workflow transition relationships');

  } catch (error) {
    console.error('Error in basic restoration:', error);
  }
}

// Helper function to get entity ID by code
async function getEntityIdByCode(organizationId, entityCode) {
  const { data } = await supabase
    .from('core_entities')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('entity_code', entityCode)
    .single();
  
  return data?.id || null;
}

// Helper function to create relationships safely
async function createRelationshipSafe(organizationId, fromEntityId, toEntityId, relationshipType, smartCode) {
  try {
    // Check if relationship already exists
    const { data: existing } = await supabase
      .from('core_relationships')
      .select('id')
      .eq('from_entity_id', fromEntityId)
      .eq('to_entity_id', toEntityId)
      .eq('relationship_type', relationshipType)
      .single();

    if (existing) {
      return { success: true, message: 'Already exists' };
    }

    // Create new relationship
    const { data, error } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: organizationId,
        from_entity_id: fromEntityId,
        to_entity_id: toEntityId,
        relationship_type: relationshipType,
        smart_code: smartCode
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

restoreBasicRelationships();