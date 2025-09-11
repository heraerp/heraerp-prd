#!/usr/bin/env node
/**
 * Check schema of universal_transactions table
 * Provides detailed information about the table structure
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTransactionsSchema() {
  console.log('\n📊 Checking universal_transactions Table Schema...\n');

  try {
    // First, try to get a sample transaction to see actual columns
    const { data: sample, error: sampleError } = await supabase
      .from('universal_transactions')
      .select('*')
      .limit(1)
      .single();

    if (sampleError && sampleError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error accessing table:', sampleError.message);
      return;
    }

    if (sample) {
      console.log('✅ Table exists and is accessible\n');
      console.log('📋 Column Details:');
      console.log('=====================================');
      
      Object.entries(sample).forEach(([key, value]) => {
        const type = value === null ? 'null' : typeof value;
        const valueDisplay = value === null ? 'NULL' : 
                           type === 'object' ? JSON.stringify(value).substring(0, 50) + '...' :
                           String(value).substring(0, 50);
        
        console.log(`  ${key}:`);
        console.log(`    Type: ${type}`);
        console.log(`    Sample: ${valueDisplay}`);
        console.log('');
      });

      // Get some statistics
      const { count: totalCount } = await supabase
        .from('universal_transactions')
        .select('*', { count: 'exact', head: true });

      console.log('\n📊 Table Statistics:');
      console.log('=====================================');
      console.log(`  Total Records: ${totalCount || 0}`);

      // Get transaction types distribution
      const { data: types } = await supabase
        .from('universal_transactions')
        .select('transaction_type')
        .not('transaction_type', 'is', null);

      if (types && types.length > 0) {
        const typeCounts = {};
        types.forEach(t => {
          typeCounts[t.transaction_type] = (typeCounts[t.transaction_type] || 0) + 1;
        });

        console.log('\n  Transaction Types Distribution:');
        Object.entries(typeCounts)
          .sort(([,a], [,b]) => b - a)
          .forEach(([type, count]) => {
            console.log(`    - ${type}: ${count}`);
          });
      }

      // Get smart code patterns
      const { data: smartCodes } = await supabase
        .from('universal_transactions')
        .select('smart_code')
        .not('smart_code', 'is', null)
        .limit(10);

      if (smartCodes && smartCodes.length > 0) {
        console.log('\n  Sample Smart Codes:');
        [...new Set(smartCodes.map(s => s.smart_code))].slice(0, 5).forEach(code => {
          console.log(`    - ${code}`);
        });
      }

    } else {
      console.log('ℹ️  Table exists but is empty\n');
      
      // Try to get column info through empty select
      const { data: emptyData, error: emptyError } = await supabase
        .from('universal_transactions')
        .select('*')
        .limit(0);

      if (!emptyError) {
        console.log('📋 Expected columns based on HERA schema:');
        console.log('=====================================');
        const expectedColumns = [
          'id (uuid)',
          'organization_id (uuid) - Multi-tenant isolation',
          'transaction_type (text) - Type of transaction',
          'transaction_date (timestamp)',
          'transaction_code (text) - Unique transaction identifier',
          'smart_code (text) - Business intelligence code',
          'reference_entity_id (uuid) - Reference to entity',
          'from_entity_id (uuid) - Source entity',
          'to_entity_id (uuid) - Destination entity',
          'quantity (decimal)',
          'unit_of_measure (text)',
          'unit_price (decimal)',
          'total_amount (decimal)',
          'currency (text)',
          'tax_amount (decimal)',
          'discount_amount (decimal)',
          'gl_posted (boolean)',
          'validation_status (text)',
          'approval_status (text)',
          'posting_date (timestamp)',
          'period (text)',
          'fiscal_year (integer)',
          'created_by (uuid)',
          'updated_by (uuid)',
          'created_at (timestamp)',
          'updated_at (timestamp)',
          'metadata (jsonb) - Additional flexible data',
          'ai_suggestion (text)',
          'ai_confidence (decimal)'
        ];
        
        expectedColumns.forEach(col => console.log(`  - ${col}`));
      }
    }

    // Check relationships with other tables
    console.log('\n🔗 Key Relationships:');
    console.log('=====================================');
    console.log('  - organization_id → core_organizations.id');
    console.log('  - reference_entity_id → core_entities.id');
    console.log('  - from_entity_id → core_entities.id');
    console.log('  - to_entity_id → core_entities.id');
    console.log('  - created_by → auth.users.id');
    console.log('  - universal_transaction_lines.transaction_id → id');

    // Important notes
    console.log('\n📌 Important Notes:');
    console.log('=====================================');
    console.log('  1. Use "transaction_code" NOT "transaction_number"');
    console.log('  2. Always include organization_id for multi-tenant isolation');
    console.log('  3. Smart codes enable automatic GL posting');
    console.log('  4. Metadata field stores flexible business data');
    console.log('  5. Transaction lines stored in universal_transaction_lines table');

  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Run the check
checkTransactionsSchema().catch(console.error);