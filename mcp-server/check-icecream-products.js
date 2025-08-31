#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ice cream organization ID
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656';

async function checkProducts() {
  console.log('Checking products in ice cream organization...\n');

  // Check for products
  const { data: products, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'product');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${products?.length || 0} products`);
  
  if (products && products.length > 0) {
    console.log('\nProducts:');
    products.forEach(p => {
      console.log(`- ${p.entity_name} (${p.entity_code}) - Price: ₹${p.metadata?.price || 0}`);
    });
  } else {
    console.log('\nNo products found. Need to create products first!');
  }
}

checkProducts();