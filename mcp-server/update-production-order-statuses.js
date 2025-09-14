#!/usr/bin/env node
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const organizationId = 'f0af4ced-9d12-4a55-a649-b484368db249';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateProductionOrders() {
  console.log('🔄 Updating Production Order Statuses...\n');
  
  try {
    // First, get all production orders sorted by amount
    const { data: orders, error: fetchError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'production_order')
      .order('total_amount', { ascending: false });

    if (fetchError) throw fetchError;

    console.log(`Found ${orders.length} production orders:\n`);

    // Display orders with their amounts and current metadata
    orders.forEach((order, index) => {
      console.log(`${index + 1}. ID: ${order.id}`);
      console.log(`   Amount: $${order.total_amount.toLocaleString()}`);
      console.log(`   Code: ${order.transaction_code}`);
      console.log(`   Current Metadata: ${JSON.stringify(order.metadata)}\n`);
    });

    // Update orders based on amount
    const updates = [];

    // 1. Marriott Hotels Kerala (highest ~13,90,000) - completed
    const marriottOrder = orders.find(o => o.total_amount === 1390000);
    if (marriottOrder) {
      updates.push({
        id: marriottOrder.id,
        transaction_status: 'completed',
        metadata: {
          ...marriottOrder.metadata,
          customer_name: 'Marriott Hotels Kerala',
          status: 'completed',
          completion_date: new Date().toISOString(),
          completion_remarks: 'All items delivered and installed successfully',
          quality_approved: true
        }
      });
    }

    // 2. ITC Grand Chola (second highest ~13,40,000) - in_progress
    const itcOrder = orders.find(o => o.total_amount === 1340000);
    if (itcOrder) {
      updates.push({
        id: itcOrder.id,
        transaction_status: 'in_progress',
        metadata: {
          ...itcOrder.metadata,
          customer_name: 'ITC Grand Chola',
          status: 'in_progress',
          progress_percentage: 65,
          current_stage: 'Assembly and finishing',
          expected_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    }

    // 3. Modern Homes Interior (~5,59,000) - in_progress
    const modernHomesOrder = orders.find(o => o.total_amount === 559000);
    if (modernHomesOrder) {
      updates.push({
        id: modernHomesOrder.id,
        transaction_status: 'in_progress',
        metadata: {
          ...modernHomesOrder.metadata,
          customer_name: 'Modern Homes Interior',
          status: 'in_progress',
          progress_percentage: 35,
          current_stage: 'Material procurement and cutting',
          expected_completion: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    }

    // 4. Office Solutions Ltd (~2,10,000) - cancelled
    const officeOrder = orders.find(o => o.total_amount === 210000);
    if (officeOrder) {
      updates.push({
        id: officeOrder.id,
        transaction_status: 'cancelled',
        metadata: {
          ...officeOrder.metadata,
          customer_name: 'Office Solutions Ltd',
          status: 'cancelled',
          cancellation_date: new Date().toISOString(),
          cancellation_reason: 'Customer budget constraints - project postponed',
          refund_status: 'Advance refunded'
        }
      });
    }

    // 5. Rest remain as pending with customer names
    const pendingCustomers = [
      { amount: 570000, name: 'Grand Hyatt Mumbai' },
      { amount: 550000, name: 'Taj Hotels Chennai' }
    ];

    pendingCustomers.forEach(({ amount, name }) => {
      const order = orders.find(o => o.total_amount === amount);
      if (order) {
        updates.push({
          id: order.id,
          transaction_status: 'pending',
          metadata: {
            ...order.metadata,
            customer_name: name,
            status: 'pending',
            planning_stage: 'Design review',
            expected_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        });
      }
    });

    // Perform all updates
    for (const update of updates) {
      const { id, ...updateData } = update;
      const { error: updateError } = await supabase
        .from('universal_transactions')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error(`Error updating order ${id}:`, updateError);
      } else {
        console.log(`✅ Updated order for ${update.metadata.customer_name} - Status: ${update.transaction_status}`);
      }
    }

    console.log('\n🎉 Production order statuses updated successfully!');

  } catch (error) {
    console.error('Error:', error);
  }
}

updateProductionOrders();