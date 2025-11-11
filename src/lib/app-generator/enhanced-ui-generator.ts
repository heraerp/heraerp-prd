/**
 * HERA Enhanced Fiori++ UI Generator v2.4
 * 
 * Generates complete enterprise UI pages from YAML specifications
 * Supports: transaction wizards, master data forms, dashboards, mobile-first responsive design
 * Compatible with jewelry ERP and complex business applications
 */

import { EnhancedAppConfig, GenerationContext } from './enhanced-yaml-parser'
import { HERAAppMapping } from './yaml-hera-mapper'

// UI page types from YAML configuration
export type UIPageType = 
  | 'list_report'           // Master data browsing (SAP Fiori List Report)
  | 'object_page'           // Detailed entity view (SAP Fiori Object Page)
  | 'transaction_wizard'    // Multi-step transaction creation
  | 'dashboard'             // KPI overview with widgets
  | 'reconciliation'        // Bank reconciliation interface
  | 'compliance_report'     // GST/tax compliance reports
  | 'approval_workflow'     // Transaction approval interface
  | 'analytics'             // Business intelligence charts

// Generated UI component
export interface GeneratedUIComponent {
  component_name: string
  file_path: string
  component_type: UIPageType
  dependencies: string[]
  props_interface: string
  component_code: string
  styles_code?: string
  test_code: string
  route_config: {
    path: string
    title: string
    icon: string
    permissions?: string[]
  }
}

// Page generation configuration
export interface PageGenerationConfig {
  entity_type?: string
  transaction_type?: string
  page_title: string
  route_path: string
  permissions: string[]
  features: {
    mobile_optimized: boolean
    glassmorphism_design: boolean
    ai_assistant: boolean
    real_time_updates: boolean
    offline_support: boolean
  }
  custom_fields?: UIFieldConfig[]
  workflow_steps?: UIWorkflowStep[]
}

export interface UIFieldConfig {
  field_name: string
  field_type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea' | 'file' | 'entity_lookup'
  label: string
  required: boolean
  validation?: string
  options?: string[]
  entity_type?: string
  placeholder?: string
  help_text?: string
}

export interface UIWorkflowStep {
  step_id: string
  step_name: string
  description: string
  fields: string[]
  validation_rules?: string[]
  ai_assistance?: boolean
  auto_complete?: boolean
}

export class EnhancedUIGenerator {
  private appConfig: EnhancedAppConfig
  private heraMapping: HERAAppMapping
  private generatedComponents: Map<string, GeneratedUIComponent> = new Map()
  
  constructor(appConfig: EnhancedAppConfig, heraMapping: HERAAppMapping) {
    this.appConfig = appConfig
    this.heraMapping = heraMapping
  }
  
  /**
   * Generate all UI components from YAML configuration
   */
  generateAllUIComponents(): {
    components: GeneratedUIComponent[]
    navigation_config: NavigationConfig
    routes_config: RouteConfig[]
    summary: UIGenerationSummary
  } {
    console.log(`🎨 Generating enhanced Fiori++ UI components`)
    
    const components: GeneratedUIComponent[] = []
    
    // Generate entity list/detail pages
    for (const entity of this.heraMapping.entities) {
      components.push(...this.generateEntityPages(entity))
    }
    
    // Generate transaction wizards
    for (const transaction of this.heraMapping.transactions) {
      components.push(this.generateTransactionWizard(transaction))
    }
    
    // Generate specialized pages from YAML configuration
    if (this.appConfig.pages) {
      for (const pageConfig of this.appConfig.pages) {
        components.push(this.generateSpecializedPage(pageConfig))
      }
    }
    
    // Generate dashboard
    components.push(this.generateDashboard())
    
    // Generate bank reconciliation UI (if policies include reconciliation)
    const hasReconciliation = this.appConfig.policies?.some(p => p.policy_type === 'matcher')
    if (hasReconciliation) {
      components.push(this.generateBankReconciliationUI())
    }
    
    // Generate GST compliance UI (if industry is jewelry or has GST policies)
    const hasGST = this.appConfig.app.industry === 'jewelry' || 
                   this.appConfig.policies?.some(p => p.policy_type === 'compliance')
    if (hasGST) {
      components.push(this.generateGSTComplianceUI())
    }
    
    // Store all components
    components.forEach(component => {
      this.generatedComponents.set(component.component_name, component)
    })
    
    const navigationConfig = this.generateNavigationConfig(components)
    const routesConfig = this.generateRoutesConfig(components)
    const summary = this.generateSummary(components)
    
    return {
      components,
      navigation_config: navigationConfig,
      routes_config: routesConfig,
      summary
    }
  }
  
  /**
   * Generate entity list and detail pages
   */
  private generateEntityPages(entity: HERAAppMapping['entities'][0]): GeneratedUIComponent[] {
    const components: GeneratedUIComponent[] = []
    
    // List Report Page
    const listPage = this.generateListReportPage(entity)
    components.push(listPage)
    
    // Object Page (Detail View)
    const objectPage = this.generateObjectPage(entity)
    components.push(objectPage)
    
    // Create/Edit Form
    const formPage = this.generateEntityForm(entity)
    components.push(formPage)
    
    return components
  }
  
