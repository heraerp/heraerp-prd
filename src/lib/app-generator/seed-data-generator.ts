/**
 * HERA Seed Data & Demo Setup Generator v2.4
 * 
 * Generates realistic seed data and complete demo environments
 * Supports: multi-tenant data, realistic business scenarios, performance testing data
 * Compatible with jewelry ERP and all YAML-generated applications
 */

import { EnhancedAppConfig } from './enhanced-yaml-parser'
import { HERAAppMapping } from './yaml-hera-mapper'

// Seed data configuration
export interface SeedDataConfig {
  organization_id: string
  environment: 'demo' | 'development' | 'testing' | 'performance'
  data_volume: 'minimal' | 'realistic' | 'large' | 'stress_test'
  locale: 'en_US' | 'en_IN' | 'hi_IN'
  industry_context: string
  include_relationships: boolean
  include_transactions: boolean
  performance_test_data: boolean
}

// Generated seed data
export interface GeneratedSeedData {
  organization_setup: OrganizationSeedData
  entity_data: EntitySeedData[]
  transaction_data: TransactionSeedData[]
  relationship_data: RelationshipSeedData[]
  demo_scenarios: DemoScenario[]
  performance_data: PerformanceTestData
  setup_scripts: SetupScript[]
}

export interface OrganizationSeedData {
  organization_id: string
  organization_name: string
  organization_type: string
  settings: Record<string, any>
  branding: Record<string, any>
  demo_users: DemoUser[]
}

export interface DemoUser {
  user_id: string
  email: string
  display_name: string
  role: string
  permissions: string[]
  demo_password: string
}

export interface EntitySeedData {
  entity_type: string
  entities: Array<{
    entity_code: string
    entity_name: string
    smart_code: string
    dynamic_fields: Record<string, any>
    metadata: Record<string, any>
  }>
  count: number
}

export interface TransactionSeedData {
  transaction_type: string
  transactions: Array<{
    transaction_code: string
    header_data: Record<string, any>
    lines: Array<Record<string, any>>
    calculated_totals: Record<string, any>
  }>
  count: number
}

export interface RelationshipSeedData {
  relationship_type: string
  relationships: Array<{
    source_entity_code: string
    target_entity_code: string
    relationship_data: Record<string, any>
  }>
  count: number
}

export interface DemoScenario {
  scenario_id: string
  scenario_name: string
  description: string
  setup_steps: string[]
  demo_script: string
  expected_outcomes: string[]
  test_data: Record<string, any>
}

export interface PerformanceTestData {
  large_datasets: Array<{
    entity_type: string
    record_count: number
    data_file: string
  }>
  stress_test_scenarios: Array<{
    scenario_name: string
    concurrent_users: number
    operations_per_minute: number
    duration_minutes: number
  }>
}

export interface SetupScript {
  script_name: string
  script_type: 'sql' | 'typescript' | 'bash'
  script_content: string
  execution_order: number
  dependencies: string[]
}

export class SeedDataGenerator {
  private appConfig: EnhancedAppConfig
  private heraMapping: HERAAppMapping
  private seedConfig: SeedDataConfig
  
  constructor(appConfig: EnhancedAppConfig, heraMapping: HERAAppMapping, seedConfig: SeedDataConfig) {
    this.appConfig = appConfig
    this.heraMapping = heraMapping
    this.seedConfig = seedConfig
  }
  
  /**
   * Generate complete seed data and demo setup
   */
  generateCompleteSeedData(): GeneratedSeedData {
    console.log(`🌱 Generating seed data for ${this.seedConfig.environment} environment...`)
    
    // Generate organization setup
    const organizationSetup = this.generateOrganizationSetup()
    
    // Generate entity seed data
    const entityData = this.generateEntitySeedData()
    
    // Generate transaction seed data
    const transactionData = this.seedConfig.include_transactions ? 
      this.generateTransactionSeedData() : []
    
    // Generate relationship data
    const relationshipData = this.seedConfig.include_relationships ? 
      this.generateRelationshipSeedData() : []
    
    // Generate demo scenarios
    const demoScenarios = this.generateDemoScenarios()
    
    // Generate performance test data
    const performanceData = this.seedConfig.performance_test_data ? 
      this.generatePerformanceTestData() : {} as PerformanceTestData
    
    // Generate setup scripts
    const setupScripts = this.generateSetupScripts(
      organizationSetup,
      entityData,
      transactionData,
      relationshipData
    )
    
    return {
      organization_setup: organizationSetup,
      entity_data: entityData,
      transaction_data: transactionData,
      relationship_data: relationshipData,
      demo_scenarios: demoScenarios,
      performance_data: performanceData,
      setup_scripts: setupScripts
    }
  }
  
