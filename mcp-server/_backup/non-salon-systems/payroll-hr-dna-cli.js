#!/usr/bin/env node

// ================================================================================
// HERA UNIVERSAL PAYROLL & HR ANALYTICS DNA CLI TOOL
// Command-line interface for Payroll Processing and HR Analytics
// Smart Code: HERA.HR.PAYROLL.DNA.CLI.v1
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
// PAYROLL & HR DNA CONFIGURATION
// ================================================================================

const PAYROLL_HR_DNA_CONFIG = {
  // Universal DNA Component Definition
  component_id: 'HERA.HR.PAYROLL.ENGINE.v1',
  component_name: 'Universal Payroll & HR Analytics Engine',
  version: '1.0.0',
  
  // Core capabilities
  capabilities: [
    'Multi-Country Payroll Processing',
    'Employee Compensation Analytics',
    'Attendance & Time Tracking',
    'Leave Management Analytics',
    'Benefits Administration',
    'Tax Withholding Calculations',
    'Statutory Compliance Reporting',
    'HR Metrics & KPIs',
    'Organizational Analytics',
    'MCP Integration for AI-Powered HR Insights'
  ],
  
  // Country configurations (focused on UAE for Hair Talkz)
  countries: {
    uae: {
      name: 'United Arab Emirates',
      currency: 'AED',
      workweek: {
        days: 5,
        hours_per_day: 8,
        weekly_hours: 40,
        weekend: ['friday', 'saturday']
      },
      statutory_deductions: {
        'pension_nationals': {
          name: 'Pension (UAE Nationals)',
          employee_rate: 5,
          employer_rate: 12.5,
          applies_to: 'nationals_only',
          max_salary: 50000 // Monthly cap
        },
        'pension_gcc': {
          name: 'Pension (GCC Nationals)',
          employee_rate: 5,
          employer_rate: 12.5,
          applies_to: 'gcc_nationals',
          max_salary: 50000
        }
      },
      leave_entitlements: {
        'annual_leave': {
          name: 'Annual Leave',
          days_per_year: 30,
          accrual_method: 'monthly',
          carry_forward: true,
          max_carry_forward: 60
        },
        'sick_leave': {
          name: 'Sick Leave',
          days_per_year: 90,
          paid_days: 15,
          half_paid_days: 30,
          unpaid_days: 45
        },
        'maternity_leave': {
          name: 'Maternity Leave',
          days: 60,
          paid_days: 45,
          half_paid_days: 15
        }
      },
      gratuity_rules: {
        'less_than_1_year': { days_per_year: 0 },
        '1_to_5_years': { days_per_year: 21 },
        'more_than_5_years': { days_per_year: 30 }
      },
      overtime_rules: {
        'regular_overtime': { multiplier: 1.25 },
        'night_overtime': { multiplier: 1.5 },
        'holiday_overtime': { multiplier: 2.0 }
      },
      smart_codes: {
        payroll_run: 'HERA.HR.UAE.PAYROLL.RUN.v1',
        employee_cost: 'HERA.HR.UAE.EMPLOYEE.COST.v1',
        compliance_report: 'HERA.HR.UAE.COMPLIANCE.v1'
      }
    },
    usa: {
      name: 'United States',
      currency: 'USD',
      workweek: {
        days: 5,
        hours_per_day: 8,
        weekly_hours: 40,
        weekend: ['saturday', 'sunday']
      },
      statutory_deductions: {
        'federal_income_tax': { name: 'Federal Income Tax', variable: true },
        'social_security': { name: 'Social Security', employee_rate: 6.2, max_salary: 160200 },
        'medicare': { name: 'Medicare', employee_rate: 1.45 },
        'state_income_tax': { name: 'State Income Tax', variable: true }
      }
    }
  },
  
  // Industry-specific configurations
  industries: {
    salon: {
      name: 'Salon & Beauty',
      typical_roles: ['stylist', 'colorist', 'receptionist', 'manager', 'cleaner'],
      commission_based: true,
      tip_tracking: true,
      product_commission: true,
      service_commission: true,
      kpis: [
        'revenue_per_employee',
        'service_utilization',
        'commission_percentage',
        'employee_retention',
        'training_hours'
      ]
    },
    restaurant: {
      name: 'Restaurant & Hospitality',
      typical_roles: ['chef', 'server', 'host', 'manager', 'dishwasher'],
      tip_tracking: true,
      shift_differential: true,
      meal_allowance: true
    },
    retail: {
      name: 'Retail',
      typical_roles: ['sales_associate', 'cashier', 'manager', 'stock_clerk'],
      commission_based: true,
      sales_targets: true
    }
  }
};

