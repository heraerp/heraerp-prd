import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  // Test message storage directly
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '44d2d8f8-167d-46a7-a704-c0e5435863d6'
  
  // Get a conversation to test with
  const { data: conversation } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'whatsapp_conversation')
    .eq('organization_id', organizationId)
    .limit(1)
    .single()
  
  if (!conversation) {
    return NextResponse.json({ error: 'No conversation found' })
  }
  
  // Try to store a test message
  const testMessage = {
    organization_id: organizationId,
    transaction_type: 'whatsapp_message',
    transaction_code: `MSG-DEBUG-${Date.now()}`,
    transaction_date: new Date().toISOString(),
    total_amount: 0,
    source_entity_id: conversation.id,
    target_entity_id: null,
    smart_code: 'HERA.WHATSAPP.MSG.INBOUND.v1',
    metadata: {
      message_id: 'debug_msg_' + Date.now(),
      text: 'Debug test message',
      direction: 'inbound',
      timestamp: new Date().toISOString()
    }
  }
  
  const { data, error } = await supabase
    .from('universal_transactions')
    .insert(testMessage)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      details: error,
      attempted_data: testMessage
    })
  }
  
  return NextResponse.json({
    status: 'success',
    message: 'Test message stored successfully',
    stored_id: data.id,
    conversation_used: conversation.id
  })
}