  /**
   * Generate organization setup data
   */
  private generateOrganizationSetup(): OrganizationSeedData {
    const demoUsers = this.generateDemoUsers()
    
    return {
      organization_id: this.seedConfig.organization_id,
      organization_name: this.getOrganizationName(),
      organization_type: this.appConfig.app.industry,
      settings: {
        fiscal_calendar: this.appConfig.app.settings?.fiscal_calendar || 'april_to_march',
        base_currency: this.appConfig.app.settings?.base_currency || 'INR',
        time_zone: this.appConfig.app.settings?.time_zone || 'Asia/Kolkata',
        tax_enabled: this.appConfig.app.settings?.tax_enabled || true,
        demo_mode: true,
        created_at: new Date().toISOString()
      },
      branding: {
        company_name: this.getOrganizationName(),
        logo_url: '/demo-assets/logo.png',
        primary_color: '#8B5CF6',
        secondary_color: '#EC4899',
        theme: 'jewelry_luxury'
      },
      demo_users: demoUsers
    }
  }
  
  /**
   * Generate demo users with different roles
   */
  private generateDemoUsers(): DemoUser[] {
    const users: DemoUser[] = []
    
    // Admin user
    users.push({
      user_id: `demo-admin-${this.seedConfig.organization_id}`,
      email: 'admin@demo.jewelry-erp.com',
      display_name: 'Demo Administrator',
      role: 'admin',
      permissions: ['all'],
      demo_password: 'Demo123!'
    })
    
    // Manager user
    users.push({
      user_id: `demo-manager-${this.seedConfig.organization_id}`,
      email: 'manager@demo.jewelry-erp.com',
      display_name: 'Store Manager',
      role: 'manager',
      permissions: ['read_all', 'write_transactions', 'approve_sales'],
      demo_password: 'Demo123!'
    })
    
    // Sales staff
    users.push({
      user_id: `demo-sales-${this.seedConfig.organization_id}`,
      email: 'sales@demo.jewelry-erp.com',
      display_name: 'Sales Associate',
      role: 'sales',
      permissions: ['read_customers', 'write_sales', 'read_products'],
      demo_password: 'Demo123!'
    })
    
    // Accountant
    users.push({
      user_id: `demo-accountant-${this.seedConfig.organization_id}`,
      email: 'accounts@demo.jewelry-erp.com',
      display_name: 'Accountant',
      role: 'accountant',
      permissions: ['read_financial', 'write_transactions', 'generate_reports'],
      demo_password: 'Demo123!'
    })
    
    return users
  }
  
  /**
   * Generate entity seed data
   */
  private generateEntitySeedData(): EntitySeedData[] {
    const entityData: EntitySeedData[] = []
    
    for (const entity of this.heraMapping.entities) {
      const count = this.getEntityCount(entity.entity_type)
      const entities = this.generateEntitiesForType(entity, count)
      
      entityData.push({
        entity_type: entity.entity_type,
        entities: entities,
        count: count
      })
    }
    
    return entityData
  }
  
  /**
   * Generate entities for specific type
   */
  private generateEntitiesForType(entity: any, count: number): any[] {
    const entities = []
    
    for (let i = 1; i <= count; i++) {
      const entityData = {
        entity_code: this.generateEntityCode(entity.entity_type, i),
        entity_name: this.generateEntityName(entity.entity_type, i),
        smart_code: `${entity.smart_code}.DEMO.v1`,
        dynamic_fields: this.generateDynamicFields(entity),
        metadata: {
          demo_data: true,
          generated_at: new Date().toISOString(),
          seed_index: i
        }
      }
      
      entities.push(entityData)
    }
    
    return entities
  }
  
