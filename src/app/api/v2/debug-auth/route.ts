import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    
    return NextResponse.json({
      success: true,
      authResult,
      headers: {
        authorization: request.headers.get('authorization')?.substring(0, 50) + '...',
        'x-hera-api-version': request.headers.get('x-hera-api-version')
      },
      searchParams: Object.fromEntries(new URL(request.url).searchParams)
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}