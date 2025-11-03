# HERA Master Data Generator Template

Generate production-ready master data management pages that auto-wire to HERA API v2 backend.

## Task Description

Create a complete master data page with CRUD operations, search, filtering, and mobile-first design.

## Input Parameters

- `ENTITY_TYPE`: The entity type (e.g., 'CUSTOMER', 'PRODUCT', 'VENDOR')
- `MODULE`: Business module (e.g., 'CRM', 'INVENTORY', 'FINANCE')  
- `INDUSTRY`: Industry context (e.g., 'SALON', 'RESTAURANT', 'RETAIL')
- `PAGE_PATH`: Next.js page path (e.g., '/app/crm/customers/page.tsx')

## Mandatory Template Structure

```typescript
'use client'

import { useState, useEffect, useMemo, FormEvent, Suspense, lazy } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, Download } from 'lucide-react'

// HERA Core Imports (MANDATORY)
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useEntities, useEntity, useUpsertEntity, useDeleteEntity } from '@/lib/hera-react-provider'
import { brandingEngine } from '@/lib/platform/branding-engine'

// UI Components (MANDATORY)
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

// Lazy loaded components for performance
const ExportDialog = lazy(() => import('./components/ExportDialog'))
const ImportDialog = lazy(() => import('./components/ImportDialog'))

// Constants
const ENTITY_TYPE = '{{ENTITY_TYPE}}'
const SMART_CODE_BASE = 'HERA.{{INDUSTRY}}.{{MODULE}}.{{ENTITY_TYPE}}'

export default function {{ENTITY_TYPE}}Page() {
  // Authentication (MANDATORY - Three-layer check)
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please log in to continue</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading organization context...</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!organization?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">No organization context available</p>
            <Button onClick={() => window.location.href = '/auth/organizations'} className="mt-4">
              Select Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Branding initialization (MANDATORY)
  useEffect(() => {
    brandingEngine.initializeBranding(organization.id)
  }, [organization.id])

  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Form state for create/edit
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    status: 'active',
    // Add entity-specific fields here
  })

  // Real data fetching (MANDATORY - Never mock)
  const { data: entitiesResponse, isLoading, error, refetch } = useEntities({
    entity_type: ENTITY_TYPE,
    search: searchTerm || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 100,
    sort: 'entity_name',
    order: 'asc'
  })

  // Real mutations (MANDATORY - Never mock)
  const createEntity = useUpsertEntity({
    onSuccess: () => {
      toast({ title: "✅ {{ENTITY_TYPE}} created successfully" })
      setIsCreateDialogOpen(false)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast({
        title: "❌ Failed to create {{ENTITY_TYPE}}",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const updateEntity = useUpsertEntity({
    onSuccess: () => {
      toast({ title: "✅ {{ENTITY_TYPE}} updated successfully" })
      setIsEditDialogOpen(false)
      setSelectedEntity(null)
      resetForm()
      refetch()
    },
    onError: (error) => {
      toast({
        title: "❌ Failed to update {{ENTITY_TYPE}}",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const deleteEntity = useDeleteEntity({
    onSuccess: () => {
      toast({ title: "✅ {{ENTITY_TYPE}} deleted successfully" })
      refetch()
    },
    onError: (error) => {
      toast({
        title: "❌ Failed to delete {{ENTITY_TYPE}}",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Data processing
  const entities = useMemo(() => {
    return entitiesResponse?.data || []
  }, [entitiesResponse?.data])

  const filteredEntities = useMemo(() => {
    return entities.filter(entity => {
      const matchesSearch = !searchTerm || 
        entity.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entity.entity_code?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || entity.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [entities, searchTerm, statusFilter])

  // Form handlers
  const resetForm = () => {
    setFormData({
      entity_name: '',
      entity_code: '',
      status: 'active'
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    const entityData = {
      entity_type: ENTITY_TYPE,
      entity_name: formData.entity_name,
      entity_code: formData.entity_code,
      smart_code: `${SMART_CODE_BASE}.${formData.entity_code || 'ENTITY'}.v1`,
      organization_id: organization.id,
      status: formData.status,
      dynamic_fields: [
        // Add dynamic fields based on entity type
        {
          field_name: 'status',
          field_type: 'text',
          field_value_text: formData.status,
          smart_code: `${SMART_CODE_BASE}.FIELD.STATUS.v1`
        }
      ]
    }

    if (selectedEntity) {
      await updateEntity.mutateAsync({
        id: selectedEntity.id,
        data: entityData
      })
    } else {
      await createEntity.mutateAsync({
        data: entityData
      })
    }
  }

  const handleEdit = (entity: any) => {
    setSelectedEntity(entity)
    setFormData({
      entity_name: entity.entity_name || '',
      entity_code: entity.entity_code || '',
      status: entity.status || 'active'
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (entity: any) => {
    if (confirm(`Are you sure you want to delete ${entity.entity_name}?`)) {
      await deleteEntity.mutateAsync(entity.id)
    }
  }

  // Loading state (MANDATORY)
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 w-full bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-2/3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state (MANDATORY)
  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive mb-4">
              <span className="text-xl">❌</span>
              <h3 className="font-semibold">Failed to load {{ENTITY_TYPE}} data</h3>
            </div>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} variant="outline">
                Retry
              </Button>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main UI (MANDATORY - Mobile-first responsive)
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Mobile Status Bar Spacer */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden -mx-4 -mt-4 mb-4"></div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{{ENTITY_TYPE}} Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your {{ENTITY_TYPE}} records with real-time data sync
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="min-h-[44px] active:scale-95 transition-transform w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {{ENTITY_TYPE}}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search {{ENTITY_TYPE}}..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 min-h-[44px]"
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <Label htmlFor="status-filter" className="sr-only">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="min-h-[44px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entity Grid (Mobile-first) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {filteredEntities.map((entity) => (
          <Card key={entity.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{entity.entity_name}</CardTitle>
                  <p className="text-sm text-muted-foreground truncate">{entity.entity_code}</p>
                </div>
                <Badge variant={entity.status === 'active' ? 'default' : 'secondary'}>
                  {entity.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  ID: {entity.id.slice(0, 8)}...
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(entity)}
                    className="h-8 w-8 p-0 active:scale-95 transition-transform"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(entity)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-transform"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredEntities.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2">No {{ENTITY_TYPE}} found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? "No {{ENTITY_TYPE}} match your current filters"
                : "Get started by creating your first {{ENTITY_TYPE}}"
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create {{ENTITY_TYPE}}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
        if (!open) {
          setSelectedEntity(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEntity ? 'Edit {{ENTITY_TYPE}}' : 'Create New {{ENTITY_TYPE}}'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="entity_name">{{ENTITY_TYPE}} Name *</Label>
              <Input
                id="entity_name"
                value={formData.entity_name}
                onChange={(e) => setFormData(prev => ({ ...prev, entity_name: e.target.value }))}
                placeholder="Enter {{ENTITY_TYPE}} name"
                required
                className="min-h-[44px]"
              />
            </div>
            
            <div>
              <Label htmlFor="entity_code">{{ENTITY_TYPE}} Code</Label>
              <Input
                id="entity_code"
                value={formData.entity_code}
                onChange={(e) => setFormData(prev => ({ ...prev, entity_code: e.target.value }))}
                placeholder="Enter {{ENTITY_TYPE}} code"
                className="min-h-[44px]"
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setIsEditDialogOpen(false)
                  setSelectedEntity(null)
                  resetForm()
                }}
                className="flex-1 min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEntity.isPending || updateEntity.isPending}
                className="flex-1 min-h-[44px]"
              >
                {createEntity.isPending || updateEntity.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bottom spacing for mobile */}
      <div className="h-24 md:h-0"></div>
    </div>
  )
}
```

