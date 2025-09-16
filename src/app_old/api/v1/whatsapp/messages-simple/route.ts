import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  const organizationId =
    process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'

  try {
    // Get all WhatsApp conversations
    const { data: conversations, error: convError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'whatsapp_conversation')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (convError) throw convError

    // Get all WhatsApp messages
    const { data: messages, error: msgError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (msgError) throw msgError

    // Format messages for display
    const formattedMessages =
      messages?.map(msg => {
        const direction = msg.source_entity_id ? 'inbound' : 'outbound'
        const conversationId = msg.source_entity_id || msg.target_entity_id
        const conversation = conversations?.find(c => c.id === conversationId)

        return {
          id: msg.id,
          text: (msg.metadata as any)?.text || '',
          direction,
          wa_id: (msg.metadata as any)?.wa_id || conversation?.metadata?.phone || '',
          phone: conversation?.metadata?.phone || '',
          customerName: conversation?.entity_name || 'Unknown Customer',
          conversationId,
          conversationName: conversation?.entity_name || 'Unknown',
          waba_message_id: (msg.metadata as any)?.message_id || msg.external_reference || '',
          created_at: msg.created_at,
          occurred_at: msg.transaction_date || msg.created_at, // Use transaction_date as occurred_at
          smart_code: msg.smart_code,
          metadata: msg.metadata
        }
      }) || []

    // Group by conversation
    const conversationsWithMessages =
      conversations?.map(conv => {
        const convMessages = formattedMessages.filter(msg => msg.conversationId === conv.id)

        return {
          conversation: {
            id: conv.id,
            entity_code: conv.entity_code,
            entity_name: conv.entity_name,
            metadata: conv.metadata,
            created_at: conv.created_at
          },
          messages: convMessages,
          messageCount: convMessages.length,
          lastMessage: convMessages[0] || null
        }
      }) || []

    return NextResponse.json({
      status: 'success',
      data: {
        totalConversations: conversations?.length || 0,
        totalMessages: formattedMessages.length,
        conversationsWithMessages,
        allMessages: formattedMessages
      }
    })
  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
