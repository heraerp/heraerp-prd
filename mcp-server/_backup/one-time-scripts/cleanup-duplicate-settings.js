const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function cleanupDuplicateSettings() {
  console.log('🧹 Cleaning up duplicate settings...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // IDs to delete (older duplicates)
  const idsToDelete = [
    '33333333-3333-4333-8333-333333333336', // NOTIFICATION_POLICY.v1 duplicate
    'e4710db7-cd89-4097-933f-67b43d497068', // NOTIFICATION_POLICY.v1 duplicate
    '33333333-3333-4333-8333-333333333333', // ROLE_GRANTS.v1 duplicate
    'bd184794-034b-4b13-99f7-c6bf09e9d68f', // ROLE_GRANTS.v1 duplicate
    '33333333-3333-4333-8333-333333333335', // SALES_POLICY.v1 duplicate
    '3728846f-7187-420f-a1f6-c90ed678666c'  // SALES_POLICY.v1 duplicate
  ];
  
  console.log(`Deleting ${idsToDelete.length} duplicate records...\n`);
  
  for (const id of idsToDelete) {
    const { error } = await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.log(`❌ Failed to delete ${id}: ${error.message}`);
    } else {
      console.log(`✅ Deleted duplicate record: ${id}`);
    }
  }
  
  console.log('\n✨ Cleanup complete!');
  
  // Verify no more duplicates
  console.log('\n🔍 Verifying cleanup...');
  
  const organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .select('field_name')
    .eq('organization_id', organizationId)
    .in('field_name', ['SALES_POLICY.v1', 'INVENTORY_POLICY.v1', 'NOTIFICATION_POLICY.v1', 'ROLE_GRANTS.v1']);
    
  if (error) {
    console.error('Verification error:', error);
    return;
  }
  
  // Count by field_name
  const counts = data.reduce((acc, item) => {
    acc[item.field_name] = (acc[item.field_name] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\nFinal counts:');
  Object.entries(counts).forEach(([fieldName, count]) => {
    console.log(`- ${fieldName}: ${count} record(s) ${count > 1 ? '⚠️ STILL HAS DUPLICATES' : '✅'}`);
  });
  
  console.log('\n🎉 Settings should now load properly in the app!');
}

cleanupDuplicateSettings().catch(console.error);