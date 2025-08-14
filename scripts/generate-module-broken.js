#!/usr/bin/env node

/**
 * HERA Module Generator - Steve Jobs Customer-Focused Template
 * 
 * Generates restaurant modules that speak customer language, not tech jargon
 * Usage: npm run generate-module --name=inventory --type=restaurant
 * 
 * Steve Jobs principle: "Focus is about saying no to the thousand good ideas"
 * This generator creates modules customers understand and love.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Get command line arguments
const args = process.argv.slice(2)
const getName = () => args.find(arg => arg.startsWith('--name='))?.split('=')[1]
const getType = () => args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'restaurant'

const moduleName = getName()
let moduleType = getType()

// Auto-detect restaurant modules and set appropriate type
if (['inventory', 'menu', 'staff', 'customers', 'orders', 'kitchen', 'delivery', 'suppliers'].includes(moduleName)) {
  moduleType = 'restaurant'
  console.log(`🍽️  Auto-detected restaurant module type for: ${moduleName}`)
}

if (!moduleName) {
  console.error('❌ Module name is required: --name=module_name')
  console.log('Examples:')
  console.log('  npm run generate-module --name=inventory --type=restaurant')
  console.log('  npm run generate-module --name=staff --type=restaurant')
  process.exit(1)
}

console.log(`🚀 Generating Restaurant Module: ${moduleName.toUpperCase()}`)
console.log(`📋 Module Type: ${moduleType}`)
console.log('⏱️  Steve Jobs principle: Simplicity is the ultimate sophistication')
console.log('')

// Customer-focused descriptions based on module name
function getCustomerDescription(name) {
  const descriptions = {
    inventory: 'Know what you have, when to reorder, stop wasting money',
    menu: 'Create dishes that sell, price them right, make more money',
    staff: 'Manage your team, track hours, control labor costs',
    customers: 'Keep customers happy, get them back, increase spending',
    orders: 'Take orders fast, deliver on time, get paid quickly',
    kitchen: 'Cook efficiently, reduce wait times, serve quality food',
    delivery: 'Get food to customers hot, fast, and profitable',
    suppliers: 'Better prices, reliable delivery, quality ingredients'
  }
  return descriptions[name] || `Manage your ${name} better, make more money`
}

// Module-specific entity types and configurations
function getModuleConfig(moduleName) {
  const configs = {
    staff: {
      entities: ['employee', 'manager', 'shift', 'role'],
      entityTypes: ['staff_employee', 'staff_manager', 'staff_shift'],
      transactions: ['timesheet', 'payroll', 'schedule', 'performance'],
      primaryIcon: 'Users',
      stats: [
        { title: 'Active Employees', value: '24', icon: 'Users', color: 'blue' },
        { title: 'Hours This Week', value: '1,280', icon: 'Clock', color: 'green' },
        { title: 'Labor Cost', value: '$18,450', icon: 'DollarSign', color: 'orange' },
        { title: 'Efficiency', value: '94.2%', icon: 'TrendingUp', color: 'purple' }
      ]
    },
    inventory: {
      entities: ['item', 'category', 'supplier', 'location'],
      entityTypes: ['inventory_item', 'inventory_category', 'inventory_supplier'],
      transactions: ['restock', 'usage', 'waste', 'audit'],
      primaryIcon: 'Package',
      stats: [
        { title: 'Total Items', value: '1,247', icon: 'Package', color: 'blue' },
        { title: 'Low Stock', value: '23', icon: 'AlertTriangle', color: 'red' },
        { title: 'Value', value: '$45,230', icon: 'DollarSign', color: 'green' },
        { title: 'Turnover', value: '12.4x', icon: 'TrendingUp', color: 'purple' }
      ]
    },
    menu: {
      entities: ['dish', 'category', 'ingredient', 'recipe'],
      entityTypes: ['menu_item', 'menu_category', 'menu_ingredient'],
      transactions: ['order', 'sale', 'review', 'update'],
      primaryIcon: 'Utensils',
      stats: [
        { title: 'Menu Items', value: '47', icon: 'Utensils', color: 'orange' },
        { title: 'Categories', value: '6', icon: 'Grid', color: 'blue' },
        { title: 'Avg Price', value: '$18.50', icon: 'DollarSign', color: 'green' },
        { title: 'Top Seller', value: 'Pizza', icon: 'Star', color: 'yellow' }
      ]
    }
  }
  
  // Default fallback
  return configs[moduleName] || {
    entities: ['item', 'category', 'supplier'],
    entityTypes: [`${moduleName}_item`, `${moduleName}_category`, `${moduleName}_supplier`],
    transactions: ['create', 'update', 'delete', 'report'],
    primaryIcon: 'Package',
    stats: [
      { title: 'Total Items', value: '1,247', icon: 'Package', color: 'blue' },
      { title: 'This Month', value: '8,932', icon: 'BarChart3', color: 'emerald' },
      { title: 'Active', value: '156', icon: 'CheckCircle', color: 'green' },
      { title: 'Health', value: '99.9%', icon: 'Settings', color: 'cyan' }
    ]
  }
}

// Customer-focused page titles
function getPageTitle(moduleName, pageName) {
  const titles = {
    dashboard: {
      inventory: '📦 Track Your Inventory',
      menu: '🍽️ Your Menu',
      staff: '👥 Your Team',
      customers: '😊 Your Customers',
      orders: '📝 Your Orders',
      kitchen: '🍳 Your Kitchen',
      delivery: '🚚 Delivery',
      suppliers: '🚛 Your Suppliers'
    },
    form: {
      inventory: '📦 Add New Item',
      menu: '🍽️ Add New Dish',
      staff: '👥 Add Team Member',
      customers: '😊 Add Customer',
      orders: '📝 New Order',
      kitchen: '🍳 Kitchen Item',
      delivery: '🚚 Setup Delivery',
      suppliers: '🚛 Add Supplier'
    },
    list: {
      inventory: '📦 All Items',
      menu: '🍽️ All Dishes',
      staff: '👥 All Staff',
      customers: '😊 All Customers',
      orders: '📝 All Orders',
      kitchen: '🍳 Kitchen Items',
      delivery: '🚚 Deliveries',
      suppliers: '🚛 All Suppliers'
    },
    reports: {
      inventory: '📦 Inventory Reports',
      menu: '🍽️ Menu Performance',
      staff: '👥 Staff Reports',
      customers: '😊 Customer Reports',
      orders: '📝 Sales Reports',
      kitchen: '🍳 Kitchen Reports',
      delivery: '🚚 Delivery Reports',
      suppliers: '🚛 Supplier Reports'
    }
  }
  
  return titles[pageName]?.[moduleName] || `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`
}

// Action descriptions for what users can do
function getActionDescription(moduleName) {
  const actions = {
    inventory: 'track what you have and never run out',
    menu: 'create dishes that customers love',
    staff: 'manage your team and control costs',
    customers: 'keep customers happy and coming back',
    orders: 'take orders fast and get paid quickly',
    kitchen: 'cook efficiently and serve quality food',
    delivery: 'get food to customers hot and fast',
    suppliers: 'get better prices and reliable delivery'
  }
  return actions[moduleName] || `manage your ${moduleName} effectively`
}

// Module configuration - customer-focused
const config = {
  prefix: moduleName.substring(0, 3).toUpperCase(),
  smartCodePattern: `HERA.${moduleName.substring(0, 3).toUpperCase()}`,
  description: `Restaurant ${moduleName} that makes money`,
  customerDescription: getCustomerDescription(moduleName),
  entities: ['item', 'order', 'customer', 'supplier'],
  transactions: ['sale', 'purchase', 'waste', 'reorder'],
  apis: ['entities', 'transactions', 'reports', 'validations'],
  ui: ['dashboard', 'list', 'form', 'reports'],
  color: 'orange'
}

// Create module directory structure
console.log('📁 Creating module directory structure...')

const modulePath = path.join(process.cwd(), 'src', 'app', 'restaurant', moduleName)
const apiPath = path.join(process.cwd(), 'src', 'app', 'api', 'v1', moduleName)

// Create directories
const dirsToCreate = [modulePath, apiPath]
dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`  ✅ Created: ${dir}`)
  }
})

// API Route Template - Uses direct Supabase queries like working menu/inventory APIs
function createApiRoute(endpoint) {
  return `import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * ${config.description} - ${endpoint} API
 * Generated by HERA Module Generator
 * 
 * Customer-focused API that just works
 */

