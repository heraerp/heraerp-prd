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
  media?: {
    id: string
    mime_type: string
    sha256?: string
    caption?: string
  }
}

interface ProcessingResult {
  success: boolean
  transactionId?: string
  error?: string
}

export class WhatsAppProcessorV2 {
  private supabase: SupabaseClient
  private organizationId: string
  private channelId?: string // WABA Channel entity ID
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

  async initialize() {
    // Ensure Channel entity exists for WABA number
    this.channelId = await this.ensureChannelEntity()
  }

  async processMessage(message: WhatsAppMessage): Promise<ProcessingResult> {
    try {
      console.log(`Processing WhatsApp message from ${message.from}: ${message.text}`)

      // 1. Ensure Customer entity exists
      const customerId = await this.ensureCustomerEntity(message.from)

      // 2. Get or create Conversation entity
      const conversationId = await this.ensureConversationEntity(message.from, customerId)

      // 3. Create message transaction with proper smart codes
      const transactionId = await this.createMessageTransaction(
        message,
        customerId,
        conversationId,
        'inbound'
      )

      // 4. Create transaction lines for content parts
      await this.createTransactionLines(transactionId, message)

      // 5. Store additional metadata in core_dynamic_data
      await this.storeMessageMetadata(transactionId, message)

      // 6. Create relationships
      await this.createMessageRelationships(transactionId, customerId, conversationId)

      // 7. Process intent and generate response
      const responseText = await this.generateResponse(message, customerId, conversationId)

      // 8. Send and store response
      if (responseText) {
        await this.sendAndStoreResponse(message.from, responseText, conversationId, customerId)
      }

      return { success: true, transactionId }
    } catch (error) {
      console.error('WhatsApp processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async ensureChannelEntity(): Promise<string> {
    const channelCode = `WABA-${this.whatsapp.phoneNumberId}`

    // Check if channel already exists
    const { data: existing } = await this.supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'channel')
      .eq('entity_code', channelCode)
      .single()

    if (existing) {
      return existing.id
    }

    // Create new channel entity
    const { data: channel, error } = await this.supabase
      .from('core_entities')
      .insert({
        organization_id: this.organizationId,
        entity_type: 'channel',
        entity_name: `WhatsApp Business ${this.whatsapp.phoneNumberId}`,
        entity_code: channelCode,
        smart_code: 'HERA.BEAUTY.COMMS.CHANNEL.WHATSAPP.V1',
        metadata: {
          phone_number_id: this.whatsapp.phoneNumberId,
          channel_type: 'whatsapp_business'
        }
      })
      .select()
      .single()

    if (error) throw error
    return channel!.id
  }

  private async ensureCustomerEntity(waId: string): Promise<string> {
    // Check if customer entity exists for this WhatsApp ID
    const { data: existing } = await this.supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'customer')
      .eq('entity_code', `WA-${waId}`)
      .single()

    if (existing) {
      return existing.id
    }

    // Create new customer entity
    const { data: customer, error } = await this.supabase
      .from('core_entities')
      .insert({
        organization_id: this.organizationId,
        entity_type: 'customer',
        entity_name: `WhatsApp User ${waId}`,
        entity_code: `WA-${waId}`,
        smart_code: 'HERA.BEAUTY.CRM.CUSTOMER.PERSON.V1',
        metadata: {
          wa_id: waId,
          phone: waId,
          source: 'whatsapp'
        }
      })
      .select()
      .single()

    if (error) throw error

    // Store phone number in dynamic data for searchability
    await this.supabase.from('core_dynamic_data').insert({
      organization_id: this.organizationId,
      entity_id: customer!.id,
      field_name: 'phone',
      field_value_text: waId,
      smart_code: 'HERA.BEAUTY.CRM.CUSTOMER.DYN.PHONE.V1'
    })

    return customer!.id
  }

