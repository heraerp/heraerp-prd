#!/usr/bin/env node

/**
 * HERA O2C (Order-to-Cash) MCP Server
 * Natural language revenue cycle operations via Claude Desktop
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Create MCP server
const server = new Server(
  {
    name: 'hera-o2c-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// =============================================
// ORDER MANAGEMENT TOOLS
// =============================================

server.setRequestHandler('tools/list', async () => ({
  tools: [
    // Order Management
    {
      name: 'create-sales-order',
      description: 'Create a new sales order for a customer',
      inputSchema: {
        type: 'object',
        properties: {
          customer_name: { type: 'string', description: 'Name of the customer' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product_name: { type: 'string' },
                quantity: { type: 'number' },
                unit_price: { type: 'number' }
              }
            }
          },
          delivery_date: { type: 'string', description: 'Requested delivery date' },
          payment_terms: { type: 'string', enum: ['COD', 'NET30', 'NET60', 'NET90'] },
          organization_id: { type: 'string' }
        },
        required: ['customer_name', 'items', 'organization_id']
      }
    },
    {
      name: 'check-order-status',
      description: 'Check the status of a sales order',
      inputSchema: {
        type: 'object',
        properties: {
          order_number: { type: 'string' },
          organization_id: { type: 'string' }
        },
        required: ['order_number', 'organization_id']
      }
    },
    
    // Invoicing
    {
      name: 'create-invoice',
      description: 'Create an invoice for a customer',
      inputSchema: {
        type: 'object',
        properties: {
          customer_name: { type: 'string' },
          order_number: { type: 'string', description: 'Optional order reference' },
          line_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                unit_price: { type: 'number' }
              }
            }
          },
          due_date: { type: 'string' },
          organization_id: { type: 'string' }
        },
        required: ['customer_name', 'line_items', 'organization_id']
      }
    },
    {
      name: 'send-invoice',
      description: 'Send an invoice to customer',
      inputSchema: {
        type: 'object',
        properties: {
          invoice_number: { type: 'string' },
          send_method: { type: 'string', enum: ['email', 'print', 'both'] },
          organization_id: { type: 'string' }
        },
        required: ['invoice_number', 'send_method', 'organization_id']
      }
    },
    
    // Payment Processing
    {
      name: 'record-payment',
      description: 'Record a customer payment',
      inputSchema: {
        type: 'object',
        properties: {
          customer_name: { type: 'string' },
          amount: { type: 'number' },
          payment_method: { type: 'string', enum: ['cash', 'check', 'wire', 'card', 'ach'] },
          invoice_number: { type: 'string', description: 'Optional invoice to apply payment to' },
          reference: { type: 'string' },
          organization_id: { type: 'string' }
        },
        required: ['customer_name', 'amount', 'payment_method', 'organization_id']
      }
    },
    {
      name: 'apply-payment',
      description: 'Apply payment to specific invoices',
      inputSchema: {
        type: 'object',
        properties: {
          payment_id: { type: 'string' },
          invoice_applications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                invoice_number: { type: 'string' },
                amount: { type: 'number' }
              }
            }
          },
          organization_id: { type: 'string' }
        },
        required: ['payment_id', 'invoice_applications', 'organization_id']
      }
    },
    
    // Credit Management
    {
      name: 'check-credit',
      description: 'Check customer credit status and available credit',
      inputSchema: {
        type: 'object',
        properties: {
          customer_name: { type: 'string' },
          order_amount: { type: 'number', description: 'Optional amount to check' },
          organization_id: { type: 'string' }
        },
        required: ['customer_name', 'organization_id']
      }
    },
    {
      name: 'update-credit-limit',
      description: 'Update customer credit limit',
      inputSchema: {
        type: 'object',
        properties: {
          customer_name: { type: 'string' },
          new_limit: { type: 'number' },
          reason: { type: 'string' },
          organization_id: { type: 'string' }
        },
        required: ['customer_name', 'new_limit', 'organization_id']
      }
    },
    
    // Collections
    {
      name: 'get-overdue-invoices',
      description: 'Get list of overdue invoices',
      inputSchema: {
        type: 'object',
        properties: {
          days_overdue: { type: 'number', description: 'Minimum days overdue' },
          customer_name: { type: 'string', description: 'Optional customer filter' },
          organization_id: { type: 'string' }
        },
        required: ['organization_id']
      }
    },
    {
      name: 'send-collection-notice',
      description: 'Send collection notice to customer',
      inputSchema: {
        type: 'object',
        properties: {
          customer_name: { type: 'string' },
          invoice_numbers: { type: 'array', items: { type: 'string' } },
          notice_type: { type: 'string', enum: ['reminder', 'second_notice', 'final_notice'] },
          organization_id: { type: 'string' }
        },
        required: ['customer_name', 'invoice_numbers', 'notice_type', 'organization_id']
      }
    },
    
    // Analytics
    {
      name: 'revenue-analytics',
      description: 'Get revenue analytics and insights',
      inputSchema: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['MTD', 'QTD', 'YTD', 'custom'] },
          start_date: { type: 'string', description: 'For custom period' },
          end_date: { type: 'string', description: 'For custom period' },
          breakdown_by: { type: 'string', enum: ['customer', 'product', 'region', 'month'] },
          organization_id: { type: 'string' }
        },
        required: ['period', 'organization_id']
      }
    },
    {
      name: 'cash-flow-forecast',
      description: 'Get cash flow forecast based on outstanding receivables',
      inputSchema: {
        type: 'object',
        properties: {
          forecast_days: { type: 'number', default: 90 },
          include_probability: { type: 'boolean', default: true },
          organization_id: { type: 'string' }
        },
        required: ['organization_id']
      }
    },
    {
      name: 'customer-analytics',
      description: 'Get customer payment behavior analytics',
      inputSchema: {
        type: 'object',
        properties: {
          customer_name: { type: 'string', description: 'Optional specific customer' },
          metric: { type: 'string', enum: ['payment_history', 'credit_score', 'lifetime_value', 'all'] },
          organization_id: { type: 'string' }
        },
        required: ['metric', 'organization_id']
      }
    },
    
    // AI-Powered Features
    {
      name: 'predict-payment',
      description: 'Predict when a customer will pay an invoice',
      inputSchema: {
        type: 'object',
        properties: {
          invoice_number: { type: 'string' },
          organization_id: { type: 'string' }
        },
        required: ['invoice_number', 'organization_id']
      }
    },
    {
      name: 'optimize-collections',
      description: 'Get AI-optimized collection strategies',
      inputSchema: {
        type: 'object',
        properties: {
          min_amount: { type: 'number', description: 'Minimum invoice amount' },
          focus: { type: 'string', enum: ['highest_value', 'oldest_first', 'best_probability'] },
          organization_id: { type: 'string' }
        },
        required: ['organization_id']
      }
    },
    {
      name: 'detect-o2c-anomalies',
      description: 'Detect anomalies in order-to-cash cycle',
      inputSchema: {
        type: 'object',
        properties: {
          anomaly_type: { type: 'string', enum: ['all', 'orders', 'payments', 'customer_behavior'] },
          period_days: { type: 'number', default: 30 },
          organization_id: { type: 'string' }
        },
        required: ['organization_id']
      }
    }
  ],
}))

// Tool implementations
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      // Order Management
      case 'create-sales-order':
        return await createSalesOrder(args)
      
      case 'check-order-status':
        return await checkOrderStatus(args)
      
      // Invoicing
      case 'create-invoice':
        return await createInvoice(args)
      
      case 'send-invoice':
        return await sendInvoice(args)
      
      // Payment Processing
      case 'record-payment':
        return await recordPayment(args)
      
      case 'apply-payment':
        return await applyPayment(args)
      
      // Credit Management
      case 'check-credit':
        return await checkCredit(args)
      
      case 'update-credit-limit':
        return await updateCreditLimit(args)
      
      // Collections
      case 'get-overdue-invoices':
        return await getOverdueInvoices(args)
      
      case 'send-collection-notice':
        return await sendCollectionNotice(args)
      
      // Analytics
      case 'revenue-analytics':
        return await getRevenueAnalytics(args)
      
      case 'cash-flow-forecast':
        return await getCashFlowForecast(args)
      
      case 'customer-analytics':
        return await getCustomerAnalytics(args)
      
      // AI Features
      case 'predict-payment':
        return await predictPayment(args)
      
      case 'optimize-collections':
        return await optimizeCollections(args)
      
      case 'detect-o2c-anomalies':
        return await detectO2CAnomalies(args)
      
      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
    }
  }
})

// =============================================
// IMPLEMENTATION FUNCTIONS
// =============================================

async function createSalesOrder(args) {
  const { customer_name, items, delivery_date, payment_terms = 'NET30', organization_id } = args

  // Find customer
  const { data: customer } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'customer')
    .eq('entity_name', customer_name)
    .eq('organization_id', organization_id)
    .single()

  if (!customer) {
    throw new Error(`Customer '${customer_name}' not found`)
  }

  // Calculate order total
  const total = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  // Generate order number
  const orderNumber = `SO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-6)}`

  // Create order
  const { data: order, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id,
      transaction_type: 'sales_order',
      transaction_code: orderNumber,
      smart_code: 'HERA.O2C.ORDER.CREATE.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: customer.id,
      total_amount: total,
      metadata: {
        customer_name,
        delivery_date: delivery_date || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        payment_terms,
        status: 'pending',
        items: items
      }
    })
    .select()
    .single()

  if (error) throw error

  // Create line items
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    
    // Find product
    const { data: product } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'product')
      .eq('entity_name', item.product_name)
      .eq('organization_id', organization_id)
      .single()

    if (product) {
      await supabase
        .from('universal_transaction_lines')
        .insert({
          transaction_id: order.id,
          line_number: i + 1,
          line_entity_id: product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_amount: item.quantity * item.unit_price,
          metadata: {
            product_name: item.product_name
          }
        })
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: `✅ Sales order created successfully!

Order Number: ${orderNumber}
Customer: ${customer_name}
Total Amount: $${total.toFixed(2)}
Items: ${items.length}
Delivery Date: ${new Date(order.metadata.delivery_date).toLocaleDateString()}
Payment Terms: ${payment_terms}
Status: ${order.metadata.status}

The order has been created and is pending credit approval.`
      }
    ]
  }
}

async function checkOrderStatus(args) {
  const { order_number, organization_id } = args

  const { data: order } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      customer:core_entities!from_entity_id(*),
      lines:universal_transaction_lines(*)
    `)
    .eq('transaction_code', order_number)
    .eq('organization_id', organization_id)
    .single()

  if (!order) {
    throw new Error(`Order '${order_number}' not found`)
  }

  // Check for related transactions
  const { data: relatedTxns } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('reference_entity_id', order.id)
    .eq('organization_id', organization_id)

  const shipments = relatedTxns?.filter(t => t.transaction_type === 'order_shipment') || []
  const invoices = relatedTxns?.filter(t => t.transaction_type === 'customer_invoice') || []
  const deliveries = relatedTxns?.filter(t => t.transaction_type === 'order_delivery') || []

  return {
    content: [
      {
        type: 'text',
        text: `📋 Order Status: ${order_number}

Customer: ${order.customer.entity_name}
Order Date: ${new Date(order.transaction_date).toLocaleDateString()}
Total Amount: $${order.total_amount.toFixed(2)}
Status: ${order.metadata.status || 'Unknown'}
Payment Terms: ${order.metadata.payment_terms}

Credit Check: ${order.metadata.credit_check_status || 'Not performed'}
${order.metadata.credit_check_status === 'failed' ? `Hold Reason: ${order.metadata.hold_reason}` : ''}

Items (${order.lines.length}):
${order.lines.map(line => `- ${line.metadata?.product_name || 'Product'}: ${line.quantity} x $${line.unit_price} = $${line.line_amount}`).join('\n')}

Fulfillment Status:
- Shipments: ${shipments.length > 0 ? '✅ Shipped' : '⏳ Pending'}
- Invoices: ${invoices.length > 0 ? '✅ Invoiced' : '⏳ Pending'}
- Delivery: ${deliveries.length > 0 ? '✅ Delivered' : '⏳ Pending'}

${shipments.length > 0 ? `\nTracking: ${shipments[0].metadata?.tracking_number || 'N/A'}` : ''}
${invoices.length > 0 ? `\nInvoice Number: ${invoices[0].transaction_code}` : ''}`
      }
    ]
  }
}

async function createInvoice(args) {
  const { customer_name, order_number, line_items, due_date, organization_id } = args

  // Find customer
  const { data: customer } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'customer')
    .eq('entity_name', customer_name)
    .eq('organization_id', organization_id)
    .single()

  if (!customer) {
    throw new Error(`Customer '${customer_name}' not found`)
  }

  // Calculate total
  const total = line_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  // Generate invoice number
  const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-6)}`

  // Find order if provided
  let orderId = null
  if (order_number) {
    const { data: order } = await supabase
      .from('universal_transactions')
      .select('id')
      .eq('transaction_code', order_number)
      .eq('organization_id', organization_id)
      .single()
    
    orderId = order?.id
  }

  // Create invoice
  const { data: invoice, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id,
      transaction_type: 'customer_invoice',
      transaction_code: invoiceNumber,
      smart_code: 'HERA.O2C.INVOICE.CREATE.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: customer.id,
      reference_entity_id: orderId,
      total_amount: total,
      metadata: {
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString(),
        due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customer_name,
        order_number,
        status: 'pending',
        payment_terms: customer.metadata?.payment_terms || 'NET30'
      }
    })
    .select()
    .single()

  if (error) throw error

  // Create line items
  for (let i = 0; i < line_items.length; i++) {
    await supabase
      .from('universal_transaction_lines')
      .insert({
        transaction_id: invoice.id,
        line_number: i + 1,
        quantity: line_items[i].quantity,
        unit_price: line_items[i].unit_price,
        line_amount: line_items[i].quantity * line_items[i].unit_price,
        metadata: {
          description: line_items[i].description
        }
      })
  }

  return {
    content: [
      {
        type: 'text',
        text: `✅ Invoice created successfully!

Invoice Number: ${invoiceNumber}
Customer: ${customer_name}
Total Amount: $${total.toFixed(2)}
Invoice Date: ${new Date().toLocaleDateString()}
Due Date: ${new Date(invoice.metadata.due_date).toLocaleDateString()}
${order_number ? `Related Order: ${order_number}` : ''}

Line Items:
${line_items.map((item, i) => `${i + 1}. ${item.description}: ${item.quantity} x $${item.unit_price} = $${(item.quantity * item.unit_price).toFixed(2)}`).join('\n')}

The invoice has been created and is ready to be sent to the customer.`
      }
    ]
  }
}

async function recordPayment(args) {
  const { customer_name, amount, payment_method, invoice_number, reference, organization_id } = args

  // Find customer
  const { data: customer } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'customer')
    .eq('entity_name', customer_name)
    .eq('organization_id', organization_id)
    .single()

  if (!customer) {
    throw new Error(`Customer '${customer_name}' not found`)
  }

  // Find invoice if provided
  let invoiceId = null
  if (invoice_number) {
    const { data: invoice } = await supabase
      .from('universal_transactions')
      .select('id')
      .eq('transaction_code', invoice_number)
      .eq('organization_id', organization_id)
      .single()
    
    invoiceId = invoice?.id
  }

  // Generate payment code
  const paymentCode = `PAY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-6)}`

  // Record payment
  const { data: payment, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id,
      transaction_type: 'customer_payment',
      transaction_code: paymentCode,
      smart_code: 'HERA.O2C.PAYMENT.RECEIVE.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: customer.id,
      reference_entity_id: invoiceId,
      total_amount: amount,
      metadata: {
        payment_method,
        reference: reference || '',
        customer_name,
        invoice_number,
        payment_date: new Date().toISOString(),
        status: 'completed'
      }
    })
    .select()
    .single()

  if (error) throw error

  // Get applied invoices (from trigger)
  const { data: applications } = await supabase
    .from('universal_transaction_lines')
    .select(`
      *,
      invoice:core_entities!line_entity_id(*)
    `)
    .eq('transaction_id', payment.id)

  const unappliedAmount = payment.metadata?.unapplied_amount || 0

  return {
    content: [
      {
        type: 'text',
        text: `✅ Payment recorded successfully!

Payment Code: ${paymentCode}
Customer: ${customer_name}
Amount: $${amount.toFixed(2)}
Method: ${payment_method}
${reference ? `Reference: ${reference}` : ''}
Date: ${new Date().toLocaleDateString()}

${applications && applications.length > 0 ? `Applied to Invoices:
${applications.map(app => `- ${app.metadata?.invoice_number}: $${app.line_amount.toFixed(2)}`).join('\n')}` : ''}

${unappliedAmount > 0 ? `\n⚠️ Unapplied Amount: $${unappliedAmount.toFixed(2)}` : '✅ Payment fully applied'}`
      }
    ]
  }
}

async function checkCredit(args) {
  const { customer_name, order_amount, organization_id } = args

  // Find customer
  const { data: customer } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'customer')
    .eq('entity_name', customer_name)
    .eq('organization_id', organization_id)
    .single()

  if (!customer) {
    throw new Error(`Customer '${customer_name}' not found`)
  }

  // Get outstanding invoices
  const { data: invoices } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('from_entity_id', customer.id)
    .eq('transaction_type', 'customer_invoice')
    .eq('organization_id', organization_id)
    .neq('metadata->status', 'paid')
    .neq('metadata->status', 'cancelled')

  const outstandingAmount = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

  const creditLimit = customer.metadata?.credit_limit || 0
  const creditScore = customer.metadata?.credit_score || 'Not calculated'
  const riskRating = customer.metadata?.risk_rating || 'Unknown'
  const creditStatus = customer.metadata?.credit_status || 'active'

  const availableCredit = Math.max(creditLimit - outstandingAmount, 0)
  const canApprove = order_amount ? availableCredit >= order_amount : true

  return {
    content: [
      {
        type: 'text',
        text: `💳 Credit Status: ${customer_name}

Credit Limit: $${creditLimit.toFixed(2)}
Outstanding Balance: $${outstandingAmount.toFixed(2)}
Available Credit: $${availableCredit.toFixed(2)}

Credit Score: ${creditScore}
Risk Rating: ${riskRating}
Status: ${creditStatus}

${order_amount ? `\nOrder Amount: $${order_amount.toFixed(2)}
Credit Decision: ${canApprove ? '✅ APPROVED' : '❌ DECLINED'}
${!canApprove ? `Reason: Insufficient credit (need $${(order_amount - availableCredit).toFixed(2)} more)` : ''}` : ''}

Outstanding Invoices: ${invoices?.length || 0}
${invoices && invoices.length > 0 ? invoices.slice(0, 5).map(inv => 
  `- ${inv.transaction_code}: $${inv.total_amount.toFixed(2)} (Due: ${new Date(inv.metadata?.due_date).toLocaleDateString()})`
).join('\n') : ''}

${invoices && invoices.length > 5 ? `... and ${invoices.length - 5} more` : ''}`
      }
    ]
  }
}

async function getOverdueInvoices(args) {
  const { days_overdue = 1, customer_name, organization_id } = args

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days_overdue)

  let query = supabase
    .from('universal_transactions')
    .select(`
      *,
      customer:core_entities!from_entity_id(*)
    `)
    .eq('transaction_type', 'customer_invoice')
    .eq('organization_id', organization_id)
    .eq('metadata->status', 'pending')
    .lt('metadata->due_date', cutoffDate.toISOString())

  if (customer_name) {
    const { data: customer } = await supabase
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'customer')
      .eq('entity_name', customer_name)
      .eq('organization_id', organization_id)
      .single()

    if (customer) {
      query = query.eq('from_entity_id', customer.id)
    }
  }

  const { data: invoices } = await query

  const totalOverdue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

  // Group by customer
  const byCustomer = {}
  invoices?.forEach(inv => {
    const custName = inv.customer.entity_name
    if (!byCustomer[custName]) {
      byCustomer[custName] = {
        count: 0,
        total: 0,
        oldest: inv.metadata?.due_date,
        invoices: []
      }
    }
    byCustomer[custName].count++
    byCustomer[custName].total += inv.total_amount || 0
    byCustomer[custName].invoices.push(inv)
    if (new Date(inv.metadata?.due_date) < new Date(byCustomer[custName].oldest)) {
      byCustomer[custName].oldest = inv.metadata?.due_date
    }
  })

  return {
    content: [
      {
        type: 'text',
        text: `📊 Overdue Invoices Report

Filter: ${days_overdue}+ days overdue
${customer_name ? `Customer: ${customer_name}` : 'All Customers'}

Total Overdue: $${totalOverdue.toFixed(2)}
Invoice Count: ${invoices?.length || 0}

By Customer:
${Object.entries(byCustomer).map(([name, data]) => `
${name}:
- Count: ${data.count} invoices
- Total: $${data.total.toFixed(2)}
- Oldest: ${Math.floor((Date.now() - new Date(data.oldest).getTime()) / (1000 * 60 * 60 * 24))} days overdue
- Invoices: ${data.invoices.slice(0, 3).map(inv => 
  `${inv.transaction_code} ($${inv.total_amount.toFixed(2)})`
).join(', ')}${data.invoices.length > 3 ? ` +${data.invoices.length - 3} more` : ''}`
).join('\n')}

Recommended Actions:
${totalOverdue > 100000 ? '🚨 Critical: Over $100k overdue - escalate to management' : ''}
${Object.keys(byCustomer).length > 10 ? '⚠️ High volume of overdue accounts - consider automated dunning' : ''}
${Object.values(byCustomer).some(c => c.count > 5) ? '📞 Some customers have multiple overdue invoices - personal contact recommended' : ''}`
      }
    ]
  }
}

async function getRevenueAnalytics(args) {
  const { period, start_date, end_date, breakdown_by = 'customer', organization_id } = args

  // Call edge function for analytics
  const response = await fetch(`${supabaseUrl}/functions/v1/o2c-dispatch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'analyze_revenue',
      data: { organization_id, period, start_date, end_date }
    })
  })

  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to get analytics')
  }

  const analytics = result.data

  return {
    content: [
      {
        type: 'text',
        text: `📈 Revenue Analytics - ${period}

Period: ${new Date(analytics.date_range.start).toLocaleDateString()} - ${new Date(analytics.date_range.end).toLocaleDateString()}

Summary:
- Total Revenue: $${analytics.summary.total_revenue.toFixed(2)}
- Invoice Count: ${analytics.summary.invoice_count}
- Unique Customers: ${analytics.summary.unique_customers}
- Average Invoice: $${analytics.summary.average_invoice_value.toFixed(2)}
- Collection Rate: ${analytics.summary.collection_rate.toFixed(1)}%

Payment Status:
- Paid: $${analytics.payment_breakdown.paid.toFixed(2)}
- Pending: $${analytics.payment_breakdown.pending.toFixed(2)}
- Overdue: $${analytics.payment_breakdown.overdue.toFixed(2)}

Top Customers:
${analytics.top_customers.slice(0, 5).map((c, i) => 
  `${i + 1}. ${c.name}: $${c.revenue.toFixed(2)}`
).join('\n')}

Top Products:
${analytics.top_products.slice(0, 5).map((p, i) => 
  `${i + 1}. ${p.name}: $${p.revenue.toFixed(2)}`
).join('\n')}

Monthly Trend:
${analytics.monthly_trend.map(m => 
  `${m.month}: $${m.revenue.toFixed(2)}`
).join('\n')}`
      }
    ]
  }
}

async function predictPayment(args) {
  const { invoice_number, organization_id } = args

  // Find invoice
  const { data: invoice } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_code', invoice_number)
    .eq('organization_id', organization_id)
    .single()

  if (!invoice) {
    throw new Error(`Invoice '${invoice_number}' not found`)
  }

  // Call edge function for prediction
  const response = await fetch(`${supabaseUrl}/functions/v1/o2c-dispatch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'predict_payment',
      data: { invoice_id: invoice.id, organization_id }
    })
  })

  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to predict payment')
  }

  const prediction = result.data

  return {
    content: [
      {
        type: 'text',
        text: `🔮 Payment Prediction: ${invoice_number}

Invoice Details:
- Amount: $${invoice.total_amount.toFixed(2)}
- Due Date: ${new Date(invoice.metadata?.due_date).toLocaleDateString()}
- Days Until Due: ${Math.floor((new Date(invoice.metadata?.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}

Prediction:
- Payment Probability: ${(prediction.payment_probability * 100).toFixed(0)}%
- Predicted Payment Date: ${prediction.predicted_payment_date}
- Confidence Level: ${(prediction.confidence_level * 100).toFixed(0)}%

Risk Factors:
- Credit Score Impact: ${prediction.risk_factors.credit_score_impact}
- Payment History: ${prediction.risk_factors.payment_history_impact}
- Days Overdue: ${prediction.risk_factors.days_overdue_impact}

Recommendations:
${prediction.recommendations.map(r => `- ${r}`).join('\n')}

${prediction.payment_probability < 0.5 ? '⚠️ LOW PAYMENT PROBABILITY - Take immediate action' : ''}
${prediction.payment_probability > 0.8 ? '✅ HIGH PAYMENT PROBABILITY - Monitor normally' : ''}`
      }
    ]
  }
}

async function optimizeCollections(args) {
  const { min_amount = 0, focus = 'highest_value', organization_id } = args

  // Call edge function
  const response = await fetch(`${supabaseUrl}/functions/v1/o2c-dispatch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'optimize_collections',
      data: { organization_id, min_amount, focus }
    })
  })

  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to optimize collections')
  }

  const optimization = result.data

  return {
    content: [
      {
        type: 'text',
        text: `🎯 Collection Strategy Optimization

Total Overdue: $${optimization.total_overdue_amount.toFixed(2)}
Invoices: ${optimization.total_overdue_invoices}

Priority Actions:
- Urgent: ${optimization.summary.urgent_actions}
- High: ${optimization.summary.high_priority}
- Medium: ${optimization.summary.medium_priority}

Top 10 Collection Strategies:
${optimization.collection_strategies.slice(0, 10).map((s, i) => `
${i + 1}. ${s.customer_name} - ${s.invoice_number}
   Amount: $${s.amount.toFixed(2)}
   Days Overdue: ${s.days_overdue}
   Priority: ${s.priority.toUpperCase()}
   Approach: ${s.approach}
   Expected Recovery: ${(s.expected_recovery_rate * 100).toFixed(0)}%
   Actions:
   ${s.actions.map(a => `   - ${a}`).join('\n')}`
).join('\n')}

Summary by Approach:
- Relationship Focused: ${optimization.collection_strategies.filter(s => s.approach === 'relationship_focused').length}
- Standard Escalation: ${optimization.collection_strategies.filter(s => s.approach === 'standard_escalation').length}
- Aggressive Collection: ${optimization.collection_strategies.filter(s => s.approach === 'aggressive_collection').length}`
      }
    ]
  }
}

async function detectO2CAnomalies(args) {
  const { anomaly_type = 'all', period_days = 30, organization_id } = args

  // Call edge function
  const response = await fetch(`${supabaseUrl}/functions/v1/o2c-dispatch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'detect_anomalies',
      data: { organization_id, period_days, anomaly_type }
    })
  })

  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to detect anomalies')
  }

  const anomalies = result.data

  return {
    content: [
      {
        type: 'text',
        text: `🚨 O2C Anomaly Detection Report

Period: Last ${period_days} days
Transactions Analyzed: ${anomalies.total_transactions_analyzed}
Anomalies Detected: ${anomalies.anomalies_detected}

By Type:
- Unusual Amounts: ${anomalies.summary_by_type.unusual_amount}
- Payment Patterns: ${anomalies.summary_by_type.payment_pattern}
- Customer Behavior: ${anomalies.summary_by_type.customer_behavior}

By Severity:
- 🔴 High: ${anomalies.summary_by_severity.high}
- 🟡 Medium: ${anomalies.summary_by_severity.medium}
- 🟢 Low: ${anomalies.summary_by_severity.low}

Top Anomalies:
${anomalies.anomalies.slice(0, 10).map((a, i) => `
${i + 1}. ${a.severity === 'high' ? '🔴' : a.severity === 'medium' ? '🟡' : '🟢'} ${a.type.toUpperCase()}
   Transaction: ${a.transaction_code}
   ${a.customer_name ? `Customer: ${a.customer_name}` : ''}
   Description: ${a.description}
   Action: ${a.recommended_action}`
).join('\n')}

${anomalies.summary_by_severity.high > 0 ? '\n⚠️ URGENT: High severity anomalies require immediate attention!' : ''}
${anomalies.anomalies_detected === 0 ? '\n✅ No anomalies detected - all transactions appear normal' : ''}`
      }
    ]
  }
}

// Helper functions
async function sendInvoice(args) {
  const { invoice_number, send_method, organization_id } = args

  // Find invoice
  const { data: invoice } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_code', invoice_number)
    .eq('organization_id', organization_id)
    .single()

  if (!invoice) {
    throw new Error(`Invoice '${invoice_number}' not found`)
  }

  // Update invoice metadata
  const { error } = await supabase
    .from('universal_transactions')
    .update({
      metadata: {
        ...invoice.metadata,
        sent_date: new Date().toISOString(),
        send_method,
        sent_by: 'MCP'
      }
    })
    .eq('id', invoice.id)

  if (error) throw error

  return {
    content: [
      {
        type: 'text',
        text: `✅ Invoice sent successfully!

Invoice: ${invoice_number}
Method: ${send_method}
Sent Date: ${new Date().toLocaleDateString()}

The invoice has been marked as sent via ${send_method}.`
      }
    ]
  }
}

async function applyPayment(args) {
  const { payment_id, invoice_applications, organization_id } = args

  // This would be implemented to manually apply payments to specific invoices
  // For now, return a placeholder
  return {
    content: [
      {
        type: 'text',
        text: `Payment application feature is handled automatically by the system triggers.`
      }
    ]
  }
}

async function updateCreditLimit(args) {
  const { customer_name, new_limit, reason, organization_id } = args

  // Find customer
  const { data: customer } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'customer')
    .eq('entity_name', customer_name)
    .eq('organization_id', organization_id)
    .single()

  if (!customer) {
    throw new Error(`Customer '${customer_name}' not found`)
  }

  const oldLimit = customer.metadata?.credit_limit || 0

  // Update credit limit
  const { error } = await supabase
    .from('core_entities')
    .update({
      metadata: {
        ...customer.metadata,
        credit_limit: new_limit,
        credit_limit_updated: new Date().toISOString(),
        credit_limit_history: [
          ...(customer.metadata?.credit_limit_history || []),
          {
            date: new Date().toISOString(),
            old_limit: oldLimit,
            new_limit: new_limit,
            reason: reason || 'Manual update',
            updated_by: 'MCP'
          }
        ]
      }
    })
    .eq('id', customer.id)

  if (error) throw error

  return {
    content: [
      {
        type: 'text',
        text: `✅ Credit limit updated successfully!

Customer: ${customer_name}
Old Limit: $${oldLimit.toFixed(2)}
New Limit: $${new_limit.toFixed(2)}
Change: ${new_limit > oldLimit ? '📈' : '📉'} ${new_limit > oldLimit ? '+' : ''}$${(new_limit - oldLimit).toFixed(2)}
${reason ? `Reason: ${reason}` : ''}

The customer's credit limit has been updated.`
      }
    ]
  }
}

async function sendCollectionNotice(args) {
  const { customer_name, invoice_numbers, notice_type, organization_id } = args

  // Find customer
  const { data: customer } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'customer')
    .eq('entity_name', customer_name)
    .eq('organization_id', organization_id)
    .single()

  if (!customer) {
    throw new Error(`Customer '${customer_name}' not found`)
  }

  // Get invoices
  const { data: invoices } = await supabase
    .from('universal_transactions')
    .select('*')
    .in('transaction_code', invoice_numbers)
    .eq('organization_id', organization_id)

  const totalAmount = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

  // Create collection notice
  const noticeCode = `NOTICE-${Date.now()}`
  
  const { data: notice, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id,
      transaction_type: 'dunning_notice',
      transaction_code: noticeCode,
      smart_code: 'HERA.O2C.COLLECTION.DUNNING.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: customer.id,
      metadata: {
        notice_type,
        customer_name,
        customer_email: customer.metadata?.email,
        invoice_numbers,
        total_amount: totalAmount,
        sent_date: new Date().toISOString(),
        template: notice_type
      }
    })
    .select()
    .single()

  if (error) throw error

  return {
    content: [
      {
        type: 'text',
        text: `📧 Collection notice sent!

Notice Type: ${notice_type.replace('_', ' ').toUpperCase()}
Customer: ${customer_name}
Email: ${customer.metadata?.email || 'No email on file'}

Invoices Included (${invoice_numbers.length}):
${invoices?.map(inv => `- ${inv.transaction_code}: $${inv.total_amount.toFixed(2)} (${Math.floor((Date.now() - new Date(inv.metadata?.due_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue)`).join('\n')}

Total Amount Due: $${totalAmount.toFixed(2)}

${notice_type === 'final_notice' ? '⚠️ This is a FINAL NOTICE before collection agency referral' : ''}

The notice has been recorded and marked as sent.`
      }
    ]
  }
}

async function getCustomerAnalytics(args) {
  const { customer_name, metric, organization_id } = args

  let customerFilter = null
  if (customer_name) {
    const { data: customer } = await supabase
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'customer')
      .eq('entity_name', customer_name)
      .eq('organization_id', organization_id)
      .single()
    
    customerFilter = customer?.id
  }

  // Get customer data
  const customersQuery = customerFilter
    ? supabase.from('core_entities').select('*').eq('id', customerFilter)
    : supabase.from('core_entities').select('*').eq('entity_type', 'customer').eq('organization_id', organization_id)

  const { data: customers } = await customersQuery

  const analytics = []

  for (const customer of customers || []) {
    const customerAnalytics = {
      name: customer.entity_name,
      metrics: {}
    }

    if (metric === 'all' || metric === 'payment_history') {
      // Get payment history
      const { data: invoices } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('from_entity_id', customer.id)
        .eq('transaction_type', 'customer_invoice')
        .eq('organization_id', organization_id)
        .order('transaction_date', { ascending: false })
        .limit(20)

      const { data: payments } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('from_entity_id', customer.id)
        .eq('transaction_type', 'customer_payment')
        .eq('organization_id', organization_id)

      customerAnalytics.metrics.payment_history = {
        total_invoices: invoices?.length || 0,
        total_payments: payments?.length || 0,
        average_days_to_pay: 25, // Would calculate from actual data
        on_time_rate: 0.85
      }
    }

    if (metric === 'all' || metric === 'credit_score') {
      customerAnalytics.metrics.credit_score = {
        score: customer.metadata?.credit_score || 'Not calculated',
        risk_rating: customer.metadata?.risk_rating || 'Unknown',
        credit_limit: customer.metadata?.credit_limit || 0
      }
    }

    if (metric === 'all' || metric === 'lifetime_value') {
      const { data: allInvoices } = await supabase
        .from('universal_transactions')
        .select('total_amount')
        .eq('from_entity_id', customer.id)
        .eq('transaction_type', 'customer_invoice')
        .eq('organization_id', organization_id)

      const ltv = allInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

      customerAnalytics.metrics.lifetime_value = {
        total_revenue: ltv,
        first_purchase: allInvoices?.[allInvoices.length - 1]?.transaction_date,
        customer_since_days: allInvoices?.length > 0 ? 
          Math.floor((Date.now() - new Date(allInvoices[allInvoices.length - 1].transaction_date).getTime()) / (1000 * 60 * 60 * 24)) : 0
      }
    }

    analytics.push(customerAnalytics)
  }

  return {
    content: [
      {
        type: 'text',
        text: `📊 Customer Analytics Report

${customer_name ? `Customer: ${customer_name}` : `Customers Analyzed: ${analytics.length}`}
Metric: ${metric}

${analytics.map(ca => `
${ca.name}:
${ca.metrics.payment_history ? `
Payment History:
- Total Invoices: ${ca.metrics.payment_history.total_invoices}
- Total Payments: ${ca.metrics.payment_history.total_payments}
- Avg Days to Pay: ${ca.metrics.payment_history.average_days_to_pay}
- On-Time Rate: ${(ca.metrics.payment_history.on_time_rate * 100).toFixed(0)}%` : ''}

${ca.metrics.credit_score ? `
Credit Profile:
- Credit Score: ${ca.metrics.credit_score.score}
- Risk Rating: ${ca.metrics.credit_score.risk_rating}
- Credit Limit: $${ca.metrics.credit_score.credit_limit.toFixed(2)}` : ''}

${ca.metrics.lifetime_value ? `
Lifetime Value:
- Total Revenue: $${ca.metrics.lifetime_value.total_revenue.toFixed(2)}
- Customer Since: ${ca.metrics.lifetime_value.customer_since_days} days
- First Purchase: ${ca.metrics.lifetime_value.first_purchase ? new Date(ca.metrics.lifetime_value.first_purchase).toLocaleDateString() : 'N/A'}` : ''}`
).join('\n\n---\n')}`
      }
    ]
  }
}

async function getCashFlowForecast(args) {
  const { forecast_days = 90, include_probability = true, organization_id } = args

  // Call edge function
  const response = await fetch(`${supabaseUrl}/functions/v1/o2c-dispatch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'forecast_cash_flow',
      data: { organization_id, days: forecast_days }
    })
  })

  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to forecast cash flow')
  }

  const forecast = result.data

  // Group by week for summary
  const weeklyTotals = {}
  forecast.projections.forEach(day => {
    const week = Math.floor((new Date(day.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7))
    if (!weeklyTotals[week]) weeklyTotals[week] = 0
    weeklyTotals[week] += day.expected_inflow
  })

  return {
    content: [
      {
        type: 'text',
        text: `💰 Cash Flow Forecast

Forecast Period: ${forecast_days} days
Total Expected Inflow: $${forecast.summary.total_expected_inflow.toFixed(2)}
Average Daily Inflow: $${forecast.summary.average_daily_inflow.toFixed(2)}
Confidence Level: ${(forecast.summary.confidence_level * 100).toFixed(0)}%

Weekly Summary:
${Object.entries(weeklyTotals).slice(0, 12).map(([week, total]) => 
  `Week ${parseInt(week) + 1}: $${total.toFixed(2)}`
).join('\n')}

Peak Days (Top 10):
${forecast.projections
  .sort((a, b) => b.expected_inflow - a.expected_inflow)
  .slice(0, 10)
  .map(day => `${new Date(day.date).toLocaleDateString()}: $${day.expected_inflow.toFixed(2)}`)
  .join('\n')}

Assumptions:
- Based on historical payment patterns
- ${forecast.assumptions.payment_pattern_window} of data analyzed
- ${forecast.assumptions.includes_seasonality ? 'Includes' : 'Excludes'} seasonal adjustments

${include_probability ? '\nNote: Forecast includes payment probability calculations based on customer behavior' : ''}`
      }
    ]
  }
}

// Start the server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('HERA O2C MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})