import { NextRequest, NextResponse } from 'next/server'

const BASE = process.env.PLAYBOOK_BASE_URL
const KEY = process.env.PLAYBOOK_API_KEY

// Security: Path allowlist
const ALLOWED_PATHS = [
  '/entities',
  '/universal_transactions',
  '/universal_transaction_lines',
  '/dynamic_data',
  '/core_organizations',
  '/core_entities',
  '/core_relationships',
  '/v1/salon/appointments', // Legacy endpoints
]

// Security: Body size limit (1MB)
const MAX_BODY_SIZE = 1024 * 1024

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handle(req, props)
}

export async function POST(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handle(req, props)
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handle(req, props)
}

export async function PUT(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handle(req, props)
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return handle(req, props)
}

async function handle(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  // Await params as required by Next.js 15
  const { path } = await params
  const subpath = '/' + (path?.join('/') || '')
  
  // Check if this is a local compat endpoint (bypass proxy)
  const localEndpoints = ['/entities', '/dynamic_data', '/transactions', '/relationships']
  if (localEndpoints.some(ep => subpath.startsWith(ep))) {
    // Local endpoints handle these directly, return 404 here
    return new NextResponse('Not Found', { status: 404 })
  }
  
  // Check environment variables for proxy mode
  if (!BASE || !KEY) {
    return NextResponse.json(
      { error: 'Playbook proxy not configured. Use local endpoints instead.' },
      { status: 500 }
    )
  }

  try {
    // Build the target URL
    
    // Security: Validate path is allowed
    const isAllowed = ALLOWED_PATHS.some(allowed => 
      subpath === allowed || 
      subpath.startsWith(allowed + '/') ||
      subpath.startsWith(allowed + '?')
    )
    
    if (!isAllowed) {
      console.error(`[Playbook Proxy] Blocked unauthorized path: ${subpath}`)
      return NextResponse.json(
        { error: 'Access to this resource is not allowed.' },
        { status: 403 }
      )
    }
    
    const url = new URL(subpath, BASE)

    // Forward query parameters
    req.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })

    // Prepare request options
    const init: RequestInit = {
      method: req.method,
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': req.headers.get('content-type') || 'application/json'
      },
      cache: 'no-store'
    }

    // Get correlation ID from headers
    const correlationId = req.headers.get('x-correlation-id') || `proxy_${Date.now()}`
    init.headers = {
      ...init.headers,
      'X-Correlation-ID': correlationId
    }
    
    // Forward body for methods that support it
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      try {
        // Security: Check body size
        const contentLength = req.headers.get('content-length')
        if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
          return NextResponse.json(
            { error: 'Request body too large' },
            { status: 413 }
          )
        }
        
        const body = await req.text()
        if (body) {
          init.body = body
        }
      } catch (e) {
        // No body to forward
      }
    }

    // Log for debugging
    console.log(`[Playbook Proxy] [${correlationId}] ${req.method} ${url.pathname}${url.search}`, {
      hasBody: !!init.body
    })

    // Make the upstream request
    const response = await fetch(url.toString(), init)
    
    console.log(`[Playbook Proxy] [${correlationId}] Response ${response.status}`)

    // Get the response body
    const responseText = await response.text()

    // Return proxied response
    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json'
      }
    })
  } catch (error) {
    console.error('[Playbook Proxy] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to proxy request to Playbook API' },
      { status: 500 }
    )
  }
}
