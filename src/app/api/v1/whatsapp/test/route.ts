import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Check recent webhook logs stored in the database
    const { data: recentMessages, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Check for recent conversations
    const { data: conversations } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(5)
    
    // Check environment variables
    const config = {
      webhook_token_set: !!process.env.WHATSAPP_WEBHOOK_TOKEN,
      access_token_set: !!process.env.WHATSAPP_ACCESS_TOKEN,
      phone_number_id_set: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      business_account_id_set: !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      organization_id_set: !!process.env.DEFAULT_ORGANIZATION_ID
    }
    
    return NextResponse.json({
      status: 'WhatsApp Integration Test Endpoint',
      config,
      recent_messages: recentMessages || [],
      recent_conversations: conversations || [],
      webhook_url: 'https://heraerp.com/api/v1/whatsapp/webhook',
      verify_token: 'hera-whatsapp-webhook-2024-secure-token',
      message: 'If recent_messages is empty, webhook may not be receiving messages. Check Meta Business Manager webhook subscription.'
    })
    
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ 
      error: 'Failed to check WhatsApp status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}