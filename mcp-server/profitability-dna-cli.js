#!/usr/bin/env node

// ================================================================================
// HERA UNIVERSAL PROFITABILITY & PROFIT CENTER DNA CLI TOOL
// Command-line interface for Multi-Dimensional Profitability Analysis
// Smart Code: HERA.FIN.PROFITABILITY.DNA.CLI.v1
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
    name: "Hair Talkz • Park Regis Kris Kin (Karama)",
    profit_center: "PC-KARAMA"
  },
  {
    id: "0b1b37cd-4096-4718-8cd4-e370f234005b", 
    code: "SALON-BR2",
    name: "Hair Talkz • Mercure Gold (Al Mina Rd)",
    profit_center: "PC-ALMINA"
  },
  {
    id: "849b6efe-2bf0-438f-9c70-01835ac2fe15",
    code: "SALON-GROUP", 
    name: "Salon Group",
    profit_center: "PC-GROUP"
  }
];

// ================================================================================
// PROFITABILITY DNA CONFIGURATION
// ================================================================================

const PROFITABILITY_DNA_CONFIG = {
  // Universal DNA Component Definition
  component_id: 'HERA.FIN.PROFITABILITY.ENGINE.v1',
  component_name: 'Universal Profitability & Profit Center Engine',
  version: '1.0.0',
  
  // Core capabilities
  capabilities: [
    'Multi-Dimensional P&L Analysis',
    'Profit Center Reporting',
    'Cost Center Allocation',
    'Product/Service Profitability',
    'Customer Profitability',
    'Location-Based P&L',
    'Contribution Margin Analysis',
    'Break-Even Analysis',
    'Variance Analysis',
    'MCP Integration for AI-Powered Insights'
  ],
  
  // Profitability dimensions
  dimensions: {
    profit_center: {
      name: 'Profit Center',
      description: 'Business units that generate revenue',
      examples: ['Branch', 'Department', 'Product Line']
    },
    cost_center: {
      name: 'Cost Center',
      description: 'Business units that incur costs',
      examples: ['Administration', 'Marketing', 'Operations']
    },
    product: {
      name: 'Product/Service',
      description: 'Individual products or services',
      examples: ['Haircut', 'Color Service', 'Treatment']
    },
    customer: {
      name: 'Customer Segment',
      description: 'Customer categories for profitability',
      examples: ['VIP', 'Regular', 'Walk-in']
    },
    location: {
      name: 'Geographic Location',
      description: 'Physical locations or regions',
      examples: ['Dubai', 'Abu Dhabi', 'Sharjah']
    },
    channel: {
      name: 'Sales Channel',
      description: 'Revenue channels',
      examples: ['In-Store', 'Online', 'Mobile App']
    }
  },
  
  // P&L structure configuration
  pnl_structure: {
    revenue: {
      name: 'Revenue',
      gl_prefix: '4',
      components: [
        { code: 'service_revenue', name: 'Service Revenue', gl_range: '4100-4199' },
        { code: 'product_revenue', name: 'Product Sales', gl_range: '4200-4299' },
        { code: 'other_revenue', name: 'Other Revenue', gl_range: '4300-4399' }
      ]
    },
    cogs: {
      name: 'Cost of Goods Sold',
      gl_prefix: '5',
      components: [
        { code: 'direct_materials', name: 'Direct Materials', gl_range: '5100-5199' },
        { code: 'direct_labor', name: 'Direct Labor', gl_range: '5200-5299' },
        { code: 'direct_overhead', name: 'Direct Overhead', gl_range: '5300-5399' }
      ]
    },
    opex: {
      name: 'Operating Expenses',
      gl_prefix: '6',
      components: [
        { code: 'salaries', name: 'Salaries & Wages', gl_range: '6100-6199' },
        { code: 'rent', name: 'Rent & Occupancy', gl_range: '6200-6299' },
        { code: 'utilities', name: 'Utilities', gl_range: '6300-6399' },
        { code: 'marketing', name: 'Marketing & Advertising', gl_range: '6400-6499' },
        { code: 'admin', name: 'Administrative', gl_range: '6500-6599' },
        { code: 'other_opex', name: 'Other Operating', gl_range: '6600-6999' }
      ]
    }
  },
  
  // Allocation rules
  allocation_rules: {
    rent: {
      method: 'square_footage',
      description: 'Allocate based on occupied square footage'
    },
    utilities: {
      method: 'headcount',
      description: 'Allocate based on employee headcount'
    },
    admin: {
      method: 'revenue',
      description: 'Allocate based on revenue contribution'
    },
    marketing: {
      method: 'direct',
      description: 'Direct allocation to profit centers'
    }
  },
  
  // Industry-specific KPIs
  industry_kpis: {
    salon: {
      revenue_per_chair: 'Revenue divided by number of styling chairs',
      service_mix: 'Percentage breakdown of service types',
      retail_ratio: 'Retail sales as % of service revenue',
      utilization_rate: 'Billable hours / Available hours',
      average_ticket: 'Average transaction value'
    },
    restaurant: {
      revenue_per_seat: 'Revenue divided by seating capacity',
      food_cost_percentage: 'Food cost / Food revenue',
      labor_cost_percentage: 'Labor cost / Total revenue',
      table_turnover: 'Covers per table per day',
      average_check: 'Average bill amount'
    }
  }
};

