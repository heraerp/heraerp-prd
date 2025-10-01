import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Auth verification
    const authResult = await verifyAuth(request)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    // Organization isolation enforcement
    const reqOrgId = body.organization_id
    if (!reqOrgId || reqOrgId !== authResult.organizationId) {
      return NextResponse.json({ error: 'forbidden', details: 'organization_id mismatch' }, { status: 403 })
    }

    // Delegate to universal relationship-upsert handler
    const universalRequest = new NextRequest(
      new URL('/api/v2/universal/relationship-upsert', request.url),
      {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(body)
      }
    )

    const { POST: universalHandler } = await import('../universal/relationship-upsert/route')
    return await universalHandler(universalRequest)

  } catch (error) {
    console.error('V2 relationships POST error:', error)
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
    const relationshipId = searchParams.get('relationship_id')
    const organizationId = searchParams.get('organization_id')

    // Organization isolation enforcement
    if (!organizationId || organizationId !== authResult.organizationId) {
      return NextResponse.json({ error: 'forbidden', details: 'organization_id mismatch' }, { status: 403 })
    }

    // Delegate based on whether we're reading specific relationship or querying
    let universalPath: string
    if (relationshipId) {
      universalPath = '/api/v2/universal/relationship-read'
    } else {
      universalPath = '/api/v2/universal/relationship-query'
    }

    const universalRequest = new NextRequest(
      new URL(universalPath + '?' + searchParams.toString(), request.url),
      {
        method: 'GET',
        headers: request.headers
      }
    )

    if (relationshipId) {
      const { GET: universalHandler } = await import('../universal/relationship-read/route')
      return await universalHandler(universalRequest)
    } else {
      const { GET: universalHandler } = await import('../universal/relationship-query/route')
      return await universalHandler(universalRequest)
    }

  } catch (error) {
    console.error('V2 relationships GET error:', error)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Auth verification
    const authResult = await verifyAuth(request)
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const relationshipId = searchParams.get('relationship_id')
    const organizationId = searchParams.get('organization_id')

    // Organization isolation enforcement
    if (!organizationId || organizationId !== authResult.organizationId) {
      return NextResponse.json({ error: 'forbidden', details: 'organization_id mismatch' }, { status: 403 })
    }

    if (!relationshipId) {
      return NextResponse.json({ error: 'bad_request', details: 'relationship_id required' }, { status: 400 })
    }

    // Delegate to universal relationship-delete handler
    const universalRequest = new NextRequest(
      new URL('/api/v2/universal/relationship-delete?' + searchParams.toString(), request.url),
      {
        method: 'DELETE',
        headers: request.headers
      }
    )

    const { DELETE: universalHandler } = await import('../universal/relationship-delete/route')
    return await universalHandler(universalRequest)

  } catch (error) {
    console.error('V2 relationships DELETE error:', error)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }
}