import { NextRequest, NextResponse } from 'next/server'
import { selectValue, selectRows } from '@/lib/db'
import { validateEntityUpsert } from '@/lib/guardrail'
import { getSupabaseService } from '@/lib/supabase-service'

export const runtime = 'nodejs'

/**
 * Finance Invoice Management API v2
 * Smart Code: HERA.FIN.AR.ENT.INV.v1
 * 
 * Handles CRUD operations for invoices with AR management,
 * payment tracking, aging analysis, and revenue recognition.
 */

interface InvoiceRequest {
  organization_id: string
  customer_id: string
  invoice_number?: string
  invoice_date?: string
  due_date?: string
  payment_terms?: string
  currency?: string
  subtotal?: number
  tax_amount?: number
  discount_amount?: number
  total_amount?: number
  status?: string
  invoice_type?: string
  reference_number?: string
  description?: string
  billing_address?: Record<string, any>
  shipping_address?: Record<string, any>
  line_items?: InvoiceLineItem[]
  tags?: string[]
  custom_fields?: Record<string, any>
  actor_user_id?: string
}

interface InvoiceLineItem {
  product_id?: string
  service_id?: string
  description: string
  quantity: number
  unit_price: number
  discount_percent?: number
  tax_percent?: number
  line_total: number
  account_id?: string
}

interface InvoiceQuery {
  organization_id: string
  customer_id?: string
  status?: string
  invoice_type?: string
  payment_terms?: string
  currency?: string
  invoice_date_from?: string
  invoice_date_to?: string
  due_date_from?: string
  due_date_to?: string
  amount_min?: number
  amount_max?: number
  is_overdue?: boolean
  search?: string
  limit?: number
  offset?: number
}

const INVOICE_STATUSES = [
  'DRAFT', 'SENT', 'VIEWED', 'PARTIAL_PAYMENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'
]

const INVOICE_TYPES = [
  'STANDARD', 'RECURRING', 'CREDIT_NOTE', 'DEBIT_NOTE', 'PROFORMA', 'QUOTE'
]

const PAYMENT_TERMS = [
  'NET_15', 'NET_30', 'NET_45', 'NET_60', 'NET_90', 'COD', 'PREPAID', 'DUE_ON_RECEIPT'
]

