import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    deployment: 'Railway',
    checks: {
      env_vars: {},
      database: {},
      whatsapp: {},
      recent_webhooks: {}
    }
  }

  // Check environment variables
  diagnostics.checks.env_vars = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    DEFAULT_ORGANIZATION_ID: process.env.DEFAULT_ORGANIZATION_ID || 'NOT SET',
    WHATSAPP_ACCESS_TOKEN: !!process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || 'NOT SET',
    WHATSAPP_WEBHOOK_TOKEN: !!process.env.WHATSAPP_WEBHOOK_TOKEN,
    NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'NOT SET'
  }

  // Test database connection
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      // Test query
      const { data, error } = await supabase
        .from('core_organizations')
        .select('id, organization_name')
        .limit(1)

      diagnostics.checks.database = {
        connected: !error,
        error: error?.message || null,
        test_query: !!data,
        organizations_found: data?.length || 0
      }

      // Check for recent WhatsApp messages
      if (!error) {
        const orgId = process.env.DEFAULT_ORGANIZATION_ID || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
        
        const { data: messages, error: msgError } = await supabase
          .from('universal_transactions')
          .select('id, transaction_code, created_at, metadata')
          .eq('transaction_type', 'whatsapp_message')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(5)

        diagnostics.checks.recent_webhooks = {
          organization_id: orgId,
          query_success: !msgError,
          error: msgError?.message || null,
          message_count: messages?.length || 0,
          latest_message: messages?.[0] ? {
            id: messages[0].id,
            created_at: messages[0].created_at,
            text: messages[0].metadata?.text || messages[0].metadata?.content,
            from: messages[0].metadata?.wa_id
          } : null
        }

        // Check for messages containing "BOOK"
        const { data: bookMessages, error: bookError } = await supabase
          .from('universal_transactions')
          .select('id, created_at, metadata')
          .eq('transaction_type', 'whatsapp_message')
          .eq('organization_id', orgId)
          .ilike('metadata->text', '%BOOK%')
          .order('created_at', { ascending: false })
          .limit(5)

        diagnostics.checks.book_messages = {
          query_success: !bookError,
          error: bookError?.message || null,
          found: bookMessages?.length || 0,
          messages: bookMessages?.map(m => ({
            id: m.id,
            created_at: m.created_at,
            text: (m.metadata as any)?.text,
            from: (m.metadata as any)?.wa_id
          })) || []
        }
      }
    } else {
      diagnostics.checks.database = {
        connected: false,
        error: 'Missing database configuration'
      }
    }
  } catch (dbError: any) {
    diagnostics.checks.database = {
      connected: false,
      error: dbError.message || 'Database connection failed'
    }
  }

  // Test WhatsApp API access
  try {
    if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      const whatsappResponse = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,code_verification_status,quality_rating`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
          }
        }
      )

      if (whatsappResponse.ok) {
        const phoneData = await whatsappResponse.json()
        diagnostics.checks.whatsapp = {
          api_accessible: true,
          phone_number: phoneData.display_phone_number,
          business_name: phoneData.verified_name,
          verification_status: phoneData.code_verification_status,
          quality_rating: phoneData.quality_rating
        }
      } else {
        const errorData = await whatsappResponse.json()
        diagnostics.checks.whatsapp = {
          api_accessible: false,
          error: errorData.error?.message || 'API request failed'
        }
      }
    } else {
      diagnostics.checks.whatsapp = {
        api_accessible: false,
        error: 'Missing WhatsApp configuration'
      }
    }
  } catch (waError: any) {
    diagnostics.checks.whatsapp = {
      api_accessible: false,
      error: waError.message || 'WhatsApp API check failed'
    }
  }

  // Add webhook URL info
  diagnostics.webhook_info = {
    expected_url: 'https://heraerp.com/api/v1/whatsapp/webhook',
    verify_token: process.env.WHATSAPP_WEBHOOK_TOKEN ? 'SET' : 'NOT SET',
    instructions: [
      'Ensure webhook URL is configured in Meta Business Manager',
      'Verify token must match exactly',
      'Subscribe to "messages" webhook field',
      'Check Railway logs for webhook POST requests'
    ]
  }

  // Add troubleshooting tips
  diagnostics.troubleshooting = {
    if_no_messages: [
      'Check Railway logs for any errors when webhook is called',
      'Ensure organization_id in webhook handler matches DEFAULT_ORGANIZATION_ID',
      'Verify Supabase RLS policies allow webhook to insert data',
      'Check if webhook is receiving POST requests in Railway logs'
    ],
    if_database_error: [
      'Verify NEXT_PUBLIC_SUPABASE_URL is correct',
      'Ensure SUPABASE_SERVICE_ROLE_KEY has proper permissions',
      'Check if Supabase project is active and accessible'
    ],
    if_whatsapp_error: [
      'Regenerate WhatsApp access token if expired',
      'Verify phone number ID matches your WhatsApp Business account',
      'Check if WhatsApp Business verification is active'
    ]
  }

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}

// Also support POST for testing webhook simulation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Simulate what the webhook handler would do
    const orgId = process.env.DEFAULT_ORGANIZATION_ID || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
    
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )

      // Try to insert a test message
      const { data, error } = await supabase
        .from('universal_transactions')
        .insert({
          transaction_type: 'whatsapp_message',
          transaction_code: `TEST-${Date.now()}`,
          organization_id: orgId,
          smart_code: 'HERA.TEST.DIAGNOSTIC.v1',
          transaction_date: new Date().toISOString(),
          total_amount: 0,
          metadata: {
            test: true,
            source: 'diagnostic_endpoint',
            body: body,
            timestamp: new Date().toISOString()
          }
        })
        .select()

      return NextResponse.json({
        success: !error,
        message: error ? 'Failed to insert test message' : 'Test message inserted successfully',
        error: error?.message || null,
        data: data?.[0] || null,
        organization_id: orgId
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Database not configured',
        organization_id: orgId
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Error in diagnostic test',
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}