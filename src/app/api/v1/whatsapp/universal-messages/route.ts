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

    // Check for any recent webhook activity
    const { data: recentActivity, error: activityError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .in('transaction_type', ['whatsapp_message', 'whatsapp_webhook', 'whatsapp_ai_request'])
      .order('created_at', { ascending: false })
      .limit(20)

    console.log('⚡ Recent activity:', recentActivity?.length || 0)

    // Format messages for frontend
    const messages = allTransactions?.map(txn => ({
      id: txn.id,
      text: txn.metadata?.text || txn.metadata?.message || '',
      direction: txn.metadata?.direction || 'unknown',
      wa_id: txn.metadata?.from || txn.metadata?.wa_id || '',
      phone: txn.metadata?.phone || '',
      timestamp: txn.created_at,
      occurred_at: txn.transaction_date,
      status: txn.transaction_status,
      smart_code: txn.smart_code,
      cost: txn.metadata?.cost_usd || 0,
      provider: txn.metadata?.provider_selected || 'unknown',
      metadata: txn.metadata
    })) || []

    // Group by phone number/wa_id to create conversations
    const conversationMap = new Map()

    messages.forEach(msg => {
      const key = msg.wa_id || msg.phone || 'unknown'
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          id: `conv-${key}`,
          waContactId: key,
          name: msg.metadata?.customer_name || `Contact ${key}`,
          phone: msg.phone,
          messages: [],
          lastMessage: null,
          lastMessageTime: null,
          unreadCount: 0,
          windowState: 'closed',
          conversationCost: 0,
          tags: []
        })
      }
      
      const conv = conversationMap.get(key)
      conv.messages.push(msg)
      
      // Update last message info
      if (!conv.lastMessage || new Date(msg.timestamp) > new Date(conv.lastMessage.timestamp)) {
        conv.lastMessage = msg
        conv.lastMessageTime = msg.timestamp
      }
      
      // Update cost
      conv.conversationCost += msg.cost
    })

    const conversationsWithMessages = Array.from(conversationMap.values())
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