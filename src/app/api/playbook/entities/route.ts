import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

type RowsShape = { items?: any[]; rows?: any[]; data?: any[]; total?: number; count?: number }

function getOrgFromRequest(req: NextRequest) {
  // Prefer what your auth layer resolved (cookie/claims). As a fallback, accept query param.
  const org = req.nextUrl.searchParams.get('organization_id')
    || req.headers.get('x-hera-org')
    || req.cookies.get('HERA_ORG_ID')?.value
    || req.cookies.get('hera-organization-id')?.value
    || null
  return org && /^[0-9a-f-]{36}$/i.test(org) ? org : null
}

function buildSearch(q?: string) {
  if (!q) return []
  // Search across name and code
  return [
    { col: 'entity_name', op: 'ilike', val: `%${q}%` },
    { col: 'entity_code', op: 'ilike', val: `%${q}%` },
  ]
}

function mapSort(sort?: string) {
  // e.g. "updated_at:desc" or "entity_name:asc"
  if (!sort) return { column: 'updated_at', ascending: false }
  const [col, dir] = sort.split(':')
  return { column: col || 'updated_at', ascending: (dir || 'desc').toLowerCase() !== 'desc' }
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl
    const orgId = getOrgFromRequest(req)
    if (!orgId) return NextResponse.json({ error: 'organization_id required' }, { status: 400 })

    const type = url.searchParams.get('type') || '' // smart_code like HERA.SALON.SERVICE.V1
    const branch = url.searchParams.get('branch_id') || ''
    const q = url.searchParams.get('q') || ''
    const status = url.searchParams.get('status') || '' // "active"|"archived"|""(all)
    const limit = Math.min(Number(url.searchParams.get('limit') || 25), 100)
    const offset = Number(url.searchParams.get('offset') || 0)
    const sort = mapSort(url.searchParams.get('sort') || 'updated_at:desc')
    
    const cid = req.headers.get('x-correlation-id') || `req-${Date.now()}`
    const organization_id = orgId

    // SERVICES: HERA.SALON.SERVICE.V1
    if (type === 'HERA.SALON.SERVICE.V1') {
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

      // Optional filters
      const branch_entity_id = url.searchParams.get('branch_entity_id') || null
      // Optional smart prefix list: ?smart_prefixes=HERA.SALON.SERVICE.,HERA.RETAIL.SERVICE.
      const smartPrefixesParam = url.searchParams.get('smart_prefixes')
      const smart_prefixes = smartPrefixesParam
        ? smartPrefixesParam.split(',').map(s => s.trim()).filter(Boolean)
        : ['HERA.SALON.SERVICE.%'] // safe default

      // 1) Fetch services with attributes via RPC
      const { data: rows, error } = await supabase.rpc('fn_entities_with_soh', {
        org_id: organization_id,
        entity_type_filter: 'service',
        smart_prefixes,
        branch_entity_id,             // null = all branches
        branch_relationship_type: null, // don't guess; let RPC default
        limit_rows: limit,
        offset_rows: offset,
      })

      if (error) {
        return NextResponse.json(
          { error: `RPC fn_entities_with_soh failed: ${error.message}` },
          { status: 500, headers: { 'x-correlation-id': cid } }
        )
      }

      // 2) Optional total for pagination — use same smart_code prefixes to avoid drift
      const { count: total } = await supabase
        .from('core_entities')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization_id)
        .eq('entity_type', 'service')
      
      const safeTotal = typeof total === 'number' ? total : (rows?.length ?? 0)

      // 3) Optional status filter (exact column name)
      const filtered = status
        ? (rows || []).filter(r => (r.status || '').toLowerCase() === status.toLowerCase())
        : (rows || [])

      // 4) Return Playbook-friendly envelope — keep DB column names as-is
      return NextResponse.json(
        {
          items: filtered.map(r => ({
            id: r.id,
            entity_code: r.entity_code,
            entity_name: r.entity_name,
            entity_type: r.entity_type,   // from RPC
            status: r.status,
            smart_code: r.smart_code,
            attributes: r.attributes,     // jsonb (no guessing about keys)
            type: 'HERA.SALON.SERVICE.V1',
          })),
          page: { limit, offset, count: filtered.length, total: safeTotal },
          correlation_id: cid,
        },
        { headers: { 'x-correlation-id': cid } }
      )
    }

    // PRODUCTS: HERA.SALON.PRODUCT.V1
    if (type === 'HERA.SALON.PRODUCT.V1') {
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

      // Optional filters
      const branch_entity_id = url.searchParams.get('branch_entity_id') || null
      // Optional smart prefix list: ?smart_prefixes=HERA.SALON.PRODUCT.,HERA.RETAIL.PRODUCT.
      const smartPrefixesParam = url.searchParams.get('smart_prefixes')
      const smart_prefixes = smartPrefixesParam
        ? smartPrefixesParam.split(',').map(s => s.trim()).filter(Boolean)
        : ['HERA.SALON.PRODUCT.%'] // safe default

      // 1) Fetch products with stock-on-hand & attributes via RPC
      const { data: rows, error } = await supabase.rpc('fn_entities_with_soh', {
        org_id: organization_id,
        entity_type_filter: 'product',
        smart_prefixes,
        branch_entity_id,             // null = all branches
        branch_relationship_type: null, // don't guess; let RPC default
        limit_rows: limit,
        offset_rows: offset,
      })

      if (error) {
        return NextResponse.json(
          { error: `RPC fn_entities_with_soh failed: ${error.message}` },
          { status: 500, headers: { 'x-correlation-id': cid } }
        )
      }

      // 2) Optional total for pagination — use same smart_code prefixes to avoid drift
      const { count: total } = await supabase
        .from('core_entities')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization_id)
        .eq('entity_type', 'product')
      
      const safeTotal = typeof total === 'number' ? total : (rows?.length ?? 0)

      // 3) Optional status filter (exact column name)
      const filtered = status
        ? (rows || []).filter(r => (r.status || '').toLowerCase() === status.toLowerCase())
        : (rows || [])

      // 4) Return Playbook-friendly envelope — keep DB column names as-is
      return NextResponse.json(
        {
          items: filtered.map(r => ({
            id: r.id,
            entity_code: r.entity_code,
            entity_name: r.entity_name,
            entity_type: r.entity_type,   // from RPC
            status: r.status,
            smart_code: r.smart_code,
            qty_on_hand: r.qty_on_hand,   // numeric
            attributes: r.attributes,     // jsonb (no guessing about keys)
            type: 'HERA.SALON.PRODUCT.V1',
          })),
          page: { limit, offset, count: filtered.length, total: safeTotal },
          correlation_id: cid,
        },
        { headers: { 'x-correlation-id': cid } }
      )
    }

    let query = supabase
      .from('core_entities')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)

    // If type is provided, try to match by smart_code or entity_type
    if (type) {
      // Check if it's a smart code pattern like HERA.SALON.SERVICE.V1
      if (type.startsWith('HERA.')) {
        // Extract entity type from smart code (e.g., SERVICE -> service)
        const parts = type.split('.')
        if (parts.length >= 3) {
          const entityType = parts[2].toLowerCase()
          query = query.eq('entity_type', entityType)
        }
      } else {
        // Direct entity_type match
        query = query.eq('entity_type', type)
      }
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (branch && branch !== 'ALL') {
      // In HERA, branch relationship might be stored differently
      // For now, we'll check metadata
      query = query.contains('metadata', { branch_id: branch })
    }

    // Basic search across name/code
    if (q) {
      query = query.or(`entity_name.ilike.%${q}%,entity_code.ilike.%${q}%`)
    }

    query = query.order(sort.column, { ascending: sort.ascending })
      .range(offset, offset + limit - 1)

    const { data, count, error } = await query
    if (error) {
      console.error('[Playbook Entities] Query error:', error)
      throw error
    }

    // Transform to Playbook shape with aliased fields
    const items = (data || []).map((entity: any) => ({
      id: entity.id,
      organization_id: entity.organization_id,
      type: entity.entity_type,
      name: entity.entity_name,          // alias entity_name → name
      code: entity.entity_code,          // alias entity_code → code
      description: entity.entity_description || '',
      status: entity.status,
      updated_at: entity.updated_at,
      metadata: entity.metadata,
      business_rules: entity.business_rules,
      tags: entity.tags
    }))
    
    const out: RowsShape = { 
      items, 
      total: count ?? (data?.length || 0) 
    }
    
    console.log(`[Playbook Entities] Found ${out.items?.length} items for org ${orgId}`)
    
    return NextResponse.json(out, { status: 200 })
  } catch (e: any) {
    console.error('[Playbook Entities] Error:', e)
    return NextResponse.json({ error: e?.message || 'entities query failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const orgId = getOrgFromRequest(req)
    if (!orgId) return NextResponse.json({ error: 'organization_id required' }, { status: 400 })

    const body = await req.json()
    
    // Extract entity type from smart code if provided
    let entityType = body.entity_type
    if (!entityType && body.smart_code) {
      const parts = body.smart_code.split('.')
      if (parts.length >= 3) {
        entityType = parts[2].toLowerCase()
      }
    }

    const payload = {
      organization_id: orgId,
      smart_code: body.smart_code || 'HERA.SALON.SERVICE.V1',
      entity_name: body.name || body.entity_name,
      entity_code: body.code || body.entity_code,
      entity_type: entityType || 'service',
      status: body.status || 'active',
      metadata: body.metadata || {},
    }

    const { data, error } = await supabase
      .from('core_entities')
      .insert(payload)
      .select('*')
      .single()
    
    if (error) {
      console.error('[Playbook Entities] Insert error:', error)
      throw error
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    console.error('[Playbook Entities] Create error:', e)
    return NextResponse.json({ error: e?.message || 'create entity failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const orgId = getOrgFromRequest(req)
    if (!orgId) return NextResponse.json({ error: 'organization_id required' }, { status: 400 })

    // Extract entity ID from URL path
    const url = req.nextUrl.pathname
    const matches = url.match(/\/entities\/([0-9a-f-]{36})$/i)
    
    if (!matches || !matches[1]) {
      return NextResponse.json({ error: 'Invalid entity ID in path' }, { status: 400 })
    }
    
    const entityId = matches[1]
    const body = await req.json()
    
    // Build update payload
    const updatePayload: any = {}
    
    if (body.name !== undefined) updatePayload.entity_name = body.name
    if (body.entity_name !== undefined) updatePayload.entity_name = body.entity_name
    if (body.code !== undefined) updatePayload.entity_code = body.code
    if (body.entity_code !== undefined) updatePayload.entity_code = body.entity_code
    if (body.status !== undefined) updatePayload.status = body.status
    if (body.metadata !== undefined) updatePayload.metadata = body.metadata
    if (body.tags !== undefined) updatePayload.tags = body.tags
    if (body.business_rules !== undefined) updatePayload.business_rules = body.business_rules
    
    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('core_entities')
      .update(updatePayload)
      .eq('id', entityId)
      .eq('organization_id', orgId) // Ensure org isolation
      .select('*')
      .single()
    
    if (error) {
      console.error('[Playbook Entities] Update error:', error)
      throw error
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }
    
    console.log(`[Playbook Entities] Updated entity ${entityId} for org ${orgId}`)
    
    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    console.error('[Playbook Entities] Update error:', e)
    return NextResponse.json({ error: e?.message || 'update entity failed' }, { status: 500 })
  }
}