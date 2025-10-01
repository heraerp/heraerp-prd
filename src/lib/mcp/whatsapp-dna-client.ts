/**
 * WhatsApp DNA Client
 * WhatsApp implementation using the HERA DNA SDK
 * All operations are type-safe and enforce HERA principles
 */

import {
  HeraDNAClient,
  createOrganizationId,
  createSmartCode,
  createEntityId,
  DNA,
  type SmartCode,
  type OrganizationId,
  type EntityId,
  type TransactionId
} from '@/lib/dna-sdk-stub'

// WhatsApp-specific smart codes as constants
export const WHATSAPP_SMART_CODES = {
  THREAD_CREATE: createSmartCode('HERA.WHATSAPP.INBOX.THREAD.V1'),
  MESSAGE_TEXT: createSmartCode('HERA.WHATSAPP.MESSAGE.TEXT.V1'),
  MESSAGE_MEDIA: createSmartCode('HERA.WHATSAPP.MESSAGE.MEDIA.V1'),
  MESSAGE_INTERACTIVE: createSmartCode('HERA.WHATSAPP.MESSAGE.INTERACTIVE.V1'),
  NOTE_INTERNAL: createSmartCode('HERA.WHATSAPP.NOTE.INTERNAL.V1'),
  TEMPLATE_REGISTER: createSmartCode('HERA.WHATSAPP.TEMPLATE.REGISTER.V1'),
  CAMPAIGN_CREATE: createSmartCode('HERA.WHATSAPP.CAMPAIGN.OUTBOUND.V1'),
  PAYMENT_LINK: createSmartCode('HERA.AR.PAYMENT.LINK.SHARE.V1'),
  CUSTOMER_WHATSAPP: createSmartCode('HERA.CRM.CUSTOMER.WHATSAPP.V1')
} as const

export class WhatsAppDNAClient {
  private client: HeraDNAClient
  private orgId: OrganizationId

  constructor(organizationId: OrganizationId) {
    this.orgId = organizationId
    this.client = new HeraDNAClient({
      organizationId,
      enableRuntimeGates: true,
      enableAudit: true
    })
  }

  /**
   * Create or update customer by phone number
   */
  async upsertCustomer(phoneNumber: string, displayName: string): Promise<EntityId> {
    // First try to find existing customer
    const existing = await this.client.queryEntities({
      entityType: 'customer',
      filters: {
        entity_code: phoneNumber
      }
    })

    if (existing.length > 0) {
      return existing[0].id
    }

    // Create new customer
    const customer = await this.client.createEntity({
      entityType: 'customer',
      entityName: displayName,
      entityCode: phoneNumber,
      smartCode: WHATSAPP_SMART_CODES.CUSTOMER_WHATSAPP,
      metadata: {
        msisdn: phoneNumber,
        channel: 'whatsapp'
      }
    })

    return customer.id
  }

