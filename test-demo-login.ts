#!/usr/bin/env npx tsx

/**
 * Test Demo Login
 * Tests if demo users can login successfully
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables!')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDemoLogin() {
  console.log('Testing demo login for Ice Cream app...\n')
  
  try {
    // Test login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'demo-icecream@heraerp.com',
      password: 'DemoIceCream2025!'
    })
    
    if (error) {
      console.error('❌ Login failed:', error.message)
      return
    }
    
    console.log('✅ Login successful!')
    console.log('User ID:', data.user?.id)
    console.log('Email:', data.user?.email)
    console.log('Session:', data.session ? 'Active' : 'None')
    
    // Check organizations
    if (data.session) {
      const response = await fetch('/api/v1/organizations', {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('\nChecking organizations...')
      if (response.ok) {
        const orgs = await response.json()
        console.log('Organizations:', orgs)
      } else {
        console.log('Could not fetch organizations (API not available in test)')
      }
    }
    
    // Sign out
    await supabase.auth.signOut()
    console.log('\n✅ Signed out successfully')
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testDemoLogin()