#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'

interface ConversionConfig {
  pageName: string
  entityType: string
  entityPrefix: string
  dynamicFields: string[]
  relationships?: {
    type: string
    to: string
  }[]
}

// Page configuration mapping
const PAGE_CONFIGS: Record<string, Partial<ConversionConfig>> = {
  appointments: {
    entityType: 'appointment',
    entityPrefix: 'APPT',
    dynamicFields: ['date', 'time', 'duration', 'notes', 'status'],
    relationships: [
      { type: 'has_customer', to: 'customer' },
      { type: 'has_staff', to: 'employee' },
      { type: 'has_service', to: 'service' }
    ]
  },
  staff: {
    entityType: 'employee',
    entityPrefix: 'STAFF',
    dynamicFields: ['email', 'phone', 'role', 'specialties', 'hourly_rate', 'commission_rate'],
    relationships: [
      { type: 'has_status', to: 'workflow_status' }
    ]
  },
  services: {
    entityType: 'service',
    entityPrefix: 'SVC',
    dynamicFields: ['price', 'duration', 'category', 'description', 'requires_license'],
    relationships: [
      { type: 'requires_product', to: 'product' }
    ]
  },
  inventory: {
    entityType: 'product',
    entityPrefix: 'PROD',
    dynamicFields: ['sku', 'price', 'cost', 'stock_level', 'reorder_point', 'category'],
    relationships: [
      { type: 'from_supplier', to: 'vendor' },
      { type: 'in_category', to: 'product_category' }
    ]
  },
  loyalty: {
    entityType: 'loyalty_program',
    entityPrefix: 'LOYALTY',
    dynamicFields: ['points_ratio', 'tier_benefits', 'expiry_days'],
    relationships: [
      { type: 'has_members', to: 'customer' }
    ]
  }
}

// Hook template
const HOOK_TEMPLATE = (entityName: string, entityType: string, fields: string[]) => `import { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'

interface ${entityName}Data {
  entity: any
  dynamicFields: any[]
  relationships: any[]
  transactions?: any[]
}

export function use${entityName}(organizationId?: string) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })

  const fetchData = async () => {
    if (!organizationId) return
    
    try {
      setLoading(true)
      setError(null)

      // 1. Get entities
      const entitiesRes = await universalApi.getEntities('${entityType}', organizationId)
      if (!entitiesRes.success) throw new Error(entitiesRes.error)
      
      const entities = entitiesRes.data || []
      const entityIds = entities.map(e => e.id)
      
      if (entityIds.length === 0) {
        setItems([])
        setStats({ total: 0, active: 0, inactive: 0 })
        return
      }

      // 2. Get dynamic fields
      const fieldsPromises = entityIds.map(id => 
        universalApi.getDynamicFields(id, organizationId)
      )
      const fieldsResults = await Promise.all(fieldsPromises)
      
      // 3. Get relationships
      const relPromises = entityIds.map(id =>
        universalApi.getRelationships(id, organizationId)
      )
      const relResults = await Promise.all(relPromises)
      
      // 4. Transform data
      const transformedItems = entities.map((entity, index) => ({
        entity,
        dynamicFields: fieldsResults[index].data || [],
        relationships: relResults[index].data || []
      }))
      
      setItems(transformedItems)
      
      // Calculate stats
      setStats({
        total: entities.length,
        active: entities.filter(e => e.status === 'active').length,
        inactive: entities.filter(e => e.status === 'inactive').length
      })
      
    } catch (err) {
      console.error('Error fetching ${entityType} data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // CRUD operations
  const create${entityName} = async (data: any) => {
    if (!organizationId) throw new Error('No organization ID')
    
    const result = await universalApi.createEntity({
      entity_type: '${entityType}',
      entity_name: data.name,
      entity_code: \`${entityType.toUpperCase()}-\${Date.now()}\`,
      smart_code: 'HERA.SALON.${entityType.toUpperCase()}.v1',
      status: 'active'
    }, organizationId)
    
    if (!result.success) throw new Error(result.error)
    
    // Add dynamic fields
    const fieldPromises = []
    ${fields.map(field => `if (data.${field}) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, '${field}', data.${field}, 'text', organizationId)
      )
    }`).join('\n    ')}
    
    await Promise.all(fieldPromises)
    await fetchData() // Refresh
    
    return result.data
  }

  const update${entityName} = async (id: string, updates: any) => {
    // Implementation here
  }

  const delete${entityName} = async (id: string) => {
    if (!organizationId) throw new Error('No organization ID')
    
    const result = await universalApi.deleteEntity(id, organizationId)
    if (!result.success) throw new Error(result.error)
    
    await fetchData() // Refresh
  }

  return {
    items,
    loading,
    error,
    stats,
    refetch: fetchData,
    create${entityName},
    update${entityName},
    delete${entityName}
  }
}`

// Transformer template
const TRANSFORMER_TEMPLATE = (entityName: string, fields: string[]) => `import { format } from 'date-fns'

export interface UI${entityName} {
  id: string
  name: string
  ${fields.map(f => `${f}: string`).join('\n  ')}
  status: string
  createdAt: string
  relationships: any[]
}

export function transformToUI${entityName}(data: {
  entity: any
  dynamicFields: any[]
  relationships: any[]
}): UI${entityName} {
  const { entity, dynamicFields, relationships } = data
  
  // Helper to get field value
  const getField = (fieldName: string) => {
    const field = dynamicFields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || field?.field_value_date || ''
  }
  
  return {
    id: entity.id,
    name: entity.entity_name,
    ${fields.map(f => `${f}: getField('${f}')`).join(',\n    ')},
    status: entity.status,
    createdAt: format(new Date(entity.created_at), 'MMM d, yyyy'),
    relationships
  }
}

export function filter${entityName}(items: UI${entityName}[], searchTerm: string): UI${entityName}[] {
  if (!searchTerm) return items
  
  const term = searchTerm.toLowerCase()
  return items.filter(item => 
    item.name.toLowerCase().includes(term) ||
    ${fields.map(f => `item.${f}?.toLowerCase().includes(term)`).join(' ||\n    ')}
  )
}`

