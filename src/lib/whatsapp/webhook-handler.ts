import { createClient } from '@supabase/supabase-js'

// Create Supabase client inside the class to avoid initialization issues
const getSupabaseClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export interface WhatsAppWebhookMessage {
  from: string
  id: string
  timestamp: string
  text?: {
    body: string
  }
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'button' | 'interactive'
  image?: {
    id: string
    mime_type: string
    sha256: string
  }
  document?: {
    id: string
    mime_type: string
    sha256: string
    filename: string
  }
}

export interface WhatsAppWebhookContact {
  profile: {
    name: string
  }
  wa_id: string
}

export class WhatsAppWebhookHandler {
  constructor(private organizationId: string) {}

  async handleIncomingMessage(
    message: WhatsAppWebhookMessage,
    contact: WhatsAppWebhookContact | undefined,
    phoneNumberId: string
  ) {
    console.log('📥 Processing incoming WhatsApp message...')

    try {
      // Find or create customer entity
      const customerEntity = await this.findOrCreateCustomer(
        message.from,
        contact?.profile?.name || 'WhatsApp User'
      )

      if (!customerEntity) {
        console.error('Failed to find/create customer entity')
        return { success: false, error: 'Failed to create customer' }
      }

      // Create conversation if needed
      const conversation = await this.findOrCreateConversation(customerEntity.id, message.from)

      if (!conversation) {
        console.error('Failed to find/create conversation')
        return { success: false, error: 'Failed to create conversation' }
      }

      // Store the message
      const storedMessage = await this.storeMessage({
        conversationId: conversation.id,
        customerId: customerEntity.id,
        message,
        direction: 'inbound'
      })

      if (!storedMessage) {
        console.error('Failed to store message')
        return { success: false, error: 'Failed to store message' }
      }

      console.log('✅ Message successfully stored:', {
        messageId: storedMessage.id,
        conversationId: conversation.id,
        customerId: customerEntity.id
      })

      return {
        success: true,
        messageId: storedMessage.id,
        conversationId: conversation.id,
        customerId: customerEntity.id
      }
    } catch (error) {
      console.error('❌ Error handling WhatsApp message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async findOrCreateCustomer(waId: string, name: string) {
    const supabase = getSupabaseClient()
    // Check if customer exists
    const { data: existing, error: searchError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'customer')
      .eq('organization_id', this.organizationId)
      .eq('metadata->>wa_id', waId)
      .single()

    if (existing && !searchError) {
      console.log('Found existing customer:', existing.id)
      return existing
    }

    // Create new customer
    console.log('Creating new customer for WhatsApp ID:', waId)
    const { data: newCustomer, error: createError } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'customer',
        entity_name: name,
        entity_code: `WHATSAPP-${waId}`,
        organization_id: this.organizationId,
        smart_code: 'HERA.CRM.CUST.ENT.WHATSAPP.v1',
        metadata: {
          wa_id: waId,
          phone: waId,
          source: 'whatsapp',
          created_via: 'webhook'
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating customer:', createError)
      return null
    }

    // Store phone number in dynamic data
    await supabase.from('core_dynamic_data').insert({
      entity_id: newCustomer.id,
      field_name: 'phone',
      field_value_text: waId,
      organization_id: this.organizationId,
      smart_code: 'HERA.CRM.CUST.DYN.PHONE.v1'
    })

    return newCustomer
  }

  private async findOrCreateConversation(customerId: string, waId: string) {
    const supabase = getSupabaseClient()
    // Check if active conversation exists
    const { data: existing, error: searchError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'whatsapp_conversation')
      .eq('organization_id', this.organizationId)
      .eq('metadata->>customer_id', customerId)
      .eq('metadata->>status', 'active')
      .single()

    if (existing && !searchError) {
      console.log('Found existing conversation:', existing.id)
      return existing
    }

    // Create new conversation
    console.log('Creating new conversation for customer:', customerId)
    const { data: newConversation, error: createError } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'whatsapp_conversation',
        entity_name: `Conversation with ${waId}`,
        entity_code: `CONV-${Date.now()}`,
        organization_id: this.organizationId,
        smart_code: 'HERA.CRM.CONV.ENT.WHATSAPP.v1',
        metadata: {
          customer_id: customerId,
          wa_id: waId,
          status: 'active',
          channel: 'whatsapp',
          last_message_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating conversation:', createError)
      return null
    }

    // Create relationship between customer and conversation
    await supabase.from('core_relationships').insert({
      from_entity_id: customerId,
      to_entity_id: newConversation.id,
      relationship_type: 'has_conversation',
      organization_id: this.organizationId,
      smart_code: 'HERA.CRM.REL.CUST.CONV.v1'
    })

    return newConversation
  }

  private async storeMessage({
    conversationId,
    customerId,
    message,
    direction
  }: {
    conversationId: string
    customerId: string
    message: WhatsAppWebhookMessage
    direction: 'inbound' | 'outbound'
  }) {
    const messageContent = message.text?.body || '[Non-text message]'
    const messageType = message.type || 'text'

    const supabase = getSupabaseClient()
    // Store as universal transaction
    const { data: storedMessage, error } = await supabase
      .from('universal_transactions')
      .insert({
        transaction_type: 'whatsapp_message',
        transaction_code: `MSG-${message.id}`,
        organization_id: this.organizationId,
        smart_code: `HERA.CRM.MSG.WHATSAPP.${direction.toUpperCase()}.v1`,
        from_entity_id: direction === 'inbound' ? customerId : conversationId,
        to_entity_id: direction === 'inbound' ? conversationId : customerId,
        transaction_date: new Date(parseInt(message.timestamp) * 1000),
        total_amount: 0,
        metadata: {
          wa_id: message.from,
          wa_message_id: message.id,
          direction,
          content: messageContent,
          message_type: messageType,
          timestamp: message.timestamp,
          conversation_id: conversationId,
          text: messageContent,
          // Store additional message data
          ...(message.image && { image: message.image }),
          ...(message.document && { document: message.document })
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error storing message:', error)
      return null
    }

    // Update conversation last message time
    await supabase
      .from('core_entities')
      .update({
        metadata: {
          last_message_at: new Date().toISOString(),
          last_message_text: messageContent,
          last_message_direction: direction
        }
      })
      .eq('id', conversationId)

    // Store message content in transaction lines for better querying
    await supabase.from('universal_transaction_lines').insert({
      transaction_id: storedMessage.id,
      line_number: 1,
      line_entity_id: customerId,
      quantity: 1,
      unit_price: 0,
      line_amount: 0,
      organization_id: this.organizationId,
      smart_code: 'HERA.CRM.MSG.LINE.CONTENT.v1',
      metadata: {
        content: messageContent,
        content_type: messageType
      }
    })

    return storedMessage
  }

  async handleStatusUpdate(statusUpdate: any) {
    console.log('📊 Processing WhatsApp status update...')

    const supabase = getSupabaseClient()
    // Find the original message
    const { data: originalMessage, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('metadata->>wa_message_id', statusUpdate.id)
      .eq('organization_id', this.organizationId)
      .single()

    if (error || !originalMessage) {
      console.log('Message not found for status update:', statusUpdate.id)
      return { success: false, error: 'Message not found' }
    }

    // Update message status
    const { error: updateError } = await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          ...originalMessage.metadata,
          delivery_status: statusUpdate.status,
          delivery_timestamp: statusUpdate.timestamp,
          [`status_${statusUpdate.status}_at`]: new Date(
            parseInt(statusUpdate.timestamp) * 1000
          ).toISOString()
        }
      })
      .eq('id', originalMessage.id)

    if (updateError) {
      console.error('Error updating message status:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log('✅ Status update processed:', {
      messageId: originalMessage.id,
      status: statusUpdate.status
    })

    return { success: true, messageId: originalMessage.id }
  }
}
