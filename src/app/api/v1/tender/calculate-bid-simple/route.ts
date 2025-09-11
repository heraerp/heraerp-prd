import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenderId, estimatedAmount, costs, marginPreference } = body

    // Simple organization ID for demo
    const organizationId = 'f0af4ced-9d12-4a55-a649-b484368db249'
    
    // Set organization context
    universalApi.setOrganizationId(organizationId)

    // Validate tender exists
    let tender
    try {
      console.log('🔍 Fetching tender:', tenderId)
      const { data: entities, error } = await universalApi.read('core_entities')
      
      if (error) {
        console.error('Universal API error:', error)
        throw new Error(error)
      }
      
      // Filter in JavaScript since Universal API read doesn't support filters
      tender = entities?.find(e => 
        e.id === tenderId && 
        e.organization_id === organizationId &&
        e.entity_type === 'HERA.FURNITURE.TENDER.NOTICE.v1'
      )
      
      if (!tender) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Tender not found'
          },
          { status: 404 }
        )
      }
      
      console.log('✅ Found tender:', tender.entity_code)
    } catch (error) {
      console.error('Error fetching tender:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch tender data'
        },
        { status: 500 }
      )
    }

    // Calculate bid based on margin preference
    const baseMargin = marginPreference === 'aggressive' ? 0.08 : 
                      marginPreference === 'conservative' ? 0.15 : 0.125
    
    const transportCost = costs?.transport_mt || 3200
    const handlingCost = costs?.handling_mt || 900
    const totalCost = estimatedAmount * 0.85 // Assume 85% is base cost
    const overheads = transportCost + handlingCost
    const bidAmount = totalCost + overheads + (totalCost * baseMargin)

    // Create draft bid transaction
    const draftBid = {
      transaction_type: 'bid_draft',
      transaction_date: new Date().toISOString(),
      organization_id: organizationId,
      from_entity_id: organizationId,
      to_entity_id: tenderId,
      reference_entity_id: tenderId,
      smart_code: 'HERA.FURNITURE.TENDER.BID.DRAFTED.v1',
      total_amount: Math.round(bidAmount),
      metadata: {
        tender_code: tender.entity_code,
        tender_name: tender.entity_name,
        bid_strategy: marginPreference || 'moderate',
        margin_percentage: baseMargin * 100,
        transport_cost: transportCost,
        handling_cost: handlingCost,
        base_cost: totalCost,
        overheads: overheads
      },
      ai_agent_id: 'HERA.FURNITURE.TENDER.AI.BIDSTRAT.v1',
      ai_confidence: marginPreference === 'aggressive' ? 65 : 
                     marginPreference === 'conservative' ? 85 : 78,
      ai_insights: {
        recommendation: `${marginPreference || 'Moderate'} bid strategy with ${(baseMargin * 100).toFixed(1)}% margin`,
        risk_level: marginPreference === 'aggressive' ? 'high' : 
                   marginPreference === 'conservative' ? 'low' : 'medium',
        win_probability: marginPreference === 'aggressive' ? 0.35 : 
                        marginPreference === 'conservative' ? 0.65 : 0.45,
        competitor_analysis: 'Based on historical data, 3-5 competitors expected',
        cost_breakdown: {
          base_cost: totalCost,
          transport: transportCost,
          handling: handlingCost,
          margin: totalCost * baseMargin,
          total: bidAmount
        }
      }
    }

    // Create the transaction using Universal API
    let bidTransaction
    try {
      console.log('📝 Creating draft bid transaction...')
      const result = await universalApi.createTransaction({
        transaction_type: draftBid.transaction_type,
        transaction_date: draftBid.transaction_date,
        reference_entity_id: draftBid.reference_entity_id,
        to_entity_id: draftBid.to_entity_id,
        smart_code: draftBid.smart_code,
        total_amount: draftBid.total_amount,
        metadata: draftBid.metadata,
        ai_agent_id: draftBid.ai_agent_id,
        ai_confidence: draftBid.ai_confidence,
        ai_insights: draftBid.ai_insights
      })
      
      if (!result.success || !result.data) {
        throw new Error('Failed to create transaction')
      }
      
      bidTransaction = result.data
      console.log('✅ Created draft bid:', bidTransaction.id)
    } catch (error) {
      console.error('Error creating bid transaction:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create draft bid'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        draft_bid_id: bidTransaction.id,
        bid_amount: Math.round(bidAmount),
        margin_percentage: baseMargin * 100,
        ai_confidence: draftBid.ai_confidence,
        ...bidTransaction
      }
    })
  } catch (error) {
    console.error('Error calculating bid:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to calculate bid'
      },
      { status: 500 }
    )
  }
}