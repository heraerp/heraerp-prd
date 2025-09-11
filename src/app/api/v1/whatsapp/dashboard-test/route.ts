import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '44d2d8f8-167d-46a7-a704-c0e5435863d6'
  
  try {
    // Simulate the exact queries from the dashboard
    console.log('Testing dashboard queries...')
    
    // Step 1: Get conversations (same as dashboard)
    const { data: convos, error: convError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'whatsapp_conversation')
      .order('updated_at', { ascending: false })
    
    if (convError) {
      return NextResponse.json({
        error: 'Failed to fetch conversations',
        details: convError
      })
    }
    
    console.log(`Found ${convos?.length || 0} conversations`)
    
    // Step 2: Get last message for each conversation (same as dashboard)
    const conversationsWithMessages = []
    
    for (const conv of convos || []) {
      const { data: lastMsg, error: msgError } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('transaction_type', 'whatsapp_message')
        .eq('organization_id', organizationId)
        .or(`source_entity_id.eq.${conv.id},target_entity_id.eq.${conv.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      const formattedConv = {
        id: conv.id,
        phone: (conv.metadata as any)?.phone || conv.entity_code.replace('WA-', ''),
        name: (conv.metadata as any)?.sender_name || conv.entity_name.replace('WhatsApp: ', ''),
        lastMessage: lastMsg?.metadata?.text || 'No messages',
        lastMessageTime: lastMsg?.created_at || conv.created_at,
        unreadCount: (conv.metadata as any)?.unread_count || 0,
        customerType: (conv.metadata as any)?.customer_type || 'new',
        hasLastMessage: !!lastMsg,
        messageError: msgError
      }
      
      conversationsWithMessages.push(formattedConv)
    }
    
    return NextResponse.json({
      status: 'success',
      organizationId,
      totalConversations: convos?.length || 0,
      conversations: conversationsWithMessages,
      dashboardUrl: 'https://heraerp.com/salon/whatsapp',
      note: 'If this shows data but the dashboard doesnt, check authentication/organization context'
    })
    
  } catch (error) {
    console.error('Dashboard test error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}