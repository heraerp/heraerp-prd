import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// Map smart codes to canonical field names
function getFieldNameFromSmartCode(smartCode: string): string {
  // Service-specific mappings (match RPC function expectations)
  const mappings: Record<string, string> = {
    // Primary mappings - what the RPC function expects
    'HERA.SALON.SERVICE.CATALOG.PRICE.V1': 'service.base_price',
    'HERA.SALON.SERVICE.CATALOG.TAX.V1': 'service.tax',
    'HERA.SALON.SERVICE.CATALOG.COMMISSION.V1': 'service.commission',
    'HERA.SALON.SERVICE.CATALOG.DURATION.V1': 'service.duration_min',
    'HERA.SALON.SERVICE.CATALOG.CATEGORY.V1': 'service.category',
    // Support lowercase versions
    'HERA.SALON.SERVICE.CATALOG.PRICE.V1': 'service.base_price',
    'HERA.SALON.SERVICE.CATALOG.TAX.V1': 'service.tax',
    'HERA.SALON.SERVICE.CATALOG.COMMISSION.V1': 'service.commission',
    'HERA.SALON.SERVICE.CATALOG.DURATION.V1': 'service.duration_min',
    'HERA.SALON.SERVICE.CATALOG.CATEGORY.V1': 'service.category',
    // Also support DYN versions for future compatibility
    'HERA.SALON.SERVICE.DYN.PRICE.V1': 'service.base_price',
    'HERA.SALON.SERVICE.DYN.TAX.V1': 'service.tax',
    'HERA.SALON.SERVICE.DYN.COMMISSION.V1': 'service.commission',
    'HERA.SALON.SERVICE.DYN.DURATION.V1': 'service.duration_min',
    'HERA.SALON.SERVICE.DYN.CATEGORY.V1': 'service.category',
    'HERA.SALON.SERVICE.DYN.PRICE.V1': 'service.base_price',
    'HERA.SALON.SERVICE.DYN.TAX.V1': 'service.tax',
    'HERA.SALON.SERVICE.DYN.COMMISSION.V1': 'service.commission',
    'HERA.SALON.SERVICE.DYN.DURATION.V1': 'service.duration_min',
    'HERA.SALON.SERVICE.DYN.CATEGORY.V1': 'service.category'
  }

  // Return mapped field name or extract from smart code
  return mappings[smartCode] || smartCode.split('.').slice(-2)[0].toLowerCase()
}

function orgFrom(req: NextRequest) {
  const org =
    req.nextUrl.searchParams.get('organization_id') ||
    req.headers.get('x-hera-org') ||
    req.cookies.get('HERA_ORG_ID')?.value ||
    req.cookies.get('hera-organization-id')?.value ||
    null
  return org && /^[0-9a-f-]{36}$/i.test(org) ? org : null
}

type UpsertRow = {
  entity_id: string
  smart_code: string
  data: any
}

export async function POST(req: NextRequest) {
  try {
    const orgId = orgFrom(req)
    if (!orgId) return NextResponse.json({ error: 'organization_id required' }, { status: 400 })

    const body = await req.json()

    // Accept both:
    // 1) { entity_id, smart_code, data }
    // 2) { smart_code, rows: [{ entity_id, data }, ...] }
    let rows: UpsertRow[] = []

    if (Array.isArray(body.rows) && body.smart_code) {
      rows = body.rows.map((r: any) => ({
        entity_id: r.entity_id,
        smart_code: body.smart_code,
        data: r.data
      }))
    } else if (body.entity_id && body.smart_code && body.data !== undefined) {
      rows = [{ entity_id: body.entity_id, smart_code: body.smart_code, data: body.data }]
    } else {
      return NextResponse.json(
        {
          error:
            'Invalid payload. Provide (entity_id, smart_code, data) or { smart_code, rows:[{entity_id,data}] }'
        },
        { status: 400 }
      )
    }

    // Add org and prepare payload with proper field mapping
    const payload = rows.map(r => {
      const base = {
        organization_id: orgId,
        entity_id: r.entity_id,
        smart_code: r.smart_code, // Include smart_code in the payload
        field_name: getFieldNameFromSmartCode(r.smart_code), // Map smart code to canonical field name
        field_type: 'json', // Default to json for complex objects
        field_value_json: null as any,
        field_value_text: null as string | null,
        field_value_number: null as number | null,
        field_value_boolean: null as boolean | null,
        field_value_date: null as string | null
      }

      // Map data to appropriate field based on type
      if (typeof r.data === 'object' && r.data !== null) {
        base.field_type = 'json'
        base.field_value_json = r.data
      } else if (typeof r.data === 'string') {
        base.field_type = 'text'
        base.field_value_text = r.data
      } else if (typeof r.data === 'number') {
        base.field_type = 'number'
        base.field_value_number = r.data
      } else if (typeof r.data === 'boolean') {
        base.field_type = 'boolean'
        base.field_value_boolean = r.data
      }

      return base
    })

    // First try to delete existing records to avoid constraint issues
    for (const record of payload) {
      await supa.from('core_dynamic_data').delete().match({
        organization_id: record.organization_id,
        entity_id: record.entity_id,
        field_name: record.field_name
      })
    }

    // Then insert new records
    const { data, error } = await supa
      .from('core_dynamic_data')
      .insert(payload)
      .select(
        'entity_id, field_name, field_value_json, field_value_text, field_value_number, field_value_boolean, field_value_date'
      )

    if (error) throw error

    // Return Playbook-ish confirmation
    return NextResponse.json({ ok: true, updated: data?.length ?? 0, items: data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'dynamic_data.upsert failed' }, { status: 500 })
  }
}
