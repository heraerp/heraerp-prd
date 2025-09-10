#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Kerala Furniture Works (Demo) organization ID
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

// Employee data
const EMPLOYEES = [
  // Management
  {
    entity_code: 'EMP-MGT-001',
    entity_name: 'Rajesh Kumar',
    entity_type: 'employee',
    smart_code: 'HERA.FURNITURE.HR.EMPLOYEE.MANAGEMENT.v1',
    metadata: {
      department: 'Management',
      position: 'General Manager',
      employee_type: 'permanent',
      grade: 'M1'
    }
  },
  {
    entity_code: 'EMP-MGT-002',
    entity_name: 'Priya Sharma',
    entity_type: 'employee',
    smart_code: 'HERA.FURNITURE.HR.EMPLOYEE.MANAGEMENT.v1',
    metadata: {
      department: 'Management',
      position: 'Production Manager',
      employee_type: 'permanent',
      grade: 'M2'
    }
  },
  // Production Staff
  {
    entity_code: 'EMP-PRD-001',
    entity_name: 'Mohammed Ali',
    entity_type: 'employee',
    smart_code: 'HERA.FURNITURE.HR.EMPLOYEE.PRODUCTION.v1',
    metadata: {
      department: 'Production',
      position: 'Senior Carpenter',
      employee_type: 'permanent',
      grade: 'S3',
      skills: ['woodworking', 'cnc_operation', 'finishing']
    }
  },
  {
    entity_code: 'EMP-PRD-002',
    entity_name: 'Suresh Babu',
    entity_type: 'employee',
    smart_code: 'HERA.FURNITURE.HR.EMPLOYEE.PRODUCTION.v1',
    metadata: {
      department: 'Production',
      position: 'CNC Operator',
      employee_type: 'permanent',
      grade: 'S2',
      skills: ['cnc_programming', 'machine_maintenance']
    }
  },
  {
    entity_code: 'EMP-PRD-003',
    entity_name: 'Arun Nair',
    entity_type: 'employee',
    smart_code: 'HERA.FURNITURE.HR.EMPLOYEE.PRODUCTION.v1',
    metadata: {
      department: 'Production',
      position: 'Assembly Technician',
      employee_type: 'permanent',
      grade: 'S1',
      skills: ['assembly', 'quality_check']
    }
  },
  {
    entity_code: 'EMP-PRD-004',
    entity_name: 'Joseph Thomas',
    entity_type: 'employee',
    smart_code: 'HERA.FURNITURE.HR.EMPLOYEE.PRODUCTION.v1',
    metadata: {
      department: 'Production',
      position: 'Polishing Expert',
      employee_type: 'permanent',
      grade: 'S2',
      skills: ['polishing', 'finishing', 'lacquering']
    }
  },
  // Quality Control
  {
    entity_code: 'EMP-QC-001',
    entity_name: 'Fatima Khan',
    entity_type: 'employee',
    smart_code: 'HERA.FURNITURE.HR.EMPLOYEE.QUALITY.v1',
    metadata: {
      department: 'Quality Control',
      position: 'Quality Inspector',
      employee_type: 'permanent',
      grade: 'Q2',
      certifications: ['iso9001', 'quality_auditor']
    }
  },
  // Sales & Admin
  {
    entity_code: 'EMP-SLS-001',
    entity_name: 'Anita Menon',
    entity_type: 'employee',
    smart_code: 'HERA.FURNITURE.HR.EMPLOYEE.SALES.v1',
    metadata: {
      department: 'Sales',
      position: 'Sales Executive',
      employee_type: 'permanent',
      grade: 'S2'
    }
  },
  {
    entity_code: 'EMP-ADM-001',
    entity_name: 'Ravi Krishnan',
    entity_type: 'employee',
    smart_code: 'HERA.FURNITURE.HR.EMPLOYEE.ADMIN.v1',
    metadata: {
      department: 'Administration',
      position: 'HR Manager',
      employee_type: 'permanent',
      grade: 'A2'
    }
  },
  // Contract Workers
  {
    entity_code: 'EMP-CTR-001',
    entity_name: 'Vijay Kumar',
    entity_type: 'employee',
    smart_code: 'HERA.FURNITURE.HR.EMPLOYEE.CONTRACT.v1',
    metadata: {
      department: 'Production',
      position: 'Helper',
      employee_type: 'contract',
      grade: 'C1',
      contract_end_date: '2025-06-30'
    }
  }
]

