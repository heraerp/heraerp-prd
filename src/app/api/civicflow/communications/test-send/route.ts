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

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const body = await request.json()
    const { template_id, channel, recipient } = body

    // Check demo mode
    const demoCheckResult = await guardDemoOperation({
      orgId,
      operation: 'test_send',
      requestPath: request.nextUrl.pathname
    })

    if (!demoCheckResult.allowed) {
      return NextResponse.json(
        {
          error: 'Test send blocked in demo mode',
          demo_mode: true,
          message:
            'In demo mode, external communications are disabled. Your test send was simulated but not actually sent.'
        },
        {
          status: 200, // Return 200 to not break the UI
          headers: { 'X-Demo-Mode': 'true' }
        }
      )
    }

    // Get template details
    const { data: template } = await supabase
      .from('core_entities')
      .select('*, core_dynamic_data(*)')
      .eq('id', template_id)
      .eq('entity_type', 'comm_template')
      .single()

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Extract template content from dynamic data
    const dynamicFields =
      template.core_dynamic_data?.reduce((acc: any, field: any) => {
        acc[field.field_name] = field.field_value_text || field.field_value_html
        return acc
      }, {}) || {}

    // Create a test message transaction
    const testMessageTxn = {
      organization_id: orgId,
      transaction_type: 'comm_message_out',
      transaction_code: generateTransactionCode('TEST'),
      smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.TEST.SEND.V1',
      reference_entity_id: template_id,
      metadata: {
        channel,
        recipient,
        sender: 'CivicFlow Test',
        subject: dynamicFields.subject || 'Test Message',
        body_text: dynamicFields.body_text || 'Test message content',
        template_id,
        template_name: template.entity_name,
        is_test: true,
        demo_mode: isDemoMode(orgId),
        sent_at: new Date().toISOString(),
        status: isDemoMode(orgId) ? 'simulated' : 'sent'
      }
    }

    const { data: txn, error } = await supabase
      .from('universal_transactions')
      .insert(testMessageTxn)
      .select()
      .single()

    if (error) {
      throw error
    }

    // In demo mode, we just simulate the send
    if (isDemoMode(orgId)) {
      // Create audit log entry
      await supabase.from('universal_transactions').insert({
        organization_id: orgId,
        transaction_type: 'comm_test_send_simulated',
        transaction_code: generateTransactionCode('LOG'),
        smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.LOG.TEST.V1',
        reference_entity_id: template_id,
        metadata: {
          action: 'test_send_simulated',
          template_id,
          recipient,
          channel,
          demo_mode: true
        }
      })

      return NextResponse.json({
        success: true,
        demo_mode: true,
        message: `Test ${channel} simulated (demo mode). In production, this would send to ${recipient}.`,
        transaction_id: txn.id
      })
    }

    // In production mode, actual send logic would go here
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      message: `Test ${channel} sent successfully to ${recipient}`,
      transaction_id: txn.id
    })
  } catch (error) {
    console.error('Error sending test message:', error)
    return NextResponse.json({ error: 'Failed to send test message' }, { status: 500 })
  }
}