  /**
   * Generate realistic dynamic field data
   */
  private generateDynamicFields(entity: any): Record<string, any> {
    const fields: Record<string, any> = {}
    
    for (const field of entity.dynamic_fields) {
      fields[field.field_name] = this.generateFieldValue(field, entity.entity_type)
    }
    
    return fields
  }
  
  /**
   * Generate realistic field values based on entity type and field name
   */
  private generateFieldValue(field: any, entityType: string): any {
    // Jewelry-specific realistic data
    if (entityType === 'CUSTOMER') {
      return this.generateCustomerFieldValue(field)
    } else if (entityType === 'PRODUCT') {
      return this.generateProductFieldValue(field)
    } else if (entityType === 'MATERIAL') {
      return this.generateMaterialFieldValue(field)
    } else if (entityType === 'VENDOR') {
      return this.generateVendorFieldValue(field)
    } else if (entityType === 'STAFF') {
      return this.generateStaffFieldValue(field)
    }
    
    // Generic field value generation
    return this.generateGenericFieldValue(field)
  }
  
  /**
   * Generate customer field values
   */
  private generateCustomerFieldValue(field: any): any {
    const customerNames = [
      'Priya Sharma', 'Rajesh Kumar', 'Anita Patel', 'Sanjay Gupta', 'Meera Singh',
      'Vikram Agarwal', 'Pooja Jain', 'Rahul Verma', 'Kavita Reddy', 'Amit Trivedi'
    ]
    
    const phoneNumbers = [
      '+919876543210', '+919123456789', '+919987654321', '+919456789123', '+919789012345'
    ]
    
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata']
    
    switch (field.field_name) {
      case 'customer_name':
        return this.randomChoice(customerNames)
      case 'phone':
        return this.randomChoice(phoneNumbers)
      case 'email':
        const name = this.randomChoice(customerNames).toLowerCase().replace(' ', '.')
        return `${name}@email.com`
      case 'city':
        return this.randomChoice(cities)
      case 'customer_category':
        return this.randomChoice(['retail', 'wholesale', 'premium', 'vip'])
      case 'credit_limit':
        return this.randomBetween(25000, 500000)
      case 'pan_number':
        return `ABCDE${this.randomBetween(1000, 9999)}F`
      case 'aadhar_number':
        return `${this.randomBetween(100000000000, 999999999999)}`
      default:
        return this.generateGenericFieldValue(field)
    }
  }
  
  /**
   * Generate product field values
   */
  private generateProductFieldValue(field: any): any {
    const productTypes = ['Ring', 'Necklace', 'Earrings', 'Bracelet', 'Pendant', 'Chain', 'Bangle']
    const designs = ['Classic', 'Modern', 'Traditional', 'Contemporary', 'Vintage', 'Ethnic']
    const metals = ['Gold', 'Silver', 'Platinum']
    
    switch (field.field_name) {
      case 'product_name':
        return `${this.randomChoice(designs)} ${this.randomChoice(productTypes)}`
      case 'product_category':
        return this.randomChoice(['ring', 'necklace', 'earring', 'bracelet', 'pendant', 'chain', 'bangle'])
      case 'metal_type':
        return this.randomChoice(['gold', 'silver', 'platinum'])
      case 'metal_weight':
        return this.randomBetween(2, 50, 2)
      case 'stone_weight':
        return this.randomBetween(0.5, 5, 2)
      case 'making_charges':
        return this.randomBetween(1000, 15000)
      case 'design_code':
        return `DSN${this.randomBetween(1000, 9999)}`
      default:
        return this.generateGenericFieldValue(field)
    }
  }
  
  /**
   * Generate material field values
   */
  private generateMaterialFieldValue(field: any): any {
    const goldPurities = [18, 20, 22, 24]
    const materialTypes = ['gold', 'silver', 'platinum', 'diamond', 'gemstone']
    
    switch (field.field_name) {
      case 'material_name':
        return `${this.randomChoice(['Gold', 'Silver', 'Platinum'])} ${this.randomChoice(['Bar', 'Wire', 'Sheet'])}`
      case 'material_type':
        return this.randomChoice(materialTypes)
      case 'purity':
        return this.randomChoice(goldPurities)
      case 'current_rate':
        return this.randomBetween(4500, 6000)
      case 'hsn_code':
        return this.randomChoice(['7108', '7106', '7110', '7103'])
      case 'stock_quantity':
        return this.randomBetween(100, 10000, 2)
      default:
        return this.generateGenericFieldValue(field)
    }
  }
  
