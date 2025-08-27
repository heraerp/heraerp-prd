#!/usr/bin/env node
/**
 * WhatsApp Setup Verification Script
 * Quickly verify your WhatsApp Business API credentials and configuration
 */

const axios = require('axios')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

class WhatsAppSetupVerifier {
  constructor() {
    this.whatsapp = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      webhookToken: process.env.WHATSAPP_WEBHOOK_TOKEN,
      businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER,
      apiUrl: 'https://graph.facebook.com/v18.0'
    }
    
    this.supabase = null
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    }
  }
  
  log(message, type = 'info') {
    const prefix = {
      success: `${colors.green}✅`,
      error: `${colors.red}❌`,
      warning: `${colors.yellow}⚠️`,
      info: `${colors.blue}ℹ️`
    }[type] || ''
    
    console.log(`${prefix} ${message}${colors.reset}`)
  }
  
  async verify() {
    console.log('\n🔍 WhatsApp Business API Setup Verification')
    console.log('=' .repeat(50))
    
    let score = 0
    const checks = []
    
    // 1. Check Environment Variables
    console.log('\n📋 Checking Environment Variables...')
    const envCheck = this.checkEnvironment()
    checks.push(envCheck)
    if (envCheck.passed) score += 25
    
    // 2. Test API Connection
    console.log('\n🌐 Testing WhatsApp API Connection...')
    const apiCheck = await this.testAPIConnection()
    checks.push(apiCheck)
    if (apiCheck.passed) score += 25
    
    // 3. Verify Phone Number
    console.log('\n📱 Verifying Phone Number Configuration...')
    const phoneCheck = await this.verifyPhoneNumber()
    checks.push(phoneCheck)
    if (phoneCheck.passed) score += 25
    
    // 4. Check Database Setup
    console.log('\n💾 Checking Database Configuration...')
    const dbCheck = await this.checkDatabase()
    checks.push(dbCheck)
    if (dbCheck.passed) score += 25
    
    // Summary
    console.log('\n' + '=' .repeat(50))
    console.log('📊 VERIFICATION SUMMARY')
    console.log('=' .repeat(50))
    
    checks.forEach(check => {
      const status = check.passed ? 
        `${colors.green}PASSED${colors.reset}` : 
        `${colors.red}FAILED${colors.reset}`
      console.log(`${check.name}: ${status}`)
      if (!check.passed && check.error) {
        console.log(`   └─ ${colors.yellow}${check.error}${colors.reset}`)
      }
    })
    
    console.log('\n' + '─' .repeat(50))
    console.log(`Overall Score: ${score}/100`)
    
    if (score === 100) {
      this.log('\n🎉 Perfect! Your WhatsApp integration is ready to use!', 'success')
      console.log('\nNext steps:')
      console.log('1. Configure webhook URL in Meta Business Manager')
      console.log('2. Run: node setup-whatsapp.js')
      console.log('3. Send a test message to your business number')
    } else if (score >= 75) {
      this.log('\n✨ Almost there! Fix the remaining issues above.', 'warning')
    } else {
      this.log('\n⚠️  Several issues need to be resolved. Check the errors above.', 'error')
    }
    
    return score
  }
  
  checkEnvironment() {
    const required = {
      'WHATSAPP_PHONE_NUMBER_ID': 'Phone Number ID from Meta',
      'WHATSAPP_ACCESS_TOKEN': 'Access Token from Meta',
      'WHATSAPP_WEBHOOK_TOKEN': 'Custom webhook verification token',
      'WHATSAPP_BUSINESS_NUMBER': 'Your WhatsApp business number'
    }
    
    const missing = []
    
    for (const [key, description] of Object.entries(required)) {
      if (!process.env[key]) {
        missing.push(`${key} (${description})`)
      }
    }
    
    if (missing.length === 0) {
      this.log('All required environment variables found', 'success')
      
      // Show configuration (masked)
      console.log('\nConfiguration:')
      console.log(`  Phone Number ID: ${this.maskValue(this.whatsapp.phoneNumberId)}`)
      console.log(`  Access Token: ${this.maskValue(this.whatsapp.accessToken)}`)
      console.log(`  Business Number: ${this.whatsapp.businessNumber || 'Not set'}`)
      
      return { name: 'Environment Variables', passed: true }
    } else {
      this.log('Missing environment variables:', 'error')
      missing.forEach(item => console.log(`  - ${item}`))
      
      console.log('\nAdd these to your .env.local file')
      
      return { 
        name: 'Environment Variables', 
        passed: false,
        error: `Missing ${missing.length} variables`
      }
    }
  }
  
  async testAPIConnection() {
    if (!this.whatsapp.accessToken) {
      return { 
        name: 'API Connection', 
        passed: false,
        error: 'No access token provided'
      }
    }
    
    try {
      // Test with a simple API call
      const response = await axios.get(
        `${this.whatsapp.apiUrl}/debug_token`,
        {
          params: {
            input_token: this.whatsapp.accessToken
          }
        }
      )
      
      const tokenData = response.data.data
      
      if (tokenData.is_valid) {
        this.log('Access token is valid', 'success')
        console.log(`  App ID: ${tokenData.app_id}`)
        console.log(`  Type: ${tokenData.type}`)
        console.log(`  Expires: ${tokenData.expires_at ? new Date(tokenData.expires_at * 1000).toLocaleString() : 'Never'}`)
        
        return { name: 'API Connection', passed: true }
      } else {
        this.log('Access token is invalid', 'error')
        return { 
          name: 'API Connection', 
          passed: false,
          error: 'Invalid access token'
        }
      }
      
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message
      this.log(`Failed to connect to WhatsApp API: ${errorMsg}`, 'error')
      
      return { 
        name: 'API Connection', 
        passed: false,
        error: errorMsg
      }
    }
  }
  
  async verifyPhoneNumber() {
    if (!this.whatsapp.phoneNumberId || !this.whatsapp.accessToken) {
      return { 
        name: 'Phone Number', 
        passed: false,
        error: 'Missing phone number ID or access token'
      }
    }
    
    try {
      const response = await axios.get(
        `${this.whatsapp.apiUrl}/${this.whatsapp.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.whatsapp.accessToken}`
          }
        }
      )
      
      const phoneData = response.data
      
      this.log('Phone number verified', 'success')
      console.log(`  Display Number: ${phoneData.display_phone_number}`)
      console.log(`  Verified Name: ${phoneData.verified_name || 'Not set'}`)
      console.log(`  Quality Rating: ${phoneData.quality_rating || 'Not rated'}`)
      console.log(`  Status: ${phoneData.certificate ? 'Verified ✅' : 'Not verified ⚠️'}`)
      
      // Check if messaging limits apply
      if (phoneData.messaging_limit) {
        console.log(`  ${colors.yellow}Messaging Limit: ${phoneData.messaging_limit}${colors.reset}`)
      }
      
      return { name: 'Phone Number', passed: true }
      
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message
      this.log(`Failed to verify phone number: ${errorMsg}`, 'error')
      
      return { 
        name: 'Phone Number', 
        passed: false,
        error: errorMsg
      }
    }
  }
  
  async checkDatabase() {
    if (!this.supabase) {
      this.log('Supabase not configured (optional for testing)', 'warning')
      return { 
        name: 'Database', 
        passed: true,
        error: 'Supabase not configured (optional)'
      }
    }
    
    try {
      // Test database connection
      const { data, error } = await this.supabase
        .from('core_organizations')
        .select('id')
        .limit(1)
      
      if (error) throw error
      
      this.log('Database connection successful', 'success')
      
      // Check if organization exists
      const orgId = process.env.DEFAULT_ORGANIZATION_ID
      if (orgId) {
        const { data: org } = await this.supabase
          .from('core_organizations')
          .select('organization_name')
          .eq('id', orgId)
          .single()
        
        if (org) {
          console.log(`  Organization: ${org.organization_name}`)
          console.log(`  Org ID: ${orgId}`)
        } else {
          console.log(`  ${colors.yellow}Warning: Organization ${orgId} not found${colors.reset}`)
        }
      }
      
      return { name: 'Database', passed: true }
      
    } catch (error) {
      this.log(`Database error: ${error.message}`, 'error')
      return { 
        name: 'Database', 
        passed: false,
        error: error.message
      }
    }
  }
  
  maskValue(value) {
    if (!value) return 'Not set'
    if (value.length <= 8) return '*'.repeat(value.length)
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4)
  }
}

