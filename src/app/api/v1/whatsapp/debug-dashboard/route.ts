import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '44d2d8f8-167d-46a7-a704-c0e5435863d6'
  
  try {
    // Step 1: Get all conversations
    const { data: conversations, error: convError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'whatsapp_conversation')
      .eq('organization_id', organizationId)
    
    console.log('Conversations:', conversations)
    
    // Step 2: Get all WhatsApp messages
    const { data: messages, error: msgError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    
    console.log('Messages:', messages)
    
    // Step 3: Match messages to conversations
    const conversationsWithMessages = conversations?.map(conv => {
      const convMessages = messages?.filter(msg => 
        msg.source_entity_id === conv.id || msg.target_entity_id === conv.id
      ) || []
      
      return {
        conversation: {
          id: conv.id,
          entity_code: conv.entity_code,
          entity_name: conv.entity_name,
          metadata: conv.metadata,
          created_at: conv.created_at
        },
        messages: convMessages.map(msg => ({
          id: msg.id,
          text: msg.metadata?.text,
          direction: msg.source_entity_id === conv.id ? 'inbound' : 'outbound',
          created_at: msg.created_at,
          source_entity_id: msg.source_entity_id,
          target_entity_id: msg.target_entity_id
        })),
        lastMessage: convMessages[0] || null
      }
    }) || []
    
    return NextResponse.json({
      status: 'success',
      data: {
        totalConversations: conversations?.length || 0,
        totalMessages: messages?.length || 0,
        conversationsWithMessages,
        rawData: {
          conversations: conversations?.slice(0, 2),
          messages: messages?.slice(0, 5)
        }
      }
    })
    
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}