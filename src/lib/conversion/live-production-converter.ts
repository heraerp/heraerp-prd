// ================================================================================
// LIVE PRODUCTION CONVERSION ENGINE
// Real conversion system that actually connects to Supabase and processes real data
// Smart Code: HERA.LIVE.PROD.CONVERSION.ENGINE.V1
// ================================================================================

import { supabase } from '@/lib/supabase'
import { universalApi } from '@/lib/universal-api'

// ================================================================================
// LIVE CONVERSION INTERFACES
// ================================================================================

export interface LiveConversionRequest {
  businessInfo: {
    name: string
    type:
      | 'salon'
      | 'restaurant'
      | 'retail'
      | 'healthcare'
      | 'automotive'
      | 'gym'
      | 'photography'
      | 'legal'
    ownerName: string
    email: string
    phone?: string
    address?: string
  }
  progressiveData: {
    customers: any[]
    services: any[]
    products: any[]
    transactions: any[]
    staff: any[]
    settings: any
  }
  uiCustomizations: {
    theme: any
    branding: any
    layout: any
  }
}

export interface LiveConversionResult {
  success: boolean
  organizationId?: string
  userId?: string
  supabaseOrgId?: string
  migrationStats: {
    customersCreated: number
    servicesCreated: number
    productsCreated: number
    transactionsCreated: number
    staffCreated: number
  }
  productionUrls: {
    dashboard: string
    pos: string
    reports: string
  }
  credentials: {
    ownerEmail: string
    temporaryPassword: string
  }
  errors: string[]
  conversionId: string
  timestamp: string
}

// ================================================================================
// LIVE PRODUCTION CONVERTER CLASS
// ================================================================================

export class LiveProductionConverter {
  private conversionId: string
  private logs: string[] = []

  constructor() {
    this.conversionId = `LIVE_CONV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Execute real production conversion with actual Supabase integration
   */
  async executeConversion(request: LiveConversionRequest): Promise<LiveConversionResult> {
    this.log('🚀 Starting LIVE production conversion...')

    const result: LiveConversionResult = {
      success: false,
      migrationStats: {
        customersCreated: 0,
        servicesCreated: 0,
        productsCreated: 0,
        transactionsCreated: 0,
        staffCreated: 0
      },
      productionUrls: {
        dashboard: '',
        pos: '',
        reports: ''
      },
      credentials: {
        ownerEmail: request.businessInfo.email,
        temporaryPassword: this.generateSecurePassword()
      },
      errors: [],
      conversionId: this.conversionId,
      timestamp: new Date().toISOString()
    }

    try {
      // Step 1: Create production organization in Supabase
      this.log('🏢 Creating production organization in Supabase...')
      const organization = await this.createProductionOrganization(request.businessInfo)
      result.organizationId = organization.entityId
      result.supabaseOrgId = organization.supabaseId

      // Step 2: Create owner user account
      this.log('👤 Creating owner user account...')
      const ownerUser = await this.createOwnerUser(request.businessInfo, organization.supabaseId)
      result.userId = ownerUser.id

      // Step 3: Migrate staff members
      this.log('👥 Migrating staff members...')
      for (const staff of request.progressiveData.staff) {
        await this.createStaffMember(staff, organization.supabaseId)
        result.migrationStats.staffCreated++
      }

      // Step 4: Migrate customers
      this.log('💼 Migrating customer database...')
      for (const customer of request.progressiveData.customers) {
        await this.createCustomerEntity(customer, organization.supabaseId)
        result.migrationStats.customersCreated++
      }

      // Step 5: Migrate services
      this.log('💄 Migrating services catalog...')
      for (const service of request.progressiveData.services) {
        await this.createServiceEntity(service, organization.supabaseId)
        result.migrationStats.servicesCreated++
      }

      // Step 6: Migrate products
      this.log('📦 Migrating product inventory...')
      for (const product of request.progressiveData.products) {
        await this.createProductEntity(product, organization.supabaseId)
        result.migrationStats.productsCreated++
      }

      // Step 7: Migrate transactions
      this.log('💳 Migrating transaction history...')
      for (const transaction of request.progressiveData.transactions) {
        await this.createTransactionEntity(transaction, organization.supabaseId)
        result.migrationStats.transactionsCreated++
      }

      // Step 8: Apply UI customizations
      this.log('🎨 Applying UI customizations...')
      await this.applyUICustomizations(request.uiCustomizations, organization.supabaseId)

      // Step 9: Setup production URLs
      const subdomain = this.generateSubdomain(request.businessInfo.name)
      result.productionUrls = {
        dashboard: `https://${subdomain}.heraerp.com/dashboard`,
        pos: `https://${subdomain}.heraerp.com/pos`,
        reports: `https://${subdomain}.heraerp.com/reports`
      }

