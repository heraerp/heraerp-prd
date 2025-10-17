#!/usr/bin/env node

/**
 * HERA MCP Tax Tools Integration
 * Exposes Tax Report DNA functions as MCP tools for AI access
 * Smart Code: HERA.MCP.TAX.TOOLS.v1
 */

const {
  getTaxSummary,
  getTaxReturn,
  getTaxLiability,
  getTaxComplianceStatus,
  getTaxAnalytics,
  TAX_REPORT_DNA_CONFIG
} = require('./tax-report-dna-cli');

// MCP Tool Definitions
const MCP_TAX_TOOLS = {
  'get-tax-summary': {
    description: 'Get tax summary with output/input tax breakdown for a period',
    parameters: {
      organization_id: { type: 'string', required: true },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      jurisdiction: { type: 'string', enum: ['uae', 'usa', 'uk', 'india'], default: 'uae' },
      tax_type: { type: 'string', default: 'all' }
    },
    handler: async (params) => {
      return await getTaxSummary(params.organization_id, {
        startDate: params.start_date ? new Date(params.start_date) : undefined,
        endDate: params.end_date ? new Date(params.end_date) : undefined,
        jurisdiction: params.jurisdiction || 'uae',
        taxType: params.tax_type || 'all'
      });
    }
  },

  'generate-tax-return': {
    description: 'Generate tax return for filing with all required calculations',
    parameters: {
      organization_id: { type: 'string', required: true },
      tax_period: { type: 'string', required: true, example: '2025-01' },
      jurisdiction: { type: 'string', enum: ['uae', 'usa', 'uk', 'india'], default: 'uae' },
      return_type: { type: 'string', default: 'vat_return' }
    },
    handler: async (params) => {
      return await getTaxReturn(params.organization_id, {
        taxPeriod: params.tax_period,
        jurisdiction: params.jurisdiction || 'uae',
        returnType: params.return_type || 'vat_return'
      });
    }
  },

  'get-tax-liability': {
    description: 'Get current tax liability position with payment status',
    parameters: {
      organization_id: { type: 'string', required: true },
      as_of_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      include_projections: { type: 'boolean', default: true }
    },
    handler: async (params) => {
      return await getTaxLiability(params.organization_id, {
        asOfDate: params.as_of_date ? new Date(params.as_of_date) : undefined,
        includeProjections: params.include_projections !== false
      });
    }
  },

  'check-tax-compliance': {
    description: 'Check tax compliance status with filing and payment history',
    parameters: {
      organization_id: { type: 'string', required: true },
      check_periods: { type: 'number', default: 12 },
      jurisdiction: { type: 'string', enum: ['uae', 'usa', 'uk', 'india'], default: 'uae' }
    },
    handler: async (params) => {
      return await getTaxComplianceStatus(params.organization_id, {
        checkPeriods: params.check_periods || 12,
        jurisdiction: params.jurisdiction || 'uae'
      });
    }
  },

  'analyze-tax-performance': {
    description: 'Get tax analytics with trends and optimization opportunities',
    parameters: {
      organization_id: { type: 'string', required: true },
      period: { type: 'string', enum: ['ytd', 'mtd', 'qtd', 'custom'], default: 'ytd' },
      jurisdiction: { type: 'string', enum: ['uae', 'usa', 'uk', 'india'], default: 'uae' },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false }
    },
    handler: async (params) => {
      return await getTaxAnalytics(params.organization_id, {
        period: params.period || 'ytd',
        jurisdiction: params.jurisdiction || 'uae',
        startDate: params.start_date,
        endDate: params.end_date
      });
    }
  },

  'calculate-tax-estimate': {
    description: 'Calculate estimated tax liability for transactions or periods',
    parameters: {
      organization_id: { type: 'string', required: true },
      transaction_amount: { type: 'number', required: false },
      transaction_type: { type: 'string', enum: ['sale', 'purchase'], default: 'sale' },
      tax_category: { type: 'string', default: 'standard' },
      jurisdiction: { type: 'string', default: 'uae' }
    },
    handler: async (params) => {
      const config = TAX_REPORT_DNA_CONFIG.jurisdictions[params.jurisdiction || 'uae'];
      const category = config.tax_categories[params.tax_category || 'standard'];
      
      if (params.transaction_amount) {
        // Single transaction estimate
        const taxAmount = params.transaction_amount * (category.rate / 100);
        
        return {
          success: true,
          component: 'HERA.TAX.ESTIMATE.v1',
          timestamp: new Date().toISOString(),
          organization_id: params.organization_id,
          data: {
            transaction_amount: params.transaction_amount,
            tax_rate: category.rate,
            tax_amount: taxAmount,
            total_amount: params.transaction_amount + taxAmount,
            tax_category: category.name,
            jurisdiction: params.jurisdiction
          }
        };
      } else {
        // Period estimate based on current run rate
        const summary = await getTaxSummary(params.organization_id, {
          jurisdiction: params.jurisdiction
        });
        
        if (summary.success) {
          return {
            success: true,
            component: 'HERA.TAX.ESTIMATE.v1',
            timestamp: new Date().toISOString(),
            organization_id: params.organization_id,
            data: {
              current_month_estimate: summary.data.net_tax_position,
              quarterly_estimate: summary.data.net_tax_position * 3,
              annual_estimate: summary.data.net_tax_position * 12,
              based_on: 'current_month_run_rate'
            }
          };
        }
      }
    }
  },

  'get-tax-optimization': {
    description: 'Comprehensive tax optimization analysis with recommendations',
    parameters: {
      organization_id: { type: 'string', required: true },
      focus_area: { 
        type: 'string', 
        enum: ['input_tax_recovery', 'compliance', 'cash_flow', 'overall'], 
        default: 'overall' 
      },
      jurisdiction: { type: 'string', default: 'uae' }
    },
    handler: async (params) => {
      // Get comprehensive tax data
      const [summary, compliance, analytics] = await Promise.all([
        getTaxSummary(params.organization_id, { jurisdiction: params.jurisdiction }),
        getTaxComplianceStatus(params.organization_id, { jurisdiction: params.jurisdiction }),
        getTaxAnalytics(params.organization_id, { jurisdiction: params.jurisdiction })
      ]);

      const optimization = {
        success: true,
        component: 'HERA.TAX.OPTIMIZATION.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        focus_area: params.focus_area,
        current_position: {
          net_tax_liability: summary.data?.net_tax_position || 0,
          compliance_score: compliance.data?.compliance_score || 0,
          effective_tax_rate: analytics.data?.summary?.effective_tax_rate || 0,
          recovery_rate: analytics.data?.trends?.recovery_rate || 0
        },
        optimization_opportunities: []
      };

      // Input tax recovery opportunities
      if (params.focus_area === 'input_tax_recovery' || params.focus_area === 'overall') {
        if (summary.data?.input_tax) {
          const nonRecoverable = summary.data.input_tax.non_recoverable;
          if (nonRecoverable > 0) {
            optimization.optimization_opportunities.push({
              area: 'input_tax_recovery',
              opportunity: 'Non-recoverable input tax identified',
              current_loss: nonRecoverable,
              action_items: [
                'Review supplier VAT compliance',
                'Ensure proper tax invoices for all purchases',
                'Classify business vs non-business expenses correctly',
                'Consider restructuring non-business activities'
              ],
              potential_savings: nonRecoverable * 0.8
            });
          }
        }
      }

      // Compliance optimization
      if (params.focus_area === 'compliance' || params.focus_area === 'overall') {
        if (compliance.data?.compliance_score < 95) {
          optimization.optimization_opportunities.push({
            area: 'compliance_improvement',
            opportunity: 'Compliance gaps identified',
            current_score: compliance.data.compliance_score,
            action_items: [
              'Automate tax return preparation',
              'Implement filing reminders',
              'Regular reconciliation of tax accounts',
              'Staff training on tax compliance'
            ],
            benefits: 'Avoid penalties and interest charges'
          });
        }
      }

      // Cash flow optimization
      if (params.focus_area === 'cash_flow' || params.focus_area === 'overall') {
        optimization.optimization_opportunities.push({
          area: 'cash_flow_management',
          opportunity: 'Tax payment timing optimization',
          strategies: [
            'Align tax payments with cash inflows',
            'Utilize input tax credits promptly',
            'Consider voluntary disclosure for past errors',
            'Optimize inventory purchases for tax timing'
          ],
          estimated_benefit: 'Improved working capital management'
        });
      }

      // Add general recommendations
      optimization.best_practices = generateTaxBestPractices(params.jurisdiction);
      optimization.risk_areas = identifyTaxRisks(summary.data, compliance.data);

      return optimization;
    }
  },

  'validate-tax-invoice': {
    description: 'Validate tax invoice compliance and calculations',
    parameters: {
      organization_id: { type: 'string', required: true },
      invoice_data: {
        type: 'object',
        properties: {
          invoice_number: { type: 'string' },
          invoice_date: { type: 'string' },
          customer_trn: { type: 'string' },
          line_items: { type: 'array' },
          total_amount: { type: 'number' },
          tax_amount: { type: 'number' }
        }
      },
      jurisdiction: { type: 'string', default: 'uae' }
    },
    handler: async (params) => {
      const validation = {
        success: true,
        component: 'HERA.TAX.INVOICE.VALIDATION.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        validation_results: [],
        is_valid: true
      };

      const invoice = params.invoice_data;
      const config = TAX_REPORT_DNA_CONFIG.jurisdictions[params.jurisdiction || 'uae'];

      // Validate required fields
      if (!invoice.invoice_number) {
        validation.validation_results.push({
          field: 'invoice_number',
          status: 'error',
          message: 'Invoice number is required'
        });
        validation.is_valid = false;
      }

      // Validate tax calculations
      if (invoice.line_items && invoice.line_items.length > 0) {
        const calculatedTax = invoice.line_items.reduce((sum, item) => {
          const itemTax = (item.amount * (item.tax_rate || config.standard_rate)) / 100;
          return sum + itemTax;
        }, 0);

        if (Math.abs(calculatedTax - invoice.tax_amount) > 0.01) {
          validation.validation_results.push({
            field: 'tax_amount',
            status: 'warning',
            message: `Calculated tax (${calculatedTax.toFixed(2)}) differs from invoice tax (${invoice.tax_amount})`
          });
        }
      }

      // Jurisdiction-specific validation
      if (params.jurisdiction === 'uae' && invoice.total_amount >= 10000 && !invoice.customer_trn) {
        validation.validation_results.push({
          field: 'customer_trn',
          status: 'warning',
          message: 'Customer TRN recommended for invoices >= 10,000 AED'
        });
      }

      validation.summary = {
        total_checks: validation.validation_results.length,
        errors: validation.validation_results.filter(r => r.status === 'error').length,
        warnings: validation.validation_results.filter(r => r.status === 'warning').length
      };

      return validation;
    }
  }
};

