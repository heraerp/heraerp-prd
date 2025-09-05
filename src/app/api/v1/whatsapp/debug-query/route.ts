import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for full access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  console.log('[WhatsApp Debug Query] Starting debug query...');
  
  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[WhatsApp Debug Query] Missing Supabase credentials');
      return NextResponse.json({
        error: 'Missing Supabase configuration',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceRoleKey
        }
      }, { status: 500 });
    }

    // Create Supabase client with service role for full access
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('[WhatsApp Debug Query] Supabase client created');

    // Query 1: Get all WhatsApp messages
    const { data: allWhatsAppMessages, error: allError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .order('created_at', { ascending: false })
      .limit(20);

    if (allError) {
      console.error('[WhatsApp Debug Query] Error fetching all WhatsApp messages:', allError);
    } else {
      console.log(`[WhatsApp Debug Query] Found ${allWhatsAppMessages?.length || 0} total WhatsApp messages`);
    }

    // Query 2: Get messages containing "BOOK" in metadata
    const { data: bookMessages, error: bookError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .filter('metadata', 'cs', '{"message":"%BOOK%"}')
      .order('created_at', { ascending: false })
      .limit(10);

    if (bookError) {
      console.error('[WhatsApp Debug Query] Error fetching BOOK messages:', bookError);
    }

    // Query 3: Get messages with any text containing "BOOK" (broader search)
    const { data: broadBookMessages, error: broadError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .or('metadata.ilike.%BOOK%,notes.ilike.%BOOK%,transaction_code.ilike.%BOOK%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (broadError) {
      console.error('[WhatsApp Debug Query] Error in broad BOOK search:', broadError);
    }

    // Query 4: Get distinct organization IDs used
    const { data: orgData, error: orgError } = await supabase
      .from('universal_transactions')
      .select('organization_id')
      .eq('transaction_type', 'whatsapp_message')
      .not('organization_id', 'is', null);

    const uniqueOrgs = orgData ? [...new Set(orgData.map(d => d.organization_id))] : [];

    // Process and format the results
    const formatMessage = (msg: any) => {
      let parsedMetadata = {};
      try {
        parsedMetadata = msg.metadata || {};
        if (typeof parsedMetadata === 'string') {
          parsedMetadata = JSON.parse(parsedMetadata);
        }
      } catch (e) {
        console.error('[WhatsApp Debug Query] Error parsing metadata:', e);
      }

      return {
        id: msg.id,
        created_at: msg.created_at,
        organization_id: msg.organization_id,
        transaction_code: msg.transaction_code,
        notes: msg.notes,
        metadata: parsedMetadata,
        metadata_raw: msg.metadata,
        containsBook: JSON.stringify(msg).toUpperCase().includes('BOOK')
      };
    };

    // Prepare detailed response
    const response = {
      summary: {
        totalWhatsAppMessages: allWhatsAppMessages?.length || 0,
        messagesWithBookInMetadata: bookMessages?.length || 0,
        messagesWithBookAnywhere: broadBookMessages?.length || 0,
        uniqueOrganizations: uniqueOrgs.length,
        organizationIds: uniqueOrgs
      },
      allWhatsAppMessages: allWhatsAppMessages?.slice(0, 10).map(formatMessage) || [],
      bookMessagesInMetadata: bookMessages?.map(formatMessage) || [],
      bookMessagesAnywhere: broadBookMessages?.map(formatMessage) || [],
      queryDetails: {
        timestamp: new Date().toISOString(),
        environment: {
          hasSupabaseUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceRoleKey,
          nodeEnv: process.env.NODE_ENV
        },
        queries: {
          allMessages: {
            sql: "SELECT * FROM universal_transactions WHERE transaction_type = 'whatsapp_message' ORDER BY created_at DESC LIMIT 20",
            error: allError
          },
          bookInMetadata: {
            sql: "SELECT * FROM universal_transactions WHERE transaction_type = 'whatsapp_message' AND metadata::text LIKE '%BOOK%' ORDER BY created_at DESC LIMIT 10",
            error: bookError
          },
          bookAnywhere: {
            sql: "SELECT * FROM universal_transactions WHERE transaction_type = 'whatsapp_message' AND (metadata::text ILIKE '%BOOK%' OR notes ILIKE '%BOOK%' OR transaction_code ILIKE '%BOOK%') ORDER BY created_at DESC LIMIT 10",
            error: broadError
          }
        }
      },
      sampleMetadata: allWhatsAppMessages?.length > 0 ? {
        firstMessage: allWhatsAppMessages[0],
        metadataStructure: typeof allWhatsAppMessages[0]?.metadata
      } : null
    };

    console.log('[WhatsApp Debug Query] Debug query complete:', JSON.stringify(response.summary, null, 2));

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('[WhatsApp Debug Query] Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}