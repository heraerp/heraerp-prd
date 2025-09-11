import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Simple log checker to see recent webhook activity
export async function GET(request: NextRequest) {
  const logs = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY: process.env.RAILWAY_ENVIRONMENT || 'not_railway',
      hasSupabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasWhatsApp: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
    },
    recentActivity: {
      last5Minutes: [],
      last30Minutes: [],
      organizationIds: []
    }
  }

  try {
    if (logs.environment.hasSupabase) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Get messages from last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data: recent5, error: error5 } = await supabase
        .from('universal_transactions')
        .select('id, created_at, transaction_code, metadata')
        .eq('transaction_type', 'whatsapp_message')
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })

      if (!error5 && recent5) {
        logs.recentActivity.last5Minutes = recent5.map(m => ({
          id: m.id,
          created_at: m.created_at,
          text: (m.metadata as any)?.text || (m.metadata as any)?.content || 'No text',
          from: (m.metadata as any)?.wa_id || 'Unknown',
          has_book: ((m.metadata as any)?.text || '').toUpperCase().includes('BOOK')
        }))
      }

      // Get messages from last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      const { data: recent30, error: error30 } = await supabase
        .from('universal_transactions')
        .select('id, created_at, transaction_code, metadata, organization_id')
        .eq('transaction_type', 'whatsapp_message')
        .gte('created_at', thirtyMinutesAgo)
        .order('created_at', { ascending: false })

      if (!error30 && recent30) {
        logs.recentActivity.last30Minutes = recent30.map(m => ({
          id: m.id,
          created_at: m.created_at,
          text: (m.metadata as any)?.text || (m.metadata as any)?.content || 'No text',
          from: (m.metadata as any)?.wa_id || 'Unknown',
          org_id: m.organization_id,
          has_book: ((m.metadata as any)?.text || '').toUpperCase().includes('BOOK')
        }))

        // Get unique organization IDs
        logs.recentActivity.organizationIds = [...new Set(recent30.map(m => m.organization_id))]
      }
    }

    // Add recent console logs if available
    logs.consoleOutput = {
      note: 'Check Railway dashboard logs for webhook POST requests',
      lookFor: [
        '🔔 WhatsApp webhook received',
        '💬 Message received:',
        '🎯 BOOK MESSAGE DETECTED',
        'Webhook error:'
      ]
    }

    // Add troubleshooting guide
    logs.troubleshooting = {
      noMessages: [
        '1. Verify webhook URL in Meta: https://heraerp.com/api/v1/whatsapp/webhook',
        '2. Check webhook is subscribed to "messages" field in Meta Business Manager',
        '3. Ensure phone number verification is not expired',
        '4. Try sending from a number that has NOT messaged before',
        '5. Check Railway logs for any webhook POST requests'
      ],
      bookNotWorking: [
        '1. Message might be delayed - WhatsApp can take 1-2 minutes',
        '2. Check if organization_id matches: e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
        '3. Verify webhook handler is looking for correct text field',
        '4. Try sending just "BOOK" without any other text'
      ]
    }

    return NextResponse.json(logs, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error: any) {
    logs.error = {
      message: error.message || 'Unknown error',
      stack: error.stack
    }
    return NextResponse.json(logs, { status: 200 })
  }
}