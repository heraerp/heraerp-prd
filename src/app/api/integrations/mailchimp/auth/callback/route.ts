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
        entity_name: 'Mailchimp Integration',
        entity_code: `CONN-MAILCHIMP-${Date.now()}`,
        smart_code: 'HERA.INTEGRATION.CONNECTOR.MAILCHIMP.v1',
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
          field_value_text: 'demo_account_12345',
          smart_code: 'HERA.INTEGRATION.FIELD.ACCOUNT_ID.v1'
        },
        {
          entity_id: connectorId,
          field_name: 'account_name',
          field_value_text: 'Demo Mailchimp Account',
          smart_code: 'HERA.INTEGRATION.FIELD.ACCOUNT_NAME.v1'
        },
        {
          entity_id: connectorId,
          field_name: 'scopes',
          field_value_json: ['read', 'write'],
          smart_code: 'HERA.INTEGRATION.FIELD.SCOPES.v1'
        }
      ]

      // Store dynamic data
      for (const field of dynamicFields) {
        await fetch(`${request.nextUrl.origin}/api/v2/universal/entity-upsert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-Id': orgId
          },
          body: JSON.stringify({
            entity_type: 'dynamic_field',
            ...field
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
            vendor: 'mailchimp',
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

    // Production OAuth flow
    const { code, state } = body

    if (!code) {
      return NextResponse.json({ error: 'Authorization code required' }, { status: 400 })
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://login.mailchimp.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.MAILCHIMP_CLIENT_ID!,
        client_secret: process.env.MAILCHIMP_CLIENT_SECRET!,
        redirect_uri: process.env.MAILCHIMP_REDIRECT_URI!,
        code
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()

    // Get account info
    const metadataResponse = await fetch('https://login.mailchimp.com/oauth2/metadata', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    })

    if (!metadataResponse.ok) {
      throw new Error('Failed to fetch account metadata')
    }

    const metadata = await metadataResponse.json()

    // Create or update connector
    const connectorData = {
      entity_type: 'connector',
      entity_name: `Mailchimp - ${metadata.accountname}`,
      entity_code: `CONN-MAILCHIMP-${metadata.user_id}`,
      smart_code: 'HERA.INTEGRATION.CONNECTOR.MAILCHIMP.v1',
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

    // Store OAuth tokens and metadata as dynamic data
    const dynamicFields = [
      {
        entity_id: connectorId,
        field_name: 'oauth_token',
        field_value_text: tokenData.access_token,
        is_encrypted: true,
        smart_code: 'HERA.INTEGRATION.FIELD.OAUTH_TOKEN.v1'
      },
      {
        entity_id: connectorId,
        field_name: 'oauth_refresh_token',
        field_value_text: tokenData.refresh_token,
        is_encrypted: true,
        smart_code: 'HERA.INTEGRATION.FIELD.OAUTH_REFRESH_TOKEN.v1'
      },
      {
        entity_id: connectorId,
        field_name: 'oauth_expires_at',
        field_value_text: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        smart_code: 'HERA.INTEGRATION.FIELD.OAUTH_EXPIRES_AT.v1'
      },
      {
        entity_id: connectorId,
        field_name: 'account_id',
        field_value_text: metadata.user_id,
        smart_code: 'HERA.INTEGRATION.FIELD.ACCOUNT_ID.v1'
      },
      {
        entity_id: connectorId,
        field_name: 'account_name',
        field_value_text: metadata.accountname,
        smart_code: 'HERA.INTEGRATION.FIELD.ACCOUNT_NAME.v1'
      },
      {
        entity_id: connectorId,
        field_name: 'api_endpoint',
        field_value_text: metadata.api_endpoint,
        smart_code: 'HERA.INTEGRATION.FIELD.API_ENDPOINT.v1'
      },
      {
        entity_id: connectorId,
        field_name: 'scopes',
        field_value_json: tokenData.scope ? tokenData.scope.split(' ') : ['read', 'write'],
        smart_code: 'HERA.INTEGRATION.FIELD.SCOPES.v1'
      }
    ]

    // Store dynamic data
    for (const field of dynamicFields) {
      await fetch(`${request.nextUrl.origin}/api/v2/universal/entity-upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          entity_type: 'dynamic_field',
          ...field
        })
      })
    }

    // Emit AUTHED transaction
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
          vendor: 'mailchimp',
          account_id: metadata.user_id,
          account_name: metadata.accountname
        }
      })
    })

    return NextResponse.json({
      success: true,
      connector_id: connectorId
    })
  } catch (error) {
    console.error('Mailchimp auth error:', error)
    return NextResponse.json({ error: 'Failed to authenticate with Mailchimp' }, { status: 500 })
  }
}
