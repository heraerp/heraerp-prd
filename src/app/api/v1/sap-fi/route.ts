import { NextRequest, NextResponse } from 'next/server'
import { SAPIntegrationService } from '@/lib/sap-fi/integration-service'
import { SAPConnectorFactory } from '@/lib/sap-fi/connectors/factory'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authorization.split(' ')[1]
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Get user and organization
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, ...params } = body

    let result: any

    switch (action) {
      case 'post_transaction':
        result = await SAPIntegrationService.postTransaction(params.transaction_id)
        break

      case 'post_batch':
        result = await SAPIntegrationService.postBatch(params.transaction_ids)
        break

      case 'sync_master_data':
        result = await SAPIntegrationService.syncMasterData(
          params.organization_id,
          params.entity_type
        )
        break

      case 'get_posting_status':
        result = await SAPIntegrationService.getPostingStatus(params.transaction_id)
        break

      case 'test_connection':
        result = await SAPConnectorFactory.testConnection(params.organization_id)
        break

      case 'configure_sap':
        result = await configureSAP(supabase, params)
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('SAP FI API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    let result: any

    switch (action) {
      case 'get_config':
        result = await getSAPConfig(organizationId)
        break

      case 'get_posting_queue':
        result = await getPostingQueue(organizationId)
        break

      case 'get_error_log':
        result = await getErrorLog(organizationId)
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('SAP FI API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
async function configureSAP(supabase: any, params: any) {
  const { organization_id, system_type, base_url, credentials, company_code, chart_of_accounts } = params

  // Store configuration in core_dynamic_data
  const configFields = [
    { field_name: 'sap_system_type', field_value_text: system_type },
    { field_name: 'sap_url', field_value_text: base_url },
    { field_name: 'company_code', field_value_text: company_code },
    { field_name: 'chart_of_accounts', field_value_text: chart_of_accounts },
    { field_name: 'credentials', field_value_json: credentials }
  ]

  for (const field of configFields) {
    await supabase
      .from('core_dynamic_data')
      .upsert({
        organization_id,
        entity_id: organization_id,
        field_name: field.field_name,
        field_value_text: field.field_value_text,
        field_value_json: field.field_value_json,
        smart_code: 'HERA.ERP.FI.CONFIG.v1'
      }, {
        onConflict: 'organization_id,entity_id,field_name'
      })
  }

  // Test connection
  const testResult = await SAPConnectorFactory.testConnection(organization_id)

  return {
    success: testResult.success,
    message: testResult.success ? 'SAP configuration saved and tested successfully' : 'Configuration saved but connection test failed',
    system_info: testResult.systemInfo,
    error: testResult.error
  }
}

async function getSAPConfig(organizationId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data: configData, error } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_text, field_value_json')
    .eq('organization_id', organizationId)
    .eq('smart_code', 'HERA.ERP.FI.CONFIG.v1')

  if (error) {
    throw error
  }

  const config: any = {}
  configData?.forEach(field => {
    if (field.field_name !== 'credentials') {
      config[field.field_name] = field.field_value_text || field.field_value_json
    }
  })

  return {
    configured: configData && configData.length > 0,
    config
  }
}

async function getPostingQueue(organizationId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data: transactions, error } = await supabase
    .from('universal_transactions')
    .select(`
      id,
      transaction_code,
      transaction_date,
      transaction_type,
      total_amount,
      transaction_status,
      smart_code,
      metadata,
      created_at
    `)
    .eq('organization_id', organizationId)
    .like('smart_code', 'HERA.ERP.FI.%')
    .in('transaction_status', ['pending', 'validated', 'posting'])
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    throw error
  }

  return {
    total: transactions?.length || 0,
    transactions: transactions || []
  }
}

async function getErrorLog(organizationId: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data: errors, error } = await supabase
    .from('core_dynamic_data')
    .select(`
      entity_id,
      field_value_text,
      field_value_json,
      created_at
    `)
    .eq('organization_id', organizationId)
    .eq('field_name', 'sap_posting_error')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw error
  }

  return {
    total: errors?.length || 0,
    errors: errors?.map(e => ({
      transaction_id: e.entity_id,
      error_message: e.field_value_text,
      error_details: e.field_value_json,
      occurred_at: e.created_at
    })) || []
  }
}