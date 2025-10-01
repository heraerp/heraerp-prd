import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { isDemoMode } from '@/lib/demo-guard'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get organization ID from header, body, or use CivicFlow default
    const orgId = request.headers.get('X-Organization-Id') 
      || body.organizationId 
      || CIVICFLOW_ORG_ID
      
    console.log('LinkedIn auth callback V2 - orgId:', orgId)
    
    // Set the organization context for universal API
    universalApi.setOrganizationId(orgId)
    
    const isDemo = isDemoMode(orgId)

    // In demo mode, create simulated connector
    if (isDemo || body.demo) {
      try {
        // Create connector entity using universal API
        const connector = await universalApi.createEntity({
          entity_type: 'connector',
          entity_name: 'LinkedIn Integration',
          entity_code: `CONN-LINKEDIN-${Date.now()}`,
          smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.CONNECTOR.V1'
        })
        
        console.log('Created connector:', connector)
        
        if (!connector.id) {
          throw new Error('No connector ID returned')
        }

        // Add demo dynamic data
        const dynamicFields = [
          {
            field_name: 'oauth_token',
            field_value_text: 'demo_token_••••••••',
            is_encrypted: true
          },
          {
            field_name: 'account_id',
            field_value_text: 'demo_org_12345'
          },
          {
            field_name: 'account_name',
            field_value_text: 'Demo Organization'
          },
          {
            field_name: 'scopes',
            field_value_json: ['r_organization_social', 'w_organization_social']
          },
          {
            field_name: 'status',
            field_value_text: 'active'
          }
        ]

        // Store dynamic fields
        for (const field of dynamicFields) {
          try {
            await universalApi.setDynamicField(
              connector.id,
              field.field_name,
              field.field_value_text || field.field_value_json,
              {
                is_encrypted: field.is_encrypted,
                field_type: field.field_value_json ? 'json' : 'text'
              }
            )
          } catch (fieldError) {
            console.error(`Error setting field ${field.field_name}:`, fieldError)
          }
        }

        // Create auth transaction
        try {
          await universalApi.createTransaction({
            transaction_type: 'integration_auth',
            smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.AUTHED.V1',
            from_entity_id: connector.id,
            metadata: {
              vendor: 'linkedin',
              demo_mode: true,
              connector_id: connector.id
            },
            line_items: [{
              line_number: 1,
              line_type: 'auth',
              description: 'LinkedIn OAuth authentication completed',
              metadata: {
                vendor: 'linkedin',
                demo_mode: true
              }
            }]
          })
        } catch (txnError) {
          console.error('Error creating transaction:', txnError)
        }

        return NextResponse.json({
          success: true,
          connector_id: connector.id,
          demo: true
        })
        
      } catch (error: any) {
        console.error('Error creating connector:', error)
        throw error
      }
    }

    // Production OAuth would be implemented here
    return NextResponse.json({ error: 'Production OAuth not implemented' }, { status: 501 })
    
  } catch (error: any) {
    console.error('LinkedIn auth error V2:', error)
    return NextResponse.json({ 
      error: 'Failed to authenticate with LinkedIn',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}