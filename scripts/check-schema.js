#!/usr/bin/env node

/**
 * Check database schema to understand the client/organization structure
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables manually from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

async function checkSchema() {
  console.log('🔍 Checking database schema...')
  
  try {
    // Check if core_clients table exists
    console.log('\n📋 Checking for core_clients table...')
    const { data: clientsData, error: clientsError } = await supabase
      .from('core_clients')
      .select('*')
      .limit(3)
    
    if (clientsError) {
      console.log('❌ Clients table error:', clientsError.message)
    } else {
      console.log('✅ Clients table exists')
      console.log('Sample clients data:', clientsData)
    }
    
    // Check core_organizations structure
    console.log('\n📋 Checking core_organizations structure...')
    const { data: orgsData, error: orgsError } = await supabase
      .from('core_organizations')
      .select('*')
      .limit(3)
    
    if (orgsError) {
      console.log('❌ Organizations error:', orgsError.message)
    } else {
      console.log('✅ Found', orgsData.length, 'organizations')
      if (orgsData.length > 0) {
        console.log('Sample organization:', orgsData[0])
      }
    }
    
    // Check core_entities for menu items
    console.log('\n📋 Checking existing menu items...')
    const { data: menuData, error: menuError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'menu_item')
      .limit(5)
    
    if (menuError) {
      console.log('❌ Menu items error:', menuError.message)
    } else {
      console.log('✅ Found', menuData.length, 'menu items')
      menuData.forEach(item => {
        console.log(`  - ${item.entity_name} (${item.organization_id})`)
      })
    }
    
    // Try to see what clients exist
    console.log('\n📋 Trying to find existing clients or parent records...')
    
    // Check if there are any functions or RPC calls we can use
    const { data: functionsData, error: functionsError } = await supabase.rpc('get_all_tables')
    
    if (functionsError) {
      console.log('❌ Cannot get database functions:', functionsError.message)
    } else {
      console.log('✅ Database functions available')
    }
    
  } catch (error) {
    console.error('❌ Schema check error:', error)
  }
}

// Run the check
if (require.main === module) {
  checkSchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { checkSchema }