// POST - Create or Update Invoice
export async function POST(req: NextRequest) {
  try {
    const body: InvoiceRequest = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
    }

    // Validate required fields
    if (!body.organization_id || !body.customer_id) {
      return NextResponse.json({
        error: 'missing_required_fields',
        required: ['organization_id', 'customer_id']
      }, { status: 400 })
    }

    // Validate status
    if (body.status && !INVOICE_STATUSES.includes(body.status)) {
      return NextResponse.json({
        error: 'invalid_status',
        valid_statuses: INVOICE_STATUSES
      }, { status: 400 })
    }

    // Validate invoice type
    if (body.invoice_type && !INVOICE_TYPES.includes(body.invoice_type)) {
      return NextResponse.json({
        error: 'invalid_invoice_type',
        valid_types: INVOICE_TYPES
      }, { status: 400 })
    }

    // Validate payment terms
    if (body.payment_terms && !PAYMENT_TERMS.includes(body.payment_terms)) {
      return NextResponse.json({
        error: 'invalid_payment_terms',
        valid_terms: PAYMENT_TERMS
      }, { status: 400 })
    }

    // Validate customer exists
    const customerSql = `
      SELECT entity_id, entity_name 
      FROM core_entities 
      WHERE entity_id = $1::uuid 
        AND organization_id = $2::uuid 
        AND entity_type = 'CUST' 
        AND status = 'active'
    `
    const customer = await selectValue(customerSql, [body.customer_id, body.organization_id])
    
    if (!customer) {
      return NextResponse.json({
        error: 'customer_not_found',
        message: `Customer ${body.customer_id} not found`
      }, { status: 404 })
    }

    // Generate invoice number if not provided
    const invoiceNumber = body.invoice_number || await generateInvoiceNumber(body.organization_id)

    // Calculate dates
    const invoiceDate = body.invoice_date || new Date().toISOString().split('T')[0]
    const dueDate = body.due_date || calculateDueDate(invoiceDate, body.payment_terms || 'NET_30')

    // Calculate amounts
    const subtotal = body.subtotal || 0
    const taxAmount = body.tax_amount || 0
    const discountAmount = body.discount_amount || 0
    const totalAmount = body.total_amount || (subtotal + taxAmount - discountAmount)

    // Generate smart code
    const smart_code = 'HERA.FIN.AR.ENT.INV.v1'

    const supabase = getSupabaseService()

    // Prepare dynamic data for invoice-specific fields
    const invoiceDynamicData = {
      invoice_number: invoiceNumber,
      customer_id: body.customer_id,
      invoice_date: invoiceDate,
      due_date: dueDate,
      payment_terms: body.payment_terms || 'NET_30',
      currency: body.currency || 'USD',
      subtotal: subtotal.toString(),
      tax_amount: taxAmount.toString(),
      discount_amount: discountAmount.toString(),
      total_amount: totalAmount.toString(),
      amount_paid: '0',
      amount_due: totalAmount.toString(),
      invoice_type: body.invoice_type || 'STANDARD',
      reference_number: body.reference_number,
      billing_address: JSON.stringify(body.billing_address || {}),
      shipping_address: JSON.stringify(body.shipping_address || {}),
      line_items: JSON.stringify(body.line_items || []),
      ...body.custom_fields
    }

    // Enhanced metadata with invoice-specific information
    const invoiceMetadata = {
      enterprise_module: 'FINANCE',
      sub_module: 'AR',
      workflow_state: body.status || 'DRAFT',
      customer_id: body.customer_id,
      invoice_number: invoiceNumber,
      total_amount: totalAmount,
      amount_due: totalAmount,
      currency: body.currency || 'USD',
      invoice_type: body.invoice_type || 'STANDARD',
      payment_terms: body.payment_terms || 'NET_30',
      created_via: 'finance_api_v2',
      is_overdue: false,
      days_outstanding: 0,
      last_payment_date: null,
      payment_count: 0
    }

    // Create entity using hera_entities_crud_v1 RPC
    const { data: entityResult, error: entityError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: body.actor_user_id,
      p_organization_id: body.organization_id,
      p_entity: {
        entity_type: 'INV',
        entity_name: `Invoice ${invoiceNumber}`,
        entity_code: invoiceNumber,
        entity_description: body.description || `Invoice ${invoiceNumber} for ${customer.entity_name}`,
        smart_code: smart_code,
        status: 'active',
        metadata: invoiceMetadata
      },
      p_dynamic: Object.entries(invoiceDynamicData).reduce((acc, [key, value]) => {
        acc[key] = {
          field_type: typeof value === 'number' ? 'number' : 'text',
          field_value_text: typeof value === 'string' ? value : null,
          field_value_number: typeof value === 'number' ? value : null,
          smart_code: `HERA.FIN.AR.FIELD.${key.toUpperCase()}.v1`
        }
        return acc
      }, {} as any),
      p_relationships: [],
      p_options: {}
    })

    if (entityError || !entityResult) {
      console.error('Entity creation failed:', entityError)
      throw new Error(`Failed to create invoice entity: ${entityError?.message}`)
    }

    const entity_id = entityResult?.entity_id || entityResult?.id || entityResult

    // Create invoice-customer relationship
    await createInvoiceRelationships(entity_id, body.organization_id, {
      customer_id: body.customer_id
    })

    // Create invoice line items as transaction lines
    if (body.line_items && body.line_items.length > 0) {
      await createInvoiceLineItems(entity_id, body.organization_id, body.line_items, body.actor_user_id)
    }

    // Create AR entry in universal transactions
    await createARTransaction(entity_id, body.organization_id, {
      customer_id: body.customer_id,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      total_amount: totalAmount,
      currency: body.currency || 'USD'
    }, body.actor_user_id)

    return NextResponse.json({
      api_version: 'v2',
      invoice_id: entity_id,
      invoice_number: invoiceNumber,
      customer_id: body.customer_id,
      customer_name: customer.entity_name,
      invoice_date: invoiceDate,
      due_date: dueDate,
      total_amount: totalAmount,
      amount_due: totalAmount,
      status: body.status || 'DRAFT',
      currency: body.currency || 'USD',
      created_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Invoice creation error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to create invoice'
    }, { status: 500 })
  }
}

