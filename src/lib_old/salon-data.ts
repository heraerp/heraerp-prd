/**
 * HERA Salon Universal Data Structure
 * Using Universal 6-Table Architecture for Salon Management
 * Smart Code: HERA.SALON.UNIVERSAL.v1
 */

import { v4 as uuidv4 } from 'uuid'

// Universal Salon Organization
export const SALON_ORG_ID = 'salon-org-001'
export const SALON_USER_ID = 'salon-user-001'

// Helper to generate consistent IDs
const generateId = (prefix: string) => `salon-${prefix}-${uuidv4().slice(0, 8)}`

// Date helpers
const today = new Date()
const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

/**
 * Universal Salon Entities (using core_entities table)
 * Entity types: 'service', 'product', 'package', 'stylist', 'customer', 'appointment', 'equipment'
 */

// Service Entities
export const salonServices = [
  // Hair Services
  {
    id: generateId('service'),
    entity_type: 'service',
    entity_code: 'HAIR-CUT-001',
    entity_name: 'Classic Haircut',
    description: 'Professional haircut with shampoo and style',
    status: 'active',
    metadata: {
      category: 'hair',
      subcategory: 'cut',
      duration: 45,
      price: 65.0,
      commission_rate: 0.4,
      skill_level: 'basic',
      requires_stylist: true,
      booking_buffer: 15
    }
  },
  {
    id: generateId('service'),
    entity_type: 'service',
    entity_code: 'HAIR-COLOR-001',
    entity_name: 'Full Color Treatment',
    description: 'Complete hair color service with consultation',
    status: 'active',
    metadata: {
      category: 'hair',
      subcategory: 'color',
      duration: 120,
      price: 185.0,
      commission_rate: 0.35,
      skill_level: 'advanced',
      requires_stylist: true,
      booking_buffer: 30,
      requires_patch_test: true
    }
  },
  {
    id: generateId('service'),
    entity_type: 'service',
    entity_code: 'HAIR-HIGHLIGHT-001',
    entity_name: 'Highlight & Lowlight',
    description: 'Premium highlighting service with toner',
    status: 'active',
    metadata: {
      category: 'hair',
      subcategory: 'color',
      duration: 150,
      price: 225.0,
      commission_rate: 0.35,
      skill_level: 'advanced',
      requires_stylist: true,
      booking_buffer: 30
    }
  },
  {
    id: generateId('service'),
    entity_type: 'service',
    entity_code: 'HAIR-PERM-001',
    entity_name: 'Perm Treatment',
    description: 'Professional perm service with styling',
    status: 'active',
    metadata: {
      category: 'hair',
      subcategory: 'chemical',
      duration: 180,
      price: 195.0,
      commission_rate: 0.38,
      skill_level: 'expert',
      requires_stylist: true,
      booking_buffer: 45
    }
  },

  // Nail Services
  {
    id: generateId('service'),
    entity_type: 'service',
    entity_code: 'NAIL-MANI-001',
    entity_name: 'Classic Manicure',
    description: 'Complete manicure with polish',
    status: 'active',
    metadata: {
      category: 'nails',
      subcategory: 'manicure',
      duration: 45,
      price: 35.0,
      commission_rate: 0.45,
      skill_level: 'basic',
      requires_stylist: true,
      booking_buffer: 10
    }
  },
  {
    id: generateId('service'),
    entity_type: 'service',
    entity_code: 'NAIL-GEL-001',
    entity_name: 'Gel Manicure',
    description: 'Long-lasting gel polish manicure',
    status: 'active',
    metadata: {
      category: 'nails',
      subcategory: 'manicure',
      duration: 60,
      price: 55.0,
      commission_rate: 0.42,
      skill_level: 'intermediate',
      requires_stylist: true,
      booking_buffer: 15
    }
  },
  {
    id: generateId('service'),
    entity_type: 'service',
    entity_code: 'NAIL-PEDI-001',
    entity_name: 'Luxury Pedicure',
    description: 'Full pedicure with massage and polish',
    status: 'active',
    metadata: {
      category: 'nails',
      subcategory: 'pedicure',
      duration: 75,
      price: 65.0,
      commission_rate: 0.45,
      skill_level: 'basic',
      requires_stylist: true,
      booking_buffer: 15
    }
  },

  // Facial Services
  {
    id: generateId('service'),
    entity_type: 'service',
    entity_code: 'FACE-CLEAN-001',
    entity_name: 'Deep Cleansing Facial',
    description: 'Professional facial with extraction',
    status: 'active',
    metadata: {
      category: 'facial',
      subcategory: 'cleansing',
      duration: 90,
      price: 125.0,
      commission_rate: 0.4,
      skill_level: 'intermediate',
      requires_stylist: true,
      booking_buffer: 20
    }
  },
  {
    id: generateId('service'),
    entity_type: 'service',
    entity_code: 'FACE-ANTI-001',
    entity_name: 'Anti-Aging Facial',
    description: 'Premium anti-aging treatment with serum',
    status: 'active',
    metadata: {
      category: 'facial',
      subcategory: 'treatment',
      duration: 105,
      price: 185.0,
      commission_rate: 0.35,
      skill_level: 'advanced',
      requires_stylist: true,
      booking_buffer: 25
    }
  }
]

