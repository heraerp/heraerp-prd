const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugAppointmentsQuery() {
  console.log('🔍 Debugging appointments query...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
  const today = new Date().toISOString().split('T')[0];
  
  console.log('Query parameters:');
  console.log('- Organization ID:', organizationId);
  console.log('- Date (today):', today);
  console.log('- Date range:', today + 'T00:00:00Z', 'to', today + 'T23:59:59Z');
  
  // Test 1: Basic query
  console.log('\n1️⃣ Testing basic appointment query:');
  const { data: basic, error: basicError } = await supabase
    .from('universal_transactions')
    .select('id, transaction_type, transaction_date, transaction_status')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'appointment')
    .limit(5);
    
  if (basicError) {
    console.log('❌ Error:', basicError.message);
  } else {
    console.log(`✅ Found ${basic?.length || 0} appointments (no date filter)`);
    basic?.forEach(apt => {
      console.log(`  - ${apt.transaction_date} (${apt.transaction_status})`);
    });
  }
  
  // Test 2: With date filter
  console.log('\n2️⃣ Testing with date filter for today:');
  const { data: todayAppts, error: todayError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'appointment')
    .gte('transaction_date', today + 'T00:00:00Z')
    .lte('transaction_date', today + 'T23:59:59Z');
    
  if (todayError) {
    console.log('❌ Error:', todayError.message);
  } else {
    console.log(`✅ Found ${todayAppts?.length || 0} appointments for today`);
  }
  
  // Test 3: Check actual dates in database
  console.log('\n3️⃣ Checking appointment dates in database:');
  const { data: dates, error: datesError } = await supabase
    .from('universal_transactions')
    .select('transaction_date')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'appointment')
    .order('transaction_date', { ascending: false })
    .limit(10);
    
  if (datesError) {
    console.log('❌ Error:', datesError.message);
  } else {
    console.log('Recent appointment dates:');
    dates?.forEach(d => {
      const date = new Date(d.transaction_date);
      console.log(`  - ${date.toISOString()} (${date.toDateString()})`);
    });
  }
  
  // Test 4: Try with joins
  console.log('\n4️⃣ Testing with entity joins:');
  const { data: withJoins, error: joinError } = await supabase
    .from('universal_transactions')
    .select(`
      id,
      transaction_date,
      transaction_status,
      metadata,
      source_entity:core_entities!universal_transactions_source_entity_id_fkey(entity_name),
      target_entity:core_entities!universal_transactions_target_entity_id_fkey(entity_name)
    `)
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'appointment')
    .limit(3);
    
  if (joinError) {
    console.log('❌ Join error:', joinError.message);
  } else {
    console.log(`✅ Found ${withJoins?.length || 0} appointments with joins`);
    withJoins?.forEach(apt => {
      console.log(`  - Customer: ${apt.source_entity?.entity_name || 'N/A'}`);
      console.log(`    Service: ${apt.metadata?.service_name || 'N/A'}`);
      console.log(`    Date: ${new Date(apt.transaction_date).toLocaleString()}`);
    });
  }
}

debugAppointmentsQuery().catch(console.error);