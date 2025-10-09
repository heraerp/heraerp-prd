import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Based on the error message, the actual core_relationships table has these fields:
// id, organization_id, from_entity_id, to_entity_id, relationship_type, 
// relationship_direction, strength, context, smart_code, status, confidence,
// valid_from, valid_to, constraints, tags, is_active, created_at, created_by,
// updated_at, deleted_at, deleted_by, version

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

async function findGLAccountIds() {
  console.log('Finding GL account IDs...');
  
  const { data: glAccounts, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'gl_account');

  if (error) {
    console.error('Error fetching GL accounts:', error);
    return null;
  }

  console.log(`Found ${glAccounts.length} GL accounts`);
  glAccounts.forEach(acc => {
    console.log(`  - ${acc.entity_name} (${acc.entity_code}) [${acc.id}]`);
  });

  return glAccounts;
}

async function findUserIds() {
  console.log('\nFinding user IDs...');
  
  const { data: users, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'user');

  if (error) {
    console.error('Error fetching users:', error);
    return null;
  }

  console.log(`Found ${users.length} users`);
  users.forEach(user => {
    console.log(`  - ${user.entity_name} (${user.entity_code}) [${user.id}]`);
  });

  return users;
}

async function createUserGLRelationships(users, glAccounts) {
  console.log('\nCreating USER_MEMBER_OF_ORG relationships...');
  
  if (!users || users.length === 0) {
    console.log('No users found, skipping user relationships');
    return;
  }

  // Find the organization entity (usually the first GL account's parent organization)
  const { data: organizations, error: orgError } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'organization');

  if (orgError) {
    console.error('Error fetching organization entity:', orgError);
    return;
  }

  let orgEntityId = null;
  if (organizations && organizations.length > 0) {
    orgEntityId = organizations[0].id;
    console.log(`Found organization entity: ${organizations[0].entity_name} [${orgEntityId}]`);
  } else {
    // Create organization entity if it doesn't exist
    const { data: newOrg, error: createOrgError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'organization',
        entity_name: 'Main Organization',
        entity_code: 'ORG-MAIN',
        smart_code: 'HERA.ORG.ENTITY.MAIN.V1'
      })
      .select()
      .single();

    if (createOrgError) {
      console.error('Error creating organization entity:', createOrgError);
      return;
    }

    orgEntityId = newOrg.id;
    console.log(`Created organization entity: ${newOrg.entity_name} [${orgEntityId}]`);
  }

  // Create USER_MEMBER_OF_ORG relationships for all users
  const userRelationships = users.map(user => ({
    organization_id: ORG_ID,
    from_entity_id: user.id,
    to_entity_id: orgEntityId,
    relationship_type: 'USER_MEMBER_OF_ORG',
    relationship_direction: 'forward',
    strength: 1.0,
    context: {},
    smart_code: 'HERA.AUTH.USER.MEMBER.ORG.V1',
    status: 'ACTIVE',
    confidence: 1.0,
    valid_from: null,
    valid_to: null,
    constraints: {},
    tags: {},
    is_active: true
  }));

  for (const relationship of userRelationships) {
    try {
      const { data, error } = await supabase
        .from('core_relationships')
        .insert(relationship)
        .select();

      if (error) {
        console.error(`Error creating relationship for user ${relationship.from_entity_id}:`, error);
      } else {
        console.log(`✓ Created USER_MEMBER_OF_ORG relationship for user ${relationship.from_entity_id}`);
      }
    } catch (err) {
      console.error(`Exception creating relationship:`, err);
    }
  }
}

async function createGLAccountHierarchy(glAccounts) {
  console.log('\nCreating GL account hierarchy relationships...');
  
  if (!glAccounts || glAccounts.length === 0) {
    console.log('No GL accounts found, skipping hierarchy');
    return;
  }

  // Find accounts that might be parents (typically round numbers like 1000, 2000, etc.)
  const potentialParents = glAccounts.filter(acc => 
    acc.entity_code && acc.entity_code.endsWith('000')
  );

  console.log(`Found ${potentialParents.length} potential parent accounts`);

  // Create parent-child relationships based on account codes
  const hierarchyRelationships = [];

  for (const account of glAccounts) {
    if (!account.entity_code) continue;

    // Find potential parent (e.g., 1100 -> 1000, 1200 -> 1000)
    const accountCode = account.entity_code;
    const firstDigit = accountCode.charAt(0);
    const parentCode = firstDigit + '000';

    const parent = glAccounts.find(acc => acc.entity_code === parentCode);

    if (parent && parent.id !== account.id) {
      hierarchyRelationships.push({
        organization_id: ORG_ID,
        from_entity_id: account.id,
        to_entity_id: parent.id,
        relationship_type: 'GL_CHILD_OF_PARENT',
        relationship_direction: 'forward',
        strength: 1.0,
        context: {
          account_hierarchy: true,
          parent_code: parentCode,
          child_code: accountCode
        },
        smart_code: 'HERA.FIN.GL.HIERARCHY.PARENT.V1',
        status: 'ACTIVE',
        confidence: 1.0,
        valid_from: null,
        valid_to: null,
        constraints: {},
        tags: {},
        is_active: true
      });
    }
  }

  console.log(`Creating ${hierarchyRelationships.length} hierarchy relationships...`);

  for (const relationship of hierarchyRelationships) {
    try {
      const { data, error } = await supabase
        .from('core_relationships')
        .insert(relationship)
        .select();

      if (error) {
        console.error(`Error creating hierarchy relationship:`, error);
      } else {
        console.log(`✓ Created GL hierarchy: ${relationship.from_entity_id} -> ${relationship.to_entity_id}`);
      }
    } catch (err) {
      console.error(`Exception creating hierarchy relationship:`, err);
    }
  }
}

async function restoreRelationships() {
  console.log('=== Starting Relationship Restoration ===\n');
  console.log(`Target organization: ${ORG_ID}\n`);

  try {
    // Find entities to work with
    const glAccounts = await findGLAccountIds();
    const users = await findUserIds();

    if (!glAccounts && !users) {
      console.log('No entities found to create relationships for');
      return;
    }

    // Create relationships
    await createUserGLRelationships(users, glAccounts);
    await createGLAccountHierarchy(glAccounts);

    // Verify results
    const { data: finalRelationships, error: finalError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', ORG_ID);

    if (finalError) {
      console.error('Error checking final relationships:', finalError);
    } else {
      console.log(`\n=== Restoration Complete ===`);
      console.log(`Total relationships created: ${finalRelationships.length}`);
      
      finalRelationships.forEach(rel => {
        console.log(`  - ${rel.relationship_type}: ${rel.from_entity_id} -> ${rel.to_entity_id}`);
      });
    }

  } catch (err) {
    console.error('Exception during restoration:', err);
  }
}

// Run the restoration
await restoreRelationships();