// Product Entities (Hair care, nail care, skincare)
export const salonProducts = [
  // Hair Products
  {
    id: generateId('product'),
    entity_type: 'product',
    entity_code: 'HAIR-SHAM-001',
    entity_name: 'Professional Shampoo - Sulfate Free',
    description: '8oz premium sulfate-free shampoo',
    status: 'active',
    metadata: {
      category: 'hair_care',
      subcategory: 'shampoo',
      brand: 'Salon Pro',
      size: '8oz',
      cost: 12.5,
      retail_price: 28.0,
      wholesale_price: 15.0,
      stock_level: 45,
      reorder_point: 15,
      supplier: 'Beauty Supply Co',
      barcode: '123456789012'
    }
  },
  {
    id: generateId('product'),
    entity_type: 'product',
    entity_code: 'HAIR-COND-001',
    entity_name: 'Moisturizing Conditioner',
    description: '8oz deep conditioning treatment',
    status: 'active',
    metadata: {
      category: 'hair_care',
      subcategory: 'conditioner',
      brand: 'Salon Pro',
      size: '8oz',
      cost: 14.0,
      retail_price: 32.0,
      wholesale_price: 18.0,
      stock_level: 38,
      reorder_point: 12,
      supplier: 'Beauty Supply Co',
      barcode: '123456789013'
    }
  },

  // Nail Products
  {
    id: generateId('product'),
    entity_type: 'product',
    entity_code: 'NAIL-POL-001',
    entity_name: 'Gel Polish - Ruby Red',
    description: 'Long-lasting gel polish in Ruby Red',
    status: 'active',
    metadata: {
      category: 'nail_care',
      subcategory: 'polish',
      brand: 'Nail Perfect',
      color: 'Ruby Red',
      color_code: '#CC0000',
      cost: 8.5,
      retail_price: 18.0,
      wholesale_price: 12.0,
      stock_level: 25,
      reorder_point: 8,
      supplier: 'Nail Supply Direct',
      barcode: '234567890123'
    }
  },

  // Skincare Products
  {
    id: generateId('product'),
    entity_type: 'product',
    entity_code: 'SKIN-CLEAN-001',
    entity_name: 'Gentle Face Cleanser',
    description: '4oz gentle daily cleanser for all skin types',
    status: 'active',
    metadata: {
      category: 'skincare',
      subcategory: 'cleanser',
      brand: 'Glow Skincare',
      size: '4oz',
      cost: 18.0,
      retail_price: 42.0,
      wholesale_price: 28.0,
      stock_level: 32,
      reorder_point: 10,
      supplier: 'Skincare Wholesale',
      barcode: '345678901234'
    }
  }
]

