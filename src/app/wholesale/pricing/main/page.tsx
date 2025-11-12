/**
 * SAP-Style Workspace Page - Wholesale Pricing Management
 * Smart Code: HERA.WHOLESALE.PRICING.WORKSPACE.v1
 * 
 * SAP-style workspace layout for wholesale pricing and tiers
 * Route: /wholesale/pricing/main
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, DollarSign, Percent, Users, TrendingUp } from 'lucide-react'

export default function WholesalePricingWorkspace() {
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
          <p className="text-gray-600">Loading pricing workspace...</p>
        </div>
      </div>
    )
  }

  const pricingCards = [
    {
      title: 'Pricing Tiers',
      description: 'Manage wholesale pricing tiers and volume discounts',
      icon: DollarSign,
      color: 'green',
      metrics: { value: '5', label: 'Active Tiers' }
    },
    {
      title: 'Volume Discounts',
      description: 'Configure bulk order discount structures',
      icon: Percent,
      color: 'yellow',
      metrics: { value: '15%', label: 'Avg Discount' }
    },
    {
      title: 'Customer Pricing',
      description: 'Customer-specific pricing agreements',
      icon: Users,
      color: 'purple',
      metrics: { value: '89', label: 'Custom Agreements' }
    },
    {
      title: 'Pricing Analytics',
      description: 'Pricing performance and optimization insights',
      icon: TrendingUp,
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
              Wholesale Pricing Management
            </h1>
            <p className="text-gray-600">
              Manage pricing tiers, volume discounts, and customer agreements
            </p>
          </div>
          <Button onClick={() => router.back()} variant="outline">
            ← Back
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pricingCards.map((card, index) => {
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

      {/* Quick Overview */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Pricing Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">$125.50</div>
                <div className="text-sm text-gray-600">Avg Unit Price</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">42%</div>
                <div className="text-sm text-gray-600">Gross Margin</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">156</div>
                <div className="text-sm text-gray-600">Price Rules</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">$2.1M</div>
                <div className="text-sm text-gray-600">Revenue Impact</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}