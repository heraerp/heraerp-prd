#!/usr/bin/env node

/**
 * HERA MCP Profitability Tools Integration
 * Exposes Profitability & Profit Center DNA functions as MCP tools for AI access
 * Smart Code: HERA.MCP.PROFITABILITY.TOOLS.v1
 */

const {
  getProfitCenterPnL,
  getProductProfitability,
  getCustomerProfitability,
  getContributionMarginAnalysis,
  getVarianceAnalysis,
  PROFITABILITY_DNA_CONFIG
} = require('./profitability-dna-cli');

// MCP Tool Definitions
const MCP_PROFITABILITY_TOOLS = {
  'get-profit-center-pnl': {
    description: 'Get P&L analysis by profit center with automatic cost allocations',
    parameters: {
      organization_id: { type: 'string', required: true },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      profit_center_id: { type: 'string', required: false },
      compare_previous: { type: 'boolean', default: true },
      include_allocations: { type: 'boolean', default: true }
    },
    handler: async (params) => {
      return await getProfitCenterPnL(params.organization_id, {
        startDate: params.start_date ? new Date(params.start_date) : undefined,
        endDate: params.end_date ? new Date(params.end_date) : undefined,
        profitCenterId: params.profit_center_id,
        comparePrevious: params.compare_previous !== false,
        includeAllocations: params.include_allocations !== false
      });
    }
  },

  'analyze-product-profitability': {
    description: 'Analyze profitability by product or service with margin analysis',
    parameters: {
      organization_id: { type: 'string', required: true },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      product_id: { type: 'string', required: false },
      category: { type: 'string', required: false },
      top_n: { type: 'number', default: 20 }
    },
    handler: async (params) => {
      return await getProductProfitability(params.organization_id, {
        startDate: params.start_date ? new Date(params.start_date) : undefined,
        endDate: params.end_date ? new Date(params.end_date) : undefined,
        productId: params.product_id,
        category: params.category,
        topN: params.top_n || 20
      });
    }
  },

  'analyze-customer-profitability': {
    description: 'Analyze profitability by customer with lifetime value and segmentation',
    parameters: {
      organization_id: { type: 'string', required: true },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      customer_id: { type: 'string', required: false },
      segment: { type: 'string', required: false },
      include_lifetime_value: { type: 'boolean', default: true }
    },
    handler: async (params) => {
      return await getCustomerProfitability(params.organization_id, {
        startDate: params.start_date ? new Date(params.start_date) : undefined,
        endDate: params.end_date ? new Date(params.end_date) : undefined,
        customerId: params.customer_id,
        segment: params.segment,
        includeLifetimeValue: params.include_lifetime_value !== false
      });
    }
  },

  'get-contribution-margin': {
    description: 'Analyze contribution margins with breakeven analysis',
    parameters: {
      organization_id: { type: 'string', required: true },
      dimension: { 
        type: 'string', 
        enum: ['profit_center', 'product', 'customer', 'location'], 
        default: 'profit_center' 
      },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      include_breakeven: { type: 'boolean', default: true }
    },
    handler: async (params) => {
      return await getContributionMarginAnalysis(params.organization_id, {
        dimension: params.dimension || 'profit_center',
        startDate: params.start_date ? new Date(params.start_date) : undefined,
        endDate: params.end_date ? new Date(params.end_date) : undefined,
        includeBreakeven: params.include_breakeven !== false
      });
    }
  },

  'analyze-variance': {
    description: 'Analyze budget vs actual variances with insights and action items',
    parameters: {
      organization_id: { type: 'string', required: true },
      period: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
      profit_center_id: { type: 'string', required: false },
      variance_threshold: { type: 'number', default: 5, description: 'Percentage threshold for significant variances' }
    },
    handler: async (params) => {
      return await getVarianceAnalysis(params.organization_id, {
        period: params.period || 'monthly',
        profitCenterId: params.profit_center_id,
        varianceThreshold: params.variance_threshold || 5
      });
    }
  },

  'multi-dimensional-profitability': {
    description: 'Comprehensive multi-dimensional profitability analysis across all dimensions',
    parameters: {
      organization_id: { type: 'string', required: true },
      analysis_period: { type: 'number', default: 30, description: 'Days to analyze' },
      dimensions: { 
        type: 'array', 
        default: ['profit_center', 'product', 'customer'],
        description: 'Dimensions to analyze'
      }
    },
    handler: async (params) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (params.analysis_period || 30));

      // Run multiple analyses in parallel
      const analyses = await Promise.all([
        getProfitCenterPnL(params.organization_id, { startDate, endDate }),
        getProductProfitability(params.organization_id, { startDate, endDate, topN: 10 }),
        getCustomerProfitability(params.organization_id, { startDate, endDate }),
        getContributionMarginAnalysis(params.organization_id, { startDate, endDate })
      ]);

      const [profitCenter, product, customer, contribution] = analyses;

      return {
        success: true,
        component: 'HERA.FIN.MULTI.DIMENSIONAL.PROFITABILITY.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        analysis_period: params.analysis_period,
        dimensions_analyzed: params.dimensions || ['profit_center', 'product', 'customer'],
        summary: {
          profit_center_performance: {
            total_revenue: profitCenter.data?.consolidated?.revenue || 0,
            net_margin: profitCenter.data?.consolidated?.net_margin || 0,
            profit_center_count: Object.keys(profitCenter.data?.profit_centers || {}).length
          },
          product_performance: {
            total_products: product.data?.summary?.total_products || 0,
            average_margin: product.data?.summary?.average_margin || 0,
            top_product: product.data?.summary?.top_performers?.[0] || null
          },
          customer_performance: {
            total_customers: customer.data?.summary?.total_customers || 0,
            average_value: customer.data?.summary?.average_customer_value || 0,
            pareto_rule: customer.data?.summary?.pareto_analysis?.rule_8020 || null
          },
          contribution_analysis: {
            overall_contribution_ratio: contribution.data?.summary?.overall_contribution_ratio || 0,
            total_fixed_costs: contribution.data?.summary?.total_fixed_costs || 0
          }
        },
        insights: generateMultiDimensionalInsights(analyses)
      };
    }
  },

  'profitability-optimization': {
    description: 'Get optimization recommendations based on profitability analysis',
    parameters: {
      organization_id: { type: 'string', required: true },
      focus_area: { 
        type: 'string', 
        enum: ['cost_reduction', 'revenue_growth', 'margin_improvement', 'overall'], 
        default: 'overall' 
      },
      target_improvement: { type: 'number', default: 10, description: 'Target improvement percentage' }
    },
    handler: async (params) => {
      // Get current profitability data
      const [pnl, products, customers] = await Promise.all([
        getProfitCenterPnL(params.organization_id),
        getProductProfitability(params.organization_id, { topN: 50 }),
        getCustomerProfitability(params.organization_id)
      ]);

      const optimization = {
        success: true,
        component: 'HERA.FIN.PROFITABILITY.OPTIMIZATION.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        current_state: {
          revenue: pnl.data?.consolidated?.revenue || 0,
          gross_margin: pnl.data?.consolidated?.gross_margin || 0,
          net_margin: pnl.data?.consolidated?.net_margin || 0,
          operating_expenses_ratio: 0
        },
        opportunities: [],
        recommendations: [],
        potential_impact: {
          revenue_increase: 0,
          cost_reduction: 0,
          margin_improvement: 0
        }
      };

      // Calculate current ratios
      if (pnl.data?.consolidated?.revenue > 0) {
        optimization.current_state.operating_expenses_ratio = 
          (pnl.data.consolidated.operating_expenses / pnl.data.consolidated.revenue) * 100;
      }

      // Generate optimization opportunities based on focus area
      if (params.focus_area === 'cost_reduction' || params.focus_area === 'overall') {
        optimization.opportunities.push(...generateCostReductionOpportunities(pnl.data));
      }

      if (params.focus_area === 'revenue_growth' || params.focus_area === 'overall') {
        optimization.opportunities.push(...generateRevenueGrowthOpportunities(products.data, customers.data));
      }

      if (params.focus_area === 'margin_improvement' || params.focus_area === 'overall') {
        optimization.opportunities.push(...generateMarginImprovementOpportunities(products.data));
      }

      // Calculate potential impact
      optimization.opportunities.forEach(opp => {
        if (opp.impact_type === 'revenue') {
          optimization.potential_impact.revenue_increase += opp.potential_value || 0;
        } else if (opp.impact_type === 'cost') {
          optimization.potential_impact.cost_reduction += opp.potential_value || 0;
        }
      });

      if (optimization.current_state.revenue > 0) {
        optimization.potential_impact.margin_improvement = 
          ((optimization.potential_impact.revenue_increase - optimization.potential_impact.cost_reduction) / 
           optimization.current_state.revenue) * 100;
      }

      // Generate specific recommendations
      optimization.recommendations = generateOptimizationRecommendations(
        optimization.opportunities, 
        params.target_improvement
      );

      return optimization;
    }
  },

  'breakeven-analysis': {
    description: 'Perform breakeven analysis for products, services, or profit centers',
    parameters: {
      organization_id: { type: 'string', required: true },
      analysis_type: { 
        type: 'string', 
        enum: ['product', 'service', 'profit_center', 'overall'], 
        default: 'overall' 
      },
      entity_id: { type: 'string', required: false },
      scenario_planning: { type: 'boolean', default: true }
    },
    handler: async (params) => {
      // Get contribution margin data
      const contribution = await getContributionMarginAnalysis(params.organization_id, {
        dimension: params.analysis_type === 'overall' ? 'profit_center' : params.analysis_type,
        includeBreakeven: true
      });

      const breakeven = {
        success: true,
        component: 'HERA.FIN.BREAKEVEN.ANALYSIS.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        analysis_type: params.analysis_type,
        current_analysis: {
          total_fixed_costs: contribution.data?.summary?.total_fixed_costs || 0,
          contribution_margin_ratio: contribution.data?.summary?.overall_contribution_ratio || 0,
          breakeven_revenue: 0,
          current_revenue: contribution.data?.summary?.total_revenue || 0,
          margin_of_safety: 0,
          operating_leverage: 0
        },
        by_entity: [],
        scenarios: []
      };

      // Calculate overall breakeven
      if (breakeven.current_analysis.contribution_margin_ratio > 0) {
        breakeven.current_analysis.breakeven_revenue = 
          breakeven.current_analysis.total_fixed_costs / 
          (breakeven.current_analysis.contribution_margin_ratio / 100);
        
        breakeven.current_analysis.margin_of_safety = 
          ((breakeven.current_analysis.current_revenue - breakeven.current_analysis.breakeven_revenue) / 
           breakeven.current_analysis.current_revenue) * 100;
      }

      // Extract entity-specific breakeven
      if (contribution.data?.items) {
        breakeven.by_entity = contribution.data.items.map(item => ({
          entity_id: item.dimension_id,
          entity_name: item.dimension_name,
          breakeven_units: item.breakeven_units,
          current_units: item.units_sold,
          margin_of_safety: item.margin_of_safety,
          contribution_margin_ratio: item.contribution_margin_ratio
        }));
      }

      // Generate scenarios if requested
      if (params.scenario_planning) {
        breakeven.scenarios = generateBreakevenScenarios(breakeven.current_analysis);
      }

      return breakeven;
    }
  }
};