// Package Entities (Service combinations)
export const salonPackages = [
  {
    id: generateId('package'),
    entity_type: 'package',
    entity_code: 'PKG-BRIDE-001',
    entity_name: 'Bridal Beauty Package',
    description: 'Complete bridal package with hair, nails, and facial',
    status: 'active',
    metadata: {
      package_type: 'bridal',
      total_duration: 240,
      original_price: 375.0,
      package_price: 325.0,
      savings: 50.0,
      advance_booking_required: 14,
      includes_trial: true,
      services: [
        { service_code: 'HAIR-CUT-001', service_name: 'Classic Haircut' },
        { service_code: 'HAIR-COLOR-001', service_name: 'Full Color Treatment' },
        { service_code: 'NAIL-GEL-001', service_name: 'Gel Manicure' },
        { service_code: 'FACE-CLEAN-001', service_name: 'Deep Cleansing Facial' }
      ]
    }
  },
  {
    id: generateId('package'),
    entity_type: 'package',
    entity_code: 'PKG-SPA-001',
    entity_name: 'Spa Day Package',
    description: 'Relaxing spa day with multiple treatments',
    status: 'active',
    metadata: {
      package_type: 'spa_day',
      total_duration: 180,
      original_price: 285.0,
      package_price: 245.0,
      savings: 40.0,
      advance_booking_required: 3,
      includes_refreshments: true,
      services: [
        { service_code: 'FACE-ANTI-001', service_name: 'Anti-Aging Facial' },
        { service_code: 'NAIL-PEDI-001', service_name: 'Luxury Pedicure' },
        { service_code: 'NAIL-GEL-001', service_name: 'Gel Manicure' }
      ]
    }
  }
]

// Stylist Entities (Staff)
export const salonStylists = [
  {
    id: generateId('stylist'),
    entity_type: 'stylist',
    entity_code: 'STY-001',
    entity_name: 'Sarah Johnson',
    description: 'Senior Hair Stylist - 8 years experience',
    status: 'active',
    metadata: {
      role: 'senior_stylist',
      hire_date: '2019-03-15',
      specialties: ['hair_color', 'highlights', 'cuts'],
      certifications: ['Color Specialist', 'Keratin Treatment'],
      commission_rate: 0.45,
      hourly_rate: 28.0,
      phone: '(555) 123-4567',
      email: 'sarah@beautyhaven.com',
      schedule: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '10:00', end: '18:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '10:00', end: '19:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '08:00', end: '16:00' }
      }
    }
  },
  {
    id: generateId('stylist'),
    entity_type: 'stylist',
    entity_code: 'STY-002',
    entity_name: 'Maria Rodriguez',
    description: 'Nail Specialist & Esthetician - 5 years experience',
    status: 'active',
    metadata: {
      role: 'nail_esthetician',
      hire_date: '2021-01-10',
      specialties: ['nails', 'facials', 'skincare'],
      certifications: ['Licensed Esthetician', 'Gel Polish Expert'],
      commission_rate: 0.5,
      hourly_rate: 24.0,
      phone: '(555) 234-5678',
      email: 'maria@beautyhaven.com',
      schedule: {
        tuesday: { start: '10:00', end: '18:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '10:00', end: '18:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '08:00', end: '16:00' },
        sunday: { start: '10:00', end: '15:00' }
      }
    }
  }
]

// Customer Entities with Loyalty Program
export const salonCustomers = [
  {
    id: generateId('customer'),
    entity_type: 'customer',
    entity_code: 'CUST-001',
    entity_name: 'Jennifer Smith',
    description: 'VIP Customer - Regular appointments',
    status: 'active',
    metadata: {
      customer_type: 'vip',
      join_date: '2023-01-15',
      phone: '(555) 345-6789',
      email: 'jennifer@email.com',
      birthday: '1985-06-15',
      loyalty: {
        tier: 'platinum',
        points: 2850,
        total_spent: 3420.0,
        visits: 24,
        last_visit: '2024-01-02'
      },
      preferences: {
        preferred_stylist: 'STY-001',
        allergies: ['sulfates'],
        preferred_services: ['HAIR-COLOR-001', 'HAIR-CUT-001'],
        communication: 'email',
        notes: 'Prefers natural look, sensitive to strong chemicals'
      },
      address: {
        street: '123 Main St',
        city: 'Beauty City',
        state: 'BC',
        zip: '12345'
      }
    }
  },
  {
    id: generateId('customer'),
    entity_type: 'customer',
    entity_code: 'CUST-002',
    entity_name: 'Amanda Wilson',
    description: 'Regular customer - Monthly visits',
    status: 'active',
    metadata: {
      customer_type: 'regular',
      join_date: '2023-08-22',
      phone: '(555) 456-7890',
      email: 'amanda@email.com',
      birthday: '1992-03-28',
      loyalty: {
        tier: 'gold',
        points: 1250,
        total_spent: 1875.0,
        visits: 12,
        last_visit: '2024-01-05'
      },
      preferences: {
        preferred_stylist: 'STY-002',
        allergies: [],
        preferred_services: ['NAIL-GEL-001', 'FACE-CLEAN-001'],
        communication: 'sms',
        notes: 'Always on time, prefers Saturday appointments'
      },
      address: {
        street: '456 Oak Ave',
        city: 'Beauty City',
        state: 'BC',
        zip: '12346'
      }
    }
  }
]