// GET /${moduleName}/${endpoint} - Fetch items using universal schema
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id') || '550e8400-e29b-41d4-a716-446655440000' // Demo org
    const entityType = searchParams.get('entity_type') || '${moduleName}_item'
    const includeDynamicData = searchParams.get('include_dynamic_data') === 'true'
    
    // Get entities from universal core_entities table
    let query = supabaseAdmin
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .in('entity_type', ['${moduleName}_item', '${moduleName}_category', '${moduleName}_supplier'])
      .eq('status', 'active')
      .order('entity_name')

    if (entityType !== 'all') {
      query = query.eq('entity_type', entityType)
    }

    const { data: entities, error: entitiesError } = await query

    if (entitiesError) {
      console.error('Error fetching ${moduleName} entities:', entitiesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch ${moduleName} entities' },
        { status: 500 }
      )
    }

    // Get dynamic data for each entity if requested
    let enhancedEntities = entities
    if (includeDynamicData && entities.length > 0) {
      const entityIds = entities.map(e => e.id)
      const { data: dynamicData } = await supabaseAdmin
        .from('core_dynamic_data')
        .select('entity_id, field_name, field_type, field_value_text, field_value_number, field_value_json, ai_enhanced_value')
        .in('entity_id', entityIds)

      // Merge dynamic data with entities
      enhancedEntities = entities.map(entity => {
        const entityDynamicData = dynamicData?.filter(d => d.entity_id === entity.id) || []
        const dynamicFields = {}
        
        entityDynamicData.forEach(field => {
          let value = field.field_value_text
          if (field.field_type === 'number') value = field.field_value_number
          if (field.field_type === 'json') value = field.field_value_json
          
          dynamicFields[field.field_name] = {
            value,
            ai_enhanced: field.ai_enhanced_value,
            type: field.field_type
          }
        })
        
        return {
          ...entity,
          dynamic_fields: dynamicFields
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: enhancedEntities,
      count: enhancedEntities.length,
      module: '${moduleName.toUpperCase()}'
    })

  } catch (error) {
    console.error('${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /${moduleName}/${endpoint} - Create item using universal schema
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const {
      organization_id = '550e8400-e29b-41d4-a716-446655440000',
      entity_type = '${moduleName}_item',
      entity_name,
      entity_code,
      description,
      dynamic_fields = {},
      relationships = []
    } = body

    // Generate entity code if not provided
    const finalEntityCode = entity_code || \`${config.prefix}-\${entity_type.toUpperCase().slice(0,3)}-\${Date.now().toString().slice(-6)}\`

    // Create entity in core_entities
    const { data: entity, error: entityError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id,
        entity_type,
        entity_name,
        entity_code: finalEntityCode,
        status: 'active',
        ai_classification: dynamic_fields.category || '${moduleName}_item',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (entityError) {
      console.error('Error creating ${moduleName} entity:', entityError)
      return NextResponse.json(
        { success: false, message: 'Failed to create ${moduleName} entity', error: entityError },
        { status: 500 }
      )
    }

    // Create dynamic fields
    const dynamicFieldsData = []
    Object.entries(dynamic_fields).forEach(([fieldName, fieldValue]) => {
      if (fieldValue === null || fieldValue === undefined || fieldValue === '') return
      
      let fieldType = 'text'
      let textValue = null
      let numberValue = null
      let jsonValue = null

      if (typeof fieldValue === 'number') {
        fieldType = 'number'
        numberValue = fieldValue
      } else if (typeof fieldValue === 'object' && fieldValue !== null) {
        fieldType = 'json'
        jsonValue = fieldValue
      } else {
        fieldType = 'text'
        textValue = String(fieldValue)
      }

      dynamicFieldsData.push({
        organization_id,
        entity_id: entity.id,
        field_name: fieldName,
        field_type: fieldType,
        field_value_text: textValue,
        field_value_number: numberValue,
        field_value_json: jsonValue
      })
    })

    if (dynamicFieldsData.length > 0) {
      const { error: dynamicError } = await supabaseAdmin
        .from('core_dynamic_data')
        .insert(dynamicFieldsData)

      if (dynamicError) {
        console.error('Error creating dynamic fields:', dynamicError)
        // Continue - entity created successfully
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...entity,
        smart_code: \`HERA.${moduleName.toUpperCase()}.ITEM.\${finalEntityCode}.v1\`,
        dynamic_fields_created: dynamicFieldsData.length
      },
      message: \`${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} item created successfully\`
    })

  } catch (error) {
    console.error('${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
`
}

// Page Component Template - Module-specific and customer-focused
function createPageComponent(pageName) {
  const moduleConfig = getModuleConfig(moduleName)
  const pageConfig = getPageConfig(moduleName, pageName)
  
  if (pageName === 'form') {
    return createFormPageComponent(moduleConfig, pageConfig)
  } else if (pageName === 'list') {
    return createListPageComponent(moduleConfig, pageConfig)
  } else if (pageName === 'dashboard') {
    return createDashboardPageComponent(moduleConfig, pageConfig)
  } else {
    return createGenericPageComponent(moduleConfig, pageConfig, pageName)
  }
}

// Get page-specific configuration
function getPageConfig(moduleName, pageName) {
  const configs = {
    staff: {
      form: {
        title: '👥 Add Team Member',
        description: 'Add a new team member to control labor costs and track performance',
        fields: ['first_name', 'last_name', 'role', 'hourly_rate', 'phone', 'email', 'hire_date', 'skills', 'availability'],
        entityType: 'staff_employee'
      },
      list: {
        title: '👥 All Staff Members',
        description: 'Manage your team, track hours, control labor costs',
        displayFields: ['role', 'hourly_rate', 'phone', 'email', 'hire_date', 'skills']
      }
    },
    orders: {
      form: {
        title: '📝 New Order',
        description: 'Take orders fast, deliver on time, get paid quickly',
        fields: ['customer_name', 'order_type', 'items', 'total_amount', 'payment_method', 'delivery_address'],
        entityType: 'order'
      },
      list: {
        title: '📝 All Orders',
        description: 'Track orders, manage delivery, ensure customer satisfaction',
        displayFields: ['customer_name', 'order_type', 'total_amount', 'status', 'order_date']
      }
    },
    customers: {
      form: {
        title: '😊 Add Customer',
        description: 'Keep customers happy, get them back, increase spending',
        fields: ['company_name', 'contact_person', 'email', 'phone', 'loyalty_level', 'preferences'],
        entityType: 'customer'
      },
      list: {
        title: '😊 All Customers',
        description: 'Build relationships, track preferences, increase loyalty',
        displayFields: ['contact_person', 'email', 'phone', 'loyalty_level', 'last_visit']
      }
    },
    suppliers: {
      form: {
        title: '🚛 Add Supplier',
        description: 'Better prices, reliable delivery, quality ingredients',
        fields: ['company_name', 'contact_person', 'email', 'phone', 'products_supplied', 'payment_terms'],
        entityType: 'supplier'
      },
      list: {
        title: '🚛 All Suppliers',
        description: 'Manage vendors, track performance, control costs',
        displayFields: ['contact_person', 'email', 'phone', 'products_supplied', 'payment_terms']
      }
    }
  }
  
  return configs[moduleName]?.[pageName] || {
    title: `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`,
    description: getCustomerDescription(moduleName),
    fields: ['name', 'description', 'category'],
    entityType: `${moduleName}_item`
  }
}

// Create Form Page Component - Module Specific
function createFormPageComponent(moduleConfig, pageConfig) {
  const formFields = getFormFields(moduleName, pageConfig.fields)
  
  return `'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ${moduleConfig.primaryIcon}, ArrowLeft, Save, AlertCircle,
  ${getAdditionalIcons(moduleName)}
} from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * ${pageConfig.title} - ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Management Form
 * Customer-focused ${moduleName} management that restaurant owners understand
 * 
 * Steve Jobs: "Simplicity is the ultimate sophistication"
 */

export default function ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}FormPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('success')
  
  // Demo organization ID (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  // Form state
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    ${formFields.stateFields}
  })

  ${formFields.options}

  // Create ${moduleName} item
  const create${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Item = async () => {
    if (!formData.${formFields.requiredFields[0]}) {
      setNotificationMessage('Please fill in required fields')
      setNotificationType('error')
      setShowNotification(true)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/v1/${moduleName}/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          entity_type: '${pageConfig.entityType}',
          entity_name: formData.entity_name,
          entity_code: formData.entity_code || \`${config.prefix}-\${Date.now().toString().slice(-6)}\`,
          dynamic_fields: {
            ${formFields.dynamicFields}
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        setNotificationMessage('${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} created successfully! Redirecting...')
        setNotificationType('success')
        setShowNotification(true)
        
        setTimeout(() => {
          router.push('/restaurant/${moduleName}/dashboard')
        }, 2000)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Error creating ${moduleName}:', error)
      setNotificationMessage('Failed to create ${moduleName}. Please try again.')
      setNotificationType('error')
      setShowNotification(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Badge className="bg-${moduleConfig.stats[0].color}-500/20 text-${moduleConfig.stats[0].color}-600 border-${moduleConfig.stats[0].color}-500/30">
              Mario's Restaurant
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-${moduleConfig.stats[0].color}-400 to-${moduleConfig.stats[1].color}-600 bg-clip-text text-transparent">
            ${pageConfig.title}
          </h1>
          <p className="text-gray-600 mt-2">
            ${pageConfig.description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            ${formFields.formSections}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button
                    onClick={create${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Item}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-${moduleConfig.stats[0].color}-500 to-${moduleConfig.stats[1].color}-600"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/restaurant/${moduleName}/dashboard')}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Why This Helps */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <${moduleConfig.primaryIcon} className="w-5 h-5" />
                  Why This Matters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border text-sm">
                    ${getBenefits(moduleName)}
                  </div>
                  <p className="text-xs text-green-600">
                    ${getImpactMessage(moduleName)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notification */}
        {showNotification && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className={\`p-4 rounded-lg shadow-lg \${
              notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white\`}>
              <div className="flex items-center">
                {notificationType === 'success' ? (
                  <Save className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                {notificationMessage}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}`
}

// Create List Page Component - Module Specific  
function createListPageComponent(moduleConfig, pageConfig) {
  return `'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  ${moduleConfig.primaryIcon}, ${getListIcons(moduleName)},
  Search, Plus, Edit, Trash2, Eye, ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * ${pageConfig.title} - Complete ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} List with CRUD
 * Customer-focused ${moduleName} management that restaurant owners understand
 */

export default function ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}ListPage() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  // Demo organization ID (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  // Analytics Stats
  const [stats, setStats] = useState({
    ${getStatsInit(moduleName)}
  })

  useEffect(() => {
    loadData()
  }, [])

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch(\`/api/v1/${moduleName}/entities?organization_id=\${organizationId}&entity_type=${pageConfig.entityType}&include_dynamic_data=true\`)
      const result = await response.json()
      
      if (result.success) {
        setItems(result.data || [])
        ${getStatsUpdate(moduleName)}
      }
      
    } catch (error) {
      console.error('Error loading ${moduleName} data:', error)
      setNotificationMessage('Failed to load ${moduleName} data')
      setShowNotification(true)
    } finally {
      setLoading(false)
    }
  }

  // Filter items
  const filteredItems = items.filter(item => 
    item.entity_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.push('/restaurant/${moduleName}/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Badge className="bg-${moduleConfig.stats[0].color}-500/20 text-${moduleConfig.stats[0].color}-600 border-${moduleConfig.stats[0].color}-500/30">
              Mario's Restaurant
            </Badge>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-${moduleConfig.stats[0].color}-400 to-${moduleConfig.stats[1].color}-600 bg-clip-text text-transparent">
                ${pageConfig.title}
              </h1>
              <p className="text-gray-600 mt-2">
                ${pageConfig.description}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/restaurant/${moduleName}/form')}
                className="bg-gradient-to-r from-${moduleConfig.stats[0].color}-500 to-${moduleConfig.stats[1].color}-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${moduleConfig.stats.length} gap-4 mb-8">
          ${generateStatsCards(moduleConfig.stats)}
        </div>

        {/* List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <${moduleConfig.primaryIcon} className="w-5 h-5" />
                ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} ({filteredItems.length})
              </CardTitle>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4">
                  <div className="animate-spin w-full h-full border-4 border-${moduleConfig.stats[0].color}-200 border-t-${moduleConfig.stats[0].color}-500 rounded-full" />
                </div>
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <${moduleConfig.primaryIcon} className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Items Found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery ? 'Try adjusting your search' : 'Start by adding your first item'}
                </p>
                <Button
                  onClick={() => router.push('/restaurant/${moduleName}/form')}
                  className="bg-gradient-to-r from-${moduleConfig.stats[0].color}-500 to-${moduleConfig.stats[1].color}-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-all hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{item.entity_name}</h3>
                        <Badge className="bg-${moduleConfig.stats[0].color}-100 text-${moduleConfig.stats[0].color}-800">
                          {item.status}
                        </Badge>
                      </div>
                      
                      ${getItemDisplayFields(moduleName, pageConfig.displayFields)}
                      
                      <div className="flex space-x-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Why This Matters */}
        <Card className="mt-8 bg-gradient-to-r from-${moduleConfig.stats[0].color}-500/10 to-${moduleConfig.stats[1].color}-500/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">🎯 Why Your ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Matters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              ${getWhyItMatters(moduleName)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`
}

// Create Dashboard Component - Module Specific
function createDashboardPageComponent(moduleConfig, pageConfig) {
  return `'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ${moduleConfig.primaryIcon}, ${getDashboardIcons(moduleName)}, Plus
} from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * ${getPageTitle(moduleName, 'dashboard')} - Main Dashboard
 * Customer-focused ${moduleName} management that restaurant owners understand
 */

export default function ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  // Demo organization ID (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  useEffect(() => {
    loadModuleData()
  }, [])

  const loadModuleData = async () => {
    setLoading(true)
    try {
      const response = await fetch(\`/api/v1/${moduleName}/entities?organization_id=\${organizationId}&entity_type=${getEntityType(moduleName)}&include_dynamic_data=true\`)
      const result = await response.json()
      setData(result.data || [])
      console.log('${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} data loaded:', result)
    } catch (error) {
      console.error('Error loading ${moduleName} data:', error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-${moduleConfig.stats[0].color}-400 to-${moduleConfig.stats[1].color}-600 bg-clip-text text-transparent">
                ${getPageTitle(moduleName, 'dashboard')}
              </h1>
              <p className="text-gray-600 mt-2">
                ${config.customerDescription}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/restaurant/${moduleName}/form')}
                className="bg-gradient-to-r from-${moduleConfig.stats[0].color}-500 to-${moduleConfig.stats[1].color}-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/restaurant/${moduleName}/list')}
              >
                View All
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${moduleConfig.stats.length} gap-6 mb-8">
          ${generateStatsCards(moduleConfig.stats)}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          ${getQuickActions(moduleName)}
        </div>

        {/* Why This Matters */}
        <Card className="bg-gradient-to-r from-${moduleConfig.stats[0].color}-500/10 to-${moduleConfig.stats[1].color}-500/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">🎯 Why Your ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Drives Everything</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              ${getWhyItMatters(moduleName)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`
}

// Generic page component for reports, etc.
function createGenericPageComponent(moduleConfig, pageConfig, pageName) {
  return `'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ${moduleConfig.primaryIcon}, ArrowLeft, BarChart3, TrendingUp
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}${pageName.charAt(0).toUpperCase() + pageName.slice(1)}Page() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.push('/restaurant/${moduleName}/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-${moduleConfig.stats[0].color}-400 to-${moduleConfig.stats[1].color}-600 bg-clip-text text-transparent">
            ${getPageTitle(moduleName, pageName)}
          </h1>
          <p className="text-gray-600 mt-2">
            ${config.customerDescription}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <${moduleConfig.primaryIcon} className="w-5 h-5" />
              ${pageName.charAt(0).toUpperCase() + pageName.slice(1)} Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <${moduleConfig.primaryIcon} className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}</h3>
              <p className="text-gray-500 mb-6">
                ${pageConfig.description || config.customerDescription}
              </p>
              <Button className="bg-gradient-to-r from-${moduleConfig.stats[0].color}-500 to-${moduleConfig.stats[1].color}-600">
                Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`
}

// Generate APIs
console.log('🚀 Generating APIs...')
config.apis.forEach(endpoint => {
  const apiDir = path.join(apiPath, endpoint)
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true })
  }
  
  const routeFile = path.join(apiDir, 'route.ts')
  fs.writeFileSync(routeFile, createApiRoute(endpoint))
  console.log(`  Generated API: /api/v1/${moduleName}/${endpoint}`)
})

