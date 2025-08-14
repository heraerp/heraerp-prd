#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
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
  auth: { persistSession: false }
})

async function createSimpleOrder() {
  console.log('🧪 Testing simple order creation...')
  
  const orgId = '550e8400-e29b-41d4-a716-446655440000'
  
  try {
    // Try basic insert with minimal fields
    console.log('1. Testing basic transaction insert...')
    
    const { data: transaction, error: transError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: orgId,
        transaction_type: 'order',
        transaction_date: new Date().toISOString(),
        reference_number: `TEST-${Date.now()}`,
        total_amount: 18.50,
        status: 'pending'
      })
      .select()
      .single()
    
    if (transError) {
      console.log('❌ Transaction error:', transError)
      return
    }
    
    console.log('✅ Transaction created:', transaction.id)
    
    // Try basic line item insert
    console.log('2. Testing basic line item insert...')
    
    const { data: line, error: lineError } = await supabase
      .from('universal_transaction_lines')
      .insert({
        transaction_id: transaction.id,
        organization_id: orgId,
        entity_id: '550e8400-e29b-41d4-a716-446655440010', // Pizza ID
        quantity: 1,
        unit_price: 18.50,
        line_total: 18.50
      })
      .select()
      .single()
    
    if (lineError) {
      console.log('❌ Line error:', lineError)
      return
    }
    
    console.log('✅ Line item created:', line.id)
    console.log('🎉 Order creation successful!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createSimpleOrder()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))