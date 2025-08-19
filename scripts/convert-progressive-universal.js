#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { 
  UNIVERSAL_PAGE_CONFIGS, 
  INDUSTRY_ENTITY_MAPPINGS, 
  SMART_CODE_PATTERNS 
} = require('./universal-conversion-config')

// Hook template
const HOOK_TEMPLATE = (entityName, entityType, fields, industry) => `import { useState, useEffect } from 'react'
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
      entity_name: data.name || data.title || data.description,
      entity_code: \`${entityType.toUpperCase()}-\${Date.now()}\`,
      smart_code: '${SMART_CODE_PATTERNS[industry] || 'HERA'}.${entityType.toUpperCase()}.v1',
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
    if (!organizationId) throw new Error('No organization ID')
    
    // Update entity
    if (updates.name || updates.status) {
      const entityUpdate = await universalApi.updateEntity(id, {
        entity_name: updates.name,
        status: updates.status
      }, organizationId)
      
      if (!entityUpdate.success) throw new Error(entityUpdate.error)
    }
    
    // Update dynamic fields
    const fieldPromises = []
    ${fields.map(field => `if (updates.${field} !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, '${field}', updates.${field}, 'text', organizationId)
      )
    }`).join('\n    ')}
    
    await Promise.all(fieldPromises)
    await fetchData() // Refresh
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

// Page template for production
const PAGE_TEMPLATE = (pageName, entityName, entityType, industry) => `'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useUserContext } from '@/hooks/useUserContext'
import { use${entityName} } from '@/hooks/use${entityName}'
import { transformToUI${entityName} } from '@/lib/transformers/${entityType}-transformer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Plus, 
  Search, 
  AlertCircle,
  ArrowLeft 
} from 'lucide-react'
import Link from 'next/link'

