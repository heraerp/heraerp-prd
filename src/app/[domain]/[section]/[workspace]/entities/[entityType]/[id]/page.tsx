/**
 * Universal Entity Detail Page
 * Smart Code: HERA.UNIVERSAL.ENTITY.DETAIL.v1
 * 
 * Dynamic entity detail page that works for ANY domain/section/workspace/entityType/id combination
 * Route: /[domain]/[section]/[workspace]/entities/[entityType]/[id]
 * Examples: /retail/pos/main/entities/customers/123, /wholesale/ordering/main/entities/products/456
 * 
 * NOTE: NO /apps prefix - direct universal routing only
 */

'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Loader2, 
  AlertTriangle,
  Edit,
  Save,
  X,
  History,
  Link2,
  FileText,
  Package,
  Users,
  Building2,
  Database,
  Calendar,
  Clock
} from 'lucide-react'
import { resolveUniversalConfig, generateUniversalSmartCode, generateUniversalBreadcrumbs, UNIVERSAL_CONFIG } from '@/lib/universal/config'

// Icon mapping for dynamic icon rendering
const iconMap = {
  'Package': Package,
  'Users': Users,
  'Building2': Building2,
  'Database': Database
}

export default function UniversalEntityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  
  const domain = params.domain as string
  const section = params.section as string
  const workspace = params.workspace as string
  const entityType = params.entityType as string
  const id = params.id as string

  // Three-layer auth check
  if (!isAuthenticated) return <Alert><AlertDescription>Please log in</AlertDescription></Alert>
  if (contextLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!organization?.id) return <Alert><AlertDescription>No organization context</AlertDescription></Alert>

  // Resolve universal configuration
  const config = resolveUniversalConfig(domain, section, workspace)
  
  if (!config.domain || !config.section || !config.workspace) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Invalid route. Please check domain, section, and workspace configuration.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/')} className="mt-4">
          ← Back to Home
        </Button>
      </div>
    )
  }

  // Find the specific entity type
  const entityTypeConfig = config.entityTypes.find(e => e.id === entityType)
  
  if (!entityTypeConfig) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-700">
            Entity type "{entityType}" not found in this workspace.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push(`/${domain}/${section}/${workspace}/entities/${entityType}`)} className="mt-4">
          ← Back to {entityTypeConfig?.name || 'Entity List'}
        </Button>
      </div>
    )
  }

  // Get breadcrumbs
  const breadcrumbs = generateUniversalBreadcrumbs(domain, section, workspace, entityType, id)

  // Get icons
  const EntityIcon = iconMap[entityTypeConfig.icon.name as keyof typeof iconMap] || Database

  const handleBackClick = () => {
    router.push(`/${domain}/${section}/${workspace}/entities/${entityType}`)
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
  }

  const handleSave = () => {
    // Save logic would go here
    setIsEditing(false)
    // Show success message
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data
  }

  // Mock entity data - in real app would come from API
  const mockEntity = {
    id: id,
    name: `Sample ${entityTypeConfig.name.slice(0, -1)} #${id}`,
    status: 'Active',
    created: '2024-01-15T10:30:00Z',
    updated: '2024-01-20T14:45:00Z',
    createdBy: user?.id || 'system',
    updatedBy: user?.id || 'system'
  }

  // Mock field data based on entity type configuration
  const mockFieldData = entityTypeConfig.fields.reduce((acc, field) => {
    switch (field.type) {
      case 'email':
        acc[field.name] = 'example@company.com'
        break
      case 'phone':
        acc[field.name] = '+1 (555) 123-4567'
        break
      case 'number':
        acc[field.name] = '100.00'
        break
      case 'boolean':
        acc[field.name] = 'true'
        break
      case 'date':
        acc[field.name] = '2024-01-15'
        break
      case 'select':
        acc[field.name] = field.options?.[0] || 'Option 1'
        break
      default:
        acc[field.name] = `Sample ${field.label}`
    }
    return acc
  }, {} as Record<string, string>)

  const renderField = (field: any) => {
    const value = mockFieldData[field.name] || ''
    
    if (!isEditing) {
      return (
        <div key={field.id} className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded border">
            {value || 'Not set'}
          </div>
        </div>
      )
    }

    switch (field.type) {
      case 'email':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="email"
              placeholder={field.placeholder || field.label}
              defaultValue={value}
              required={field.required}
            />
          </div>
        )
      
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="tel"
              placeholder={field.placeholder || field.label}
              defaultValue={value}
              required={field.required}
            />
          </div>
        )
      
      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              placeholder={field.placeholder || field.label}
              defaultValue={value}
              required={field.required}
            />
          </div>
        )
      
      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="date"
              defaultValue={value}
              required={field.required}
            />
          </div>
        )
      
      case 'boolean':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select defaultValue={value}>
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      
      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select defaultValue={value}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      
      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="text"
              placeholder={field.placeholder || field.label}
              defaultValue={value}
              required={field.required}
            />
          </div>
        )
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span>/</span>}
            <button
              onClick={() => router.push(crumb.href)}
              className="hover:text-blue-600 transition-colors"
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleBackClick}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {entityTypeConfig.name}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-${entityTypeConfig.color}-100`}>
              <EntityIcon className={`w-8 h-8 text-${entityTypeConfig.color}-600`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {mockEntity.name}
              </h1>
              <p className="text-gray-600">
                {entityTypeConfig.name.slice(0, -1)} Details
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={handleEditToggle}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <Badge variant={mockEntity.status === 'Active' ? 'default' : 'secondary'}>
            {mockEntity.status}
          </Badge>
          <Badge variant="outline">
            ID: {mockEntity.id}
          </Badge>
          <Badge variant="outline">
            {config.domain.name} • {config.section.name} • {config.workspace.name}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Entity Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {entityTypeConfig.fields.map(renderField)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Relationships Tab */}
            <TabsContent value="relationships" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Relationships</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No relationships found</h3>
                    <p className="text-gray-600">
                      This {entityTypeConfig.name.slice(0, -1).toLowerCase()} doesn't have any relationships configured yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <History className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Entity created</p>
                          <p className="text-xs text-gray-500">{new Date(mockEntity.created).toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-gray-600">Created by {mockEntity.createdBy}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                      <History className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Entity updated</p>
                          <p className="text-xs text-gray-500">{new Date(mockEntity.updated).toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-gray-600">Updated by {mockEntity.updatedBy}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attachments Tab */}
            <TabsContent value="attachments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No attachments</h3>
                    <p className="text-gray-600">
                      No files have been attached to this {entityTypeConfig.name.slice(0, -1).toLowerCase()} yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          {/* Entity Info */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600">Created</div>
                  <div className="font-medium">{new Date(mockEntity.created).toLocaleDateString()}</div>
                </div>
                
                <div>
                  <div className="text-gray-600">Updated</div>
                  <div className="font-medium">{new Date(mockEntity.updated).toLocaleDateString()}</div>
                </div>
                
                <div>
                  <div className="text-gray-600">Status</div>
                  <Badge variant={mockEntity.status === 'Active' ? 'default' : 'secondary'}>
                    {mockEntity.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {entityTypeConfig.actions.map((action) => (
                  <Button key={action} variant="outline" size="sm" className="w-full justify-start">
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Domain:</strong> {domain}</div>
            <div><strong>Section:</strong> {section}</div>
            <div><strong>Workspace:</strong> {workspace}</div>
            <div><strong>Entity Type:</strong> {entityType}</div>
            <div><strong>Entity ID:</strong> {id}</div>
            <div><strong>Smart Code:</strong> {generateUniversalSmartCode(domain, section, workspace, 'ENTITY', entityType.toUpperCase())}</div>
            <div><strong>Entity Config:</strong> {entityTypeConfig.name} ({entityTypeConfig.fields.length} fields)</div>
            <div><strong>Organization ID:</strong> {organization.id}</div>
            <div><strong>User ID:</strong> {user?.id}</div>
            <div><strong>Route Pattern:</strong> /{domain}/{section}/{workspace}/entities/{entityType}/{id} (NO /apps prefix)</div>
          </div>
        </div>
      )}
    </div>
  )
}