// Dynamic field data for employees
const EMPLOYEE_DYNAMIC_DATA = {
  'EMP-MGT-001': {
    join_date: '2015-03-15',
    basic_salary: 75000,
    allowances: 25000,
    phone: '+91-9876543210',
    email: 'rajesh.kumar@keralafurniture.com',
    emergency_contact: '+91-9876543211',
    bank_account: 'HDFC0001234567890',
    pan_number: 'ABCDE1234F',
    aadhaar_number: '1234-5678-9012'
  },
  'EMP-MGT-002': {
    join_date: '2018-06-01',
    basic_salary: 60000,
    allowances: 20000,
    phone: '+91-9876543212',
    email: 'priya.sharma@keralafurniture.com',
    emergency_contact: '+91-9876543213',
    bank_account: 'ICIC0001234567891',
    pan_number: 'FGHIJ5678K',
    aadhaar_number: '2345-6789-0123'
  },
  'EMP-PRD-001': {
    join_date: '2010-01-10',
    basic_salary: 35000,
    allowances: 10000,
    phone: '+91-9876543214',
    email: 'mohammed.ali@keralafurniture.com',
    emergency_contact: '+91-9876543215',
    years_experience: 15,
    certifications: 'Advanced Woodworking Certificate',
    bank_account: 'SBIN0001234567892',
    pan_number: 'KLMNO9012L',
    aadhaar_number: '3456-7890-1234'
  },
  'EMP-PRD-002': {
    join_date: '2019-04-20',
    basic_salary: 28000,
    allowances: 8000,
    phone: '+91-9876543216',
    email: 'suresh.babu@keralafurniture.com',
    emergency_contact: '+91-9876543217',
    years_experience: 8,
    machine_licenses: 'CNC-L2,CAD-L3',
    bank_account: 'HDFC0001234567893',
    pan_number: 'PQRST3456M',
    aadhaar_number: '4567-8901-2345'
  },
  'EMP-QC-001': {
    join_date: '2020-08-15',
    basic_salary: 32000,
    allowances: 9000,
    phone: '+91-9876543218',
    email: 'fatima.khan@keralafurniture.com',
    emergency_contact: '+91-9876543219',
    inspection_certifications: 'ISO Lead Auditor',
    bank_account: 'AXIS0001234567894',
    pan_number: 'UVWXY7890N',
    aadhaar_number: '5678-9012-3456'
  }
}

// Attendance records for current month
const ATTENDANCE_RECORDS = [
  {
    transaction_type: 'attendance',
    transaction_code: 'ATT-2025-01-09',
    transaction_date: '2025-01-09',
    smart_code: 'HERA.FURNITURE.HR.ATTENDANCE.DAILY.v1',
    metadata: {
      attendance_date: '2025-01-09',
      shift: 'general',
      total_present: 8,
      total_absent: 2,
      total_leave: 0
    }
  }
]

// Leave records
const LEAVE_RECORDS = [
  {
    transaction_type: 'leave_request',
    transaction_code: 'LVE-2025-001',
    transaction_date: '2025-01-05',
    from_entity_id: null, // Will be set to employee ID
    smart_code: 'HERA.FURNITURE.HR.LEAVE.REQUEST.v1',
    metadata: {
      leave_type: 'annual',
      start_date: '2025-01-15',
      end_date: '2025-01-17',
      days: 3,
      reason: 'Personal work',
      status: 'approved'
    }
  }
]

