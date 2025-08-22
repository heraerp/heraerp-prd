import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withErrorHandler } from '@/lib/api-error-handler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

interface PaymentTransaction {
  id: string
  transaction_code: string
  transaction_date: string
  transaction_type: string
  total_amount: number
  metadata: {
    customer_name?: string
    service_name?: string
    payment_method?: string
    payment_status?: string
    refund_reason?: string
    refund_amount?: number
    cancellation_reason?: string
    tips_amount?: number
    split_payment?: boolean
    split_details?: Array<{
      method: string
      amount: number
    }>
    staff_name?: string
    notes?: string
  }
  status?: string
  created_at: string
}

// GET: Fetch payment transactions and analytics
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')
  const type = searchParams.get('type') // all, payments, refunds, cancellations
  const startDate = searchParams.get('start_date') || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]
  const paymentMethod = searchParams.get('payment_method')
  const status = searchParams.get('status')

  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'Organization ID is required' },
      { status: 400 }
    )
  }

  try {
    // Build query based on type
    let query = supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false })

    // Filter by transaction type
    if (type === 'payments') {
      query = query.in('transaction_type', ['payment', 'sale', 'appointment'])
        .not('metadata->payment_status', 'eq', 'refunded')
        .not('metadata->payment_status', 'eq', 'cancelled')
    } else if (type === 'refunds') {
      query = query.eq('transaction_type', 'refund')
    } else if (type === 'cancellations') {
      query = query.eq('metadata->payment_status', 'cancelled')
    } else {
      // Get all payment-related transactions
      query = query.in('transaction_type', ['payment', 'sale', 'appointment', 'refund'])
    }

    // Additional filters
    if (paymentMethod) {
      query = query.eq('metadata->payment_method', paymentMethod)
    }
    if (status) {
      query = query.eq('metadata->payment_status', status)
    }

    const { data: transactions, error } = await query

    if (error) throw error

    // Calculate analytics
    const analytics = await calculatePaymentAnalytics(organizationId, startDate, endDate)

    // Get payment methods summary
    const paymentMethodsSummary = await getPaymentMethodsSummary(organizationId, startDate, endDate)

    // Get daily cash reconciliation
    const dailyReconciliation = await getDailyReconciliation(organizationId, endDate)

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      analytics,
      paymentMethods: paymentMethodsSummary,
      dailyReconciliation,
      period: { start_date: startDate, end_date: endDate }
    })
  } catch (error) {
    console.error('Error fetching payment data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment data' },
      { status: 500 }
    )
  }
})