  /**
   * Generate vendor field values
   */
  private generateVendorFieldValue(field: any): any {
    const vendorNames = [
      'Mumbai Gold Suppliers', 'Delhi Diamond House', 'Bangalore Gems Ltd', 
      'Chennai Silver Works', 'Hyderabad Jewelry Tools'
    ]
    
    const contactPersons = [
      'Mr. Rajesh Agarwal', 'Ms. Priya Jain', 'Mr. Suresh Kumar', 'Ms. Anita Sharma'
    ]
    
    switch (field.field_name) {
      case 'vendor_name':
        return this.randomChoice(vendorNames)
      case 'contact_person':
        return this.randomChoice(contactPersons)
      case 'gstin':
        return `27ABCDE${this.randomBetween(1000, 9999)}F1Z5`
      case 'vendor_category':
        return this.randomChoice(['gold_supplier', 'diamond_supplier', 'gemstone_supplier', 'tools', 'packaging'])
      case 'payment_terms':
        return this.randomChoice(['cash', 'credit_30', 'credit_60', 'advance'])
      default:
        return this.generateGenericFieldValue(field)
    }
  }
  
  /**
   * Generate staff field values
   */
  private generateStaffFieldValue(field: any): any {
    const staffNames = [
      'Ravi Kumar', 'Sunita Patel', 'Manoj Gupta', 'Kavya Reddy', 'Suresh Jain'
    ]
    
    switch (field.field_name) {
      case 'employee_name':
        return this.randomChoice(staffNames)
      case 'employee_id':
        return `EMP${this.randomBetween(1000, 9999)}`
      case 'department':
        return this.randomChoice(['sales', 'manufacturing', 'design', 'admin'])
      case 'role':
        return this.randomChoice(['manager', 'senior', 'junior', 'trainee'])
      case 'commission_rate':
        return this.randomBetween(1.5, 5, 1)
      default:
        return this.generateGenericFieldValue(field)
    }
  }
  
  /**
   * Generate generic field values
   */
  private generateGenericFieldValue(field: any): any {
    switch (field.field_type) {
      case 'text':
        return field.enum ? this.randomChoice(field.enum) : `Sample ${field.field_name}`
      case 'number':
        return this.randomBetween(field.min || 0, field.max || 1000)
      case 'boolean':
        return Math.random() > 0.5
      case 'date':
        return this.randomDate()
      case 'email':
        return `demo.${field.field_name}@jewelry-erp.com`
      case 'phone':
        return `+91987654${this.randomBetween(1000, 9999)}`
      default:
        return `Demo ${field.field_name}`
    }
  }
  
  /**
   * Generate transaction seed data
   */
  private generateTransactionSeedData(): TransactionSeedData[] {
    const transactionData: TransactionSeedData[] = []
    
    for (const transaction of this.heraMapping.transactions) {
      const count = this.getTransactionCount(transaction.transaction_type)
      const transactions = this.generateTransactionsForType(transaction, count)
      
      transactionData.push({
        transaction_type: transaction.transaction_type,
        transactions: transactions,
        count: count
      })
    }
    
    return transactionData
  }
  
  /**
   * Generate transactions for specific type
   */
  private generateTransactionsForType(transaction: any, count: number): any[] {
    const transactions = []
    
    for (let i = 1; i <= count; i++) {
      const txnData = {
        transaction_code: this.generateTransactionCode(transaction.transaction_type, i),
        header_data: this.generateTransactionHeader(transaction),
        lines: this.generateTransactionLines(transaction),
        calculated_totals: this.generateTransactionTotals()
      }
      
      transactions.push(txnData)
    }
    
    return transactions
  }
  