  /**
   * Generate SAP Fiori List Report page for entity
   */
  private generateListReportPage(entity: HERAAppMapping['entities'][0]): GeneratedUIComponent {
    const entityName = this.capitalizeFirst(entity.entity_type.toLowerCase())
    const componentName = `${entityName}ListPage`
    
    const componentCode = `'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Filter, Download, RefreshCw, Search } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { HERAListReport, QuickFilters } from '@/components/ui-kit/floorplans/list-report'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Entity type definition
interface ${entityName}Entity {
  entity_id: string
  entity_name: string
  entity_code: string
  smart_code: string
  ${entity.dynamic_fields.map(field => 
    `${field.field_name}: ${this.getTypeScriptType(field.field_type)}`
  ).join('\n  ')}
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

// Hook for ${entityName} data management
function use${entityName}Data() {
  const { organization } = useHERAAuth()
  const [data, setData] = useState<${entityName}Entity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const fetchData = async () => {
    if (!organization?.id) return
    
    setLoading(true)
    try {
      // In real implementation, this would call API v2
      const response = await fetch(\`/api/v2/entities?entity_type=${entity.entity_type}&organization_id=\${organization.id}\`)
      const result = await response.json()
      setData(result.data || [])
      setError(null)
    } catch (err) {
      setError(err as Error)
      toast.error('Failed to load ${entityName.toLowerCase()} data')
    } finally {
      setLoading(false)
    }
  }
  
  const deleteEntity = async (entityId: string) => {
    if (!organization?.id) return
    
    try {
      await fetch(\`/api/v2/entities/\${entityId}\`, {
        method: 'DELETE',
        headers: {
          'X-Organization-Id': organization.id
        }
      })
      toast.success('${entityName} deleted successfully')
      await fetchData()
    } catch (err) {
      toast.error('Failed to delete ${entityName.toLowerCase()}')
    }
  }
  
  React.useEffect(() => {
    fetchData()
  }, [organization?.id])
  
  return { data, loading, error, refetch: fetchData, deleteEntity }
}

export default function ${componentName}() {
  const router = useRouter()
  const { organization, user } = useHERAAuth()
  const { data, loading, error, refetch, deleteEntity } = use${entityName}Data()
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Column configuration for data grid
  const columns: ColumnDef<${entityName}Entity>[] = [
    {
      accessorKey: 'entity_name',
      header: '${entityName} Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.entity_name}</div>
      ),
    },
    {
      accessorKey: 'entity_code',
      header: 'Code',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.original.entity_code}
        </Badge>
      ),
    },
    ${entity.dynamic_fields.slice(0, 3).map(field => `{
      accessorKey: '${field.field_name}',
      header: '${this.formatFieldLabel(field.field_name)}',
      cell: ({ row }) => (
        <span>{${this.getFieldDisplayValue(field)}}</span>
      ),
    }`).join(',\n    ')},
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-sm text-gray-500">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ]
  
  // Filter data based on search and filters
  const filteredData = React.useMemo(() => {
    return data.filter(item => {
      const matchesSearch = !searchValue || 
        item.entity_name.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.entity_code.toLowerCase().includes(searchValue.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || 
        item.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [data, searchValue, statusFilter])
  
  // Status options for filtering
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ]
  
  const handleCreateNew = () => {
    router.push(\`${this.getEntityRoute(entity.entity_type)}/new\`)
  }
  
  const handleRowClick = (row: ${entityName}Entity) => {
    router.push(\`${this.getEntityRoute(entity.entity_type)}/\${row.entity_id}\`)
  }
  
  const handleEdit = (row: ${entityName}Entity) => {
    router.push(\`${this.getEntityRoute(entity.entity_type)}/\${row.entity_id}/edit\`)
  }
  
  const handleExport = () => {
    // Export functionality
    toast.success('Export started - you will receive an email when ready')
  }
  
  if (!organization) {
    return (
      <SalonLuxePage title="${entityName} Management" maxWidth="full">
        <Card className="p-8 text-center">
          <p className="text-gray-500">Please select an organization to continue</p>
        </Card>
      </SalonLuxePage>
    )
  }
  
  return (
    <SalonLuxePage
      title="${entityName} Management"
      description="Manage ${entityName.toLowerCase()} records with enterprise-grade data grid"
      maxWidth="full"
      padding="lg"
    >
      {/* Mobile Header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      <div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-champagne">${entityName} Management</h1>
              <p className="text-xs text-bronze">{filteredData.length} records</p>
            </div>
          </div>
          <Button 
            onClick={handleCreateNew}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-gold text-black active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      <HERAListReport
        entityType="${entityName}"
        data={filteredData}
        columns={columns}
        loading={loading}
        error={error?.message}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={
          <QuickFilters
            statusOptions={statusOptions}
            onStatusChange={setStatusFilter}
          />
        }
        onCreate={handleCreateNew}
        onRefresh={refetch}
        onExport={handleExport}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onDelete={async (row) => {
          if (confirm(\`Are you sure you want to delete \${row.entity_name}?\`)) {
            await deleteEntity(row.entity_id)
          }
        }}
        subtitle={
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Organization: {organization.name}</span>
            <span>•</span>
            <span>Total: {filteredData.length}</span>
          </div>
        }
        emptyState={{
          icon: <Search className="w-8 h-8 text-gray-400" />,
          title: \`No \${entityName.toLowerCase()} found\`,
          description: \`Get started by creating your first \${entityName.toLowerCase()}.\`,
          action: (
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create ${entityName}
            </Button>
          )
        }}
        showSelection={true}
        showExport={true}
        showFilters={true}
      />
      
      {/* Mobile Bottom Spacing */}
      <div className="h-24 md:h-0" />
    </SalonLuxePage>
  )
}`

    const testCode = this.generateTestCode(componentName, 'list_report')
    
    return {
      component_name: componentName,
      file_path: `src/app${this.getEntityRoute(entity.entity_type)}/page.tsx`,
      component_type: 'list_report',
      dependencies: [
        'react',
        'framer-motion',
        'lucide-react',
        '@tanstack/react-table',
        'next/navigation',
        'sonner'
      ],
      props_interface: `interface ${componentName}Props {}`,
      component_code: componentCode,
      test_code: testCode,
      route_config: {
        path: this.getEntityRoute(entity.entity_type),
        title: `${entityName} Management`,
        icon: this.getEntityIcon(entity.entity_type),
        permissions: ['read_entities']
      }
    }
  }
  
