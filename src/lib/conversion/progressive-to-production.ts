// ================================================================================
// HERA PROGRESSIVE-TO-PRODUCTION CONVERSION SYSTEM
// Seamless migration from progressive PWA to full production with zero data loss
// Smart Code: HERA.CONVERT.PROG.TO.PROD.ENGINE.v1
// ================================================================================

import { supabase } from '@/lib/supabase'
import { universalApi } from '@/lib/universal-api'

// ================================================================================
// CONVERSION INTERFACES
// ================================================================================

export interface ProgressiveData {
  organizationData: {
    name: string
    type: string
    address?: string
    phone?: string
    email?: string
    taxId?: string
    settings: Record<string, any>
  }
  userData: {
    name: string
    email: string
    role: string
    preferences: Record<string, any>
  }
  businessData: {
    customers: any[]
    products: any[]
    services: any[]
    transactions: any[]
    appointments?: any[]
    inventory?: any[]
    settings: Record<string, any>
  }
  uiCustomizations: {
    theme: Record<string, any>
    layouts: Record<string, any>
    preferences: Record<string, any>
    branding: Record<string, any>
  }
}

export interface ConversionResult {
  success: boolean
  organizationId: string
  userId: string
  dataMapping: {
    customers: Record<string, string>
    products: Record<string, string>
    services: Record<string, string>
    transactions: Record<string, string>
  }
  preservedFeatures: string[]
  migrationSummary: {
    entitiesCreated: number
    transactionsProcessed: number
    relationshipsEstablished: number
    customizationsApplied: number
  }
  errors: string[]
  warnings: string[]
}

// ================================================================================
// PROGRESSIVE DATA EXTRACTOR
// ================================================================================

export class ProgressiveDataExtractor {
  
  /**
   * Extracts all data from progressive app's IndexedDB storage
   */
  async extractProgressiveData(): Promise<ProgressiveData> {
    try {
      // Extract from IndexedDB (browser-based storage)
      const data: ProgressiveData = {
        organizationData: await this.extractOrganizationData(),
        userData: await this.extractUserData(),
        businessData: await this.extractBusinessData(),
        uiCustomizations: await this.extractUICustomizations()
      }

      console.log('📦 Progressive data extracted successfully:', {
        customers: data.businessData.customers.length,
        products: data.businessData.products.length,
        services: data.businessData.services.length,
        transactions: data.businessData.transactions.length
      })

      return data
    } catch (error) {
      console.error('❌ Progressive data extraction failed:', error)
      throw new Error(`Failed to extract progressive data: ${error.message}`)
    }
  }

  private async extractOrganizationData() {
    // Extract organization data from progressive app
    const orgData = localStorage.getItem('hera_progressive_organization')
    if (orgData) {
      return JSON.parse(orgData)
    }
    
    // Default organization data
    return {
      name: 'Progressive Salon',
      type: 'salon',
      settings: {
        currency: 'USD',
        taxRate: 0.08,
        timezone: 'America/New_York'
      }
    }
  }

  private async extractUserData() {
    // Extract user data from progressive app
    const userData = localStorage.getItem('hera_progressive_user')
    if (userData) {
      return JSON.parse(userData)
    }
    
    // Default user data
    return {
      name: 'Salon Owner',
      email: 'owner@progressivesalon.com',
      role: 'owner',
      preferences: {
        dashboardLayout: 'default',
        notifications: true
      }
    }
  }

  private async extractBusinessData() {
    // Extract business data from progressive app storage
    const businessData = {
      customers: JSON.parse(localStorage.getItem('hera_progressive_customers') || '[]'),
      products: JSON.parse(localStorage.getItem('hera_progressive_products') || '[]'),
      services: JSON.parse(localStorage.getItem('hera_progressive_services') || '[]'),
      transactions: JSON.parse(localStorage.getItem('hera_progressive_transactions') || '[]'),
      appointments: JSON.parse(localStorage.getItem('hera_progressive_appointments') || '[]'),
      inventory: JSON.parse(localStorage.getItem('hera_progressive_inventory') || '[]'),
      settings: JSON.parse(localStorage.getItem('hera_progressive_settings') || '{}')
    }

    return businessData
  }

