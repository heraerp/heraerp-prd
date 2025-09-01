import { NextRequest, NextResponse } from 'next/server'
import { SAPIntegrationService } from '@/lib/sap-fi/integration-service'
import { SAPConnectorFactory } from '@/lib/sap-fi/connectors/factory'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Rename from /sap-fi to /financial-integration for vendor-agnostic naming
export async function POST(request: NextRequest) {
  try {
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...params } = body

    let result: any

    switch (action) {
      case 'post_transaction':
        result = await SAPIntegrationService.postTransaction(params.transaction_id)
        break

      case 'post_batch':
        result = await SAPIntegrationService.postBatch(params.transaction_ids)
        break

      case 'check_duplicate':
        result = await checkDuplicateInvoice(params)
        break

      case 'sync_master_data':
        result = await SAPIntegrationService.syncMasterData(
          params.organization_id,
          params.entity_type
        )
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Financial integration API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function checkDuplicateInvoice(params: any) {
  // Simulate duplicate detection with AI analysis
  const duplicateCheck = {
    is_duplicate: Math.random() > 0.7, // 30% chance of duplicate
    confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
    matches: [],
    recommendation: '',
    ai_analysis: {
      risk_level: 'medium' as const,
      explanation: 'Based on historical patterns and vendor behavior',
      suggested_action: 'Review transaction details carefully'
    }
  }

  if (duplicateCheck.is_duplicate) {
    duplicateCheck.matches = [{
      transaction_id: 'demo-123',
      invoice_number: params.invoice_number,
      amount: params.invoice_amount,
      date: params.invoice_date,
      vendor_name: 'Demo Vendor',
      confidence_factors: {
        amount_match: true,
        date_proximity: true,
        invoice_number_match: true,
        vendor_match: true
      }
    }]
    duplicateCheck.recommendation = 'DO NOT POST - Potential duplicate detected'
    duplicateCheck.ai_analysis.risk_level = duplicateCheck.confidence > 0.8 ? 'high' : 'medium'
  } else {
    duplicateCheck.recommendation = 'Safe to post - No duplicates found'
    duplicateCheck.ai_analysis.risk_level = 'low'
  }

  return duplicateCheck
}