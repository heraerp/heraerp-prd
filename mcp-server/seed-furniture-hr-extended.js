#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Kerala Furniture Works (Demo) organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

// Training records
const TRAINING_RECORDS = [
  {
    transaction_type: 'training_session',
    transaction_code: 'TRN-2025-001',
    transaction_date: '2025-01-05',
    smart_code: 'HERA.FURNITURE.HR.TRAINING.SESSION.v1',
    metadata: {
      training_name: 'Advanced CNC Programming',
      trainer: 'External Expert',
      duration_hours: 16,
      department: 'Production',
      completion_rate: 100
    }
  },
  {
    transaction_type: 'training_session',
    transaction_code: 'TRN-2024-Q4-001',
    transaction_date: '2024-12-15',
    smart_code: 'HERA.FURNITURE.HR.TRAINING.SESSION.v1',
    metadata: {
      training_name: 'ISO 9001 Quality Standards',
      trainer: 'Fatima Khan',
      duration_hours: 8,
      department: 'All',
      completion_rate: 100
    }
  },
  {
    transaction_type: 'training_session',
    transaction_code: 'TRN-2024-Q4-002',
    transaction_date: '2024-11-20',
    smart_code: 'HERA.FURNITURE.HR.TRAINING.SESSION.v1',
    metadata: {
      training_name: 'Safety in Woodworking',
      trainer: 'Mohammed Ali',
      duration_hours: 4,
      department: 'Production',
      completion_rate: 100
    }
  }
]

// More attendance records for history
const EXTENDED_ATTENDANCE = [
  {
    transaction_type: 'attendance',
    transaction_code: 'ATT-2025-01-08',
    transaction_date: '2025-01-08',
    smart_code: 'HERA.FURNITURE.HR.ATTENDANCE.DAILY.v1',
    metadata: {
      attendance_date: '2025-01-08',
      shift: 'general',
      total_present: 9,
      total_absent: 1,
      total_leave: 0
    }
  },
  {
    transaction_type: 'attendance',
    transaction_code: 'ATT-2025-01-07',
    transaction_date: '2025-01-07',
    smart_code: 'HERA.FURNITURE.HR.ATTENDANCE.DAILY.v1',
    metadata: {
      attendance_date: '2025-01-07',
      shift: 'general',
      total_present: 10,
      total_absent: 0,
      total_leave: 0
    }
  },
  {
    transaction_type: 'attendance',
    transaction_code: 'ATT-2025-01-06',
    transaction_date: '2025-01-06',
    smart_code: 'HERA.FURNITURE.HR.ATTENDANCE.DAILY.v1',
    metadata: {
      attendance_date: '2025-01-06',
      shift: 'general',
      total_present: 7,
      total_absent: 2,
      total_leave: 1
    }
  },
  {
    transaction_type: 'attendance',
    transaction_code: 'ATT-2025-01-03',
    transaction_date: '2025-01-03',
    smart_code: 'HERA.FURNITURE.HR.ATTENDANCE.DAILY.v1',
    metadata: {
      attendance_date: '2025-01-03',
      shift: 'general',
      total_present: 8,
      total_absent: 1,
      total_leave: 1
    }
  }
]

// More leave requests
const EXTENDED_LEAVES = [
  {
    transaction_type: 'leave_request',
    transaction_code: 'LVE-2025-002',
    transaction_date: '2025-01-08',
    from_entity_id: null, // Will be set to employee ID
    smart_code: 'HERA.FURNITURE.HR.LEAVE.REQUEST.v1',
    metadata: {
      leave_type: 'sick',
      start_date: '2025-01-08',
      end_date: '2025-01-08',
      days: 1,
      reason: 'Medical appointment',
      status: 'approved'
    }
  },
  {
    transaction_type: 'leave_request', 
    transaction_code: 'LVE-2025-003',
    transaction_date: '2025-01-09',
    from_entity_id: null, // Will be set to employee ID
    smart_code: 'HERA.FURNITURE.HR.LEAVE.REQUEST.v1',
    metadata: {
      leave_type: 'annual',
      start_date: '2025-01-20',
      end_date: '2025-01-22',
      days: 3,
      reason: 'Family function',
      status: 'pending'
    }
  }
]

