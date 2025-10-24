const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Organization IDs
const organizations = {
  headOffice: { id: '849b6efe-2bf0-438f-9c70-01835ac2fe15', name: 'Salon Group' },
  parkRegis: { id: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', name: 'Hair Talkz • Park Regis' },
  mercureGold: { id: '0b1b37cd-4096-4718-8cd4-e370f234005b', name: 'Hair Talkz • Mercure Gold' }
};

// Employee role definitions
const roles = {
  // Management
  CEO: { code: 'MGT-CEO', category: 'management', level: 1 },
  CFO: { code: 'MGT-CFO', category: 'management', level: 1 },
  BRANCH_MANAGER: { code: 'MGT-BM', category: 'management', level: 2 },
  ASST_MANAGER: { code: 'MGT-AM', category: 'management', level: 3 },
  
  // Salon Operations
  SENIOR_STYLIST: { code: 'OPS-SS', category: 'operations', level: 2 },
  STYLIST: { code: 'OPS-ST', category: 'operations', level: 3 },
  JUNIOR_STYLIST: { code: 'OPS-JS', category: 'operations', level: 4 },
  THERAPIST: { code: 'OPS-TH', category: 'operations', level: 3 },
  COLORIST: { code: 'OPS-CL', category: 'operations', level: 2 },
  
  // Support Staff
  RECEPTIONIST: { code: 'SUP-RC', category: 'support', level: 4 },
  ACCOUNTANT: { code: 'SUP-AC', category: 'support', level: 3 },
  CLEANER: { code: 'SUP-CL', category: 'support', level: 5 }
};

// Employee data structure
const employeeData = {
  // Head Office Staff
  headOffice: [
    {
      name: 'Sarah Johnson',
      role: roles.CEO,
      employeeCode: 'EMP-HO-001',
      email: 'sarah.johnson@hairtalkz.ae',
      phone: '+971-50-123-4001',
      hireDate: '2020-01-15',
      salary: 45000,
      commission: 0
    },
    {
      name: 'Michael Chen',
      role: roles.CFO,
      employeeCode: 'EMP-HO-002',
      email: 'michael.chen@hairtalkz.ae',
      phone: '+971-50-123-4002',
      hireDate: '2020-03-01',
      salary: 35000,
      commission: 0
    },
    {
      name: 'Fatima Al-Rashid',
      role: roles.ACCOUNTANT,
      employeeCode: 'EMP-HO-003',
      email: 'fatima.alrashid@hairtalkz.ae',
      phone: '+971-50-123-4003',
      hireDate: '2021-06-15',
      salary: 12000,
      commission: 0
    }
  ],
  
  // Park Regis Branch Staff
  parkRegis: [
    {
      name: 'Amanda Rodriguez',
      role: roles.BRANCH_MANAGER,
      employeeCode: 'EMP-PR-001',
      email: 'amanda.rodriguez@hairtalkz.ae',
      phone: '+971-50-123-5001',
      hireDate: '2021-01-10',
      salary: 18000,
      commission: 2 // 2% of branch revenue
    },
    {
      name: 'Jessica Martinez',
      role: roles.SENIOR_STYLIST,
      employeeCode: 'EMP-PR-002',
      email: 'jessica.martinez@hairtalkz.ae',
      phone: '+971-50-123-5002',
      hireDate: '2021-02-01',
      salary: 6000,
      commission: 35, // 35% of services
      specialties: ['Hair Coloring', 'Balayage', 'Hair Extensions']
    },
    {
      name: 'Priya Sharma',
      role: roles.STYLIST,
      employeeCode: 'EMP-PR-003',
      email: 'priya.sharma@hairtalkz.ae',
      phone: '+971-50-123-5003',
      hireDate: '2021-08-15',
      salary: 4500,
      commission: 30, // 30% of services
      specialties: ['Hair Cutting', 'Blow Dry', 'Hair Treatment']
    },
    {
      name: 'Lily Wang',
      role: roles.COLORIST,
      employeeCode: 'EMP-PR-004',
      email: 'lily.wang@hairtalkz.ae',
      phone: '+971-50-123-5004',
      hireDate: '2022-01-20',
      salary: 5500,
      commission: 32, // 32% of color services
      specialties: ['Hair Coloring', 'Highlights', 'Color Correction']
    },
    {
      name: 'Aisha Hassan',
      role: roles.THERAPIST,
      employeeCode: 'EMP-PR-005',
      email: 'aisha.hassan@hairtalkz.ae',
      phone: '+971-50-123-5005',
      hireDate: '2022-03-01',
      salary: 4000,
      commission: 30, // 30% of treatments
      specialties: ['Facials', 'Massage', 'Body Treatments']
    },
    {
      name: 'Maya Patel',
      role: roles.JUNIOR_STYLIST,
      employeeCode: 'EMP-PR-006',
      email: 'maya.patel@hairtalkz.ae',
      phone: '+971-50-123-5006',
      hireDate: '2023-01-15',
      salary: 3500,
      commission: 25, // 25% of services
      specialties: ['Hair Washing', 'Basic Cuts', 'Styling']
    },
    {
      name: 'Sophie Kim',
      role: roles.RECEPTIONIST,
      employeeCode: 'EMP-PR-007',
      email: 'sophie.kim@hairtalkz.ae',
      phone: '+971-50-123-5007',
      hireDate: '2022-06-01',
      salary: 3000,
      commission: 0
    },
    {
      name: 'Maria Santos',
      role: roles.CLEANER,
      employeeCode: 'EMP-PR-008',
      email: 'maria.santos@hairtalkz.ae',
      phone: '+971-50-123-5008',
      hireDate: '2021-11-01',
      salary: 2200,
      commission: 0
    }
  ],
  
  // Mercure Gold Branch Staff
  mercureGold: [
    {
      name: 'Rachel Thompson',
      role: roles.BRANCH_MANAGER,
      employeeCode: 'EMP-MG-001',
      email: 'rachel.thompson@hairtalkz.ae',
      phone: '+971-50-123-6001',
      hireDate: '2021-04-01',
      salary: 18000,
      commission: 2 // 2% of branch revenue
    },
    {
      name: 'Elena Volkov',
      role: roles.SENIOR_STYLIST,
      employeeCode: 'EMP-MG-002',
      email: 'elena.volkov@hairtalkz.ae',
      phone: '+971-50-123-6002',
      hireDate: '2021-05-15',
      salary: 6500,
      commission: 35, // 35% of services
      specialties: ['Bridal Hair', 'Updos', 'Hair Extensions']
    },
    {
      name: 'Natalie Brown',
      role: roles.STYLIST,
      employeeCode: 'EMP-MG-003',
      email: 'natalie.brown@hairtalkz.ae',
      phone: '+971-50-123-6003',
      hireDate: '2021-09-01',
      salary: 4500,
      commission: 30, // 30% of services
      specialties: ['Hair Cutting', 'Keratin Treatment', 'Hair Spa']
    },
    {
      name: 'Isabella Garcia',
      role: roles.COLORIST,
      employeeCode: 'EMP-MG-004',
      email: 'isabella.garcia@hairtalkz.ae',
      phone: '+971-50-123-6004',
      hireDate: '2022-02-15',
      salary: 5500,
      commission: 32, // 32% of color services
      specialties: ['Ombre', 'Balayage', 'Fashion Colors']
    },
    {
      name: 'Yasmin Ali',
      role: roles.THERAPIST,
      employeeCode: 'EMP-MG-005',
      email: 'yasmin.ali@hairtalkz.ae',
      phone: '+971-50-123-6005',
      hireDate: '2022-04-01',
      salary: 4000,
      commission: 30, // 30% of treatments
      specialties: ['Anti-Aging Facials', 'Deep Tissue Massage', 'Aromatherapy']
    },
    {
      name: 'Chloe Davis',
      role: roles.STYLIST,
      employeeCode: 'EMP-MG-006',
      email: 'chloe.davis@hairtalkz.ae',
      phone: '+971-50-123-6006',
      hireDate: '2022-07-15',
      salary: 4500,
      commission: 30, // 30% of services
      specialties: ['Men\'s Cuts', 'Beard Grooming', 'Hair Styling']
    },
    {
      name: 'Emma Wilson',
      role: roles.RECEPTIONIST,
      employeeCode: 'EMP-MG-007',
      email: 'emma.wilson@hairtalkz.ae',
      phone: '+971-50-123-6007',
      hireDate: '2022-08-01',
      salary: 3000,
      commission: 0
    },
    {
      name: 'Ana Rodriguez',
      role: roles.CLEANER,
      employeeCode: 'EMP-MG-008',
      email: 'ana.rodriguez@hairtalkz.ae',
      phone: '+971-50-123-6008',
      hireDate: '2022-01-01',
      salary: 2200,
      commission: 0
    }
  ]
};

async function createEmployees() {
  console.log('👥 Creating Employee Entities for Hair Talkz Salon Group...\n');
  
  let totalCreated = 0;
  const results = {
    headOffice: [],
    parkRegis: [],
    mercureGold: []
  };

  // Process each organization
  for (const [orgKey, orgData] of Object.entries(organizations)) {
    console.log(`\n=== Creating employees for ${orgData.name} ===`);
    
    const employees = employeeData[orgKey] || [];
    
    for (const emp of employees) {
      try {
        // 1. Create employee entity
        const { data: employee, error: empError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: orgData.id,
            entity_type: 'employee',
            entity_code: emp.employeeCode,
            entity_name: emp.name,
            smart_code: `HERA.HRM.EMP.${emp.role.code}.v1`
          })
          .select()
          .single();

        if (empError) {
          console.error(`Error creating employee ${emp.name}:`, empError);
          continue;
        }

        console.log(`✅ Created employee: ${emp.name} (${emp.role.code})`);

        // 2. Add employee details as dynamic data
        const employeeDetails = [
          { field_name: 'role_code', field_value_text: emp.role.code, smart_code: 'HERA.HRM.ROLE.CODE.v1' },
          { field_name: 'role_category', field_value_text: emp.role.category, smart_code: 'HERA.HRM.ROLE.CATEGORY.v1' },
          { field_name: 'role_level', field_value_number: emp.role.level, smart_code: 'HERA.HRM.ROLE.LEVEL.v1' },
          { field_name: 'email', field_value_text: emp.email, smart_code: 'HERA.HRM.EMAIL.v1' },
          { field_name: 'phone', field_value_text: emp.phone, smart_code: 'HERA.HRM.PHONE.v1' },
          { field_name: 'hire_date', field_value_text: emp.hireDate, smart_code: 'HERA.HRM.HIRE.DATE.v1' },
          { field_name: 'employment_status', field_value_text: 'active', smart_code: 'HERA.HRM.STATUS.v1' },
          { field_name: 'monthly_salary', field_value_number: emp.salary, smart_code: 'HERA.HRM.SALARY.v1' },
          { field_name: 'commission_rate', field_value_number: emp.commission, smart_code: 'HERA.HRM.COMMISSION.v1' },
          { field_name: 'working_hours', field_value_text: '9:00 AM - 7:00 PM', smart_code: 'HERA.HRM.HOURS.v1' },
          { field_name: 'days_off', field_value_text: 'Friday', smart_code: 'HERA.HRM.DAYS.OFF.v1' }
        ];

        // Add specialties for service staff
        if (emp.specialties) {
          employeeDetails.push({
            field_name: 'specialties',
            field_value_text: emp.specialties.join(', '),
            smart_code: 'HERA.HRM.SPECIALTIES.v1'
          });
        }

        for (const detail of employeeDetails) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: orgData.id,
              entity_id: employee.id,
              ...detail
            });
        }

        // 3. Create employment relationship (Employee -> Organization)
        await supabase
          .from('core_relationships')
          .insert({
            organization_id: orgData.id,
            from_entity_id: employee.id,
            to_entity_id: orgData.id,
            relationship_type: 'employed_by',
            smart_code: 'HERA.HRM.REL.EMPLOYMENT.v1',
            metadata: {
              start_date: emp.hireDate,
              position: emp.role.code,
              branch: orgData.name
            }
          });

        // 4. Create reporting relationships for branch staff
        if (orgKey !== 'headOffice' && emp.role.level > 2) {
          // Find branch manager to report to
          const managerResult = results[orgKey].find(r => r.role.code === 'MGT-BM');
          if (managerResult) {
            await supabase
              .from('core_relationships')
              .insert({
                organization_id: orgData.id,
                from_entity_id: employee.id,
                to_entity_id: managerResult.id,
                relationship_type: 'reports_to',
                smart_code: 'HERA.HRM.REL.REPORTING.v1'
              });
          }
        }

        // Store result
        results[orgKey].push({
          id: employee.id,
          ...emp
        });

        totalCreated++;

      } catch (error) {
        console.error(`Failed to create employee ${emp.name}:`, error);
      }
    }
  }

  // Create cross-branch relationships (Branch Managers report to CEO)
  console.log('\n=== Creating reporting hierarchy ===');
  
  const ceo = results.headOffice.find(e => e.role.code === 'MGT-CEO');
  const cfo = results.headOffice.find(e => e.role.code === 'MGT-CFO');
  
  if (ceo) {
    // Branch managers report to CEO
    for (const branch of ['parkRegis', 'mercureGold']) {
      const branchManager = results[branch].find(e => e.role.code === 'MGT-BM');
      if (branchManager) {
        await supabase
          .from('core_relationships')
          .insert({
            organization_id: organizations.headOffice.id,
            from_entity_id: branchManager.id,
            to_entity_id: ceo.id,
            relationship_type: 'reports_to',
            smart_code: 'HERA.HRM.REL.REPORTING.CROSS.v1'
          });
        console.log(`✅ ${branchManager.name} reports to ${ceo.name}`);
      }
    }
    
    // CFO reports to CEO
    if (cfo) {
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: organizations.headOffice.id,
          from_entity_id: cfo.id,
          to_entity_id: ceo.id,
          relationship_type: 'reports_to',
          smart_code: 'HERA.HRM.REL.REPORTING.v1'
        });
      console.log(`✅ ${cfo.name} reports to ${ceo.name}`);
    }
  }

  // Summary
  console.log('\n\n🎉 Employee Creation Complete!');
  console.log('=====================================');
  console.log(`✓ Total Employees Created: ${totalCreated}`);
  console.log(`✓ Head Office: ${results.headOffice.length} employees`);
  console.log(`✓ Park Regis: ${results.parkRegis.length} employees`);
  console.log(`✓ Mercure Gold: ${results.mercureGold.length} employees`);
  console.log('\n📊 Employee Distribution:');
  console.log('- Management: 5 employees');
  console.log('- Stylists/Colorists: 7 employees');
  console.log('- Therapists: 2 employees');
  console.log('- Support Staff: 5 employees');
  console.log('\n💰 Commission Structure:');
  console.log('- Branch Managers: 2% of branch revenue');
  console.log('- Senior Stylists: 35% of service revenue');
  console.log('- Stylists: 30% of service revenue');
  console.log('- Junior Stylists: 25% of service revenue');
  console.log('- Colorists: 32% of color service revenue');
  console.log('- Therapists: 30% of treatment revenue');
}

