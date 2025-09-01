import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HCMRequest {
  organization_id: string
  action: string
  data?: any
}

interface PayrollCalculation {
  employee_id: string
  base_salary: number
  allowances: number
  deductions: number
  tax_amount: number
  net_pay: number
}

interface AttendanceAnalytics {
  employee_id: string
  total_hours: number
  overtime_hours: number
  absence_rate: number
  punctuality_score: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { organization_id, action, data } = await req.json() as HCMRequest

    switch (action) {
      case 'calculate_payroll':
        return await calculatePayroll(supabase, organization_id, data)
      
      case 'analyze_workforce':
        return await analyzeWorkforce(supabase, organization_id, data)
      
      case 'detect_anomalies':
        return await detectAnomalies(supabase, organization_id, data)
      
      case 'forecast_headcount':
        return await forecastHeadcount(supabase, organization_id, data)
      
      case 'optimize_scheduling':
        return await optimizeScheduling(supabase, organization_id, data)
      
      case 'process_biometric':
        return await processBiometric(supabase, organization_id, data)
      
      case 'multi_country_payroll':
        return await processMultiCountryPayroll(supabase, organization_id, data)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// =============================================
// PAYROLL CALCULATION ENGINE
// =============================================

async function calculatePayroll(supabase: any, organizationId: string, data: any) {
  const { employee_ids, pay_period, country } = data
  const calculations: PayrollCalculation[] = []

  for (const employeeId of employee_ids) {
    // Get employee data
    const { data: employee } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', employeeId)
      .eq('organization_id', organizationId)
      .single()

    if (!employee) continue

    const baseSalary = parseFloat(employee.metadata?.base_salary || 0)
    const allowances = calculateAllowances(employee.metadata?.allowances || [])
    const deductions = calculateDeductions(employee.metadata?.deductions || [])
    
    // Country-specific tax calculation
    const taxAmount = calculateTax(baseSalary + allowances, country || employee.metadata?.country)
    const netPay = baseSalary + allowances - deductions - taxAmount

    calculations.push({
      employee_id: employeeId,
      base_salary: baseSalary,
      allowances,
      deductions,
      tax_amount: taxAmount,
      net_pay: netPay
    })

    // Create payroll transaction
    await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'payroll_run',
        transaction_code: `PAY-${employeeId}-${pay_period}`,
        smart_code: 'HERA.HCM.PAY.RUN.v1',
        transaction_date: new Date().toISOString(),
        from_entity_id: employeeId,
        total_amount: netPay,
        metadata: {
          pay_period,
          gross_pay: baseSalary + allowances,
          total_deductions: deductions + taxAmount,
          tax_amount: taxAmount,
          net_pay: netPay,
          country
        }
      })
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      calculations,
      summary: {
        total_employees: calculations.length,
        total_net_pay: calculations.reduce((sum, calc) => sum + calc.net_pay, 0),
        average_net_pay: calculations.reduce((sum, calc) => sum + calc.net_pay, 0) / calculations.length
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// =============================================
// WORKFORCE ANALYTICS ENGINE
// =============================================

async function analyzeWorkforce(supabase: any, organizationId: string, data: any) {
  const { department, start_date, end_date } = data

  // Get all employees
  const { data: employees } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'employee')
    .filter('metadata->department', department ? 'eq' : 'not.is', department || null)

  // Calculate workforce metrics
  const metrics = {
    total_headcount: employees?.length || 0,
    by_department: {},
    by_location: {},
    by_gender: {},
    average_tenure: 0,
    turnover_rate: 0,
    diversity_index: 0
  }

  // Group by department
  employees?.forEach(emp => {
    const dept = emp.metadata?.department || 'Unknown'
    metrics.by_department[dept] = (metrics.by_department[dept] || 0) + 1
    
    const location = emp.metadata?.location || 'Unknown'
    metrics.by_location[location] = (metrics.by_location[location] || 0) + 1
    
    const gender = emp.metadata?.gender || 'Unknown'
    metrics.by_gender[gender] = (metrics.by_gender[gender] || 0) + 1
  })

  // Calculate turnover rate
  const { data: terminations } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'employee_termination')
    .gte('transaction_date', start_date || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
    .lte('transaction_date', end_date || new Date().toISOString())

  metrics.turnover_rate = terminations?.length ? (terminations.length / metrics.total_headcount) * 100 : 0

  // Calculate diversity index (Shannon diversity index)
  const genderCounts = Object.values(metrics.by_gender) as number[]
  const total = genderCounts.reduce((sum: number, count: number) => sum + count, 0)
  metrics.diversity_index = genderCounts.reduce((index: number, count: number) => {
    if (count > 0) {
      const proportion = count / total
      return index - (proportion * Math.log(proportion))
    }
    return index
  }, 0)

  // AI-powered insights
  const insights = generateWorkforceInsights(metrics)

  return new Response(
    JSON.stringify({ 
      success: true, 
      metrics,
      insights
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// =============================================
// ANOMALY DETECTION ENGINE
// =============================================

async function detectAnomalies(supabase: any, organizationId: string, data: any) {
  const anomalies = []

  // 1. Payroll Anomalies
  const { data: recentPayrolls } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'payroll_run')
    .gte('transaction_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order('transaction_date', { ascending: false })

  // Group by employee and detect anomalies
  const employeePayrolls = {}
  recentPayrolls?.forEach(payroll => {
    const empId = payroll.from_entity_id
    if (!employeePayrolls[empId]) employeePayrolls[empId] = []
    employeePayrolls[empId].push(payroll.total_amount)
  })

  Object.entries(employeePayrolls).forEach(([empId, amounts]: [string, number[]]) => {
    const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length
    const stdDev = Math.sqrt(amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / amounts.length)
    
    amounts.forEach((amount, index) => {
      const zScore = Math.abs((amount - avg) / stdDev)
      if (zScore > 2) {
        anomalies.push({
          type: 'payroll_anomaly',
          employee_id: empId,
          severity: zScore > 3 ? 'high' : 'medium',
          description: `Payroll amount ${amount > avg ? 'higher' : 'lower'} than average`,
          value: amount,
          average: avg,
          z_score: zScore
        })
      }
    })
  })

  // 2. Attendance Anomalies
  const { data: attendanceData } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'time_clock')
    .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // Detect unusual patterns
  const employeeAttendance = {}
  attendanceData?.forEach(record => {
    const empId = record.from_entity_id
    if (!employeeAttendance[empId]) employeeAttendance[empId] = []
    employeeAttendance[empId].push(record)
  })

  Object.entries(employeeAttendance).forEach(([empId, records]: [string, any[]]) => {
    // Check for excessive overtime
    const overtimeHours = records.reduce((sum, rec) => sum + (rec.metadata?.overtime_hours || 0), 0)
    if (overtimeHours > 40) {
      anomalies.push({
        type: 'excessive_overtime',
        employee_id: empId,
        severity: 'high',
        description: 'Excessive overtime hours in past 30 days',
        value: overtimeHours,
        threshold: 40
      })
    }

    // Check for frequent absences
    const absences = 20 - records.length // Assuming 20 working days
    if (absences > 5) {
      anomalies.push({
        type: 'high_absenteeism',
        employee_id: empId,
        severity: 'medium',
        description: 'High absenteeism rate',
        value: absences,
        threshold: 5
      })
    }
  })

  return new Response(
    JSON.stringify({ 
      success: true, 
      anomalies,
      summary: {
        total_anomalies: anomalies.length,
        by_type: anomalies.reduce((acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1
          return acc
        }, {}),
        high_severity: anomalies.filter(a => a.severity === 'high').length
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// =============================================
// HEADCOUNT FORECASTING ENGINE
// =============================================

async function forecastHeadcount(supabase: any, organizationId: string, data: any) {
  const { department, months_ahead = 6 } = data

  // Get historical headcount data
  const { data: employees } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'employee')
    .order('created_at', { ascending: true })

  // Calculate growth rate
  const monthlyHeadcount = {}
  employees?.forEach(emp => {
    const month = new Date(emp.created_at).toISOString().slice(0, 7)
    monthlyHeadcount[month] = (monthlyHeadcount[month] || 0) + 1
  })

  const months = Object.keys(monthlyHeadcount).sort()
  const counts = months.map(m => monthlyHeadcount[m])
  
  // Simple linear regression for forecasting
  const n = counts.length
  const sumX = (n * (n + 1)) / 2
  const sumY = counts.reduce((sum, y) => sum + y, 0)
  const sumXY = counts.reduce((sum, y, i) => sum + (y * (i + 1)), 0)
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Generate forecast
  const forecast = []
  const currentCount = counts[counts.length - 1] || 0
  
  for (let i = 1; i <= months_ahead; i++) {
    const forecastedCount = Math.round(intercept + slope * (n + i))
    const date = new Date()
    date.setMonth(date.getMonth() + i)
    
    forecast.push({
      month: date.toISOString().slice(0, 7),
      predicted_headcount: Math.max(forecastedCount, 0),
      confidence_interval: {
        lower: Math.max(forecastedCount - Math.sqrt(forecastedCount), 0),
        upper: forecastedCount + Math.sqrt(forecastedCount)
      }
    })
  }

  // Calculate hiring needs
  const totalGrowth = forecast[forecast.length - 1].predicted_headcount - currentCount
  const monthlyHiring = totalGrowth > 0 ? Math.ceil(totalGrowth / months_ahead) : 0

  return new Response(
    JSON.stringify({ 
      success: true,
      current_headcount: currentCount,
      forecast,
      recommendations: {
        total_hires_needed: Math.max(totalGrowth, 0),
        monthly_hiring_target: monthlyHiring,
        growth_rate: ((slope / currentCount) * 100).toFixed(2) + '%'
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// =============================================
// SCHEDULING OPTIMIZATION ENGINE
// =============================================

async function optimizeScheduling(supabase: any, organizationId: string, data: any) {
  const { department, week_start, constraints = {} } = data

  // Get employees and their skills
  const { data: employees } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'employee')
    .eq('metadata->department', department)

  // Get shift requirements
  const shifts = generateShiftRequirements(department, constraints)
  
  // Simple scheduling algorithm (can be replaced with more sophisticated optimization)
  const schedule = []
  const employeeHours = {}

  shifts.forEach(shift => {
    // Find available employees with required skills
    const availableEmployees = employees?.filter(emp => {
      const currentHours = employeeHours[emp.id] || 0
      const maxHours = constraints.max_hours_per_week || 40
      return currentHours + shift.duration <= maxHours
    }) || []

    if (availableEmployees.length > 0) {
      // Assign employee with least hours so far (load balancing)
      const assigned = availableEmployees.reduce((min, emp) => {
        const minHours = employeeHours[min.id] || 0
        const empHours = employeeHours[emp.id] || 0
        return empHours < minHours ? emp : min
      })

      employeeHours[assigned.id] = (employeeHours[assigned.id] || 0) + shift.duration

      schedule.push({
        shift_id: shift.id,
        employee_id: assigned.id,
        employee_name: assigned.entity_name,
        date: shift.date,
        start_time: shift.start_time,
        end_time: shift.end_time,
        duration: shift.duration
      })
    }
  })

  // Calculate optimization metrics
  const totalHours = Object.values(employeeHours).reduce((sum: number, hours: number) => sum + hours, 0)
  const avgHours = totalHours / Object.keys(employeeHours).length
  const coverage = (schedule.length / shifts.length) * 100

  return new Response(
    JSON.stringify({ 
      success: true,
      schedule,
      metrics: {
        shifts_covered: schedule.length,
        total_shifts: shifts.length,
        coverage_percentage: coverage,
        total_hours: totalHours,
        average_hours_per_employee: avgHours,
        employees_scheduled: Object.keys(employeeHours).length
      },
      warnings: coverage < 100 ? ['Not all shifts could be covered'] : []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// =============================================
// BIOMETRIC PROCESSING ENGINE
// =============================================

async function processBiometric(supabase: any, organizationId: string, data: any) {
  const { device_id, biometric_data, timestamp } = data

  // Validate biometric data
  if (!biometric_data?.employee_id || !biometric_data?.type) {
    throw new Error('Invalid biometric data')
  }

  // Process based on type
  const result = {
    success: false,
    action: '',
    employee_id: biometric_data.employee_id,
    timestamp: timestamp || new Date().toISOString()
  }

  // Check for existing clock-in
  const { data: lastClock } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('from_entity_id', biometric_data.employee_id)
    .eq('transaction_type', 'time_clock')
    .is('metadata->clock_out', null)
    .order('transaction_date', { ascending: false })
    .limit(1)
    .single()

  if (lastClock) {
    // Clock out
    await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          ...lastClock.metadata,
          clock_out: result.timestamp,
          device_id: device_id
        }
      })
      .eq('id', lastClock.id)

    result.success = true
    result.action = 'clock_out'
  } else {
    // Clock in
    await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'time_clock',
        transaction_code: `CLOCK-${biometric_data.employee_id}-${Date.now()}`,
        smart_code: 'HERA.HCM.TIME.CLOCK.v1',
        transaction_date: result.timestamp,
        from_entity_id: biometric_data.employee_id,
        metadata: {
          clock_in: result.timestamp,
          device_id: device_id,
          biometric_type: biometric_data.type
        }
      })

    result.success = true
    result.action = 'clock_in'
  }

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// =============================================
// MULTI-COUNTRY PAYROLL ENGINE
// =============================================

async function processMultiCountryPayroll(supabase: any, organizationId: string, data: any) {
  const { countries, pay_period } = data
  const results = {}

  for (const country of countries) {
    // Get employees in country
    const { data: employees } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee')
      .eq('metadata->country', country)

    const countryResults = {
      employee_count: employees?.length || 0,
      total_gross: 0,
      total_tax: 0,
      total_net: 0,
      currency: getCountryCurrency(country),
      compliance: getCountryCompliance(country)
    }

    // Process payroll for each employee
    for (const employee of employees || []) {
      const baseSalary = parseFloat(employee.metadata?.base_salary || 0)
      const allowances = calculateAllowances(employee.metadata?.allowances || [])
      const deductions = calculateDeductions(employee.metadata?.deductions || [])
      const taxAmount = calculateTax(baseSalary + allowances, country)
      const netPay = baseSalary + allowances - deductions - taxAmount

      countryResults.total_gross += baseSalary + allowances
      countryResults.total_tax += taxAmount
      countryResults.total_net += netPay

      // Country-specific processing
      await processCountrySpecificRequirements(supabase, organizationId, employee.id, country, {
        gross_pay: baseSalary + allowances,
        tax_amount: taxAmount,
        net_pay: netPay,
        pay_period
      })
    }

    results[country] = countryResults
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      results,
      summary: {
        total_countries: countries.length,
        total_employees: Object.values(results).reduce((sum: number, r: any) => sum + r.employee_count, 0),
        total_payroll: Object.values(results).reduce((sum: number, r: any) => sum + r.total_net, 0)
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function calculateAllowances(allowances: any[]): number {
  return allowances
    .filter(a => a.active)
    .reduce((sum, a) => sum + parseFloat(a.amount || 0), 0)
}

function calculateDeductions(deductions: any[]): number {
  return deductions
    .filter(d => d.active)
    .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)
}

function calculateTax(grossAmount: number, country: string): number {
  const taxRates = {
    'US': 0.22,
    'UK': 0.20,
    'AE': 0.00,
    'IN': 0.10,
    'SG': 0.07,
    'DE': 0.25,
    'FR': 0.23,
    'JP': 0.15,
    'AU': 0.19,
    'CA': 0.15
  }

  return grossAmount * (taxRates[country] || 0.15)
}

function generateWorkforceInsights(metrics: any): string[] {
  const insights = []

  // Headcount insights
  if (metrics.total_headcount > 0) {
    insights.push(`Total workforce of ${metrics.total_headcount} employees across ${Object.keys(metrics.by_department).length} departments`)
  }

  // Turnover insights
  if (metrics.turnover_rate > 15) {
    insights.push(`High turnover rate of ${metrics.turnover_rate.toFixed(1)}% - consider retention strategies`)
  } else if (metrics.turnover_rate < 5) {
    insights.push(`Low turnover rate of ${metrics.turnover_rate.toFixed(1)}% indicates strong employee retention`)
  }

  // Diversity insights
  if (metrics.diversity_index > 0.6) {
    insights.push(`Good diversity index of ${metrics.diversity_index.toFixed(2)} shows balanced workforce composition`)
  }

  // Department insights
  const largestDept = Object.entries(metrics.by_department)
    .sort(([,a]: any, [,b]: any) => b - a)[0]
  if (largestDept) {
    insights.push(`${largestDept[0]} is the largest department with ${largestDept[1]} employees`)
  }

  return insights
}

function generateShiftRequirements(department: string, constraints: any): any[] {
  const shifts = []
  const baseDate = new Date(constraints.week_start || new Date())
  
  // Generate week of shifts (simplified)
  for (let day = 0; day < 7; day++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + day)
    
    // Morning shift
    shifts.push({
      id: `SHIFT-${date.toISOString().slice(0, 10)}-MORNING`,
      date: date.toISOString().slice(0, 10),
      start_time: '08:00',
      end_time: '16:00',
      duration: 8,
      required_skills: constraints.required_skills || []
    })
    
    // Evening shift
    if (constraints.include_evening_shifts) {
      shifts.push({
        id: `SHIFT-${date.toISOString().slice(0, 10)}-EVENING`,
        date: date.toISOString().slice(0, 10),
        start_time: '16:00',
        end_time: '00:00',
        duration: 8,
        required_skills: constraints.required_skills || []
      })
    }
  }
  
  return shifts
}

function getCountryCurrency(country: string): string {
  const currencies = {
    'US': 'USD',
    'UK': 'GBP',
    'AE': 'AED',
    'IN': 'INR',
    'SG': 'SGD',
    'DE': 'EUR',
    'FR': 'EUR',
    'JP': 'JPY',
    'AU': 'AUD',
    'CA': 'CAD'
  }
  return currencies[country] || 'USD'
}

function getCountryCompliance(country: string): any {
  const compliance = {
    'US': {
      tax_filing: 'W-2',
      social_security: true,
      medicare: true,
      unemployment: true
    },
    'UK': {
      tax_filing: 'P60',
      national_insurance: true,
      pension: true,
      statutory_pay: true
    },
    'AE': {
      tax_filing: 'None',
      wps_compliance: true,
      gratuity: true,
      visa_tracking: true
    },
    'IN': {
      tax_filing: 'Form 16',
      provident_fund: true,
      esi: true,
      professional_tax: true
    }
  }
  return compliance[country] || {}
}

async function processCountrySpecificRequirements(
  supabase: any, 
  organizationId: string, 
  employeeId: string, 
  country: string,
  payrollData: any
) {
  // Country-specific processing
  switch (country) {
    case 'US':
      // Process 401k contributions
      await process401kContribution(supabase, organizationId, employeeId, payrollData)
      break
    case 'UK':
      // Process pension contributions
      await processPensionContribution(supabase, organizationId, employeeId, payrollData)
      break
    case 'AE':
      // Process gratuity accrual
      await processGratuityAccrual(supabase, organizationId, employeeId, payrollData)
      break
    case 'IN':
      // Process PF/ESI
      await processPFESI(supabase, organizationId, employeeId, payrollData)
      break
  }
}

async function process401kContribution(supabase: any, organizationId: string, employeeId: string, payrollData: any) {
  // Simplified 401k processing
  const contributionRate = 0.06 // 6% default
  const contribution = payrollData.gross_pay * contributionRate
  
  await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'benefit_contribution',
      transaction_code: `401K-${employeeId}-${payrollData.pay_period}`,
      smart_code: 'HERA.HCM.BEN.RETIRE.US.401K.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: employeeId,
      total_amount: contribution,
      metadata: {
        contribution_type: '401k',
        employee_contribution: contribution,
        employer_match: contribution, // 100% match up to 6%
        pay_period: payrollData.pay_period
      }
    })
}

async function processPensionContribution(supabase: any, organizationId: string, employeeId: string, payrollData: any) {
  // UK pension auto-enrollment
  const employeeContribution = payrollData.gross_pay * 0.05 // 5%
  const employerContribution = payrollData.gross_pay * 0.03 // 3%
  
  await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'benefit_contribution',
      transaction_code: `PENSION-${employeeId}-${payrollData.pay_period}`,
      smart_code: 'HERA.HCM.BEN.RETIRE.UK.PENSION.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: employeeId,
      total_amount: employeeContribution + employerContribution,
      metadata: {
        contribution_type: 'uk_pension',
        employee_contribution: employeeContribution,
        employer_contribution: employerContribution,
        pay_period: payrollData.pay_period
      }
    })
}

async function processGratuityAccrual(supabase: any, organizationId: string, employeeId: string, payrollData: any) {
  // UAE gratuity calculation
  const dailyWage = payrollData.gross_pay / 30
  const gratuityDays = 21 // 21 days per year for first 5 years
  const monthlyAccrual = (dailyWage * gratuityDays) / 12
  
  await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'benefit_accrual',
      transaction_code: `GRATUITY-${employeeId}-${payrollData.pay_period}`,
      smart_code: 'HERA.HCM.BEN.GRATUITY.AE.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: employeeId,
      total_amount: monthlyAccrual,
      metadata: {
        accrual_type: 'gratuity',
        daily_wage: dailyWage,
        gratuity_days: gratuityDays,
        monthly_accrual: monthlyAccrual,
        pay_period: payrollData.pay_period
      }
    })
}

async function processPFESI(supabase: any, organizationId: string, employeeId: string, payrollData: any) {
  // India PF/ESI calculation
  const pfEmployee = payrollData.gross_pay * 0.12 // 12% employee
  const pfEmployer = payrollData.gross_pay * 0.12 // 12% employer
  const esiEmployee = payrollData.gross_pay * 0.0075 // 0.75% employee
  const esiEmployer = payrollData.gross_pay * 0.0325 // 3.25% employer
  
  await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'statutory_contribution',
      transaction_code: `PF-ESI-${employeeId}-${payrollData.pay_period}`,
      smart_code: 'HERA.HCM.COMP.STATUTORY.IN.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: employeeId,
      total_amount: pfEmployee + pfEmployer + esiEmployee + esiEmployer,
      metadata: {
        pf_employee: pfEmployee,
        pf_employer: pfEmployer,
        esi_employee: esiEmployee,
        esi_employer: esiEmployer,
        total_contribution: pfEmployee + pfEmployer + esiEmployee + esiEmployer,
        pay_period: payrollData.pay_period
      }
    })
}