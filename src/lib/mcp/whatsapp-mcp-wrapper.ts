/**
 * HERA WhatsApp MCP Wrapper
 * All WhatsApp operations go through MCP to enforce guardrails
 * No direct Supabase writes allowed
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

// MCP Server configuration
const MCP_SERVER_PATH = path.join(process.cwd(), 'mcp-server')
const MCP_TIMEOUT = 30000 // 30 seconds

/**
 * Execute MCP CLI command with proper error handling
 */
async function executeMCP(command: string, args: any = {}): Promise<any> {
  try {
    // Escape single quotes in JSON args
    const argsJson = JSON.stringify(args).replace(/'/g, "'\"'\"'")

    // Use the WhatsApp MCP CLI for WhatsApp operations
    const isWhatsAppCommand =
      command.startsWith('thread.') ||
      command.startsWith('message.') ||
      command.includes('whatsapp')
    const cliScript = isWhatsAppCommand ? 'whatsapp-mcp-cli.js' : 'hera-cli.js'

    const fullCommand = `node ${cliScript} ${command} '${argsJson}'`

    const { stdout, stderr } = await execAsync(fullCommand, {
      cwd: MCP_SERVER_PATH,
      timeout: MCP_TIMEOUT,
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      env: {
        ...process.env,
        DEFAULT_ORGANIZATION_ID:
          args.organization_id || args.organizationId || process.env.DEFAULT_ORGANIZATION_ID
      }
    })

    if (stderr && !stderr.includes('Warning')) {
      console.error('MCP stderr:', stderr)
    }

    // Parse the response
    try {
      return JSON.parse(stdout)
    } catch (parseError) {
      // If not JSON, return raw output
      return { success: true, output: stdout }
    }
  } catch (error) {
    console.error('MCP execution error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown MCP error'
    }
  }
}

/**
 * WhatsApp Thread Operations
 */
export const whatsappThread = {
  /**
   * Create a new WhatsApp conversation thread
   * MCP enforces: organization_id, smart_code validation, six-table discipline
   */
  async create(params: {
    organizationId: string
    customerEntityId: string
    phoneNumber: string
    agentQueueEntityId?: string
    metadata?: Record<string, any>
  }) {
    return executeMCP('thread.create', {
      organizationId: params.organizationId,
      customerEntityId: params.customerEntityId,
      phoneNumber: params.phoneNumber,
      agentQueueEntityId: params.agentQueueEntityId,
      metadata: params.metadata
    })
  },

  /**
   * Update thread metadata (pin/archive/status)
   */
  async update(params: {
    organizationId: string
    threadId: string
    metadata: Record<string, any>
  }) {
    return executeMCP('thread.update', {
      organizationId: params.organizationId,
      threadId: params.threadId,
      metadata: params.metadata
    })
  }
}

/**
 * WhatsApp Message Operations
 */
export const whatsappMessage = {
  /**
   * Send a WhatsApp message (text/media/interactive)
   * MCP enforces: smart_code validation, line number sequencing
   */
  async send(params: {
    organizationId: string
    threadId: string
    direction: 'inbound' | 'outbound'
    text?: string
    media?: Array<{ url: string; mime: string }>
    interactive?: any
    channelMsgId?: string
    cost?: number
  }) {
    // Determine smart code based on message type
    let smartCode = 'HERA.WHATSAPP.MESSAGE.TEXT.v1'
    if (params.media) smartCode = 'HERA.WHATSAPP.MESSAGE.MEDIA.v1'
    if (params.interactive) smartCode = 'HERA.WHATSAPP.MESSAGE.INTERACTIVE.v1'

    return executeMCP('message.send', {
      organizationId: params.organizationId,
      threadId: params.threadId,
      direction: params.direction,
      text: params.text,
      media: params.media,
      interactive: params.interactive,
      channelMsgId: params.channelMsgId,
      cost: params.cost
    })
  },

  /**
   * Add internal note to thread
   */
  async addNote(params: {
    organizationId: string
    threadId: string
    noteText: string
    authorEntityId?: string
  }) {
    return executeMCP('message.addNote', {
      organizationId: params.organizationId,
      threadId: params.threadId,
      noteText: params.noteText,
      authorEntityId: params.authorEntityId
    })
  }
}

