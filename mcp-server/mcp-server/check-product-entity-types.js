const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProducts() {
  console.log('🔍 Checking product entity types in database...\n');
  
  // Check for UPPERCASE PRODUCT
  const { data: uppercaseProducts, error: upperError } = await supabase
    .from('core_entities')
    .select('id, entity_type, entity_name, organization_id, smart_code, status')
    .eq('entity_type', 'PRODUCT')
    .limit(10);
  
  if (upperError) {
    console.error('❌ Error checking PRODUCT:', upperError);
  } else {
    console.log('📋 UPPERCASE "PRODUCT" entities found:', uppercaseProducts?.length || 0);
    if (uppercaseProducts && uppercaseProducts.length > 0) {
      console.log('Sample UPPERCASE PRODUCT data:');
      console.log(JSON.stringify(uppercaseProducts.slice(0, 3), null, 2));
    }
  }
  
  console.log('\n---\n');
  
  // Check lowercase product
  const { data: lowercaseProducts, error: lowerError } = await supabase
    .from('core_entities')
    .select('id, entity_type, entity_name, organization_id, smart_code, status')
    .eq('entity_type', 'product')
    .limit(10);
  
  if (lowerError) {
    console.error('❌ Error checking product:', lowerError);
  } else {
    console.log('📋 lowercase "product" entities found:', lowercaseProducts?.length || 0);
    if (lowercaseProducts && lowercaseProducts.length > 0) {
      console.log('Sample lowercase product data:');
      console.log(JSON.stringify(lowercaseProducts.slice(0, 3), null, 2));
    }
  }
  
  console.log('\n---\n');
  console.log('🔍 Organization context from .env.local:');
  console.log('DEFAULT_ORGANIZATION_ID:', envVars.DEFAULT_ORGANIZATION_ID);
  
  // Check dynamic data for products
  if (uppercaseProducts && uppercaseProducts.length > 0) {
    console.log('\n---\n');
    console.log('🔍 Checking dynamic data for UPPERCASE PRODUCT...');
    const { data: dynamicData, error: dynError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', uppercaseProducts[0].id)
      .limit(5);
    
    if (!dynError && dynamicData) {
      console.log('Dynamic fields found:', dynamicData.length);
      console.log(JSON.stringify(dynamicData, null, 2));
    }
  }
}

checkProducts().catch(console.error);
