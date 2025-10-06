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
      return NextResponse.json(
        { error: 'forbidden', details: 'organization_id mismatch' },
        { status: 403 }
      )
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

    const universalRequest = new NextRequest(new URL(universalPath, request.url), {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(body)
    })

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
      console.error('[Transactions GET] Auth failed:', { authResult })
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('txn_id') || searchParams.get('transaction_id')
    // Support both p_ prefixed and non-prefixed parameters (like entities endpoint)
    const organizationId = searchParams.get('p_organization_id') || searchParams.get('organization_id')

    // Organization isolation enforcement
    if (!organizationId || organizationId !== authResult.organizationId) {
      console.error('[Transactions GET] Organization mismatch:', {
        requestOrgId: organizationId,
        jwtOrgId: authResult.organizationId,
        userId: authResult.id,
        userEmail: authResult.email,
        match: organizationId === authResult.organizationId
      })
      return NextResponse.json(
        {
          error: 'forbidden',
          details: 'organization_id mismatch',
          requested: organizationId,
          jwt: authResult.organizationId,
          user: authResult.email,
          help: 'The organization_id in your request does not match your JWT token. Please login with a user that belongs to the correct organization.'
        },
        { status: 403 }
      )
    }

    // Delegate based on whether we're reading specific transaction or querying
    if (transactionId) {
      // Delegate to txn-read (GET)
      const universalPath = '/api/v2/universal/txn-read'
      const universalRequest = new NextRequest(
        new URL(universalPath + '?' + searchParams.toString(), request.url),
        {
          method: 'GET',
          headers: request.headers
        }
      )
      const { GET: universalHandler } = await import('../universal/txn-read/route')
      return await universalHandler(universalRequest)
    } else {
      // Delegate to txn-query (POST) - convert GET params to POST body
      const universalPath = '/api/v2/universal/txn-query'

      // Build POST body from query parameters
      const body: any = {
        organization_id: organizationId
      }

      // Extract all supported query parameters and add to body
      const transactionType = searchParams.get('p_transaction_type') || searchParams.get('transaction_type')
      const sourceEntityId = searchParams.get('p_source_entity_id') || searchParams.get('source_entity_id')
      const targetEntityId = searchParams.get('p_target_entity_id') || searchParams.get('target_entity_id')
      const smartCodeLike = searchParams.get('p_smart_code_like') || searchParams.get('smart_code_like')
      const dateFrom = searchParams.get('p_date_from') || searchParams.get('date_from')
      const dateTo = searchParams.get('p_date_to') || searchParams.get('date_to')
      const limit = searchParams.get('p_limit') || searchParams.get('limit')
      const offset = searchParams.get('p_offset') || searchParams.get('offset')
      const includeLines = searchParams.get('p_include_lines') || searchParams.get('include_lines')

      if (transactionType) body.transaction_type = transactionType
      if (sourceEntityId) body.source_entity_id = sourceEntityId
      if (targetEntityId) body.target_entity_id = targetEntityId
      if (smartCodeLike) body.smart_code_like = smartCodeLike
      if (dateFrom) body.date_from = dateFrom
      if (dateTo) body.date_to = dateTo
      if (limit) body.limit = parseInt(limit)
      if (offset) body.offset = parseInt(offset)
      if (includeLines) body.include_lines = includeLines === 'true'

      const universalRequest = new NextRequest(new URL(universalPath, request.url), {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(body)
      })

      const { POST: universalHandler } = await import('../universal/txn-query/route')
      return await universalHandler(universalRequest)
    }
  } catch (error) {
    console.error('V2 transactions GET error:', error)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }
}
