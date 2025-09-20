#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function checkAppointments() {
  try {
    console.log('🔍 Checking appointment data...\n');

    // 1. Check core_entities for appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('core_entities')
      .select('id, organization_id, entity_type, entity_name, smart_code, created_at')
      .eq('entity_type', 'appointment')
      .order('created_at', { ascending: false })
      .limit(10);

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
      return;
    }

    console.log(`📅 Found ${appointments?.length || 0} appointment entities\n`);
    
    if (appointments && appointments.length > 0) {
      console.log('Sample appointments:');
      appointments.forEach(apt => {
        console.log(`- ID: ${apt.id}`);
        console.log(`  Org: ${apt.organization_id}`);
        console.log(`  Name: ${apt.entity_name}`);
        console.log(`  Smart Code: ${apt.smart_code}`);
        console.log(`  Created: ${apt.created_at}`);
        console.log('');
      });

      // 2. Check dynamic data for the first appointment
      const firstAppointment = appointments[0];
      console.log(`\n📊 Checking dynamic data for appointment: ${firstAppointment.id}\n`);

      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text, field_value_number, field_value_date, field_value_json')
        .eq('entity_id', firstAppointment.id)
        .order('field_name');

      if (dynamicError) {
        console.error('❌ Error fetching dynamic data:', dynamicError);
      } else {
        console.log(`Found ${dynamicData?.length || 0} dynamic fields:`);
        dynamicData?.forEach(field => {
          const value = field.field_value_text || field.field_value_number || field.field_value_date || field.field_value_json;
          console.log(`- ${field.field_name}: ${value}`);
        });
      }
    }

    // 3. Check organizations with appointments
    const { data: orgsWithAppts, error: orgsError } = await supabase
      .from('core_entities')
      .select('organization_id')
      .eq('entity_type', 'appointment')
      .then(result => {
        if (result.error) return result;
        const uniqueOrgs = [...new Set(result.data?.map(e => e.organization_id) || [])];
        return { data: uniqueOrgs, error: null };
      });

    if (!orgsError && orgsWithAppts) {
      console.log(`\n🏢 Organizations with appointments: ${orgsWithAppts.length}`);
      for (const orgId of orgsWithAppts.slice(0, 3)) {
        const { data: org } = await supabase
          .from('core_organizations')
          .select('organization_name')
          .eq('id', orgId)
          .single();
        
        const { count } = await supabase
          .from('core_entities')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('entity_type', 'appointment');

        console.log(`- ${org?.organization_name || orgId}: ${count} appointments`);
      }
    }

    // 4. Check for any bad data (empty entity_id in dynamic data)
    console.log('\n🔍 Checking for bad dynamic data queries...\n');
    
    const { data: badDynamicData, error: badError } = await supabase
      .from('core_dynamic_data')
      .select('id, entity_id, field_name')
      .or('entity_id.is.null,entity_id.eq.')
      .limit(5);

    if (!badError && badDynamicData && badDynamicData.length > 0) {
      console.log(`⚠️ Found ${badDynamicData.length} dynamic data records with empty entity_id:`);
      badDynamicData.forEach(record => {
        console.log(`- ID: ${record.id}, entity_id: "${record.entity_id}", field: ${record.field_name}`);
      });
    } else {
      console.log('✅ No dynamic data records with empty entity_id found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkAppointments();