#!/usr/bin/env node

/**
 * Enhanced Furniture HR Seed Data
 * Creates comprehensive HR data including:
 * - Employee skills and certifications
 * - Training sessions
 * - Payroll runs
 * - Leave management
 * - Performance metrics
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
  console.log('🏭 Kerala Furniture Works - Enhanced HR Data Seeding')
  console.log('📍 Organization ID:', KERALA_FURNITURE_ORG)
  
  // 1. Get existing employees
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
  
  // 2. Create employee skills and certifications
  console.log('\n🎯 Creating employee skills and certifications...')
  
  const skills = [
    'Wood Cutting', 'Wood Finishing', 'Upholstery', 'Design', 
    'Quality Control', 'CNC Operation', 'Hand Carving', 'Lacquering',
    'Project Management', 'Sales', 'Customer Service'
  ]
  
  const certifications = [
    'ISO 9001 Certified', 'Safety Training', 'First Aid', 
    'Forklift License', 'Quality Inspector', 'Master Craftsman'
  ]
  
  const skillData = []
  
  // Assign random skills to employees
  for (const employee of employees.slice(0, 10)) {
    const numSkills = Math.floor(Math.random() * 3) + 2 // 2-4 skills per employee
    const employeeSkills = []
    
    for (let i = 0; i < numSkills; i++) {
      const skill = skills[Math.floor(Math.random() * skills.length)]
      if (!employeeSkills.includes(skill)) {
        employeeSkills.push(skill)
        skillData.push({
          id: uuidv4(),
          organization_id: KERALA_FURNITURE_ORG,
          entity_id: employee.id,
          field_name: 'skill',
          field_value_text: skill,
          field_value_number: Math.floor(Math.random() * 5) + 1, // Skill level 1-5
          smart_code: 'HERA.FURNITURE.HR.FIELD.SKILL.v1',
          metadata: {
            skill_level: Math.floor(Math.random() * 5) + 1,
            years_experience: Math.floor(Math.random() * 10) + 1
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    }
    
    // Add certifications for some employees
    if (Math.random() > 0.5) {
      const cert = certifications[Math.floor(Math.random() * certifications.length)]
      skillData.push({
        id: uuidv4(),
        organization_id: KERALA_FURNITURE_ORG,
        entity_id: employee.id,
        field_name: 'certification',
        field_value_text: cert,
        field_value_date: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), 1).toISOString(),
        smart_code: 'HERA.FURNITURE.HR.FIELD.CERTIFICATION.v1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }
  
  if (skillData.length > 0) {
    const { error } = await supabase
      .from('core_dynamic_data')
      .insert(skillData)
    
    if (error) {
      console.error('Error inserting skills:', error)
    } else {
      console.log(`✅ Created ${skillData.length} skills and certifications`)
    }
  }
  
  // 3. Create training sessions
  console.log('\n📚 Creating training sessions...')
  
  const trainingTopics = [
    { name: 'Safety Procedures', duration: 4, type: 'mandatory' },
    { name: 'Quality Standards', duration: 8, type: 'mandatory' },
    { name: 'Advanced Woodworking', duration: 16, type: 'skill' },
    { name: 'Customer Service Excellence', duration: 4, type: 'soft_skill' },
    { name: 'New Equipment Training', duration: 8, type: 'technical' }
  ]
  
  const trainingTransactions = []
  
  for (const topic of trainingTopics) {
    trainingTransactions.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      transaction_type: 'training_session',
      transaction_code: `TRAIN-2024-${Math.floor(Math.random() * 1000)}`,
      transaction_date: new Date(2024, Math.floor(Math.random() * 9), Math.floor(Math.random() * 28) + 1).toISOString(),
      total_amount: topic.duration, // Using amount field to store duration
      smart_code: 'HERA.FURNITURE.HR.TXN.TRAINING.v1',
      metadata: {
        training_name: topic.name,
        duration_hours: topic.duration,
        training_type: topic.type,
        department: topic.type === 'technical' ? 'Production' : 'All',
        trainer: 'External Consultant',
        status: 'completed'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  const { error: trainError } = await supabase
    .from('universal_transactions')
    .insert(trainingTransactions)
  
  if (trainError) {
    console.error('Error creating training sessions:', trainError)
  } else {
    console.log(`✅ Created ${trainingTransactions.length} training sessions`)
  }
  
  // 4. Create monthly payroll runs
  console.log('\n💰 Creating payroll runs...')
  
  const payrollTransactions = []
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September']
  
  for (let i = 0; i < months.length; i++) {
    const totalSalary = 450000 + Math.floor(Math.random() * 50000) // Base payroll + variance
    
    payrollTransactions.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      transaction_type: 'payroll_run',
      transaction_code: `PAYROLL-2024-${String(i + 1).padStart(2, '0')}`,
      transaction_date: new Date(2024, i, 28).toISOString(),
      total_amount: totalSalary,
      smart_code: 'HERA.FURNITURE.HR.TXN.PAYROLL.v1',
      metadata: {
        month: months[i],
        year: 2024,
        employee_count: 15,
        total_gross: totalSalary,
        total_deductions: Math.floor(totalSalary * 0.15),
        total_net: Math.floor(totalSalary * 0.85),
        status: 'processed'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  const { error: payrollError } = await supabase
    .from('universal_transactions')
    .insert(payrollTransactions)
  
  if (payrollError) {
    console.error('Error creating payroll runs:', payrollError)
  } else {
    console.log(`✅ Created ${payrollTransactions.length} payroll runs`)
  }
  
  // 5. Create leave requests
  console.log('\n🏖️ Creating leave requests...')
  
  const leaveTypes = [
    { type: 'annual', days: [5, 10, 15] },
    { type: 'sick', days: [1, 2, 3] },
    { type: 'casual', days: [1, 2] },
    { type: 'maternity', days: [90] },
    { type: 'paternity', days: [7] }
  ]
  
  const leaveTransactions = []
  
  // Create leave requests for random employees
  for (let i = 0; i < 8; i++) {
    const employee = employees[Math.floor(Math.random() * employees.length)]
    const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)]
    const days = leaveType.days[Math.floor(Math.random() * leaveType.days.length)]
    const startDate = new Date(2024, Math.floor(Math.random() * 9), Math.floor(Math.random() * 20) + 1)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + days - 1)
    
    leaveTransactions.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      transaction_type: 'leave_request',
      transaction_code: `LEAVE-2024-${String(i + 100).padStart(3, '0')}`,
      transaction_date: startDate.toISOString(),
      source_entity_id: employee.id,
      total_amount: days, // Using amount to store days
      smart_code: 'HERA.FURNITURE.HR.TXN.LEAVE.v1',
      metadata: {
        leave_type: leaveType.type,
        days: days,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        reason: `${leaveType.type} leave request`,
        status: Math.random() > 0.2 ? 'approved' : 'pending'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  const { error: leaveError } = await supabase
    .from('universal_transactions')
    .insert(leaveTransactions)
  
  if (leaveError) {
    console.error('Error creating leave requests:', leaveError)
  } else {
    console.log(`✅ Created ${leaveTransactions.length} leave requests`)
  }
  
  // 6. Create attendance summary records
  console.log('\n📅 Creating attendance summaries...')
  
  const attendanceSummaries = []
  const today = new Date()
  
  // Create attendance summaries for last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const present = 12 + Math.floor(Math.random() * 3)
    const absent = 15 - present - Math.floor(Math.random() * 2)
    const onLeave = 15 - present - absent
    
    attendanceSummaries.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      transaction_type: 'attendance',
      transaction_code: `ATT-SUMMARY-${date.toISOString().split('T')[0]}`,
      transaction_date: date.toISOString(),
      total_amount: present, // Using amount to store present count
      smart_code: 'HERA.FURNITURE.HR.TXN.ATTENDANCE.SUMMARY.v1',
      metadata: {
        attendance_date: date.toISOString().split('T')[0],
        total_present: present,
        total_absent: absent,
        total_leave: onLeave,
        attendance_rate: Math.round((present / 15) * 100)
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  const { error: attError } = await supabase
    .from('universal_transactions')
    .insert(attendanceSummaries)
  
  if (attError) {
    console.error('Error creating attendance summaries:', attError)
  } else {
    console.log(`✅ Created ${attendanceSummaries.length} attendance summary records`)
  }
  
  // 7. Create overtime and bonus approvals
  console.log('\n⏰ Creating overtime and bonus approvals...')
  
  const approvalTransactions = []
  
  // Overtime approvals
  for (let i = 0; i < 3; i++) {
    const employee = employees[Math.floor(Math.random() * employees.length)]
    
    approvalTransactions.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      transaction_type: 'overtime_approval',
      transaction_code: `OT-2024-${String(i + 200).padStart(3, '0')}`,
      transaction_date: new Date(2024, 8, Math.floor(Math.random() * 15) + 1).toISOString(),
      source_entity_id: employee.id,
      total_amount: (Math.floor(Math.random() * 8) + 4) * 500, // 4-12 hours * 500/hour
      smart_code: 'HERA.FURNITURE.HR.TXN.OVERTIME.v1',
      metadata: {
        hours: Math.floor(Math.random() * 8) + 4,
        rate_per_hour: 500,
        reason: 'Urgent production order',
        status: 'pending'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  // Bonus approvals
  for (let i = 0; i < 2; i++) {
    const employee = employees[Math.floor(Math.random() * employees.length)]
    
    approvalTransactions.push({
      id: uuidv4(),
      organization_id: KERALA_FURNITURE_ORG,
      transaction_type: 'bonus_approval',
      transaction_code: `BONUS-2024-${String(i + 300).padStart(3, '0')}`,
      transaction_date: new Date(2024, 8, Math.floor(Math.random() * 15) + 1).toISOString(),
      source_entity_id: employee.id,
      total_amount: Math.floor(Math.random() * 10000) + 5000,
      smart_code: 'HERA.FURNITURE.HR.TXN.BONUS.v1',
      metadata: {
        bonus_type: 'performance',
        reason: 'Excellent quarterly performance',
        status: 'pending'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  const { error: approvalError } = await supabase
    .from('universal_transactions')
    .insert(approvalTransactions)
  
  if (approvalError) {
    console.error('Error creating approvals:', approvalError)
  } else {
    console.log(`✅ Created ${approvalTransactions.length} overtime and bonus approvals`)
  }
  
  console.log('\n✅ Enhanced HR data seeding complete!')
  
  // Summary
  const { count: dynCount } = await supabase
    .from('core_dynamic_data')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', KERALA_FURNITURE_ORG)
  
  const { count: txnCount } = await supabase
    .from('universal_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', KERALA_FURNITURE_ORG)
    .or('transaction_type.eq.training_session,transaction_type.eq.payroll_run,transaction_type.eq.leave_request,transaction_type.eq.attendance,transaction_type.eq.overtime_approval,transaction_type.eq.bonus_approval')
  
  console.log('\n📊 Final Summary:')
  console.log(`- Total dynamic data records: ${dynCount}`)
  console.log(`- Total HR transactions: ${txnCount}`)
  console.log(`- Skills and certifications: ${skillData.length}`)
  console.log(`- Training sessions: ${trainingTransactions.length}`)
  console.log(`- Payroll runs: ${payrollTransactions.length}`)
  console.log(`- Leave requests: ${leaveTransactions.length}`)
  console.log(`- Attendance summaries: ${attendanceSummaries.length}`)
  console.log(`- Pending approvals: ${approvalTransactions.length}`)
}

// Run the script
main().catch(console.error)