/**
 * HERA Progressive Retail Template
 * Complete retail management system with inventory, POS, and customer management
 * Smart Code: HERA.PROGRESSIVE.TEMPLATE.RETAIL.v1
 */

export interface RetailBusinessRequirements {
  business_name: string
  store_type: 'clothing' | 'electronics' | 'grocery' | 'pharmacy' | 'general_merchandise' | 'specialty'
  store_size: 'small' | 'medium' | 'large' | 'chain'
  daily_transactions?: number
  product_categories?: string[]
  payment_methods?: ('cash' | 'card' | 'mobile' | 'buy_now_pay_later')[]
  features?: ('loyalty_program' | 'gift_cards' | 'promotions' | 'online_ordering' | 'curbside_pickup')[]
  location?: {
    address: string
    city: string
    state: string
    zip: string
    square_feet?: number
  }
}

export interface RetailProduct {
  id: string
  sku: string
  name: string
  description: string
  category: string
  brand: string
  price: number
  cost: number
  barcode?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  inventory: {
    quantity_on_hand: number
    reorder_point: number
    max_stock: number
    last_received: Date
    supplier_id?: string
  }
  sales_data: {
    units_sold_30d: number
    revenue_30d: number
    margin_percent: number
    turn_rate: number
  }
  attributes?: {
    size?: string
    color?: string
    style?: string
    material?: string
  }
}

export interface RetailTransaction {
  id: string
  transaction_number: string
  customer_id?: string
  cashier_id: string
  transaction_type: 'sale' | 'return' | 'exchange' | 'void'
  items: TransactionItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_method: 'cash' | 'card' | 'mobile' | 'gift_card' | 'store_credit'
  status: 'pending' | 'completed' | 'voided' | 'refunded'
  receipt_number?: string
  loyalty_points_earned?: number
  loyalty_points_redeemed?: number
  promotions_applied?: string[]
}

export interface TransactionItem {
  product_id: string
  sku: string
  quantity: number
  unit_price: number
  discount: number
  line_total: number
  tax_amount: number
  return_reason?: string
}

export interface RetailCustomer {
  id: string
  customer_number: string
  personal_info: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
    date_of_birth?: Date
    address?: {
      street: string
      city: string
      state: string
      zip: string
    }
  }
  loyalty_program?: {
    member_id: string
    tier: 'bronze' | 'silver' | 'gold' | 'platinum'
    points_balance: number
    lifetime_value: number
    join_date: Date
  }
  preferences: {
    communication_method: 'email' | 'sms' | 'phone' | 'mail'
    categories_of_interest: string[]
    size_preferences?: Record<string, string>
  }
  purchase_history: {
    total_orders: number
    total_spent: number
    average_order_value: number
    last_purchase_date?: Date
    favorite_categories: string[]
  }
}

export class RetailTemplate {
  
  /**
   * Generate comprehensive retail demo data
   */
  static generateDemoData(requirements: RetailBusinessRequirements): any {
    const organizationId = crypto.randomUUID()
    
    return {
      organization: this.createRetailOrganization(organizationId, requirements),
      entities: [
        ...this.generateProducts(organizationId, requirements.store_type),
        ...this.generateCustomers(organizationId),
        ...this.generateStaff(organizationId),
        ...this.generateSuppliers(organizationId),
        ...this.generatePromotions(organizationId),
        ...this.generateGiftCards(organizationId)
      ],
      transactions: [
        ...this.generateSalesTransactions(organizationId, requirements.daily_transactions || 150),
        ...this.generateInventoryTransactions(organizationId),
        ...this.generatePayrollTransactions(organizationId)
      ],
      relationships: this.generateRelationships(organizationId),
      dynamicData: this.generateDynamicData(organizationId)
    }
  }

