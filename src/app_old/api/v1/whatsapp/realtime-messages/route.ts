/**
 * Real-time WhatsApp Messages API
 * Fetches actual WhatsApp conversations and messages from database
 * that were received via webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Only create client if credentials are available
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('org_id') || process.env.DEFAULT_ORGANIZATION_ID || ''

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization ID required'
        },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!supabase) {
      console.log('Supabase not configured, returning demo data')
      return NextResponse.json({
        success: true,
        data: {
          conversations: [
            {
              id: 'demo-1',
              waContactId: '1234567890',
              name: 'Demo WhatsApp User',
              phone: '+1234567890',
              lastMessage: 'This is a demo message. Configure Supabase to see real messages.',
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0,
              windowState: 'open',
              tags: ['Demo'],
              conversationCost: 0,
              messages: [
                {
                  id: 'msg-demo-1',
                  content:
                    'Welcome to WhatsApp integration! Configure your webhook to receive real messages.',
                  type: 'text',
                  direction: 'inbound',
                  timestamp: new Date().toISOString()
                }
              ]
            }
          ],
          totalConversations: 1,
          totalMessages: 1
        }
      })
    }

    // Get all WhatsApp conversations
    const { data: conversations, error: convError } = await supabase!
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'whatsapp_conversation')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })

    if (convError) throw convError

    // Get recent messages (transactions)
    const { data: messages, error: msgError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .eq('organization_id', organizationId)
      .order('occurred_at', { ascending: false })
      .limit(500) // Get last 500 messages

    if (msgError) throw msgError

    // Format conversations with their messages
    const formattedConversations = (conversations || []).map(conv => {
      // Find messages for this conversation
      const conversationMessages =
        messages?.filter(msg => {
          const metadata = msg.metadata || {}
          return (
            metadata.conversation_id === conv.id ||
            metadata.phone_number === (conv.metadata as any)?.phone_number ||
            msg.source_entity_id === conv.id ||
            msg.target_entity_id === conv.id
          )
        }) || []

      // Get last message for conversation
      const lastMessage = conversationMessages[0]
      const lastMessageMetadata = lastMessage?.metadata || {}

      return {
        id: conv.id,
        waContactId: (conv.metadata as any)?.wa_id || conv.entity_code,
        name: conv.entity_name || (conv.metadata as any)?.profile_name || 'Unknown',
        phone: (conv.metadata as any)?.phone_number || '',
        lastMessage: lastMessageMetadata.text || lastMessageMetadata.caption || '',
        lastMessageTime: lastMessage?.occurred_at || conv.updated_at,
        unreadCount: (conv.metadata as any)?.unread_count || 0,
        windowState: (conv.metadata as any)?.window_state || 'closed',
        windowExpiresAt: (conv.metadata as any)?.window_expires_at,
        tags: (conv.metadata as any)?.tags || [],
        conversationCost: (conv.metadata as any)?.conversation_cost || 0,
        messages: conversationMessages.map(msg => ({
          id: msg.id,
          content: (msg.metadata as any)?.text || (msg.metadata as any)?.caption || '',
          type: (msg.metadata as any)?.type || 'text',
          direction: (msg.metadata as any)?.direction || 'inbound',
          timestamp: msg.occurred_at,
          status: (msg.metadata as any)?.status,
          cost: (msg.metadata as any)?.cost || 0,
          mediaUrl: (msg.metadata as any)?.media_url,
          mimeType: (msg.metadata as any)?.mime_type
        }))
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        conversations: formattedConversations,
        totalConversations: formattedConversations.length,
        totalMessages: messages?.length || 0
      }
    })
  } catch (error) {
    console.error('Error fetching WhatsApp messages:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch WhatsApp messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, phoneNumber, message, mediaUrl } = body

    if (!organizationId || !phoneNumber || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields'
        },
        { status: 400 }
      )
    }

    const accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN || process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN
    const phoneNumberId =
      process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      console.error('WhatsApp credentials not found in environment variables')
      return NextResponse.json(
        {
          success: false,
          error:
            'WhatsApp credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your environment.'
        },
        { status: 500 }
      )
    }

    // Send message via WhatsApp API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneNumber.replace(/\D/g, ''), // Remove non-digits
          type: mediaUrl ? 'image' : 'text',
          ...(mediaUrl
            ? {
                image: {
                  link: mediaUrl,
                  caption: message
                }
              }
            : {
                text: {
                  body: message
                }
              })
        })
      }
    )

    const result = await whatsappResponse.json()

    if (!whatsappResponse.ok) {
      throw new Error(result.error?.message || 'Failed to send message')
    }

    // Store sent message in database if Supabase is configured
    let transactionId = null
    if (supabase) {
      const messageTransaction = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'whatsapp_message',
          transaction_code: `WA_OUT_${Date.now()}`,
          smart_code: 'HERA.WHATSAPP.MESSAGE.OUTBOUND.v1',
          occurred_at: new Date().toISOString(),
          metadata: {
            phone_number: phoneNumber,
            text: message,
            type: mediaUrl ? 'image' : 'text',
            direction: 'outbound',
            status: 'sent',
            wa_message_id: result.messages?.[0]?.id,
            media_url: mediaUrl
          }
        })
        .select()
        .single()

      transactionId = messageTransaction.data?.id
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.messages?.[0]?.id,
        transactionId,
        status: 'sent'
      }
    })
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send WhatsApp message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
