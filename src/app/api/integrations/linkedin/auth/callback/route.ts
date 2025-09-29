import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode } from '@/lib/demo-guard'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const isDemo = isDemoMode(orgId)
    const body = await request.json()

    // In demo mode, create simulated connector
    if (isDemo || body.demo) {
      const connectorData = {
        entity_type: 'connector',
        entity_name: 'LinkedIn Integration',
        entity_code: `CONN-LINKEDIN-${Date.now()}`,
        smart_code: 'HERA.INTEGRATION.CONNECTOR.LINKEDIN.v1',
        organization_id: orgId
      }

      // Create connector entity
      const entityResponse = await fetch(
        `${request.nextUrl.origin}/api/v2/universal/entity-upsert`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-Id': orgId
          },
          body: JSON.stringify(connectorData)
        }
      )

      if (!entityResponse.ok) {
        throw new Error('Failed to create connector entity')
      }

      const entityResult = await entityResponse.json()
      const connectorId = entityResult.data.id

      // Add demo dynamic data
      const dynamicFields = [
        {
          entity_id: connectorId,
          field_name: 'oauth_token',
          field_value_text: 'demo_token_••••••••',
          is_encrypted: true,
          smart_code: 'HERA.INTEGRATION.FIELD.OAUTH_TOKEN.v1'
        },
        {
          entity_id: connectorId,
          field_name: 'account_id',
          field_value_text: 'demo_org_12345',
          smart_code: 'HERA.INTEGRATION.FIELD.ACCOUNT_ID.v1'
        },
        {
          entity_id: connectorId,
          field_name: 'account_name',
          field_value_text: 'Demo Organization',
          smart_code: 'HERA.INTEGRATION.FIELD.ACCOUNT_NAME.v1'
        },
        {
          entity_id: connectorId,
          field_name: 'scopes',
          field_value_json: ['r_organization_social', 'w_organization_social'],
          smart_code: 'HERA.INTEGRATION.FIELD.SCOPES.v1'
        }
      ]

      // Store dynamic data via direct Supabase calls for simplicity
      for (const field of dynamicFields) {
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.SUPABASE_SERVICE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
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
            vendor: 'linkedin',
            demo_mode: true
          }
        })
      })

      return NextResponse.json({
        success: true,
        connector_id: connectorId,
        demo: true
      })
    }

    // Production OAuth would be implemented here
    return NextResponse.json({ error: 'Production OAuth not implemented' }, { status: 501 })
  } catch (error) {
    console.error('LinkedIn auth error:', error)
    return NextResponse.json({ error: 'Failed to authenticate with LinkedIn' }, { status: 500 })
  }
}
