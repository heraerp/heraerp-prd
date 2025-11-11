import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["|']|["|']$/g, '');
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('🔍 Checking LTV in core_dynamic_data...\n');

const { data, error } = await supabase
  .from('core_dynamic_data')
  .select('*')
  .eq('organization_id', orgId)
  .eq('field_name', 'lifetime_value');

if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log(`Found ${data.length} LTV records:\n`);

if (data.length === 0) {
  console.log('⚠️  NO LTV data found!');
} else {
  data.forEach((row, i) => {
    console.log(`${i+1}. Entity: ${row.entity_id.substring(0, 12)}...`);
    console.log(`   Value: ${row.field_value_number}`);
    console.log(`   Smart Code: ${row.smart_code}`);
    console.log(`   Created: ${row.created_at}`);
    console.log('');
  });
}

process.exit(0);
