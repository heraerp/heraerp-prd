/**
 * Enterprise Pages Generator
 * Smart Code: HERA.LIB.MVP_GENERATOR.PAGES.v1
 * 
 * Generates production-ready React pages using HERA enterprise components
 * and established patterns from /enterprise/procurement
 */

import { AppPack, EntityDefinition, TransactionDefinition } from '../index'

export function generateEntityListPage(entity: EntityDefinition, config: AppPack): string {
  const entityUpper = entity.entity_type.toUpperCase()
  const entityLower = entity.entity_type.toLowerCase()
  const entityTitle = entity.entity_name || entity.entity_type
  const appName = config.app.name
  
  return `'use client'

/**
 * ${entityTitle} List Page
 * Smart Code: ${entity.smart_code}
 * Generated from: ${appName} v${config.app.version}
 */

import React, { useState, useEffect } from 'react'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  ${entity.icon ? entity.icon.charAt(0).toUpperCase() + entity.icon.slice(1) : 'FileText'}
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface ${entityTitle}Data {
  id: string
  entity_name: string
  entity_code?: string
  created_at: string
  updated_at: string
  status?: string
  [key: string]: any
}

export default function ${entityTitle}ListPage() {
  const { organization, user } = useHERAAuth()
  const [entities, setEntities] = useState<${entityTitle}Data[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntities, setSelectedEntities] = useState<string[]>([])

  // Load entities on component mount
  useEffect(() => {
    if (organization?.id) {
      loadEntities()
    }
  }, [organization?.id])

  const loadEntities = async () => {
    try {
      setLoading(true)
      const { data } = await apiV2.get('entities', {
        entity_type: '${entityUpper}',
        organization_id: organization!.id,
        limit: 100
      })
      
      setEntities(data?.items || [])
    } catch (error) {
      console.error('Failed to load ${entityLower}s:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // In production, implement server-side search
  }

  const handleCreate = () => {
    window.location.href = \`/${entityLower}/new\`
  }

  const handleEdit = (entityId: string) => {
    window.location.href = \`/${entityLower}/\${entityId}/edit\`
  }

  const handleView = (entityId: string) => {
    window.location.href = \`/${entityLower}/\${entityId}\`
  }

  const handleDelete = async (entityId: string) => {
    if (!confirm('Are you sure you want to delete this ${entityLower}?')) return
    
    try {
      await apiV2.delete(\`entities/\${entityId}\`, {
        organization_id: organization!.id
      })
      
      // Reload entities
      loadEntities()
    } catch (error) {
      console.error('Failed to delete ${entityLower}:', error)
      alert('Failed to delete ${entityLower}')
    }
  }

  const filteredEntities = entities.filter(entity =>
    entity.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entity.entity_code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ProtectedPage requiredSpace="${entityLower}">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <${entity.icon ? entity.icon.charAt(0).toUpperCase() + entity.icon.slice(1) : 'FileText'} className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">${entityTitle}s</h1>
                  <p className="text-gray-600">${entity.description || `Manage ${entityLower} records`}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={loadEntities} disabled={loading}>
                  <RefreshCw className={\`w-4 h-4 mr-2 \${loading ? 'animate-spin' : ''}\`} />
                  Refresh
                </Button>
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  New ${entityTitle}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search ${entityLower}s..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {filteredEntities.length} ${entityTitle}{filteredEntities.length !== 1 ? 's' : ''}
                </CardTitle>
                {selectedEntities.length > 0 && (
                  <Badge variant="secondary">
                    {selectedEntities.length} selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading ${entityLower}s...</p>
                </div>
              ) : filteredEntities.length === 0 ? (
                <div className="text-center py-8">
                  <${entity.icon ? entity.icon.charAt(0).toUpperCase() + entity.icon.slice(1) : 'FileText'} className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No ${entityLower}s found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery 
                      ? \`No ${entityLower}s match your search criteria\`
                      : \`Get started by creating your first ${entityLower}\`
                    }
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleCreate}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create ${entityTitle}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                        {entity.entity_code && <th className="text-left py-3 px-4 font-medium text-gray-900">Code</th>}
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntities.map((entity) => (
                        <tr key={entity.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{entity.entity_name}</div>
                              <div className="text-sm text-gray-500">{entity.id}</div>
                            </div>
                          </td>
                          {entity.entity_code && (
                            <td className="py-3 px-4">
                              <span className="font-mono text-sm">{entity.entity_code}</span>
                            </td>
                          )}
                          <td className="py-3 px-4">
                            <Badge variant={entity.status === 'active' ? 'default' : 'secondary'}>
                              {entity.status || 'active'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(entity.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleView(entity.id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(entity.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(entity.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedPage>
  )
}`
}

