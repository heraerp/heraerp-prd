import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStaffStatus() {
  console.log('🔍 Checking staff status in database...\n');

  // Get all staff members with their status
  const { data: staffList, error: staffError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, status, updated_at')
    .eq('entity_type', 'STAFF')
    .order('updated_at', { ascending: false });

  if (staffError) {
    console.error('❌ Error fetching staff:', staffError);
    return;
  }

  if (!staffList || staffList.length === 0) {
    console.log('No staff members found in database');
    return;
  }

  console.log(`📊 Found ${staffList.length} staff members:\n`);

  // Group by status
  const byStatus = staffList.reduce((acc, s) => {
    if (!acc[s.status]) acc[s.status] = [];
    acc[s.status].push(s);
    return acc;
  }, {});

  // Display by status
  for (const [status, members] of Object.entries(byStatus)) {
    console.log(`\n${status.toUpperCase()} (${members.length}):`);
    members.forEach(s => {
      console.log(`  - ${s.entity_name} (${s.id.substring(0, 8)}...) - Updated: ${new Date(s.updated_at).toLocaleString()}`);
    });
  }

  // Look for test5 and Aman specifically
  console.log('\n\n🔍 Specific staff members:');
  const test5 = staffList.find(s => s.entity_name.toLowerCase().includes('test5'));
  const aman = staffList.find(s => s.entity_name.toLowerCase().includes('aman'));

  if (test5) {
    console.log(`\ntest5:`);
    console.log(`  Status: ${test5.status}`);
    console.log(`  ID: ${test5.id}`);
    console.log(`  Updated: ${new Date(test5.updated_at).toLocaleString()}`);
  } else {
    console.log('\ntest5: NOT FOUND');
  }

  if (aman) {
    console.log(`\nAman:`);
    console.log(`  Status: ${aman.status}`);
    console.log(`  ID: ${aman.id}`);
    console.log(`  Updated: ${new Date(aman.updated_at).toLocaleString()}`);
  } else {
    console.log('\nAman: NOT FOUND');
  }
}

checkStaffStatus().catch(console.error);
