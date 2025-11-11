#!/usr/bin/env node

/**
 * HERA Master Data Template Generator
 * Generates standardized master data creation pages with AI assistant integration
 * 
 * Usage: node scripts/generate-master-data-template.js ENTITY_TYPE MODULE_PATH
 * Example: node scripts/generate-master-data-template.js customer /enterprise/crm/customers
 */

const fs = require('fs')
const path = require('path')

// Entity type configurations
const ENTITY_CONFIGS = {
  customer: {
    label: 'Customer',
    icon: 'Users',
    module: 'CRM',
    sections: [
      { id: 'basic', label: 'Basic Information', icon: 'Users', required: true, description: 'Enter customer company details and classification' },
      { id: 'contact', label: 'Contact Details', icon: 'User', required: true, description: 'Add primary and secondary contact information' },
      { id: 'address', label: 'Address Information', icon: 'MapPin', required: true, description: 'Provide customer business address details' },
      { id: 'business', label: 'Business Terms', icon: 'Briefcase', required: false, description: 'Configure business relationships and terms' },
      { id: 'preferences', label: 'Preferences', icon: 'Settings', required: false, description: 'Set communication and service preferences' }
    ],
    fields: [
      // Basic Information
      { id: 'customer_name', label: 'Customer Name', type: 'text', required: true, placeholder: 'Enter customer company name', section: 'basic' },
      { id: 'customer_code', label: 'Customer Code', type: 'text', required: true, placeholder: 'Auto-generated from name', section: 'basic' },
      { id: 'customer_type', label: 'Customer Type', type: 'select', required: true, section: 'basic', options: [
        { value: 'corporate', label: 'Corporate', description: 'Large corporate customers' },
        { value: 'sme', label: 'Small/Medium Enterprise', description: 'SME customers' },
        { value: 'individual', label: 'Individual', description: 'Individual customers' },
        { value: 'government', label: 'Government', description: 'Government entities' }
      ]},
      { id: 'industry', label: 'Industry', type: 'text', placeholder: 'Customer industry sector', section: 'basic' },
      { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Brief description of customer business', section: 'basic' },
      { id: 'website', label: 'Website', type: 'url', placeholder: 'https://www.customer-website.com', section: 'basic' },

      // Contact Details
      { id: 'primary_contact_name', label: 'Primary Contact Name', type: 'text', required: true, placeholder: 'Contact person full name', section: 'contact' },
      { id: 'primary_contact_email', label: 'Primary Contact Email', type: 'email', required: true, placeholder: 'contact@customer.com', section: 'contact' },
      { id: 'primary_contact_phone', label: 'Primary Contact Phone', type: 'phone', required: true, placeholder: '+1 (555) 123-4567', section: 'contact' },
      { id: 'secondary_contact_name', label: 'Secondary Contact Name', type: 'text', placeholder: 'Secondary contact person', section: 'contact' },
      { id: 'secondary_contact_email', label: 'Secondary Contact Email', type: 'email', placeholder: 'secondary@customer.com', section: 'contact' },

      // Address Information
      { id: 'address_line_1', label: 'Address Line 1', type: 'text', required: true, placeholder: 'Street address, building number', section: 'address' },
      { id: 'address_line_2', label: 'Address Line 2', type: 'text', placeholder: 'Suite, unit, floor (optional)', section: 'address' },
      { id: 'city', label: 'City', type: 'text', required: true, placeholder: 'City', section: 'address' },
      { id: 'country', label: 'Country', type: 'text', required: true, placeholder: 'Country', section: 'address' },

      // Business Terms
      { id: 'credit_limit', label: 'Credit Limit', type: 'number', placeholder: 'Customer credit limit', section: 'business' },
      { id: 'payment_terms', label: 'Payment Terms', type: 'select', section: 'business', options: [
        { value: 'net30', label: 'Net 30', description: 'Payment due within 30 days' },
        { value: 'net15', label: 'Net 15', description: 'Payment due within 15 days' },
        { value: 'cod', label: 'Cash on Delivery', description: 'Payment upon delivery' }
      ]},

      // Preferences
      { id: 'preferred_contact_method', label: 'Preferred Contact Method', type: 'select', section: 'preferences', options: [
        { value: 'email', label: 'Email', description: 'Contact via email' },
        { value: 'phone', label: 'Phone', description: 'Contact via phone' },
        { value: 'both', label: 'Both', description: 'Either email or phone' }
      ]},
      { id: 'communication_language', label: 'Communication Language', type: 'text', placeholder: 'Preferred language for communication', section: 'preferences' }
    ]
  },

  product: {
    label: 'Product',
    icon: 'Package',
    module: 'INVENTORY',
    sections: [
      { id: 'basic', label: 'Basic Information', icon: 'Package', required: true, description: 'Enter product details and classification' },
      { id: 'specifications', label: 'Specifications', icon: 'Clipboard', required: true, description: 'Define product specifications and attributes' },
      { id: 'pricing', label: 'Pricing & Costing', icon: 'DollarSign', required: false, description: 'Set pricing and cost information' },
      { id: 'inventory', label: 'Inventory Settings', icon: 'Warehouse', required: false, description: 'Configure inventory management settings' },
      { id: 'compliance', label: 'Compliance & Documents', icon: 'FileText', required: false, description: 'Add compliance requirements and documentation' }
    ],
    fields: [
      // Basic Information
      { id: 'product_name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name', section: 'basic' },
      { id: 'product_code', label: 'Product Code', type: 'text', required: true, placeholder: 'Auto-generated from name', section: 'basic' },
      { id: 'category', label: 'Category', type: 'select', required: true, section: 'basic', options: [
        { value: 'finished_goods', label: 'Finished Goods', description: 'Ready-to-sell products' },
        { value: 'raw_materials', label: 'Raw Materials', description: 'Materials used in production' },
        { value: 'components', label: 'Components', description: 'Product components and parts' },
        { value: 'services', label: 'Services', description: 'Service-based products' }
      ]},
      { id: 'brand', label: 'Brand', type: 'text', placeholder: 'Product brand', section: 'basic' },
      { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Detailed product description', section: 'basic' },

      // Specifications
      { id: 'unit_of_measure', label: 'Unit of Measure', type: 'select', required: true, section: 'specifications', options: [
        { value: 'each', label: 'Each (EA)', description: 'Individual units' },
        { value: 'kg', label: 'Kilogram (KG)', description: 'Weight in kilograms' },
        { value: 'liter', label: 'Liter (L)', description: 'Volume in liters' },
        { value: 'meter', label: 'Meter (M)', description: 'Length in meters' }
      ]},
      { id: 'weight', label: 'Weight', type: 'number', placeholder: 'Product weight', section: 'specifications' },
      { id: 'dimensions', label: 'Dimensions', type: 'text', placeholder: 'L x W x H', section: 'specifications' },
      { id: 'color', label: 'Color', type: 'text', placeholder: 'Product color', section: 'specifications' },

      // Pricing
      { id: 'cost_price', label: 'Cost Price', type: 'number', placeholder: 'Product cost', section: 'pricing' },
      { id: 'selling_price', label: 'Selling Price', type: 'number', placeholder: 'Product selling price', section: 'pricing' },
      { id: 'currency', label: 'Currency', type: 'text', placeholder: 'USD, EUR, etc.', section: 'pricing' },

      // Inventory
      { id: 'minimum_stock', label: 'Minimum Stock Level', type: 'number', placeholder: 'Minimum stock quantity', section: 'inventory' },
      { id: 'maximum_stock', label: 'Maximum Stock Level', type: 'number', placeholder: 'Maximum stock quantity', section: 'inventory' },
      { id: 'reorder_point', label: 'Reorder Point', type: 'number', placeholder: 'Reorder trigger quantity', section: 'inventory' },

      // Compliance
      { id: 'regulatory_code', label: 'Regulatory Code', type: 'text', placeholder: 'Regulatory classification code', section: 'compliance' },
      { id: 'safety_requirements', label: 'Safety Requirements', type: 'textarea', placeholder: 'Safety and handling requirements', section: 'compliance' }
    ]
  },

  account: {
    label: 'Account',
    icon: 'CreditCard',
    module: 'FINANCE',
    sections: [
      { id: 'basic', label: 'Basic Information', icon: 'CreditCard', required: true, description: 'Enter account details and classification' },
      { id: 'configuration', label: 'Configuration', icon: 'Settings', required: true, description: 'Configure account behavior and rules' },
      { id: 'reporting', label: 'Reporting & Analysis', icon: 'BarChart', required: false, description: 'Set reporting and analysis preferences' },
      { id: 'controls', label: 'Controls & Approval', icon: 'Shield', required: false, description: 'Define approval workflows and controls' }
    ],
    fields: [
      // Basic Information
      { id: 'account_name', label: 'Account Name', type: 'text', required: true, placeholder: 'Enter account name', section: 'basic' },
      { id: 'account_code', label: 'Account Code', type: 'text', required: true, placeholder: 'Auto-generated from name', section: 'basic' },
      { id: 'account_type', label: 'Account Type', type: 'select', required: true, section: 'basic', options: [
        { value: 'asset', label: 'Asset', description: 'Asset accounts' },
        { value: 'liability', label: 'Liability', description: 'Liability accounts' },
        { value: 'equity', label: 'Equity', description: 'Equity accounts' },
        { value: 'revenue', label: 'Revenue', description: 'Revenue accounts' },
        { value: 'expense', label: 'Expense', description: 'Expense accounts' }
      ]},
      { id: 'parent_account', label: 'Parent Account', type: 'text', placeholder: 'Parent account reference', section: 'basic' },
      { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Account description and purpose', section: 'basic' },

      // Configuration
      { id: 'currency', label: 'Currency', type: 'text', required: true, placeholder: 'Account currency (USD, EUR, etc.)', section: 'configuration' },
      { id: 'is_active', label: 'Active Status', type: 'select', required: true, section: 'configuration', options: [
        { value: 'active', label: 'Active', description: 'Account is active' },
        { value: 'inactive', label: 'Inactive', description: 'Account is inactive' },
        { value: 'suspended', label: 'Suspended', description: 'Account is suspended' }
      ]},
      { id: 'normal_balance', label: 'Normal Balance', type: 'select', required: true, section: 'configuration', options: [
        { value: 'debit', label: 'Debit', description: 'Debit normal balance' },
        { value: 'credit', label: 'Credit', description: 'Credit normal balance' }
      ]},

      // Reporting
      { id: 'reporting_category', label: 'Reporting Category', type: 'text', placeholder: 'Financial reporting category', section: 'reporting' },
      { id: 'budget_enabled', label: 'Budget Enabled', type: 'select', section: 'reporting', options: [
        { value: 'yes', label: 'Yes', description: 'Enable budget tracking' },
        { value: 'no', label: 'No', description: 'Disable budget tracking' }
      ]},

      // Controls
      { id: 'approval_required', label: 'Approval Required', type: 'select', section: 'controls', options: [
        { value: 'always', label: 'Always', description: 'Always require approval' },
        { value: 'threshold', label: 'Above Threshold', description: 'Require approval above amount' },
        { value: 'never', label: 'Never', description: 'No approval required' }
      ]},
      { id: 'approval_threshold', label: 'Approval Threshold', type: 'number', placeholder: 'Amount requiring approval', section: 'controls' }
    ]
  }
}

function generateTemplate(entityType, modulePath) {
  const config = ENTITY_CONFIGS[entityType]
  if (!config) {
    console.error(`❌ Unknown entity type: ${entityType}`)
    console.log(`Available types: ${Object.keys(ENTITY_CONFIGS).join(', ')}`)
    process.exit(1)
  }

  const { label, icon, module, sections, fields } = config

  // Generate the page component
  const componentCode = `'use client'

import React from 'react'
import { 
  ${sections.map(s => s.icon).join(', ')}
} from 'lucide-react'
import HERAMasterDataTemplate from '@/components/hera/HERAMasterDataTemplate'

// ${label}-specific form configuration
const ${entityType.toUpperCase()}_SECTIONS = [
${sections.map(section => `  { 
    id: '${section.id}', 
    label: '${section.label}', 
    icon: ${section.icon}, 
    required: ${section.required},
    description: '${section.description}'
  }`).join(',\n')}
]

const ${entityType.toUpperCase()}_FIELDS = [
${fields.map(field => {
  const fieldDef = `  {
    id: '${field.id}',
    label: '${field.label}',
    type: '${field.type}' as const,${field.required ? '\n    required: true,' : ''}${field.placeholder ? `\n    placeholder: '${field.placeholder}',` : ''}
    section: '${field.section}'${field.options ? `,\n    options: [\n${field.options.map(opt => `      { value: '${opt.value}', label: '${opt.label}', description: '${opt.description}' }`).join(',\n')}\n    ]` : ''}${field.validation ? `,\n    validation: ${field.validation}` : ''}
  }`
  return fieldDef
}).join(',\n\n')}
]

export default function New${label}Page() {
  
  const handle${label}Submit = async (formData: Record<string, any>) => {
    // Generate HERA DNA smart code
    const smartCode = \`HERA.${module}.${entityType.toUpperCase()}.\${formData.${entityType}_type?.toUpperCase() || 'STANDARD'}.\${formData.${entityType}_code}.v1\`
    
    // Prepare ${entityType} data for HERA API v2
    const ${entityType}Data = {
      entity_type: '${entityType}',
      entity_name: formData.${entityType}_name,
      entity_code: formData.${entityType}_code,
      smart_code: smartCode,
      dynamic_fields: [
${fields.filter(f => f.id !== `${entityType}_name` && f.id !== `${entityType}_code`).map(field => 
  `        { field_name: '${field.id}', field_value_text: formData.${field.id}, field_type: '${field.type}' }`
).join(',\n')}
      ].filter(field => field.field_value_text) // Only include non-empty fields
    }
    
    console.log('Creating ${entityType} with HERA API v2:', ${entityType}Data)
    
    // For now, save to localStorage to show in the list
    const new${label} = {
      id: Date.now().toString(),
      entity_name: formData.${entityType}_name,
      entity_code: formData.${entityType}_code,
      ${entityType}_type: formData.${entityType}_type?.toUpperCase() || 'STANDARD',
      status: 'active'
    }
    
    // Get existing ${entityType}s from localStorage
    const existing${label}s = JSON.parse(localStorage.getItem('hera_${entityType}s') || '[]')
    
    // Add new ${entityType}
    const updated${label}s = [...existing${label}s, new${label}]
    
    // Save back to localStorage
    localStorage.setItem('hera_${entityType}s', JSON.stringify(updated${label}s))
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Here you would call the HERA API v2 to create the ${entityType}
    // const result = await apiV2.post('entities', ${entityType}Data)
  }

  return (
    <HERAMasterDataTemplate
      entityType="${entityType}"
      entityLabel="${label}"
      sections={${entityType.toUpperCase()}_SECTIONS}
      fields={${entityType.toUpperCase()}_FIELDS}
      backUrl="${modulePath}"
      onSubmit={handle${label}Submit}
      defaultValues={{}}
      className=""
    />
  )
}`

  // Determine file path
  const appDir = path.join(process.cwd(), 'src/app')
  const moduleDir = path.join(appDir, ...modulePath.split('/').filter(p => p))
  const newDir = path.join(moduleDir, 'new')
  const filePath = path.join(newDir, 'page.tsx')

  // Create directories if they don't exist
  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir, { recursive: true })
    console.log(`📁 Created directory: ${newDir}`)
  }

  // Write the component file
  fs.writeFileSync(filePath, componentCode)
  console.log(`✅ Generated ${label} master data template: ${filePath}`)

  // Generate a simple list page if it doesn't exist
  const listPagePath = path.join(moduleDir, 'page.tsx')
  if (!fs.existsSync(listPagePath)) {
    const listPageCode = `'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'

export default function ${label}sPage() {
  const router = useRouter()
  const [${entityType}s, set${label}s] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Load ${entityType}s from localStorage
  useEffect(() => {
    const saved${label}s = localStorage.getItem('hera_${entityType}s')
    if (saved${label}s) {
      set${label}s(JSON.parse(saved${label}s))
    }
  }, [])

  const filtered${label}s = ${entityType}s.filter((${entityType}: any) =>
    ${entityType}.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ${entityType}.entity_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">${label} Management</h1>
            <p className="text-gray-600">Manage your ${entityType} master data</p>
          </div>
          <button
            onClick={() => router.push('${modulePath}/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New ${label}
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ${entityType}s..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* ${label}s List */}
        <div className="bg-white rounded-lg shadow">
          {filtered${label}s.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ${entityType}s found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first ${entityType}.</p>
              <button
                onClick={() => router.push('${modulePath}/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add ${label}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ${label}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered${label}s.map((${entityType}: any) => (
                    <tr key={${entityType}.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{${entityType}.entity_name}</div>
                          <div className="text-sm text-gray-500">{${entityType}.entity_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {${entityType}.${entityType}_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {${entityType}.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}`
    fs.writeFileSync(listPagePath, listPageCode)
    console.log(`✅ Generated ${label}s list page: ${listPagePath}`)
  }

  console.log(`\n🎉 ${label} master data template generated successfully!`)
  console.log(`📍 Access your new ${entityType} creation page at: ${modulePath}/new`)
  console.log(`📍 Access your ${entityType}s list page at: ${modulePath}`)
  console.log(`\n💡 Remember to:`)
  console.log(`   - Add navigation links to your module`)
  console.log(`   - Configure ANTHROPIC_API_KEY environment variable for AI features`)
  console.log(`   - Customize the field configurations as needed`)
}

// CLI Usage
const args = process.argv.slice(2)
if (args.length < 2) {
  console.log(`
🚀 HERA Master Data Template Generator

Usage: node scripts/generate-master-data-template.js ENTITY_TYPE MODULE_PATH

Available Entity Types:
${Object.keys(ENTITY_CONFIGS).map(type => `  - ${type}`).join('\n')}

Examples:
  node scripts/generate-master-data-template.js customer /enterprise/crm/customers
  node scripts/generate-master-data-template.js product /enterprise/inventory/products
  node scripts/generate-master-data-template.js account /enterprise/finance/accounts
`)
  process.exit(1)
}

const [entityType, modulePath] = args
generateTemplate(entityType.toLowerCase(), modulePath)