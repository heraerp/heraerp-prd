import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode } from '@/lib/demo-guard'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Eventbrite OAuth error:', error)
      return NextResponse.redirect(
        new URL(
          `/civicflow/communications/integrations?error=${encodeURIComponent(error)}`,
          request.url
        )
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/civicflow/communications/integrations?error=missing_params', request.url)
      )
    }

    // Parse state to get organization ID
    const orgId = state || CIVICFLOW_ORG_ID
    const isDemo = isDemoMode(orgId)

    // In demo mode, simulate successful connection
    if (isDemo) {
      // Create connector entity
      const connectorData = {
        entity_type: 'integration_connector',
        entity_name: 'Eventbrite - Demo Account',
        entity_code: `CONN-EVENTBRITE-${Date.now()}`,
        smart_code: 'HERA.INTEGRATION.CONNECTOR.EVENTBRITE.V1',
        organization_id: orgId
      }

      const connectorResponse = await fetch(
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

      if (connectorResponse.ok) {
        const connectorResult = await connectorResponse.json()
        const connectorId = connectorResult.data.id

        // Add dynamic data
        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            entity_id: connectorId,
            field_name: 'vendor',
            field_value_text: 'eventbrite',
            organization_id: orgId
          })
        })

        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            entity_id: connectorId,
            field_name: 'status',
            field_value_text: 'connected',
            organization_id: orgId
          })
        })

        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            entity_id: connectorId,
            field_name: 'account_info',
            field_value_json: {
              name: 'Demo Organization',
              email: 'demo@eventbrite.com',
              user_id: 'demo-user-123'
            },
            organization_id: orgId
          })
        })

        await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            entity_id: connectorId,
            field_name: 'connected_at',
            field_value_text: new Date().toISOString(),
            organization_id: orgId
          })
        })

        // Emit connection event
        await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-Id': orgId
          },
          body: JSON.stringify({
            smart_code: 'HERA.INTEGRATION.CONNECTOR.CONNECTED.V1',
            metadata: {
              connector_id: connectorId,
              vendor: 'eventbrite',
              account_name: 'Demo Organization'
            }
          })
        })
      }

      return NextResponse.redirect(
        new URL('/civicflow/communications/integrations?success=eventbrite', request.url)
      )
    }

    // In production, would exchange code for access token
    // For now, redirect back with error
    return NextResponse.redirect(
      new URL(
        '/civicflow/communications/integrations?error=production_not_implemented',
        request.url
      )
    )
  } catch (error) {
    console.error('Eventbrite callback error:', error)
    return NextResponse.redirect(
      new URL('/civicflow/communications/integrations?error=callback_failed', request.url)
    )
  }
}