## Validation Rules

1. **Authentication**: Must include three-layer auth check
2. **Data Fetching**: Must use HERA hooks, never mock data
3. **Mobile-First**: All layouts must be responsive with 44px touch targets
4. **Loading States**: Must handle loading, error, and empty states
5. **Smart Codes**: Must include proper HERA DNA patterns
6. **Performance**: Must include lazy loading and memoization
7. **Branding**: Must initialize branding engine
8. **Accessibility**: Must include proper ARIA labels and semantic HTML

## Success Criteria

- ✅ Connects to real HERA API v2 backend
- ✅ Works perfectly on mobile and desktop
- ✅ Handles all CRUD operations
- ✅ Includes search and filtering
- ✅ Shows loading and error states
- ✅ Follows HERA Smart Code patterns
- ✅ Meets performance requirements (< 1.5s load)
- ✅ Passes accessibility standards
- ✅ Never stubs or mocks any functionality

## Customization Points

Replace these placeholders:
- `{{ENTITY_TYPE}}`: Target entity type (e.g., 'CUSTOMER')
- `{{MODULE}}`: Business module (e.g., 'CRM')
- `{{INDUSTRY}}`: Industry context (e.g., 'SALON')

Add entity-specific fields in:
- Form state management
- Dynamic fields array
- Search/filter logic
- Display components