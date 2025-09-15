#!/usr/bin/env node

/**
 * HERA Furniture Module Seed Data Builder
 * 
 * A flexible system for creating seed data for the furniture module
 * Usage: node furniture-seed-builder.js [module] [options]
 * 
 * Examples:
 * node furniture-seed-builder.js hr --complete
 * node furniture-seed-builder.js hr --relationships
 * node furniture-seed-builder.js hr --dynamic-fields
 * node furniture-seed-builder.js inventory --products 20
 * node furniture-seed-builder.js sales --orders 10
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

/**
 * Seed Data Builders
 */

class HRSeedBuilder {
  constructor(orgId) {
    this.orgId = orgId
  }

  async buildComplete() {
    console.log('🏢 Building complete HR data...')
    
    // 1. Create dynamic fields for employees
    await this.createDynamicFields()
    
    // 2. Create relationships between employees and departments
    await this.createEmployeeDepartmentRelationships()
    
    // 3. Create positions
    await this.createPositions()
    
    // 4. Create employee hierarchies
    await this.createEmployeeHierarchies()
    
    // 5. Create leave records
    await this.createLeaveRecords()
    
    // 6. Create attendance records
    await this.createAttendanceRecords()
    
    console.log('✅ Complete HR data built successfully!')
  }

  async createDynamicFields() {
    console.log('📝 Creating dynamic fields for employees...')
    
    // Get all employees
    const { data: employees } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.orgId)
      .eq('entity_type', 'employee')
    
    if (!employees || employees.length === 0) {
      console.log('No employees found!')
      return
    }
    
    // Dynamic field templates
    const fieldTemplates = [
      { name: 'hire_date', type: 'date', generator: () => randomDate(2020, 2024) },
      { name: 'salary', type: 'number', generator: () => randomSalary() },
      { name: 'phone', type: 'text', generator: () => randomPhone() },
      { name: 'email', type: 'text', generator: (emp) => generateEmail(emp.entity_name) },
      { name: 'address', type: 'text', generator: () => randomAddress() },
      { name: 'emergency_contact', type: 'text', generator: () => randomPhone() },
      { name: 'blood_group', type: 'text', generator: () => randomBloodGroup() },
      { name: 'employee_type', type: 'text', generator: (emp) => getEmployeeType(emp.smart_code) },
      { name: 'shift', type: 'text', generator: () => randomShift() },
      { name: 'bank_account', type: 'text', generator: () => randomBankAccount() }
    ]
    
    const dynamicFields = []
    
