/**
 * CRUD Page Generator CLI
 * Instant production-quality page generation with TypeScript safety
 */

import fs from 'fs'
import path from 'path'
import { 
  EntityConfig, 
  TransactionConfig,
  PREDEFINED_ENTITIES,
  PREDEFINED_TRANSACTIONS,
  validateEntityConfig,
  validateTransactionConfig
} from './sap-fiori-crud-generator'
import { generateEntityPageTemplate } from './sap-fiori-page-template'

export interface GeneratorOptions {
  outputDir?: string
  overwrite?: boolean
  createSampleData?: boolean
  addToNavigation?: boolean
}

export class CRUDPageGenerator {
  private baseDir: string
  private options: GeneratorOptions

  constructor(baseDir: string = '/Users/san/Documents/PRD/heraerp-prd', options: GeneratorOptions = {}) {
    this.baseDir = baseDir
    this.options = {
      outputDir: path.join(baseDir, 'src/app'),
      overwrite: false,
      createSampleData: true,
      addToNavigation: true,
      ...options
    }
  }

  /**
   * Generate entity CRUD page from predefined or custom config
   */
  async generateEntityPage(entityTypeOrConfig: string | EntityConfig): Promise<string> {
    let config: EntityConfig

    if (typeof entityTypeOrConfig === 'string') {
      // Use predefined configuration
      const predefinedConfig = PREDEFINED_ENTITIES[entityTypeOrConfig.toUpperCase()]
      if (!predefinedConfig) {
        throw new Error(`Predefined entity type '${entityTypeOrConfig}' not found. Available: ${Object.keys(PREDEFINED_ENTITIES).join(', ')}`)
      }
      config = predefinedConfig
    } else {
      // Validate custom configuration
      config = validateEntityConfig(entityTypeOrConfig)
    }

    // Generate page content
    const pageContent = generateEntityPageTemplate(config)
    
    // Determine output path
    const entityPath = config.entityType.toLowerCase() + 's'
    const outputPath = path.join(this.options.outputDir!, entityPath, 'page.tsx')
    
    // Check if file exists and overwrite policy
    if (fs.existsSync(outputPath) && !this.options.overwrite) {
      throw new Error(`File ${outputPath} already exists. Use overwrite: true to replace it.`)
    }

    // Create directory if needed
    const dirPath = path.dirname(outputPath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    // Write page file
    fs.writeFileSync(outputPath, pageContent)

    // Generate sample data script if requested
    if (this.options.createSampleData) {
      await this.generateSampleDataScript(config)
    }

    // Add to navigation if requested
    if (this.options.addToNavigation) {
      await this.addToNavigation(config)
    }

    return outputPath
  }

  /**
   * Generate transaction CRUD page from predefined or custom config
   */
  async generateTransactionPage(transactionTypeOrConfig: string | TransactionConfig): Promise<string> {
    let config: TransactionConfig

    if (typeof transactionTypeOrConfig === 'string') {
      // Use predefined configuration
      const predefinedConfig = PREDEFINED_TRANSACTIONS[transactionTypeOrConfig.toUpperCase()]
      if (!predefinedConfig) {
        throw new Error(`Predefined transaction type '${transactionTypeOrConfig}' not found. Available: ${Object.keys(PREDEFINED_TRANSACTIONS).join(', ')}`)
      }
      config = predefinedConfig
    } else {
      // Validate custom configuration
      config = validateTransactionConfig(transactionTypeOrConfig)
    }

    // For now, use entity template (transaction template would be more complex)
    const pageContent = generateEntityPageTemplate(config as any)
    
    // Determine output path
    const transactionPath = config.transactionType.toLowerCase() + 's'
    const outputPath = path.join(this.options.outputDir!, transactionPath, 'page.tsx')
    
    // Check if file exists and overwrite policy
    if (fs.existsSync(outputPath) && !this.options.overwrite) {
      throw new Error(`File ${outputPath} already exists. Use overwrite: true to replace it.`)
    }

    // Create directory if needed
    const dirPath = path.dirname(outputPath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    // Write page file
    fs.writeFileSync(outputPath, pageContent)

    return outputPath
  }

  /**
   * Generate sample data creation script
   */
  private async generateSampleDataScript(config: EntityConfig): Promise<void> {
    const scriptContent = `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awfcrncxngqwbhqapffb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSample${config.entityNamePlural}() {
  const orgId = '6e1954fe-e34a-4056-84f4-745e5b8378ec'
  
  const sample${config.entityNamePlural} = [
    // Add sample data based on entity type and fields
    ${generateSampleData(config)}
  ]
  
  console.log('Creating sample ${config.entityNamePlural.toLowerCase()} for retail CRM demo...')
  
  for (const [index, ${config.entityType.toLowerCase()}] of sample${config.entityNamePlural}.entries()) {
    const { data: entity, error } = await supabase
      .from('core_entities')
      .insert(${config.entityType.toLowerCase()})
      .select()
      .single()
      
    if (error) {
      console.error('Error creating ${config.entityType.toLowerCase()}:', error)
      continue
    }
    
    console.log(\`\${index + 1}. Created ${config.entityType.toLowerCase()}: \${entity.entity_name} (ID: \${entity.id})\`)
    
    // Add dynamic fields for each ${config.entityType.toLowerCase()}
    const dynamicFields = []
    const fieldsData = sampleDynamicData[entity.entity_name]
    
    if (fieldsData) {
      for (const [fieldName, fieldValue] of Object.entries(fieldsData)) {
        dynamicFields.push({
          organization_id: orgId,
          entity_id: entity.id,
          field_name: fieldName,
          field_type: '${config.dynamicFields[0]?.type || 'text'}',
          field_value_text: fieldValue,
          smart_code: \`${config.entitySmartCode.replace('.ENTITY.', '.DYN.')}\${fieldName.toUpperCase()}.V1\`
        })
      }
      
      const { error: dynError } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicFields)
        
      if (dynError) {
        console.error(\`Error creating dynamic fields for \${entity.entity_name}:\`, dynError)
      } else {
        console.log(\`   ✅ Added dynamic fields: \${Object.keys(fieldsData).join(', ')}\`)
      }
    }
  }
  
  console.log('')
  console.log('✅ Sample ${config.entityNamePlural} created successfully!')
  console.log('🌐 Visit http://localhost:3001/${config.entityType.toLowerCase()}s to view them')
}

const sampleDynamicData = {
  ${generateSampleDynamicData(config)}
}

createSample${config.entityNamePlural}().catch(console.error)`

    const scriptPath = path.join(this.baseDir, 'mcp-server', `create-sample-${config.entityType.toLowerCase()}s.js`)
    fs.writeFileSync(scriptPath, scriptContent)
  }

  /**
   * Add entity to navigation menu
   */
  private async addToNavigation(config: EntityConfig): Promise<void> {
    // This would add the new entity to the main navigation
    // Implementation depends on your navigation structure
    console.log(`📝 TODO: Add ${config.entityNamePlural} to navigation menu`)
  }

  /**
   * Generate multiple entities at once
   */
  async generateMultipleEntities(entityTypes: string[]): Promise<string[]> {
    const results: string[] = []
    
    for (const entityType of entityTypes) {
      try {
        const path = await this.generateEntityPage(entityType)
        results.push(path)
        console.log(`✅ Generated ${entityType} page: ${path}`)
      } catch (error) {
        console.error(`❌ Failed to generate ${entityType}:`, error)
      }
    }
    
    return results
  }

  /**
   * List available predefined entities
   */
  listPredefinedEntities(): string[] {
    return Object.keys(PREDEFINED_ENTITIES)
  }

  /**
   * List available predefined transactions
   */
  listPredefinedTransactions(): string[] {
    return Object.keys(PREDEFINED_TRANSACTIONS)
  }
}

// Helper functions
function generateSampleData(config: EntityConfig): string {
  const samples = {
    'CONTACT': `{
      entity_name: 'John Smith',
      entity_type: 'CONTACT',
      smart_code: '${config.entitySmartCode}',
      status: 'active',
      organization_id: orgId,
      metadata: { contact_type: 'business', source: 'direct' }
    },
    {
      entity_name: 'Maria Rodriguez',
      entity_type: 'CONTACT',
      smart_code: '${config.entitySmartCode}',
      status: 'active',
      organization_id: orgId,
      metadata: { contact_type: 'business', source: 'referral' }
    }`,
    'ACCOUNT': `{
      entity_name: 'Acme Corporation',
      entity_type: 'ACCOUNT',
      smart_code: '${config.entitySmartCode}',
      status: 'active',
      organization_id: orgId,
      metadata: { account_type: 'enterprise', tier: 'gold' }
    },
    {
      entity_name: 'Global Manufacturing Inc',
      entity_type: 'ACCOUNT',
      smart_code: '${config.entitySmartCode}',
      status: 'active',
      organization_id: orgId,
      metadata: { account_type: 'enterprise', tier: 'platinum' }
    }`,
    'LEAD': `{
      entity_name: 'Jane Doe',
      entity_type: 'LEAD',
      smart_code: '${config.entitySmartCode}',
      status: 'active',
      organization_id: orgId,
      metadata: { lead_status: 'qualified', source: 'website' }
    },
    {
      entity_name: 'Tech Startup Inc',
      entity_type: 'LEAD',
      smart_code: '${config.entitySmartCode}',
      status: 'active',
      organization_id: orgId,
      metadata: { lead_status: 'new', source: 'trade_show' }
    }`,
    'PRODUCT': `{
      entity_name: 'Premium Widget',
      entity_type: 'PRODUCT',
      smart_code: '${config.entitySmartCode}',
      status: 'active',
      organization_id: orgId,
      metadata: { product_type: 'physical', category: 'widgets' }
    },
    {
      entity_name: 'Software License',
      entity_type: 'PRODUCT',
      smart_code: '${config.entitySmartCode}',
      status: 'active',
      organization_id: orgId,
      metadata: { product_type: 'digital', category: 'software' }
    }`
  }

  return samples[config.entityType] || `{
    entity_name: 'Sample ${config.entityName}',
    entity_type: '${config.entityType}',
    smart_code: '${config.entitySmartCode}',
    status: 'active',
    organization_id: orgId,
    metadata: { sample: true }
  }`
}

function generateSampleDynamicData(config: EntityConfig): string {
  const dynamicDataSamples = {
    'CONTACT': `'John Smith': {
    email: 'john.smith@acme.com',
    phone: '+1-555-0123',
    title: 'VP of Sales',
    account: 'Acme Corporation',
    department: 'Sales',
    owner: 'Sarah Wilson'
  },
  'Maria Rodriguez': {
    email: 'maria.r@globalmanuf.com',
    phone: '+1-555-0456', 
    title: 'Chief Technology Officer',
    account: 'Global Manufacturing Inc',
    department: 'Technology',
    owner: 'Mike Johnson'
  }`,
    'ACCOUNT': `'Acme Corporation': {
    industry: 'Technology',
    website: 'https://acme.com',
    employees: 500,
    revenue: 50000000,
    owner: 'Sarah Wilson'
  },
  'Global Manufacturing Inc': {
    industry: 'Manufacturing',
    website: 'https://globalmanuf.com',
    employees: 1200,
    revenue: 120000000,
    owner: 'Mike Johnson'
  }`,
    'LEAD': `'Jane Doe': {
    email: 'jane.doe@prospect.com',
    phone: '+1-555-0789',
    company: 'Prospect Company',
    source: 'Website',
    score: 85,
    owner: 'Alex Chen'
  },
  'Tech Startup Inc': {
    email: 'contact@techstartup.io',
    phone: '+1-555-0321',
    company: 'Tech Startup Inc',
    source: 'Trade Show',
    score: 75,
    owner: 'Sarah Wilson'
  }`,
    'PRODUCT': `'Premium Widget': {
    sku: 'WIDGET-PREM-001',
    price: 299.99,
    cost: 150.00,
    category: 'Widgets',
    supplier: 'Widget Co',
    stock: 100
  },
  'Software License': {
    sku: 'SW-LIC-001',
    price: 99.99,
    cost: 20.00,
    category: 'Software',
    supplier: 'Internal',
    stock: 999
  }`
  }

  return dynamicDataSamples[config.entityType] || `'Sample ${config.entityName}': {
    ${config.dynamicFields.slice(0, 3).map(field => 
      `${field.name}: '${field.type === 'number' ? '100' : 'Sample Value'}'`
    ).join(',\n    ')}
  }`
}

// Export singleton instance
export const crudGenerator = new CRUDPageGenerator()

// CLI interface
export async function generateFromCLI(args: string[]) {
  const [command, entityType, ...options] = args

  switch (command) {
    case 'entity':
      if (!entityType) {
        console.log('Available entities:', crudGenerator.listPredefinedEntities().join(', '))
        return
      }
      try {
        const overwrite = options.includes('--overwrite')
        const generator = new CRUDPageGenerator(undefined, { overwrite })
        const path = await generator.generateEntityPage(entityType.toUpperCase())
        console.log(`✅ Generated entity page: ${path}`)
      } catch (error) {
        console.error(`❌ Error generating entity:`, error)
      }
      break

    case 'transaction':
      if (!entityType) {
        console.log('Available transactions:', crudGenerator.listPredefinedTransactions().join(', '))
        return
      }
      try {
        const overwrite = options.includes('--overwrite')
        const generator = new CRUDPageGenerator(undefined, { overwrite })
        const path = await generator.generateTransactionPage(entityType.toUpperCase())
        console.log(`✅ Generated transaction page: ${path}`)
      } catch (error) {
        console.error(`❌ Error generating transaction:`, error)
      }
      break

    case 'multiple':
      if (!entityType) {
        console.error('Please provide entity types')
        return
      }
      try {
        const entities = entityType.split(',')
        const overwrite = options.includes('--overwrite')
        const generator = new CRUDPageGenerator(undefined, { overwrite })
        await generator.generateMultipleEntities(entities)
      } catch (error) {
        console.error(`❌ Error generating multiple entities:`, error)
      }
      break

    default:
      console.log('Usage:')
      console.log('  entity <TYPE>     - Generate entity page')
      console.log('  transaction <TYPE> - Generate transaction page')
      console.log('  multiple <TYPE1,TYPE2> - Generate multiple pages')
      console.log('')
      console.log('Options:')
      console.log('  --overwrite       - Overwrite existing files')
      console.log('')
      console.log('Available entities:', crudGenerator.listPredefinedEntities().join(', '))
      console.log('Available transactions:', crudGenerator.listPredefinedTransactions().join(', '))
  }
}