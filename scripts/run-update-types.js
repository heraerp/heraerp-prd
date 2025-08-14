#!/usr/bin/env node

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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function updateFieldTypes() {
  try {
    console.log('🔧 Updating core_dynamic_data field types...')
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'update-dynamic-data-types.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Execute SQL directly using Supabase's RPC if available, or we'll do it step by step
    // Since we can't execute raw SQL directly through Supabase client, we'll need to inform the user
    
    console.log('⚠️  Note: The constraint update needs to be run directly in your Supabase SQL editor')
    console.log('📋 Copy and run this SQL in your Supabase dashboard:\n')
    console.log(sql)
    console.log('\n✨ After running the SQL, your menu API will work with decimal and integer types!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

updateFieldTypes()