  private async extractUICustomizations() {
    // Extract UI customizations that need to be preserved
    return {
      theme: JSON.parse(localStorage.getItem('hera_progressive_theme') || '{}'),
      layouts: JSON.parse(localStorage.getItem('hera_progressive_layouts') || '{}'),
      preferences: JSON.parse(localStorage.getItem('hera_progressive_preferences') || '{}'),
      branding: JSON.parse(localStorage.getItem('hera_progressive_branding') || '{}')
    }
  }
}

// ================================================================================
// PRODUCTION CONVERTER
// ================================================================================

export class ProductionConverter {
  private dataMapping: Record<string, Record<string, string>> = {
    customers: {},
    products: {},
    services: {},
    transactions: {}
  }

  /**
   * Converts progressive data to production Supabase system
   */
  async convertToProduction(progressiveData: ProgressiveData): Promise<ConversionResult> {
    try {
      console.log('🔄 Starting progressive-to-production conversion...')
      
      const result: ConversionResult = {
        success: false,
        organizationId: '',
        userId: '',
        dataMapping: this.dataMapping,
        preservedFeatures: [],
        migrationSummary: {
          entitiesCreated: 0,
          transactionsProcessed: 0,
          relationshipsEstablished: 0,
          customizationsApplied: 0
        },
        errors: [],
        warnings: []
      }

      // Step 1: Create Production Organization
      const organization = await this.createProductionOrganization(progressiveData.organizationData)
      result.organizationId = organization.id
      console.log('✅ Organization created:', organization.name)

      // Step 2: Create Production User
      const user = await this.createProductionUser(progressiveData.userData, organization.id)
      result.userId = user.id
      console.log('✅ User created:', user.email)

      // Step 3: Migrate Business Entities
      await this.migrateBizEntities(progressiveData.businessData, organization.id, result)
      
      // Step 4: Preserve UI Customizations
      await this.preserveUICustomizations(progressiveData.uiCustomizations, organization.id, result)

      // Step 5: Create Relationships
      await this.establishRelationships(progressiveData.businessData, result)

      // Step 6: Validate Data Integrity
      await this.validateDataIntegrity(result)

      result.success = true
      console.log('🎉 Progressive-to-production conversion completed successfully!')
      
      return result

    } catch (error) {
      console.error('❌ Conversion failed:', error)
      throw new Error(`Conversion failed: ${error.message}`)
    }
  }

  private async createProductionOrganization(orgData: any) {
    // Create organization in universal tables
    const organization = await universalApi.createEntity({
      entity_type: 'organization',
      entity_name: orgData.name,
      entity_code: `ORG-${Date.now()}`,
      smart_code: 'HERA.ORG.SALON.PROD.v1',
      metadata: {
        business_type: orgData.type,
        settings: orgData.settings,
        converted_from: 'progressive',
        conversion_date: new Date().toISOString()
      }
    })

    // Also create in core_organizations for multi-tenancy
    const { data: coreOrg } = await supabase
      .from('core_organizations')
      .insert({
        organization_name: orgData.name,
        organization_type: orgData.type,
        settings: orgData.settings,
        metadata: {
          entity_id: organization.id,
          converted_from: 'progressive'
        }
      })
      .select()
      .single()

    return { ...organization, core_org_id: coreOrg.id }
  }

  private async createProductionUser(userData: any, organizationId: string) {
    // Create user entity in universal tables
    const userEntity = await universalApi.createEntity({
      entity_type: 'user',
      entity_name: userData.name,
      entity_code: `USER-${Date.now()}`,
      smart_code: 'HERA.USER.SALON.OWNER.v1',
      organization_id: organizationId,
      metadata: {
        email: userData.email,
        role: userData.role,
        preferences: userData.preferences,
        converted_from: 'progressive'
      }
    })

    return userEntity
  }