export default function ${entityName}Page() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { 
    items, 
    loading, 
    error, 
    stats, 
    create${entityName}, 
    update${entityName}, 
    delete${entityName} 
  } = use${entityName}(organizationId)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Transform items for UI
  const uiItems = items.map(transformToUI${entityName})
  
  // Filter items based on search
  const filteredItems = uiItems.filter(item => {
    const term = searchTerm.toLowerCase()
    return item.name?.toLowerCase().includes(term) ||
           item.description?.toLowerCase().includes(term) ||
           Object.values(item).some(val => 
             typeof val === 'string' && val.toLowerCase().includes(term)
           )
  })
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }
  
  if (!organizationId) {
    return (
      <div className="min-h-screen p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Organization not found. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/${industry}">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">${entityName} Management</h1>
                <p className="text-sm text-gray-600">Manage your ${entityType}s</p>
              </div>
            </div>
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Search and Actions */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search ${entityType}s..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add ${entityName}
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                <p className="text-xs text-gray-600">Inactive</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>${entityName} List ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No items found matching your search.' : 'No items yet.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.description || 'No description'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`

function convertPage(industry, pageName) {
  // Find config for this page
  const config = UNIVERSAL_PAGE_CONFIGS[pageName]
  if (!config) {
    console.error(`❌ No configuration found for page: ${pageName}`)
    console.log('Available pages:', Object.keys(UNIVERSAL_PAGE_CONFIGS).join(', '))
    return
  }

  // Check if this page is valid for the industry
  if (config.industries && !config.industries.includes(industry) && !config.industries.includes('all')) {
    console.error(`❌ Page "${pageName}" is not configured for industry "${industry}"`)
    console.log(`Available industries for this page: ${config.industries.join(', ')}`)
    return
  }

  const { entityType, entityPrefix, dynamicFields = [], relationships = [] } = config
  const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1)
  const smartCodeBase = SMART_CODE_PATTERNS[industry] || 'HERA'

  console.log(`🔄 Converting ${industry}/${pageName} to production...`)
  console.log(`   Entity Type: ${entityType}`)
  console.log(`   Smart Code: ${smartCodeBase}.${entityType.toUpperCase()}.v1`)

  // Create directories if they don't exist
  const dirs = [
    `src/app/${industry}/${pageName}`,
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
  if (!fs.existsSync(hookPath)) {
    fs.writeFileSync(hookPath, HOOK_TEMPLATE(entityName, entityType, dynamicFields, industry))
    console.log(`✅ Created hook: ${hookPath}`)
  } else {
    console.log(`⚠️  Hook already exists: ${hookPath}`)
  }

  // 2. Generate transformer
  const transformerPath = `src/lib/transformers/${entityType}-transformer.ts`
  if (!fs.existsSync(transformerPath)) {
    const transformerContent = generateTransformer(entityName, entityType, dynamicFields)
    fs.writeFileSync(transformerPath, transformerContent)
    console.log(`✅ Created transformer: ${transformerPath}`)
  } else {
    console.log(`⚠️  Transformer already exists: ${transformerPath}`)
  }

  // 3. Generate test data script
  const testDataPath = `mcp-server/setup-${industry}-${pageName}-data.js`
  const testDataContent = generateTestDataScript(industry, pageName, entityType, entityName, dynamicFields, smartCodeBase)
  fs.writeFileSync(testDataPath, testDataContent)
  fs.chmodSync(testDataPath, '755')
  console.log(`✅ Created test data script: ${testDataPath}`)

  // 4. Create production page
  const productionPath = `src/app/${industry}/${pageName}/page.tsx`
  if (!fs.existsSync(productionPath)) {
    fs.writeFileSync(productionPath, PAGE_TEMPLATE(pageName, entityName, entityType, industry))
    console.log(`✅ Created production page: ${productionPath}`)
  } else {
    console.log(`⚠️  Production page already exists: ${productionPath}`)
  }

  console.log(`
📋 Next steps for ${industry}/${pageName}:
1. Review and customize the generated files
2. Run test data script: cd mcp-server && node ${path.basename(testDataPath)}
3. Test the page at http://localhost:3007/${industry}/${pageName}
`)
}

function generateTransformer(entityName, entityType, fields) {
  return `import { format } from 'date-fns'

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
}

function generateTestDataScript(industry, pageName, entityType, entityName, fields, smartCodeBase) {
  return `#!/usr/bin/env node
/**
 * Setup ${entityName} Test Data for ${industry}
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
  console.log('🎯 Setting up ${entityName} Test Data for ${industry}...\\n');

  const testData = [
    {
      name: 'Sample ${entityName} 1',
      ${fields.map(f => `${f}: 'Sample ${f} value'`).join(',\n      ')}
    },
    {
      name: 'Sample ${entityName} 2',
      ${fields.map(f => `${f}: 'Another ${f} value'`).join(',\n      ')}
    },
    {
      name: 'Sample ${entityName} 3',
      ${fields.map(f => `${f}: 'Third ${f} value'`).join(',\n      ')}
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
          entity_code: \`${entityType.toUpperCase()}-\${Date.now()}-\${Math.random().toString(36).substr(2, 4)}\`,
          smart_code: '${smartCodeBase}.${entityType.toUpperCase()}.v1',
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
            smart_code: \`${smartCodeBase}.FIELD.\${field.field_name.toUpperCase()}.v1\`
          });
      }

      console.log(\`  📝 Added \${fields.length} fields\`);

    } catch (error) {
      console.error(\`❌ Error creating \${item.name}:\`, error.message);
    }
  }

  console.log('\\n✅ ${entityName} test data setup complete!');
}

// Run the setup
setup${entityName}TestData().catch(console.error);`
}

// Parse command line arguments
const args = process.argv.slice(2)
const industry = args[0]
const pageName = args[1]

if (!industry || !pageName) {
  console.log(`
Usage: npm run convert-universal [industry] [page-name]

Examples:
  npm run convert-universal salon appointments
  npm run convert-universal healthcare patients
  npm run convert-universal restaurant menu
  npm run convert-universal jewelry repair
  npm run convert-universal audit engagements

Available industries:
${Object.keys(SMART_CODE_PATTERNS).map(i => `  - ${i}`).join('\n')}

Common pages:
${Object.entries(UNIVERSAL_PAGE_CONFIGS)
  .slice(0, 10)
  .map(([page, config]) => `  - ${page} (${config.industries.join(', ')})`)
  .join('\n')}

See scripts/universal-conversion-config.js for all available pages.
`)
} else {
  convertPage(industry, pageName)
}