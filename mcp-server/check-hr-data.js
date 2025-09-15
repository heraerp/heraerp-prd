#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHRData() {
  const orgId = 'f0af4ced-9d12-4a55-a649-b484368db249';
  console.log('Checking HR data for Kerala Furniture Works...\n');

  // 1. Get all employees
  const { data: employees, error: empError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_type', 'employee');

  if (empError) {
    console.error('Error fetching employees:', empError);
    return;
  }

  console.log(`Found ${employees.length} employees:`);
  employees.forEach(emp => {
    console.log(`  - ${emp.entity_name} (${emp.entity_code}) - Smart Code: ${emp.smart_code}`);
  });

  // 2. Get all departments
  const { data: departments, error: deptError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_type', 'department');

  if (deptError) {
    console.error('Error fetching departments:', deptError);
    return;
  }

  console.log(`\nFound ${departments.length} departments:`);
  departments.forEach(dept => {
    console.log(`  - ${dept.entity_name} (${dept.entity_code}) - Smart Code: ${dept.smart_code}`);
  });

  // 3. Check for any employee-department relationships
  if (employees.length > 0) {
    const employeeIds = employees.map(e => e.id);
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .in('from_entity_id', employeeIds);

    if (relError) {
      console.error('Error fetching relationships:', relError);
      return;
    }

    console.log(`\nFound ${relationships.length} relationships for employees`);
  }

  // 4. Check dynamic data for any employee
  if (employees.length > 0) {
    const { data: dynamicData, error: dynError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', employees[0].id);

    if (dynError) {
      console.error('Error fetching dynamic data:', dynError);
      return;
    }

    console.log(`\nDynamic data for ${employees[0].entity_name}:`);
    if (dynamicData.length === 0) {
      console.log('  No dynamic data found');
    } else {
      dynamicData.forEach(dd => {
        console.log(`  - ${dd.field_name}: ${dd.field_value_text || dd.field_value_number || dd.field_value_date}`);
      });
    }
  }

  // 5. Get unique smart codes for HR entities
  const { data: hrSmartCodes, error: scError } = await supabase
    .from('core_entities')
    .select('smart_code')
    .eq('organization_id', orgId)
    .or('smart_code.ilike.%HR%,smart_code.ilike.%EMPLOYEE%,entity_type.eq.employee,entity_type.eq.department');

  if (scError) {
    console.error('Error fetching smart codes:', scError);
    return;
  }

  const uniqueSmartCodes = [...new Set(hrSmartCodes.map(sc => sc.smart_code))];
  console.log('\nUnique HR-related smart codes:');
  uniqueSmartCodes.forEach(sc => {
    console.log(`  - ${sc}`);
  });
}

checkHRData().catch(console.error);