// Create user accounts function (to be called after employees are created)
async function createUserAccounts() {
  console.log('\n\n🔐 Creating User Accounts for Key Personnel...\n');
  
  // Key personnel who need system access
  const userAccounts = [
    // Head Office
    { email: 'sarah.johnson@hairtalkz.ae', role: 'owner', name: 'Sarah Johnson' },
    { email: 'michael.chen@hairtalkz.ae', role: 'admin', name: 'Michael Chen' },
    { email: 'fatima.alrashid@hairtalkz.ae', role: 'accountant', name: 'Fatima Al-Rashid' },
    
    // Branch Managers
    { email: 'amanda.rodriguez@hairtalkz.ae', role: 'manager', name: 'Amanda Rodriguez' },
    { email: 'rachel.thompson@hairtalkz.ae', role: 'manager', name: 'Rachel Thompson' },
    
    // Receptionists (for booking system)
    { email: 'sophie.kim@hairtalkz.ae', role: 'staff', name: 'Sophie Kim' },
    { email: 'emma.wilson@hairtalkz.ae', role: 'staff', name: 'Emma Wilson' }
  ];
  
  console.log('ℹ️  User accounts should be created through Supabase Auth');
  console.log('The following users need system access:\n');
  
  userAccounts.forEach(user => {
    console.log(`📧 ${user.email} - Role: ${user.role} (${user.name})`);
  });
  
  console.log('\n💡 Next Steps:');
  console.log('1. Create these users in Supabase Auth');
  console.log('2. Link user IDs to employee entities');
  console.log('3. Configure role-based permissions');
  console.log('4. Set up branch-specific access controls');
}

// Main execution
async function main() {
  await createEmployees();
  await createUserAccounts();
}

main().catch(console.error);