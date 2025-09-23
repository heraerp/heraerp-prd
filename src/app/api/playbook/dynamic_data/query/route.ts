import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

export async function POST(req: NextRequest) {
  try {
    const rid = `pb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const body = await req.json()

    const { organization_id, smart_code, entity_ids = [], limit = 1000 } = body || {}

    if (!organization_id || !smart_code || !Array.isArray(entity_ids)) {
      return NextResponse.json(
        { error: 'organization_id, smart_code and entity_ids[] are required', rid },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('core_dynamic_data')
      .select(
        [
          'entity_id',
          'field_name',
          'field_type',
          'field_value_json',
          'field_value_number',
          'field_value_text',
          'field_value_boolean',
          'field_value_date',
          'calculated_value',
          'smart_code',
          'smart_code_status',
          'validation_status',
          'updated_at'
        ].join(',')
      )
      .eq('organization_id', organization_id)
      .eq('smart_code', smart_code)
      .in('entity_id', entity_ids)
      .limit(limit)

    if (error) {
      console.error('[Playbook compat][dynamic_data/query]', { rid, error })
      return NextResponse.json({ error: error.message, rid }, { status: 500 })
    }

    // Build the data object grouped by entity_id and field_name
    const dataMap: Record<string, Record<string, any>> = {}

    for (const row of data ?? []) {
      const unified =
        row.field_value_number ??
        row.field_value_text ??
        row.field_value_boolean ??
        row.field_value_date ??
        row.field_value_json ??
        null

      if (!dataMap[row.entity_id]) {
        dataMap[row.entity_id] = {}
      }

      // Store with uppercase field name as expected by UI
      const fieldName = row.field_name.toUpperCase()

      // Handle specific smart codes with their expected shapes
      if (smart_code === 'HERA.SALON.SERVICE.PRICE.V1' && fieldName === 'PRICE') {
        dataMap[row.entity_id][fieldName] = {
          value: row.field_value_number ?? row.field_value_json?.value ?? 0,
          currency: row.field_value_json?.currency || 'AED',
          number: row.field_value_number ?? null,
          json: row.field_value_json ?? null,
          field_type: row.field_type,
          smart_code: row.smart_code,
          updated_at: row.updated_at
        }
      } else if (smart_code === 'HERA.SALON.SERVICE.TAX.V1' && fieldName === 'TAX') {
        dataMap[row.entity_id][fieldName] = {
          rate: row.field_value_number ?? row.field_value_json?.rate ?? 0.05,
          value: row.field_value_number ?? row.field_value_json?.rate ?? 0.05,
          inclusive: row.field_value_json?.inclusive ?? false,
          description: row.field_value_text || 'VAT 5%',
          number: row.field_value_number ?? null,
          text: row.field_value_text ?? null,
          json: row.field_value_json ?? null,
          field_type: row.field_type,
          smart_code: row.smart_code,
          updated_at: row.updated_at
        }
      } else if (smart_code === 'HERA.SALON.SERVICE.COMMISSION.V1' && fieldName === 'COMMISSION') {
        dataMap[row.entity_id][fieldName] = {
          value: row.field_value_number ?? row.field_value_json?.value ?? 0.35,
          rate: row.field_value_number ?? row.field_value_json?.rate ?? 0.35,
          type: row.field_value_json?.type || 'percentage',
          description: row.field_value_text || 'Stylist Commission',
          number: row.field_value_number ?? null,
          text: row.field_value_text ?? null,
          json: row.field_value_json ?? null,
          field_type: row.field_type,
          smart_code: row.smart_code,
          updated_at: row.updated_at
        }
      } else if (smart_code === 'HERA.SALON.PRODUCT.PRICE.V1' && fieldName === 'PRICE') {
        dataMap[row.entity_id][fieldName] = {
          value: row.field_value_number ?? row.field_value_json?.value ?? 0,
          currency: row.field_value_json?.currency || 'AED',
          number: row.field_value_number ?? null,
          json: row.field_value_json ?? null,
          field_type: row.field_type,
          smart_code: row.smart_code,
          updated_at: row.updated_at
        }
      } else if (smart_code === 'HERA.SALON.PRODUCT.TAX.V1' && fieldName === 'TAX') {
        dataMap[row.entity_id][fieldName] = {
          rate: row.field_value_number ?? row.field_value_json?.rate ?? 0.05,
          value: row.field_value_number ?? row.field_value_json?.rate ?? 0.05,
          inclusive: row.field_value_json?.inclusive ?? false,
          description: row.field_value_text || 'VAT 5%',
          number: row.field_value_number ?? null,
          text: row.field_value_text ?? null,
          json: row.field_value_json ?? null,
          field_type: row.field_type,
          smart_code: row.smart_code,
          updated_at: row.updated_at
        }
      } else if (
        smart_code === 'HERA.SALON.PRODUCT.REORDER_LEVEL.V1' &&
        fieldName === 'REORDER_LEVEL'
      ) {
        dataMap[row.entity_id][fieldName] = {
          value: row.field_value_number ?? 10,
          min_stock: row.field_value_json?.min_stock ?? 5,
          max_stock: row.field_value_json?.max_stock ?? 50,
          number: row.field_value_number ?? null,
          json: row.field_value_json ?? null,
          field_type: row.field_type,
          smart_code: row.smart_code,
          updated_at: row.updated_at
        }
      } else {
        // Generic handling
        dataMap[row.entity_id][fieldName] = {
          value: unified, // what the UI expects
          number: row.field_value_number ?? null,
          text: row.field_value_text ?? null,
          boolean: row.field_value_boolean ?? null,
          date: row.field_value_date ?? null,
          json: row.field_value_json ?? null,
          field_type: row.field_type,
          smart_code: row.smart_code,
          updated_at: row.updated_at
        }
      }
    }

    return NextResponse.json(
      { data: dataMap, rid },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    console.error('[Playbook compat][dynamic_data/query] fatal', e)
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 })
  }
}