// Generate UI Pages
console.log('🎨 Generating UI Pages...')
config.ui.forEach(pageName => {
  const pageDir = path.join(modulePath, pageName)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  
  const pageFile = path.join(pageDir, 'page.tsx')
  fs.writeFileSync(pageFile, createPageComponent(pageName))
  console.log(`  ✅ Generated Page: /restaurant/${moduleName}/${pageName}`)
})

// Generate module configuration file
console.log('⚙️  Generating module configuration...')
const moduleConfig = {
  name: moduleName,
  type: moduleType,
  prefix: config.prefix,
  description: config.description,
  customer_description: config.customerDescription,
  entities: config.entities,
  transactions: config.transactions,
  apis: config.apis,
  ui: config.ui,
  generated_at: new Date().toISOString(),
  generated_by: 'HERA_MODULE_GENERATOR_CUSTOMER_FOCUSED',
  version: '2.0.0',
  steve_jobs_principle: 'Simplicity is the ultimate sophistication'
}

const configFile = path.join(modulePath, 'module.config.json')
fs.writeFileSync(configFile, JSON.stringify(moduleConfig, null, 2))
console.log(`  ✅ Generated config: ${configFile}`)

// Generate README for the module
console.log('📖 Generating module documentation...')
const readmeContent = `# ${getPageTitle(moduleName, 'dashboard').replace(/📦|🍽️|👥|😊|📝|🍳|🚚|🚛/g, '').trim()}

${config.customerDescription}

## ✅ What You Get

**Everything you need to ${getActionDescription(moduleName)}:**

1. ✅ **Dashboard** - See everything at a glance
2. ✅ **Add Items** - Quick and easy item creation
3. ✅ **View All** - Complete list with search and filters
4. ✅ **Reports** - Track performance and make decisions
5. ✅ **Live Updates** - Real-time data that stays current
6. ✅ **Smart Suggestions** - Get recommendations that help

## 🚀 Get Started

\`\`\`bash
# See your ${moduleName} dashboard
http://localhost:3000/restaurant/${moduleName}/dashboard

# Add your first item
http://localhost:3000/restaurant/${moduleName}/form
\`\`\`

## 💰 Why This Matters

- **Start Making Money Today**: Set up in minutes, not months
- **Everything Connected**: Works with your other restaurant systems
- **Smart Suggestions**: Get recommendations that increase profit
- **No Learning Curve**: Simple interface anyone can use

## 🎯 Built for Restaurant Success

**${config.customerDescription}**

- **Simple**: No complicated setup or training needed
- **Fast**: See results immediately, not weeks later
- **Profitable**: Every feature helps you make more money
- **Reliable**: Built to work when you need it most

---

*"Simplicity is the ultimate sophistication" - Steve Jobs*`

