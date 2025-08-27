#!/usr/bin/env node
/**
 * Get Phone Number ID from WABA ID
 */

const axios = require('axios')
require('dotenv').config({ path: '../.env.local' })

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
}

async function getPhoneNumbers() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const wabaId = '1112225330318984' // Your WABA ID
  
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║         Getting Phone Numbers from WABA ID                ║
╚══════════════════════════════════════════════════════════╝${colors.reset}

WABA ID: ${colors.yellow}${wabaId}${colors.reset}
`)

  try {
    // Get phone numbers for this WABA
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          fields: 'id,display_phone_number,verified_name,certificate,quality_rating'
        }
      }
    )
    
    if (response.data.data && response.data.data.length > 0) {
      console.log(`${colors.green}✅ Found ${response.data.data.length} phone number(s):${colors.reset}\n`)
      
      for (const phone of response.data.data) {
        console.log(`📱 Phone: ${colors.green}${phone.display_phone_number}${colors.reset}`)
        console.log(`   Phone Number ID: ${colors.cyan}${phone.id}${colors.reset}`)
        console.log(`   Verified Name: ${phone.verified_name || 'Not set'}`)
        console.log(`   Quality: ${phone.quality_rating || 'Not rated'}`)
        console.log(`   Certificate: ${phone.certificate ? 'Yes ✅' : 'No ❌'}`)
        
        // Check if this is the Indian number
        if (phone.display_phone_number && phone.display_phone_number.includes('9945896033')) {
          console.log(`\n   ${colors.green}🎉 THIS IS YOUR NUMBER!${colors.reset}`)
          console.log(`   ${colors.yellow}Copy this Phone Number ID: ${colors.green}${phone.id}${colors.reset}`)
          
          // Update .env.local
          console.log(`\n${colors.cyan}Updating your .env.local file...${colors.reset}`)
          
          const fs = require('fs')
          const path = require('path')
          const envPath = path.join(__dirname, '../.env.local')
          
          let envContent = fs.readFileSync(envPath, 'utf8')
          
          // Update Phone Number ID
          envContent = envContent.replace(
            'WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here',
            `WHATSAPP_PHONE_NUMBER_ID=${phone.id}`
          )
          
          // Update WABA ID
          envContent = envContent.replace(
            'WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id_here',
            `WHATSAPP_BUSINESS_ACCOUNT_ID=${wabaId}`
          )
          
          fs.writeFileSync(envPath, envContent)
          
          console.log(`${colors.green}✅ Updated .env.local successfully!${colors.reset}`)
          console.log(`\nYour WhatsApp configuration is now complete!`)
          console.log(`\nNext steps:`)
          console.log(`1. Run: ${colors.cyan}node verify-whatsapp-setup.js${colors.reset}`)
          console.log(`2. Configure webhook in Meta Business Manager`)
          console.log(`3. Run: ${colors.cyan}node setup-whatsapp.js${colors.reset}`)
        }
        
        console.log('')
      }
    } else {
      console.log(`${colors.red}❌ No phone numbers found for this WABA${colors.reset}`)
    }
    
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.response?.data?.error?.message || error.message}${colors.reset}`)
    
    if (error.response?.status === 400) {
      console.log(`\nThis might mean:`)
      console.log(`- The WABA ID is incorrect`)
      console.log(`- You don't have permission to access this WABA`)
      console.log(`- The access token doesn't have the right permissions`)
    }
  }
}

getPhoneNumbers()