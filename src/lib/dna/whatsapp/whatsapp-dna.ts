/**
 * HERA DNA WhatsApp Integration
 * Universal messaging system using sacred 6-table architecture
 *
 * This DNA component provides complete WhatsApp integration capabilities
 * that work across all industries through smart codes and dynamic data.
 */

import { universalApi } from '@/src/lib/universal-api'

// ============================================================================
// SMART CODE DEFINITIONS
// ============================================================================

export const WHATSAPP_SMART_CODES = {
  // Core entities
  APP: 'HERA.MESSAGING.WHATSAPP.APP.v1',
  CONVERSATION: 'HERA.MESSAGING.WHATSAPP.CONVERSATION.v1',
  TEMPLATE: 'HERA.MESSAGING.WHATSAPP.TEMPLATE.v1',
  AUTOMATION: 'HERA.MESSAGING.WHATSAPP.AUTOMATION.v1',

  // Transactions
  SEND_MESSAGE: 'HERA.MESSAGING.WHATSAPP.SEND.TXN.v1',
  RECEIVE_MESSAGE: 'HERA.MESSAGING.WHATSAPP.RECEIVE.TXN.v1',
  TEMPLATE_SEND: 'HERA.MESSAGING.WHATSAPP.TEMPLATE.SEND.TXN.v1',

  // Message types (transaction lines)
  MESSAGE_TEXT: 'HERA.MESSAGING.WHATSAPP.MESSAGE.TEXT.v1',
  MESSAGE_IMAGE: 'HERA.MESSAGING.WHATSAPP.MESSAGE.IMAGE.v1',
  MESSAGE_DOCUMENT: 'HERA.MESSAGING.WHATSAPP.MESSAGE.DOCUMENT.v1',
  MESSAGE_AUDIO: 'HERA.MESSAGING.WHATSAPP.MESSAGE.AUDIO.v1',
  MESSAGE_VIDEO: 'HERA.MESSAGING.WHATSAPP.MESSAGE.VIDEO.v1',
  MESSAGE_LOCATION: 'HERA.MESSAGING.WHATSAPP.MESSAGE.LOCATION.v1',
  MESSAGE_TEMPLATE: 'HERA.MESSAGING.WHATSAPP.MESSAGE.TEMPLATE.v1',

  // Relationships
  CONVERSATION_CUSTOMER: 'HERA.MESSAGING.WHATSAPP.REL.CONVERSATION_CUSTOMER.v1',
  CONVERSATION_APPOINTMENT: 'HERA.MESSAGING.WHATSAPP.REL.CONVERSATION_APPOINTMENT.v1',
  MESSAGE_CONVERSATION: 'HERA.MESSAGING.WHATSAPP.REL.MESSAGE_CONVERSATION.v1',

  // Industry-specific (Salon example)
  SALON_BOOKING_REMINDER: 'HERA.SALON.MESSAGING.WHATSAPP.BOOKING_REMINDER.v1',
  SALON_BOOKING_CONFIRMATION: 'HERA.SALON.MESSAGING.WHATSAPP.BOOKING_CONFIRMATION.v1',
  SALON_SERVICE_FOLLOWUP: 'HERA.SALON.MESSAGING.WHATSAPP.SERVICE_FOLLOWUP.v1',
  SALON_PROMOTION: 'HERA.SALON.MESSAGING.WHATSAPP.PROMOTION.v1'
} as const

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WhatsAppConfig {
  organizationId: string
  businessId: string
  phoneNumberId: string
  accessToken: string
  webhookVerifyToken: string
  apiVersion?: string
}

export interface WhatsAppMessage {
  from: string
  to: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'template'
  content: {
    text?: string
    mediaUrl?: string
    caption?: string
    templateName?: string
    templateLanguage?: string
    templateParams?: Record<string, string>
    location?: {
      latitude: number
      longitude: number
      name?: string
      address?: string
    }
  }
  metadata?: Record<string, any>
}

export interface WhatsAppConversation {
  id: string
  customerId: string
  customerPhone: string
  status: 'open' | 'closed' | 'archived'
  lastMessageAt: Date
  metadata?: {
    customerName?: string
    tags?: string[]
    assignedTo?: string
  }
}

export interface WhatsAppTemplate {
  name: string
  language: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
    text?: string
    example?: {
      header_text?: string[]
      body_text?: string[][]
      header_handle?: string[]
    }
  }>
}

