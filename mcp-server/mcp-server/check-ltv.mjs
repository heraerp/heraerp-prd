import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually
const envPath = join(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLTV() {
  const orgId = env.DEFAULT_ORGANIZATION_ID;
  
  console.log('Organization ID:', orgId);
  console.log('\n=== Checking LTV Data ===\n');
  
  // 1. Check core_dynamic_data table directly
  const { data: dynamicData, error: dynamicError } = await supabase
    .from('core_dynamic_data')
    .select('entity_id, field_name, field_value_number, smart_code, created_at')
    .eq('organization_id', orgId)
    .eq('field_name', 'lifetime_value')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (dynamicError) {
    console.error('❌ Error querying dynamic data:', dynamicError.message);
  } else {
    console.log(`📊 Total LTV fields found: ${dynamicData.length}\n`);
    if (dynamicData.length > 0) {
      console.log('Recent LTV Records:');
      dynamicData.forEach((d, i) => {
        console.log(`${i+1}. Entity: ${d.entity_id.substring(0, 12)}... | Value: ${d.field_value_number} | Smart Code: ${d.smart_code}`);
      });
    } else {
      console.log('⚠️  NO LTV fields found in core_dynamic_data table!');
      console.log('   This means LTV values are NOT being saved to the database.\n');
    }
  }
  
  // 2. Check if customers exist
  const { data: allCustomers, error: custError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, status')
    .eq('organization_id', orgId)
    .eq('entity_type', 'CUSTOMER')
    .limit(5);
    
  if (custError) {
    console.error('\n❌ Error fetching customers:', custError.message);
  } else {
    console.log(`\n👥 Total customers in organization: ${allCustomers.length}`);
    allCustomers.forEach((c, i) => {
      console.log(`${i+1}. ${c.entity_name} (${c.id.substring(0, 12)}...) - Status: ${c.status}`);
    });
  }
  
  // 3. Check if there are any sales transactions
  const { data: sales, error: salesError } = await supabase
    .from('universal_transactions')
    .select('id, transaction_type, total_amount, source_entity_id, transaction_date')
    .eq('organization_id', orgId)
    .eq('transaction_type', 'SALE')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (salesError) {
    console.error('\n❌ Error fetching sales:', salesError.message);
  } else {
    console.log(`\n💰 Recent sales transactions: ${sales.length}`);
    if (sales.length > 0) {
      sales.forEach((s, i) => {
        console.log(`${i+1}. Amount: ${s.total_amount} | Customer: ${s.source_entity_id ? s.source_entity_id.substring(0, 12) : 'N/A'}... | Date: ${s.transaction_date}`);
      });
    } else {
      console.log('   No sales found - LTV would be 0 for all customers');
    }
  }
}

checkLTV().then(() => process.exit(0)).catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
