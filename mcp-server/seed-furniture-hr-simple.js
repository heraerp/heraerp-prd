#!/usr/bin/env node

/**
 * Simple Furniture HR Seed Data
 * Creates employee dynamic fields and relationships
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Kerala Furniture Works organization
const KERALA_FURNITURE_ORG = 'f0af4ced-9d12-4a55-a649-b484368db249'

async function main() {
  console.log('🏭 Kerala Furniture Works - HR Data Seeding')
  console.log('📍 Organization ID:', KERALA_FURNITURE_ORG)
  
  // 1. Get all employees
  console.log('\n📊 Fetching existing employees...')
  const { data: employees, error: empError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', KERALA_FURNITURE_ORG)
    .eq('entity_type', 'employee')
  
  if (empError) {
    console.error('Error fetching employees:', empError)
    return
  }
  
  console.log(`✅ Found ${employees.length} employees`)
  
  // 2. Get departments
  const { data: departments, error: deptError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', KERALA_FURNITURE_ORG)
    .eq('entity_type', 'department')
  
  if (deptError) {
    console.error('Error fetching departments:', deptError)
    return
  }
  
  console.log(`✅ Found ${departments.length} departments`)
  
  // 3. Create dynamic fields for employees
  console.log('\n📝 Creating employee dynamic fields...')
  
  const dynamicFields = []
  const employeeData = {
    'EMP-001': { 
      salary: 35000, 
      hire_date: '2022-03-15', 
      phone: '+91 9876543210',
      designation: 'Production Supervisor',
      department: 'DEPT-PRD'
    },
    'EMP-002': { 
      salary: 30000, 
      hire_date: '2022-06-01', 
      phone: '+91 9876543211',
      designation: 'Senior Carpenter',
      department: 'DEPT-PRD'
    },
    'EMP-MGT-001': { 
      salary: 75000, 
      hire_date: '2020-01-10', 
      phone: '+91 9876543212',
      designation: 'General Manager',
      department: 'DEPT-MGT'
    },
    'EMP-MGT-002': { 
      salary: 60000, 
      hire_date: '2021-04-15', 
      phone: '+91 9876543213',
      designation: 'Operations Manager',
      department: 'DEPT-MGT'
    },
    'EMP-PRD-001': { 
      salary: 28000, 
      hire_date: '2023-02-01', 
      phone: '+91 9876543214',
      designation: 'Carpenter',
      department: 'DEPT-PRD'
    },
    'EMP-PRD-002': { 
      salary: 28000, 
      hire_date: '2023-03-15', 
      phone: '+91 9876543215',
      designation: 'Furniture Finisher',
      department: 'DEPT-PRD'
    },
    'EMP-PRD-003': { 
      salary: 26000, 
      hire_date: '2023-07-01', 
      phone: '+91 9876543216',
      designation: 'Assistant Carpenter',
      department: 'DEPT-PRD'
    },
    'QI-001': { 
      salary: 32000, 
      hire_date: '2022-08-01', 
      phone: '+91 9876543217',
      designation: 'Senior Quality Inspector',
      department: 'DEPT-QC'
    },
    'QI-002': { 
      salary: 28000, 
      hire_date: '2023-01-15', 
      phone: '+91 9876543218',
      designation: 'Quality Inspector',
      department: 'DEPT-QC'
    },
    'QI-003': { 
      salary: 26000, 
      hire_date: '2023-09-01', 
      phone: '+91 9876543219',
      designation: 'Junior Quality Inspector',
      department: 'DEPT-QC'
    }
  }
  
  // Create dynamic fields for each employee
  for (const employee of employees) {
    const empData = employeeData[employee.entity_code]
    if (!empData) continue
    
    // Create salary field
    dynamicFields.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      entity_id: employee.id,
      field_name: 'salary',
      field_value_number: empData.salary,
      smart_code: 'HERA.FURNITURE.HR.FIELD.SALARY.v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Create hire date field
    dynamicFields.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      entity_id: employee.id,
      field_name: 'hire_date',
      field_value_date: empData.hire_date,
      smart_code: 'HERA.FURNITURE.HR.FIELD.HIRE_DATE.v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Create phone field
    dynamicFields.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      entity_id: employee.id,
      field_name: 'phone',
      field_value_text: empData.phone,
      smart_code: 'HERA.FURNITURE.HR.FIELD.PHONE.v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Create designation field
    dynamicFields.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      entity_id: employee.id,
      field_name: 'designation',
      field_value_text: empData.designation,
      smart_code: 'HERA.FURNITURE.HR.FIELD.DESIGNATION.v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Create email field
    const email = employee.entity_name.toLowerCase().replace(/\s+/g, '.') + '@keralafurniture.com'
    dynamicFields.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      entity_id: employee.id,
      field_name: 'email',
      field_value_text: email,
      smart_code: 'HERA.FURNITURE.HR.FIELD.EMAIL.v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  // Insert dynamic fields
  if (dynamicFields.length > 0) {
    const { error } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicFields)
    
    if (error) {
      console.error('Error inserting dynamic fields:', error)
    } else {
      console.log(`✅ Created ${dynamicFields.length} dynamic fields`)
    }
  }
  
  // 4. Create employee-department relationships
  console.log('\n🔗 Creating employee-department relationships...')
  
  const relationships = []
  
  for (const employee of employees) {
    const empData = employeeData[employee.entity_code]
    if (!empData || !empData.department) continue
    
    const department = departments.find(d => d.entity_code === empData.department)
    if (!department) continue
    
    relationships.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      from_entity_id: employee.id,
      to_entity_id: department.id,
      relationship_type: 'belongs_to',
      smart_code: 'HERA.FURNITURE.HR.REL.EMPLOYEE_DEPARTMENT.v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  if (relationships.length > 0) {
    const { error } = await supabase
      .from('core_relationships')
      .insert(relationships)
    
    if (error) {
      console.error('Error creating relationships:', error)
    } else {
      console.log(`✅ Created ${relationships.length} employee-department relationships`)
    }
  }
  
  // 5. Create some attendance records (transactions)
  console.log('\n📅 Creating sample attendance records...')
  
  const today = new Date()
  const attendanceRecords = []
  
  // Create attendance for today for first 5 employees
  const employeesForAttendance = employees.slice(0, 5)
  
  for (const employee of employeesForAttendance) {
    attendanceRecords.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      transaction_type: 'attendance',
      transaction_code: `ATT-${today.toISOString().split('T')[0]}-${employee.entity_code}`,
      transaction_date: today.toISOString(),
      source_entity_id: employee.id,
      smart_code: 'HERA.FURNITURE.HR.TXN.ATTENDANCE.v1',
      metadata: {
        check_in: '09:00',
        check_out: '18:00',
        status: 'present',
        hours_worked: 9
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  if (attendanceRecords.length > 0) {
    const { error } = await supabase
      .from('universal_transactions')
      .insert(attendanceRecords)
    
    if (error) {
      console.error('Error creating attendance records:', error)
    } else {
      console.log(`✅ Created ${attendanceRecords.length} attendance records for today`)
    }
  }
  
  console.log('\n✅ HR data seeding complete!')
  console.log('\n📊 Summary:')
  console.log(`- Employees with dynamic fields: ${Object.keys(employeeData).length}`)
  console.log(`- Fields per employee: 5 (salary, hire_date, phone, designation, email)`)
  console.log(`- Employee-department relationships: ${relationships.length}`)
  console.log(`- Attendance records: ${attendanceRecords.length}`)
}

// Run the script
main().catch(console.error)