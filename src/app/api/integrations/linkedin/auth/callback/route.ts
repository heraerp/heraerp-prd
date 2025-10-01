import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode } from '@/lib/demo-guard'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get organization ID from header, body, or use CivicFlow default
    const orgId = request.headers.get('X-Organization-Id') 
      || body.organizationId 
      || CIVICFLOW_ORG_ID
      
    console.log('LinkedIn auth callback - orgId:', orgId)
    const isDemo = isDemoMode(orgId)

    // In demo mode, create simulated connector
    if (isDemo || body.demo) {
      console.log('Creating LinkedIn connector with orgId:', orgId, 'type:', typeof orgId)
      
      const connectorData = {
        entity_type: 'connector',
        entity_name: 'LinkedIn Integration',
        entity_code: `CONN-LINKEDIN-${Date.now()}`,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.CONNECTOR.V1',
        organization_id: orgId
      }
      
      console.log('Connector data:', connectorData)

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
        const errorData = await entityResponse.json()
        console.error('Entity creation failed:', errorData)
        throw new Error(`Failed to create connector entity: ${JSON.stringify(errorData)}`)
      }

      const entityResult = await entityResponse.json()
      const connectorId = entityResult.entity_id

      // Add demo dynamic data
      const dynamicFields = [
        {
          entity_id: connectorId,
          field_name: 'oauth_token',
          field_value_text: 'demo_token_••••••••',
          is_encrypted: true,
          smart_code: 'HERA.PUBLICSECTOR.CRM.FIELD.OAUTH.TOKEN.V1'
        },
        {
          entity_id: connectorId,
          field_name: 'account_id',
          field_value_text: 'demo_org_12345',
          smart_code: 'HERA.PUBLICSECTOR.CRM.FIELD.ACCOUNT.ID.V1'
        },
        {
          entity_id: connectorId,
          field_name: 'account_name',
          field_value_text: 'Demo Organization',
          smart_code: 'HERA.PUBLICSECTOR.CRM.FIELD.ACCOUNT.NAME.V1'
        },
        {
          entity_id: connectorId,
          field_name: 'scopes',
          field_value_json: ['r_organization_social', 'w_organization_social'],
          smart_code: 'HERA.PUBLICSECTOR.CRM.FIELD.OAUTH.SCOPES.V1'
        }
      ]

      // Store dynamic data via direct Supabase calls for simplicity
      console.log('Storing dynamic fields for connector:', connectorId)
      
      for (const field of dynamicFields) {
        try {
          const fieldData = {
            ...field,
            organization_id: orgId
          }
          
          const fieldResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify(fieldData)
          })
          
          if (!fieldResponse.ok) {
            const fieldError = await fieldResponse.text()
            console.error(`Failed to create dynamic field ${field.field_name}:`, fieldError)
          }
        } catch (fieldError) {
          console.error('Error creating dynamic field:', fieldError)
        }
      }

      // Emit AUTH transaction
      await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          organization_id: orgId,
          transaction_type: 'integration_auth',
          smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.AUTHED.V1',
          transaction_date: new Date().toISOString(),
          source_entity_id: connectorId,
          business_context: {
            vendor: 'linkedin',
            demo_mode: true
          },
          lines: [{
            line_number: 1,
            line_type: 'auth',
            description: 'LinkedIn OAuth authentication completed',
            metadata: {
              connector_id: connectorId,
              vendor: 'linkedin',
              demo_mode: true
            }
          }]
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
  } catch (error: any) {
    console.error('LinkedIn auth error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      orgId,
      body
    })
    return NextResponse.json({ 
      error: 'Failed to authenticate with LinkedIn',
      details: error.message 
    }, { status: 500 })
  }
}