// Helper functions
function generateMultiDimensionalInsights(analyses) {
  const insights = [];
  const [profitCenter, product, customer, contribution] = analyses;

  // Profit center insights
  if (profitCenter.success && profitCenter.data) {
    const pcCount = Object.keys(profitCenter.data.profit_centers || {}).length;
    if (pcCount > 1) {
      const margins = Object.values(profitCenter.data.profit_centers)
        .map(pc => pc.net_margin)
        .sort((a, b) => b - a);
      
      if (margins[0] - margins[margins.length - 1] > 10) {
        insights.push('Significant profitability variance across profit centers - consider best practice sharing');
      }
    }
  }

  // Product insights
  if (product.success && product.data?.summary) {
    if (product.data.summary.average_margin < 40) {
      insights.push('Average product margin below 40% - review pricing strategy or cost structure');
    }
  }

  // Customer insights
  if (customer.success && customer.data?.summary?.pareto_analysis) {
    insights.push(customer.data.summary.pareto_analysis.rule_8020.description);
  }

  // Contribution insights
  if (contribution.success && contribution.data?.summary) {
    if (contribution.data.summary.overall_contribution_ratio < 30) {
      insights.push('Low contribution margin indicates high variable costs - focus on efficiency');
    }
  }

  return insights;
}

