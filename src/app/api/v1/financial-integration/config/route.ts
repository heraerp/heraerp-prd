import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: configData, error } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json')
      .eq('organization_id', organizationId)
      .eq('smart_code', 'HERA.ERP.FI.CONFIG.V1')

    if (error) throw error

    const config: any = {}
    configData?.forEach(field => {
      if (field.field_name !== 'credentials') {
        config[field.field_name] = field.field_value_text || field.field_value_json
      }
    })

    return NextResponse.json({
      configured: configData && configData.length > 0,
      config
    })
  } catch (error: any) {
    console.error('Config API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organization_id,
      systemType,
      baseUrl,
      companyCode,
      chartOfAccounts,
      credentials,
      features
    } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Store configuration in core_dynamic_data
    const configFields = [
      { field_name: 'system_type', field_value_text: systemType },
      { field_name: 'base_url', field_value_text: baseUrl },
      { field_name: 'company_code', field_value_text: companyCode },
      { field_name: 'chart_of_accounts', field_value_text: chartOfAccounts },
      { field_name: 'features', field_value_json: features },
      { field_name: 'credentials', field_value_json: credentials }
    ]

    for (const field of configFields) {
      const { error } = await supabase.from('core_dynamic_data').upsert(
        {
          organization_id,
          entity_id: organization_id,
          field_name: field.field_name,
          field_value_text: field.field_value_text,
          field_value_json: field.field_value_json,
          smart_code: 'HERA.ERP.FI.CONFIG.V1'
        },
        {
          onConflict: 'organization_id,entity_id,field_name'
        }
      )

      if (error) throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully'
    })
  } catch (error: any) {
    console.error('Config save error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
