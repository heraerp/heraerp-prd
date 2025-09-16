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

    try {
      // Get tender entities
      let query = supabase
        .from('core_entities')
        .select(
          `
          *,
          core_dynamic_data(*)
        `
        )
        .eq('organization_id', organizationId)
        .eq('entity_type', 'HERA.FURNITURE.TENDER.NOTICE.v1')
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.or(`entity_name.ilike.%${search}%,entity_code.ilike.%${search}%`)
      }

      const { data: tenders, error: tendersError } = await query

      if (tendersError) {
        throw new Error('Failed to fetch tenders')
      }

      // Format the response
      const formattedTenders = (tenders || []).map((tender: any) => {
        // Extract dynamic data
        const dynamicData = (tender.core_dynamic_data || []).reduce((acc: any, item: any) => {
          acc[item.field_name] =
            item.field_value_text || item.field_value_number || item.field_value_date
          return acc
        }, {})

        // Calculate days left
        let daysLeft = 0
        if (dynamicData.closing_date) {
          const closingDate = new Date(dynamicData.closing_date)
          const today = new Date()
          daysLeft = Math.max(
            0,
            Math.ceil((closingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          )
        }

        return {
          id: tender.id,
          title: tender.entity_name,
          code: tender.entity_code,
          department: dynamicData.department || 'Kerala Forest Department',
          status: dynamicData.status || 'active',
          closing_date: dynamicData.closing_date,
          days_left: daysLeft,
          estimated_value: parseFloat(dynamicData.estimated_value) || 0,
          emd_amount: parseFloat(dynamicData.emd_amount) || 0,
          lots: parseInt(dynamicData.lot_count) || 0,
          bid_strategy: dynamicData.bid_strategy || 'moderate',
          ai_confidence: parseFloat(dynamicData.ai_confidence) || 0,
          competitor_count: parseInt(dynamicData.competitor_count) || 0
        }
      })

      // Filter by status if needed
      const filteredTenders =
        status === 'all'
          ? formattedTenders
          : formattedTenders.filter((t: any) => t.status === status)

      return NextResponse.json({
        success: true,
        data: {
          tenders: filteredTenders,
          pagination: {
            total: filteredTenders.length,
            limit,
            offset,
            hasMore: false // Simplified for now
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
