'use client'

/**
 * Purchasing Rebate Processing Overview Page
 * Smart Code: HERA.PURCHASE.REBATE.APPLICATION.MAIN.v1
 * Generated from: Purchasing Rebate Processing v1.0.0
 */

import React, { useState } from 'react'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  ChevronDown,
  Eye,
  Plus,
  BarChart3,
  Building2,
  File-contract,
  Layers,
  Package,
  Calculator,
  Receipt
} from 'lucide-react'

export default function PurchasingRebateProcessingOverviewPage() {
  const [activeTab, setActiveTab] = useState('entities')
  const [searchQuery, setSearchQuery] = useState('')

  // Navigation data for entities
  const entityPages = [
    {
      id: 'vendor',
      title: 'Vendor',
      subtitle: 'Supplier vendor master data',
      icon: Building2,
      color: 'bg-blue-600',
      href: '/vendor'
    },
    {
      id: 'rebate_agreement',
      title: 'Rebate Agreement',
      subtitle: 'Supplier rebate agreement header',
      icon: File-contract,
      color: 'bg-blue-600',
      href: '/rebate_agreement'
    },
    {
      id: 'rebate_tier',
      title: 'Rebate Tier',
      subtitle: 'Volume-based rebate tier/slab definition',
      icon: Layers,
      color: 'bg-blue-600',
      href: '/rebate_tier'
    },
    {
      id: 'product',
      title: 'Product',
      subtitle: 'Product master for rebate eligibility',
      icon: Package,
      color: 'bg-blue-600',
      href: '/product'
    }
  ]

  // Navigation data for transactions
  const transactionPages = [
    {
      id: 'rebate_accrual',
      title: 'Rebate Accrual',
      subtitle: 'Periodic rebate accrual calculation and posting',
      icon: Calculator,
      color: 'bg-green-600',
      href: '/transactions/rebate_accrual'
    },
    {
      id: 'rebate_settlement',
      title: 'Rebate Settlement',
      subtitle: 'Final rebate settlement with vendor credit',
      icon: Calculator,
      color: 'bg-green-600',
      href: '/transactions/rebate_settlement'
    }
  ]

  // Apps data organized by tabs
  const appsData = {
    entities: entityPages.map(page => ({
      icon: page.icon,
      title: page.title,
      subtitle: `Manage ${page.title.toLowerCase()} records`,
      href: page.href
    })),
    transactions: transactionPages.map(page => ({
      icon: page.icon,
      title: page.title,
      subtitle: page.subtitle,
      href: page.href
    })),
    reports: [
      { icon: BarChart3, title: 'Data Analytics', subtitle: 'View insights and trends', href: '/reports/analytics' },
      { icon: Receipt, title: 'Transaction Reports', subtitle: 'Financial reporting', href: '/reports/transactions' }
    ]
  }

  // Insights tiles
  const insightsTiles = [
    {
      id: 'entities',
      title: 'Total Entities',
      value: '4',
      description: 'Entity types configured',
      color: 'border-blue-500'
    },
    {
      id: 'transactions',
      title: 'Transaction Types',
      value: '2',
      description: 'Available transaction workflows',
      color: 'border-green-500'
    },
    {
      id: 'automation',
      title: 'Automation Level',
      value: '95',
      unit: '%',
      description: 'Automated processes',
      color: 'border-purple-500'
    }
  ]

  return (
    <ProtectedPage requiredSpace="purchasing-rebates">
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Quick Actions */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              
              <div className="space-y-3">
                <Card className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">New Vendor</h4>
                        <p className="text-xs text-gray-500">Create vendor</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <File-contract className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">New Rebate Agreement</h4>
                        <p className="text-xs text-gray-500">Create rebate_agreement</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Layers className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">New Rebate Tier</h4>
                        <p className="text-xs text-gray-500">Create rebate_tier</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">New Product</h4>
                        <p className="text-xs text-gray-500">Create product</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Center Column - Main Navigation */}
            <div className="lg:col-span-2 space-y-6">
              {/* Module Overview */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Purchasing Rebate Processing Modules</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {entityPages.map((page) => {
                    const Icon = page.icon
                    return (
                      <Card 
                        key={page.id} 
                        className={`${page.color} text-white border-0 hover:shadow-lg transition-shadow cursor-pointer`}
                        onClick={() => window.location.href = page.href}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <Icon className="w-6 h-6" />
                            <Eye className="w-4 h-4 opacity-75" />
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{page.title}</h3>
                          <p className="text-sm opacity-90">{page.subtitle}</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Apps Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Applications</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="entities">Entities</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                  </TabsList>

                  {Object.entries(appsData).map(([key, apps]) => (
                    <TabsContent key={key} value={key} className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {apps.map((app, index) => {
                          const Icon = app.icon
                          return (
                            <Card 
                              key={index} 
                              className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => window.location.href = app.href}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-violet-50 rounded-lg border border-violet-100">
                                    <Icon className="w-5 h-5 text-violet-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                      {app.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 truncate">
                                      {app.subtitle}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Insights Tiles */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {insightsTiles.map((tile) => (
                    <Card key={tile.id} className={`border-l-4 ${tile.color} hover:shadow-lg transition-all duration-200 cursor-pointer`}>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {tile.value}
                            {tile.unit && <span className="text-lg">{tile.unit}</span>}
                          </div>
                          <h4 className="font-medium text-sm text-gray-900 mb-1">
                            {tile.title}
                          </h4>
                          <p className="text-xs text-gray-600">{tile.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - HERA Assistant */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card className="border border-violet-100 bg-gradient-to-br from-white to-violet-50/30 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                          Purchasing Rebate Processing Insights
                        </CardTitle>
                        <p className="text-sm text-violet-500">AI-Powered</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-3">System Status:</p>
                        
                        <div className="space-y-3">
                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Configuration</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Entities: 4 configured</div>
                              <div>Transactions: 2 types</div>
                              <div>Status: ✅ Ready</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Automation</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Smart Codes: ✅ Validated</div>
                              <div>API Integration: ✅ Active</div>
                              <div>Security: ✅ RBAC Enabled</div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <h4 className="font-medium text-sm mb-1">Next Steps</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Create sample data</div>
                              <div>Configure user roles</div>
                              <div>Set up dashboards</div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <Input 
                            placeholder="Ask about Purchasing Rebate Processing..." 
                            className="text-sm border-violet-200 focus:border-violet-400 focus:ring-violet-200"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  )
}