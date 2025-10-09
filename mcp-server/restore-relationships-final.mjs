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

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

async function createStatusEntities() {
  console.log('Creating workflow status entities...');
  
  const statuses = [
    { name: 'active', color: '#10B981', description: 'Active and operational' },
    { name: 'inactive', color: '#6B7280', description: 'Inactive but available' },
    { name: 'draft', color: '#F59E0B', description: 'Draft status' },
    { name: 'pending', color: '#F59E0B', description: 'Pending approval' },
    { name: 'approved', color: '#10B981', description: 'Approved for use' },
    { name: 'completed', color: '#059669', description: 'Completed successfully' }
  ];

  for (const status of statuses) {
    try {
      // Check if status already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'workflow_status')
        .eq('entity_code', `STATUS-${status.name.toUpperCase()}`)
        .single();

      if (existing) {
        console.log(`  ✓ Status '${status.name}' already exists`);
        continue;
      }

      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'workflow_status',
          entity_name: status.name.charAt(0).toUpperCase() + status.name.slice(1),
          entity_code: `STATUS-${status.name.toUpperCase()}`,
          smart_code: `HERA.UNIVERSAL.WORKFLOW.STATUS.${status.name.toUpperCase()}.v1`,
          metadata: {
            color: status.color,
            description: status.description,
            restored: true
          }
        })
        .select()
        .single();

      if (error) {
        console.error(`  ❌ Error creating status '${status.name}':`, error);
      } else {
        console.log(`  ✓ Created status '${status.name}' [${data.id}]`);
      }
    } catch (err) {
      console.error(`  ❌ Exception creating status '${status.name}':`, err);
    }
  }
}

async function createOrganizationEntity() {
  console.log('\nCreating organization entity...');
  
  try {
    // Check if organization entity already exists
    const { data: existing } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'organization')
      .single();

    if (existing) {
      console.log(`  ✓ Organization entity already exists: ${existing.entity_name} [${existing.id}]`);
      return existing.id;
    }

    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'organization',
        entity_name: 'Main Organization',
        entity_code: 'ORG-MAIN',
        smart_code: 'HERA.ORG.ENTITY.MAIN.v1',
        metadata: {
          restored: true,
          description: 'Main organization entity for relationships'
        }
      })
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Error creating organization entity:`, error);
      return null;
    } else {
      console.log(`  ✓ Created organization entity: ${data.entity_name} [${data.id}]`);
      return data.id;
    }
  } catch (err) {
    console.error(`  ❌ Exception creating organization entity:`, err);
    return null;
  }
}

async function createGLAccountStatusRelationships() {
  console.log('\nCreating GL account status relationships...');
  
  try {
    // Get the active status entity
    const { data: activeStatus } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', 'STATUS-ACTIVE')
      .single();

    if (!activeStatus) {
      console.error('  ❌ Active status entity not found');
      return;
    }

    // Get all GL accounts
    const { data: glAccounts } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'gl_account');

    if (!glAccounts || glAccounts.length === 0) {
      console.log('  ℹ️ No GL accounts found');
      return;
    }

    console.log(`  Found ${glAccounts.length} GL accounts to assign status`);

    let created = 0;
    for (const account of glAccounts) {
      try {
        // Check if relationship already exists
        const { data: existing } = await supabase
          .from('core_relationships')
          .select('id')
          .eq('organization_id', ORG_ID)
          .eq('from_entity_id', account.id)
          .eq('relationship_type', 'has_status')
          .single();

        if (existing) {
          continue; // Skip if already exists
        }

        const { data, error } = await supabase
          .from('core_relationships')
          .insert({
            organization_id: ORG_ID,
            from_entity_id: account.id,
            to_entity_id: activeStatus.id,
            relationship_type: 'has_status',
            smart_code: 'HERA.UNIVERSAL.WORKFLOW.STATUS.ASSIGN.v1',
            metadata: {
              restored: true,
              restoration_date: new Date().toISOString(),
              entity_type: 'gl_account',
              default_status: 'active'
            }
          })
          .select()
          .single();

        if (error) {
          console.error(`    ❌ Error creating status relationship for ${account.entity_name}:`, error);
        } else {
          created++;
        }
      } catch (err) {
        console.error(`    ❌ Exception processing ${account.entity_name}:`, err);
      }
    }

    console.log(`  ✓ Created ${created} GL account status relationships`);
  } catch (err) {
    console.error('  ❌ Exception in createGLAccountStatusRelationships:', err);
  }
}

async function restoreRelationships() {
  console.log('=== EMERGENCY RELATIONSHIP RESTORATION ===');
  console.log(`Organization: ${ORG_ID}\n`);

  try {
    // Step 1: Create status entities
    await createStatusEntities();

    // Step 2: Create organization entity
    const orgEntityId = await createOrganizationEntity();

    // Step 3: Create GL account status relationships
    await createGLAccountStatusRelationships();

    // Step 4: Verify results
    const { data: finalRelationships } = await supabase
      .from('core_relationships')
      .select('relationship_type')
      .eq('organization_id', ORG_ID);

    const relationshipCounts = {};
    if (finalRelationships) {
      finalRelationships.forEach(rel => {
        relationshipCounts[rel.relationship_type] = (relationshipCounts[rel.relationship_type] || 0) + 1;
      });
    }

    console.log('\n=== RESTORATION COMPLETE ===');
    console.log(`Total relationships restored: ${finalRelationships ? finalRelationships.length : 0}`);
    console.log('\nRelationships by type:');
    Object.entries(relationshipCounts).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

  } catch (err) {
    console.error('❌ Exception during restoration:', err);
  }
}

// Run the restoration
await restoreRelationships();