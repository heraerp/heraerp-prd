import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const orgId = process.env.DEFAULT_ORGANIZATION_ID;

console.log('Checking recent entities...');

const { data, error } = await supabase
  .from('core_entities')
  .select('id, entity_type, entity_name, smart_code, created_at')
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false })
  .limit(20);

if (error) {
  console.error('Error:', error);
} else {
  console.log('Found', data.length, 'entities:');
  data.forEach((e, i) => {
    console.log(i+1, 'Type:', e.entity_type, '| Name:', e.entity_name);
  });
}
