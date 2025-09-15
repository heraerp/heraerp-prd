import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    // Check recent WhatsApp messages stored in universal tables
    const { data: recentMessages, error } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('field_name', 'whatsapp_message')
      .order('created_at', { ascending: false })
      .limit(10)

    // Check for WhatsApp conversations (stored as entities)
    const { data: conversations } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'whatsapp_conversation')
      .order('updated_at', { ascending: false })
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
      message:
        'If recent_messages is empty, webhook may not be receiving messages. Check Meta Business Manager webhook subscription.'
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check WhatsApp status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