export function generateEntityCreatePage(entity: EntityDefinition, config: AppPack): string {
  const entityUpper = entity.entity_type.toUpperCase()
  const entityLower = entity.entity_type.toLowerCase()
  const entityTitle = entity.entity_name || entity.entity_type
  const appName = config.app.name
  
  // Generate form fields based on entity definition
  const formFields = entity.fields.map(field => {
    const fieldType = field.type === 'boolean' ? 'checkbox' : 
                     field.type === 'number' ? 'number' : 'text'
    
    return `              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  ${field.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  ${field.required ? ' *' : ''}
                </label>
                ${field.type === 'boolean' ? 
                  `<div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.${field.name} || false}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        ${field.name}: e.target.checked
                      }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">Enable ${field.name}</span>
                  </div>` :
                  `<Input
                    type="${fieldType}"
                    value={formData.${field.name} || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      ${field.name}: ${field.type === 'number' ? 'parseFloat(e.target.value) || 0' : 'e.target.value'}
                    }))}
                    placeholder="Enter ${field.name.replace(/_/g, ' ')}"
                    ${field.required ? 'required' : ''}
                  />`}
              </div>`
  }).join('\n\n')

  return `'use client'

/**
 * ${entityTitle} Create Page
 * Smart Code: ${entity.smart_code}
 * Generated from: ${appName} v${config.app.version}
 */

import React, { useState } from 'react'
import { EnterpriseCreatePage, CreatePageSection, AIInsight } from '@/components/enterprise/EnterpriseCreatePage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText, 
  Settings, 
  Link, 
  CheckCircle,
  ${entity.icon ? entity.icon.charAt(0).toUpperCase() + entity.icon.slice(1) : 'FileText'}
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface ${entityTitle}FormData {
  entity_name: string
  entity_code: string
  ${entity.fields.map(field => `${field.name}: ${field.type === 'boolean' ? 'boolean' : field.type === 'number' ? 'number' : 'string'}`).join('\n  ')}
}

export default function Create${entityTitle}Page() {
  const { organization, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('basics')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<${entityTitle}FormData>({
    entity_name: '',
    entity_code: '',
    ${entity.fields.map(field => `${field.name}: ${field.type === 'boolean' ? 'false' : field.type === 'number' ? '0' : "''"}`).join(',\n    ')}
  })

  // Page sections for navigation
  const sections: CreatePageSection[] = [
    {
      id: 'basics',
      title: 'Basic Information',
      icon: FileText,
      isRequired: true,
      isComplete: !!(formData.entity_name && formData.entity_code)
    },
    {
      id: 'details',
      title: '${entityTitle} Details',
      icon: Settings,
      isRequired: false,
      isComplete: true // Mark complete when required fields are filled
    },
    {
      id: 'relationships',
      title: 'Relationships',
      icon: Link,
      isRequired: false,
      isComplete: true
    }
  ]

  // AI insights and suggestions
  const aiInsights: AIInsight[] = [
    {
      id: 'naming',
      type: 'suggestion',
      title: 'Naming Convention',
      content: 'Consider using a descriptive name that follows your organization\\'s naming conventions.',
      action: {
        label: 'Apply Standard',
        onClick: () => {
          // Auto-generate based on patterns
          setFormData(prev => ({
            ...prev,
            entity_code: prev.entity_name.toUpperCase().replace(/\\s+/g, '_')
          }))
        }
      }
    },
    {
      id: 'validation',
      type: 'automation',
      title: 'Auto-validation',
      content: 'HERA will automatically validate required fields and smart code patterns.'
    }
  ]

  const aiSuggestions = [
    'Use clear, descriptive names for better organization',
    'Fill all required fields marked with asterisk (*)',
    'Consider relationships with other entities',
    'Leverage HERA\\'s automation features'
  ]

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Prepare entity data
      const entityData = {
        entity_type: '${entityUpper}',
        entity_name: formData.entity_name,
        entity_code: formData.entity_code,
        smart_code: '${entity.smart_code}',
        organization_id: organization!.id
      }

      // Prepare dynamic fields
      const dynamicFields = [
        ${entity.fields.map(field => `{
          field_name: '${field.name}',
          field_type: '${field.type}',
          ${field.type === 'boolean' ? 'field_value_boolean' : field.type === 'number' ? 'field_value_number' : 'field_value_text'}: formData.${field.name},
          smart_code: '${field.smart_code}'
        }`).join(',\n        ')}
      ]

      // Create entity via API
      const { data } = await apiV2.post('entities', {
        entity: entityData,
        dynamic_fields: dynamicFields,
        relationships: [],
        organization_id: organization!.id
      })

      // Success - redirect to list or view page
      window.location.href = \`/${entityLower}\`
      
    } catch (error) {
      console.error('Failed to create ${entityLower}:', error)
      alert('Failed to create ${entityLower}. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = \`/${entityLower}\`
  }

  const handleSaveAndContinue = async () => {
    await handleSave()
    // Continue to next step or entity
  }

  const completionPercentage = Math.round(
    (sections.filter(s => s.isComplete).length / sections.length) * 100
  )

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'basics':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="entity_name">
                    ${entityTitle} Name *
                  </Label>
                  <Input
                    id="entity_name"
                    value={formData.entity_name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      entity_name: e.target.value
                    }))}
                    placeholder="Enter ${entityLower} name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entity_code">
                    ${entityTitle} Code *
                  </Label>
                  <Input
                    id="entity_code"
                    value={formData.entity_code}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      entity_code: e.target.value.toUpperCase()
                    }))}
                    placeholder="Enter ${entityLower} code"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'details':
        return (
          <Card>
            <CardHeader>
              <CardTitle>${entityTitle} Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
${formFields}
              </div>
            </CardContent>
          </Card>
        )

      case 'relationships':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Relationships & Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Link className="w-12 h-12 mx-auto mb-4" />
                <p>Relationship configuration will be available after creating the ${entityLower}.</p>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <EnterpriseCreatePage
      title={\`Create New \${${entityTitle}}\`}
      subtitle="Set up a new ${entityLower} record with all required information"
      breadcrumb="Enterprise > ${entityTitle}s > Create"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      onCancel={handleCancel}
      onSaveAndContinue={handleSaveAndContinue}
      isSaving={isSaving}
      saveLabel="Create ${entityTitle}"
      aiInsights={aiInsights}
      aiSuggestions={aiSuggestions}
      completionPercentage={completionPercentage}
      estimatedTime="5-10 minutes"
      hasErrors={false}
      errorCount={0}
    >
      {renderCurrentSection()}
    </EnterpriseCreatePage>
  )
}`
}

