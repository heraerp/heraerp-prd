/**
 * Progressive to Production Data Migration Script
 * Migrates salon progressive data from IndexedDB to Universal API
 */

import { universalApi } from '../src/lib/universal-api'

interface ProgressiveCustomer {
  id: number
  name: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  preferences: string
  notes: string
  totalSpent: number
  visits: number
  lastVisit: string
  favoriteServices: string[]
  loyaltyTier: string
  createdDate: string
}

interface MigrationResult {
  success: boolean
  customerId?: string
  error?: string
  originalData: ProgressiveCustomer
}

export class ProgressiveDataMigrator {
  private organizationId: string
  private results: MigrationResult[] = []

  constructor(organizationId: string) {
    this.organizationId = organizationId
    universalApi.setOrganizationId(organizationId)
  }

  /**
   * Get progressive data from IndexedDB or local storage
   */
  async getProgressiveData(): Promise<ProgressiveCustomer[]> {
    // This would normally read from IndexedDB
    // For demo, returning sample data
    return [
      {
        id: 1,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '(555) 123-4567',
        address: '123 Main St, City, ST 12345',
        dateOfBirth: '1992-05-15',
        preferences: 'Prefers Emma as stylist, allergic to sulfates',
        notes: 'Regular customer, always books monthly appointments',
        totalSpent: 1240,
        visits: 12,
        lastVisit: '2025-01-05',
        favoriteServices: ['Haircut & Style', 'Hair Color'],
        loyaltyTier: 'Gold',
        createdDate: '2024-06-15'
      },
      {
        id: 2,
        name: 'Mike Chen',
        email: 'mike.chen@email.com',
        phone: '(555) 987-6543',
        address: '456 Oak Ave, City, ST 12345',
        dateOfBirth: '1988-09-22',
        preferences: 'Quick service, prefers David',
        notes: 'Busy schedule, likes early morning appointments',
        totalSpent: 380,
        visits: 8,
        lastVisit: '2025-01-02',
        favoriteServices: ['Beard Trim', 'Quick Cut'],
        loyaltyTier: 'Silver',
        createdDate: '2024-08-20'
      },
      {
        id: 3,
        name: 'Lisa Wang',
        email: 'lisa.wang@email.com',
        phone: '(555) 456-7890',
        address: '789 Pine St, City, ST 12345',
        dateOfBirth: '1995-12-08',
        preferences: 'Loves trying new colors, experimental styles',
        notes: 'Social media influencer, takes lots of photos',
        totalSpent: 2150,
        visits: 18,
        lastVisit: '2025-01-08',
        favoriteServices: ['Hair Color', 'Styling', 'Treatment'],
        loyaltyTier: 'Platinum',
        createdDate: '2024-03-10'
      }
    ]
  }

  /**
   * Migrate a single customer
   */
  async migrateCustomer(customer: ProgressiveCustomer): Promise<MigrationResult> {
    try {
      console.log(`Migrating customer: ${customer.name}`)

      // 1. Create customer entity
      const entityRes = await universalApi.createEntity({
        entity_type: 'customer',
        entity_name: customer.name,
        entity_code: `MIGRATED-CUST-${customer.id}`,
        status: 'active',
        smart_code: 'HERA.SALON.CUSTOMER.MIGRATED.v1',
        metadata: {
          migrated_from_progressive: true,
          original_id: customer.id,
          migration_date: new Date().toISOString()
        }
      }, this.organizationId)

      if (!entityRes.success) {
        throw new Error(entityRes.error || 'Failed to create entity')
      }

      const customerId = entityRes.data?.id

      // 2. Add all dynamic fields
      const fieldPromises = []

      // Basic fields
      fieldPromises.push(
        universalApi.setDynamicField(customerId, 'email', customer.email, 'text', this.organizationId),
        universalApi.setDynamicField(customerId, 'phone', customer.phone, 'text', this.organizationId)
      )

      if (customer.address) {
        fieldPromises.push(
          universalApi.setDynamicField(customerId, 'address', customer.address, 'text', this.organizationId)
        )
      }

      if (customer.dateOfBirth) {
        fieldPromises.push(
          universalApi.setDynamicField(customerId, 'date_of_birth', customer.dateOfBirth, 'date', this.organizationId)
        )
      }

      if (customer.preferences) {
        fieldPromises.push(
          universalApi.setDynamicField(customerId, 'preferences', customer.preferences, 'text', this.organizationId)
        )
      }

      if (customer.notes) {
        fieldPromises.push(
          universalApi.setDynamicField(customerId, 'notes', customer.notes, 'text', this.organizationId)
        )
      }

      await Promise.all(fieldPromises)

      // 3. Create loyalty tier status
      await this.assignLoyaltyTier(customerId, customer.loyaltyTier)

      // 4. Create favorite services relationships
      if (customer.favoriteServices.length > 0) {
        await this.createFavoriteServices(customerId, customer.favoriteServices)
      }

      // 5. Create historical transaction if there's spending history
      if (customer.totalSpent > 0) {
        await this.createHistoricalTransaction(customerId, customer)
      }

      console.log(`✅ Successfully migrated: ${customer.name}`)
      
      return {
        success: true,
        customerId,
        originalData: customer
      }

    } catch (error) {
      console.error(`❌ Failed to migrate ${customer.name}:`, error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalData: customer
      }
    }
  }

