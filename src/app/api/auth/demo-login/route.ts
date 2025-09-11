import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const DEMO_CREDENTIALS = {
  email: 'demo@keralafurniture.com',
  password: 'FurnitureDemo2025!',
  organizationId: 'f0af4ced-9d12-4a55-a649-b484368db249'
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
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    // Set a cookie to indicate demo login
    const response = NextResponse.json({
      success: true,
      user: data.user,
      redirectUrl: '/furniture'
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}