import { NextRequest, NextResponse } from 'next/server'
import { UniversalConfigService } from '@/lib/whatsapp/universal-config-service'
import { universalApi } from '@/lib/universal-api'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('org_id') || 
                          searchParams.get('organization_id') ||
                          process.env.DEFAULT_ORGANIZATION_ID || 
                          'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' // Hair Talkz

    console.log('🔍 Fetching WhatsApp messages for org:', organizationId)

    // Set organization context for universal API
    universalApi.setOrganizationId(organizationId)

    // Load universal configuration to check system status
    const configService = new UniversalConfigService(organizationId)
    const configs = await configService.loadConfigurations()

    // Query all WhatsApp messages from universal_transactions
    const { data: allTransactions, error: txnError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'whatsapp_message')
      .order('created_at', { ascending: false })
      .limit(100)

    if (txnError) {
      console.error('Transaction query error:', txnError)
      throw txnError
    }

    console.log('📊 Found transactions:', allTransactions?.length || 0)

    // Also check for any messages in dynamic data
    const { data: dynamicMessages, error: dynError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('field_name', 'whatsapp_message')
      .limit(50)

    console.log('📊 Found dynamic messages:', dynamicMessages?.length || 0)

    // Get WhatsApp conversations
    const { data: conversations, error: convError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'whatsapp_conversation')
      .order('updated_at', { ascending: false })

    if (convError) {
      console.error('Conversation query error:', convError)
    }

    console.log('💬 Found conversations:', conversations?.length || 0)

    // Check for any recent webhook activity INCLUDING LIVE MESSAGES
    const { data: recentActivity, error: activityError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .in('transaction_type', ['whatsapp_message', 'whatsapp_webhook', 'whatsapp_ai_request', 'whatsapp_inbound', 'whatsapp_outbound'])
      .order('created_at', { ascending: false })
      .limit(50) // Increased limit to see more recent messages

    console.log('⚡ Recent activity:', recentActivity?.length || 0)

    // Look specifically for recent messages (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentMessages, error: recentError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .like('transaction_type', '%whatsapp%')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })

    console.log('🕐 Messages in last 24h:', recentMessages?.length || 0)
    
    if (recentMessages && recentMessages.length > 0) {
      console.log('📨 Recent message types:', [...new Set(recentMessages.map(m => m.transaction_type))])
      console.log('📨 Sample recent message:', {
        id: recentMessages[0].id,
        type: recentMessages[0].transaction_type,
        created: recentMessages[0].created_at,
        metadata: recentMessages[0].metadata
      })
    }

    // Combine all WhatsApp-related transactions for a complete view
    const allWhatsAppTxns = [
      ...(allTransactions || []),
      ...(recentActivity || []).filter(tx => !allTransactions?.some(atx => atx.id === tx.id)),
      ...(recentMessages || []).filter(tx => 
        !allTransactions?.some(atx => atx.id === tx.id) && 
        !recentActivity?.some(rtx => rtx.id === tx.id)
      )
    ]

    console.log('📊 Combined WhatsApp transactions:', allWhatsAppTxns.length)

    // Format messages for frontend
    const messages = allWhatsAppTxns.map(txn => ({
      id: txn.id,
      text: txn.metadata?.text || txn.metadata?.message || txn.metadata?.body || '',
      direction: txn.metadata?.direction || (txn.transaction_type.includes('inbound') ? 'inbound' : 'outbound'),
      wa_id: txn.metadata?.from || txn.metadata?.wa_id || txn.metadata?.contact_id || '',
      phone: txn.metadata?.phone || '',
      timestamp: txn.created_at,
      occurred_at: txn.transaction_date,
      status: txn.transaction_status,
      smart_code: txn.smart_code,
      cost: txn.metadata?.cost_usd || 0,
      provider: txn.metadata?.provider_selected || 'unknown',
      metadata: txn.metadata,
      transaction_type: txn.transaction_type,
      is_recent: new Date(txn.created_at) > new Date(oneDayAgo)
    })) || []

    // Query actual conversation entities from database
    const { data: conversationEntities, error: convEntitiesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'whatsapp_conversation')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    
    if (convEntitiesError) {
      console.error('Error fetching conversations:', convEntitiesError)
    }

    console.log('📊 Found conversation entities:', conversationEntities?.length || 0)

    // Query customer entities
    const { data: customerEntities, error: custError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'customer')
      .eq('organization_id', organizationId)
    
    if (custError) {
      console.error('Error fetching customers:', custError)
    }

    // Create maps for quick lookup
    const customerMap = new Map()
    customerEntities?.forEach(cust => {
      const waId = cust.metadata?.wa_id || cust.metadata?.phone
      if (waId) {
        customerMap.set(waId, cust)
      }
    })

    // Group messages by conversation
    const conversationMap = new Map()

    // First, create conversation entries from actual conversation entities
    conversationEntities?.forEach(conv => {
      const waId = conv.metadata?.wa_id || conv.metadata?.phone || ''
      const customerId = conv.metadata?.customer_id
      const customer = customerMap.get(waId)
      
      conversationMap.set(conv.id, {
        id: conv.id,
        waContactId: waId,
        name: conv.entity_name || customer?.entity_name || `Contact ${waId}`,
        phone: waId,
        messages: [],
        lastMessage: null,
        lastMessageTime: conv.metadata?.last_message_at || conv.created_at,
        unreadCount: 0,
        windowState: conv.metadata?.window_state || 'open',
        conversationCost: 0,
        tags: [],
        customerId: customerId,
        metadata: conv.metadata
      })
    })

    // Then assign messages to conversations
    messages.forEach(msg => {
      const waId = msg.wa_id || msg.phone || 'unknown'
      
      // Find conversation by wa_id
      let convEntry = null
      for (const [convId, conv] of conversationMap.entries()) {
        if (conv.waContactId === waId || conv.waContactId === waId.replace('+', '')) {
          convEntry = conv
          break
        }
      }
      
      // If no conversation found, create a synthetic one
      if (!convEntry) {
        const syntheticId = `conv-${waId}`
        convEntry = {
          id: syntheticId,
          waContactId: waId,
          name: msg.metadata?.customer_name || `Contact ${waId}`,
          phone: msg.phone,
          messages: [],
          lastMessage: null,
          lastMessageTime: null,
          unreadCount: 0,
          windowState: 'closed',
          conversationCost: 0,
          tags: []
        }
        conversationMap.set(syntheticId, convEntry)
      }
      
      convEntry.messages.push(msg)
      
      // Update last message info
      if (!convEntry.lastMessage || new Date(msg.timestamp) > new Date(convEntry.lastMessage.timestamp)) {
        convEntry.lastMessage = msg
        convEntry.lastMessageTime = msg.timestamp
      }
      
      // Update cost
      convEntry.conversationCost += msg.cost
    })

    const conversationsWithMessages = Array.from(conversationMap.values())
      .filter(conv => conv.messages.length > 0)
      .sort((a, b) => {
        const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
        const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
        return bTime - aTime
      })

    // Calculate metrics
    const totalCost = messages.reduce((sum, msg) => sum + (msg.cost || 0), 0)
    const providers = [...new Set(messages.map(msg => msg.provider))]
    const messagesByDirection = {
      inbound: messages.filter(msg => msg.direction === 'inbound').length,
      outbound: messages.filter(msg => msg.direction === 'outbound').length
    }

    return NextResponse.json({
      success: true,
      organization_id: organizationId,
      config_status: {
        hasChannel: !!configs.channel,
        hasRouting: !!configs.routing,
        hasToolmap: !!configs.toolmap,
        providers: configs.routing?.providers?.map(p => ({
          name: p.name,
          enabled: p.enabled,
          priority: p.priority
        })) || []
      },
      data: {
        totalConversations: conversationsWithMessages.length,
        totalMessages: messages.length,
        conversationsWithMessages,
        allMessages: messages,
        metrics: {
          totalCost,
          providers,
          messagesByDirection
        },
        recentActivity: recentActivity?.map(activity => ({
          id: activity.id,
          type: activity.transaction_type,
          status: activity.transaction_status,
          timestamp: activity.created_at,
          metadata: activity.metadata
        })) || []
      },
      debug: {
        dynamicMessagesCount: dynamicMessages?.length || 0,
        conversationsCount: conversations?.length || 0,
        recentActivityCount: recentActivity?.length || 0,
        queryParams: {
          organizationId,
          configExists: !!configs.channel
        }
      }
    })

  } catch (error) {
    console.error('Universal messages API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to fetch universal WhatsApp messages'
    }, { status: 500 })
  }
}

// Test endpoint - create a sample message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, test_message, from_phone } = body

    const orgId = organization_id || process.env.DEFAULT_ORGANIZATION_ID

    // Create a test message transaction
    const testMessage = await universalApi.createTransaction({
      organization_id: orgId,
      transaction_type: 'whatsapp_message',
      transaction_code: `TEST-WA-${Date.now()}`,
      smart_code: 'HERA.COMMS.WHATSAPP.MESSAGE.TEST.V1',
      total_amount: 0,
      metadata: {
        direction: 'inbound',
        text: test_message || 'Test message from API',
        from: from_phone || '+1234567890',
        wa_id: from_phone || '+1234567890',
        message_id: `test_${Date.now()}`,
        timestamp: new Date().toISOString(),
        test: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Test message created',
      transaction_id: testMessage.id,
      next_steps: [
        'Refresh the WhatsApp dashboard to see the test message',
        'Check /api/v1/whatsapp/universal-messages for the new data'
      ]
    })

  } catch (error) {
    console.error('Test message creation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}