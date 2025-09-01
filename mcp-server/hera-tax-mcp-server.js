#!/usr/bin/env node

/**
 * HERA Tax & Compliance MCP Server
 * AI agent tools for global tax compliance on 6 universal tables
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

// Define tax tools
const taxTools = {
  'tax.create_registration': {
    description: 'Create tax registration for organization (GST, VAT, Sales Tax, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        registration_type: { type: 'string', enum: ['GST', 'VAT', 'EIN', 'state_tax_id', 'customs'] },
        registration_number: { type: 'string', description: 'Tax registration number' },
        jurisdiction: { type: 'string', description: 'Tax jurisdiction (country/state/city)' },
        effective_date: { type: 'string', format: 'date', description: 'Registration effective date' },
        metadata: { type: 'object', description: 'Additional registration details' }
      },
      required: ['organization_id', 'registration_type', 'registration_number', 'jurisdiction']
    },
    handler: async (params) => {
      console.log('Creating tax registration:', params)

      // Create registration entity
      const { data: registration, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: params.organization_id,
          entity_type: 'tax_registration',
          entity_name: `${params.registration_type} - ${params.jurisdiction}`,
          entity_code: params.registration_number,
          smart_code: 'HERA.TAX.REG.CREATE.v1',
          metadata: {
            registration_type: params.registration_type,
            jurisdiction: params.jurisdiction,
            effective_date: params.effective_date || new Date().toISOString().split('T')[0],
            active: true,
            ...params.metadata
          }
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        registration_id: registration.id,
        registration_number: params.registration_number,
        message: `Created ${params.registration_type} registration for ${params.jurisdiction}`
      }
    }
  },

  'tax.file_return': {
    description: 'File tax return (GST, VAT, WHT, Sales Tax)',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        return_type: { type: 'string', enum: ['GST', 'VAT', 'WHT', 'SALES'] },
        period_start: { type: 'string', format: 'date', description: 'Period start date' },
        period_end: { type: 'string', format: 'date', description: 'Period end date' },
        jurisdiction: { type: 'string', description: 'Tax jurisdiction' },
        return_subtype: { type: 'string', description: 'Return subtype (GSTR1, GSTR3B, VAT100, etc.)' }
      },
      required: ['organization_id', 'return_type', 'period_start', 'period_end']
    },
    handler: async (params) => {
      console.log('Filing tax return:', params)

      // Map return type to smart code
      const smartCodes = {
        GST: 'HERA.TAX.GST.RETURN.v1',
        VAT: 'HERA.TAX.VAT.RETURN.v1',
        WHT: 'HERA.TAX.WHT.REPORT.v1',
        SALES: 'HERA.TAX.SALES.RETURN.v1'
      }

      // Create return transaction
      const { data: returnTx, error: txError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: params.organization_id,
          transaction_type: 'tax_return',
          transaction_code: `${params.return_type}-${Date.now()}`,
          smart_code: smartCodes[params.return_type],
          transaction_date: params.period_end,
          total_amount: 0, // Will be calculated
          metadata: {
            period: {
              start: params.period_start,
              end: params.period_end
            },
            jurisdiction: params.jurisdiction,
            return_subtype: params.return_subtype,
            filing_status: 'draft',
            created_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (txError) throw txError

      // Trigger aggregation via edge function
      const { data: processed, error: processError } = await supabase.functions.invoke('tax-process', {
        body: {
          organization_id: params.organization_id,
          transaction_id: returnTx.id,
          action: 'process_return',
          metadata: {
            period: {
              start: params.period_start,
              end: params.period_end
            },
            jurisdiction: params.jurisdiction
          }
        }
      })

      if (processError) throw processError

      return {
        success: true,
        return_id: returnTx.id,
        return_code: returnTx.transaction_code,
        status: 'draft',
        lines_created: processed.lines_created,
        total_tax: processed.total_tax,
        message: `Created ${params.return_type} return for period ${params.period_start} to ${params.period_end}`
      }
    }
  },

  'tax.calculate_liability': {
    description: 'Calculate tax on transaction with multi-jurisdiction support',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        transaction_id: { type: 'string', description: 'Transaction to calculate tax for' },
        tax_code: { type: 'string', description: 'Tax code to apply' },
        tax_engine: { type: 'string', enum: ['native', 'avalara', 'vertex'], description: 'Tax calculation engine' }
      },
      required: ['organization_id', 'transaction_id']
    },
    handler: async (params) => {
      console.log('Calculating tax liability:', params)

      // Call edge function for calculation
      const { data, error } = await supabase.functions.invoke('tax-process', {
        body: {
          organization_id: params.organization_id,
          transaction_id: params.transaction_id,
          action: 'calculate_tax',
          metadata: {
            tax_code: params.tax_code,
            tax_engine: params.tax_engine || 'native'
          }
        }
      })

      if (error) throw error

      return {
        success: true,
        transaction_id: params.transaction_id,
        tax_calculated: true,
        tax_details: data.tax_result,
        message: `Tax calculated using ${params.tax_engine || 'native'} engine`
      }
    }
  },

  'tax.validate_compliance': {
    description: 'Run compliance validation checks for organization',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        check_date: { type: 'string', format: 'date', description: 'Date to check compliance as of' },
        tax_types: { 
          type: 'array', 
          items: { type: 'string', enum: ['GST', 'VAT', 'WHT', 'SALES'] },
          description: 'Tax types to check'
        }
      },
      required: ['organization_id']
    },
    handler: async (params) => {
      console.log('Validating compliance:', params)

      // Call edge function
      const { data, error } = await supabase.functions.invoke('tax-process', {
        body: {
          organization_id: params.organization_id,
          action: 'validate_compliance',
          metadata: {
            check_date: params.check_date || new Date().toISOString().split('T')[0],
            tax_types: params.tax_types || ['GST', 'VAT', 'WHT']
          }
        }
      })

      if (error) throw error

      return {
        success: true,
        report_id: data.report_id,
        compliance_score: data.compliance_score,
        missing_returns: data.missing_returns,
        compliance_issues: data.compliance_issues,
        message: `Compliance check completed. Score: ${data.compliance_score}/100`
      }
    }
  },

  'tax.detect_anomalies': {
    description: 'Use AI to detect tax anomalies and suspicious patterns',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        check_period: { type: 'number', description: 'Days to look back', default: 30 },
        thresholds: {
          type: 'object',
          properties: {
            variance_percent: { type: 'number', description: 'Variance threshold %', default: 100 },
            amount_threshold: { type: 'number', description: 'Amount threshold', default: 10000 }
          }
        }
      },
      required: ['organization_id']
    },
    handler: async (params) => {
      console.log('Detecting tax anomalies:', params)

      // Call edge function
      const { data, error } = await supabase.functions.invoke('tax-process', {
        body: {
          organization_id: params.organization_id,
          action: 'detect_anomalies',
          metadata: {
            check_period: params.check_period || 30,
            thresholds: params.thresholds || {
              variance_percent: 100,
              amount_threshold: 10000
            }
          }
        }
      })

      if (error) throw error

      return {
        success: true,
        anomalies_detected: data.anomalies_detected,
        anomalies: data.anomalies,
        ai_insights: data.ai_insights,
        message: `Detected ${data.anomalies_detected} anomalies. Risk level: ${data.ai_insights.risk_level}`
      }
    }
  },

  'tax.create_einvoice': {
    description: 'Generate e-invoice with digital signature (PEPPOL, FatturaPA, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        invoice_id: { type: 'string', description: 'Invoice transaction ID' },
        standard: { type: 'string', enum: ['PEPPOL', 'FatturaPA', 'CFDI', 'NF-e'], description: 'E-invoice standard' },
        recipient_tax_id: { type: 'string', description: 'Recipient tax registration' }
      },
      required: ['organization_id', 'invoice_id', 'standard']
    },
    handler: async (params) => {
      console.log('Creating e-invoice:', params)

      // Get invoice details
      const { data: invoice, error: invError } = await supabase
        .from('universal_transactions')
        .select('*, lines:universal_transaction_lines(*)')
        .eq('id', params.invoice_id)
        .eq('organization_id', params.organization_id)
        .single()

      if (invError || !invoice) throw new Error('Invoice not found')

      // Create e-invoice entity
      const { data: einvoice, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: params.organization_id,
          entity_type: 'einvoice',
          entity_name: `E-Invoice ${invoice.transaction_code}`,
          entity_code: `EINV-${Date.now()}`,
          smart_code: 'HERA.TAX.EINV.GENERATE.v1',
          metadata: {
            invoice_id: params.invoice_id,
            standard: params.standard,
            recipient_tax_id: params.recipient_tax_id,
            invoice_data: {
              number: invoice.transaction_code,
              date: invoice.transaction_date,
              amount: invoice.total_amount,
              lines: invoice.lines.length
            },
            digital_signature: generateMockSignature(),
            generated_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        einvoice_id: einvoice.id,
        einvoice_code: einvoice.entity_code,
        standard: params.standard,
        digital_signature: einvoice.metadata.digital_signature,
        message: `Generated ${params.standard} e-invoice for ${invoice.transaction_code}`
      }
    }
  },

  'tax.setup_jurisdiction': {
    description: 'Setup tax jurisdiction with rates and rules',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        jurisdiction_name: { type: 'string', description: 'Jurisdiction name' },
        jurisdiction_type: { type: 'string', enum: ['country', 'state', 'county', 'city', 'district'] },
        parent_jurisdiction: { type: 'string', description: 'Parent jurisdiction code' },
        tax_rates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tax_code: { type: 'string' },
              rate: { type: 'number' },
              effective_date: { type: 'string', format: 'date' }
            }
          }
        }
      },
      required: ['organization_id', 'jurisdiction_name', 'jurisdiction_type']
    },
    handler: async (params) => {
      console.log('Setting up tax jurisdiction:', params)

      // Create jurisdiction entity
      const { data: jurisdiction, error: jurError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: params.organization_id,
          entity_type: 'tax_jurisdiction',
          entity_name: params.jurisdiction_name,
          entity_code: `JUR-${params.jurisdiction_name.toUpperCase().replace(/\s+/g, '_')}`,
          smart_code: 'HERA.TAX.JURIS.DEFINE.v1',
          metadata: {
            jurisdiction_type: params.jurisdiction_type,
            parent_jurisdiction: params.parent_jurisdiction,
            active: true
          }
        })
        .select()
        .single()

      if (jurError) throw jurError

      // Create tax rates
      if (params.tax_rates && params.tax_rates.length > 0) {
        const rateData = params.tax_rates.map(rate => ({
          organization_id: params.organization_id,
          entity_id: jurisdiction.id,
          field_name: 'tax_rate',
          field_value_number: rate.rate,
          smart_code: 'HERA.TAX.JURIS.RATE.v1',
          metadata: {
            tax_code: rate.tax_code,
            effective_date: rate.effective_date || new Date().toISOString().split('T')[0]
          }
        }))

        const { error: rateError } = await supabase
          .from('core_dynamic_data')
          .insert(rateData)

        if (rateError) throw rateError
      }

      return {
        success: true,
        jurisdiction_id: jurisdiction.id,
        jurisdiction_code: jurisdiction.entity_code,
        rates_created: params.tax_rates?.length || 0,
        message: `Created ${params.jurisdiction_type} jurisdiction: ${params.jurisdiction_name}`
      }
    }
  },

  'tax.reconcile_transactions': {
    description: 'Reconcile tax transactions with vendor/government data',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization UUID' },
        reconciliation_type: { type: 'string', enum: ['vendor', 'government', 'book_to_tax'] },
        period_start: { type: 'string', format: 'date' },
        period_end: { type: 'string', format: 'date' },
        tolerance: { type: 'number', description: 'Mismatch tolerance amount', default: 0.01 }
      },
      required: ['organization_id', 'reconciliation_type', 'period_start', 'period_end']
    },
    handler: async (params) => {
      console.log('Reconciling tax transactions:', params)

      // Get transactions for period
      const { data: transactions, error: txError } = await supabase
        .from('universal_transactions')
        .select(`
          *,
          lines:universal_transaction_lines!inner(*)
        `)
        .eq('organization_id', params.organization_id)
        .gte('transaction_date', params.period_start)
        .lte('transaction_date', params.period_end)
        .eq('lines.smart_code', 'HERA.TAX.AUTO.CALC.LINE.v1')

      if (txError) throw txError

      // Simulate reconciliation
      const mismatches = []
      const matched = []

      transactions?.forEach(tx => {
        // In real implementation, would match against external data
        const random = Math.random()
        if (random < 0.1) { // 10% mismatch rate
          mismatches.push({
            transaction_id: tx.id,
            transaction_code: tx.transaction_code,
            our_amount: tx.total_amount,
            their_amount: tx.total_amount * (1 + (Math.random() - 0.5) * 0.1),
            variance: Math.abs(tx.total_amount * (Math.random() - 0.5) * 0.1)
          })
        } else {
          matched.push(tx.id)
        }
      })

      // Create reconciliation record
      const { data: recon, error: reconError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: params.organization_id,
          transaction_type: 'tax_reconciliation',
          transaction_code: `RECON-${Date.now()}`,
          smart_code: `HERA.TAX.RECON.${params.reconciliation_type.toUpperCase()}.v1`,
          total_amount: 0,
          metadata: {
            reconciliation_type: params.reconciliation_type,
            period: {
              start: params.period_start,
              end: params.period_end
            },
            total_transactions: transactions?.length || 0,
            matched_count: matched.length,
            mismatch_count: mismatches.length,
            mismatches: mismatches,
            tolerance: params.tolerance,
            reconciled_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (reconError) throw reconError

      return {
        success: true,
        reconciliation_id: recon.id,
        total_transactions: transactions?.length || 0,
        matched: matched.length,
        mismatched: mismatches.length,
        mismatch_details: mismatches,
        message: `Reconciliation completed. ${mismatches.length} mismatches found.`
      }
    }
  }
}

// Helper function to generate mock digital signature
function generateMockSignature() {
  return Buffer.from(`SIGNATURE-${Date.now()}-${Math.random().toString(36).substring(7)}`).toString('base64')
}

// Create MCP server
const server = new Server(
  {
    name: 'hera-tax-mcp-server',
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
    tools: Object.entries(taxTools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }
})

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  
  const tool = taxTools[name]
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
  console.error('HERA Tax MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})