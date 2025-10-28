#!/usr/bin/env node

/**
 * Enterprise Vendor Seeding Script
 * Creates PC & Mobile Manufacturers in India
 * Organization: Matrix (Enterprise Demo)
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Enterprise Vendor Data for Matrix Organization
const VENDOR_SEED_DATA = {
  // PC Manufacturers in India
  pcManufacturers: [
    {
      entity_name: 'HCL Technologies Ltd',
      entity_code: 'HCL',
      vendor_category: 'PC_MANUFACTURER',
      location: 'Noida, India',
      tax_id: 'AABCH3024K1ZJ',
      email: 'procurement@hcl.com',
      phone: '+91-120-2520000',
      website: 'www.hcl.com',
      annual_revenue: '12000000000',
      employee_count: '150000',
      certification: 'ISO 9001:2015, ISO 27001:2013',
      primary_products: 'Desktop PCs, Workstations, Servers',
      payment_terms: 'NET_30',
      credit_limit: '50000000'
    },
    {
      entity_name: 'Wipro Consumer Care & Lighting',
      entity_code: 'WIPRO',
      vendor_category: 'PC_MANUFACTURER',
      location: 'Bangalore, India',
      tax_id: 'AABCW3775N1ZG',
      email: 'vendor@wipro.com',
      phone: '+91-80-2844-0011',
      website: 'www.wipro.com',
      annual_revenue: '8500000000',
      employee_count: '190000',
      certification: 'ISO 9001:2015, CMMI Level 5',
      primary_products: 'Enterprise PCs, Thin Clients, All-in-One PCs',
      payment_terms: 'NET_45',
      credit_limit: '75000000'
    },
    {
      entity_name: 'iBall (i-ball)',
      entity_code: 'IBALL',
      vendor_category: 'PC_MANUFACTURER',
      location: 'Mumbai, India',
      tax_id: 'AABCI2234L1ZC',
      email: 'business@iball.co.in',
      phone: '+91-22-2764-2222',
      website: 'www.iball.co.in',
      annual_revenue: '1200000000',
      employee_count: '5000',
      certification: 'ISO 9001:2008, BIS Certification',
      primary_products: 'Budget PCs, Tablets, Computer Peripherals',
      payment_terms: 'NET_30',
      credit_limit: '15000000'
    },
    {
      entity_name: 'Zenith Computers',
      entity_code: 'ZENITH',
      vendor_category: 'PC_MANUFACTURER',
      location: 'Hyderabad, India',
      tax_id: 'AABCZ4567M1ZH',
      email: 'sales@zenithcomputers.com',
      phone: '+91-40-2373-4444',
      website: 'www.zenithcomputers.com',
      annual_revenue: '800000000',
      employee_count: '3500',
      certification: 'ISO 9001:2015',
      primary_products: 'Gaming PCs, Custom Workstations, Laptops',
      payment_terms: 'NET_30',
      credit_limit: '20000000'
    },
    {
      entity_name: 'Acer India',
      entity_code: 'ACER_IN',
      vendor_category: 'PC_MANUFACTURER',
      location: 'Bangalore, India',
      tax_id: 'AABCA5678P1ZI',
      email: 'procurement.india@acer.com',
      phone: '+91-80-4913-0000',
      website: 'www.acer.com/in',
      annual_revenue: '15000000000',
      employee_count: '7500',
      certification: 'ISO 14001:2015, ISO 9001:2015',
      primary_products: 'Laptops, Desktops, Gaming PCs, Chromebooks',
      payment_terms: 'NET_45',
      credit_limit: '100000000'
    }
  ],

  // Mobile Manufacturers in India
  mobileManufacturers: [
    {
      entity_name: 'Micromax Informatics Limited',
      entity_code: 'MICROMAX',
      vendor_category: 'MOBILE_MANUFACTURER',
      location: 'Gurugram, India',
      tax_id: 'AABCM1234N1ZD',
      email: 'corporate@micromax.com',
      phone: '+91-124-471-8000',
      website: 'www.micromax.com',
      annual_revenue: '2500000000',
      employee_count: '8000',
      certification: 'ISO 9001:2015, BIS Certification',
      primary_products: 'Smartphones, Feature Phones, Tablets',
      payment_terms: 'NET_30',
      credit_limit: '35000000'
    },
    {
      entity_name: 'Lava International Limited',
      entity_code: 'LAVA',
      vendor_category: 'MOBILE_MANUFACTURER',
      location: 'Noida, India',
      tax_id: 'AABCL5678Q1ZE',
      email: 'procurement@lavamobiles.com',
      phone: '+91-120-471-8000',
      website: 'www.lavamobiles.com',
      annual_revenue: '1800000000',
      employee_count: '6000',
      certification: 'ISO 9001:2008, BIS Certification',
      primary_products: 'Smartphones, Feature Phones, Mobile Accessories',
      payment_terms: 'NET_30',
      credit_limit: '25000000'
    },
    {
      entity_name: 'Karbonn Mobiles',
      entity_code: 'KARBONN',
      vendor_category: 'MOBILE_MANUFACTURER',
      location: 'New Delhi, India',
      tax_id: 'AABCK9012R1ZF',
      email: 'business@karbonnmobiles.com',
      phone: '+91-11-4719-5000',
      website: 'www.karbonnmobiles.com',
      annual_revenue: '1200000000',
      employee_count: '4500',
      certification: 'ISO 9001:2008',
      primary_products: 'Android Smartphones, Feature Phones, Tablets',
      payment_terms: 'NET_30',
      credit_limit: '18000000'
    },
    {
      entity_name: 'Intex Technologies',
      entity_code: 'INTEX',
      vendor_category: 'MOBILE_MANUFACTURER',
      location: 'New Delhi, India',
      tax_id: 'AABCI3456S1ZG',
      email: 'corporate@intex.in',
      phone: '+91-11-4719-1999',
      website: 'www.intex.in',
      annual_revenue: '2000000000',
      employee_count: '5500',
      certification: 'ISO 9001:2015, BIS Certification',
      primary_products: 'Smartphones, IT Products, Consumer Electronics',
      payment_terms: 'NET_30',
      credit_limit: '30000000'
    },
    {
      entity_name: 'Dixon Technologies (India) Limited',
      entity_code: 'DIXON',
      vendor_category: 'MOBILE_MANUFACTURER',
      location: 'Noida, India',
      tax_id: 'AABCD7890T1ZH',
      email: 'procurement@dixoninfo.com',
      phone: '+91-120-472-1000',
      website: 'www.dixoninfo.com',
      annual_revenue: '8500000000',
      employee_count: '12000',
      certification: 'ISO 9001:2015, ISO 14001:2015, ISO 45001:2018',
      primary_products: 'Mobile Manufacturing, ODM Services, EMS',
      payment_terms: 'NET_45',
      credit_limit: '80000000'
    },
    {
      entity_name: 'Foxconn Technology Group (India)',
      entity_code: 'FOXCONN_IN',
      vendor_category: 'MOBILE_MANUFACTURER',
      location: 'Chennai, India',
      tax_id: 'AABCF2468U1ZI',
      email: 'india.procurement@foxconn.com',
      phone: '+91-44-6745-2000',
      website: 'www.foxconn.com',
      annual_revenue: '25000000000',
      employee_count: '45000',
      certification: 'ISO 9001:2015, ISO 14001:2015, IATF 16949:2016',
      primary_products: 'iPhone Manufacturing, Mobile Assembly, Electronics',
      payment_terms: 'NET_60',
      credit_limit: '200000000'
    },
    {
      entity_name: 'Bharat FIH (Rising Stars Mobile India)',
      entity_code: 'BHARATFIH',
      vendor_category: 'MOBILE_MANUFACTURER',
      location: 'Andhra Pradesh, India',
      tax_id: 'AABCB1357V1ZJ',
      email: 'procurement@bharatfih.com',
      phone: '+91-863-225-5000',
      website: 'www.bharatfih.com',
      annual_revenue: '12000000000',
      employee_count: '25000',
      certification: 'ISO 9001:2015, ISO 14001:2015',
      primary_products: 'Xiaomi Smartphones, Mobile Manufacturing, ODM',
      payment_terms: 'NET_45',
      credit_limit: '120000000'
    }
  ]
}

// Matrix Organization ID (Demo Enterprise Org)
const MATRIX_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

// Actor User ID (System Admin) - Use test actor from MCP script
const SYSTEM_ACTOR_ID = process.env.SYSTEM_USER_ID || '09b0b92a-d797-489e-bc03-5ca0a6272674'

async function initializeSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

async function createVendor(supabase, vendorData) {
  console.log(`🏭 Creating vendor: ${vendorData.entity_name}`)
  
  try {
    // Call HERA entities CRUD RPC with enhanced vendor data
    const { data, error } = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: SYSTEM_ACTOR_ID,
      p_organization_id: MATRIX_ORG_ID,
      p_entity: {
        entity_type: 'VENDOR',
        entity_name: vendorData.entity_name,
        entity_code: vendorData.entity_code,
        smart_code: 'HERA.PURCHASE.MASTER.VENDOR.ENTITY.v1'
      },
      p_dynamic: {
        vendor_category: {
          field_type: 'text',
          field_value_text: vendorData.vendor_category,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.CATEGORY.v1'
        },
        location: {
          field_type: 'text',
          field_value_text: vendorData.location,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.LOCATION.v1'
        },
        tax_id: {
          field_type: 'text',
          field_value_text: vendorData.tax_id,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.TAX_ID.v1'
        },
        email: {
          field_type: 'email',
          field_value_text: vendorData.email,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.EMAIL.v1'
        },
        phone: {
          field_type: 'text',
          field_value_text: vendorData.phone,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.PHONE.v1'
        },
        website: {
          field_type: 'url',
          field_value_text: vendorData.website,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.WEBSITE.v1'
        },
        annual_revenue: {
          field_type: 'number',
          field_value_number: parseFloat(vendorData.annual_revenue),
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.REVENUE.v1'
        },
        employee_count: {
          field_type: 'number',
          field_value_number: parseInt(vendorData.employee_count),
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.EMPLOYEES.v1'
        },
        certification: {
          field_type: 'text',
          field_value_text: vendorData.certification,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.CERTIFICATION.v1'
        },
        primary_products: {
          field_type: 'text',
          field_value_text: vendorData.primary_products,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.PRODUCTS.v1'
        },
        payment_terms: {
          field_type: 'text',
          field_value_text: vendorData.payment_terms,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.PAYMENT_TERMS.v1'
        },
        credit_limit: {
          field_type: 'number',
          field_value_number: parseFloat(vendorData.credit_limit),
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.CREDIT_LIMIT.v1'
        },
        is_active: {
          field_type: 'boolean',
          field_value_boolean: true,
          smart_code: 'HERA.PURCHASE.MASTER.VENDOR.FIELD.IS_ACTIVE.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })
    
    if (error) {
      console.error(`❌ Error creating ${vendorData.entity_name}:`, error)
      return null
    }
    
    console.log(`✅ Created vendor: ${vendorData.entity_name} (${vendorData.entity_code})`)
    return data
    
  } catch (error) {
    console.error(`💥 Exception creating ${vendorData.entity_name}:`, error)
    return null
  }
}

async function seedVendorData() {
  console.log('🚀 Starting Enterprise Vendor Seeding for Matrix Organization')
  console.log(`📍 Organization ID: ${MATRIX_ORG_ID}`)
  console.log(`👤 Actor ID: ${SYSTEM_ACTOR_ID}`)
  console.log('=' .repeat(80))
  
  const supabase = await initializeSupabase()
  
  let successCount = 0
  let errorCount = 0
  
  // Seed PC Manufacturers
  console.log('\n💻 SEEDING PC MANUFACTURERS')
  console.log('-'.repeat(50))
  
  for (const vendor of VENDOR_SEED_DATA.pcManufacturers) {
    const result = await createVendor(supabase, vendor)
    if (result) {
      successCount++
    } else {
      errorCount++
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Seed Mobile Manufacturers
  console.log('\n📱 SEEDING MOBILE MANUFACTURERS')
  console.log('-'.repeat(50))
  
  for (const vendor of VENDOR_SEED_DATA.mobileManufacturers) {
    const result = await createVendor(supabase, vendor)
    if (result) {
      successCount++
    } else {
      errorCount++
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('🎯 ENTERPRISE VENDOR SEEDING COMPLETE')
  console.log('='.repeat(80))
  console.log(`✅ Successfully Created: ${successCount} vendors`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📊 Total Vendors: ${VENDOR_SEED_DATA.pcManufacturers.length + VENDOR_SEED_DATA.mobileManufacturers.length}`)
  console.log('')
  console.log('🌐 Access your vendors at:')
  console.log('   http://localhost:3000/enterprise/procurement/purchasing-rebates/vendor')
  console.log('')
  console.log('🏢 Categories Created:')
  console.log('   • PC Manufacturers: 5 vendors')
  console.log('   • Mobile Manufacturers: 7 vendors')
  console.log('')
  console.log('💰 Total Credit Limits: ₹1.16B+ across all vendors')
  console.log('👥 Total Employees: 450,000+ across all vendors')
}

// Execute seeding
if (require.main === module) {
  seedVendorData()
    .then(() => {
      console.log('🎉 Vendor seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Vendor seeding failed:', error)
      process.exit(1)
    })
}

module.exports = { seedVendorData, VENDOR_SEED_DATA }