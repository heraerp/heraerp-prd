#!/usr/bin/env node
/**
 * WhatsApp Reminder System
 * Sends automated appointment reminders via WhatsApp
 */

const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')
const { format, addHours, isWithinInterval } = require('date-fns')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

class WhatsAppReminderService {
  constructor() {
    this.whatsapp = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      apiUrl: 'https://graph.facebook.com/v18.0'
    }
  }
  
  async sendReminders(orgId) {
    console.log('📱 WhatsApp Reminder Service')
    console.log('=' .repeat(50))
    
    try {
      // Get tomorrow's appointments for 24h reminders
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      
      const { data: tomorrowAppointments } = await supabase
        .from('universal_transactions')
        .select(`
          *,
          client:source_entity_id(
            id,
            entity_name,
            phone_data:core_dynamic_data!inner(field_value_text)
          ),
          stylist:target_entity_id(entity_name),
          status_relationships:core_relationships!from_entity_id(
            to_entity:to_entity_id(entity_code)
          )
        `)
        .eq('organization_id', orgId)
        .eq('transaction_type', 'appointment')
        .eq('transaction_date', tomorrowStr)
        .eq('client.phone_data.field_name', 'phone')
        .eq('status_relationships.relationship_type', 'has_workflow_status')
        .eq('status_relationships.relationship_data->is_active', 'true')
      
      console.log(`\n📅 Found ${tomorrowAppointments?.length || 0} appointments for tomorrow`)
      
      // Send 24h reminders
      for (const apt of tomorrowAppointments || []) {
        const status = apt.status_relationships?.[0]?.to_entity?.entity_code
        if (status === 'STATUS-APPOINTMENT-SCHEDULED') {
          await this.send24HourReminder(apt)
        }
      }
      
      // Get today's appointments for 2h reminders
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const twoHoursFromNow = addHours(new Date(), 2)
      
      const { data: todayAppointments } = await supabase
        .from('universal_transactions')
        .select(`
          *,
          client:source_entity_id(
            id,
            entity_name,
            phone_data:core_dynamic_data!inner(field_value_text)
          ),
          stylist:target_entity_id(entity_name)
        `)
        .eq('organization_id', orgId)
        .eq('transaction_type', 'appointment')
        .eq('transaction_date', todayStr)
        .eq('client.phone_data.field_name', 'phone')
      
      console.log(`\n📅 Checking ${todayAppointments?.length || 0} appointments for 2h reminders`)
      
      // Send 2h reminders
      for (const apt of todayAppointments || []) {
        const appointmentTime = new Date(`${todayStr} ${apt.metadata?.appointment_time || '10:00'}`)
        
        // Check if appointment is within 2-2.5 hours from now
        if (isWithinInterval(appointmentTime, {
          start: addHours(new Date(), 1.75),
          end: addHours(new Date(), 2.25)
        })) {
          await this.send2HourReminder(apt)
        }
      }
      
      console.log('\n✅ Reminder processing complete')
      
    } catch (error) {
      console.error('❌ Reminder service error:', error)
    }
  }
  
  async send24HourReminder(appointment) {
    try {
      const clientPhone = appointment.client?.phone_data?.[0]?.field_value_text
      if (!clientPhone) {
        console.log(`   ⚠️  No phone number for ${appointment.client?.entity_name}`)
        return
      }
      
      const message = this.format24HourReminder(appointment)
      const result = await this.sendWhatsAppMessage(clientPhone, message)
      
      if (result.success) {
        console.log(`   ✅ 24h reminder sent to ${appointment.client.entity_name}`)
        
        // Log reminder sent
        await supabase
          .from('core_entities')
          .insert({
            organization_id: appointment.organization_id,
            entity_type: 'reminder_log',
            entity_name: `24h Reminder - ${appointment.transaction_code}`,
            entity_code: `REMINDER-24H-${Date.now()}`,
            smart_code: 'HERA.WHATSAPP.REMINDER.24H.v1',
            metadata: {
              appointment_id: appointment.id,
              client_id: appointment.source_entity_id,
              reminder_type: '24_hour',
              sent_at: new Date().toISOString(),
              message_id: result.messageId
            }
          })
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to send 24h reminder:`, error.message)
    }
  }
  
  async send2HourReminder(appointment) {
    try {
      const clientPhone = appointment.client?.phone_data?.[0]?.field_value_text
      if (!clientPhone) return
      
      const message = this.format2HourReminder(appointment)
      const result = await this.sendWhatsAppMessage(clientPhone, message)
      
      if (result.success) {
        console.log(`   ✅ 2h reminder sent to ${appointment.client.entity_name}`)
        
        // Log reminder sent
        await supabase
          .from('core_entities')
          .insert({
            organization_id: appointment.organization_id,
            entity_type: 'reminder_log',
            entity_name: `2h Reminder - ${appointment.transaction_code}`,
            entity_code: `REMINDER-2H-${Date.now()}`,
            smart_code: 'HERA.WHATSAPP.REMINDER.2H.v1',
            metadata: {
              appointment_id: appointment.id,
              client_id: appointment.source_entity_id,
              reminder_type: '2_hour',
              sent_at: new Date().toISOString(),
              message_id: result.messageId
            }
          })
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to send 2h reminder:`, error.message)
    }
  }
  
  format24HourReminder(appointment) {
    const date = new Date(appointment.transaction_date)
    const dayName = format(date, 'EEEE')
    const time = appointment.metadata?.appointment_time || '10:00 AM'
    const service = appointment.metadata?.service_name || 'Service'
    const stylist = appointment.stylist?.entity_name || 'Our team'
    const duration = appointment.metadata?.duration || '60'
    
    return `Hello ${appointment.client.entity_name}! 👋

Just a reminder about your appointment tomorrow:

📅 ${dayName} at ${time}
💅 ${service} (${duration} min)
👤 With ${stylist}
📍 Glamour Salon, Dubai Mall

💡 Tips:
• Arrive 5 mins early
• Free parking at P2 Level
• Bring inspiration photos if you have any

Reply CANCEL to cancel
Reply CHANGE to reschedule

See you tomorrow! ✨`
  }
  
  format2HourReminder(appointment) {
    const time = appointment.metadata?.appointment_time || '10:00 AM'
    const service = appointment.metadata?.service_name || 'Service'
    const stylist = appointment.stylist?.entity_name || 'Our team'
    
    return `Hi ${appointment.client.entity_name}! 

See you in 2 hours! ⏰

🕐 Today at ${time}
💅 ${service}
👤 With ${stylist}

📍 Get directions: maps.app/glamour-salon
🚗 Free parking available at P2 Level

Running late? Just let us know!

Looking forward to seeing you soon! 💕`
  }
  
  async sendWhatsAppMessage(to, text) {
    try {
      const response = await axios.post(
        `${this.whatsapp.apiUrl}/${this.whatsapp.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: text }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.whatsapp.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      return {
        success: true,
        messageId: response.data.messages[0].id
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message
      }
    }
  }
  
  async sendMarketingMessage(orgId) {
    console.log('\n📢 Sending Marketing Messages...')
    
    // Get VIP customers who haven't visited in 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: vipCustomers } = await supabase
      .from('core_entities')
      .select(`
        *,
        phone_data:core_dynamic_data!inner(field_value_text),
        last_visit:universal_transactions(
          transaction_date,
          created_at
        )
      `)
      .eq('organization_id', orgId)
      .eq('entity_type', 'customer')
      .eq('phone_data.field_name', 'phone')
      .eq('metadata->customer_type', 'vip')
      .lt('last_visit.created_at', thirtyDaysAgo.toISOString())
      .limit(10)
    
    for (const customer of vipCustomers || []) {
      const phone = customer.phone_data?.[0]?.field_value_text
      if (!phone) continue
      
      const message = `Hi ${customer.entity_name}! 💕

We miss you at Glamour Salon! 

As our VIP customer, enjoy these exclusive offers:
🎁 20% off any service
🎁 Free hair treatment with color
🎁 Complimentary refreshments

Valid this week only!

Book now: Reply with your preferred day
Or call: +971 4 123 4567

Can't wait to see you again! ✨`
      
      const result = await this.sendWhatsAppMessage(phone, message)
      if (result.success) {
        console.log(`   ✅ Marketing message sent to ${customer.entity_name}`)
      }
    }
  }
}

// Main execution
async function main() {
  const service = new WhatsAppReminderService()
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  
  // Check command line argument
  const command = process.argv[2]
  
  if (command === 'marketing') {
    await service.sendMarketingMessage(orgId)
  } else {
    // Default: Send appointment reminders
    await service.sendReminders(orgId)
  }
}

main()