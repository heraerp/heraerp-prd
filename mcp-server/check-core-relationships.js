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

async function checkRelationships() {
  console.log('Checking core_relationships table...\n');

  try {
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('core_relationships')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting count:', countError);
      return;
    }

    console.log(`Total relationships in table: ${totalCount}\n`);

    if (totalCount === 0) {
      console.log('⚠️  WARNING: core_relationships table is EMPTY!\n');
      console.log('This means ALL relationship data was lost during cleanup.\n');
      return;
    }

    // Get sample of relationships
    const { data: relationships, error } = await supabase
      .from('core_relationships')
      .select('*')
      .limit(20);

    if (error) {
      console.error('Error querying relationships:', error);
      return;
    }

    if (relationships.length > 0) {
      console.log('Sample relationships found:');
      console.table(relationships.map(r => ({
        id: r.id,
        relationship_type: r.relationship_type,
        from_entity_id: r.from_entity_id?.substring(0, 8) + '...',
        to_entity_id: r.to_entity_id?.substring(0, 8) + '...',
        organization_id: r.organization_id?.substring(0, 8) + '...',
        smart_code: r.smart_code,
        created_at: new Date(r.created_at).toLocaleDateString()
      })));
    }

    // Check for specific organization
    const targetOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
    const { data: orgRelationships, error: orgError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', targetOrgId);

    if (orgError) {
      console.error('Error querying org relationships:', orgError);
      return;
    }

    console.log(`\nRelationships for organization ${targetOrgId}:`);
    console.log(`Count: ${orgRelationships.length}`);

    if (orgRelationships.length > 0) {
      console.log('\nOrganization relationship types:');
      const relationshipTypes = [...new Set(orgRelationships.map(r => r.relationship_type))];
      relationshipTypes.forEach(type => {
        const count = orgRelationships.filter(r => r.relationship_type === type).length;
        console.log(`  ${type}: ${count}`);
      });
    }

    // Check for critical relationship types
    console.log('\nChecking for critical relationship types:');
    const criticalTypes = [
      'has_status',
      'member_of', 
      'parent_of',
      'child_of',
      'user_member_of_org',
      'account_hierarchy',
      'workflow_status'
    ];

    for (const type of criticalTypes) {
      const { count, error } = await supabase
        .from('core_relationships')
        .select('*', { count: 'exact', head: true })
        .eq('relationship_type', type);

      if (!error) {
        console.log(`  ${type}: ${count || 0} relationships`);
      }
    }

  } catch (error) {
    console.error('Error checking relationships:', error);
  }
}

checkRelationships();