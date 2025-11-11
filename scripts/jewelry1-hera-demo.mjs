#!/usr/bin/env node
/**
 * Jewelry1 HERA Integration Demo
 * 
 * Demonstrates complete integration between Jewelry1 ERP and HERA Sacred Six architecture
 * Shows: Organization setup, customer creation, product management, transaction processing
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Demo organization data
const DEMO_CONFIG = {
  organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674', // Michele Hair (Owner)
  jewelry_org_name: 'Diamond Dreams Jewelry'
}

console.log('💎 JEWELRY1 HERA INTEGRATION DEMO')
console.log('=' .repeat(60))
console.log(`🏢 Organization: ${DEMO_CONFIG.organization_id}`)
console.log(`👤 Actor: ${DEMO_CONFIG.actor_user_id}`)
console.log(`💍 Business: ${DEMO_CONFIG.jewelry_org_name}`)
console.log('')

async function demonstrateJewelry1Integration() {
  try {
    // Step 1: Verify organization exists
    console.log('🔍 Step 1: Verifying organization setup...')
    const orgCheck = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', DEMO_CONFIG.organization_id)
      .eq('entity_type', 'ORGANIZATION')
      .single()

    if (orgCheck.error) {
      console.log('❌ Organization not found, creating jewelry organization...')
      await createJewelryOrganization()
    } else {
      console.log('✅ Organization found:', orgCheck.data.entity_name)
    }

    // Step 2: Create jewelry customers
    console.log('\n👥 Step 2: Creating jewelry customers...')
    await createJewelryCustomers()

    // Step 3: Create jewelry products
    console.log('\n💎 Step 3: Creating jewelry products...')
    await createJewelryProducts()

    // Step 4: Process jewelry sales
    console.log('\n💰 Step 4: Processing jewelry sales...')
    await processJewelrySales()

    // Step 5: Generate analytics
    console.log('\n📊 Step 5: Generating analytics...')
    await generateJewelryAnalytics()

    console.log('\n🎉 JEWELRY1 HERA INTEGRATION COMPLETE!')
    console.log('🌐 Visit: http://localhost:3002/jewelry1')
    console.log('🔗 Sacred Six tables populated with jewelry business data')

  } catch (error) {
    console.error('❌ Demo failed:', error)
  }
}

async function createJewelryOrganization() {
  const result = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: DEMO_CONFIG.actor_user_id,
    p_organization_id: DEMO_CONFIG.organization_id,
    p_entity: {
      entity_type: 'ORGANIZATION',
      entity_name: DEMO_CONFIG.jewelry_org_name,
      smart_code: 'HERA.JEWELRY1.ORG.ENTITY.v1'
    },
    p_dynamic: {
      industry: {
        field_type: 'text',
        field_value_text: 'jewelry_retail',
        smart_code: 'HERA.JEWELRY1.ORG.FIELD.INDUSTRY.v1'
      },
      tax_id: {
        field_type: 'text',
        field_value_text: 'GST123456789',
        smart_code: 'HERA.JEWELRY1.ORG.FIELD.TAX_ID.v1'
      }
    },
    p_relationships: [],
    p_options: {}
  })

  if (result.error) {
    console.log('⚠️  Organization creation result:', result)
  } else {
    console.log('✅ Jewelry organization created')
  }
}

async function createJewelryCustomers() {
  const customers = [
    {
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      email: 'priya.sharma@email.com',
      category: 'vip',
      credit_limit: 500000,
      city: 'Mumbai'
    },
    {
      name: 'Rahul Patel',
      phone: '+91 87654 32109', 
      email: 'rahul.patel@email.com',
      category: 'premium',
      credit_limit: 200000,
      city: 'Ahmedabad'
    },
    {
      name: 'Sunita Mehta',
      phone: '+91 76543 21098',
      email: 'sunita.mehta@email.com',
      category: 'wholesale',
      credit_limit: 300000,
      city: 'Delhi'
    }
  ]

  for (const customer of customers) {
    const result = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: DEMO_CONFIG.actor_user_id,
      p_organization_id: DEMO_CONFIG.organization_id,
      p_entity: {
        entity_type: 'CUSTOMER',
        entity_name: customer.name,
        smart_code: 'HERA.JEWELRY1.CUSTOMER.ENTITY.v1'
      },
      p_dynamic: {
        phone: {
          field_type: 'phone',
          field_value_text: customer.phone,
          smart_code: 'HERA.JEWELRY1.CUSTOMER.FIELD.PHONE.v1',
          is_required: true,
          is_pii: true
        },
        email: {
          field_type: 'email',
          field_value_text: customer.email,
          smart_code: 'HERA.JEWELRY1.CUSTOMER.FIELD.EMAIL.v1',
          is_pii: true
        },
        category: {
          field_type: 'text',
          field_value_text: customer.category,
          smart_code: 'HERA.JEWELRY1.CUSTOMER.FIELD.CATEGORY.v1',
          is_required: true
        },
        credit_limit: {
          field_type: 'number',
          field_value_number: customer.credit_limit,
          smart_code: 'HERA.JEWELRY1.CUSTOMER.FIELD.CREDIT_LIMIT.v1'
        },
        city: {
          field_type: 'text',
          field_value_text: customer.city,
          smart_code: 'HERA.JEWELRY1.CUSTOMER.FIELD.CITY.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })

    if (result.error) {
      console.log(`⚠️  Customer ${customer.name}:`, result.error.message)
    } else {
      console.log(`✅ Customer created: ${customer.name} (${customer.category})`)
    }
  }
}

async function createJewelryProducts() {
  const products = [
    {
      name: 'Diamond Solitaire Ring 18K',
      sku: 'DSR-18K-001',
      category: 'rings',
      price: 45000,
      cost_price: 32000,
      stock_quantity: 5,
      min_stock_level: 3,
      gold_weight: 3.5,
      purity: '18K'
    },
    {
      name: 'Gold Chain Necklace 22K',
      sku: 'GCN-22K-002',
      category: 'necklaces',
      price: 28000,
      cost_price: 22000,
      stock_quantity: 8,
      min_stock_level: 5,
      gold_weight: 12.5,
      purity: '22K'
    },
    {
      name: 'Pearl Drop Earrings',
      sku: 'PDE-18K-003',
      category: 'earrings',
      price: 8500,
      cost_price: 6000,
      stock_quantity: 12,
      min_stock_level: 8,
      gold_weight: 2.1,
      purity: '18K'
    }
  ]

  for (const product of products) {
    const result = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: DEMO_CONFIG.actor_user_id,
      p_organization_id: DEMO_CONFIG.organization_id,
      p_entity: {
        entity_type: 'PRODUCT',
        entity_name: product.name,
        entity_code: product.sku,
        smart_code: 'HERA.JEWELRY1.PRODUCT.ENTITY.v1'
      },
      p_dynamic: {
        price: {
          field_type: 'number',
          field_value_number: product.price,
          smart_code: 'HERA.JEWELRY1.PRODUCT.FIELD.PRICE.v1',
          is_required: true
        },
        cost_price: {
          field_type: 'number',
          field_value_number: product.cost_price,
          smart_code: 'HERA.JEWELRY1.PRODUCT.FIELD.COST_PRICE.v1'
        },
        category: {
          field_type: 'text',
          field_value_text: product.category,
          smart_code: 'HERA.JEWELRY1.PRODUCT.FIELD.CATEGORY.v1',
          is_required: true
        },
        stock_quantity: {
          field_type: 'number',
          field_value_number: product.stock_quantity,
          smart_code: 'HERA.JEWELRY1.PRODUCT.FIELD.STOCK_QTY.v1',
          is_required: true
        },
        min_stock_level: {
          field_type: 'number',
          field_value_number: product.min_stock_level,
          smart_code: 'HERA.JEWELRY1.PRODUCT.FIELD.MIN_STOCK.v1'
        },
        gold_weight: {
          field_type: 'number',
          field_value_number: product.gold_weight,
          smart_code: 'HERA.JEWELRY1.PRODUCT.FIELD.GOLD_WEIGHT.v1'
        },
        purity: {
          field_type: 'text',
          field_value_text: product.purity,
          smart_code: 'HERA.JEWELRY1.PRODUCT.FIELD.PURITY.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })

    if (result.error) {
      console.log(`⚠️  Product ${product.name}:`, result.error.message)
    } else {
      console.log(`✅ Product created: ${product.name} - ₹${product.price.toLocaleString()}`)
    }
  }
}

async function processJewelrySales() {
  // Get customer and product IDs for transactions
  const customers = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('organization_id', DEMO_CONFIG.organization_id)
    .eq('entity_type', 'CUSTOMER')
    .limit(1)

  const products = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('organization_id', DEMO_CONFIG.organization_id)
    .eq('entity_type', 'PRODUCT')
    .limit(2)

  if (customers.data?.length > 0 && products.data?.length > 0) {
    const customerId = customers.data[0].id
    const productId = products.data[0].id

    const saleResult = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: DEMO_CONFIG.actor_user_id,
      p_organization_id: DEMO_CONFIG.organization_id,
      p_transaction: {
        transaction_type: 'SALE',
        smart_code: 'HERA.JEWELRY1.TXN.SALE.v1',
        source_entity_id: customerId,
        total_amount: 45000,
        transaction_currency_code: 'INR',
        transaction_date: new Date().toISOString(),
        transaction_status: 'COMPLETED'
      },
      p_lines: [
        {
          line_number: 1,
          line_type: 'PRODUCT',
          entity_id: productId,
          quantity: 1,
          unit_amount: 45000,
          line_amount: 45000,
          smart_code: 'HERA.JEWELRY1.TXN.SALE.LINE.v1'
        }
      ],
      p_options: {
        payment_method: 'card',
        gst_rate: 3
      }
    })

    if (saleResult.error) {
      console.log('⚠️  Sale transaction:', saleResult.error.message)
    } else {
      console.log('✅ Sale processed: ₹45,000 diamond ring sale')
    }
  } else {
    console.log('⚠️  No customers/products found for sale demo')
  }
}

async function generateJewelryAnalytics() {
  // Count entities
  const customerCount = await supabase
    .from('core_entities')
    .select('id', { count: 'exact' })
    .eq('organization_id', DEMO_CONFIG.organization_id)
    .eq('entity_type', 'CUSTOMER')

  const productCount = await supabase
    .from('core_entities')
    .select('id', { count: 'exact' })
    .eq('organization_id', DEMO_CONFIG.organization_id)
    .eq('entity_type', 'PRODUCT')

  const transactionCount = await supabase
    .from('universal_transactions')
    .select('id', { count: 'exact' })
    .eq('organization_id', DEMO_CONFIG.organization_id)

  console.log('📈 JEWELRY1 ANALYTICS:')
  console.log(`   👥 Customers: ${customerCount.count || 0}`)
  console.log(`   💎 Products: ${productCount.count || 0}`)
  console.log(`   💰 Transactions: ${transactionCount.count || 0}`)
  console.log(`   🗄️  Sacred Six: ✅ All data in HERA architecture`)
}

// Run the demo
demonstrateJewelry1Integration()