const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

    console.log('🔍 Checking all entity types in organization...\n');

    // Get all unique entity types
    const { data: entities, error } = await supabase
      .from('core_entities')
      .select('entity_type')
      .eq('organization_id', orgId);

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    // Count by entity type
    const types = {};
    for (const entity of entities || []) {
      types[entity.entity_type] = (types[entity.entity_type] || 0) + 1;
    }

    console.log('📊 Entity Types in Organization:\n');
    const sortedTypes = Object.entries(types).sort((a, b) => b[1] - a[1]);

    for (const [type, count] of sortedTypes) {
      const isUpper = type === type.toUpperCase();
      const icon = isUpper ? '✅' : '⚠️';
      console.log(`${icon} ${type.padEnd(30)} → ${count} entities`);
    }

    // Check for appointment-related entity types
    console.log('\n🎯 Appointment-related entity types:');
    const appointmentTypes = sortedTypes.filter(([type]) =>
      type.toLowerCase().includes('appoint') ||
      type.toLowerCase().includes('booking')
    );

    if (appointmentTypes.length === 0) {
      console.log('   None found');
    } else {
      for (const [type, count] of appointmentTypes) {
        console.log(`   - ${type}: ${count} entities`);

        // Show sample
        const { data: sample } = await supabase
          .from('core_entities')
          .select('id, entity_name')
          .eq('organization_id', orgId)
          .eq('entity_type', type)
          .limit(3);

        for (const s of sample || []) {
          console.log(`     • ${s.entity_name}`);
        }
      }
    }

    // Check transactions for appointments
    console.log('\n📋 Checking universal_transactions for appointment data...');
    const { data: txns } = await supabase
      .from('universal_transactions')
      .select('transaction_type')
      .eq('organization_id', orgId);

    const txnTypes = {};
    for (const txn of txns || []) {
      txnTypes[txn.transaction_type] = (txnTypes[txn.transaction_type] || 0) + 1;
    }

    console.log('\n📊 Transaction Types:');
    for (const [type, count] of Object.entries(txnTypes).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${type}: ${count} transactions`);
    }

  } catch (err) {
    console.log('❌ Error:', err.message);
  }
})();
