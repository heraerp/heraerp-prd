#!/usr/bin/env node

/**
 * HERA Standards CLI Tool
 * 
 * Command-line interface for managing HERA standards:
 * - Load standard definitions into the database
 * - List all registered standards
 * - Validate existing data against standards
 * - Generate compliance reports
 */

const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')
require('dotenv').config()

// Standard definitions - matches the TypeScript constants
const STANDARD_DEFINITIONS = {
  entity_types: {
    // Core System Types
    entity_type_definition: 'Entity Type Definition',
    transaction_type_definition: 'Transaction Type Definition',
    relationship_type_definition: 'Relationship Type Definition',
    status_definition: 'Status Definition',
    smart_code_pattern: 'Smart Code Pattern',
    
    // Business Entity Types
    customer: 'Customer',
    vendor: 'Vendor',
    product: 'Product',
    service: 'Service',
    employee: 'Employee',
    gl_account: 'General Ledger Account',
    budget: 'Budget',
    forecast: 'Forecast',
    location: 'Location',
    project: 'Project',
    development_task: 'Development Task',
    user: 'User',
    ai_agent: 'AI Agent',
    workflow_status: 'Workflow Status',
    
    // Document Types
    document: 'Document',
    report: 'Report',
    policy: 'Policy',
    
    // Configuration Types
    configuration: 'Configuration',
    rule: 'Rule',
    template: 'Template'
  },
  
  transaction_types: {
    // Financial Transactions
    sale: 'Sale',
    purchase: 'Purchase',
    payment: 'Payment',
    receipt: 'Receipt',
    journal_entry: 'Journal Entry',
    transfer: 'Transfer',
    adjustment: 'Adjustment',
    
    // Budget & Forecast
    budget_line: 'Budget Line',
    forecast_line: 'Forecast Line',
    
    // Inventory Transactions
    goods_receipt: 'Goods Receipt',
    goods_issue: 'Goods Issue',
    stock_transfer: 'Stock Transfer',
    stock_adjustment: 'Stock Adjustment',
    
    // Service Transactions
    service_order: 'Service Order',
    service_delivery: 'Service Delivery',
    time_entry: 'Time Entry',
    
    // Auto-Journal Types
    auto_journal: 'Auto Journal',
    batch_journal: 'Batch Journal',
    
    // System Transactions
    audit_event: 'Audit Event',
    status_change: 'Status Change',
    approval: 'Approval'
  },
  
  relationship_types: {
    // Hierarchical
    parent_of: 'Parent Of',
    child_of: 'Child Of',
    
    // Status & Workflow
    has_status: 'Has Status',
    previous_status: 'Previous Status',
    
    // Business Relationships
    customer_of: 'Customer Of',
    vendor_of: 'Vendor Of',
    employee_of: 'Employee Of',
    manager_of: 'Manager Of',
    reports_to: 'Reports To',
    member_of: 'Member Of',
    owner_of: 'Owner Of',
    
    // Document Relationships
    attachment_of: 'Attachment Of',
    version_of: 'Version Of',
    approval_for: 'Approval For',
    
    // Financial Relationships
    payment_for: 'Payment For',
    line_item_of: 'Line Item Of',
    allocation_of: 'Allocation Of',
    
    // Product/Service Relationships
    component_of: 'Component Of',
    substitute_for: 'Substitute For',
    bundle_of: 'Bundle Of'
  },
  
  statuses: {
    // Universal Statuses
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    cancelled: 'Cancelled',
    archived: 'Archived',
    
    // Transaction Statuses
    posted: 'Posted',
    reversed: 'Reversed',
    void: 'Void',
    
    // Workflow Statuses
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    under_review: 'Under Review',
    
    // Entity Statuses
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    deleted: 'Deleted'
  }
}

class HeraStandardsCLI {
  constructor() {
    // Initialize Supabase client with service role key to bypass RLS
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // HERA System Organization ID (master templates)
    this.SYSTEM_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'
  }

  async run() {
    const command = process.argv[2]
    const subcommand = process.argv[3]
    
    try {
      switch (command) {
        case 'load':
          await this.loadStandards()
          break
        case 'list':
          await this.listStandards(subcommand)
          break
        case 'validate':
          await this.validateData(subcommand)
          break
        case 'report':
          await this.generateReport(subcommand)
          break
        case 'stats':
          await this.showStats(subcommand)
          break
        case 'help':
        default:
          this.showHelp()
          break
      }
    } catch (error) {
      console.error('❌ Error:', error.message)
      process.exit(1)
    }
  }

