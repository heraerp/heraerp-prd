'use client'

import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, Plus, RefreshCw } from 'lucide-react'

interface Entity {
  id: string
  entity_type: string
  entity_name: string
  entity_code?: string
  entity_category?: string
  description?: string
  status: string
  created_at: string
  properties?: Record<string, any>
}

interface EntityFormData {
  entity_type: string
  entity_name: string
  entity_code: string
  entity_category: string
  description: string
  status: string
}

const ENTITY_TYPES = [
  { value: 'customer', label: 'Customer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'product', label: 'Product' },
  { value: 'employee', label: 'Employee' },
  { value: 'gl_account', label: 'GL Account' },
  { value: 'location', label: 'Location' },
  { value: 'project', label: 'Project' }
]

export function EntityManager() {
  const { user, session } = useSupabaseAuth()
  const token = session?.access_token
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')

  const [formData, setFormData] = useState<EntityFormData>({
    entity_type: 'customer',
    entity_name: '',
    entity_code: '',
    entity_category: '',
    description: '',
    status: 'active'
  })

  // Fetch entities
  const fetchEntities = async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (selectedType !== 'all') {
        params.append('entity_type', selectedType)
      }
      params.append('include_dynamic', 'true')

      const response = await fetch(`/api/v1/entities?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch entities')
      }

      const result = await response.json()
      if (result.success) {
        setEntities(Array.isArray(result.data) ? result.data : [])
      } else {
        throw new Error(result.message || 'Failed to fetch entities')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entities')
    } finally {
      setLoading(false)
    }
  }

  // Create or update entity
  const saveEntity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const url = editingEntity ? '/api/v1/entities' : '/api/v1/entities'
      const method = editingEntity ? 'PUT' : 'POST'
      const body = editingEntity 
        ? { ...formData, id: editingEntity.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingEntity ? 'update' : 'create'} entity`)
      }

      const result = await response.json()
      if (result.success) {
        setShowForm(false)
        setEditingEntity(null)
        setFormData({
          entity_type: 'customer',
          entity_name: '',
          entity_code: '',
          entity_category: '',
          description: '',
          status: 'active'
        })
        fetchEntities()
      } else {
        throw new Error(result.message || 'Failed to save entity')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entity')
    } finally {
      setLoading(false)
    }
  }

  // Delete entity
  const deleteEntity = async (entityId: string) => {
    if (!token || !confirm('Are you sure you want to delete this entity?')) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/entities?id=${entityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete entity')
      }

      const result = await response.json()
      if (result.success) {
        fetchEntities()
      } else {
        throw new Error(result.message || 'Failed to delete entity')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entity')
    } finally {
      setLoading(false)
    }
  }

  // Start editing
  const startEdit = (entity: Entity) => {
    setEditingEntity(entity)
    setFormData({
      entity_type: entity.entity_type,
      entity_name: entity.entity_name,
      entity_code: entity.entity_code || '',
      entity_category: entity.entity_category || '',
      description: entity.description || '',
      status: entity.status
    })
    setShowForm(true)
  }

  // Reset form
  const resetForm = () => {
    setShowForm(false)
    setEditingEntity(null)
    setFormData({
      entity_type: 'customer',
      entity_name: '',
      entity_code: '',
      entity_category: '',
      description: '',
      status: 'active'
    })
  }

  useEffect(() => {
    if (user && token) {
      fetchEntities()
    }
  }, [user, token, selectedType])

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entity Manager</CardTitle>
          <CardDescription>Please log in to manage entities</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Entity Manager
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ENTITY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Entity
              </Button>
              <Button variant="outline" onClick={fetchEntities} size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Manage your organization's entities using HERA's Universal Architecture
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading && entities.length === 0 && (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading entities...</p>
            </div>
          )}

          {!loading && entities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No entities found</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Entity
              </Button>
            </div>
          )}

          {entities.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {entities.map(entity => (
                <Card key={entity.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{entity.entity_name}</CardTitle>
                        <CardDescription>
                          <Badge variant="secondary" className="text-xs">
                            {entity.entity_type}
                          </Badge>
                          {entity.entity_code && (
                            <span className="ml-2 text-xs text-gray-500">
                              {entity.entity_code}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge variant={entity.status === 'active' ? 'default' : 'secondary'}>
                        {entity.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {entity.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {entity.description}
                      </p>
                    )}
                    {entity.entity_category && (
                      <p className="text-xs text-gray-500 mb-2">
                        Category: {entity.entity_category}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Created: {new Date(entity.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-3 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => startEdit(entity)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteEntity(entity.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Pencil Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEntity ? 'Pencil Entity' : 'Create New Entity'}
            </CardTitle>
            <CardDescription>
              {editingEntity ? 'Update entity information' : 'Add a new entity to your organization'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={saveEntity}>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="entity_type">Entity Type</Label>
                  <Select
                    value={formData.entity_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, entity_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="entity_name">Entity Name *</Label>
                <Input
                  id="entity_name"
                  value={formData.entity_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, entity_name: e.target.value }))}
                  placeholder="Enter entity name"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="entity_code">Entity Code</Label>
                  <Input
                    id="entity_code"
                    value={formData.entity_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, entity_code: e.target.value }))}
                    placeholder="Enter entity code"
                  />
                </div>

                <div>
                  <Label htmlFor="entity_category">Category</Label>
                  <Input
                    id="entity_category"
                    value={formData.entity_category}
                    onChange={(e) => setFormData(prev => ({ ...prev, entity_category: e.target.value }))}
                    placeholder="Enter category"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingEntity ? 'Update' : 'Create'} Entity
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
}