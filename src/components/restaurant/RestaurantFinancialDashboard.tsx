'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar,
  ChefHat,
  Utensils,
  Coffee,
  Wine,
  Pizza,
  Beef,
  Fish,
  Salad,
  Cookie,
  ArrowUp,
  ArrowDown,
  Clock,
  Target,
  Receipt
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FinancialMetrics {
  revenue: {
    today: number
    week: number
    month: number
    year: number
    trend: number
  }
  costs: {
    food: number
    labor: number
    overhead: number
    total: number
  }
  profitability: {
    grossProfit: number
    grossMargin: number
    netProfit: number
    netMargin: number
  }
  kpis: {
    averageCheck: number
    tablesTurned: number
    laborCost: number
    foodCost: number
    primeCost: number
  }
}

interface MenuPerformance {
  topSellers: Array<{
    name: string
    category: string
    sold: number
    revenue: number
    margin: number
  }>
  lowPerformers: Array<{
    name: string
    category: string
    sold: number
    waste: number
  }>
  categoryBreakdown: Array<{
    category: string
    revenue: number
    percentage: number
    icon: React.ReactNode
  }>
}

export function RestaurantFinancialDashboard() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('today')
  const [loading, setLoading] = useState(false)

  // Demo data - would come from HERA Universal API
  const metrics: FinancialMetrics = {
    revenue: {
      today: 8750,
      week: 52300,
      month: 218000,
      year: 2620000,
      trend: 12.5
    },
    costs: {
      food: 2625, // 30% of revenue
      labor: 2450, // 28% of revenue
      overhead: 1750, // 20% of revenue
      total: 6825
    },
    profitability: {
      grossProfit: 6125,
      grossMargin: 70,
      netProfit: 1925,
      netMargin: 22
    },
    kpis: {
      averageCheck: 48.5,
      tablesTurned: 3.2,
      laborCost: 28,
      foodCost: 30,
      primeCost: 58
    }
  }

  const menuPerformance: MenuPerformance = {
    topSellers: [
      { name: 'Truffle Pasta', category: 'Main', sold: 145, revenue: 3625, margin: 72 },
      { name: 'Grilled Salmon', category: 'Main', sold: 132, revenue: 3168, margin: 68 },
      { name: 'Caesar Salad', category: 'Appetizer', sold: 198, revenue: 1782, margin: 78 },
      { name: 'Chocolate Lava', category: 'Dessert', sold: 89, revenue: 801, margin: 65 },
      { name: 'House Wine', category: 'Beverage', sold: 215, revenue: 1720, margin: 85 }
    ],
    lowPerformers: [
      { name: 'Vegan Bowl', category: 'Main', sold: 12, waste: 8 },
      { name: 'Fish Tacos', category: 'Main', sold: 18, waste: 5 },
      { name: 'Quinoa Salad', category: 'Appetizer', sold: 8, waste: 12 }
    ],
    categoryBreakdown: [
      {
        category: 'Mains',
        revenue: 4350,
        percentage: 49.7,
        icon: <Utensils className="w-4 h-4" />
      },
      {
        category: 'Appetizers',
        revenue: 1750,
        percentage: 20,
        icon: <Salad className="w-4 h-4" />
      },
      { category: 'Beverages', revenue: 1400, percentage: 16, icon: <Wine className="w-4 h-4" /> },
      {
        category: 'Desserts',
        revenue: 1250,
        percentage: 14.3,
        icon: <Cookie className="w-4 h-4" />
      }
    ]
  }

  const getRevenueTrend = (trend: number) => {
    if (trend > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span className="font-semibold">+{trend}%</span>
        </div>
      )
    } else if (trend < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          <span className="font-semibold">{trend}%</span>
        </div>
      )
    }
    return <span className="text-muted-foreground">0%</span>
  }

  const getCostColor = (percentage: number) => {
    if (percentage <= 30) return 'text-green-600'
    if (percentage <= 35) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time financial metrics and profitability analysis
          </p>
        </div>
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'year'] as const).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={timeRange === range ? 'bg-gradient-to-r from-orange-500 to-amber-500' : ''}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="restaurant-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  ${metrics.revenue[timeRange].toLocaleString()}
                </p>
                {getRevenueTrend(metrics.revenue.trend)}
              </div>
              <DollarSign className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="restaurant-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  ${metrics.profitability.netProfit.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Margin: {metrics.profitability.netMargin}%
                </p>
              </div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="restaurant-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Food Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-2xl font-bold', getCostColor(metrics.kpis.foodCost))}>
                  {metrics.kpis.foodCost}%
                </p>
                <p className="text-sm text-muted-foreground">
                  ${metrics.costs.food.toLocaleString()}
                </p>
              </div>
              <Package className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="restaurant-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Labor Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-2xl font-bold', getCostColor(metrics.kpis.laborCost))}>
                  {metrics.kpis.laborCost}%
                </p>
                <p className="text-sm text-muted-foreground">
                  ${metrics.costs.labor.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="profitability" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-orange-50">
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="menu">Menu Performance</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="profitability" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="restaurant-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-orange-500" />
                  Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Food Cost</span>
                      <span className="text-sm font-semibold">{metrics.kpis.foodCost}%</span>
                    </div>
                    <Progress value={metrics.kpis.foodCost} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Labor Cost</span>
                      <span className="text-sm font-semibold">{metrics.kpis.laborCost}%</span>
                    </div>
                    <Progress value={metrics.kpis.laborCost} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Overhead</span>
                      <span className="text-sm font-semibold">20%</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-bold">Net Profit</span>
                      <span className="text-sm font-bold text-green-600">
                        {metrics.profitability.netMargin}%
                      </span>
                    </div>
                    <Progress
                      value={metrics.profitability.netMargin}
                      className="h-2 bg-green-100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="restaurant-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Average Check</p>
                      <p className="text-xl font-bold text-orange-600">
                        ${metrics.kpis.averageCheck}
                      </p>
                    </div>
                    <Receipt className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Tables Turned</p>
                      <p className="text-xl font-bold text-amber-600">
                        {metrics.kpis.tablesTurned}x
                      </p>
                    </div>
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Prime Cost</p>
                      <p className="text-xl font-bold text-yellow-600">{metrics.kpis.primeCost}%</p>
                    </div>
                    <AlertCircle className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="restaurant-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Top Performing Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {menuPerformance.topSellers.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.sold} sold</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.revenue}</p>
                        <p className="text-xs text-green-600">{item.margin}% margin</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="restaurant-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-orange-500" />
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {menuPerformance.categoryBreakdown.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center">
                          {category.icon}
                        </div>
                        <div>
                          <p className="font-medium">{category.category}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.percentage}% of revenue
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-orange-600">${category.revenue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Performers Alert */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-5 h-5" />
                Items Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {menuPerformance.lowPerformers.map((item, index) => (
                  <div
                    key={index}
                    className="bg-background p-3 rounded-lg border border-yellow-200"
                  >
                    <p className="font-medium">{item.name}</p>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-muted-foreground">Sold: {item.sold}</span>
                      <span className="text-red-600">Waste: {item.waste}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card className="restaurant-card">
            <CardHeader>
              <CardTitle>Detailed Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Food Cost Target</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">28-32%</p>
                      <Badge
                        className={cn(metrics.kpis.foodCost <= 32 ? 'bg-green-500' : 'bg-red-500')}
                      >
                        {metrics.kpis.foodCost}%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Labor Cost Target</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">25-30%</p>
                      <Badge
                        className={cn(metrics.kpis.laborCost <= 30 ? 'bg-green-500' : 'bg-red-500')}
                      >
                        {metrics.kpis.laborCost}%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Prime Cost Target</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">55-60%</p>
                      <Badge
                        className={cn(metrics.kpis.primeCost <= 60 ? 'bg-green-500' : 'bg-red-500')}
                      >
                        {metrics.kpis.primeCost}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="restaurant-card">
            <CardHeader>
              <CardTitle>Revenue & Profit Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Chart visualization would go here - integrate with Chart.js or Recharts
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
