import { supabase } from '@/lib/supabase'
import { universalApi } from '@/lib/universal-api'

export interface DemoOrgConfig {
  userId: string
  industry: string
  orgName?: string
}

const industryDefaults = {
  salon: {
    name: 'Demo Salon & Spa',
    description: 'Experience HERA with a fully configured beauty salon',
    services: ['Haircut', 'Hair Color', 'Manicure', 'Pedicure', 'Facial', 'Massage'],
    staff: ['Sarah Johnson', 'Michael Chen', 'Emma Rodriguez'],
    clients: 50,
    appointments: 30,
    inventory: 120
  },
  icecream: {
    name: 'Demo Ice Cream Factory',
    description: 'Experience HERA with ice cream manufacturing',
    products: ['Vanilla', 'Chocolate', 'Strawberry', 'Mint Chip', 'Cookie Dough'],
    outlets: ['Main Store', 'Mall Kiosk', 'Beach Stand'],
    batches: 20,
    inventory: 200
  },
  restaurant: {
    name: "Demo Restaurant",
    description: 'Experience HERA with a full-service restaurant',
    menuItems: 45,
    tables: 20,
    orders: 100,
    staff: 15
  },
  healthcare: {
    name: 'Demo Medical Clinic',
    description: 'Experience HERA with healthcare management',
    patients: 100,
    appointments: 50,
    prescriptions: 75,
    staff: 8
  },
  jewelry: {
    name: 'Demo Jewelry Store',
    description: 'Experience HERA with luxury jewelry retail',
    products: 150,
    customOrders: 20,
    repairs: 15,
    inventory: 300
  }
}

export async function createDemoOrganization(config: DemoOrgConfig) {
  const { userId, industry, orgName } = config
  const defaults = industryDefaults[industry as keyof typeof industryDefaults] || industryDefaults.salon
  
  try {
    // Create organization with demo flag
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .insert({
        name: orgName || defaults.name,
        subdomain: `demo-${userId.substring(0, 8)}-${industry}`,
        industry_type: industry,
        is_demo: true,
        demo_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        created_by: userId,
        metadata: {
          demo_config: defaults,
          created_from: 'app_selector'
        }
      })
      .select()
      .single()

    if (orgError) throw orgError

    // Create user membership
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
        joined_at: new Date().toISOString()
      })

    if (memberError) throw memberError

    // Set up demo data based on industry
    await setupDemoData(org.id, industry, userId)

    return { organization: org, success: true }
  } catch (error) {
    console.error('Error creating demo organization:', error)
    return { organization: null, success: false, error }
  }
}

async function setupDemoData(orgId: string, industry: string, userId: string) {
  // Set the organization context for universal API
  universalApi.setOrganizationId(orgId)
  universalApi.setUserId(userId)

  switch (industry) {
    case 'salon':
      await setupSalonDemoData(orgId)
      break
    case 'icecream':
      await setupIceCreamDemoData(orgId)
      break
    case 'restaurant':
      await setupRestaurantDemoData(orgId)
      break
    case 'healthcare':
      await setupHealthcareDemoData(orgId)
      break
    case 'jewelry':
      await setupJewelryDemoData(orgId)
      break
    default:
      console.log('No specific demo data setup for industry:', industry)
  }
}