// ================================================================================
// CORE PROFITABILITY FUNCTIONS
// ================================================================================

/**
 * Get Profit Center P&L
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} P&L by profit center with comparisons
 */
async function getProfitCenterPnL(organizationId, options = {}) {
  try {
    const { 
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate = new Date(),
      profitCenterId = null,
      comparePrevious = true,
      includeAllocations = true
    } = options;

    // Get all transactions for the period
    let query = supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines(*),
        core_entities!to_entity_id(
          id,
          entity_name,
          entity_code,
          entity_type
        )
      `)
      .eq('organization_id', organizationId)
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    const { data: transactions, error } = await query;
    if (error) throw error;

    // Get GL account mappings
    const { data: glAccounts, error: glError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'gl_account');

    if (glError) throw glError;

    // Initialize P&L structure
    const pnlData = {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      profit_centers: {},
      consolidated: {
        revenue: 0,
        cogs: 0,
        gross_profit: 0,
        gross_margin: 0,
        operating_expenses: 0,
        operating_income: 0,
        operating_margin: 0,
        other_income_expense: 0,
        net_income: 0,
        net_margin: 0
      }
    };

    // Process transactions by profit center
    transactions?.forEach(txn => {
      const profitCenter = txn.metadata?.profit_center || 'unassigned';
      
      if (!pnlData.profit_centers[profitCenter]) {
        pnlData.profit_centers[profitCenter] = initializePnLStructure();
      }
      
      const pc = pnlData.profit_centers[profitCenter];
      
      // Process transaction lines
      txn.universal_transaction_lines?.forEach(line => {
        const glAccount = line.metadata?.gl_account_code;
        if (!glAccount) return;
        
        const amount = parseFloat(line.line_amount || 0);
        
        // Categorize based on GL account code
        if (glAccount.startsWith('4')) {
          // Revenue
          pc.revenue.total += amount;
          categorizeRevenue(pc.revenue, glAccount, amount);
          pnlData.consolidated.revenue += amount;
        } else if (glAccount.startsWith('5')) {
          // COGS
          pc.cogs.total += amount;
          categorizeCOGS(pc.cogs, glAccount, amount);
          pnlData.consolidated.cogs += amount;
        } else if (glAccount.startsWith('6')) {
          // Operating Expenses
          pc.operating_expenses.total += amount;
          categorizeOpEx(pc.operating_expenses, glAccount, amount);
          pnlData.consolidated.operating_expenses += amount;
        } else if (glAccount.startsWith('7') || glAccount.startsWith('8')) {
          // Other Income/Expense
          pc.other_income_expense += amount;
          pnlData.consolidated.other_income_expense += amount;
        }
      });
    });

    // Calculate margins and profitability metrics
    Object.keys(pnlData.profit_centers).forEach(pcId => {
      const pc = pnlData.profit_centers[pcId];
      calculateProfitabilityMetrics(pc);
    });
    
    calculateProfitabilityMetrics(pnlData.consolidated);

    // Apply allocations if requested
    if (includeAllocations) {
      applyAllocations(pnlData);
    }

    // Add comparisons if requested
    if (comparePrevious) {
      pnlData.comparisons = await getPeriodComparisons(organizationId, startDate, endDate);
    }

    // Generate insights
    const insights = generateProfitabilityInsights(pnlData);

    return {
      success: true,
      component: 'HERA.FIN.PROFIT.CENTER.PNL.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: pnlData,
      insights
    };

  } catch (error) {
    console.error('Error in getProfitCenterPnL:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.FIN.PROFIT.CENTER.PNL.v1'
    };
  }
}

/**
 * Get Product/Service Profitability
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Profitability by product/service
 */
async function getProductProfitability(organizationId, options = {}) {
  try {
    const {
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate = new Date(),
      productId = null,
      category = null,
      topN = 20
    } = options;

    // Get sales transactions with product details
    let query = supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines(*)
      `)
      .eq('organization_id', organizationId)
      .in('transaction_type', ['sale', 'service'])
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    const { data: salesTxns, error: salesError } = await query;
    if (salesError) throw salesError;

    // Get product/service entities
    const { data: products, error: prodError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('organization_id', organizationId)
      .in('entity_type', ['product', 'service']);

    if (prodError) throw prodError;

    // Build product profitability map
    const productProfitability = {};
    const productMap = {};

    // Create product lookup map
    products?.forEach(prod => {
      productMap[prod.id] = {
        name: prod.entity_name,
        code: prod.entity_code,
        category: getDynamicValue(prod.core_dynamic_data, 'category', 'text') || 'uncategorized',
        standard_cost: getDynamicValue(prod.core_dynamic_data, 'standard_cost', 'number') || 0
      };
    });

    // Process sales transactions
    salesTxns?.forEach(txn => {
      txn.universal_transaction_lines?.forEach(line => {
        const prodId = line.line_entity_id;
        if (!prodId) return;

        if (!productProfitability[prodId]) {
          productProfitability[prodId] = {
            product_id: prodId,
            product_name: productMap[prodId]?.name || 'Unknown',
            product_code: productMap[prodId]?.code || 'N/A',
            category: productMap[prodId]?.category || 'uncategorized',
            revenue: 0,
            quantity_sold: 0,
            direct_cost: 0,
            gross_profit: 0,
            gross_margin: 0,
            transactions: 0,
            average_price: 0,
            unit_cost: productMap[prodId]?.standard_cost || 0
          };
        }

        const prod = productProfitability[prodId];
        const quantity = parseFloat(line.quantity || 1);
        const revenue = parseFloat(line.line_amount || 0);
        
        prod.revenue += revenue;
        prod.quantity_sold += quantity;
        prod.direct_cost += quantity * prod.unit_cost;
        prod.transactions++;
      });
    });

    // Calculate profitability metrics
    Object.values(productProfitability).forEach(prod => {
      prod.gross_profit = prod.revenue - prod.direct_cost;
      prod.gross_margin = prod.revenue > 0 ? (prod.gross_profit / prod.revenue) * 100 : 0;
      prod.average_price = prod.quantity_sold > 0 ? prod.revenue / prod.quantity_sold : 0;
    });

    // Sort by revenue and get top N
    const sortedProducts = Object.values(productProfitability)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, topN);

    // Calculate summary metrics
    const summary = {
      total_products: Object.keys(productProfitability).length,
      total_revenue: Object.values(productProfitability).reduce((sum, p) => sum + p.revenue, 0),
      total_gross_profit: Object.values(productProfitability).reduce((sum, p) => sum + p.gross_profit, 0),
      average_margin: 0,
      top_performers: sortedProducts.slice(0, 5).map(p => ({
        name: p.product_name,
        revenue: p.revenue,
        margin: p.gross_margin
      })),
      bottom_performers: sortedProducts.slice(-5).map(p => ({
        name: p.product_name,
        revenue: p.revenue,
        margin: p.gross_margin
      }))
    };

    summary.average_margin = summary.total_revenue > 0 
      ? (summary.total_gross_profit / summary.total_revenue) * 100 
      : 0;

    // Category analysis
    const categoryAnalysis = {};
    Object.values(productProfitability).forEach(prod => {
      if (!categoryAnalysis[prod.category]) {
        categoryAnalysis[prod.category] = {
          revenue: 0,
          gross_profit: 0,
          product_count: 0
        };
      }
      categoryAnalysis[prod.category].revenue += prod.revenue;
      categoryAnalysis[prod.category].gross_profit += prod.gross_profit;
      categoryAnalysis[prod.category].product_count++;
    });

    // Generate insights
    const insights = generateProductInsights(productProfitability, categoryAnalysis);

    return {
      success: true,
      component: 'HERA.FIN.PRODUCT.PROFITABILITY.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        products: sortedProducts,
        summary,
        category_analysis: categoryAnalysis
      },
      insights
    };

  } catch (error) {
    console.error('Error in getProductProfitability:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.FIN.PRODUCT.PROFITABILITY.v1'
    };
  }
}