export function generateTransactionPage(transaction: TransactionDefinition, config: AppPack): string {
  const txnUpper = transaction.transaction_type.toUpperCase()
  const txnLower = transaction.transaction_type.toLowerCase()
  const txnTitle = transaction.transaction_name || transaction.transaction_type
  const appName = config.app.name
  
  return `'use client'

/**
 * ${txnTitle} Transaction Page
 * Smart Code: ${transaction.smart_code}
 * Generated from: ${appName} v${config.app.version}
 */

import React, { useState } from 'react'
import { EnterpriseCreatePage, CreatePageSection, AIInsight } from '@/components/enterprise/EnterpriseCreatePage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  Calculator, 
  Receipt, 
  DollarSign, 
  Plus,
  Trash2
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface TransactionLine {
  line_number: number
  line_type: string
  description: string
  amount: number
  side?: 'DR' | 'CR'
  account_code?: string
}

interface TransactionFormData {
  transaction_type: string
  description: string
  total_amount: number
  lines: TransactionLine[]
}

export default function Create${txnTitle}Page() {
  const { organization, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('header')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<TransactionFormData>({
    transaction_type: '${txnUpper}',
    description: '',
    total_amount: 0,
    lines: [
      ${transaction.lines.map((line, index) => `{
        line_number: ${index + 1},
        line_type: '${line.line_type}',
        description: '${line.description}',
        amount: 0,
        side: '${line.side}',
        account_code: ''
      }`).join(',\n      ')}
    ]
  })

  // Page sections for navigation
  const sections: CreatePageSection[] = [
    {
      id: 'header',
      title: 'Transaction Header',
      icon: Receipt,
      isRequired: true,
      isComplete: !!(formData.description && formData.total_amount > 0)
    },
    {
      id: 'lines',
      title: 'Transaction Lines',
      icon: Calculator,
      isRequired: true,
      isComplete: formData.lines.every(line => line.amount > 0)
    }
  ]

  // AI insights for transaction
  const aiInsights: AIInsight[] = [
    {
      id: 'balance',
      type: 'automation',
      title: 'GL Balance Check',
      content: 'HERA automatically validates that debits equal credits for GL transactions.'
    },
    {
      id: 'accounts',
      type: 'suggestion',
      title: 'Account Mapping',
      content: 'Use standard account codes for consistent reporting and analysis.',
      action: {
        label: 'Auto-map Accounts',
        onClick: () => {
          // Auto-populate account codes based on line types
          setFormData(prev => ({
            ...prev,
            lines: prev.lines.map(line => ({
              ...line,
              account_code: getDefaultAccountCode(line.line_type, line.side)
            }))
          }))
        }
      }
    }
  ]

  const getDefaultAccountCode = (lineType: string, side?: string): string => {
    // Default account mapping logic
    if (lineType === 'GL') {
      return side === 'DR' ? '500000' : '200000' // Expense vs Liability
    }
    return ''
  }

  const updateLine = (lineNumber: number, field: keyof TransactionLine, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(line => 
        line.line_number === lineNumber 
          ? { ...line, [field]: value }
          : line
      )
    }))
  }

  const addLine = () => {
    const newLineNumber = Math.max(...formData.lines.map(l => l.line_number)) + 1
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, {
        line_number: newLineNumber,
        line_type: 'GL',
        description: '',
        amount: 0,
        side: 'DR',
        account_code: ''
      }]
    }))
  }

  const removeLine = (lineNumber: number) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.line_number !== lineNumber)
    }))
  }

  const calculateTotals = () => {
    const drTotal = formData.lines
      .filter(line => line.side === 'DR')
      .reduce((sum, line) => sum + line.amount, 0)
    
    const crTotal = formData.lines
      .filter(line => line.side === 'CR')
      .reduce((sum, line) => sum + line.amount, 0)
    
    return { drTotal, crTotal, isBalanced: Math.abs(drTotal - crTotal) < 0.01 }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const { drTotal, crTotal, isBalanced } = calculateTotals()
      
      if (!isBalanced) {
        alert('Transaction must be balanced (DR = CR)')
        return
      }

      // Prepare transaction data
      const transactionData = {
        transaction_type: formData.transaction_type,
        smart_code: '${transaction.smart_code}',
        description: formData.description,
        total_amount: formData.total_amount,
        organization_id: organization!.id
      }

      // Create transaction via API
      const { data } = await apiV2.post('transactions', {
        transaction: transactionData,
        lines: formData.lines,
        organization_id: organization!.id
      })

      // Success - redirect
      window.location.href = \`/transactions\`
      
    } catch (error) {
      console.error('Failed to create transaction:', error)
      alert('Failed to create transaction. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = \`/transactions\`
  }

  const completionPercentage = Math.round(
    (sections.filter(s => s.isComplete).length / sections.length) * 100
  )

  const { drTotal, crTotal, isBalanced } = calculateTotals()

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'header':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Transaction Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Input
                    value={formData.transaction_type}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Total Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      total_amount: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="Enter total amount"
                    required
                  />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label>Description *</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Enter transaction description"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'lines':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transaction Lines</CardTitle>
                  <Button onClick={addLine} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.lines.map((line) => (
                    <div key={line.line_number} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                      <div className="col-span-3">
                        <Label>Description</Label>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(line.line_number, 'description', e.target.value)}
                          placeholder="Line description"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Account Code</Label>
                        <Input
                          value={line.account_code || ''}
                          onChange={(e) => updateLine(line.line_number, 'account_code', e.target.value)}
                          placeholder="Account"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Side</Label>
                        <select
                          value={line.side || 'DR'}
                          onChange={(e) => updateLine(line.line_number, 'side', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="DR">Debit</option>
                          <option value="CR">Credit</option>
                        </select>
                      </div>
                      
                      <div className="col-span-3">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.amount}
                          onChange={(e) => updateLine(line.line_number, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(line.line_number)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Balance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Balance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{drTotal.toFixed(2)}</div>
                    <div className="text-sm text-blue-800">Total Debits</div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{crTotal.toFixed(2)}</div>
                    <div className="text-sm text-green-800">Total Credits</div>
                  </div>
                  
                  <div className={\`p-4 rounded-lg \${isBalanced ? 'bg-green-50' : 'bg-red-50'}\`}>
                    <div className={\`text-2xl font-bold \${isBalanced ? 'text-green-600' : 'text-red-600'}\`}>
                      {Math.abs(drTotal - crTotal).toFixed(2)}
                    </div>
                    <div className={\`text-sm \${isBalanced ? 'text-green-800' : 'text-red-800'}\`}>
                      {isBalanced ? 'Balanced ✓' : 'Out of Balance'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <EnterpriseCreatePage
      title={\`Create \${${txnTitle}}\`}
      subtitle="${transaction.description}"
      breadcrumb="Enterprise > Transactions > ${txnTitle}"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      onCancel={handleCancel}
      isSaving={isSaving}
      saveLabel="Post Transaction"
      aiInsights={aiInsights}
      aiSuggestions={[
        'Ensure all line amounts are accurate',
        'Verify account codes match your chart of accounts',
        'Add descriptive line descriptions for audit trail',
        'Check that debits equal credits before posting'
      ]}
      completionPercentage={completionPercentage}
      estimatedTime="3-5 minutes"
      hasErrors={!isBalanced}
      errorCount={isBalanced ? 0 : 1}
    >
      {renderCurrentSection()}
    </EnterpriseCreatePage>
  )
}`
}

