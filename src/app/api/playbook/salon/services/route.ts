/**
 * Salon Services API Route - Phase 3.5
 * Hydrates service data from core_dynamic_data using fn_dynamic_fields_json
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

// Query parameters schema
const queryParamsSchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  status: z.enum(['active', 'archived', 'all']).default('active'),
  category: z.string().trim().min(1).max(120).optional(),
  branch_id: z.string().uuid().optional(),
  sort: z.enum(['name_asc', 'name_desc', 'updated_desc', 'updated_asc']).default('name_asc'),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0)
})

export async function GET(request: NextRequest) {
  try {
    // Authenticate and get organization ID from token
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organizationId = authResult.organizationId

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const params = queryParamsSchema.parse(searchParams)

    // Get Supabase service client
    const supabase = getSupabaseService()

    // Step 1: Build base query for services
    let query = supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, status, smart_code, created_at, updated_at')
      .eq('organization_id', organizationId)
      .in('entity_type', ['service', 'svc']) // Handle both entity_type values

    // Apply status filter
    if (params.status !== 'all') {
      query = query.eq('status', params.status)
    }

    // Apply search filter
    if (params.q) {
      query = query.or(`entity_name.ilike.%${params.q}%,entity_code.ilike.%${params.q}%`)
    }

    // Apply branch filter via relationships
    if (params.branch_id) {
      // First get service IDs linked to the branch
      const { data: relationships } = await supabase
        .from('core_relationships')
        .select('from_entity_id, to_entity_id')
        .eq('organization_id', organizationId)
        .in('relationship_type', ['AVAILABLE_AT', 'SERVICE_BRANCH'])
        .or(`from_entity_id.eq.${params.branch_id},to_entity_id.eq.${params.branch_id}`)

      if (relationships && relationships.length > 0) {
        const serviceIds = relationships.map(rel =>
          rel.from_entity_id === params.branch_id ? rel.to_entity_id : rel.from_entity_id
        )
        query = query.in('id', serviceIds)
      } else {
        // No services linked to branch
        return NextResponse.json({
          items: [],
          total_count: 0,
          limit: params.limit,
          offset: params.offset
        })
      }
    }

    // Step 2: If category filter is specified, we need to check dynamic data
    let filteredServiceIds: string[] | null = null
    if (params.category) {
      // Get all service IDs (without pagination) to filter by category
      const { data: allServices } = await query.select('id')

      if (allServices && allServices.length > 0) {
        const allServiceIds = allServices.map(s => s.id)

        // Use fn_dynamic_fields_select to get only services with matching category
        const { data: categoryData } = await supabase.rpc('fn_dynamic_fields_select', {
          org_id: organizationId,
          p_entity_ids: allServiceIds,
          p_smart_code: null,
          p_field_names: ['service.category']
        })

        if (categoryData) {
          filteredServiceIds = categoryData
            .filter(
              (d: any) => d.field_name === 'service.category' && d.field_value === params.category
            )
            .map((d: any) => d.entity_id)

          // Apply the filtered IDs to the query
          if (filteredServiceIds && filteredServiceIds.length > 0) {
            query = query.in('id', filteredServiceIds)
          } else {
            // No services match the category
            return NextResponse.json({
              items: [],
              total_count: 0,
              limit: params.limit,
              offset: params.offset
            })
          }
        }
      }
    }

    // Step 3: Get total count before pagination
    const countQuery = query
    const { count } = await countQuery

    // Step 4: Apply sorting
    const sortField = params.sort.includes('name') ? 'entity_name' : 'updated_at'
    const sortOrder = params.sort.includes('desc') ? false : true // false = desc, true = asc
    query = query.order(sortField, { ascending: sortOrder })

    // Step 5: Apply pagination
    query = query.range(params.offset, params.offset + params.limit - 1)

    // Execute the main query
    const { data: services, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch services', details: error.message },
        { status: 500 }
      )
    }

    if (!services || services.length === 0) {
      return NextResponse.json({
        items: [],
        total_count: count || 0,
        limit: params.limit,
        offset: params.offset
      })
    }

    // Step 6: Hydrate dynamic data for the current page
    if (!services || services.length === 0) {
      console.log('No services to hydrate dynamic data for')
    }

    const serviceIds = services.map(s => s.id)

    console.log('Fetching dynamic data for services:', serviceIds)
    console.log('Service count:', services.length)

    // Try RPC function first
    const { data: rpcData, error: rpcError } = await supabase.rpc('fn_dynamic_fields_json', {
      org_id: organizationId,
      p_entity_ids: serviceIds,
      p_smart_code: null
    })

    console.log('RPC data response:', rpcData)
    console.log('RPC error:', rpcError)

    // If RPC fails or returns incomplete data, query directly
    let dynamicDataMap = new Map()

    if (rpcError || !rpcData) {
      // Fallback to direct query
      const { data: dynamicDataRows, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select(
          'entity_id, field_name, field_type, field_value_text, field_value_number, field_value_json'
        )
        .eq('organization_id', organizationId)
        .in('entity_id', serviceIds)
        .in('field_name', [
          'service.base_price',
          'service.duration_min',
          'service.category',
          'service.tax',
          'service.commission'
        ])

      if (dynamicError) {
        console.error('Dynamic data error:', dynamicError)
      }

      // Create a map of entity_id to attributes
      if (dynamicDataRows) {
        dynamicDataRows.forEach((row: any) => {
          const entityId = row.entity_id
          if (!dynamicDataMap.has(entityId)) {
            dynamicDataMap.set(entityId, {})
          }
          const attributes = dynamicDataMap.get(entityId)

          // Set the field value based on field type
          if (row.field_type === 'text' && row.field_value_text) {
            attributes[row.field_name] = row.field_value_text
          } else if (row.field_type === 'number' && row.field_value_number !== null) {
            attributes[row.field_name] = row.field_value_number
          } else if (row.field_type === 'json' && row.field_value_json) {
            attributes[row.field_name] = row.field_value_json
          }
        })
      }
    } else {
      // Use RPC data but also query directly to get all fields
      // First process RPC data
      if (rpcData) {
        rpcData.forEach((item: any) => {
          dynamicDataMap.set(item.entity_id, item.attributes || {})
        })
      }

      // Then query directly to fill in missing data
      const { data: directData } = await supabase
        .from('core_dynamic_data')
        .select(
          'entity_id, field_name, field_type, field_value_text, field_value_number, field_value_json'
        )
        .eq('organization_id', organizationId)
        .in('entity_id', serviceIds)
        .in('field_name', [
          'service.base_price',
          'service.duration_min',
          'service.category',
          'service.tax',
          'service.commission'
        ])

      if (directData) {
        directData.forEach((row: any) => {
          const entityId = row.entity_id
          if (!dynamicDataMap.has(entityId)) {
            dynamicDataMap.set(entityId, {})
          }
          const attributes = dynamicDataMap.get(entityId)

          // Only set if not already present from RPC or if RPC returned null
          if (!attributes[row.field_name] || attributes[row.field_name] === null) {
            if (row.field_type === 'text' && row.field_value_text) {
              attributes[row.field_name] = row.field_value_text
            } else if (row.field_type === 'number' && row.field_value_number !== null) {
              attributes[row.field_name] = row.field_value_number
            } else if (row.field_type === 'json' && row.field_value_json) {
              attributes[row.field_name] = row.field_value_json
            }
          }
        })
      }
    }

    // Step 7: Format the response
    const items = services.map(service => {
      const attributes = dynamicDataMap.get(service.id) || {}

      console.log(`Service ${service.entity_name} (${service.id}) attributes:`, attributes)

      return {
        id: service.id,
        entity_name: service.entity_name,
        entity_code: service.entity_code || null,
        status: service.status,
        smart_code: service.smart_code || 'HERA.SALON.SERVICE.CATALOG.UNCLASSIFIED.V1',
        created_at: service.created_at || null,
        updated_at: service.updated_at || null,
        // Extract from dynamic data
        price: attributes['service.base_price'] || null,
        duration_minutes: attributes['service.duration_min']
          ? Number(attributes['service.duration_min'])
          : null,
        category: attributes['service.category'] || null,
        tax: attributes['service.tax'] || null,
        commission: attributes['service.commission'] || null
      }
    })

    return NextResponse.json({
      items,
      total_count: count || 0,
      limit: params.limit,
      offset: params.offset
    })
  } catch (error) {
    console.error('Salon services API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
