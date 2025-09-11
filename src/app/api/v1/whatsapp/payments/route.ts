import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { 
  sharePaymentLink,
  confirmPayment
} from '@/lib/mcp/whatsapp-six-tables-mcp'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organization ID from user's entities
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('organization_id')
      .eq('entity_type', 'user')
      .eq('entity_code', user.id)
      .single()

    if (!userEntity?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const organizationId = userEntity.organization_id
    const body = await request.json()
    const { action, ...params } = body

    let result: any

    switch (action) {
      case 'sharePaymentLink':
        result = await sharePaymentLink(
          organizationId,
          params.threadId,
          {
            invoiceEntityId: params.invoiceEntityId,
            paymentUrl: params.paymentUrl,
            amount: params.amount,
            currency: params.currency || 'USD'
          }
        )
        break

      case 'confirmPayment':
        result = await confirmPayment(organizationId, {
          payerEntityId: params.payerEntityId,
          payeeEntityId: params.payeeEntityId,
          amount: params.amount,
          currency: params.currency || 'USD',
          providerRef: params.providerRef,
          invoiceEntityId: params.invoiceEntityId
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action', available_actions: [
            'sharePaymentLink',
            'confirmPayment'
          ]},
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      action,
      ...result
    })

  } catch (error) {
    console.error('WhatsApp Payments API error:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organization ID from user's entities
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('organization_id')
      .eq('entity_type', 'user')
      .eq('entity_code', user.id)
      .single()

    if (!userEntity?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const organizationId = userEntity.organization_id

    // Get all payment links shared via WhatsApp
    const { data: paymentLinks, error } = await supabase
      .from('universal_transaction_lines')
      .select(`
        *,
        universal_transactions!inner(*)
      `)
      .eq('organization_id', organizationId)
      .eq('line_type', 'PAYMENT_LINK')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Format payment links
    const formattedLinks = paymentLinks?.map(link => ({
      id: link.id,
      threadId: link.transaction_id,
      amount: link.line_amount,
      currency: link.line_data?.currency || 'USD',
      paymentUrl: link.line_data?.paylink_url,
      invoiceEntityId: link.line_data?.ar_invoice_entity_id,
      status: link.line_data?.payment_status || 'pending',
      sharedAt: link.line_data?.shared_at || link.created_at,
      createdAt: link.created_at
    })) || []

    return NextResponse.json({
      status: 'success',
      data: {
        paymentLinks: formattedLinks,
        total: formattedLinks.length,
        totalAmount: formattedLinks.reduce((sum, link) => sum + link.amount, 0)
      }
    })

  } catch (error) {
    console.error('WhatsApp Payments API error:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}