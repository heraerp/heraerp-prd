'use client'

/**
 * Rebate Tier List Page
 * Smart Code: HERA.PURCHASE.REBATE.TIER.ENTITY.v1
 * Generated from: Purchasing Rebate Processing v1.0.0
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
  Layers
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface Rebate TierData {
  id: string
  entity_name: string
  entity_code?: string
  created_at: string
  updated_at: string
  status?: string
  [key: string]: any
}

export default function Rebate TierListPage() {
  const { organization, user } = useHERAAuth()
  const [entities, setEntities] = useState<Rebate TierData[]>([])
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
        entity_type: 'REBATE_TIER',
        organization_id: organization!.id,
        limit: 100
      })
      
      setEntities(data?.items || [])
    } catch (error) {
      console.error('Failed to load rebate_tiers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // In production, implement server-side search
  }

  const handleCreate = () => {
    window.location.href = `/rebate_tier/new`
  }

  const handleEdit = (entityId: string) => {
    window.location.href = `/rebate_tier/${entityId}/edit`
  }

  const handleView = (entityId: string) => {
    window.location.href = `/rebate_tier/${entityId}`
  }

  const handleDelete = async (entityId: string) => {
    if (!confirm('Are you sure you want to delete this rebate_tier?')) return
    
    try {
      await apiV2.delete(`entities/${entityId}`, {
        organization_id: organization!.id
      })
      
      // Reload entities
      loadEntities()
    } catch (error) {
      console.error('Failed to delete rebate_tier:', error)
      alert('Failed to delete rebate_tier')
    }
  }

  const filteredEntities = entities.filter(entity =>
    entity.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entity.entity_code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ProtectedPage requiredSpace="rebate_tier">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Layers className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Rebate Tiers</h1>
                  <p className="text-gray-600">Volume-based rebate tier/slab definition</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={loadEntities} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Rebate Tier
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
                      placeholder="Search rebate_tiers..."
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
                  {filteredEntities.length} Rebate Tier{filteredEntities.length !== 1 ? 's' : ''}
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
                  <p className="text-gray-600">Loading rebate_tiers...</p>
                </div>
              ) : filteredEntities.length === 0 ? (
                <div className="text-center py-8">
                  <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No rebate_tiers found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery 
                      ? `No rebate_tiers match your search criteria`
                      : `Get started by creating your first rebate_tier`
                    }
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleCreate}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Rebate Tier
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
}