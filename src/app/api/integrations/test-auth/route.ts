import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const orgId = request.headers.get('X-Organization-Id')
  const searchParams = request.nextUrl.searchParams
  
  return NextResponse.json({
    headers: {
      'X-Organization-Id': orgId,
      'Content-Type': request.headers.get('Content-Type'),
    },
    searchParams: Object.fromEntries(searchParams),
    timestamp: new Date().toISOString(),
    environment: {
      LINKEDIN_CLIENT_ID: !!process.env.LINKEDIN_CLIENT_ID,
      LINKEDIN_CLIENT_SECRET: !!process.env.LINKEDIN_CLIENT_SECRET,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    fixes: {
      orgIdSource: orgId ? 'header' : 'would use CIVICFLOW_ORG_ID fallback',
      currentOrgId: orgId || '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id')
    const body = await request.json().catch(() => ({}))
    
    return NextResponse.json({
      success: true,
      received: {
        orgId,
        body,
        headers: Object.fromEntries(request.headers.entries()),
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}