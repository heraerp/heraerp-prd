import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '44d2d8f8-167d-46a7-a704-c0e5435863d6'
  
  try {
    // Get the latest 20 messages
    const { data: messages, error } = await supabase
      .from('universal_transactions')
      .select('*, source_entity:source_entity_id(entity_name, entity_code, metadata)')
      .eq('transaction_type', 'whatsapp_message')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Format messages
    const formattedMessages = messages?.map(msg => ({
      id: msg.id,
      text: msg.metadata?.text || '',
      direction: msg.source_entity_id ? 'inbound' : 'outbound',
      phone: msg.source_entity?.metadata?.phone || msg.source_entity?.entity_code?.replace('WA-', '') || 'Unknown',
      created_at: msg.created_at,
      timestamp: new Date(msg.created_at).toLocaleString()
    })) || []
    
    // Get total count
    const { count } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('transaction_type', 'whatsapp_message')
      .eq('organization_id', organizationId)
    
    return NextResponse.json({
      status: 'success',
      total: count || 0,
      messages: formattedMessages,
      latest: formattedMessages[0] || null
    })
    
  } catch (error) {
    console.error('Latest messages error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}