async function setupSalonDemoData(orgId: string) {
  // Create services
  const services = [
    { name: 'Basic Haircut', price: 35, duration: 30 },
    { name: 'Hair Color', price: 85, duration: 90 },
    { name: 'Manicure', price: 25, duration: 45 },
    { name: 'Pedicure', price: 35, duration: 60 },
    { name: 'Facial Treatment', price: 75, duration: 60 },
    { name: 'Swedish Massage', price: 95, duration: 60 }
  ]

  for (const service of services) {
    await universalApi.createEntity({
      entity_type: 'service',
      entity_name: service.name,
      smart_code: 'HERA.SALON.SERVICE.CATALOG.v1',
      metadata: {
        price: service.price,
        duration_minutes: service.duration,
        category: 'general'
      }
    })
  }

  // Create staff members
  const staff = [
    { name: 'Sarah Johnson', role: 'Senior Stylist', specialties: ['hair_color', 'cutting'] },
    { name: 'Michael Chen', role: 'Stylist', specialties: ['cutting', 'styling'] },
    { name: 'Emma Rodriguez', role: 'Nail Technician', specialties: ['manicure', 'pedicure'] }
  ]

  for (const member of staff) {
    await universalApi.createEntity({
      entity_type: 'employee',
      entity_name: member.name,
      smart_code: 'HERA.SALON.STAFF.MEMBER.v1',
      metadata: {
        role: member.role,
        specialties: member.specialties,
        commission_rate: 0.4
      }
    })
  }

  // Create sample clients
  const clients = [
    'Jennifer Smith', 'Robert Johnson', 'Maria Garcia', 
    'James Williams', 'Patricia Brown', 'Michael Davis'
  ]

  for (const clientName of clients) {
    await universalApi.createEntity({
      entity_type: 'customer',
      entity_name: clientName,
      smart_code: 'HERA.SALON.CLIENT.PROFILE.v1',
      metadata: {
        phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
        email: `${clientName.toLowerCase().replace(' ', '.')}@example.com`,
        preferences: ['organic_products'],
        loyalty_points: Math.floor(Math.random() * 500)
      }
    })
  }
}

async function setupIceCreamDemoData(orgId: string) {
  // Create ice cream flavors
  const flavors = [
    { name: 'Classic Vanilla', category: 'classic', costPerLiter: 3.50 },
    { name: 'Rich Chocolate', category: 'classic', costPerLiter: 4.00 },
    { name: 'Fresh Strawberry', category: 'fruit', costPerLiter: 4.50 },
    { name: 'Mint Chocolate Chip', category: 'specialty', costPerLiter: 5.00 },
    { name: 'Cookie Dough Delight', category: 'specialty', costPerLiter: 5.50 }
  ]

  for (const flavor of flavors) {
    await universalApi.createEntity({
      entity_type: 'product',
      entity_name: flavor.name,
      smart_code: 'HERA.ICECREAM.PRODUCT.FLAVOR.v1',
      metadata: {
        category: flavor.category,
        cost_per_liter: flavor.costPerLiter,
        recipe_yield_liters: 50,
        shelf_life_days: 180
      }
    })
  }

  // Create outlets
  const outlets = [
    { name: 'Main Factory Store', type: 'retail', capacity: 1000 },
    { name: 'Downtown Mall Kiosk', type: 'kiosk', capacity: 200 },
    { name: 'Beachside Stand', type: 'mobile', capacity: 100 }
  ]

  for (const outlet of outlets) {
    await universalApi.createEntity({
      entity_type: 'location',
      entity_name: outlet.name,
      smart_code: 'HERA.ICECREAM.OUTLET.STORE.v1',
      metadata: {
        outlet_type: outlet.type,
        storage_capacity_liters: outlet.capacity,
        temperature_range: '-20 to -15'
      }
    })
  }
}