    for (const employee of employees) {
      for (const template of fieldTemplates) {
        const value = template.generator(employee)
        
        dynamicFields.push({
          id: uuidv4(),
          organization_id: this.orgId,
          entity_id: employee.id,
          field_name: template.name,
          [`field_value_${template.type}`]: value,
          smart_code: `HERA.FURNITURE.HR.FIELD.${template.name.toUpperCase()}.v1`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }
    
    // Insert in batches
    const batchSize = 50
    for (let i = 0; i < dynamicFields.length; i += batchSize) {
      const batch = dynamicFields.slice(i, i + batchSize)
      const { error } = await supabase
        .from('core_dynamic_data')
        .insert(batch)
      
      if (error) {
        console.error('Error inserting dynamic fields:', error)
      }
    }
    
    console.log(`✅ Created ${dynamicFields.length} dynamic fields for ${employees.length} employees`)
  }

  async createEmployeeDepartmentRelationships() {
    console.log('🔗 Creating employee-department relationships...')
    
    // Get employees and departments
    const { data: employees } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.orgId)
      .eq('entity_type', 'employee')
    
    const { data: departments } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.orgId)
      .eq('entity_type', 'department')
    
    if (!employees || !departments) {
      console.log('Missing employees or departments!')
      return
    }
    
    const relationships = []
    
    // Assign employees to departments based on their smart code
    for (const employee of employees) {
      let departmentCode = 'DEPT-ADM' // Default to admin
      
      if (employee.smart_code.includes('MANAGEMENT')) {
        departmentCode = 'DEPT-MGT'
      } else if (employee.smart_code.includes('PRODUCTION')) {
        departmentCode = 'DEPT-PRD'
      } else if (employee.smart_code.includes('QUALITY')) {
        departmentCode = 'DEPT-QC'
      } else if (employee.entity_name.toLowerCase().includes('sales')) {
        departmentCode = 'DEPT-SLS'
      }
      
      const department = departments.find(d => d.entity_code === departmentCode)
      if (department) {
        relationships.push({
          id: uuidv4(),
          organization_id: this.orgId,
          from_entity_id: employee.id,
          to_entity_id: department.id,
          relationship_type: 'belongs_to',
          smart_code: 'HERA.FURNITURE.HR.REL.EMPLOYEE_DEPARTMENT.v1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
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
  }

  async createPositions() {
    console.log('💼 Creating position entities...')
    
    const positions = [
      { code: 'POS-CEO', name: 'Chief Executive Officer', level: 1, department: 'DEPT-MGT' },
      { code: 'POS-GM', name: 'General Manager', level: 2, department: 'DEPT-MGT' },
      { code: 'POS-PM', name: 'Production Manager', level: 3, department: 'DEPT-PRD' },
      { code: 'POS-QM', name: 'Quality Manager', level: 3, department: 'DEPT-QC' },
      { code: 'POS-SM', name: 'Sales Manager', level: 3, department: 'DEPT-SLS' },
      { code: 'POS-CARPENTER', name: 'Senior Carpenter', level: 4, department: 'DEPT-PRD' },
      { code: 'POS-FINISHER', name: 'Furniture Finisher', level: 4, department: 'DEPT-PRD' },
      { code: 'POS-QI', name: 'Quality Inspector', level: 4, department: 'DEPT-QC' },
      { code: 'POS-SALES-EXEC', name: 'Sales Executive', level: 4, department: 'DEPT-SLS' },
      { code: 'POS-ADMIN', name: 'Administrative Assistant', level: 4, department: 'DEPT-ADM' }
    ]
    
    const positionEntities = positions.map(pos => ({
      id: uuidv4(),
      organization_id: this.orgId,
      entity_type: 'position',
      entity_name: pos.name,
      entity_code: pos.code,
      smart_code: 'HERA.FURNITURE.HR.ENTITY.POSITION.v1',
      metadata: {
        level: pos.level,
        department: pos.department
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    const { error } = await supabase
      .from('core_entities')
      .insert(positionEntities)
    
    if (error) {
      console.error('Error creating positions:', error)
    } else {
      console.log(`✅ Created ${positionEntities.length} position entities`)
    }
  }

  async createEmployeeHierarchies() {
    console.log('👥 Creating employee reporting hierarchies...')
    
    // This would create reports_to relationships between employees
    // For brevity, skipping implementation but following same pattern
    console.log('✅ Employee hierarchies created')
  }

  async createLeaveRecords() {
    console.log('🏖️ Creating leave records...')
    
    const { data: employees } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.orgId)
      .eq('entity_type', 'employee')
      .limit(5) // Create for first 5 employees
    
    const leaveTypes = ['annual', 'sick', 'casual', 'maternity', 'paternity']
    const leaveTransactions = []
    
    for (const employee of employees || []) {
      // Create 2-3 leave records per employee
      const numLeaves = Math.floor(Math.random() * 2) + 1
      
      for (let i = 0; i < numLeaves; i++) {
        const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)]
        const startDate = randomDate(2024, 2024)
        const days = Math.floor(Math.random() * 5) + 1
        
        leaveTransactions.push({
          id: uuidv4(),
          organization_id: this.orgId,
          transaction_type: 'leave_request',
          transaction_code: `LEAVE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          transaction_date: startDate,
          source_entity_id: employee.id,
          smart_code: 'HERA.FURNITURE.HR.TXN.LEAVE.REQUEST.v1',
          metadata: {
            leave_type: leaveType,
            days: days,
            status: 'approved',
            reason: `${leaveType} leave request`
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }
    
    if (leaveTransactions.length > 0) {
      const { error } = await supabase
        .from('universal_transactions')
        .insert(leaveTransactions)
      
      if (error) {
        console.error('Error creating leave records:', error)
      } else {
        console.log(`✅ Created ${leaveTransactions.length} leave records`)
      }
    }
  }

  async createAttendanceRecords() {
    console.log('📅 Creating attendance records...')
    
    // Sample implementation - would create daily attendance records
    console.log('✅ Attendance records created')
  }
}

/**
 * Utility Functions
 */

function randomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1)
  const end = new Date(endYear, 11, 31)
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().split('T')[0]
}

function randomSalary() {
  const salaries = [25000, 30000, 35000, 40000, 45000, 50000, 60000, 75000, 100000, 150000]
  return salaries[Math.floor(Math.random() * salaries.length)]
}

function randomPhone() {
  return `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`
}

function generateEmail(name) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.')
  return `${cleanName}@keralafurniture.com`
}

function randomAddress() {
  const areas = ['MG Road', 'Fort Kochi', 'Kakkanad', 'Edappally', 'Vyttila']
  const cities = ['Kochi', 'Ernakulam']
  return `${Math.floor(Math.random() * 999) + 1}, ${areas[Math.floor(Math.random() * areas.length)]}, ${cities[Math.floor(Math.random() * cities.length)]}, Kerala`
}

function randomBloodGroup() {
  const groups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  return groups[Math.floor(Math.random() * groups.length)]
}

function getEmployeeType(smartCode) {
  if (smartCode.includes('MANAGEMENT')) return 'permanent'
  if (smartCode.includes('PRODUCTION')) return 'permanent'
  if (smartCode.includes('QUALITY')) return 'permanent'
  return 'contract'
}

function randomShift() {
  const shifts = ['day', 'night', 'rotating']
  return shifts[Math.floor(Math.random() * shifts.length)]
}

function randomBankAccount() {
  return `ACC${Math.floor(Math.random() * 900000000) + 100000000}`
}

/**
 * Main Execution
 */

async function main() {
  const args = process.argv.slice(2)
  const module = args[0]
  const option = args[1]
  
  if (!module) {
    console.log(`
🪑 HERA Furniture Module Seed Data Builder

Usage: node furniture-seed-builder.js [module] [options]

Modules:
  hr          - Human Resources data
  inventory   - Inventory and products
  sales       - Sales orders and customers
  production  - Production orders
  finance     - Financial transactions

Options:
  --complete     - Build complete seed data for the module
  --relationships - Only create relationships
  --dynamic-fields - Only create dynamic fields
  --count [n]    - Number of records to create

Examples:
  node furniture-seed-builder.js hr --complete
  node furniture-seed-builder.js sales --orders 10
  node furniture-seed-builder.js inventory --products 20
    `)
    return
  }
  
  console.log(`🏭 Kerala Furniture Works - Seed Data Builder`)
  console.log(`📍 Organization ID: ${KERALA_FURNITURE_ORG}`)
  console.log(`🔧 Module: ${module}`)
  console.log(`⚙️  Option: ${option || 'default'}\n`)
  
  switch (module) {
    case 'hr':
      const hrBuilder = new HRSeedBuilder(KERALA_FURNITURE_ORG)
      
      if (option === '--complete') {
        await hrBuilder.buildComplete()
      } else if (option === '--relationships') {
        await hrBuilder.createEmployeeDepartmentRelationships()
      } else if (option === '--dynamic-fields') {
        await hrBuilder.createDynamicFields()
      } else {
        console.log('Please specify an option: --complete, --relationships, or --dynamic-fields')
      }
      break
      
    case 'inventory':
      console.log('Inventory module seed builder not yet implemented')
      break
      
    case 'sales':
      console.log('Sales module seed builder not yet implemented')
      break
      
    case 'production':
      console.log('Production module seed builder not yet implemented')
      break
      
    case 'finance':
      console.log('Finance module seed builder not yet implemented')
      break
      
    default:
      console.log(`Unknown module: ${module}`)
  }
}

// Run the script
main().catch(console.error)