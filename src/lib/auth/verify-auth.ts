/**
 * Simple auth verification for API routes
 */

import { NextRequest } from 'next/server'

export interface AuthUser {
  id: string
  email?: string
  organizationId?: string
}

/**
 * Verify authentication from request headers
 */
export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  // Get auth token from headers
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  
  // In a real implementation, this would verify the JWT token
  // For now, return a mock user to allow the app to build
  if (token) {
    return {
      id: 'mock-user-id',
      email: 'user@example.com',
      organizationId: request.headers.get('x-organization-id') || undefined
    }
  }
  
  return null
}

/**
 * Require authentication for an API route
 */
export function requireAuth(handler: (req: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (req: NextRequest) => {
    const user = await verifyAuth(req)
    
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    return handler(req, user)
  }
}