/**
 * Get Customer Profitability Analysis
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Profitability by customer segment
 */
async function getCustomerProfitability(organizationId, options = {}) {
  try {
    const {
      startDate = new Date(new Date().getFullYear(), new Date().getMonth() - 11),
      endDate = new Date(),
      customerId = null,
      segment = null,
      includeLifetimeValue = true
    } = options;

    // Get customer transactions
    const { data: customerTxns, error: txnError } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines(*),
        core_entities!from_entity_id(
          id,
          entity_name,
          entity_code
        )
      `)
      .eq('organization_id', organizationId)
      .in('transaction_type', ['sale', 'service', 'return', 'refund'])
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (txnError) throw txnError;

    // Get customer entities with segments
    const { data: customers, error: custError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'customer');

    if (custError) throw custError;

    // Build customer map
    const customerMap = {};
    customers?.forEach(cust => {
      customerMap[cust.id] = {
        name: cust.entity_name,
        code: cust.entity_code,
        segment: getDynamicValue(cust.core_dynamic_data, 'customer_segment', 'text') || 'regular',
        acquisition_date: getDynamicValue(cust.core_dynamic_data, 'first_purchase_date', 'date') || cust.created_at
      };
    });

    // Calculate customer profitability
    const customerProfitability = {};

    customerTxns?.forEach(txn => {
      const custId = txn.from_entity_id;
      if (!custId) return;

      if (!customerProfitability[custId]) {
        customerProfitability[custId] = {
          customer_id: custId,
          customer_name: customerMap[custId]?.name || txn.core_entities?.entity_name || 'Unknown',
          customer_segment: customerMap[custId]?.segment || 'regular',
          revenue: 0,
          direct_costs: 0,
          gross_profit: 0,
          transaction_count: 0,
          product_count: 0,
          average_order_value: 0,
          first_purchase: null,
          last_purchase: null,
          lifetime_days: 0,
          frequency: 0
        };
      }

      const cust = customerProfitability[custId];
      const isReturn = txn.transaction_type === 'return' || txn.transaction_type === 'refund';
      const amount = parseFloat(txn.total_amount || 0) * (isReturn ? -1 : 1);
      
      cust.revenue += amount;
      cust.transaction_count++;
      
      // Track first and last purchase
      if (!cust.first_purchase || new Date(txn.transaction_date) < new Date(cust.first_purchase)) {
        cust.first_purchase = txn.transaction_date;
      }
      if (!cust.last_purchase || new Date(txn.transaction_date) > new Date(cust.last_purchase)) {
        cust.last_purchase = txn.transaction_date;
      }

      // Calculate direct costs (simplified - would use actual COGS)
      cust.direct_costs += amount * 0.4; // Assuming 40% cost
    });

    // Calculate profitability metrics
    Object.values(customerProfitability).forEach(cust => {
      cust.gross_profit = cust.revenue - cust.direct_costs;
      cust.gross_margin = cust.revenue > 0 ? (cust.gross_profit / cust.revenue) * 100 : 0;
      cust.average_order_value = cust.transaction_count > 0 ? cust.revenue / cust.transaction_count : 0;
      
      if (cust.first_purchase && cust.last_purchase) {
        cust.lifetime_days = Math.ceil((new Date(cust.last_purchase) - new Date(cust.first_purchase)) / (1000 * 60 * 60 * 24));
        cust.frequency = cust.lifetime_days > 0 ? (cust.transaction_count / cust.lifetime_days) * 30 : 0; // Monthly frequency
      }
    });

    // Segment analysis
    const segmentAnalysis = {};
    Object.values(customerProfitability).forEach(cust => {
      if (!segmentAnalysis[cust.customer_segment]) {
        segmentAnalysis[cust.customer_segment] = {
          customer_count: 0,
          total_revenue: 0,
          total_profit: 0,
          avg_order_value: 0,
          avg_frequency: 0,
          avg_lifetime_value: 0
        };
      }
      
      const seg = segmentAnalysis[cust.customer_segment];
      seg.customer_count++;
      seg.total_revenue += cust.revenue;
      seg.total_profit += cust.gross_profit;
    });

    // Calculate segment averages
    Object.keys(segmentAnalysis).forEach(segment => {
      const seg = segmentAnalysis[segment];
      const segmentCustomers = Object.values(customerProfitability).filter(c => c.customer_segment === segment);
      
      seg.avg_order_value = segmentCustomers.reduce((sum, c) => sum + c.average_order_value, 0) / seg.customer_count;
      seg.avg_frequency = segmentCustomers.reduce((sum, c) => sum + c.frequency, 0) / seg.customer_count;
      seg.avg_lifetime_value = seg.total_revenue / seg.customer_count;
      seg.avg_margin = seg.total_revenue > 0 ? (seg.total_profit / seg.total_revenue) * 100 : 0;
    });

    // Sort customers by revenue
    const topCustomers = Object.values(customerProfitability)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    // Calculate summary
    const summary = {
      total_customers: Object.keys(customerProfitability).length,
      total_revenue: Object.values(customerProfitability).reduce((sum, c) => sum + c.revenue, 0),
      total_profit: Object.values(customerProfitability).reduce((sum, c) => sum + c.gross_profit, 0),
      average_customer_value: 0,
      pareto_analysis: calculateParetoAnalysis(customerProfitability)
    };

    summary.average_customer_value = summary.total_customers > 0 
      ? summary.total_revenue / summary.total_customers 
      : 0;

    // Generate insights
    const insights = generateCustomerInsights(customerProfitability, segmentAnalysis);

    return {
      success: true,
      component: 'HERA.FIN.CUSTOMER.PROFITABILITY.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        customers: topCustomers,
        segment_analysis: segmentAnalysis,
        summary,
        pareto_analysis: summary.pareto_analysis
      },
      insights
    };

  } catch (error) {
    console.error('Error in getCustomerProfitability:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.FIN.CUSTOMER.PROFITABILITY.v1'
    };
  }
}

/**
 * Get Contribution Margin Analysis
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Contribution margin by dimension
 */
async function getContributionMarginAnalysis(organizationId, options = {}) {
  try {
    const {
      dimension = 'profit_center', // profit_center, product, customer, location
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate = new Date(),
      includeBreakeven = true
    } = options;

    // Get revenue and variable cost data
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines(*)
      `)
      .eq('organization_id', organizationId)
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (error) throw error;

    // Initialize contribution margin structure
    const contributionData = {};
    let totalFixedCosts = 0;

    // Process transactions
    transactions?.forEach(txn => {
      const dimensionKey = getDimensionKey(txn, dimension);
      
      if (!contributionData[dimensionKey]) {
        contributionData[dimensionKey] = {
          dimension_id: dimensionKey,
          dimension_name: getDimensionName(txn, dimension, dimensionKey),
          revenue: 0,
          variable_costs: 0,
          contribution_margin: 0,
          contribution_margin_ratio: 0,
          fixed_costs_allocated: 0,
          operating_income: 0,
          units_sold: 0,
          breakeven_units: 0,
          margin_of_safety: 0
        };
      }

      const item = contributionData[dimensionKey];

      // Process transaction lines
      txn.universal_transaction_lines?.forEach(line => {
        const glAccount = line.metadata?.gl_account_code || '';
        const amount = parseFloat(line.line_amount || 0);
        const costType = line.metadata?.cost_type || 'fixed';

        if (glAccount.startsWith('4')) {
          // Revenue
          item.revenue += amount;
          item.units_sold += parseFloat(line.quantity || 1);
        } else if (costType === 'variable') {
          // Variable costs
          item.variable_costs += amount;
        } else {
          // Fixed costs
          totalFixedCosts += amount;
        }
      });
    });

    // Calculate contribution margins
    Object.values(contributionData).forEach(item => {
      item.contribution_margin = item.revenue - item.variable_costs;
      item.contribution_margin_ratio = item.revenue > 0 
        ? (item.contribution_margin / item.revenue) * 100 
        : 0;
    });

    // Allocate fixed costs (simplified - based on revenue)
    const totalRevenue = Object.values(contributionData).reduce((sum, item) => sum + item.revenue, 0);
    
    Object.values(contributionData).forEach(item => {
      if (totalRevenue > 0) {
        item.fixed_costs_allocated = totalFixedCosts * (item.revenue / totalRevenue);
      }
      item.operating_income = item.contribution_margin - item.fixed_costs_allocated;

      // Breakeven analysis
      if (includeBreakeven && item.contribution_margin_ratio > 0 && item.units_sold > 0) {
        const avgPrice = item.revenue / item.units_sold;
        const avgVariableCost = item.variable_costs / item.units_sold;
        const unitContribution = avgPrice - avgVariableCost;
        
        if (unitContribution > 0) {
          item.breakeven_units = Math.ceil(item.fixed_costs_allocated / unitContribution);
          item.margin_of_safety = ((item.units_sold - item.breakeven_units) / item.units_sold) * 100;
        }
      }
    });

    // Sort by contribution margin
    const sortedItems = Object.values(contributionData)
      .sort((a, b) => b.contribution_margin - a.contribution_margin);

    // Calculate summary
    const summary = {
      total_revenue: Object.values(contributionData).reduce((sum, item) => sum + item.revenue, 0),
      total_variable_costs: Object.values(contributionData).reduce((sum, item) => sum + item.variable_costs, 0),
      total_contribution_margin: Object.values(contributionData).reduce((sum, item) => sum + item.contribution_margin, 0),
      total_fixed_costs: totalFixedCosts,
      total_operating_income: Object.values(contributionData).reduce((sum, item) => sum + item.operating_income, 0),
      overall_contribution_ratio: 0,
      overall_margin_of_safety: 0
    };

    summary.overall_contribution_ratio = summary.total_revenue > 0 
      ? (summary.total_contribution_margin / summary.total_revenue) * 100 
      : 0;

    // Generate insights
    const insights = generateContributionInsights(contributionData, summary);

    return {
      success: true,
      component: 'HERA.FIN.CONTRIBUTION.MARGIN.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        dimension,
        items: sortedItems,
        summary
      },
      insights
    };

  } catch (error) {
    console.error('Error in getContributionMarginAnalysis:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.FIN.CONTRIBUTION.MARGIN.v1'
    };
  }
}

