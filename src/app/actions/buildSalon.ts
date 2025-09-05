"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from '@supabase/supabase-js';

// Create supabase client inside the function to ensure env vars are loaded
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

const inputSchema = z.object({
  salonName: z.string().min(2),
  desiredSlug: z.string().min(2).max(63),
  useSubdomainRouting: z.boolean().optional().default(true),
  location: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    address: z.string().optional()
  }).optional()
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$|_/g, "");
}

export async function buildMySalon(input: unknown) {
  try {
    const { salonName, desiredSlug, useSubdomainRouting, location } = inputSchema.parse(input);
    const slug = slugify(desiredSlug);
    const orgCode = `SALON-${slug.toUpperCase().slice(0, 25)}`;
    const base = process.env.NEXT_PUBLIC_TENANT_DOMAIN_BASE ?? "lvh.me:3000";

    // Get supabase client
    const supabase = getSupabase();

    // 1) Create organization with subdomain settings
    const { data: org, error: createError } = await supabase
    .from('core_organizations')
    .insert({
      organization_name: salonName,
      organization_code: orgCode,
      organization_type: 'salon',
      industry_classification: 'beauty_services',
      settings: {
        subdomain: slug,
        domains: [`${slug}.${base}`],
        salon_theme: 'purple-pink',
        location: location ? {
          ...location,
          map_url: location.lat && location.lng 
            ? `https://maps.google.com/?q=${location.lat},${location.lng}`
            : undefined
        } : undefined
      },
      status: 'active'
    })
    .select()
    .single();

  if (createError || !org) {
    throw new Error('Failed to create salon organization');
  }

  // 2) Create audit transaction directly
  await supabase
    .from('universal_transactions')
    .insert({
      organization_id: org.id,
      transaction_type: 'org_settings_update',
      reference_number: `ORG-CREATE-${Date.now()}`,
      smart_code: 'HERA.IDENTITY.ORG.CREATE.SALON.v1',
      total_amount: 0,
      transaction_date: new Date().toISOString(),
      status: 'completed',
      metadata: { 
        salonName, 
        slug, 
        domains: [`${slug}.${base}`],
        created_by: 'buildSalon_action'
      }
    });

  // 3) Create basic seed data
  await createBasicSalonData(supabase, org.id);

    // 4) Redirect to tenant app using salon-data (the best salon app)
    if (useSubdomainRouting) {
      // Subdomain model
      redirect(`http://${slug}.${base}/salon-data`);
    } else {
      // Path model fallback
      redirect(`/org/${slug}/salon-data`);
    }
  } catch (error: any) {
    // Check if this is a redirect (which means success)
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      // Extract the URL from the error digest
      const parts = error.digest.split(';');
      const redirectUrl = parts[2]; // The URL is the third part
      
      // For server actions, we need to throw the redirect error to let Next.js handle it
      throw error;
    }
    
    // For actual errors, log and throw
    console.error('Error in buildMySalon:', error);
    throw new Error(error.message || 'Failed to build salon');
  }
}

