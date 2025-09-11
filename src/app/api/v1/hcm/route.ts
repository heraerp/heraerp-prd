import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { HERAJWTService } from '@/lib/auth/jwt-service'

const jwtService = new HERAJWTService()

interface HCMRequestData {
  action: string
  employee_id?: string
  employee_ids?: string[]
  data?: any
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Verify JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { valid, payload } = await jwtService.validateToken(token)
    if (!valid || !payload?.organization_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { action, employee_id, employee_ids, data }: HCMRequestData = await req.json()

    switch (action) {
      // Employee Management
      case 'create_employee':
        return await createEmployee(data, payload.organization_id)
      
      case 'update_employee':
        return await updateEmployee(employee_id!, data, payload.organization_id)
      
      case 'terminate_employee':
        return await terminateEmployee(employee_id!, data, payload.organization_id)
      
      // Payroll
      case 'run_payroll':
        return await runPayroll(employee_ids || [], data, payload.organization_id)
      
      case 'calculate_payroll':
        return await calculatePayroll(employee_id!, payload.organization_id)
      
      // Time & Attendance
      case 'clock_in_out':
        return await clockInOut(employee_id!, data, payload.organization_id)
      
      case 'request_leave':
        return await requestLeave(employee_id!, data, payload.organization_id)
      
      case 'approve_leave':
        return await approveLeave(data.leave_id, data, payload.organization_id)
      
      // Performance
      case 'create_review':
        return await createPerformanceReview(employee_id!, data, payload.organization_id)
      
      case 'set_goal':
        return await setPerformanceGoal(employee_id!, data, payload.organization_id)
      
      // Analytics
      case 'get_workforce_analytics':
        return await getWorkforceAnalytics(payload.organization_id, data)
      
      case 'detect_anomalies':
        return await detectAnomalies(payload.organization_id)
      
      case 'forecast_headcount':
        return await forecastHeadcount(payload.organization_id, data)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('HCM API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Employee Management Functions
async function createEmployee(data: any, organizationId: string) {
  const { 
    name, email, department, job_title, 
    base_salary = 50000, hire_date = new Date().toISOString(),
    country = 'US' 
  } = data

  // Create employee entity
  const { data: employee, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: organizationId,
      entity_type: 'employee',
      entity_name: name,
      smart_code: 'HERA.HCM.EMP.MASTER.v1',
      metadata: {
        email,
        department,
        job_title,
        base_salary,
        hire_date,
        country,
        status: 'active',
        leave_entitlements: getDefaultLeaveEntitlements(country)
      }
    })
    .select()
    .single()

  if (error) throw error

  // Create onboarding transaction
  await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
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

  return NextResponse.json({ 
    success: true, 
    data: employee,
    message: 'Employee created successfully'
  })
}

async function updateEmployee(employeeId: string, updates: any, organizationId: string) {
  const { data, error } = await supabase
    .from('core_entities')
    .update({
      metadata: supabase.sql`metadata || ${JSON.stringify(updates)}::jsonb`
    })
    .eq('id', employeeId)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({ 
    success: true, 
    data,
    message: 'Employee updated successfully'
  })
}

async function terminateEmployee(employeeId: string, data: any, organizationId: string) {
  const { termination_date, reason } = data

  // Create termination transaction
  const { data: termination, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'employee_termination',
      transaction_code: `TERM-${employeeId}-${Date.now()}`,
      smart_code: 'HERA.HCM.EMP.TERMINATE.v1',
      transaction_date: termination_date,
      from_entity_id: employeeId,
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
    .eq('id', employeeId)
    .eq('organization_id', organizationId)

  return NextResponse.json({ 
    success: true, 
    data: termination,
    message: 'Employee termination processed'
  })
}

// Payroll Functions
async function runPayroll(employeeIds: string[], data: any, organizationId: string) {
  const { pay_period } = data

  // Get employees
  let query = supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'employee')
    .eq('metadata->status', 'active')

  if (employeeIds.length > 0 && employeeIds[0] !== 'all') {
    query = query.in('id', employeeIds)
  }

  const { data: employees } = await query

  if (!employees || employees.length === 0) {
    return NextResponse.json({ error: 'No employees found' }, { status: 404 })
  }

  const payrollResults = []

  for (const employee of employees) {
    const baseSalary = parseFloat((employee.metadata as any)?.base_salary || 0)
    const country = (employee.metadata as any)?.country || 'US'
    const taxRate = getTaxRate(country)
    
    const gross = baseSalary / 12 // Monthly
    const tax = gross * taxRate
    const net = gross - tax

    // Create payroll transaction
    const { data: payroll } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
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
          currency: getCurrency(country)
        }
      })
      .select()
      .single()

    payrollResults.push({
      employee_id: employee.id,
      employee_name: employee.entity_name,
      gross,
      tax,
      net,
      transaction_id: payroll?.id
    })
  }