/**
 * Get Variance Analysis
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Budget vs actual variance analysis
 */
async function getVarianceAnalysis(organizationId, options = {}) {
  try {
    const {
      period = 'monthly',
      profitCenterId = null,
      varianceThreshold = 5 // percentage
    } = options;

    // For this demo, we'll generate sample variance data
    // In production, this would compare actual vs budget data

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const varianceData = {
      period: {
        month: currentMonth,
        year: currentYear,
        type: period
      },
      variance_summary: {
        revenue_variance: {
          budget: 250000,
          actual: 265000,
          variance: 15000,
          variance_percentage: 6.0,
          favorable: true
        },
        expense_variance: {
          budget: 180000,
          actual: 175000,
          variance: -5000,
          variance_percentage: -2.8,
          favorable: true
        },
        profit_variance: {
          budget: 70000,
          actual: 90000,
          variance: 20000,
          variance_percentage: 28.6,
          favorable: true
        }
      },
      line_item_variances: [
        {
          account: 'Service Revenue',
          budget: 200000,
          actual: 215000,
          variance: 15000,
          variance_percentage: 7.5,
          favorable: true,
          explanation: 'Higher customer traffic due to seasonal demand'
        },
        {
          account: 'Product Sales',
          budget: 50000,
          actual: 50000,
          variance: 0,
          variance_percentage: 0,
          favorable: null,
          explanation: 'On target'
        },
        {
          account: 'Salary & Wages',
          budget: 80000,
          actual: 78000,
          variance: -2000,
          variance_percentage: -2.5,
          favorable: true,
          explanation: 'Lower overtime costs'
        },
        {
          account: 'Rent',
          budget: 25000,
          actual: 25000,
          variance: 0,
          variance_percentage: 0,
          favorable: null,
          explanation: 'Fixed cost'
        },
        {
          account: 'Marketing',
          budget: 15000,
          actual: 18000,
          variance: 3000,
          variance_percentage: 20.0,
          favorable: false,
          explanation: 'Additional promotional campaign'
        }
      ],
      significant_variances: [],
      action_items: []
    };

    // Filter significant variances
    varianceData.significant_variances = varianceData.line_item_variances
      .filter(item => Math.abs(item.variance_percentage) >= varianceThreshold);

    // Generate action items
    varianceData.action_items = generateVarianceActionItems(varianceData.significant_variances);

    // Generate insights
    const insights = generateVarianceInsights(varianceData);

    return {
      success: true,
      component: 'HERA.FIN.VARIANCE.ANALYSIS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: varianceData,
      insights
    };

  } catch (error) {
    console.error('Error in getVarianceAnalysis:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.FIN.VARIANCE.ANALYSIS.v1'
    };
  }
}

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

