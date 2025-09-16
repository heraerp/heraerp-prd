import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enterpriseMiddleware } from '@/src/lib/middleware/enterprise-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  return enterpriseMiddleware(request, async (req, ctx) => {
    const organizationId = ctx.organizationId
    const searchParams = request.nextUrl.searchParams

    const search = searchParams.get('q') || ''
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort') || 'closing_date'

    try {
      // Build status filter
      const statusFilter =
        status === 'all' ? `('active', 'watchlist', 'submitted', 'won', 'lost')` : `('${status}')`

      // Main tender query with dynamic data and status
      const tenderListQuery = `
        WITH tender_data AS (
          SELECT 
            t.id,
            t.entity_name as title,
            t.entity_code as code,
            t.smart_code,
            t.created_at,
            -- Get tender status from relationships
            (
              SELECT s.entity_code
              FROM core_relationships r
              JOIN core_entities s ON s.id = r.to_entity_id
              WHERE r.from_entity_id = t.id 
                AND r.relationship_type = 'has_status'
                AND s.entity_type = 'workflow_status'
              ORDER BY r.created_at DESC
              LIMIT 1
            ) as status,
            -- Dynamic fields as JSON
            jsonb_object_agg(
              d.field_name, 
              COALESCE(
                d.field_value_text::text,
                d.field_value_number::text,
                d.field_value_date::text
              )
            ) FILTER (WHERE d.field_name IS NOT NULL) as dynamic_data
          FROM core_entities t
          LEFT JOIN core_dynamic_data d ON d.entity_id = t.id 
            AND d.organization_id = $1
          WHERE t.organization_id = $1
            AND t.entity_type = 'HERA.FURNITURE.TENDER.NOTICE.v1'
            AND ($2 = '' OR (
              t.entity_name ILIKE '%' || $2 || '%'
              OR t.entity_code ILIKE '%' || $2 || '%'
              OR EXISTS (
                SELECT 1 FROM core_dynamic_data dd
                WHERE dd.entity_id = t.id 
                  AND dd.field_value_text ILIKE '%' || $2 || '%'
              )
            ))
          GROUP BY t.id
        ),
        filtered_tenders AS (
          SELECT *
          FROM tender_data
          WHERE status IN ${statusFilter}
        )
        SELECT 
          id,
          title,
          code,
          smart_code,
          status,
          dynamic_data->>'department' as department,
          (dynamic_data->>'closing_date')::date as closing_date,
          CASE 
            WHEN (dynamic_data->>'closing_date')::date > CURRENT_DATE 
            THEN (dynamic_data->>'closing_date')::date - CURRENT_DATE
            ELSE 0
          END as days_left,
          (dynamic_data->>'estimated_value')::numeric as estimated_value,
          (dynamic_data->>'emd_amount')::numeric as emd_amount,
          (dynamic_data->>'lot_count')::integer as lots,
          dynamic_data->>'bid_strategy' as bid_strategy,
          (dynamic_data->>'ai_confidence')::numeric as ai_confidence,
          created_at
        FROM filtered_tenders
        ORDER BY 
          CASE 
            WHEN $3 = 'closing_date' THEN closing_date
            WHEN $3 = 'value' THEN estimated_value
            WHEN $3 = 'created' THEN created_at
          END DESC NULLS LAST
        LIMIT $4 OFFSET $5
      `

      const { data: tenders, error: tendersError } = await supabase.rpc('execute_sql', {
        query: tenderListQuery,
        params: [organizationId, search, sortBy, limit, offset]
      })

      if (tendersError) {
        throw new Error('Failed to fetch tender list')
      }

      // Get total count for pagination
      const countQuery = `
        WITH tender_status AS (
          SELECT 
            t.id,
            (
              SELECT s.entity_code
              FROM core_relationships r
              JOIN core_entities s ON s.id = r.to_entity_id
              WHERE r.from_entity_id = t.id 
                AND r.relationship_type = 'has_status'
                AND s.entity_type = 'workflow_status'
              ORDER BY r.created_at DESC
              LIMIT 1
            ) as status
          FROM core_entities t
          WHERE t.organization_id = $1
            AND t.entity_type = 'HERA.FURNITURE.TENDER.NOTICE.v1'
            AND ($2 = '' OR (
              t.entity_name ILIKE '%' || $2 || '%'
              OR t.entity_code ILIKE '%' || $2 || '%'
            ))
        )
        SELECT COUNT(*) as total
        FROM tender_status
        WHERE status IN ${statusFilter}
      `

      const { data: countData, error: countError } = await supabase.rpc('execute_sql', {
        query: countQuery,
        params: [organizationId, search]
      })

      if (countError) {
        throw new Error('Failed to get tender count')
      }

      // Get competitor count for each tender
      const competitorQuery = `
        SELECT 
          ut.reference_entity_id as tender_id,
          COUNT(DISTINCT ut.from_entity_id) as competitor_count
        FROM universal_transactions ut
        WHERE ut.organization_id = $1
          AND ut.smart_code = 'HERA.FURNITURE.TENDER.COMPETITOR.BID.DETECTED.v1'
          AND ut.reference_entity_id IN (
            SELECT id FROM core_entities
            WHERE organization_id = $1
              AND entity_type = 'HERA.FURNITURE.TENDER.NOTICE.v1'
          )
        GROUP BY ut.reference_entity_id
      `

      const { data: competitors, error: competitorError } = await supabase.rpc('execute_sql', {
        query: competitorQuery,
        params: [organizationId]
      })

      // Merge competitor data
      const competitorMap = (competitors || []).reduce((acc: any, item: any) => {
        acc[item.tender_id] = item.competitor_count
        return acc
      }, {})

      // Format response with competitor data
      const formattedTenders = (tenders || []).map((tender: any) => ({
        ...tender,
        competitor_count: competitorMap[tender.id] || 0
      }))

      return NextResponse.json({
        success: true,
        data: {
          tenders: formattedTenders,
          pagination: {
            total: countData?.[0]?.total || 0,
            limit,
            offset,
            hasMore: offset + limit < (countData?.[0]?.total || 0)
          }
        },
        smart_code: 'HERA.FURNITURE.TENDER.LIST.RETRIEVED.v1'
      })
    } catch (error) {
      console.error('Error fetching tender list:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch tender list',
          smart_code: 'HERA.FURNITURE.TENDER.LIST.ERROR.v1'
        },
        { status: 500 }
      )
    }
  })
}
