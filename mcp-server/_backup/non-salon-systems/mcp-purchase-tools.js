#!/usr/bin/env node

/**
 * HERA MCP Purchase Tools Integration
 * Exposes Purchase Report DNA functions as MCP tools for AI access
 * Smart Code: HERA.MCP.PURCHASE.TOOLS.v1
 */

const {
  getDailyPurchases,
  getTopVendors,
  getPurchaseMetrics,
  getPurchaseTrends
} = require('./purchase-report-dna-cli');

// MCP Tool Definitions
const MCP_PURCHASE_TOOLS = {
  'get-daily-purchases': {
    description: 'Get daily purchase report with vendor breakdown and spending analysis',
    parameters: {
      organization_id: { type: 'string', required: true },
      date: { type: 'string', format: 'YYYY-MM-DD', required: false }
    },
    handler: async (params) => {
      const date = params.date ? new Date(params.date) : new Date();
      return await getDailyPurchases(params.organization_id, date);
    }
  },

  'get-top-vendors': {
    description: 'Get top vendors with spending analysis and performance metrics',
    parameters: {
      organization_id: { type: 'string', required: true },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      limit: { type: 'number', default: 10, required: false }
    },
    handler: async (params) => {
      return await getTopVendors(params.organization_id, {
        startDate: params.start_date ? new Date(params.start_date) : undefined,
        endDate: params.end_date ? new Date(params.end_date) : undefined,
        limit: params.limit || 10
      });
    }
  },

  'get-purchase-metrics': {
    description: 'Analyze purchase patterns, payment performance, and category breakdown',
    parameters: {
      organization_id: { type: 'string', required: true },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false }
    },
    handler: async (params) => {
      return await getPurchaseMetrics(params.organization_id, {
        startDate: params.start_date ? new Date(params.start_date) : undefined,
        endDate: params.end_date ? new Date(params.end_date) : undefined
      });
    }
  },

  'get-purchase-trends': {
    description: 'Get purchase trends with forecasting and seasonality analysis',
    parameters: {
      organization_id: { type: 'string', required: true },
      period: { type: 'string', enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
      lookback: { type: 'number', default: 30, required: false }
    },
    handler: async (params) => {
      return await getPurchaseTrends(params.organization_id, {
        period: params.period || 'daily',
        lookback: params.lookback || 30
      });
    }
  },

  'analyze-vendor-performance': {
    description: 'Get comprehensive vendor performance analysis with risk assessment',
    parameters: {
      organization_id: { type: 'string', required: true },
      vendor_id: { type: 'string', required: false },
      analysis_type: { 
        type: 'string', 
        enum: ['summary', 'detailed', 'risk_assessment'], 
        default: 'summary' 
      }
    },
    handler: async (params) => {
      // Comprehensive vendor analysis
      const vendors = await getTopVendors(params.organization_id, { limit: 20 });
      const metrics = await getPurchaseMetrics(params.organization_id);
      const trends = await getPurchaseTrends(params.organization_id);

      // Find specific vendor if requested
      let vendorData = null;
      if (params.vendor_id && vendors.success) {
        vendorData = vendors.data.top_vendors.find(v => v.vendor_id === params.vendor_id);
      }

      // Build comprehensive analysis
      const analysis = {
        success: true,
        component: 'HERA.PURCHASE.VENDOR.PERFORMANCE.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        analysis_type: params.analysis_type,
        vendor_analysis: vendorData || {
          message: params.vendor_id ? 'Vendor not found in top vendors' : 'No specific vendor requested'
        },
        insights: {
          vendor_concentration: vendors.data?.analysis?.vendor_concentration || 0,
          concentration_risk: vendors.data?.analysis?.concentration_risk || 'unknown',
          total_active_vendors: vendors.data?.totals?.total_vendors || 0,
          average_vendor_spend: vendors.data?.totals?.average_vendor_spend || 0,
          purchase_frequency: metrics.data?.purchase_frequency || {},
          trend_direction: trends.data?.analysis?.trend_direction || 'unknown'
        },
        risk_assessment: {
          supply_chain_risk: calculateSupplyChainRisk(vendors.data),
          payment_performance: metrics.data?.payment_metrics || {},
          vendor_diversity: vendors.data?.totals?.total_vendors < 5 ? 'low' : 'adequate'
        },
        recommendations: generateVendorRecommendations(vendors.data, metrics.data, trends.data)
      };

      return analysis;
    }
  },

  'get-payables-aging': {
    description: 'Analyze accounts payable aging and payment obligations',
    parameters: {
      organization_id: { type: 'string', required: true },
      as_of_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      include_projections: { type: 'boolean', default: true }
    },
    handler: async (params) => {
      // This would analyze open payables and aging buckets
      const purchases = await getDailyPurchases(params.organization_id);
      const vendors = await getTopVendors(params.organization_id);

      return {
        success: true,
        component: 'HERA.PURCHASE.PAYABLES.AGING.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        as_of_date: params.as_of_date || new Date().toISOString().split('T')[0],
        aging_summary: {
          current: 0,
          days_1_30: 0,
          days_31_60: 0,
          days_61_90: 0,
          over_90: 0,
          total_payables: 0
        },
        vendor_obligations: vendors.data?.top_vendors?.slice(0, 5).map(v => ({
          vendor_name: v.vendor_name,
          total_owed: 0, // Would calculate from open invoices
          payment_terms: v.payment_terms,
          average_days_to_pay: 30
        })) || [],
        cash_flow_projection: {
          next_7_days: 0,
          next_30_days: 0,
          next_60_days: 0
        },
        recommendations: [
          'Implement early payment discounts with top vendors',
          'Review payment terms for optimization opportunities'
        ]
      };
    }
  },

  'analyze-purchase-efficiency': {
    description: 'Comprehensive purchase efficiency analysis with cost-saving opportunities',
    parameters: {
      organization_id: { type: 'string', required: true },
      focus_area: { 
        type: 'string', 
        enum: ['cost_reduction', 'vendor_optimization', 'process_improvement'], 
        default: 'cost_reduction' 
      }
    },
    handler: async (params) => {
      // Multi-dimensional efficiency analysis
      const [dailyPurchases, vendors, metrics, trends] = await Promise.all([
        getDailyPurchases(params.organization_id),
        getTopVendors(params.organization_id, { limit: 10 }),
        getPurchaseMetrics(params.organization_id),
        getPurchaseTrends(params.organization_id, { period: 'monthly', lookback: 90 })
      ]);

      const efficiency = {
        success: true,
        component: 'HERA.PURCHASE.EFFICIENCY.ANALYSIS.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        focus_area: params.focus_area,
        current_state: {
          daily_purchase_volume: dailyPurchases.data?.total_amount || 0,
          vendor_count: vendors.data?.totals?.total_vendors || 0,
          average_order_value: metrics.data?.average_purchase_value || 0,
          purchase_frequency: metrics.data?.purchase_frequency?.daily_average || 0
        },
        opportunities: {
          bulk_ordering: calculateBulkOrderingSavings(metrics.data),
          vendor_consolidation: calculateVendorConsolidationSavings(vendors.data),
          payment_term_optimization: calculatePaymentTermSavings(vendors.data),
          category_optimization: identifyCategoryOptimizations(metrics.data)
        },
        potential_savings: {
          annual_amount: 0, // Would calculate based on opportunities
          percentage: 0,
          quick_wins: [],
          long_term_initiatives: []
        },
        implementation_roadmap: generateEfficiencyRoadmap(params.focus_area)
      };

      return efficiency;
    }
  }
};

