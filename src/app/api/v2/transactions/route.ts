import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-auth'
import { assertSmartCode } from '@/lib/universal/smartcode'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Auth verification
    const authResult = await verifyAuth(request)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    // Organization isolation enforcement
    const reqOrgId = body.organization_id
    if (!reqOrgId || reqOrgId !== authResult.organizationId) {
      return NextResponse.json({ error: 'forbidden', details: 'organization_id mismatch' }, { status: 403 })
    }

    // Validate and normalize smart code
    if (body.smart_code) {
      body.smart_code = assertSmartCode(body.smart_code)
    }
    
    // Validate line smart codes if present
    if (body.lines && Array.isArray(body.lines)) {
      body.lines = body.lines.map((line: any) => {
        if (line.smart_code) {
          line.smart_code = assertSmartCode(line.smart_code)
        }
        return line
      })
    }

    // Delegate based on action
    let universalPath: string
    if (action === 'reverse') {
      universalPath = '/api/v2/universal/txn-reverse'
    } else {
      universalPath = '/api/v2/universal/txn-emit'
    }

    const universalRequest = new NextRequest(
      new URL(universalPath, request.url),
      {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(body)
      }
    )

    if (action === 'reverse') {
      const { POST: universalHandler } = await import('../universal/txn-reverse/route')
      return await universalHandler(universalRequest)
    } else {
      const { POST: universalHandler } = await import('../universal/txn-emit/route')
      return await universalHandler(universalRequest)
    }

  } catch (error) {
    console.error('V2 transactions POST error:', error)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Auth verification
    const authResult = await verifyAuth(request)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('txn_id') || searchParams.get('transaction_id')
    const organizationId = searchParams.get('organization_id')

    // Organization isolation enforcement
    if (!organizationId || organizationId !== authResult.organizationId) {
      return NextResponse.json({ error: 'forbidden', details: 'organization_id mismatch' }, { status: 403 })
    }

    // Delegate based on whether we're reading specific transaction or querying
    let universalPath: string
    if (transactionId) {
      universalPath = '/api/v2/universal/txn-read'
    } else {
      universalPath = '/api/v2/universal/txn-query'
    }

    const universalRequest = new NextRequest(
      new URL(universalPath + '?' + searchParams.toString(), request.url),
      {
        method: 'GET',
        headers: request.headers
      }
    )

    if (transactionId) {
      const { GET: universalHandler } = await import('../universal/txn-read/route')
      return await universalHandler(universalRequest)
    } else {
      const { GET: universalHandler } = await import('../universal/txn-query/route')
      return await universalHandler(universalRequest)
    }

  } catch (error) {
    console.error('V2 transactions GET error:', error)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }
}