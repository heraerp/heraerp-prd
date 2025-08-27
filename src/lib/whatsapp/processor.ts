import { createClient, SupabaseClient } from '@supabase/supabase-js'
import axios from 'axios'

interface WhatsAppConfig {
  organizationId: string
  supabase: SupabaseClient
}

interface WhatsAppMessage {
  from: string
  text: string
  message_id: string
  type: 'text' | 'interactive' | 'image' | 'document'
  interactive?: any
  timestamp: string
}

interface Sender {
  type: 'customer' | 'staff' | 'new_customer'
  entityId?: string
  name?: string
  phone: string
}

interface Intent {
  action: string
  entities?: any
  confidence?: number
}

export class WhatsAppProcessor {
  private supabase: SupabaseClient
  private organizationId: string
  private whatsapp: {
    phoneNumberId: string
    accessToken: string
    apiUrl: string
  }
  
  constructor(config: WhatsAppConfig) {
    this.supabase = config.supabase
    this.organizationId = config.organizationId
    
    this.whatsapp = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      apiUrl: 'https://graph.facebook.com/v18.0'
    }
  }
  
  async processMessage(message: WhatsAppMessage) {
    try {
      console.log(`Processing message from ${message.from}: ${message.text}`)
      
      // 1. Identify sender
      const sender = await this.identifySender(message.from)
      
      // 2. Get or create conversation
      const conversation = await this.getOrCreateConversation(message.from, sender)
      
      // 3. Store incoming message
      await this.storeMessage(conversation.id, message.text, 'inbound', message.message_id)
      
      // 4. Parse intent
      const intent = await this.parseIntent(message.text, sender, conversation)
      
      // 5. Execute action
      const result = await this.executeIntent(intent, sender, conversation)
      
      // 6. Send response
      await this.sendResponse(message.from, result, conversation)
      
      // 7. Update conversation context
      await this.updateConversationContext(conversation.id, intent, result)
      
      return { success: true, intent, result }
      
    } catch (error) {
      console.error('WhatsApp processing error:', error)
      await this.sendErrorResponse(message.from)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
  
  private async identifySender(phoneNumber: string): Promise<Sender> {
    // Check if staff member
    const { data: staffPhone } = await this.supabase
      .from('core_dynamic_data')
      .select('entity_id')
      .eq('organization_id', this.organizationId)
      .eq('field_name', 'phone')
      .eq('field_value_text', phoneNumber)
      .single()
    
    if (staffPhone) {
      const { data: staffEntity } = await this.supabase
        .from('core_entities')
        .select('*')
        .eq('id', staffPhone.entity_id)
        .eq('entity_type', 'employee')
        .single()
      
      if (staffEntity) {
        return {
          type: 'staff',
          entityId: staffEntity.id,
          name: staffEntity.entity_name,
          phone: phoneNumber
        }
      }
    }
    
    // Check if existing customer
    const { data: customerPhone } = await this.supabase
      .from('core_dynamic_data')
      .select('entity_id')
      .eq('organization_id', this.organizationId)
      .eq('field_name', 'phone')
      .eq('field_value_text', phoneNumber)
      .single()
    
    if (customerPhone) {
      const { data: customerEntity } = await this.supabase
        .from('core_entities')
        .select('*')
        .eq('id', customerPhone.entity_id)
        .eq('entity_type', 'customer')
        .single()
      
      if (customerEntity) {
        return {
          type: 'customer',
          entityId: customerEntity.id,
          name: customerEntity.entity_name,
          phone: phoneNumber
        }
      }
    }
    
    // New customer
    return {
      type: 'new_customer',
      phone: phoneNumber
    }
  }
  
  private async getOrCreateConversation(phoneNumber: string, sender: Sender) {
    const { data: existing } = await this.supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'whatsapp_conversation')
      .eq('entity_code', `WA-${phoneNumber}`)
      .single()
    
    if (existing) return existing
    
    const { data: conversation } = await this.supabase
      .from('core_entities')
      .insert({
        organization_id: this.organizationId,
        entity_type: 'whatsapp_conversation',
        entity_name: `WhatsApp: ${sender.name || phoneNumber}`,
        entity_code: `WA-${phoneNumber}`,
        smart_code: `HERA.WHATSAPP.CONV.${sender.type.toUpperCase()}.v1`,
        metadata: {
          phone: phoneNumber,
          sender_type: sender.type,
          sender_id: sender.entityId,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()
    
    return conversation!
  }
  
  private async storeMessage(
    conversationId: string, 
    text: string, 
    direction: 'inbound' | 'outbound', 
    messageId: string
  ) {
    try {
      const { data, error } = await this.supabase
        .from('universal_transactions')
        .insert({
          organization_id: this.organizationId,
          transaction_type: 'whatsapp_message',
          transaction_code: `MSG-${Date.now()}`,
          transaction_date: new Date().toISOString(), // Required field
          total_amount: 0, // Required field, 0 for messages
          source_entity_id: direction === 'inbound' ? conversationId : null,
          target_entity_id: direction === 'outbound' ? conversationId : null,
          smart_code: `HERA.WHATSAPP.MSG.${direction.toUpperCase()}.v1`,
          metadata: {
            message_id: messageId,
            text: text,
            direction: direction,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error storing message:', error)
        throw error
      }
      
      console.log('Message stored successfully:', data?.id)
      return data
    } catch (error) {
      console.error('Failed to store WhatsApp message:', error)
      throw error
    }
  }
  
  private async parseIntent(text: string, sender: Sender, conversation: any): Promise<Intent> {
    const lowerText = text.toLowerCase()
    
    // Customer intents
    if (sender.type !== 'staff') {
      if (lowerText.includes('book') || lowerText.includes('appointment')) {
        return {
          action: 'book_appointment',
          entities: this.extractBookingEntities(text)
        }
      }
      
      if (lowerText.includes('cancel')) {
        return { action: 'cancel_appointment' }
      }
      
      if (lowerText.includes('reschedule')) {
        return { action: 'reschedule_appointment' }
      }
      
      if (lowerText.includes('service') || lowerText.includes('price')) {
        return { action: 'view_services' }
      }
      
      if (lowerText.includes('points') || lowerText.includes('loyalty')) {
        return { action: 'check_loyalty' }
      }
    }
    
    // Staff intents
    if (sender.type === 'staff') {
      if (lowerText.includes('schedule') || lowerText.includes('appointments')) {
        return { action: 'staff_schedule' }
      }
      
      if (lowerText.includes('check in')) {
        return { 
          action: 'staff_checkin',
          entities: { clientName: this.extractClientName(text) }
        }
      }
      
      if (lowerText.includes('complete')) {
        return { action: 'complete_service' }
      }
      
      if (lowerText.includes('break') || lowerText.includes('unavailable')) {
        return { action: 'staff_break' }
      }
    }
    
    // Check for interactive responses
    if (text.startsWith('book_')) {
      return { 
        action: 'confirm_booking',
        entities: { slotId: text.replace('book_', '') }
      }
    }
    
    // Default
    return { action: 'greeting' }
  }
  
  private async executeIntent(intent: Intent, sender: Sender, conversation: any) {
    switch (intent.action) {
      case 'greeting':
        return this.generateGreeting(sender)
      
      case 'book_appointment':
        return await this.generateBookingFlow(intent.entities, sender)
      
      case 'view_services':
        return await this.generateServiceMenu()
      
      case 'check_loyalty':
        return await this.generateLoyaltyBalance(sender)
      
      case 'staff_schedule':
        return await this.generateStaffSchedule(sender)
      
      case 'staff_checkin':
        return await this.handleStaffCheckIn(intent.entities, sender)
      
      case 'confirm_booking':
        return await this.confirmBooking(intent.entities, sender)
      
      default:
        return this.generateHelpMessage(sender)
    }
  }
  
  private generateGreeting(sender: Sender) {
    if (sender.type === 'staff') {
      return {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: `Good day ${sender.name}! How can I assist you today?`
          },
          action: {
            buttons: [
              { type: 'reply', reply: { id: 'view_schedule', title: '📅 My Schedule' }},
              { type: 'reply', reply: { id: 'take_break', title: '☕ Take Break' }},
              { type: 'reply', reply: { id: 'view_stats', title: '📊 My Stats' }}
            ]
          }
        }
      }
    }
    
    const greeting = sender.type === 'customer' 
      ? `Welcome back ${sender.name}!` 
      : 'Welcome to Glamour Salon!'
    
    return {
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: `${greeting} What would you like to do today?`
        },
        action: {
          buttons: [
            { type: 'reply', reply: { id: 'book_now', title: '📅 Book Appointment' }},
            { type: 'reply', reply: { id: 'view_services', title: '💅 Our Services' }},
            { type: 'reply', reply: { id: 'contact_us', title: '📞 Contact Us' }}
          ]
        }
      }
    }
  }
  
  private async generateBookingFlow(entities: any, sender: Sender) {
    // Get available slots
    const slots = await this.getAvailableSlots(entities?.date)
    
    if (slots.length === 0) {
      return {
        type: 'text',
        text: 'Sorry, we are fully booked for that day. Would you like to check another date?'
      }
    }
    
    // Format slots into sections by time of day
    const morningSlots = slots.filter(s => parseInt(s.time) < 12)
    const afternoonSlots = slots.filter(s => parseInt(s.time) >= 12)
    
    const sections = []
    
    if (morningSlots.length > 0) {
      sections.push({
        title: 'Morning Slots',
        rows: morningSlots.map(slot => ({
          id: `book_${slot.id}`,
          title: `${slot.time} with ${slot.stylist}`,
          description: slot.service || 'Available'
        }))
      })
    }
    
    if (afternoonSlots.length > 0) {
      sections.push({
        title: 'Afternoon Slots',
        rows: afternoonSlots.map(slot => ({
          id: `book_${slot.id}`,
          title: `${slot.time} with ${slot.stylist}`,
          description: slot.service || 'Available'
        }))
      })
    }
    
    return {
      type: 'list',
      interactive: {
        type: 'list',
        header: {
          type: 'text',
          text: '📅 Available Appointments'
        },
        body: {
          text: 'Select your preferred time slot:'
        },
        action: {
          button: 'View Times',
          sections
        }
      }
    }
  }
  
  private async sendResponse(to: string, response: any, conversation: any) {
    const url = `${this.whatsapp.apiUrl}/${this.whatsapp.phoneNumberId}/messages`
    
    const messageData = {
      messaging_product: 'whatsapp',
      to: to,
      ...response
    }
    
    try {
      const result = await axios.post(url, messageData, {
        headers: {
          'Authorization': `Bearer ${this.whatsapp.accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      // Store outbound message
      await this.storeMessage(
        conversation.id,
        JSON.stringify(response),
        'outbound',
        result.data.messages[0].id
      )
      
      return result.data
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error)
      throw error
    }
  }
  
  private async sendErrorResponse(to: string) {
    await this.sendResponse(to, {
      type: 'text',
      text: { body: 'Sorry, I encountered an error. Please try again or call us at +971 4 123 4567.' }
    }, null)
  }
  
  private async updateConversationContext(conversationId: string, intent: Intent, result: any) {
    await this.supabase
      .from('core_entities')
      .update({
        metadata: {
          last_intent: intent.action,
          last_message: new Date().toISOString(),
          context: {
            current_flow: intent.action,
            entities: intent.entities
          }
        }
      })
      .eq('id', conversationId)
  }
  
  // Helper methods
  private extractBookingEntities(text: string) {
    const entities: any = {}
    
    // Date extraction
    if (text.includes('today')) entities.date = new Date()
    if (text.includes('tomorrow')) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      entities.date = tomorrow
    }
    
    // Time extraction
    const timeMatch = text.match(/(\d{1,2})\s*(am|pm)/i)
    if (timeMatch) entities.time = timeMatch[0]
    
    // Service extraction
    const services = ['haircut', 'color', 'facial', 'manicure', 'pedicure', 'massage']
    services.forEach(service => {
      if (text.toLowerCase().includes(service)) {
        entities.service = service
      }
    })
    
    // Staff preference
    const staffNames = ['emma', 'lisa', 'nina', 'sarah']
    staffNames.forEach(name => {
      if (text.toLowerCase().includes(name)) {
        entities.preferredStaff = name
      }
    })
    
    return entities
  }
  
  private extractClientName(text: string): string {
    // Simple extraction - "check in Sarah Johnson" -> "Sarah Johnson"
    const checkInPattern = /check in\s+(.+)/i
    const match = text.match(checkInPattern)
    return match ? match[1].trim() : ''
  }
  
  private async getAvailableSlots(date?: Date) {
    // This would query actual availability from the database
    // For now, return mock data
    const slots = [
      { id: '1', time: '9:00 AM', stylist: 'Emma', service: 'Haircut' },
      { id: '2', time: '10:30 AM', stylist: 'Lisa', service: 'Available' },
      { id: '3', time: '2:00 PM', stylist: 'Emma', service: 'Color' },
      { id: '4', time: '3:30 PM', stylist: 'Nina', service: 'Available' },
      { id: '5', time: '5:00 PM', stylist: 'Sarah', service: 'Facial' }
    ]
    
    return slots
  }
  
  private async generateServiceMenu() {
    // Would fetch from database
    const services = {
      'Hair Services': [
        { name: 'Haircut & Style', price: 'AED 150', duration: '45 min' },
        { name: 'Hair Color', price: 'AED 350', duration: '120 min' },
        { name: 'Highlights', price: 'AED 450', duration: '150 min' }
      ],
      'Facial Treatments': [
        { name: 'Classic Facial', price: 'AED 200', duration: '60 min' },
        { name: 'Anti-Aging Facial', price: 'AED 350', duration: '90 min' },
        { name: 'Hydrating Facial', price: 'AED 300', duration: '75 min' }
      ],
      'Nail Services': [
        { name: 'Manicure', price: 'AED 80', duration: '30 min' },
        { name: 'Pedicure', price: 'AED 100', duration: '45 min' },
        { name: 'Gel Polish', price: 'AED 120', duration: '45 min' }
      ]
    }
    
    const sections = Object.entries(services).map(([category, items]) => ({
      title: category,
      rows: items.map((service, index) => ({
        id: `service_${category}_${index}`,
        title: service.name,
        description: `${service.price} • ${service.duration}`
      }))
    }))
    
    return {
      type: 'list',
      interactive: {
        type: 'list',
        header: {
          type: 'text',
          text: '💅 Our Services'
        },
        body: {
          text: 'Browse our service menu:'
        },
        action: {
          button: 'View Services',
          sections
        }
      }
    }
  }
  
  private async generateLoyaltyBalance(sender: Sender) {
    if (sender.type !== 'customer') {
      return {
        type: 'text',
        text: { body: 'Please register as a customer first to join our loyalty program!' }
      }
    }
    
    // Would fetch actual balance
    const points = 250
    const tier = 'Gold'
    
    return {
      type: 'text',
      text: { 
        body: `🌟 *Your Loyalty Status*\n\nPoints Balance: *${points} points*\nMembership Tier: *${tier}*\n\nYou're just 50 points away from your next reward!\n\n_Earn 1 point for every AED spent_` 
      }
    }
  }
  
  private async generateStaffSchedule(sender: Sender) {
    if (sender.type !== 'staff') {
      return this.generateHelpMessage(sender)
    }
    
    // Would fetch actual schedule
    const schedule = [
      { time: '9:00 AM', client: 'Sarah Johnson', service: 'Haircut' },
      { time: '10:30 AM', client: 'Maya Patel', service: 'Hair Color' },
      { time: '2:00 PM', client: 'Available', service: '-' },
      { time: '3:30 PM', client: 'Aisha Khan', service: 'Highlights' }
    ]
    
    const scheduleText = schedule.map(slot => 
      `${slot.time}: ${slot.client === 'Available' ? '✅ Available' : `${slot.client} - ${slot.service}`}`
    ).join('\n')
    
    return {
      type: 'text',
      text: { 
        body: `📅 *Your Schedule Today*\n\n${scheduleText}\n\n_Reply "break" to take a break_\n_Reply "check in [name]" to check in a client_` 
      }
    }
  }
  
  private async handleStaffCheckIn(entities: any, sender: Sender) {
    if (sender.type !== 'staff' || !entities.clientName) {
      return {
        type: 'text',
        text: { body: 'Please specify the client name. Example: "check in Sarah Johnson"' }
      }
    }
    
    // Would perform actual check-in
    return {
      type: 'text',
      text: { 
        body: `✅ *Check-in Successful*\n\n${entities.clientName} has been checked in.\n\nService will start automatically when you're ready.` 
      }
    }
  }
  
  private async confirmBooking(entities: any, sender: Sender) {
    // Would create actual booking
    return {
      type: 'text',
      text: { 
        body: `✅ *Booking Confirmed!*\n\nYour appointment is confirmed:\n📅 Tomorrow at 2:00 PM\n👤 With Emma\n💅 Service: Haircut\n💰 Price: AED 150\n\nWe'll send you a reminder tomorrow morning.\n\n_Reply "cancel" to cancel this booking_` 
      }
    }
  }
  
  private generateHelpMessage(sender: Sender) {
    const commands = sender.type === 'staff' 
      ? [
          '"schedule" - View your appointments',
          '"check in [name]" - Check in a client',
          '"break" - Mark yourself unavailable',
          '"stats" - View your performance'
        ]
      : [
          '"book appointment" - Schedule a service',
          '"services" - View our menu',
          '"cancel" - Cancel appointment',
          '"points" - Check loyalty balance'
        ]
    
    return {
      type: 'text',
      text: { 
        body: `I can help you with:\n\n${commands.map(cmd => `• ${cmd}`).join('\n')}\n\nJust type your request!` 
      }
    }
  }
}