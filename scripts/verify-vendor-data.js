#!/usr/bin/env node

/**
 * Verify Vendor Data Script
 * Check that our enterprise vendors were created successfully
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function verifyVendorData() {
  console.log('🔍 Verifying Enterprise Vendor Data...')
  console.log('=' .repeat(60))
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '6e1954fe-e34a-4056-84f4-745e5b8378ec'
  
  try {
    // Query vendor entities
    const { data: vendors, error } = await supabase
      .from('core_entities')
      .select(`
        id, 
        entity_name, 
        entity_code, 
        entity_type,
        smart_code,
        created_at
      `)
      .eq('entity_type', 'VENDOR')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) {
      console.error('❌ Error querying vendors:', error)
      return
    }
    
    console.log(`📊 Found ${vendors.length} vendors in organization`)
    console.log('')
    
    if (vendors.length === 0) {
      console.log('⚠️  No vendors found - seeding may have failed')
      return
    }
    
    // Group by categories
    const pcManufacturers = vendors.filter(v => 
      ['HCL', 'WIPRO', 'IBALL', 'ZENITH', 'ACER_IN'].includes(v.entity_code)
    )
    
    const mobileManufacturers = vendors.filter(v => 
      ['MICROMAX', 'LAVA', 'KARBONN', 'INTEX', 'DIXON', 'FOXCONN_IN', 'BHARATFIH'].includes(v.entity_code)
    )
    
    console.log('💻 PC MANUFACTURERS FOUND:')
    console.log('-'.repeat(40))
    pcManufacturers.forEach(vendor => {
      console.log(`✅ ${vendor.entity_name} (${vendor.entity_code})`)
      console.log(`   Smart Code: ${vendor.smart_code}`)
      console.log(`   Created: ${new Date(vendor.created_at).toLocaleString()}`)
      console.log('')
    })
    
    console.log('📱 MOBILE MANUFACTURERS FOUND:')
    console.log('-'.repeat(40))
    mobileManufacturers.forEach(vendor => {
      console.log(`✅ ${vendor.entity_name} (${vendor.entity_code})`)
      console.log(`   Smart Code: ${vendor.smart_code}`)
      console.log(`   Created: ${new Date(vendor.created_at).toLocaleString()}`)
      console.log('')
    })
    
    // Summary
    console.log('=' .repeat(60))
    console.log('📈 VERIFICATION SUMMARY:')
    console.log(`✅ PC Manufacturers: ${pcManufacturers.length}/5`)
    console.log(`✅ Mobile Manufacturers: ${mobileManufacturers.length}/7`)
    console.log(`✅ Total Vendors: ${vendors.length}`)
    console.log('')
    console.log('🌐 Access vendors at:')
    console.log('   http://localhost:3003/enterprise/procurement/purchasing-rebates/vendor')
    
  } catch (error) {
    console.error('💥 Verification failed:', error)
  }
}

// Execute verification
if (require.main === module) {
  verifyVendorData()
    .then(() => {
      console.log('🎉 Vendor verification completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error)
      process.exit(1)
    })
}

module.exports = { verifyVendorData }