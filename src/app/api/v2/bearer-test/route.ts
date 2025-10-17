/**
 * Test endpoint for Bearer token authentication
 * GET /api/v2/bearer-test
 */

import { NextRequest } from 'next/server';
import { withBearerAuth } from '@/lib/auth/bearer-middleware';

export const GET = withBearerAuth(async (req: NextRequest, auth) => {
  // This handler receives authenticated context
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Bearer authentication working!',
      auth: {
        user_id: auth.actor_user_id,
        email: auth.email,
        org_id: auth.org_id,
        scopes: auth.scopes
      },
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
});

export const POST = withBearerAuth(async (req: NextRequest, auth) => {
  const body = await req.json();
  
  return new Response(
    JSON.stringify({
      success: true,
      message: 'POST with Bearer auth successful',
      received: body,
      auth: {
        user_id: auth.actor_user_id,
        email: auth.email,
        org_id: auth.org_id
      }
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
});