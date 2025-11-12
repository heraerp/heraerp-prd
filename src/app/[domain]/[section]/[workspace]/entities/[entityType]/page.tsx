/*
 * HERA Universal Dynamic Entity List Page
 * Smart Code: HERA.UNIVERSAL.ENTITY.LIST.DYNAMIC.v1
 * Style Source: /enterprise/procurement/vendors (proven glassmorphism design)
 */

'use client'

import React, { useState, useMemo, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Edit, Trash2, Search, Phone, Mail, Briefcase,
  Bell, Settings, Save, X, Package, Users, Building2,
  CreditCard, Tags, Calculator, Activity, BarChart3
} from 'lucide-react'

// UI Components - Safe imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// HERA Universal System
import { resolveUniversalConfig, generateUniversalSmartCode } from '@/lib/universal/config'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useInstantRouter } from '@/components/performance/InstantRouter'

// Icon mapping for entity types
const entityIconMap: Record<string, any> = {
  customers: Users,
  products: Package,
  suppliers: Building2,
  vendors: Building2,
  accounts: CreditCard,
  categories: Tags,
  items: Package,
  contacts: Users,
  leads: Activity,
  opportunities: BarChart3,
  staff: Users,
  employees: Users
}

// Status color mapping
const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  blocked: 'bg-red-100 text-red-700',
  draft: 'bg-blue-100 text-blue-700'
}

interface PageProps {
  params: Promise<{
    domain: string
    section: string
    workspace: string
    entityType: string
  }>
}

