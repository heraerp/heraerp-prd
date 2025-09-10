#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignupBehavior(email) {
  console.log(`\n🧪 Testing signup behavior for: ${email}\n`)

  try {
    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'test-password-123',
      options: {
        data: {
          full_name: 'Test User',
          test_signup: true
        }
      }
    })

    console.log('Signup Response:')
    console.log('─'.repeat(50))
    
    if (error) {
      console.log('❌ Error occurred:')
      console.log(`Message: ${error.message}`)
      console.log(`Status: ${error.status}`)
      console.log(`Code: ${error.code}`)
    } else {
      console.log('✅ No error returned')
      
      if (data.user) {
        console.log('\nUser Data:')
        console.log(`ID: ${data.user.id}`)
        console.log(`Email: ${data.user.email}`)
        console.log(`Created At: ${data.user.created_at}`)
        console.log(`Email Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)
        console.log(`Confirmed At: ${data.user.email_confirmed_at || 'Not confirmed'}`)
      }
      
      if (data.session) {
        console.log('\n✅ Session created (new user)')
      } else {
        console.log('\n⚠️  No session created (likely existing user)')
      }
    }
    
    console.log('─'.repeat(50))

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

// Main execution
const email = process.argv[2]

if (!email) {
  console.log('Usage: node test-signup-behavior.js <email>')
  console.log('Example: node test-signup-behavior.js test@example.com')
  process.exit(1)
}

testSignupBehavior(email)