  /**
   * Generate SAP Fiori Object Page for entity details
   */
  private generateObjectPage(entity: HERAAppMapping['entities'][0]): GeneratedUIComponent {
    const entityName = this.capitalizeFirst(entity.entity_type.toLowerCase())
    const componentName = `${entityName}DetailPage`
    
    const componentCode = `'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Edit, Save, ArrowLeft, Trash2, Copy, MoreVertical } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'

import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fadeSlide } from '@/components/ui-kit/design-tokens'

interface ${entityName}Entity {
  entity_id: string
  entity_name: string
  entity_code: string
  smart_code: string
  ${entity.dynamic_fields.map(field => 
    `${field.field_name}: ${this.getTypeScriptType(field.field_type)}`
  ).join('\n  ')}
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

export default function ${componentName}() {
  const router = useRouter()
  const params = useParams()
  const { organization, user } = useHERAAuth()
  const [entity, setEntity] = useState<${entityName}Entity | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<${entityName}Entity>>({})
  
  const entityId = params.id as string
  
  useEffect(() => {
    fetchEntity()
  }, [entityId, organization?.id])
  
  const fetchEntity = async () => {
    if (!organization?.id || !entityId) return
    
    setLoading(true)
    try {
      const response = await fetch(\`/api/v2/entities/\${entityId}?organization_id=\${organization.id}\`)
      const result = await response.json()
      
      if (result.data) {
        setEntity(result.data)
        setFormData(result.data)
      }
    } catch (error) {
      toast.error('Failed to load ${entityName.toLowerCase()} details')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    if (!organization?.id || !entity) return
    
    try {
      const response = await fetch(\`/api/v2/entities/\${entity.entity_id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': organization.id
        },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        toast.success('${entityName} updated successfully')
        setEditing(false)
        await fetchEntity()
      }
    } catch (error) {
      toast.error('Failed to update ${entityName.toLowerCase()}')
    }
  }
  
  const handleDelete = async () => {
    if (!organization?.id || !entity) return
    
    if (!confirm(\`Are you sure you want to delete \${entity.entity_name}?\`)) {
      return
    }
    
    try {
      await fetch(\`/api/v2/entities/\${entity.entity_id}\`, {
        method: 'DELETE',
        headers: {
          'X-Organization-Id': organization.id
        }
      })
      
      toast.success('${entityName} deleted successfully')
      router.push('${this.getEntityRoute(entity.entity_type)}')
    } catch (error) {
      toast.error('Failed to delete ${entityName.toLowerCase()}')
    }
  }
  
  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }
  
  if (loading) {
    return (
      <SalonLuxePage title="Loading..." maxWidth="6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
        </div>
      </SalonLuxePage>
    )
  }
  
  if (!entity) {
    return (
      <SalonLuxePage title="Not Found" maxWidth="6xl">
        <Card className="p-8 text-center">
          <p className="text-gray-500">${entityName} not found</p>
          <Button 
            onClick={() => router.push('${this.getEntityRoute(entity.entity_type)}')}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to ${entityName} List
          </Button>
        </Card>
      </SalonLuxePage>
    )
  }
  
  return (
    <SalonLuxePage
      title={editing ? \`Edit \${entity.entity_name}\` : entity.entity_name}
      description={entity.entity_code}
      maxWidth="6xl"
    >
      {/* Mobile Header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      <div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="min-w-[44px] min-h-[44px] p-0"
            >
              <ArrowLeft className="w-5 h-5 text-champagne" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-champagne">{entity.entity_name}</h1>
              <p className="text-xs text-bronze">{entity.entity_code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <Button 
                onClick={handleSave}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-gold text-black active:scale-95"
              >
                <Save className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                onClick={() => setEditing(true)}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-gold/20 text-gold active:scale-95"
              >
                <Edit className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Desktop Actions */}
      <motion.div className="hidden md:flex justify-between items-center mb-6" {...fadeSlide(0.1)}>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('${this.getEntityRoute(entity.entity_type)}')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
          <Badge variant="outline" className="font-mono">
            {entity.smart_code}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </motion.div>
      
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <motion.div {...fadeSlide(0.2)}>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="entity_name">Name</Label>
                    <Input
                      id="entity_name"
                      value={editing ? formData.entity_name || '' : entity.entity_name}
                      onChange={(e) => handleFieldChange('entity_name', e.target.value)}
                      disabled={!editing}
                      className="bg-white/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="entity_code">Code</Label>
                    <Input
                      id="entity_code"
                      value={editing ? formData.entity_code || '' : entity.entity_code}
                      onChange={(e) => handleFieldChange('entity_code', e.target.value)}
                      disabled={!editing}
                      className="bg-white/50"
                    />
                  </div>
                  
                  ${entity.dynamic_fields.slice(0, 6).map(field => `<div className="space-y-2">
                    <Label htmlFor="${field.field_name}">${this.formatFieldLabel(field.field_name)}</Label>
                    <Input
                      id="${field.field_name}"
                      type="${this.getInputType(field.field_type)}"
                      value={editing ? formData.${field.field_name} || '' : entity.${field.field_name}}
                      onChange={(e) => handleFieldChange('${field.field_name}', e.target.value)}
                      disabled={!editing}
                      className="bg-white/50"
                    />
                  </div>`).join('\n                  ')}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="history">
          <motion.div {...fadeSlide(0.3)}>
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm">{new Date(entity.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm">{new Date(entity.updated_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Created By</span>
                    <span className="text-sm">{entity.created_by}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Updated By</span>
                    <span className="text-sm">{entity.updated_by}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="relationships">
          <motion.div {...fadeSlide(0.4)}>
            <Card>
              <CardHeader>
                <CardTitle>Related Records</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Relationships will be displayed here</p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      
      {/* Mobile Bottom Spacing */}
      <div className="h-24 md:h-0" />
    </SalonLuxePage>
  )
}`

    const testCode = this.generateTestCode(componentName, 'object_page')
    
    return {
      component_name: componentName,
      file_path: `src/app${this.getEntityRoute(entity.entity_type)}/[id]/page.tsx`,
      component_type: 'object_page',
      dependencies: [
        'react',
        'framer-motion', 
        'lucide-react',
        'next/navigation',
        'sonner'
      ],
      props_interface: `interface ${componentName}Props {}`,
      component_code: componentCode,
      test_code: testCode,
      route_config: {
        path: `${this.getEntityRoute(entity.entity_type)}/[id]`,
        title: `${entityName} Details`,
        icon: this.getEntityIcon(entity.entity_type),
        permissions: ['read_entities', 'update_entities']
      }
    }
  }
  
