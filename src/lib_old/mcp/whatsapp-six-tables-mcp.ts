/**
 * HERA WhatsApp Six Tables MCP Implementation
 * All operations go through MCP - no direct Supabase writes
 * Enforces: org isolation, smart codes, six-table discipline
 */

import { whatsappMCP } from './whatsapp-mcp-wrapper'

// Re-export smart codes for consistency
export { WHATSAPP_SMART_CODES } from './whatsapp-six-tables'

// 1. Create Conversation (Thread Header)
export async function createConversation(
  organizationId: string,
  customerId: string,
  phoneNumber: string,
  agentQueueId?: string
) {
  return whatsappMCP.thread.create({
    organizationId,
    customerEntityId: customerId,
    phoneNumber,
    agentQueueEntityId: agentQueueId
  })
}

// 2. Post Message (Text/Media/Interactive)
export async function postMessage(
  organizationId: string,
  threadId: string,
  message: {
    direction: 'inbound' | 'outbound'
    text?: string
    media?: Array<{ url: string; mime: string }>
    interactive?: any
    channelMsgId?: string
    cost?: number
  }
) {
  const result = await whatsappMCP.message.send({
    organizationId,
    threadId,
    ...message
  })

  // Update thread metadata with last message info if successful
  if (result.success) {
    await whatsappMCP.thread.update({
      organizationId,
      threadId,
      metadata: {
        last_message_at: new Date().toISOString(),
        last_message_direction: message.direction,
        last_message_preview: message.text?.substring(0, 100)
      }
    })
  }

  return result
}

// 3. Assign Conversation
export async function assignConversation(
  organizationId: string,
  threadId: string,
  assigneeEntityId: string
) {
  return whatsappMCP.message.send({
    organizationId,
    threadId,
    direction: 'outbound',
    text: `Conversation assigned to agent ${assigneeEntityId}`,
    channelMsgId: `assign_${Date.now()}`,
    interactive: {
      type: 'system',
      action: 'assign',
      assignee_entity_id: assigneeEntityId
    }
  })
}

// 4. Add Internal Note
export async function addInternalNote(
  organizationId: string,
  threadId: string,
  noteText: string,
  authorEntityId?: string
) {
  return whatsappMCP.message.addNote({
    organizationId,
    threadId,
    noteText,
    authorEntityId
  })
}

// 5. Register Template (HSM)
export async function registerTemplate(
  organizationId: string,
  template: {
    name: string
    language: string
    body: string
    variables?: string[]
    category?: string
  }
) {
  return whatsappMCP.template.register({
    organizationId,
    ...template
  })
}

// 6. Create Campaign
export async function createCampaign(
  organizationId: string,
  campaign: {
    name: string
    templateEntityId: string
    audienceQuery: string
    scheduleAt?: string
  }
) {
  return whatsappMCP.campaign.create({
    organizationId,
    ...campaign
  })
}

// 7. Send Campaign Message (per recipient)
export async function sendCampaignMessage(
  organizationId: string,
  campaignId: string,
  recipientEntityId: string,
  templateEntityId: string
) {
  return whatsappMCP.campaign.sendMessage({
    organizationId,
    campaignId,
    recipientEntityId,
    templateEntityId
  })
}

// 8. Share Payment Link
export async function sharePaymentLink(
  organizationId: string,
  threadId: string,
  payment: {
    invoiceEntityId: string
    paymentUrl: string
    amount: number
    currency: string
  }
) {
  return whatsappMCP.payment.shareLink({
    organizationId,
    threadId,
    ...payment
  })
}

// 9. Confirm Payment
export async function confirmPayment(
  organizationId: string,
  payment: {
    payerEntityId: string
    payeeEntityId: string
    amount: number
    currency: string
    providerRef: string
    invoiceEntityId?: string
  }
) {
  return whatsappMCP.payment.confirm({
    organizationId,
    ...payment
  })
}

// 10. Link Thread to Customer (via relationship)
export async function linkThreadToCustomer(
  organizationId: string,
  threadId: string,
  customerId: string
) {
  // MCP will handle this as a relationship creation
  return whatsappMCP.message.send({
    organizationId,
    threadId,
    direction: 'outbound',
    text: `Thread linked to customer ${customerId}`,
    channelMsgId: `link_${Date.now()}`,
    interactive: {
      type: 'system',
      action: 'link_customer',
      customer_entity_id: customerId
    }
  })
}