// ================================================================================
// CORE PAYROLL & HR FUNCTIONS
// ================================================================================

/**
 * Get Payroll Summary for Organization
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Payroll summary with totals and breakdowns
 */
async function getPayrollSummary(organizationId, options = {}) {
  try {
    const { 
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate = new Date(),
      payPeriod = 'monthly',
      department = null,
      employeeType = null
    } = options;

    // Get employees
    let employeeQuery = supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee')
      .eq('status', 'active');

    const { data: employees, error: empError } = await employeeQuery;
    if (empError) throw empError;

    // Get payroll transactions
    const { data: payrollTxns, error: txnError } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines(*)
      `)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'payroll')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (txnError) throw txnError;

    // Calculate summary
    const summary = {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: payPeriod
      },
      totals: {
        gross_salary: 0,
        basic_salary: 0,
        allowances: 0,
        commissions: 0,
        overtime: 0,
        deductions: 0,
        net_salary: 0,
        employer_contributions: 0,
        total_cost: 0
      },
      employee_count: {
        total: employees?.length || 0,
        by_type: {},
        by_department: {}
      },
      average_metrics: {
        avg_gross_salary: 0,
        avg_net_salary: 0,
        avg_deduction_rate: 0,
        avg_cost_per_employee: 0
      },
      statutory_summary: {
        total_pension: 0,
        total_tax: 0,
        total_insurance: 0
      }
    };

    // Process payroll transactions
    payrollTxns?.forEach(txn => {
      const lines = txn.universal_transaction_lines || [];
      
      lines.forEach(line => {
        const lineType = line.metadata?.component_type;
        const amount = parseFloat(line.line_amount || 0);
        
        switch(lineType) {
          case 'basic_salary':
            summary.totals.basic_salary += amount;
            break;
          case 'allowance':
            summary.totals.allowances += amount;
            break;
          case 'commission':
            summary.totals.commissions += amount;
            break;
          case 'overtime':
            summary.totals.overtime += amount;
            break;
          case 'deduction':
            summary.totals.deductions += Math.abs(amount);
            break;
          case 'employer_contribution':
            summary.totals.employer_contributions += amount;
            break;
        }
      });
      
      summary.totals.gross_salary = summary.totals.basic_salary + 
                                     summary.totals.allowances + 
                                     summary.totals.commissions + 
                                     summary.totals.overtime;
      summary.totals.net_salary = summary.totals.gross_salary - summary.totals.deductions;
      summary.totals.total_cost = summary.totals.gross_salary + summary.totals.employer_contributions;
    });

    // Calculate averages
    if (summary.employee_count.total > 0) {
      summary.average_metrics.avg_gross_salary = summary.totals.gross_salary / summary.employee_count.total;
      summary.average_metrics.avg_net_salary = summary.totals.net_salary / summary.employee_count.total;
      summary.average_metrics.avg_deduction_rate = (summary.totals.deductions / summary.totals.gross_salary) * 100;
      summary.average_metrics.avg_cost_per_employee = summary.totals.total_cost / summary.employee_count.total;
    }

    // Add insights
    const insights = generatePayrollInsights(summary);

    return {
      success: true,
      component: 'HERA.HR.PAYROLL.SUMMARY.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: summary,
      insights
    };

  } catch (error) {
    console.error('Error in getPayrollSummary:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.HR.PAYROLL.SUMMARY.v1'
    };
  }
}

/**
 * Calculate Employee Cost Analysis
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Detailed employee cost breakdown
 */
async function getEmployeeCostAnalysis(organizationId, options = {}) {
  try {
    const {
      employeeId = null,
      department = null,
      costCenter = null,
      includeProjections = true,
      period = 'monthly'
    } = options;

    // Get employees with their compensation data
    let query = supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee');

    if (employeeId) {
      query = query.eq('id', employeeId);
    }

    const { data: employees, error } = await query;
    if (error) throw error;

    const costAnalysis = {
      period: period,
      currency: 'AED',
      employees: [],
      summary: {
        total_employees: 0,
        total_basic_salary: 0,
        total_allowances: 0,
        total_benefits: 0,
        total_employer_costs: 0,
        total_cost: 0
      },
      by_department: {},
      by_role: {},
      cost_breakdown: {
        direct_costs: {
          basic_salary: 0,
          allowances: 0,
          overtime: 0,
          commissions: 0
        },
        indirect_costs: {
          benefits: 0,
          insurance: 0,
          training: 0,
          equipment: 0
        },
        statutory_costs: {
          pension: 0,
          gratuity_accrual: 0,
          other_statutory: 0
        }
      }
    };

    // Process each employee
    for (const employee of employees || []) {
      const dynamicData = employee.core_dynamic_data || [];
      const empCost = calculateEmployeeCost(employee, dynamicData);
      
      costAnalysis.employees.push(empCost);
      
      // Update summary
      costAnalysis.summary.total_employees++;
      costAnalysis.summary.total_basic_salary += empCost.basic_salary;
      costAnalysis.summary.total_allowances += empCost.total_allowances;
      costAnalysis.summary.total_benefits += empCost.total_benefits;
      costAnalysis.summary.total_employer_costs += empCost.employer_costs;
      costAnalysis.summary.total_cost += empCost.total_cost;
      
      // Department breakdown
      const dept = empCost.department || 'unassigned';
      if (!costAnalysis.by_department[dept]) {
        costAnalysis.by_department[dept] = {
          employee_count: 0,
          total_cost: 0,
          avg_cost: 0
        };
      }
      costAnalysis.by_department[dept].employee_count++;
      costAnalysis.by_department[dept].total_cost += empCost.total_cost;
    }

    // Calculate department averages
    Object.keys(costAnalysis.by_department).forEach(dept => {
      const deptData = costAnalysis.by_department[dept];
      deptData.avg_cost = deptData.total_cost / deptData.employee_count;
    });

    // Add projections if requested
    if (includeProjections) {
      costAnalysis.projections = generateCostProjections(costAnalysis, period);
    }

    // Generate insights
    const insights = generateCostInsights(costAnalysis);

    return {
      success: true,
      component: 'HERA.HR.EMPLOYEE.COST.ANALYSIS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: costAnalysis,
      insights
    };

  } catch (error) {
    console.error('Error in getEmployeeCostAnalysis:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.HR.EMPLOYEE.COST.ANALYSIS.v1'
    };
  }
}

/**
 * Get Attendance & Time Analytics
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Attendance patterns and time tracking analytics
 */
async function getAttendanceAnalytics(organizationId, options = {}) {
  try {
    const {
      startDate = new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate = new Date(),
      employeeId = null,
      department = null
    } = options;

    // Get attendance transactions
    let query = supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines(*)
      `)
      .eq('organization_id', organizationId)
      .in('transaction_type', ['attendance', 'time_clock', 'leave'])
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (employeeId) {
      query = query.eq('from_entity_id', employeeId);
    }

    const { data: attendanceData, error } = await query;
    if (error) throw error;

    // Process attendance data
    const analytics = {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        total_days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      },
      summary: {
        total_employees: 0,
        total_working_days: 0,
        total_hours_worked: 0,
        total_overtime_hours: 0,
        total_leave_days: 0,
        average_hours_per_day: 0,
        attendance_rate: 0
      },
      by_employee: {},
      by_department: {},
      patterns: {
        early_arrivals: 0,
        late_arrivals: 0,
        early_departures: 0,
        perfect_attendance: 0
      },
      leave_summary: {
        annual_leave: 0,
        sick_leave: 0,
        other_leave: 0
      },
      overtime_analysis: {
        total_overtime_hours: 0,
        employees_with_overtime: 0,
        avg_overtime_per_employee: 0,
        overtime_cost: 0
      }
    };

    // Process each attendance record
    const employeeAttendance = {};
    
    attendanceData?.forEach(record => {
      const empId = record.from_entity_id;
      const empName = 'Employee'; // We'll get the name from employee query later
      
      if (!employeeAttendance[empId]) {
        employeeAttendance[empId] = {
          employee_id: empId,
          employee_name: empName,
          total_days: 0,
          total_hours: 0,
          overtime_hours: 0,
          leave_days: 0,
          late_arrivals: 0,
          early_departures: 0
        };
      }
      
      const empData = employeeAttendance[empId];
      
      if (record.transaction_type === 'attendance' || record.transaction_type === 'time_clock') {
        empData.total_days++;
        
        // Calculate hours from transaction lines
        const lines = record.universal_transaction_lines || [];
        lines.forEach(line => {
          if (line.metadata?.hours_worked) {
            empData.total_hours += parseFloat(line.metadata.hours_worked);
            analytics.summary.total_hours_worked += parseFloat(line.metadata.hours_worked);
          }
          if (line.metadata?.overtime_hours) {
            empData.overtime_hours += parseFloat(line.metadata.overtime_hours);
            analytics.summary.total_overtime_hours += parseFloat(line.metadata.overtime_hours);
          }
        });
      } else if (record.transaction_type === 'leave') {
        empData.leave_days++;
        analytics.summary.total_leave_days++;
        
        const leaveType = record.metadata?.leave_type || 'other';
        analytics.leave_summary[leaveType] = (analytics.leave_summary[leaveType] || 0) + 1;
      }
    });

    // Calculate summary metrics
    analytics.summary.total_employees = Object.keys(employeeAttendance).length;
    analytics.by_employee = employeeAttendance;
    
    if (analytics.summary.total_employees > 0) {
      analytics.summary.average_hours_per_day = 
        analytics.summary.total_hours_worked / analytics.summary.total_working_days;
      
      analytics.summary.attendance_rate = 
        ((analytics.summary.total_working_days - analytics.summary.total_leave_days) / 
         analytics.summary.total_working_days) * 100;
    }

    // Generate insights
    const insights = generateAttendanceInsights(analytics);

    return {
      success: true,
      component: 'HERA.HR.ATTENDANCE.ANALYTICS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: analytics,
      insights
    };

  } catch (error) {
    console.error('Error in getAttendanceAnalytics:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.HR.ATTENDANCE.ANALYTICS.v1'
    };
  }
}

