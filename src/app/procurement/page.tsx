'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package2,
  Building2,
  FileText,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
  RefreshCw
} from 'lucide-react'
import { SupplierManager } from '@/components/procurement/SupplierManager'
import { ProductManager } from '@/components/procurement/ProductManager'
import { PurchaseOrderManager } from '@/components/procurement/PurchaseOrderManager'

// Steve Jobs: "Design is not just what it looks like and feels like. Design is how it works."
// This procurement dashboard demonstrates HERA's universal architecture in action

type ActiveTab = 'dashboard' | 'suppliers' | 'products' | 'purchase-orders'

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')

  // Sample data for dashboard overview
  const overviewStats = {
    activeSuppliers: 12,
    totalProducts: 156,
    pendingPOs: 8,
    monthlySpend: 45670
  }

  const recentActivity = [
    { id: 1, type: 'po_created', description: 'PO-2025-001234 created for Acme Corp', time: '2 hours ago', status: 'draft' },
    { id: 2, type: 'supplier_added', description: 'New supplier "Tech Solutions Inc" added', time: '4 hours ago', status: 'completed' },
    { id: 3, type: 'po_approved', description: 'PO-2025-001233 approved for $5,230', time: '6 hours ago', status: 'approved' },
    { id: 4, type: 'product_updated', description: 'Product "Industrial Bearings" specifications updated', time: '1 day ago', status: 'completed' }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'po_created': return <FileText className="w-4 h-4 text-blue-500" />
      case 'po_approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'supplier_added': return <Building2 className="w-4 h-4 text-purple-500" />
      case 'product_updated': return <Package2 className="w-4 h-4 text-orange-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`

  const renderContent = () => {
    switch (activeTab) {
      case 'suppliers':
        return <SupplierManager />
      case 'products':
        return <ProductManager />
      case 'purchase-orders':
        return <PurchaseOrderManager />
      default:
        return (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Active Suppliers */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Active Suppliers</p>
                    <p className="text-2xl font-bold text-blue-900">{overviewStats.activeSuppliers}</p>
                    <p className="text-xs text-blue-700 mt-1">+2 this month</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              {/* Total Products */}
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Products in Catalog</p>
                    <p className="text-2xl font-bold text-green-900">{overviewStats.totalProducts}</p>
                    <p className="text-xs text-green-700 mt-1">+15 this month</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Package2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>

              {/* Pending POs */}
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Pending POs</p>
                    <p className="text-2xl font-bold text-orange-900">{overviewStats.pendingPOs}</p>
                    <p className="text-xs text-orange-700 mt-1">Awaiting approval</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </Card>

              {/* Monthly Spend */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-800">Monthly Spend</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(overviewStats.monthlySpend)}</p>
                    <p className="text-xs text-purple-700 mt-1">+12% vs last month</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  onClick={() => setActiveTab('suppliers')}
                  className="h-20 bg-blue-600 hover:bg-blue-700 text-white flex-col space-y-2"
                >
                  <Building2 className="w-6 h-6" />
                  <span>Manage Suppliers</span>
                </Button>
                
                <Button
                  onClick={() => setActiveTab('products')}
                  variant="outline"
                  className="h-20 flex-col space-y-2 border-gray-300 hover:bg-gray-50"
                >
                  <Package2 className="w-6 h-6" />
                  <span>Product Catalog</span>
                </Button>
                
                <Button
                  onClick={() => setActiveTab('purchase-orders')}
                  className="h-20 bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white flex-col space-y-2 shadow-lg"
                >
                  <FileText className="w-6 h-6" />
                  <span>Purchase Orders</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 border-gray-300 hover:bg-gray-50"
                >
                  <BarChart3 className="w-6 h-6" />
                  <span>Analytics</span>
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-600">{activity.time}</p>
                    </div>
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* System Architecture Info */}
            <Card className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                  HERA Procurement & Inventory - Phase 1 Complete
                </h3>
                <p className="text-sm text-indigo-800 mb-4">
                  This procurement system demonstrates the power of HERA's universal 6-table architecture applied to supply chain management:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-indigo-700">
                  <div className="bg-white/50 p-3 rounded-lg">
                    <strong>✅ Supplier Management</strong><br />
                    Universal entities with dynamic contact and business data
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg">
                    <strong>✅ Product Catalog</strong><br />
                    Unlimited specifications without schema changes
                  </div>
                  <div className="bg-white/50 p-3 rounded-lg">
                    <strong>✅ Purchase Orders</strong><br />
                    Universal transactions with approval workflows
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-indigo-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Phase 1 Implementation Following Steve Jobs Design Principles</span>
                </div>
                <p className="text-xs text-indigo-600 mt-2">
                  Same architecture supports manufacturing, healthcare, retail, and professional services procurement
                </p>
              </div>
            </Card>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Procurement Info */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Package2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Procurement & Inventory
                </h1>
                <p className="text-sm text-gray-500">
                  Universal supply chain management powered by HERA
                </p>
              </div>
            </div>

            {/* Right: Quick Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="text-center">
                <p className="font-semibold text-gray-900">{overviewStats.activeSuppliers}</p>
                <p>Suppliers</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">{overviewStats.totalProducts}</p>
                <p>Products</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">{overviewStats.pendingPOs}</p>
                <p>Pending POs</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'suppliers'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package2 className="w-4 h-4 inline mr-2" />
              Products
            </button>
            <button
              onClick={() => setActiveTab('purchase-orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'purchase-orders'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Purchase Orders
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  )
}