  return NextResponse.json({ 
    success: true, 
    data: payrollResults,
    summary: {
      total_employees: payrollResults.length,
      total_gross: payrollResults.reduce((sum, r) => sum + r.gross, 0),
      total_tax: payrollResults.reduce((sum, r) => sum + r.tax, 0),
      total_net: payrollResults.reduce((sum, r) => sum + r.net, 0)
    }
  })
}

// Time & Attendance Functions
async function clockInOut(employeeId: string, data: any, organizationId: string) {
  const { action, timestamp = new Date().toISOString() } = data

  // Check for existing clock-in
  const { data: lastClock } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('from_entity_id', employeeId)
    .eq('transaction_type', 'time_clock')
    .is('metadata->clock_out', null)
    .order('transaction_date', { ascending: false })
    .limit(1)
    .single()

  if (action === 'in' && lastClock) {
    return NextResponse.json({ error: 'Already clocked in' }, { status: 400 })
  }

  if (action === 'out' && !lastClock) {
    return NextResponse.json({ error: 'No active clock-in found' }, { status: 400 })
  }

  let result

  if (action === 'in') {
    // Clock in
    const { data, error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'time_clock',
        transaction_code: `CLOCK-${employeeId}-${Date.now()}`,
        smart_code: 'HERA.HCM.TIME.CLOCK.v1',
        transaction_date: timestamp,
        from_entity_id: employeeId,
        metadata: {
          clock_in: timestamp,
          device: 'WEB_INTERFACE'
        }
      })
      .select()
      .single()

    if (error) throw error
    result = data
  } else {
    // Clock out
    const clockIn = new Date(lastClock.metadata.clock_in)
    const clockOut = new Date(timestamp)
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)

    const { data, error } = await supabase
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

    if (error) throw error
    result = data
  }

  return NextResponse.json({ 
    success: true, 
    data: result,
    message: `Clocked ${action} successfully`
  })
}