// ============================================================================
// WHATSAPP DNA CLASS
// ============================================================================

export class WhatsAppDNA {
  private config: WhatsAppConfig

  constructor(config: WhatsAppConfig) {
    this.config = config
  }

  // Public getter for config
  get whatsappConfig(): WhatsAppConfig {
    return this.config
  }

  // ==========================================================================
  // SETUP & INITIALIZATION
  // ==========================================================================

  async setupWhatsAppIntegration() {
    // 1. Create WhatsApp App entity
    const app = await universalApi.createEntity({
      organization_id: this.config.organizationId,
      entity_type: 'whatsapp_app',
      entity_name: 'WhatsApp Business Integration',
      entity_code: 'WHATSAPP-INTEGRATION',
      smart_code: WHATSAPP_SMART_CODES.APP,
      status: 'active'
    })

    // 2. Store credentials in dynamic data (encrypted in production)
    await universalApi.setDynamicField(app.id, 'business_id', this.config.businessId)
    await universalApi.setDynamicField(app.id, 'phone_number_id', this.config.phoneNumberId)
    await universalApi.setDynamicField(app.id, 'access_token', this.config.accessToken)
    await universalApi.setDynamicField(
      app.id,
      'webhook_verify_token',
      this.config.webhookVerifyToken
    )
    await universalApi.setDynamicField(app.id, 'api_version', this.config.apiVersion || 'v17.0')

    // 3. Setup default message templates
    await this.setupDefaultTemplates()

    // 4. Create automation rules
    await this.setupDefaultAutomations()

    return app
  }

  // ==========================================================================
  // CONVERSATION MANAGEMENT
  // ==========================================================================

  async findOrCreateConversation(
    customerPhone: string,
    customerId?: string
  ): Promise<WhatsAppConversation> {
    // Check if conversation exists
    const existingConversations = await universalApi.query('core_entities', {
      entity_type: 'whatsapp_conversation',
      organization_id: this.config.organizationId
    })

    const phoneField = await universalApi.query('core_dynamic_data', {
      field_name: 'customer_phone',
      field_value_text: customerPhone
    })

    let conversation
    if (phoneField.length > 0) {
      conversation = existingConversations.find(c => c.id === phoneField[0].entity_id)
    }

    if (!conversation) {
      // Create new conversation
      conversation = await universalApi.createEntity({
        organization_id: this.config.organizationId,
        entity_type: 'whatsapp_conversation',
        entity_name: `WhatsApp: ${customerPhone}`,
        entity_code: `WA-${customerPhone}`,
        smart_code: WHATSAPP_SMART_CODES.CONVERSATION,
        status: 'active'
      })

      // Store dynamic data
      await universalApi.setDynamicField(conversation.id, 'customer_phone', customerPhone)
      await universalApi.setDynamicField(conversation.id, 'status', 'open')
      await universalApi.setDynamicField(conversation.id, 'created_at', new Date().toISOString())

      // Link to customer if provided
      if (customerId) {
        await universalApi.createRelationship({
          organization_id: this.config.organizationId,
          from_entity_id: conversation.id,
          to_entity_id: customerId,
          relationship_type: 'belongs_to_customer',
          smart_code: WHATSAPP_SMART_CODES.CONVERSATION_CUSTOMER
        })
      }
    }

    return {
      id: conversation.id,
      customerId: customerId || '',
      customerPhone,
      status: 'open',
      lastMessageAt: new Date()
    }
  }

  // ==========================================================================
  // MESSAGE SENDING
  // ==========================================================================

