// HERA Outbox Worker - Webhook Delivery System
// Smart Code: HERA.PLATFORM.INTEGRATION.OUTBOX.WORKER.v1
// 
// Processes outbox events and delivers webhooks to external systems
// Handles retry logic, DLQ, and webhook signing

import { serve } from "https://deno.land/std@0.202.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface OutboxEvent {
  id: string;
  organization_id: string;
  topic: string;
  smart_code: string;
  payload: any;
  attempts: number;
  max_attempts: number;
  next_retry_at: string;
  status: 'pending' | 'delivered' | 'failed' | 'dlq';
  created_at: string;
  updated_at: string;
}

interface WebhookConfig {
  id: string;
  organization_id: string;
  url: string;
  secret: string;
  topics: string[];
  retry_policy: {
    max_attempts: number;
    backoff_factor: number;
    initial_delay_ms: number;
  };
  is_active: boolean;
}

// ---------- Utilities ----------
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requestId() {
  return crypto.randomUUID();
}

// ---------- HMAC Webhook Signing ----------
async function generateHMACSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  
  return `sha256=${hashHex}`;
}

// ---------- Webhook Delivery ----------
async function deliverWebhook(
  event: OutboxEvent,
  webhook: WebhookConfig,
  supabaseAdmin: ReturnType<typeof createClient>
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  try {
    const payload = JSON.stringify({
      id: event.id,
      organization_id: event.organization_id,
      topic: event.topic,
      smart_code: event.smart_code,
      data: event.payload,
      timestamp: event.created_at
    });
    
    // Generate HMAC signature
    const signature = await generateHMACSignature(payload, webhook.secret);
    
    // Deliver webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HERA-Webhook/1.0',
        'X-HERA-SIGNATURE': signature,
        'X-HERA-ORG-ID': event.organization_id,
        'X-HERA-EVENT-CODE': event.smart_code,
        'X-HERA-TOPIC': event.topic
      },
      body: payload
    });
    
    // Log delivery attempt
    await supabaseAdmin.rpc('hera_webhook_delivery_log_v1', {
      p_event_id: event.id,
      p_webhook_id: webhook.id,
      p_organization_id: event.organization_id,
      p_status_code: response.status,
      p_response_body: await response.text(),
      p_attempt_number: event.attempts + 1,
      p_delivery_duration_ms: 0 // TODO: Calculate actual duration
    });
    
    if (response.status >= 200 && response.status < 300) {
      return { success: true, statusCode: response.status };
    } else {
      return { 
        success: false, 
        error: `HTTP ${response.status}`, 
        statusCode: response.status 
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// ---------- Retry Logic ----------
function calculateNextRetry(
  attempts: number, 
  retryPolicy: WebhookConfig['retry_policy']
): Date {
  const backoffMs = retryPolicy.initial_delay_ms * Math.pow(retryPolicy.backoff_factor, attempts);
  const maxBackoff = 60 * 60 * 1000; // 1 hour max
  const actualBackoff = Math.min(backoffMs, maxBackoff);
  
  return new Date(Date.now() + actualBackoff);
}

// ---------- Process Outbox ----------
async function processOutboxEvents(supabaseAdmin: ReturnType<typeof createClient>) {
  const rid = requestId();
  console.log(`🔄 Processing outbox events [${rid}]`);
  
  try {
    // Get pending outbox events
    const { data: events, error: eventsError } = await supabaseAdmin
      .rpc('hera_outbox_get_pending_v1', {
        p_limit: 100
      });
      
    if (eventsError) {
      console.error('❌ Failed to get pending events:', eventsError);
      return;
    }
    
    if (!events || events.length === 0) {
      console.log('✅ No pending events to process');
      return;
    }
    
    console.log(`📦 Processing ${events.length} outbox events`);
    
    for (const event of events) {
      await processSingleEvent(event, supabaseAdmin);
    }
    
  } catch (error) {
    console.error('❌ Outbox processing failed:', error);
  }
}

async function processSelectEvent(
  event: OutboxEvent,
  supabaseAdmin: ReturnType<typeof createClient>
) {
  console.log(`📤 Processing event ${event.id} (${event.topic})`);
  
  try {
    // Get webhook configurations for this organization and topic
    const { data: webhooks, error: webhooksError } = await supabaseAdmin
      .rpc('hera_webhook_get_by_topic_v1', {
        p_organization_id: event.organization_id,
        p_topic: event.topic
      });
      
    if (webhooksError) {
      console.error(`❌ Failed to get webhooks for event ${event.id}:`, webhooksError);
      return;
    }
    
    if (!webhooks || webhooks.length === 0) {
      console.log(`⚠️ No webhooks configured for topic ${event.topic} in org ${event.organization_id}`);
      // Mark event as delivered since there are no webhooks to deliver to
      await supabaseAdmin.rpc('hera_outbox_update_status_v1', {
        p_event_id: event.id,
        p_status: 'delivered',
        p_attempts: event.attempts
      });
      return;
    }
    
    let allDelivered = true;
    let anyFailed = false;
    
    // Deliver to each configured webhook
    for (const webhook of webhooks) {
      if (!webhook.is_active) continue;
      
      const result = await deliverWebhook(event, webhook, supabaseAdmin);
      
      if (result.success) {
        console.log(`✅ Delivered event ${event.id} to webhook ${webhook.id}`);
      } else {
        console.log(`❌ Failed to deliver event ${event.id} to webhook ${webhook.id}: ${result.error}`);
        allDelivered = false;
        anyFailed = true;
      }
    }
    
    // Update event status
    const newAttempts = event.attempts + 1;
    
    if (allDelivered) {
      // All webhooks delivered successfully
      await supabaseAdmin.rpc('hera_outbox_update_status_v1', {
        p_event_id: event.id,
        p_status: 'delivered',
        p_attempts: newAttempts
      });
    } else if (newAttempts >= event.max_attempts) {
      // Max attempts reached, move to DLQ
      await supabaseAdmin.rpc('hera_outbox_update_status_v1', {
        p_event_id: event.id,
        p_status: 'dlq',
        p_attempts: newAttempts
      });
      console.log(`🚨 Event ${event.id} moved to DLQ after ${newAttempts} attempts`);
    } else {
      // Schedule retry
      const nextRetry = calculateNextRetry(newAttempts, {
        max_attempts: event.max_attempts,
        backoff_factor: 2,
        initial_delay_ms: 5000
      });
      
      await supabaseAdmin.rpc('hera_outbox_schedule_retry_v1', {
        p_event_id: event.id,
        p_attempts: newAttempts,
        p_next_retry_at: nextRetry.toISOString()
      });
      
      console.log(`⏰ Event ${event.id} scheduled for retry at ${nextRetry.toISOString()}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing event ${event.id}:`, error);
  }
}

// Corrected function name
async function processSingleEvent(
  event: OutboxEvent,
  supabaseAdmin: ReturnType<typeof createClient>
) {
  return processSelectEvent(event, supabaseAdmin);
}

// ---------- Main Handler ----------
async function handle(req: Request) {
  const url = new URL(req.url);
  
  // Health check
  if (url.pathname === "/outbox-worker/health") {
    return json(200, {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  }
  
  // Process outbox (manual trigger or cron)
  if (url.pathname === "/outbox-worker/process" && req.method === "POST") {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    await processOutboxEvents(supabaseAdmin);
    
    return json(200, {
      message: "Outbox processing completed",
      timestamp: new Date().toISOString()
    });
  }
  
  // Get outbox stats (for monitoring)
  if (url.pathname === "/outbox-worker/stats" && req.method === "GET") {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: stats } = await supabaseAdmin.rpc('hera_outbox_get_stats_v1');
    
    return json(200, {
      stats,
      timestamp: new Date().toISOString()
    });
  }
  
  return json(404, { error: "not_found" });
}

serve(handle);