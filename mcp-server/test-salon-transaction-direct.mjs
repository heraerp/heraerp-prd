import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qqagokigwuujyeyrgdkq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgxMzUyNiwiZXhwIjoyMDc1Mzg5NTI2fQ.NmfOUGeCd-9o7cbJjWmWETN9NobDNkvjnQuTa0EBorg'
);

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a';

console.log('🧪 SALON TRANSACTION TEST - DEV SYSTEM');
console.log('=====================================');
console.log(`🏢 Organization: ${ORG_ID}`);
console.log(`👤 Actor: ${USER_ID}`);

// Test 1: Create a simple salon transaction
console.log('\n💰 Creating salon POS sale transaction...');

const saleTransaction = {
  transaction_type: 'SALE',
  smart_code: 'HERA.SALON.TXN.SALE.POS_INTEGRATED.v1',
  source_entity_id: 'c1234567-1234-1234-1234-123456789012', // dummy customer
  total_amount: 472.50,
  transaction_status: 'completed',
  transaction_date: new Date().toISOString(),
  organization_id: ORG_ID
};

const saleLines = [
  {
    line_number: 1,
    line_type: 'SERVICE',
    description: 'Hair Treatment Premium',
    quantity: 1,
    unit_amount: 450.00,
    line_amount: 450.00,
    smart_code: 'HERA.SALON.SERVICE.PREMIUM_TREATMENT.v1'
  },
  {
    line_number: 2,
    line_type: 'TAX',
    description: 'VAT 5%',
    quantity: 1,
    unit_amount: 22.50,
    line_amount: 22.50,
    smart_code: 'HERA.FINANCE.TAX.VAT_5PCT.v1'
  }
];

try {
  // Use the correct signature for hera_txn_crud_v1
  const payload = {
    transaction: saleTransaction,
    lines: saleLines,
    options: {}
  };

  const result = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: USER_ID,
    p_organization_id: ORG_ID,
    p_payload: payload
  });

  if (result.error) {
    console.log('❌ Transaction creation failed:', result.error);
  } else {
    console.log('✅ Transaction created successfully!');
    console.log('📋 Transaction ID:', result.data?.transaction_id);
    console.log('💰 Amount:', result.data?.total_amount);
    console.log('📊 Lines created:', result.data?.lines?.length || 0);
    
    // Test 2: Verify GL posting was triggered
    console.log('\n🧾 Checking for automatic GL posting...');
    
    const glQuery = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('transaction_type', 'GL_POSTING')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (glQuery.data && glQuery.data.length > 0) {
      console.log('✅ GL posting found:', glQuery.data[0].id);
      console.log('📊 GL transaction amount:', glQuery.data[0].total_amount);
    } else {
      console.log('⚠️ No GL posting found yet');
    }
  }
} catch (error) {
  console.log('💥 Error:', error.message);
}