  /**
   * Create retail organization entity
   */
  private static createRetailOrganization(id: string, requirements: RetailBusinessRequirements): any {
    return {
      id,
      organization_name: requirements.business_name,
      organization_code: `RTL-${requirements.business_name.replace(/\s+/g, '').toUpperCase().substring(0, 8)}`,
      organization_type: 'retail_store',
      industry_classification: 'retail',
      ai_insights: {
        store_type: requirements.store_type,
        store_size: requirements.store_size,
        predicted_daily_revenue: requirements.daily_transactions * 45, // $45 avg transaction
        growth_potential: 'moderate',
        peak_hours: ['11:00-13:00', '17:00-19:00'],
        seasonal_trends: this.getSeasonalTrends(requirements.store_type)
      },
      settings: {
        operating_hours: {
          monday: { open: '09:00', close: '21:00' },
          tuesday: { open: '09:00', close: '21:00' },
          wednesday: { open: '09:00', close: '21:00' },
          thursday: { open: '09:00', close: '21:00' },
          friday: { open: '09:00', close: '22:00' },
          saturday: { open: '09:00', close: '22:00' },
          sunday: { open: '10:00', close: '20:00' }
        },
        pos_settings: {
          tax_rate: 0.0875,
          receipt_footer: 'Thank you for shopping with us!',
          return_policy_days: 30,
          loyalty_points_rate: 0.05, // 5% back in points
          auto_print_receipts: true
        },
        inventory_settings: {
          low_stock_threshold: 10,
          auto_reorder: false,
          barcode_scanning: true,
          track_serial_numbers: requirements.store_type === 'electronics'
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Generate products based on store type
   */
  private static generateProducts(organizationId: string, storeType: string): any[] {
    const productTemplates = {
      clothing: [
        {
          name: 'Classic Denim Jeans', category: 'Bottoms', brand: 'StyleCo', price: 79.99, cost: 32.00,
          sku: 'CLO-JEAN-001', barcode: '1234567890123',
          attributes: { size: 'Multiple', color: 'Blue', material: 'Cotton' }
        },
        {
          name: 'Cotton T-Shirt', category: 'Tops', brand: 'ComfortWear', price: 24.99, cost: 8.50,
          sku: 'CLO-TSHIRT-001', barcode: '1234567890124',
          attributes: { size: 'Multiple', color: 'White', material: 'Cotton' }
        },
        {
          name: 'Sneakers', category: 'Footwear', brand: 'RunFast', price: 129.99, cost: 52.00,
          sku: 'CLO-SNEAK-001', barcode: '1234567890125',
          attributes: { size: 'Multiple', color: 'Black', material: 'Synthetic' }
        },
        {
          name: 'Winter Jacket', category: 'Outerwear', brand: 'WarmCo', price: 199.99, cost: 85.00,
          sku: 'CLO-JACKET-001', barcode: '1234567890126',
          attributes: { size: 'Multiple', color: 'Navy', material: 'Polyester' }
        }
      ],
      electronics: [
        {
          name: 'Wireless Headphones', category: 'Audio', brand: 'SoundTech', price: 199.99, cost: 89.00,
          sku: 'ELEC-HEAD-001', barcode: '2234567890123',
          attributes: { color: 'Black', connectivity: 'Bluetooth', battery_life: '30 hours' }
        },
        {
          name: 'Smartphone Case', category: 'Accessories', brand: 'ProtectPro', price: 39.99, cost: 12.00,
          sku: 'ELEC-CASE-001', barcode: '2234567890124',
          attributes: { color: 'Clear', material: 'Silicone', compatibility: 'Universal' }
        },
        {
          name: 'Portable Charger', category: 'Accessories', brand: 'PowerMax', price: 49.99, cost: 18.50,
          sku: 'ELEC-CHARGE-001', barcode: '2234567890125',
          attributes: { capacity: '10000mAh', color: 'Black', ports: '2 USB' }
        },
        {
          name: 'Tablet Stand', category: 'Accessories', brand: 'StandEasy', price: 29.99, cost: 9.75,
          sku: 'ELEC-STAND-001', barcode: '2234567890126',
          attributes: { material: 'Aluminum', adjustable: 'Yes', color: 'Silver' }
        }
      ],
      grocery: [
        {
          name: 'Organic Bananas', category: 'Produce', brand: 'Fresh Farm', price: 3.49, cost: 1.25,
          sku: 'GROC-BANAN-001', barcode: '3234567890123',
          attributes: { organic: 'Yes', unit: 'per lb', origin: 'Local' }
        },
        {
          name: 'Whole Wheat Bread', category: 'Bakery', brand: 'Golden Loaf', price: 4.99, cost: 1.85,
          sku: 'GROC-BREAD-001', barcode: '3234567890124',
          attributes: { type: 'Whole Wheat', size: '24 oz', preservatives: 'No' }
        },
        {
          name: 'Greek Yogurt', category: 'Dairy', brand: 'Creamy Valley', price: 6.99, cost: 2.80,
          sku: 'GROC-YOGURT-001', barcode: '3234567890125',
          attributes: { fat_content: '0%', size: '32 oz', flavor: 'Plain' }
        },
        {
          name: 'Pasta Sauce', category: 'Pantry', brand: 'Mama Maria', price: 3.99, cost: 1.45,
          sku: 'GROC-SAUCE-001', barcode: '3234567890126',
          attributes: { type: 'Marinara', size: '24 oz', ingredients: 'Natural' }
        }
      ]
    }

    const baseProducts = productTemplates[storeType] || productTemplates.clothing
    
    return baseProducts.map(product => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'product',
      entity_name: product.name,
      entity_code: product.sku,
      smart_code: `HERA.RTL.PRODUCT.${product.category.toUpperCase().replace(/\s+/g, '_')}.v1`,
      metadata: {
        category: product.category,
        brand: product.brand,
        price: product.price,
        cost: product.cost,
        barcode: product.barcode,
        attributes: product.attributes,
        inventory: {
          quantity_on_hand: 25 + Math.floor(Math.random() * 75),
          reorder_point: 10,
          max_stock: 100,
          last_received: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        },
        sales_data: {
          units_sold_30d: Math.floor(Math.random() * 50),
          revenue_30d: Math.floor(Math.random() * 2000),
          margin_percent: ((product.price - product.cost) / product.price * 100).toFixed(1),
          turn_rate: 2 + Math.random() * 6
        },
        supplier_info: {
          supplier_id: crypto.randomUUID(),
          lead_time_days: 7 + Math.floor(Math.random() * 14)
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate retail customers
   */
  private static generateCustomers(organizationId: string): any[] {
    const customers = [
      {
        first_name: 'Jennifer', last_name: 'Wilson', email: 'jennifer.wilson@email.com', phone: '555-2001',
        loyalty_tier: 'gold', points: 2450, lifetime_value: 1850.00
      },
      {
        first_name: 'Michael', last_name: 'Johnson', email: 'michael.johnson@email.com', phone: '555-2002',
        loyalty_tier: 'silver', points: 890, lifetime_value: 650.00
      },
      {
        first_name: 'Sarah', last_name: 'Davis', email: 'sarah.davis@email.com', phone: '555-2003',
        loyalty_tier: 'platinum', points: 5200, lifetime_value: 3200.00
      },
      {
        first_name: 'Robert', last_name: 'Brown', email: 'robert.brown@email.com', phone: '555-2004',
        loyalty_tier: 'bronze', points: 320, lifetime_value: 280.00
      },
      {
        first_name: 'Emily', last_name: 'Martinez', email: 'emily.martinez@email.com', phone: '555-2005',
        loyalty_tier: 'gold', points: 1680, lifetime_value: 1200.00
      },
      {
        first_name: 'David', last_name: 'Garcia', email: 'david.garcia@email.com', phone: '555-2006',
        loyalty_tier: 'silver', points: 750, lifetime_value: 520.00
      },
      {
        first_name: 'Lisa', last_name: 'Rodriguez', email: 'lisa.rodriguez@email.com', phone: '555-2007',
        loyalty_tier: 'gold', points: 1950, lifetime_value: 1400.00
      },
      {
        first_name: 'James', last_name: 'Lopez', email: 'james.lopez@email.com', phone: '555-2008',
        loyalty_tier: 'bronze', points: 180, lifetime_value: 125.00
      }
    ]

    return customers.map(customer => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'customer',
      entity_name: `${customer.first_name} ${customer.last_name}`,
      smart_code: 'HERA.RTL.CUSTOMER.LOYALTY.v1',
      metadata: {
        customer_number: `CUST-${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        personal_info: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          address: {
            street: `${Math.floor(Math.random() * 9999) + 1} Oak Street`,
            city: 'Springfield',
            state: 'IL',
            zip: '62701'
          }
        },
        loyalty_program: {
          member_id: `LYL-${String(Math.floor(Math.random() * 1000000)).padStart(7, '0')}`,
          tier: customer.loyalty_tier,
          points_balance: customer.points,
          lifetime_value: customer.lifetime_value,
          join_date: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000)
        },
        preferences: {
          communication_method: 'email',
          categories_of_interest: ['Electronics', 'Clothing'].filter(() => Math.random() > 0.5),
          email_marketing: true,
          sms_notifications: Math.random() > 0.5
        },
        purchase_history: {
          total_orders: 5 + Math.floor(Math.random() * 20),
          total_spent: customer.lifetime_value,
          average_order_value: customer.lifetime_value / (5 + Math.floor(Math.random() * 20)),
          last_purchase_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          favorite_categories: ['Electronics', 'Clothing', 'Home'].slice(0, 1 + Math.floor(Math.random() * 2))
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate sales transactions
   */
  private static generateSalesTransactions(organizationId: string, dailyCount: number): any[] {
    const transactions = []
    const transactionTypes = ['sale', 'sale', 'sale', 'sale', 'return']
    const paymentMethods = ['card', 'card', 'card', 'cash', 'mobile']
    
    // Generate transactions for last 14 days
    for (let day = 0; day < 14; day++) {
      const transactionsForDay = Math.floor(dailyCount * (0.7 + Math.random() * 0.6))
      
      for (let i = 0; i < transactionsForDay; i++) {
        const transactionDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000)
        const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
        
        const itemCount = 1 + Math.floor(Math.random() * 5)
        const subtotal = 20 + Math.random() * 120
        const tax = subtotal * 0.0875
        const discount = Math.random() > 0.8 ? subtotal * 0.1 : 0
        const loyaltyPoints = Math.floor(subtotal * 0.05)
        
        transactions.push({
          id: crypto.randomUUID(),
          organization_id: organizationId,
          transaction_type: transactionType,
          transaction_number: `TXN-${String(transactions.length + 1).padStart(6, '0')}`,
          transaction_date: transactionDate,
          smart_code: 'HERA.RTL.SALE.POS.v1',
          description: `${transactionType} - ${itemCount} items`,
          total_amount: subtotal + tax - discount,
          currency_code: 'USD',
          status: 'confirmed',
          metadata: {
            receipt_number: `RCP-${String(Math.floor(Math.random() * 1000000)).padStart(7, '0')}`,
            cashier_id: crypto.randomUUID(),
            customer_id: Math.random() > 0.3 ? crypto.randomUUID() : null,
            item_count: itemCount,
            subtotal: Math.round(subtotal * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            discount: Math.round(discount * 100) / 100,
            payment_method: paymentMethod,
            loyalty_points_earned: transactionType === 'sale' ? loyaltyPoints : 0,
            loyalty_points_redeemed: Math.random() > 0.9 ? Math.floor(Math.random() * 500) : 0,
            promotions_applied: discount > 0 ? ['10% off regular price'] : [],
            return_reason: transactionType === 'return' ? 'Customer request' : null
          },
          created_at: transactionDate,
          updated_at: transactionDate,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
      }
    }
    
    return transactions
  }

  /**
   * Generate retail staff
   */
  private static generateStaff(organizationId: string): any[] {
    const staff = [
      { name: 'Maria Gonzalez', role: 'store_manager', hourly_rate: 24.50, hire_date: '2020-01-15' },
      { name: 'James Wilson', role: 'assistant_manager', hourly_rate: 19.75, hire_date: '2021-03-01' },
      { name: 'Ashley Chen', role: 'sales_associate', hourly_rate: 16.00, hire_date: '2022-06-15' },
      { name: 'Robert Kim', role: 'sales_associate', hourly_rate: 15.50, hire_date: '2022-09-20' },
      { name: 'Jessica Rodriguez', role: 'cashier', hourly_rate: 14.75, hire_date: '2023-01-10' },
      { name: 'Michael Thompson', role: 'stock_clerk', hourly_rate: 14.00, hire_date: '2023-04-01' },
      { name: 'Amanda Davis', role: 'customer_service', hourly_rate: 16.25, hire_date: '2022-11-15' }
    ]

    return staff.map(person => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'employee',
      entity_name: person.name,
      smart_code: 'HERA.RTL.STAFF.EMPLOYEE.v1',
      metadata: {
        employee_id: `EMP-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        role: person.role,
        employment_details: {
          hire_date: person.hire_date,
          hourly_rate: person.hourly_rate,
          status: 'active',
          schedule: {
            availability: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            preferred_shifts: person.role === 'store_manager' ? ['opening', 'day'] : ['closing', 'weekend']
          },
          pos_access: ['cashier', 'sales_associate', 'assistant_manager', 'store_manager'].includes(person.role),
          cash_handling_certified: ['cashier', 'assistant_manager', 'store_manager'].includes(person.role)
        },
        contact_info: {
          phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          emergency_contact: 'Available on file'
        },
        performance: {
          sales_target_achievement: 85 + Math.random() * 30,
          customer_satisfaction_score: 4.2 + Math.random() * 0.7,
          attendance_rate: 92 + Math.random() * 7
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate suppliers
   */
  private static generateSuppliers(organizationId: string): any[] {
    const suppliers = [
      { name: 'Fashion Forward Wholesale', category: 'clothing', contact: 'orders@fashionforward.com', phone: '555-3001' },
      { name: 'Tech Distribution Inc.', category: 'electronics', contact: 'sales@techdist.com', phone: '555-3002' },
      { name: 'Fresh Foods Distributor', category: 'grocery', contact: 'orders@freshfoods.com', phone: '555-3003' },
      { name: 'General Merchandise Supply', category: 'general', contact: 'info@gmsupply.com', phone: '555-3004' }
    ]

    return suppliers.map(supplier => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'supplier',
      entity_name: supplier.name,
      smart_code: 'HERA.RTL.SUPPLIER.VENDOR.v1',
      metadata: {
        category: supplier.category,
        contact_info: {
          email: supplier.contact,
          phone: supplier.phone
        },
        terms: {
          payment_terms: 'Net 30',
          lead_time_days: 7 + Math.floor(Math.random() * 14),
          minimum_order: 500.00,
          volume_discounts: true
        },
        performance: {
          on_time_delivery_rate: 85 + Math.random() * 15,
          quality_rating: 4.0 + Math.random() * 1.0,
          pricing_competitiveness: 'good'
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate promotions and discounts
   */
  private static generatePromotions(organizationId: string): any[] {
    const promotions = [
      {
        name: '10% Off Storewide', type: 'percentage', value: 10,
        description: 'Save 10% on all regular-priced items'
      },
      {
        name: 'Buy 2 Get 1 Free', type: 'bogo', value: 0,
        description: 'Buy any 2 items, get the 3rd item of equal or lesser value free'
      },
      {
        name: '$5 Off $50+', type: 'dollar_off', value: 5,
        description: '$5 off when you spend $50 or more'
      },
      {
        name: 'Loyalty Double Points', type: 'points_multiplier', value: 2,
        description: 'Earn double loyalty points on all purchases'
      }
    ]

    return promotions.map(promo => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'promotion',
      entity_name: promo.name,
      smart_code: 'HERA.RTL.PROMOTION.DISCOUNT.v1',
      metadata: {
        promotion_type: promo.type,
        discount_value: promo.value,
        description: promo.description,
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        conditions: {
          minimum_purchase: promo.name.includes('$50+') ? 50.00 : 0,
          applicable_categories: ['all'],
          customer_eligibility: 'all'
        },
        usage_stats: {
          times_used: Math.floor(Math.random() * 50),
          total_savings: Math.floor(Math.random() * 1000)
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate gift cards
   */
  private static generateGiftCards(organizationId: string): any[] {
    const giftCards = []
    
    for (let i = 1; i <= 5; i++) {
      giftCards.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        entity_type: 'gift_card',
        entity_name: `Gift Card #${String(i).padStart(3, '0')}`,
        smart_code: 'HERA.RTL.GIFTCARD.PREPAID.v1',
        metadata: {
          card_number: `GC${String(Math.floor(Math.random() * 1000000000000)).padStart(12, '0')}`,
          initial_value: [25, 50, 100, 150, 200][Math.floor(Math.random() * 5)],
          current_balance: 10 + Math.random() * 90,
          issue_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
          expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          purchased_by: 'Customer',
          status: 'active'
        },
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return giftCards
  }

  /**
   * Generate inventory transactions
   */
  private static generateInventoryTransactions(organizationId: string): any[] {
    const transactions = []
    
    // Generate weekly inventory receipts
    for (let week = 0; week < 6; week++) {
      const receiptDate = new Date(Date.now() - week * 7 * 24 * 60 * 60 * 1000)
      
      transactions.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        transaction_type: 'inventory_receipt',
        transaction_number: `INV-${String(week + 1).padStart(4, '0')}`,
        transaction_date: receiptDate,
        smart_code: 'HERA.RTL.INVENTORY.RECEIPT.v1',
        description: 'Weekly inventory receipt',
        total_amount: 2500 + Math.random() * 1500,
        currency_code: 'USD',
        status: 'confirmed',
        metadata: {
          supplier: 'Fashion Forward Wholesale',
          items_received: 15 + Math.floor(Math.random() * 10),
          delivery_method: 'truck',
          inspection_status: 'passed',
          received_by: 'Stock Clerk'
        },
        created_at: receiptDate,
        updated_at: receiptDate,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return transactions
  }

  /**
   * Generate payroll transactions
   */
  private static generatePayrollTransactions(organizationId: string): any[] {
    const transactions = []
    
    // Generate bi-weekly payroll
    for (let period = 0; period < 6; period++) {
      const payrollDate = new Date(Date.now() - period * 14 * 24 * 60 * 60 * 1000)
      
      transactions.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        transaction_type: 'payroll',
        transaction_number: `PAY-${String(period + 1).padStart(4, '0')}`,
        transaction_date: payrollDate,
        smart_code: 'HERA.RTL.PAYROLL.BIWEEKLY.v1',
        description: 'Bi-weekly staff payroll',
        total_amount: 4200 + Math.random() * 1000,
        currency_code: 'USD',
        status: 'confirmed',
        metadata: {
          pay_period: {
            start: new Date(payrollDate.getTime() - 14 * 24 * 60 * 60 * 1000),
            end: payrollDate
          },
          employees_count: 7,
          total_hours: 560 + Math.floor(Math.random() * 140),
          overtime_hours: Math.floor(Math.random() * 20)
        },
        created_at: payrollDate,
        updated_at: payrollDate,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return transactions
  }

  /**
   * Get seasonal trends for store type
   */
  private static getSeasonalTrends(storeType: string): string[] {
    const trends = {
      clothing: ['Back-to-school (Aug-Sep)', 'Holiday shopping (Nov-Dec)', 'Spring refresh (Mar-Apr)'],
      electronics: ['Black Friday (Nov)', 'Back-to-school (Aug)', 'Holiday season (Dec)'],
      grocery: ['Holiday cooking (Nov-Dec)', 'Summer BBQ (Jun-Aug)', 'New Year health (Jan)'],
      general_merchandise: ['Holiday shopping (Nov-Dec)', 'Spring cleaning (Mar-May)', 'Back-to-school (Aug-Sep)']
    }
    
    return trends[storeType] || trends.general_merchandise
  }

  /**
   * Generate relationships between entities
   */
  private static generateRelationships(organizationId: string): any[] {
    return []
  }

  /**
   * Generate dynamic data fields
   */
  private static generateDynamicData(organizationId: string): any[] {
    return []
  }

  /**
   * Generate retail-specific component structure
   */
  static generateComponentStructure(): any {
    return {
      pages: [
        {
          name: 'RetailDashboard',
          path: '/dashboard',
          components: ['GlassPanel', 'SalesKPIs', 'TopProducts', 'HourlySalesChart', 'LoyaltyStats']
        },
        {
          name: 'POSSystem',
          path: '/pos',
          components: ['GlassPanel', 'ProductGrid', 'ShoppingCart', 'PaymentTerminal', 'ReceiptPrinter']
        },
        {
          name: 'ProductCatalog',
          path: '/products',
          components: ['GlassPanel', 'EnterpriseTable', 'ProductForm', 'BarcodeScanner', 'PhotoUpload']
        },
        {
          name: 'InventoryManagement',
          path: '/inventory',
          components: ['GlassPanel', 'StockLevels', 'ReorderAlerts', 'ReceiptEntry', 'StockAdjustments']
        },
        {
          name: 'CustomerManagement',
          path: '/customers',
          components: ['GlassPanel', 'CustomerList', 'LoyaltyDashboard', 'PurchaseHistory', 'CommunicationLog']
        },
        {
          name: 'PromotionsGiftCards',
          path: '/promotions',
          components: ['GlassPanel', 'PromotionList', 'DiscountRules', 'GiftCardManagement', 'CouponGenerator']
        },
        {
          name: 'SalesReporting',
          path: '/reports',
          components: ['GlassPanel', 'SalesCharts', 'ProductPerformance', 'CustomerAnalytics', 'ProfitMargins']
        },
        {
          name: 'SupplierPortal',
          path: '/suppliers',
          components: ['GlassPanel', 'SupplierList', 'PurchaseOrders', 'DeliveryTracking', 'VendorPerformance']
        }
      ],
      specialized_components: [
        'ProductGrid',
        'ShoppingCart',
        'PaymentTerminal',
        'BarcodeScanner',
        'ReceiptPrinter',
        'StockLevels',
        'ReorderAlerts',
        'LoyaltyDashboard',
        'PromotionList',
        'GiftCardManagement',
        'PurchaseOrders'
      ]
    }
  }
}

/**
 * Retail template factory function
 */
export function createRetailTemplate(requirements: RetailBusinessRequirements): any {
  return {
    demoData: RetailTemplate.generateDemoData(requirements),
    componentStructure: RetailTemplate.generateComponentStructure(),
    businessLogic: {
      posWorkflow: ['scan', 'add_to_cart', 'apply_discounts', 'process_payment', 'print_receipt'],
      inventoryTracking: true,
      loyaltyProgram: true,
      promotionsEngine: true,
      giftCardProcessing: true,
      returnProcessing: true,
      barcodeScanning: true,
      multiLocationSupport: requirements.store_size === 'chain'
    },
    smartCodes: [
      'HERA.RTL.PRODUCT.v1',
      'HERA.RTL.SALE.POS.v1',
      'HERA.RTL.CUSTOMER.LOYALTY.v1',
      'HERA.RTL.INVENTORY.RECEIPT.v1',
      'HERA.RTL.PROMOTION.DISCOUNT.v1',
      'HERA.RTL.GIFTCARD.PREPAID.v1',
      'HERA.RTL.SUPPLIER.VENDOR.v1',
      'HERA.RTL.STAFF.EMPLOYEE.v1'
    ]
  }
}