// Equipment Entities
export const salonEquipment = [
  {
    id: generateId('equipment'),
    entity_type: 'equipment',
    entity_code: 'EQP-CHAIR-001',
    entity_name: 'Premium Styling Chair #1',
    description: 'Hydraulic styling chair with lumbar support',
    status: 'active',
    metadata: {
      equipment_type: 'styling_chair',
      location: 'Station 1',
      purchase_date: '2023-01-15',
      cost: 1250.0,
      warranty_expires: '2026-01-15',
      maintenance: {
        last_service: '2023-12-01',
        next_service: '2024-06-01',
        service_interval: 180
      },
      assigned_to: 'STY-001'
    }
  }
]

/**
 * Universal Transaction Templates for Salon
 */

// Service Transaction Template
export const createServiceTransaction = (
  customerId: string,
  stylistId: string,
  services: any[],
  paymentMethod: string = 'card'
) => {
  const subtotal = services.reduce((sum, service) => sum + service.price, 0)
  const tax = subtotal * 0.08875 // NYC tax rate
  const total = subtotal + tax

  return {
    transaction_type: 'service_sale',
    customer_id: customerId,
    stylist_id: stylistId,
    transaction_date: new Date().toISOString(),
    reference_number: `SRV-${Date.now()}`,
    payment_method: paymentMethod,
    subtotal,
    tax_amount: tax,
    total_amount: total,
    line_items: services.map((service, index) => ({
      line_number: index + 1,
      entity_id: service.id,
      entity_type: 'service',
      service_code: service.entity_code,
      service_name: service.entity_name,
      duration: service.metadata.duration,
      quantity: 1,
      unit_price: service.metadata.price,
      line_total: service.metadata.price,
      stylist_commission: service.metadata.price * service.metadata.commission_rate
    })),
    metadata: {
      transaction_category: 'salon_service',
      location: 'main_floor',
      notes: 'Service transaction processed via HERA Salon POS'
    }
  }
}

// Product Transaction Template
export const createProductTransaction = (
  customerId: string,
  products: any[],
  paymentMethod: string = 'card'
) => {
  const subtotal = products.reduce(
    (sum, product) => sum + product.quantity * product.metadata.retail_price,
    0
  )
  const tax = subtotal * 0.08875
  const total = subtotal + tax

  return {
    transaction_type: 'product_sale',
    customer_id: customerId,
    transaction_date: new Date().toISOString(),
    reference_number: `PRD-${Date.now()}`,
    payment_method: paymentMethod,
    subtotal,
    tax_amount: tax,
    total_amount: total,
    line_items: products.map((product, index) => ({
      line_number: index + 1,
      entity_id: product.id,
      entity_type: 'product',
      product_code: product.entity_code,
      product_name: product.entity_name,
      brand: product.metadata.brand,
      quantity: product.quantity,
      unit_price: product.metadata.retail_price,
      line_total: product.quantity * product.metadata.retail_price,
      cost_basis: product.metadata.cost * product.quantity
    })),
    metadata: {
      transaction_category: 'salon_retail',
      location: 'main_floor',
      notes: 'Product sale processed via HERA Salon POS'
    }
  }
}

/**
 * Appointment Booking System (using core_relationships for scheduling)
 */
export const createAppointment = (
  customerId: string,
  stylistId: string,
  services: any[],
  appointmentDate: string,
  appointmentTime: string
) => {
  const totalDuration = services.reduce((sum, service) => sum + service.metadata.duration, 0)

  return {
    id: generateId('appointment'),
    entity_type: 'appointment',
    entity_code: `APT-${Date.now()}`,
    entity_name: `Appointment - ${appointmentDate} ${appointmentTime}`,
    description: 'Salon appointment booking',
    status: 'scheduled',
    metadata: {
      customer_id: customerId,
      stylist_id: stylistId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      duration: totalDuration,
      services: services.map(s => ({
        service_id: s.id,
        service_code: s.entity_code,
        service_name: s.entity_name,
        duration: s.metadata.duration,
        price: s.metadata.price
      })),
      total_estimated_cost: services.reduce((sum, s) => sum + s.metadata.price, 0),
      booking_date: new Date().toISOString(),
      confirmation_sent: false,
      reminder_sent: false,
      status_history: [
        { status: 'scheduled', timestamp: new Date().toISOString(), notes: 'Appointment booked' }
      ]
    }
  }
}