// GET - Query Invoices
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query: InvoiceQuery = {
      organization_id: searchParams.get('organization_id') || '',
      customer_id: searchParams.get('customer_id') || undefined,
      status: searchParams.get('status') || undefined,
      invoice_type: searchParams.get('invoice_type') || undefined,
      payment_terms: searchParams.get('payment_terms') || undefined,
      currency: searchParams.get('currency') || undefined,
      invoice_date_from: searchParams.get('invoice_date_from') || undefined,
      invoice_date_to: searchParams.get('invoice_date_to') || undefined,
      due_date_from: searchParams.get('due_date_from') || undefined,
      due_date_to: searchParams.get('due_date_to') || undefined,
      amount_min: searchParams.get('amount_min') ? parseFloat(searchParams.get('amount_min')!) : undefined,
      amount_max: searchParams.get('amount_max') ? parseFloat(searchParams.get('amount_max')!) : undefined,
      is_overdue: searchParams.get('is_overdue') === 'true',
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    if (!query.organization_id) {
      return NextResponse.json({ error: 'missing_organization_id' }, { status: 400 })
    }

    // Build dynamic WHERE clause
    const whereConditions = ['e.organization_id = $1', 'e.entity_type = $2', 'e.status = $3']
    const params: any[] = [query.organization_id, 'INV', 'active']
    let paramIndex = 4

    if (query.customer_id) {
      whereConditions.push(`e.metadata->>'customer_id' = $${paramIndex}`)
      params.push(query.customer_id)
      paramIndex++
    }

    if (query.status) {
      whereConditions.push(`e.metadata->>'workflow_state' = $${paramIndex}`)
      params.push(query.status)
      paramIndex++
    }

    if (query.invoice_type) {
      whereConditions.push(`e.metadata->>'invoice_type' = $${paramIndex}`)
      params.push(query.invoice_type)
      paramIndex++
    }

    if (query.payment_terms) {
      whereConditions.push(`e.metadata->>'payment_terms' = $${paramIndex}`)
      params.push(query.payment_terms)
      paramIndex++
    }

    if (query.currency) {
      whereConditions.push(`e.metadata->>'currency' = $${paramIndex}`)
      params.push(query.currency)
      paramIndex++
    }

    if (query.invoice_date_from) {
      whereConditions.push(`dd_invoice_date.field_value::date >= $${paramIndex}::date`)
      params.push(query.invoice_date_from)
      paramIndex++
    }

    if (query.invoice_date_to) {
      whereConditions.push(`dd_invoice_date.field_value::date <= $${paramIndex}::date`)
      params.push(query.invoice_date_to)
      paramIndex++
    }

    if (query.due_date_from) {
      whereConditions.push(`dd_due_date.field_value::date >= $${paramIndex}::date`)
      params.push(query.due_date_from)
      paramIndex++
    }

    if (query.due_date_to) {
      whereConditions.push(`dd_due_date.field_value::date <= $${paramIndex}::date`)
      params.push(query.due_date_to)
      paramIndex++
    }

    if (query.amount_min !== undefined) {
      whereConditions.push(`(e.metadata->>'total_amount')::numeric >= $${paramIndex}`)
      params.push(query.amount_min)
      paramIndex++
    }

    if (query.amount_max !== undefined) {
      whereConditions.push(`(e.metadata->>'total_amount')::numeric <= $${paramIndex}`)
      params.push(query.amount_max)
      paramIndex++
    }

    if (query.is_overdue) {
      whereConditions.push(`dd_due_date.field_value::date < CURRENT_DATE AND (e.metadata->>'amount_due')::numeric > 0`)
    }

    if (query.search) {
      whereConditions.push(`(
        e.entity_name ILIKE $${paramIndex} OR 
        e.entity_description ILIKE $${paramIndex} OR
        dd_invoice_number.field_value ILIKE $${paramIndex} OR
        dd_reference.field_value ILIKE $${paramIndex}
      )`)
      params.push(`%${query.search}%`)
      paramIndex++
    }

    // Add limit and offset
    params.push(query.limit, query.offset)

    const sql = `
      SELECT 
        e.entity_id as invoice_id,
        e.entity_name,
        e.entity_code as invoice_number,
        e.entity_description,
        e.metadata->>'customer_id' as customer_id,
        e.metadata->>'workflow_state' as status,
        e.metadata->>'invoice_type' as invoice_type,
        e.metadata->>'payment_terms' as payment_terms,
        e.metadata->>'currency' as currency,
        e.metadata->>'total_amount' as total_amount,
        e.metadata->>'amount_due' as amount_due,
        e.metadata->>'is_overdue' as is_overdue,
        e.metadata->>'days_outstanding' as days_outstanding,
        e.metadata->>'last_payment_date' as last_payment_date,
        e.metadata->>'payment_count' as payment_count,
        e.tags,
        e.created_at,
        e.updated_at,
        -- Invoice-specific dynamic data
        dd_invoice_number.field_value as invoice_number_dynamic,
        dd_invoice_date.field_value as invoice_date,
        dd_due_date.field_value as due_date,
        dd_subtotal.field_value as subtotal,
        dd_tax_amount.field_value as tax_amount,
        dd_discount_amount.field_value as discount_amount,
        dd_amount_paid.field_value as amount_paid,
        dd_reference.field_value as reference_number,
        dd_billing_address.field_value as billing_address,
        dd_shipping_address.field_value as shipping_address,
        -- Customer information
        c_entity.entity_name as customer_name,
        c_entity.entity_code as customer_code,
        -- Days overdue calculation
        CASE 
          WHEN dd_due_date.field_value::date < CURRENT_DATE AND (e.metadata->>'amount_due')::numeric > 0
          THEN CURRENT_DATE - dd_due_date.field_value::date
          ELSE 0
        END as days_overdue,
        -- Payment status
        CASE
          WHEN (e.metadata->>'amount_due')::numeric = 0 THEN 'PAID'
          WHEN (e.metadata->>'amount_paid')::numeric > 0 THEN 'PARTIAL_PAYMENT'
          WHEN dd_due_date.field_value::date < CURRENT_DATE THEN 'OVERDUE'
          ELSE e.metadata->>'workflow_state'
        END as payment_status
      FROM core_entities e
      -- Dynamic data joins for invoice fields
      LEFT JOIN core_dynamic_data dd_invoice_number ON e.entity_id = dd_invoice_number.entity_id 
        AND dd_invoice_number.field_name = 'invoice_number' AND dd_invoice_number.status = 'active'
      LEFT JOIN core_dynamic_data dd_invoice_date ON e.entity_id = dd_invoice_date.entity_id 
        AND dd_invoice_date.field_name = 'invoice_date' AND dd_invoice_date.status = 'active'
      LEFT JOIN core_dynamic_data dd_due_date ON e.entity_id = dd_due_date.entity_id 
        AND dd_due_date.field_name = 'due_date' AND dd_due_date.status = 'active'
      LEFT JOIN core_dynamic_data dd_subtotal ON e.entity_id = dd_subtotal.entity_id 
        AND dd_subtotal.field_name = 'subtotal' AND dd_subtotal.status = 'active'
      LEFT JOIN core_dynamic_data dd_tax_amount ON e.entity_id = dd_tax_amount.entity_id 
        AND dd_tax_amount.field_name = 'tax_amount' AND dd_tax_amount.status = 'active'
      LEFT JOIN core_dynamic_data dd_discount_amount ON e.entity_id = dd_discount_amount.entity_id 
        AND dd_discount_amount.field_name = 'discount_amount' AND dd_discount_amount.status = 'active'
      LEFT JOIN core_dynamic_data dd_amount_paid ON e.entity_id = dd_amount_paid.entity_id 
        AND dd_amount_paid.field_name = 'amount_paid' AND dd_amount_paid.status = 'active'
      LEFT JOIN core_dynamic_data dd_reference ON e.entity_id = dd_reference.entity_id 
        AND dd_reference.field_name = 'reference_number' AND dd_reference.status = 'active'
      LEFT JOIN core_dynamic_data dd_billing_address ON e.entity_id = dd_billing_address.entity_id 
        AND dd_billing_address.field_name = 'billing_address' AND dd_billing_address.status = 'active'
      LEFT JOIN core_dynamic_data dd_shipping_address ON e.entity_id = dd_shipping_address.entity_id 
        AND dd_shipping_address.field_name = 'shipping_address' AND dd_shipping_address.status = 'active'
      -- Customer lookup
      LEFT JOIN core_entities c_entity ON e.metadata->>'customer_id' = c_entity.entity_id::text
        AND c_entity.entity_type = 'CUST' AND c_entity.status = 'active'
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        dd_invoice_date.field_value::date DESC,
        e.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const invoices = await selectRows(sql, params)

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as total
      FROM core_entities e
      LEFT JOIN core_dynamic_data dd_invoice_date ON e.entity_id = dd_invoice_date.entity_id 
        AND dd_invoice_date.field_name = 'invoice_date' AND dd_invoice_date.status = 'active'
      LEFT JOIN core_dynamic_data dd_due_date ON e.entity_id = dd_due_date.entity_id 
        AND dd_due_date.field_name = 'due_date' AND dd_due_date.status = 'active'
      LEFT JOIN core_dynamic_data dd_invoice_number ON e.entity_id = dd_invoice_number.entity_id 
        AND dd_invoice_number.field_name = 'invoice_number' AND dd_invoice_number.status = 'active'
      LEFT JOIN core_dynamic_data dd_reference ON e.entity_id = dd_reference.entity_id 
        AND dd_reference.field_name = 'reference_number' AND dd_reference.status = 'active'
      WHERE ${whereConditions.join(' AND ')}
    `
    
    const countParams = params.slice(0, -2) // Remove limit and offset
    const totalResult = await selectValue<number>(countSql, countParams)

    // Calculate invoice statistics
    const stats = await calculateInvoiceStatistics(query.organization_id)
    const aging = await calculateAgingAnalysis(query.organization_id)

    return NextResponse.json({
      api_version: 'v2',
      invoices,
      pagination: {
        total: totalResult || 0,
        limit: query.limit,
        offset: query.offset,
        has_more: (query.offset || 0) + (query.limit || 50) < (totalResult || 0)
      },
      statistics: stats,
      aging_analysis: aging,
      filters: {
        customer_id: query.customer_id,
        status: query.status,
        invoice_type: query.invoice_type,
        payment_terms: query.payment_terms,
        currency: query.currency,
        is_overdue: query.is_overdue
      }
    })

  } catch (error) {
    console.error('Invoice query error:', error)
    return NextResponse.json({
      error: 'internal_server_error',
      message: 'Failed to query invoices'
    }, { status: 500 })
  }
}