  /**
   * Create WhatsApp conversation thread
   */
  async createThread(
    customerId: EntityId,
    phoneNumber: string,
    agentQueueId?: EntityId
  ): Promise<TransactionId> {
    const thread = await DNA.transaction(this.orgId)
      .type('MESSAGE_THREAD')
      .smartCode(WHATSAPP_SMART_CODES.THREAD_CREATE)
      .fromEntity(customerId)
      .toEntity(agentQueueId)
      .withMetadata({
        channel: 'whatsapp',
        phone_number: phoneNumber,
        status: 'open',
        created_at: new Date().toISOString()
      })
      .build()

    return thread.id
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(params: {
    threadId: TransactionId
    direction: 'inbound' | 'outbound'
    text?: string
    media?: Array<{ url: string; mime: string }>
    interactive?: any
    channelMsgId?: string
    cost?: number
  }): Promise<EntityId> {
    // Determine smart code based on message type
    let smartCode = WHATSAPP_SMART_CODES.MESSAGE_TEXT
    if (params.media) smartCode = WHATSAPP_SMART_CODES.MESSAGE_MEDIA
    if (params.interactive) smartCode = WHATSAPP_SMART_CODES.MESSAGE_INTERACTIVE

    const message = await DNA.transactionLine(this.orgId)
      .forTransaction(params.threadId)
      .type('MESSAGE')
      .smartCode(smartCode)
      .description(params.text?.substring(0, 255) || 'WhatsApp Message')
      .amount(params.cost || 0)
      .withLineData({
        direction: params.direction,
        channel_msg_id: params.channelMsgId || `wamid_${Date.now()}`,
        text: params.text,
        media: params.media,
        interactive: params.interactive,
        status: params.direction === 'outbound' ? 'sent' : 'received',
        timestamp: new Date().toISOString()
      })
      .build()

    // Update thread metadata
    await this.updateThreadLastMessage(params.threadId, params)

    return message.id
  }

  /**
   * Add internal note to thread
   */
  async addNote(threadId: TransactionId, noteText: string, authorId?: EntityId): Promise<EntityId> {
    const note = await DNA.transactionLine(this.orgId)
      .forTransaction(threadId)
      .type('INTERNAL_NOTE')
      .smartCode(WHATSAPP_SMART_CODES.NOTE_INTERNAL)
      .description(noteText.substring(0, 255))
      .withLineData({
        text: noteText,
        author_entity_id: authorId,
        created_at: new Date().toISOString()
      })
      .build()

    return note.id
  }

  /**
   * Register WhatsApp template
   */
  async registerTemplate(params: {
    name: string
    language: string
    body: string
    variables?: string[]
    category?: string
  }): Promise<EntityId> {
    const template = await this.client.createEntity({
      entityType: 'msg_template',
      entityName: params.name,
      entityCode: params.name,
      smartCode: WHATSAPP_SMART_CODES.TEMPLATE_REGISTER,
      businessRules: {
        language: params.language,
        category: params.category || 'marketing'
      }
    })

    // Store template body
    await this.client.setDynamicField(
      template.id,
      'body',
      params.body,
      createSmartCode('HERA.WHATSAPP.TEMPLATE.BODY.V1')
    )

    // Store variables if present
    if (params.variables && params.variables.length > 0) {
      await this.client.setDynamicField(
        template.id,
        'variables',
        params.variables,
        createSmartCode('HERA.WHATSAPP.TEMPLATE.VARS.V1')
      )
    }

    return template.id
  }

  /**
   * Create campaign
   */
  async createCampaign(params: {
    name: string
    templateId: EntityId
    audienceQuery: string
    scheduleAt?: Date
  }): Promise<TransactionId> {
    const campaign = await DNA.transaction(this.orgId)
      .type('CAMPAIGN')
      .smartCode(WHATSAPP_SMART_CODES.CAMPAIGN_CREATE)
      .fromEntity(params.templateId)
      .withMetadata({
        name: params.name,
        schedule_at: (params.scheduleAt || new Date()).toISOString(),
        status: 'scheduled'
      })
      .build()

    // Store audience query
    await this.client.setTransactionField(
      campaign.id,
      'audience_query',
      params.audienceQuery,
      createSmartCode('HERA.WHATSAPP.CAMPAIGN.AUDIENCE.V1')
    )

    return campaign.id
  }

  /**
   * Toggle thread pin status
   */
  async togglePin(threadId: TransactionId, shouldPin: boolean): Promise<void> {
    await this.client.updateTransactionMetadata(threadId, {
      is_pinned: shouldPin,
      pinned_at: shouldPin ? new Date().toISOString() : null
    })
  }

  /**
   * Toggle thread archive status
   */
  async toggleArchive(threadId: TransactionId, shouldArchive: boolean): Promise<void> {
    await this.client.updateTransactionMetadata(threadId, {
      is_archived: shouldArchive,
      archived_at: shouldArchive ? new Date().toISOString() : null
    })
  }

  /**
   * Get conversations with messages
   */
  async getConversations(filters?: { status?: 'open' | 'pending' | 'resolved'; search?: string }) {
    const threads = await this.client.queryTransactions({
      transactionType: 'MESSAGE_THREAD',
      filters: filters?.status
        ? {
            'metadata.status': filters.status
          }
        : undefined,
      includeLines: true
    })

    // Format for UI
    return threads.map(thread => {
      const messages = thread.lines?.filter(line => line.lineType === 'MESSAGE') || []
      const lastMessage = messages[messages.length - 1]

      return {
        id: thread.id,
        entity_name:
          (thread.metadata as any)?.display_name ||
          (thread.metadata as any)?.phone_number ||
          'Unknown',
        entity_code: (thread.metadata as any)?.phone_number || '',
        metadata: thread.metadata,
        lastMessage: lastMessage || null,
        messages,
        unreadCount: messages.filter(
          m => m.lineData?.direction === 'inbound' && m.lineData?.status !== 'read'
        ).length,
        isPinned: (thread.metadata as any)?.is_pinned || false,
        isArchived: (thread.metadata as any)?.is_archived || false,
        updated_at: (thread.metadata as any)?.last_message_at || thread.createdAt
      }
    })
  }

  /**
   * Private helper to update thread last message metadata
   */
  private async updateThreadLastMessage(
    threadId: TransactionId,
    message: { direction: string; text?: string }
  ): Promise<void> {
    await this.client.updateTransactionMetadata(threadId, {
      last_message_at: new Date().toISOString(),
      last_message_direction: message.direction,
      last_message_preview: message.text?.substring(0, 100)
    })
  }
}

// Export convenience function
export function createWhatsAppClient(organizationId: string): WhatsAppDNAClient {
  return new WhatsAppDNAClient(createOrganizationId(organizationId))
}
