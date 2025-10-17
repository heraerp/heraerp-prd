#!/usr/bin/env node

// ================================================================================
// HERA UNIVERSAL TAX REPORT DNA CLI TOOL
// Command-line interface for Tax Analytics and Reporting
// Smart Code: HERA.TAX.REPORT.DNA.CLI.v1
// MCP-Enabled for direct integration with salon-manager and other MCP tools
// ================================================================================

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Command-line arguments
const command = process.argv[2];
const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

// Hair Talkz organizations for quick testing
const HAIR_TALKZ_ORGS = [
  {
    id: "e3a9ff9e-bb83-43a8-b062-b85e7a2b4258",
    code: "SALON-BR1",
    name: "Hair Talkz • Park Regis Kris Kin (Karama)"
  },
  {
    id: "0b1b37cd-4096-4718-8cd4-e370f234005b", 
    code: "SALON-BR2",
    name: "Hair Talkz • Mercure Gold (Al Mina Rd)"
  },
  {
    id: "849b6efe-2bf0-438f-9c70-01835ac2fe15",
    code: "SALON-GROUP", 
    name: "Salon Group"
  }
];

// ================================================================================
// TAX REPORT DNA CONFIGURATION
// ================================================================================

const TAX_REPORT_DNA_CONFIG = {
  // Universal DNA Component Definition
  component_id: 'HERA.TAX.REPORT.ENGINE.v1',
  component_name: 'Universal Tax Report Engine',
  version: '1.0.0',
  
  // Core capabilities
  capabilities: [
    'Multi-Jurisdiction Tax Compliance',
    'VAT/GST/Sales Tax Reporting',
    'Input/Output Tax Tracking',
    'Tax Period Management',
    'Automated Tax Calculations',
    'Tax Return Preparation',
    'Audit Trail Management',
    'Cross-Border Tax Handling',
    'Tax Rate Management',
    'MCP Integration for AI-Powered Compliance'
  ],
  
  // Jurisdiction configurations
  jurisdictions: {
    uae: {
      name: 'United Arab Emirates',
      tax_system: 'VAT',
      standard_rate: 5,
      registration_threshold: 375000, // AED annual revenue
      filing_frequency: {
        monthly: { threshold: 150000000 }, // AED annual revenue
        quarterly: { threshold: 0 } // Default
      },
      tax_categories: {
        'standard': { rate: 5, name: 'Standard Rate', code: 'SR' },
        'zero': { rate: 0, name: 'Zero Rate', code: 'ZR' },
        'exempt': { rate: 0, name: 'Exempt', code: 'EX' },
        'out_of_scope': { rate: 0, name: 'Out of Scope', code: 'OS' }
      },
      reporting_codes: {
        'BOX1': 'Standard rated supplies',
        'BOX2': 'Tax on standard rated supplies',
        'BOX3': 'Zero-rated supplies',
        'BOX4': 'Exempt supplies',
        'BOX5': 'Total value of purchases',
        'BOX6': 'Input tax recoverable',
        'BOX7': 'Input tax on capital assets',
        'BOX8': 'Tax adjustments',
        'BOX9': 'Total tax due'
      },
      smart_codes: {
        output_tax: 'HERA.TAX.UAE.VAT.OUTPUT.v1',
        input_tax: 'HERA.TAX.UAE.VAT.INPUT.v1',
        return_filing: 'HERA.TAX.UAE.VAT.RETURN.v1'
      }
    },
    
    usa: {
      name: 'United States',
      tax_system: 'Sales Tax',
      standard_rate: null, // Varies by state
      multi_state: true,
      tax_categories: {
        'taxable': { rate: null, name: 'Taxable', code: 'TX' },
        'exempt': { rate: 0, name: 'Exempt', code: 'EX' },
        'resale': { rate: 0, name: 'Resale', code: 'RS' }
      },
      state_rates: {
        'NY': { state_rate: 4, average_local: 4.52 },
        'CA': { state_rate: 7.25, average_local: 1.43 },
        'TX': { state_rate: 6.25, average_local: 1.94 },
        'FL': { state_rate: 6, average_local: 1.05 }
      },
      nexus_rules: {
        physical_presence: true,
        economic_nexus: { sales_threshold: 100000, transaction_threshold: 200 }
      },
      smart_codes: {
        sales_tax: 'HERA.TAX.USA.SALES.TAX.v1',
        nexus_tracking: 'HERA.TAX.USA.NEXUS.v1'
      }
    },
    
    uk: {
      name: 'United Kingdom',
      tax_system: 'VAT',
      standard_rate: 20,
      registration_threshold: 85000, // GBP
      tax_categories: {
        'standard': { rate: 20, name: 'Standard Rate', code: 'SR' },
        'reduced': { rate: 5, name: 'Reduced Rate', code: 'RR' },
        'zero': { rate: 0, name: 'Zero Rate', code: 'ZR' },
        'exempt': { rate: 0, name: 'Exempt', code: 'EX' }
      },
      mtd_compliant: true, // Making Tax Digital
      smart_codes: {
        vat_return: 'HERA.TAX.UK.VAT.RETURN.v1',
        mtd_submission: 'HERA.TAX.UK.MTD.v1'
      }
    },
    
    india: {
      name: 'India',
      tax_system: 'GST',
      registration_threshold: 4000000, // INR for services
      tax_categories: {
        'cgst_sgst': { rate: 18, name: 'CGST + SGST', code: 'CS' },
        'igst': { rate: 18, name: 'IGST', code: 'IG' },
        'exempt': { rate: 0, name: 'Exempt', code: 'EX' }
      },
      gst_rates: {
        services: [0, 5, 12, 18, 28],
        goods: [0, 5, 12, 18, 28]
      },
      return_types: ['GSTR-1', 'GSTR-3B', 'GSTR-9'],
      smart_codes: {
        gst_output: 'HERA.TAX.IND.GST.OUTPUT.v1',
        gst_input: 'HERA.TAX.IND.GST.INPUT.v1',
        gst_return: 'HERA.TAX.IND.GST.RETURN.v1'
      }
    }
  }
};

