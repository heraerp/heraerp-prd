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

async function checkTableStructure() {
  console.log('🔍 Checking universal_transactions table structure...')
  
  try {
    // Try to select one record to see all available columns
    const { data: transactions, error: transError } = await supabase
      .from('universal_transactions')
      .select('*')
      .limit(1)
    
    if (transError) {
      console.log('❌ universal_transactions error:', transError.message)
    } else {
      console.log('✅ universal_transactions columns:')
      if (transactions && transactions.length > 0) {
        console.log(Object.keys(transactions[0]).join(', '))
        console.log('\nSample record:')
        console.log(JSON.stringify(transactions[0], null, 2))
      } else {
        console.log('No records found')
      }
    }
    
    console.log('\n🔍 Checking universal_transaction_lines table structure...')
    
    const { data: lines, error: linesError } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .limit(1)
    
    if (linesError) {
      console.log('❌ universal_transaction_lines error:', linesError.message)
    } else {
      console.log('✅ universal_transaction_lines columns:')
      if (lines && lines.length > 0) {
        console.log(Object.keys(lines[0]).join(', '))
        console.log('\nSample record:')
        console.log(JSON.stringify(lines[0], null, 2))
      } else {
        console.log('No records found')
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error)
  }
}

checkTableStructure()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))