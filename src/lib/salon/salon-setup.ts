import { salonServices, salonProducts } from '@/lib/salon-data'

export interface SalonSetupOptions {
  organizationId: string
  organizationName: string
  subdomain: string
  ownerEmail: string
  baseUrl?: string
}

export async function setupSalonBusiness(options: SalonSetupOptions) {
  const { organizationId, organizationName, subdomain, ownerEmail, baseUrl } = options

  try {
    // Create a new instance of universalApi with proper configuration for server-side
    const { universalApi } = await import('@/lib/universal-api')
    const api = new universalApi({
      baseUrl,
      organizationId
    })

    // 1. Create default salon services
    const services = salonServices || []
    for (const service of services) {
      await api.createEntity({
        entity_type: 'salon_service',
        entity_name: service.entity_name,
        entity_code: service.entity_code,
        smart_code: service.smart_code || 'HERA.SALON.SERVICE.v1',
        metadata: service.metadata
      })

      // Add service pricing and duration
      if (service.entity_code) {
        await api.setDynamicField(
          service.entity_code,
          'price',
          (service.metadata as any)?.price || 0,
          'HERA.SALON.SERVICE.PRICE.v1'
        )
        await api.setDynamicField(
          service.entity_code,
          'duration',
          (service.metadata as any)?.duration || 60,
          'HERA.SALON.SERVICE.DURATION.v1'
        )
      }
    }

    // 2. Create default staff members
    const staffMembers = [
      {
        entity_name: `${organizationName} Owner`,
        entity_code: 'STAFF-OWNER',
        email: ownerEmail,
        role: 'Owner/Manager',
        commission_rate: 0
      },
      {
        entity_name: 'Emma Johnson',
        entity_code: 'STAFF-001',
        email: `emma@${subdomain}.heraerp.com`,
        role: 'Senior Stylist',
        commission_rate: 40
      },
      {
        entity_name: 'Sarah Williams',
        entity_code: 'STAFF-002',
        email: `sarah@${subdomain}.heraerp.com`,
        role: 'Stylist',
        commission_rate: 35
      }
    ]

    for (const staff of staffMembers) {
      const staffEntity = await api.createEntity({
        entity_type: 'staff',
        entity_name: staff.entity_name,
        entity_code: staff.entity_code,
        smart_code: 'HERA.SALON.STAFF.v1',
        metadata: {
          role: staff.role,
          email: staff.email,
          department: 'Salon Services'
        }
      })

      // Set commission rate
      await api.setDynamicField(
        staffEntity.id,
        'commission_rate',
        staff.commission_rate,
        'HERA.SALON.STAFF.COMMISSION.v1'
      )
    }

    // 3. Create default salon products/inventory
    const products = salonProducts || []
    for (const product of products.slice(0, 10)) {
      // Start with 10 products
      const productEntity = await api.createEntity({
        entity_type: 'product',
        entity_name: product.entity_name,
        entity_code: product.entity_code,
        smart_code: product.smart_code || 'HERA.SALON.PRODUCT.v1',
        metadata: product.metadata
      })

      // Set initial inventory
      await api.setDynamicField(productEntity.id, 'quantity_on_hand', 20, 'HERA.INV.PRODUCT.QTY.v1')
      await api.setDynamicField(productEntity.id, 'reorder_point', 5, 'HERA.INV.PRODUCT.REORDER.v1')
    }

    // 4. Create default payment methods
    const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Gift Card']
    for (const method of paymentMethods) {
      await api.createEntity({
        entity_type: 'payment_method',
        entity_name: method,
        entity_code: `PAY-${method.toUpperCase().replace(' ', '-')}`,
        smart_code: 'HERA.FIN.PAYMENT.METHOD.v1',
        metadata: {
          active: true,
          processing_fee: method.includes('Card') ? 2.9 : 0
        }
      })
    }

    // 5. Create salon-specific settings
    const settings = {
      business_hours: {
        monday: { open: '09:00', close: '19:00' },
        tuesday: { open: '09:00', close: '19:00' },
        wednesday: { open: '09:00', close: '19:00' },
        thursday: { open: '09:00', close: '20:00' },
        friday: { open: '09:00', close: '20:00' },
        saturday: { open: '09:00', close: '18:00' },
        sunday: { open: '10:00', close: '17:00' }
      },
      appointment_settings: {
        slot_duration: 15,
        buffer_time: 15,
        advance_booking_days: 30,
        cancellation_hours: 24
      },
      commission_settings: {
        default_rate: 35,
        product_commission: 10,
        service_commission: 40
      }
    }

    const settingsEntity = await api.createEntity({
      entity_type: 'settings',
      entity_name: 'Salon Settings',
      entity_code: 'SETTINGS-SALON',
      smart_code: 'HERA.SALON.SETTINGS.CONFIG.v1',
      metadata: settings
    })

    // 6. Create a few sample customers
    const sampleCustomers = [
      { name: 'Jessica Martinez', email: 'jessica@example.com', phone: '555-0101' },
      { name: 'Amanda Thompson', email: 'amanda@example.com', phone: '555-0102' },
      { name: 'Rachel Green', email: 'rachel@example.com', phone: '555-0103' }
    ]

    for (const customer of sampleCustomers) {
      const customerEntity = await api.createEntity({
        entity_type: 'customer',
        entity_name: customer.name,
        entity_code: `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        smart_code: 'HERA.SALON.CUSTOMER.PROFILE.v1',
        metadata: {
          email: customer.email,
          phone: customer.phone,
          preferences: {
            reminder_sms: true,
            reminder_email: true,
            marketing_consent: true
          }
        }
      })

      // Add loyalty points
      await api.setDynamicField(
        customerEntity.id,
        'loyalty_points',
        100,
        'HERA.SALON.LOYALTY.POINTS.v1'
      )
    }

    // 7. Initialize Chart of Accounts for salon
    await api.setupBusinessAccounting({
      organizationId,
      businessType: 'salon',
      country: 'US',
      organizationName
    })

    return {
      success: true,
      message: 'Salon business setup completed successfully',
      stats: {
        services: services.length,
        staff: staffMembers.length,
        products: 10,
        customers: sampleCustomers.length
      }
    }
  } catch (error) {
    console.error('Error setting up salon business:', error)
    throw error
  }
}
