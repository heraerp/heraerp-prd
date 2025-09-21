#!/usr/bin/env node

// ============================================================================
// HERA • Seed Salon Appointments for Next 2 Weeks
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const { format, addDays, addHours, addMinutes, startOfDay, setHours } = require('date-fns');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env.local' });

// Simple UUID v4 generator
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
  { name: 'Keratin Treatment', duration: 180, price: 450 },
  { name: 'Balayage', duration: 240, price: 500 },
  { name: 'Root Touch Up', duration: 90, price: 150 },
  { name: 'Perm', duration: 150, price: 280 }
];

// Staff members
const STAFF = [
  { id: 'staff1', name: 'Sarah Johnson', specialties: ['Hair Color', 'Highlights', 'Balayage'] },
  { id: 'staff2', name: 'Emma Wilson', specialties: ['Haircut & Style', 'Blow Dry', 'Hair Extensions'] },
  { id: 'staff3', name: 'Lisa Martinez', specialties: ['Hair Treatment', 'Keratin Treatment', 'Perm'] },
  { id: 'staff4', name: 'Jessica Chen', specialties: ['Hair Color', 'Root Touch Up', 'Highlights'] },
  { id: 'staff5', name: 'Maria Rodriguez', specialties: ['Haircut & Style', 'Hair Extensions', 'Blow Dry'] }
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
  'Zainab Hussein',
  'Emma Thompson',
  'Sophia Williams',
  'Isabella Brown',
  'Olivia Davis',
  'Ava Wilson',
  'Charlotte Johnson',
  'Mia Anderson',
  'Luna Martinez',
  'Grace Taylor',
  'Chloe White'
];

// Phone numbers (UAE format)
const PHONE_PREFIXES = ['050', '052', '054', '055', '056'];

function getRandomPhoneNumber() {
  const prefix = PHONE_PREFIXES[Math.floor(Math.random() * PHONE_PREFIXES.length)];
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `+971${prefix}${number}`;
}

// Status distribution for realistic data
const STATUS_WEIGHTS = {
  'DRAFT': 0.15,        // 15% draft appointments
  'BOOKED': 0.45,       // 45% booked
  'CHECKED_IN': 0.10,   // 10% checked in
  'IN_SERVICE': 0.08,   // 8% currently in service
  'DONE': 0.15,         // 15% completed
  'CANCELLED': 0.05,    // 5% cancelled
  'NO_SHOW': 0.02       // 2% no-show
};