// Helper functions
function calculateSupplyChainRisk(vendorData) {
  if (!vendorData) return 'unknown';
  
  const concentration = vendorData.analysis?.vendor_concentration || 0;
  const vendorCount = vendorData.totals?.total_vendors || 0;
  
  if (concentration > 60 || vendorCount < 3) return 'high';
  if (concentration > 40 || vendorCount < 5) return 'medium';
  return 'low';
}

function generateVendorRecommendations(vendors, metrics, trends) {
  const recommendations = [];
  
  if (vendors?.analysis?.concentration_risk === 'high') {
    recommendations.push({
      category: 'risk_mitigation',
      priority: 'critical',
      recommendation: 'Vendor concentration exceeds 60% - urgently diversify supplier base',
      impact: 'Reduce supply chain disruption risk by 50%'
    });
  }
  
  if (metrics?.purchase_frequency?.daily_average > 5) {
    recommendations.push({
      category: 'efficiency',
      priority: 'high',
      recommendation: 'High purchase frequency detected - implement bulk ordering',
      impact: 'Reduce transaction costs by 20-30%'
    });
  }
  
  if (trends?.analysis?.trend_direction === 'upward' && trends?.analysis?.volatility > 20) {
    recommendations.push({
      category: 'cost_control',
      priority: 'medium',
      recommendation: 'Rising and volatile purchase costs - negotiate fixed-price contracts',
      impact: 'Stabilize costs and improve budgeting accuracy'
    });
  }
  
  return recommendations;
}

function calculateBulkOrderingSavings(metricsData) {
  if (!metricsData) return { potential_savings: 0, implementation: 'No data' };
  
  const frequency = metricsData.purchase_frequency?.daily_average || 0;
  if (frequency > 3) {
    return {
      potential_savings: frequency * 100 * 12, // Rough estimate
      implementation: 'Consolidate daily orders into weekly bulk purchases',
      categories: Object.keys(metricsData.category_analysis || {})
    };
  }
  
  return { potential_savings: 0, implementation: 'Current ordering frequency is optimal' };
}