// Leave Management
async function requestLeave(employeeId: string, data: any, organizationId: string) {
  const { leave_type, start_date, end_date, reason = '' } = data

  // Calculate days
  const days = Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Get employee leave balance
  const { data: employee } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', employeeId)
    .eq('organization_id', organizationId)
    .single()

  const leaveEntitlements = employee?.metadata?.leave_entitlements || []
  const leaveBalance = leaveEntitlements.find((l: any) => l.type === leave_type)?.days || 0

  if (days > leaveBalance) {
    return NextResponse.json({ 
      error: `Insufficient leave balance. Available: ${leaveBalance} days, Requested: ${days} days`
    }, { status: 400 })
  }

  // Create leave request
  const { data: leaveRequest, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'leave_request',
      transaction_code: `LEAVE-${employeeId}-${Date.now()}`,
      smart_code: `HERA.HCM.LEAVE.${leave_type.toUpperCase()}.v1`,
      transaction_date: new Date().toISOString(),
      from_entity_id: employeeId,
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

  if (error) throw error

  return NextResponse.json({ 
    success: true, 
    data: leaveRequest,
    message: 'Leave request submitted successfully'
  })
}

// Workforce Analytics
async function getWorkforceAnalytics(organizationId: string, filters: any = {}) {
  const { department } = filters

  // Get employees
  let query = supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'employee')

  if (department) {
    query = query.eq('metadata->department', department)
  }

  const { data: employees } = await query

  // Calculate metrics
  const analytics = {
    headcount: {
      total: employees?.length || 0,
      by_department: {} as Record<string, number>,
      by_country: {} as Record<string, number>,
      by_status: {} as Record<string, number>
    },
    compensation: {
      total_annual_cost: 0,
      average_salary: 0,
      by_department: {} as Record<string, number>
    },
    diversity: {
      by_gender: {} as Record<string, number>,
      diversity_index: 0
    }
  }

  // Process employee data
  employees?.forEach(emp => {
    const dept = (emp.metadata as any)?.department || 'Unknown'
    const country = (emp.metadata as any)?.country || 'Unknown'
    const status = (emp.metadata as any)?.status || 'Unknown'
    const gender = (emp.metadata as any)?.gender || 'Unknown'
    const salary = parseFloat((emp.metadata as any)?.base_salary || 0)

    // Headcount
    analytics.headcount.by_department[dept] = (analytics.headcount.by_department[dept] || 0) + 1
    analytics.headcount.by_country[country] = (analytics.headcount.by_country[country] || 0) + 1
    analytics.headcount.by_status[status] = (analytics.headcount.by_status[status] || 0) + 1

    // Compensation
    analytics.compensation.total_annual_cost += salary
    analytics.compensation.by_department[dept] = (analytics.compensation.by_department[dept] || 0) + salary

    // Diversity
    analytics.diversity.by_gender[gender] = (analytics.diversity.by_gender[gender] || 0) + 1
  })

  // Calculate averages
  if (analytics.headcount.total > 0) {
    analytics.compensation.average_salary = analytics.compensation.total_annual_cost / analytics.headcount.total
  }

  // Calculate diversity index (Shannon index)
  const total = analytics.headcount.total
  if (total > 0) {
    Object.values(analytics.diversity.by_gender).forEach(count => {
      if (count > 0) {
        const proportion = count / total
        analytics.diversity.diversity_index -= proportion * Math.log(proportion)
      }
    })
  }

  return NextResponse.json({ 
    success: true, 
    data: analytics
  })
}

// Helper Functions
function getDefaultLeaveEntitlements(country: string) {
  const entitlements: Record<string, any[]> = {
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

function getTaxRate(country: string): number {
  const rates: Record<string, number> = {
    'US': 0.22,
    'UK': 0.20,
    'AE': 0.00,
    'IN': 0.10,
    'SG': 0.07
  }
  return rates[country] || 0.15
}

function getCurrency(country: string): string {
  const currencies: Record<string, string> = {
    'US': 'USD',
    'UK': 'GBP',
    'AE': 'AED',
    'IN': 'INR',
    'SG': 'SGD'
  }
  return currencies[country] || 'USD'
}

// Stub functions for remaining features
async function calculatePayroll(employeeId: string, organizationId: string) {
  return NextResponse.json({ message: 'Payroll calculation feature coming soon' })
}

async function approveLeave(leaveId: string, data: any, organizationId: string) {
  return NextResponse.json({ message: 'Leave approval feature coming soon' })
}

async function createPerformanceReview(employeeId: string, data: any, organizationId: string) {
  return NextResponse.json({ message: 'Performance review feature coming soon' })
}

async function setPerformanceGoal(employeeId: string, data: any, organizationId: string) {
  return NextResponse.json({ message: 'Performance goal feature coming soon' })
}

async function detectAnomalies(organizationId: string) {
  return NextResponse.json({ message: 'Anomaly detection feature coming soon' })
}

async function forecastHeadcount(organizationId: string, data: any) {
  return NextResponse.json({ message: 'Headcount forecasting feature coming soon' })
}