/**
 * WhatsApp Template Operations
 */
export const whatsappTemplate = {
  /**
   * Register a WhatsApp message template
   * MCP enforces: entity creation with proper smart_code
   */
  async register(params: {
    organizationId: string
    name: string
    language: string
    body: string
    variables?: string[]
    category?: string
  }) {
    // Create template entity
    const entityResult = await executeMCP('create-entity', {
      organization_id: params.organizationId,
      entity_type: 'msg_template',
      entity_name: params.name,
      entity_code: params.name,
      smart_code: 'HERA.WHATSAPP.TEMPLATE.REGISTER.v1',
      business_rules: {
        language: params.language,
        category: params.category || 'marketing'
      }
    })

    if (!entityResult.success || !entityResult.entity_id) {
      return entityResult
    }

    // Store template body in dynamic data
    await executeMCP('set-field', {
      organization_id: params.organizationId,
      entity_id: entityResult.entity_id,
      field_name: 'body',
      field_value: params.body,
      smart_code: 'HERA.WHATSAPP.TEMPLATE.BODY.v1'
    })

    // Store variables if present
    if (params.variables && params.variables.length > 0) {
      await executeMCP('set-field', {
        organization_id: params.organizationId,
        entity_id: entityResult.entity_id,
        field_name: 'variables',
        field_value: JSON.stringify(params.variables),
        smart_code: 'HERA.WHATSAPP.TEMPLATE.VARS.v1'
      })
    }

    return {
      success: true,
      template_id: entityResult.entity_id,
      data: entityResult
    }
  }
}

/**
 * WhatsApp Campaign Operations
 */
export const whatsappCampaign = {
  /**
   * Create a WhatsApp campaign
   * MCP enforces: transaction header creation with proper relationships
   */
  async create(params: {
    organizationId: string
    name: string
    templateEntityId: string
    audienceQuery: string
    scheduleAt?: string
  }) {
    // Create campaign transaction
    const campaignResult = await executeMCP('create-transaction', {
      organization_id: params.organizationId,
      transaction_type: 'CAMPAIGN',
      smart_code: 'HERA.WHATSAPP.CAMPAIGN.OUTBOUND.v1',
      source_entity_id: params.templateEntityId,
      metadata: {
        name: params.name,
        schedule_at: params.scheduleAt || new Date().toISOString(),
        status: 'scheduled'
      }
    })

    if (!campaignResult.success || !campaignResult.transaction_id) {
      return campaignResult
    }

    // Store audience query as dynamic data
    await executeMCP('set-transaction-field', {
      organization_id: params.organizationId,
      transaction_id: campaignResult.transaction_id,
      field_name: 'audience_query',
      field_value: params.audienceQuery,
      smart_code: 'HERA.WHATSAPP.CAMPAIGN.AUDIENCE.v1'
    })

    return {
      success: true,
      campaign_id: campaignResult.transaction_id,
      data: campaignResult
    }
  },

  /**
   * Send campaign message to recipient
   */
  async sendMessage(params: {
    organizationId: string
    campaignId: string
    recipientEntityId: string
    templateEntityId: string
  }) {
    return executeMCP('add-transaction-line', {
      organization_id: params.organizationId,
      transaction_id: params.campaignId,
      line_type: 'CAMPAIGN_DELIVERY',
      description: 'Outbound campaign message',
      smart_code: 'HERA.WHATSAPP.CAMPAIGN.DELIVERY.v1',
      entity_id: params.recipientEntityId,
      line_data: {
        recipient_entity_id: params.recipientEntityId,
        template_entity_id: params.templateEntityId,
        status: 'queued',
        queued_at: new Date().toISOString()
      }
    })
  }
}

