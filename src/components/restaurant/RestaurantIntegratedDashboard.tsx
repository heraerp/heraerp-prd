'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ChefHat,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Package,
  Users,
  Settings,
  TrendingUp,
  Receipt,
  Calculator,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  Utensils,
  FileText,
  Database,
  Zap
} from 'lucide-react'

// Import all our restaurant components
import { RestaurantPOS } from './RestaurantPOS'
import { RestaurantFinancialDashboard } from './RestaurantFinancialDashboard'
import { RecipeCostingManager } from './RecipeCostingManager'
import { KitchenDisplaySystem } from './KitchenDisplaySystem'
import { universalApi } from '@/lib/universal-api'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

export function RestaurantIntegratedDashboard() {
  const [activeModule, setActiveModule] = useState('dashboard')
  const { organization } = useMultiOrgAuth()

  // HERA Integration Status
  const heraIntegrations = [
    {
      name: 'Universal COA',
      status: 'active',
      description: 'Restaurant-specific Chart of Accounts with IFRS compliance',
      icon: <BookOpen className="w-5 h-5" />,
      smartCode: 'HERA.FIN.GL.COA.RESTAURANT.v1'
    },
    {
      name: 'Auto-Journal Engine',
      status: 'active',
      description: '85% automated GL posting for all transactions',
      icon: <Zap className="w-5 h-5" />,
      smartCode: 'HERA.FIN.AUTO.JOURNAL.ENGINE.v1'
    },
    {
      name: 'Budgeting System',
      status: 'active',
      description: 'Real-time budget vs actual variance analysis',
      icon: <Calculator className="w-5 h-5" />,
      smartCode: 'HERA.FIN.BUDGET.OPERATING.v1'
    },
    {
      name: 'Universal API',
      status: 'active',
      description: 'Single endpoint for all data operations',
      icon: <Database className="w-5 h-5" />,
      smartCode: 'HERA.API.UNIVERSAL.v1'
    }
  ]

  // Module configuration with HERA smart codes
  const modules = [
    {
      id: 'dashboard',
      name: 'Overview',
      icon: <BarChart3 className="w-5 h-5" />,
      component: <DashboardOverview />,
      smartCode: 'HERA.REST.DASHBOARD.MAIN.v1'
    },
    {
      id: 'pos',
      name: 'Point of Sale',
      icon: <ShoppingCart className="w-5 h-5" />,
      component: <RestaurantPOS />,
      smartCode: 'HERA.REST.POS.SYSTEM.v1'
    },
    {
      id: 'kitchen',
      name: 'Kitchen Display',
      icon: <ChefHat className="w-5 h-5" />,
      component: <KitchenDisplaySystem />,
      smartCode: 'HERA.REST.KDS.SYSTEM.v1'
    },
    {
      id: 'financial',
      name: 'Financial Analytics',
      icon: <DollarSign className="w-5 h-5" />,
      component: <RestaurantFinancialDashboard />,
      smartCode: 'HERA.REST.FIN.ANALYTICS.v1'
    },
    {
      id: 'costing',
      name: 'Recipe Costing',
      icon: <Calculator className="w-5 h-5" />,
      component: <RecipeCostingManager />,
      smartCode: 'HERA.REST.RECIPE.COSTING.v1'
    }
  ]

  // Dashboard Overview Component
  function DashboardOverview() {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 rounded-lg">
          <h1 className="text-3xl font-bold mb-2">Welcome to HERA Restaurant Pro</h1>
          <p className="text-orange-100">
            Comprehensive restaurant management with real-time financial integration
          </p>
          {organization && (
            <Badge className="mt-2 bg-white text-orange-600">
              {organization.organization_name}
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="restaurant-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Today's Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">$8,750</p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12.5% vs yesterday
              </div>
            </CardContent>
          </Card>

          <Card className="restaurant-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">24</p>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-blue-100 text-blue-700">8 New</Badge>
                <Badge className="bg-orange-100 text-orange-700">12 Preparing</Badge>
                <Badge className="bg-green-100 text-green-700">4 Ready</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="restaurant-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Food Cost %</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">28.5%</p>
              <p className="text-sm text-gray-500 mt-1">Target: 30%</p>
            </CardContent>
          </Card>

          <Card className="restaurant-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Net Margin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">22%</p>
              <p className="text-sm text-gray-500 mt-1">Profit: $1,925</p>
            </CardContent>
          </Card>
        </div>

        {/* HERA Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-500" />
              HERA Universal System Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {heraIntegrations.map((integration, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg">{integration.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{integration.name}</h3>
                      <Badge className="bg-green-500 text-white text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{integration.smartCode}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setActiveModule('pos')}
              >
                <ShoppingCart className="w-6 h-6 text-orange-500" />
                <span className="text-xs">New Order</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setActiveModule('kitchen')}
              >
                <ChefHat className="w-6 h-6 text-orange-500" />
                <span className="text-xs">Kitchen View</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setActiveModule('financial')}
              >
                <Receipt className="w-6 h-6 text-orange-500" />
                <span className="text-xs">Daily Report</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => setActiveModule('costing')}
              >
                <Calculator className="w-6 h-6 text-orange-500" />
                <span className="text-xs">Update Costs</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Order #0142 completed</p>
                    <p className="text-xs text-gray-500">Table 12 - $124.50</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">2 min ago</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Auto-journal posted</p>
                    <p className="text-xs text-gray-500">Sales transactions batch processed</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">5 min ago</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Low stock alert</p>
                    <p className="text-xs text-gray-500">Salmon fillet below reorder point</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">15 min ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="p-6">
        {/* Module Navigation */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {modules.map(module => (
              <Button
                key={module.id}
                variant={activeModule === module.id ? 'default' : 'outline'}
                onClick={() => setActiveModule(module.id)}
                className={activeModule === module.id ? 'restaurant-btn-primary' : ''}
              >
                {module.icon}
                <span className="ml-2">{module.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Active Module Content */}
        <div className="animate-in fade-in duration-300">
          {modules.find(m => m.id === activeModule)?.component}
        </div>

        {/* HERA Integration Alert */}
        {activeModule !== 'dashboard' && (
          <Alert className="mt-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              This module is fully integrated with HERA Universal System. All transactions are
              automatically posted to GL accounts and tracked in real-time.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
