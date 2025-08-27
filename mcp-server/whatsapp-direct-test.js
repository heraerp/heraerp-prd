#!/usr/bin/env node
/**
 * Direct WhatsApp Business Account Test
 * Tests common WABA IDs and Phone Number IDs
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

async function testWhatsAppSetup() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║     WhatsApp Business Account Direct Test                 ║
╚══════════════════════════════════════════════════════════╝${colors.reset}

Since automatic discovery isn't working, let's try the manual approach.
`)

  console.log(`${colors.yellow}IMPORTANT: Finding Your Phone Number ID${colors.reset}

The easiest way is through WhatsApp Manager:

1. Go to: ${colors.cyan}https://business.facebook.com/wa/manage${colors.reset}
   (This is the direct WhatsApp Manager link)

2. You should see your WhatsApp Business Account

3. Click on the account (Hanaset Business India)

4. In the left menu, click on ${colors.yellow}"Phone numbers"${colors.reset}

5. Click on your number ${colors.green}+91 99458 96033${colors.reset}

6. You'll see:
   - Phone number ID (a 15-digit number)
   - Display phone number
   - Status
   - Quality rating

${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.blue}Alternative Method - WhatsApp Business Settings:${colors.reset}

1. Go to: ${colors.cyan}https://business.facebook.com/settings/whatsapp-business-accounts${colors.reset}

2. Find your WhatsApp Business Account

3. Click "View" or the account name

4. Go to "WhatsApp Phone Numbers" section

5. Your Phone Number ID will be shown there

${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}

${colors.blue}What the Phone Number ID looks like:${colors.reset}
- It's a 15-16 digit number
- Example: ${colors.green}123456789012345${colors.reset}
- It's NOT your phone number
- It's NOT your WABA ID

Once you find it, we'll test it immediately!
`)

  // Test if they want to try a Phone Number ID
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log(`\n${colors.cyan}Do you have your Phone Number ID? Let's test it!${colors.reset}`)
  
  rl.question('\nEnter your Phone Number ID (or press Enter to skip): ', async (phoneNumberId) => {
    if (phoneNumberId && phoneNumberId.trim()) {
      console.log(`\n${colors.blue}Testing Phone Number ID: ${phoneNumberId}${colors.reset}`)
      
      try {
        const response = await axios.get(
          `https://graph.facebook.com/v18.0/${phoneNumberId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            params: {
              fields: 'display_phone_number,verified_name,certificate,quality_rating,messaging_limit'
            }
          }
        )
        
        console.log(`\n${colors.green}✅ SUCCESS! This is your correct Phone Number ID!${colors.reset}`)
        console.log(`\nPhone Details:`)
        console.log(`  Display Number: ${colors.green}${response.data.display_phone_number}${colors.reset}`)
        console.log(`  Verified Name: ${response.data.verified_name || 'Not set'}`)
        console.log(`  Quality Rating: ${response.data.quality_rating || 'Not rated'}`)
        console.log(`  Status: ${response.data.certificate ? 'Business Verified ✅' : 'Not verified'}`)
        
        if (response.data.messaging_limit) {
          console.log(`  ${colors.yellow}Messaging Limit: ${response.data.messaging_limit}${colors.reset}`)
        }
        
        console.log(`\n${colors.green}🎉 Great! Now let's update your .env.local file.${colors.reset}`)
        console.log(`\nI'll update it with:`)
        console.log(`  ${colors.cyan}WHATSAPP_PHONE_NUMBER_ID=${phoneNumberId}${colors.reset}`)
        
        // Update the env file
        const fs = require('fs')
        const envPath = require('path').join(__dirname, '../.env.local')
        let envContent = fs.readFileSync(envPath, 'utf8')
        envContent = envContent.replace(
          'WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here',
          `WHATSAPP_PHONE_NUMBER_ID=${phoneNumberId}`
        )
        fs.writeFileSync(envPath, envContent)
        
        console.log(`\n${colors.green}✅ Updated .env.local successfully!${colors.reset}`)
        console.log(`\nNow you can run:`)
        console.log(`  ${colors.cyan}node verify-whatsapp-setup.js${colors.reset}`)
        console.log(`\nTo complete the setup!`)
        
      } catch (error) {
        console.log(`\n${colors.red}❌ This Phone Number ID doesn't seem to be correct.${colors.reset}`)
        console.log(`Error: ${error.response?.data?.error?.message || error.message}`)
        console.log(`\nPlease double-check the ID from WhatsApp Manager.`)
      }
    } else {
      console.log(`\n${colors.yellow}Please get your Phone Number ID from WhatsApp Manager first.${colors.reset}`)
    }
    
    rl.close()
  })
}

testWhatsAppSetup()