  async sendMessage(message: WhatsAppMessage): Promise<any> {
    // 1. Find or create conversation
    const conversation = await this.findOrCreateConversation(message.to)

    // 2. Create transaction for the message
    const transaction = await universalApi.createTransaction({
      organization_id: this.config.organizationId,
      transaction_type: 'whatsapp_send',
      transaction_code: `WA-SEND-${Date.now()}`,
      smart_code: WHATSAPP_SMART_CODES.SEND_MESSAGE,
      from_entity_id: conversation.id,
      transaction_date: new Date().toISOString(),
      total_amount: 0, // Messages don't have monetary value
      metadata: {
        direction: 'outbound',
        phone_number: message.to,
        message_type: message.type
      }
    })

    // 3. Create transaction line for message content
    const messageSmartCode = this.getMessageSmartCode(message.type)
    await universalApi.createTransactionLine({
      transaction_id: transaction.id,
      line_number: 1,
      smart_code: messageSmartCode,
      quantity: 1,
      metadata: {
        content: message.content,
        timestamp: new Date().toISOString(),
        status: 'sent'
      }
    })

    // 4. Update conversation last message time
    await universalApi.setDynamicField(conversation.id, 'last_message_at', new Date().toISOString())

    // 5. Make actual WhatsApp API call (mock for now)
    const apiResponse = await this.callWhatsAppAPI('messages', {
      messaging_product: 'whatsapp',
      to: message.to,
      type: message.type,
      ...this.formatMessagePayload(message)
    })

    // 6. Store API response
    await universalApi.setDynamicField(
      transaction.id,
      'whatsapp_message_id',
      apiResponse.messages[0].id
    )

    return {
      transactionId: transaction.id,
      conversationId: conversation.id,
      whatsappMessageId: apiResponse.messages[0].id,
      status: 'sent'
    }
  }

  // ==========================================================================
  // MESSAGE RECEIVING (Webhook Handler)
  // ==========================================================================

  async receiveMessage(webhookData: any): Promise<any> {
    const { from, type, text, timestamp } = webhookData

    // 1. Find or create conversation
    const conversation = await this.findOrCreateConversation(from)

    // 2. Create transaction for received message
    const transaction = await universalApi.createTransaction({
      organization_id: this.config.organizationId,
      transaction_type: 'whatsapp_receive',
      transaction_code: `WA-RECV-${timestamp}`,
      smart_code: WHATSAPP_SMART_CODES.RECEIVE_MESSAGE,
      from_entity_id: conversation.id,
      transaction_date: new Date(parseInt(timestamp) * 1000).toISOString(),
      total_amount: 0,
      metadata: {
        direction: 'inbound',
        phone_number: from,
        message_type: type
      }
    })

    // 3. Create transaction line for message content
    const messageSmartCode = this.getMessageSmartCode(type)
    await universalApi.createTransactionLine({
      transaction_id: transaction.id,
      line_number: 1,
      smart_code: messageSmartCode,
      quantity: 1,
      metadata: {
        content: { text: text?.body },
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
        whatsapp_message_id: webhookData.id
      }
    })

    // 4. Process automations
    await this.processAutomations(conversation.id, text?.body)

    return {
      transactionId: transaction.id,
      conversationId: conversation.id,
      processed: true
    }
  }

  // ==========================================================================
  // TEMPLATE MANAGEMENT
  // ==========================================================================

  async createTemplate(template: WhatsAppTemplate): Promise<any> {
    const templateEntity = await universalApi.createEntity({
      organization_id: this.config.organizationId,
      entity_type: 'whatsapp_template',
      entity_name: template.name,
      entity_code: `WA-TPL-${template.name.toUpperCase().replace(/\s+/g, '_')}`,
      smart_code: WHATSAPP_SMART_CODES.TEMPLATE,
      status: 'active'
    })

    // Store template details in dynamic data
    await universalApi.setDynamicField(templateEntity.id, 'language', template.language)
    await universalApi.setDynamicField(templateEntity.id, 'category', template.category)
    await universalApi.setDynamicField(
      templateEntity.id,
      'components',
      JSON.stringify(template.components)
    )

    return templateEntity
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string,
    parameters: Record<string, string>
  ): Promise<any> {
    return this.sendMessage({
      from: this.config.phoneNumberId,
      to,
      type: 'template',
      content: {
        templateName,
        templateLanguage: language,
        templateParams: parameters
      }
    })
  }

  // ==========================================================================
  // AUTOMATION ENGINE
  // ==========================================================================

  async createAutomation(config: {
    name: string
    trigger: 'keyword' | 'schedule' | 'event'
    triggerValue: string
    action: 'send_message' | 'send_template' | 'tag_conversation' | 'assign_agent'
    actionValue: any
  }): Promise<any> {
    const automation = await universalApi.createEntity({
      organization_id: this.config.organizationId,
      entity_type: 'whatsapp_automation',
      entity_name: config.name,
      entity_code: `WA-AUTO-${config.name.toUpperCase().replace(/\s+/g, '_')}`,
      smart_code: WHATSAPP_SMART_CODES.AUTOMATION,
      status: 'active'
    })

    // Store automation config
    await universalApi.setDynamicField(automation.id, 'trigger_type', config.trigger)
    await universalApi.setDynamicField(automation.id, 'trigger_value', config.triggerValue)
    await universalApi.setDynamicField(automation.id, 'action_type', config.action)
    await universalApi.setDynamicField(
      automation.id,
      'action_value',
      JSON.stringify(config.actionValue)
    )

    return automation
  }

