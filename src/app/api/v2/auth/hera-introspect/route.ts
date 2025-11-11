import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAuth } from '@/lib/auth/verify-auth'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * HERA Authorization Introspection API
 * Calls hera_auth_introspect_v1 to check user permissions and role
 * POST /api/v2/auth/hera-introspect
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { actor_user_id } = await request.json()

    if (!actor_user_id) {
      return NextResponse.json(
        { error: 'actor_user_id is required' },
        { status: 400 }
      )
    }

    // Call HERA authorization RPC
    const { data, error } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: actor_user_id
    })

    if (error) {
      console.error('HERA auth introspect error:', error)
      return NextResponse.json(
        { error: 'Authorization introspection failed', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      actor_user_id,
      authorization: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('HERA introspect API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}