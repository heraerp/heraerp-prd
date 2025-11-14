// Minimal HERA API v2 Gateway - Test Deployment
// Smart Code: HERA.API.V2.GATEWAY.MINIMAL.v1

import { serve } from "https://deno.land/std@0.202.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const rid = crypto.randomUUID();
  
  console.log(`[${rid.slice(0, 8)}] ${req.method} ${url.pathname}`);

  // Health check endpoint
  if (url.pathname.endsWith("/api/v2/health")) {
    return json(200, {
      status: "healthy",
      version: "2.3.0-minimal",
      timestamp: new Date().toISOString(),
      rid
    });
  }

  // Gateway test endpoint
  if (url.pathname.endsWith("/api/v2/gateway/test")) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    try {
      const { data, error } = await supabase.rpc("check_gateway_enforcement_status");
      
      if (error) {
        return json(500, { 
          error: "gateway_test_failed", 
          details: error.message,
          rid 
        });
      }
      
      return json(200, {
        gateway_status: "operational",
        version: "v2.3.0-minimal",
        enforcement_test: data,
        rid
      });
    } catch (e) {
      return json(500, {
        error: "gateway_test_error",
        details: String(e),
        rid
      });
    }
  }

  return json(404, { error: "not_found", rid });
}

// Handle CORS
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Organization-Id',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  return null;
}

async function handler(req: Request): Promise<Response> {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    return await handle(req);
  } catch (error) {
    console.error('Request failed:', error);
    return json(500, { error: 'internal_error', detail: String(error) });
  }
}

console.log('🚀 HERA API v2 Gateway (Minimal) starting...');
serve(handler);