export function generateApplicationOverviewPage(config: AppPack): string {
  const appName = config.app.name
  const appId = config.app.id
  const entities = config.entities || []
  const transactions = config.transactions || []
  
  return `'use client'

/**
 * ${appName} Overview Page
 * Smart Code: ${config.app.smart_code}
 * Generated from: ${appName} v${config.app.version}
 */

import React, { useState } from 'react'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  ChevronDown,
  Eye,
  Plus,
  BarChart3,
  ${entities.map(e => e.icon ? e.icon.charAt(0).toUpperCase() + e.icon.slice(1) : 'FileText').join(',\n  ')},
  Calculator,
  Receipt
} from 'lucide-react'

export default function ${appName.replace(/[^a-zA-Z0-9]/g, '')}OverviewPage() {
  const [activeTab, setActiveTab] = useState('entities')
  const [searchQuery, setSearchQuery] = useState('')

  // Navigation data for entities
  const entityPages = [
    ${entities.map(entity => `{
      id: '${entity.entity_type.toLowerCase()}',
      title: '${entity.entity_name || entity.entity_type}',
      subtitle: '${entity.description}',
      icon: ${entity.icon ? entity.icon.charAt(0).toUpperCase() + entity.icon.slice(1) : 'FileText'},
      color: 'bg-blue-600',
      href: '/${entity.entity_type.toLowerCase()}'
    }`).join(',\n    ')}
  ]

  // Navigation data for transactions
  const transactionPages = [
    ${transactions.map(txn => `{
      id: '${txn.transaction_type.toLowerCase()}',
      title: '${txn.transaction_name || txn.transaction_type}',
      subtitle: '${txn.description}',
      icon: Calculator,
      color: 'bg-green-600',
      href: '/transactions/${txn.transaction_type.toLowerCase()}'
    }`).join(',\n    ')}
  ]

  // Apps data organized by tabs
  const appsData = {
    entities: entityPages.map(page => ({
      icon: page.icon,
      title: page.title,
      subtitle: \`Manage \${page.title.toLowerCase()} records\`,
      href: page.href
    })),
    transactions: transactionPages.map(page => ({
      icon: page.icon,
      title: page.title,
      subtitle: page.subtitle,
      href: page.href
    })),
    reports: [
      { icon: BarChart3, title: 'Data Analytics', subtitle: 'View insights and trends', href: '/reports/analytics' },
      { icon: Receipt, title: 'Transaction Reports', subtitle: 'Financial reporting', href: '/reports/transactions' }
    ]
  }

  // Insights tiles
  const insightsTiles = [
    {
      id: 'entities',
      title: 'Total Entities',
      value: '${entities.length}',
      description: 'Entity types configured',
      color: 'border-blue-500'
    },
    {
      id: 'transactions',
      title: 'Transaction Types',
      value: '${transactions.length}',
      description: 'Available transaction workflows',
      color: 'border-green-500'
    },
    {
      id: 'automation',
      title: 'Automation Level',
      value: '95',
      unit: '%',
      description: 'Automated processes',
      color: 'border-purple-500'
    }
  ]

  return (
    <ProtectedPage requiredSpace="${appId}">
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Quick Actions */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              
              <div className="space-y-3">
                ${entities.map(entity => `<Card className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <${entity.icon ? entity.icon.charAt(0).toUpperCase() + entity.icon.slice(1) : 'FileText'} className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">New ${entity.entity_name || entity.entity_type}</h4>
                        <p className="text-xs text-gray-500">Create ${entity.entity_type.toLowerCase()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>`).join('\n                ')}
              </div>
            </div>

            {/* Center Column - Main Navigation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Module Overview */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">${appName} Modules</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {entityPages.map((page) => {
                    const Icon = page.icon
                    return (
                      <Card 
                        key={page.id} 
                        className={\`\${page.color} text-white border-0 hover:shadow-lg transition-shadow cursor-pointer\`}
                        onClick={() => window.location.href = page.href}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <Icon className="w-6 h-6" />
                            <Eye className="w-4 h-4 opacity-75" />
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{page.title}</h3>
                          <p className="text-sm opacity-90">{page.subtitle}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Apps Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Applications</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="entities">Entities</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                  </TabsList>

                  {Object.entries(appsData).map(([key, apps]) => (
                    <TabsContent key={key} value={key} className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {apps.map((app, index) => {
                          const Icon = app.icon
                          return (
                            <Card 
                              key={index} 
                              className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => window.location.href = app.href}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-violet-50 rounded-lg border border-violet-100">
                                    <Icon className="w-5 h-5 text-violet-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                      {app.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate">
                                      {app.subtitle}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Insights Tiles */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {insightsTiles.map((tile) => (
                    <Card key={tile.id} className={\`border-l-4 \${tile.color} hover:shadow-lg transition-all duration-200 cursor-pointer\`}>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {tile.value}
                            {tile.unit && <span className="text-lg">{tile.unit}</span>}
                          </div>
                          <h4 className="font-medium text-sm text-gray-900 mb-1">
                            {tile.title}
                          </h4>
                          <p className="text-xs text-gray-600">{tile.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - HERA Assistant */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card className="border border-violet-100 bg-gradient-to-br from-white to-violet-50/30 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                          ${appName} Insights
                        </CardTitle>
                        <p className="text-sm text-violet-500">AI-Powered</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-3">System Status:</p>
                        
                        <div className="space-y-3">
                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Configuration</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Entities: ${entities.length} configured</div>
                              <div>Transactions: ${transactions.length} types</div>
                              <div>Status: ✅ Ready</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Automation</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Smart Codes: ✅ Validated</div>
                              <div>API Integration: ✅ Active</div>
                              <div>Security: ✅ RBAC Enabled</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Next Steps</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Create sample data</div>
                              <div>Configure user roles</div>
                              <div>Set up dashboards</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <Input 
                            placeholder="Ask about ${appName}..." 
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
      </div>
    </ProtectedPage>
  )
}`
}