  /**
   * Generate demo scenarios
   */
  private generateDemoScenarios(): DemoScenario[] {
    const scenarios: DemoScenario[] = []
    
    // Jewelry sale scenario
    scenarios.push({
      scenario_id: 'jewelry-pos-sale',
      scenario_name: 'Complete Jewelry POS Sale',
      description: 'Demonstrates complete jewelry sale workflow with GST calculation',
      setup_steps: [
        'Login as sales user',
        'Navigate to POS Sale',
        'Select customer',
        'Add jewelry items',
        'Calculate pricing',
        'Process payment',
        'Print receipt'
      ],
      demo_script: this.generateJewelrySaleDemoScript(),
      expected_outcomes: [
        'Transaction created successfully',
        'GST calculated correctly',
        'Inventory updated',
        'Customer record updated',
        'Receipt generated'
      ],
      test_data: {
        customer_id: 'CUST_001',
        products: ['PROD_001', 'PROD_002'],
        payment_method: 'card',
        total_amount: 125000
      }
    })
    
    // Bank reconciliation scenario
    scenarios.push({
      scenario_id: 'bank-reconciliation',
      scenario_name: 'Automated Bank Reconciliation',
      description: 'Demonstrates automatic bank transaction matching',
      setup_steps: [
        'Upload bank statement',
        'Run reconciliation engine',
        'Review matches',
        'Approve high-confidence matches',
        'Investigate unmatched items'
      ],
      demo_script: this.generateBankReconciliationDemoScript(),
      expected_outcomes: [
        'Bank transactions imported',
        'Automatic matches found',
        'Confidence scores calculated',
        'Reconciliation report generated'
      ],
      test_data: {
        bank_file: 'demo-bank-statement.csv',
        expected_matches: 15,
        expected_confidence: 85
      }
    })
    
    // GST compliance scenario
    scenarios.push({
      scenario_id: 'gst-compliance',
      scenario_name: 'GST Return Generation',
      description: 'Demonstrates GST compliance and return generation',
      setup_steps: [
        'Navigate to GST module',
        'Select reporting period',
        'Generate GSTR-1',
        'Review calculations',
        'Export return file'
      ],
      demo_script: this.generateGSTComplianceDemoScript(),
      expected_outcomes: [
        'GSTR-1 generated',
        'Tax calculations verified',
        'Compliance status confirmed',
        'Return file exported'
      ],
      test_data: {
        period: '202401',
        expected_revenue: 5000000,
        expected_gst: 150000
      }
    })
    
    return scenarios
  }
  
  /**
   * Generate performance test data
   */
  private generatePerformanceTestData(): PerformanceTestData {
    return {
      large_datasets: [
        {
          entity_type: 'CUSTOMER',
          record_count: 10000,
          data_file: 'performance-customers.sql'
        },
        {
          entity_type: 'PRODUCT',
          record_count: 5000,
          data_file: 'performance-products.sql'
        },
        {
          entity_type: 'TRANSACTION',
          record_count: 25000,
          data_file: 'performance-transactions.sql'
        }
      ],
      stress_test_scenarios: [
        {
          scenario_name: 'High Volume Sales',
          concurrent_users: 50,
          operations_per_minute: 1000,
          duration_minutes: 10
        },
        {
          scenario_name: 'Bulk Data Import',
          concurrent_users: 5,
          operations_per_minute: 100,
          duration_minutes: 30
        },
        {
          scenario_name: 'Complex Reporting',
          concurrent_users: 20,
          operations_per_minute: 200,
          duration_minutes: 15
        }
      ]
    }
  }
  
