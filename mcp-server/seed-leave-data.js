#!/usr/bin/env node

/**
 * HERA Leave Management Seed Data Script
 * Creates sample employees, leave policies, and leave records
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service key to bypass RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Default salon organization ID - matches existing demo organization
const DEFAULT_SALON_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

async function seedLeaveData() {
  console.log('🌱 Starting leave management data seed...\n');

  try {
    // 1. Create employee entities
    console.log('👥 Creating employees...');
    const employees = [
      { 
        name: 'Sarah Johnson', 
        code: 'EMP001', 
        role: 'Senior Stylist',
        email: 'sarah.johnson@hairtalkz.com'
      },
      { 
        name: 'Michael Chen', 
        code: 'EMP002', 
        role: 'Colorist',
        email: 'michael.chen@hairtalkz.com'
      },
      { 
        name: 'Emma Wilson', 
        code: 'EMP003', 
        role: 'Junior Stylist',
        email: 'emma.wilson@hairtalkz.com'
      },
      { 
        name: 'James Taylor', 
        code: 'EMP004', 
        role: 'Front Desk Manager',
        email: 'james.taylor@hairtalkz.com'
      },
      { 
        name: 'Lisa Park', 
        code: 'EMP005', 
        role: 'Nail Technician',
        email: 'lisa.park@hairtalkz.com'
      }
    ];

    const employeeIds = {};
    
    for (const emp of employees) {
      const { data: employee, error } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'employee',
          entity_name: emp.name,
          entity_code: emp.code,
          smart_code: 'HERA.SALON.HR.EMPLOYEE.RECORD.v1',
          organization_id: DEFAULT_SALON_ORG_ID,
          metadata: {
            role: emp.role,
            email: emp.email,
            department: 'Salon Services'
          }
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating employee ${emp.name}:`, error);
      } else {
        employeeIds[emp.code] = employee.id;
        console.log(`✅ Created employee: ${emp.name}`);
      }
    }

    // 2. Create leave policy dynamic data
    console.log('\n📋 Creating leave policies...');
    const leavePolicies = [
      { 
        type: 'annual', 
        allowance: 21, 
        description: 'Annual paid leave'
      },
      { 
        type: 'sick', 
        allowance: 10, 
        description: 'Sick leave allowance'
      },
      { 
        type: 'maternity', 
        allowance: 90, 
        description: 'Maternity leave'
      },
      { 
        type: 'paternity', 
        allowance: 14, 
        description: 'Paternity leave'
      }
    ];

    for (const policy of leavePolicies) {
      const { error } = await supabase
        .from('core_dynamic_data')
        .insert({
          entity_id: DEFAULT_SALON_ORG_ID, // Policies belong to organization
          field_name: `leave_policy_${policy.type}`,
          field_value_json: {
            annual_allowance: policy.allowance,
            carry_forward_allowed: true,
            max_carry_forward: 5,
            description: policy.description
          },
          field_type: 'json',
          smart_code: 'HERA.SALON.HR.LEAVE.POLICY.v1',
          organization_id: DEFAULT_SALON_ORG_ID
        });

      if (error) {
        console.error(`❌ Error creating leave policy ${policy.type}:`, error);
      } else {
        console.log(`✅ Created leave policy: ${policy.type} (${policy.allowance} days)`);
      }
    }

    // 3. Create leave balances for each employee
    console.log('\n💰 Creating leave balances...');
    for (const empCode in employeeIds) {
      const employeeId = employeeIds[empCode];
      
      // Annual leave balance
      const annualUsed = Math.floor(Math.random() * 10);
      await supabase
        .from('core_dynamic_data')
        .insert({
          entity_id: employeeId,
          field_name: 'leave_balance_annual',
          field_value_json: {
            total_allowance: 21,
            used: annualUsed,
            pending: 0,
            available: 21 - annualUsed
          },
          field_type: 'json',
          smart_code: 'HERA.SALON.HR.LEAVE.BALANCE.v1',
          organization_id: DEFAULT_SALON_ORG_ID
        });

      // Sick leave balance
      const sickUsed = Math.floor(Math.random() * 3);
      await supabase
        .from('core_dynamic_data')
        .insert({
          entity_id: employeeId,
          field_name: 'leave_balance_sick',
          field_value_json: {
            total_allowance: 10,
            used: sickUsed,
            pending: 0,
            available: 10 - sickUsed
          },
          field_type: 'json',
          smart_code: 'HERA.SALON.HR.LEAVE.BALANCE.v1',
          organization_id: DEFAULT_SALON_ORG_ID
        });
    }
    console.log('✅ Created leave balances for all employees');

    // 4. Create sample leave requests
    console.log('\n📅 Creating sample leave requests...');
    const leaveRequests = [
      {
        employee: 'EMP001',
        type: 'annual',
        start: '2025-09-15',
        end: '2025-09-17',
        days: 3,
        reason: 'Family vacation',
        status: 'pending'
      },
      {
        employee: 'EMP002',
        type: 'sick',
        start: '2025-09-10',
        end: '2025-09-10',
        days: 1,
        reason: 'Medical appointment',
        status: 'pending'
      },
      {
        employee: 'EMP003',
        type: 'annual',
        start: '2025-08-20',
        end: '2025-08-23',
        days: 4,
        reason: 'Personal time',
        status: 'approved'
      },
      {
        employee: 'EMP004',
        type: 'annual',
        start: '2025-10-01',
        end: '2025-10-05',
        days: 5,
        reason: 'Holiday trip',
        status: 'pending'
      }
    ];

    for (const leave of leaveRequests) {
      // Get employee details for metadata
      const employeeInfo = employees.find(e => e.code === leave.employee);
      
      const { data: transaction, error } = await supabase
        .from('universal_transactions')
        .insert({
          transaction_type: 'leave_request',
          smart_code: 'HERA.SALON.HR.LEAVE.REQUEST.v1',
          reference_number: `LEAVE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          transaction_date: new Date().toISOString(),
          total_amount: leave.days,
          organization_id: DEFAULT_SALON_ORG_ID,
          metadata: {
            from_entity_id: employeeIds[leave.employee],
            employee_name: employeeInfo?.name || 'Unknown',
            employee_role: employeeInfo?.role || 'Staff',
            leave_type: leave.type,
            start_date: leave.start,
            end_date: leave.end,
            reason: leave.reason,
            deduct_from_balance: true,
            approval_status: leave.status
          }
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating leave request:`, error);
      } else {
        console.log(`✅ Created ${leave.status} leave request for ${leave.employee} (${leave.start} to ${leave.end})`);
        
        // Create transaction lines for each day
        const startDate = new Date(leave.start);
        const endDate = new Date(leave.end);
        let lineNumber = 1;
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          
          await supabase
            .from('universal_transaction_lines')
            .insert({
              transaction_id: transaction.id,
              line_number: lineNumber++,
              line_amount: isWeekend ? 0 : 1,
              quantity: isWeekend ? 0 : 1,
              unit_price: 1,
              organization_id: DEFAULT_SALON_ORG_ID,
              metadata: {
                date: d.toISOString().split('T')[0],
                day_type: 'full',
                leave_type: leave.type,
                is_weekend: isWeekend,
                deductible: !isWeekend
              }
            });
        }
      }
    }

    // 5. Create workflow statuses
    console.log('\n🔄 Creating workflow statuses...');
    const statuses = ['pending', 'approved', 'rejected', 'cancelled'];
    
    for (const status of statuses) {
      await supabase
        .from('core_entities')
        .insert({
          entity_type: 'workflow_status',
          entity_name: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          entity_code: `LEAVE_STATUS_${status.toUpperCase()}`,
          smart_code: `HERA.SALON.HR.LEAVE.STATUS.${status.toUpperCase()}.v1`,
          organization_id: DEFAULT_SALON_ORG_ID,
          metadata: {
            status_type: 'leave_request',
            color: status === 'approved' ? '#10b981' : 
                   status === 'rejected' ? '#ef4444' : 
                   status === 'pending' ? '#f59e0b' : '#6b7280'
          }
        });
    }
    console.log('✅ Created workflow statuses');

    console.log('\n🎉 Leave management data seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`   - ${employees.length} employees created`);
    console.log(`   - ${leavePolicies.length} leave policies configured`);
    console.log(`   - ${leaveRequests.length} leave requests created`);
    console.log(`   - ${statuses.length} workflow statuses configured`);
    console.log('\n🚀 You can now test the leave management system!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed function
seedLeaveData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });