import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { enterpriseMiddleware } from '@/lib/middleware/enterprise-middleware'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return enterpriseMiddleware(request, async (req, ctx) => {
    const organizationId = ctx.organizationId
    const tenderId = params.id

    try {
      // 1. Get tender header from core_entities
      const { data: tender, error: tenderError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', tenderId)
        .single()

      if (tenderError || !tender) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Tender not found',
            smart_code: 'HERA.FURNITURE.TENDER.NOT_FOUND.v1'
          },
          { status: 404 }
        )
      }

      // 2. Get all dynamic data for the tender
      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', tenderId)
        .eq('organization_id', organizationId)

      // 3. Get tender status from relationships
      const { data: statusRel, error: statusError } = await supabase
        .from('core_relationships')
        .select(`
          *,
          status:to_entity_id(entity_code, entity_name)
        `)
        .eq('from_entity_id', tenderId)
        .eq('relationship_type', 'has_status')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)

      // 4. Get lots related to this tender
      const { data: lots, error: lotsError } = await supabase
        .from('core_relationships')
        .select(`
          *,
          lot:to_entity_id(
            id,
            entity_name,
            entity_code,
            dynamic_data:core_dynamic_data(*)
          )
        `)
        .eq('from_entity_id', tenderId)
        .eq('relationship_type', 'TENDER_HAS_LOT')
        .eq('organization_id', organizationId)

      // 5. Get all transactions for this tender
      const { data: transactions, error: txnError } = await supabase
        .from('universal_transactions')
        .select(`
          *,
          lines:universal_transaction_lines(*)
        `)
        .eq('reference_entity_id', tenderId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      // 6. Get documents linked to this tender
      const { data: documents, error: docsError } = await supabase
        .from('core_relationships')
        .select(`
          *,
          document:to_entity_id(
            id,
            entity_name,
            entity_code,
            dynamic_data:core_dynamic_data(*)
          )
        `)
        .eq('from_entity_id', tenderId)
        .eq('relationship_type', 'TENDER_HAS_DOCUMENT')
        .eq('organization_id', organizationId)

      // 7. Get bid strategy AI insights
      const { data: aiInsights, error: aiError } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('reference_entity_id', tenderId)
        .eq('smart_code', 'HERA.FURNITURE.TENDER.AI.STRATEGY.CALCULATED.v1')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1)

      // 8. Get competitor analysis
      const { data: competitors, error: compError } = await supabase
        .from('universal_transactions')
        .select(`
          *,
          competitor:from_entity_id(
            id,
            entity_name,
            entity_code
          )
        `)
        .eq('reference_entity_id', tenderId)
        .eq('smart_code', 'HERA.FURNITURE.TENDER.COMPETITOR.BID.DETECTED.v1')
        .eq('organization_id', organizationId)

      // Format dynamic data
      const dynamicFields = (dynamicData || []).reduce((acc: any, item: any) => {
        acc[item.field_name] = item.field_value_text || item.field_value_number || item.field_value_date
        return acc
      }, {})

      // Format lots
      const formattedLots = (lots || []).map((rel: any) => {
        const lotData = rel.lot
        const lotDynamic = (lotData?.dynamic_data || []).reduce((acc: any, item: any) => {
          acc[item.field_name] = item.field_value_text || item.field_value_number || item.field_value_date
          return acc
        }, {})
        
        return {
          id: lotData.id,
          name: lotData.entity_name,
          code: lotData.entity_code,
          ...lotDynamic
        }
      })

      // Format documents
      const formattedDocs = (documents || []).map((rel: any) => {
        const docData = rel.document
        const docDynamic = (docData?.dynamic_data || []).reduce((acc: any, item: any) => {
          acc[item.field_name] = item.field_value_text || item.field_value_number || item.field_value_date
          return acc
        }, {})
        
        return {
          id: docData.id,
          name: docData.entity_name,
          type: docData.entity_code,
          ...docDynamic
        }
      })

      // Build response
      const response = {
        id: tender.id,
        code: tender.entity_code,
        title: tender.entity_name,
        smart_code: tender.smart_code,
        created_at: tender.created_at,
        status: statusRel?.[0]?.status?.entity_code || 'draft',
        ...dynamicFields,
        lots: formattedLots,
        documents: formattedDocs,
        transactions,
        ai_insights: aiInsights?.[0] || null,
        competitors: competitors || []
      }

      return NextResponse.json({
        success: true,
        data: response,
        smart_code: 'HERA.FURNITURE.TENDER.DETAIL.RETRIEVED.v1'
      })
    } catch (error) {
      console.error('Error fetching tender detail:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch tender detail',
          smart_code: 'HERA.FURNITURE.TENDER.DETAIL.ERROR.v1'
        },
        { status: 500 }
      )
    }
  })
}