// Quick test functions
async function sendTestMessage() {
  const verifier = new WhatsAppSetupVerifier()
  
  console.log('\n📤 Send Test Message')
  console.log('=' .repeat(50))
  
  if (!verifier.whatsapp.accessToken || !verifier.whatsapp.phoneNumberId) {
    verifier.log('Missing credentials. Run verification first.', 'error')
    return
  }
  
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  rl.question('\nEnter recipient phone number (with country code, e.g., +971501234567): ', async (phone) => {
    try {
      console.log('\nSending test message...')
      
      const response = await axios.post(
        `${verifier.whatsapp.apiUrl}/${verifier.whatsapp.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: {
            body: '🎉 Test message from HERA WhatsApp Integration!\n\nIf you received this, your setup is working correctly.'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${verifier.whatsapp.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      verifier.log('Test message sent successfully!', 'success')
      console.log(`Message ID: ${response.data.messages[0].id}`)
      console.log('\nCheck WhatsApp on the recipient phone!')
      
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message
      verifier.log(`Failed to send message: ${errorMsg}`, 'error')
      
      if (error.response?.status === 404) {
        console.log('\nPossible issues:')
        console.log('- Phone number format incorrect')
        console.log('- Recipient hasn\'t messaged your business first')
        console.log('- Using test number without adding recipient')
      }
    }
    
    rl.close()
  })
}

// Main execution
async function main() {
  const command = process.argv[2]
  
  if (command === 'test') {
    await sendTestMessage()
  } else {
    const verifier = new WhatsAppSetupVerifier()
    const score = await verifier.verify()
    
    if (score === 100) {
      console.log('\n💡 Quick Commands:')
      console.log('  node verify-whatsapp-setup.js test     - Send a test message')
      console.log('  node setup-whatsapp.js                 - Complete setup')
      console.log('  node test-whatsapp-webhook.js          - Test webhook')
    }
  }
}

main()