  /**
   * Assign loyalty tier via relationships
   */
  private async assignLoyaltyTier(customerId: string, tier: string) {
    // First, create or find the loyalty status entity
    const statusCode = `LOYALTY-${tier.toUpperCase()}`
    
    // Check if status entity exists
    const statusEntities = await universalApi.getEntities('workflow_status', this.organizationId)
    let statusEntity = statusEntities.data?.find(e => e.entity_code === statusCode)

    if (!statusEntity) {
      // Create loyalty status entity
      const statusRes = await universalApi.createEntity({
        entity_type: 'workflow_status',
        entity_name: `${tier} Loyalty Status`,
        entity_code: statusCode,
        smart_code: 'HERA.SALON.LOYALTY.STATUS.v1',
        metadata: {
          tier_name: tier,
          color_code: this.getTierColor(tier),
          is_loyalty_tier: true
        }
      }, this.organizationId)

      if (!statusRes.success) {
        throw new Error(`Failed to create loyalty status: ${statusRes.error}`)
      }

      statusEntity = statusRes.data
    }

    // Create relationship
    const relRes = await universalApi.createRelationship({
      parent_entity_id: customerId,
      child_entity_id: statusEntity.id,
      relationship_type: 'has_status',
      relationship_metadata: {
        status_type: 'loyalty_tier',
        status_name: tier,
        assigned_at: new Date().toISOString(),
        assigned_by: 'migration_script'
      }
    }, this.organizationId)

    if (!relRes.success) {
      throw new Error(`Failed to assign loyalty tier: ${relRes.error}`)
    }
  }

  /**
   * Create favorite service relationships
   */
  private async createFavoriteServices(customerId: string, services: string[]) {
    for (const serviceName of services) {
      // Check if service entity exists
      const serviceEntities = await universalApi.getEntities('service', this.organizationId)
      let serviceEntity = serviceEntities.data?.find(e => e.entity_name === serviceName)

      if (!serviceEntity) {
        // Create service entity
        const serviceRes = await universalApi.createEntity({
          entity_type: 'service',
          entity_name: serviceName,
          entity_code: `SERVICE-${serviceName.replace(/\s+/g, '-').toUpperCase()}`,
          smart_code: 'HERA.SALON.SERVICE.v1',
          status: 'active'
        }, this.organizationId)

        if (!serviceRes.success) {
          console.warn(`Failed to create service ${serviceName}:`, serviceRes.error)
          continue
        }

        serviceEntity = serviceRes.data
      }

      // Create favorite relationship
      await universalApi.createRelationship({
        parent_entity_id: customerId,
        child_entity_id: serviceEntity.id,
        relationship_type: 'favorite_service',
        relationship_metadata: {
          service_name: serviceName,
          marked_favorite_at: new Date().toISOString()
        }
      }, this.organizationId)
    }
  }

  /**
   * Create historical transaction to preserve spending data
   */
  private async createHistoricalTransaction(customerId: string, customer: ProgressiveCustomer) {
    const transRes = await universalApi.createTransaction({
      transaction_type: 'historical_sales',
      transaction_date: customer.lastVisit || customer.createdDate,
      reference_number: `MIGRATED-HIST-${customer.id}`,
      total_amount: customer.totalSpent,
      status: 'completed',
      smart_code: 'HERA.SALON.SALES.HISTORICAL.v1',
      metadata: {
        migrated_from_progressive: true,
        original_customer_id: customer.id,
        visit_count: customer.visits,
        average_spend: customer.totalSpent / (customer.visits || 1),
        migration_note: 'Historical data migrated from progressive app'
      }
    }, this.organizationId)

    if (!transRes.success) {
      console.warn(`Failed to create historical transaction for ${customer.name}:`, transRes.error)
      return
    }

    // Link transaction to customer
    await universalApi.createRelationship({
      parent_entity_id: transRes.data.id,
      child_entity_id: customerId,
      relationship_type: 'customer_transaction',
      relationship_metadata: {
        transaction_type: 'historical_sales',
        customer_name: customer.name
      }
    }, this.organizationId)
  }

  private getTierColor(tier: string): string {
    switch (tier) {
      case 'Platinum': return '#9333ea'
      case 'Gold': return '#eab308'
      case 'Silver': return '#6b7280'
      default: return '#f97316'
    }
  }

  /**
   * Run the complete migration
   */
  async runMigration(): Promise<{
    total: number
    successful: number
    failed: number
    results: MigrationResult[]
  }> {
    console.log('🚀 Starting Progressive to Production Migration...\n')

    // Get all progressive data
    const progressiveCustomers = await this.getProgressiveData()
    console.log(`Found ${progressiveCustomers.length} customers to migrate\n`)

    // Migrate each customer
    for (const customer of progressiveCustomers) {
      const result = await this.migrateCustomer(customer)
      this.results.push(result)
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Summary
    const successful = this.results.filter(r => r.success).length
    const failed = this.results.filter(r => !r.success).length

    console.log('\n📊 Migration Summary:')
    console.log(`✅ Successful: ${successful}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📋 Total: ${progressiveCustomers.length}`)

    if (failed > 0) {
      console.log('\n❌ Failed Migrations:')
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`- ${r.originalData.name}: ${r.error}`)
        })
    }

    return {
      total: progressiveCustomers.length,
      successful,
      failed,
      results: this.results
    }
  }
}

// Example usage:
// const migrator = new ProgressiveDataMigrator('your-org-id')
// const results = await migrator.runMigration()