/**
 * Get HR Metrics & KPIs
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Comprehensive HR metrics and KPIs
 */
async function getHRMetrics(organizationId, options = {}) {
  try {
    const {
      period = 'monthly',
      compareWithPrevious = true,
      industry = 'salon'
    } = options;

    // Get all employees with their history
    const { data: employees, error: empError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee');

    if (empError) throw empError;

    // Calculate date ranges
    const currentPeriodEnd = new Date();
    const currentPeriodStart = new Date();
    if (period === 'monthly') {
      currentPeriodStart.setMonth(currentPeriodStart.getMonth() - 1);
    } else if (period === 'quarterly') {
      currentPeriodStart.setMonth(currentPeriodStart.getMonth() - 3);
    } else if (period === 'yearly') {
      currentPeriodStart.setFullYear(currentPeriodStart.getFullYear() - 1);
    }

    // Calculate metrics
    const metrics = {
      period: {
        type: period,
        start: currentPeriodStart.toISOString().split('T')[0],
        end: currentPeriodEnd.toISOString().split('T')[0]
      },
      headcount: {
        total: employees?.length || 0,
        active: employees?.filter(e => e.status === 'active').length || 0,
        new_hires: 0,
        terminations: 0,
        net_change: 0
      },
      turnover: {
        voluntary_turnover_rate: 0,
        involuntary_turnover_rate: 0,
        total_turnover_rate: 0,
        avg_tenure_months: 0,
        retention_rate: 0
      },
      diversity: {
        gender_distribution: {},
        nationality_distribution: {},
        age_distribution: {},
        department_distribution: {}
      },
      compensation: {
        total_payroll_cost: 0,
        avg_salary: 0,
        salary_range: { min: 0, max: 0 },
        compa_ratio: 0,
        pay_equity_score: 0
      },
      productivity: {
        revenue_per_employee: 0,
        profit_per_employee: 0,
        absenteeism_rate: 0,
        overtime_percentage: 0
      },
      engagement: {
        training_hours_per_employee: 0,
        internal_promotion_rate: 0,
        employee_referral_rate: 0
      }
    };

    // Process employee data for metrics
    let totalTenure = 0;
    let salaryData = [];
    
    employees?.forEach(emp => {
      const dynamicData = emp.core_dynamic_data || [];
      
      // Extract employee info from dynamic data
      const salary = getDynamicValue(dynamicData, 'basic_salary', 'number') || 0;
      const hireDate = getDynamicValue(dynamicData, 'hire_date', 'date');
      const gender = getDynamicValue(dynamicData, 'gender', 'text');
      const nationality = getDynamicValue(dynamicData, 'nationality', 'text');
      const department = getDynamicValue(dynamicData, 'department', 'text');
      
      if (salary > 0) {
        salaryData.push(salary);
        metrics.compensation.total_payroll_cost += salary;
      }
      
      if (hireDate) {
        const tenure = calculateTenureMonths(new Date(hireDate));
        totalTenure += tenure;
        
        // Check if new hire
        if (new Date(hireDate) >= currentPeriodStart) {
          metrics.headcount.new_hires++;
        }
      }
      
      // Update distributions
      if (gender) {
        metrics.diversity.gender_distribution[gender] = 
          (metrics.diversity.gender_distribution[gender] || 0) + 1;
      }
      if (nationality) {
        metrics.diversity.nationality_distribution[nationality] = 
          (metrics.diversity.nationality_distribution[nationality] || 0) + 1;
      }
      if (department) {
        metrics.diversity.department_distribution[department] = 
          (metrics.diversity.department_distribution[department] || 0) + 1;
      }
    });

    // Calculate final metrics
    if (metrics.headcount.active > 0) {
      metrics.turnover.avg_tenure_months = totalTenure / metrics.headcount.active;
      metrics.compensation.avg_salary = metrics.compensation.total_payroll_cost / metrics.headcount.active;
      
      if (salaryData.length > 0) {
        metrics.compensation.salary_range.min = Math.min(...salaryData);
        metrics.compensation.salary_range.max = Math.max(...salaryData);
      }
    }

    // Calculate turnover rates
    const avgHeadcount = metrics.headcount.active;
    if (avgHeadcount > 0) {
      metrics.turnover.total_turnover_rate = (metrics.headcount.terminations / avgHeadcount) * 100;
      metrics.turnover.retention_rate = 100 - metrics.turnover.total_turnover_rate;
    }

    // Industry benchmarks
    const benchmarks = getIndustryBenchmarks(industry);
    
    // Generate insights
    const insights = generateHRInsights(metrics, benchmarks);

    return {
      success: true,
      component: 'HERA.HR.METRICS.KPI.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: metrics,
      benchmarks,
      insights
    };

  } catch (error) {
    console.error('Error in getHRMetrics:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.HR.METRICS.KPI.v1'
    };
  }
}

/**
 * Get Leave Balance Report
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Leave balances and utilization
 */
async function getLeaveBalanceReport(organizationId, options = {}) {
  try {
    const {
      employeeId = null,
      asOfDate = new Date(),
      includeProjections = true
    } = options;

    // Get employees and their leave entitlements
    let query = supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee')
      .eq('status', 'active');

    if (employeeId) {
      query = query.eq('id', employeeId);
    }

    const { data: employees, error: empError } = await query;
    if (empError) throw empError;

    // Get leave transactions
    const { data: leaveTxns, error: leaveError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'leave')
      .lte('transaction_date', asOfDate.toISOString());

    if (leaveError) throw leaveError;

    // Calculate leave balances
    const leaveReport = {
      as_of_date: asOfDate.toISOString().split('T')[0],
      currency: 'AED',
      employees: [],
      summary: {
        total_employees: employees?.length || 0,
        total_leave_liability: 0,
        avg_leave_balance: 0,
        high_balance_count: 0,
        expiring_soon: 0
      },
      by_leave_type: {
        annual_leave: { total_balance: 0, total_liability: 0 },
        sick_leave: { total_balance: 0, total_liability: 0 },
        other_leave: { total_balance: 0, total_liability: 0 }
      }
    };

    // Process each employee
    employees?.forEach(emp => {
      const dynamicData = emp.core_dynamic_data || [];
      const empLeaveBalance = calculateLeaveBalance(emp, dynamicData, leaveTxns);
      
      leaveReport.employees.push(empLeaveBalance);
      
      // Update summary
      Object.entries(empLeaveBalance.balances).forEach(([leaveType, balance]) => {
        leaveReport.by_leave_type[leaveType].total_balance += balance.days_available;
        leaveReport.by_leave_type[leaveType].total_liability += balance.monetary_value;
        leaveReport.summary.total_leave_liability += balance.monetary_value;
      });
      
      // Check for high balances and expiring leave
      if (empLeaveBalance.total_balance > 45) {
        leaveReport.summary.high_balance_count++;
      }
      if (empLeaveBalance.days_expiring_soon > 0) {
        leaveReport.summary.expiring_soon++;
      }
    });

    // Calculate averages
    if (leaveReport.summary.total_employees > 0) {
      leaveReport.summary.avg_leave_balance = 
        Object.values(leaveReport.by_leave_type).reduce((sum, lt) => sum + lt.total_balance, 0) / 
        leaveReport.summary.total_employees;
    }

    // Add projections
    if (includeProjections) {
      leaveReport.projections = generateLeaveProjections(leaveReport);
    }

    // Generate insights
    const insights = generateLeaveInsights(leaveReport);

    return {
      success: true,
      component: 'HERA.HR.LEAVE.BALANCE.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: leaveReport,
      insights
    };

  } catch (error) {
    console.error('Error in getLeaveBalanceReport:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.HR.LEAVE.BALANCE.v1'
    };
  }
}

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

function calculateEmployeeCost(employee, dynamicData) {
  const cost = {
    employee_id: employee.id,
    employee_name: employee.entity_name,
    employee_code: employee.entity_code,
    department: getDynamicValue(dynamicData, 'department', 'text') || 'unassigned',
    role: getDynamicValue(dynamicData, 'role', 'text') || 'unspecified',
    basic_salary: getDynamicValue(dynamicData, 'basic_salary', 'number') || 0,
    housing_allowance: getDynamicValue(dynamicData, 'housing_allowance', 'number') || 0,
    transport_allowance: getDynamicValue(dynamicData, 'transport_allowance', 'number') || 0,
    other_allowances: getDynamicValue(dynamicData, 'other_allowances', 'number') || 0,
    total_allowances: 0,
    total_benefits: 0,
    employer_costs: 0,
    total_cost: 0
  };

  // Calculate total allowances
  cost.total_allowances = cost.housing_allowance + cost.transport_allowance + cost.other_allowances;

  // Calculate employer costs (UAE specific)
  const nationality = getDynamicValue(dynamicData, 'nationality', 'text') || 'other';
  if (nationality === 'UAE' || nationality.includes('GCC')) {
    // Pension contribution for nationals
    cost.employer_costs += Math.min(cost.basic_salary * 0.125, 6250); // 12.5% capped at 50K monthly
  }

  // Gratuity accrual (simplified)
  const hireDate = getDynamicValue(dynamicData, 'hire_date', 'date');
  if (hireDate) {
    const yearsOfService = (new Date() - new Date(hireDate)) / (365 * 24 * 60 * 60 * 1000);
    const dailyRate = cost.basic_salary / 30;
    if (yearsOfService < 1) {
      cost.employer_costs += 0; // No gratuity
    } else if (yearsOfService <= 5) {
      cost.employer_costs += (21 * dailyRate) / 12; // 21 days per year, monthly accrual
    } else {
      cost.employer_costs += (30 * dailyRate) / 12; // 30 days per year, monthly accrual
    }
  }

  // Total cost calculation
  cost.total_cost = cost.basic_salary + cost.total_allowances + cost.total_benefits + cost.employer_costs;

  return cost;
}

function calculateLeaveBalance(employee, dynamicData, leaveTxns) {
  const hireDate = getDynamicValue(dynamicData, 'hire_date', 'date');
  const salary = getDynamicValue(dynamicData, 'basic_salary', 'number') || 0;
  const dailyRate = salary / 30;
  
  const balance = {
    employee_id: employee.id,
    employee_name: employee.entity_name,
    hire_date: hireDate,
    balances: {
      annual_leave: {
        entitled: 30, // UAE standard
        taken: 0,
        days_available: 30,
        monetary_value: 0
      },
      sick_leave: {
        entitled: 90,
        taken: 0,
        days_available: 90,
        monetary_value: 0
      }
    },
    total_balance: 0,
    total_liability: 0,
    days_expiring_soon: 0
  };

  // Count leave taken
  leaveTxns?.filter(txn => txn.from_entity_id === employee.id).forEach(txn => {
    const leaveType = txn.metadata?.leave_type || 'annual_leave';
    const days = parseFloat(txn.metadata?.days || 1);
    
    if (balance.balances[leaveType]) {
      balance.balances[leaveType].taken += days;
      balance.balances[leaveType].days_available -= days;
    }
  });

  // Calculate monetary values
  balance.balances.annual_leave.monetary_value = balance.balances.annual_leave.days_available * dailyRate;
  balance.balances.sick_leave.monetary_value = Math.min(15, balance.balances.sick_leave.days_available) * dailyRate;

  // Total calculations
  balance.total_balance = balance.balances.annual_leave.days_available + balance.balances.sick_leave.days_available;
  balance.total_liability = balance.balances.annual_leave.monetary_value + balance.balances.sick_leave.monetary_value;

  // Check for expiring leave (>45 days annual leave)
  if (balance.balances.annual_leave.days_available > 45) {
    balance.days_expiring_soon = balance.balances.annual_leave.days_available - 45;
  }

  return balance;
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

function calculateTenureMonths(hireDate) {
  const months = (new Date() - hireDate) / (30 * 24 * 60 * 60 * 1000);
  return Math.floor(months);
}

function generatePayrollInsights(summary) {
  const insights = [];
  
  if (summary.average_metrics.avg_deduction_rate > 20) {
    insights.push('High deduction rate detected - review statutory compliance and voluntary deductions');
  }
  
  if (summary.totals.overtime > summary.totals.basic_salary * 0.1) {
    insights.push('Overtime costs exceed 10% of basic salary - consider staffing adjustments');
  }
  
  if (summary.totals.commissions > summary.totals.basic_salary * 0.3) {
    insights.push('Commission-heavy compensation structure - ensure alignment with business goals');
  }
  
  return insights;
}

function generateCostInsights(costAnalysis) {
  const insights = [];
  
  const highestDept = Object.entries(costAnalysis.by_department)
    .sort((a, b) => b[1].avg_cost - a[1].avg_cost)[0];
  
  if (highestDept) {
    insights.push(`${highestDept[0]} department has highest average cost at ${highestDept[1].avg_cost.toFixed(0)} AED`);
  }
  
  if (costAnalysis.summary.total_employer_costs > costAnalysis.summary.total_basic_salary * 0.25) {
    insights.push('Employer costs exceed 25% of basic salary - review benefits structure');
  }
  
  return insights;
}

function generateAttendanceInsights(analytics) {
  const insights = [];
  
  if (analytics.summary.attendance_rate < 95) {
    insights.push(`Attendance rate at ${analytics.summary.attendance_rate.toFixed(1)}% - below target of 95%`);
  }
  
  if (analytics.summary.total_overtime_hours > analytics.summary.total_hours_worked * 0.1) {
    insights.push('Overtime exceeds 10% of regular hours - review workload distribution');
  }
  
  if (analytics.patterns.late_arrivals > analytics.summary.total_working_days * 0.05) {
    insights.push('Late arrivals affecting productivity - consider flexible working hours');
  }
  
  return insights;
}

function generateHRInsights(metrics, benchmarks) {
  const insights = [];
  
  if (metrics.turnover.total_turnover_rate > benchmarks.turnover_rate) {
    insights.push(`Turnover rate ${metrics.turnover.total_turnover_rate.toFixed(1)}% exceeds industry benchmark of ${benchmarks.turnover_rate}%`);
  }
  
  if (metrics.headcount.new_hires > metrics.headcount.terminations * 2) {
    insights.push('Rapid growth phase - ensure onboarding processes can scale');
  }
  
  if (metrics.diversity.gender_distribution && Object.keys(metrics.diversity.gender_distribution).length < 2) {
    insights.push('Low gender diversity - consider inclusive recruitment strategies');
  }
  
  return insights;
}

function generateLeaveInsights(leaveReport) {
  const insights = [];
  
  if (leaveReport.summary.high_balance_count > leaveReport.summary.total_employees * 0.2) {
    insights.push('20% of employees have high leave balances - encourage planned time off');
  }
  
  if (leaveReport.summary.total_leave_liability > 0) {
    insights.push(`Total leave liability of ${leaveReport.summary.total_leave_liability.toFixed(0)} AED should be provisioned`);
  }
  
  if (leaveReport.summary.expiring_soon > 0) {
    insights.push(`${leaveReport.summary.expiring_soon} employees have leave expiring soon`);
  }
  
  return insights;
}

function generateCostProjections(costAnalysis, period) {
  const multiplier = period === 'monthly' ? 12 : period === 'quarterly' ? 4 : 1;
  
  return {
    annual_projection: costAnalysis.summary.total_cost * multiplier,
    with_increment: costAnalysis.summary.total_cost * multiplier * 1.05, // 5% increment
    with_new_hires: costAnalysis.summary.total_cost * multiplier * 1.1, // 10% growth
    cost_per_employee_trend: 'increasing' // Would calculate from historical data
  };
}

function generateLeaveProjections(leaveReport) {
  return {
    year_end_liability: leaveReport.summary.total_leave_liability * 1.2, // 20% increase
    employees_at_max_balance: Math.floor(leaveReport.summary.high_balance_count * 1.5),
    recommended_provision: leaveReport.summary.total_leave_liability * 1.3
  };
}

function getIndustryBenchmarks(industry) {
  const benchmarks = {
    salon: {
      turnover_rate: 35, // Higher in service industry
      avg_tenure_months: 18,
      overtime_percentage: 5,
      training_hours: 40,
      revenue_per_employee: 120000 // Annual
    },
    restaurant: {
      turnover_rate: 75,
      avg_tenure_months: 12,
      overtime_percentage: 10,
      training_hours: 20,
      revenue_per_employee: 80000
    },
    retail: {
      turnover_rate: 60,
      avg_tenure_months: 15,
      overtime_percentage: 8,
      training_hours: 30,
      revenue_per_employee: 150000
    }
  };
  
  return benchmarks[industry] || benchmarks.salon;
}

// ================================================================================
// CLI INTERFACE
// ================================================================================

async function main() {
  console.log('🧬 HERA PAYROLL & HR ANALYTICS DNA CLI');
  console.log('=====================================\n');

  if (!command) {
    console.log('Available commands:');
    console.log('  payroll-summary [orgId]     - Get payroll summary');
    console.log('  employee-cost [orgId]       - Employee cost analysis');
    console.log('  attendance [orgId]          - Attendance analytics');
    console.log('  hr-metrics [orgId]          - HR metrics & KPIs');
    console.log('  leave-balance [orgId]       - Leave balance report');
    console.log('  test                        - Run with Hair Talkz demo data');
    console.log('\nExample: node payroll-hr-dna-cli.js payroll-summary');
    process.exit(0);
  }

  const orgId = process.argv[3] || organizationId;

  if (!orgId && command !== 'test') {
    console.error('❌ Organization ID required. Set DEFAULT_ORGANIZATION_ID in .env or pass as argument.');
    process.exit(1);
  }

  try {
    switch(command) {
      case 'payroll-summary':
        console.log('📊 Fetching payroll summary...\n');
        const payrollResult = await getPayrollSummary(orgId);
        console.log(JSON.stringify(payrollResult, null, 2));
        break;

      case 'employee-cost':
        console.log('💰 Analyzing employee costs...\n');
        const costResult = await getEmployeeCostAnalysis(orgId);
        console.log(JSON.stringify(costResult, null, 2));
        break;

      case 'attendance':
        console.log('⏰ Analyzing attendance data...\n');
        const attendanceResult = await getAttendanceAnalytics(orgId);
        console.log(JSON.stringify(attendanceResult, null, 2));
        break;

      case 'hr-metrics':
        console.log('📈 Calculating HR metrics...\n');
        const metricsResult = await getHRMetrics(orgId);
        console.log(JSON.stringify(metricsResult, null, 2));
        break;

      case 'leave-balance':
        console.log('🏖️ Generating leave balance report...\n');
        const leaveResult = await getLeaveBalanceReport(orgId);
        console.log(JSON.stringify(leaveResult, null, 2));
        break;

      case 'test':
        console.log('🧪 Running test with Hair Talkz organizations...\n');
        for (const org of HAIR_TALKZ_ORGS) {
          console.log(`\n📊 ${org.name} (${org.code})`);
          console.log('='.repeat(50));
          
          const payroll = await getPayrollSummary(org.id);
          if (payroll.success) {
            console.log(`Total Payroll Cost: ${payroll.data.totals.total_cost.toFixed(2)} AED`);
            console.log(`Employees: ${payroll.data.employee_count.total}`);
            console.log(`Average Salary: ${payroll.data.average_metrics.avg_gross_salary.toFixed(2)} AED`);
          }
          
          const metrics = await getHRMetrics(org.id);
          if (metrics.success) {
            console.log(`\nHR Metrics:`);
            console.log(`- Headcount: ${metrics.data.headcount.total}`);
            console.log(`- Retention Rate: ${metrics.data.turnover.retention_rate.toFixed(1)}%`);
            console.log(`- Avg Tenure: ${metrics.data.turnover.avg_tenure_months.toFixed(1)} months`);
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
  getPayrollSummary,
  getEmployeeCostAnalysis,
  getAttendanceAnalytics,
  getHRMetrics,
  getLeaveBalanceReport,
  PAYROLL_HR_DNA_CONFIG
};

// Run CLI if called directly
if (require.main === module) {
  main();
}