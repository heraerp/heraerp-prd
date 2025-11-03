'use client'

/**
 * Universal Operation Page Template
 * Smart Code: HERA.UNIVERSAL.OPERATION.PAGE.v1
 * 
 * Dynamic page generator for Level 4 operation pages (Create, List, Analytics, etc.)
 * Reads from hera-navigation.json and generates operation-specific interfaces
 */

import React, { useState, useMemo } from 'react'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, Bell, User, Settings, ChevronDown, TrendingUp, BarChart3, 
  DollarSign, Users, FileText, CreditCard, RefreshCw, ArrowUp, ArrowDown, 
  Minus, Star, Clock, Eye, MessageSquare, Zap, Target, Globe, Calendar, 
  Award, Building2, ShoppingCart, Receipt, PieChart, Activity, Calculator, 
  Wallet, Banknote, CircleDollarSign, CheckCircle, AlertTriangle, 
  TrendingDown, Shield, BookOpen, Briefcase, LucideIcon, Plus, Edit,
  Filter, Download, Upload, Mail, Phone, MapPin, Package, Truck,
  Save, Send, Copy, Trash2, MoreVertical, ArrowLeft, Home, PlayCircle
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Import the standard templates
import HERAMasterDataTemplate from '@/components/hera/HERAMasterDataTemplate'
import dynamic from 'next/dynamic'

// Dynamically import the transaction template (default export)
const HERAPurchaseOrderApp = dynamic(() => import('@/app/enterprise/procurement/po/page').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
})

interface OperationConfig {
  name: string
  code: string
  route: string
  permissions: string[]
}

interface UniversalOperationPageProps {
  moduleCode: string
  moduleName: string
  areaCode: string
  areaName: string
  operationConfig: OperationConfig
  industry?: string
  industryTheme?: {
    primary_color: string
    secondary_color: string
    hero_background: string
  }
}

// Template detection functions
const isMasterDataOperation = (moduleCode: string, areaCode: string, operationCode: string): boolean => {
  // Master data operations are typically CREATE operations for entities like vendors, customers, products
  const masterDataAreas = ['VENDORS', 'CUSTOMERS', 'PRODUCTS', 'SUPPLIERS', 'EMPLOYEES', 'ACCOUNTS', 'MATERIALS']
  const masterDataOperations = ['CREATE', 'NEW', 'ADD']
  
  return masterDataAreas.includes(areaCode.toUpperCase()) && 
         masterDataOperations.includes(operationCode.toUpperCase())
}

const isTransactionOperation = (moduleCode: string, areaCode: string, operationCode: string): boolean => {
  // Transaction operations are for documents like PO, SO, invoices, etc.
  const transactionAreas = ['PO', 'SO', 'INVOICES', 'QUOTES', 'ORDERS', 'RECEIPTS', 'PURCHASING', 'SALES']
  const transactionOperations = ['CREATE', 'NEW', 'EDIT', 'VIEW']
  const transactionPattern = /^(PO|SO|INV|QUO|ORD|REC)/i
  
  // Check if area code matches transaction patterns
  const isTransactionArea = transactionAreas.some(area => areaCode.toUpperCase().includes(area)) ||
                           transactionPattern.test(areaCode) ||
                           areaCode.toUpperCase().includes('ORDER') ||
                           areaCode.toUpperCase().includes('INVOICE') ||
                           areaCode.toUpperCase() === 'PO' // Exact match for PO
  
  // Check if operation is transaction-related
  const isTransactionOp = transactionOperations.includes(operationCode.toUpperCase()) ||
                         operationCode.toUpperCase().includes('TRANSACTION')
  
  return isTransactionArea && isTransactionOp
}

