import { NextRequest, NextResponse } from 'next/server'
import { selectRows, selectRow } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/v2/universal/dynamic-data-read
 *
 * Read dynamic fields for entities
 *
 * Query parameters:
 * - organization_id: Required
 * - entity_id: Get fields for specific entity
 * - field_name: Get specific field
 * - field_type: Filter by field type
 * - limit: Max records (default 100)
 * - offset: Pagination offset (default 0)
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams

  const organization_id = params.get('organization_id')
  const entity_id = params.get('entity_id')
  const field_name = params.get('field_name')
  const field_type = params.get('field_type')
  const limit = parseInt(params.get('limit') || '100')
  const offset = parseInt(params.get('offset') || '0')

  if (!organization_id) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
  }

  try {
    // Single field by entity_id and field_name
    if (entity_id && field_name) {
      const sql = `
        SELECT dd.*,
               e.entity_name,
               e.entity_type,
               e.entity_code
        FROM core_dynamic_data dd
        JOIN core_entities e ON e.id = dd.entity_id
        WHERE dd.organization_id = $1
        AND dd.entity_id = $2
        AND dd.field_name = $3
      `

      const field = await selectRow(sql, [organization_id, entity_id, field_name])

      if (!field) {
        return NextResponse.json({ error: 'field_not_found' }, { status: 404 })
      }

      return NextResponse.json({
        api_version: 'v2',
        data: field
      })
    }

    // Build query for multiple fields
    let sql = `
      SELECT dd.*,
             e.entity_name,
             e.entity_type,
             e.entity_code
      FROM core_dynamic_data dd
      JOIN core_entities e ON e.id = dd.entity_id
      WHERE dd.organization_id = $1
    `

    const queryParams: any[] = [organization_id]
    let paramIndex = 2

    // Add filters
    if (entity_id) {
      sql += ` AND dd.entity_id = $${paramIndex}`
      queryParams.push(entity_id)
      paramIndex++
    }

    if (field_type) {
      sql += ` AND dd.field_type = $${paramIndex}`
      queryParams.push(field_type)
      paramIndex++
    }

    sql += ` ORDER BY dd.entity_id, dd.field_name`

    // Add pagination
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    queryParams.push(limit, offset)

    const fields = await selectRows(sql, queryParams)

    // Get total count
    let countSql = `
      SELECT count(*) as total
      FROM core_dynamic_data dd
      WHERE dd.organization_id = $1
    `

    const countParams: any[] = [organization_id]
    let countParamIndex = 2

    if (entity_id) {
      countSql += ` AND dd.entity_id = $${countParamIndex}`
      countParams.push(entity_id)
      countParamIndex++
    }

    if (field_type) {
      countSql += ` AND dd.field_type = $${countParamIndex}`
      countParams.push(field_type)
    }

    const countResult = await selectRow(countSql, countParams)
    const total = countResult?.total || 0

    // Group fields by entity if requested
    const groupByEntity = params.get('group_by_entity') === 'true'

    if (groupByEntity && fields.length > 0) {
      const grouped = fields.reduce((acc: any, field: any) => {
        const entityKey = field.entity_id
        if (!acc[entityKey]) {
          acc[entityKey] = {
            entity_id: field.entity_id,
            entity_name: field.entity_name,
            entity_type: field.entity_type,
            entity_code: field.entity_code,
            fields: []
          }
        }
        acc[entityKey].fields.push({
          field_name: field.field_name,
          field_type: field.field_type,
          field_value_text: field.field_value_text,
          field_value_number: field.field_value_number,
          field_value_boolean: field.field_value_boolean,
          field_value_date: field.field_value_date,
          field_value_datetime: field.field_value_datetime,
          field_value_json: field.field_value_json,
          smart_code: field.smart_code,
          metadata: field.metadata
        })
        return acc
      }, {})

      return NextResponse.json({
        api_version: 'v2',
        data: Object.values(grouped),
        metadata: {
          total_fields: total,
          total_entities: Object.keys(grouped).length,
          limit,
          offset,
          has_more: offset + limit < total
        }
      })
    }

    return NextResponse.json({
      api_version: 'v2',
      data: fields,
      metadata: {
        total,
        limit,
        offset,
        has_more: offset + limit < total
      }
    })
  } catch (error: any) {
    console.error('Error in dynamic-data-read:', error)
    return NextResponse.json({ error: 'database_error', message: error.message }, { status: 500 })
  }
}
