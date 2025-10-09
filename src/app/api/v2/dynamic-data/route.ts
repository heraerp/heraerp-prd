/**
 * Dynamic Data API v2
 * Handles dynamic fields for entities
 *
 * GET    /api/v2/dynamic-data - Read dynamic fields
 * POST   /api/v2/dynamic-data - Create/update single dynamic field
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = authResult
    const { searchParams } = new URL(request.url)

    const entity_id = searchParams.get('p_entity_id')
    const entity_ids = searchParams.get('p_entity_ids') // Support batch fetch
    const field_name = searchParams.get('p_field_name')

    // Support both single and multiple entity IDs
    if (!entity_id && !entity_ids) {
      return NextResponse.json({ error: 'entity_id or entity_ids required' }, { status: 400 })
    }

    const supabase = getSupabaseService()

    let query = supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', organizationId)

    // Handle batch fetch or single fetch
    if (entity_ids) {
      const idsArray = entity_ids.split(',')
      query = query.in('entity_id', idsArray)
    } else if (entity_id) {
      query = query.eq('entity_id', entity_id)
    }

    if (field_name) {
      query = query.eq('field_name', field_name)
    }

    console.log('[dynamic-data GET] Query params:', {
      organizationId,
      entity_id,
      entity_ids,
      field_name
    })

    const { data, error } = await query

    console.log('[dynamic-data GET] Result:', {
      success: !error,
      count: data?.length || 0,
      error: error?.message
    })

    if (error) {
      console.error('[dynamic-data GET] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch dynamic data', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('[dynamic-data GET] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = authResult
    const body = await request.json()

    const {
      p_entity_id,
      p_field_name,
      p_field_value_text,
      p_field_value_number,
      p_field_value_boolean,
      p_field_value_json,
      p_smart_code
    } = body

    if (!p_entity_id || !p_field_name || !p_smart_code) {
      return NextResponse.json(
        { error: 'entity_id, field_name, and smart_code required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseService()

    // Check if field exists
    const { data: existing } = await supabase
      .from('core_dynamic_data')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_id', p_entity_id)
      .eq('field_name', p_field_name)
      .single()

    const fieldData: any = {
      organization_id: organizationId,
      entity_id: p_entity_id,
      field_name: p_field_name,
      smart_code: p_smart_code,
      field_value_text: p_field_value_text || null,
      field_value_number: p_field_value_number || null,
      field_value_boolean: p_field_value_boolean || null,
      field_value_json: p_field_value_json || null
    }

    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('core_dynamic_data')
        .update(fieldData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('[dynamic-data POST] Update error:', error)
        return NextResponse.json(
          { error: 'Failed to update dynamic field', details: error.message },
          { status: 500 }
        )
      }

      result = data
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('core_dynamic_data')
        .insert(fieldData)
        .select()
        .single()

      if (error) {
        console.error('[dynamic-data POST] Insert error:', error)
        return NextResponse.json(
          { error: 'Failed to create dynamic field', details: error.message },
          { status: 500 }
        )
      }

      result = data
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('[dynamic-data POST] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
