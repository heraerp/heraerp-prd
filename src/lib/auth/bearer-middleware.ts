/**
 * Bearer token authentication middleware
 * Verifies JWT tokens from Authorization header
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export interface AuthContext {
  actor_user_id: string
  org_id: string | null
  scopes: string[]
  email?: string
  isAuthenticated: boolean
}

/**
 * Extract and verify Bearer token from request
 */
export async function authenticateBearer(req: NextRequest): Promise<AuthContext> {
  const authHeader = req.headers.get('authorization') || ''
  
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }

  const token = authHeader.slice(7) // Remove 'Bearer '
  
  // Verify token using Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Error(`Invalid token: ${error?.message || 'User not found'}`)
  }

  // Extract organization from token metadata or headers
  const orgId = user.user_metadata?.organization_id || 
                req.headers.get('x-organization-id') || 
                req.headers.get('x-orgid') || 
                null

  return {
    actor_user_id: user.id,
    org_id: orgId,
    scopes: user.user_metadata?.scopes?.split(' ') || ['read', 'write'],
    email: user.email,
    isAuthenticated: true
  }
}

/**
 * Middleware wrapper for API routes
 */
export function withBearerAuth<T = any>(
  handler: (req: NextRequest, auth: AuthContext) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      // Add CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://heraerp.com',
        'Access-Control-Allow-Headers': 'content-type, authorization, x-organization-id, x-orgid',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'false', // No cookies needed
        'Vary': 'Origin'
      }

      // Handle OPTIONS preflight
      if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders })
      }

      // Authenticate request
      const auth = await authenticateBearer(req)
      
      // Call handler with auth context
      const response = await handler(req, auth)
      
      // Add CORS headers to response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response

    } catch (error: any) {
      const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://heraerp.com',
        'Access-Control-Allow-Headers': 'content-type, authorization, x-organization-id',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'false',
        'Vary': 'Origin'
      }

      return new Response(
        JSON.stringify({
          error: 'Authentication failed',
          message: error.message,
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      )
    }
  }
}

/**
 * Optional: Legacy cookie fallback (for gradual migration)
 */
export async function authenticateWithFallback(req: NextRequest): Promise<AuthContext> {
  try {
    // Try Bearer token first
    return await authenticateBearer(req)
  } catch (bearerError) {
    // TODO: Add cookie fallback if needed for Track A
    throw bearerError
  }
}