function getRandomStatus(date, timeSlot) {
  const now = new Date();
  const appointmentTime = new Date(date);
  
  // Past appointments can't be DRAFT or BOOKED
  if (appointmentTime < now) {
    const pastStatuses = ['DONE', 'CANCELLED', 'NO_SHOW'];
    const weights = [0.85, 0.10, 0.05];
    const rand = Math.random();
    let sum = 0;
    for (let i = 0; i < pastStatuses.length; i++) {
      sum += weights[i];
      if (rand < sum) return pastStatuses[i];
    }
    return 'DONE';
  }
  
  // Today's appointments have different distribution based on time
  if (appointmentTime.toDateString() === now.toDateString()) {
    const hourDiff = (appointmentTime.getHours() - now.getHours());
    if (hourDiff < -2) return 'DONE';
    if (hourDiff < 0) return Math.random() < 0.7 ? 'DONE' : 'IN_SERVICE';
    if (hourDiff < 2) return Math.random() < 0.5 ? 'CHECKED_IN' : 'BOOKED';
  }
  
  // Future appointments
  const rand = Math.random();
  let sum = 0;
  for (const [status, weight] of Object.entries(STATUS_WEIGHTS)) {
    sum += weight;
    if (rand < sum) return status;
  }
  return 'BOOKED';
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

// Create an appointment entity and transaction
async function createAppointment(date, timeSlot, customerIndex, serviceIndex, staffIndex, status) {
  try {
    const customer = CUSTOMERS[customerIndex % CUSTOMERS.length];
    const service = SERVICES[serviceIndex % SERVICES.length];
    const staff = STAFF[staffIndex % STAFF.length];
    
    const startTime = setHours(startOfDay(date), timeSlot.hour);
    startTime.setMinutes(timeSlot.minute);
    const endTime = addMinutes(startTime, service.duration);
    
    // Skip if appointment extends beyond closing time
    if (endTime.getHours() >= 20) return null;
    
    // 1. Create customer entity if not exists
    const customerEntityId = uuidv4();
    const customerCode = `customer-${customer.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'customer')
      .eq('entity_code', customerCode)
      .single();
    
    let finalCustomerId = customerEntityId;
    
    if (!existingCustomer) {
      const { data: customerEntity, error: customerError } = await supabase
        .from('core_entities')
        .insert({
          id: customerEntityId,
          organization_id: SALON_ORG_ID,
          entity_type: 'customer',
          entity_name: customer,
          entity_code: customerCode,
          smart_code: 'HERA.SALON.CUST.ENT.PROF.V1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (customerError) {
        console.error('Error creating customer:', customerError);
        return null;
      }
    } else {
      finalCustomerId = existingCustomer.id;
    }
    
    // 2. Add customer phone number
    if (!existingCustomer) {
      await supabase
        .from('core_dynamic_data')
        .insert({
          id: uuidv4(),
          organization_id: SALON_ORG_ID,
          entity_id: finalCustomerId,
          field_name: 'phone',
          field_value_text: getRandomPhoneNumber(),
          smart_code: 'HERA.SALON.CUST.DYN.PHONE.V1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
    
    // 3. Create staff entity if not exists
    const staffCode = staff.id;
    const { data: existingStaff } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'staff')
      .eq('entity_code', staffCode)
      .single();
    
    let staffEntityId;
    if (!existingStaff) {
      staffEntityId = uuidv4();
      await supabase
        .from('core_entities')
        .insert({
          id: staffEntityId,
          organization_id: SALON_ORG_ID,
          entity_type: 'staff',
          entity_name: staff.name,
          entity_code: staffCode,
          smart_code: 'HERA.SALON.STAFF.ENT.PROF.V1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } else {
      staffEntityId = existingStaff.id;
    }
    
    // 4. Create service entity if not exists
    const serviceCode = `service-${service.name.toLowerCase().replace(/\s+/g, '-')}`;
    const { data: existingService } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'service')
      .eq('entity_code', serviceCode)
      .single();
    
    let serviceEntityId;
    if (!existingService) {
      serviceEntityId = uuidv4();
      await supabase
        .from('core_entities')
        .insert({
          id: serviceEntityId,
          organization_id: SALON_ORG_ID,
          entity_type: 'service',
          entity_name: service.name,
          entity_code: serviceCode,
          smart_code: 'HERA.SALON.SVC.ENT.STD.V1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } else {
      serviceEntityId = existingService.id;
    }
    
    // 5. Create appointment transaction
    const appointmentId = uuidv4();
    const appointmentCode = `appt-${format(startTime, 'yyyyMMdd-HHmm')}-${customer.split(' ')[0].toLowerCase()}`;
    
    const metadata = {
      customer_id: finalCustomerId,
      customer_name: customer,
      service_id: serviceEntityId,
      service_name: service.name,
      staff_id: staffEntityId,
      staff_name: staff.name,
      branch_id: SALON_BRANCH_ID,
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      duration_minutes: service.duration,
      status,
      // Add rank for Kanban ordering
      rank: `h${timeSlot.hour.toString().padStart(2, '0')}m${timeSlot.minute.toString().padStart(2, '0')}`,
      notes: status === 'CANCELLED' ? 'Customer requested cancellation' : 
             status === 'NO_SHOW' ? 'Customer did not arrive' : null
    };
    
    const { data: appointment, error: appointmentError } = await supabase
      .from('universal_transactions')
      .insert({
        id: appointmentId,
        organization_id: SALON_ORG_ID,
        transaction_type: 'appointment',
        transaction_code: appointmentCode,
        transaction_date: format(startTime, 'yyyy-MM-dd'),
        source_entity_id: finalCustomerId,
        total_amount: service.price,
        transaction_status: 'active',
        transaction_currency_code: 'AED',
        smart_code: 'HERA.SALON.APPT.TXN.BOOK.V1',
        metadata: metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      return null;
    }
    
    // 6. Create appointment line item
    await supabase
      .from('universal_transaction_lines')
      .insert({
        id: uuidv4(),
        organization_id: SALON_ORG_ID,
        transaction_id: appointmentId,
        entity_id: serviceEntityId,
        line_number: 1,
        line_type: 'service',
        description: service.name,
        quantity: 1,
        unit_amount: service.price,
        line_amount: service.price,
        discount_amount: 0,
        tax_amount: 0,
        smart_code: 'HERA.SALON.APPT.LINE.SVC.V1',
        line_data: {
          service_name: service.name,
          duration_minutes: service.duration
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    console.log(`✅ Created ${status} appointment: ${customer} - ${service.name} with ${staff.name} on ${format(startTime, 'MMM dd HH:mm')}`);
    return appointment;
    
  } catch (error) {
    console.error('Error in createAppointment:', error);
    return null;
  }
}

// Main seed function
async function seedAppointments() {
  console.log('🌱 Starting salon appointment seeding for next 2 weeks...\n');
  
  const startDate = new Date();
  const timeSlots = generateTimeSlots();
  let totalCreated = 0;
  let customerIndex = 0;
  let serviceIndex = 0;
  let staffIndex = 0;
  
  // Loop through next 14 days
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
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
      appointmentDensity = 0.8; // 80% slots filled on weekends
    } else {
      appointmentDensity = 0.6; // 60% slots filled on weekdays
    }
    
    // Create appointments for various time slots
    for (const timeSlot of timeSlots) {
      // Random chance to have appointment in this slot
      if (Math.random() > appointmentDensity) continue;
      
      // Create 1-3 appointments per slot (multiple staff)
      const appointmentsInSlot = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < appointmentsInSlot; i++) {
        const status = getRandomStatus(currentDate, timeSlot);
        
        const appointment = await createAppointment(
          currentDate,
          timeSlot,
          customerIndex++,
          serviceIndex++,
          staffIndex++,
          status
        );
        
        if (appointment) {
          totalCreated++;
        }
        
        // Rotate through staff
        staffIndex = staffIndex % STAFF.length;
      }
    }
  }
  
  console.log(`\n✨ Seeding complete! Created ${totalCreated} appointments.`);
  console.log('\n📊 Status distribution:');
  
  // Get status summary
  const { data: statusSummary } = await supabase
    .from('universal_transactions')
    .select('metadata')
    .eq('organization_id', SALON_ORG_ID)
    .eq('transaction_type', 'appointment')
    .gte('transaction_date', format(startDate, 'yyyy-MM-dd'));
  
  if (statusSummary) {
    const statusCounts = {};
    statusSummary.forEach(appt => {
      const status = appt.metadata?.status || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} appointments`);
    });
  }
}

// Run the seeder
seedAppointments()
  .then(() => {
    console.log('\n🎉 Salon appointment seeding completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error seeding appointments:', error);
    process.exit(1);
  });