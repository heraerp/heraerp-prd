/**
 * Debug version to test Edge Function deployment
 */

import { serve } from "https://deno.land/std@0.202.0/http/server.ts";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method.toUpperCase();
  
  return json(200, {
    message: "Debug endpoint working",
    path: url.pathname,
    method,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers.entries())
  });
}

serve(handle);