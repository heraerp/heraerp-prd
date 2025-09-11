const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testRLS() {
  console.log('🔧 Testing Supabase RLS Connection...\n');

  // Check environment variables
  console.log('1️⃣ Environment Variables:');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('   SUPABASE_URL:', url ? '✅ Set' : '❌ Missing');
  console.log('   SERVICE_ROLE_KEY:', serviceKey ? '✅ Set' : '❌ Missing');
  console.log();

  if (!url || !serviceKey) {
    console.log('❌ Missing required environment variables!');
    return;
  }

  // Test with service role key
  console.log('2️⃣ Testing Insert with Service Role Key:');
  
  const supabase = createClient(url, serviceKey);
  
  const testEntity = {
    entity_type: 'test_tender',
    entity_name: 'Test Tender RLS',
    organization_id: 'f0af4ced-9d12-4a55-a649-b484368db249',
    smart_code: 'HERA.TEST.TENDER.v1',
    status: 'active'
  };
  
  console.log('   Inserting:', testEntity);
  
  const { data, error } = await supabase
    .from('core_entities')
    .insert(testEntity)
    .select()
    .single();

  if (error) {
    console.log('\n❌ INSERT FAILED!');
    console.log('   Error Code:', error.code);
    console.log('   Error Message:', error.message);
    console.log('   Error Details:', error.details);
    console.log('   Error Hint:', error.hint);
  } else {
    console.log('\n✅ INSERT SUCCESSFUL!');
    console.log('   Created ID:', data.id);
    console.log('   Entity Name:', data.entity_name);
    
    // Clean up
    await supabase
      .from('core_entities')
      .delete()
      .eq('id', data.id);
    
    console.log('   🧹 Cleaned up test data');
  }
  
  // Test query
  console.log('\n3️⃣ Testing Query:');
  const { count, error: queryError } = await supabase
    .from('core_entities')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', 'f0af4ced-9d12-4a55-a649-b484368db249');
  
  if (queryError) {
    console.log('   ❌ Query Error:', queryError.message);
  } else {
    console.log('   ✅ Total entities for this org:', count);
  }
}

testRLS().catch(console.error);