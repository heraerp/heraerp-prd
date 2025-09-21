#!/usr/bin/env node

// ============================================================================
// HERA • Create Entity-based Appointments for the Appointments Page
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const { format, addDays, addHours, addMinutes, startOfDay, setHours } = require('date-fns');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env.local' });

function uuidv4() {
  return crypto.randomUUID();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Constants
const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
const SALON_BRANCH_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

// Services with durations
const SERVICES = [
  { name: 'Haircut & Style', duration: 60, price: 120 },
  { name: 'Hair Color', duration: 120, price: 250 },
  { name: 'Highlights', duration: 180, price: 350 },
  { name: 'Hair Treatment', duration: 90, price: 180 },
  { name: 'Blow Dry', duration: 45, price: 80 },
  { name: 'Hair Extensions', duration: 240, price: 600 },
];

// Staff members
const STAFF = [
  { id: 'staff1', name: 'Sarah Johnson' },
  { id: 'staff2', name: 'Emma Wilson' },
  { id: 'staff3', name: 'Lisa Martinez' },
  { id: 'staff4', name: 'Jessica Chen' },
  { id: 'staff5', name: 'Maria Rodriguez' }
];

// Customer names
const CUSTOMERS = [
  'Amira Al Rashid',
  'Fatima Hassan', 
  'Sara Mahmoud',
  'Layla Ahmed',
  'Noor Sheikh',
  'Yasmin Khalil',
  'Rania Abbas',
  'Hala Saeed',
  'Maryam Ali',
  'Zainab Hussein'
];

// Status distribution
const STATUSES = ['booked', 'checked_in', 'completed', 'cancelled', 'no_show'];

function getRandomStatus() {
  const weights = [0.6, 0.15, 0.15, 0.08, 0.02]; // 60% booked, 15% checked_in, etc.
  const rand = Math.random();
  let sum = 0;
  for (let i = 0; i < STATUSES.length; i++) {
    sum += weights[i];
    if (rand < sum) return STATUSES[i];
  }
  return 'booked';
}

// Create an appointment entity
async function createAppointment(date, timeSlot, customerIndex, serviceIndex, staffIndex) {
  try {
    const customer = CUSTOMERS[customerIndex % CUSTOMERS.length];
    const service = SERVICES[serviceIndex % SERVICES.length];
    const staff = STAFF[staffIndex % STAFF.length];
    const status = getRandomStatus();
    
    const startTime = setHours(startOfDay(date), timeSlot.hour);
    startTime.setMinutes(timeSlot.minute);
    const endTime = addMinutes(startTime, service.duration);
    
    // Skip if appointment extends beyond closing time
    if (endTime.getHours() >= 20) return null;
    
    const appointmentId = uuidv4();
    const appointmentCode = `APT-${format(startTime, 'yyyyMMdd-HHmm')}-${customer.split(' ')[0].toLowerCase()}`;
    
    // 1. Create appointment entity
    const appointmentEntity = {
      id: appointmentId,
      organization_id: SALON_ORG_ID,
      entity_type: 'appointment',
      entity_name: `${customer} - ${service.name} - ${format(startTime, 'MMM dd, yyyy')}`,
      entity_code: appointmentCode,
      smart_code: 'HERA.SALON.APPT.ENTITY.APPOINTMENT.V1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: entityError } = await supabase
      .from('core_entities')
      .insert(appointmentEntity);

    if (entityError) {
      console.error(`❌ Error creating entity:`, entityError);
      return null;
    }

    // 2. Create dynamic data fields
    const dynamicFields = [
      {
        field_name: 'start_time',
        field_value_text: startTime.toISOString(),
        smart_code: 'HERA.SALON.APPT.DYN.START.V1'
      },
      {
        field_name: 'end_time', 
        field_value_text: endTime.toISOString(),
        smart_code: 'HERA.SALON.APPT.DYN.END.V1'
      },
      {
        field_name: 'status',
        field_value_text: status,
        smart_code: 'HERA.SALON.APPT.DYN.STATUS.V1'
      },
      {
        field_name: 'customer_id',
        field_value_text: `customer-${customer.toLowerCase().replace(/\s+/g, '-')}`,
        smart_code: 'HERA.SALON.APPT.DYN.CUSTOMER.V1'
      },
      {
        field_name: 'service_ids',
        field_value_json: JSON.stringify([`service-${service.name.toLowerCase().replace(/\s+/g, '-')}`]),
        smart_code: 'HERA.SALON.APPT.DYN.SERVICES.V1'
      },
      {
        field_name: 'stylist_id',
        field_value_text: staff.id,
        smart_code: 'HERA.SALON.APPT.DYN.STYLIST.V1'
      },
      {
        field_name: 'branch_id',
        field_value_text: SALON_BRANCH_ID,
        smart_code: 'HERA.SALON.APPT.DYN.BRANCH.V1'
      },
      {
        field_name: 'price',
        field_value_number: service.price,
        smart_code: 'HERA.SALON.APPT.DYN.PRICE.V1'
      },
      {
        field_name: 'currency_code',
        field_value_text: 'AED',
        smart_code: 'HERA.SALON.APPT.DYN.CURRENCY.V1'
      },
      {
        field_name: 'duration_minutes',
        field_value_number: service.duration,
        smart_code: 'HERA.SALON.APPT.DYN.DURATION.V1'
      },
      {
        field_name: 'notes',
        field_value_text: status === 'cancelled' ? 'Customer requested cancellation' : 
                         status === 'no_show' ? 'Customer did not arrive' : 
                         `${service.name} with ${staff.name}`,
        smart_code: 'HERA.SALON.APPT.DYN.NOTES.V1'
      }
    ];

    // Insert dynamic data
    for (const field of dynamicFields) {
      if (field.field_value_text || field.field_value_number || field.field_value_json) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            id: uuidv4(),
            organization_id: SALON_ORG_ID,
            entity_id: appointmentId,
            field_name: field.field_name,
            field_type: field.field_value_number ? 'number' : 
                       field.field_value_json ? 'json' : 'text',
            field_value_text: field.field_value_text,
            field_value_number: field.field_value_number,
            field_value_json: field.field_value_json,
            smart_code: field.smart_code,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    }

    console.log(`✅ Created ${status} appointment: ${customer} - ${service.name} with ${staff.name} on ${format(startTime, 'MMM dd HH:mm')}`);
    return appointmentEntity;
    
  } catch (error) {
    console.error('Error in createAppointment:', error);
    return null;
  }
}

// Generate time slots for salon (9 AM to 8 PM)
function generateTimeSlots() {
  const slots = [];
  for (let hour = 9; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      slots.push({ hour, minute });
    }
  }
  return slots;
}

// Main seed function
async function seedEntityAppointments() {
  console.log('🌱 Creating entity-based appointments for the appointments page...\n');
  
  const startDate = new Date();
  const timeSlots = generateTimeSlots();
  let totalCreated = 0;
  let customerIndex = 0;
  let serviceIndex = 0;
  let staffIndex = 0;
  
  // Loop through next 5 days
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const currentDate = addDays(startDate, dayOffset);
    const dayName = format(currentDate, 'EEEE');
    
    // Skip Sundays (salon closed)
    if (dayName === 'Sunday') {
      console.log(`\n⚡ Skipping ${format(currentDate, 'MMM dd')} - Salon closed on Sundays`);
      continue;
    }
    
    console.log(`\n📅 Creating appointments for ${format(currentDate, 'EEEE, MMM dd, yyyy')}`);
    
    // Determine appointment density based on day
    let appointmentDensity;
    if (dayName === 'Saturday' || dayName === 'Friday') {
      appointmentDensity = 0.4; // 40% slots filled on weekends
    } else {
      appointmentDensity = 0.3; // 30% slots filled on weekdays
    }
    
    // Create appointments for various time slots
    for (const timeSlot of timeSlots) {
      // Random chance to have appointment in this slot
      if (Math.random() > appointmentDensity) continue;
      
      const appointment = await createAppointment(
        currentDate,
        timeSlot,
        customerIndex++,
        serviceIndex++,
        staffIndex++
      );
      
      if (appointment) {
        totalCreated++;
      }
      
      // Rotate through staff
      staffIndex = staffIndex % STAFF.length;
    }
  }
  
  console.log(`\n✨ Seeding complete! Created ${totalCreated} appointments.`);
  console.log('\n📋 The /salon/appointments page should now show appointments!');
}

// Run the seeder
seedEntityAppointments()
  .then(() => {
    console.log('\n🎉 Entity-based appointment seeding completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error seeding appointments:', error);
    process.exit(1);
  });