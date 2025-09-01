import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface P2PRequest {
  organization_id: string
  transaction_id?: string
  action: 'process_po' | 'process_grn' | 'process_invoice' | 'process_payment' | 'run_payment_batch' | 'check_anomalies'
  metadata?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body: P2PRequest = await req.json()
    const { organization_id, transaction_id, action, metadata } = body

    console.log(`Processing P2P action: ${action} for org: ${organization_id}`)

    switch (action) {
      case 'process_po':
        return await processPO(supabase, organization_id, transaction_id!, metadata)
      
      case 'process_grn':
        return await processGRN(supabase, organization_id, transaction_id!, metadata)
      
      case 'process_invoice':
        return await processInvoice(supabase, organization_id, transaction_id!, metadata)
      
      case 'process_payment':
        return await processPayment(supabase, organization_id, transaction_id!, metadata)
      
      case 'run_payment_batch':
        return await runPaymentBatch(supabase, organization_id, metadata)
      
      case 'check_anomalies':
        return await checkAnomalies(supabase, organization_id, metadata)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('P2P processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Process Purchase Order creation and approval workflow
async function processPO(
  supabase: any,
  orgId: string,
  transactionId: string,
  metadata: any
) {
  console.log(`Processing PO ${transactionId}`)

  // Get PO details
  const { data: po, error: poError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('organization_id', orgId)
    .single()

  if (poError || !po) {
    throw new Error('PO not found')
  }

  // Check if approval required
  if (po.metadata?.approval_required && po.metadata?.approval_status === 'pending_approval') {
    // Create approval workflow
    const approvalLevel = po.metadata.approval_level

    // Create relationship for approval workflow
    const { error: relError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: orgId,
        from_entity_id: transactionId,
        to_entity_id: po.metadata.requester_id || po.created_by,
        relationship_type: 'requires_approval',
        smart_code: 'HERA.P2P.WORKFLOW.ROUTE.v1',
        metadata: {
          approval_level: approvalLevel,
          amount: po.total_amount,
          due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        }
      })

    if (relError) {
      console.error('Error creating approval workflow:', relError)
    }

    // Send notification (simulated)
    console.log(`Approval notification sent for PO ${po.transaction_code} requiring ${approvalLevel} approval`)
  }

  // If auto-approved or already approved, send to supplier
  if (po.metadata?.approval_status === 'approved') {
    // Update PO status to sent
    const { error: updateError } = await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          ...po.metadata,
          po_status: 'sent_to_supplier',
          sent_date: new Date().toISOString()
        }
      })
      .eq('id', transactionId)
      .eq('organization_id', orgId)

    if (updateError) {
      console.error('Error updating PO status:', updateError)
    }

    // Simulate sending to supplier
    console.log(`PO ${po.transaction_code} sent to supplier`)

    // Create commitment in financial system
    await createFinancialCommitment(supabase, orgId, po)
  }

  return new Response(
    JSON.stringify({
      success: true,
      po_number: po.transaction_code,
      status: po.metadata?.approval_status,
      next_action: po.metadata?.approval_required ? 'awaiting_approval' : 'sent_to_supplier'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Process Goods Receipt Note
async function processGRN(
  supabase: any,
  orgId: string,
  transactionId: string,
  metadata: any
) {
  console.log(`Processing GRN ${transactionId}`)

  // Get GRN details
  const { data: grn, error: grnError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('organization_id', orgId)
    .single()

  if (grnError || !grn) {
    throw new Error('GRN not found')
  }

  const poId = grn.metadata?.po_id

  // Update inventory (simulate)
  if (grn.metadata?.update_inventory) {
    console.log(`Updating inventory for ${grn.metadata?.quantity} units`)
    
    // In real implementation, would update inventory entities
    const { error: invError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: orgId,
        entity_id: grn.metadata?.product_id,
        field_name: 'stock_on_hand',
        field_value_number: grn.metadata?.quantity,
        smart_code: 'HERA.INV.STOCK.UPDATE.v1',
        metadata: {
          grn_id: transactionId,
          movement_type: 'receipt',
          warehouse: grn.metadata?.warehouse
        }
      })

    if (invError) {
      console.error('Error updating inventory:', invError)
    }
  }

  // Create liability accrual
  const { data: accrual, error: accrualError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: orgId,
      transaction_type: 'accrual',
      transaction_code: `ACCRUAL-${Date.now()}`,
      smart_code: 'HERA.FIN.ACCRUAL.CREATE.v1',
      total_amount: grn.total_amount,
      metadata: {
        grn_id: transactionId,
        po_id: poId,
        supplier_id: grn.metadata?.supplier_id,
        accrual_account: '2100', // AP Accrual
        expense_account: grn.metadata?.expense_account || '5000'
      }
    })
    .select()
    .single()

  if (accrualError) {
    console.error('Error creating accrual:', accrualError)
  }

  // Notify requester
  console.log(`Goods receipt notification sent for GRN ${grn.transaction_code}`)

  return new Response(
    JSON.stringify({
      success: true,
      grn_number: grn.transaction_code,
      quantity_received: grn.metadata?.quantity,
      accrual_created: !!accrual,
      po_updated: true
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Process Invoice with matching
async function processInvoice(
  supabase: any,
  orgId: string,
  transactionId: string,
  metadata: any
) {
  console.log(`Processing Invoice ${transactionId}`)

  // Get invoice details
  const { data: invoice, error: invError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('organization_id', orgId)
    .single()

  if (invError || !invoice) {
    throw new Error('Invoice not found')
  }

  // Check match status
  const matchStatus = invoice.metadata?.match_status

  if (matchStatus === 'matched') {
    // Auto-approve for payment
    const { error: approveError } = await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          ...invoice.metadata,
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'system_auto_approval'
        }
      })
      .eq('id', transactionId)
      .eq('organization_id', orgId)

    if (approveError) {
      console.error('Error approving invoice:', approveError)
    }

    // Schedule for payment
    await schedulePayment(supabase, orgId, invoice)
  } else if (matchStatus === 'variance') {
    // Create exception for review
    const { error: excError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: orgId,
        entity_id: transactionId,
        field_name: 'invoice_exception',
        field_value_json: {
          type: 'matching_variance',
          match_result: invoice.metadata?.match_result,
          requires_approval: true,
          created_at: new Date().toISOString()
        },
        smart_code: 'HERA.P2P.EXCEPTION.PRICE.v1'
      })

    if (excError) {
      console.error('Error creating exception:', excError)
    }
  }

  // Check for duplicate
  if (invoice.metadata?.duplicate_check?.status === 'potential_duplicate') {
    console.log(`Duplicate invoice alert created for ${invoice.metadata?.invoice_number}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      invoice_number: invoice.metadata?.invoice_number,
      match_status: matchStatus,
      payment_eligible: matchStatus === 'matched',
      exceptions: matchStatus === 'variance' || invoice.metadata?.duplicate_check?.status === 'potential_duplicate'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Process Payment execution
async function processPayment(
  supabase: any,
  orgId: string,
  transactionId: string,
  metadata: any
) {
  console.log(`Processing Payment ${transactionId}`)

  // Get payment details
  const { data: payment, error: payError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('organization_id', orgId)
    .single()

  if (payError || !payment) {
    throw new Error('Payment not found')
  }

  const paymentMethod = payment.metadata?.payment_method || 'ach'

  // Simulate bank integration
  const bankResult = await simulateBankPayment(payment, paymentMethod)

  if (bankResult.success) {
    // Update payment status
    const { error: updateError } = await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          ...payment.metadata,
          payment_status: 'completed',
          bank_reference: bankResult.reference,
          completed_at: new Date().toISOString()
        }
      })
      .eq('id', transactionId)
      .eq('organization_id', orgId)

    if (updateError) {
      console.error('Error updating payment status:', updateError)
    }

    // Update invoice as paid
    const invoiceId = payment.metadata?.invoice_id
    if (invoiceId) {
      const { error: invUpdateError } = await supabase
        .from('universal_transactions')
        .update({
          metadata: supabase.raw(`metadata || '{"payment_status": "paid", "payment_id": "${transactionId}", "paid_date": "${new Date().toISOString()}"}'::jsonb`)
        })
        .eq('id', invoiceId)
        .eq('organization_id', orgId)

      if (invUpdateError) {
        console.error('Error updating invoice:', invUpdateError)
      }
    }

    // Clear AP liability
    await clearAPLiability(supabase, orgId, payment)
  } else {
    // Payment failed
    const { error: failError } = await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          ...payment.metadata,
          payment_status: 'failed',
          failure_reason: bankResult.error,
          failed_at: new Date().toISOString()
        }
      })
      .eq('id', transactionId)
      .eq('organization_id', orgId)

    if (failError) {
      console.error('Error updating failed payment:', failError)
    }
  }

  return new Response(
    JSON.stringify({
      success: bankResult.success,
      payment_reference: bankResult.reference,
      status: bankResult.success ? 'completed' : 'failed',
      error: bankResult.error
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Run payment batch
async function runPaymentBatch(
  supabase: any,
  orgId: string,
  metadata: any
) {
  console.log(`Running payment batch for org ${orgId}`)

  const runType = metadata?.run_type || 'on_due_date'
  const paymentDate = metadata?.payment_date || new Date().toISOString().split('T')[0]

  // Get eligible invoices
  const { data: invoices, error: invError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', orgId)
    .eq('smart_code', 'HERA.P2P.INVOICE.POST.v1')
    .eq('metadata->approval_status', 'approved')
    .is('metadata->payment_id', null)
    .lte('metadata->due_date', paymentDate)

  if (invError) {
    throw new Error('Error fetching invoices: ' + invError.message)
  }

  const payments = []

  // Create payments for eligible invoices
  for (const invoice of invoices || []) {
    // Check for early payment discount
    const discountTerms = invoice.metadata?.payment_terms
    const discount = calculateEarlyPaymentDiscount(invoice, paymentDate, discountTerms)

    const paymentAmount = invoice.total_amount - (discount?.amount || 0)

    const { data: payment, error: payError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: orgId,
        transaction_type: 'payment',
        transaction_code: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        smart_code: 'HERA.P2P.PAYMENT.EXECUTE.v1',
        total_amount: paymentAmount,
        from_entity_id: invoice.to_entity_id, // Payer
        to_entity_id: invoice.from_entity_id, // Supplier
        metadata: {
          invoice_id: invoice.id,
          payment_method: 'ach',
          batch_run_id: `BATCH-${Date.now()}`,
          discount_applied: discount ? true : false,
          discount_amount: discount?.amount || 0
        }
      })
      .select()
      .single()

    if (!payError && payment) {
      payments.push(payment)
    }
  }

  // Process payments
  for (const payment of payments) {
    await processPayment(supabase, orgId, payment.id, {})
  }

  return new Response(
    JSON.stringify({
      success: true,
      batch_id: `BATCH-${Date.now()}`,
      payments_created: payments.length,
      total_amount: payments.reduce((sum, p) => sum + p.total_amount, 0),
      invoices_processed: invoices?.length || 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Check for anomalies using AI
async function checkAnomalies(
  supabase: any,
  orgId: string,
  metadata: any
) {
  console.log(`Checking P2P anomalies for org ${orgId}`)

  const checkPeriod = metadata?.check_period || 30
  const anomalies = []

  // Check for duplicate POs
  const { data: duplicatePOs } = await supabase
    .rpc('find_duplicate_transactions', {
      p_org_id: orgId,
      p_smart_code: 'HERA.P2P.PO.CREATE.v1',
      p_days: checkPeriod
    })

  if (duplicatePOs && duplicatePOs.length > 0) {
    anomalies.push(...duplicatePOs.map(po => ({
      type: 'duplicate_po',
      entity_id: po.id,
      confidence: 0.9,
      details: po
    })))
  }

  // Check for maverick spending (off-contract purchases)
  const { data: maverickSpend } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', orgId)
    .eq('smart_code', 'HERA.P2P.PO.CREATE.v1')
    .is('metadata->contract_id', null)
    .gt('total_amount', 5000)
    .gte('created_at', new Date(Date.now() - checkPeriod * 24 * 60 * 60 * 1000).toISOString())

  if (maverickSpend && maverickSpend.length > 0) {
    anomalies.push(...maverickSpend.map(po => ({
      type: 'maverick_spending',
      entity_id: po.id,
      confidence: 0.85,
      details: {
        amount: po.total_amount,
        supplier: po.metadata?.supplier_name,
        reason: 'High value purchase without contract'
      }
    })))
  }

  // Check for unusual payment patterns
  const { data: paymentStats } = await supabase
    .rpc('calculate_payment_statistics', {
      p_org_id: orgId,
      p_days: 90
    })

  const { data: recentPayments } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', orgId)
    .eq('smart_code', 'HERA.P2P.PAYMENT.EXECUTE.v1')
    .gte('created_at', new Date(Date.now() - checkPeriod * 24 * 60 * 60 * 1000).toISOString())

  for (const payment of recentPayments || []) {
    if (payment.total_amount > (paymentStats?.avg_amount || 0) * 3) {
      anomalies.push({
        type: 'unusual_payment_amount',
        entity_id: payment.id,
        confidence: 0.8,
        details: {
          amount: payment.total_amount,
          average: paymentStats?.avg_amount,
          variance_factor: payment.total_amount / (paymentStats?.avg_amount || 1)
        }
      })
    }
  }

  // Store anomalies
  for (const anomaly of anomalies) {
    await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: orgId,
        entity_id: anomaly.entity_id,
        field_name: 'p2p_anomaly',
        field_value_json: anomaly,
        smart_code: 'HERA.P2P.AI.MAVERICK.DETECT.v1'
      })
  }

  return new Response(
    JSON.stringify({
      success: true,
      anomalies_detected: anomalies.length,
      anomalies: anomalies,
      check_period: checkPeriod,
      ai_recommendations: generateP2PRecommendations(anomalies)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper functions

async function createFinancialCommitment(supabase: any, orgId: string, po: any) {
  // Create commitment in financial system
  const { error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: orgId,
      transaction_type: 'commitment',
      transaction_code: `COMMIT-${po.transaction_code}`,
      smart_code: 'HERA.FIN.COMMIT.CREATE.v1',
      total_amount: po.total_amount,
      metadata: {
        po_id: po.id,
        po_number: po.transaction_code,
        commitment_account: po.metadata?.budget_account || '5000',
        supplier_id: po.metadata?.supplier_id
      }
    })

  if (error) {
    console.error('Error creating commitment:', error)
  }
}

async function schedulePayment(supabase: any, orgId: string, invoice: any) {
  const dueDate = invoice.metadata?.due_date || 
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { error } = await supabase
    .from('core_dynamic_data')
    .insert({
      organization_id: orgId,
      entity_id: invoice.id,
      field_name: 'payment_schedule',
      field_value_json: {
        scheduled_date: dueDate,
        payment_method: 'ach',
        amount: invoice.total_amount,
        status: 'scheduled'
      },
      smart_code: 'HERA.P2P.PAYMENT.SCHEDULE.v1'
    })

  if (error) {
    console.error('Error scheduling payment:', error)
  }
}

async function simulateBankPayment(payment: any, method: string) {
  // Simulate bank API call
  const random = Math.random()
  
  if (random > 0.95) {
    // 5% failure rate
    return {
      success: false,
      error: 'Bank connection timeout'
    }
  }

  return {
    success: true,
    reference: `BANK-${method.toUpperCase()}-${Date.now()}`
  }
}

async function clearAPLiability(supabase: any, orgId: string, payment: any) {
  // Create clearing transaction
  const { error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: orgId,
      transaction_type: 'journal_entry',
      transaction_code: `JE-CLEAR-${payment.transaction_code}`,
      smart_code: 'HERA.FIN.JE.CREATE.v1',
      total_amount: payment.total_amount,
      metadata: {
        payment_id: payment.id,
        debit_account: '2100', // AP
        credit_account: '1000', // Cash
        description: `Clear AP for payment ${payment.transaction_code}`
      }
    })

  if (error) {
    console.error('Error clearing AP:', error)
  }
}

function calculateEarlyPaymentDiscount(invoice: any, paymentDate: string, terms: string) {
  if (!terms || !terms.includes('/')) return null

  // Parse terms like "2/10 net 30"
  const match = terms.match(/(\d+)\/(\d+)\s+net\s+(\d+)/)
  if (!match) return null

  const [_, discountPercent, discountDays, netDays] = match
  const invoiceDate = new Date(invoice.transaction_date)
  const payDate = new Date(paymentDate)
  const daysDiff = Math.floor((payDate.getTime() - invoiceDate.getTime()) / (24 * 60 * 60 * 1000))

  if (daysDiff <= parseInt(discountDays)) {
    const discountAmount = invoice.total_amount * (parseInt(discountPercent) / 100)
    return {
      applicable: true,
      amount: discountAmount,
      percentage: parseInt(discountPercent)
    }
  }

  return null
}

function generateP2PRecommendations(anomalies: any[]) {
  const recommendations = []

  const duplicateCount = anomalies.filter(a => a.type === 'duplicate_po').length
  if (duplicateCount > 0) {
    recommendations.push('Implement stricter PO number generation to avoid duplicates')
    recommendations.push('Review PO creation process for potential system issues')
  }

  const maverickCount = anomalies.filter(a => a.type === 'maverick_spending').length
  if (maverickCount > 0) {
    recommendations.push('Establish contracts with frequently used suppliers')
    recommendations.push('Implement mandatory contract selection for purchases over $5,000')
  }

  const paymentAnomalies = anomalies.filter(a => a.type === 'unusual_payment_amount').length
  if (paymentAnomalies > 0) {
    recommendations.push('Review large payments for potential fraud or errors')
    recommendations.push('Implement additional approval for payments exceeding 3x average')
  }

  return recommendations
}