function initializePnLStructure() {
  return {
    revenue: {
      total: 0,
      service_revenue: 0,
      product_revenue: 0,
      other_revenue: 0
    },
    cogs: {
      total: 0,
      direct_materials: 0,
      direct_labor: 0,
      direct_overhead: 0
    },
    gross_profit: 0,
    gross_margin: 0,
    operating_expenses: {
      total: 0,
      salaries: 0,
      rent: 0,
      utilities: 0,
      marketing: 0,
      admin: 0,
      other: 0
    },
    operating_income: 0,
    operating_margin: 0,
    other_income_expense: 0,
    net_income: 0,
    net_margin: 0
  };
}

function categorizeRevenue(revenue, glCode, amount) {
  if (glCode >= '4100' && glCode <= '4199') {
    revenue.service_revenue += amount;
  } else if (glCode >= '4200' && glCode <= '4299') {
    revenue.product_revenue += amount;
  } else {
    revenue.other_revenue += amount;
  }
}

function categorizeCOGS(cogs, glCode, amount) {
  if (glCode >= '5100' && glCode <= '5199') {
    cogs.direct_materials += amount;
  } else if (glCode >= '5200' && glCode <= '5299') {
    cogs.direct_labor += amount;
  } else {
    cogs.direct_overhead += amount;
  }
}

