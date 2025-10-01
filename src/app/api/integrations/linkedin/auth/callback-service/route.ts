import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Get organization ID from header, body, or use CivicFlow default
    const orgId =
      request.headers.get('X-Organization-Id') || body.organizationId || CIVICFLOW_ORG_ID

    console.log('LinkedIn auth callback SERVICE - orgId:', orgId)

    const isDemo = isDemoMode(orgId)

    // In demo mode, create simulated connector
    if (isDemo || body.demo) {
      try {
        // Create service role client that bypasses RLS
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
          throw new Error('Supabase service credentials not configured')
        }

        const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        // Create connector entity with service role
        const connectorData = {
          organization_id: orgId,
          entity_type: 'connector',
          entity_name: 'LinkedIn Integration',
          entity_code: `CONN-LINKEDIN-${Date.now()}`,
          smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.CONNECTOR.V1',
          status: 'active',
          metadata: {
            vendor: 'linkedin',
            demo_mode: true
          }
        }

        const { data: connector, error: connectorError } = await serviceSupabase
          .from('core_entities')
          .insert(connectorData)
          .select()
          .single()

        if (connectorError) {
          console.error('Connector creation error:', connectorError)
          throw new Error(`Failed to create connector: ${connectorError.message}`)
        }

        console.log('Created connector with service role:', connector)

        // Add dynamic fields
        const dynamicFields = [
          {
            organization_id: orgId,
            entity_id: connector.id,
            field_name: 'oauth_token',
            field_value_text: 'demo_token_••••••••',
            field_type: 'text',
            smart_code: 'HERA.PUBLICSECTOR.CRM.FIELD.OAUTH.TOKEN.V1'
            // is_encrypted: true  // Column doesn't exist, commented out
          },
          {
            organization_id: orgId,
            entity_id: connector.id,
            field_name: 'account_id',
            field_value_text: 'demo_org_12345',
            field_type: 'text',
            smart_code: 'HERA.PUBLICSECTOR.CRM.FIELD.ACCOUNT.ID.V1'
          },
          {
            organization_id: orgId,
            entity_id: connector.id,
            field_name: 'account_name',
            field_value_text: 'Demo Organization',
            field_type: 'text',
            smart_code: 'HERA.PUBLICSECTOR.CRM.FIELD.ACCOUNT.NAME.V1'
          },
          {
            organization_id: orgId,
            entity_id: connector.id,
            field_name: 'scopes',
            field_value_json: ['r_organization_social', 'w_organization_social'],
            field_type: 'json',
            smart_code: 'HERA.PUBLICSECTOR.CRM.FIELD.OAUTH.SCOPES.V1'
          },
          {
            organization_id: orgId,
            entity_id: connector.id,
            field_name: 'connection_status',
            field_value_text: 'active',
            field_type: 'text',
            smart_code: 'HERA.PUBLICSECTOR.CRM.FIELD.CONNECTION.STATUS.V1'
          }
        ]

        // Insert dynamic fields with service role
        const { error: fieldsError } = await serviceSupabase
          .from('core_dynamic_data')
          .insert(dynamicFields)

        if (fieldsError) {
          console.error('Dynamic fields error:', fieldsError)
          // Continue even if fields fail
        }

        // Create transaction for audit
        const transactionData = {
          organization_id: orgId,
          transaction_type: 'integration_auth',
          transaction_code: `AUTH-${Date.now()}`,
          smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.AUTHED.V1',
          source_entity_id: connector.id, // Changed from 'from_entity_id'
          total_amount: 0,
          status: 'completed',
          metadata: {
            vendor: 'linkedin',
            demo_mode: true,
            connector_id: connector.id
          }
        }

        const { data: transaction, error: txnError } = await serviceSupabase
          .from('universal_transactions')
          .insert(transactionData)
          .select()
          .single()

        if (txnError) {
          console.error('Transaction error:', txnError)
          // Continue even if transaction fails
        }

        // Add transaction line
        if (transaction) {
          const lineData = {
            organization_id: orgId,
            transaction_id: transaction.id,
            line_number: 1,
            line_type: 'auth',
            line_amount: 0,
            description: 'LinkedIn OAuth authentication completed',
            smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.LINE.AUTH.V1',
            metadata: {
              vendor: 'linkedin',
              demo_mode: true
            }
          }

          await serviceSupabase.from('universal_transaction_lines').insert(lineData)
        }

        return NextResponse.json({
          success: true,
          connector_id: connector.id,
          demo: true
        })
      } catch (error: any) {
        console.error('Error in service LinkedIn auth:', error)
        throw error
      }
    }

    // Production OAuth would be implemented here
    return NextResponse.json({ error: 'Production OAuth not implemented' }, { status: 501 })
  } catch (error: any) {
    console.error('LinkedIn auth error SERVICE:', error)
    return NextResponse.json(
      {
        error: 'Failed to authenticate with LinkedIn',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