function generateCostReductionOpportunities(pnlData) {
  const opportunities = [];

  if (!pnlData || !pnlData.consolidated) return opportunities;

  // Operating expense opportunities
  const opexRatio = (pnlData.consolidated.operating_expenses / pnlData.consolidated.revenue) * 100;
  if (opexRatio > 35) {
    opportunities.push({
      area: 'operating_expenses',
      description: `Operating expenses at ${opexRatio.toFixed(1)}% of revenue`,
      action: 'Review and optimize fixed costs',
      potential_value: pnlData.consolidated.operating_expenses * 0.1,
      impact_type: 'cost',
      priority: 'high'
    });
  }

  // COGS opportunities
  const cogsRatio = (pnlData.consolidated.cogs / pnlData.consolidated.revenue) * 100;
  if (cogsRatio > 40) {
    opportunities.push({
      area: 'cost_of_goods_sold',
      description: `COGS at ${cogsRatio.toFixed(1)}% of revenue`,
      action: 'Negotiate supplier contracts and optimize inventory',
      potential_value: pnlData.consolidated.cogs * 0.05,
      impact_type: 'cost',
      priority: 'medium'
    });
  }

  return opportunities;
}

function generateRevenueGrowthOpportunities(productData, customerData) {
  const opportunities = [];

  // Product opportunities
  if (productData?.products) {
    const highMarginProducts = productData.products.filter(p => p.gross_margin > 60);
    if (highMarginProducts.length > 0) {
      opportunities.push({
        area: 'product_mix',
        description: `${highMarginProducts.length} products have margins above 60%`,
        action: 'Focus sales efforts on high-margin products',
        potential_value: productData.summary.total_revenue * 0.05,
        impact_type: 'revenue',
        priority: 'high'
      });
    }
  }

  // Customer opportunities
  if (customerData?.segment_analysis) {
    const segments = Object.entries(customerData.segment_analysis);
    if (segments.length > 0) {
      const bestSegment = segments.sort((a, b) => b[1].avg_lifetime_value - a[1].avg_lifetime_value)[0];
      opportunities.push({
        area: 'customer_acquisition',
        description: `${bestSegment[0]} segment has highest lifetime value`,
        action: `Target marketing to acquire more ${bestSegment[0]} customers`,
        potential_value: bestSegment[1].avg_lifetime_value * 10, // 10 new customers
        impact_type: 'revenue',
        priority: 'medium'
      });
    }
  }

  return opportunities;
}