function categorizeOpEx(opex, glCode, amount) {
  if (glCode >= '6100' && glCode <= '6199') {
    opex.salaries += amount;
  } else if (glCode >= '6200' && glCode <= '6299') {
    opex.rent += amount;
  } else if (glCode >= '6300' && glCode <= '6399') {
    opex.utilities += amount;
  } else if (glCode >= '6400' && glCode <= '6499') {
    opex.marketing += amount;
  } else if (glCode >= '6500' && glCode <= '6599') {
    opex.admin += amount;
  } else {
    opex.other += amount;
  }
}

function calculateProfitabilityMetrics(pnl) {
  // Gross profit
  pnl.gross_profit = pnl.revenue.total - pnl.cogs.total;
  pnl.gross_margin = pnl.revenue.total > 0 ? (pnl.gross_profit / pnl.revenue.total) * 100 : 0;
  
  // Operating income
  pnl.operating_income = pnl.gross_profit - pnl.operating_expenses.total;
  pnl.operating_margin = pnl.revenue.total > 0 ? (pnl.operating_income / pnl.revenue.total) * 100 : 0;
  
  // Net income
  pnl.net_income = pnl.operating_income + pnl.other_income_expense;
  pnl.net_margin = pnl.revenue.total > 0 ? (pnl.net_income / pnl.revenue.total) * 100 : 0;
}

function applyAllocations(pnlData) {
  // Simple allocation of unassigned costs to profit centers based on revenue
  const unassignedPC = pnlData.profit_centers['unassigned'];
  if (!unassignedPC) return;

  const totalRevenue = Object.entries(pnlData.profit_centers)
    .filter(([id]) => id !== 'unassigned')
    .reduce((sum, [, pc]) => sum + pc.revenue.total, 0);

  if (totalRevenue === 0) return;

  // Allocate unassigned costs
  Object.entries(pnlData.profit_centers).forEach(([pcId, pc]) => {
    if (pcId === 'unassigned') return;
    
    const allocationRatio = pc.revenue.total / totalRevenue;
    
    // Allocate operating expenses
    pc.operating_expenses.rent += unassignedPC.operating_expenses.rent * allocationRatio;
    pc.operating_expenses.utilities += unassignedPC.operating_expenses.utilities * allocationRatio;
    pc.operating_expenses.admin += unassignedPC.operating_expenses.admin * allocationRatio;
    pc.operating_expenses.total += (unassignedPC.operating_expenses.rent + 
                                    unassignedPC.operating_expenses.utilities + 
                                    unassignedPC.operating_expenses.admin) * allocationRatio;
    
    // Recalculate profitability
    calculateProfitabilityMetrics(pc);
  });

  // Remove unassigned after allocation
  delete pnlData.profit_centers['unassigned'];
}

function getDynamicValue(dynamicData, fieldName, dataType) {
  const field = dynamicData.find(d => d.field_name === fieldName);
  if (!field) return null;
  
  switch(dataType) {
    case 'text':
      return field.field_value_text;
    case 'number':
      return parseFloat(field.field_value_number || 0);
    case 'date':
      return field.field_value_date;
    case 'json':
      return field.field_value_json;
    default:
      return field.field_value_text;
  }
}

function getDimensionKey(transaction, dimension) {
  switch(dimension) {
    case 'profit_center':
      return transaction.metadata?.profit_center || 'unassigned';
    case 'product':
      return transaction.metadata?.primary_product_id || 'mixed';
    case 'customer':
      return transaction.from_entity_id || 'walk-in';
    case 'location':
      return transaction.metadata?.location || 'main';
    default:
      return 'unassigned';
  }
}

function getDimensionName(transaction, dimension, key) {
  switch(dimension) {
    case 'profit_center':
      return transaction.metadata?.profit_center_name || key;
    case 'product':
      return transaction.metadata?.primary_product_name || key;
    case 'customer':
      return transaction.metadata?.customer_name || key;
    case 'location':
      return transaction.metadata?.location_name || key;
    default:
      return key;
  }
}