  async loadStandards() {
    console.log('🔄 Loading HERA standards into system organization...')
    
    let totalLoaded = 0
    
    // Load entity type definitions
    for (const [code, name] of Object.entries(STANDARD_DEFINITIONS.entity_types)) {
      const entity = await this.createStandardEntity({
        entity_type: 'entity_type_definition',
        entity_name: name,
        entity_code: code,
        smart_code: `HERA.SYS.STD.ENTITY_TYPE.${code.toUpperCase()}.v1`,
        description: `Standard entity type: ${name}`
      })
      if (entity) totalLoaded++
    }
    
    // Load transaction type definitions
    for (const [code, name] of Object.entries(STANDARD_DEFINITIONS.transaction_types)) {
      const entity = await this.createStandardEntity({
        entity_type: 'transaction_type_definition',
        entity_name: name,
        entity_code: code,
        smart_code: `HERA.SYS.STD.TRANSACTION_TYPE.${code.toUpperCase()}.v1`,
        description: `Standard transaction type: ${name}`
      })
      if (entity) totalLoaded++
    }
    
    // Load relationship type definitions
    for (const [code, name] of Object.entries(STANDARD_DEFINITIONS.relationship_types)) {
      const entity = await this.createStandardEntity({
        entity_type: 'relationship_type_definition',
        entity_name: name,
        entity_code: code,
        smart_code: `HERA.SYS.STD.RELATIONSHIP_TYPE.${code.toUpperCase()}.v1`,
        description: `Standard relationship type: ${name}`
      })
      if (entity) totalLoaded++
    }
    
    // Load status definitions
    for (const [code, name] of Object.entries(STANDARD_DEFINITIONS.statuses)) {
      const entity = await this.createStandardEntity({
        entity_type: 'status_definition',
        entity_name: name,
        entity_code: code,
        smart_code: `HERA.SYS.STD.STATUS.${code.toUpperCase()}.v1`,
        description: `Standard status: ${name}`
      })
      if (entity) totalLoaded++
    }
    
    console.log(`✅ Loaded ${totalLoaded} standard definitions`)
  }