// Helper functions
async function generateInvoiceNumber(organizationId: string): Promise<string> {
  const sql = `
    SELECT COUNT(*) + 1 as next_number
    FROM core_entities 
    WHERE organization_id = $1::uuid AND entity_type = 'INV'
  `
  const nextNumber = await selectValue<number>(sql, [organizationId])
  const currentYear = new Date().getFullYear()
  return `INV-${currentYear}-${String(nextNumber).padStart(5, '0')}`
}

function calculateDueDate(invoiceDate: string, paymentTerms: string): string {
  const date = new Date(invoiceDate)
  const daysToAdd = {
    'NET_15': 15,
    'NET_30': 30,
    'NET_45': 45,
    'NET_60': 60,
    'NET_90': 90,
    'COD': 0,
    'PREPAID': 0,
    'DUE_ON_RECEIPT': 0
  }[paymentTerms] || 30

  date.setDate(date.getDate() + daysToAdd)
  return date.toISOString().split('T')[0]
}

async function createInvoiceRelationships(
  invoiceId: string, 
  organizationId: string, 
  relationships: { customer_id: string }
) {
  const sql = `
    INSERT INTO core_relationships (
      organization_id, from_entity_id, to_entity_id, relationship_type,
      relationship_metadata, status, created_at
    ) VALUES (
      $1::uuid, $2::uuid, $3::uuid, 'INVOICE_CUSTOMER',
      '{"description": "Invoice belongs to customer"}'::jsonb, 'active', NOW()
    )
  `
  await selectValue(sql, [organizationId, invoiceId, relationships.customer_id])
}