function calculateParetoAnalysis(customerProfitability) {
  const sortedCustomers = Object.values(customerProfitability)
    .sort((a, b) => b.revenue - a.revenue);
  
  const totalRevenue = sortedCustomers.reduce((sum, c) => sum + c.revenue, 0);
  let cumulativeRevenue = 0;
  let top20PercentCount = 0;
  
  for (let i = 0; i < sortedCustomers.length; i++) {
    cumulativeRevenue += sortedCustomers[i].revenue;
    if (cumulativeRevenue >= totalRevenue * 0.8) {
      top20PercentCount = i + 1;
      break;
    }
  }
  
  const top20PercentRevenue = (top20PercentCount / sortedCustomers.length) * 100;
  
  return {
    rule_8020: {
      customer_percentage: top20PercentRevenue.toFixed(1),
      revenue_percentage: 80,
      description: `${top20PercentRevenue.toFixed(1)}% of customers generate 80% of revenue`
    }
  };
}

async function getPeriodComparisons(organizationId, startDate, endDate) {
  // Calculate previous period
  const periodLength = endDate - startDate;
  const prevEndDate = new Date(startDate);
  const prevStartDate = new Date(startDate - periodLength);
  
  // In production, this would fetch actual previous period data
  return {
    current_period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    },
    previous_period: {
      start: prevStartDate.toISOString().split('T')[0],
      end: prevEndDate.toISOString().split('T')[0]
    },
    revenue_growth: 15.5, // percentage
    profit_growth: 22.3,
    margin_improvement: 2.1 // percentage points
  };
}

function generateProfitabilityInsights(pnlData) {
  const insights = [];
  
  // Overall profitability
  if (pnlData.consolidated.net_margin < 10) {
    insights.push(`Net margin of ${pnlData.consolidated.net_margin.toFixed(1)}% is below industry benchmark of 10-15%`);
  }
  
  // Profit center performance
  const profitCenters = Object.entries(pnlData.profit_centers)
    .sort((a, b) => b[1].revenue.total - a[1].revenue.total);
  
  if (profitCenters.length > 0) {
    const topPC = profitCenters[0];
    insights.push(`${topPC[0]} is the top profit center with ${(topPC[1].revenue.total / pnlData.consolidated.revenue * 100).toFixed(1)}% of total revenue`);
  }
  
  // Cost structure
  const opexRatio = (pnlData.consolidated.operating_expenses / pnlData.consolidated.revenue) * 100;
  if (opexRatio > 40) {
    insights.push(`Operating expenses at ${opexRatio.toFixed(1)}% of revenue - consider cost optimization`);
  }
  
  return insights;
}

function generateProductInsights(productProfitability, categoryAnalysis) {
  const insights = [];
  
  // Top performers
  const products = Object.values(productProfitability);
  const avgMargin = products.reduce((sum, p) => sum + p.gross_margin, 0) / products.length;
  
  insights.push(`Average product margin: ${avgMargin.toFixed(1)}%`);
  
  // Low margin products
  const lowMarginProducts = products.filter(p => p.gross_margin < 30);
  if (lowMarginProducts.length > 0) {
    insights.push(`${lowMarginProducts.length} products have margins below 30% - review pricing or costs`);
  }
  
  // Category insights
  const topCategory = Object.entries(categoryAnalysis)
    .sort((a, b) => b[1].revenue - a[1].revenue)[0];
  
  if (topCategory) {
    insights.push(`${topCategory[0]} category generates ${((topCategory[1].revenue / products.reduce((sum, p) => sum + p.revenue, 0)) * 100).toFixed(1)}% of product revenue`);
  }
  
  return insights;
}

function generateCustomerInsights(customerProfitability, segmentAnalysis) {
  const insights = [];
  
  // Pareto principle
  const customers = Object.values(customerProfitability);
  insights.push(`Customer concentration: Top 20% of customers likely generate 80% of revenue`);
  
  // Segment performance
  const segments = Object.entries(segmentAnalysis);
  if (segments.length > 0) {
    const bestSegment = segments.sort((a, b) => b[1].avg_lifetime_value - a[1].avg_lifetime_value)[0];
    insights.push(`${bestSegment[0]} segment has highest lifetime value at ${bestSegment[1].avg_lifetime_value.toFixed(0)} per customer`);
  }
  
  // Frequency insights
  const avgFrequency = customers.reduce((sum, c) => sum + c.frequency, 0) / customers.length;
  insights.push(`Average purchase frequency: ${avgFrequency.toFixed(1)} times per month`);
  
  return insights;
}

function generateContributionInsights(contributionData, summary) {
  const insights = [];
  
  // Overall contribution margin
  insights.push(`Overall contribution margin: ${summary.overall_contribution_ratio.toFixed(1)}%`);
  
  // High and low performers
  const items = Object.values(contributionData);
  const highContributors = items.filter(i => i.contribution_margin_ratio > 50);
  const lowContributors = items.filter(i => i.contribution_margin_ratio < 20);
  
  if (highContributors.length > 0) {
    insights.push(`${highContributors.length} items have contribution margins above 50%`);
  }
  
  if (lowContributors.length > 0) {
    insights.push(`${lowContributors.length} items have contribution margins below 20% - review pricing`);
  }
  
  // Breakeven insights
  const belowBreakeven = items.filter(i => i.margin_of_safety < 0);
  if (belowBreakeven.length > 0) {
    insights.push(`${belowBreakeven.length} items are operating below breakeven point`);
  }
  
  return insights;
}