/**
 * WhatsApp Payment Operations
 */
export const whatsappPayment = {
  /**
   * Share payment link via WhatsApp
   */
  async shareLink(params: {
    organizationId: string
    threadId: string
    invoiceEntityId: string
    paymentUrl: string
    amount: number
    currency: string
  }) {
    return executeMCP('add-transaction-line', {
      organization_id: params.organizationId,
      transaction_id: params.threadId,
      line_type: 'PAYMENT_LINK',
      description: 'Share payment link',
      smart_code: 'HERA.AR.PAYMENT.LINK.SHARE.v1',
      line_amount: params.amount,
      line_data: {
        ar_invoice_entity_id: params.invoiceEntityId,
        paylink_url: params.paymentUrl,
        currency: params.currency,
        shared_at: new Date().toISOString()
      }
    })
  },

  /**
   * Confirm payment received
   */
  async confirm(params: {
    organizationId: string
    payerEntityId: string
    payeeEntityId: string
    amount: number
    currency: string
    providerRef: string
    invoiceEntityId?: string
  }) {
    // Create payment transaction with proper GL posting
    return executeMCP('create-payment', {
      organization_id: params.organizationId,
      payer_entity_id: params.payerEntityId,
      payee_entity_id: params.payeeEntityId,
      amount: params.amount,
      currency: params.currency,
      provider_ref: params.providerRef,
      invoice_entity_id: params.invoiceEntityId,
      smart_code: 'HERA.AR.PAYMENT.COLLECTION.WHATSAPP.v1',
      metadata: {
        channel: 'whatsapp',
        collected_at: new Date().toISOString()
      }
    })
  }
}

/**
 * WhatsApp Customer Operations
 */
export const whatsappCustomer = {
  /**
   * Upsert customer by phone number
   * MCP enforces: entity uniqueness by org+code+type
   */
  async upsertByPhone(params: {
    organizationId: string
    phoneNumber: string
    displayName: string
  }) {
    return executeMCP('upsert-entity', {
      organization_id: params.organizationId,
      entity_type: 'customer',
      entity_name: params.displayName,
      entity_code: params.phoneNumber,
      smart_code: 'HERA.CRM.CUSTOMER.WHATSAPP.v1',
      business_rules: {
        msisdn: params.phoneNumber,
        channel: 'whatsapp'
      }
    })
  }
}

/**
 * WhatsApp Query Operations (Read-only, can use Supabase)
 */
export const whatsappQuery = {
  /**
   * Get conversations with enhanced metadata
   * Read operations can use Supabase but should still respect org isolation
   */
  async getConversations(params: {
    organizationId: string
    status?: 'open' | 'pending' | 'resolved'
    search?: string
    assigneeEntityId?: string
  }) {
    return executeMCP('query', {
      table: 'universal_transactions',
      filters: {
        organization_id: params.organizationId,
        transaction_type: 'MESSAGE_THREAD',
        ...(params.status && { 'metadata->status': params.status })
      },
      include_lines: true,
      order_by: 'created_at',
      order_direction: 'desc'
    })
  },

  /**
   * Get analytics data
   */
  async getAnalytics(params: { organizationId: string; startDate?: Date; endDate?: Date }) {
    return executeMCP('analytics.whatsapp', {
      organization_id: params.organizationId,
      start_date: params.startDate?.toISOString(),
      end_date: params.endDate?.toISOString()
    })
  }
}

/**
 * Idempotency helper for WhatsApp operations
 */
export function generateIdempotencyKey(channelMsgId: string): string {
  return `whatsapp_${channelMsgId}`
}

/**
 * Export all MCP operations
 */
export const whatsappMCP = {
  thread: whatsappThread,
  message: whatsappMessage,
  template: whatsappTemplate,
  campaign: whatsappCampaign,
  payment: whatsappPayment,
  customer: whatsappCustomer,
  query: whatsappQuery,
  generateIdempotencyKey
}
