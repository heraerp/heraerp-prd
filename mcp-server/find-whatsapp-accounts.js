#!/usr/bin/env node
/**
 * Find WhatsApp Business Accounts and Phone Numbers
 * Helps discover WABA IDs and Phone Number IDs
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

async function findWhatsAppAccounts() {
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║        Finding Your WhatsApp Business Accounts            ║
╚══════════════════════════════════════════════════════════╝${colors.reset}

Looking for: Hanaset Business India (+91 99458 96033)
`)

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  
  if (!accessToken) {
    console.log(`${colors.red}❌ No access token found${colors.reset}`)
    return
  }

  try {
    // Method 1: Try to get user's businesses
    console.log(`${colors.blue}Method 1: Checking businesses associated with your user...${colors.reset}`)
    
    try {
      const userResponse = await axios.get(
        'https://graph.facebook.com/v18.0/me/businesses',
        {
          params: {
            access_token: accessToken
          }
        }
      )
      
      if (userResponse.data.data && userResponse.data.data.length > 0) {
        console.log(`\nFound ${userResponse.data.data.length} business(es):`)
        
        for (const business of userResponse.data.data) {
          console.log(`\n${colors.green}Business: ${business.name}${colors.reset}`)
          console.log(`ID: ${business.id}`)
          
          // Try to get WhatsApp Business Accounts for this business
          try {
            const wabaResponse = await axios.get(
              `https://graph.facebook.com/v18.0/${business.id}/owned_whatsapp_business_accounts`,
              {
                params: {
                  access_token: accessToken
                }
              }
            )
            
            if (wabaResponse.data.data && wabaResponse.data.data.length > 0) {
              console.log(`\n  ${colors.cyan}WhatsApp Business Accounts:${colors.reset}`)
              
              for (const waba of wabaResponse.data.data) {
                console.log(`\n  WABA Name: ${waba.name || 'Unnamed'}`)
                console.log(`  WABA ID: ${colors.yellow}${waba.id}${colors.reset}`)
                
                // Get phone numbers for this WABA
                try {
                  const phoneResponse = await axios.get(
                    `https://graph.facebook.com/v18.0/${waba.id}/phone_numbers`,
                    {
                      params: {
                        access_token: accessToken
                      }
                    }
                  )
                  
                  if (phoneResponse.data.data && phoneResponse.data.data.length > 0) {
                    console.log(`\n    ${colors.green}Phone Numbers:${colors.reset}`)
                    
                    for (const phone of phoneResponse.data.data) {
                      console.log(`\n    📱 ${phone.display_phone_number}`)
                      console.log(`       Phone Number ID: ${colors.green}${phone.id}${colors.reset}`)
                      console.log(`       Verified Name: ${phone.verified_name || 'Not set'}`)
                      console.log(`       Status: ${phone.certificate ? 'Verified ✅' : 'Not verified'}`)
                      
                      // Check if this matches the number we're looking for
                      if (phone.display_phone_number && phone.display_phone_number.includes('9945896033')) {
                        console.log(`\n    ${colors.green}🎉 FOUND YOUR NUMBER!${colors.reset}`)
                      }
                    }
                  }
                } catch (phoneError) {
                  console.log(`    Could not get phone numbers: ${phoneError.response?.data?.error?.message || phoneError.message}`)
                }
              }
            }
          } catch (wabaError) {
            console.log(`  Could not get WhatsApp accounts: ${wabaError.response?.data?.error?.message || wabaError.message}`)
          }
        }
      }
    } catch (businessError) {
      console.log(`Could not get businesses: ${businessError.response?.data?.error?.message || businessError.message}`)
    }

    // Method 2: Try direct app approach
    console.log(`\n${colors.blue}Method 2: Checking app's WhatsApp configuration...${colors.reset}`)
    
    try {
      // First get debug token info to get app ID
      const debugResponse = await axios.get(
        'https://graph.facebook.com/v18.0/debug_token',
        {
          params: {
            input_token: accessToken,
            access_token: accessToken
          }
        }
      )
      
      const appId = debugResponse.data.data.app_id
      console.log(`App ID: ${appId}`)
      
      // Try to get WhatsApp Business Accounts associated with the app
      const appWabaResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${appId}/whatsapp_business_accounts`,
        {
          params: {
            access_token: accessToken
          }
        }
      )
      
      if (appWabaResponse.data.data && appWabaResponse.data.data.length > 0) {
        console.log(`\n${colors.cyan}WhatsApp accounts linked to your app:${colors.reset}`)
        
        for (const waba of appWabaResponse.data.data) {
          console.log(`\nWABA ID: ${colors.yellow}${waba.id}${colors.reset}`)
        }
      }
    } catch (appError) {
      console.log(`Could not get app WhatsApp accounts: ${appError.response?.data?.error?.message || appError.message}`)
    }

    // Provide manual instructions
    console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
    console.log(`${colors.blue}MANUAL METHOD (Most Reliable):${colors.reset}

1. Go to: ${colors.cyan}https://business.facebook.com${colors.reset}

2. In the left menu, click on:
   ${colors.yellow}⚙️ Settings${colors.reset}

3. Under "Accounts", click on:
   ${colors.yellow}WhatsApp Accounts${colors.reset}

4. You should see "Hanaset Business India" or your WhatsApp Business Account

5. Click on it to see:
   - Your WABA ID (long number)
   - Your phone numbers

6. Click on the phone number (+91 99458 96033) to see:
   - Phone number ID (this is what we need!)

7. Update your .env.local with:
   ${colors.green}WHATSAPP_PHONE_NUMBER_ID=<the-id-you-found>
   WHATSAPP_BUSINESS_ACCOUNT_ID=<your-waba-id>${colors.reset}
`)

    // Alternative Graph API Explorer method
    console.log(`\n${colors.blue}ALTERNATIVE: Using Graph API Explorer${colors.reset}

1. Go to: ${colors.cyan}https://developers.facebook.com/tools/explorer/${colors.reset}

2. Make sure "HERA SALON" app is selected

3. In the permissions section, ensure you have:
   ✅ whatsapp_business_management
   ✅ whatsapp_business_messaging

4. In the query field, try:
   ${colors.yellow}me?fields=businesses{owned_whatsapp_business_accounts{id,name,phone_numbers}${colors.reset}

This will show all your WhatsApp Business Accounts and phone numbers.
`)

  } catch (error) {
    console.log(`\n${colors.red}Error: ${error.response?.data?.error?.message || error.message}${colors.reset}`)
  }
}

findWhatsAppAccounts()