function generateMarginImprovementOpportunities(productData) {
  const opportunities = [];

  if (productData?.products) {
    const lowMarginProducts = productData.products.filter(p => p.gross_margin < 30 && p.revenue > 1000);
    if (lowMarginProducts.length > 0) {
      const totalLowMarginRevenue = lowMarginProducts.reduce((sum, p) => sum + p.revenue, 0);
      opportunities.push({
        area: 'pricing_optimization',
        description: `${lowMarginProducts.length} products have margins below 30%`,
        action: 'Implement strategic price increases or cost reductions',
        potential_value: totalLowMarginRevenue * 0.05, // 5% price increase
        impact_type: 'revenue',
        priority: 'high'
      });
    }
  }

  return opportunities;
}

function generateOptimizationRecommendations(opportunities, targetImprovement) {
  const recommendations = [];
  
  // Sort opportunities by potential value
  const sortedOpps = opportunities.sort((a, b) => b.potential_value - a.potential_value);
  
  // Group by priority
  const highPriority = sortedOpps.filter(o => o.priority === 'high');
  const mediumPriority = sortedOpps.filter(o => o.priority === 'medium');
  
  if (highPriority.length > 0) {
    recommendations.push({
      priority: 'immediate',
      focus: 'Quick wins',
      actions: highPriority.slice(0, 3).map(o => o.action),
      expected_timeline: '1-3 months',
      expected_impact: highPriority.slice(0, 3).reduce((sum, o) => sum + o.potential_value, 0)
    });
  }
  
  if (mediumPriority.length > 0) {
    recommendations.push({
      priority: 'short_term',
      focus: 'Sustainable improvements',
      actions: mediumPriority.slice(0, 3).map(o => o.action),
      expected_timeline: '3-6 months',
      expected_impact: mediumPriority.slice(0, 3).reduce((sum, o) => sum + o.potential_value, 0)
    });
  }
  
  return recommendations;
}

