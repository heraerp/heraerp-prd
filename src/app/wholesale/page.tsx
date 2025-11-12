/**
 * HERA Wholesale Domain Main Page
 * Smart Code: HERA.WHOLESALE.DOMAIN.MAIN.v1
 * 
 * Wholesale domain overview with navigation to different sections
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Users,
  BarChart3,
  Settings,
  ArrowRight 
} from 'lucide-react'

export default function WholesalePage() {
  const router = useRouter()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()

  // Three-layer auth check
  if (!isAuthenticated) return <div>Please log in</div>
  if (contextLoading) return <div>Loading...</div>
  if (!organization?.id) return <div>No organization context</div>

  const sections = [
    {
      title: 'Catalog Management',
      description: 'Manage product catalogs, SKUs, and wholesale pricing',
      icon: Package,
      color: 'blue',
      route: '/wholesale/catalog/main'
    },
    {
      title: 'Order Processing',
      description: 'B2B order management and bulk ordering workflows',
      icon: ShoppingCart,
      color: 'green',
      route: '/wholesale/ordering/main'
    },
    {
      title: 'Pricing & Tiers',
      description: 'Tiered pricing, volume discounts, and dealer rates',
      icon: DollarSign,
      color: 'yellow',
      route: '/wholesale/pricing/main'
    },
    {
      title: 'Distributor Network',
      description: 'Manage distributors, resellers, and channel partners',
      icon: Users,
      color: 'purple',
      route: '/wholesale/distributors/main'
    },
    {
      title: 'Analytics & Reports',
      description: 'Wholesale performance metrics and business intelligence',
      icon: BarChart3,
      color: 'indigo',
      route: '/wholesale/analytics/main'
    },
    {
      title: 'Settings',
      description: 'Wholesale configuration and system preferences',
      icon: Settings,
      color: 'gray',
      route: '/wholesale/settings/main'
    }
  ]

  const handleNavigate = (route: string) => {
    router.push(route)
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          HERA Wholesale
        </h1>
        <p className="text-gray-600">
          B2B Trading & Distribution Management System
        </p>
      </div>

      {/* Welcome Card */}
      <div className="mb-8">
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">
              Welcome to HERA Wholesale
            </h2>
            <p className="text-blue-700">
              Manage your B2B operations with enterprise-grade wholesale management tools.
              Choose a section below to get started.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, index) => {
          const IconComponent = section.icon
          return (
            <Card 
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleNavigate(section.route)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <IconComponent 
                    className={`w-8 h-8 text-${section.color}-600`}
                  />
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <CardTitle className="text-lg">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  {section.description}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  Access {section.title}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Quick Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">2,847</div>
                <div className="text-sm text-gray-600">SKUs</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">156</div>
                <div className="text-sm text-gray-600">Active Distributors</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">$1.2M</div>
                <div className="text-sm text-gray-600">Monthly Revenue</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">89</div>
                <div className="text-sm text-gray-600">Pending Orders</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}