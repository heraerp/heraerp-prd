/**
 * SAP-Style Workspace Page - Wholesale Catalog Management
 * Smart Code: HERA.WHOLESALE.CATALOG.WORKSPACE.v1
 * 
 * SAP-style workspace layout for wholesale catalog management
 * Route: /wholesale/catalog/main
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Package, PlusCircle, Tags, BarChart3 } from 'lucide-react'

export default function WholesaleCatalogWorkspace() {
  const router = useRouter()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [loading, setLoading] = useState(true)

  // Three-layer auth check
  if (!isAuthenticated) return <Alert><AlertDescription>Please log in</AlertDescription></Alert>
  if (contextLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!organization?.id) return <Alert><AlertDescription>No organization context</AlertDescription></Alert>

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading catalog workspace...</p>
        </div>
      </div>
    )
  }

  const catalogCards = [
    {
      title: 'Product Catalog',
      description: 'Manage wholesale product listings and specifications',
      icon: Package,
      color: 'blue',
      metrics: { value: '2,847', label: 'SKUs' }
    },
    {
      title: 'Add Products',
      description: 'Create new product entries for wholesale',
      icon: PlusCircle,
      color: 'green'
    },
    {
      title: 'Categories',
      description: 'Organize products into wholesale categories',
      icon: Tags,
      color: 'purple',
      metrics: { value: '48', label: 'Categories' }
    },
    {
      title: 'Catalog Analytics',
      description: 'Product performance and catalog insights',
      icon: BarChart3,
      color: 'indigo'
    }
  ]

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Wholesale Catalog Management
            </h1>
            <p className="text-gray-600">
              Manage your wholesale product catalog and specifications
            </p>
          </div>
          <Button onClick={() => router.back()} variant="outline">
            ← Back
          </Button>
        </div>
      </div>

      {/* Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {catalogCards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${card.color}-50`}>
                    <IconComponent className={`w-6 h-6 text-${card.color}-600`} />
                  </div>
                  <CardTitle className="text-lg">
                    {card.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  {card.description}
                </p>
                {card.metrics && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xl font-semibold text-gray-900">
                      {card.metrics.value}
                    </div>
                    <div className="text-xs text-gray-600">
                      {card.metrics.label}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}