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

    try {
      // 1. Active Tenders with "closing soon" count
      const activeTendersQuery = `
        WITH tender_status AS (
          -- Get latest status for each tender
          SELECT DISTINCT ON (t.id)
            t.id as tender_id,
            r.relationship_type as status
          FROM core_entities t
          LEFT JOIN core_relationships r ON r.from_entity_id = t.id
            AND r.relationship_type = 'has_status'
          WHERE t.organization_id = $1
            AND t.entity_type = 'HERA.FURNITURE.TENDER.NOTICE.v1'
          ORDER BY t.id, r.created_at DESC
        )
        SELECT 
          COUNT(*) AS active_tenders,
          COUNT(
            CASE 
              WHEN d.field_value_date <= NOW() + INTERVAL '7 days' 
              THEN 1 
            END
          ) AS closing_soon
        FROM tender_status ts
        LEFT JOIN core_dynamic_data d ON d.entity_id = ts.tender_id
          AND d.field_name = 'closing_date'
          AND d.organization_id = $1
        WHERE ts.status IN ('active', 'watchlist', 'submitted')
      `

      // Execute the query directly since execute_sql RPC may not exist
      const { data: activeTenders, error: activeTendersError } = await supabase
        .from('core_entities')
        .select(`
          id,
          entity_type,
          core_dynamic_data!inner(field_name, field_value_date)
        `)
        .eq('organization_id', organizationId)
        .eq('entity_type', 'HERA.FURNITURE.TENDER.NOTICE.v1')
        .then(result => {
          if (result.error) return { data: null, error: result.error }
          
          // Process the data to count active tenders and closing soon
          const tenders = result.data || []
          const activeTenderCount = tenders.length
          const closingSoon = tenders.filter(tender => {
            const closingDateField = tender.core_dynamic_data?.find(
              (d: any) => d.field_name === 'closing_date'
            )
            if (closingDateField?.field_value_date) {
              const closingDate = new Date(closingDateField.field_value_date)
              const daysUntilClosing = (closingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              return daysUntilClosing <= 7 && daysUntilClosing >= 0
            }
            return false
          }).length
          
          return { 
            data: [{ active_tenders: activeTenderCount, closing_soon: closingSoon }], 
            error: null 
          }
        })

      // 2. Bids Submitted (with delta this month)
      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)
      
      const previousMonth = new Date(currentMonth)
      previousMonth.setMonth(previousMonth.getMonth() - 1)
      
      const nextMonth = new Date(currentMonth)
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      const { count: currentBids } = await supabase
        .from('universal_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .like('smart_code', 'HERA.FURNITURE.TENDER.BID.SUBMITTED.v%')
        .gte('created_at', currentMonth.toISOString())
        .lt('created_at', nextMonth.toISOString())

      const { count: previousBids } = await supabase
        .from('universal_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .like('smart_code', 'HERA.FURNITURE.TENDER.BID.SUBMITTED.v%')
        .gte('created_at', previousMonth.toISOString())
        .lt('created_at', currentMonth.toISOString())

      const bidsSubmitted = [{
        bids_submitted: currentBids || 0,
        delta_vs_last_month: (currentBids || 0) - (previousBids || 0)
      }]
      const bidsError = null

      // 3. Win Rate (quarterly)
      const quarterStart = new Date()
      quarterStart.setMonth(Math.floor(quarterStart.getMonth() / 3) * 3)
      quarterStart.setDate(1)
      quarterStart.setHours(0, 0, 0, 0)

      const { data: submittedTenders } = await supabase
        .from('universal_transactions')
        .select('reference_entity_id')
        .eq('organization_id', organizationId)
        .like('smart_code', 'HERA.FURNITURE.TENDER.BID.SUBMITTED.v%')
        .gte('created_at', quarterStart.toISOString())

      const { data: wonTenders } = await supabase
        .from('universal_transactions')
        .select('reference_entity_id')
        .eq('organization_id', organizationId)
        .eq('smart_code', 'HERA.FURNITURE.TENDER.AWARD.RECEIVED.v1')
        .gte('created_at', quarterStart.toISOString())

      const uniqueSubmitted = new Set(submittedTenders?.map(t => t.reference_entity_id) || [])
      const uniqueWon = new Set(wonTenders?.map(t => t.reference_entity_id) || [])
      
      const winRate = [{
        win_rate_pct: uniqueSubmitted.size > 0 
          ? Math.round((uniqueWon.size / uniqueSubmitted.size) * 100 * 100) / 100
          : 0,
        total_bids: uniqueSubmitted.size,
        won_bids: uniqueWon.size
      }]
      const winRateError = null

      // 4. Total EMD (and locked amount)
      const { data: emdPaidTxns } = await supabase
        .from('universal_transactions')
        .select(`
          id,
          universal_transaction_lines!inner(line_amount)
        `)
        .eq('organization_id', organizationId)
        .eq('smart_code', 'HERA.FURNITURE.FIN.EMD.PAID.v1')

      const { data: emdRefundedTxns } = await supabase
        .from('universal_transactions')
        .select(`
          id,
          universal_transaction_lines!inner(line_amount)
        `)
        .eq('organization_id', organizationId)
        .eq('smart_code', 'HERA.FURNITURE.FIN.EMD.REFUND_RECEIVED.v1')

      const totalEmdPaid = emdPaidTxns?.reduce((sum, txn) => {
        const lineTotal = txn.universal_transaction_lines?.reduce(
          (lineSum: number, line: any) => lineSum + (line.line_amount || 0), 
          0
        )
        return sum + lineTotal
      }, 0) || 0

      const totalEmdRefunded = emdRefundedTxns?.reduce((sum, txn) => {
        const lineTotal = txn.universal_transaction_lines?.reduce(
          (lineSum: number, line: any) => lineSum + (line.line_amount || 0), 
          0
        )
        return sum + lineTotal
      }, 0) || 0

      const emd = [{
        total_emd_paid: totalEmdPaid,
        locked_emd: totalEmdPaid - totalEmdRefunded
      }]
      const emdError = null

      // Check for errors
      if (activeTendersError || bidsError || winRateError || emdError) {
        throw new Error('Failed to fetch tender metrics')
      }

      // Format response
      const metrics = {
        activeTenders: {
          total: activeTenders?.[0]?.active_tenders || 0,
          closingSoon: activeTenders?.[0]?.closing_soon || 0
        },
        bidsSubmitted: {
          current: bidsSubmitted?.[0]?.bids_submitted || 0,
          delta: bidsSubmitted?.[0]?.delta_vs_last_month || 0
        },
        winRate: {
          percentage: winRate?.[0]?.win_rate_pct || 0,
          totalBids: winRate?.[0]?.total_bids || 0,
          wonBids: winRate?.[0]?.won_bids || 0
        },
        emd: {
          totalPaid: emd?.[0]?.total_emd_paid || 0,
          locked: emd?.[0]?.locked_emd || 0
        }
      }

      return NextResponse.json({
        success: true,
        data: metrics,
        smart_code: 'HERA.FURNITURE.TENDER.METRICS.RETRIEVED.v1'
      })
    } catch (error) {
      console.error('Error fetching tender metrics:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch tender metrics',
          smart_code: 'HERA.FURNITURE.TENDER.METRICS.ERROR.v1'
        },
        { status: 500 }
      )
    }
  })
}