import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log('📋 UPPERCASE "PRODUCT" entities found:', uppercaseProducts ? uppercaseProducts.length : 0);
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
    console.log('📋 lowercase "product" entities found:', lowercaseProducts ? lowercaseProducts.length : 0);
    if (lowercaseProducts && lowercaseProducts.length > 0) {
      console.log('Sample lowercase product data:');
      console.log(JSON.stringify(lowercaseProducts.slice(0, 3), null, 2));
    }
  }

  console.log('\n---\n');
  console.log('🔍 Organization context from .env.local:');
  console.log('DEFAULT_ORGANIZATION_ID:', envVars.DEFAULT_ORGANIZATION_ID);

  // Check if there are products in the user's organization
  const orgId = envVars.DEFAULT_ORGANIZATION_ID;
  if (orgId) {
    console.log('\n---\n');
    console.log('🔍 Checking products for organization:', orgId);

    const { data: orgUpperProducts } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name')
      .eq('entity_type', 'PRODUCT')
      .eq('organization_id', orgId);

    const { data: orgLowerProducts } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name')
      .eq('entity_type', 'product')
      .eq('organization_id', orgId);

    console.log('  - UPPERCASE PRODUCT in org:', orgUpperProducts ? orgUpperProducts.length : 0);
    console.log('  - lowercase product in org:', orgLowerProducts ? orgLowerProducts.length : 0);

    if (orgLowerProducts && orgLowerProducts.length > 0) {
      console.log('\n📋 Sample lowercase products in your org:');
      console.log(JSON.stringify(orgLowerProducts.slice(0, 5), null, 2));
    }
  }
}

checkProducts().catch(console.error);