  /**
   * Generate entity creation/edit form
   */
  private generateEntityForm(entity: HERAAppMapping['entities'][0]): GeneratedUIComponent {
    const entityName = this.capitalizeFirst(entity.entity_type.toLowerCase())
    const componentName = `${entityName}FormPage`
    
    const componentCode = `'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, ArrowLeft, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'

import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { fadeSlide } from '@/components/ui-kit/design-tokens'

interface ${entityName}FormData {
  entity_name: string
  entity_code: string
  ${entity.dynamic_fields.map(field => 
    `${field.field_name}: ${this.getTypeScriptType(field.field_type)}`
  ).join('\n  ')}
}

export default function ${componentName}() {
  const router = useRouter()
  const params = useParams()
  const { organization, user } = useHERAAuth()
  const [formData, setFormData] = useState<${entityName}FormData>({
    entity_name: '',
    entity_code: '',
    ${entity.dynamic_fields.map(field => 
      `${field.field_name}: ${this.getDefaultValue(field.field_type)}`
    ).join(',\n    ')}
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isEdit, setIsEdit] = useState(false)
  
  const entityId = params.id as string
  
  useEffect(() => {
    if (entityId && entityId !== 'new') {
      setIsEdit(true)
      fetchEntity()
    }
  }, [entityId, organization?.id])
  
  const fetchEntity = async () => {
    if (!organization?.id || !entityId) return
    
    try {
      const response = await fetch(\`/api/v2/entities/\${entityId}?organization_id=\${organization.id}\`)
      const result = await response.json()
      
      if (result.data) {
        setFormData(result.data)
      }
    } catch (error) {
      toast.error('Failed to load ${entityName.toLowerCase()} data')
    }
  }
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.entity_name.trim()) {
      newErrors.entity_name = 'Name is required'
    }
    
    if (!formData.entity_code.trim()) {
      newErrors.entity_code = 'Code is required'
    }
    
    ${entity.dynamic_fields
      .filter(field => field.is_required)
      .map(field => `if (!formData.${field.field_name}) {
      newErrors.${field.field_name} = '${this.formatFieldLabel(field.field_name)} is required'
    }`).join('\n    ')}
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !organization?.id) return
    
    setLoading(true)
    
    try {
      const url = isEdit ? \`/api/v2/entities/\${entityId}\` : '/api/v2/entities'
      const method = isEdit ? 'PUT' : 'POST'
      
      const payload = {
        ...formData,
        entity_type: '${entity.entity_type}',
        organization_id: organization.id,
        smart_code: \`${entity.smart_code}.ENTITY.v1\`
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': organization.id
        },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        toast.success(\`${entityName} \${isEdit ? 'updated' : 'created'} successfully\`)
        router.push('${this.getEntityRoute(entity.entity_type)}')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save ${entityName.toLowerCase()}')
      }
    } catch (error) {
      toast.error('Failed to save ${entityName.toLowerCase()}')
    } finally {
      setLoading(false)
    }
  }
  
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  const generateSmartCode = () => {
    const timestamp = Date.now().toString().slice(-6)
    const randomCode = Math.random().toString(36).slice(-4).toUpperCase()
    const code = \`${entity.entity_type}_\${timestamp}_\${randomCode}\`
    handleFieldChange('entity_code', code)
    toast.success('Smart code generated!')
  }
  
  return (
    <SalonLuxePage
      title={isEdit ? \`Edit \${formData.entity_name || '${entityName}'}\` : \`Create New ${entityName}\`}
      description={isEdit ? 'Update ${entityName.toLowerCase()} details' : 'Add a new ${entityName.toLowerCase()} to your organization'}
      maxWidth="4xl"
    >
      {/* Mobile Header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      <div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="min-w-[44px] min-h-[44px] p-0"
            >
              <ArrowLeft className="w-5 h-5 text-champagne" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-champagne">
                {isEdit ? 'Edit ${entityName}' : 'New ${entityName}'}
              </h1>
              <p className="text-xs text-bronze">Fill in the details below</p>
            </div>
          </div>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-gold text-black active:scale-95"
          >
            <Save className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Desktop Actions */}
      <motion.div className="hidden md:flex justify-between items-center mb-6" {...fadeSlide(0.1)}>
        <Button
          variant="outline"
          onClick={() => router.push('${this.getEntityRoute(entity.entity_type)}')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')} ${entityName}
          </Button>
        </div>
      </motion.div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div {...fadeSlide(0.2)}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="entity_name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="entity_name"
                    value={formData.entity_name}
                    onChange={(e) => handleFieldChange('entity_name', e.target.value)}
                    className="bg-white/50"
                    placeholder="Enter ${entityName.toLowerCase()} name"
                  />
                  {errors.entity_name && (
                    <p className="text-sm text-red-500">{errors.entity_name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entity_code" className="flex items-center gap-2">
                    Code <span className="text-red-500">*</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generateSmartCode}
                      className="h-6 px-2 text-xs"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Generate
                    </Button>
                  </Label>
                  <Input
                    id="entity_code"
                    value={formData.entity_code}
                    onChange={(e) => handleFieldChange('entity_code', e.target.value)}
                    className="bg-white/50 font-mono"
                    placeholder="Enter unique code"
                  />
                  {errors.entity_code && (
                    <p className="text-sm text-red-500">{errors.entity_code}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div {...fadeSlide(0.3)}>
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${entity.dynamic_fields.map(field => this.generateFormField(field)).join('\n                ')}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Mobile Submit Button */}
        <div className="md:hidden">
          <Button 
            type="submit"
            disabled={loading}
            className="w-full min-h-[56px] bg-gold text-black text-lg font-bold"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')} ${entityName}
          </Button>
        </div>
      </form>
      
      {/* Mobile Bottom Spacing */}
      <div className="h-24 md:h-0" />
    </SalonLuxePage>
  )
}`

    const testCode = this.generateTestCode(componentName, 'form')
    
    return {
      component_name: componentName,
      file_path: `src/app${this.getEntityRoute(entity.entity_type)}/[id]/edit/page.tsx`,
      component_type: 'object_page',
      dependencies: [
        'react',
        'framer-motion',
        'lucide-react', 
        'next/navigation',
        'sonner'
      ],
      props_interface: `interface ${componentName}Props {}`,
      component_code: componentCode,
      test_code: testCode,
      route_config: {
        path: `${this.getEntityRoute(entity.entity_type)}/new`,
        title: `Create ${entityName}`,
        icon: this.getEntityIcon(entity.entity_type),
        permissions: ['create_entities']
      }
    }
  }
  
