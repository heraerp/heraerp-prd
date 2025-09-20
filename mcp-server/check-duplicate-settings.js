const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkDuplicateSettings() {
  console.log('🔍 Checking for duplicate settings...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
  
  // Get all dynamic data for this org
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .select('id, field_name, entity_id, created_at')
    .eq('organization_id', organizationId)
    .in('field_name', ['SALES_POLICY.v1', 'INVENTORY_POLICY.v1', 'NOTIFICATION_POLICY.v1', 'ROLE_GRANTS.v1'])
    .order('field_name', { ascending: true })
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data.length} settings records\n`);
  
  // Group by field_name to find duplicates
  const grouped = data.reduce((acc, item) => {
    if (!acc[item.field_name]) acc[item.field_name] = [];
    acc[item.field_name].push(item);
    return acc;
  }, {});
  
  Object.entries(grouped).forEach(([fieldName, records]) => {
    console.log(`${fieldName}: ${records.length} record(s)`);
    if (records.length > 1) {
      console.log('  ⚠️ DUPLICATES FOUND!');
      records.forEach((r, idx) => {
        console.log(`  ${idx + 1}. ID: ${r.id}`);
        console.log(`     Entity ID: ${r.entity_id || 'NULL'}`);
        console.log(`     Created: ${r.created_at}`);
      });
    }
  });
  
  console.log('\n💡 Solution: Delete older duplicates, keep only the most recent');
  
  // Show which records to delete
  console.log('\n🗑️ Records to delete:');
  Object.entries(grouped).forEach(([fieldName, records]) => {
    if (records.length > 1) {
      // Skip the first (most recent) record
      const toDelete = records.slice(1);
      toDelete.forEach(r => {
        console.log(`DELETE FROM core_dynamic_data WHERE id = '${r.id}'; -- ${fieldName} duplicate`);
      });
    }
  });
}

checkDuplicateSettings().catch(console.error);