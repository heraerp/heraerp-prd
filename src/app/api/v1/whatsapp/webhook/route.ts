import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WhatsAppProcessor } from '@/lib/whatsapp/processor'

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
    
    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'ok' })
    }
    
    const message = messages[0]
    const from = message.from
    const messageId = message.id
    const timestamp = message.timestamp
    const type = message.type
    
    // Handle different message types
    let messageText = ''
    let interactiveData = null
    
    if (type === 'text') {
      messageText = message.text.body
    } else if (type === 'interactive') {
      // Handle button/list replies
      const interactive = message.interactive
      if (interactive.type === 'button_reply') {
        messageText = interactive.button_reply.id
        interactiveData = interactive.button_reply
      } else if (interactive.type === 'list_reply') {
        messageText = interactive.list_reply.id
        interactiveData = interactive.list_reply
      }
    }
    
    console.log(`Processing message from ${from}: ${messageText}`)
    
    // Get organization from phone number
    const organizationId = await getOrganizationFromPhone(value.metadata.display_phone_number)
    
    if (!organizationId) {
      console.error('No organization found for phone number:', value.metadata.display_phone_number)
      console.error('Using DEFAULT_ORGANIZATION_ID:', process.env.DEFAULT_ORGANIZATION_ID)
      return NextResponse.json({ status: 'error', message: 'Organization not found' })
    }
    
    console.log('Processing message for organization:', organizationId)
    
    // Initialize processor
    const processor = new WhatsAppProcessor({
      organizationId,
      supabase
    })
    
    // Process the message
    const result = await processor.processMessage({
      from,
      text: messageText,
      message_id: messageId,
      type,
      interactive: interactiveData,
      timestamp
    })
    
    console.log('Message processed:', result)
    
    // Always return 200 OK to WhatsApp
    return NextResponse.json({ status: 'ok' })
    
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    // Still return 200 to prevent WhatsApp retries
    return NextResponse.json({ status: 'ok' })
  }
}

// Helper to get organization from WhatsApp phone number
async function getOrganizationFromPhone(phoneNumber: string): Promise<string | null> {
  // For now, always use the default organization
  // In production, you would look up based on the phone number
  const defaultOrgId = process.env.DEFAULT_ORGANIZATION_ID || '44d2d8f8-167d-46a7-a704-c0e5435863d6'
  
  console.log('Using organization ID:', defaultOrgId)
  
  // Verify the organization exists
  const { data: org } = await supabase
    .from('core_organizations')
    .select('id')
    .eq('id', defaultOrgId)
    .single()
  
  if (!org) {
    console.error('Organization not found:', defaultOrgId)
    return null
  }
  
  return defaultOrgId
}