// Test data script template
const TEST_DATA_TEMPLATE = (entityType: string, entityName: string, fields: string[]) => `#!/usr/bin/env node
/**
 * Setup ${entityName} Test Data
 * Creates test ${entityType} entities with all necessary fields
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function setup${entityName}TestData() {
  console.log('🎯 Setting up ${entityName} Test Data...\\n');

  const testData = [
    // TODO: Add test data based on progressive version
    {
      name: 'Sample ${entityName} 1',
      ${fields.map(f => `${f}: 'Sample value'`).join(',\n      ')}
    }
  ];

  for (const item of testData) {
    try {
      // 1. Create entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: '${entityType}',
          entity_name: item.name,
          entity_code: \`${entityType.toUpperCase()}-\${Date.now()}\`,
          smart_code: 'HERA.SALON.${entityType.toUpperCase()}.v1',
          status: 'active'
        })
        .select()
        .single();

      if (entityError) throw entityError;

      console.log(\`✅ Created ${entityType}: \${item.name}\`);

      // 2. Add dynamic fields
      const fields = [
        ${fields.map(f => `{ field_name: '${f}', field_value_text: item.${f}, field_type: 'text' }`).join(',\n        ')}
      ];

      for (const field of fields) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: entity.id,
            ...field,
            smart_code: \`HERA.SALON.FIELD.\${field.field_name.toUpperCase()}.v1\`
          });
      }

      console.log(\`  📝 Added \${fields.length} fields\`);

    } catch (error) {
      console.error(\`❌ Error creating \${item.name}:\`, error);
    }
  }

  console.log('\\n✅ ${entityName} test data setup complete!');
}

// Run the setup
setup${entityName}TestData().catch(console.error);`

function convertPage(pageName: string) {
  const config = PAGE_CONFIGS[pageName]
  if (!config) {
    console.error(`❌ No configuration found for page: ${pageName}`)
    console.log('Available pages:', Object.keys(PAGE_CONFIGS).join(', '))
    return
  }

  const { entityType, entityPrefix, dynamicFields = [], relationships = [] } = config
  const entityName = entityType!.charAt(0).toUpperCase() + entityType!.slice(1)

  console.log(`🔄 Converting ${pageName} to production...`)

  // Create directories if they don't exist
  const dirs = [
    `src/app/salon/${pageName}`,
    'src/hooks',
    'src/lib/transformers',
    'mcp-server'
  ]

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })

  // 1. Generate hook
  const hookPath = `src/hooks/use${entityName}.ts`
  fs.writeFileSync(hookPath, HOOK_TEMPLATE(entityName, entityType!, dynamicFields))
  console.log(`✅ Created hook: ${hookPath}`)

  // 2. Generate transformer
  const transformerPath = `src/lib/transformers/${entityType}-transformer.ts`
  fs.writeFileSync(transformerPath, TRANSFORMER_TEMPLATE(entityName, dynamicFields))
  console.log(`✅ Created transformer: ${transformerPath}`)

  // 3. Generate test data script
  const testDataPath = `mcp-server/setup-${pageName}-data.js`
  fs.writeFileSync(testDataPath, TEST_DATA_TEMPLATE(entityType!, entityName, dynamicFields))
  fs.chmodSync(testDataPath, '755')
  console.log(`✅ Created test data script: ${testDataPath}`)

  // 4. Copy and convert page (if exists)
  const progressivePath = `src/app/salon-progressive/${pageName}/page.tsx`
  const productionPath = `src/app/salon/${pageName}/page.tsx`
  
  if (fs.existsSync(progressivePath) && !fs.existsSync(productionPath)) {
    let progressiveContent = fs.readFileSync(progressivePath, 'utf8')
    
    // Basic conversions
    progressiveContent = progressiveContent
      .replace(/ProgressiveAuthProvider/g, 'useAuth')
      .replace(/from '@\/contexts\/progressive-auth'/g, "from '@/contexts/auth-context'")
      .replace(/localStorage\./g, '// localStorage.')
      .replace(/IndexedDB/g, '// IndexedDB')
    
    // Add imports
    const imports = `import { useAuth } from '@/contexts/auth-context'
import { useUserContext } from '@/hooks/useUserContext'
import { use${entityName} } from '@/hooks/use${entityName}'
import { transformToUI${entityName} } from '@/lib/transformers/${entityType}-transformer'

`
    
    progressiveContent = imports + progressiveContent
    
    fs.writeFileSync(productionPath, progressiveContent)
    console.log(`✅ Created production page: ${productionPath}`)
    console.log('   ⚠️  Note: Manual review required to complete conversion')
  }

  console.log(`
📋 Next steps:
1. Review and update the generated files
2. Run test data script: node ${testDataPath}
3. Update the production page to use hooks and transformers
4. Test the page at http://localhost:3007/salon/${pageName}
`)
}

// Parse command line arguments
const args = process.argv.slice(2)
const pageName = args[0]

if (!pageName) {
  console.log(`
Usage: npm run convert-progressive [page-name]

Available pages:
${Object.keys(PAGE_CONFIGS).map(p => `  - ${p}`).join('\n')}

Example: npm run convert-progressive appointments
`)
} else {
  convertPage(pageName)
}

export {}