// POST: Create payment transaction (including refunds)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { 
    organizationId,
    transactionType, // payment, refund
    originalTransactionId, // for refunds
    amount,
    paymentMethod,
    customerName,
    serviceName,
    staffName,
    reason,
    notes,
    splitPayment,
    splitDetails,
    tipsAmount
  } = body

  if (!organizationId || !transactionType || !amount) {
    return NextResponse.json(
      { success: false, error: 'Required fields missing' },
      { status: 400 }
    )
  }

  try {
    // For refunds, fetch original transaction
    let originalTransaction = null
    if (transactionType === 'refund' && originalTransactionId) {
      const { data: original } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('id', originalTransactionId)
        .single()
      
      originalTransaction = original
    }

    // Create transaction
    const transactionData = {
      organization_id: organizationId,
      transaction_type: transactionType,
      transaction_code: `${transactionType.toUpperCase()}-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: amount,
      transaction_status: 'completed',
      smart_code: `HERA.SALON.PAYMENT.${transactionType.toUpperCase()}.v1`,
      metadata: {
        customer_name: customerName || originalTransaction?.metadata?.customer_name,
        service_name: serviceName || originalTransaction?.metadata?.service_name,
        payment_method: paymentMethod,
        payment_status: transactionType === 'refund' ? 'refunded' : 'completed',
        staff_name: staffName || originalTransaction?.metadata?.staff_name,
        notes: notes,
        original_transaction_id: originalTransactionId,
        refund_reason: transactionType === 'refund' ? reason : undefined,
        refund_amount: transactionType === 'refund' ? amount : undefined,
        tips_amount: tipsAmount || 0,
        split_payment: splitPayment || false,
        split_details: splitDetails || [],
        created_at: new Date().toISOString()
      }
    }

    const { data: newTransaction, error } = await supabase
      .from('universal_transactions')
      .insert(transactionData)
      .select()
      .single()

    if (error) throw error

    // If it's a refund, update the original transaction
    if (transactionType === 'refund' && originalTransactionId) {
      await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            ...originalTransaction?.metadata,
            payment_status: 'refunded',
            refund_date: new Date().toISOString(),
            refund_transaction_id: newTransaction.id
          }
        })
        .eq('id', originalTransactionId)
    }

    return NextResponse.json({
      success: true,
      transaction: newTransaction
    })
  } catch (error) {
    console.error('Error creating payment transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment transaction' },
      { status: 500 }
    )
  }
})

// PUT: Update payment transaction (e.g., cancel)
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { transactionId, action, reason, notes } = body

  if (!transactionId || !action) {
    return NextResponse.json(
      { success: false, error: 'Transaction ID and action are required' },
      { status: 400 }
    )
  }

  try {
    // Fetch current transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (fetchError) throw fetchError

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'cancel':
        updateData.metadata = {
          ...transaction.metadata,
          payment_status: 'cancelled',
          cancellation_date: new Date().toISOString(),
          cancellation_reason: reason,
          cancellation_notes: notes
        }
        updateData.status = 'cancelled'
        break
      case 'void':
        updateData.metadata = {
          ...transaction.metadata,
          payment_status: 'voided',
          void_date: new Date().toISOString(),
          void_reason: reason
        }
        updateData.status = 'voided'
        break
      default:
        throw new Error('Invalid action')
    }

    const { data: updatedTransaction, error: updateError } = await supabase
      .from('universal_transactions')
      .update(updateData)
      .eq('id', transactionId)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction
    })
  } catch (error) {
    console.error('Error updating payment transaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update payment transaction' },
      { status: 500 }
    )
  }
})

// Helper function to calculate payment analytics
async function calculatePaymentAnalytics(organizationId: string, startDate: string, endDate: string) {
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .in('transaction_type', ['payment', 'sale', 'appointment', 'refund'])
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  let totalRevenue = 0
  let totalRefunds = 0
  let totalCancellations = 0
  let totalTips = 0
  let transactionCount = 0
  let refundCount = 0
  let cancellationCount = 0

  transactions?.forEach(txn => {
    if (txn.transaction_type === 'refund') {
      totalRefunds += txn.total_amount || 0
      refundCount += 1
    } else if (txn.metadata?.payment_status === 'cancelled') {
      totalCancellations += txn.total_amount || 0
      cancellationCount += 1
    } else if (txn.metadata?.payment_status !== 'refunded') {
      totalRevenue += txn.total_amount || 0
      totalTips += txn.metadata?.tips_amount || 0
      transactionCount += 1
    }
  })

  // Calculate period comparison
  const daysInPeriod = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
  const prevStartDate = new Date(new Date(startDate).setDate(new Date(startDate).getDate() - daysInPeriod)).toISOString().split('T')[0]
  const prevEndDate = new Date(new Date(startDate).setDate(new Date(startDate).getDate() - 1)).toISOString().split('T')[0]

  const { data: prevTransactions } = await supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('organization_id', organizationId)
    .in('transaction_type', ['payment', 'sale', 'appointment'])
    .gte('transaction_date', prevStartDate)
    .lte('transaction_date', prevEndDate)

  const prevRevenue = prevTransactions?.reduce((sum, txn) => sum + (txn.total_amount || 0), 0) || 0
  const growthRate = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

  return {
    totalRevenue,
    totalRefunds,
    totalCancellations,
    totalTips,
    netRevenue: totalRevenue - totalRefunds,
    transactionCount,
    refundCount,
    cancellationCount,
    averageTransaction: transactionCount > 0 ? totalRevenue / transactionCount : 0,
    refundRate: transactionCount > 0 ? (refundCount / transactionCount) * 100 : 0,
    cancellationRate: transactionCount > 0 ? (cancellationCount / transactionCount) * 100 : 0,
    growthRate
  }
}

// Helper function to get payment methods summary
async function getPaymentMethodsSummary(organizationId: string, startDate: string, endDate: string) {
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .in('transaction_type', ['payment', 'sale', 'appointment'])
    .not('metadata->payment_status', 'eq', 'cancelled')
    .not('metadata->payment_status', 'eq', 'refunded')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)

  const methodsSummary: { [key: string]: { count: number, amount: number } } = {}
  let totalAmount = 0

  transactions?.forEach(txn => {
    const method = txn.metadata?.payment_method || 'cash'
    if (!methodsSummary[method]) {
      methodsSummary[method] = { count: 0, amount: 0 }
    }
    methodsSummary[method].count += 1
    methodsSummary[method].amount += txn.total_amount || 0
    totalAmount += txn.total_amount || 0
  })

  // Convert to array with percentages
  return Object.entries(methodsSummary).map(([method, data]) => ({
    method,
    count: data.count,
    amount: data.amount,
    percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
  })).sort((a, b) => b.amount - a.amount)
}

// Helper function for daily cash reconciliation
async function getDailyReconciliation(organizationId: string, date: string) {
  const startOfDay = `${date}T00:00:00`
  const endOfDay = `${date}T23:59:59`

  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .in('transaction_type', ['payment', 'sale', 'appointment', 'refund'])
    .gte('transaction_date', startOfDay)
    .lte('transaction_date', endOfDay)

  let cashReceived = 0
  let cardReceived = 0
  let digitalReceived = 0
  let refundsIssued = 0
  let tipsCollected = 0

  transactions?.forEach(txn => {
    if (txn.transaction_type === 'refund') {
      refundsIssued += txn.total_amount || 0
    } else if (txn.metadata?.payment_status !== 'cancelled') {
      const amount = txn.total_amount || 0
      const tips = txn.metadata?.tips_amount || 0
      tipsCollected += tips

      switch (txn.metadata?.payment_method) {
        case 'cash':
          cashReceived += amount
          break
        case 'credit_card':
        case 'debit_card':
          cardReceived += amount
          break
        case 'digital_wallet':
          digitalReceived += amount
          break
        default:
          cashReceived += amount // Default to cash
      }
    }
  })

  return {
    date,
    cashReceived,
    cardReceived,
    digitalReceived,
    totalReceived: cashReceived + cardReceived + digitalReceived,
    refundsIssued,
    tipsCollected,
    netCash: cashReceived - refundsIssued,
    transactionCount: transactions?.length || 0
  }
}