/**
 * Loyalty Program Logic
 */
export const calculateLoyaltyPoints = (transactionAmount: number, customerTier: string) => {
  const basePoints = Math.floor(transactionAmount) // 1 point per dollar
  const multiplier =
    {
      bronze: 1,
      silver: 1.25,
      gold: 1.5,
      platinum: 2
    }[customerTier] || 1

  return Math.floor(basePoints * multiplier)
}

export const getLoyaltyTier = (totalSpent: number) => {
  if (totalSpent >= 5000) return 'platinum'
  if (totalSpent >= 2000) return 'gold'
  if (totalSpent >= 500) return 'silver'
  return 'bronze'
}

/**
 * Demo KPIs for Salon Business
 */
export const generateSalonKPIs = () => {
  return {
    revenue: {
      today: 1250.75,
      yesterday: 980.5,
      thisWeek: 7845.25,
      lastWeek: 8120.0,
      thisMonth: 28750.0,
      lastMonth: 26500.0,
      thisYear: 285000.0,
      lastYear: 265000.0
    },
    appointments: {
      today: 15,
      tomorrow: 18,
      thisWeek: 87,
      nextWeek: 92,
      completed_today: 12,
      no_shows_today: 1,
      cancellations_today: 2
    },
    customers: {
      total: 1245,
      new_this_month: 28,
      vip_customers: 156,
      loyalty_members: 890,
      repeat_rate: 0.78,
      average_visit_value: 125.5
    },
    staff: {
      active_stylists: 8,
      on_duty_today: 5,
      total_commissions_today: 485.25,
      average_booking_rate: 0.82,
      customer_satisfaction: 4.7
    },
    inventory: {
      total_products: 285,
      low_stock_alerts: 12,
      out_of_stock: 3,
      inventory_value: 18750.0,
      monthly_sales: 4250.0
    },
    services: {
      most_popular: 'Classic Haircut',
      highest_revenue: 'Full Color Treatment',
      average_service_time: 75,
      service_completion_rate: 0.96,
      upsell_rate: 0.34
    }
  }
}

/**
 * Initialize Salon Demo Data
 */
export const initializeSalonData = () => {
  if (typeof window !== 'undefined') {
    const salonData = {
      organization: {
        id: SALON_ORG_ID,
        name: 'Beauty Haven Salon & Spa',
        type: 'salon',
        address: '456 Beauty Boulevard, Style District, NY 10014',
        phone: '(555) BEAUTY-1',
        email: 'info@beautyhaven.com',
        website: 'www.beautyhaven.com',
        taxId: '23-4567890',
        established: '2018-06-01'
      },
      services: salonServices,
      products: salonProducts,
      packages: salonPackages,
      stylists: salonStylists,
      customers: salonCustomers,
      equipment: salonEquipment,
      kpis: generateSalonKPIs(),
      settings: {
        fiscalYearStart: '01-01',
        currency: 'USD',
        timezone: 'America/New_York',
        businessHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '19:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '20:00' },
          friday: { open: '09:00', close: '19:00' },
          saturday: { open: '08:00', close: '17:00' },
          sunday: { open: '10:00', close: '16:00' }
        },
        loyaltyProgram: {
          enabled: true,
          pointsPerDollar: 1,
          tierThresholds: { silver: 500, gold: 2000, platinum: 5000 },
          redemptionRate: 0.05 // $0.05 per point
        }
      }
    }

    sessionStorage.setItem('hera-salon-data', JSON.stringify(salonData))
    return salonData
  }
  return null
}

export const getSalonData = () => {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('hera-salon-data')
    if (stored) {
      return JSON.parse(stored)
    }
  }
  return initializeSalonData()
}

export const clearSalonData = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('hera-salon-data')
  }
}
