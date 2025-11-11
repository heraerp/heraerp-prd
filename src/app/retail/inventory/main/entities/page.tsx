/**
 * Universal Entity Management Page
 * Smart Code: HERA.RETAIL.INVENTORY.MAIN.ENTITIES.v1
 * 
 * Universal entity listing for inventory workspace with real Supabase integration
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { UniversalEntityListShell } from '@/components/universal/UniversalEntityListShell'
import { 
  Package, 
  Search, 
  Filter, 
  Plus,
  Box,
  Building2,
  Users,
  Tags,
  Eye,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react'

// ============ Universal Entity List Component ============

interface UniversalEntity {
  id: string
  entity_name: string
  entity_type: string
  entity_code?: string
  smart_code: string
  created_at: string
  updated_at: string
  dynamic_fields?: any[]
}

interface EntityTypeConfig {
  icon: any
  color: string
  label: string
  description: string
}

const ENTITY_TYPE_CONFIGS: Record<string, EntityTypeConfig> = {
  'INVENTORY': {
    icon: Package,
    color: 'blue',
    label: 'Inventory Items',
    description: 'Stock items and inventory management'
  },
  'PRODUCT': {
    icon: Box,
    color: 'green',
    label: 'Products',
    description: 'Product catalog and specifications'
  },
  'SUPPLIER': {
    icon: Building2,
    color: 'orange',
    label: 'Suppliers',
    description: 'Supplier contacts and information'
  },
  'CATEGORY': {
    icon: Tags,
    color: 'purple',
    label: 'Categories',
    description: 'Product and inventory categories'
  }
}

const UniversalEntityList: React.FC = () => {
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [entities, setEntities] = useState<UniversalEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid')

  // Load entities from universal API
  const loadEntities = async (entityType?: string) => {
    if (!organization) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        organizationId: organization.id,
        limit: '100',
        offset: '0'
      })
      
      if (entityType && entityType !== 'ALL') {
        params.append('entityType', entityType)
      }

      const response = await fetch(`/api/v2/retail/inventory/main/entities?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load entities')
      }

      const data = await response.json()
      
      if (data.success) {
        setEntities(data.data || [])
      } else {
        setError(data.error || 'Failed to load entities')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setEntities([])
    } finally {
      setLoading(false)
    }
  }

  // Auto-load entities on mount and when entity type changes
  useEffect(() => {
    if (organization) {
      loadEntities(selectedEntityType)
    }
  }, [organization, selectedEntityType])

  // Filter entities based on search
  const filteredEntities = entities.filter(entity =>
    entity.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.entity_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.smart_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group entities by type for display
  const entitiesByType = filteredEntities.reduce((acc, entity) => {
    if (!acc[entity.entity_type]) {
      acc[entity.entity_type] = []
    }
    acc[entity.entity_type].push(entity)
    return acc
  }, {} as Record<string, UniversalEntity[]>)

  const handleEntityAction = async (action: string, entityId: string) => {
    switch (action) {
      case 'view':
        router.push(`/retail/inventory/main/entities/${entityId}`)
        break
      case 'edit':
        router.push(`/retail/inventory/main/entities/${entityId}/edit`)
        break
      case 'delete':
        if (window.confirm('Are you sure you want to delete this entity?')) {
          try {
            const response = await fetch(`/api/v2/retail/inventory/main/entities?entityId=${entityId}&organizationId=${organization!.id}`, {
              method: 'DELETE'
            })
            
            if (response.ok) {
              loadEntities(selectedEntityType) // Refresh list
            } else {
              const errorData = await response.json()
              alert(errorData.error || 'Failed to delete entity')
            }
          } catch (err) {
            alert('Failed to delete entity')
          }
        }
        break
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Authentication Required</h1>
          <p className="text-slate-600">Please log in to access entity management</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Organization Required</h1>
          <p className="text-slate-600">Please select an organization to continue</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Entity Management</h1>
            <p className="text-slate-600 mt-1">Manage inventory entities across all types</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
              <span>Retail</span>
              <span>•</span>
              <span>Inventory</span>
              <span>•</span>
              <span>Main</span>
              <span>•</span>
              <span>Entities</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/retail/inventory/main/entities/create')}
              className="min-h-[44px] bg-blue-600 text-white px-6 rounded-xl hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Entity
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search entities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="min-h-[44px] bg-white border border-slate-300 rounded-xl px-4 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="ALL">All Types</option>
              {Object.entries(ENTITY_TYPE_CONFIGS).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading entities...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <div>
                <h3 className="font-medium">Error Loading Entities</h3>
                <p className="text-sm">{error}</p>
                <button
                  onClick={() => loadEntities(selectedEntityType)}
                  className="mt-2 text-sm font-medium hover:underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : Object.keys(entitiesByType).length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="font-medium text-slate-900 mb-2">No Entities Found</h3>
            <p className="text-slate-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first entity to get started'}
            </p>
            <button
              onClick={() => router.push('/retail/inventory/main/entities/create')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Create First Entity
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(entitiesByType).map(([entityType, typeEntities]) => {
              const config = ENTITY_TYPE_CONFIGS[entityType] || {
                icon: Package,
                color: 'gray',
                label: entityType,
                description: `${entityType} entities`
              }
              const Icon = config.icon

              return (
                <div key={entityType} className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 bg-${config.color}-100 rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${config.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{config.label}</h3>
                      <p className="text-sm text-slate-600">{config.description}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                        {typeEntities.length} items
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {typeEntities.map((entity) => (
                      <div key={entity.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                          <Icon className={`w-5 h-5 text-${config.color}-600`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 truncate">{entity.entity_name}</h4>
                            {entity.entity_code && (
                              <p className="text-sm text-slate-500">{entity.entity_code}</p>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mb-3 font-mono">{entity.smart_code}</p>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEntityAction('view', entity.id)}
                            className="flex-1 min-h-[36px] bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 active:scale-95 transition-all flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEntityAction('edit', entity.id)}
                            className="flex-1 min-h-[36px] bg-amber-50 border border-amber-200 rounded-lg text-amber-600 hover:bg-amber-100 active:scale-95 transition-all flex items-center justify-center"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEntityAction('delete', entity.id)}
                            className="flex-1 min-h-[36px] bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default UniversalEntityList