  async createStandardEntity({ entity_type, entity_name, entity_code, smart_code, description }) {
    try {
      // Check if entity already exists
      const { data: existing } = await this.supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', this.SYSTEM_ORG_ID)
        .eq('entity_code', entity_code)
        .eq('entity_type', entity_type)
        .single()
      
      if (existing) {
        console.log(`⚠️  Standard already exists: ${entity_code} (${entity_type})`)
        return null
      }
      
      // Create new entity
      const entityId = uuidv4()
      const { error: entityError } = await this.supabase
        .from('core_entities')
        .insert({
          id: entityId,
          organization_id: this.SYSTEM_ORG_ID,
          entity_type,
          entity_name,
          entity_code,
          smart_code,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (entityError) throw entityError
      
      // Add description as dynamic field
      if (description) {
        const { error: dynamicError } = await this.supabase
          .from('core_dynamic_data')
          .insert({
            id: uuidv4(),
            entity_id: entityId,
            organization_id: this.SYSTEM_ORG_ID,
            field_name: 'description',
            field_value_text: description,
            smart_code: `HERA.SYS.DYN.DESCRIPTION.v1`,
            created_at: new Date().toISOString()
          })
        
        if (dynamicError) throw dynamicError
      }
      
      console.log(`✅ Created standard: ${entity_code} (${entity_type})`)
      return entityId
      
    } catch (error) {
      console.error(`❌ Failed to create standard ${entity_code}:`, error.message)
      return null
    }
  }

  async listStandards(category = null) {
    console.log('📋 HERA Standards Registry')
    console.log('=' .repeat(50))
    
    const filter = category ? [category] : [
      'entity_type_definition',
      'transaction_type_definition', 
      'relationship_type_definition',
      'status_definition'
    ]
    
    for (const type of filter) {
      const { data: standards, error } = await this.supabase
        .from('core_entities')
        .select(`
          entity_name,
          entity_code,
          smart_code,
          core_dynamic_data (
            field_name,
            field_value_text
          )
        `)
        .eq('organization_id', this.SYSTEM_ORG_ID)
        .eq('entity_type', type)
        .order('entity_code')
      
      if (error) {
        console.error(`❌ Error loading ${type}:`, error.message)
        continue
      }
      
      console.log(`\n📁 ${this.formatCategoryName(type)} (${standards?.length || 0})`)
      console.log('-'.repeat(40))
      
      for (const standard of standards || []) {
        const description = standard.core_dynamic_data?.find(d => d.field_name === 'description')?.field_value_text || ''
        console.log(`  ${standard.entity_code.padEnd(25)} - ${standard.entity_name}`)
        if (description) {
          console.log(`    ${description}`)
        }
      }
    }
  }

  async validateData(organizationId) {
    if (!organizationId) {
      console.log('❌ Organization ID is required for validation')
      console.log('Usage: node hera-standards-cli.js validate <organization-id>')
      return
    }
    
    console.log(`🔍 Validating data for organization: ${organizationId}`)
    console.log('=' .repeat(60))
    
    // Load standards for reference
    const entityTypeStandards = await this.getStandards('entity_type_definition')
    const transactionTypeStandards = await this.getStandards('transaction_type_definition')
    
    // Validate entities
    console.log('\n📊 Entity Validation:')
    const { data: entities, error: entitiesError } = await this.supabase
      .from('core_entities')
      .select('entity_type')
      .eq('organization_id', organizationId)
      
    if (entitiesError) {
      console.log(`❌ Error querying entities: ${entitiesError.message}`)
      return
    }
    
    // Group by entity_type
    const entityCounts = {}
    if (entities) {
      for (const entity of entities) {
        entityCounts[entity.entity_type] = (entityCounts[entity.entity_type] || 0) + 1
      }
    }
    
    const validEntityTypes = new Set(entityTypeStandards.map(s => s.entity_code))
    let validEntities = 0
    let totalEntities = 0
    
    for (const [entityType, count] of Object.entries(entityCounts)) {
      totalEntities += count
      
      if (validEntityTypes.has(entityType)) {
        validEntities += count
        console.log(`  ✅ ${entityType}: ${count}`)
      } else {
        console.log(`  ❌ ${entityType}: ${count} (non-standard)`)
      }
    }
    
    // Validate transactions
    console.log('\n📊 Transaction Validation:')
    const { data: transactions, error: transactionsError } = await this.supabase
      .from('universal_transactions')
      .select('transaction_type')
      .eq('organization_id', organizationId)
      
    if (transactionsError) {
      console.log(`❌ Error querying transactions: ${transactionsError.message}`)
      return
    }
    
    // Group by transaction_type
    const transactionCounts = {}
    if (transactions) {
      for (const transaction of transactions) {
        transactionCounts[transaction.transaction_type] = (transactionCounts[transaction.transaction_type] || 0) + 1
      }
    }
    
    const validTransactionTypes = new Set(transactionTypeStandards.map(s => s.entity_code))
    let validTransactions = 0
    let totalTransactions = 0
    
    for (const [transactionType, count] of Object.entries(transactionCounts)) {
      totalTransactions += count
      
      if (validTransactionTypes.has(transactionType)) {
        validTransactions += count
        console.log(`  ✅ ${transactionType}: ${count}`)
      } else {
        console.log(`  ❌ ${transactionType}: ${count} (non-standard)`)
      }
    }
    
    // Summary
    console.log('\n📈 Validation Summary:')
    console.log(`  Total entities: ${totalEntities}`)
    console.log(`  Standard compliant entities: ${validEntities} (${totalEntities > 0 ? Math.round((validEntities/totalEntities)*100) : 0}%)`)
    console.log(`  Total transactions: ${totalTransactions}`)
    console.log(`  Standard compliant transactions: ${validTransactions} (${totalTransactions > 0 ? Math.round((validTransactions/totalTransactions)*100) : 0}%)`)
    
    const overallCompliance = (totalEntities + totalTransactions) > 0 ? 
      Math.round(((validEntities + validTransactions) / (totalEntities + totalTransactions)) * 100) : 100
    console.log(`  Overall compliance: ${overallCompliance}%`)
  }

  async generateReport(organizationId) {
    if (!organizationId) {
      console.log('❌ Organization ID is required for reports')
      console.log('Usage: node hera-standards-cli.js report <organization-id>')
      return
    }
    
    console.log(`📄 HERA Standards Compliance Report`)
    console.log(`Organization: ${organizationId}`)
    console.log(`Generated: ${new Date().toISOString()}`)
    console.log('=' .repeat(70))
    
    // Get organization name
    const { data: org } = await this.supabase
      .from('core_organizations')
      .select('organization_name')
      .eq('id', organizationId)
      .single()
    
    if (org) {
      console.log(`Organization Name: ${org.organization_name}`)
    }
    
    // Detailed entity analysis
    console.log('\n📊 Entity Type Analysis:')
    const { data: entityStats } = await this.supabase
      .from('core_entities')
      .select('entity_type')
      .eq('organization_id', organizationId)
    
    const entityCounts = {}
    if (entityStats) {
      for (const entity of entityStats) {
        entityCounts[entity.entity_type] = (entityCounts[entity.entity_type] || 0) + 1
      }
    }
    
    const entityStandards = await this.getStandards('entity_type_definition')
    const validEntityTypes = new Set(entityStandards.map(s => s.entity_code))
    
    for (const [type, count] of Object.entries(entityCounts)) {
      const status = validEntityTypes.has(type) ? '✅' : '❌'
      const compliance = validEntityTypes.has(type) ? 'COMPLIANT' : 'NON-STANDARD'
      console.log(`  ${status} ${type.padEnd(30)} ${count.toString().padStart(6)} ${compliance}`)
    }
    
    // Smart code analysis
    console.log('\n🧠 Smart Code Analysis:')
    const { data: smartCodeStats } = await this.supabase
      .from('core_entities')
      .select('smart_code')
      .eq('organization_id', organizationId)
      .not('smart_code', 'is', null)
    
    const validSmartCodes = smartCodeStats?.filter(s => 
      s.smart_code && /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/.test(s.smart_code)
    ).length || 0
    
    const totalWithSmartCodes = smartCodeStats?.length || 0
    const totalEntities = Object.values(entityCounts).reduce((sum, count) => sum + count, 0)
    
    console.log(`  Entities with smart codes: ${totalWithSmartCodes}/${totalEntities} (${totalEntities > 0 ? Math.round((totalWithSmartCodes/totalEntities)*100) : 0}%)`)
    console.log(`  Valid smart code format: ${validSmartCodes}/${totalWithSmartCodes} (${totalWithSmartCodes > 0 ? Math.round((validSmartCodes/totalWithSmartCodes)*100) : 0}%)`)
    
    // Recommendations
    console.log('\n💡 Recommendations:')
    const nonStandardEntities = Object.keys(entityCounts).filter(type => !validEntityTypes.has(type))
    if (nonStandardEntities.length > 0) {
      console.log(`  • Consider migrating non-standard entity types: ${nonStandardEntities.join(', ')}`)
    }
    
    if (totalWithSmartCodes < totalEntities) {
      console.log(`  • Add smart codes to ${totalEntities - totalWithSmartCodes} entities for better business intelligence`)
    }
    
    if (validSmartCodes < totalWithSmartCodes) {
      console.log(`  • Fix ${totalWithSmartCodes - validSmartCodes} invalid smart code formats`)
    }
  }

  async showStats(organizationId = null) {
    if (organizationId) {
      // Show stats for specific organization
      await this.validateData(organizationId)
    } else {
      // Show system-wide statistics
      console.log('📊 HERA Standards System Statistics')
      console.log('=' .repeat(50))
      
      const categories = [
        'entity_type_definition',
        'transaction_type_definition',
        'relationship_type_definition',
        'status_definition'
      ]
      
      for (const category of categories) {
        const { count } = await this.supabase
          .from('core_entities')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', this.SYSTEM_ORG_ID)
          .eq('entity_type', category)
        
        console.log(`  ${this.formatCategoryName(category)}: ${count || 0} standards`)
      }
      
      // Show usage across organizations
      console.log('\n📈 Standards Usage:')
      const { data: orgStats } = await this.supabase
        .from('core_organizations')
        .select('id, organization_name')
        .limit(10)
      
      for (const org of orgStats || []) {
        const { count: entityCount } = await this.supabase
          .from('core_entities')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
        
        const { count: transactionCount } = await this.supabase
          .from('universal_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
        
        console.log(`  ${org.organization_name}: ${entityCount || 0} entities, ${transactionCount || 0} transactions`)
      }
    }
  }

  async getStandards(category) {
    const { data: standards } = await this.supabase
      .from('core_entities')
      .select('entity_code, entity_name')
      .eq('organization_id', this.SYSTEM_ORG_ID)
      .eq('entity_type', category)
      .order('entity_code')
    
    return standards || []
  }

  formatCategoryName(category) {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  showHelp() {
    console.log(`
🧬 HERA Standards CLI Tool

USAGE:
  node hera-standards-cli.js <command> [options]

COMMANDS:
  load                          Load standard definitions into system organization
  list [category]               List all standards (optionally filter by category)
  validate <org-id>             Validate data against standards for organization
  report <org-id>               Generate detailed compliance report
  stats [org-id]                Show statistics (system-wide or for organization)
  help                          Show this help message

CATEGORIES:
  entity_type_definition        Entity type standards
  transaction_type_definition   Transaction type standards
  relationship_type_definition  Relationship type standards
  status_definition             Status standards

EXAMPLES:
  node hera-standards-cli.js load
  node hera-standards-cli.js list entity_type_definition
  node hera-standards-cli.js validate f47ac10b-58cc-4372-a567-0e02b2c3d479
  node hera-standards-cli.js report f47ac10b-58cc-4372-a567-0e02b2c3d479
  node hera-standards-cli.js stats

ENVIRONMENT VARIABLES:
  NEXT_PUBLIC_SUPABASE_URL      Supabase project URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY Supabase anonymous key
`)
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new HeraStandardsCLI()
  cli.run().catch(console.error)
}

module.exports = HeraStandardsCLI