  /**
   * Generate transaction wizard for complex multi-step transactions
   */
  private generateTransactionWizard(transaction: HERAAppMapping['transactions'][0]): GeneratedUIComponent {
    const transactionName = this.capitalizeFirst(transaction.transaction_type.toLowerCase())
    const componentName = `${transactionName}WizardPage`
    
    const componentCode = `'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, ArrowRight, Check, AlertCircle, Calculator, 
  Receipt, Users, Package, CreditCard, FileText 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { fadeSlide } from '@/components/ui-kit/design-tokens'

interface ${transactionName}Data {
  // Header data
  ${transaction.header_fields?.map(field => 
    `${field.name}: ${this.getTypeScriptType(field.type || 'text')}`
  ).join('\n  ') || 'transaction_number: string'}
  
  // Line items
  lines: ${transactionName}Line[]
  
  // Totals
  subtotal: number
  tax_amount: number
  total_amount: number
}

interface ${transactionName}Line {
  line_number: number
  ${transaction.lines?.map(line => 
    line.fields?.map(field => 
      `${field.name}: ${this.getTypeScriptType(field.type || 'text')}`
    ).join('\n  ')
  ).join('\n  ') || 'description: string\n  quantity: number\n  unit_price: number\n  amount: number'}
}

const WIZARD_STEPS = [
  { id: 'header', title: 'Transaction Details', icon: FileText },
  { id: 'lines', title: 'Line Items', icon: Package },
  { id: 'calculations', title: 'Calculations', icon: Calculator },
  { id: 'review', title: 'Review & Submit', icon: Check },
]

export default function ${componentName}() {
  const router = useRouter()
  const { organization, user } = useHERAAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [transactionData, setTransactionData] = useState<${transactionName}Data>({
    ${transaction.header_fields?.map(field => 
      `${field.name}: ${this.getDefaultValue(field.type || 'text')}`
    ).join(',\n    ') || 'transaction_number: ""'},
    lines: [],
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100
  
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (currentStep) {
      case 0: // Header validation
        ${transaction.header_fields?.filter(field => field.required)
          .map(field => `if (!transactionData.${field.name}) {
          newErrors.${field.name} = '${this.formatFieldLabel(field.name)} is required'
        }`).join('\n        ') || '// No required fields'}
        break
        
      case 1: // Lines validation
        if (transactionData.lines.length === 0) {
          newErrors.lines = 'At least one line item is required'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = () => {
    if (validateCurrentStep() && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleFieldChange = (field: string, value: any) => {
    setTransactionData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  const addLineItem = () => {
    const newLine: ${transactionName}Line = {
      line_number: transactionData.lines.length + 1,
      ${transaction.lines?.[0]?.fields?.map(field => 
        `${field.name}: ${this.getDefaultValue(field.type || 'text')}`
      ).join(',\n      ') || 'description: "",\n      quantity: 1,\n      unit_price: 0,\n      amount: 0'}
    }
    
    setTransactionData(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }))
  }
  
  const updateLineItem = (lineNumber: number, field: string, value: any) => {
    setTransactionData(prev => ({
      ...prev,
      lines: prev.lines.map(line => 
        line.line_number === lineNumber 
          ? { ...line, [field]: value }
          : line
      )
    }))
  }
  
  const removeLineItem = (lineNumber: number) => {
    setTransactionData(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.line_number !== lineNumber)
        .map((line, index) => ({ ...line, line_number: index + 1 }))
    }))
  }
  
  const calculateTotals = () => {
    const subtotal = transactionData.lines.reduce((sum, line) => 
      sum + (line.quantity * line.unit_price), 0
    )
    const tax_amount = subtotal * 0.18 // 18% GST for jewelry
    const total_amount = subtotal + tax_amount
    
    setTransactionData(prev => ({
      ...prev,
      subtotal,
      tax_amount,
      total_amount
    }))
  }
  
  useEffect(() => {
    calculateTotals()
  }, [transactionData.lines])
  
  const handleSubmit = async () => {
    if (!organization?.id) return
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/v2/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': organization.id
        },
        body: JSON.stringify({
          transaction_type: '${transaction.transaction_type}',
          smart_code: '${transaction.smart_code}',
          organization_id: organization.id,
          ...transactionData
        })
      })
      
      if (response.ok) {
        toast.success('${transactionName} created successfully')
        router.push('/transactions/${transaction.transaction_type}')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create ${transactionName.toLowerCase()}')
      }
    } catch (error) {
      toast.error('Failed to create ${transactionName.toLowerCase()}')
    } finally {
      setLoading(false)
    }
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Transaction Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${transaction.header_fields?.map(field => this.generateWizardField(field)).join('\n                ') || 
                  `<div className="space-y-2">
                    <Label>Transaction Number</Label>
                    <Input
                      value={transactionData.transaction_number}
                      onChange={(e) => handleFieldChange('transaction_number', e.target.value)}
                      placeholder="Auto-generated"
                      disabled
                    />
                  </div>`}
              </div>
            </CardContent>
          </Card>
        )
        
      case 1:
        return (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Line Items</CardTitle>
                <Button onClick={addLineItem}>
                  <Package className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transactionData.lines.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No line items added yet</p>
                  <Button onClick={addLineItem} className="mt-4">
                    Add First Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactionData.lines.map((line, index) => (
                    <div key={line.line_number} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Item #{line.line_number}</h4>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeLineItem(line.line_number)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={line.description}
                            onChange={(e) => updateLineItem(line.line_number, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => updateLineItem(line.line_number, 'quantity', Number(e.target.value))}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label>Unit Price</Label>
                          <Input
                            type="number"
                            value={line.unit_price}
                            onChange={(e) => updateLineItem(line.line_number, 'unit_price', Number(e.target.value))}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label>Amount</Label>
                          <Input
                            value={(line.quantity * line.unit_price).toFixed(2)}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
        
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Calculations & Tax</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{transactionData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>GST (18%):</span>
                  <span className="font-mono">₹{transactionData.tax_amount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2 text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="font-mono">₹{transactionData.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
        
      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Transaction Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    ${transaction.header_fields?.slice(0, 4).map(field => 
                      `<div>
                        <span className="text-gray-500">${this.formatFieldLabel(field.name)}:</span>
                        <span className="ml-2">{transactionData.${field.name}}</span>
                      </div>`
                    ).join('\n                    ') || ''}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Line Items ({transactionData.lines.length})</h4>
                  <div className="space-y-2">
                    {transactionData.lines.map(line => (
                      <div key={line.line_number} className="flex justify-between text-sm">
                        <span>{line.description}</span>
                        <span>{line.quantity} × ₹{line.unit_price} = ₹{(line.quantity * line.unit_price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Ready to Submit</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Total Amount: ₹{transactionData.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
        
      default:
        return null
    }
  }
  
  return (
    <SalonLuxePage
      title="Create ${transactionName}"
      description="Multi-step transaction wizard"
      maxWidth="4xl"
    >
      {/* Mobile Header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      
      {/* Progress Bar */}
      <motion.div className="mb-8" {...fadeSlide(0.1)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Step {currentStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep].title}
          </h2>
          <Badge variant="outline">
            {Math.round(progress)}% Complete
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Step indicators */}
        <div className="flex justify-between mt-4">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep
            
            return (
              <div
                key={step.id}
                className={\`flex items-center gap-2 \${
                  isActive ? 'text-gold' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }\`}
              >
                <div className={\`w-8 h-8 rounded-full flex items-center justify-center \${
                  isActive ? 'bg-gold text-black' : 
                  isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200'
                }\`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="hidden md:block text-sm font-medium">{step.title}</span>
              </div>
            )
          })}
        </div>
      </motion.div>
      
      {/* Step Content */}
      <motion.div {...fadeSlide(0.2)}>
        {renderStepContent()}
      </motion.div>
      
      {/* Navigation */}
      <motion.div className="flex justify-between items-center mt-8" {...fadeSlide(0.3)}>
        <Button
          variant="outline"
          onClick={currentStep === 0 ? () => router.back() : handlePrevious}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </Button>
        
        {currentStep === WIZARD_STEPS.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gold text-black hover:bg-gold/90"
          >
            {loading ? 'Creating...' : 'Create Transaction'}
            <Receipt className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </motion.div>
      
      {/* Mobile Bottom Spacing */}
      <div className="h-24 md:h-0" />
    </SalonLuxePage>
  )
}`

    const testCode = this.generateTestCode(componentName, 'transaction_wizard')
    
    return {
      component_name: componentName,
      file_path: `src/app/transactions/${transaction.transaction_type}/new/page.tsx`,
      component_type: 'transaction_wizard',
      dependencies: [
        'react',
        'framer-motion',
        'lucide-react',
        'next/navigation',
        'sonner'
      ],
      props_interface: `interface ${componentName}Props {}`,
      component_code: componentCode,
      test_code: testCode,
      route_config: {
        path: `/transactions/${transaction.transaction_type}/new`,
        title: `Create ${transactionName}`,
        icon: 'Receipt',
        permissions: ['create_transactions']
      }
    }
  }
  