// Helper functions
function generateTaxBestPractices(jurisdiction) {
  const practices = {
    uae: [
      'Maintain proper tax invoices for all transactions',
      'File VAT returns within 28 days of period end',
      'Ensure 5% VAT on standard rated supplies',
      'Keep records for 5 years minimum',
      'Register for VAT if revenue exceeds 375,000 AED'
    ],
    usa: [
      'Track nexus in all states where you do business',
      'Use automated sales tax calculation software',
      'File returns based on state requirements',
      'Maintain exemption certificates',
      'Monitor economic nexus thresholds'
    ],
    uk: [
      'Submit VAT returns via Making Tax Digital',
      'Keep digital records',
      'Apply correct VAT rates (20%, 5%, 0%)',
      'Issue valid tax invoices within 30 days',
      'Register if taxable supplies exceed £85,000'
    ],
    india: [
      'File GSTR-1 by 11th of following month',
      'File GSTR-3B by 20th of following month',
      'Match input credits with GSTR-2B',
      'Maintain HSN codes for all items',
      'Issue e-invoices for B2B transactions'
    ]
  };

  return practices[jurisdiction] || practices.uae;
}

function identifyTaxRisks(summaryData, complianceData) {
  const risks = [];

  if (summaryData?.input_tax?.non_recoverable > summaryData?.input_tax?.recoverable * 0.2) {
    risks.push({
      risk: 'high_non_recoverable_input_tax',
      severity: 'medium',
      description: 'Significant non-recoverable input tax detected',
      mitigation: 'Review expense categorization and supplier compliance'
    });
  }

  if (complianceData?.summary?.returns_overdue > 0) {
    risks.push({
      risk: 'overdue_returns',
      severity: 'high',
      description: `${complianceData.summary.returns_overdue} tax returns are overdue`,
      mitigation: 'File overdue returns immediately to minimize penalties'
    });
  }

  if (complianceData?.summary?.payments_overdue > 0) {
    risks.push({
      risk: 'overdue_payments',
      severity: 'critical',
      description: `${complianceData.summary.payments_overdue} tax payments are overdue`,
      mitigation: 'Make overdue payments to avoid interest and penalties'
    });
  }

  return risks;
}

