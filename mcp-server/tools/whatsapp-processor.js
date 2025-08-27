#!/usr/bin/env node
/**
 * WhatsApp Message Processor MCP Tool
 * Handles incoming WhatsApp messages and executes HERA operations
 */

const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')

class WhatsAppProcessor {
  constructor(config) {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    this.whatsapp = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      apiUrl: 'https://graph.facebook.com/v18.0'
    }
    
    this.organizationId = config.organizationId
  }
  
  /**
   * Main message processor
   */
  async processMessage(webhook) {
    try {
      const { from, text, message_id } = webhook
      console.log(`Processing message from ${from}: ${text}`)
      
      // 1. Identify sender
      const sender = await this.identifySender(from)
      
      // 2. Get or create conversation
      const conversation = await this.getOrCreateConversation(from, sender)
      
      // 3. Store incoming message
      await this.storeMessage(conversation.id, text, 'inbound', message_id)
      
      // 4. Parse intent
      const intent = await this.parseIntent(text, sender, conversation)
      
      // 5. Execute action
      const result = await this.executeIntent(intent, sender, conversation)
      
      // 6. Send response
      await this.sendResponse(from, result)
      
      // 7. Update conversation context
      await this.updateConversationContext(conversation.id, intent, result)
      
      return { success: true, intent, result }
      
    } catch (error) {
      console.error('WhatsApp processing error:', error)
      await this.sendResponse(webhook.from, {
        type: 'text',
        text: 'Sorry, I encountered an error. Please try again.'
      })
      return { success: false, error: error.message }
    }
  }
  
  /**
   * Identify if sender is customer or staff
   */
  async identifySender(phoneNumber) {
    // Check if staff member
    const { data: staff } = await this.supabase
      .from('core_dynamic_data')
      .select('entity_id')
      .eq('organization_id', this.organizationId)
      .eq('field_name', 'phone')
      .eq('field_value_text', phoneNumber)
      .single()
    
    if (staff) {
      const { data: staffEntity } = await this.supabase
        .from('core_entities')
        .select('*')
        .eq('id', staff.entity_id)
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
    const { data: customer } = await this.supabase
      .from('core_dynamic_data')
      .select('entity_id')
      .eq('organization_id', this.organizationId)
      .eq('field_name', 'phone')
      .eq('field_value_text', phoneNumber)
      .single()
    
    if (customer) {
      const { data: customerEntity } = await this.supabase
        .from('core_entities')
        .select('*')
        .eq('id', customer.entity_id)
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
  
  /**
   * Get or create WhatsApp conversation entity
   */
  async getOrCreateConversation(phoneNumber, sender) {
    // Check existing conversation
    const { data: existing } = await this.supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'whatsapp_conversation')
      .eq('entity_code', `WA-${phoneNumber}`)
      .single()
    
    if (existing) {
      return existing
    }
    
    // Create new conversation
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
    
    return conversation
  }
  
  /**
   * Store message as transaction
   */
  async storeMessage(conversationId, text, direction, messageId) {
    const { data: message } = await this.supabase
      .from('universal_transactions')
      .insert({
        organization_id: this.organizationId,
        transaction_type: 'whatsapp_message',
        transaction_code: `MSG-${Date.now()}`,
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
    
    return message
  }
  
  /**
   * Parse intent using pattern matching (can be enhanced with AI)
   */
  async parseIntent(text, sender, conversation) {
    const lowerText = text.toLowerCase()
    
    // Booking patterns
    if (lowerText.includes('book') || lowerText.includes('appointment')) {
      return {
        action: 'book_appointment',
        entities: this.extractBookingEntities(text)
      }
    }
    
    // Availability check
    if (lowerText.includes('available') || lowerText.includes('free')) {
      return {
        action: 'check_availability',
        entities: this.extractDateTimeEntities(text)
      }
    }
    
    // Cancel/Reschedule
    if (lowerText.includes('cancel')) {
      return { action: 'cancel_appointment' }
    }
    
    if (lowerText.includes('reschedule') || lowerText.includes('change')) {
      return { action: 'reschedule_appointment' }
    }
    
    // Service inquiry
    if (lowerText.includes('service') || lowerText.includes('price')) {
      return { action: 'view_services' }
    }
    
    // Staff specific
    if (sender.type === 'staff') {
      if (lowerText.includes('schedule') || lowerText.includes('appointments')) {
        return { action: 'view_schedule' }
      }
      
      if (lowerText.includes('check in')) {
        return {
          action: 'check_in_client',
          entities: { clientName: this.extractClientName(text) }
        }
      }
    }
    
    // Default greeting
    return { action: 'greeting' }
  }
  
  /**
   * Execute intent action
   */
  async executeIntent(intent, sender, conversation) {
    switch (intent.action) {
      case 'greeting':
        return this.handleGreeting(sender)
      
      case 'book_appointment':
        return this.handleBookingRequest(intent.entities, sender, conversation)
      
      case 'check_availability':
        return this.handleAvailabilityCheck(intent.entities, sender)
      
      case 'view_services':
        return this.handleServiceInquiry()
      
      case 'view_schedule':
        return this.handleStaffSchedule(sender)
      
      case 'check_in_client':
        return this.handleStaffCheckIn(intent.entities, sender)
      
      default:
        return {
          type: 'text',
          text: "I didn't understand that. You can:\n• Book an appointment\n• Check availability\n• View services\n• Cancel appointment"
        }
    }
  }
  
  /**
   * Handle greeting
   */
  handleGreeting(sender) {
    if (sender.type === 'staff') {
      return {
        type: 'interactive',
        body: {
          text: `Hello ${sender.name}! What would you like to do?`
        },
        action: {
          buttons: [
            { id: 'view_schedule', title: 'View Schedule' },
            { id: 'mark_break', title: 'Take Break' },
            { id: 'check_inventory', title: 'Check Inventory' }
          ]
        }
      }
    }
    
    return {
      type: 'interactive',
      body: {
        text: "Welcome to Glamour Salon! How can I help you today?"
      },
      action: {
        buttons: [
          { id: 'book_appointment', title: 'Book Appointment' },
          { id: 'view_services', title: 'View Services' },
          { id: 'check_points', title: 'Loyalty Points' }
        ]
      }
    }
  }
  
  /**
   * Handle booking request
   */
  async handleBookingRequest(entities, sender, conversation) {
    // For new customers, we need name first
    if (sender.type === 'new_customer' && !conversation.metadata?.customer_name) {
      return {
        type: 'text',
        text: 'Welcome! To book an appointment, I\'ll need your name first. What should I call you?'
      }
    }
    
    // Show available slots
    const slots = await this.getAvailableSlots(entities.date)
    
    if (slots.length === 0) {
      return {
        type: 'text',
        text: 'Sorry, we don\'t have any slots available on that date. Would you like to check another day?'
      }
    }
    
    return {
      type: 'list',
      header: {
        type: 'text',
        text: 'Available Time Slots'
      },
      body: {
        text: `Select a time for ${entities.service || 'your appointment'}:`
      },
      sections: [{
        title: 'Available Times',
        rows: slots.map(slot => ({
          id: `book_${slot.id}`,
          title: slot.time,
          description: `with ${slot.stylist} - ${slot.duration}`
        }))
      }]
    }
  }
  
  /**
   * Send WhatsApp response
   */
  async sendResponse(to, response) {
    const url = `${this.whatsapp.apiUrl}/${this.whatsapp.phoneNumberId}/messages`
    
    let messageData = {
      messaging_product: 'whatsapp',
      to: to,
      type: response.type || 'text'
    }
    
    if (response.type === 'text') {
      messageData.text = { body: response.text }
    } else if (response.type === 'interactive') {
      messageData.interactive = response
    } else if (response.type === 'list') {
      messageData.interactive = {
        type: 'list',
        header: response.header,
        body: response.body,
        action: {
          button: 'Select Option',
          sections: response.sections
        }
      }
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
  
  /**
   * Helper methods
   */
  
  extractBookingEntities(text) {
    // Simple extraction - can be enhanced with NLP
    const entities = {}
    
    // Extract date
    if (text.includes('today')) entities.date = new Date()
    if (text.includes('tomorrow')) {
      entities.date = new Date()
      entities.date.setDate(entities.date.getDate() + 1)
    }
    
    // Extract time
    const timeMatch = text.match(/(\d{1,2})\s*(am|pm)/i)
    if (timeMatch) {
      entities.time = timeMatch[0]
    }
    
    // Extract service
    const services = ['haircut', 'color', 'facial', 'manicure', 'pedicure']
    services.forEach(service => {
      if (text.toLowerCase().includes(service)) {
        entities.service = service
      }
    })
    
    return entities
  }
  
  async getAvailableSlots(date = new Date()) {
    // Mock data - would query actual availability
    return [
      { id: '1', time: '10:00 AM', stylist: 'Emma', duration: '45 min' },
      { id: '2', time: '11:30 AM', stylist: 'Lisa', duration: '45 min' },
      { id: '3', time: '2:00 PM', stylist: 'Emma', duration: '45 min' },
      { id: '4', time: '3:30 PM', stylist: 'Nina', duration: '45 min' }
    ]
  }
  
  async updateConversationContext(conversationId, intent, result) {
    // Update conversation metadata with context
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
}

// Export for MCP tool usage
module.exports = { WhatsAppProcessor }