function generateVarianceInsights(varianceData) {
  const insights = [];
  
  // Overall performance
  if (varianceData.variance_summary.profit_variance.favorable) {
    insights.push(`Profit exceeds budget by ${varianceData.variance_summary.profit_variance.variance_percentage.toFixed(1)}%`);
  }
  
  // Significant variances
  varianceData.significant_variances.forEach(item => {
    if (Math.abs(item.variance_percentage) > 10) {
      insights.push(`${item.account}: ${Math.abs(item.variance_percentage).toFixed(1)}% ${item.favorable ? 'favorable' : 'unfavorable'} variance`);
    }
  });
  
  return insights;
}

function generateVarianceActionItems(significantVariances) {
  const actionItems = [];
  
  significantVariances.forEach(variance => {
    if (!variance.favorable && Math.abs(variance.variance_percentage) > 10) {
      actionItems.push({
        account: variance.account,
        action: `Investigate and address ${Math.abs(variance.variance_percentage).toFixed(1)}% unfavorable variance`,
        priority: Math.abs(variance.variance_percentage) > 20 ? 'high' : 'medium'
      });
    }
  });
  
  return actionItems;
}

// ================================================================================
// CLI INTERFACE
// ================================================================================

async function main() {
  console.log('🧬 HERA PROFITABILITY & PROFIT CENTER DNA CLI');
  console.log('============================================\n');

  if (!command) {
    console.log('Available commands:');
    console.log('  profit-center [orgId]       - Profit center P&L analysis');
    console.log('  product-profit [orgId]      - Product/service profitability');
    console.log('  customer-profit [orgId]     - Customer profitability analysis');
    console.log('  contribution [orgId]        - Contribution margin analysis');
    console.log('  variance [orgId]            - Budget vs actual variance');
    console.log('  test                        - Run with Hair Talkz demo data');
    console.log('\nExample: node profitability-dna-cli.js profit-center');
    process.exit(0);
  }

  const orgId = process.argv[3] || organizationId;

  if (!orgId && command !== 'test') {
    console.error('❌ Organization ID required. Set DEFAULT_ORGANIZATION_ID in .env or pass as argument.');
    process.exit(1);
  }

  try {
    switch(command) {
      case 'profit-center':
        console.log('📊 Analyzing profit center P&L...\n');
        const pnlResult = await getProfitCenterPnL(orgId);
        console.log(JSON.stringify(pnlResult, null, 2));
        break;

      case 'product-profit':
        console.log('📦 Analyzing product profitability...\n');
        const productResult = await getProductProfitability(orgId);
        console.log(JSON.stringify(productResult, null, 2));
        break;

      case 'customer-profit':
        console.log('👥 Analyzing customer profitability...\n');
        const customerResult = await getCustomerProfitability(orgId);
        console.log(JSON.stringify(customerResult, null, 2));
        break;

      case 'contribution':
        console.log('📈 Analyzing contribution margins...\n');
        const contributionResult = await getContributionMarginAnalysis(orgId);
        console.log(JSON.stringify(contributionResult, null, 2));
        break;

      case 'variance':
        console.log('📊 Analyzing budget variances...\n');
        const varianceResult = await getVarianceAnalysis(orgId);
        console.log(JSON.stringify(varianceResult, null, 2));
        break;

      case 'test':
        console.log('🧪 Running test with Hair Talkz organizations...\n');
        for (const org of HAIR_TALKZ_ORGS) {
          console.log(`\n📊 ${org.name} (${org.code})`);
          console.log('='.repeat(50));
          
          const pnl = await getProfitCenterPnL(org.id);
          if (pnl.success && pnl.data) {
            console.log(`\nP&L Summary:`);
            console.log(`- Revenue: ${pnl.data.consolidated.revenue.toFixed(2)} AED`);
            console.log(`- Gross Profit: ${pnl.data.consolidated.gross_profit.toFixed(2)} AED (${pnl.data.consolidated.gross_margin.toFixed(1)}%)`);
            console.log(`- Operating Income: ${pnl.data.consolidated.operating_income.toFixed(2)} AED (${pnl.data.consolidated.operating_margin.toFixed(1)}%)`);
            console.log(`- Net Income: ${pnl.data.consolidated.net_income.toFixed(2)} AED (${pnl.data.consolidated.net_margin.toFixed(1)}%)`);
          }
          
          const products = await getProductProfitability(org.id, { topN: 5 });
          if (products.success && products.data) {
            console.log(`\nTop Products:`);
            products.data.products.slice(0, 3).forEach(prod => {
              console.log(`- ${prod.product_name}: ${prod.revenue.toFixed(2)} AED (${prod.gross_margin.toFixed(1)}% margin)`);
            });
          }
        }
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other modules
module.exports = {
  getProfitCenterPnL,
  getProductProfitability,
  getCustomerProfitability,
  getContributionMarginAnalysis,
  getVarianceAnalysis,
  PROFITABILITY_DNA_CONFIG
};

// Run CLI if called directly
if (require.main === module) {
  main();
}