// ================================================================================
// CORE TAX ANALYTICS FUNCTIONS
// ================================================================================

async function getTaxSummary(organizationId, options = {}) {
  try {
    const {
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate = new Date(),
      jurisdiction = 'uae',
      taxType = 'all'
    } = options;

    // Get all transactions for the period
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines!inner(*),
        from_entity:core_entities!from_entity_id(entity_name, entity_type),
        to_entity:core_entities!to_entity_id(entity_name, entity_type)
      `)
      .eq('organization_id', organizationId)
      .in('transaction_type', ['sale', 'purchase', 'expense', 'journal_entry'])
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString())
      .order('transaction_date');

    if (error) throw error;

    // Get tax configuration
    const taxConfig = TAX_REPORT_DNA_CONFIG.jurisdictions[jurisdiction];
    
    // Initialize tax summary
    const taxSummary = {
      jurisdiction: jurisdiction,
      tax_system: taxConfig.tax_system,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      output_tax: {
        taxable_supplies: 0,
        tax_amount: 0,
        zero_rated: 0,
        exempt: 0,
        transactions: []
      },
      input_tax: {
        taxable_purchases: 0,
        tax_amount: 0,
        recoverable: 0,
        non_recoverable: 0,
        capital_goods: 0,
        transactions: []
      },
      net_tax_position: 0,
      tax_by_rate: {},
      tax_by_category: {}
    };

    // Initialize rate categories
    Object.entries(taxConfig.tax_categories).forEach(([key, category]) => {
      taxSummary.tax_by_rate[category.code] = {
        name: category.name,
        rate: category.rate,
        taxable_amount: 0,
        tax_amount: 0,
        transaction_count: 0
      };
    });

    // Process transactions
    transactions?.forEach(txn => {
      const isSale = txn.transaction_type === 'sale';
      const isPurchase = ['purchase', 'expense'].includes(txn.transaction_type);
      
      txn.universal_transaction_lines?.forEach(line => {
        // Extract tax data from metadata
        const taxRate = line.metadata?.tax_rate || 0;
        const taxAmount = line.metadata?.tax_amount || 0;
        const taxCategory = line.metadata?.tax_category || 'standard';
        const isCapitalGood = line.metadata?.is_capital_good || false;
        
        if (isSale) {
          // Output tax
          taxSummary.output_tax.taxable_supplies += line.line_amount || 0;
          taxSummary.output_tax.tax_amount += taxAmount;
          
          if (taxRate === 0 && taxCategory === 'zero') {
            taxSummary.output_tax.zero_rated += line.line_amount || 0;
          } else if (taxCategory === 'exempt') {
            taxSummary.output_tax.exempt += line.line_amount || 0;
          }
          
          taxSummary.output_tax.transactions.push({
            date: txn.transaction_date,
            reference: txn.transaction_code,
            customer: txn.to_entity?.entity_name,
            amount: line.line_amount,
            tax_amount: taxAmount,
            tax_rate: taxRate
          });
        } else if (isPurchase) {
          // Input tax
          taxSummary.input_tax.taxable_purchases += line.line_amount || 0;
          taxSummary.input_tax.tax_amount += taxAmount;
          
          // Check if recoverable
          const isRecoverable = line.metadata?.tax_recoverable !== false;
          if (isRecoverable) {
            taxSummary.input_tax.recoverable += taxAmount;
          } else {
            taxSummary.input_tax.non_recoverable += taxAmount;
          }
          
          if (isCapitalGood) {
            taxSummary.input_tax.capital_goods += taxAmount;
          }
          
          taxSummary.input_tax.transactions.push({
            date: txn.transaction_date,
            reference: txn.transaction_code,
            vendor: txn.to_entity?.entity_name,
            amount: line.line_amount,
            tax_amount: taxAmount,
            tax_rate: taxRate,
            recoverable: isRecoverable
          });
        }
        
        // Update tax by rate
        const rateCategory = Object.values(taxConfig.tax_categories).find(cat => cat.rate === taxRate);
        if (rateCategory) {
          taxSummary.tax_by_rate[rateCategory.code].taxable_amount += line.line_amount || 0;
          taxSummary.tax_by_rate[rateCategory.code].tax_amount += taxAmount;
          taxSummary.tax_by_rate[rateCategory.code].transaction_count++;
        }
      });
    });

    // Calculate net position
    taxSummary.net_tax_position = taxSummary.output_tax.tax_amount - taxSummary.input_tax.recoverable;

    return createMCPResponse({
      success: true,
      component: 'HERA.TAX.SUMMARY.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: taxSummary
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.TAX.SUMMARY.v1'
    });
  }
}

async function getTaxReturn(organizationId, options = {}) {
  try {
    const {
      taxPeriod,
      jurisdiction = 'uae',
      returnType = 'vat_return'
    } = options;

    // Determine period dates based on filing frequency
    const periodDates = determineTaxPeriod(taxPeriod, jurisdiction);
    
    // Get tax summary for the period
    const summaryResult = await getTaxSummary(organizationId, {
      startDate: periodDates.start,
      endDate: periodDates.end,
      jurisdiction
    });

    if (!summaryResult.success) throw new Error('Failed to get tax summary');

    const taxData = summaryResult.data;
    const taxConfig = TAX_REPORT_DNA_CONFIG.jurisdictions[jurisdiction];
    
    // Build tax return based on jurisdiction
    let taxReturn = {
      jurisdiction: jurisdiction,
      return_type: returnType,
      tax_period: taxPeriod,
      period_dates: periodDates,
      filing_deadline: calculateFilingDeadline(periodDates.end, jurisdiction),
      return_status: 'draft',
      boxes: {}
    };

    if (jurisdiction === 'uae') {
      // UAE VAT Return format
      taxReturn.boxes = {
        BOX1: {
          description: taxConfig.reporting_codes.BOX1,
          amount: taxData.output_tax.taxable_supplies,
          editable: false
        },
        BOX2: {
          description: taxConfig.reporting_codes.BOX2,
          amount: taxData.output_tax.tax_amount,
          editable: false
        },
        BOX3: {
          description: taxConfig.reporting_codes.BOX3,
          amount: taxData.output_tax.zero_rated,
          editable: false
        },
        BOX4: {
          description: taxConfig.reporting_codes.BOX4,
          amount: taxData.output_tax.exempt,
          editable: false
        },
        BOX5: {
          description: taxConfig.reporting_codes.BOX5,
          amount: taxData.input_tax.taxable_purchases,
          editable: false
        },
        BOX6: {
          description: taxConfig.reporting_codes.BOX6,
          amount: taxData.input_tax.recoverable,
          editable: false
        },
        BOX7: {
          description: taxConfig.reporting_codes.BOX7,
          amount: taxData.input_tax.capital_goods,
          editable: false
        },
        BOX8: {
          description: taxConfig.reporting_codes.BOX8,
          amount: 0, // Tax adjustments
          editable: true
        },
        BOX9: {
          description: taxConfig.reporting_codes.BOX9,
          amount: taxData.net_tax_position,
          editable: false
        }
      };
      
      // Add summary calculations
      taxReturn.summary = {
        total_output_tax: taxReturn.boxes.BOX2.amount,
        total_input_tax: taxReturn.boxes.BOX6.amount,
        net_tax_payable: taxReturn.boxes.BOX9.amount,
        payment_due_date: calculatePaymentDueDate(periodDates.end, jurisdiction)
      };
    } else if (jurisdiction === 'india') {
      // GST Return format
      taxReturn = buildGSTReturn(taxData, returnType);
    }

    // Add compliance checks
    taxReturn.compliance_checks = performComplianceChecks(taxReturn, jurisdiction);
    
    return createMCPResponse({
      success: true,
      component: 'HERA.TAX.RETURN.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: taxReturn
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.TAX.RETURN.v1'
    });
  }
}

async function getTaxLiability(organizationId, options = {}) {
  try {
    const {
      asOfDate = new Date(),
      includeProjections = true
    } = options;

    // Get current period tax position
    const currentPeriod = getCurrentTaxPeriod(asOfDate);
    const summaryResult = await getTaxSummary(organizationId, {
      startDate: currentPeriod.start,
      endDate: asOfDate
    });

    if (!summaryResult.success) throw new Error('Failed to get tax summary');

    const currentTax = summaryResult.data;
    
    // Get historical tax payments
    const { data: taxPayments, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'payment')
      .eq('metadata->>payment_type', 'tax_payment')
      .gte('transaction_date', currentPeriod.start.toISOString())
      .lte('transaction_date', asOfDate.toISOString());

    if (error) throw error;

    // Calculate liability
    const paidAmount = taxPayments?.reduce((sum, payment) => sum + (payment.total_amount || 0), 0) || 0;
    const currentLiability = currentTax.net_tax_position - paidAmount;
    
    // Calculate projections if requested
    let projections = null;
    if (includeProjections) {
      projections = calculateTaxProjections(currentTax, asOfDate, currentPeriod.end);
    }

    const taxLiability = {
      as_of_date: asOfDate.toISOString().split('T')[0],
      current_period: {
        start: currentPeriod.start.toISOString().split('T')[0],
        end: currentPeriod.end.toISOString().split('T')[0]
      },
      tax_summary: {
        output_tax_collected: currentTax.output_tax.tax_amount,
        input_tax_paid: currentTax.input_tax.tax_amount,
        recoverable_input_tax: currentTax.input_tax.recoverable,
        net_tax_position: currentTax.net_tax_position
      },
      payments_made: paidAmount,
      current_liability: currentLiability,
      payment_status: currentLiability > 0 ? 'payable' : currentLiability < 0 ? 'refundable' : 'nil',
      due_date: calculatePaymentDueDate(currentPeriod.end),
      projections: projections,
      compliance_status: {
        registration_valid: true, // Would check actual registration
        returns_filed: true, // Would check filing history
        payments_current: paidAmount >= currentTax.net_tax_position
      }
    };

    return createMCPResponse({
      success: true,
      component: 'HERA.TAX.LIABILITY.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: taxLiability
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.TAX.LIABILITY.v1'
    });
  }
}

async function getTaxComplianceStatus(organizationId, options = {}) {
  try {
    const {
      checkPeriods = 12, // months
      jurisdiction = 'uae'
    } = options;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - checkPeriods);

    // Get filing history
    const { data: filings, error: filingsError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'tax_return')
      .gte('created_at', startDate.toISOString());

    if (filingsError) throw filingsError;

    // Get tax payments
    const { data: payments, error: paymentsError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'payment')
      .eq('metadata->>payment_type', 'tax_payment')
      .gte('transaction_date', startDate.toISOString());

    if (paymentsError) throw paymentsError;

    // Build compliance timeline
    const complianceTimeline = [];
    const taxConfig = TAX_REPORT_DNA_CONFIG.jurisdictions[jurisdiction];
    
    // Generate expected filing periods
    const expectedPeriods = generateExpectedPeriods(startDate, endDate, jurisdiction);
    
    expectedPeriods.forEach(period => {
      const filing = filings?.find(f => {
        const filingPeriod = f.core_dynamic_data?.find(d => d.field_name === 'tax_period')?.field_value_text;
        return filingPeriod === period.period_code;
      });
      
      const payment = payments?.find(p => {
        const paymentPeriod = p.metadata?.tax_period;
        return paymentPeriod === period.period_code;
      });
      
      complianceTimeline.push({
        period: period.period_code,
        period_dates: period,
        filing_status: filing ? 'filed' : isOverdue(period.filing_deadline) ? 'overdue' : 'pending',
        filing_date: filing?.created_at,
        payment_status: payment ? 'paid' : isOverdue(period.payment_deadline) ? 'overdue' : 'pending',
        payment_date: payment?.transaction_date,
        payment_amount: payment?.total_amount || 0
      });
    });

    // Calculate compliance score
    const totalPeriods = complianceTimeline.length;
    const filedOnTime = complianceTimeline.filter(p => p.filing_status === 'filed').length;
    const paidOnTime = complianceTimeline.filter(p => p.payment_status === 'paid').length;
    const complianceScore = ((filedOnTime + paidOnTime) / (totalPeriods * 2)) * 100;

    // Identify issues
    const complianceIssues = [];
    complianceTimeline.forEach(period => {
      if (period.filing_status === 'overdue') {
        complianceIssues.push({
          type: 'filing_overdue',
          period: period.period,
          severity: 'high',
          action_required: `File ${jurisdiction.toUpperCase()} tax return for ${period.period}`
        });
      }
      if (period.payment_status === 'overdue') {
        complianceIssues.push({
          type: 'payment_overdue',
          period: period.period,
          severity: 'critical',
          action_required: `Pay outstanding tax for ${period.period}`
        });
      }
    });

    const complianceStatus = {
      jurisdiction: jurisdiction,
      check_period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        months: checkPeriods
      },
      compliance_score: complianceScore,
      compliance_rating: complianceScore >= 95 ? 'excellent' : 
                        complianceScore >= 80 ? 'good' : 
                        complianceScore >= 60 ? 'fair' : 'poor',
      summary: {
        total_periods: totalPeriods,
        returns_filed: filedOnTime,
        returns_pending: complianceTimeline.filter(p => p.filing_status === 'pending').length,
        returns_overdue: complianceTimeline.filter(p => p.filing_status === 'overdue').length,
        payments_made: paidOnTime,
        payments_pending: complianceTimeline.filter(p => p.payment_status === 'pending').length,
        payments_overdue: complianceTimeline.filter(p => p.payment_status === 'overdue').length
      },
      timeline: complianceTimeline,
      issues: complianceIssues,
      next_actions: generateNextActions(complianceTimeline, jurisdiction)
    };

    return createMCPResponse({
      success: true,
      component: 'HERA.TAX.COMPLIANCE.STATUS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: complianceStatus
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.TAX.COMPLIANCE.STATUS.v1'
    });
  }
}

async function getTaxAnalytics(organizationId, options = {}) {
  try {
    const {
      period = 'ytd', // ytd, mtd, qtd, custom
      startDate,
      endDate,
      jurisdiction = 'uae'
    } = options;

    // Determine date range
    const dates = determineDateRange(period, startDate, endDate);
    
    // Get tax data for current period
    const currentResult = await getTaxSummary(organizationId, {
      startDate: dates.current.start,
      endDate: dates.current.end,
      jurisdiction
    });

    // Get tax data for comparison period
    const priorResult = await getTaxSummary(organizationId, {
      startDate: dates.prior.start,
      endDate: dates.prior.end,
      jurisdiction
    });

    if (!currentResult.success || !priorResult.success) {
      throw new Error('Failed to get tax data');
    }

    const current = currentResult.data;
    const prior = priorResult.data;
    
    // Calculate analytics
    const analytics = {
      period: period,
      date_range: {
        current: dates.current,
        prior: dates.prior
      },
      summary: {
        total_output_tax: current.output_tax.tax_amount,
        total_input_tax: current.input_tax.tax_amount,
        net_tax_position: current.net_tax_position,
        effective_tax_rate: current.output_tax.taxable_supplies > 0 
          ? (current.output_tax.tax_amount / current.output_tax.taxable_supplies) * 100 
          : 0
      },
      comparisons: {
        output_tax_change: calculateChange(current.output_tax.tax_amount, prior.output_tax.tax_amount),
        input_tax_change: calculateChange(current.input_tax.tax_amount, prior.input_tax.tax_amount),
        net_position_change: calculateChange(current.net_tax_position, prior.net_tax_position),
        taxable_supplies_change: calculateChange(current.output_tax.taxable_supplies, prior.output_tax.taxable_supplies)
      },
      trends: {
        output_tax_trend: current.output_tax.tax_amount > prior.output_tax.tax_amount ? 'increasing' : 'decreasing',
        input_tax_trend: current.input_tax.tax_amount > prior.input_tax.tax_amount ? 'increasing' : 'decreasing',
        recovery_rate: current.input_tax.tax_amount > 0 
          ? (current.input_tax.recoverable / current.input_tax.tax_amount) * 100 
          : 0
      },
      by_category: current.tax_by_rate,
      insights: generateTaxInsights(current, prior),
      optimization_opportunities: identifyTaxOptimizations(current)
    };

    return createMCPResponse({
      success: true,
      component: 'HERA.TAX.ANALYTICS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: analytics
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.TAX.ANALYTICS.v1'
    });
  }
}

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

function createMCPResponse(data) {
  return {
    ...data,
    mcp_compatible: true,
    api_version: '1.0.0'
  };
}

function determineTaxPeriod(periodCode, jurisdiction) {
  // Parse period code (e.g., "2025-Q1", "2025-01")
  const year = parseInt(periodCode.substring(0, 4));
  
  if (periodCode.includes('Q')) {
    // Quarterly
    const quarter = parseInt(periodCode.substring(6));
    const startMonth = (quarter - 1) * 3;
    return {
      start: new Date(year, startMonth, 1),
      end: new Date(year, startMonth + 3, 0)
    };
  } else {
    // Monthly
    const month = parseInt(periodCode.substring(5)) - 1;
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0)
    };
  }
}

function calculateFilingDeadline(periodEnd, jurisdiction) {
  const deadline = new Date(periodEnd);
  
  if (jurisdiction === 'uae') {
    // UAE: 28 days after period end
    deadline.setDate(deadline.getDate() + 28);
  } else if (jurisdiction === 'india') {
    // India GST: Different for different returns
    deadline.setDate(deadline.getDate() + 11); // GSTR-1
  }
  
  return deadline.toISOString().split('T')[0];
}

function calculatePaymentDueDate(periodEnd, jurisdiction) {
  // Usually same as filing deadline
  return calculateFilingDeadline(periodEnd, jurisdiction);
}

function getCurrentTaxPeriod(date) {
  // Assume monthly periods for simplicity
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

function calculateTaxProjections(currentTax, asOfDate, periodEnd) {
  const daysInPeriod = Math.ceil((periodEnd - new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1)) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((asOfDate - new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 1)) / (1000 * 60 * 60 * 24));
  const projectionFactor = daysInPeriod / daysElapsed;
  
  return {
    projected_output_tax: currentTax.output_tax.tax_amount * projectionFactor,
    projected_input_tax: currentTax.input_tax.recoverable * projectionFactor,
    projected_net_position: currentTax.net_tax_position * projectionFactor,
    confidence: daysElapsed >= 15 ? 'high' : daysElapsed >= 7 ? 'medium' : 'low'
  };
}

function generateExpectedPeriods(startDate, endDate, jurisdiction) {
  const periods = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const periodStart = new Date(current.getFullYear(), current.getMonth(), 1);
    const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    
    periods.push({
      period_code: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
      start: periodStart,
      end: periodEnd,
      filing_deadline: calculateFilingDeadline(periodEnd, jurisdiction),
      payment_deadline: calculatePaymentDueDate(periodEnd, jurisdiction)
    });
    
    current.setMonth(current.getMonth() + 1);
  }
  
  return periods;
}

function isOverdue(deadline) {
  return new Date(deadline) < new Date();
}

function performComplianceChecks(taxReturn, jurisdiction) {
  const checks = [];
  
  // Basic validation checks
  if (taxReturn.boxes.BOX2 && taxReturn.boxes.BOX1) {
    const impliedRate = (taxReturn.boxes.BOX2.amount / taxReturn.boxes.BOX1.amount) * 100;
    if (Math.abs(impliedRate - 5) > 0.1) {
      checks.push({
        type: 'rate_validation',
        severity: 'warning',
        message: `Implied tax rate ${impliedRate.toFixed(2)}% differs from standard 5%`
      });
    }
  }
  
  if (taxReturn.boxes.BOX6 && taxReturn.boxes.BOX5) {
    const recoveryRate = (taxReturn.boxes.BOX6.amount / (taxReturn.boxes.BOX5.amount * 0.05)) * 100;
    if (recoveryRate > 100) {
      checks.push({
        type: 'recovery_validation',
        severity: 'error',
        message: 'Input tax recovery exceeds total input tax'
      });
    }
  }
  
  return checks;
}

function buildGSTReturn(taxData, returnType) {
  // Simplified GST return structure
  return {
    return_type: returnType,
    outward_supplies: {
      b2b: taxData.output_tax.taxable_supplies,
      b2c: 0,
      exports: taxData.output_tax.zero_rated
    },
    inward_supplies: {
      purchases: taxData.input_tax.taxable_purchases,
      imports: 0
    },
    tax_computation: {
      output_tax: taxData.output_tax.tax_amount,
      input_tax_credit: taxData.input_tax.recoverable,
      net_payable: taxData.net_tax_position
    }
  };
}

function generateNextActions(timeline, jurisdiction) {
  const actions = [];
  const upcoming = timeline.filter(p => p.filing_status === 'pending' || p.payment_status === 'pending');
  
  upcoming.slice(0, 3).forEach(period => {
    if (period.filing_status === 'pending') {
      actions.push({
        action: 'File tax return',
        period: period.period,
        deadline: period.period_dates.filing_deadline,
        priority: isWithinDays(period.period_dates.filing_deadline, 7) ? 'high' : 'medium'
      });
    }
    if (period.payment_status === 'pending') {
      actions.push({
        action: 'Pay tax liability',
        period: period.period,
        deadline: period.period_dates.payment_deadline,
        priority: isWithinDays(period.period_dates.payment_deadline, 7) ? 'high' : 'medium'
      });
    }
  });
  
  return actions;
}

function isWithinDays(date, days) {
  const target = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays >= 0;
}

function determineDateRange(period, startDate, endDate) {
  const now = new Date();
  let dates = { current: {}, prior: {} };
  
  switch (period) {
    case 'ytd':
      dates.current.start = new Date(now.getFullYear(), 0, 1);
      dates.current.end = now;
      dates.prior.start = new Date(now.getFullYear() - 1, 0, 1);
      dates.prior.end = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case 'mtd':
      dates.current.start = new Date(now.getFullYear(), now.getMonth(), 1);
      dates.current.end = now;
      dates.prior.start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dates.prior.end = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case 'qtd':
      const quarter = Math.floor(now.getMonth() / 3);
      dates.current.start = new Date(now.getFullYear(), quarter * 3, 1);
      dates.current.end = now;
      dates.prior.start = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
      dates.prior.end = new Date(now.getFullYear(), quarter * 3, 0);
      break;
    case 'custom':
      dates.current.start = new Date(startDate);
      dates.current.end = new Date(endDate);
      // Prior period same duration before
      const duration = dates.current.end - dates.current.start;
      dates.prior.end = new Date(dates.current.start - 1);
      dates.prior.start = new Date(dates.prior.end - duration);
      break;
  }
  
  return dates;
}

function calculateChange(current, prior) {
  if (prior === 0) return current > 0 ? 100 : 0;
  return ((current - prior) / prior) * 100;
}

function generateTaxInsights(current, prior) {
  const insights = [];
  
  // Tax rate effectiveness
  const currentRate = current.output_tax.taxable_supplies > 0 
    ? (current.output_tax.tax_amount / current.output_tax.taxable_supplies) * 100 
    : 0;
  
  if (currentRate < 4.8) {
    insights.push('Effective tax rate below standard - review zero-rated classification');
  }
  
  // Recovery rate
  const recoveryRate = current.input_tax.tax_amount > 0 
    ? (current.input_tax.recoverable / current.input_tax.tax_amount) * 100 
    : 0;
  
  if (recoveryRate < 90) {
    insights.push(`Only ${recoveryRate.toFixed(1)}% of input tax is recoverable - review non-recoverable items`);
  }
  
  // Growth trends
  const revenueGrowth = calculateChange(current.output_tax.taxable_supplies, prior.output_tax.taxable_supplies);
  if (revenueGrowth > 20) {
    insights.push(`Strong revenue growth of ${revenueGrowth.toFixed(1)}% - ensure tax compliance scales accordingly`);
  }
  
  return insights;
}

function identifyTaxOptimizations(taxData) {
  const optimizations = [];
  
  // Input tax optimization
  if (taxData.input_tax.non_recoverable > taxData.input_tax.recoverable * 0.1) {
    optimizations.push({
      area: 'input_tax_recovery',
      opportunity: 'High non-recoverable input tax',
      action: 'Review purchase categories and vendor tax compliance',
      potential_benefit: taxData.input_tax.non_recoverable
    });
  }
  
  // Zero-rating opportunities
  if (taxData.output_tax.zero_rated < taxData.output_tax.taxable_supplies * 0.1) {
    optimizations.push({
      area: 'zero_rating',
      opportunity: 'Limited zero-rated supplies',
      action: 'Explore export opportunities or qualifying services',
      potential_benefit: 'Competitive advantage'
    });
  }
  
  return optimizations;
}

// ================================================================================
// CLI INTERFACE
// ================================================================================

async function showHelp() {
  console.log(`
🧬 HERA UNIVERSAL TAX REPORT DNA CLI TOOL
==========================================

Multi-jurisdiction tax compliance and reporting for any business.

USAGE:
  node tax-report-dna-cli.js <command> [options]

COMMANDS:
  summary               Get tax summary for a period
    --start <date>       Start date (YYYY-MM-DD)
    --end <date>         End date (YYYY-MM-DD)
    --jurisdiction <j>   Tax jurisdiction (uae|usa|uk|india)

  return                Generate tax return
    --period <code>      Tax period (e.g., 2025-01, 2025-Q1)
    --jurisdiction <j>   Tax jurisdiction
    --type <type>        Return type

  liability             Current tax liability position
    --date <date>        As of date
    --project            Include projections

  compliance            Tax compliance status check
    --months <n>         Months to check (default: 12)
    --jurisdiction <j>   Tax jurisdiction

  analytics             Tax analytics and trends
    --period <p>         ytd|mtd|qtd|custom
    --jurisdiction <j>   Tax jurisdiction

  rates                 View tax rates by jurisdiction
    --jurisdiction <j>   Tax jurisdiction

  hair-talkz            Run complete analysis for Hair Talkz orgs

  help                  Show this help message

EXAMPLES:
  node tax-report-dna-cli.js summary --start 2025-01-01 --end 2025-01-31
  node tax-report-dna-cli.js return --period 2025-01 --jurisdiction uae
  node tax-report-dna-cli.js liability --project
  node tax-report-dna-cli.js compliance --months 12
  node tax-report-dna-cli.js hair-talkz

ENVIRONMENT VARIABLES:
  DEFAULT_ORGANIZATION_ID   Your organization UUID
  SUPABASE_URL             Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Your Supabase service role key

SMART CODE: HERA.TAX.REPORT.DNA.CLI.v1

🔧 MCP Integration Ready - Use with salon-manager for AI-powered compliance
`);
}

// ================================================================================
// MAIN EXECUTION
// ================================================================================

async function main() {
  console.log('🧬 HERA Universal Tax Report DNA CLI Tool\n');

  if (!organizationId && command !== 'help' && command !== 'hair-talkz' && command !== 'rates') {
    console.error('❌ DEFAULT_ORGANIZATION_ID not set in environment');
    console.log('   Set it in your .env file or use --org flag');
    return;
  }

  switch (command) {
    case 'summary':
      const sumStartIdx = process.argv.indexOf('--start');
      const sumEndIdx = process.argv.indexOf('--end');
      const sumJurIdx = process.argv.indexOf('--jurisdiction');
      
      const sumStart = sumStartIdx > -1 ? new Date(process.argv[sumStartIdx + 1]) : undefined;
      const sumEnd = sumEndIdx > -1 ? new Date(process.argv[sumEndIdx + 1]) : undefined;
      const sumJur = sumJurIdx > -1 ? process.argv[sumJurIdx + 1] : 'uae';
      
      const summaryResult = await getTaxSummary(organizationId, {
        startDate: sumStart,
        endDate: sumEnd,
        jurisdiction: sumJur
      });
      console.log(JSON.stringify(summaryResult, null, 2));
      break;

    case 'return':
      const retPeriodIdx = process.argv.indexOf('--period');
      const retJurIdx = process.argv.indexOf('--jurisdiction');
      const retTypeIdx = process.argv.indexOf('--type');
      
      const retPeriod = retPeriodIdx > -1 ? process.argv[retPeriodIdx + 1] : null;
      const retJur = retJurIdx > -1 ? process.argv[retJurIdx + 1] : 'uae';
      const retType = retTypeIdx > -1 ? process.argv[retTypeIdx + 1] : 'vat_return';
      
      if (!retPeriod) {
        console.error('❌ Tax period required (e.g., 2025-01)');
        return;
      }
      
      const returnResult = await getTaxReturn(organizationId, {
        taxPeriod: retPeriod,
        jurisdiction: retJur,
        returnType: retType
      });
      console.log(JSON.stringify(returnResult, null, 2));
      break;

    case 'liability':
      const liabDateIdx = process.argv.indexOf('--date');
      const liabProject = process.argv.includes('--project');
      
      const liabDate = liabDateIdx > -1 ? new Date(process.argv[liabDateIdx + 1]) : undefined;
      
      const liabilityResult = await getTaxLiability(organizationId, {
        asOfDate: liabDate,
        includeProjections: liabProject
      });
      console.log(JSON.stringify(liabilityResult, null, 2));
      break;

    case 'compliance':
      const compMonthsIdx = process.argv.indexOf('--months');
      const compJurIdx = process.argv.indexOf('--jurisdiction');
      
      const compMonths = compMonthsIdx > -1 ? parseInt(process.argv[compMonthsIdx + 1]) : 12;
      const compJur = compJurIdx > -1 ? process.argv[compJurIdx + 1] : 'uae';
      
      const complianceResult = await getTaxComplianceStatus(organizationId, {
        checkPeriods: compMonths,
        jurisdiction: compJur
      });
      console.log(JSON.stringify(complianceResult, null, 2));
      break;

    case 'analytics':
      const anPeriodIdx = process.argv.indexOf('--period');
      const anJurIdx = process.argv.indexOf('--jurisdiction');
      
      const anPeriod = anPeriodIdx > -1 ? process.argv[anPeriodIdx + 1] : 'ytd';
      const anJur = anJurIdx > -1 ? process.argv[anJurIdx + 1] : 'uae';
      
      const analyticsResult = await getTaxAnalytics(organizationId, {
        period: anPeriod,
        jurisdiction: anJur
      });
      console.log(JSON.stringify(analyticsResult, null, 2));
      break;

    case 'rates':
      const ratesJurIdx = process.argv.indexOf('--jurisdiction');
      const ratesJur = ratesJurIdx > -1 ? process.argv[ratesJurIdx + 1] : 'all';
      
      console.log('📊 TAX RATES BY JURISDICTION\n');
      
      if (ratesJur === 'all') {
        Object.entries(TAX_REPORT_DNA_CONFIG.jurisdictions).forEach(([key, config]) => {
          console.log(`\n🌍 ${config.name} (${key.toUpperCase()})`);
          console.log(`   Tax System: ${config.tax_system}`);
          if (config.standard_rate) {
            console.log(`   Standard Rate: ${config.standard_rate}%`);
          }
          console.log('   Categories:');
          Object.entries(config.tax_categories).forEach(([catKey, cat]) => {
            console.log(`     - ${cat.name}: ${cat.rate}%`);
          });
        });
      } else {
        const config = TAX_REPORT_DNA_CONFIG.jurisdictions[ratesJur];
        if (config) {
          console.log(`🌍 ${config.name}`);
          console.log(`Tax System: ${config.tax_system}`);
          console.log('\nTax Categories:');
          Object.entries(config.tax_categories).forEach(([key, cat]) => {
            console.log(`  ${cat.name} (${cat.code}): ${cat.rate}%`);
          });
        }
      }
      break;

    case 'hair-talkz':
      console.log('💇‍♀️ Running Tax Analysis for Hair Talkz Organizations...\n');
      
      for (const org of HAIR_TALKZ_ORGS) {
        console.log(`\n📊 ${org.name}`);
        console.log('─'.repeat(60));
        
        const taxSummary = await getTaxSummary(org.id);
        if (taxSummary.success) {
          const data = taxSummary.data;
          console.log(`✅ Tax Period: ${data.period.start} to ${data.period.end}`);
          console.log(`   Output Tax: ${data.output_tax.tax_amount.toFixed(2)} AED`);
          console.log(`   Input Tax: ${data.input_tax.recoverable.toFixed(2)} AED`);
          console.log(`   Net Position: ${data.net_tax_position.toFixed(2)} AED`);
        } else {
          console.log(`⚠️  No tax data available`);
        }
        
        const compliance = await getTaxComplianceStatus(org.id, { checkPeriods: 3 });
        if (compliance.success) {
          console.log(`\n📋 Compliance Score: ${compliance.data.compliance_score.toFixed(0)}%`);
          console.log(`   Rating: ${compliance.data.compliance_rating.toUpperCase()}`);
        }
      }
      break;

    case 'help':
    default:
      await showHelp();
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

// Export functions for MCP integration
module.exports = {
  getTaxSummary,
  getTaxReturn,
  getTaxLiability,
  getTaxComplianceStatus,
  getTaxAnalytics,
  TAX_REPORT_DNA_CONFIG,
  HAIR_TALKZ_ORGS
};