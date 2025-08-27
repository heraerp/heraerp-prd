#!/usr/bin/env node
/**
 * Get WhatsApp Business Account Information
 * Helps you find your Phone Number ID and other details
 */

const axios = require('axios')
require('dotenv').config({ path: '../.env.local' })

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

async function getWhatsAppInfo() {
  console.log(`${colors.blue}
╔══════════════════════════════════════════════════════════╗
║           WhatsApp Business Account Information           ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
`)

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  
  if (!accessToken) {
    console.log(`${colors.red}❌ No access token found in environment variables${colors.reset}`)
    return
  }
  
  console.log(`${colors.green}✅ Access token found${colors.reset}`)
  console.log(`Token: ${accessToken.substring(0, 20)}...${accessToken.substring(accessToken.length - 10)}\n`)
  
  try {
    // First, let's check what app this token belongs to
    console.log(`${colors.blue}1. Checking Token Information...${colors.reset}`)
    const tokenInfo = await axios.get(
      'https://graph.facebook.com/v18.0/debug_token',
      {
        params: {
          input_token: accessToken,
          access_token: accessToken
        }
      }
    )
    
    const tokenData = tokenInfo.data.data
    console.log(`   App ID: ${tokenData.app_id}`)
    console.log(`   Type: ${tokenData.type}`)
    console.log(`   Valid: ${tokenData.is_valid ? 'Yes ✅' : 'No ❌'}`)
    console.log(`   Expires: ${tokenData.expires_at ? new Date(tokenData.expires_at * 1000).toLocaleString() : 'Never'}`)
    console.log(`   Scopes: ${tokenData.scopes?.join(', ') || 'None'}`)
    
    // Now let's get the WhatsApp Business Account details
    console.log(`\n${colors.blue}2. Getting WhatsApp Business Accounts...${colors.reset}`)
    console.log(`   Note: You need to know your WABA ID or Phone Number ID`)
    console.log(`   
To find your Phone Number ID:
1. Go to: https://business.facebook.com/settings/whatsapp-business-accounts
2. Click on your WhatsApp Business Account
3. Click on the phone number you want to use
4. Copy the "Phone number ID" shown

Alternatively, if you have your WhatsApp Business Account ID (WABA ID):`)

    // Let's try to get some info using the app token
    console.log(`\n${colors.blue}3. Attempting to get app information...${colors.reset}`)
    try {
      const appInfo = await axios.get(
        `https://graph.facebook.com/v18.0/${tokenData.app_id}`,
        {
          params: {
            fields: 'name,id',
            access_token: accessToken
          }
        }
      )
      
      console.log(`   App Name: ${appInfo.data.name}`)
      console.log(`   App ID: ${appInfo.data.id}`)
      
    } catch (error) {
      console.log(`   ${colors.yellow}Could not retrieve app information${colors.reset}`)
    }
    
    console.log(`
${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.blue}MANUAL STEPS TO GET YOUR PHONE NUMBER ID:${colors.reset}

1. Go to Meta Business Suite:
   ${colors.blue}https://business.facebook.com${colors.reset}

2. Navigate to:
   ${colors.gray}Settings → WhatsApp Accounts → Your Account${colors.reset}

3. Click on your phone number

4. You'll see:
   - Phone number ID (copy this!)
   - Display phone number
   - Status
   - Quality rating

5. Update your .env.local:
   ${colors.green}WHATSAPP_PHONE_NUMBER_ID=<your-phone-number-id>${colors.reset}

${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.blue}ALTERNATIVE: Using Graph API Explorer${colors.reset}

1. Go to: ${colors.blue}https://developers.facebook.com/tools/explorer/${colors.reset}

2. Select your app from the dropdown

3. Add these permissions:
   - whatsapp_business_management
   - whatsapp_business_messaging

4. Run this query:
   ${colors.gray}GET /v18.0/{your-waba-id}/phone_numbers${colors.reset}

This will show all phone numbers associated with your account.
`)
    
  } catch (error) {
    console.log(`\n${colors.red}❌ Error: ${error.response?.data?.error?.message || error.message}${colors.reset}`)
    
    if (error.response?.data?.error?.code === 190) {
      console.log(`
${colors.yellow}Token appears to be invalid or expired. Please:${colors.reset}
1. Go to Meta for Developers
2. Navigate to your app
3. Go to WhatsApp > API Setup
4. Generate a new permanent access token
5. Update your .env.local file
`)
    }
  }
}

// If you know your WABA ID, you can pass it as an argument
const wabaId = process.argv[2]
if (wabaId) {
  console.log(`\nTrying to get phone numbers for WABA ID: ${wabaId}\n`)
  
  axios.get(
    `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
      }
    }
  )
  .then(response => {
    console.log('Phone Numbers:')
    response.data.data.forEach(phone => {
      console.log(`
📱 Number: ${phone.display_phone_number}
   ID: ${colors.green}${phone.id}${colors.reset}
   Status: ${phone.certificate ? 'Verified ✅' : 'Not verified ❌'}
   Name: ${phone.verified_name || 'Not set'}
   Quality: ${phone.quality_rating || 'Not rated'}
      `)
    })
  })
  .catch(error => {
    console.log(`${colors.red}Could not retrieve phone numbers: ${error.response?.data?.error?.message || error.message}${colors.reset}`)
  })
} else {
  getWhatsAppInfo()
}