import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WhatsAppProcessorV2 } from '@/lib/whatsapp/processor-v2'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Webhook verification for WhatsApp
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_TOKEN) {
    console.log('WhatsApp webhook verified successfully')
    return new Response(challenge, { status: 200 })
  }
  
  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 })
}

// Handle incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2))
    
    // Extract message data from webhook
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages
    const statuses = value?.statuses
    
    // Get organization ID
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '44d2d8f8-167d-46a7-a704-c0e5435863d6'
    
    if (!organizationId) {
      console.error('No organization ID configured')
      return NextResponse.json({ status: 'error', message: 'Organization not configured' })
    }
    
    // Initialize processor
    const processor = new WhatsAppProcessorV2({
      organizationId,
      supabase
    })
    
    await processor.initialize()
    
    // Process messages
    if (messages && messages.length > 0) {
      for (const message of messages) {
        const messageData = {
          from: message.from,
          text: message.text?.body || '',
          message_id: message.id,
          type: message.type,
          timestamp: message.timestamp,
          interactive: message.interactive,
          media: message.image || message.document || message.audio || message.video
        }
        
        const result = await processor.processMessage(messageData)
        
        if (!result.success) {
          console.error('Message processing failed:', result.error)
        } else {
          console.log('Message processed successfully:', result.transactionId)
        }
      }
    }
    
    // Process status updates (delivery receipts)
    if (statuses && statuses.length > 0) {
      for (const status of statuses) {
        // TODO: Implement status updates as separate transactions
        console.log('Status update:', status)
      }
    }
    
    // Always return 200 OK to WhatsApp
    return NextResponse.json({ status: 'ok' })
    
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    // Still return 200 to prevent WhatsApp retries
    return NextResponse.json({ status: 'ok' })
  }
}