// 11. Upsert Customer by Phone
export async function upsertCustomerByPhone(
  organizationId: string,
  phoneNumber: string,
  displayName: string
) {
  return whatsappMCP.customer.upsertByPhone({
    organizationId,
    phoneNumber,
    displayName
  })
}

// Helper: Get Conversations List
export async function getConversations(
  organizationId: string,
  filters?: {
    status?: 'open' | 'pending' | 'resolved'
    assigneeEntityId?: string
    search?: string
  }
) {
  const result = await whatsappMCP.query.getConversations({
    organizationId,
    ...filters
  })

  if (!result.success) {
    return result
  }

  // Format conversations for UI compatibility
  const conversations =
    result.data?.map((thread: any) => {
      const messages = thread.lines || []
      const messageLines = messages.filter((line: any) => line.line_type === 'MESSAGE')
      const lastMessage = messageLines[messageLines.length - 1]

      const unreadCount = messageLines.filter(
        (m: any) => m.line_data?.direction === 'inbound' && m.line_data?.status !== 'read'
      ).length

      return {
        id: thread.id,
        entity_name:
          (thread.metadata as any)?.display_name ||
          (thread.metadata as any)?.phone_number ||
          'Unknown',
        entity_code: (thread.metadata as any)?.phone_number || '',
        metadata: thread.metadata,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              metadata: {
                text: lastMessage.line_data?.text,
                type: lastMessage.line_data?.media ? 'media' : 'text'
              },
              created_at: lastMessage.created_at,
              source_entity_id:
                lastMessage.line_data?.direction === 'inbound' ? thread.source_entity_id : null
            }
          : null,
        messages: messageLines.map((m: any) => ({
          id: m.id,
          transaction_type: 'message',
          transaction_code: `MSG-${m.line_number}`,
          metadata: {
            text: m.line_data?.text,
            type: m.line_data?.media ? 'media' : 'text',
            latest_status: m.line_data?.status
          },
          created_at: m.created_at,
          source_entity_id: m.line_data?.direction === 'inbound' ? thread.source_entity_id : null,
          target_entity_id: m.line_data?.direction === 'outbound' ? thread.source_entity_id : null
        })),
        unreadCount,
        isPinned: (thread.metadata as any)?.is_pinned || false,
        isArchived: (thread.metadata as any)?.is_archived || false,
        updated_at: lastMessage?.created_at || thread.created_at
      }
    }) || []

  return {
    success: true,
    data: {
      conversations,
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum: number, conv: any) => sum + conv.messages.length, 0)
    }
  }
}

// Helper: Get Analytics
export async function getWhatsAppAnalytics(
  organizationId: string,
  options?: {
    startDate?: Date
    endDate?: Date
  }
) {
  const result = await whatsappMCP.query.getAnalytics({
    organizationId,
    startDate: options?.startDate,
    endDate: options?.endDate
  })

  if (!result.success || !result.data) {
    return result
  }

  // Format analytics for UI compatibility
  const { data } = result

  return {
    success: true,
    data: {
      totalMessages: data.total_messages || 0,
      uniqueContacts: data.unique_contacts || 0,
      avgResponseTime: data.avg_response_time || '2.5 min',
      engagementRate: data.engagement_rate || 0,
      popularTimeSlots: data.popular_time_slots || [],
      topContacts: data.top_contacts || []
    }
  }
}

// Helper: Toggle Pin Status
export async function togglePin(organizationId: string, threadId: string, shouldPin: boolean) {
  return whatsappMCP.thread.update({
    organizationId,
    threadId,
    metadata: {
      is_pinned: shouldPin,
      pinned_at: shouldPin ? new Date().toISOString() : null
    }
  })
}

// Helper: Toggle Archive Status
export async function toggleArchive(
  organizationId: string,
  threadId: string,
  shouldArchive: boolean
) {
  return whatsappMCP.thread.update({
    organizationId,
    threadId,
    metadata: {
      is_archived: shouldArchive,
      archived_at: shouldArchive ? new Date().toISOString() : null
    }
  })
}

// Export all functions as MCP tools
export const WHATSAPP_SIX_TABLES_MCP = {
  // Conversation Management
  createConversation,
  postMessage,
  assignConversation,
  addInternalNote,
  linkThreadToCustomer,
  getConversations,
  togglePin,
  toggleArchive,

  // Template & Campaign
  registerTemplate,
  createCampaign,
  sendCampaignMessage,

  // Payment
  sharePaymentLink,
  confirmPayment,

  // Customer
  upsertCustomerByPhone,

  // Analytics
  getWhatsAppAnalytics
}
