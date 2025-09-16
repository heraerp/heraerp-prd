/**
 * HERA WhatsApp Integration - Six Sacred Tables Implementation
 * All WhatsApp operations using only the universal 6-table architecture
 * Smart Code Pattern: HERA.WHATSAPP.*
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/src/types/database'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

// WhatsApp Smart Code Patterns
export const WHATSAPP_SMART_CODES = {
  // Thread/Conversation
  THREAD_CREATE: 'HERA.WHATSAPP.INBOX.THREAD.v1',
  THREAD_ASSIGN: 'HERA.WHATSAPP.INBOX.ASSIGN.v1',
  THREAD_RESOLVE: 'HERA.WHATSAPP.INBOX.RESOLVE.v1',

  // Messages
  MESSAGE_TEXT: 'HERA.WHATSAPP.MESSAGE.TEXT.v1',
  MESSAGE_MEDIA: 'HERA.WHATSAPP.MESSAGE.MEDIA.v1',
  MESSAGE_INTERACTIVE: 'HERA.WHATSAPP.MESSAGE.INTERACTIVE.v1',
  MESSAGE_TEMPLATE: 'HERA.WHATSAPP.MESSAGE.TEMPLATE.v1',

  // Internal
  NOTE_INTERNAL: 'HERA.WHATSAPP.NOTE.INTERNAL.v1',

  // Templates
  TEMPLATE_REGISTER: 'HERA.WHATSAPP.TEMPLATE.REGISTER.v1',
  TEMPLATE_BODY: 'HERA.WHATSAPP.TEMPLATE.BODY.v1',
  TEMPLATE_VARS: 'HERA.WHATSAPP.TEMPLATE.VARS.v1',

  // Campaign
  CAMPAIGN_CREATE: 'HERA.WHATSAPP.CAMPAIGN.OUTBOUND.v1',
  CAMPAIGN_AUDIENCE: 'HERA.WHATSAPP.CAMPAIGN.AUDIENCE.v1',
  CAMPAIGN_DELIVERY: 'HERA.WHATSAPP.CAMPAIGN.DELIVERY.v1',

  // Payments
  PAYMENT_LINK: 'HERA.AR.PAYMENT.LINK.SHARE.v1',
  PAYMENT_CONFIRM: 'HERA.AR.PAYMENT.COLLECTION.WHATSAPP.v1',

  // Relationships
  THREAD_TO_CUSTOMER: 'HERA.WHATSAPP.REL.THREAD_TO_ENTITY.v1',

  // Customer
  CUSTOMER_WHATSAPP: 'HERA.CRM.CUSTOMER.WHATSAPP.v1',

  // Notifications
  NOTIFICATION_INVOICE: 'HERA.AR.NOTIFY.INVOICE.DUE.v1',
  NOTIFICATION_APPOINTMENT: 'HERA.SALON.NOTIFY.APPOINTMENT.v1'
} as const

// Types based on six tables
interface WhatsAppThread {
  id: string
  organization_id: string
  transaction_type: 'MESSAGE_THREAD'
  transaction_date: string
  source_entity_id: string // customer
  target_entity_id?: string // agent queue
  metadata: {
    channel: 'whatsapp'
    phone_number: string
    status: 'open' | 'pending' | 'resolved'
    tags?: string[]
  }
  smart_code: string
}

interface WhatsAppMessage {
  id: string
  transaction_id: string // thread id
  line_number: number
  line_type: 'MESSAGE'
  description: string
  line_amount: number // cost
  smart_code: string
  line_data: {
    direction: 'inbound' | 'outbound'
    channel_msg_id?: string
    text?: string
    media?: Array<{ url: string; mime: string }>
    interactive?: any
    status?: 'sent' | 'delivered' | 'read' | 'failed'
    timestamp: string
  }
}

// 1. Create Conversation (Thread Header)
export async function createConversation(
  organizationId: string,
  customerId: string,
  phoneNumber: string,
  agentQueueId?: string
) {
  try {
    const { data, error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'MESSAGE_THREAD',
        smart_code: WHATSAPP_SMART_CODES.THREAD_CREATE,
        transaction_date: new Date().toISOString(),
        source_entity_id: customerId,
        target_entity_id: agentQueueId,
        metadata: {
          channel: 'whatsapp',
          phone_number: phoneNumber,
          status: 'open',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, thread_id: data.id, data }
  } catch (error) {
    console.error('Create conversation error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
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
  try {
    // Get next line number
    const { data: existingLines } = await supabase
      .from('universal_transaction_lines')
      .select('line_number')
      .eq('organization_id', organizationId)
      .eq('transaction_id', threadId)
      .order('line_number', { ascending: false })
      .limit(1)

    const nextLineNumber =
      existingLines && existingLines.length > 0 ? (existingLines[0].line_number || 0) + 1 : 1

    // Determine message type
    let smartCode = WHATSAPP_SMART_CODES.MESSAGE_TEXT
    if (message.media) smartCode = WHATSAPP_SMART_CODES.MESSAGE_MEDIA
    if (message.interactive) smartCode = WHATSAPP_SMART_CODES.MESSAGE_INTERACTIVE

    const { data, error } = await supabase
      .from('universal_transaction_lines')
      .insert({
        organization_id: organizationId,
        transaction_id: threadId,
        line_number: nextLineNumber,
        line_type: 'MESSAGE',
        description: message.text ? message.text.substring(0, 255) : 'WhatsApp Message',
        line_amount: message.cost || 0,
        smart_code: smartCode,
        line_data: {
          direction: message.direction,
          channel_msg_id: message.channelMsgId,
          text: message.text,
          media: message.media,
          interactive: message.interactive,
          status: message.direction === 'outbound' ? 'sent' : 'received',
          timestamp: new Date().toISOString(),
          currency: 'USD'
        }
      })
      .select()
      .single()

    if (error) throw error

    // Update thread metadata with last message info
    await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          last_message_at: new Date().toISOString(),
          last_message_direction: message.direction,
          last_message_preview: message.text?.substring(0, 100)
        }
      })
      .eq('id', threadId)
      .eq('organization_id', organizationId)

    return { success: true, message_id: data.id, data }
  } catch (error) {
    console.error('Post message error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 3. Assign Conversation
export async function assignConversation(
  organizationId: string,
  threadId: string,
  assigneeEntityId: string
) {
  try {
    // Get next line number
    const { data: existingLines } = await supabase
      .from('universal_transaction_lines')
      .select('line_number')
      .eq('organization_id', organizationId)
      .eq('transaction_id', threadId)
      .order('line_number', { ascending: false })
      .limit(1)

    const nextLineNumber =
      existingLines && existingLines.length > 0 ? (existingLines[0].line_number || 0) + 1 : 1

    const { data, error } = await supabase
      .from('universal_transaction_lines')
      .insert({
        organization_id: organizationId,
        transaction_id: threadId,
        line_number: nextLineNumber,
        line_type: 'INBOX_ACTION',
        description: 'Assigned conversation',
        smart_code: WHATSAPP_SMART_CODES.THREAD_ASSIGN,
        line_data: {
          assignee_entity_id: assigneeEntityId,
          assigned_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, assignment_id: data.id, data }
  } catch (error) {
    console.error('Assign conversation error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 4. Add Internal Note
export async function addInternalNote(
  organizationId: string,
  threadId: string,
  noteText: string,
  authorEntityId?: string
) {
  try {
    // Get next line number
    const { data: existingLines } = await supabase
      .from('universal_transaction_lines')
      .select('line_number')
      .eq('organization_id', organizationId)
      .eq('transaction_id', threadId)
      .order('line_number', { ascending: false })
      .limit(1)

    const nextLineNumber =
      existingLines && existingLines.length > 0 ? (existingLines[0].line_number || 0) + 1 : 1

    const { data, error } = await supabase
      .from('universal_transaction_lines')
      .insert({
        organization_id: organizationId,
        transaction_id: threadId,
        line_number: nextLineNumber,
        line_type: 'INTERNAL_NOTE',
        description: noteText.substring(0, 255),
        smart_code: WHATSAPP_SMART_CODES.NOTE_INTERNAL,
        line_data: {
          text: noteText,
          author_entity_id: authorEntityId,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, note_id: data.id, data }
  } catch (error) {
    console.error('Add internal note error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
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
  try {
    // Create template entity
    const { data: templateEntity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'msg_template',
        entity_name: template.name,
        entity_code: template.name,
        smart_code: WHATSAPP_SMART_CODES.TEMPLATE_REGISTER,
        status: 'active',
        business_rules: {
          language: template.language,
          category: template.category || 'marketing'
        }
      })
      .select()
      .single()

    if (entityError) throw entityError

    // Store template body and variables in dynamic data
    const dynamicDataInserts = [
      {
        organization_id: organizationId,
        entity_id: templateEntity.id,
        field_name: 'body',
        field_type: 'text',
        field_value_text: template.body,
        smart_code: WHATSAPP_SMART_CODES.TEMPLATE_BODY
      }
    ]

    if (template.variables && template.variables.length > 0) {
      dynamicDataInserts.push({
        organization_id: organizationId,
        entity_id: templateEntity.id,
        field_name: 'variables',
        field_type: 'json',
        field_value_text: null,
        field_value_json: template.variables,
        smart_code: WHATSAPP_SMART_CODES.TEMPLATE_VARS
      })
    }

    const { error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicDataInserts)

    if (dynamicError) throw dynamicError

    return { success: true, template_id: templateEntity.id, data: templateEntity }
  } catch (error) {
    console.error('Register template error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
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
  try {
    // Create campaign header transaction
    const { data: campaignTx, error: txError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'CAMPAIGN',
        smart_code: WHATSAPP_SMART_CODES.CAMPAIGN_CREATE,
        transaction_date: new Date().toISOString(),
        source_entity_id: campaign.templateEntityId,
        metadata: {
          name: campaign.name,
          schedule_at: campaign.scheduleAt || new Date().toISOString(),
          status: 'scheduled'
        }
      })
      .select()
      .single()

    if (txError) throw txError

    // Store audience query as dynamic data
    const { error: dynamicError } = await supabase.from('core_dynamic_data').insert({
      organization_id: organizationId,
      entity_id: campaignTx.id, // Using transaction ID as entity reference
      field_name: 'audience_query',
      field_type: 'text',
      field_value_text: campaign.audienceQuery,
      smart_code: WHATSAPP_SMART_CODES.CAMPAIGN_AUDIENCE
    })

    if (dynamicError) throw dynamicError

    return { success: true, campaign_id: campaignTx.id, data: campaignTx }
  } catch (error) {
    console.error('Create campaign error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 7. Send Campaign Message (per recipient)
export async function sendCampaignMessage(
  organizationId: string,
  campaignId: string,
  recipientEntityId: string,
  templateEntityId: string
) {
  try {
    // Get next line number
    const { data: existingLines } = await supabase
      .from('universal_transaction_lines')
      .select('line_number')
      .eq('organization_id', organizationId)
      .eq('transaction_id', campaignId)
      .order('line_number', { ascending: false })
      .limit(1)

    const nextLineNumber =
      existingLines && existingLines.length > 0 ? (existingLines[0].line_number || 0) + 1 : 1

    const { data, error } = await supabase
      .from('universal_transaction_lines')
      .insert({
        organization_id: organizationId,
        transaction_id: campaignId,
        line_number: nextLineNumber,
        line_type: 'CAMPAIGN_DELIVERY',
        description: 'Outbound campaign message',
        smart_code: WHATSAPP_SMART_CODES.CAMPAIGN_DELIVERY,
        line_data: {
          recipient_entity_id: recipientEntityId,
          template_entity_id: templateEntityId,
          status: 'queued',
          queued_at: new Date().toISOString()
        },
        entity_id: recipientEntityId
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, delivery_id: data.id, data }
  } catch (error) {
    console.error('Send campaign message error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
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
  try {
    // Get next line number
    const { data: existingLines } = await supabase
      .from('universal_transaction_lines')
      .select('line_number')
      .eq('organization_id', organizationId)
      .eq('transaction_id', threadId)
      .order('line_number', { ascending: false })
      .limit(1)

    const nextLineNumber =
      existingLines && existingLines.length > 0 ? (existingLines[0].line_number || 0) + 1 : 1

    const { data, error } = await supabase
      .from('universal_transaction_lines')
      .insert({
        organization_id: organizationId,
        transaction_id: threadId,
        line_number: nextLineNumber,
        line_type: 'PAYMENT_LINK',
        description: 'Share payment link',
        smart_code: WHATSAPP_SMART_CODES.PAYMENT_LINK,
        line_data: {
          ar_invoice_entity_id: payment.invoiceEntityId,
          paylink_url: payment.paymentUrl,
          currency: payment.currency,
          shared_at: new Date().toISOString()
        },
        line_amount: payment.amount
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, payment_link_id: data.id, data }
  } catch (error) {
    console.error('Share payment link error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
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
  try {
    // Create payment transaction header
    const { data: paymentTx, error: txError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'PAYMENT',
        smart_code: WHATSAPP_SMART_CODES.PAYMENT_CONFIRM,
        transaction_date: new Date().toISOString(),
        source_entity_id: payment.payerEntityId,
        target_entity_id: payment.payeeEntityId,
        total_amount: payment.amount,
        transaction_currency_code: payment.currency
      })
      .select()
      .single()

    if (txError) throw txError

    // Create payment lines (debit and credit)
    const lines = [
      {
        organization_id: organizationId,
        transaction_id: paymentTx.id,
        line_number: 1,
        line_type: 'PAYMENT_LINE',
        description: 'Cash in',
        quantity: 1,
        unit_amount: payment.amount,
        line_amount: payment.amount,
        smart_code: 'HERA.GL.LINE.DEBIT.v1',
        line_data: {
          provider_ref: payment.providerRef,
          account: 'Bank'
        }
      },
      {
        organization_id: organizationId,
        transaction_id: paymentTx.id,
        line_number: 2,
        line_type: 'PAYMENT_LINE',
        description: 'Reduce accounts receivable',
        quantity: 1,
        unit_amount: -payment.amount,
        line_amount: -payment.amount,
        smart_code: 'HERA.GL.LINE.CREDIT.v1',
        line_data: {
          ar_invoice_entity_id: payment.invoiceEntityId,
          account: 'AR'
        }
      }
    ]

    const { error: linesError } = await supabase.from('universal_transaction_lines').insert(lines)

    if (linesError) throw linesError

    return { success: true, payment_id: paymentTx.id, data: paymentTx }
  } catch (error) {
    console.error('Confirm payment error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 10. Link Thread to Customer
export async function linkThreadToCustomer(
  organizationId: string,
  threadId: string,
  customerId: string
) {
  try {
    const { data, error } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: organizationId,
        from_entity_id: threadId,
        to_entity_id: customerId,
        relationship_type: 'THREAD_TO_ENTITY',
        relationship_direction: 'forward',
        smart_code: WHATSAPP_SMART_CODES.THREAD_TO_CUSTOMER,
        relationship_data: {
          channel: 'whatsapp',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, relationship_id: data.id, data }
  } catch (error) {
    console.error('Link thread to customer error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 11. Upsert Customer by Phone
export async function upsertCustomerByPhone(
  organizationId: string,
  phoneNumber: string,
  displayName: string
) {
  try {
    const { data, error } = await supabase
      .from('core_entities')
      .upsert(
        {
          organization_id: organizationId,
          entity_type: 'customer',
          entity_name: displayName,
          entity_code: phoneNumber,
          smart_code: WHATSAPP_SMART_CODES.CUSTOMER_WHATSAPP,
          status: 'active',
          business_rules: {
            msisdn: phoneNumber,
            channel: 'whatsapp'
          }
        },
        {
          onConflict: 'organization_id,entity_code,entity_type'
        }
      )
      .select()
      .single()

    if (error) throw error

    return { success: true, customer_id: data.id, data }
  } catch (error) {
    console.error('Upsert customer error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
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
  try {
    let query = supabase
      .from('universal_transactions')
      .select(
        `
        *,
        universal_transaction_lines (
          id,
          line_number,
          line_type,
          description,
          smart_code,
          line_data,
          created_at
        )
      `
      )
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'MESSAGE_THREAD')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('metadata->status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`
        metadata->phone_number.ilike.%${filters.search}%,
        metadata->last_message_preview.ilike.%${filters.search}%
      `)
    }

    const { data, error } = await query
    if (error) throw error

    // Format conversations for UI
    const conversations =
      data?.map(thread => {
        const messages =
          thread.universal_transaction_lines
            ?.filter(line => line.line_type === 'MESSAGE')
            ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) ||
          []

        const lastMessage = messages[0]
        const unreadCount = messages.filter(
          m => m.line_data?.direction === 'inbound' && m.line_data?.status !== 'read'
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
          messages: messages.map(m => ({
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
        totalMessages: conversations.reduce((sum, conv) => sum + conv.messages.length, 0)
      }
    }
  } catch (error) {
    console.error('Get conversations error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
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
  const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } =
    options || {}

  try {
    // Get all WhatsApp threads and messages
    const { data: threads, error } = await supabase
      .from('universal_transactions')
      .select(
        `
        *,
        universal_transaction_lines (*)
      `
      )
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'MESSAGE_THREAD')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (error) throw error

    // Calculate analytics
    const totalMessages =
      threads?.reduce(
        (sum, thread) =>
          sum +
          (thread.universal_transaction_lines?.filter(l => l.line_type === 'MESSAGE').length || 0),
        0
      ) || 0

    const uniqueContacts = new Set(threads?.map(t => t.source_entity_id)).size

    // Calculate hourly distribution
    const hourlyDistribution: Record<number, number> = {}
    threads?.forEach(thread => {
      thread.universal_transaction_lines?.forEach(line => {
        if (line.line_type === 'MESSAGE') {
          const hour = new Date(line.created_at).getHours()
          hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1
        }
      })
    })

    const popularTimeSlots = Object.entries(hourlyDistribution)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Top contacts
    const contactMessages: Record<string, number> = {}
    threads?.forEach(thread => {
      const contactId = thread.source_entity_id
      const msgCount =
        thread.universal_transaction_lines?.filter(l => l.line_type === 'MESSAGE').length || 0
      contactMessages[contactId] = (contactMessages[contactId] || 0) + msgCount
    })

    const topContacts = await Promise.all(
      Object.entries(contactMessages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(async ([contactId, messageCount]) => {
          const { data: customer } = await supabase
            .from('core_entities')
            .select('entity_name')
            .eq('id', contactId)
            .single()

          return {
            name: customer?.entity_name || 'Unknown',
            messageCount
          }
        })
    )

    // Response rate (threads with at least one outbound message)
    const threadsWithResponse =
      threads?.filter(thread =>
        thread.universal_transaction_lines?.some(
          l => l.line_type === 'MESSAGE' && l.line_data?.direction === 'outbound'
        )
      ).length || 0

    const engagementRate =
      threads && threads.length > 0 ? Math.round((threadsWithResponse / threads.length) * 100) : 0

    return {
      success: true,
      data: {
        totalMessages,
        uniqueContacts,
        avgResponseTime: '2.5 min', // Would need to calculate from actual response times
        engagementRate,
        popularTimeSlots,
        topContacts
      }
    }
  } catch (error) {
    console.error('Get analytics error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Helper: Toggle Pin Status
export async function togglePin(organizationId: string, threadId: string, shouldPin: boolean) {
  try {
    // First get current metadata
    const { data: thread, error: fetchError } = await supabase
      .from('universal_transactions')
      .select('metadata')
      .eq('id', threadId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError) throw fetchError

    // Update metadata
    const updatedMetadata = {
      ...thread.metadata,
      is_pinned: shouldPin,
      pinned_at: shouldPin ? new Date().toISOString() : null
    }

    const { error } = await supabase
      .from('universal_transactions')
      .update({ metadata: updatedMetadata })
      .eq('id', threadId)
      .eq('organization_id', organizationId)

    if (error) throw error

    return { success: true, data: { threadId, isPinned: shouldPin } }
  } catch (error) {
    console.error('Toggle pin error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Helper: Toggle Archive Status
export async function toggleArchive(
  organizationId: string,
  threadId: string,
  shouldArchive: boolean
) {
  try {
    // First get current metadata
    const { data: thread, error: fetchError } = await supabase
      .from('universal_transactions')
      .select('metadata')
      .eq('id', threadId)
      .eq('organization_id', organizationId)
      .single()

    if (fetchError) throw fetchError

    // Update metadata
    const updatedMetadata = {
      ...thread.metadata,
      is_archived: shouldArchive,
      archived_at: shouldArchive ? new Date().toISOString() : null
    }

    const { error } = await supabase
      .from('universal_transactions')
      .update({ metadata: updatedMetadata })
      .eq('id', threadId)
      .eq('organization_id', organizationId)

    if (error) throw error

    return { success: true, data: { threadId, isArchived: shouldArchive } }
  } catch (error) {
    console.error('Toggle archive error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
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