// Calculate bid for a tender
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return enterpriseMiddleware(request, async (req, ctx) => {
    const organizationId = ctx.organizationId
    const userId = ctx.userId
    const tenderId = params.id
    const body = await request.json()

    try {
      // Validate tender exists
      const { data: tender, error: tenderError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', tenderId)
        .single()

      if (tenderError || !tender) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Tender not found',
            smart_code: 'HERA.FURNITURE.TENDER.NOT_FOUND.v1'
          },
          { status: 404 }
        )
      }

      // Create AI agent task for bid calculation
      const aiTask = {
        transaction_type: 'ai_task',
        transaction_date: new Date().toISOString(),
        organization_id: organizationId,
        from_entity_id: userId,
        reference_entity_id: tenderId,
        smart_code: 'HERA.FURNITURE.TENDER.AI.BIDSTRAT.REQUESTED.v1',
        total_amount: 0,
        metadata: {
          inputs: {
            tender_id: tenderId,
            costs: body.costs || {},
            margin_preference: body.margin_preference || 'moderate',
            competitor_analysis: body.include_competitors || true
          }
        },
        ai_agent_id: 'HERA.FURNITURE.TENDER.AI.BIDSTRAT.v1',
        ai_confidence: null,
        ai_insights: null
      }

      const { data: aiTransaction, error: aiError } = await supabase
        .from('universal_transactions')
        .insert(aiTask)
        .select()
        .single()

      if (aiError) {
        throw new Error('Failed to create AI calculation task')
      }

      // In a real implementation, this would trigger an async AI process
      // For now, we'll create a draft bid transaction
      const draftBid = {
        transaction_type: 'bid_draft',
        transaction_date: new Date().toISOString(),
        organization_id: organizationId,
        from_entity_id: organizationId, // Org is the bidder
        to_entity_id: tenderId,
        reference_entity_id: tenderId,
        smart_code: 'HERA.FURNITURE.TENDER.BID.DRAFTED.v1',
        total_amount: body.estimated_amount || 0,
        metadata: {
          tender_code: tender.entity_code,
          tender_name: tender.entity_name,
          bid_strategy: 'moderate',
          margin_percentage: 12.5,
          transport_cost: body.costs?.transport_mt || 3200,
          handling_cost: body.costs?.handling_mt || 900
        },
        ai_agent_id: 'HERA.FURNITURE.TENDER.AI.BIDSTRAT.v1',
        ai_confidence: 78,
        ai_insights: {
          recommendation: 'Moderate bid strategy recommended based on competitor analysis',
          risk_level: 'medium',
          win_probability: 0.42
        }
      }

      const { data: bidTransaction, error: bidError } = await supabase
        .from('universal_transactions')
        .insert(draftBid)
        .select()
        .single()

      if (bidError) {
        throw new Error('Failed to create draft bid')
      }

      return NextResponse.json({
        success: true,
        data: {
          ai_task_id: aiTransaction.id,
          draft_bid_id: bidTransaction.id,
          ...bidTransaction
        },
        smart_code: 'HERA.FURNITURE.TENDER.BID.CALCULATION.INITIATED.v1'
      })
    } catch (error) {
      console.error('Error calculating bid:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to calculate bid',
          smart_code: 'HERA.FURNITURE.TENDER.BID.CALCULATION.ERROR.v1'
        },
        { status: 500 }
      )
    }
  })
}