  /**
   * Generate setup scripts
   */
  private generateSetupScripts(
    org: OrganizationSeedData,
    entities: EntitySeedData[],
    transactions: TransactionSeedData[],
    relationships: RelationshipSeedData[]
  ): SetupScript[] {
    const scripts: SetupScript[] = []
    
    // Organization setup script
    scripts.push({
      script_name: 'setup-organization',
      script_type: 'sql',
      script_content: this.generateOrganizationSetupSQL(org),
      execution_order: 1,
      dependencies: []
    })
    
    // Entity data script
    scripts.push({
      script_name: 'seed-entities',
      script_type: 'sql',
      script_content: this.generateEntitySeedSQL(entities),
      execution_order: 2,
      dependencies: ['setup-organization']
    })
    
    // Transaction data script
    if (transactions.length > 0) {
      scripts.push({
        script_name: 'seed-transactions',
        script_type: 'sql',
        script_content: this.generateTransactionSeedSQL(transactions),
        execution_order: 3,
        dependencies: ['seed-entities']
      })
    }
    
    // Demo user script
    scripts.push({
      script_name: 'setup-demo-users',
      script_type: 'typescript',
      script_content: this.generateDemoUserSetupScript(org.demo_users),
      execution_order: 4,
      dependencies: ['setup-organization']
    })
    
    // Verification script
    scripts.push({
      script_name: 'verify-seed-data',
      script_type: 'typescript',
      script_content: this.generateVerificationScript(),
      execution_order: 5,
      dependencies: ['seed-entities', 'seed-transactions', 'setup-demo-users']
    })
    
    return scripts
  }
  
  // Helper methods for data generation
  private getOrganizationName(): string {
    const names = [
      'Golden Palace Jewelers',
      'Diamond Dreams Jewelry',
      'Royal Gems & Ornaments',
      'Elegant Jewelry Collection',
      'Heritage Gold House'
    ]
    return this.randomChoice(names)
  }
  
  private getEntityCount(entityType: string): number {
    const baseCounts = {
      'minimal': { 'CUSTOMER': 10, 'PRODUCT': 20, 'MATERIAL': 5, 'VENDOR': 5, 'STAFF': 3 },
      'realistic': { 'CUSTOMER': 100, 'PRODUCT': 200, 'MATERIAL': 25, 'VENDOR': 15, 'STAFF': 10 },
      'large': { 'CUSTOMER': 1000, 'PRODUCT': 2000, 'MATERIAL': 100, 'VENDOR': 50, 'STAFF': 25 },
      'stress_test': { 'CUSTOMER': 10000, 'PRODUCT': 20000, 'MATERIAL': 500, 'VENDOR': 200, 'STAFF': 100 }
    }
    
    return baseCounts[this.seedConfig.data_volume]?.[entityType] || 10
  }
  
  private getTransactionCount(transactionType: string): number {
    const baseCounts = {
      'minimal': 20,
      'realistic': 200,
      'large': 2000,
      'stress_test': 20000
    }
    
    return baseCounts[this.seedConfig.data_volume] || 20
  }
  
  private generateEntityCode(entityType: string, index: number): string {
    const prefix = entityType.slice(0, 4).toUpperCase()
    return `${prefix}_${index.toString().padStart(3, '0')}`
  }
  
  private generateEntityName(entityType: string, index: number): string {
    return `Demo ${entityType} ${index}`
  }
  
