import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      URL_PREFIX: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) || 'not set'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Just echo back what we received
    return NextResponse.json({
      success: true,
      received: {
        body,
        headers: {
          'X-Organization-Id': request.headers.get('X-Organization-Id'),
          'Content-Type': request.headers.get('Content-Type')
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}