  private async processAutomations(conversationId: string, messageText: string): Promise<void> {
    // Fetch all active automations
    const automations = await universalApi.query('core_entities', {
      entity_type: 'whatsapp_automation',
      organization_id: this.config.organizationId,
      status: 'active'
    })

    for (const automation of automations) {
      const triggerType = await universalApi.getDynamicField(automation.id, 'trigger_type')
      const triggerValue = await universalApi.getDynamicField(automation.id, 'trigger_value')

      // Check keyword triggers
      if (
        triggerType === 'keyword' &&
        messageText.toLowerCase().includes(triggerValue.toLowerCase())
      ) {
        const actionType = await universalApi.getDynamicField(automation.id, 'action_type')
        const actionValue = JSON.parse(
          await universalApi.getDynamicField(automation.id, 'action_value')
        )

        if (actionType === 'send_message') {
          await this.sendMessage({
            from: this.config.phoneNumberId,
            to: await this.getPhoneFromConversation(conversationId),
            type: 'text',
            content: { text: actionValue.message }
          })
        }
      }
    }
  }

  // ==========================================================================
  // SALON-SPECIFIC FEATURES
  // ==========================================================================

  async setupSalonTemplates(): Promise<void> {
    // Appointment Reminder Template
    await this.createTemplate({
      name: 'appointment_reminder',
      language: 'en',
      category: 'UTILITY',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Appointment Reminder'
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, this is a reminder about your {{2}} appointment tomorrow at {{3}} with {{4}}. Reply CONFIRM to confirm or RESCHEDULE to change.',
          example: {
            body_text: [['Sarah', 'Brazilian Blowout', '2:00 PM', 'Rocky']]
          }
        },
        {
          type: 'FOOTER',
          text: 'Luxury Salon Dubai'
        }
      ]
    })

    // Booking Confirmation Template
    await this.createTemplate({
      name: 'booking_confirmation',
      language: 'en',
      category: 'UTILITY',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Booking Confirmed ✅'
        },
        {
          type: 'BODY',
          text: 'Your appointment for {{1}} on {{2}} at {{3}} with {{4}} has been confirmed. Total: {{5}}. We look forward to seeing you!',
          example: {
            body_text: [['Hair Color & Highlights', 'Dec 25, 2024', '3:00 PM', 'Maya', 'AED 280']]
          }
        }
      ]
    })

    // Service Follow-up Template
    await this.createTemplate({
      name: 'service_followup',
      language: 'en',
      category: 'MARKETING',
      components: [
        {
          type: 'BODY',
          text: "Hi {{1}}, how was your {{2}} experience yesterday? We'd love to hear your feedback! Rate us 1-5 ⭐",
          example: {
            body_text: [['Emma', 'Premium Cut & Style']]
          }
        }
      ]
    })
  }

  async sendSalonBookingReminder(appointmentId: string): Promise<any> {
    // Fetch appointment details
    const appointment = await universalApi.getTransaction(appointmentId)
    const customerPhone = (appointment.metadata as any)?.customer_phone
    const services = (appointment.metadata as any)?.services || []
    const stylist = (appointment.metadata as any)?.stylist_name
    const appointmentTime = new Date(appointment.transaction_date)

    return this.sendTemplateMessage(customerPhone, 'appointment_reminder', 'en', {
      '1': (appointment.metadata as any)?.customer_name,
      '2': services.map((s: any) => s.name).join(', '),
      '3': appointmentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      '4': stylist
    })
  }

  // ==========================================================================
  // ANALYTICS & REPORTING
  // ==========================================================================

  async getConversationStats(dateRange: { start: Date; end: Date }): Promise<any> {
    const conversations = await universalApi.query('core_entities', {
      entity_type: 'whatsapp_conversation',
      organization_id: this.config.organizationId
    })

    const messages = await universalApi.query('universal_transactions', {
      transaction_type: ['whatsapp_send', 'whatsapp_receive'],
      organization_id: this.config.organizationId,
      transaction_date: {
        gte: dateRange.start.toISOString(),
        lte: dateRange.end.toISOString()
      }
    })

    const stats = {
      totalConversations: conversations.length,
      activeConversations: conversations.filter(c => c.status === 'active').length,
      totalMessagesSent: messages.filter(m => m.transaction_type === 'whatsapp_send').length,
      totalMessagesReceived: messages.filter(m => m.transaction_type === 'whatsapp_receive').length,
      avgResponseTime: 0, // Calculate from timestamps
      templateUsage: {} as Record<string, number>
    }

    return stats
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private getMessageSmartCode(type: string): string {
    const codeMap: Record<string, string> = {
      text: WHATSAPP_SMART_CODES.MESSAGE_TEXT,
      image: WHATSAPP_SMART_CODES.MESSAGE_IMAGE,
      document: WHATSAPP_SMART_CODES.MESSAGE_DOCUMENT,
      audio: WHATSAPP_SMART_CODES.MESSAGE_AUDIO,
      video: WHATSAPP_SMART_CODES.MESSAGE_VIDEO,
      location: WHATSAPP_SMART_CODES.MESSAGE_LOCATION,
      template: WHATSAPP_SMART_CODES.MESSAGE_TEMPLATE
    }
    return codeMap[type] || WHATSAPP_SMART_CODES.MESSAGE_TEXT
  }

  private formatMessagePayload(message: WhatsAppMessage): any {
    switch (message.type) {
      case 'text':
        return { text: { body: message.content.text } }
      case 'image':
        return {
          image: {
            link: message.content.mediaUrl,
            caption: message.content.caption
          }
        }
      case 'template':
        return {
          template: {
            name: message.content.templateName,
            language: { code: message.content.templateLanguage },
            components: this.formatTemplateComponents(message.content.templateParams || {})
          }
        }
      default:
        return {}
    }
  }

  private formatTemplateComponents(params: Record<string, string>): any[] {
    return [
      {
        type: 'body',
        parameters: Object.entries(params).map(([_, value]) => ({
          type: 'text',
          text: value
        }))
      }
    ]
  }

  private async getPhoneFromConversation(conversationId: string): Promise<string> {
    return await universalApi.getDynamicField(conversationId, 'customer_phone')
  }

  private async callWhatsAppAPI(endpoint: string, data: any): Promise<any> {
    // Mock API call - in production, use actual Meta Graph API
    console.log(`WhatsApp API Call: ${endpoint}`, data)
    return {
      messages: [
        {
          id: `wamid.${Date.now()}`
        }
      ]
    }
  }

  private async setupDefaultTemplates(): Promise<void> {
    // Create universal templates that work across industries
    await this.createTemplate({
      name: 'welcome_message',
      language: 'en',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'Welcome to {{1}}! How can we help you today?',
          example: { body_text: [['Luxury Salon']] }
        }
      ]
    })
  }

  private async setupDefaultAutomations(): Promise<void> {
    // Welcome message automation
    await this.createAutomation({
      name: 'Welcome Message',
      trigger: 'keyword',
      triggerValue: 'hi',
      action: 'send_message',
      actionValue: {
        message:
          'Welcome! How can we assist you today? You can:\n• Book an appointment\n• Check our services\n• View our location\n• Speak to a team member'
      }
    })

    // Business hours automation
    await this.createAutomation({
      name: 'Business Hours',
      trigger: 'keyword',
      triggerValue: 'hours',
      action: 'send_message',
      actionValue: {
        message:
          'Our business hours are:\nMon-Thu: 9:00 AM - 9:00 PM\nFri: 9:00 AM - 1:00 PM\nSat-Sun: 10:00 AM - 9:00 PM'
      }
    })
  }
}

// =============================================================================
// WHATSAPP API ROUTE HANDLERS
// =============================================================================

export async function handleWhatsAppWebhook(req: Request): Promise<Response> {
  const { method } = req

  if (method === 'GET') {
    // Webhook verification
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  if (method === 'POST') {
    // Process incoming webhook
    const body = await req.json()

    // Extract message data from webhook payload
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (messages && messages.length > 0) {
      const message = messages[0]

      // Initialize WhatsApp DNA with config from environment
      const whatsappDNA = new WhatsAppDNA({
        organizationId: process.env.DEFAULT_ORGANIZATION_ID!,
        businessId: process.env.WHATSAPP_BUSINESS_ID!,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!
      })

      // Process the message
      await whatsappDNA.receiveMessage(message)
    }

    return new Response('OK', { status: 200 })
  }

  return new Response('Method not allowed', { status: 405 })
}