// Payroll transactions
const PAYROLL_TRANSACTIONS = [
  {
    transaction_type: 'payroll_run',
    transaction_code: 'PAY-2024-12',
    transaction_date: '2024-12-31',
    smart_code: 'HERA.FURNITURE.HR.PAYROLL.MONTHLY.v1',
    total_amount: 415000,
    metadata: {
      payroll_month: '2024-12',
      employee_count: 10,
      basic_total: 320000,
      allowances_total: 95000,
      deductions_total: 0,
      status: 'processed'
    }
  },
  {
    transaction_type: 'overtime_approval',
    transaction_code: 'OT-2025-001',
    transaction_date: '2025-01-08',
    from_entity_id: null, // Will be set to employee ID
    smart_code: 'HERA.FURNITURE.HR.OVERTIME.APPROVAL.v1',
    total_amount: 3500,
    metadata: {
      overtime_hours: 15,
      rate_per_hour: 233.33,
      month: '2025-01',
      status: 'pending'
    }
  },
  {
    transaction_type: 'bonus_approval',
    transaction_code: 'BON-2025-001',
    transaction_date: '2025-01-09',
    from_entity_id: null, // Will be set to employee ID
    smart_code: 'HERA.FURNITURE.HR.BONUS.APPROVAL.v1',
    total_amount: 10000,
    metadata: {
      bonus_type: 'performance',
      reason: 'Excellent project completion',
      month: '2025-01',
      status: 'pending'
    }
  }
]

// Department entities
const DEPARTMENTS = [
  {
    entity_type: 'department',
    entity_code: 'DEPT-MGT',
    entity_name: 'Management',
    smart_code: 'HERA.FURNITURE.HR.DEPARTMENT.v1',
    metadata: {
      head_count: 2,
      department_head: 'Rajesh Kumar'
    }
  },
  {
    entity_type: 'department',
    entity_code: 'DEPT-PRD',
    entity_name: 'Production',
    smart_code: 'HERA.FURNITURE.HR.DEPARTMENT.v1',
    metadata: {
      head_count: 5,
      department_head: 'Priya Sharma'
    }
  },
  {
    entity_type: 'department',
    entity_code: 'DEPT-QC',
    entity_name: 'Quality Control',
    smart_code: 'HERA.FURNITURE.HR.DEPARTMENT.v1',
    metadata: {
      head_count: 1,
      department_head: 'Fatima Khan'
    }
  },
  {
    entity_type: 'department',
    entity_code: 'DEPT-SLS',
    entity_name: 'Sales',
    smart_code: 'HERA.FURNITURE.HR.DEPARTMENT.v1',
    metadata: {
      head_count: 1,
      department_head: 'Anita Menon'
    }
  },
  {
    entity_type: 'department',
    entity_code: 'DEPT-ADM',
    entity_name: 'Administration',
    smart_code: 'HERA.FURNITURE.HR.DEPARTMENT.v1',
    metadata: {
      head_count: 1,
      department_head: 'Ravi Krishnan'
    }
  }
]