const readmeFile = path.join(modulePath, 'README.md')
fs.writeFileSync(readmeFile, readmeContent)
console.log(`  ✅ Generated README: ${readmeFile}`)

// Success summary
console.log('')
console.log('🎉 RESTAURANT MODULE COMPLETE!')
console.log('')
console.log(`📋 Module: ${moduleName.toUpperCase()} (${moduleType})`)
console.log(`🎯 Purpose: ${config.customerDescription}`)
console.log(`📁 Pages Generated: ${config.ui.length}`)
console.log(`🚀 APIs Generated: ${config.apis.length}`)
console.log(`✨ Steve Jobs Principle: Focus on what customers need`)
console.log('')
console.log('🚀 Next Steps:')
console.log(`1. Visit: http://localhost:3000/restaurant/${moduleName}/dashboard`)
console.log(`2. Add your first item: http://localhost:3000/restaurant/${moduleName}/form`)
console.log(`3. Customize to fit your restaurant`)
console.log('')
console.log('🎯 Remember: "Simplicity is the ultimate sophistication"')

// Helper functions for module-specific generation

// Get form fields configuration for different modules
function getFormFields(moduleName, fields) {
  const fieldConfigs = {
    staff: {
      stateFields: `first_name: '',
    last_name: '',
    role: '',
    hourly_rate: '',
    phone: '',
    email: '',
    hire_date: '',
    skills: [],
    availability: []`,
      requiredFields: ['first_name', 'last_name', 'role'],
      dynamicFields: `first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
            hourly_rate: parseFloat(formData.hourly_rate) || 0,
            phone: formData.phone,
            email: formData.email,
            hire_date: formData.hire_date,
            skills: formData.skills,
            availability: formData.availability`,
      options: `// Staff roles
  const staffRoles = ['Server', 'Cook', 'Manager', 'Host/Hostess', 'Bartender']
  const skillOptions = ['Customer Service', 'Food Safety', 'POS Systems', 'Cash Handling']`,
      formSections: `<Card>
              <CardHeader>
                <CardTitle>Employee Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
                  </div>
                </div>
                <div>
                  <Label>Role *</Label>
                  <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full p-2 border rounded">
                    <option value="">Select Role</option>
                    {staffRoles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Hourly Rate</Label>
                  <Input type="number" value={formData.hourly_rate} onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})} />
                </div>
              </CardContent>
            </Card>`
    },
    orders: {
      stateFields: `customer_name: '',
    order_type: 'dine_in',
    items: [],
    total_amount: '',
    payment_method: '',
    delivery_address: ''`,
      requiredFields: ['customer_name', 'total_amount'],
      dynamicFields: `customer_name: formData.customer_name,
            order_type: formData.order_type,
            items: formData.items,
            total_amount: parseFloat(formData.total_amount) || 0,
            payment_method: formData.payment_method,
            delivery_address: formData.delivery_address`,
      options: `// Order types
  const orderTypes = ['dine_in', 'takeout', 'delivery']
  const paymentMethods = ['cash', 'credit_card', 'debit_card']`,
      formSections: `<Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Customer Name *</Label>
                  <Input value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} />
                </div>
                <div>
                  <Label>Order Type</Label>
                  <select value={formData.order_type} onChange={(e) => setFormData({...formData, order_type: e.target.value})} className="w-full p-2 border rounded">
                    {orderTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Total Amount *</Label>
                  <Input type="number" step="0.01" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} />
                </div>
              </CardContent>
            </Card>`
    },
    customers: {
      stateFields: `company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    loyalty_level: 'new',
    preferences: ''`,
      requiredFields: ['company_name', 'contact_person'],
      dynamicFields: `company_name: formData.company_name,
            contact_person: formData.contact_person,
            email: formData.email,
            phone: formData.phone,
            loyalty_level: formData.loyalty_level,
            preferences: formData.preferences`,
      options: `// Customer loyalty levels
  const loyaltyLevels = ['new', 'regular', 'vip', 'premium']`,
      formSections: `<Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} />
                </div>
                <div>
                  <Label>Contact Person *</Label>
                  <Input value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
              </CardContent>
            </Card>`
    }
  }
  
  return fieldConfigs[moduleName] || {
    stateFields: `name: '',
    description: '',
    category: ''`,
    requiredFields: ['name'],
    dynamicFields: `name: formData.name,
            description: formData.description,
            category: formData.category`,
    options: '',
    formSections: `<Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
              </CardContent>
            </Card>`
  }
}

