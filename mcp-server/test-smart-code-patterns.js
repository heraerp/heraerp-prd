const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSmartCodePatterns() {
  console.log('Testing different smart code patterns...\n');
  
  const testOrgId = '84a3654b-907b-472a-ac8f-a1ffb6fb711b';
  
  const patterns = [
    'HERA.TEST.v1',                                    // Too short
    'HERA.TEST.ENTITY.v1',                             // 3 parts
    'HERA.TEST.ENTITY.SAMPLE.v1',                      // 4 parts
    'HERA.TEST.ENTITY.SAMPLE.DATA.v1',                 // 5 parts (expected)
    'HERA.TEST.ENTITY.SAMPLE.DATA.EXTRA.v1',           // 6 parts
    'hera.test.entity.sample.data.v1',                 // lowercase
    'HERA.TEST.ENTITY.SAMPLE.DATA.V1',                 // uppercase V
    'HERA.TEST.ENTITY.SAMPLE.DATA.v2',                 // v2
    'HERA.TEST.ENTITY.SAMPLE-DATA.v1',                 // hyphen
    'HERA.TEST.ENTITY.SAMPLE_DATA.v1',                 // underscore
  ];
  
  for (const pattern of patterns) {
    // Try to create a simple test entry
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: testOrgId,
        entity_type: 'smart_code_test',
        entity_name: `Test ${pattern}`,
        entity_code: `TEST-${Date.now()}`,
        smart_code: pattern
      })
      .select();
    
    if (error) {
      console.log(`❌ "${pattern}" - Failed: ${error.message.split('\\n')[0]}`);
    } else {
      console.log(`✅ "${pattern}" - Success!`);
      // Clean up successful test
      if (data && data[0]) {
        await supabase
          .from('core_entities')
          .delete()
          .eq('id', data[0].id);
      }
    }
  }
  
  console.log('\nBased on the results, the smart code must match the pattern:');
  console.log('HERA.{MODULE}.{TYPE}.{CATEGORY}.{SPECIFIC}.v{number}');
  console.log('All parts must be UPPERCASE except the "v" in version.');
}

testSmartCodePatterns();