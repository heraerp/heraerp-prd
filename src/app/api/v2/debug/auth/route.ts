import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Debug endpoint to check auth headers
 * GET /api/v2/debug/auth
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return NextResponse.json({
      error: 'No Authorization header',
      headers: Object.fromEntries(request.headers.entries())
    })
  }

  const token = authHeader.replace('Bearer ', '')

  // Try to get user from token
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return NextResponse.json({
      error: 'Invalid token',
      details: error?.message,
      token: token.substring(0, 20) + '...'
    })
  }

  return NextResponse.json({
    success: true,
    userId: user.id,
    email: user.email,
    organizationId: user.user_metadata?.organization_id,
    hasOrganizationId: !!user.user_metadata?.organization_id
  })
}