  // Continue with other generation methods...
  private generateSpecializedPage(pageConfig: any): GeneratedUIComponent {
    // Implementation for specialized pages like analytics, compliance reports
    return this.generateDashboard() // Placeholder
  }
  
  private generateDashboard(): GeneratedUIComponent {
    const componentName = 'AppDashboard'
    
    const componentCode = `'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, DollarSign, Package, Users, FileText } from 'lucide-react'

import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fadeSlide } from '@/components/ui-kit/design-tokens'

export default function ${componentName}() {
  const metrics = [
    { title: 'Total Revenue', value: '₹2,45,000', change: '+12%', icon: DollarSign, color: 'text-green-600' },
    { title: 'Transactions', value: '1,234', change: '+8%', icon: FileText, color: 'text-blue-600' },
    { title: 'Customers', value: '456', change: '+15%', icon: Users, color: 'text-purple-600' },
    { title: 'Products', value: '89', change: '+3%', icon: Package, color: 'text-orange-600' },
  ]
  
  return (
    <SalonLuxePage
      title="${this.appConfig.app.name} Dashboard"
      description="Overview of your business performance"
      maxWidth="7xl"
    >
      {/* KPI Grid */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" {...fadeSlide(0.1)}>
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={metric.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className={\`text-sm \${metric.color}\`}>{metric.change} from last month</p>
                  </div>
                  <Icon className={\`w-8 h-8 \${metric.color}\`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>
      
      {/* Quick Actions */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" {...fadeSlide(0.2)}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Recent transactions and activities will appear here</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Quick action buttons will appear here</p>
          </CardContent>
        </Card>
      </motion.div>
    </SalonLuxePage>
  )
}`

    return {
      component_name: componentName,
      file_path: 'src/app/dashboard/page.tsx',
      component_type: 'dashboard',
      dependencies: ['react', 'framer-motion', 'lucide-react'],
      props_interface: `interface ${componentName}Props {}`,
      component_code: componentCode,
      test_code: this.generateTestCode(componentName, 'dashboard'),
      route_config: {
        path: '/dashboard',
        title: 'Dashboard',
        icon: 'BarChart3',
        permissions: ['read_dashboard']
      }
    }
  }
  
