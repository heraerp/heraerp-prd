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

async function setupPOSSystem() {
  console.log('💳 Setting up Ice Cream POS System...\n');

  try {
    // 1. Create POS Terminals
    console.log('🖥️ Creating POS Terminals...');
    const posTerminals = [
      {
        name: 'POS Terminal 1 - Main Counter',
        code: 'POS-001',
        metadata: {
          location: 'Main Store Front',
          terminal_type: 'fixed',
          hardware: 'TouchBistro T2',
          features: ['touchscreen', 'receipt_printer', 'card_reader', 'cash_drawer'],
          ip_address: '192.168.1.101',
          status: 'active'
        }
      },
      {
        name: 'POS Terminal 2 - Drive Through',
        code: 'POS-002',
        metadata: {
          location: 'Drive Through Window',
          terminal_type: 'fixed',
          hardware: 'Square Terminal',
          features: ['touchscreen', 'receipt_printer', 'card_reader'],
          ip_address: '192.168.1.102',
          status: 'active'
        }
      },
      {
        name: 'Mobile POS - Delivery',
        code: 'POS-003',
        metadata: {
          location: 'Mobile/Delivery',
          terminal_type: 'mobile',
          hardware: 'iPad with Square Reader',
          features: ['touchscreen', 'card_reader', 'mobile_printer'],
          status: 'active'
        }
      }
    ];

    const terminalIds = {};
    for (const terminal of posTerminals) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'pos_terminal',
          entity_name: terminal.name,
          entity_code: terminal.code,
          smart_code: 'HERA.POS.TERMINAL.RETAIL.v1',
          metadata: terminal.metadata
        })
        .select()
        .single();

      if (!error) {
        terminalIds[terminal.code] = data.id;
        console.log(`✅ Created: ${terminal.name}`);
      }
    }

    // 2. Create Payment Methods
    console.log('\n💰 Creating Payment Methods...');
    const paymentMethods = [
      {
        name: 'Cash',
        code: 'PAY-CASH',
        metadata: {
          payment_type: 'cash',
          processing_fee: 0,
          settlement_time: 'immediate',
          requires_change: true,
          icon: '💵',
          enabled: true
        }
      },
      {
        name: 'Credit Card',
        code: 'PAY-CARD',
        metadata: {
          payment_type: 'card',
          processor: 'Stripe',
          processing_fee: 2.9, // percentage
          fixed_fee: 0.30, // fixed amount
          settlement_time: '2-3 days',
          accepted_cards: ['Visa', 'Mastercard', 'Amex', 'Discover'],
          icon: '💳',
          enabled: true
        }
      },
      {
        name: 'Debit Card',
        code: 'PAY-DEBIT',
        metadata: {
          payment_type: 'debit',
          processor: 'Stripe',
          processing_fee: 2.2,
          fixed_fee: 0.10,
          settlement_time: '1-2 days',
          pin_required: true,
          icon: '💳',
          enabled: true
        }
      },
      {
        name: 'UPI Payment',
        code: 'PAY-UPI',
        metadata: {
          payment_type: 'upi',
          processor: 'Razorpay',
          processing_fee: 0,
          settlement_time: 'immediate',
          upi_apps: ['GooglePay', 'PhonePe', 'Paytm', 'BHIM'],
          icon: '📱',
          enabled: true
        }
      },
      {
        name: 'Digital Wallet',
        code: 'PAY-WALLET',
        metadata: {
          payment_type: 'wallet',
          wallets: ['Apple Pay', 'Google Pay', 'Samsung Pay'],
          processing_fee: 2.5,
          settlement_time: '1-2 days',
          icon: '📲',
          enabled: true
        }
      },
      {
        name: 'Store Credit',
        code: 'PAY-CREDIT',
        metadata: {
          payment_type: 'store_credit',
          processing_fee: 0,
          settlement_time: 'immediate',
          requires_customer: true,
          icon: '🎁',
          enabled: true
        }
      }
    ];

    const paymentMethodIds = {};
    for (const method of paymentMethods) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'payment_method',
          entity_name: method.name,
          entity_code: method.code,
          smart_code: 'HERA.POS.PAYMENT.METHOD.v1',
          metadata: method.metadata
        })
        .select()
        .single();

      if (!error) {
        paymentMethodIds[method.code] = data.id;
        console.log(`✅ Created: ${method.name} ${method.metadata.icon}`);
      }
    }

    // 3. Update Product Pricing
    console.log('\n🏷️ Updating Product Pricing...');
    
    // Fetch all products
    const { data: products } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'product');

    const productPricing = {
      'ICE-VANILLA-001': { price: 45, cost: 18, tax_rate: 5, category: 'cups' },
      'ICE-CHOCO-001': { price: 55, cost: 22, tax_rate: 5, category: 'cups' },
      'ICE-STRAW-001': { price: 50, cost: 20, tax_rate: 5, category: 'cups' },
      'ICE-MANGO-FAM': { price: 180, cost: 72, tax_rate: 5, category: 'family_packs' },
      'ICE-BUTTER-FAM': { price: 160, cost: 64, tax_rate: 5, category: 'family_packs' },
      'ICE-SF-VANILLA': { price: 60, cost: 28, tax_rate: 5, category: 'sugar_free' },
      'ICE-KULFI-001': { price: 35, cost: 14, tax_rate: 5, category: 'kulfi' },
      'ICE-KULFI-002': { price: 40, cost: 16, tax_rate: 5, category: 'kulfi' },
      'ICE-SORBET-001': { price: 45, cost: 15, tax_rate: 5, category: 'sorbet' },
      'ICE-BAR-001': { price: 25, cost: 10, tax_rate: 5, category: 'bars' },
      'SKU-VAN-500ML': { price: 120, cost: 48, tax_rate: 5, category: 'tubs' },
      'SKU-MANGO-100ML': { price: 30, cost: 12, tax_rate: 5, category: 'cups' },
      'SKU-CHOCO-CONE': { price: 35, cost: 14, tax_rate: 5, category: 'cones' }
    };

    if (products) {
      for (const product of products) {
        const pricing = productPricing[product.entity_code] || {
          price: Math.floor(Math.random() * 100) + 20,
          cost: Math.floor(Math.random() * 40) + 10,
          tax_rate: 5,
          category: 'other'
        };

        const { error } = await supabase
          .from('core_entities')
          .update({
            metadata: {
              ...product.metadata,
              ...pricing,
              pos_enabled: true,
              barcode: `8901030${Math.random().toString().slice(2, 8)}`,
              display_name: product.entity_name,
              pos_category: pricing.category,
              quick_key: product.entity_code.slice(-3),
              modifiers: pricing.category === 'cups' ? ['Extra Scoop +₹20', 'Chocolate Sauce +₹10'] : []
            }
          })
          .eq('id', product.id);

        if (!error) {
          console.log(`✅ Updated pricing: ${product.entity_name} - ₹${pricing.price}`);
        }
      }
    }

    // 4. Create POS Categories
    console.log('\n📂 Creating POS Categories...');
    const categories = [
      { name: 'Cups & Cones', code: 'CAT-CUPS', icon: '🍦', sort_order: 1 },
      { name: 'Family Packs', code: 'CAT-FAMILY', icon: '👨‍👩‍👧‍👦', sort_order: 2 },
      { name: 'Tubs', code: 'CAT-TUBS', icon: '🪣', sort_order: 3 },
      { name: 'Kulfi', code: 'CAT-KULFI', icon: '🍡', sort_order: 4 },
      { name: 'Sugar Free', code: 'CAT-SF', icon: '🍃', sort_order: 5 },
      { name: 'Bars & Sticks', code: 'CAT-BARS', icon: '🍫', sort_order: 6 },
      { name: 'Sorbets', code: 'CAT-SORBET', icon: '🍋', sort_order: 7 }
    ];

    for (const category of categories) {
      await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'pos_category',
          entity_name: category.name,
          entity_code: category.code,
          smart_code: 'HERA.POS.CATEGORY.RETAIL.v1',
          metadata: {
            icon: category.icon,
            sort_order: category.sort_order,
            color: `hsl(${category.sort_order * 50}, 70%, 50%)`,
            active: true
          }
        });
      console.log(`✅ Created category: ${category.icon} ${category.name}`);
    }

    // 5. Create Tax Rules
    console.log('\n📋 Creating Tax Rules...');
    const taxRules = [
      {
        name: 'GST 5% - Food Items',
        code: 'TAX-GST-5',
        metadata: {
          tax_type: 'GST',
          rate: 5,
          components: {
            CGST: 2.5,
            SGST: 2.5
          },
          applicable_to: 'all_products',
          inclusive: false
        }
      },
      {
        name: 'Service Charge',
        code: 'TAX-SERVICE',
        metadata: {
          tax_type: 'service',
          rate: 10,
          applicable_to: 'dine_in_only',
          inclusive: false,
          optional: true
        }
      }
    ];

    for (const tax of taxRules) {
      await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'tax_rule',
          entity_name: tax.name,
          entity_code: tax.code,
          smart_code: 'HERA.POS.TAX.RULE.v1',
          metadata: tax.metadata
        });
      console.log(`✅ Created tax rule: ${tax.name}`);
    }

    // 6. Link POS Terminals to Locations
    console.log('\n🔗 Linking POS Terminals to Locations...');
    
    // Get main outlet
    const { data: outlet } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'location')
      .eq('entity_code', 'OUTLET-001')
      .single();

    if (outlet && terminalIds['POS-001']) {
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: ORG_ID,
          from_entity_id: terminalIds['POS-001'],
          to_entity_id: outlet.id,
          relationship_type: 'located_at',
          smart_code: 'HERA.POS.REL.TERMINAL.LOCATION.v1'
        });
      console.log(`✅ Linked POS-001 to ${outlet.entity_name}`);
    }

    // 7. Create Sample POS Transaction
    console.log('\n🧾 Creating Sample POS Transaction...');
    
    const sampleTransaction = {
      organization_id: ORG_ID,
      transaction_type: 'pos_sale',
      transaction_code: `POS-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.POS.SALE.RETAIL.v1',
      total_amount: 250, // Will be calculated
      metadata: {
        terminal_id: terminalIds['POS-001'],
        cashier: 'Priya Sharma',
        shift: 'morning',
        order_type: 'walk_in',
        customer_count: 2,
        payment_method: 'UPI',
        payment_details: {
          method_id: paymentMethodIds['PAY-UPI'],
          amount_tendered: 250,
          transaction_ref: 'UPI-123456789',
          status: 'completed'
        },
        tax_details: {
          subtotal: 238.10,
          tax_amount: 11.90,
          total: 250.00
        }
      }
    };

    const { data: posTransaction, error: posError } = await supabase
      .from('universal_transactions')
      .insert(sampleTransaction)
      .select()
      .single();

    if (posTransaction) {
      console.log(`✅ Created POS Sale: ${posTransaction.transaction_code}`);
      console.log(`   • Amount: ₹${posTransaction.total_amount}`);
      console.log(`   • Payment: ${sampleTransaction.metadata.payment_method}`);
      console.log(`   • Terminal: POS-001`);
    }

    console.log('\n✅ POS System setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- POS Terminals: ${posTerminals.length}`);
    console.log(`- Payment Methods: ${paymentMethods.length}`);
    console.log(`- Product Categories: ${categories.length}`);
    console.log(`- Tax Rules: ${taxRules.length}`);
    console.log(`- Products with Pricing: ${products?.length || 0}`);

  } catch (error) {
    console.error('Error setting up POS system:', error);
  }
}

// Run the setup
setupPOSSystem();