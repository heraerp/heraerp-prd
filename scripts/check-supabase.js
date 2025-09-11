#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

console.log('🔍 Checking Supabase Configuration...\n')

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Environment Variables:')
console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set')
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Not set')

// Check for dummy values
if (supabaseUrl?.includes('dummy') || supabaseKey?.includes('dummy')) {
  console.log('\n⚠️  Warning: Dummy values detected!')
  console.log('Please update your .env file with real Supabase credentials.')
  console.log('See SETUP_SUPABASE.md for instructions.\n')
  process.exit(1)
}

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Supabase not configured!')
  console.log('Please set the following in your .env file:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.log('\nSee SETUP_SUPABASE.md for detailed instructions.\n')
  process.exit(1)
}

// Try to connect
console.log('\n🚀 Testing Supabase connection...')
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Try to query organizations table
    const { data, error } = await supabase
      .from('core_organizations')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Successfully connected to Supabase!')
    console.log(`✅ Found organizations table`)
    return true
  } catch (error) {
    console.log('❌ Connection error:', error.message)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase is properly configured and working!')
    console.log('You can now use the tender management system.\n')
  } else {
    console.log('\n❌ Failed to connect to Supabase.')
    console.log('Please check your credentials and try again.\n')
    process.exit(1)
  }
})