async function createInvoiceLineItems(
  invoiceId: string,
  organizationId: string,
  lineItems: InvoiceLineItem[],
  userId?: string
) {
  // Create line items as universal transaction lines
  for (const item of lineItems) {
    const lineItemSql = `
      INSERT INTO invoice_line_items (
        organization_id, invoice_id, product_id, service_id,
        description, quantity, unit_price, discount_percent, 
        tax_percent, line_total, account_id, created_by, created_at
      ) VALUES (
        $1::uuid, $2::uuid, $3::uuid, $4::uuid,
        $5, $6, $7, $8,
        $9, $10, $11::uuid, $12::uuid, NOW()
      )
    `
    await selectValue(lineItemSql, [
      organizationId, invoiceId, item.product_id, item.service_id,
      item.description, item.quantity, item.unit_price, item.discount_percent || 0,
      item.tax_percent || 0, item.line_total, item.account_id, userId
    ])
  }
}

async function createARTransaction(
  invoiceId: string,
  organizationId: string,
  invoiceData: {
    customer_id: string
    invoice_number: string
    invoice_date: string
    due_date: string
    total_amount: number
    currency: string
  },
  userId?: string
) {
  // Create AR transaction in universal_transactions
  const transactionSql = `
    INSERT INTO universal_transactions (
      organization_id, transaction_type, transaction_number, transaction_date,
      description, reference_id, reference_type, total_amount, currency,
      status, created_by, created_at
    ) VALUES (
      $1::uuid, 'AR_INVOICE', $2, $3::date,
      'Accounts Receivable for Invoice ' || $2, $4::uuid, 'INVOICE', $5, $6,
      'posted', $7::uuid, NOW()
    )
    RETURNING transaction_id
  `
  
  const transactionId = await selectValue<string>(transactionSql, [
    organizationId, invoiceData.invoice_number, invoiceData.invoice_date,
    invoiceId, invoiceData.total_amount, invoiceData.currency, userId
  ])

  // Create AR transaction line
  const arLineSql = `
    INSERT INTO universal_transaction_lines (
      transaction_id, account_id, debit_amount, credit_amount,
      description, reference_id, reference_type
    ) VALUES (
      $1::uuid, 
      (SELECT entity_id FROM core_entities 
       WHERE organization_id = $2::uuid AND entity_type = 'ACC' 
       AND metadata->>'account_type' = 'ASSET' 
       AND entity_name ILIKE '%accounts receivable%' 
       LIMIT 1),
      $3, 0,
      'AR for Invoice ' || $4, $5::uuid, 'INVOICE'
    )
  `
  
  await selectValue(arLineSql, [
    transactionId, organizationId, invoiceData.total_amount, 
    invoiceData.invoice_number, invoiceId
  ])
}

