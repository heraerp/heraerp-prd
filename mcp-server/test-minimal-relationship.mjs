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

async function testMinimalRelationship() {
  console.log('Testing minimal relationship insert...');
  
  // Get two GL accounts to use for testing
  const { data: glAccounts, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'gl_account')
    .limit(2);

  if (error || !glAccounts || glAccounts.length < 2) {
    console.error('Error fetching GL accounts:', error);
    return;
  }

  console.log(`Using accounts: ${glAccounts[0].entity_name} -> ${glAccounts[1].entity_name}`);

  // Test with absolute minimal data
  const minimalData = {
    organization_id: ORG_ID,
    from_entity_id: glAccounts[0].id,
    to_entity_id: glAccounts[1].id,
    relationship_type: 'TEST_RELATION',
    smart_code: 'HERA.TEST.REL.BASIC.V1'
  };

  console.log('\nTesting with minimal data...');
  
  try {
    const { data, error } = await supabase
      .from('core_relationships')
      .insert(minimalData)
      .select();

    if (error) {
      console.log('Error:', error);
    } else {
      console.log('SUCCESS! Relationship created:');
      console.log(data[0]);
      
      console.log('\nActual columns in the table:');
      Object.keys(data[0]).sort().forEach(key => {
        console.log(`  - ${key}: ${typeof data[0][key]} = ${data[0][key]}`);
      });
      
      // Clean up
      await supabase
        .from('core_relationships')
        .delete()
        .eq('id', data[0].id);
      console.log('\nTest record cleaned up.');
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

await testMinimalRelationship();