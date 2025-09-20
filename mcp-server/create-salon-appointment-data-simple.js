#!/usr/bin/env node

/**
 * Create salon appointment data for Hair Talkz Salon
 * Simple version using direct Supabase client
 */

require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz Salon

async function createSalonData() {
  try {
    console.log('🎯 Creating salon appointment data for Hair Talkz Salon...\n');

    // 1. Create Customers
    console.log('👥 Creating customers...');
    const customers = [
      { name: 'Sarah Johnson', code: 'CUST-001', phone: '+971501234567', email: 'sarah@example.com' },
      { name: 'Emma Williams', code: 'CUST-002', phone: '+971502345678', email: 'emma@example.com' },
      { name: 'Lisa Davis', code: 'CUST-003', phone: '+971503456789', email: 'lisa@example.com' },
      { name: 'Maria Garcia', code: 'CUST-004', phone: '+971504567890', email: 'maria@example.com' },
      { name: 'Jennifer Brown', code: 'CUST-005', phone: '+971505678901', email: 'jennifer@example.com' }
    ];

    const customerIds = [];
    for (const customer of customers) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'customer',
          entity_name: customer.name,
          entity_code: customer.code,
          smart_code: 'HERA.SALON.CRM.CUST.PROF.V1',
          organization_id: ORGANIZATION_ID,
          metadata: {
            contact: {
              phone: customer.phone,
              email: customer.email
            }
          }
        })
        .select()
        .single();

      if (!error && data) {
        customerIds.push(data.id);
        console.log(`✅ Created customer: ${customer.name}`);
        
        // Add phone as dynamic data
        await supabase.from('core_dynamic_data').insert({
          entity_id: data.id,
          field_name: 'phone',
          field_type: 'text',
          field_value_text: customer.phone,
          organization_id: ORGANIZATION_ID,
          smart_code: 'HERA.SALON.CRM.DYN.PHONE.V1'
        });

        // Add email as dynamic data
        await supabase.from('core_dynamic_data').insert({
          entity_id: data.id,
          field_name: 'email',
          field_type: 'text',
          field_value_text: customer.email,
          organization_id: ORGANIZATION_ID,
          smart_code: 'HERA.SALON.CRM.DYN.EMAIL.V1'
        });
      } else {
        console.error(`❌ Failed to create customer ${customer.name}:`, error);
      }
    }

    // 2. Create Stylists (Employees)
    console.log('\n💇‍♀️ Creating stylists...');
    const stylists = [
      { name: 'Sarah Anderson', code: 'STAFF-001', specialties: ['Haircut', 'Color'] },
      { name: 'Emma Thompson', code: 'STAFF-002', specialties: ['Styling', 'Extensions'] },
      { name: 'Lisa Martinez', code: 'STAFF-003', specialties: ['Color', 'Treatment'] },
      { name: 'Maria Rodriguez', code: 'STAFF-004', specialties: ['Haircut', 'Styling'] }
    ];

    const stylistIds = [];
    for (const stylist of stylists) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'employee',
          entity_name: stylist.name,
          entity_code: stylist.code,
          smart_code: 'HERA.SALON.HR.STAFF.STYLIST.V1',
          organization_id: ORGANIZATION_ID,
          metadata: {
            role: 'Stylist',
            specialties: stylist.specialties,
            schedule: {
              monday: '09:00-18:00',
              tuesday: '09:00-18:00',
              wednesday: '09:00-18:00',
              thursday: '09:00-18:00',
              friday: '09:00-18:00',
              saturday: '10:00-16:00',
              sunday: 'off'
            }
          }
        })
        .select()
        .single();

      if (!error && data) {
        stylistIds.push(data.id);
        console.log(`✅ Created stylist: ${stylist.name}`);
      } else {
        console.error(`❌ Failed to create stylist ${stylist.name}:`, error);
      }
    }

    // 3. Create Services (Products)
    console.log('\n💅 Creating services...');
    const services = [
      { name: 'Haircut & Style', code: 'SVC-001', price: 150, duration: 45, category: 'Hair' },
      { name: 'Hair Color (Full)', code: 'SVC-002', price: 350, duration: 120, category: 'Color' },
      { name: 'Highlights', code: 'SVC-003', price: 280, duration: 90, category: 'Color' },
      { name: 'Deep Conditioning Treatment', code: 'SVC-004', price: 120, duration: 30, category: 'Treatment' },
      { name: 'Blowout & Style', code: 'SVC-005', price: 100, duration: 45, category: 'Styling' },
      { name: 'Keratin Treatment', code: 'SVC-006', price: 450, duration: 180, category: 'Treatment' }
    ];

    const serviceIds = [];
    for (const service of services) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'product',
          entity_name: service.name,
          entity_code: service.code,
          smart_code: 'HERA.SALON.SVC.ENT.STANDARD.V1',
          organization_id: ORGANIZATION_ID,
          metadata: {
            type: 'service',
            category: service.category,
            pricing: {
              amount: service.price,
              currency: 'AED'
            },
            duration_minutes: service.duration
          }
        })
        .select()
        .single();

      if (!error && data) {
        serviceIds.push(data.id);
        console.log(`✅ Created service: ${service.name}`);
        
        // Add price as dynamic data
        await supabase.from('core_dynamic_data').insert({
          entity_id: data.id,
          field_name: 'price',
          field_type: 'number',
          field_value_number: service.price,
          organization_id: ORGANIZATION_ID,
          smart_code: 'HERA.SALON.SVC.DYN.PRICE.V1'
        });
      } else {
        console.error(`❌ Failed to create service ${service.name}:`, error);
      }
    }

    // 4. Create Status Entities
    console.log('\n📋 Creating appointment statuses...');
    const statuses = [
      { name: 'Booked', code: 'STATUS-BOOKED', color: 'blue' },
      { name: 'Checked In', code: 'STATUS-CHECKED-IN', color: 'yellow' },
      { name: 'In Progress', code: 'STATUS-IN-PROGRESS', color: 'orange' },
      { name: 'Completed', code: 'STATUS-COMPLETED', color: 'green' },
      { name: 'Cancelled', code: 'STATUS-CANCELLED', color: 'red' },
      { name: 'No Show', code: 'STATUS-NO-SHOW', color: 'gray' }
    ];

    const statusIds = {};
    for (const status of statuses) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'workflow_status',
          entity_name: status.name,
          entity_code: status.code,
          smart_code: 'HERA.SALON.WORKFLOW.STATUS.ENT.V1',
          organization_id: ORGANIZATION_ID,
          metadata: {
            color: status.color,
            type: 'appointment'
          }
        })
        .select()
        .single();

      if (!error && data) {
        statusIds[status.code] = data.id;
        console.log(`✅ Created status: ${status.name}`);
      } else {
        console.error(`❌ Failed to create status ${status.name}:`, error);
      }
    }

    // 5. Create Appointments (Both as entities and transactions)
    console.log('\n📅 Creating appointments...');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const appointments = [
      {
        code: 'APT-001',
        customer_idx: 0,
        stylist_idx: 0,
        service_idx: 0,
        status: 'STATUS-COMPLETED',
        date: today,
        time: 10,
        notes: 'Regular customer - prefers layered cut'
      },
      {
        code: 'APT-002',
        customer_idx: 1,
        stylist_idx: 1,
        service_idx: 1,
        status: 'STATUS-CHECKED-IN',
        date: today,
        time: 11,
        notes: 'First time coloring - wants subtle highlights'
      },
      {
        code: 'APT-003',
        customer_idx: 2,
        stylist_idx: 2,
        service_idx: 3,
        status: 'STATUS-BOOKED',
        date: today,
        time: 14,
        notes: 'Has dry hair - recommended by stylist'
      },
      {
        code: 'APT-004',
        customer_idx: 3,
        stylist_idx: 2,
        service_idx: 2,
        status: 'STATUS-BOOKED',
        date: tomorrow,
        time: 9,
        notes: 'Wants face-framing highlights'
      },
      {
        code: 'APT-005',
        customer_idx: 4,
        stylist_idx: 3,
        service_idx: 4,
        status: 'STATUS-BOOKED',
        date: tomorrow,
        time: 15,
        notes: 'Special event preparation'
      }
    ];

    for (const apt of appointments) {
      const service = services[apt.service_idx];
      const customer = customers[apt.customer_idx];
      const stylist = stylists[apt.stylist_idx];
      
      const appointmentDate = new Date(apt.date.getTime() + apt.time * 60 * 60 * 1000);
      const endTime = new Date(appointmentDate.getTime() + service.duration * 60 * 1000);

      // Create appointment entity
      const { data: apptEntity, error: apptError } = await supabase
        .from('core_entities')
        .insert({
          entity_type: 'appointment',
          entity_name: `${customer.name} - ${service.name}`,
          entity_code: apt.code,
          smart_code: 'HERA.SALON.APPT.ENT.BOOKING.V1',
          organization_id: ORGANIZATION_ID,
          metadata: {
            customer_id: customerIds[apt.customer_idx],
            stylist_id: stylistIds[apt.stylist_idx],
            service_id: serviceIds[apt.service_idx],
            start_time: appointmentDate.toISOString(),
            end_time: endTime.toISOString(),
            status: statuses.find(s => s.code === apt.status).name.toLowerCase().replace(' ', '_'),
            notes: apt.notes,
            price: service.price
          }
        })
        .select()
        .single();

      if (apptError) {
        console.error(`❌ Failed to create appointment ${apt.code}:`, apptError);
        continue;
      }

      console.log(`✅ Created appointment: ${apt.code}`);

      // Add dynamic data for appointment
      await supabase.from('core_dynamic_data').insert([
        {
          entity_id: apptEntity.id,
          field_name: 'start_time',
          field_type: 'date',
          field_value_date: appointmentDate.toISOString(),
          organization_id: ORGANIZATION_ID,
          smart_code: 'HERA.SALON.APPT.DYN.START.V1'
        },
        {
          entity_id: apptEntity.id,
          field_name: 'end_time',
          field_type: 'date',
          field_value_date: endTime.toISOString(),
          organization_id: ORGANIZATION_ID,
          smart_code: 'HERA.SALON.APPT.DYN.END.V1'
        },
        {
          entity_id: apptEntity.id,
          field_name: 'status',
          field_type: 'text',
          field_value_text: statuses.find(s => s.code === apt.status).name.toLowerCase().replace(' ', '_'),
          organization_id: ORGANIZATION_ID,
          smart_code: 'HERA.SALON.APPT.DYN.STATUS.V1'
        },
        {
          entity_id: apptEntity.id,
          field_name: 'notes',
          field_type: 'text',
          field_value_text: apt.notes,
          organization_id: ORGANIZATION_ID,
          smart_code: 'HERA.SALON.APPT.DYN.NOTES.V1'
        },
        {
          entity_id: apptEntity.id,
          field_name: 'price',
          field_type: 'number',
          field_value_number: service.price,
          organization_id: ORGANIZATION_ID,
          smart_code: 'HERA.SALON.APPT.DYN.PRICE.V1'
        }
      ]);

      // Create relationships
      await supabase.from('core_relationships').insert([
        {
          from_entity_id: apptEntity.id,
          to_entity_id: customerIds[apt.customer_idx],
          relationship_type: 'appointment_for',
          smart_code: 'HERA.SALON.REL.APPT.CUSTOMER.V1',
          organization_id: ORGANIZATION_ID
        },
        {
          from_entity_id: apptEntity.id,
          to_entity_id: stylistIds[apt.stylist_idx],
          relationship_type: 'appointment_with',
          smart_code: 'HERA.SALON.REL.APPT.STYLIST.V1',
          organization_id: ORGANIZATION_ID
        },
        {
          from_entity_id: apptEntity.id,
          to_entity_id: serviceIds[apt.service_idx],
          relationship_type: 'appointment_service',
          smart_code: 'HERA.SALON.REL.APPT.SERVICE.V1',
          organization_id: ORGANIZATION_ID
        },
        {
          from_entity_id: apptEntity.id,
          to_entity_id: statusIds[apt.status],
          relationship_type: 'has_status',
          smart_code: 'HERA.SALON.REL.STATUS.V1',
          organization_id: ORGANIZATION_ID,
          relationship_data: {
            assigned_at: new Date().toISOString(),
            assigned_by: 'system'
          }
        }
      ]);

      // Also create as transaction for reporting
      const { data: txn, error: txnError } = await supabase
        .from('universal_transactions')
        .insert({
          transaction_type: 'appointment',
          transaction_code: apt.code,
          transaction_date: appointmentDate.toISOString(),
          source_entity_id: customerIds[apt.customer_idx],
          target_entity_id: stylistIds[apt.stylist_idx],
          reference_entity_id: serviceIds[apt.service_idx],
          total_amount: service.price,
          smart_code: 'HERA.SALON.APPT.TXN.BOOKING.V1',
          organization_id: ORGANIZATION_ID,
          metadata: {
            start_time: appointmentDate.toISOString(),
            end_time: endTime.toISOString(),
            duration_minutes: service.duration,
            notes: apt.notes,
            appointment_entity_id: apptEntity.id,
            status: statuses.find(s => s.code === apt.status).name
          }
        })
        .select()
        .single();

      if (!txnError && txn) {
        // Create transaction line
        await supabase.from('universal_transaction_lines').insert({
          transaction_id: txn.id,
          line_number: 1,
          entity_id: serviceIds[apt.service_idx],
          quantity: 1,
          unit_price: service.price,
          line_amount: service.price,
          smart_code: 'HERA.SALON.APPT.LINE.SERVICE.V1',
          organization_id: ORGANIZATION_ID,
          metadata: {
            service_name: service.name,
            duration_minutes: service.duration
          }
        });
      }
    }

    console.log('\n✅ Salon appointment data created successfully!');
    console.log('🌐 Visit http://localhost:3000/appointments or http://localhost:3000/~hair-talkz to view');
  } catch (error) {
    console.error('❌ Error creating salon data:', error);
  }
}

// Run the script
createSalonData();