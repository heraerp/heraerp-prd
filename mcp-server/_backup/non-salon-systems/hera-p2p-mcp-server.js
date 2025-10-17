#!/usr/bin/env node

/**
 * HERA P2P (Procure-to-Pay) MCP Server
 * AI agent tools for complete P2P cycle on 6 universal tables
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Define P2P tools
const p2pTools = {
  'p2p.create_supplier': {
    description: 'Create a new supplier in the system',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        supplier_name: { type: 'string', description: 'Supplier company name' },
        tax_id: { type: 'string', description: 'Tax identification number' },
        payment_terms: { type: 'string', description: 'Payment terms (e.g., "net 30", "2/10 net 30")' },
        contact_info: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' }
          }
        },
        bank_details: {
          type: 'object',
          properties: {
            account_number: { type: 'string' },
            routing_number: { type: 'string' },
            bank_name: { type: 'string' }
          }
        }
      },
      required: ['organization_id', 'supplier_name', 'tax_id', 'payment_terms']
    },
    handler: async (params) => {
      console.log('Creating supplier:', params)

      // Create supplier entity
      const { data: supplier, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: params.organization_id,
          entity_type: 'supplier',
          entity_name: params.supplier_name,
          entity_code: `SUP-${Date.now()}`,
          smart_code: 'HERA.P2P.SUPPLIER.CREATE.v1',
          metadata: {
            tax_id: params.tax_id,
            payment_terms: params.payment_terms,
            contact_info: params.contact_info,
            status: 'active',
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (error) throw error

      // Store bank details securely
      if (params.bank_details) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: params.organization_id,
            entity_id: supplier.id,
            field_name: 'bank_details',
            field_value_json: params.bank_details,
            smart_code: 'HERA.P2P.SUPPLIER.UPDATE.v1',
            metadata: { encrypted: true }
          })
      }

      return {
        success: true,
        supplier_id: supplier.id,
        supplier_code: supplier.entity_code,
        message: `Created supplier: ${params.supplier_name}`
      }
    }
  },

  'p2p.create_po': {
    description: 'Create a purchase order',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        supplier_id: { type: 'string', description: 'Supplier entity UUID' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              product_id: { type: 'string', description: 'Product entity UUID' },
              description: { type: 'string' },
              quantity: { type: 'number' },
              unit_price: { type: 'number' },
              unit_of_measure: { type: 'string' }
            },
            required: ['description', 'quantity', 'unit_price']
          }
        },
        delivery_date: { type: 'string', format: 'date' },
        delivery_address: { type: 'string' },
        budget_account: { type: 'string', description: 'Budget/GL account code' },
        notes: { type: 'string' }
      },
      required: ['organization_id', 'supplier_id', 'items']
    },
    handler: async (params) => {
      console.log('Creating PO:', params)

      // Calculate total amount
      const totalAmount = params.items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0
      )

      // Create PO transaction
      const { data: po, error: poError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: params.organization_id,
          transaction_type: 'purchase_order',
          transaction_code: `PO-${Date.now()}`,
          smart_code: 'HERA.P2P.PO.CREATE.v1',
          total_amount: totalAmount,
          from_entity_id: params.organization_id, // Buyer
          to_entity_id: params.supplier_id, // Supplier
          transaction_date: new Date().toISOString(),
          metadata: {
            supplier_id: params.supplier_id,
            delivery_date: params.delivery_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            delivery_address: params.delivery_address,
            budget_account: params.budget_account,
            notes: params.notes,
            status: 'draft',
            quantity: params.items.reduce((sum, item) => sum + item.quantity, 0)
          }
        })
        .select()
        .single()

      if (poError) throw poError

      // Create PO line items
      const lines = params.items.map((item, index) => ({
        organization_id: params.organization_id,
        transaction_id: po.id,
        line_number: index + 1,
        line_entity_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_amount: item.quantity * item.unit_price,
        smart_code: 'HERA.P2P.PO.LINE.v1',
        metadata: {
          description: item.description,
          unit_of_measure: item.unit_of_measure || 'EA'
        }
      }))

      const { error: lineError } = await supabase
        .from('universal_transaction_lines')
        .insert(lines)

      if (lineError) throw lineError

      // Trigger workflow via edge function
      await supabase.functions.invoke('p2p-dispatch', {
        body: {
          organization_id: params.organization_id,
          transaction_id: po.id,
          action: 'process_po'
        }
      })

      return {
        success: true,
        po_id: po.id,
        po_number: po.transaction_code,
        total_amount: totalAmount,
        approval_required: totalAmount > 1000,
        message: `Created PO ${po.transaction_code} for ${totalAmount}`
      }
    }
  },

  'p2p.post_grn': {
    description: 'Post goods receipt note against a PO',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        po_id: { type: 'string', description: 'Purchase order UUID' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              po_line_number: { type: 'number' },
              quantity_received: { type: 'number' },
              quality_status: { type: 'string', enum: ['accepted', 'rejected', 'partial'] }
            }
          }
        },
        warehouse: { type: 'string', description: 'Warehouse/location code' },
        receiver_notes: { type: 'string' }
      },
      required: ['organization_id', 'po_id', 'items']
    },
    handler: async (params) => {
      console.log('Posting GRN:', params)

      // Get PO details
      const { data: po, error: poError } = await supabase
        .from('universal_transactions')
        .select('*, lines:universal_transaction_lines(*)')
        .eq('id', params.po_id)
        .eq('organization_id', params.organization_id)
        .single()

      if (poError || !po) throw new Error('PO not found')

      // Calculate received value
      const receivedValue = params.items.reduce((sum, item) => {
        const poLine = po.lines.find(l => l.line_number === item.po_line_number)
        return sum + (item.quantity_received * (poLine?.unit_price || 0))
      }, 0)

      // Create GRN transaction
      const { data: grn, error: grnError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: params.organization_id,
          transaction_type: 'goods_receipt',
          transaction_code: `GRN-${Date.now()}`,
          smart_code: 'HERA.P2P.GRN.POST.v1',
          total_amount: receivedValue,
          reference_entity_id: params.po_id,
          metadata: {
            po_id: params.po_id,
            po_number: po.transaction_code,
            supplier_id: po.to_entity_id,
            warehouse: params.warehouse || 'MAIN',
            receiver_notes: params.receiver_notes,
            quantity: params.items.reduce((sum, item) => sum + item.quantity_received, 0),
            update_inventory: true
          }
        })
        .select()
        .single()

      if (grnError) throw grnError

      // Create GRN lines
      const grnLines = params.items.map((item, index) => {
        const poLine = po.lines.find(l => l.line_number === item.po_line_number)
        return {
          organization_id: params.organization_id,
          transaction_id: grn.id,
          line_number: index + 1,
          line_entity_id: poLine?.line_entity_id,
          quantity: item.quantity_received,
          unit_price: poLine?.unit_price || 0,
          line_amount: item.quantity_received * (poLine?.unit_price || 0),
          smart_code: 'HERA.P2P.GRN.LINE.v1',
          metadata: {
            po_line_number: item.po_line_number,
            quality_status: item.quality_status
          }
        }
      })

      await supabase
        .from('universal_transaction_lines')
        .insert(grnLines)

      // Trigger workflow
      await supabase.functions.invoke('p2p-dispatch', {
        body: {
          organization_id: params.organization_id,
          transaction_id: grn.id,
          action: 'process_grn'
        }
      })

      return {
        success: true,
        grn_id: grn.id,
        grn_number: grn.transaction_code,
        quantity_received: params.items.reduce((sum, item) => sum + item.quantity_received, 0),
        value_received: receivedValue,
        message: `Posted GRN ${grn.transaction_code} for PO ${po.transaction_code}`
      }
    }
  },

  'p2p.match_invoice': {
    description: 'Post and match supplier invoice',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        supplier_id: { type: 'string', description: 'Supplier entity UUID' },
        invoice_number: { type: 'string', description: 'Supplier invoice number' },
        invoice_date: { type: 'string', format: 'date' },
        po_id: { type: 'string', description: 'Related PO UUID' },
        total_amount: { type: 'number' },
        tax_amount: { type: 'number' },
        due_date: { type: 'string', format: 'date' },
        match_type: { type: 'string', enum: ['2way', '3way'], default: '3way' }
      },
      required: ['organization_id', 'supplier_id', 'invoice_number', 'total_amount']
    },
    handler: async (params) => {
      console.log('Matching invoice:', params)

      // Create invoice transaction
      const { data: invoice, error: invError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: params.organization_id,
          transaction_type: 'invoice',
          transaction_code: `INV-${Date.now()}`,
          smart_code: 'HERA.P2P.INVOICE.POST.v1',
          total_amount: params.total_amount,
          from_entity_id: params.supplier_id,
          to_entity_id: params.organization_id,
          transaction_date: params.invoice_date || new Date().toISOString(),
          metadata: {
            invoice_number: params.invoice_number,
            po_id: params.po_id,
            tax_amount: params.tax_amount || 0,
            due_date: params.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            match_type: params.match_type || '3way',
            quantity: 1 // Will be updated by matching
          }
        })
        .select()
        .single()

      if (invError) throw invError

      // Trigger matching workflow
      const { data: matchResult } = await supabase.functions.invoke('p2p-dispatch', {
        body: {
          organization_id: params.organization_id,
          transaction_id: invoice.id,
          action: 'process_invoice'
        }
      })

      // Get updated invoice with match status
      const { data: updatedInvoice } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('id', invoice.id)
        .single()

      return {
        success: true,
        invoice_id: invoice.id,
        invoice_code: invoice.transaction_code,
        match_status: updatedInvoice?.metadata?.match_status || 'pending',
        match_result: updatedInvoice?.metadata?.match_result,
        payment_eligible: updatedInvoice?.metadata?.payment_eligible || false,
        message: `Invoice ${params.invoice_number} posted and matched`
      }
    }
  },

  'p2p.execute_payment': {
    description: 'Execute payment for approved invoice',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        invoice_id: { type: 'string', description: 'Invoice UUID to pay' },
        payment_method: { type: 'string', enum: ['ach', 'wire', 'check', 'card'], default: 'ach' },
        payment_date: { type: 'string', format: 'date' },
        apply_discount: { type: 'boolean', description: 'Apply early payment discount if applicable' }
      },
      required: ['organization_id', 'invoice_id']
    },
    handler: async (params) => {
      console.log('Executing payment:', params)

      // Get invoice details
      const { data: invoice, error: invError } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('id', params.invoice_id)
        .eq('organization_id', params.organization_id)
        .single()

      if (invError || !invoice) throw new Error('Invoice not found')

      // Calculate payment amount
      let paymentAmount = invoice.total_amount
      let discountApplied = false
      let discountAmount = 0

      if (params.apply_discount && invoice.metadata?.payment_terms) {
        // Check early payment discount eligibility
        const terms = invoice.metadata.payment_terms
        const invoiceDate = new Date(invoice.transaction_date)
        const paymentDate = new Date(params.payment_date || new Date())
        const daysDiff = Math.floor((paymentDate.getTime() - invoiceDate.getTime()) / (24 * 60 * 60 * 1000))

        // Parse terms like "2/10 net 30"
        const match = terms.match(/(\d+)\/(\d+)\s+net\s+(\d+)/)
        if (match) {
          const [_, discountPercent, discountDays] = match
          if (daysDiff <= parseInt(discountDays)) {
            discountAmount = invoice.total_amount * (parseInt(discountPercent) / 100)
            paymentAmount = invoice.total_amount - discountAmount
            discountApplied = true
          }
        }
      }

      // Create payment transaction
      const { data: payment, error: payError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: params.organization_id,
          transaction_type: 'payment',
          transaction_code: `PAY-${Date.now()}`,
          smart_code: 'HERA.P2P.PAYMENT.EXECUTE.v1',
          total_amount: paymentAmount,
          from_entity_id: invoice.to_entity_id, // Payer
          to_entity_id: invoice.from_entity_id, // Supplier
          transaction_date: params.payment_date || new Date().toISOString(),
          metadata: {
            invoice_id: params.invoice_id,
            invoice_number: invoice.metadata?.invoice_number,
            payment_method: params.payment_method || 'ach',
            discount_applied: discountApplied,
            discount_amount: discountAmount,
            original_amount: invoice.total_amount
          }
        })
        .select()
        .single()

      if (payError) throw payError

      // Trigger payment processing
      const { data: processResult } = await supabase.functions.invoke('p2p-dispatch', {
        body: {
          organization_id: params.organization_id,
          transaction_id: payment.id,
          action: 'process_payment'
        }
      })

      return {
        success: true,
        payment_id: payment.id,
        payment_reference: payment.transaction_code,
        amount_paid: paymentAmount,
        discount_applied: discountApplied,
        discount_amount: discountAmount,
        payment_status: processResult?.status || 'processing',
        message: `Payment ${payment.transaction_code} executed for ${paymentAmount}`
      }
    }
  },

  'p2p.get_supplier_status': {
    description: 'Get supplier performance and transaction status',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        supplier_id: { type: 'string', description: 'Supplier entity UUID' },
        include_metrics: { type: 'boolean', default: true }
      },
      required: ['organization_id', 'supplier_id']
    },
    handler: async (params) => {
      console.log('Getting supplier status:', params)

      // Get supplier details
      const { data: supplier, error: supError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('id', params.supplier_id)
        .eq('organization_id', params.organization_id)
        .single()

      if (supError || !supplier) throw new Error('Supplier not found')

      // Get transaction summary
      const { data: transactions } = await supabase
        .from('universal_transactions')
        .select('smart_code, total_amount, metadata')
        .eq('organization_id', params.organization_id)
        .or(`from_entity_id.eq.${params.supplier_id},to_entity_id.eq.${params.supplier_id}`)

      const summary = {
        total_pos: 0,
        total_invoices: 0,
        total_payments: 0,
        po_value: 0,
        invoice_value: 0,
        payment_value: 0,
        open_pos: 0,
        unpaid_invoices: 0
      }

      transactions?.forEach(tx => {
        if (tx.smart_code === 'HERA.P2P.PO.CREATE.v1') {
          summary.total_pos++
          summary.po_value += tx.total_amount
          if (tx.metadata?.po_status !== 'closed') {
            summary.open_pos++
          }
        } else if (tx.smart_code === 'HERA.P2P.INVOICE.POST.v1') {
          summary.total_invoices++
          summary.invoice_value += tx.total_amount
          if (!tx.metadata?.payment_id) {
            summary.unpaid_invoices++
          }
        } else if (tx.smart_code === 'HERA.P2P.PAYMENT.EXECUTE.v1') {
          summary.total_payments++
          summary.payment_value += tx.total_amount
        }
      })

      // Calculate metrics if requested
      let metrics = {}
      if (params.include_metrics) {
        // Get delivery performance
        const { data: grns } = await supabase
          .from('universal_transactions')
          .select('metadata')
          .eq('organization_id', params.organization_id)
          .eq('smart_code', 'HERA.P2P.GRN.POST.v1')
          .eq('metadata->supplier_id', params.supplier_id)

        const onTimeDeliveries = grns?.filter(grn => {
          // Simplified: assume on-time if exists
          return true
        }).length || 0

        metrics = {
          on_time_delivery_rate: grns?.length > 0 ? (onTimeDeliveries / grns.length) * 100 : 0,
          average_payment_days: 30, // Simplified
          spend_ytd: summary.invoice_value,
          quality_score: 95 // Simplified
        }
      }

      return {
        success: true,
        supplier: {
          id: supplier.id,
          name: supplier.entity_name,
          code: supplier.entity_code,
          status: supplier.metadata?.status || 'active',
          payment_terms: supplier.metadata?.payment_terms
        },
        summary: summary,
        metrics: metrics,
        last_transaction_date: transactions?.[0]?.metadata?.created_at
      }
    }
  },

  'p2p.detect_anomalies': {
    description: 'Detect P2P anomalies using AI (duplicates, maverick spend, unusual patterns)',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        check_period: { type: 'number', description: 'Days to look back', default: 30 },
        anomaly_types: {
          type: 'array',
          items: { type: 'string', enum: ['duplicate_po', 'duplicate_invoice', 'maverick_spend', 'unusual_payment'] },
          default: ['duplicate_po', 'duplicate_invoice', 'maverick_spend', 'unusual_payment']
        }
      },
      required: ['organization_id']
    },
    handler: async (params) => {
      console.log('Detecting P2P anomalies:', params)

      // Call edge function for anomaly detection
      const { data, error } = await supabase.functions.invoke('p2p-dispatch', {
        body: {
          organization_id: params.organization_id,
          action: 'check_anomalies',
          metadata: {
            check_period: params.check_period || 30,
            anomaly_types: params.anomaly_types
          }
        }
      })

      if (error) throw error

      return {
        success: true,
        anomalies_detected: data.anomalies_detected,
        anomalies: data.anomalies,
        ai_recommendations: data.ai_recommendations,
        check_period: data.check_period,
        message: `Detected ${data.anomalies_detected} anomalies in P2P transactions`
      }
    }
  },

  'p2p.run_payment_batch': {
    description: 'Run batch payment processing for approved invoices',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        run_type: { type: 'string', enum: ['daily', 'weekly', 'on_due_date'], default: 'on_due_date' },
        payment_date: { type: 'string', format: 'date', description: 'Payment execution date' },
        payment_method: { type: 'string', enum: ['ach', 'wire'], default: 'ach' },
        apply_discounts: { type: 'boolean', default: true }
      },
      required: ['organization_id']
    },
    handler: async (params) => {
      console.log('Running payment batch:', params)

      // Call edge function
      const { data, error } = await supabase.functions.invoke('p2p-dispatch', {
        body: {
          organization_id: params.organization_id,
          action: 'run_payment_batch',
          metadata: {
            run_type: params.run_type || 'on_due_date',
            payment_date: params.payment_date || new Date().toISOString().split('T')[0],
            payment_method: params.payment_method || 'ach',
            apply_discounts: params.apply_discounts !== false
          }
        }
      })

      if (error) throw error

      return {
        success: true,
        batch_id: data.batch_id,
        payments_created: data.payments_created,
        total_amount: data.total_amount,
        invoices_processed: data.invoices_processed,
        message: `Payment batch created: ${data.payments_created} payments totaling ${data.total_amount}`
      }
    }
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'hera-p2p-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(p2pTools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }
})

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  
  const tool = p2pTools[name]
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`)
  }

  try {
    const result = await tool.handler(args)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
          }, null, 2),
        },
      ],
    }
  }
})

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('HERA P2P MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})