import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode } from '@/lib/demo-guard'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const isDemo = isDemoMode(orgId)
    const body = await request.json()

    // Create connector entity
    const connectorData = {
      entity_type: 'connector',
      entity_name: 'BlueSky Integration',
      entity_code: `CONN-BLUESKY-${Date.now()}`,
      smart_code: 'HERA.INTEGRATION.CONNECTOR.BLUESKY.v1',
      organization_id: orgId
    }

    const entityResponse = await fetch(`${request.nextUrl.origin}/api/v2/universal/entity-upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId
      },
      body: JSON.stringify(connectorData)
    })

    if (!entityResponse.ok) {
      throw new Error('Failed to create connector entity')
    }

    const entityResult = await entityResponse.json()
    const connectorId = entityResult.data.id

    // Store credentials
    const dynamicFields = [
      {
        entity_id: connectorId,
        field_name: 'oauth_token',
        field_value_text: isDemo ? 'demo_app_password_••••••••' : body.code,
        is_encrypted: true,
        smart_code: 'HERA.INTEGRATION.FIELD.OAUTH_TOKEN.v1'
      },
      {
        entity_id: connectorId,
        field_name: 'account_name',
        field_value_text: isDemo ? 'demo.bsky.social' : 'user.bsky.social',
        smart_code: 'HERA.INTEGRATION.FIELD.ACCOUNT_NAME.v1'
      }
    ]

    // Store dynamic data
    for (const field of dynamicFields) {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          ...field,
          organization_id: orgId
        })
      })
    }

    // Emit AUTH transaction
    await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId
      },
      body: JSON.stringify({
        smart_code: 'HERA.INTEGRATION.CONNECTOR.AUTHED.v1',
        metadata: {
          connector_id: connectorId,
          vendor: 'bluesky',
          demo_mode: isDemo
        }
      })
    })

    return NextResponse.json({
      success: true,
      connector_id: connectorId,
      demo: isDemo
    })
  } catch (error) {
    console.error('BlueSky auth error:', error)
    return NextResponse.json({ error: 'Failed to authenticate with BlueSky' }, { status: 500 })
  }
}
