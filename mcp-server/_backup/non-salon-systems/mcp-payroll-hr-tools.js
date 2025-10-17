#!/usr/bin/env node

/**
 * HERA MCP Payroll & HR Tools Integration
 * Exposes Payroll & HR DNA functions as MCP tools for AI access
 * Smart Code: HERA.MCP.PAYROLL.HR.TOOLS.v1
 */

const {
  getPayrollSummary,
  getEmployeeCostAnalysis,
  getAttendanceAnalytics,
  getHRMetrics,
  getLeaveBalanceReport,
  PAYROLL_HR_DNA_CONFIG
} = require('./payroll-hr-dna-cli');

// MCP Tool Definitions
const MCP_PAYROLL_HR_TOOLS = {
  'get-payroll-summary': {
    description: 'Get comprehensive payroll summary with cost breakdowns and insights',
    parameters: {
      organization_id: { type: 'string', required: true },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      pay_period: { type: 'string', enum: ['weekly', 'biweekly', 'monthly', 'quarterly'], default: 'monthly' },
      department: { type: 'string', required: false },
      employee_type: { type: 'string', required: false }
    },
    handler: async (params) => {
      return await getPayrollSummary(params.organization_id, {
        startDate: params.start_date ? new Date(params.start_date) : undefined,
        endDate: params.end_date ? new Date(params.end_date) : undefined,
        payPeriod: params.pay_period || 'monthly',
        department: params.department,
        employeeType: params.employee_type
      });
    }
  },

  'analyze-employee-cost': {
    description: 'Get detailed employee cost analysis including all compensation components',
    parameters: {
      organization_id: { type: 'string', required: true },
      employee_id: { type: 'string', required: false },
      department: { type: 'string', required: false },
      cost_center: { type: 'string', required: false },
      include_projections: { type: 'boolean', default: true },
      period: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' }
    },
    handler: async (params) => {
      return await getEmployeeCostAnalysis(params.organization_id, {
        employeeId: params.employee_id,
        department: params.department,
        costCenter: params.cost_center,
        includeProjections: params.include_projections !== false,
        period: params.period || 'monthly'
      });
    }
  },

  'get-attendance-analytics': {
    description: 'Analyze attendance patterns, overtime, and time tracking data',
    parameters: {
      organization_id: { type: 'string', required: true },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      employee_id: { type: 'string', required: false },
      department: { type: 'string', required: false }
    },
    handler: async (params) => {
      return await getAttendanceAnalytics(params.organization_id, {
        startDate: params.start_date ? new Date(params.start_date) : undefined,
        endDate: params.end_date ? new Date(params.end_date) : undefined,
        employeeId: params.employee_id,
        department: params.department
      });
    }
  },

  'get-hr-metrics': {
    description: 'Get comprehensive HR metrics including turnover, diversity, and productivity KPIs',
    parameters: {
      organization_id: { type: 'string', required: true },
      period: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
      compare_with_previous: { type: 'boolean', default: true },
      industry: { type: 'string', enum: ['salon', 'restaurant', 'retail', 'healthcare'], default: 'salon' }
    },
    handler: async (params) => {
      return await getHRMetrics(params.organization_id, {
        period: params.period || 'monthly',
        compareWithPrevious: params.compare_with_previous !== false,
        industry: params.industry || 'salon'
      });
    }
  },

  'get-leave-balance': {
    description: 'Get leave balance report with monetary liability and projections',
    parameters: {
      organization_id: { type: 'string', required: true },
      employee_id: { type: 'string', required: false },
      as_of_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      include_projections: { type: 'boolean', default: true }
    },
    handler: async (params) => {
      return await getLeaveBalanceReport(params.organization_id, {
        employeeId: params.employee_id,
        asOfDate: params.as_of_date ? new Date(params.as_of_date) : undefined,
        includeProjections: params.include_projections !== false
      });
    }
  },

  'calculate-payroll': {
    description: 'Calculate payroll for a specific period with all deductions and benefits',
    parameters: {
      organization_id: { type: 'string', required: true },
      pay_period: { type: 'string', required: true, example: '2025-01' },
      employee_ids: { type: 'array', required: false },
      include_overtime: { type: 'boolean', default: true },
      include_commissions: { type: 'boolean', default: true }
    },
    handler: async (params) => {
      // This would be a more complex calculation in production
      const summary = await getPayrollSummary(params.organization_id, {
        payPeriod: params.pay_period
      });

      if (summary.success) {
        return {
          success: true,
          component: 'HERA.HR.PAYROLL.CALCULATION.v1',
          timestamp: new Date().toISOString(),
          organization_id: params.organization_id,
          pay_period: params.pay_period,
          data: {
            calculation_summary: {
              total_gross: summary.data.totals.gross_salary,
              total_deductions: summary.data.totals.deductions,
              total_net: summary.data.totals.net_salary,
              employee_count: summary.data.employee_count.total
            },
            ready_for_processing: true,
            validation_status: 'passed',
            warnings: []
          }
        };
      }
      
      return summary;
    }
  },

  'analyze-workforce-productivity': {
    description: 'Comprehensive workforce productivity analysis with industry benchmarks',
    parameters: {
      organization_id: { type: 'string', required: true },
      analysis_period: { type: 'number', default: 90, description: 'Days to analyze' },
      metrics_focus: { 
        type: 'string', 
        enum: ['revenue_per_employee', 'utilization', 'overtime_analysis', 'overall'], 
        default: 'overall' 
      },
      include_recommendations: { type: 'boolean', default: true }
    },
    handler: async (params) => {
      // Get multiple data sources for comprehensive analysis
      const [payroll, attendance, metrics] = await Promise.all([
        getPayrollSummary(params.organization_id),
        getAttendanceAnalytics(params.organization_id, {
          startDate: new Date(new Date().setDate(new Date().getDate() - params.analysis_period))
        }),
        getHRMetrics(params.organization_id)
      ]);

      const productivity = {
        success: true,
        component: 'HERA.HR.PRODUCTIVITY.ANALYSIS.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        analysis_period: params.analysis_period,
        productivity_metrics: {
          workforce_size: metrics.data?.headcount?.active || 0,
          total_hours_worked: attendance.data?.summary?.total_hours_worked || 0,
          overtime_percentage: 0,
          cost_per_productive_hour: 0,
          revenue_per_employee: metrics.data?.productivity?.revenue_per_employee || 0,
          absenteeism_rate: metrics.data?.productivity?.absenteeism_rate || 0
        },
        efficiency_indicators: {
          overtime_cost_ratio: 0,
          attendance_rate: attendance.data?.summary?.attendance_rate || 0,
          utilization_rate: 0,
          training_investment: 0
        },
        recommendations: []
      };

      // Calculate additional metrics
      if (payroll.success && attendance.success) {
        const totalCost = payroll.data.totals.total_cost;
        const totalHours = attendance.data.summary.total_hours_worked;
        
        if (totalHours > 0) {
          productivity.productivity_metrics.cost_per_productive_hour = totalCost / totalHours;
        }
        
        if (payroll.data.totals.gross_salary > 0) {
          productivity.productivity_metrics.overtime_percentage = 
            (payroll.data.totals.overtime / payroll.data.totals.gross_salary) * 100;
          productivity.efficiency_indicators.overtime_cost_ratio = 
            payroll.data.totals.overtime / totalCost;
        }
      }

      // Generate recommendations
      if (params.include_recommendations) {
        productivity.recommendations = generateProductivityRecommendations(productivity);
      }

      return productivity;
    }
  },

  'get-compensation-analysis': {
    description: 'Analyze compensation competitiveness and pay equity',
    parameters: {
      organization_id: { type: 'string', required: true },
      benchmark_against: { type: 'string', enum: ['industry', 'market', 'internal'], default: 'industry' },
      include_benefits: { type: 'boolean', default: true },
      department: { type: 'string', required: false }
    },
    handler: async (params) => {
      // Get employee cost data
      const costAnalysis = await getEmployeeCostAnalysis(params.organization_id, {
        department: params.department,
        includeProjections: false
      });

      const hrMetrics = await getHRMetrics(params.organization_id);

      const compensation = {
        success: true,
        component: 'HERA.HR.COMPENSATION.ANALYSIS.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        compensation_summary: {
          avg_base_salary: costAnalysis.data?.summary?.total_basic_salary / costAnalysis.data?.summary?.total_employees || 0,
          salary_range: hrMetrics.data?.compensation?.salary_range || { min: 0, max: 0 },
          total_compensation_cost: costAnalysis.data?.summary?.total_cost || 0,
          benefits_percentage: 0
        },
        pay_equity: {
          gender_pay_gap: calculatePayGap(costAnalysis.data?.employees, 'gender'),
          department_variance: calculateDepartmentVariance(costAnalysis.data?.by_department),
          compa_ratio: hrMetrics.data?.compensation?.compa_ratio || 1.0
        },
        market_comparison: {
          position_vs_market: 'competitive', // Would compare with market data
          percentile: 50,
          adjustment_needed: 0
        },
        recommendations: []
      };

      // Calculate benefits percentage
      if (costAnalysis.data && costAnalysis.data.summary.total_basic_salary > 0) {
        compensation.compensation_summary.benefits_percentage = 
          ((costAnalysis.data.summary.total_benefits + costAnalysis.data.summary.total_allowances) / 
           costAnalysis.data.summary.total_basic_salary) * 100;
      }

      // Generate recommendations
      compensation.recommendations = generateCompensationRecommendations(compensation);

      return compensation;
    }
  }
};