  private generateTransactionCode(transactionType: string, index: number): string {
    const prefix = transactionType.slice(0, 3).toUpperCase()
    return `${prefix}_${Date.now().toString().slice(-6)}_${index.toString().padStart(3, '0')}`
  }
  
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }
  
  private randomBetween(min: number, max: number, decimals: number = 0): number {
    const value = Math.random() * (max - min) + min
    return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value)
  }
  
  private randomDate(daysBack: number = 365): string {
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack))
    return date.toISOString().split('T')[0]
  }
  
  // SQL generation methods
  private generateOrganizationSetupSQL(org: OrganizationSeedData): string {
    return `-- Setup organization for demo
INSERT INTO core_organizations (
  organization_id,
  organization_name,
  organization_type,
  settings,
  created_at,
  updated_at
) VALUES (
  '${org.organization_id}',
  '${org.organization_name}',
  '${org.organization_type}',
  '${JSON.stringify(org.settings)}',
  NOW(),
  NOW()
) ON CONFLICT (organization_id) DO UPDATE SET
  organization_name = EXCLUDED.organization_name,
  settings = EXCLUDED.settings,
  updated_at = NOW();`
  }
  
  private generateEntitySeedSQL(entities: EntitySeedData[]): string {
    let sql = '-- Seed entity data\n'
    
    for (const entityGroup of entities) {
      sql += `\n-- ${entityGroup.entity_type} entities\n`
      
      for (const entity of entityGroup.entities) {
        sql += `
SELECT hera_entities_crud_v1(
  'CREATE',
  '${this.seedConfig.organization_id}',
  '${this.seedConfig.organization_id}',
  '{
    "entity_type": "${entityGroup.entity_type}",
    "entity_name": "${entity.entity_name}",
    "entity_code": "${entity.entity_code}",
    "smart_code": "${entity.smart_code}"
  }'::jsonb,
  '${JSON.stringify(entity.dynamic_fields)}'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
);`
      }
    }
    
    return sql
  }
  
  private generateTransactionSeedSQL(transactions: TransactionSeedData[]): string {
    let sql = '-- Seed transaction data\n'
    
    for (const txnGroup of transactions) {
      sql += `\n-- ${txnGroup.transaction_type} transactions\n`
      
      for (const txn of txnGroup.transactions) {
        sql += `
SELECT hera_txn_crud_v1(
  'CREATE',
  '${this.seedConfig.organization_id}',
  '${this.seedConfig.organization_id}',
  '{
    "transaction_type": "${txnGroup.transaction_type}",
    "transaction_code": "${txn.transaction_code}",
    "smart_code": "HERA.JEWELRY.TXN.${txnGroup.transaction_type.toUpperCase()}.v1"
  }'::jsonb,
  '${JSON.stringify(txn.lines)}'::jsonb,
  '{}'::jsonb
);`
      }
    }
    
    return sql
  }
  
  private generateDemoUserSetupScript(users: DemoUser[]): string {
    return `// Setup demo users
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function setupDemoUsers() {
  const users = ${JSON.stringify(users, null, 2)}
  
  for (const user of users) {
    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.demo_password,
      email_confirm: true,
      user_metadata: {
        display_name: user.display_name,
        role: user.role,
        demo_user: true
      }
    })
    
    if (authError) {
      console.error('Failed to create auth user:', authError)
      continue
    }
    
    // Create user entity in HERA
    const { error: entityError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: authUser.user.id,
      p_organization_id: '${this.seedConfig.organization_id}',
      p_entity: {
        entity_type: 'USER',
        entity_name: user.display_name,
        entity_code: user.user_id,
        smart_code: 'HERA.PLATFORM.USER.DEMO.v1'
      },
      p_dynamic: {
        role: {
          field_type: 'text',
          field_value_text: user.role,
          smart_code: 'HERA.PLATFORM.USER.FIELD.ROLE.v1'
        },
        permissions: {
          field_type: 'json',
          field_value_json: user.permissions,
          smart_code: 'HERA.PLATFORM.USER.FIELD.PERMISSIONS.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })
    
    if (entityError) {
      console.error('Failed to create user entity:', entityError)
    }
    
    console.log(\`✅ Created demo user: \${user.email}\`)
  }
  
  console.log('🎉 All demo users created successfully!')
}`
  }
  
  private generateVerificationScript(): string {
    return `// Verify seed data integrity
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function verifySeedData() {
  console.log('🔍 Verifying seed data...')
  
  const orgId = '${this.seedConfig.organization_id}'
  
  // Verify organization exists
  const { data: org } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('organization_id', orgId)
    .single()
  
  console.log(org ? '✅ Organization created' : '❌ Organization missing')
  
  // Verify entities
  const { data: entities } = await supabase
    .from('core_entities')
    .select('entity_type, count(*)')
    .eq('organization_id', orgId)
    .group('entity_type')
  
  console.log('📊 Entity counts:')
  entities?.forEach(entity => {
    console.log(\`  \${entity.entity_type}: \${entity.count}\`)
  })
  
  // Verify transactions
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('transaction_type, count(*)')
    .eq('organization_id', orgId)
    .group('transaction_type')
  
  console.log('💰 Transaction counts:')
  transactions?.forEach(txn => {
    console.log(\`  \${txn.transaction_type}: \${txn.count}\`)
  })
  
  console.log('✅ Seed data verification complete!')
}`
  }
  
  // Demo script generation methods
  private generateJewelrySaleDemoScript(): string {
    return `
1. Login as sales associate (sales@demo.jewelry-erp.com / Demo123!)
2. Navigate to POS Sale from dashboard
3. Search and select customer "Priya Sharma"
4. Add Gold Ring 22K (PROD_001) - ₹50,000
5. System calculates:
   - Gold value: ₹45,000
   - Making charges: ₹5,000
   - GST (3%): ₹1,500
   - Total: ₹51,500
6. Select payment method: Card
7. Process payment and generate receipt
8. Verify inventory update and customer history
`
  }
  
  private generateBankReconciliationDemoScript(): string {
    return `
1. Login as accountant (accounts@demo.jewelry-erp.com / Demo123!)
2. Navigate to Bank Reconciliation
3. Upload bank statement CSV file
4. Click "Run Reconciliation"
5. Review automatic matches with confidence scores
6. Approve high-confidence matches (>85%)
7. Investigate unmatched transactions
8. Generate reconciliation report
9. Export final reconciliation summary
`
  }
  
  private generateGSTComplianceDemoScript(): string {
    return `
1. Login as admin (admin@demo.jewelry-erp.com / Demo123!)
2. Navigate to GST Compliance module
3. Select period: January 2024
4. Click "Generate GSTR-1"
5. Review calculated amounts:
   - Total sales: ₹50,00,000
   - CGST: ₹75,000
   - SGST: ₹75,000
   - Total GST: ₹1,50,000
6. Verify HSN-wise breakdown
7. Export GSTR-1 file for filing
8. Generate compliance report
`
  }
  
  // Additional helper methods
  private generateTransactionHeader(transaction: any): Record<string, any> {
    const header: Record<string, any> = {}
    
    for (const field of transaction.header_fields || []) {
      header[field.name] = this.generateGenericFieldValue(field)
    }
    
    return header
  }
  
  private generateTransactionLines(transaction: any): any[] {
    const lines = []
    const lineCount = this.randomBetween(1, 5)
    
    for (let i = 1; i <= lineCount; i++) {
      const line: Record<string, any> = {
        line_number: i
      }
      
      for (const lineType of transaction.lines || []) {
        for (const field of lineType.fields || []) {
          line[field.name] = this.generateGenericFieldValue(field)
        }
      }
      
      lines.push(line)
    }
    
    return lines
  }
  
  private generateTransactionTotals(): Record<string, any> {
    return {
      subtotal: this.randomBetween(10000, 100000),
      tax_amount: this.randomBetween(1500, 15000),
      total_amount: this.randomBetween(11500, 115000)
    }
  }
  
  private generateRelationshipSeedData(): RelationshipSeedData[] {
    // Implementation for relationship data generation
    return []
  }
}

