import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CaseTimelineEvent } from '@/types/cases'

const DEMO_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    const caseId = params.id
    
    // Get organization ID from header
    const orgId = request.headers.get('X-Organization-Id') || 
      (request.nextUrl.pathname.startsWith('/civicflow') ? DEMO_ORG_ID : null)
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      )
    }

    // Verify case exists
    const { data: caseEntity, error: caseError } = await supabase
      .from('core_entities')
      .select('id')
      .eq('id', caseId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'case')
      .single()

    if (caseError || !caseEntity) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      )
    }

    // Get all transactions related to this case
    const { data: transactions, error: txnError } = await supabase
      .from('universal_transactions')
      .select(`
        id,
        transaction_code,
        transaction_type,
        smart_code,
        created_at,
        metadata,
        created_by:user_entity_id(
          entity_name
        )
      `)
      .eq('source_entity_id', caseId)
      .order('created_at', { ascending: false })

    if (txnError) throw txnError

    // Build timeline events
    const timelineEvents: CaseTimelineEvent[] = (transactions || []).map(txn => {
      // Generate description based on smart code
      let description = 'Activity recorded'
      
      if (txn.smart_code.includes('.CREATED.')) {
        description = 'Case created'
      } else if (txn.smart_code.includes('.ACTION.APPROVE.')) {
        description = 'Case approved'
      } else if (txn.smart_code.includes('.ACTION.VARY.')) {
        description = 'Case variation recorded'
      } else if (txn.smart_code.includes('.ACTION.WAIVE.')) {
        description = 'Waiver recorded'
      } else if (txn.smart_code.includes('.ACTION.BREACH.')) {
        description = 'Breach recorded'
      } else if (txn.smart_code.includes('.ACTION.CLOSE.')) {
        description = 'Case closed'
      }

      // Add additional context from metadata
      if (txn.metadata) {
        if (txn.metadata.approval_notes) {
          description += `: ${txn.metadata.approval_notes}`
        } else if (txn.metadata.variation_details) {
          description += `: ${txn.metadata.variation_details}`
        } else if (txn.metadata.waiver_reason) {
          description += `: ${txn.metadata.waiver_reason}`
        } else if (txn.metadata.breach_details) {
          description += `: ${txn.metadata.breach_details}`
        } else if (txn.metadata.close_reason) {
          description += `: ${txn.metadata.close_reason}`
        }
      }

      return {
        id: txn.id,
        transaction_code: txn.transaction_code,
        transaction_type: txn.transaction_type,
        smart_code: txn.smart_code,
        description,
        created_at: txn.created_at,
        created_by: txn.created_by?.entity_name || null,
        metadata: txn.metadata || {}
      }
    })

    return NextResponse.json(timelineEvents)

  } catch (error) {
    console.error('Case timeline error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    )
  }
}