export default function UniversalEntityListPage({ params }: PageProps) {
  // Resolve params using React 19 use() API
  const { domain, section, workspace, entityType } = use(params)
  
  // HERA Auth and Navigation
  const router = useRouter()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const { navigate, prefetchOnHover } = useInstantRouter()
  
  // Universal Configuration
  const config = resolveUniversalConfig(domain, section, workspace)
  const entityConfig = config.entityTypes.find(e => e.id === entityType)
  
  // Component State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [entities, setEntities] = useState<any[]>([])

  // Dynamic form data based on entity configuration
  const [formData, setFormData] = useState<Record<string, any>>({})

  // Load entities from localStorage on component mount
  useEffect(() => {
    if (!entityConfig) return
    
    const storageKey = `hera_${entityType}`
    const savedEntities = localStorage.getItem(storageKey)
    
    if (savedEntities) {
      try {
        const parsedEntities = JSON.parse(savedEntities)
        setEntities(parsedEntities)
      } catch (error) {
        console.error('Error parsing saved entities:', error)
        setEntities(getDefaultEntities())
      }
    } else {
      setEntities(getDefaultEntities())
    }
  }, [entityType, entityConfig])

  // Generate default entities based on entity type
  const getDefaultEntities = () => {
    const defaults: Record<string, any[]> = {
      customers: [
        {
          id: '1',
          entity_name: 'ACME Corporation',
          entity_code: 'CUST001',
          email: 'contact@acme.com',
          phone: '+971 50 123 4567',
          status: 'active'
        }
      ],
      products: [
        {
          id: '1',
          entity_name: 'Premium Widget',
          entity_code: 'PROD001',
          sku: 'WDG-001',
          price: 99.99,
          category: 'Electronics',
          status: 'active'
        }
      ],
      suppliers: [
        {
          id: '1',
          entity_name: 'Global Supplies LLC',
          entity_code: 'SUP001',
          contact: 'John Smith',
          email: 'sales@globalsupplies.com',
          payment_terms: 'Net 30',
          status: 'active'
        }
      ]
    }
    
    return defaults[entityType] || []
  }

  // Save entities to localStorage whenever entities state changes
  useEffect(() => {
    if (entities.length > 0) {
      const storageKey = `hera_${entityType}`
      localStorage.setItem(storageKey, JSON.stringify(entities))
    }
  }, [entities, entityType])

  // Filter entities based on search and status
  const filteredEntities = useMemo(() => {
    return entities.filter((entity: any) => {
      const matchesSearch = !searchTerm || 
        entity.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entity.entity_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(entity).some(value => 
          typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      
      const matchesStatus = statusFilter === 'all' || entity.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [entities, searchTerm, statusFilter])

  // Initialize form data based on entity configuration
  useEffect(() => {
    if (!entityConfig) return
    
    const initialFormData: Record<string, any> = { status: 'active' }
    
    entityConfig.fields.forEach(field => {
      if (field.type === 'boolean') {
        initialFormData[field.name] = false
      } else if (field.type === 'number') {
        initialFormData[field.name] = 0
      } else {
        initialFormData[field.name] = ''
      }
    })
    
    setFormData(initialFormData)
  }, [entityConfig])

  const resetForm = () => {
    if (!entityConfig) return
    
    const initialFormData: Record<string, any> = { status: 'active' }
    
    entityConfig.fields.forEach(field => {
      if (field.type === 'boolean') {
        initialFormData[field.name] = false
      } else if (field.type === 'number') {
        initialFormData[field.name] = 0
      } else {
        initialFormData[field.name] = ''
      }
    })
    
    setFormData(initialFormData)
    setSelectedEntity(null)
  }

  const handleEdit = (entity: any) => {
    setSelectedEntity(entity)
    const editFormData = { ...entity }
    setFormData(editFormData)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (entity: any) => {
    if (confirm(`Are you sure you want to delete ${entity.entity_name}?`)) {
      setEntities(prevEntities => prevEntities.filter(e => e.id !== entity.id))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedEntity) {
      // Update existing entity
      setEntities(prevEntities => 
        prevEntities.map(entity => 
          entity.id === selectedEntity.id ? { ...entity, ...formData } : entity
        )
      )
    } else {
      // Create new entity
      const newEntity = {
        id: Date.now().toString(),
        ...formData
      }
      setEntities(prevEntities => [...prevEntities, newEntity])
    }
    
    setIsCreateDialogOpen(false)
    setIsEditDialogOpen(false)
    resetForm()
  }

  // Early returns for auth checks
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-slate-600">Please log in to access this page.</p>
        </div>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-slate-600">No organization context found.</p>
        </div>
      </div>
    )
  }

  if (!entityConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-slate-600">Entity type &quot;{entityType}&quot; not found in workspace &quot;{workspace}&quot;.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Get entity icon
  const EntityIcon = entityIconMap[entityType] || Package

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      
      <div className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <EntityIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{entityConfig.name}</h1>
              <p className="text-xs text-slate-600">{entityConfig.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="min-w-[44px] min-h-[44px] rounded-full bg-blue-500/10 flex items-center justify-center active:scale-95">
              <Bell className="w-5 h-5 text-blue-600" />
            </button>
            <button className="min-w-[44px] min-h-[44px] rounded-full bg-slate-500/10 flex items-center justify-center active:scale-95">
              <Settings className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden md:block mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">{entityConfig.name} Management</h1>
                <p className="text-slate-600">{entityConfig.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => navigate(`/${domain}/${section}/${workspace}/entities/${entityType}/new`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New {entityConfig.name.slice(0, -1)}
                </Button>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="outline"
                  className="bg-white/70 border-slate-200/50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Quick Add
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Quick Actions */}
          <div className="md:hidden mb-6 space-y-3">
            <button 
              onClick={() => navigate(`/${domain}/${section}/${workspace}/entities/${entityType}/new`)}
              className="w-full min-h-[56px] bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
              New {entityConfig.name.slice(0, -1)}
            </button>
            <button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="w-full min-h-[56px] bg-white text-blue-600 border border-blue-200 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
              Quick Add
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={`Search ${entityConfig.name.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/70 border-slate-200/50 focus:bg-white focus:border-blue-500"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/70 border-slate-200/50">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  {filteredEntities.length} item{filteredEntities.length !== 1 ? 's' : ''} found
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/70 border-slate-200/50"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredEntities.map((entity: any) => (
              <div 
                key={entity.id}
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl p-4 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-slate-800">{entity.entity_name}</h4>
                    <p className="text-sm text-slate-600">{entity.entity_code}</p>
                    {entity.sku && (
                      <div className="flex items-center gap-1 mt-1">
                        <Package size={12} className="text-blue-600" />
                        <span className="text-xs text-slate-500">SKU: {entity.sku}</span>
                      </div>
                    )}
                  </div>
                  <Badge 
                    variant={entity.status === 'active' ? 'default' : 'secondary'}
                    className={entity.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                  >
                    {entity.status}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs text-slate-600 mb-4">
                  {entity.email && <div className="flex items-center gap-2"><Mail size={12} />{entity.email}</div>}
                  {entity.phone && <div className="flex items-center gap-2"><Phone size={12} />{entity.phone}</div>}
                  {entity.price && <div className="flex items-center gap-2">💰 ${entity.price}</div>}
                  {entity.category && <div className="flex items-center gap-2">🏷️ {entity.category}</div>}
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-500">ID: {entity.id}</div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(entity)}
                      className="min-w-[44px] min-h-[44px] hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center active:scale-95"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button 
                      onClick={() => handleDelete(entity)}
                      className="min-w-[44px] min-h-[44px] hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center active:scale-95"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-200/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/30">
                  {filteredEntities.map((entity: any) => (
                    <tr key={entity.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <EntityIcon className="w-4 h-4 text-blue-600 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">{entity.entity_name}</div>
                            {entity.sku && <div className="text-sm text-slate-500">SKU: {entity.sku}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{entity.entity_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        <div>
                          {entity.email && <div className="flex items-center"><Mail className="w-3 h-3 mr-1" />{entity.email}</div>}
                          {entity.phone && <div className="flex items-center"><Phone className="w-3 h-3 mr-1" />{entity.phone}</div>}
                          {entity.price && <div className="flex items-center">💰 ${entity.price}</div>}
                          {entity.category && <div className="flex items-center">🏷️ {entity.category}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={entity.status === 'active' ? 'default' : 'secondary'}
                          className={statusColors[entity.status as keyof typeof statusColors] || statusColors.draft}
                        >
                          {entity.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(entity)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(entity)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredEntities.length === 0 && (
              <div className="text-center py-12">
                <EntityIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No {entityConfig.name.toLowerCase()} found</h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : `Get started by adding your first ${entityConfig.name.toLowerCase().slice(0, -1)}.`
                  }
                </p>
                <Button onClick={() => navigate(`/${domain}/${section}/${workspace}/entities/${entityType}/new`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New {entityConfig.name.slice(0, -1)}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Spacing for Mobile */}
      <div className="h-24 md:h-0" />

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setIsEditDialogOpen(false)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EntityIcon className="w-5 h-5 text-blue-600" />
              {selectedEntity ? `Edit ${entityConfig.name.slice(0, -1)}` : `Add New ${entityConfig.name.slice(0, -1)}`}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {entityConfig.fields.map((field) => (
              <div key={field.id}>
                <Label htmlFor={field.name} className="text-sm font-medium">
                  {field.label} {field.required && '*'}
                </Label>
                {field.type === 'select' ? (
                  <Select 
                    value={formData[field.name] || ''} 
                    onValueChange={(value) => setFormData({...formData, [field.name]: value})}
                  >
                    <SelectTrigger className="bg-white/70 border-slate-200/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type === 'number' ? 'number' : field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="bg-white/70 border-slate-200/50 focus:bg-white"
                  />
                )}
              </div>
            ))}

            <div>
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger className="bg-white/70 border-slate-200/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setIsEditDialogOpen(false)
                  resetForm()
                }}
                className="bg-white/70 border-slate-200/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {selectedEntity ? 'Update' : 'Create'} {entityConfig.name.slice(0, -1)}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}