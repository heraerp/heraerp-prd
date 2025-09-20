#!/usr/bin/env node

/**
 * HERA Salon Reporting Seed Data Script
 * 
 * Creates comprehensive salon data including:
 * - KPIs (revenue, appointments, average ticket, utilization)
 * - Revenue series data (weekly for last 12 weeks)
 * - Recent bookings/appointments
 * - Staff/stylist performance
 * - Low stock inventory items
 * - Membership tiers
 * - NPS (Net Promoter Score) data
 * - Universal transactions for salon services
 */

require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';
const SALON_NAME = 'Luxe Beauty Studio';

// Helper function to generate dates
function getDateRange(weeks = 12) {
  const dates = [];
  const today = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - (i * 7));
    dates.push(date);
  }
  
  return dates;
}

// Helper function to generate random date within range
function randomDateInRange(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

// Helper function to generate appointment times
function generateAppointmentSlots(date, stylistId, numSlots = 8) {
  const slots = [];
  const startHour = 9; // 9 AM
  const slotDuration = 1; // 1 hour slots
  
  for (let i = 0; i < numSlots; i++) {
    const appointmentDate = new Date(date);
    appointmentDate.setHours(startHour + (i * slotDuration), 0, 0, 0);
    
    // 80% chance of slot being booked
    if (Math.random() < 0.8) {
      slots.push({
        date: appointmentDate,
        stylistId: stylistId,
        duration: slotDuration * 60 // minutes
      });
    }
  }
  
  return slots;
}

async function seedSalonData() {
  console.log('🎯 Starting Salon Reporting Seed Data...');
  console.log(`📍 Organization: ${ORGANIZATION_ID}`);
  console.log(`💅 Salon: ${SALON_NAME}`);

  try {
    // 1. Create Salon Entity
    console.log('\n1️⃣ Creating salon entity...');
    const { data: salon, error: salonError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORGANIZATION_ID,
        entity_type: 'location',
        entity_name: SALON_NAME,
        entity_code: 'LUXE-BEAUTY-001',
        smart_code: 'HERA.SALON.LOC.MAIN.BRANCH.v1',
        metadata: {
          address: '123 Beauty Lane, Fashion District, CA 90210',
          phone: '+1-310-555-0123',
          email: 'info@luxebeauty.com',
          hours: {
            monday: '9:00 AM - 8:00 PM',
            tuesday: '9:00 AM - 8:00 PM',
            wednesday: '9:00 AM - 8:00 PM',
            thursday: '9:00 AM - 8:00 PM',
            friday: '9:00 AM - 9:00 PM',
            saturday: '9:00 AM - 9:00 PM',
            sunday: '10:00 AM - 6:00 PM'
          }
        }
      })
      .select()
      .single();

    if (salonError) throw salonError;
    console.log('✅ Salon created:', salon.entity_name);

    // 2. Create Staff/Stylists
    console.log('\n2️⃣ Creating staff/stylists...');
    const stylists = [
      {
        entity_name: 'Emma Thompson',
        entity_code: 'STYLIST-001',
        smart_code: 'HERA.SALON.HR.STAFF.STYLIST.v1',
        metadata: {
          role: 'Senior Stylist',
          specialties: ['Color Specialist', 'Balayage Expert'],
          experience_years: 8,
          commission_rate: 0.45,
          rating: 4.9,
          reviews_count: 234
        }
      },
      {
        entity_name: 'Michael Chen',
        entity_code: 'STYLIST-002',
        smart_code: 'HERA.SALON.HR.STAFF.STYLIST.v1',
        metadata: {
          role: 'Master Stylist',
          specialties: ['Precision Cuts', 'Men\'s Styling'],
          experience_years: 12,
          commission_rate: 0.50,
          rating: 4.8,
          reviews_count: 189
        }
      },
      {
        entity_name: 'Sophia Rodriguez',
        entity_code: 'STYLIST-003',
        smart_code: 'HERA.SALON.HR.STAFF.STYLIST.v1',
        metadata: {
          role: 'Stylist',
          specialties: ['Extensions', 'Updos'],
          experience_years: 5,
          commission_rate: 0.40,
          rating: 4.7,
          reviews_count: 156
        }
      },
      {
        entity_name: 'James Wilson',
        entity_code: 'STYLIST-004',
        smart_code: 'HERA.SALON.HR.STAFF.STYLIST.v1',
        metadata: {
          role: 'Colorist',
          specialties: ['Creative Color', 'Corrective Color'],
          experience_years: 6,
          commission_rate: 0.42,
          rating: 4.9,
          reviews_count: 178
        }
      }
    ];

    const stylistEntities = [];
    for (const stylist of stylists) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'employee',
          ...stylist,
        })
        .select()
        .single();

      if (error) throw error;
      stylistEntities.push(data);
      console.log(`✅ Created stylist: ${data.entity_name}`);
    }

    // 3. Create Services
    console.log('\n3️⃣ Creating salon services...');
    const services = [
      {
        entity_name: 'Haircut & Style',
        entity_code: 'SVC-HAIRCUT',
        smart_code: 'HERA.SALON.SVC.HAIR.CUT.v1',
        metadata: {
          duration_minutes: 60,
          price: 85.00,
          category: 'Hair Services',
          description: 'Professional haircut with blow dry and style'
        }
      },
      {
        entity_name: 'Full Color',
        entity_code: 'SVC-COLOR-FULL',
        smart_code: 'HERA.SALON.SVC.COLOR.FULL.v1',
        metadata: {
          duration_minutes: 120,
          price: 185.00,
          category: 'Color Services',
          description: 'Complete hair color transformation'
        }
      },
      {
        entity_name: 'Balayage',
        entity_code: 'SVC-BALAYAGE',
        smart_code: 'HERA.SALON.SVC.COLOR.BALAYAGE.v1',
        metadata: {
          duration_minutes: 180,
          price: 285.00,
          category: 'Color Services',
          description: 'Hand-painted highlights for natural dimension'
        }
      },
      {
        entity_name: 'Keratin Treatment',
        entity_code: 'SVC-KERATIN',
        smart_code: 'HERA.SALON.SVC.TREATMENT.KERATIN.v1',
        metadata: {
          duration_minutes: 150,
          price: 325.00,
          category: 'Treatments',
          description: 'Smoothing treatment for frizz-free hair'
        }
      },
      {
        entity_name: 'Blowout',
        entity_code: 'SVC-BLOWOUT',
        smart_code: 'HERA.SALON.SVC.STYLE.BLOWOUT.v1',
        metadata: {
          duration_minutes: 45,
          price: 55.00,
          category: 'Styling',
          description: 'Professional blowout styling'
        }
      }
    ];

    const serviceEntities = [];
    for (const service of services) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'product',
          ...service,
        })
        .select()
        .single();

      if (error) throw error;
      serviceEntities.push(data);
      console.log(`✅ Created service: ${data.entity_name}`);
    }

    // 4. Create Products
    console.log('\n4️⃣ Creating salon products...');
    const products = [
      {
        entity_name: 'Luxury Shampoo',
        entity_code: 'PROD-SHAMPOO-001',
        smart_code: 'HERA.SALON.PROD.HAIR.SHAMPOO.v1',
        metadata: {
          price: 38.00,
          cost: 15.00,
          brand: 'Kerastase',
          size: '250ml',
          category: 'Hair Care',
          stock_quantity: 3, // Low stock
          reorder_point: 10,
          reorder_quantity: 20
        }
      },
      {
        entity_name: 'Repair Conditioner',
        entity_code: 'PROD-COND-001',
        smart_code: 'HERA.SALON.PROD.HAIR.CONDITIONER.v1',
        metadata: {
          price: 42.00,
          cost: 18.00,
          brand: 'Oribe',
          size: '200ml',
          category: 'Hair Care',
          stock_quantity: 2, // Low stock
          reorder_point: 8,
          reorder_quantity: 15
        }
      },
      {
        entity_name: 'Heat Protectant Spray',
        entity_code: 'PROD-SPRAY-001',
        smart_code: 'HERA.SALON.PROD.STYLE.HEATPROTECT.v1',
        metadata: {
          price: 32.00,
          cost: 12.00,
          brand: 'Moroccanoil',
          size: '200ml',
          category: 'Styling',
          stock_quantity: 15,
          reorder_point: 5,
          reorder_quantity: 20
        }
      },
      {
        entity_name: 'Hair Mask Treatment',
        entity_code: 'PROD-MASK-001',
        smart_code: 'HERA.SALON.PROD.TREATMENT.MASK.v1',
        metadata: {
          price: 65.00,
          cost: 28.00,
          brand: 'Olaplex',
          size: '100ml',
          category: 'Treatments',
          stock_quantity: 4, // Low stock
          reorder_point: 6,
          reorder_quantity: 12
        }
      }
    ];

    const productEntities = [];
    for (const product of products) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'product',
          ...product,
        })
        .select()
        .single();

      if (error) throw error;
      productEntities.push(data);
      console.log(`✅ Created product: ${data.entity_name}`);
    }

    // 5. Create Customers
    console.log('\n5️⃣ Creating customers...');
    const customerNames = [
      'Jennifer Anderson', 'Sarah Johnson', 'Lisa Martinez', 'Michelle Brown',
      'Emily Davis', 'Amanda Wilson', 'Jessica Taylor', 'Nicole Thompson',
      'Stephanie Miller', 'Rebecca Garcia', 'Ashley Rodriguez', 'Megan Lee',
      'Samantha White', 'Christina Lopez', 'Diana Hernandez', 'Laura Moore',
      'Rachel Clark', 'Victoria Lewis', 'Brittany Walker', 'Kimberly Hall'
    ];

    const customerEntities = [];
    for (let i = 0; i < customerNames.length; i++) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'customer',
          entity_name: customerNames[i],
          entity_code: `CUST-${String(i + 1).padStart(3, '0')}`,
          smart_code: 'HERA.SALON.CRM.CUSTOMER.REGULAR.v1',
          metadata: {
            phone: `+1-310-555-${String(1000 + i).padStart(4, '0')}`,
            email: `${customerNames[i].toLowerCase().replace(' ', '.')}@email.com`,
            loyalty_points: Math.floor(Math.random() * 500) + 100,
            lifetime_value: Math.floor(Math.random() * 5000) + 1000,
            visit_count: Math.floor(Math.random() * 50) + 10,
            last_visit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            preferred_stylist: stylistEntities[Math.floor(Math.random() * stylistEntities.length)].id
          }
        })
        .select()
        .single();

      if (error) throw error;
      customerEntities.push(data);
    }
    console.log(`✅ Created ${customerEntities.length} customers`);

    // 6. Create Membership Tiers
    console.log('\n6️⃣ Creating membership tiers...');
    const membershipTiers = [
      {
        entity_name: 'Bronze Membership',
        entity_code: 'MEMBER-BRONZE',
        smart_code: 'HERA.SALON.CRM.MEMBERSHIP.BRONZE.v1',
        metadata: {
          tier: 'Bronze',
          benefits: ['5% discount on services', 'Priority booking'],
          points_required: 0,
          discount_percentage: 5
        }
      },
      {
        entity_name: 'Silver Membership',
        entity_code: 'MEMBER-SILVER',
        smart_code: 'HERA.SALON.CRM.MEMBERSHIP.SILVER.v1',
        metadata: {
          tier: 'Silver',
          benefits: ['10% discount on services', 'Priority booking', 'Free birthday blowout'],
          points_required: 1000,
          discount_percentage: 10
        }
      },
      {
        entity_name: 'Gold Membership',
        entity_code: 'MEMBER-GOLD',
        smart_code: 'HERA.SALON.CRM.MEMBERSHIP.GOLD.v1',
        metadata: {
          tier: 'Gold',
          benefits: ['15% discount on services', 'VIP booking', 'Monthly free treatment', 'Exclusive events'],
          points_required: 5000,
          discount_percentage: 15
        }
      }
    ];

    for (const tier of membershipTiers) {
      const { error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'loyalty_program',
          ...tier,
        });

      if (error) throw error;
      console.log(`✅ Created membership tier: ${tier.entity_name}`);
    }

    // 7. Generate Appointments and Transactions for the last 12 weeks
    console.log('\n7️⃣ Generating appointments and transactions for last 12 weeks...');
    const dateRange = getDateRange(12);
    const allAppointments = [];
    const allTransactions = [];

    for (const weekStart of dateRange) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      console.log(`\n📅 Processing week: ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`);

      // Generate appointments for each day of the week
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(currentDate.getDate() + day);
        
        // Skip if date is in the future
        if (currentDate > new Date()) continue;

        // Generate appointments for each stylist
        for (const stylist of stylistEntities) {
          const dailySlots = generateAppointmentSlots(currentDate, stylist.id);
          
          for (const slot of dailySlots) {
            // Select random customer and service
            const customer = customerEntities[Math.floor(Math.random() * customerEntities.length)];
            const service = serviceEntities[Math.floor(Math.random() * serviceEntities.length)];
            
            // Create appointment entity
            const { data: appointment, error: appointmentError } = await supabase
              .from('core_entities')
              .insert({
                organization_id: ORGANIZATION_ID,
                entity_type: 'appointment',
                entity_name: `${customer.entity_name} - ${service.entity_name}`,
                entity_code: `APPT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                smart_code: 'HERA.SALON.APPT.SERVICE.BOOKING.v1',
                metadata: {
                  appointment_date: slot.date.toISOString(),
                  customer_id: customer.id,
                  customer_name: customer.entity_name,
                  stylist_id: stylist.id,
                  stylist_name: stylist.entity_name,
                  service_id: service.id,
                  service_name: service.entity_name,
                  duration_minutes: service.metadata.duration_minutes,
                  status: 'completed',
                  price: service.metadata.price
                }
              })
              .select()
              .single();

            if (appointmentError) throw appointmentError;
            allAppointments.push(appointment);

            // Create transaction for completed appointment
            const { data: transaction, error: transactionError } = await supabase
              .from('universal_transactions')
              .insert({
                organization_id: ORGANIZATION_ID,
                transaction_type: 'sale',
                transaction_date: slot.date.toISOString(),
                transaction_code: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                smart_code: 'HERA.SALON.POS.TXN.SERVICE.v1',
                source_entity_id: customer.id,
                target_entity_id: salon.id,
                total_amount: service.metadata.price,
                metadata: {
                  appointment_id: appointment.id,
                  customer_name: customer.entity_name,
                  stylist_id: stylist.id,
                  stylist_name: stylist.entity_name,
                  service_name: service.entity_name,
                  payment_method: Math.random() > 0.3 ? 'card' : 'cash',
                  tip_amount: Math.floor(service.metadata.price * (Math.random() * 0.2 + 0.1))
                }
              })
              .select()
              .single();

            if (transactionError) throw transactionError;
            allTransactions.push(transaction);

            // Create transaction line for service
            const { error: lineError } = await supabase
              .from('universal_transaction_lines')
              .insert({
                organization_id: ORGANIZATION_ID,
                transaction_id: transaction.id,
                line_number: 1,
                line_type: 'service',
                entity_id: service.id,
                description: service.entity_name,
                quantity: 1,
                unit_amount: service.metadata.price,
                line_amount: service.metadata.price,
                smart_code: 'HERA.SALON.POS.LINE.SERVICE.v1',
                line_data: JSON.stringify({
                  service_name: service.entity_name,
                  stylist_id: stylist.id,
                  stylist_commission: service.metadata.price * stylist.metadata.commission_rate
                })
              });

            if (lineError) throw lineError;

            // 30% chance of product purchase
            if (Math.random() < 0.3 && productEntities.length > 0) {
              const product = productEntities[Math.floor(Math.random() * productEntities.length)];
              
              const { error: productLineError } = await supabase
                .from('universal_transaction_lines')
                .insert({
                  organization_id: ORGANIZATION_ID,
                  transaction_id: transaction.id,
                  line_number: 2,
                  line_type: 'product',
                  entity_id: product.id,
                  description: product.entity_name,
                  quantity: 1,
                  unit_amount: product.metadata.price,
                  line_amount: product.metadata.price,
                  smart_code: 'HERA.SALON.POS.LINE.PRODUCT.v1',
                  line_data: JSON.stringify({
                    product_name: product.entity_name,
                    cost: product.metadata.cost,
                    margin: product.metadata.price - product.metadata.cost
                  })
                });

              if (productLineError) throw productLineError;

              // Update transaction total
              await supabase
                .from('universal_transactions')
                .update({ 
                  total_amount: transaction.total_amount + product.metadata.price,
                  metadata: {
                    ...transaction.metadata,
                    includes_retail: true,
                    retail_amount: product.metadata.price
                  }
                })
                .eq('id', transaction.id);
            }
          }
        }
      }
    }

    console.log(`✅ Created ${allAppointments.length} appointments`);
    console.log(`✅ Created ${allTransactions.length} transactions`);

    // 8. Create NPS Survey Responses
    console.log('\n8️⃣ Creating NPS survey responses...');
    const npsResponses = [];
    const npsComments = {
      9: ['Amazing service!', 'Best salon in town!', 'Love my stylist!', 'Always perfect results!'],
      8: ['Great experience', 'Very satisfied', 'Professional service', 'Would recommend'],
      7: ['Good service', 'Nice atmosphere', 'Decent prices', 'Happy with results'],
      6: ['Average experience', 'Could be better', 'Service was okay', 'Nothing special'],
      5: ['Not impressed', 'Expected more', 'Service needs improvement', 'Below average']
    };

    // Generate NPS responses for 50% of customers
    for (let i = 0; i < Math.floor(customerEntities.length * 0.5); i++) {
      const customer = customerEntities[i];
      const score = Math.floor(Math.random() * 5) + 5; // Score between 5-9
      const scoreComments = npsComments[Math.min(score, 9)];
      
      const { data, error } = await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_id: customer.id,
          field_name: 'nps_score',
          field_value_number: score,
          field_value_text: scoreComments[Math.floor(Math.random() * scoreComments.length)],
          smart_code: 'HERA.SALON.CRM.NPS.RESPONSE.v1',
          metadata: {
            survey_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            survey_type: 'post_service',
            promoter_type: score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor'
          }
        })
        .select()
        .single();

      if (error) throw error;
      npsResponses.push(data);
    }
    console.log(`✅ Created ${npsResponses.length} NPS responses`);

    // 9. Calculate and Store KPIs
    console.log('\n9️⃣ Calculating and storing KPIs...');
    
    // Calculate weekly revenue
    const weeklyRevenue = {};
    for (const transaction of allTransactions) {
      const week = new Date(transaction.transaction_date);
      week.setHours(0, 0, 0, 0);
      week.setDate(week.getDate() - week.getDay()); // Start of week
      const weekKey = week.toISOString().split('T')[0];
      
      if (!weeklyRevenue[weekKey]) {
        weeklyRevenue[weekKey] = 0;
      }
      weeklyRevenue[weekKey] += transaction.total_amount;
    }

    // Calculate average ticket
    const totalRevenue = allTransactions.reduce((sum, t) => sum + t.total_amount, 0);
    const averageTicket = totalRevenue / allTransactions.length;

    // Calculate utilization (booked slots / available slots)
    const totalSlots = stylistEntities.length * 8 * 7 * 12; // stylists * hours/day * days/week * weeks
    const bookedSlots = allAppointments.length;
    const utilization = (bookedSlots / totalSlots) * 100;

    // Store KPI summary
    const kpiSummary = {
      total_revenue: totalRevenue,
      transaction_count: allTransactions.length,
      appointment_count: allAppointments.length,
      average_ticket: averageTicket,
      utilization_percentage: utilization,
      customer_count: customerEntities.length,
      active_stylists: stylistEntities.length,
      service_count: serviceEntities.length,
      product_count: productEntities.length,
      low_stock_items: productEntities.filter(p => p.metadata.stock_quantity <= p.metadata.reorder_point).length,
      nps_score: npsResponses.reduce((sum, r) => sum + r.field_value_number, 0) / npsResponses.length,
      weekly_revenue: weeklyRevenue
    };

    const { error: kpiError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: ORGANIZATION_ID,
        entity_id: salon.id,
        field_name: 'dashboard_kpis',
        field_value_text: JSON.stringify(kpiSummary),
        smart_code: 'HERA.SALON.RPT.KPI.SUMMARY.v1',
        metadata: {
          generated_at: new Date().toISOString(),
          period: 'last_12_weeks',
          ...kpiSummary
        }
      });

    if (kpiError) throw kpiError;

    console.log('\n📊 KPI Summary:');
    console.log(`💰 Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`🎫 Average Ticket: $${averageTicket.toFixed(2)}`);
    console.log(`📅 Total Appointments: ${allAppointments.length}`);
    console.log(`📈 Utilization: ${utilization.toFixed(1)}%`);
    console.log(`⭐ Average NPS: ${(kpiSummary.nps_score).toFixed(1)}`);
    console.log(`📦 Low Stock Items: ${kpiSummary.low_stock_items}`);

    console.log('\n✅ Salon reporting seed data created successfully!');
    console.log(`🎯 Organization ID: ${ORGANIZATION_ID}`);
    console.log(`💅 Salon: ${SALON_NAME}`);
    console.log('\n📱 You can now view the salon dashboard with comprehensive reporting data!');

  } catch (error) {
    console.error('❌ Error seeding salon data:', error);
    process.exit(1);
  }
}

// Run the seed script
seedSalonData();