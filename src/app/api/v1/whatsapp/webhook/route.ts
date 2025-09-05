import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppMessageRouter } from '@/lib/whatsapp/message-router'
import { WhatsAppWebhookHandler } from '@/lib/whatsapp/webhook-handler'

// Webhook verification for WhatsApp Business API
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  
  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_WEBHOOK_TOKEN || 'hera-whatsapp-webhook-token-2024'
  
  if (mode === 'subscribe' && token === expectedToken) {
    console.log('WhatsApp webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }
  
  // Return error with debugging info
  return NextResponse.json({ 
    error: 'Invalid verification token',
    expected: expectedToken ? 'Token configured' : 'No token configured',
    received: token ? 'Token provided' : 'No token provided',
    mode: mode
  }, { status: 403 })
}

// Message handling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // TODO: In production, validate the webhook signature
    // const signature = request.headers.get('x-hub-signature-256')
    // if (!validateWebhookSignature(body, signature)) {
    //   return new NextResponse('Invalid signature', { status: 403 })
    // }
    
    // Log incoming webhook for debugging
    console.log('🔔 WhatsApp webhook received at:', new Date().toISOString())
    console.log('📦 Webhook body:', JSON.stringify(body, null, 2))
    
    // Extract message from WhatsApp webhook format
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages
    const contacts = value?.contacts
    const statuses = value?.statuses
    
    // Determine organization ID early
    const phoneNumberId = value?.metadata?.phone_number_id
    const phoneToOrgMap: Record<string, string> = {
      '919945896033': 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', // Hair Talkz
      '971501234567': 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', // Hair Talkz alternate
    }
    
    // Check if this is a status update
    if (statuses && statuses.length > 0) {
      const organizationId = phoneToOrgMap[phoneNumberId] ||
                            process.env.DEFAULT_ORGANIZATION_ID ||
                            'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
      await handleStatusUpdate(body, organizationId)
      return NextResponse.json({ status: 'ok' })
    }
    
    // Log specific message details
    if (messages && messages.length > 0) {
      const message = messages[0]
      console.log('💬 Message received:')
      console.log('   From:', message.from)
      console.log('   Text:', message.text?.body)
      console.log('   Type:', message.type)
      console.log('   Timestamp:', new Date(parseInt(message.timestamp) * 1000).toLocaleString())
    }
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'ok' })
    }
    
    const message = messages[0]
    const contact = contacts?.[0]
    const from = message.from // WhatsApp ID
    const text = message.text?.body
    const messageId = message.id
    const timestamp = message.timestamp
    
    // Organization already determined above
    const organizationId = phoneToOrgMap[from] || 
                          phoneToOrgMap[phoneNumberId] ||
                          process.env.DEFAULT_ORGANIZATION_ID ||
                          'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' // Default to Hair Talkz
    
    console.log('🏢 Using organization ID:', organizationId)
    console.log('📱 Phone number ID:', phoneNumberId)
    
    // First, store the message in database
    const webhookHandler = new WhatsAppWebhookHandler(organizationId)
    const storeResult = await webhookHandler.handleIncomingMessage(
      message,
      contact,
      phoneNumberId || ''
    )
    
    if (!storeResult.success) {
      console.error('Failed to store message:', storeResult.error)
      // Continue anyway - we don't want to fail the webhook
    }
    
    // Then route for AI processing if text message
    if (text && storeResult.success) {
      try {
        // Initialize message router (MCP)
        const router = new WhatsAppMessageRouter(
          organizationId,
          process.env.CLAUDE_API_KEY || ''
        )
        
        // Build context with contact information
        const customerData = {
          phone: from,
          name: contact?.profile?.name || 'Unknown',
          whatsapp_id: from
        }
        
        // Route the message through MCP (handles all messages including appointments)
        const result = await router.routeMessage({
          organizationId,
          waContactId: from,
          text: text || '',
          customerData,
          messageHistory: [] // You could fetch previous messages here
        })
        
        // Log result
        console.log('Message routing result:', {
          success: result.success,
          messagesSent: result.messagesSent,
          totalCost: result.totalCost
        })
      } catch (routingError) {
        console.error('Error routing message:', routingError)
        // Don't fail the webhook
      }
    }
    
    // Always return success to WhatsApp
    return NextResponse.json({ 
      status: 'ok',
      message: 'Webhook processed successfully'
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Status update handling (delivery receipts) - WhatsApp sends these as POST too
async function handleStatusUpdate(body: any, organizationId: string) {
  const entry = body.entry?.[0]
  const changes = entry?.changes?.[0]
  const value = changes?.value
  const statuses = value?.statuses
  
  if (!statuses || statuses.length === 0) {
    return
  }
  
  const status = statuses[0]
  console.log('📊 WhatsApp status update:', {
    messageId: status.id,
    recipientId: status.recipient_id,
    status: status.status,
    timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString()
  })
  
  // Update message status in database
  const webhookHandler = new WhatsAppWebhookHandler(organizationId)
  await webhookHandler.handleStatusUpdate(status)
}