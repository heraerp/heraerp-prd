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
  
  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified successfully')
    return new Response(challenge, { status: 200 })
  }
  
  return NextResponse.json({ error: 'Invalid verification token' }, { status: 403 })
}

// Handle incoming WhatsApp messages and status updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2))
    
    // Extract data from webhook
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    
    // Check if this is a status update
    const statuses = value?.statuses
    if (statuses && statuses.length > 0) {
      return handleStatusUpdates(statuses, value.metadata?.display_phone_number)
    }
    
    // Otherwise, handle as a message
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
    
    console.log('Message processed:', JSON.stringify(result, null, 2))
    
    // If processing failed, log the error
    if (!result.success) {
      console.error('WhatsApp processing failed:', result.error)
    }
    
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

// Handle WhatsApp status updates (sent, delivered, read, failed)
async function handleStatusUpdates(statuses: any[], phoneNumber: string) {
  try {
    const organizationId = await getOrganizationFromPhone(phoneNumber)
    
    if (!organizationId) {
      console.error('No organization found for status updates')
      return NextResponse.json({ status: 'ok' })
    }
    
    // Process each status update
    for (const status of statuses) {
      try {
        await processStatusUpdate(status, organizationId)
      } catch (error) {
        console.error('Failed to process status update:', error)
        // Continue processing other statuses
      }
    }
    
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Status update handling error:', error)
    return NextResponse.json({ status: 'ok' })
  }
}

async function processStatusUpdate(status: any, organizationId: string) {
  const { id: waba_message_id, status: statusType, timestamp, recipient_id, errors, pricing } = status
  
  console.log(`Processing status update: ${statusType} for message ${waba_message_id}`)
  
  // Find the original message transaction using waba_message_id
  const { data: originalTransaction, error: findError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'whatsapp_message')
    .eq('organization_id', organizationId)
    .contains('metadata', { waba_message_id })
    .single()
  
  if (findError || !originalTransaction) {
    console.error('Original message not found for WABA ID:', waba_message_id, findError)
    return
  }
  
  // Create a new transaction for the status update
  const statusTransaction = {
    transaction_type: 'whatsapp_status',
    transaction_code: `WA-STATUS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    transaction_date: new Date(parseInt(timestamp) * 1000).toISOString(),
    total_amount: 0,
    organization_id: organizationId,
    smart_code: `HERA.COMM.WHATSAPP.STATUS.${statusType.toUpperCase()}.v1`,
    from_entity_id: originalTransaction.from_entity_id,
    to_entity_id: originalTransaction.to_entity_id,
    reference_entity_id: originalTransaction.id,
    metadata: {
      waba_message_id,
      status_type: statusType,
      recipient_phone: recipient_id,
      original_transaction_id: originalTransaction.id,
      timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
      errors: errors || null,
      pricing: pricing || null
    }
  }
  
  // Insert the status transaction
  const { data: newStatus, error: insertError } = await supabase
    .from('universal_transactions')
    .insert(statusTransaction)
    .select()
    .single()
  
  if (insertError) {
    throw new Error(`Failed to insert status transaction: ${insertError.message}`)
  }
  
  console.log('Created status transaction:', newStatus.id)
  
  // Update the original message transaction's metadata with the latest status
  const updatedMetadata = {
    ...originalTransaction.metadata,
    latest_status: statusType,
    latest_status_timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
    status_history: [
      ...(originalTransaction.metadata?.status_history || []),
      {
        status: statusType,
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
        transaction_id: newStatus.id
      }
    ]
  }
  
  // Add error information if present
  if (errors && errors.length > 0) {
    updatedMetadata.delivery_errors = errors
    updatedMetadata.delivery_failed = true
  }
  
  // Mark as successfully delivered if applicable
  if (statusType === 'delivered' || statusType === 'read') {
    updatedMetadata.delivery_successful = true
  }
  
  // Update the original transaction
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({ metadata: updatedMetadata })
    .eq('id', originalTransaction.id)
  
  if (updateError) {
    console.error(`Failed to update original transaction: ${updateError.message}`)
    // Continue processing, don't throw
  }
  
  // Create a relationship between the status transaction and the original message
  const relationship = {
    from_entity_id: newStatus.id,
    to_entity_id: originalTransaction.id,
    relationship_type: 'status_update_for',
    organization_id: organizationId,
    smart_code: 'HERA.COMM.WHATSAPP.REL.STATUS.v1',
    metadata: {
      status_type: statusType,
      timestamp: new Date(parseInt(timestamp) * 1000).toISOString()
    }
  }
  
  const { error: relError } = await supabase
    .from('core_relationships')
    .insert(relationship)
  
  if (relError) {
    console.error('Failed to create relationship:', relError)
    // Non-critical error, don't throw
  }
  
  console.log(`WhatsApp status update processed: ${statusType} for message ${waba_message_id}`)
}