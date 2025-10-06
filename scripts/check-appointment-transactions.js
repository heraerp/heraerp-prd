const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

    console.log('🔍 Checking APPOINTMENT transactions...\n');

    // Get appointment transactions
    const { data: appointments, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', orgId)
      .eq('transaction_type', 'APPOINTMENT')
      .order('transaction_date', { ascending: false })
      .limit(5);

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log(`📋 Found ${appointments?.length || 0} recent appointments\n`);

    for (const apt of appointments || []) {
      console.log('='.repeat(80));
      console.log('Transaction Code:', apt.transaction_code);
      console.log('Transaction Date:', apt.transaction_date);
      console.log('Total Amount:', apt.total_amount);
      console.log('Status:', apt.transaction_status);
      console.log('='.repeat(80));
      console.log('\n📊 Metadata:');
      console.log(JSON.stringify(apt.metadata, null, 2));

      // Check source and target entities
      if (apt.source_entity_id) {
        const { data: source } = await supabase
          .from('core_entities')
          .select('id, entity_name, entity_type')
          .eq('id', apt.source_entity_id)
          .single();

        console.log('\n👤 Source Entity (Customer):');
        if (source) {
          console.log(`  Name: ${source.entity_name}`);
          console.log(`  Type: ${source.entity_type}`);
          console.log(`  ID: ${source.id}`);
        } else {
          console.log('  Not found');
        }
      }

      if (apt.target_entity_id) {
        const { data: target } = await supabase
          .from('core_entities')
          .select('id, entity_name, entity_type')
          .eq('id', apt.target_entity_id)
          .single();

        console.log('\n🧑 Target Entity (Staff/Branch):');
        if (target) {
          console.log(`  Name: ${target.entity_name}`);
          console.log(`  Type: ${target.entity_type}`);
          console.log(`  ID: ${target.id}`);
        } else {
          console.log('  Not found');
        }
      }

      // Check transaction lines
      const { data: lines } = await supabase
        .from('universal_transaction_lines')
        .select('*')
        .eq('transaction_id', apt.id);

      console.log(`\n📝 Transaction Lines: ${lines?.length || 0}`);
      for (const line of lines || []) {
        console.log(`\n  Line ${line.line_number}:`);
        console.log(`    Description: ${line.description}`);
        console.log(`    Amount: ${line.line_amount}`);
        console.log(`    Entity ID: ${line.entity_id}`);

        if (line.entity_id) {
          const { data: entity } = await supabase
            .from('core_entities')
            .select('entity_name, entity_type')
            .eq('id', line.entity_id)
            .single();

          if (entity) {
            console.log(`    Entity: ${entity.entity_name} (${entity.entity_type})`);
          }
        }
      }

      console.log('\n');
    }

  } catch (err) {
    console.log('❌ Error:', err.message);
    console.log(err.stack);
  }
})();