  private async ensureConversationEntity(waId: string, customerId: string): Promise<string> {
    const conversationCode = `CONV-${waId}-${new Date().toISOString().split('T')[0]}`

    // Look for active conversation (within 24 hours)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data: existing } = await this.supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'conversation')
      .eq('metadata->wa_id', waId)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .single()

    if (existing) {
      return existing.id
    }

    // Create new conversation entity
    const { data: conversation, error } = await this.supabase
      .from('core_entities')
      .insert({
        organization_id: this.organizationId,
        entity_type: 'conversation',
        entity_name: `WhatsApp Chat with ${waId}`,
        entity_code: conversationCode,
        smart_code: 'HERA.BEAUTY.COMMS.CONVERSATION.WHATSAPP.V1',
        metadata: {
          wa_id: waId,
          customer_id: customerId,
          channel_id: this.channelId,
          status: 'active',
          started_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) throw error
    return conversation!.id
  }

  private async createMessageTransaction(
    message: WhatsAppMessage,
    customerId: string,
    conversationId: string,
    direction: 'inbound' | 'outbound'
  ): Promise<string> {
    const smartCode =
      direction === 'inbound'
        ? 'HERA.BEAUTY.COMMS.MESSAGE.RECEIVED.V1'
        : 'HERA.BEAUTY.COMMS.MESSAGE.SENT.V1'

    const { data: transaction, error } = await this.supabase
      .from('universal_transactions')
      .insert({
        organization_id: this.organizationId,
        transaction_type: 'whatsapp_message',
        transaction_code: `WA-MSG-${Date.now()}`,
        transaction_date: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        occurred_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        total_amount: 0,
        external_id: message.message_id, // For idempotency
        smart_code: smartCode,
        ai_confidence: null,
        ai_insights: null,
        metadata: {
          direction,
          message_type: message.type,
          wa_id: message.from
        }
      })
      .select()
      .single()

    if (error) throw error
    return transaction!.id
  }

  private async createTransactionLines(transactionId: string, message: WhatsAppMessage) {
    const lines = []

    // Text content line
    if (message.type === 'text' && message.text) {
      lines.push({
        transaction_id: transactionId,
        line_number: 1,
        line_type: 'TEXT',
        quantity: 1,
        unit_price: 0,
        line_amount: 0,
        smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.LINE.TEXT.V1',
        metadata: {
          content_type: 'text'
        }
      })
    }

    // Media content line
    if (['image', 'document'].includes(message.type) && message.media) {
      lines.push({
        transaction_id: transactionId,
        line_number: 2,
        line_type: message.type.toUpperCase(),
        quantity: 1,
        unit_price: 0,
        line_amount: 0,
        smart_code: `HERA.BEAUTY.COMMS.MESSAGE.LINE.${message.type.toUpperCase()}.V1`,
        metadata: {
          content_type: message.type,
          media_id: message.media.id,
          mime_type: message.media.mime_type
        }
      })
    }

    // Interactive content line
    if (message.type === 'interactive' && message.interactive) {
      const interactiveType = message.interactive.type // button_reply or list_reply
      lines.push({
        transaction_id: transactionId,
        line_number: 3,
        line_type: interactiveType.toUpperCase(),
        quantity: 1,
        unit_price: 0,
        line_amount: 0,
        smart_code: `HERA.BEAUTY.COMMS.MESSAGE.LINE.${interactiveType.toUpperCase()}.V1`,
        metadata: {
          content_type: 'interactive',
          interactive_type: interactiveType
        }
      })
    }

    if (lines.length > 0) {
      const { error } = await this.supabase.from('universal_transaction_lines').insert(lines)

      if (error) throw error
    }
  }

  private async storeMessageMetadata(transactionId: string, message: WhatsAppMessage) {
    const dynamicData = []

    // Message text
    if (message.text) {
      dynamicData.push({
        organization_id: this.organizationId,
        entity_id: transactionId,
        entity_type: 'transaction',
        field_name: 'text',
        field_value_text: message.text,
        smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.DYN.TEXT.V1'
      })
    }

    // WhatsApp message ID
    dynamicData.push({
      organization_id: this.organizationId,
      entity_id: transactionId,
      entity_type: 'transaction',
      field_name: 'waba_message_id',
      field_value_text: message.message_id,
      smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.DYN.WABAID.V1'
    })

    // Phone number
    dynamicData.push({
      organization_id: this.organizationId,
      entity_id: transactionId,
      entity_type: 'transaction',
      field_name: 'wa_id',
      field_value_text: message.from,
      smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.DYN.WAID.V1'
    })

    // Media fields
    if (message.media) {
      if (message.media.mime_type) {
        dynamicData.push({
          organization_id: this.organizationId,
          entity_id: transactionId,
          entity_type: 'transaction',
          field_name: 'mime_type',
          field_value_text: message.media.mime_type,
          smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.DYN.MIMETYPE.V1'
        })
      }

      if (message.media.caption) {
        dynamicData.push({
          organization_id: this.organizationId,
          entity_id: transactionId,
          entity_type: 'transaction',
          field_name: 'caption',
          field_value_text: message.media.caption,
          smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.DYN.CAPTION.V1'
        })
      }
    }

    // Interactive payload
    if (message.interactive) {
      dynamicData.push({
        organization_id: this.organizationId,
        entity_id: transactionId,
        entity_type: 'transaction',
        field_name: 'interactive_payload',
        field_value_json: message.interactive,
        smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.DYN.INTERACTIVE.V1'
      })
    }

    if (dynamicData.length > 0) {
      const { error } = await this.supabase.from('core_dynamic_data').insert(dynamicData)

      if (error) throw error
    }
  }

  private async createMessageRelationships(
    transactionId: string,
    customerId: string,
    conversationId: string
  ) {
    const relationships = [
      // Transaction ↔ Customer
      {
        organization_id: this.organizationId,
        from_entity_id: transactionId,
        to_entity_id: customerId,
        relationship_type: 'message_from',
        smart_code: 'HERA.BEAUTY.COMMS.LINK.SENDER.V1',
        metadata: {
          link_type: 'sender'
        }
      },
      // Transaction ↔ Channel
      {
        organization_id: this.organizationId,
        from_entity_id: transactionId,
        to_entity_id: this.channelId!,
        relationship_type: 'message_via',
        smart_code: 'HERA.BEAUTY.COMMS.LINK.CHANNEL.V1',
        metadata: {
          link_type: 'channel'
        }
      },
      // Transaction ↔ Conversation
      {
        organization_id: this.organizationId,
        from_entity_id: transactionId,
        to_entity_id: conversationId,
        relationship_type: 'message_in',
        smart_code: 'HERA.BEAUTY.COMMS.LINK.CONVERSATION.V1',
        metadata: {
          link_type: 'conversation'
        }
      }
    ]

    const { error } = await this.supabase.from('core_relationships').insert(relationships)

    if (error) throw error
  }

  private async generateResponse(
    message: WhatsAppMessage,
    customerId: string,
    conversationId: string
  ): Promise<string | null> {
    const lowerText = message.text.toLowerCase()

    // Simple intent detection for demo
    if (lowerText.includes('book') || lowerText.includes('appointment')) {
      return "I'd be happy to help you book an appointment! What service are you interested in? We offer haircuts, coloring, styling, and more."
    }

    if (lowerText.includes('price') || lowerText.includes('cost')) {
      return 'Our services start at AED 50 for a basic haircut. Would you like to see our full price list?'
    }

    if (lowerText.includes('hours') || lowerText.includes('open')) {
      return "We're open Monday-Saturday from 9 AM to 7 PM, and Sunday from 10 AM to 6 PM."
    }

    // Default response
    return 'Thank you for your message! How can I help you today? You can ask about our services, prices, or book an appointment.'
  }

  private async sendAndStoreResponse(
    toNumber: string,
    text: string,
    conversationId: string,
    customerId: string
  ) {
    try {
      // Send via WhatsApp API
      const response = await axios.post(
        `${this.whatsapp.apiUrl}/${this.whatsapp.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: toNumber,
          type: 'text',
          text: { body: text }
        },
        {
          headers: {
            Authorization: `Bearer ${this.whatsapp.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // Store outbound message
      const outboundMessage: WhatsAppMessage = {
        from: this.whatsapp.phoneNumberId,
        text: text,
        message_id: response.data.messages[0].id,
        type: 'text',
        timestamp: Math.floor(Date.now() / 1000).toString()
      }

      // Create outbound transaction
      const transactionId = await this.createMessageTransaction(
        outboundMessage,
        customerId,
        conversationId,
        'outbound'
      )

      // Create transaction lines
      await this.createTransactionLines(transactionId, outboundMessage)

      // Store metadata
      await this.storeMessageMetadata(transactionId, outboundMessage)

      // Create relationships (swap sender/recipient for outbound)
      await this.createMessageRelationships(transactionId, customerId, conversationId)
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error)
    }
  }
}
