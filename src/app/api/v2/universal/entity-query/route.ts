import { NextRequest, NextResponse } from 'next/server'
import { selectRows, selectRow } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/v2/universal/entity-query
 *
 * Advanced entity querying with filters, joins, and aggregations
 *
 * Body parameters:
 * - organization_id: Required for multi-tenancy
 * - filters: Object with field filters
 * - search: Text search across multiple fields
 * - joins: Include related data (dynamic_data, relationships)
 * - select: Specific fields to return
 * - order_by: Sorting field and direction
 * - limit: Max records (default 100)
 * - offset: Pagination offset
 * - aggregate: Include counts and statistics
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const {
    organization_id,
    filters = {},
    search,
    joins = [],
    select = ['*'],
    order_by = { field: 'created_at', direction: 'DESC' },
    limit = 100,
    offset = 0,
    aggregate = false
  } = body

  if (!organization_id) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
  }

  try {
    // Build SELECT clause
    let selectClause = select.includes('*') ? 'e.*' : select.map(f => `e.${f}`).join(', ')

    // Add join fields if requested
    if (joins.includes('dynamic_data')) {
      selectClause += `,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'field_name', d.field_name,
              'field_value_text', d.field_value_text,
              'field_value_number', d.field_value_number,
              'field_value_date', d.field_value_date,
              'field_value_boolean', d.field_value_boolean,
              'metadata', d.metadata
            )
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'::json
        ) as dynamic_fields`
    }

    if (joins.includes('relationships')) {
      selectClause += `,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', r.id,
              'relationship_type', r.relationship_type,
              'from_entity_id', r.from_entity_id,
              'to_entity_id', r.to_entity_id,
              'smart_code', r.smart_code,
              'relationship_data', r.relationship_data
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'::json
        ) as relationships`
    }

    if (aggregate) {
      selectClause += `,
        count(DISTINCT d.id) as dynamic_field_count,
        count(DISTINCT r.id) as relationship_count,
        count(DISTINCT t.id) as transaction_count`
    }

    // Build FROM clause with JOINs
    let fromClause = 'FROM core_entities e'

    if (joins.includes('dynamic_data') || aggregate) {
      fromClause += `
        LEFT JOIN core_dynamic_data d ON d.entity_id = e.id`
    }

    if (joins.includes('relationships') || aggregate) {
      fromClause += `
        LEFT JOIN core_relationships r ON (r.from_entity_id = e.id OR r.to_entity_id = e.id)`
    }

    if (aggregate) {
      fromClause += `
        LEFT JOIN universal_transactions t ON (t.source_entity_id = e.id OR t.target_entity_id = e.id OR t.reference_entity_id = e.id)`
    }

    // Build WHERE clause
    let whereConditions = [`e.organization_id = $1`]
    const queryParams: any[] = [organization_id]
    let paramIndex = 2

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle array filters with IN clause
          if (value.length > 0) {
            const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(',')
            whereConditions.push(`e.${key} IN (${placeholders})`)
            queryParams.push(...value)
            paramIndex += value.length
          }
        } else if (typeof value === 'object' && value.operator) {
          // Handle advanced operators
          const { operator, value: val } = value as any
          switch (operator) {
            case 'gt':
              whereConditions.push(`e.${key} > $${paramIndex}`)
              break
            case 'gte':
              whereConditions.push(`e.${key} >= $${paramIndex}`)
              break
            case 'lt':
              whereConditions.push(`e.${key} < $${paramIndex}`)
              break
            case 'lte':
              whereConditions.push(`e.${key} <= $${paramIndex}`)
              break
            case 'like':
              whereConditions.push(`e.${key} ILIKE $${paramIndex}`)
              break
            case 'not':
              whereConditions.push(`e.${key} != $${paramIndex}`)
              break
            default:
              whereConditions.push(`e.${key} = $${paramIndex}`)
          }
          queryParams.push(val)
          paramIndex++
        } else {
          // Simple equality
          whereConditions.push(`e.${key} = $${paramIndex}`)
          queryParams.push(value)
          paramIndex++
        }
      }
    })

    // Add text search
    if (search) {
      const searchCondition = `(
        e.entity_name ILIKE $${paramIndex} OR
        e.entity_code ILIKE $${paramIndex} OR
        e.entity_description ILIKE $${paramIndex} OR
        e.smart_code ILIKE $${paramIndex}
      )`
      whereConditions.push(searchCondition)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    // Build the query
    let sql = `
      SELECT ${selectClause}
      ${fromClause}
      WHERE ${whereConditions.join(' AND ')}
    `

    // Add GROUP BY if using aggregates
    if (joins.includes('dynamic_data') || joins.includes('relationships') || aggregate) {
      sql += `
        GROUP BY e.id`
    }

    // Add ORDER BY
    if (order_by) {
      const direction = order_by.direction?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
      sql += `
        ORDER BY e.${order_by.field} ${direction}`
    }

    // Add LIMIT and OFFSET
    sql += `
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    queryParams.push(limit, offset)

    // Execute main query
    const entities = await selectRows(sql, queryParams)

    // Get total count for pagination
    const countSql = `
      SELECT count(DISTINCT e.id) as total
      FROM core_entities e
      WHERE ${whereConditions.join(' AND ')}
    `

    const countParams = queryParams.slice(0, -2) // Remove limit and offset
    const countResult = await selectRow(countSql, countParams)
    const total = countResult?.total || 0

    // Get aggregated statistics if requested
    let statistics = null
    if (aggregate) {
      const statsSql = `
        SELECT
          count(DISTINCT e.id) as total_entities,
          count(DISTINCT e.entity_type) as unique_types,
          json_object_agg(
            e.entity_type,
            type_counts.count
          ) as entities_by_type,
          json_object_agg(
            e.status,
            status_counts.count
          ) as entities_by_status
        FROM core_entities e
        LEFT JOIN LATERAL (
          SELECT entity_type, count(*) as count
          FROM core_entities
          WHERE organization_id = $1
          GROUP BY entity_type
        ) type_counts ON type_counts.entity_type = e.entity_type
        LEFT JOIN LATERAL (
          SELECT status, count(*) as count
          FROM core_entities
          WHERE organization_id = $1
          GROUP BY status
        ) status_counts ON status_counts.status = e.status
        WHERE e.organization_id = $1
        GROUP BY e.organization_id
      `

      statistics = await selectRow(statsSql, [organization_id])
    }

    return NextResponse.json({
      api_version: 'v2',
      data: entities,
      metadata: {
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil(total / limit),
        has_more: offset + limit < total
      },
      ...(statistics && { statistics })
    })
  } catch (error: any) {
    console.error('Error in entity-query:', error)
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}

/**
 * GET /api/v2/universal/entity-query/schema
 *
 * Get schema information for query building
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    api_version: 'v2',
    schema: {
      fields: [
        'id',
        'organization_id',
        'entity_type',
        'entity_name',
        'entity_code',
        'entity_description',
        'smart_code',
        'status',
        'tags',
        'metadata',
        'ai_confidence',
        'ai_classification',
        'ai_insights',
        'attributes',
        'created_at',
        'updated_at'
      ],
      operators: {
        text: ['=', '!=', 'like'],
        numeric: ['=', '!=', 'gt', 'gte', 'lt', 'lte'],
        date: ['=', '!=', 'gt', 'gte', 'lt', 'lte'],
        array: ['in', 'not_in', 'contains']
      },
      joins: ['dynamic_data', 'relationships'],
      order_by_fields: ['created_at', 'updated_at', 'entity_name', 'entity_type', 'status'],
      aggregate_functions: ['count', 'sum', 'avg', 'min', 'max']
    }
  })
}
