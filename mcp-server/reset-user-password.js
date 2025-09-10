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

async function sendPasswordResetEmail(email) {
  console.log(`\n📧 Sending password reset email to: ${email}\n`)

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) {
      console.error('❌ Error sending reset email:', error)
      return
    }

    console.log('✅ Password reset email sent successfully!')
    console.log('Please check your email inbox (and spam folder)')
    console.log('\nThe email will contain a link to reset your password.')
    console.log('Note: The link expires in 1 hour.')

  } catch (err) {
    console.error('❌ Error:', err)
  }
}

// Main execution
const email = process.argv[2]

if (!email) {
  console.log('Usage: node reset-user-password.js <email>')
  console.log('Example: node reset-user-password.js minnunandy@gmail.com')
  process.exit(1)
}

sendPasswordResetEmail(email)