function calculateVendorConsolidationSavings(vendorData) {
  if (!vendorData) return { potential_savings: 0, vendors_to_consolidate: 0 };
  
  const totalVendors = vendorData.totals?.total_vendors || 0;
  if (totalVendors > 10) {
    const bottomVendors = vendorData.top_vendors?.slice(5) || [];
    const bottomSpend = bottomVendors.reduce((sum, v) => sum + v.total_amount, 0);
    
    return {
      potential_savings: bottomSpend * 0.1, // 10% savings through consolidation
      vendors_to_consolidate: bottomVendors.length,
      target_vendors: vendorData.top_vendors?.slice(0, 3).map(v => v.vendor_name) || []
    };
  }
  
  return { potential_savings: 0, vendors_to_consolidate: 0 };
}

function calculatePaymentTermSavings(vendorData) {
  if (!vendorData || !vendorData.top_vendors) return { potential_savings: 0 };
  
  const totalSpend = vendorData.totals?.total_spend || 0;
  const earlyPaymentDiscount = 0.02; // 2% typical early payment discount
  
  return {
    potential_savings: totalSpend * earlyPaymentDiscount,
    eligible_vendors: vendorData.top_vendors.filter(v => v.payment_terms === 'NET30').length,
    strategy: 'Negotiate 2/10 NET30 terms with major vendors'
  };
}

function identifyCategoryOptimizations(metricsData) {
  if (!metricsData || !metricsData.category_analysis) return [];
  
  return Object.entries(metricsData.category_analysis)
    .sort(([,a], [,b]) => b.amount - a.amount)
    .slice(0, 3)
    .map(([category, data]) => ({
      category,
      current_spend: data.amount,
      optimization: `Review ${category} for standardization opportunities`,
      potential_savings: data.amount * 0.05 // 5% potential savings
    }));
}

function generateEfficiencyRoadmap(focusArea) {
  const roadmaps = {
    cost_reduction: [
      { phase: 1, action: 'Analyze spend by category', timeline: 'Week 1-2' },
      { phase: 2, action: 'Negotiate volume discounts', timeline: 'Week 3-4' },
      { phase: 3, action: 'Implement bulk ordering', timeline: 'Month 2' },
      { phase: 4, action: 'Monitor savings', timeline: 'Ongoing' }
    ],
    vendor_optimization: [
      { phase: 1, action: 'Vendor performance scorecard', timeline: 'Week 1' },
      { phase: 2, action: 'Identify consolidation opportunities', timeline: 'Week 2-3' },
      { phase: 3, action: 'Renegotiate contracts', timeline: 'Month 2' },
      { phase: 4, action: 'Implement vendor management system', timeline: 'Month 3' }
    ],
    process_improvement: [
      { phase: 1, action: 'Map current purchase process', timeline: 'Week 1' },
      { phase: 2, action: 'Identify bottlenecks', timeline: 'Week 2' },
      { phase: 3, action: 'Implement approval workflows', timeline: 'Week 3-4' },
      { phase: 4, action: 'Deploy automated purchasing', timeline: 'Month 2-3' }
    ]
  };
  
  return roadmaps[focusArea] || roadmaps.cost_reduction;
}

// MCP Server Integration
async function handleMCPRequest(tool, params) {
  if (!MCP_PURCHASE_TOOLS[tool]) {
    return {
      success: false,
      error: `Unknown tool: ${tool}`,
      available_tools: Object.keys(MCP_PURCHASE_TOOLS)
    };
  }

  try {
    const result = await MCP_PURCHASE_TOOLS[tool].handler(params);
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
  MCP_PURCHASE_TOOLS,
  handleMCPRequest,
  
  // Direct function exports for programmatic use
  tools: {
    getDailyPurchases: MCP_PURCHASE_TOOLS['get-daily-purchases'].handler,
    getTopVendors: MCP_PURCHASE_TOOLS['get-top-vendors'].handler,
    getPurchaseMetrics: MCP_PURCHASE_TOOLS['get-purchase-metrics'].handler,
    getPurchaseTrends: MCP_PURCHASE_TOOLS['get-purchase-trends'].handler,
    analyzeVendorPerformance: MCP_PURCHASE_TOOLS['analyze-vendor-performance'].handler,
    getPayablesAging: MCP_PURCHASE_TOOLS['get-payables-aging'].handler,
    analyzePurchaseEfficiency: MCP_PURCHASE_TOOLS['analyze-purchase-efficiency'].handler
  }
};

// CLI for testing MCP tools
if (require.main === module) {
  const tool = process.argv[2];
  const paramsJson = process.argv[3];

  if (!tool || !paramsJson) {
    console.log('Usage: node mcp-purchase-tools.js <tool-name> \'{"param": "value"}\'');
    console.log('\nAvailable tools:');
    Object.entries(MCP_PURCHASE_TOOLS).forEach(([name, config]) => {
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