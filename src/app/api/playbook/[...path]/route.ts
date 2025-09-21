import { NextRequest, NextResponse } from 'next/server'

const BASE = process.env.PLAYBOOK_BASE_URL
const KEY = process.env.PLAYBOOK_API_KEY

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(req, params)
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(req, params)
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(req, params)
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(req, params)
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handle(req, params)
}

async function handle(req: NextRequest, params: { path: string[] }) {
  // Check environment variables
  if (!BASE || !KEY) {
    return NextResponse.json(
      { error: 'Playbook configuration missing. Please check server environment variables.' },
      { status: 500 }
    )
  }

  try {
    // Build the target URL
    const subpath = '/' + (params.path?.join('/') || '')
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

    // Forward body for methods that support it
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      try {
        const body = await req.text()
        if (body) {
          init.body = body
        }
      } catch (e) {
        // No body to forward
      }
    }

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Playbook Proxy] ${req.method} ${url.pathname}${url.search}`)
    }

    // Make the upstream request
    const response = await fetch(url.toString(), init)

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
    return NextResponse.json({ error: 'Failed to proxy request to Playbook API' }, { status: 500 })
  }
}