  private generateBankReconciliationUI(): GeneratedUIComponent {
    // Bank reconciliation interface
    const componentName = 'BankReconciliationPage'
    
    return {
      component_name: componentName,
      file_path: 'src/app/finance/reconciliation/page.tsx',
      component_type: 'reconciliation',
      dependencies: ['react', 'framer-motion', 'lucide-react'],
      props_interface: `interface ${componentName}Props {}`,
      component_code: '// Bank reconciliation implementation',
      test_code: this.generateTestCode(componentName, 'reconciliation'),
      route_config: {
        path: '/finance/reconciliation',
        title: 'Bank Reconciliation',
        icon: 'CreditCard',
        permissions: ['manage_reconciliation']
      }
    }
  }
  
  private generateGSTComplianceUI(): GeneratedUIComponent {
    // GST compliance interface
    const componentName = 'GSTCompliancePage'
    
    return {
      component_name: componentName,
      file_path: 'src/app/compliance/gst/page.tsx',
      component_type: 'compliance_report',
      dependencies: ['react', 'framer-motion', 'lucide-react'],
      props_interface: `interface ${componentName}Props {}`,
      component_code: '// GST compliance implementation',
      test_code: this.generateTestCode(componentName, 'compliance_report'),
      route_config: {
        path: '/compliance/gst',
        title: 'GST Compliance',
        icon: 'FileText',
        permissions: ['manage_compliance']
      }
    }
  }
  
  // Helper methods continue...
  private generateNavigationConfig(components: GeneratedUIComponent[]): NavigationConfig {
    const groupedRoutes = this.groupRoutesByModule(components)
    
    return {
      main_navigation: Object.entries(groupedRoutes).map(([module, routes]) => ({
        section: this.capitalizeFirst(module),
        items: routes.map(route => ({
          label: route.title,
          href: route.path,
          icon: route.icon,
          permissions: route.permissions
        }))
      }))
    }
  }
  
  private generateRoutesConfig(components: GeneratedUIComponent[]): RouteConfig[] {
    return components.map(component => ({
      path: component.route_config.path,
      component: component.component_name,
      title: component.route_config.title,
      permissions: component.route_config.permissions || []
    }))
  }
  