/**
 * Helper function to generate seed data from YAML configuration
 */
export function generateSeedDataFromYAML(
  appConfig: EnhancedAppConfig,
  heraMapping: HERAAppMapping,
  seedConfig: SeedDataConfig
): GeneratedSeedData {
  const generator = new SeedDataGenerator(appConfig, heraMapping, seedConfig)
  return generator.generateCompleteSeedData()
}

/**
 * Quick demo setup function
 */
export function generateQuickDemo(
  organizationId: string,
  environment: 'demo' | 'development' = 'demo'
): GeneratedSeedData {
  const demoConfig: SeedDataConfig = {
    organization_id: organizationId,
    environment: environment,
    data_volume: 'realistic',
    locale: 'en_IN',
    industry_context: 'jewelry',
    include_relationships: true,
    include_transactions: true,
    performance_test_data: false
  }
  
  // Use jewelry ERP configuration
  const jewelryConfig = {
    app: {
      id: 'jewelry-erp',
      name: 'Jewelry ERP Demo',
      industry: 'jewelry',
      settings: {
        base_currency: 'INR',
        time_zone: 'Asia/Kolkata'
      }
    },
    entities: [], // Would be populated from YAML
    transactions: [],
    policies: []
  } as EnhancedAppConfig
  
  const heraMapping = {
    entities: [],
    transactions: [],
    policies: []
  } as HERAAppMapping
  
  return generateSeedDataFromYAML(jewelryConfig, heraMapping, demoConfig)
}

export default SeedDataGenerator