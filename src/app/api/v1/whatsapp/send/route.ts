import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const whatsappConfig = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  apiUrl: 'https://graph.facebook.com/v18.0'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, text, to, template, interactive, replyTo, mediaType, mediaUrl } = body

    if (!conversationId || (!text && !template && !interactive && !mediaUrl)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const organizationId =
      process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', conversationId)
      .eq('organization_id', organizationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check 24-hour window
    const { data: lastInboundMessage } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('source_entity_id', conversationId)
      .order('transaction_date', { ascending: false })
      .limit(1)
      .single()

    const hoursSinceLastInbound = lastInboundMessage
      ? (new Date().getTime() - new Date(lastInboundMessage.transaction_date).getTime()) /
        (1000 * 60 * 60)
      : 25

    // Validate message type based on 24-hour window
    if (hoursSinceLastInbound > 24 && !template) {
      return NextResponse.json(
        { error: 'Outside 24-hour window. Template message required.' },
        { status: 400 }
      )
    }

    // Prepare WhatsApp API payload
    let whatsappPayload: any = {
      messaging_product: 'whatsapp',
      to: to || conversation.metadata.phone
    }

    // Add reply context if provided
    if (replyTo) {
      whatsappPayload.context = {
        message_id: replyTo
      }
    }

    if (mediaUrl && mediaType) {
      // Media message (image, video, document)
      whatsappPayload.type = mediaType
      whatsappPayload[mediaType] = {
        link: mediaUrl,
        caption: text
      }
    } else if (template) {
      // Template message
      whatsappPayload.type = 'template'
      whatsappPayload.template = template
    } else if (interactive) {
      // Interactive message (buttons, lists)
      whatsappPayload.type = 'interactive'
      whatsappPayload.interactive = interactive
    } else {
      // Regular text message
      whatsappPayload.type = 'text'
      whatsappPayload.text = { body: text }
    }

    // Send via WhatsApp API
    let messageId: string
    let sendError: any = null

    try {
      const response = await axios.post(
        `${whatsappConfig.apiUrl}/${whatsappConfig.phoneNumberId}/messages`,
        whatsappPayload,
        {
          headers: {
            Authorization: `Bearer ${whatsappConfig.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      messageId = response.data.messages[0].id
    } catch (error: any) {
      console.error('WhatsApp API error:', error.response?.data || error)
      sendError = error.response?.data || error.message
      messageId = `ERROR_${Date.now()}`
    }

    // Store message in database
    const { data: transaction, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'whatsapp_message',
        transaction_code: `MSG-OUT-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        target_entity_id: conversationId, // Outbound
        external_reference: messageId,
        smart_code: template
          ? 'HERA.WHATSAPP.MSG.TEMPLATE.V1'
          : interactive
            ? 'HERA.WHATSAPP.MSG.INTERACTIVE.V1'
            : 'HERA.WHATSAPP.MSG.OUTBOUND.V1',
        metadata: {
          message_id: messageId,
          text: text || template?.name || 'Interactive message',
          direction: 'outbound',
          message_type: mediaType || (template ? 'template' : interactive ? 'interactive' : 'text'),
          wa_id: conversation.metadata.wa_id || conversation.metadata.phone,
          timestamp: new Date().toISOString(),
          status: sendError ? 'failed' : 'sent',
          status_history: [
            {
              status: sendError ? 'failed' : 'sent',
              timestamp: new Date().toISOString(),
              error: sendError || undefined
            }
          ],
          error: sendError,
          template: template,
          interactive: interactive,
          reply_to: replyTo,
          media_type: mediaType,
          media_url: mediaUrl,
          agent_id: request.headers.get('x-agent-id') || undefined
        }
      })
      .select()
      .single()

    if (txnError) {
      console.error('Database error:', txnError)
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 })
    }

    // Create audit trail
    await supabase.from('universal_transactions').insert({
      organization_id: organizationId,
      transaction_type: 'whatsapp_audit',
      transaction_code: `AUDIT-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      reference_number: transaction.id,
      smart_code: 'HERA.WHATSAPP.AUDIT.SEND.V1',
      metadata: {
        action: 'message_sent',
        conversation_id: conversationId,
        message_id: messageId,
        agent_id: request.headers.get('x-agent-id'),
        ip_address: request.headers.get('x-forwarded-for'),
        user_agent: request.headers.get('user-agent')
      }
    })

    return NextResponse.json({
      success: true,
      messageId,
      transactionId: transaction.id,
      status: sendError ? 'failed' : 'sent',
      error: sendError
    })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
