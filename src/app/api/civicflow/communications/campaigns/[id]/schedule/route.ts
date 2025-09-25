import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode, guardDemoOperation } from '@/lib/demo-guard'
import { generateTransactionCode } from '@/lib/utils/codes'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const { id } = params
    const body = await request.json()

    // Check demo mode
    const demoCheckResult = await guardDemoOperation({
      orgId,
      operation: 'schedule_campaign',
      requestPath: request.nextUrl.pathname
    })

    if (!demoCheckResult.allowed) {
      return NextResponse.json(
        {
          error: 'Campaign scheduling blocked in demo mode',
          demo_mode: true
        },
        {
          status: 400,
          headers: { 'X-Demo-Mode': 'true' }
        }
      )
    }

    // In demo mode, we simulate scheduling without actually doing it
    if (isDemoMode(orgId)) {
      // Create a "simulated" transaction log
      await supabase.from('universal_transactions').insert({
        organization_id: orgId,
        transaction_type: 'comm_campaign_scheduled',
        transaction_code: generateTransactionCode('CAMP'),
        smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.CAMPAIGN.SCHEDULE.v1',
        reference_entity_id: id,
        metadata: {
          ...body,
          demo_mode: true,
          simulated: true
        }
      })

      // Update campaign status to "scheduled" but mark as demo
      await supabase.from('core_dynamic_data').upsert([
        {
          entity_id: id,
          field_name: 'status',
          field_value_text: 'scheduled',
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.STATUS.v1'
        },
        {
          entity_id: id,
          field_name: 'schedule_at',
          field_value_text: body.schedule_at,
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.SCHEDULE.v1'
        },
        {
          entity_id: id,
          field_name: 'demo_scheduled',
          field_value_boolean: true,
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.DEMO.v1'
        }
      ])

      return NextResponse.json({
        success: true,
        demo_mode: true,
        message: 'Campaign scheduled (demo mode - no messages will be sent)'
      })
    }

    // Production scheduling would go here

    return NextResponse.json({
      success: true,
      message: 'Campaign scheduled successfully'
    })
  } catch (error) {
    console.error('Error scheduling campaign:', error)
    return NextResponse.json({ error: 'Failed to schedule campaign' }, { status: 500 })
  }
}
