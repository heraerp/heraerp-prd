import { NextRequest, NextResponse } from 'next/server'
import { ListQuerySchema } from '../../_schemas'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const queryParams = {
      orgId: searchParams.get('orgId'),
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      q: searchParams.get('q'),
      status: searchParams.get('status'),
      category: searchParams.get('category')
    }

    const parsed = ListQuerySchema.safeParse(queryParams)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { orgId, page, pageSize, q, status, category } = parsed.data
    const supabase = createClient()

    // Calculate offset
    const offset = (page - 1) * pageSize

    // Build base query
    let query = supabase
      .from('core_entities')
      .select(
        `
        id,
        entity_name,
        entity_type,
        status,
        created_at,
        updated_at
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'salon_service')

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply search filter
    if (q) {
      query = query.ilike('entity_name', `%${q}%`)
    }

    // Execute query with pagination
    const {
      data: entities,
      count,
      error: entitiesError
    } = await query.order('entity_name').range(offset, offset + pageSize - 1)

    if (entitiesError) {
      console.error('Failed to fetch services:', entitiesError)
      return NextResponse.json(
        { error: 'Failed to fetch services', details: entitiesError.message },
        { status: 500 }
      )
    }

    // Fetch dynamic data for all entities
    const entityIds = entities?.map(e => e.id) || []

    if (entityIds.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      })
    }

    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_text, field_value_number')
      .eq('organization_id', orgId)
      .in('entity_id', entityIds)
      .in('field_name', ['price', 'duration', 'tax_code', 'category', 'description'])

    if (dynamicError) {
      console.error('Failed to fetch dynamic data:', dynamicError)
    }

    // Group dynamic data by entity
    const dynamicByEntity =
      dynamicData?.reduce(
        (acc, row) => {
          if (!acc[row.entity_id]) acc[row.entity_id] = {}

          if (row.field_name === 'price' || row.field_name === 'duration') {
            acc[row.entity_id][row.field_name] = row.field_value_number
          } else {
            acc[row.entity_id][row.field_name] = row.field_value_text
          }

          return acc
        },
        {} as Record<string, Record<string, any>>
      ) || {}

    // Merge entities with dynamic data and apply category filter if needed
    let services =
      entities?.map(entity => ({
        ...entity,
        ...dynamicByEntity[entity.id],
        price: dynamicByEntity[entity.id]?.price || 0,
        duration: dynamicByEntity[entity.id]?.duration || 60,
        tax_code: dynamicByEntity[entity.id]?.tax_code || 'VAT5',
        category: dynamicByEntity[entity.id]?.category || null,
        description: dynamicByEntity[entity.id]?.description || null
      })) || []

    // Apply category filter (done in memory since it's in dynamic data)
    if (category) {
      services = services.filter(s => s.category === category)
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    return NextResponse.json({
      items: services,
      total: count || 0,
      page,
      pageSize,
      totalPages
    })
  } catch (error) {
    console.error('Unexpected error in service list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
