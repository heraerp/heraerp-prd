import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '44d2d8f8-167d-46a7-a704-c0e5435863d6'
  
  try {
    // Step 1: Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'whatsapp_conversation')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (convError || !conversation) {
      return NextResponse.json({ 
        error: 'No conversation found',
        details: convError 
      })
    }
    
    // Step 2: Try to insert a test message
    const testMessage = {
      organization_id: organizationId,
      transaction_type: 'whatsapp_message',
      transaction_code: `MSG-TEST-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      source_entity_id: conversation.id,
      smart_code: 'HERA.WHATSAPP.MSG.INBOUND.v1',
      metadata: {
        message_id: `test_${Date.now()}`,
        text: 'Test message to check storage',
        direction: 'inbound',
        timestamp: new Date().toISOString()
      }
    }
    
    console.log('Attempting to store:', JSON.stringify(testMessage, null, 2))
    
    const { data: stored, error: storeError } = await supabase
      .from('universal_transactions')
      .insert(testMessage)
      .select()
      .single()
    
    if (storeError) {
      console.error('Storage error:', storeError)
      return NextResponse.json({
        status: 'error',
        message: 'Failed to store message',
        error_details: storeError,
        attempted_data: testMessage,
        possible_issues: [
          'Check if all required fields exist in universal_transactions',
          'Check if source_entity_id foreign key is valid',
          'Check if RLS policies allow insert',
          'Check if service role has proper permissions'
        ]
      })
    }
    
    // Step 3: Try to read it back
    const { data: messages, error: readError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)
    
    return NextResponse.json({
      status: 'success',
      test_result: {
        message_stored: true,
        stored_id: stored.id,
        conversation_used: conversation.id,
        total_messages: messages?.length || 0,
        recent_messages: messages
      }
    })
    
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      status: 'exception',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}