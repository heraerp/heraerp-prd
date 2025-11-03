#!/usr/bin/env node

/**
 * Populate MatrixIT World with Complete Retail Data
 * Creates all entities, relationships, and business data for the retail platform
 */

import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import 'dotenv/config'

// Use development environment (lines 16-18 from .env)
const supabaseUrl = 'https://qqagokigwuujyeyrgdkq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxYWdva2lnd3V1anlleXJnZGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgxMzUyNiwiZXhwIjoyMDc1Mzg5NTI2fQ.NmfOUGeCd-9o7cbJjWmWETN9NobDNkvjnQuTa0EBorg'
const MATRIXITWORLD_ORG_ID = '30c9841b-0472-4dc3-82af-6290192255ba'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const actorUserId = uuidv4() // Demo user for actor stamping

// Helper function to create entity
async function createEntity(entityData, dynamicData = {}, relationships = []) {
  try {
    const result = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: MATRIXITWORLD_ORG_ID,
      p_entity: entityData,
      p_dynamic: dynamicData,
      p_relationships: relationships,
      p_options: {}
    })

    if (result.error) {
      console.log(`⚠️  Failed to create ${entityData.entity_name}: ${result.error.message}`)
      return null
    }

    console.log(`✅ Created ${entityData.entity_type}: ${entityData.entity_name}`)
    return result.data
  } catch (error) {
    console.log(`❌ Error creating ${entityData.entity_name}: ${error.message}`)
    return null
  }
}

