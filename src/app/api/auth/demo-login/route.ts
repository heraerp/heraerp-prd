import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Updated to use salon demo since furniture demo was removed
const DEMO_CREDENTIALS = {
  email: 'demo@hairtalkz.com', 
  password: 'SalonDemo2025!',
  organizationId: 'hair-talkz-demo-org-id' // Updated for salon demo
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Sign in with demo credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Set a cookie to indicate demo login
    const response = NextResponse.json({
      success: true,
      user: data.user,
      redirectUrl: '/salon' // Updated to salon demo
    })

    // Set a custom cookie to bypass organization checks
    response.cookies.set('demo_login', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    console.error('Demo login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