function generateBreakevenScenarios(currentAnalysis) {
  const scenarios = [];
  
  // Price increase scenario
  scenarios.push({
    name: 'Price Increase 5%',
    changes: { price_increase: 5 },
    new_contribution_margin: currentAnalysis.contribution_margin_ratio * 1.05,
    new_breakeven_revenue: currentAnalysis.total_fixed_costs / ((currentAnalysis.contribution_margin_ratio * 1.05) / 100),
    impact: 'Lower breakeven point, higher margins'
  });
  
  // Cost reduction scenario
  scenarios.push({
    name: 'Fixed Cost Reduction 10%',
    changes: { fixed_cost_reduction: 10 },
    new_fixed_costs: currentAnalysis.total_fixed_costs * 0.9,
    new_breakeven_revenue: (currentAnalysis.total_fixed_costs * 0.9) / (currentAnalysis.contribution_margin_ratio / 100),
    impact: 'Lower breakeven point, improved profitability'
  });
  
  // Volume increase scenario
  scenarios.push({
    name: 'Volume Increase 20%',
    changes: { volume_increase: 20 },
    new_revenue: currentAnalysis.current_revenue * 1.2,
    margin_of_safety: ((currentAnalysis.current_revenue * 1.2 - currentAnalysis.breakeven_revenue) / (currentAnalysis.current_revenue * 1.2)) * 100,
    impact: 'Higher margin of safety, economies of scale'
  });
  
  return scenarios;
}

// MCP Server Integration
async function handleMCPRequest(tool, params) {
  if (!MCP_PROFITABILITY_TOOLS[tool]) {
    return {
      success: false,
      error: `Unknown tool: ${tool}`,
      available_tools: Object.keys(MCP_PROFITABILITY_TOOLS)
    };
  }

  try {
    const result = await MCP_PROFITABILITY_TOOLS[tool].handler(params);
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
  MCP_PROFITABILITY_TOOLS,
  handleMCPRequest,
  
  // Direct function exports for programmatic use
  tools: {
    getProfitCenterPnL: MCP_PROFITABILITY_TOOLS['get-profit-center-pnl'].handler,
    analyzeProductProfitability: MCP_PROFITABILITY_TOOLS['analyze-product-profitability'].handler,
    analyzeCustomerProfitability: MCP_PROFITABILITY_TOOLS['analyze-customer-profitability'].handler,
    getContributionMargin: MCP_PROFITABILITY_TOOLS['get-contribution-margin'].handler,
    analyzeVariance: MCP_PROFITABILITY_TOOLS['analyze-variance'].handler,
    multiDimensionalProfitability: MCP_PROFITABILITY_TOOLS['multi-dimensional-profitability'].handler,
    profitabilityOptimization: MCP_PROFITABILITY_TOOLS['profitability-optimization'].handler,
    breakevenAnalysis: MCP_PROFITABILITY_TOOLS['breakeven-analysis'].handler
  }
};

// CLI for testing MCP tools
if (require.main === module) {
  const tool = process.argv[2];
  const paramsJson = process.argv[3];

  if (!tool || !paramsJson) {
    console.log('Usage: node mcp-profitability-tools.js <tool-name> \'{"param": "value"}\'');
    console.log('\nAvailable tools:');
    Object.entries(MCP_PROFITABILITY_TOOLS).forEach(([name, config]) => {
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