      // Step 10: Final validation
      this.log('✅ Validating production system...')
      const validation = await this.validateProduction(organization.supabaseId)
      if (!validation.success) {
        throw new Error(`Production validation failed: ${validation.errors.join(', ')}`)
      }

      result.success = true
      this.log('🎉 LIVE production conversion completed successfully!')

      // Save conversion record for audit
      await this.saveConversionRecord(result)

      return result
    } catch (error) {
      this.log(`❌ LIVE conversion failed: ${error.message}`)
      result.errors.push(error.message)
      return result
    }
  }

  /**
   * Create production organization in both universal tables and Supabase core
   */
  private async createProductionOrganization(businessInfo: any) {
    // Create in core_organizations (Supabase native table)
    const { data: supabaseOrg, error: supabaseError } = await supabase
      .from('core_organizations')
      .insert({
        organization_name: businessInfo.name,
        organization_type: businessInfo.type,
        owner_name: businessInfo.ownerName,
        owner_email: businessInfo.email,
        owner_phone: businessInfo.phone,
        business_address: businessInfo.address,
        subscription_tier: 'production',
        status: 'active',
        created_at: new Date().toISOString(),
        metadata: {
          converted_from: 'progressive',
          conversion_id: this.conversionId,
          conversion_date: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (supabaseError) {
      throw new Error(`Failed to create organization in Supabase: ${supabaseError.message}`)
    }

    // Create corresponding entity in universal tables
    const entity = await universalApi.createEntity({
      entity_type: 'organization',
      entity_name: businessInfo.name,
      entity_code: `ORG-${supabaseOrg.id}`,
      organization_id: supabaseOrg.id,
      smart_code: `HERA.${businessInfo.type.toUpperCase()}.ORG.PROD.v1`,
      metadata: {
        supabase_org_id: supabaseOrg.id,
        business_type: businessInfo.type,
        owner_name: businessInfo.ownerName,
        converted_from: 'progressive',
        production_ready: true
      }
    })

    return {
      supabaseId: supabaseOrg.id,
      entityId: entity.id
    }
  }

  /**
   * Create owner user account with proper permissions
   */
  private async createOwnerUser(businessInfo: any, organizationId: string) {
    // Create user entity
    const userEntity = await universalApi.createEntity({
      entity_type: 'user',
      entity_name: businessInfo.ownerName,
      entity_code: `USER-OWNER-${organizationId}`,
      organization_id: organizationId,
      smart_code: 'HERA.USER.OWNER.PROD.V1',
      metadata: {
        email: businessInfo.email,
        phone: businessInfo.phone,
        role: 'owner',
        permissions: ['all'],
        created_from: 'conversion',
        is_owner: true
      }
    })

    return userEntity
  }

  /**
   * Create staff member entities
   */
  private async createStaffMember(staff: any, organizationId: string) {
    return await universalApi.createEntity({
      entity_type: 'staff',
      entity_name: staff.name,
      entity_code: `STAFF-${organizationId}-${Date.now()}`,
      organization_id: organizationId,
      smart_code: 'HERA.STAFF.MEMBER.PROD.V1',
      metadata: {
        specialty: staff.specialty,
        experience: staff.experience,
        rating: staff.rating,
        status: 'active',
        hire_date: new Date().toISOString()
      }
    })
  }

  /**
   * Create customer entities
   */
  private async createCustomerEntity(customer: any, organizationId: string) {
    return await universalApi.createEntity({
      entity_type: 'customer',
      entity_name: customer.name,
      entity_code: customer.code || `CUST-${organizationId}-${Date.now()}`,
      organization_id: organizationId,
      smart_code: 'HERA.CRM.CUSTOMER.PROD.V1',
      metadata: {
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        vip_status: customer.vip_status,
        loyalty_points: customer.loyalty_points,
        total_spent: customer.total_spent,
        last_visit: customer.last_visit,
        converted_from: 'progressive'
      }
    })
  }

  /**
   * Create service entities
   */
  private async createServiceEntity(service: any, organizationId: string) {
    return await universalApi.createEntity({
      entity_type: 'service',
      entity_name: service.name,
      entity_code: service.code || `SVC-${organizationId}-${Date.now()}`,
      organization_id: organizationId,
      smart_code: 'HERA.SERVICE.OFFERING.PROD.V1',
      metadata: {
        category: service.category,
        price: service.price,
        duration: service.duration,
        provider: service.provider,
        description: service.description,
        active: true
      }
    })
  }

  /**
   * Create product entities
   */
  private async createProductEntity(product: any, organizationId: string) {
    return await universalApi.createEntity({
      entity_type: 'product',
      entity_name: product.name,
      entity_code: product.code || `PROD-${organizationId}-${Date.now()}`,
      organization_id: organizationId,
      smart_code: 'HERA.PRODUCT.INVENTORY.PROD.V1',
      metadata: {
        category: product.category,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        brand: product.brand,
        description: product.description,
        barcode: product.barcode,
        active: true
      }
    })
  }

  /**
   * Create transaction entities
   */
  private async createTransactionEntity(transaction: any, organizationId: string) {
    return await universalApi.createTransaction({
      organization_id: organizationId,
      transaction_type: 'sale',
      transaction_date: transaction.date || new Date().toISOString(),
      total_amount: transaction.total,
      smart_code: 'HERA.TXN.SALE.PROD.V1',
      metadata: {
        customer_id: transaction.customer_id,
        payment_method: transaction.payment_method,
        staff_member: transaction.staff_member,
        converted_from: 'progressive'
      }
    })
  }

  /**
   * Apply UI customizations as dynamic data
   */
  private async applyUICustomizations(customizations: any, organizationId: string) {
    if (customizations.theme) {
      await universalApi.setDynamicField(
        organizationId,
        'ui_theme',
        JSON.stringify(customizations.theme)
      )
    }
    if (customizations.branding) {
      await universalApi.setDynamicField(
        organizationId,
        'branding',
        JSON.stringify(customizations.branding)
      )
    }
    if (customizations.layout) {
      await universalApi.setDynamicField(
        organizationId,
        'layout_preferences',
        JSON.stringify(customizations.layout)
      )
    }
  }

  /**
   * Validate production system integrity
   */
  private async validateProduction(organizationId: string) {
    try {
      // Check organization exists
      const { data: org, error: orgError } = await supabase
        .from('core_organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (orgError || !org) {
        return { success: false, errors: ['Organization not found'] }
      }

      // Check entities exist
      const entities = await universalApi.query('core_entities', {
        organization_id: organizationId
      })

      if (entities.length === 0) {
        return { success: false, errors: ['No entities found'] }
      }

      return { success: true, errors: [] }
    } catch (error) {
      return { success: false, errors: [error.message] }
    }
  }

  /**
   * Generate secure temporary password
   */
  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  /**
   * Generate subdomain from business name
   */
  private generateSubdomain(businessName: string): string {
    return (
      businessName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 20) +
      '-' +
      Math.random().toString(36).substr(2, 4)
    )
  }

  /**
   * Save conversion record for audit trail
   */
  private async saveConversionRecord(result: LiveConversionResult) {
    try {
      const { error } = await supabase.from('conversion_audit_log').insert({
        conversion_id: this.conversionId,
        organization_id: result.supabaseOrgId,
        conversion_type: 'progressive_to_production',
        success: result.success,
        migration_stats: result.migrationStats,
        errors: result.errors,
        logs: this.logs,
        timestamp: result.timestamp,
        metadata: {
          production_urls: result.productionUrls,
          credentials_generated: true
        }
      })

      if (error) {
        console.error('Failed to save conversion audit log:', error)
      }
    } catch (error) {
      console.error('Error saving conversion record:', error)
    }
  }

  /**
   * Add log entry
   */
  private log(message: string) {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `${timestamp}: ${message}`
    this.logs.push(logEntry)
    console.log(logEntry)
  }

  /**
   * Get conversion logs
   */
  getLogs(): string[] {
    return this.logs
  }
}

// ================================================================================
// EXPORT FUNCTIONS
// ================================================================================

export async function executeLiveConversion(
  request: LiveConversionRequest
): Promise<LiveConversionResult> {
  const converter = new LiveProductionConverter()
  return await converter.executeConversion(request)
}

export function validateConversionRequest(request: Partial<LiveConversionRequest>): string[] {
  const errors: string[] = []

  if (!request.businessInfo?.name) {
    errors.push('Business name is required')
  }
  if (!request.businessInfo?.ownerName) {
    errors.push('Owner name is required')
  }
  if (!request.businessInfo?.email) {
    errors.push('Owner email is required')
  }
  if (!request.businessInfo?.type) {
    errors.push('Business type is required')
  }
  if (!request.progressiveData) {
    errors.push('Progressive data is required')
  }

  return errors
}