async function seedExtendedHRData() {
  console.log('📊 Starting Extended Furniture HR data seeding...')
  console.log(`📍 Organization ID: ${FURNITURE_ORG_ID}`)

  try {
    // Get existing employees
    const { data: employees } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('entity_type', 'employee')

    const employeeMap = {}
    employees?.forEach(emp => {
      employeeMap[emp.entity_code] = emp.id
    })

    // Create departments
    console.log('\n🏢 Creating departments...')
    for (const dept of DEPARTMENTS) {
      const { error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: FURNITURE_ORG_ID,
          ...dept,
          status: 'active'
        })

      if (!error) {
        console.log(`✅ Created department: ${dept.entity_name}`)
      }
    }

    // Create training records
    console.log('\n📚 Creating training records...')
    for (const training of TRAINING_RECORDS) {
      const { data, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: FURNITURE_ORG_ID,
          ...training
        })
        .select()
        .single()

      if (!error && data) {
        console.log(`✅ Created training: ${training.metadata.training_name}`)
        
        // Add participants
        if (training.metadata.department === 'Production') {
          const participants = ['EMP-PRD-001', 'EMP-PRD-002', 'EMP-PRD-003', 'EMP-PRD-004']
          let lineNo = 1
          for (const empCode of participants) {
            await supabase
              .from('universal_transaction_lines')
              .insert({
                organization_id: FURNITURE_ORG_ID,
                transaction_id: data.id,
                line_number: lineNo++,
                entity_id: employeeMap[empCode],
                line_type: 'participant',
                quantity: training.metadata.duration_hours,
                smart_code: 'HERA.FURNITURE.HR.TRAINING.PARTICIPANT.v1',
                line_data: {
                  completion_status: 'completed',
                  score: Math.floor(Math.random() * 20) + 80 // 80-100 score
                }
              })
          }
        }
      }
    }

    // Create extended attendance
    console.log('\n📅 Creating extended attendance records...')
    for (const attendance of EXTENDED_ATTENDANCE) {
      await supabase
        .from('universal_transactions')
        .insert({
          organization_id: FURNITURE_ORG_ID,
          ...attendance
        })
    }

    // Create extended leaves
    console.log('\n🏖️ Creating extended leave requests...')
    EXTENDED_LEAVES[0].from_entity_id = employeeMap['EMP-PRD-002'] // Suresh Babu
    EXTENDED_LEAVES[1].from_entity_id = employeeMap['EMP-SLS-001'] // Anita Menon
    
    for (const leave of EXTENDED_LEAVES) {
      await supabase
        .from('universal_transactions')
        .insert({
          organization_id: FURNITURE_ORG_ID,
          ...leave
        })
    }

    // Create payroll transactions
    console.log('\n💰 Creating payroll transactions...')
    PAYROLL_TRANSACTIONS[1].from_entity_id = employeeMap['EMP-PRD-001'] // Mohammed Ali overtime
    PAYROLL_TRANSACTIONS[2].from_entity_id = employeeMap['EMP-PRD-004'] // Joseph Thomas bonus
    
    for (const payroll of PAYROLL_TRANSACTIONS) {
      const { data, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: FURNITURE_ORG_ID,
          ...payroll
        })
        .select()
        .single()

      if (!error && data && payroll.transaction_type === 'payroll_run') {
        console.log(`✅ Created payroll: ${payroll.transaction_code}`)
        
        // Add payroll lines for each employee
        let lineNo = 1
        for (const [empCode, empId] of Object.entries(employeeMap)) {
          const salaryData = {
            'EMP-MGT-001': { basic: 75000, allowances: 25000 },
            'EMP-MGT-002': { basic: 60000, allowances: 20000 },
            'EMP-PRD-001': { basic: 35000, allowances: 10000 },
            'EMP-PRD-002': { basic: 28000, allowances: 8000 },
            'EMP-PRD-003': { basic: 25000, allowances: 7000 },
            'EMP-PRD-004': { basic: 30000, allowances: 8500 },
            'EMP-QC-001': { basic: 32000, allowances: 9000 },
            'EMP-SLS-001': { basic: 26000, allowances: 7500 },
            'EMP-ADM-001': { basic: 28000, allowances: 8000 },
            'EMP-CTR-001': { basic: 15000, allowances: 0 }
          }
          
          const salary = salaryData[empCode]
          if (salary) {
            await supabase
              .from('universal_transaction_lines')
              .insert({
                organization_id: FURNITURE_ORG_ID,
                transaction_id: data.id,
                line_number: lineNo++,
                entity_id: empId,
                line_type: 'payroll',
                quantity: 1,
                line_amount: salary.basic + salary.allowances,
                smart_code: 'HERA.FURNITURE.HR.PAYROLL.LINE.v1',
                line_data: {
                  basic_salary: salary.basic,
                  allowances: salary.allowances,
                  deductions: 0,
                  net_pay: salary.basic + salary.allowances
                }
              })
          }
        }
      } else if (!error) {
        console.log(`✅ Created ${payroll.transaction_type}: ${payroll.transaction_code}`)
      }
    }

    // Calculate and store training hours
    const { data: allTraining } = await supabase
      .from('universal_transactions')
      .select('*, universal_transaction_lines(*)')
      .eq('organization_id', FURNITURE_ORG_ID)
      .eq('transaction_type', 'training_session')

    const totalTrainingHours = allTraining?.reduce((sum, training) => {
      const hours = training.metadata?.duration_hours || 0
      const participants = training.universal_transaction_lines?.length || 1
      return sum + (hours * participants)
    }, 0) || 0

    // Store training hours as dynamic data
    const { data: hrEntity } = await supabase
      .from('core_entities')
      .insert({
        organization_id: FURNITURE_ORG_ID,
        entity_type: 'hr_metrics',
        entity_code: 'HR-METRICS-2025',
        entity_name: 'HR Metrics Q1 2025',
        smart_code: 'HERA.FURNITURE.HR.METRICS.v1',
        status: 'active'
      })
      .select()
      .single()

    if (hrEntity) {
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: FURNITURE_ORG_ID,
          entity_id: hrEntity.id,
          field_name: 'total_training_hours_qtd',
          field_value_number: totalTrainingHours,
          smart_code: 'HERA.FURNITURE.HR.METRICS.v1'
        })
    }

    console.log('\n✅ Extended HR data seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error during extended HR seeding:', error)
  }
}

seedExtendedHRData().catch(console.error)