async function calculateInvoiceStatistics(organizationId: string) {
  const sql = `
    SELECT 
      COUNT(*) as total_invoices,
      COUNT(*) FILTER (WHERE e.metadata->>'workflow_state' = 'DRAFT') as draft_invoices,
      COUNT(*) FILTER (WHERE e.metadata->>'workflow_state' = 'SENT') as sent_invoices,
      COUNT(*) FILTER (WHERE e.metadata->>'workflow_state' = 'PAID') as paid_invoices,
      COUNT(*) FILTER (WHERE e.metadata->>'workflow_state' = 'OVERDUE') as overdue_invoices,
      COUNT(*) FILTER (WHERE e.metadata->>'workflow_state' = 'CANCELLED') as cancelled_invoices,
      COALESCE(SUM((e.metadata->>'total_amount')::numeric), 0) as total_billed,
      COALESCE(SUM((e.metadata->>'amount_due')::numeric), 0) as total_outstanding,
      COALESCE(SUM((e.metadata->>'total_amount')::numeric) FILTER (WHERE e.metadata->>'workflow_state' = 'PAID'), 0) as total_collected,
      COALESCE(AVG((e.metadata->>'total_amount')::numeric), 0) as average_invoice_amount,
      COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '30 days') as invoices_this_month,
      COUNT(*) FILTER (WHERE e.created_at >= NOW() - INTERVAL '7 days') as invoices_this_week
    FROM core_entities e
    WHERE e.organization_id = $1::uuid 
      AND e.entity_type = 'INV' 
      AND e.status = 'active'
  `
  
  return await selectValue(sql, [organizationId])
}