// Master data configurations for different entity types
const getMasterDataConfig = (areaCode: string) => {
  const areaUpper = areaCode.toUpperCase()
  
  if (areaUpper.includes('VENDOR') || areaUpper.includes('SUPPLIER')) {
    return {
      entityType: 'vendor',
      entityLabel: 'Vendor',
      sections: [
        { id: 'basic', label: 'Basic Information', icon: Building2, required: true },
        { id: 'contact', label: 'Contact Details', icon: User, required: true },
        { id: 'address', label: 'Address Information', icon: MapPin, required: true },
        { id: 'financial', label: 'Financial Terms', icon: DollarSign, required: false }
      ],
      fields: [
        { id: 'entity_name', label: 'Vendor Name', type: 'text', required: true, section: 'basic' },
        { id: 'entity_code', label: 'Vendor Code', type: 'text', required: true, section: 'basic' },
        { id: 'category', label: 'Category', type: 'select', required: true, section: 'basic', 
          options: [
            { value: 'supplier', label: 'Product Supplier' },
            { value: 'service', label: 'Service Provider' },
            { value: 'contractor', label: 'Contractor' }
          ]
        },
        { id: 'contact_name', label: 'Contact Name', type: 'text', required: true, section: 'contact' },
        { id: 'contact_email', label: 'Email', type: 'email', required: true, section: 'contact' },
        { id: 'contact_phone', label: 'Phone', type: 'phone', required: true, section: 'contact' },
        { id: 'address', label: 'Address', type: 'text', required: true, section: 'address' },
        { id: 'city', label: 'City', type: 'text', required: true, section: 'address' },
        { id: 'payment_terms', label: 'Payment Terms', type: 'select', section: 'financial',
          options: [
            { value: 'net30', label: 'Net 30' },
            { value: 'net15', label: 'Net 15' },
            { value: 'immediate', label: 'Immediate' }
          ]
        }
      ]
    }
  }
  
  if (areaUpper.includes('CUSTOMER')) {
    return {
      entityType: 'customer',
      entityLabel: 'Customer',
      sections: [
        { id: 'basic', label: 'Basic Information', icon: Building2, required: true },
        { id: 'contact', label: 'Contact Details', icon: User, required: true },
        { id: 'address', label: 'Address Information', icon: MapPin, required: true },
        { id: 'commercial', label: 'Commercial Terms', icon: DollarSign, required: false }
      ],
      fields: [
        { id: 'entity_name', label: 'Customer Name', type: 'text', required: true, section: 'basic' },
        { id: 'entity_code', label: 'Customer Code', type: 'text', required: true, section: 'basic' },
        { id: 'customer_type', label: 'Customer Type', type: 'select', required: true, section: 'basic',
          options: [
            { value: 'individual', label: 'Individual' },
            { value: 'business', label: 'Business' },
            { value: 'government', label: 'Government' }
          ]
        },
        { id: 'contact_name', label: 'Contact Name', type: 'text', required: true, section: 'contact' },
        { id: 'contact_email', label: 'Email', type: 'email', required: true, section: 'contact' },
        { id: 'contact_phone', label: 'Phone', type: 'phone', required: true, section: 'contact' },
        { id: 'address', label: 'Address', type: 'text', required: true, section: 'address' },
        { id: 'city', label: 'City', type: 'text', required: true, section: 'address' },
        { id: 'credit_limit', label: 'Credit Limit', type: 'number', section: 'commercial' }
      ]
    }
  }
  
  if (areaUpper.includes('PRODUCT')) {
    return {
      entityType: 'product',
      entityLabel: 'Product',
      sections: [
        { id: 'basic', label: 'Basic Information', icon: Package, required: true },
        { id: 'specifications', label: 'Specifications', icon: FileText, required: true },
        { id: 'pricing', label: 'Pricing & Costs', icon: DollarSign, required: false }
      ],
      fields: [
        { id: 'entity_name', label: 'Product Name', type: 'text', required: true, section: 'basic' },
        { id: 'entity_code', label: 'Product Code', type: 'text', required: true, section: 'basic' },
        { id: 'category', label: 'Category', type: 'select', required: true, section: 'basic',
          options: [
            { value: 'electronics', label: 'Electronics' },
            { value: 'furniture', label: 'Furniture' },
            { value: 'supplies', label: 'Office Supplies' },
            { value: 'services', label: 'Services' }
          ]
        },
        { id: 'description', label: 'Description', type: 'textarea', required: true, section: 'specifications' },
        { id: 'specifications', label: 'Technical Specifications', type: 'textarea', section: 'specifications' },
        { id: 'unit_of_measure', label: 'Unit of Measure', type: 'text', required: true, section: 'specifications' },
        { id: 'cost_price', label: 'Cost Price', type: 'number', section: 'pricing' },
        { id: 'selling_price', label: 'Selling Price', type: 'number', section: 'pricing' }
      ]
    }
  }
  
  if (areaUpper.includes('ACCOUNT')) {
    return {
      entityType: 'account',
      entityLabel: 'GL Account',
      sections: [
        { id: 'basic', label: 'Account Information', icon: Calculator, required: true },
        { id: 'configuration', label: 'Configuration', icon: Settings, required: true }
      ],
      fields: [
        { id: 'entity_name', label: 'Account Name', type: 'text', required: true, section: 'basic' },
        { id: 'entity_code', label: 'Account Code', type: 'text', required: true, section: 'basic' },
        { id: 'account_type', label: 'Account Type', type: 'select', required: true, section: 'basic',
          options: [
            { value: 'asset', label: 'Asset' },
            { value: 'liability', label: 'Liability' },
            { value: 'equity', label: 'Equity' },
            { value: 'revenue', label: 'Revenue' },
            { value: 'expense', label: 'Expense' }
          ]
        },
        { id: 'description', label: 'Description', type: 'textarea', section: 'basic' },
        { id: 'currency', label: 'Currency', type: 'text', required: true, section: 'configuration' },
        { id: 'balance_type', label: 'Balance Type', type: 'select', required: true, section: 'configuration',
          options: [
            { value: 'debit', label: 'Debit' },
            { value: 'credit', label: 'Credit' }
          ]
        }
      ]
    }
  }
  
  // Default configuration for other entity types
  return {
    entityType: areaCode.toLowerCase(),
    entityLabel: areaCode,
    sections: [
      { id: 'basic', label: 'Basic Information', icon: Building2, required: true }
    ],
    fields: [
      { id: 'entity_name', label: 'Name', type: 'text', required: true, section: 'basic' },
      { id: 'entity_code', label: 'Code', type: 'text', required: true, section: 'basic' },
      { id: 'description', label: 'Description', type: 'textarea', section: 'basic' }
    ]
  }
}

