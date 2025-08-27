#!/usr/bin/env node
/**
 * WhatsApp Setup Script
 * Configures WhatsApp integration for your HERA organization
 */

const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')
const readline = require('readline')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function setupWhatsApp() {
  console.log('📱 WHATSAPP BUSINESS API SETUP')
  console.log('=' .repeat(50))
  
  try {
    // 1. Check WhatsApp configuration
    console.log('\n1️⃣ Checking WhatsApp Configuration...')
    
    const requiredEnvVars = [
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_WEBHOOK_TOKEN',
      'WHATSAPP_BUSINESS_NUMBER'
    ]
    
    const missing = requiredEnvVars.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      console.error('\n❌ Missing environment variables:')
      missing.forEach(key => console.error(`   - ${key}`))
      console.log('\n📝 Please add these to your .env.local file')
      console.log('   See .env.whatsapp.example for reference')
      process.exit(1)
    }
    
    console.log('✅ All WhatsApp environment variables found')
    
    // 2. Test WhatsApp API connection
    console.log('\n2️⃣ Testing WhatsApp API Connection...')
    
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
          }
        }
      )
      
      console.log('✅ WhatsApp API connection successful')
      console.log(`   Phone: ${response.data.display_phone_number}`)
      console.log(`   Status: ${response.data.quality_rating}`)
      
    } catch (error) {
      console.error('❌ WhatsApp API connection failed:', error.response?.data || error.message)
      console.log('\n🔧 Please check your access token and phone number ID')
      process.exit(1)
    }
    
    // 3. Configure organization
    console.log('\n3️⃣ Configuring Organization...')
    
    const orgId = process.env.DEFAULT_ORGANIZATION_ID
    if (!orgId) {
      console.error('❌ No DEFAULT_ORGANIZATION_ID found in environment')
      process.exit(1)
    }
    
    // Get organization
    const { data: org } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', orgId)
      .single()
    
    if (!org) {
      console.error('❌ Organization not found')
      process.exit(1)
    }
    
    console.log(`✅ Found organization: ${org.entity_name}`)
    
    // 4. Create WhatsApp configuration entity
    console.log('\n4️⃣ Setting up WhatsApp Configuration...')
    
    // Check if WhatsApp config already exists
    const { data: existingConfig } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'whatsapp_config')
      .single()
    
    if (existingConfig) {
      console.log('⚠️  WhatsApp configuration already exists')
      const update = await question('Do you want to update it? (y/n): ')
      
      if (update.toLowerCase() !== 'y') {
        console.log('Keeping existing configuration')
        return
      }
    }
    
    // Create or update configuration
    const configData = {
      organization_id: orgId,
      entity_type: 'whatsapp_config',
      entity_name: 'WhatsApp Business Configuration',
      entity_code: 'WHATSAPP-CONFIG',
      smart_code: 'HERA.WHATSAPP.CONFIG.v1',
      metadata: {
        phone_number: process.env.WHATSAPP_BUSINESS_NUMBER,
        phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID,
        business_account_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
        webhook_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/whatsapp/webhook`,
        features: {
          booking: true,
          reminders: true,
          loyalty: true,
          staff_access: true
        },
        created_at: new Date().toISOString()
      }
    }
    
    let configId
    if (existingConfig) {
      const { data: updated } = await supabase
        .from('core_entities')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single()
      
      configId = updated.id
      console.log('✅ WhatsApp configuration updated')
    } else {
      const { data: created } = await supabase
        .from('core_entities')
        .insert(configData)
        .select()
        .single()
      
      configId = created.id
      console.log('✅ WhatsApp configuration created')
    }
    
    // Store WhatsApp phone in dynamic data
    await supabase
      .from('core_dynamic_data')
      .upsert({
        organization_id: orgId,
        entity_id: org.id,
        field_name: 'whatsapp_phone',
        field_type: 'text',
        field_value_text: process.env.WHATSAPP_BUSINESS_NUMBER,
        smart_code: 'HERA.ORG.WHATSAPP.PHONE.v1'
      })
    
    // 5. Create greeting messages
    console.log('\n5️⃣ Setting up Greeting Messages...')
    
    const greetings = [
      {
        name: 'Customer Welcome',
        code: 'GREETING-CUSTOMER',
        text: `Welcome to ${org.entity_name}! 🌟\n\nI'm your virtual assistant. I can help you:\n• Book appointments\n• Check availability\n• View services & prices\n• Manage your bookings\n\nHow can I assist you today?`
      },
      {
        name: 'Staff Welcome',
        code: 'GREETING-STAFF',
        text: `Hello! 👋\n\nStaff commands:\n• "schedule" - View your appointments\n• "check in [name]" - Check in a client\n• "break" - Mark yourself on break\n• "stats" - View your performance\n\nWhat would you like to do?`
      },
      {
        name: 'After Hours',
        code: 'GREETING-AFTERHOURS',
        text: `Thank you for contacting ${org.entity_name}! 🌙\n\nWe're currently closed.\n\nBusiness Hours:\nMon-Sat: 9:00 AM - 8:00 PM\nSunday: 10:00 AM - 6:00 PM\n\nYou can still:\n• Book appointments\n• View services\n• Leave a message\n\nHow can I help?`
      }
    ]
    
    for (const greeting of greetings) {
      await supabase
        .from('core_entities')
        .upsert({
          organization_id: orgId,
          entity_type: 'whatsapp_template',
          entity_name: greeting.name,
          entity_code: greeting.code,
          smart_code: `HERA.WHATSAPP.TEMPLATE.${greeting.code}.v1`,
          metadata: {
            template_type: 'greeting',
            message_text: greeting.text,
            is_active: true
          }
        })
    }
    
    console.log('✅ Greeting messages configured')
    
    // 6. Create quick replies
    console.log('\n6️⃣ Setting up Quick Replies...')
    
    const quickReplies = [
      {
        trigger: 'services',
        response: 'View our services: example.com/services\n\nPopular services:\n• Haircut - AED 150\n• Hair Color - AED 350\n• Facial - AED 250\n• Manicure - AED 80'
      },
      {
        trigger: 'location',
        response: `📍 ${org.entity_name}\n\nAddress: Dubai Mall, Level 2\nPhone: ${process.env.WHATSAPP_BUSINESS_NUMBER}\n\nGet directions: maps.app/salon-location`
      },
      {
        trigger: 'hours',
        response: '🕐 Business Hours:\n\nMon-Sat: 9:00 AM - 8:00 PM\nSunday: 10:00 AM - 6:00 PM\n\nBook anytime via WhatsApp!'
      }
    ]
    
    for (const reply of quickReplies) {
      await supabase
        .from('core_entities')
        .upsert({
          organization_id: orgId,
          entity_type: 'whatsapp_quickreply',
          entity_name: `Quick Reply: ${reply.trigger}`,
          entity_code: `QR-${reply.trigger.toUpperCase()}`,
          smart_code: `HERA.WHATSAPP.QR.${reply.trigger.toUpperCase()}.v1`,
          metadata: {
            trigger_words: [reply.trigger],
            response_text: reply.response,
            is_active: true
          }
        })
    }
    
    console.log('✅ Quick replies configured')
    
    // 7. Webhook setup instructions
    console.log('\n7️⃣ Webhook Configuration')
    console.log('=' .repeat(50))
    console.log('\n📝 Add this webhook URL in Meta Business Manager:')
    console.log(`\n   URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/api/v1/whatsapp/webhook`)
    console.log(`   Verify Token: ${process.env.WHATSAPP_WEBHOOK_TOKEN}`)
    console.log('\n   Subscribe to these fields:')
    console.log('   ✓ messages')
    console.log('   ✓ messaging_postbacks')
    console.log('   ✓ message_reads')
    console.log('   ✓ message_reactions')
    
    // 8. Send test message
    console.log('\n8️⃣ Send Test Message')
    console.log('=' .repeat(50))
    
    const sendTest = await question('\nWould you like to send a test message? (y/n): ')
    
    if (sendTest.toLowerCase() === 'y') {
      const testPhone = await question('Enter phone number (with country code): ')
      
      try {
        const response = await axios.post(
          `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: 'whatsapp',
            to: testPhone,
            type: 'text',
            text: {
              body: `🎉 WhatsApp integration test successful!\n\n${org.entity_name} is now connected to WhatsApp.\n\nTry sending "Hi" to start a conversation.`
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        console.log('\n✅ Test message sent successfully!')
        console.log(`   Message ID: ${response.data.messages[0].id}`)
        
      } catch (error) {
        console.error('\n❌ Failed to send test message:', error.response?.data || error.message)
      }
    }
    
    // 9. Summary
    console.log('\n✅ WHATSAPP SETUP COMPLETE!')
    console.log('=' .repeat(50))
    console.log('\n📱 Next Steps:')
    console.log('1. Configure webhook in Meta Business Manager')
    console.log('2. Test by sending a message to your WhatsApp number')
    console.log('3. Monitor logs for incoming messages')
    console.log('4. Customize greeting messages as needed')
    
    console.log('\n🚀 Your customers can now:')
    console.log('• Book appointments via WhatsApp')
    console.log('• Check availability')
    console.log('• View services')
    console.log('• Get automated reminders')
    
    console.log('\n👥 Your staff can:')
    console.log('• Check schedules')
    console.log('• Mark clients as checked in')
    console.log('• Update availability')
    console.log('• All from WhatsApp!')
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error)
  } finally {
    rl.close()
  }
}

// Run setup
setupWhatsApp()