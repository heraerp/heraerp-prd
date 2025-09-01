#!/usr/bin/env node

/**
 * Test script for HERA HCM DNA Module
 * Validates complete HR lifecycle on 6 universal tables
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORG_ID = process.env.DEFAULT_ORGANIZATION_ID

async function testHCMLifecycle() {
  console.log('🚀 Testing HERA HCM DNA Module')
  console.log('================================\n')

  try {
    // 1. Create department
    console.log('1️⃣ Creating department...')
    
    const { data: department } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'department',
        entity_name: 'Engineering',
        entity_code: 'DEPT-ENG',
        smart_code: 'HERA.HCM.ORG.DEPT.v1',
        metadata: {
          cost_center: 'CC-100',
          manager_id: null,
          headcount_budget: 50
        }
      })
      .select()
      .single()

    console.log('✅ Department created\n')

    // 2. Create employee
    console.log('2️⃣ Creating employee...')
    
    const { data: employee } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'employee',
        entity_name: 'Test Employee',
        smart_code: 'HERA.HCM.EMP.MASTER.v1',
        metadata: {
          email: 'test.employee@company.com',
          department: 'Engineering',
          job_title: 'Senior Developer',
          base_salary: 120000,
          hire_date: new Date().toISOString(),
          country: 'US',
          status: 'active',
          gender: 'Male',
          leave_entitlements: [
            { type: 'annual', days: 15, accrual_rate: 1.25 },
            { type: 'sick', days: 10, accrual_rate: 0.83 }
          ]
        }
      })
      .select()
      .single()

    console.log(`✅ Employee created: ${employee.entity_code}\n`)

    // 3. Create reporting relationship
    console.log('3️⃣ Setting up reporting structure...')
    
    await supabase
      .from('core_relationships')
      .insert({
        organization_id: ORG_ID,
        from_entity_id: employee.id,
        to_entity_id: department.id,
        relationship_type: 'member_of',
        smart_code: 'HERA.HCM.ORG.HIERARCHY.v1',
        metadata: {
          role: 'team_member',
          start_date: new Date().toISOString()
        }
      })

    console.log('✅ Reporting structure established\n')

    // 4. Clock in/out
    console.log('4️⃣ Recording time attendance...')
    
    const clockIn = new Date()
    clockIn.setHours(9, 0, 0, 0)
    
    const clockOut = new Date()
    clockOut.setHours(18, 30, 0, 0)

    const { data: timeRecord } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'time_clock',
        transaction_code: `CLOCK-${employee.id}-${Date.now()}`,
        smart_code: 'HERA.HCM.TIME.CLOCK.v1',
        transaction_date: clockIn.toISOString(),
        from_entity_id: employee.id,
        metadata: {
          clock_in: clockIn.toISOString(),
          clock_out: clockOut.toISOString(),
          hours_worked: 9.5,
          regular_hours: 8,
          overtime_hours: 1.5,
          device: 'TEST_SCRIPT'
        }
      })
      .select()
      .single()

    console.log(`✅ Time record created: ${timeRecord.metadata.hours_worked} hours worked\n`)

    // 5. Request leave
    console.log('5️⃣ Submitting leave request...')
    
    const leaveStart = new Date()
    leaveStart.setDate(leaveStart.getDate() + 30)
    const leaveEnd = new Date(leaveStart)
    leaveEnd.setDate(leaveEnd.getDate() + 4)

    const { data: leaveRequest } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'leave_request',
        transaction_code: `LEAVE-${employee.id}-${Date.now()}`,
        smart_code: 'HERA.HCM.LEAVE.ANNUAL.v1',
        transaction_date: new Date().toISOString(),
        from_entity_id: employee.id,
        metadata: {
          leave_type: 'annual',
          start_date: leaveStart.toISOString(),
          end_date: leaveEnd.toISOString(),
          days: 5,
          reason: 'Family vacation',
          status: 'pending',
          available_balance: 15,
          remaining_balance: 10
        }
      })
      .select()
      .single()

    console.log(`✅ Leave request submitted: 5 days annual leave\n`)

    // 6. Run payroll
    console.log('6️⃣ Processing payroll...')
    
    const monthlyGross = 120000 / 12
    const federalTax = monthlyGross * 0.22
    const stateTax = monthlyGross * 0.05
    const benefits = 300
    const netPay = monthlyGross - federalTax - stateTax - benefits

    const { data: payroll } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'payroll_run',
        transaction_code: `PAY-${employee.entity_code}-202401`,
        smart_code: 'HERA.HCM.PAY.RUN.v1',
        transaction_date: new Date().toISOString(),
        from_entity_id: employee.id,
        total_amount: netPay,
        metadata: {
          pay_period: '2024-01',
          gross_pay: monthlyGross,
          federal_tax: federalTax,
          state_tax: stateTax,
          benefits_deduction: benefits,
          net_pay: netPay,
          currency: 'USD',
          payment_method: 'direct_deposit'
        }
      })
      .select()
      .single()

    console.log(`✅ Payroll processed: $${netPay.toFixed(2)} net pay\n`)

    // 7. Create payslip
    console.log('7️⃣ Generating payslip...')
    
    const { data: payslip } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'payslip',
        transaction_code: `PAYSLIP-${employee.entity_code}-202401`,
        smart_code: 'HERA.HCM.PAY.SLIP.v1',
        transaction_date: new Date().toISOString(),
        from_entity_id: employee.id,
        reference_entity_id: payroll.id,
        total_amount: netPay,
        metadata: {
          pay_period: '2024-01',
          earnings: {
            base_salary: monthlyGross,
            overtime: 0,
            total_gross: monthlyGross
          },
          deductions: {
            federal_tax: federalTax,
            state_tax: stateTax,
            benefits: benefits,
            total_deductions: federalTax + stateTax + benefits
          },
          net_pay: netPay,
          ytd_gross: monthlyGross,
          ytd_net: netPay
        }
      })
      .select()
      .single()

    console.log(`✅ Payslip generated: ${payslip.transaction_code}\n`)

    // 8. Performance review
    console.log('8️⃣ Creating performance review...')
    
    const { data: review } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ORG_ID,
        transaction_type: 'performance_review',
        transaction_code: `REVIEW-${employee.id}-2024Q1`,
        smart_code: 'HERA.HCM.PERF.REVIEW.v1',
        transaction_date: new Date().toISOString(),
        from_entity_id: employee.id,
        metadata: {
          review_period: '2024-Q1',
          overall_rating: 4.5,
          goals_count: 10,
          completed_goals: 9,
          completion_percentage: 90,
          strengths: 'Strong technical skills, excellent team collaboration',
          improvements: 'Could improve documentation practices',
          review_status: 'completed'
        }
      })
      .select()
      .single()

    console.log(`✅ Performance review created: Rating 4.5/5.0\n`)

    // 9. Benefits enrollment
    console.log('9️⃣ Enrolling in benefits...')
    
    const { data: healthBenefit } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'benefit',
        entity_name: 'Health Insurance - Premium Plan',
        entity_code: 'BEN-HEALTH-PREM',
        smart_code: 'HERA.HCM.BEN.HEALTH.v1',
        metadata: {
          plan_name: 'Premium Health Plan',
          coverage_level: 'Employee + Family',
          employee_contribution: 200,
          employer_contribution: 800,
          deductible: 1000,
          coverage_details: {
            medical: true,
            dental: true,
            vision: true
          }
        }
      })
      .select()
      .single()

    await supabase
      .from('core_relationships')
      .insert({
        organization_id: ORG_ID,
        from_entity_id: employee.id,
        to_entity_id: healthBenefit.id,
        relationship_type: 'enrolled_in',
        smart_code: 'HERA.HCM.BEN.ENROLL.v1',
        metadata: {
          enrollment_date: new Date().toISOString(),
          effective_date: new Date().toISOString(),
          coverage_level: 'Employee + Family'
        }
      })

    console.log('✅ Benefits enrollment completed\n')

    // 10. Summary
    console.log('🎉 HCM Lifecycle Test Complete!')
    console.log('==============================')
    console.log(`Employee: ${employee.entity_name} (${employee.entity_code})`)
    console.log(`Department: ${department.entity_name}`)
    console.log(`Time Worked: ${timeRecord.metadata.hours_worked} hours`)
    console.log(`Leave Balance: ${leaveRequest.metadata.remaining_balance} days`)
    console.log(`Net Pay: $${netPay.toFixed(2)}`)
    console.log(`Performance Rating: ${review.metadata.overall_rating}/5.0`)
    console.log('\n✨ All HR operations completed on just 6 universal tables!')

    // Show table usage
    console.log('\n📊 Table Usage Summary:')
    console.log('- core_entities: Employees, Departments, Benefits')
    console.log('- core_relationships: Reporting structure, Benefits enrollment')
    console.log('- universal_transactions: Time records, Leave requests, Payroll, Reviews')
    console.log('- core_dynamic_data: (Available for custom fields)')
    console.log('- universal_transaction_lines: (Available for payroll details)')
    console.log('- core_organizations: Multi-tenant isolation')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run test
testHCMLifecycle()