import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enterpriseMiddleware } from '@/lib/middleware/enterprise-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  return enterpriseMiddleware(request, async (req, ctx) => {
    const organizationId = ctx.organizationId
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '6months' // 6months, quarter, year

    try {
      // Define period filter
      const periodFilter =
        period === 'quarter'
          ? "NOW() - INTERVAL '3 months'"
          : period === 'year'
            ? "NOW() - INTERVAL '1 year'"
            : "NOW() - INTERVAL '6 months'"

      // 1. Monthly bid performance
      const monthlyPerformanceQuery = `
        WITH monthly_bids AS (
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            SUM(CASE WHEN smart_code = 'HERA.FURNITURE.TENDER.BID.SUBMITTED.v1' THEN 1 ELSE 0 END) as submitted,
            SUM(CASE WHEN smart_code = 'HERA.FURNITURE.TENDER.AWARD.RECEIVED.v1' THEN 1 ELSE 0 END) as won,
            SUM(CASE WHEN smart_code = 'HERA.FURNITURE.TENDER.BID.LOST.v1' THEN 1 ELSE 0 END) as lost,
            SUM(CASE WHEN smart_code = 'HERA.FURNITURE.TENDER.AWARD.RECEIVED.v1' THEN total_amount ELSE 0 END) as value
          FROM universal_transactions
          WHERE organization_id = $1
            AND created_at >= ${periodFilter}
            AND smart_code IN (
              'HERA.FURNITURE.TENDER.BID.SUBMITTED.v1',
              'HERA.FURNITURE.TENDER.AWARD.RECEIVED.v1',
              'HERA.FURNITURE.TENDER.BID.LOST.v1'
            )
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month
        )
        SELECT 
          TO_CHAR(month, 'Mon') as month_name,
          submitted,
          won,
          lost,
          ROUND(value / 100000, 2) as value_lakhs
        FROM monthly_bids
      `

      const { data: monthlyData, error: monthlyError } = await supabase.rpc('execute_sql', {
        query: monthlyPerformanceQuery,
        params: [organizationId]
      })

      // 2. Win rate by category (wood type)
      const winRateByCategoryQuery = `
        WITH category_performance AS (
          SELECT 
            d.field_value_text as category,
            COUNT(DISTINCT t.reference_entity_id) as total_bids,
            COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM universal_transactions ut2
                WHERE ut2.reference_entity_id = t.reference_entity_id
                  AND ut2.smart_code = 'HERA.FURNITURE.TENDER.AWARD.RECEIVED.v1'
                  AND ut2.organization_id = $1
              ) THEN t.reference_entity_id 
            END) as won_bids
          FROM universal_transactions t
          JOIN core_dynamic_data d ON d.entity_id = t.reference_entity_id
            AND d.field_name = 'wood_type'
            AND d.organization_id = $1
          WHERE t.organization_id = $1
            AND t.smart_code = 'HERA.FURNITURE.TENDER.BID.SUBMITTED.v1'
            AND t.created_at >= ${periodFilter}
          GROUP BY d.field_value_text
        )
        SELECT 
          category,
          total_bids,
          won_bids,
          CASE 
            WHEN total_bids = 0 THEN 0 
            ELSE ROUND(100.0 * won_bids / total_bids, 1) 
          END as win_rate
        FROM category_performance
        WHERE category IS NOT NULL
        ORDER BY total_bids DESC
      `

      const { data: categoryData, error: categoryError } = await supabase.rpc('execute_sql', {
        query: winRateByCategoryQuery,
        params: [organizationId]
      })

      // 3. Competitor market share
      const competitorShareQuery = `
        WITH competitor_wins AS (
          SELECT 
            ce.entity_name as competitor_name,
            COUNT(DISTINCT ut.reference_entity_id) as tenders_won,
            SUM(ut.total_amount) as total_value
          FROM universal_transactions ut
          JOIN core_entities ce ON ce.id = ut.from_entity_id
          WHERE ut.organization_id = $1
            AND ut.smart_code = 'HERA.FURNITURE.TENDER.COMPETITOR.WIN.DETECTED.v1'
            AND ut.created_at >= ${periodFilter}
            AND ce.entity_type = 'HERA.FURNITURE.TENDER.COMPETITOR.v1'
          GROUP BY ce.entity_name
        ),
        our_wins AS (
          SELECT 
            'Kerala Furniture Works' as competitor_name,
            COUNT(DISTINCT reference_entity_id) as tenders_won,
            SUM(total_amount) as total_value
          FROM universal_transactions
          WHERE organization_id = $1
            AND smart_code = 'HERA.FURNITURE.TENDER.AWARD.RECEIVED.v1'
            AND created_at >= ${periodFilter}
        ),
        all_competitors AS (
          SELECT * FROM competitor_wins
          UNION ALL
          SELECT * FROM our_wins
        )
        SELECT 
          competitor_name,
          tenders_won,
          ROUND(100.0 * tenders_won / SUM(tenders_won) OVER (), 1) as market_share
        FROM all_competitors
        ORDER BY tenders_won DESC
        LIMIT 5
      `

      const { data: competitorData, error: competitorError } = await supabase.rpc('execute_sql', {
        query: competitorShareQuery,
        params: [organizationId]
      })

      // 4. AI performance metrics
      const aiPerformanceQuery = `
        WITH ai_predictions AS (
          SELECT 
            ut.id,
            ut.reference_entity_id,
            ut.ai_confidence,
            ut.ai_insights->>'win_probability' as predicted_win_prob,
            CASE 
              WHEN EXISTS (
                SELECT 1 FROM universal_transactions ut2
                WHERE ut2.reference_entity_id = ut.reference_entity_id
                  AND ut2.smart_code = 'HERA.FURNITURE.TENDER.AWARD.RECEIVED.v1'
                  AND ut2.organization_id = $1
              ) THEN 1 ELSE 0 
            END as actual_won
          FROM universal_transactions ut
          WHERE ut.organization_id = $1
            AND ut.smart_code = 'HERA.FURNITURE.TENDER.AI.STRATEGY.CALCULATED.v1'
            AND ut.created_at >= ${periodFilter}
            AND ut.ai_confidence IS NOT NULL
        )
        SELECT 
          COUNT(*) as total_predictions,
          AVG(ai_confidence) as avg_confidence,
          COUNT(CASE WHEN actual_won = 1 THEN 1 END) as correct_predictions,
          ROUND(
            100.0 * COUNT(CASE WHEN actual_won = 1 THEN 1 END) / NULLIF(COUNT(*), 0), 
            1
          ) as accuracy_rate
        FROM ai_predictions
      `

      const { data: aiMetrics, error: aiError } = await supabase.rpc('execute_sql', {
        query: aiPerformanceQuery,
        params: [organizationId]
      })

      // 5. Tender value trends
      const valueTrendsQuery = `
        WITH monthly_values AS (
          SELECT 
            DATE_TRUNC('month', ut.created_at) as month,
            AVG(d.field_value_number) as avg_tender_value,
            COUNT(DISTINCT ut.reference_entity_id) as tender_count
          FROM universal_transactions ut
          JOIN core_dynamic_data d ON d.entity_id = ut.reference_entity_id
            AND d.field_name = 'estimated_value'
            AND d.organization_id = $1
          WHERE ut.organization_id = $1
            AND ut.smart_code = 'HERA.FURNITURE.TENDER.BID.SUBMITTED.v1'
            AND ut.created_at >= ${periodFilter}
          GROUP BY DATE_TRUNC('month', ut.created_at)
          ORDER BY month
        )
        SELECT 
          TO_CHAR(month, 'Mon') as month_name,
          ROUND(avg_tender_value / 100000, 2) as avg_value_lakhs,
          tender_count
        FROM monthly_values
      `

      const { data: valueTrends, error: valueTrendsError } = await supabase.rpc('execute_sql', {
        query: valueTrendsQuery,
        params: [organizationId]
      })

      // Check for errors
      if (monthlyError || categoryError || competitorError || aiError || valueTrendsError) {
        throw new Error('Failed to fetch analytics data')
      }

      // Format response
      const analytics = {
        monthlyPerformance: monthlyData || [],
        winRateByCategory: categoryData || [],
        competitorMarketShare: competitorData || [],
        aiPerformance: {
          totalPredictions: aiMetrics?.[0]?.total_predictions || 0,
          averageConfidence: Math.round(aiMetrics?.[0]?.avg_confidence || 0),
          accuracyRate: aiMetrics?.[0]?.accuracy_rate || 0,
          correctPredictions: aiMetrics?.[0]?.correct_predictions || 0
        },
        valueTrends: valueTrends || [],
        period: period
      }

      return NextResponse.json({
        success: true,
        data: analytics,
        smart_code: 'HERA.FURNITURE.TENDER.ANALYTICS.RETRIEVED.v1'
      })
    } catch (error) {
      console.error('Error fetching tender analytics:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch tender analytics',
          smart_code: 'HERA.FURNITURE.TENDER.ANALYTICS.ERROR.v1'
        },
        { status: 500 }
      )
    }
  })
}
