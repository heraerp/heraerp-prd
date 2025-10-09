#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStaff() {
  try {
    // Find staff entity named 'Test'
    const { data: staff, error: staffError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, status, created_at')
      .eq('entity_type', 'STAFF')
      .ilike('entity_name', '%test%')
      .order('created_at', { ascending: false });

    if (staffError) {
      console.error('Error finding staff:', staffError);
      return;
    }

    if (!staff || staff.length === 0) {
      console.log('\n❌ No staff entities found with "Test" in name\n');
      return;
    }

    console.log('\n📋 Found Staff Entities:\n');
    staff.forEach(s => {
      console.log(`  ID: ${s.id}`);
      console.log(`  Name: ${s.entity_name}`);
      console.log(`  Status: ${s.status}`);
      console.log(`  Created: ${s.created_at}\n`);
    });

    // Check transactions for first staff member
    const staffId = staff[0].id;
    console.log(`\n🔍 Checking references for: ${staff[0].entity_name} (${staffId})\n`);

    // Transaction lines
    const { count: txnLineCount } = await supabase
      .from('universal_transaction_lines')
      .select('*', { count: 'exact', head: true })
      .eq('line_entity_id', staffId);

    // Transactions (from)
    const { count: txnFromCount } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('from_entity_id', staffId);

    // Transactions (to)
    const { count: txnToCount } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('to_entity_id', staffId);

    // Transactions (source) - CRITICAL: Check this too!
    const { count: txnSourceCount } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('source_entity_id', staffId);

    // Relationships
    const { count: relCount } = await supabase
      .from('core_relationships')
      .select('*', { count: 'exact', head: true })
      .or(`from_entity_id.eq.${staffId},to_entity_id.eq.${staffId}`)
      .eq('status', 'ACTIVE');

    console.log('📊 Reference Counts:');
    console.log(`  Transaction Lines: ${txnLineCount || 0}`);
    console.log(`  Transactions (FROM): ${txnFromCount || 0}`);
    console.log(`  Transactions (TO): ${txnToCount || 0}`);
    console.log(`  Transactions (SOURCE): ${txnSourceCount || 0}`);
    console.log(`  Active Relationships: ${relCount || 0}`);

    const total = (txnLineCount || 0) + (txnFromCount || 0) + (txnToCount || 0) + (txnSourceCount || 0);

    console.log(`\n💡 Total Blocking References: ${total}`);

    if (total > 0) {
      console.log('\n⚠️  CANNOT DELETE: Staff has transaction history');
      console.log('   HERA enforces audit trail integrity - use Archive instead\n');

      // Show actual transactions
      if (txnFromCount > 0 || txnToCount > 0 || txnSourceCount > 0) {
        const { data: transactions } = await supabase
          .from('universal_transactions')
          .select('id, transaction_type, smart_code, total_amount, created_at')
          .or(`from_entity_id.eq.${staffId},to_entity_id.eq.${staffId},source_entity_id.eq.${staffId}`)
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('   Sample Transactions:');
        transactions?.forEach(txn => {
          console.log(`   - ${txn.transaction_type}: ${txn.smart_code} (AED ${txn.total_amount || 0})`);
          console.log(`     Created: ${txn.created_at}`);
        });
      }

      if (txnLineCount > 0) {
        const { data: lines } = await supabase
          .from('universal_transaction_lines')
          .select('id, transaction_id, line_amount, created_at')
          .eq('line_entity_id', staffId)
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('\n   Sample Transaction Lines:');
        lines?.forEach(line => {
          console.log(`   - Line in transaction ${line.transaction_id} (AED ${line.line_amount || 0})`);
          console.log(`     Created: ${line.created_at}`);
        });
      }
    } else if (relCount > 0) {
      console.log('\n✅ No transaction references, but has relationships');
      console.log('   Can be deleted with cascade=true\n');

      const { data: relationships } = await supabase
        .from('core_relationships')
        .select('id, relationship_type, from_entity_id, to_entity_id, created_at')
        .or(`from_entity_id.eq.${staffId},to_entity_id.eq.${staffId}`)
        .eq('status', 'ACTIVE')
        .limit(5);

      console.log('   Sample Relationships:');
      relationships?.forEach(rel => {
        const direction = rel.from_entity_id === staffId ? 'FROM' : 'TO';
        console.log(`   - ${rel.relationship_type} (${direction})`);
        console.log(`     Created: ${rel.created_at}`);
      });
      console.log();
    } else {
      console.log('\n✅ No references found - staff can be safely deleted\n');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

checkStaff();
