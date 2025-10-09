#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

const envPath = '../.env';
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CLEAN_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('🔧 Fixing Journal Entry Test');
console.log('============================');

async function testJournalEntryCreation() {
  try {
    // First, get the actual entity IDs for our accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('core_entities')
      .select('id, entity_code, entity_name')
      .eq('organization_id', CLEAN_ORG_ID)
      .eq('entity_type', 'gl_account')
      .in('entity_code', ['1100', '4100']);
      
    if (accountsError) {
      console.log('❌ Error getting accounts:', accountsError.message);
      return;
    }
    
    console.log('📋 Found accounts:');
    accounts.forEach(acc => {
      console.log(`  ${acc.entity_code} (${acc.entity_name}): ${acc.id}`);
    });
    
    const cashAccount = accounts.find(a => a.entity_code === '1100');
    const revenueAccount = accounts.find(a => a.entity_code === '4100');
    
    if (!cashAccount || !revenueAccount) {
      console.log('❌ Required accounts not found');
      return;
    }
    
    // Create a balanced journal entry with correct entity IDs
    const { data: txData, error: txError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: CLEAN_ORG_ID,
        transaction_type: 'journal_entry',
        transaction_code: `JE-FIX-${Date.now()}`,
        transaction_date: new Date().toISOString().split('T')[0],
        smart_code: 'HERA.ACCOUNTING.JOURNAL.ENTRY.v2',
        total_amount: 1000.00,
        metadata: { test_type: 'journal_fix_validation' }
      })
      .select()
      .single();
      
    if (txError) {
      console.log('❌ Transaction creation failed:', txError.message);
      return;
    }
    
    console.log('✅ Transaction created:', txData.transaction_code);
    
    // Create balanced transaction lines with correct entity IDs
    const lines = [
      {
        transaction_id: txData.id,
        organization_id: CLEAN_ORG_ID,
        line_number: 1,
        entity_id: cashAccount.id, // Use actual UUID, not code
        line_type: 'DEBIT',
        line_amount: 1000.00,
        smart_code: 'HERA.ACCOUNTING.JOURNAL.LINE.v2'
      },
      {
        transaction_id: txData.id,
        organization_id: CLEAN_ORG_ID,
        line_number: 2,
        entity_id: revenueAccount.id, // Use actual UUID, not code
        line_type: 'CREDIT',
        line_amount: 1000.00,
        smart_code: 'HERA.ACCOUNTING.JOURNAL.LINE.v2'
      }
    ];
    
    const { error: linesError } = await supabase
      .from('universal_transaction_lines')
      .insert(lines);
      
    if (linesError) {
      console.log('❌ Lines creation failed:', linesError.message);
      return;
    }
    
    console.log('✅ Journal entry lines created successfully');
    console.log('✅ Journal entry test should now pass!');
    
    return {
      success: true,
      message: `Journal entry created: ${txData.transaction_code}`,
      data: { 
        transaction_id: txData.id,
        transaction_code: txData.transaction_code,
        lines_count: lines.length
      }
    };
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the fix
testJournalEntryCreation().then(result => {
  if (result && result.success) {
    console.log('\n🎉 Journal entry test fix completed successfully!');
    console.log('💡 The issue was using account codes instead of entity UUIDs');
    console.log('\n🚀 Now run the final test again:');
    console.log('node finance-dna-v2-final-test.mjs');
  }
});