// Get additional icons for different modules
function getAdditionalIcons(moduleName) {
  const icons = {
    staff: 'Phone, Mail, Calendar, Clock, Star',
    orders: 'ShoppingCart, CreditCard, Truck, MapPin',
    customers: 'Building, Heart, Gift, MessageCircle',
    suppliers: 'Factory, Truck, Package, FileText'
  }
  return icons[moduleName] || 'Settings, Info, CheckCircle'
}

// Get list icons for different modules
function getListIcons(moduleName) {
  const icons = {
    staff: 'Clock, DollarSign, Star, Calendar',
    orders: 'ShoppingCart, CreditCard, Truck, Calendar', 
    customers: 'Building, Heart, Phone, Mail',
    suppliers: 'Factory, Truck, Package, FileText'
  }
  return icons[moduleName] || 'BarChart3, TrendingUp'
}

// Get dashboard icons
function getDashboardIcons(moduleName) {
  const icons = {
    staff: 'Clock, DollarSign, TrendingUp, Star',
    orders: 'ShoppingCart, DollarSign, Clock, TrendingUp',
    customers: 'Heart, Phone, MessageCircle, Gift',
    suppliers: 'Factory, Truck, FileText, CheckCircle'
  }
  return icons[moduleName] || 'BarChart3, Settings'
}