async function seedHRData() {
  console.log('👥 Starting Furniture HR data seeding...')
  console.log(`📍 Organization ID: ${FURNITURE_ORG_ID}`)

  try {
    // Create employees
    console.log('\n🧑‍💼 Creating employees...')
    const employeeMap = {}
    
    for (const employee of EMPLOYEES) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: FURNITURE_ORG_ID,
          ...employee,
          status: 'active'
        })
        .select()
        .single()

      if (!error && data) {
        console.log(`✅ Created employee: ${employee.entity_name} (${employee.entity_code})`)
        employeeMap[employee.entity_code] = data.id
        
        // Add dynamic data
        const dynamicData = EMPLOYEE_DYNAMIC_DATA[employee.entity_code]
        if (dynamicData) {
          for (const [field, value] of Object.entries(dynamicData)) {
            const fieldType = typeof value === 'number' ? 'field_value_number' : 'field_value_text'
            
            await supabase
              .from('core_dynamic_data')
              .insert({
                organization_id: FURNITURE_ORG_ID,
                entity_id: data.id,
                field_name: field,
                [fieldType]: value,
                smart_code: employee.smart_code
              })
          }
        }
      } else {
        console.error(`❌ Error creating employee ${employee.entity_name}:`, error?.message)
      }
    }

    // Create reporting relationships
    console.log('\n🔗 Creating reporting relationships...')
    
    // Production staff report to Production Manager
    const prodManagerId = employeeMap['EMP-MGT-002']
    const prodStaff = ['EMP-PRD-001', 'EMP-PRD-002', 'EMP-PRD-003', 'EMP-PRD-004', 'EMP-QC-001']
    
    for (const staffCode of prodStaff) {
      if (employeeMap[staffCode] && prodManagerId) {
        await supabase
          .from('core_relationships')
          .insert({
            organization_id: FURNITURE_ORG_ID,
            from_entity_id: employeeMap[staffCode],
            to_entity_id: prodManagerId,
            relationship_type: 'reports_to',
            smart_code: 'HERA.FURNITURE.HR.REL.REPORTING.v1',
            metadata: {
              reporting_level: 1,
              department: 'Production'
            }
          })
      }
    }

    // Production Manager reports to General Manager
    if (prodManagerId && employeeMap['EMP-MGT-001']) {
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: FURNITURE_ORG_ID,
          from_entity_id: prodManagerId,
          to_entity_id: employeeMap['EMP-MGT-001'],
          relationship_type: 'reports_to',
          smart_code: 'HERA.FURNITURE.HR.REL.REPORTING.v1',
          metadata: {
            reporting_level: 1,
            department: 'Management'
          }
        })
    }

    // Create attendance records
    console.log('\n📅 Creating attendance records...')
    
    for (const attendance of ATTENDANCE_RECORDS) {
      const { data, error } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: FURNITURE_ORG_ID,
          ...attendance
        })
        .select()
        .single()

      if (!error && data) {
        console.log(`✅ Created attendance record: ${attendance.transaction_code}`)
        
        // Add attendance lines for each employee
        const attendanceLines = []
        let lineNo = 1
        
        for (const [empCode, empId] of Object.entries(employeeMap)) {
          if (empCode !== 'EMP-CTR-001') { // Exclude contract worker for this date
            attendanceLines.push({
              organization_id: FURNITURE_ORG_ID,
              transaction_id: data.id,
              line_number: lineNo++,
              entity_id: empId,
              line_type: 'attendance',
              quantity: 1,
              smart_code: 'HERA.FURNITURE.HR.ATTENDANCE.LINE.v1',
              line_data: {
                status: 'present',
                check_in: '09:00',
                check_out: '18:00',
                hours_worked: 9,
                overtime_hours: 0
              }
            })
          }
        }
        
        if (attendanceLines.length > 0) {
          await supabase
            .from('universal_transaction_lines')
            .insert(attendanceLines)
        }
      }
    }

    // Create leave records
    console.log('\n🏖️ Creating leave records...')
    
    for (const leave of LEAVE_RECORDS) {
      leave.from_entity_id = employeeMap['EMP-PRD-003'] // Arun Nair's leave
      
      await supabase
        .from('universal_transactions')
        .insert({
          organization_id: FURNITURE_ORG_ID,
          ...leave
        })
    }

    console.log('\n✅ HR data seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error during HR seeding:', error)
  }
}

seedHRData().catch(console.error)