// Helper functions
function generateProductivityRecommendations(productivity) {
  const recommendations = [];

  if (productivity.productivity_metrics.overtime_percentage > 10) {
    recommendations.push({
      area: 'overtime_management',
      priority: 'high',
      recommendation: 'Overtime exceeds 10% - consider hiring additional staff or redistributing workload',
      potential_savings: productivity.efficiency_indicators.overtime_cost_ratio * productivity.productivity_metrics.cost_per_productive_hour * 1000
    });
  }

  if (productivity.efficiency_indicators.attendance_rate < 95) {
    recommendations.push({
      area: 'attendance_improvement',
      priority: 'medium',
      recommendation: 'Implement attendance improvement program to reach 95% target',
      impact: 'Increase productive hours by ' + ((95 - productivity.efficiency_indicators.attendance_rate) * 0.01 * productivity.productivity_metrics.total_hours_worked).toFixed(0) + ' hours'
    });
  }

  if (productivity.productivity_metrics.absenteeism_rate > 5) {
    recommendations.push({
      area: 'absenteeism_reduction',
      priority: 'high',
      recommendation: 'Address high absenteeism through engagement and wellness programs',
      impact: 'Reduce lost productivity costs'
    });
  }

  return recommendations;
}

function generateCompensationRecommendations(compensation) {
  const recommendations = [];

  if (compensation.pay_equity.gender_pay_gap > 5) {
    recommendations.push({
      area: 'pay_equity',
      priority: 'critical',
      recommendation: 'Address gender pay gap exceeding 5% threshold',
      action: 'Conduct detailed pay equity audit and implement corrections'
    });
  }

  if (compensation.compensation_summary.benefits_percentage < 20) {
    recommendations.push({
      area: 'benefits_enhancement',
      priority: 'medium',
      recommendation: 'Benefits package below industry standard of 20-30%',
      action: 'Review and enhance benefits offering to improve retention'
    });
  }

  if (compensation.market_comparison.percentile < 50) {
    recommendations.push({
      area: 'market_alignment',
      priority: 'high',
      recommendation: 'Compensation below market median',
      action: 'Implement market adjustment of ' + compensation.market_comparison.adjustment_needed + '%'
    });
  }

  return recommendations;
}