export function UniversalOperationPage({ 
  moduleCode, 
  moduleName,
  areaCode,
  areaName,
  operationConfig, 
  industry,
  industryTheme 
}: UniversalOperationPageProps) {
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Generate operation-specific content based on operation type
  const operationContent = useMemo(() => {
    const operationType = operationConfig.code.toUpperCase()

    switch (operationType) {
      case 'CREATE':
        return {
          title: `Create New ${areaName}`,
          description: `Create a new ${areaName.toLowerCase()} record with all required information`,
          icon: Plus,
          primaryAction: 'Create',
          secondaryActions: ['Save Draft', 'Reset Form'],
          content: 'form'
        }
      
      case 'LIST':
        return {
          title: `${areaName} List`,
          description: `Browse and manage all ${areaName.toLowerCase()} records`,
          icon: Eye,
          primaryAction: 'Export',
          secondaryActions: ['Refresh', 'Filter', 'Bulk Actions'],
          content: 'list'
        }
      
      case 'APPROVE':
      case 'APPROVALS':
        return {
          title: `${areaName} Approvals`,
          description: `Review and approve pending ${areaName.toLowerCase()} items`,
          icon: CheckCircle,
          primaryAction: 'Approve Selected',
          secondaryActions: ['Reject', 'Request Changes'],
          content: 'approval'
        }
      
      case 'ANALYTICS':
        return {
          title: `${areaName} Analytics`,
          description: `Performance insights and analytics for ${areaName.toLowerCase()}`,
          icon: BarChart3,
          primaryAction: 'Generate Report',
          secondaryActions: ['Export Data', 'Schedule Report'],
          content: 'analytics'
        }
      
      case 'SETTINGS':
        return {
          title: `${areaName} Settings`,
          description: `Configure ${areaName.toLowerCase()} module settings and preferences`,
          icon: Settings,
          primaryAction: 'Save Settings',
          secondaryActions: ['Reset to Default', 'Import Config'],
          content: 'settings'
        }
      
      default:
        return {
          title: operationConfig.name,
          description: `${operationConfig.name} for ${areaName}`,
          icon: FileText,
          primaryAction: 'Execute',
          secondaryActions: ['Cancel'],
          content: 'generic'
        }
    }
  }, [operationConfig, areaName])

  // Generate breadcrumb navigation
  const breadcrumbs = [
    { label: 'Home', href: '/apps', icon: Home },
    { label: moduleName, href: `/enterprise/${moduleCode.toLowerCase()}`, icon: Building2 },
    { label: areaName, href: `/enterprise/${moduleCode.toLowerCase()}/${areaCode.toLowerCase()}`, icon: FileText },
    { label: operationContent.title, href: '#', icon: operationContent.icon }
  ]

  // Generate operation-specific stats
  const operationStats = useMemo(() => {
    const stats = [
      {
        label: 'Total Records',
        value: '1,247',
        change: '+18%',
        trend: 'up' as const,
        color: 'text-blue-600'
      },
      {
        label: 'Pending',
        value: '23',
        change: '-12%',
        trend: 'down' as const,
        color: 'text-orange-600'
      },
      {
        label: 'Completed Today',
        value: '89',
        change: '+34%',
        trend: 'up' as const,
        color: 'text-green-600'
      },
      {
        label: 'Success Rate',
        value: '96.2%',
        change: '+2.1%',
        trend: 'up' as const,
        color: 'text-purple-600'
      }
    ]

    return stats
  }, [])

  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-3 h-3 text-green-500" />
      case 'down':
        return <ArrowDown className="w-3 h-3 text-red-500" />
      default:
        return <Minus className="w-3 h-3 text-gray-500" />
    }
  }

  const renderContent = () => {
    switch (operationContent.content) {
      case 'form':
        return (
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <operationContent.icon className="w-5 h-5" />
                {operationContent.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <Input placeholder={`Enter ${areaName.toLowerCase()} name`} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code *
                      </label>
                      <Input placeholder="Auto-generated code" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <Input placeholder="Select category" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <Input placeholder="Enter description" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <Input placeholder="Active" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <Input placeholder="Normal" />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <Save className="w-4 h-4 mr-2" />
                    {operationContent.primaryAction}
                  </Button>
                  {operationContent.secondaryActions.map((action, index) => (
                    <Button key={index} variant="outline">
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'list':
        return (
          <div className="space-y-4">
            {/* List Header */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Input 
                      placeholder={`Search ${areaName.toLowerCase()}...`}
                      className="w-64"
                    />
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button className="bg-violet-600 hover:bg-violet-700">
                      <Download className="w-4 h-4 mr-2" />
                      {operationContent.primaryAction}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* List Table */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-900">Name</th>
                        <th className="text-left p-4 font-medium text-gray-900">Code</th>
                        <th className="text-left p-4 font-medium text-gray-900">Status</th>
                        <th className="text-left p-4 font-medium text-gray-900">Created</th>
                        <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((item) => (
                        <tr key={item} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-medium text-gray-900">Sample {areaName} {item}</td>
                          <td className="p-4 text-gray-600">{areaCode}-{String(item).padStart(3, '0')}</td>
                          <td className="p-4">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Active
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-600">2 days ago</td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'analytics':
        return (
          <div className="space-y-6">
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {operationStats.map((stat, index) => (
                <Card key={index} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <div className="flex items-center gap-1">
                          {renderTrendIcon(stat.trend)}
                          <span className={`text-xs ${
                            stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <BarChart3 className="w-8 h-8 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart Placeholder */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>{areaName} Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Analytics chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return (
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <operationContent.icon className="w-5 h-5" />
                {operationContent.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <operationContent.icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {operationContent.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {operationContent.description}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    {operationContent.primaryAction}
                  </Button>
                  {operationContent.secondaryActions.map((action, index) => (
                    <Button key={index} variant="outline">
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  // Apply industry theme if provided
  const themeStyles = industryTheme ? {
    background: industryTheme.hero_background,
    primaryColor: industryTheme.primary_color,
    secondaryColor: industryTheme.secondary_color
  } : {}

  // Template detection and rendering logic
  const renderOperationTemplate = () => {
    const operationType = operationConfig.code.toUpperCase()
    
    // Check if this is a master data operation
    if (isMasterDataOperation(moduleCode, areaCode, operationType)) {
      const masterDataConfig = getMasterDataConfig(areaCode)
      
      const handleMasterDataSubmit = async (formData: Record<string, any>) => {
        // Generate HERA DNA smart code
        const smartCode = `HERA.${moduleCode}.${masterDataConfig.entityType.toUpperCase()}.${formData.category?.toUpperCase() || 'STANDARD'}.${formData.entity_code}.v1`
        
        // Prepare entity data for HERA API v2
        const entityData = {
          entity_type: masterDataConfig.entityType,
          entity_name: formData.entity_name,
          entity_code: formData.entity_code,
          smart_code: smartCode,
          organization_id: organization?.id,
          dynamic_fields: masterDataConfig.fields
            .filter(field => formData[field.id])
            .map(field => ({
              field_name: field.id,
              field_value_text: formData[field.id],
              field_type: field.type === 'email' ? 'email' : field.type === 'phone' ? 'phone' : 'text'
            }))
        }
        
        console.log('Creating entity with HERA API v2:', entityData)
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Here you would call the HERA API v2 to create the entity
        // const result = await apiV2.post('entities', entityData)
      }
      
      return (
        <HERAMasterDataTemplate
          entityType={masterDataConfig.entityType}
          entityLabel={masterDataConfig.entityLabel}
          sections={masterDataConfig.sections}
          fields={masterDataConfig.fields}
          backUrl={`/enterprise/${moduleCode.toLowerCase()}/${areaCode.toLowerCase()}`}
          onSubmit={handleMasterDataSubmit}
          defaultValues={{}}
        />
      )
    }
    
    // Check if this is a transaction operation (like PO)
    if (isTransactionOperation(moduleCode, areaCode, operationType) || 
        (areaCode.toUpperCase() === 'PO' || areaCode.toUpperCase().includes('ORDER'))) {
      // Render the purchase order or similar transaction template
      console.log('Rendering transaction template for:', { moduleCode, areaCode, operationType })
      return (
        <div className="min-h-screen">
          <HERAPurchaseOrderApp />
        </div>
      )
    }
    
    // Default operation content (analytics, lists, etc.)
    return renderContent()
  }

  return (
    <ProtectedPage requiredSpace={moduleCode.toLowerCase()}>
      <div className="min-h-screen bg-gray-50" style={themeStyles.background ? { background: themeStyles.background } : {}}>
        {/* Check if we should render a full-page template */}
        {isMasterDataOperation(moduleCode, areaCode, operationConfig.code.toUpperCase()) || 
         isTransactionOperation(moduleCode, areaCode, operationConfig.code.toUpperCase()) || 
         (areaCode.toUpperCase() === 'PO' || areaCode.toUpperCase().includes('ORDER')) ? (
          renderOperationTemplate()
        ) : (
          <>
            {/* Header with Breadcrumbs */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
              <div className="max-w-7xl mx-auto px-6 py-4">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  {breadcrumbs.map((crumb, index) => {
                    const Icon = crumb.icon
                    return (
                      <div key={index} className="flex items-center gap-2">
                        {index > 0 && <span className="text-gray-400">/</span>}
                        <a 
                          href={crumb.href}
                          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                          {crumb.label}
                        </a>
                      </div>
                    )
                  })}
                </nav>

                {/* Page Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{operationContent.title}</h1>
                    <p className="text-gray-600 mt-1">{operationContent.description}</p>
                    {industry && (
                      <Badge variant="secondary" className="bg-violet-100 text-violet-700 border-violet-200 mt-2">
                        {industry} Edition
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => window.history.back()}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    {operationConfig.permissions.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {operationConfig.permissions[0]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-3">
                  {renderContent()}
                </div>

                    {/* Right Sidebar - HERA Assistant */}
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    <Card className="border border-violet-100 bg-gradient-to-br from-white to-violet-50/30 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                            <MessageSquare className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">HERA Assistant</CardTitle>
                            <p className="text-sm text-violet-500">Operation Guide</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-sm text-gray-700">
                            <p className="font-medium mb-2">Operation: {operationConfig.name}</p>
                            
                            <div className="space-y-3">
                              <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                                <h4 className="font-medium text-sm mb-1">Quick Help</h4>
                                <p className="text-xs text-gray-600 mb-1">
                                  {operationContent.description}
                                </p>
                                <Button variant="link" className="p-0 h-auto text-xs text-violet-600 hover:text-violet-700">
                                  View documentation →
                                </Button>
                              </div>

                              <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                                <h4 className="font-medium text-sm mb-1">Current Status</h4>
                                <div className="space-y-1 text-xs text-gray-600">
                                  <div>Records: 1,247 total</div>
                                  <div>Pending: 23 items</div>
                                  <div>Success rate: 96.2%</div>
                                </div>
                              </div>

                              <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                                <h4 className="font-medium text-sm mb-1">Tips</h4>
                                <div className="space-y-1 text-xs text-gray-600">
                                  <div>• Use filters to find records quickly</div>
                                  <div>• Bulk operations save time</div>
                                  <div>• Check validation rules</div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <Input 
                                placeholder={`Ask about ${operationConfig.name}...`}
                                className="text-sm border-violet-200 focus:border-violet-400 focus:ring-violet-200"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedPage>
  )
}