// MCP Server Integration
async function handleMCPRequest(tool, params) {
  if (!MCP_TAX_TOOLS[tool]) {
    return {
      success: false,
      error: `Unknown tool: ${tool}`,
      available_tools: Object.keys(MCP_TAX_TOOLS)
    };
  }

  try {
    const result = await MCP_TAX_TOOLS[tool].handler(params);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      tool: tool,
      params: params
    };
  }
}

// Export for MCP server integration
module.exports = {
  MCP_TAX_TOOLS,
  handleMCPRequest,
  
  // Direct function exports for programmatic use
  tools: {
    getTaxSummary: MCP_TAX_TOOLS['get-tax-summary'].handler,
    generateTaxReturn: MCP_TAX_TOOLS['generate-tax-return'].handler,
    getTaxLiability: MCP_TAX_TOOLS['get-tax-liability'].handler,
    checkTaxCompliance: MCP_TAX_TOOLS['check-tax-compliance'].handler,
    analyzeTaxPerformance: MCP_TAX_TOOLS['analyze-tax-performance'].handler,
    calculateTaxEstimate: MCP_TAX_TOOLS['calculate-tax-estimate'].handler,
    getTaxOptimization: MCP_TAX_TOOLS['get-tax-optimization'].handler,
    validateTaxInvoice: MCP_TAX_TOOLS['validate-tax-invoice'].handler
  }
};

// CLI for testing MCP tools
if (require.main === module) {
  const tool = process.argv[2];
  const paramsJson = process.argv[3];

  if (!tool || !paramsJson) {
    console.log('Usage: node mcp-tax-tools.js <tool-name> \'{"param": "value"}\'');
    console.log('\nAvailable tools:');
    Object.entries(MCP_TAX_TOOLS).forEach(([name, config]) => {
      console.log(`  ${name}: ${config.description}`);
    });
    process.exit(1);
  }

  try {
    const params = JSON.parse(paramsJson);
    handleMCPRequest(tool, params).then(result => {
      console.log(JSON.stringify(result, null, 2));
    }).catch(error => {
      console.error('Error:', error.message);
    });
  } catch (error) {
    console.error('Invalid JSON parameters:', error.message);
  }
}