#!/usr/bin/env node

/**
 * HERA HCM (Human Capital Management) MCP Server
 * Natural language HR operations on 6 universal tables
 * Replaces Workday's 500+ tables with 95% cost savings
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORGANIZATION_ID = process.env.DEFAULT_ORGANIZATION_ID

class HERAHCMMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'hera-hcm-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {}
        }
      }
    )

    this.setupHandlers()
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Employee Management
        {
          name: 'add-employee',
          description: 'Add a new employee to the organization',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Employee full name' },
              email: { type: 'string', description: 'Employee email' },
              department: { type: 'string', description: 'Department name' },
              job_title: { type: 'string', description: 'Job title' },
              base_salary: { type: 'number', description: 'Base salary amount' },
              start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
              country: { type: 'string', description: 'Country code (US, UK, AE, IN, etc.)' }
            },
            required: ['name', 'email', 'department', 'job_title']
          }
        },
        {
          name: 'update-employee',
          description: 'Update employee information',
          inputSchema: {
            type: 'object',
            properties: {
              employee_id: { type: 'string', description: 'Employee ID' },
              updates: { type: 'object', description: 'Fields to update' }
            },
            required: ['employee_id', 'updates']
          }
        },
        {
          name: 'terminate-employee',
          description: 'Process employee termination',
          inputSchema: {
            type: 'object',
            properties: {
              employee_id: { type: 'string', description: 'Employee ID' },
              termination_date: { type: 'string', description: 'Termination date' },
              reason: { type: 'string', description: 'Termination reason' }
            },
            required: ['employee_id', 'termination_date', 'reason']
          }
        },

        // Payroll Operations
        {
          name: 'run-payroll',
          description: 'Execute payroll for specified employees',
          inputSchema: {
            type: 'object',
            properties: {
              employee_ids: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'List of employee IDs (or "all" for all employees)' 
              },
              pay_period: { type: 'string', description: 'Pay period (YYYY-MM)' },
              country: { type: 'string', description: 'Country code for tax calculation' }
            },
            required: ['pay_period']
          }
        },
        {
          name: 'view-payslip',
          description: 'View payslip for an employee',
          inputSchema: {
            type: 'object',
            properties: {
              employee_id: { type: 'string', description: 'Employee ID' },
              pay_period: { type: 'string', description: 'Pay period (YYYY-MM)' }
            },
            required: ['employee_id', 'pay_period']
          }
        },
        {
          name: 'add-allowance',
          description: 'Add allowance to employee compensation',
          inputSchema: {
            type: 'object',
            properties: {
              employee_id: { type: 'string', description: 'Employee ID' },
              allowance_type: { type: 'string', description: 'Type of allowance' },
              amount: { type: 'number', description: 'Allowance amount' },
              taxable: { type: 'boolean', description: 'Is allowance taxable?' }
            },
            required: ['employee_id', 'allowance_type', 'amount']
          }
        },

        // Time & Attendance
        {
          name: 'clock-in-out',
          description: 'Record employee clock in/out',
          inputSchema: {
            type: 'object',
            properties: {
              employee_id: { type: 'string', description: 'Employee ID' },
              action: { type: 'string', enum: ['in', 'out'], description: 'Clock in or out' },
              timestamp: { type: 'string', description: 'Timestamp (optional, defaults to now)' }
            },
            required: ['employee_id', 'action']
          }
        },
        {
          name: 'request-leave',
          description: 'Submit leave request',
          inputSchema: {
            type: 'object',
            properties: {
              employee_id: { type: 'string', description: 'Employee ID' },
              leave_type: { type: 'string', description: 'Type of leave (annual, sick, etc.)' },
              start_date: { type: 'string', description: 'Leave start date' },
              end_date: { type: 'string', description: 'Leave end date' },
              reason: { type: 'string', description: 'Reason for leave' }
            },
            required: ['employee_id', 'leave_type', 'start_date', 'end_date']
          }
        },
        {
          name: 'approve-leave',
          description: 'Approve or reject leave request',
          inputSchema: {
            type: 'object',
            properties: {
              leave_request_id: { type: 'string', description: 'Leave request ID' },
              action: { type: 'string', enum: ['approve', 'reject'], description: 'Approve or reject' },
              comments: { type: 'string', description: 'Approval comments' }
            },
            required: ['leave_request_id', 'action']
          }
        },
        {
          name: 'view-attendance',
          description: 'View attendance report',
          inputSchema: {
            type: 'object',
            properties: {
              employee_id: { type: 'string', description: 'Employee ID (optional for all)' },
              start_date: { type: 'string', description: 'Start date' },
              end_date: { type: 'string', description: 'End date' }
            },
            required: ['start_date', 'end_date']
          }
        },

        // Performance Management
        {
          name: 'create-performance-review',
          description: 'Create performance review',
          inputSchema: {
            type: 'object',
            properties: {
              employee_id: { type: 'string', description: 'Employee ID' },
              review_period: { type: 'string', description: 'Review period (e.g., 2024-Q1)' },
              overall_rating: { type: 'number', description: 'Overall rating (1-5)' },
              strengths: { type: 'string', description: 'Employee strengths' },
              improvements: { type: 'string', description: 'Areas for improvement' }
            },
            required: ['employee_id', 'review_period', 'overall_rating']
          }
        },
        {
          name: 'set-performance-goal',
          description: 'Set performance goal for employee',
          inputSchema: {
            type: 'object',
            properties: {
              employee_id: { type: 'string', description: 'Employee ID' },
              goal_description: { type: 'string', description: 'Goal description' },
              target: { type: 'string', description: 'Target/metric' },
              due_date: { type: 'string', description: 'Due date' }
            },
            required: ['employee_id', 'goal_description', 'due_date']
          }
        },

        // Analytics & Reporting
        {
          name: 'workforce-analytics',
          description: 'Get workforce analytics and insights',
          inputSchema: {
            type: 'object',
            properties: {
              department: { type: 'string', description: 'Filter by department (optional)' },
              metric: { 
                type: 'string', 
                enum: ['headcount', 'turnover', 'diversity', 'cost', 'all'],
                description: 'Specific metric or all' 
              }
            }
          }
        },
        {
          name: 'detect-hr-anomalies',
          description: 'Detect anomalies in HR data (payroll, attendance, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: ['payroll', 'attendance', 'performance', 'all'],
                description: 'Type of anomaly detection' 
              }
            }
          }
        },
        {
          name: 'forecast-headcount',
          description: 'Forecast future headcount needs',
          inputSchema: {
            type: 'object',
            properties: {
              department: { type: 'string', description: 'Department (optional)' },
              months_ahead: { type: 'number', description: 'Months to forecast' }
            }
          }
        },

        // Benefits & Compliance
        {
          name: 'enroll-benefits',
          description: 'Enroll employee in benefits',
          inputSchema: {
            type: 'object',
            properties: {
              employee_id: { type: 'string', description: 'Employee ID' },
              benefits: { 
                type: 'array',
                items: { type: 'string' },
                description: 'List of benefit types (health, dental, life, etc.)' 
              },
              effective_date: { type: 'string', description: 'Effective date' }
            },
            required: ['employee_id', 'benefits']
          }
        },
        {
          name: 'check-compliance',
          description: 'Check compliance status (visas, contracts, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              type: { 
                type: 'string', 
                enum: ['visa', 'contract', 'certification', 'all'],
                description: 'Type of compliance check' 
              },
              days_ahead: { type: 'number', description: 'Days to look ahead for expiry' }
            }
          }
        }
      ]
    }))

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params

        switch (name) {
          // Employee Management
          case 'add-employee':
            return await this.addEmployee(args)
          case 'update-employee':
            return await this.updateEmployee(args)
          case 'terminate-employee':
            return await this.terminateEmployee(args)

          // Payroll
          case 'run-payroll':
            return await this.runPayroll(args)
          case 'view-payslip':
            return await this.viewPayslip(args)
          case 'add-allowance':
            return await this.addAllowance(args)

          // Time & Attendance
          case 'clock-in-out':
            return await this.clockInOut(args)
          case 'request-leave':
            return await this.requestLeave(args)
          case 'approve-leave':
            return await this.approveLeave(args)
          case 'view-attendance':
            return await this.viewAttendance(args)

          // Performance
          case 'create-performance-review':
            return await this.createPerformanceReview(args)
          case 'set-performance-goal':
            return await this.setPerformanceGoal(args)

          // Analytics
          case 'workforce-analytics':
            return await this.workforceAnalytics(args)
          case 'detect-hr-anomalies':
            return await this.detectHRAnomalies(args)
          case 'forecast-headcount':
            return await this.forecastHeadcount(args)

          // Benefits & Compliance
          case 'enroll-benefits':
            return await this.enrollBenefits(args)
          case 'check-compliance':
            return await this.checkCompliance(args)

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`)
        }
      } catch (error) {
        console.error('Tool execution error:', error)
        throw new McpError(ErrorCode.InternalError, error.message)
      }
    })
  }

  // =============================================
  // EMPLOYEE MANAGEMENT
  // =============================================

  async addEmployee(args) {
    const { 
      name, email, department, job_title, 
      base_salary = 50000, start_date = new Date().toISOString(), 
      country = 'US' 
    } = args

    // Create employee entity
    const { data: employee, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORGANIZATION_ID,
        entity_type: 'employee',
        entity_name: name,
        smart_code: 'HERA.HCM.EMP.MASTER.v1',
        metadata: {
          email,
          department,
          job_title,
          base_salary,
          hire_date: start_date,
          country,
          status: 'active',
          leave_entitlements: this.getDefaultLeaveEntitlements(country)
        }
      })
      .select()
      .single()

    if (error) throw error

    // Create onboarding transaction
    await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORGANIZATION_ID,
        transaction_type: 'employee_onboarding',
        transaction_code: `ONBOARD-${employee.entity_code}`,
        smart_code: 'HERA.HCM.EMP.ONBOARD.v1',
        transaction_date: new Date().toISOString(),
        from_entity_id: employee.id,
        metadata: {
          onboarding_status: 'initiated',
          tasks_pending: ['documents', 'orientation', 'system_access', 'equipment']
        }
      })

    return {
      content: [{
        type: 'text',
        text: `✅ Employee added successfully!
        
Employee Details:
- Name: ${name}
- Employee Code: ${employee.entity_code}
- Department: ${department}
- Job Title: ${job_title}
- Start Date: ${start_date}
- Country: ${country}
- Base Salary: ${this.formatCurrency(base_salary, country)}

Onboarding initiated with default leave entitlements for ${country}.`
      }]
    }
  }

  async updateEmployee(args) {
    const { employee_id, updates } = args

    const { data, error } = await supabase
      .from('core_entities')
      .update({
        metadata: supabase.sql`metadata || ${JSON.stringify(updates)}::jsonb`
      })
      .eq('id', employee_id)
      .eq('organization_id', ORGANIZATION_ID)
      .select()
      .single()

    if (error) throw error

    return {
      content: [{
        type: 'text',
        text: `✅ Employee ${data.entity_name} updated successfully!
        
Updated fields: ${Object.keys(updates).join(', ')}`
      }]
    }
  }

  async terminateEmployee(args) {
    const { employee_id, termination_date, reason } = args

    // Get employee details
    const { data: employee } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', employee_id)
      .eq('organization_id', ORGANIZATION_ID)
      .single()

    // Create termination transaction
    const { data: termination, error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORGANIZATION_ID,
        transaction_type: 'employee_termination',
        transaction_code: `TERM-${employee.entity_code}-${Date.now()}`,
        smart_code: 'HERA.HCM.EMP.TERMINATE.v1',
        transaction_date: termination_date,
        from_entity_id: employee_id,
        metadata: {
          termination_reason: reason,
          final_working_day: termination_date,
          exit_checklist: ['return_equipment', 'knowledge_transfer', 'exit_interview', 'final_settlement']
        }
      })
      .select()
      .single()

    if (error) throw error

    // Update employee status
    await supabase
      .from('core_entities')
      .update({
        metadata: supabase.sql`metadata || '{"status": "terminated"}'::jsonb`
      })
      .eq('id', employee_id)
      .eq('organization_id', ORGANIZATION_ID)

    return {
      content: [{
        type: 'text',
        text: `✅ Employee termination processed
        
Employee: ${employee.entity_name}
Termination Date: ${termination_date}
Reason: ${reason}
Exit Checklist Created: Yes

Next steps:
- Process final payroll
- Conduct exit interview
- Collect company property
- Complete knowledge transfer`
      }]
    }
  }

  // =============================================
  // PAYROLL OPERATIONS
  // =============================================

  async runPayroll(args) {
    const { employee_ids = ['all'], pay_period, country } = args

    // Get employees
    let employeeQuery = supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'employee')
      .eq('metadata->status', 'active')

    if (employee_ids[0] !== 'all') {
      employeeQuery = employeeQuery.in('id', employee_ids)
    }

    const { data: employees } = await employeeQuery

    if (!employees || employees.length === 0) {
      throw new Error('No employees found')
    }

    let totalGross = 0
    let totalNet = 0
    let totalTax = 0
    const payrollResults = []

    // Process each employee
    for (const employee of employees) {
      const baseSalary = parseFloat(employee.metadata?.base_salary || 0)
      const countryCode = country || employee.metadata?.country || 'US'
      const taxRate = this.getTaxRate(countryCode)
      
      const gross = baseSalary / 12 // Monthly
      const tax = gross * taxRate
      const net = gross - tax

      totalGross += gross
      totalTax += tax
      totalNet += net

      // Create payroll transaction
      await supabase
        .from('universal_transactions')
        .insert({
          organization_id: ORGANIZATION_ID,
          transaction_type: 'payroll_run',
          transaction_code: `PAY-${employee.entity_code}-${pay_period}`,
          smart_code: 'HERA.HCM.PAY.RUN.v1',
          transaction_date: new Date().toISOString(),
          from_entity_id: employee.id,
          total_amount: net,
          metadata: {
            pay_period,
            gross_pay: gross,
            tax_amount: tax,
            net_pay: net,
            currency: this.getCurrency(countryCode)
          }
        })

      payrollResults.push({
        employee: employee.entity_name,
        gross,
        tax,
        net
      })
    }

    return {
      content: [{
        type: 'text',
        text: `✅ Payroll processed successfully!

Pay Period: ${pay_period}
Employees Processed: ${employees.length}

Summary:
- Total Gross: ${this.formatCurrency(totalGross, country)}
- Total Tax: ${this.formatCurrency(totalTax, country)}
- Total Net: ${this.formatCurrency(totalNet, country)}

Payslips generated and available for viewing.`
      }]
    }
  }

  async viewPayslip(args) {
    const { employee_id, pay_period } = args

    // Get employee details
    const { data: employee } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', employee_id)
      .eq('organization_id', ORGANIZATION_ID)
      .single()

    // Get payslip
    const { data: payslip } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('from_entity_id', employee_id)
      .eq('transaction_type', 'payroll_run')
      .eq('metadata->pay_period', pay_period)
      .single()

    if (!payslip) {
      throw new Error(`No payslip found for period ${pay_period}`)
    }

    const currency = payslip.metadata.currency || 'USD'

    return {
      content: [{
        type: 'text',
        text: `📄 PAYSLIP

Employee: ${employee.entity_name}
Employee Code: ${employee.entity_code}
Pay Period: ${pay_period}

Earnings:
- Gross Pay: ${this.formatCurrency(payslip.metadata.gross_pay, currency)}

Deductions:
- Income Tax: ${this.formatCurrency(payslip.metadata.tax_amount, currency)}

Net Pay: ${this.formatCurrency(payslip.metadata.net_pay, currency)}

Transaction Code: ${payslip.transaction_code}
Payment Date: ${new Date(payslip.transaction_date).toLocaleDateString()}`
      }]
    }
  }

  // =============================================
  // TIME & ATTENDANCE
  // =============================================

  async clockInOut(args) {
    const { employee_id, action, timestamp = new Date().toISOString() } = args

    // Check for existing clock-in
    const { data: lastClock } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('from_entity_id', employee_id)
      .eq('transaction_type', 'time_clock')
      .is('metadata->clock_out', null)
      .order('transaction_date', { ascending: false })
      .limit(1)
      .single()

    if (action === 'in' && lastClock) {
      throw new Error('Employee already clocked in. Please clock out first.')
    }

    if (action === 'out' && !lastClock) {
      throw new Error('No active clock-in found.')
    }

    let result

    if (action === 'in') {
      // Clock in
      result = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: ORGANIZATION_ID,
          transaction_type: 'time_clock',
          transaction_code: `CLOCK-${employee_id}-${Date.now()}`,
          smart_code: 'HERA.HCM.TIME.CLOCK.v1',
          transaction_date: timestamp,
          from_entity_id: employee_id,
          metadata: {
            clock_in: timestamp,
            device: 'MCP_INTERFACE'
          }
        })
        .select()
        .single()
    } else {
      // Clock out
      const clockIn = new Date(lastClock.metadata.clock_in)
      const clockOut = new Date(timestamp)
      const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60)

      result = await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            ...lastClock.metadata,
            clock_out: timestamp,
            hours_worked: hoursWorked.toFixed(2),
            overtime_hours: Math.max(hoursWorked - 8, 0).toFixed(2)
          }
        })
        .eq('id', lastClock.id)
        .select()
        .single()
    }

    const { data: employee } = await supabase
      .from('core_entities')
      .select('entity_name')
      .eq('id', employee_id)
      .single()

    return {
      content: [{
        type: 'text',
        text: `✅ ${employee.entity_name} clocked ${action} at ${new Date(timestamp).toLocaleString()}
        
${action === 'out' ? `Hours worked: ${result.data.metadata.hours_worked}
Overtime: ${result.data.metadata.overtime_hours} hours` : ''}`
      }]
    }
  }

  async requestLeave(args) {
    const { employee_id, leave_type, start_date, end_date, reason = '' } = args

    // Calculate days
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1

    // Get employee leave balance
    const { data: employee } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', employee_id)
      .eq('organization_id', ORGANIZATION_ID)
      .single()

    const leaveEntitlements = employee.metadata?.leave_entitlements || []
    const leaveBalance = leaveEntitlements.find(l => l.type === leave_type)?.days || 0

    if (days > leaveBalance) {
      throw new Error(`Insufficient leave balance. Available: ${leaveBalance} days, Requested: ${days} days`)
    }

    // Create leave request
    const { data: leaveRequest } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORGANIZATION_ID,
        transaction_type: 'leave_request',
        transaction_code: `LEAVE-${employee_id}-${Date.now()}`,
        smart_code: `HERA.HCM.LEAVE.${leave_type.toUpperCase()}.v1`,
        transaction_date: new Date().toISOString(),
        from_entity_id: employee_id,
        metadata: {
          leave_type,
          start_date,
          end_date,
          days,
          reason,
          status: 'pending',
          available_balance: leaveBalance,
          remaining_balance: leaveBalance - days
        }
      })
      .select()
      .single()

    return {
      content: [{
        type: 'text',
        text: `✅ Leave request submitted!

Employee: ${employee.entity_name}
Type: ${leave_type}
Period: ${start_date} to ${end_date} (${days} days)
Status: Pending Approval
Available Balance: ${leaveBalance} days
Remaining After Approval: ${leaveBalance - days} days

Request ID: ${leaveRequest.id}`
      }]
    }
  }

  // =============================================
  // ANALYTICS
  // =============================================

  async workforceAnalytics(args) {
    const { department, metric = 'all' } = args

    // Get employees
    let query = supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'employee')

    if (department) {
      query = query.eq('metadata->department', department)
    }

    const { data: employees } = await query

    const analytics = {
      headcount: {
        total: employees?.length || 0,
        by_department: {},
        by_country: {},
        by_status: {}
      }
    }

    // Calculate metrics
    employees?.forEach(emp => {
      const dept = emp.metadata?.department || 'Unknown'
      const country = emp.metadata?.country || 'Unknown'
      const status = emp.metadata?.status || 'Unknown'

      analytics.headcount.by_department[dept] = (analytics.headcount.by_department[dept] || 0) + 1
      analytics.headcount.by_country[country] = (analytics.headcount.by_country[country] || 0) + 1
      analytics.headcount.by_status[status] = (analytics.headcount.by_status[status] || 0) + 1
    })

    // Calculate costs
    if (metric === 'all' || metric === 'cost') {
      const totalSalary = employees?.reduce((sum, emp) => 
        sum + parseFloat(emp.metadata?.base_salary || 0), 0
      ) || 0

      analytics.cost = {
        annual_salary_cost: totalSalary,
        average_salary: totalSalary / (employees?.length || 1),
        monthly_payroll: totalSalary / 12
      }
    }

    return {
      content: [{
        type: 'text',
        text: `📊 WORKFORCE ANALYTICS

${department ? `Department: ${department}` : 'Organization-wide'}

HEADCOUNT
Total Employees: ${analytics.headcount.total}

By Department:
${Object.entries(analytics.headcount.by_department)
  .map(([dept, count]) => `- ${dept}: ${count}`)
  .join('\n')}

By Country:
${Object.entries(analytics.headcount.by_country)
  .map(([country, count]) => `- ${country}: ${count}`)
  .join('\n')}

${analytics.cost ? `
COST ANALYSIS
Annual Salary Cost: ${this.formatCurrency(analytics.cost.annual_salary_cost)}
Average Salary: ${this.formatCurrency(analytics.cost.average_salary)}
Monthly Payroll: ${this.formatCurrency(analytics.cost.monthly_payroll)}` : ''}`
      }]
    }
  }

  // =============================================
  // HELPER FUNCTIONS
  // =============================================

  getDefaultLeaveEntitlements(country) {
    const entitlements = {
      'US': [
        { type: 'annual', days: 15, accrual_rate: 1.25 },
        { type: 'sick', days: 10, accrual_rate: 0.83 },
        { type: 'personal', days: 3, accrual_rate: 0 }
      ],
      'UK': [
        { type: 'annual', days: 28, accrual_rate: 2.33 },
        { type: 'sick', days: 0, accrual_rate: 0 }
      ],
      'AE': [
        { type: 'annual', days: 30, accrual_rate: 2.5 },
        { type: 'sick', days: 15, accrual_rate: 0 }
      ],
      'IN': [
        { type: 'annual', days: 21, accrual_rate: 1.75 },
        { type: 'sick', days: 12, accrual_rate: 1 },
        { type: 'casual', days: 12, accrual_rate: 1 }
      ]
    }
    return entitlements[country] || entitlements['US']
  }

  getTaxRate(country) {
    const rates = {
      'US': 0.22,
      'UK': 0.20,
      'AE': 0.00,
      'IN': 0.10,
      'SG': 0.07
    }
    return rates[country] || 0.15
  }

  getCurrency(country) {
    const currencies = {
      'US': 'USD',
      'UK': 'GBP',
      'AE': 'AED',
      'IN': 'INR',
      'SG': 'SGD'
    }
    return currencies[country] || 'USD'
  }

  formatCurrency(amount, countryOrCurrency) {
    const currency = countryOrCurrency.length === 3 ? countryOrCurrency : this.getCurrency(countryOrCurrency)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  async start() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('HERA HCM MCP Server started')
  }
}

// Start the server
const server = new HERAHCMMCPServer()
server.start()