// Enhanced provisioning function with comprehensive demo data
async function createBasicSalonData(supabase: any, orgId: string) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1) Create services with prices
  const services = [
    { name: "Cut & Finish", code: "SERVICE-001", price: 150, duration: 60 },
    { name: "Color (Roots)", code: "SERVICE-002", price: 250, duration: 120 },
    { name: "Keratin Treatment", code: "SERVICE-003", price: 800, duration: 180 },
    { name: "Blow Dry", code: "SERVICE-004", price: 80, duration: 45 },
    { name: "Hair Spa", code: "SERVICE-005", price: 200, duration: 90 },
  ];

  const serviceIds: Record<string, string> = {};

  for (const service of services) {
    const { data: serviceEntity } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'service',
        entity_name: service.name,
        entity_code: service.code,
        smart_code: 'HERA.SALON.CATALOG.SERVICE.v1',
        status: 'active',
        metadata: { 
          price: service.price,
          duration: service.duration,
          category: 'hair_services'
        }
      })
      .select()
      .single();

    if (serviceEntity) {
      serviceIds[service.code] = serviceEntity.id;
      
      // Add price as dynamic data
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: orgId,
          entity_id: serviceEntity.id,
          field_name: 'price',
          field_value_number: service.price,
          smart_code: 'HERA.SALON.SERVICE.PRICE.v1'
        });

      // Add duration as dynamic data
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: orgId,
          entity_id: serviceEntity.id,
          field_name: 'duration_minutes',
          field_value_number: service.duration,
          smart_code: 'HERA.SALON.SERVICE.DURATION.v1'
        });
    }
  }

  // 2) Create stylists
  const stylists = [
    { name: "Priya Sharma", code: "EMP-001", specialization: "Color Specialist" },
    { name: "Ahmed Al-Hassan", code: "EMP-002", specialization: "Keratin Expert" },
    { name: "Sarah Johnson", code: "EMP-003", specialization: "Senior Stylist" },
  ];

  const stylistIds: Record<string, string> = {};

  for (const stylist of stylists) {
    const { data: stylistEntity } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'employee',
        entity_name: stylist.name,
        entity_code: stylist.code,
        smart_code: 'HERA.SALON.HR.EMPLOYEE.STYLIST.v1',
        status: 'active',
        metadata: { 
          specialization: stylist.specialization,
          role: 'stylist',
          working_hours: '9:00 AM - 7:00 PM'
        }
      })
      .select()
      .single();

    if (stylistEntity) {
      stylistIds[stylist.code] = stylistEntity.id;
    }
  }

  // 3) Create sample customers
  const customers = [
    { name: "Emma Wilson", code: "CUST-001", phone: "+971501234567", email: "emma@example.com", type: "regular" },
    { name: "Fatima Al Rashid", code: "CUST-002", phone: "+971502345678", email: "fatima@example.com", type: "vip" },
    { name: "Sophie Chen", code: "CUST-003", phone: "+971503456789", email: "sophie@example.com", type: "regular" },
    { name: "Aisha Khan", code: "CUST-004", phone: "+971504567890", email: "aisha@example.com", type: "vip" },
    { name: "Maria Garcia", code: "CUST-005", phone: "+971505678901", email: "maria@example.com", type: "regular" },
  ];

  const customerIds: Record<string, string> = {};

  for (const customer of customers) {
    const { data: customerEntity } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'customer',
        entity_name: customer.name,
        entity_code: customer.code,
        smart_code: 'HERA.SALON.CRM.CUSTOMER.v1',
        status: 'active',
        metadata: {
          phone: customer.phone,
          email: customer.email,
          customer_type: customer.type,
          loyalty_points: customer.type === 'vip' ? 500 : 100
        }
      })
      .select()
      .single();

    if (customerEntity) {
      customerIds[customer.code] = customerEntity.id;

      // Add contact info as dynamic data
      await supabase
        .from('core_dynamic_data')
        .insert([
          {
            organization_id: orgId,
            entity_id: customerEntity.id,
            field_name: 'phone',
            field_value_text: customer.phone,
            smart_code: 'HERA.SALON.CUSTOMER.PHONE.v1'
          },
          {
            organization_id: orgId,
            entity_id: customerEntity.id,
            field_name: 'email',
            field_value_text: customer.email,
            smart_code: 'HERA.SALON.CUSTOMER.EMAIL.v1'
          }
        ]);
    }
  }

  // 4) Create sample appointments for today
  const appointments = [
    {
      customer: "CUST-001",
      service: "SERVICE-001",
      stylist: "EMP-001",
      time: "10:00 AM",
      status: "confirmed"
    },
    {
      customer: "CUST-002",
      service: "SERVICE-002",
      stylist: "EMP-002",
      time: "11:00 AM",
      status: "confirmed"
    },
    {
      customer: "CUST-003",
      service: "SERVICE-004",
      stylist: "EMP-003",
      time: "2:00 PM",
      status: "confirmed"
    },
    {
      customer: "CUST-004",
      service: "SERVICE-003",
      stylist: "EMP-002",
      time: "3:00 PM",
      status: "in_progress"
    },
    {
      customer: "CUST-005",
      service: "SERVICE-001",
      stylist: "EMP-001",
      time: "4:00 PM",
      status: "scheduled"
    }
  ];

  for (const apt of appointments) {
    const customerId = customerIds[apt.customer];
    const serviceId = serviceIds[apt.service];
    const stylistId = stylistIds[apt.stylist];
    const service = services.find(s => s.code === apt.service);

    if (customerId && serviceId && stylistId && service) {
      // Create appointment as entity
      const { data: aptEntity } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'appointment',
          entity_name: `Appointment - ${apt.time}`,
          entity_code: `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          smart_code: 'HERA.SALON.BOOKING.APPOINTMENT.v1',
          status: 'active',
          metadata: {
            customer_id: customerId,
            service_id: serviceId,
            stylist_id: stylistId,
            appointment_date: today.toISOString().split('T')[0],
            appointment_time: apt.time,
            status: apt.status,
            duration_minutes: service.duration,
            price: service.price
          }
        })
        .select()
        .single();

      // Create transaction for completed/in-progress appointments
      if (aptEntity && (apt.status === 'completed' || apt.status === 'in_progress')) {
        await supabase
          .from('universal_transactions')
          .insert({
            organization_id: orgId,
            transaction_type: 'sale',
            reference_number: `SALE-${Date.now()}`,
            smart_code: 'HERA.SALON.SALE.SERVICE.v1',
            from_entity_id: customerId,
            to_entity_id: aptEntity.id,
            total_amount: service.price,
            transaction_date: today.toISOString(),
            status: apt.status === 'completed' ? 'completed' : 'pending',
            metadata: {
              service_name: service.name,
              stylist_name: stylists.find(s => s.code === apt.stylist)?.name,
              payment_method: 'cash'
            }
          });
      }
    }
  }

  // 5) Create some inventory items
  const products = [
    { name: "L'Oreal Shampoo 500ml", code: "PROD-001", stock: 25, price: 45 },
    { name: "Keratin Treatment Kit", code: "PROD-002", stock: 10, price: 350 },
    { name: "Hair Color - Brown", code: "PROD-003", stock: 15, price: 80 },
    { name: "Hair Spa Cream 200ml", code: "PROD-004", stock: 30, price: 65 },
    { name: "Hair Serum 100ml", code: "PROD-005", stock: 20, price: 55 },
  ];

  for (const product of products) {
    const { data: productEntity } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'product',
        entity_name: product.name,
        entity_code: product.code,
        smart_code: 'HERA.SALON.INVENTORY.PRODUCT.v1',
        status: 'active',
        metadata: {
          stock_quantity: product.stock,
          price: product.price,
          category: 'hair_care'
        }
      })
      .select()
      .single();

    if (productEntity) {
      // Add stock and price as dynamic data
      await supabase
        .from('core_dynamic_data')
        .insert([
          {
            organization_id: orgId,
            entity_id: productEntity.id,
            field_name: 'stock_quantity',
            field_value_number: product.stock,
            smart_code: 'HERA.SALON.INVENTORY.STOCK.v1'
          },
          {
            organization_id: orgId,
            entity_id: productEntity.id,
            field_name: 'retail_price',
            field_value_number: product.price,
            smart_code: 'HERA.SALON.PRODUCT.PRICE.v1'
          }
        ]);
    }
  }

  console.log('Created comprehensive salon demo data for organization:', orgId);
}