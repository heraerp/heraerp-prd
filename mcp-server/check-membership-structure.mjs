import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a';

console.log('🔍 Checking existing membership structure...\n');

const { data, error } = await supabase
  .from('core_relationships')
  .select('*')
  .eq('from_entity_id', TEST_USER_ID)
  .eq('relationship_type', 'MEMBER_OF')
  .limit(1)
  .single();

if (error) {
  console.log('❌ Error:', error.message);
} else {
  console.log('✅ Found existing membership:');
  console.log('   from_entity_id:', data.from_entity_id, '(USER)');
  console.log('   to_entity_id:', data.to_entity_id, '(ORG)');
  console.log('   organization_id:', data.organization_id);
  console.log('   relationship_data:', JSON.stringify(data.relationship_data, null, 2));
  console.log('   smart_code:', data.smart_code);
}