async function setupRestaurantDemoData(orgId: string) {
  // Create menu categories and items
  const menuCategories = [
    {
      name: 'Appetizers',
      items: [
        { name: 'Bruschetta', price: 8.95, cost: 2.50 },
        { name: 'Calamari Fritti', price: 12.95, cost: 4.00 },
        { name: 'Caesar Salad', price: 9.95, cost: 2.00 }
      ]
    },
    {
      name: 'Main Courses',
      items: [
        { name: 'Grilled Salmon', price: 24.95, cost: 8.00 },
        { name: 'Chicken Parmesan', price: 19.95, cost: 6.00 },
        { name: 'Ribeye Steak', price: 32.95, cost: 12.00 }
      ]
    },
    {
      name: 'Desserts',
      items: [
        { name: 'Tiramisu', price: 7.95, cost: 2.00 },
        { name: 'Chocolate Lava Cake', price: 8.95, cost: 2.50 }
      ]
    }
  ]

  for (const category of menuCategories) {
    for (const item of category.items) {
      await universalApi.createEntity({
        entity_type: 'product',
        entity_name: item.name,
        smart_code: 'HERA.REST.MENU.ITEM.v1',
        metadata: {
          category: category.name,
          price: item.price,
          cost: item.cost,
          prep_time_minutes: 15,
          is_available: true
        }
      })
    }
  }

  // Create tables
  for (let i = 1; i <= 20; i++) {
    await universalApi.createEntity({
      entity_type: 'location',
      entity_name: `Table ${i}`,
      entity_code: `T${i.toString().padStart(2, '0')}`,
      smart_code: 'HERA.REST.TABLE.DINING.v1',
      metadata: {
        capacity: i <= 10 ? 2 : 4,
        section: i <= 10 ? 'main' : 'patio',
        status: 'available'
      }
    })
  }
}

async function setupHealthcareDemoData(orgId: string) {
  // Create medical services
  const services = [
    { name: 'General Consultation', price: 100, duration: 30 },
    { name: 'Annual Physical Exam', price: 250, duration: 60 },
    { name: 'Blood Test', price: 75, duration: 15 },
    { name: 'X-Ray', price: 150, duration: 20 },
    { name: 'Vaccination', price: 50, duration: 15 }
  ]

  for (const service of services) {
    await universalApi.createEntity({
      entity_type: 'service',
      entity_name: service.name,
      smart_code: 'HERA.HEALTH.SERVICE.MEDICAL.v1',
      metadata: {
        price: service.price,
        duration_minutes: service.duration,
        requires_appointment: true
      }
    })
  }

  // Create medical staff
  const doctors = [
    { name: 'Dr. Emily Thompson', specialty: 'Family Medicine' },
    { name: 'Dr. James Wilson', specialty: 'Internal Medicine' },
    { name: 'Dr. Sarah Lee', specialty: 'Pediatrics' }
  ]

  for (const doctor of doctors) {
    await universalApi.createEntity({
      entity_type: 'employee',
      entity_name: doctor.name,
      smart_code: 'HERA.HEALTH.STAFF.DOCTOR.v1',
      metadata: {
        role: 'physician',
        specialty: doctor.specialty,
        license_number: `MD-${Math.floor(Math.random() * 900000) + 100000}`
      }
    })
  }
}

async function setupJewelryDemoData(orgId: string) {
  // Create jewelry categories and products
  const categories = [
    {
      name: 'Rings',
      products: [
        { name: 'Diamond Solitaire Ring', price: 5000, material: 'white_gold' },
        { name: 'Sapphire Eternity Band', price: 3500, material: 'platinum' }
      ]
    },
    {
      name: 'Necklaces',
      products: [
        { name: 'Pearl Strand Necklace', price: 1200, material: 'silver' },
        { name: 'Gold Chain Necklace', price: 800, material: 'yellow_gold' }
      ]
    },
    {
      name: 'Watches',
      products: [
        { name: 'Luxury Chronograph', price: 8000, material: 'stainless_steel' },
        { name: 'Diamond Dress Watch', price: 12000, material: 'rose_gold' }
      ]
    }
  ]

  for (const category of categories) {
    for (const product of category.products) {
      await universalApi.createEntity({
        entity_type: 'product',
        entity_name: product.name,
        smart_code: 'HERA.JEWELRY.PRODUCT.ITEM.v1',
        metadata: {
          category: category.name,
          price: product.price,
          material: product.material,
          in_stock: Math.floor(Math.random() * 5) + 1,
          certification: 'GIA'
        }
      })
    }
  }
}