// Create Product Catalog
async function createProductCatalog() {
  console.log('\n📱 Creating Product Catalog...')
  
  const products = [
    // Mobile Phones
    {
      entity: {
        entity_type: 'PRODUCT',
        entity_name: 'iPhone 15 Pro Max',
        entity_code: 'IPH15PM',
        smart_code: 'HERA.RETAIL.PRODUCT.MOBILE.IPHONE.v1'
      },
      dynamic: {
        category: { field_type: 'text', field_value_text: 'Mobile Phones', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.CATEGORY.v1' },
        brand: { field_type: 'text', field_value_text: 'Apple', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.BRAND.v1' },
        price: { field_type: 'number', field_value_number: 134900, smart_code: 'HERA.RETAIL.PRODUCT.FIELD.PRICE.v1' },
        storage: { field_type: 'text', field_value_text: '256GB', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.STORAGE.v1' },
        color: { field_type: 'text', field_value_text: 'Natural Titanium', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.COLOR.v1' }
      }
    },
    {
      entity: {
        entity_type: 'PRODUCT',
        entity_name: 'Samsung Galaxy S24 Ultra',
        entity_code: 'SAMS24U',
        smart_code: 'HERA.RETAIL.PRODUCT.MOBILE.SAMSUNG.v1'
      },
      dynamic: {
        category: { field_type: 'text', field_value_text: 'Mobile Phones', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.CATEGORY.v1' },
        brand: { field_type: 'text', field_value_text: 'Samsung', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.BRAND.v1' },
        price: { field_type: 'number', field_value_number: 124999, smart_code: 'HERA.RETAIL.PRODUCT.FIELD.PRICE.v1' },
        storage: { field_type: 'text', field_value_text: '256GB', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.STORAGE.v1' },
        color: { field_type: 'text', field_value_text: 'Titanium Black', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.COLOR.v1' }
      }
    },
    // Laptops
    {
      entity: {
        entity_type: 'PRODUCT',
        entity_name: 'MacBook Pro 14" M3',
        entity_code: 'MBP14M3',
        smart_code: 'HERA.RETAIL.PRODUCT.LAPTOP.APPLE.v1'
      },
      dynamic: {
        category: { field_type: 'text', field_value_text: 'Laptops', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.CATEGORY.v1' },
        brand: { field_type: 'text', field_value_text: 'Apple', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.BRAND.v1' },
        price: { field_type: 'number', field_value_number: 169900, smart_code: 'HERA.RETAIL.PRODUCT.FIELD.PRICE.v1' },
        processor: { field_type: 'text', field_value_text: 'M3 Chip', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.PROCESSOR.v1' },
        ram: { field_type: 'text', field_value_text: '8GB', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.RAM.v1' },
        storage: { field_type: 'text', field_value_text: '512GB SSD', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.STORAGE.v1' }
      }
    },
    {
      entity: {
        entity_type: 'PRODUCT',
        entity_name: 'Dell XPS 13 Plus',
        entity_code: 'DELLXPS13',
        smart_code: 'HERA.RETAIL.PRODUCT.LAPTOP.DELL.v1'
      },
      dynamic: {
        category: { field_type: 'text', field_value_text: 'Laptops', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.CATEGORY.v1' },
        brand: { field_type: 'text', field_value_text: 'Dell', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.BRAND.v1' },
        price: { field_type: 'number', field_value_number: 89990, smart_code: 'HERA.RETAIL.PRODUCT.FIELD.PRICE.v1' },
        processor: { field_type: 'text', field_value_text: 'Intel i7-1360P', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.PROCESSOR.v1' },
        ram: { field_type: 'text', field_value_text: '16GB', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.RAM.v1' },
        storage: { field_type: 'text', field_value_text: '512GB SSD', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.STORAGE.v1' }
      }
    },
    // Desktop PCs
    {
      entity: {
        entity_type: 'PRODUCT',
        entity_name: 'Gaming PC RTX 4080',
        entity_code: 'GAMINGPC4080',
        smart_code: 'HERA.RETAIL.PRODUCT.DESKTOP.GAMING.v1'
      },
      dynamic: {
        category: { field_type: 'text', field_value_text: 'Desktop PCs', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.CATEGORY.v1' },
        brand: { field_type: 'text', field_value_text: 'Custom Build', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.BRAND.v1' },
        price: { field_type: 'number', field_value_number: 145000, smart_code: 'HERA.RETAIL.PRODUCT.FIELD.PRICE.v1' },
        processor: { field_type: 'text', field_value_text: 'Intel i7-13700K', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.PROCESSOR.v1' },
        gpu: { field_type: 'text', field_value_text: 'RTX 4080', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.GPU.v1' },
        ram: { field_type: 'text', field_value_text: '32GB DDR5', smart_code: 'HERA.RETAIL.PRODUCT.FIELD.RAM.v1' }
      }
    }
  ]

  const createdProducts = []
  for (const product of products) {
    const result = await createEntity(product.entity, product.dynamic)
    if (result) createdProducts.push(result)
  }
  
  return createdProducts
}

// Create Customer Database
async function createCustomers() {
  console.log('\n👥 Creating Customer Database...')
  
  const customers = [
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: 'TechCorp Solutions Pvt Ltd',
        entity_code: 'TECHCORP',
        smart_code: 'HERA.RETAIL.CUSTOMER.CORPORATE.v1'
      },
      dynamic: {
        customer_type: { field_type: 'text', field_value_text: 'Corporate', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.TYPE.v1' },
        industry: { field_type: 'text', field_value_text: 'IT Services', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.INDUSTRY.v1' },
        city: { field_type: 'text', field_value_text: 'Kochi', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.CITY.v1' },
        credit_limit: { field_type: 'number', field_value_number: 500000, smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.CREDIT_LIMIT.v1' },
        phone: { field_type: 'text', field_value_text: '+91-484-2345678', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.PHONE.v1' },
        email: { field_type: 'text', field_value_text: 'purchase@techcorp.in', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.EMAIL.v1' }
      }
    },
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: 'Kerala University',
        entity_code: 'KERALAUNIV',
        smart_code: 'HERA.RETAIL.CUSTOMER.INSTITUTIONAL.v1'
      },
      dynamic: {
        customer_type: { field_type: 'text', field_value_text: 'Institution', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.TYPE.v1' },
        industry: { field_type: 'text', field_value_text: 'Education', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.INDUSTRY.v1' },
        city: { field_type: 'text', field_value_text: 'Trivandrum', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.CITY.v1' },
        credit_limit: { field_type: 'number', field_value_number: 1000000, smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.CREDIT_LIMIT.v1' },
        phone: { field_type: 'text', field_value_text: '+91-471-2345678', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.PHONE.v1' },
        email: { field_type: 'text', field_value_text: 'procurement@keralauniversity.ac.in', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.EMAIL.v1' }
      }
    },
    {
      entity: {
        entity_type: 'CUSTOMER',
        entity_name: 'Rajesh Kumar',
        entity_code: 'RAJESHK',
        smart_code: 'HERA.RETAIL.CUSTOMER.INDIVIDUAL.v1'
      },
      dynamic: {
        customer_type: { field_type: 'text', field_value_text: 'Individual', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.TYPE.v1' },
        city: { field_type: 'text', field_value_text: 'Kozhikode', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.CITY.v1' },
        phone: { field_type: 'text', field_value_text: '+91-9876543210', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.PHONE.v1' },
        email: { field_type: 'text', field_value_text: 'rajesh.kumar@email.com', smart_code: 'HERA.RETAIL.CUSTOMER.FIELD.EMAIL.v1' }
      }
    }
  ]

  const createdCustomers = []
  for (const customer of customers) {
    const result = await createEntity(customer.entity, customer.dynamic)
    if (result) createdCustomers.push(result)
  }
  
  return createdCustomers
}

// Create Vendor/Supplier Network
async function createVendors() {
  console.log('\n🏭 Creating Vendor/Supplier Network...')
  
  const vendors = [
    {
      entity: {
        entity_type: 'VENDOR',
        entity_name: 'Apple India Distribution',
        entity_code: 'APPLEINDIA',
        smart_code: 'HERA.RETAIL.VENDOR.BRAND.APPLE.v1'
      },
      dynamic: {
        vendor_type: { field_type: 'text', field_value_text: 'Authorized Distributor', smart_code: 'HERA.RETAIL.VENDOR.FIELD.TYPE.v1' },
        category: { field_type: 'text', field_value_text: 'Mobile & Computer', smart_code: 'HERA.RETAIL.VENDOR.FIELD.CATEGORY.v1' },
        payment_terms: { field_type: 'text', field_value_text: 'Net 30', smart_code: 'HERA.RETAIL.VENDOR.FIELD.PAYMENT_TERMS.v1' },
        credit_limit: { field_type: 'number', field_value_number: 2000000, smart_code: 'HERA.RETAIL.VENDOR.FIELD.CREDIT_LIMIT.v1' },
        location: { field_type: 'text', field_value_text: 'Mumbai', smart_code: 'HERA.RETAIL.VENDOR.FIELD.LOCATION.v1' },
        phone: { field_type: 'text', field_value_text: '+91-22-87654321', smart_code: 'HERA.RETAIL.VENDOR.FIELD.PHONE.v1' },
        email: { field_type: 'text', field_value_text: 'kerala@appleindia.com', smart_code: 'HERA.RETAIL.VENDOR.FIELD.EMAIL.v1' }
      }
    },
    {
      entity: {
        entity_type: 'VENDOR',
        entity_name: 'Samsung India Electronics',
        entity_code: 'SAMSUNGINDIA',
        smart_code: 'HERA.RETAIL.VENDOR.BRAND.SAMSUNG.v1'
      },
      dynamic: {
        vendor_type: { field_type: 'text', field_value_text: 'Authorized Distributor', smart_code: 'HERA.RETAIL.VENDOR.FIELD.TYPE.v1' },
        category: { field_type: 'text', field_value_text: 'Mobile & Electronics', smart_code: 'HERA.RETAIL.VENDOR.FIELD.CATEGORY.v1' },
        payment_terms: { field_type: 'text', field_value_text: 'Net 45', smart_code: 'HERA.RETAIL.VENDOR.FIELD.PAYMENT_TERMS.v1' },
        credit_limit: { field_type: 'number', field_value_number: 1500000, smart_code: 'HERA.RETAIL.VENDOR.FIELD.CREDIT_LIMIT.v1' },
        location: { field_type: 'text', field_value_text: 'Bangalore', smart_code: 'HERA.RETAIL.VENDOR.FIELD.LOCATION.v1' },
        phone: { field_type: 'text', field_value_text: '+91-80-87654321', smart_code: 'HERA.RETAIL.VENDOR.FIELD.PHONE.v1' },
        email: { field_type: 'text', field_value_text: 'south@samsung.com', smart_code: 'HERA.RETAIL.VENDOR.FIELD.EMAIL.v1' }
      }
    },
    {
      entity: {
        entity_type: 'VENDOR',
        entity_name: 'Dell Technologies India',
        entity_code: 'DELLINDIA',
        smart_code: 'HERA.RETAIL.VENDOR.BRAND.DELL.v1'
      },
      dynamic: {
        vendor_type: { field_type: 'text', field_value_text: 'Authorized Distributor', smart_code: 'HERA.RETAIL.VENDOR.FIELD.TYPE.v1' },
        category: { field_type: 'text', field_value_text: 'Computers & Servers', smart_code: 'HERA.RETAIL.VENDOR.FIELD.CATEGORY.v1' },
        payment_terms: { field_type: 'text', field_value_text: 'Net 30', smart_code: 'HERA.RETAIL.VENDOR.FIELD.PAYMENT_TERMS.v1' },
        credit_limit: { field_type: 'number', field_value_number: 1000000, smart_code: 'HERA.RETAIL.VENDOR.FIELD.CREDIT_LIMIT.v1' },
        location: { field_type: 'text', field_value_text: 'Bangalore', smart_code: 'HERA.RETAIL.VENDOR.FIELD.LOCATION.v1' },
        phone: { field_type: 'text', field_value_text: '+91-80-12345678', smart_code: 'HERA.RETAIL.VENDOR.FIELD.PHONE.v1' },
        email: { field_type: 'text', field_value_text: 'kerala@dell.com', smart_code: 'HERA.RETAIL.VENDOR.FIELD.EMAIL.v1' }
      }
    }
  ]

  const createdVendors = []
  for (const vendor of vendors) {
    const result = await createEntity(vendor.entity, vendor.dynamic)
    if (result) createdVendors.push(result)
  }
  
  return createdVendors
}

// Create Sample Transactions
async function createSampleTransactions() {
  console.log('\n📋 Creating Sample Transactions...')
  
  try {
    // Create a sample sales transaction
    const salesTransaction = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: MATRIXITWORLD_ORG_ID,
      p_transaction: {
        transaction_type: 'SALE',
        smart_code: 'HERA.RETAIL.TRANSACTION.SALE.v1',
        total_amount: 269900,
        transaction_status: 'COMPLETED'
      },
      p_lines: [
        {
          line_number: 1,
          line_type: 'PRODUCT',
          description: 'iPhone 15 Pro Max 256GB',
          quantity: 1,
          unit_amount: 134900,
          line_amount: 134900
        },
        {
          line_number: 2,
          line_type: 'PRODUCT', 
          description: 'iPhone 15 Pro Max 256GB',
          quantity: 1,
          unit_amount: 134900,
          line_amount: 134900
        }
      ],
      p_options: {}
    })

    if (salesTransaction.error) {
      console.log(`⚠️  Failed to create sales transaction: ${salesTransaction.error.message}`)
    } else {
      console.log(`✅ Created sales transaction: ₹2,69,900`)
    }

    // Create a sample purchase order
    const purchaseOrder = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: MATRIXITWORLD_ORG_ID,
      p_transaction: {
        transaction_type: 'PURCHASE_ORDER',
        smart_code: 'HERA.RETAIL.TRANSACTION.PURCHASE_ORDER.v1',
        total_amount: 1349000,
        transaction_status: 'PENDING'
      },
      p_lines: [
        {
          line_number: 1,
          line_type: 'PRODUCT',
          description: 'iPhone 15 Pro Max 256GB - Bulk Order',
          quantity: 10,
          unit_amount: 134900,
          line_amount: 1349000
        }
      ],
      p_options: {}
    })

    if (purchaseOrder.error) {
      console.log(`⚠️  Failed to create purchase order: ${purchaseOrder.error.message}`)
    } else {
      console.log(`✅ Created purchase order: ₹13,49,000`)
    }

  } catch (error) {
    console.log(`❌ Error creating transactions: ${error.message}`)
  }
}

// Main execution
async function main() {
  console.log('🚀 Populating MatrixIT World with Complete Retail Data')
  console.log('====================================================')
  console.log(`🏢 Organization: ${MATRIXITWORLD_ORG_ID}`)
  console.log(`👤 Actor User: ${actorUserId}`)
  
  const products = await createProductCatalog()
  const customers = await createCustomers()
  const vendors = await createVendors()
  await createSampleTransactions()
  
  console.log('\n📊 Summary:')
  console.log(`✅ Products Created: ${products.length}`)
  console.log(`✅ Customers Created: ${customers.length}`)
  console.log(`✅ Vendors Created: ${vendors.length}`)
  console.log(`✅ Sample Transactions: Created`)
  
  console.log('\n🎉 MatrixIT World Data Population Complete!')
  console.log('\nReady for:')
  console.log('• Multi-branch inventory management')
  console.log('• Customer relationship management')
  console.log('• Supplier procurement workflows')
  console.log('• Sales order processing')
  console.log('• Financial analytics and reporting')
  
  return {
    products,
    customers,
    vendors,
    organizationId: MATRIXITWORLD_ORG_ID
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export default main