// Get entity type for API calls
function getEntityType(moduleName) {
  const types = {
    staff: 'staff_employee',
    orders: 'order',
    customers: 'customer',
    suppliers: 'supplier'
  }
  return types[moduleName] || \`\${moduleName}_item\`
}

// Get benefits text for sidebar
function getBenefits(moduleName) {
  const benefits = {
    staff: '✓ Control labor costs automatically<br/>✓ Schedule the right people at right times<br/>✓ Track performance and productivity',
    orders: '✓ Take orders faster than ever<br/>✓ Track delivery and customer satisfaction<br/>✓ Get paid quickly and reliably',
    customers: '✓ Build stronger customer relationships<br/>✓ Track preferences and increase loyalty<br/>✓ Turn one-time buyers into regulars',
    suppliers: '✓ Get better prices through tracking<br/>✓ Ensure reliable delivery schedules<br/>✓ Monitor quality and performance'
  }
  return benefits[moduleName] || '✓ Streamline your operations<br/>✓ Save time and money<br/>✓ Make better business decisions'
}

// Get impact message
function getImpactMessage(moduleName) {
  const messages = {
    staff: 'Every hour tracked helps you make better staffing decisions and control your biggest expense after food costs.',
    orders: 'Every order processed efficiently means happier customers and better cash flow for your restaurant.',
    customers: 'Every customer relationship you build increases repeat business and word-of-mouth referrals.',
    suppliers: 'Every supplier relationship you track helps you get better prices and more reliable service.'
  }
  return messages[moduleName] || 'Every improvement you make helps your restaurant run more efficiently and profitably.'
}

// Generate stats initialization
function getStatsInit(moduleName) {
  const inits = {
    staff: 'totalStaff: 0, activeStaff: 0, avgHourlyRate: 0, weeklyHours: 0',
    orders: 'totalOrders: 0, todayOrders: 0, totalRevenue: 0, avgOrderValue: 0',
    customers: 'totalCustomers: 0, activeCustomers: 0, avgSpending: 0, loyaltyMembers: 0',
    suppliers: 'totalSuppliers: 0, activeSuppliers: 0, avgDeliveryTime: 0, qualityScore: 0'
  }
  return inits[moduleName] || 'totalItems: 0, activeItems: 0'
}

// Generate stats update logic
function getStatsUpdate(moduleName) {
  const updates = {
    staff: \`const activeStaff = result.data.filter(member => member.status === 'active').length
        const avgRate = result.data.reduce((sum, member) => sum + (member.dynamic_fields?.hourly_rate?.value || 0), 0) / result.data.length
        setStats(prev => ({ ...prev, totalStaff: result.data.length, activeStaff, avgHourlyRate: avgRate || 0 }))\`,
    orders: \`const todayOrders = result.data.filter(order => new Date(order.created_at).toDateString() === new Date().toDateString()).length
        const totalRevenue = result.data.reduce((sum, order) => sum + (order.dynamic_fields?.total_amount?.value || 0), 0)
        setStats(prev => ({ ...prev, totalOrders: result.data.length, todayOrders, totalRevenue }))\`,
    customers: \`const activeCustomers = result.data.filter(customer => customer.status === 'active').length
        setStats(prev => ({ ...prev, totalCustomers: result.data.length, activeCustomers }))\`,
    suppliers: \`const activeSuppliers = result.data.filter(supplier => supplier.status === 'active').length
        setStats(prev => ({ ...prev, totalSuppliers: result.data.length, activeSuppliers }))\`
  }
  return updates[moduleName] || 'setStats(prev => ({ ...prev, totalItems: result.data.length }))'
}

// Generate stats cards
function generateStatsCards(stats) {
  return stats.map((stat, index) => \`
          <Card key={\${index}}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">\${stat.title}</p>
                  <p className="text-2xl font-bold">\${stat.value}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-\${stat.color}-500 to-\${stat.color}-600 rounded-lg flex items-center justify-center">
                  <\${stat.icon} className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>\`).join('')
}

// Get item display fields for list view
function getItemDisplayFields(moduleName, displayFields) {
  const displays = {
    staff: \`{item.dynamic_fields?.role?.value && (
                        <p className="text-green-600 font-semibold mb-2">
                          \${item.dynamic_fields.role.value} - \$\${item.dynamic_fields?.hourly_rate?.value || 0}/hour
                        </p>
                      )}
                      {item.dynamic_fields?.phone?.value && (
                        <p className="text-sm text-gray-600">📞 \${item.dynamic_fields.phone.value}</p>
                      )}\`,
    orders: \`{item.dynamic_fields?.total_amount?.value && (
                        <p className="text-green-600 font-semibold mb-2">
                          \$\${item.dynamic_fields.total_amount.value}
                        </p>
                      )}
                      {item.dynamic_fields?.order_type?.value && (
                        <p className="text-sm text-gray-600">Type: \${item.dynamic_fields.order_type.value}</p>
                      )}\`,
    customers: \`{item.dynamic_fields?.contact_person?.value && (
                        <p className="text-blue-600 font-semibold mb-2">
                          Contact: \${item.dynamic_fields.contact_person.value}
                        </p>
                      )}
                      {item.dynamic_fields?.loyalty_level?.value && (
                        <p className="text-sm text-gray-600">Level: \${item.dynamic_fields.loyalty_level.value}</p>
                      )}\`,
    suppliers: \`{item.dynamic_fields?.contact_person?.value && (
                        <p className="text-blue-600 font-semibold mb-2">
                          Contact: \${item.dynamic_fields.contact_person.value}
                        </p>
                      )}
                      {item.dynamic_fields?.products_supplied?.value && (
                        <p className="text-sm text-gray-600">Supplies: \${item.dynamic_fields.products_supplied.value}</p>
                      )}\`
  }
  return displays[moduleName] || \`<p className="text-sm text-gray-600">\${item.entity_code}</p>\`
}

// Get "Why it matters" content
function getWhyItMatters(moduleName) {
  const matters = {
    staff: \`<div>
                <strong className="text-blue-600">Control Labor Costs:</strong><br/>
                Track every hour and dollar spent on staffing - your second biggest expense.
              </div>
              <div>
                <strong className="text-green-600">Perfect Scheduling:</strong><br/>
                Right people, right time, every shift. No more overstaffing.
              </div>
              <div>
                <strong className="text-purple-600">Track Performance:</strong><br/>
                See who your best performers are and reward them accordingly.
              </div>\`,
    orders: \`<div>
                <strong className="text-blue-600">Faster Service:</strong><br/>
                Take orders quickly and accurately, reducing wait times.
              </div>
              <div>
                <strong className="text-green-600">Better Cash Flow:</strong><br/>
                Track payments and deliveries to ensure you get paid on time.
              </div>
              <div>
                <strong className="text-purple-600">Customer Satisfaction:</strong><br/>
                Happy customers come back and recommend you to others.
              </div>\`,
    customers: \`<div>
                <strong className="text-blue-600">Build Loyalty:</strong><br/>
                Track preferences and build relationships that last.
              </div>
              <div>
                <strong className="text-green-600">Increase Spending:</strong><br/>
                Loyal customers spend more and visit more often.
              </div>
              <div>
                <strong className="text-purple-600">Word of Mouth:</strong><br/>
                Happy customers bring their friends and family.
              </div>\`,
    suppliers: \`<div>
                <strong className="text-blue-600">Better Prices:</strong><br/>
                Track performance to negotiate better deals and terms.
              </div>
              <div>
                <strong className="text-green-600">Reliable Delivery:</strong><br/>
                Ensure you never run out of key ingredients.
              </div>
              <div>
                <strong className="text-purple-600">Quality Control:</strong><br/>
                Monitor quality to maintain your restaurant's standards.
              </div>\`
  }
  return matters[moduleName] || \`<div><strong>Streamline Operations</strong><br/>Make your restaurant run more efficiently.</div>\`
}

// Get quick actions for dashboard
function getQuickActions(moduleName) {
  const actions = {
    staff: \`<Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h3 className="font-semibold mb-2">Schedule Staff</h3>
              <p className="text-sm text-gray-600">Plan your shifts and manage availability</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">Track Hours</h3>
              <p className="text-sm text-gray-600">Monitor work hours and calculate pay</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-purple-500" />
              <h3 className="font-semibold mb-2">Labor Costs</h3>
              <p className="text-sm text-gray-600">Analyze and control staffing expenses</p>
            </CardContent>
          </Card>\`,
    orders: \`<Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h3 className="font-semibold mb-2">New Order</h3>
              <p className="text-sm text-gray-600">Take a new customer order quickly</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="font-semibold mb-2">Track Delivery</h3>
              <p className="text-sm text-gray-600">Monitor order status and delivery times</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-purple-500" />
              <h3 className="font-semibold mb-2">Sales Report</h3>
              <p className="text-sm text-gray-600">View daily and monthly sales data</p>
            </CardContent>
          </Card>\`
  }
  return actions[moduleName] || \`<Card><CardContent className="p-6 text-center"><Package className="w-12 h-12 mx-auto mb-4" /><h3>Quick Action</h3></CardContent></Card>\`
}