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

async function inspectTableStructure() {
  console.log('=== Inspecting core_relationships table structure ===\n');
  
  try {
    // Try to insert a test record to see what fields are available
    console.log('Attempting test insert to discover required fields...\n');
    
    const testData = {
      organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
      from_entity_id: 'd01f5f3c-1cc0-47e0-95c8-a56dfefdf0f0',
      to_entity_id: '809040dd-61e0-4985-b937-20fe991a3837',
      relationship_type: 'test_relation',
      smart_code: 'HERA.TEST.REL.V1'
    };
    
    const { data, error } = await supabase
      .from('core_relationships')
      .insert(testData)
      .select();
    
    if (error) {
      console.log('Insert error (this reveals the schema requirements):');
      console.log(error);
      
      // Try without some fields that might not exist
      console.log('\nTrying with minimal fields...');
      
      const minimalData = {
        organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
        from_entity_id: 'd01f5f3c-1cc0-47e0-95c8-a56dfefdf0f0',
        to_entity_id: '809040dd-61e0-4985-b937-20fe991a3837',
        relationship_type: 'test_relation'
      };
      
      const { data: data2, error: error2 } = await supabase
        .from('core_relationships')
        .insert(minimalData)
        .select();
        
      if (error2) {
        console.log('Minimal insert error:');
        console.log(error2);
      } else {
        console.log('SUCCESS! Minimal insert worked:');
        console.log(data2);
        
        // Now get the actual column names
        if (data2 && data2.length > 0) {
          console.log('\nActual table columns:');
          Object.keys(data2[0]).forEach(key => {
            console.log(`  - ${key}: ${typeof data2[0][key]} = ${data2[0][key]}`);
          });
        }
        
        // Clean up the test record
        await supabase
          .from('core_relationships')
          .delete()
          .eq('id', data2[0].id);
        console.log('\nTest record cleaned up.');
      }
    } else {
      console.log('SUCCESS! Insert worked:');
      console.log(data);
      
      if (data && data.length > 0) {
        console.log('\nActual table columns:');
        Object.keys(data[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof data[0][key]} = ${data[0][key]}`);
        });
      }
      
      // Clean up the test record
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

await inspectTableStructure();