#!/usr/bin/env node

/**
 * Create Ice Cream Transactions for August 2025
 * This creates demo financial transactions for testing the financial dashboard
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Supabase configuration with service key for write access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Ice cream organization ID
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656';

async function getEntities() {
  console.log('🔍 Fetching existing entities...');
  
  // Get suppliers
  const { data: suppliers } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'vendor')
    .limit(2);
  
  // Get customers
  const { data: customers } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'customer')
    .limit(2);
  
  // Get products
  const { data: products } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('entity_type', 'product')
    .limit(4);
  
  return { suppliers, customers, products };
}

async function createAugustTransactions() {
  console.log('💰 Creating August 2025 transactions...');
  
  const { suppliers, customers, products } = await getEntities();
  
  if (!suppliers?.length || !products?.length) {
    console.error('❌ No suppliers or products found. Run setup-kochi-icecream.js first.');
    return;
  }
  
  const transactions = [];
  
  // 1. Create purchase invoices (AP)
  console.log('\n📄 Creating purchase invoices...');
  
  // Invoice 1 - Dairy supplies
  transactions.push({
    organization_id: ORG_ID,
    transaction_type: 'purchase_invoice',
    transaction_code: `PI-AUG-001`,
    transaction_date: '2025-08-05T10:00:00Z',
    source_entity_id: suppliers[0]?.id,
    total_amount: 45000,
    transaction_status: 'pending',
    smart_code: 'HERA.FIN.AP.TXN.INVOICE.v1',
    metadata: {
      invoice_number: 'DAIRY-AUG-001',
      due_date: '2025-09-05T00:00:00Z',
      description: 'Monthly dairy supply - 2000L milk, 400kg cream',
      supplier_name: suppliers[0]?.entity_name
    }
  });
  
  // Invoice 2 - Flavoring and ingredients
  if (suppliers[1]) {
    transactions.push({
      organization_id: ORG_ID,
      transaction_type: 'purchase_invoice',
      transaction_code: `PI-AUG-002`,
      transaction_date: '2025-08-10T10:00:00Z',
      source_entity_id: suppliers[1].id,
      total_amount: 25000,
      transaction_status: 'pending',
      smart_code: 'HERA.FIN.AP.TXN.INVOICE.v1',
      metadata: {
        invoice_number: 'FLAV-AUG-001',
        due_date: '2025-09-10T00:00:00Z',
        description: 'Vanilla extract, chocolate, fruit purees',
        supplier_name: suppliers[1].entity_name
      }
    });
  }
  
  // 2. Create cold chain expenses
  console.log('❄️ Creating cold chain expenses...');
  
  transactions.push({
    organization_id: ORG_ID,
    transaction_type: 'expense',
    transaction_code: `EXP-COLD-AUG-001`,
    transaction_date: '2025-08-01T10:00:00Z',
    total_amount: 12000,
    transaction_status: 'completed',
    smart_code: 'HERA.FIN.EXP.TXN.COLDCHAIN.v1',
    metadata: {
      expense_type: 'cold_chain_energy',
      description: 'Freezer electricity - August',
      cost_center: 'PRODUCTION',
      kilowatt_hours: 3200,
      rate_per_kwh: 3.75
    }
  });
  
  transactions.push({
    organization_id: ORG_ID,
    transaction_type: 'expense',
    transaction_code: `EXP-COLD-AUG-002`,
    transaction_date: '2025-08-15T10:00:00Z',
    total_amount: 8000,
    transaction_status: 'completed',
    smart_code: 'HERA.FIN.EXP.TXN.FREEZER.v1',
    metadata: {
      expense_type: 'cold_chain_maintenance',
      description: 'Freezer compressor maintenance',
      service_provider: 'CoolTech Services'
    }
  });
  
  // 3. Create temperature wastage
  console.log('🌡️ Creating temperature incidents...');
  
  transactions.push({
    organization_id: ORG_ID,
    transaction_type: 'inventory_adjustment',
    transaction_code: `WASTE-TEMP-AUG-001`,
    transaction_date: '2025-08-08T14:30:00Z',
    total_amount: 5500,
    transaction_status: 'completed',
    smart_code: 'HERA.INV.ADJ.TXN.TEMPERATURE.v1',
    metadata: {
      adjustment_type: 'wastage',
      wastage_reason: 'temperature_excursion',
      batch_number: 'BATCH-2025-089',
      temperature_reading: -14.5,
      required_temperature: -18,
      duration_hours: 3,
      product_lost: '75L premium vanilla',
      description: 'Power outage caused temperature rise'
    }
  });
  
  transactions.push({
    organization_id: ORG_ID,
    transaction_type: 'inventory_adjustment',
    transaction_code: `WASTE-TEMP-AUG-002`,
    transaction_date: '2025-08-20T09:15:00Z',
    total_amount: 3200,
    transaction_status: 'completed',
    smart_code: 'HERA.INV.ADJ.TXN.TEMPERATURE.v1',
    metadata: {
      adjustment_type: 'wastage',
      wastage_reason: 'temperature_excursion',
      batch_number: 'BATCH-2025-095',
      temperature_reading: -15.2,
      required_temperature: -18,
      product_lost: '40L chocolate swirl',
      description: 'Freezer door left open'
    }
  });
  
  // 4. Create production batches
  console.log('🏭 Creating production batches...');
  
  const flavors = ['Vanilla Supreme', 'Chocolate Delight', 'Strawberry Fresh', 'Mango Twist'];
  for (let i = 0; i < 6; i++) {
    const batchDate = new Date('2025-08-01');
    batchDate.setDate(batchDate.getDate() + (i * 5));
    
    const outputLiters = 180 + Math.floor(Math.random() * 40);
    const efficiency = 94 + Math.random() * 6;
    const materialCost = outputLiters * 45;
    const laborCost = 3500;
    const overheadCost = 2000;
    const totalCost = materialCost + laborCost + overheadCost;
    const sellingPrice = 120;
    const margin = ((sellingPrice * outputLiters - totalCost) / (sellingPrice * outputLiters)) * 100;
    
    transactions.push({
      organization_id: ORG_ID,
      transaction_type: 'production_batch',
      transaction_code: `PROD-AUG-${String(i + 1).padStart(3, '0')}`,
      transaction_date: batchDate.toISOString(),
      total_amount: totalCost,
      transaction_status: 'completed',
      smart_code: 'HERA.MFG.PROD.TXN.BATCH.v1',
      metadata: {
        batch_number: `BATCH-2025-${100 + i}`,
        recipe: flavors[i % flavors.length],
        planned_quantity: 200,
        actual_output_liters: outputLiters,
        yield_variance_percent: efficiency - 100,
        material_cost: materialCost,
        labor_cost: laborCost,
        overhead_cost: overheadCost,
        total_cost: totalCost,
        unit_cost: totalCost / outputLiters,
        selling_price: sellingPrice,
        profit_margin: margin.toFixed(2)
      }
    });
  }
  
  // 5. Create sales transactions
  console.log('💰 Creating sales transactions...');
  
  // B2B Sales (AR)
  if (customers?.length > 0) {
    transactions.push({
      organization_id: ORG_ID,
      transaction_type: 'invoice',
      transaction_code: `SI-AUG-001`,
      transaction_date: '2025-08-12T10:00:00Z',
      source_entity_id: customers[0]?.id,
      total_amount: 65000,
      transaction_status: 'pending',
      smart_code: 'HERA.FIN.AR.TXN.INVOICE.v1',
      metadata: {
        invoice_number: 'SI-2025-0812',
        due_date: '2025-08-27T00:00:00Z',
        description: 'Bulk ice cream order - 550 units',
        customer_name: customers[0]?.entity_name
      }
    });
    
    if (customers[1]) {
      transactions.push({
        organization_id: ORG_ID,
        transaction_type: 'invoice',
        transaction_code: `SI-AUG-002`,
        transaction_date: '2025-08-18T10:00:00Z',
        source_entity_id: customers[1].id,
        total_amount: 48000,
        transaction_status: 'pending',
        smart_code: 'HERA.FIN.AR.TXN.INVOICE.v1',
        metadata: {
          invoice_number: 'SI-2025-0818',
          due_date: '2025-09-02T00:00:00Z',
          description: 'Premium collection - 400 units',
          customer_name: customers[1].entity_name
        }
      });
    }
  }
  
  // POS Sales (immediate revenue)
  for (let day = 1; day <= 25; day++) {
    const saleDate = new Date('2025-08-01');
    saleDate.setDate(day);
    
    const dailySales = 8000 + Math.floor(Math.random() * 8000);
    
    transactions.push({
      organization_id: ORG_ID,
      transaction_type: 'pos_sale',
      transaction_code: `POS-AUG-${String(day).padStart(2, '0')}`,
      transaction_date: saleDate.toISOString(),
      total_amount: dailySales,
      transaction_status: 'completed',
      smart_code: 'HERA.RETAIL.POS.TXN.SALE.v1',
      metadata: {
        payment_method: 'mixed',
        items_sold: Math.floor(dailySales / 100),
        average_price: 100,
        outlet: 'Main Store',
        cash_amount: Math.floor(dailySales * 0.3),
        card_amount: Math.floor(dailySales * 0.5),
        digital_amount: Math.floor(dailySales * 0.2)
      }
    });
  }
  
  // Insert all transactions
  console.log(`\n📤 Inserting ${transactions.length} transactions...`);
  
  const { data, error } = await supabase
    .from('universal_transactions')
    .insert(transactions);
  
  if (error) {
    console.error('❌ Error creating transactions:', error);
    return;
  }
  
  console.log('✅ Transactions created successfully!');
  
  return transactions;
}

async function summarizeFinancials() {
  console.log('\n📊 Financial Summary for August 2025:');
  console.log('═══════════════════════════════════════');
  
  // Calculate totals
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', ORG_ID)
    .gte('transaction_date', '2025-08-01T00:00:00Z')
    .lte('transaction_date', '2025-08-31T23:59:59Z');
  
  const revenue = transactions
    ?.filter(t => ['pos_sale', 'invoice'].includes(t.transaction_type))
    .reduce((sum, t) => sum + t.total_amount, 0) || 0;
  
  const coldChain = transactions
    ?.filter(t => t.smart_code?.includes('COLD') || t.smart_code?.includes('FREEZER'))
    .reduce((sum, t) => sum + t.total_amount, 0) || 0;
  
  const tempLoss = transactions
    ?.filter(t => t.smart_code?.includes('TEMPERATURE'))
    .reduce((sum, t) => sum + t.total_amount, 0) || 0;
  
  console.log(`Revenue: ₹${revenue.toLocaleString('en-IN')}`);
  console.log(`Cold Chain Costs: ₹${coldChain.toLocaleString('en-IN')} (${(coldChain/revenue*100).toFixed(1)}%)`);
  console.log(`Temperature Losses: ₹${tempLoss.toLocaleString('en-IN')}`);
  console.log('═══════════════════════════════════════');
}

async function runSetup() {
  console.log('🍦 Creating Ice Cream Financial Data for August 2025');
  console.log('══════════════════════════════════════════════════');
  
  try {
    await createAugustTransactions();
    await summarizeFinancials();
    
    console.log('\n✅ Setup complete!');
    console.log('\n📈 View the financial dashboard at:');
    console.log('   http://localhost:3000/icecream-financial');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
runSetup();