async function calculateAgingAnalysis(organizationId: string) {
  const sql = `
    SELECT 
      COUNT(*) FILTER (WHERE dd_due_date.field_value::date >= CURRENT_DATE) as current_count,
      COALESCE(SUM((e.metadata->>'amount_due')::numeric) FILTER (WHERE dd_due_date.field_value::date >= CURRENT_DATE), 0) as current_amount,
      
      COUNT(*) FILTER (WHERE dd_due_date.field_value::date < CURRENT_DATE AND dd_due_date.field_value::date >= CURRENT_DATE - INTERVAL '30 days') as overdue_1_30_count,
      COALESCE(SUM((e.metadata->>'amount_due')::numeric) FILTER (WHERE dd_due_date.field_value::date < CURRENT_DATE AND dd_due_date.field_value::date >= CURRENT_DATE - INTERVAL '30 days'), 0) as overdue_1_30_amount,
      
      COUNT(*) FILTER (WHERE dd_due_date.field_value::date < CURRENT_DATE - INTERVAL '30 days' AND dd_due_date.field_value::date >= CURRENT_DATE - INTERVAL '60 days') as overdue_31_60_count,
      COALESCE(SUM((e.metadata->>'amount_due')::numeric) FILTER (WHERE dd_due_date.field_value::date < CURRENT_DATE - INTERVAL '30 days' AND dd_due_date.field_value::date >= CURRENT_DATE - INTERVAL '60 days'), 0) as overdue_31_60_amount,
      
      COUNT(*) FILTER (WHERE dd_due_date.field_value::date < CURRENT_DATE - INTERVAL '60 days' AND dd_due_date.field_value::date >= CURRENT_DATE - INTERVAL '90 days') as overdue_61_90_count,
      COALESCE(SUM((e.metadata->>'amount_due')::numeric) FILTER (WHERE dd_due_date.field_value::date < CURRENT_DATE - INTERVAL '60 days' AND dd_due_date.field_value::date >= CURRENT_DATE - INTERVAL '90 days'), 0) as overdue_61_90_amount,
      
      COUNT(*) FILTER (WHERE dd_due_date.field_value::date < CURRENT_DATE - INTERVAL '90 days') as overdue_90_plus_count,
      COALESCE(SUM((e.metadata->>'amount_due')::numeric) FILTER (WHERE dd_due_date.field_value::date < CURRENT_DATE - INTERVAL '90 days'), 0) as overdue_90_plus_amount
    FROM core_entities e
    JOIN core_dynamic_data dd_due_date ON e.entity_id = dd_due_date.entity_id 
      AND dd_due_date.field_name = 'due_date' AND dd_due_date.status = 'active'
    WHERE e.organization_id = $1::uuid 
      AND e.entity_type = 'INV' 
      AND e.status = 'active'
      AND (e.metadata->>'amount_due')::numeric > 0
  `
  
  return await selectValue(sql, [organizationId])
}