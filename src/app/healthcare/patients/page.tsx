'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useUserContext } from '@/hooks/useUserContext'
import { usePatient } from '@/hooks/usePatient'
import { transformToUIPatient } from '@/lib/transformers/patient-transformer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Plus, 
  Search, 
  AlertCircle,
  ArrowLeft 
} from 'lucide-react'
import Link from 'next/link'

export default function PatientPage() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { 
    items, 
    loading, 
    error, 
    stats, 
    createPatient, 
    updatePatient, 
    deletePatient 
  } = usePatient(organizationId)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Transform items for UI
  const uiItems = items.map(transformToUIPatient)
  
  // Filter items based on search
  const filteredItems = uiItems.filter(item => {
    const term = searchTerm.toLowerCase()
    return item.name?.toLowerCase().includes(term) ||
           item.description?.toLowerCase().includes(term) ||
           Object.values(item).some(val => 
             typeof val === 'string' && val.toLowerCase().includes(term)
           )
  })
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }
  
  if (!organizationId) {
    return (
      <div className="min-h-screen p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Organization not found. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/healthcare">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Patient Management</h1>
                <p className="text-sm text-gray-600">Manage your patients</p>
              </div>
            </div>
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Search and Actions */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search patients..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                <p className="text-xs text-gray-600">Inactive</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Patient List ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No items found matching your search.' : 'No items yet.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.description || 'No description'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}