#!/usr/bin/env node
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const organizationId = process.env.DEFAULT_ORGANIZATION_ID;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateOrder() {
  // Update the transaction we just created
  const transactionId = '845d5047-d37e-4e0c-9627-f67145256dd5';
  const customerId = '16df2d07-14fc-4fa0-8fdb-3455cba0e392'; // Marriott
  const productId = '238f191c-40f0-41a9-bd7b-011f491975f6'; // Executive Desk
  
  // Update transaction with customer and smart code
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({
      source_entity_id: customerId,
      transaction_code: 'SO-FRN-2025-0001',
      smart_code: 'HERA.FURNITURE.SALES.ORDER.v1',
      metadata: {
        customer_po: 'MH-PO-2025-1234',
        delivery_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        payment_terms: 30,
        status: 'confirmed'
      }
    })
    .eq('id', transactionId);
    
  if (updateError) {
    console.error('Error updating transaction:', updateError);
  } else {
    console.log('✅ Updated transaction with customer and details');
  }
  
  // Add transaction line
  const { error: lineError } = await supabase
    .from('universal_transaction_lines')
    .insert({
      organization_id: organizationId,
      transaction_id: transactionId,
      line_number: 1,
      line_type: 'product',
      entity_id: productId,
      quantity: '10',
      unit_amount: 55000,
      line_amount: 550000,
      smart_code: 'HERA.FURNITURE.SALES.ORDER.LINE.v1'
    });
    
  if (lineError) {
    console.error('Error creating line item:', lineError);
  } else {
    console.log('✅ Created line item for Executive Desk');
  }
  
  console.log('🎉 Sales order setup completed!');
}

updateOrder();