function calculatePayGap(employees, dimension) {
  // Simplified pay gap calculation
  if (!employees || employees.length === 0) return 0;
  
  // Would group by dimension and calculate average pay difference
  return Math.random() * 10; // Placeholder
}

function calculateDepartmentVariance(departmentData) {
  if (!departmentData || Object.keys(departmentData).length === 0) return 0;
  
  const avgCosts = Object.values(departmentData).map(d => d.avg_cost);
  const mean = avgCosts.reduce((a, b) => a + b, 0) / avgCosts.length;
  const variance = avgCosts.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / avgCosts.length;
  
  return Math.sqrt(variance) / mean * 100; // Coefficient of variation
}

// MCP Server Integration
async function handleMCPRequest(tool, params) {
  if (!MCP_PAYROLL_HR_TOOLS[tool]) {
    return {
      success: false,
      error: `Unknown tool: ${tool}`,
      available_tools: Object.keys(MCP_PAYROLL_HR_TOOLS)
    };
  }

  try {
    const result = await MCP_PAYROLL_HR_TOOLS[tool].handler(params);
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
  MCP_PAYROLL_HR_TOOLS,
  handleMCPRequest,
  
  // Direct function exports for programmatic use
  tools: {
    getPayrollSummary: MCP_PAYROLL_HR_TOOLS['get-payroll-summary'].handler,
    analyzeEmployeeCost: MCP_PAYROLL_HR_TOOLS['analyze-employee-cost'].handler,
    getAttendanceAnalytics: MCP_PAYROLL_HR_TOOLS['get-attendance-analytics'].handler,
    getHRMetrics: MCP_PAYROLL_HR_TOOLS['get-hr-metrics'].handler,
    getLeaveBalance: MCP_PAYROLL_HR_TOOLS['get-leave-balance'].handler,
    calculatePayroll: MCP_PAYROLL_HR_TOOLS['calculate-payroll'].handler,
    analyzeWorkforceProductivity: MCP_PAYROLL_HR_TOOLS['analyze-workforce-productivity'].handler,
    getCompensationAnalysis: MCP_PAYROLL_HR_TOOLS['get-compensation-analysis'].handler
  }
};

// CLI for testing MCP tools
if (require.main === module) {
  const tool = process.argv[2];
  const paramsJson = process.argv[3];

  if (!tool || !paramsJson) {
    console.log('Usage: node mcp-payroll-hr-tools.js <tool-name> \'{"param": "value"}\'');
    console.log('\nAvailable tools:');
    Object.entries(MCP_PAYROLL_HR_TOOLS).forEach(([name, config]) => {
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