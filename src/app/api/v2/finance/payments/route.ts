/**
 * Finance Payments Management API
 * Smart Code: HERA.FINANCE.PAYMENTS.API.v2
 * 
 * Universal API v2 extension for payment transaction management
 * Handles payment processing, tracking, reconciliation, and audit trails
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Payment entity smart codes
const ENTITY_TYPES = {
  PAYMENT: 'PAYMENT',
  PAYMENT_ALLOCATION: 'PAYMENT_ALLOCATION',
  PAYMENT_METHOD: 'PAYMENT_METHOD',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  PAYMENT_BATCH: 'PAYMENT_BATCH',
  PAYMENT_REVERSAL: 'PAYMENT_REVERSAL'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'list':
        return await listPayments(organizationId, searchParams)
      case 'get':
        return await getPayment(organizationId, searchParams.get('payment_id')!)
      case 'allocations':
        return await getPaymentAllocations(organizationId, searchParams.get('payment_id')!)
      case 'batch':
        return await getPaymentBatch(organizationId, searchParams.get('batch_id')!)
      case 'methods':
        return await getPaymentMethods(organizationId)
      case 'bank-accounts':
        return await getBankAccounts(organizationId)
      case 'reconciliation':
        return await getReconciliationData(organizationId, searchParams)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Payments API GET error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, organization_id } = body

    if (!organization_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'create_payment':
        return await createPayment(body)
      case 'allocate_payment':
        return await allocatePayment(body)
      case 'create_batch':
        return await createPaymentBatch(body)
      case 'process_batch':
        return await processPaymentBatch(body)
      case 'reverse_payment':
        return await reversePayment(body)
      case 'create_payment_method':
        return await createPaymentMethod(body)
      case 'create_bank_account':
        return await createBankAccount(body)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Payments API POST error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, organization_id } = body

    if (!organization_id) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'update_payment':
        return await updatePayment(body)
      case 'approve_payment':
        return await approvePayment(body)
      case 'reject_payment':
        return await rejectPayment(body)
      case 'reconcile_payment':
        return await reconcilePayment(body)
      case 'update_allocation':
        return await updatePaymentAllocation(body)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Payments API PUT error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const paymentId = searchParams.get('payment_id')

    if (!organizationId || !paymentId) {
      return NextResponse.json({ error: 'Organization ID and Payment ID are required' }, { status: 400 })
    }

    return await deletePayment(organizationId, paymentId)
  } catch (error) {
    console.error('Payments API DELETE error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// List payments with filtering and pagination
async function listPayments(organizationId: string, searchParams: URLSearchParams) {
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const status = searchParams.get('status')
  const paymentType = searchParams.get('payment_type')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const customerId = searchParams.get('customer_id')
  const vendorId = searchParams.get('vendor_id')

  let query = supabase
    .from('core_entities')
    .select(`
      entity_id,
      entity_code,
      metadata,
      created_at,
      updated_at,
      core_dynamic_data!core_dynamic_data_entity_id_fkey (
        data_key,
        data_value
      )
    `)
    .eq('organization_id', organizationId)
    .eq('entity_type', ENTITY_TYPES.PAYMENT)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  const { data: payments, error } = await query

  if (error) throw error

  // Transform to structured payment objects
  const structuredPayments = payments?.map(payment => ({
    payment_id: payment.entity_id,
    payment_code: payment.entity_code,
    ...transformDynamicData(payment.core_dynamic_data),
    created_at: payment.created_at,
    updated_at: payment.updated_at
  })) || []

  // Apply filters
  let filteredPayments = structuredPayments
  if (status) {
    filteredPayments = filteredPayments.filter(p => p.status === status)
  }
  if (paymentType) {
    filteredPayments = filteredPayments.filter(p => p.payment_type === paymentType)
  }
  if (dateFrom) {
    filteredPayments = filteredPayments.filter(p => new Date(p.payment_date) >= new Date(dateFrom))
  }
  if (dateTo) {
    filteredPayments = filteredPayments.filter(p => new Date(p.payment_date) <= new Date(dateTo))
  }

  // Get total count for pagination
  const { count } = await supabase
    .from('core_entities')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('entity_type', ENTITY_TYPES.PAYMENT)

  return NextResponse.json({
    success: true,
    data: {
      payments: filteredPayments,
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    }
  })
}

// Get single payment details
async function getPayment(organizationId: string, paymentId: string) {
  const { data: payment, error } = await supabase
    .from('core_entities')
    .select(`
      entity_id,
      entity_code,
      metadata,
      created_at,
      updated_at,
      core_dynamic_data!core_dynamic_data_entity_id_fkey (
        data_key,
        data_value
      )
    `)
    .eq('organization_id', organizationId)
    .eq('entity_id', paymentId)
    .eq('entity_type', ENTITY_TYPES.PAYMENT)
    .single()

  if (error) throw error

  const structuredPayment = {
    payment_id: payment.entity_id,
    payment_code: payment.entity_code,
    ...transformDynamicData(payment.core_dynamic_data),
    created_at: payment.created_at,
    updated_at: payment.updated_at
  }

  return NextResponse.json({
    success: true,
    data: { payment: structuredPayment }
  })
}

// Create new payment
async function createPayment(data: any) {
  const {
    organization_id,
    payment_type,
    amount,
    currency,
    payment_date,
    payment_method_id,
    bank_account_id,
    reference_number,
    description,
    customer_id,
    vendor_id,
    invoice_ids = [],
    created_by
  } = data

  // Generate payment code
  const paymentCode = await generateSmartCode('HERA.FINANCE.PAYMENT', organization_id)

  // Create payment entity
  const { data: paymentEntity, error: entityError } = await supabase
    .from('core_entities')
    .insert({
      organization_id,
      entity_type: ENTITY_TYPES.PAYMENT,
      entity_code: paymentCode,
      metadata: {
        payment_type,
        currency,
        created_by,
        workflow_status: 'DRAFT'
      }
    })
    .select()
    .single()

  if (entityError) throw entityError

  // Create payment data
  const paymentData = [
    { entity_id: paymentEntity.entity_id, data_key: 'amount', data_value: amount.toString() },
    { entity_id: paymentEntity.entity_id, data_key: 'currency', data_value: currency },
    { entity_id: paymentEntity.entity_id, data_key: 'payment_date', data_value: payment_date },
    { entity_id: paymentEntity.entity_id, data_key: 'reference_number', data_value: reference_number },
    { entity_id: paymentEntity.entity_id, data_key: 'description', data_value: description },
    { entity_id: paymentEntity.entity_id, data_key: 'status', data_value: 'DRAFT' },
    { entity_id: paymentEntity.entity_id, data_key: 'payment_type', data_value: payment_type }
  ]

  if (customer_id) {
    paymentData.push({ entity_id: paymentEntity.entity_id, data_key: 'customer_id', data_value: customer_id })
  }

  if (vendor_id) {
    paymentData.push({ entity_id: paymentEntity.entity_id, data_key: 'vendor_id', data_value: vendor_id })
  }

  if (payment_method_id) {
    paymentData.push({ entity_id: paymentEntity.entity_id, data_key: 'payment_method_id', data_value: payment_method_id })
  }

  if (bank_account_id) {
    paymentData.push({ entity_id: paymentEntity.entity_id, data_key: 'bank_account_id', data_value: bank_account_id })
  }

  const { error: dataError } = await supabase
    .from('core_dynamic_data')
    .insert(paymentData)

  if (dataError) throw dataError

  // Create relationships to invoices if provided
  if (invoice_ids.length > 0) {
    const relationships = invoice_ids.map((invoiceId: string) => ({
      organization_id,
      source_entity_id: paymentEntity.entity_id,
      target_entity_id: invoiceId,
      relationship_type: 'PAYMENT_TO_INVOICE',
      metadata: { allocation_type: 'PENDING' }
    }))

    const { error: relationError } = await supabase
      .from('core_relationships')
      .insert(relationships)

    if (relationError) throw relationError
  }

  return NextResponse.json({
    success: true,
    data: {
      payment_id: paymentEntity.entity_id,
      payment_code: paymentCode,
      status: 'DRAFT'
    }
  })
}

// Allocate payment to invoices
async function allocatePayment(data: any) {
  const { organization_id, payment_id, allocations, created_by } = data

  for (const allocation of allocations) {
    const { invoice_id, allocated_amount, allocation_type = 'FULL' } = allocation

    // Create allocation entity
    const allocationCode = await generateSmartCode('HERA.FINANCE.PAYMENT_ALLOCATION', organization_id)
    
    const { data: allocationEntity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id,
        entity_type: ENTITY_TYPES.PAYMENT_ALLOCATION,
        entity_code: allocationCode,
        metadata: { created_by, allocation_type }
      })
      .select()
      .single()

    if (entityError) throw entityError

    // Create allocation data
    const allocationData = [
      { entity_id: allocationEntity.entity_id, data_key: 'payment_id', data_value: payment_id },
      { entity_id: allocationEntity.entity_id, data_key: 'invoice_id', data_value: invoice_id },
      { entity_id: allocationEntity.entity_id, data_key: 'allocated_amount', data_value: allocated_amount.toString() },
      { entity_id: allocationEntity.entity_id, data_key: 'allocation_type', data_value: allocation_type },
      { entity_id: allocationEntity.entity_id, data_key: 'status', data_value: 'ACTIVE' }
    ]

    const { error: dataError } = await supabase
      .from('core_dynamic_data')
      .insert(allocationData)

    if (dataError) throw dataError

    // Create relationships
    const relationships = [
      {
        organization_id,
        source_entity_id: allocationEntity.entity_id,
        target_entity_id: payment_id,
        relationship_type: 'ALLOCATION_TO_PAYMENT',
        metadata: { allocation_amount: allocated_amount }
      },
      {
        organization_id,
        source_entity_id: allocationEntity.entity_id,
        target_entity_id: invoice_id,
        relationship_type: 'ALLOCATION_TO_INVOICE',
        metadata: { allocation_amount: allocated_amount }
      }
    ]

    const { error: relationError } = await supabase
      .from('core_relationships')
      .insert(relationships)

    if (relationError) throw relationError
  }

  return NextResponse.json({
    success: true,
    data: { message: 'Payment allocated successfully' }
  })
}

// Create payment method
async function createPaymentMethod(data: any) {
  const {
    organization_id,
    method_name,
    method_type,
    is_default = false,
    is_active = true,
    configuration = {},
    created_by
  } = data

  const methodCode = await generateSmartCode('HERA.FINANCE.PAYMENT_METHOD', organization_id)

  const { data: methodEntity, error: entityError } = await supabase
    .from('core_entities')
    .insert({
      organization_id,
      entity_type: ENTITY_TYPES.PAYMENT_METHOD,
      entity_code: methodCode,
      metadata: { method_type, is_default, created_by }
    })
    .select()
    .single()

  if (entityError) throw entityError

  const methodData = [
    { entity_id: methodEntity.entity_id, data_key: 'method_name', data_value: method_name },
    { entity_id: methodEntity.entity_id, data_key: 'method_type', data_value: method_type },
    { entity_id: methodEntity.entity_id, data_key: 'is_default', data_value: is_default.toString() },
    { entity_id: methodEntity.entity_id, data_key: 'is_active', data_value: is_active.toString() },
    { entity_id: methodEntity.entity_id, data_key: 'configuration', data_value: JSON.stringify(configuration) }
  ]

  const { error: dataError } = await supabase
    .from('core_dynamic_data')
    .insert(methodData)

  if (dataError) throw dataError

  return NextResponse.json({
    success: true,
    data: {
      payment_method_id: methodEntity.entity_id,
      method_code: methodCode
    }
  })
}

// Get payment methods
async function getPaymentMethods(organizationId: string) {
  const { data: methods, error } = await supabase
    .from('core_entities')
    .select(`
      entity_id,
      entity_code,
      metadata,
      created_at,
      core_dynamic_data!core_dynamic_data_entity_id_fkey (
        data_key,
        data_value
      )
    `)
    .eq('organization_id', organizationId)
    .eq('entity_type', ENTITY_TYPES.PAYMENT_METHOD)
    .order('created_at', { ascending: false })

  if (error) throw error

  const structuredMethods = methods?.map(method => ({
    payment_method_id: method.entity_id,
    method_code: method.entity_code,
    ...transformDynamicData(method.core_dynamic_data),
    created_at: method.created_at
  })) || []

  return NextResponse.json({
    success: true,
    data: { payment_methods: structuredMethods }
  })
}

// Get bank accounts
async function getBankAccounts(organizationId: string) {
  const { data: accounts, error } = await supabase
    .from('core_entities')
    .select(`
      entity_id,
      entity_code,
      metadata,
      created_at,
      core_dynamic_data!core_dynamic_data_entity_id_fkey (
        data_key,
        data_value
      )
    `)
    .eq('organization_id', organizationId)
    .eq('entity_type', ENTITY_TYPES.BANK_ACCOUNT)
    .order('created_at', { ascending: false })

  if (error) throw error

  const structuredAccounts = accounts?.map(account => ({
    bank_account_id: account.entity_id,
    account_code: account.entity_code,
    ...transformDynamicData(account.core_dynamic_data),
    created_at: account.created_at
  })) || []

  return NextResponse.json({
    success: true,
    data: { bank_accounts: structuredAccounts }
  })
}

// Update payment status
async function updatePayment(data: any) {
  const { organization_id, payment_id, updates, updated_by } = data

  // Update dynamic data
  for (const [key, value] of Object.entries(updates)) {
    const { error } = await supabase
      .from('core_dynamic_data')
      .upsert({
        entity_id: payment_id,
        data_key: key,
        data_value: value?.toString() || ''
      })

    if (error) throw error
  }

  // Update metadata
  const { error: metadataError } = await supabase
    .from('core_entities')
    .update({
      metadata: {
        ...updates,
        updated_by,
        updated_at: new Date().toISOString()
      }
    })
    .eq('entity_id', payment_id)
    .eq('organization_id', organization_id)

  if (metadataError) throw metadataError

  return NextResponse.json({
    success: true,
    data: { message: 'Payment updated successfully' }
  })
}

// Approve payment
async function approvePayment(data: any) {
  const { organization_id, payment_id, approved_by, approval_notes } = data

  const updates = {
    status: 'APPROVED',
    approved_by,
    approved_at: new Date().toISOString(),
    approval_notes
  }

  return await updatePayment({ organization_id, payment_id, updates, updated_by: approved_by })
}

// Delete payment (soft delete)
async function deletePayment(organizationId: string, paymentId: string) {
  const { error } = await supabase
    .from('core_entities')
    .update({
      metadata: {
        deleted: true,
        deleted_at: new Date().toISOString()
      }
    })
    .eq('entity_id', paymentId)
    .eq('organization_id', organizationId)

  if (error) throw error

  return NextResponse.json({
    success: true,
    data: { message: 'Payment deleted successfully' }
  })
}

// Helper functions
function transformDynamicData(dynamicData: any[]) {
  const transformed: Record<string, any> = {}
  for (const item of dynamicData || []) {
    transformed[item.data_key] = item.data_value
  }
  return transformed
}

async function generateSmartCode(prefix: string, organizationId: string): Promise<string> {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}.${organizationId.slice(-8)}.${timestamp}.${random}`
}