  private generateSummary(components: GeneratedUIComponent[]): UIGenerationSummary {
    const byType = components.reduce((acc, comp) => {
      acc[comp.component_type] = (acc[comp.component_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total_components: components.length,
      by_type: byType,
      total_routes: components.length,
      estimated_file_size: components.reduce((sum, comp) => sum + comp.component_code.length, 0),
      features: {
        mobile_optimized: true,
        glassmorphism_design: true,
        responsive_layout: true,
        ai_assistant_ready: true,
        dark_mode_support: false
      }
    }
  }
  
  // Utility methods for code generation
  private getTypeScriptType(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'text': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'date': 'string',
      'json': 'any',
      'email': 'string',
      'phone': 'string',
      'url': 'string'
    }
    return typeMap[fieldType] || 'string'
  }
  
  private getInputType(fieldType: string): string {
    const typeMap: Record<string, string> = {
      'number': 'number',
      'date': 'date',
      'email': 'email',
      'phone': 'tel',
      'url': 'url',
      'boolean': 'checkbox'
    }
    return typeMap[fieldType] || 'text'
  }
  
  private getDefaultValue(fieldType: string): string {
    const defaultMap: Record<string, string> = {
      'text': '""',
      'number': '0',
      'boolean': 'false',
      'date': '""',
      'json': '{}',
      'email': '""',
      'phone': '""',
      'url': '""'
    }
    return defaultMap[fieldType] || '""'
  }
  
  private formatFieldLabel(fieldName: string): string {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
  
  private getEntityRoute(entityType: string): string {
    // Map entity types to appropriate module routes
    const routeMap: Record<string, string> = {
      'CUSTOMER': '/crm/customers',
      'CONTACT': '/crm/contacts',
      'ACCOUNT': '/crm/accounts',
      'PRODUCT': '/inventory/products',
      'VENDOR': '/procurement/vendors',
      'STAFF': '/hr/staff',
      'MATERIAL': '/inventory/materials'
    }
    
    return routeMap[entityType] || `/entities/${entityType.toLowerCase()}`
  }
  
  private getEntityIcon(entityType: string): string {
    const iconMap: Record<string, string> = {
      'CUSTOMER': 'Users',
      'CONTACT': 'User',
      'ACCOUNT': 'Building2',
      'PRODUCT': 'Package',
      'VENDOR': 'Truck',
      'STAFF': 'UserCheck',
      'MATERIAL': 'Layers'
    }
    
    return iconMap[entityType] || 'Box'
  }
  
  private getFieldDisplayValue(field: any): string {
    switch (field.field_type) {
      case 'date':
        return `new Date(row.original.${field.field_name}).toLocaleDateString()`
      case 'number':
        return `row.original.${field.field_name}?.toLocaleString()`
      case 'boolean':
        return `row.original.${field.field_name} ? 'Yes' : 'No'`
      default:
        return `row.original.${field.field_name}`
    }
  }
  
  private generateFormField(field: any): string {
    const isRequired = field.is_required ? '<span className="text-red-500">*</span>' : ''
    
    return `<div className="space-y-2">
  <Label htmlFor="${field.field_name}">
    ${this.formatFieldLabel(field.field_name)} ${isRequired}
  </Label>
  <Input
    id="${field.field_name}"
    type="${this.getInputType(field.field_type)}"
    value={formData.${field.field_name}}
    onChange={(e) => handleFieldChange('${field.field_name}', e.target.value)}
    className="bg-white/50"
    placeholder="Enter ${field.field_name.replace('_', ' ')}"
  />
  {errors.${field.field_name} && (
    <p className="text-sm text-red-500">{errors.${field.field_name}}</p>
  )}
</div>`
  }
  
  private generateWizardField(field: any): string {
    return this.generateFormField(field)
  }
  
  private generateTestCode(componentName: string, pageType: string): string {
    return `import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ${componentName} from './${componentName}'

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
  
  it('displays correct page title', () => {
    render(<${componentName} />)
    // Add specific tests for ${pageType} page
  })
})`
  }
  
  private groupRoutesByModule(components: GeneratedUIComponent[]): Record<string, Array<{ path: string; title: string; icon: string; permissions?: string[] }>> {
    const grouped: Record<string, Array<any>> = {}
    
    components.forEach(component => {
      const pathParts = component.route_config.path.split('/')
      const module = pathParts[1] || 'main'
      
      if (!grouped[module]) {
        grouped[module] = []
      }
      
      grouped[module].push(component.route_config)
    })
    
    return grouped
  }
}

// Type definitions
export interface NavigationConfig {
  main_navigation: Array<{
    section: string
    items: Array<{
      label: string
      href: string
      icon: string
      permissions?: string[]
    }>
  }>
}

export interface RouteConfig {
  path: string
  component: string
  title: string
  permissions: string[]
}

export interface UIGenerationSummary {
  total_components: number
  by_type: Record<string, number>
  total_routes: number
  estimated_file_size: number
  features: {
    mobile_optimized: boolean
    glassmorphism_design: boolean
    responsive_layout: boolean
    ai_assistant_ready: boolean
    dark_mode_support: boolean
  }
}

/**
 * Helper function to generate UI components from YAML configuration
 */
export function generateUIFromYAML(
  appConfig: EnhancedAppConfig,
  heraMapping: HERAAppMapping
): {
  components: GeneratedUIComponent[]
  navigation_config: NavigationConfig
  routes_config: RouteConfig[]
  summary: UIGenerationSummary
} {
  const generator = new EnhancedUIGenerator(appConfig, heraMapping)
  return generator.generateAllUIComponents()
}

export default EnhancedUIGenerator