  private async migrateBizEntities(businessData: any, organizationId: string, result: ConversionResult) {
    // Migrate Customers
    for (const customer of businessData.customers) {
      const entity = await universalApi.createEntity({
        entity_type: 'customer',
        entity_name: customer.name,
        entity_code: customer.code || `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        organization_id: organizationId,
        smart_code: 'HERA.CRM.CUST.SALON.v1',
        metadata: {
          ...customer,
          converted_from: 'progressive',
          original_id: customer.id
        }
      })
      this.dataMapping.customers[customer.id] = entity.id
      result.migrationSummary.entitiesCreated++
    }
    console.log(`✅ Migrated ${businessData.customers.length} customers`)

    // Migrate Services
    for (const service of businessData.services) {
      const entity = await universalApi.createEntity({
        entity_type: 'service',
        entity_name: service.name,
        entity_code: service.code || `SVC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        organization_id: organizationId,
        smart_code: 'HERA.SALON.SVC.OFFER.v1',
        metadata: {
          ...service,
          converted_from: 'progressive',
          original_id: service.id,
          price: service.price,
          duration: service.duration,
          provider: service.provider
        }
      })
      this.dataMapping.services[service.id] = entity.id
      result.migrationSummary.entitiesCreated++
    }
    console.log(`✅ Migrated ${businessData.services.length} services`)

    // Migrate Products
    for (const product of businessData.products) {
      const entity = await universalApi.createEntity({
        entity_type: 'product',
        entity_name: product.name,
        entity_code: product.code || `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        organization_id: organizationId,
        smart_code: 'HERA.SALON.PROD.RETAIL.v1',
        metadata: {
          ...product,
          converted_from: 'progressive',
          original_id: product.id,
          price: product.price,
          stock: product.stock,
          brand: product.brand
        }
      })
      this.dataMapping.products[product.id] = entity.id
      result.migrationSummary.entitiesCreated++
    }
    console.log(`✅ Migrated ${businessData.products.length} products`)

    // Migrate Transactions
    for (const transaction of businessData.transactions) {
      const universalTxn = await universalApi.createTransaction({
        organization_id: organizationId,
        transaction_type: 'sale',
        transaction_date: transaction.date || new Date().toISOString(),
        reference_entity_id: this.dataMapping.customers[transaction.customer_id],
        total_amount: transaction.total,
        smart_code: 'HERA.SALON.TXN.SALE.v1',
        metadata: {
          ...transaction,
          converted_from: 'progressive',
          original_id: transaction.id,
          payment_method: transaction.payment_method
        },
        lines: transaction.items?.map((item: any, index: number) => ({
          entity_id: this.dataMapping.services[item.id] || this.dataMapping.products[item.id],
          line_description: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          line_amount: item.price * item.quantity,
          line_order: index + 1
        })) || []
      })
      this.dataMapping.transactions[transaction.id] = universalTxn.id
      result.migrationSummary.transactionsProcessed++
    }
    console.log(`✅ Migrated ${businessData.transactions.length} transactions`)
  }

  private async preserveUICustomizations(uiData: any, organizationId: string, result: ConversionResult) {
    // Preserve theme customizations
    if (Object.keys(uiData.theme).length > 0) {
      await universalApi.setDynamicField(organizationId, 'ui_theme', JSON.stringify(uiData.theme))
      result.preservedFeatures.push('Theme Customization')
      result.migrationSummary.customizationsApplied++
    }

    // Preserve layout preferences
    if (Object.keys(uiData.layouts).length > 0) {
      await universalApi.setDynamicField(organizationId, 'ui_layouts', JSON.stringify(uiData.layouts))
      result.preservedFeatures.push('Layout Preferences')
      result.migrationSummary.customizationsApplied++
    }

    // Preserve branding
    if (Object.keys(uiData.branding).length > 0) {
      await universalApi.setDynamicField(organizationId, 'branding', JSON.stringify(uiData.branding))
      result.preservedFeatures.push('Brand Customization')
      result.migrationSummary.customizationsApplied++
    }

    console.log(`✅ Preserved ${result.preservedFeatures.length} UI customizations`)
  }

  private async establishRelationships(businessData: any, result: ConversionResult) {
    // Create customer-transaction relationships
    for (const transaction of businessData.transactions) {
      if (transaction.customer_id && this.dataMapping.customers[transaction.customer_id]) {
        await universalApi.createRelationship(
          this.dataMapping.customers[transaction.customer_id],
          this.dataMapping.transactions[transaction.id],
          'customer_transaction',
          'HERA.REL.CUST.TXN.SALE.v1'
        )
        result.migrationSummary.relationshipsEstablished++
      }
    }

    console.log(`✅ Established ${result.migrationSummary.relationshipsEstablished} relationships`)
  }

  private async validateDataIntegrity(result: ConversionResult) {
    // Validate that all entities were created
    const entityCounts = await this.getEntityCounts(result.organizationId)
    
    if (entityCounts.customers !== Object.keys(this.dataMapping.customers).length) {
      result.warnings.push(`Customer count mismatch: Expected ${Object.keys(this.dataMapping.customers).length}, got ${entityCounts.customers}`)
    }
    
    if (entityCounts.transactions !== Object.keys(this.dataMapping.transactions).length) {
      result.warnings.push(`Transaction count mismatch: Expected ${Object.keys(this.dataMapping.transactions).length}, got ${entityCounts.transactions}`)
    }

    console.log('✅ Data integrity validation completed')
  }

  private async getEntityCounts(organizationId: string) {
    // Get counts from universal tables
    const customers = await universalApi.query('core_entities', {
      organization_id: organizationId,
      entity_type: 'customer'
    })
    
    const transactions = await universalApi.query('universal_transactions', {
      organization_id: organizationId
    })

    return {
      customers: customers.length,
      transactions: transactions.length
    }
  }
}

// ================================================================================
// CONVERSION ORCHESTRATOR
// ================================================================================

export class ConversionOrchestrator {
  private extractor: ProgressiveDataExtractor
  private converter: ProductionConverter

  constructor() {
    this.extractor = new ProgressiveDataExtractor()
    this.converter = new ProductionConverter()
  }

  /**
   * Main conversion workflow
   */
  async convertProgressiveToProduction(): Promise<ConversionResult> {
    try {
      console.log('🚀 Starting Progressive-to-Production Conversion Process...')
      
      // Step 1: Extract progressive data
      const progressiveData = await this.extractor.extractProgressiveData()
      
      // Step 2: Convert to production
      const result = await this.converter.convertToProduction(progressiveData)
      
      // Step 3: Generate conversion report
      await this.generateConversionReport(result)
      
      return result

    } catch (error) {
      console.error('❌ Conversion orchestration failed:', error)
      throw error
    }
  }

  private async generateConversionReport(result: ConversionResult) {
    const report = {
      conversion_id: `CONV-${Date.now()}`,
      timestamp: new Date().toISOString(),
      success: result.success,
      organization_id: result.organizationId,
      user_id: result.userId,
      summary: result.migrationSummary,
      preserved_features: result.preservedFeatures,
      errors: result.errors,
      warnings: result.warnings
    }

    // Save conversion report
    localStorage.setItem('hera_conversion_report', JSON.stringify(report))
    console.log('📄 Conversion report generated:', report.conversion_id)
  }
}

// ================================================================================
// EXPORT MAIN FUNCTIONS
// ================================================================================

export async function convertProgressiveToProduction(): Promise<ConversionResult> {
  const orchestrator = new ConversionOrchestrator()
  return await orchestrator.convertProgressiveToProduction()
}

export function isProgressiveApp(): boolean {
  return localStorage.getItem('hera_progressive_mode') === 'true'
}

export function getConversionStatus() {
  const report = localStorage.getItem('hera_conversion_report')
  return report ? JSON.parse(report) : null
}