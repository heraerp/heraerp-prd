'use client'

import React from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Gem, 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp, 
  Star,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

export default function Jewelry1HomePage() {
  const { user, organization, isAuthenticated } = useHERAAuth()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access Jewelry1 ERP</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* SAP Fiori Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Gem className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Jewelry1 ERP</h1>
                <p className="text-sm text-slate-500">SAP Fiori Design System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                {organization?.entity_name || 'Demo Organization'}
              </Badge>
              <div className="text-sm text-slate-600">
                Welcome, {user?.entity_name || 'User'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Today's Sales</p>
                  <p className="text-2xl font-bold text-slate-900">₹2,45,000</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +12% from yesterday
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Orders</p>
                  <p className="text-2xl font-bold text-slate-900">24</p>
                  <p className="text-xs text-slate-500 mt-1">8 pending approval</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Inventory Value</p>
                  <p className="text-2xl font-bold text-slate-900">₹85.2L</p>
                  <p className="text-xs text-slate-500 mt-1">2,456 items in stock</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Customers</p>
                  <p className="text-2xl font-bold text-slate-900">1,847</p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Star className="w-4 h-4 mr-1" />
                    156 VIP customers
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Point of Sale</CardTitle>
                  <CardDescription>Process sales transactions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Today's Transactions</span>
                  <span className="font-medium">47</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Average Order Value</span>
                  <span className="font-medium">₹5,213</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Open POS
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Inventory Management</CardTitle>
                  <CardDescription>Track products and stock</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Products</span>
                  <span className="font-medium">2,456</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Low Stock Items</span>
                  <span className="font-medium text-amber-600">23</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Manage Inventory
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Customer Management</CardTitle>
                  <CardDescription>Manage customer relationships</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Customers</span>
                  <span className="font-medium">1,847</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">New This Month</span>
                  <span className="font-medium text-green-600">89</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                View Customers
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Sale Completed</p>
                    <p className="text-xs text-slate-600">Diamond Ring - ₹45,000 to Priya Shah</p>
                  </div>
                  <span className="text-xs text-slate-500">2 min ago</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Inventory Updated</p>
                    <p className="text-xs text-slate-600">Gold Necklace stock replenished</p>
                  </div>
                  <span className="text-xs text-slate-500">15 min ago</span>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New Customer</p>
                    <p className="text-xs text-slate-600">Rahul Mehta registered as VIP customer</p>
                  </div>
                  <span className="text-xs text-slate-500">1 hour ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Alerts & Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Low Stock Alert</p>
                    <p className="text-xs text-slate-600">23 items below minimum stock level</p>
                  </div>
                  <Button size="sm" variant="outline">View</Button>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payment Overdue</p>
                    <p className="text-xs text-slate-600">3 customers have overdue payments</p>
                  </div>
                  <Button size="sm" variant="outline">Review</Button>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">GST Filing Due</p>
                    <p className="text-xs text-slate-600">Monthly GST return due in 5 days</p>
                  </div>
                  <Button size="sm" variant="outline">Prepare</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}