'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { useUserContext } from '@/src/hooks/useUserContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Loader2 } from 'lucide-react'
import {
  Scissors,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Download,
  RefreshCw,
  ArrowLeft,
  Palette,
  Sparkles,
  Star,
  Heart,
  Zap,
  Award,
  Crown,
  ShoppingBag,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { universalApi } from '@/src/lib/universal-api'

interface SalonBudgetData {
  budget_id: string
  total_budget: number
  total_actual: number
  variance_amount: number
  variance_percent: number
  services_budget: number
  products_budget: number
  labor_budget: number
  overhead_budget: number
}

export default function SalonBudgetingPage() {
  const router = useRouter()
  const { isAuthenticated } = useMultiOrgAuth()
  const { organizationId, loading: contextLoading } = useUserContext()
  const [budgetData, setBudgetData] = useState<SalonBudgetData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'MTD' | 'QTD' | 'YTD'>('YTD')

  // Mock salon organization for demo
  const salonOrg = {
    organization_id: 'salon-demo-123',
    organization_name: "Bella's Beauty Salon",
    type: 'salon',
    data_status: 'demo'
  }

  // Salon-specific services and pricing
  const salonServices = [
    {
      category: 'Hair Services',
      icon: Scissors,
      color: 'from-pink-500 to-purple-600',
      services: [
        { name: 'Haircut & Style', price: 85, monthly_volume: 120, revenue: 10200 },
        { name: 'Hair Coloring', price: 150, monthly_volume: 60, revenue: 9000 },
        { name: 'Highlights', price: 180, monthly_volume: 40, revenue: 7200 },
        { name: 'Hair Treatment', price: 120, monthly_volume: 25, revenue: 3000 }
      ]
    },
    {
      category: 'Beauty Services',
      icon: Sparkles,
      color: 'from-blue-500 to-cyan-600',
      services: [
        { name: 'Facial Treatment', price: 95, monthly_volume: 80, revenue: 7600 },
        { name: 'Eyebrow Shaping', price: 45, monthly_volume: 100, revenue: 4500 },
        { name: 'Makeup Application', price: 75, monthly_volume: 30, revenue: 2250 },
        { name: 'Eyelash Extension', price: 120, monthly_volume: 35, revenue: 4200 }
      ]
    },
    {
      category: 'Nail Services',
      icon: Palette,
      color: 'from-green-500 to-emerald-600',
      services: [
        { name: 'Manicure', price: 55, monthly_volume: 90, revenue: 4950 },
        { name: 'Pedicure', price: 65, monthly_volume: 75, revenue: 4875 },
        { name: 'Gel Nails', price: 85, monthly_volume: 50, revenue: 4250 },
        { name: 'Nail Art', price: 95, monthly_volume: 20, revenue: 1900 }
      ]
    }
  ]

  // Calculate salon metrics
  const calculateSalonMetrics = () => {
    const totalServices = salonServices.reduce(
      (total, category) =>
        total +
        category.services.reduce((catTotal, service) => catTotal + service.monthly_volume, 0),
      0
    )

    const totalServiceRevenue = salonServices.reduce(
      (total, category) =>
        total + category.services.reduce((catTotal, service) => catTotal + service.revenue, 0),
      0
    )

    const averageServicePrice = totalServiceRevenue / totalServices
    const productsSales = totalServiceRevenue * 0.15 // 15% of service revenue from products
    const totalRevenue = totalServiceRevenue + productsSales

    return {
      totalServices,
      totalServiceRevenue,
      productsSales,
      totalRevenue,
      averageServicePrice,
      servicesPerDay: Math.round(totalServices / 30),
      averageTicket: totalRevenue / totalServices
    }
  }

  const salonMetrics = calculateSalonMetrics()

  // Salon budget breakdown
  const salonBudgetBreakdown = {
    revenue: {
      services: salonMetrics.totalServiceRevenue,
      products: salonMetrics.productsSales,
      total: salonMetrics.totalRevenue
    },
    expenses: {
      labor: salonMetrics.totalRevenue * 0.4, // 40% for salon labor
      cost_of_goods: salonMetrics.totalRevenue * 0.2, // 20% COGS
      rent: 8000,
      utilities: 1200,
      marketing: salonMetrics.totalRevenue * 0.06, // 6% marketing
      supplies: 2500,
      insurance: 800,
      other: 1500
    }
  }

  const totalExpenses = Object.values(salonBudgetBreakdown.expenses).reduce(
    (sum, expense) => sum + expense,
    0
  )
  const netIncome = salonBudgetBreakdown.revenue.total - totalExpenses
  const profitMargin = (netIncome / salonBudgetBreakdown.revenue.total) * 100

  // Staff productivity metrics
  const staffMetrics = [
    {
      name: 'Sarah (Senior Stylist)',
      role: 'Senior Hair Stylist',
      services_per_day: 8,
      revenue_per_day: 680,
      commission_rate: 50,
      monthly_revenue: 20400,
      utilization: 85
    },
    {
      name: 'Emma (Colorist)',
      role: 'Color Specialist',
      services_per_day: 5,
      revenue_per_day: 750,
      commission_rate: 45,
      monthly_revenue: 22500,
      utilization: 90
    },
    {
      name: 'Lisa (Nail Tech)',
      role: 'Nail Technician',
      services_per_day: 6,
      revenue_per_day: 390,
      commission_rate: 40,
      monthly_revenue: 11700,
      utilization: 75
    },
    {
      name: 'Maya (Esthetician)',
      role: 'Facial Specialist',
      services_per_day: 4,
      revenue_per_day: 380,
      commission_rate: 45,
      monthly_revenue: 11400,
      utilization: 80
    }
  ]

  // Seasonal trends for salon
  const seasonalTrends = [
    { month: 'Jan', factor: 0.8, events: ['New Year Resolution Boost'] },
    { month: 'Feb', factor: 0.9, events: ["Valentine's Day"] },
    { month: 'Mar', factor: 1.1, events: ['Spring Refresh'] },
    { month: 'Apr', factor: 1.0, events: ['Easter Preparation'] },
    { month: 'May', factor: 1.2, events: ['Wedding Season Starts', "Mother's Day"] },
    { month: 'Jun', factor: 1.3, events: ['Wedding Peak', 'Summer Prep'] },
    { month: 'Jul', factor: 1.1, events: ['Summer Maintenance'] },
    { month: 'Aug', factor: 1.0, events: ['Back to School'] },
    { month: 'Sep', factor: 1.1, events: ['Fall Refresh'] },
    { month: 'Oct', factor: 1.0, events: ['Halloween Prep'] },
    { month: 'Nov', factor: 1.3, events: ['Holiday Season'] },
    { month: 'Dec', factor: 1.4, events: ['Holiday Parties', 'New Year Prep'] }
  ]

  // Layer 1: Authentication Check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-gray-900">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access the budgeting page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Layer 2: Context Loading Check
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading organization context...</p>
        </div>
      </div>
    )
  }

  // Layer 3: Organization Check
  if (!organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-gray-900">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No organization found. Please complete setup.</AlertDescription>
        </Alert>
      </div>
    )
  }

  useEffect(() => {
    // Simulate loading salon budget data
    setTimeout(() => {
      setBudgetData({
        budget_id: 'salon-budget-2024',
        total_budget: salonBudgetBreakdown.revenue.total * 12,
        total_actual: salonBudgetBreakdown.revenue.total * 12 * 0.92, // 92% of budget
        variance_amount: salonBudgetBreakdown.revenue.total * 12 * -0.08,
        variance_percent: -8.0,
        services_budget: salonBudgetBreakdown.revenue.services * 12,
        products_budget: salonBudgetBreakdown.revenue.products * 12,
        labor_budget: salonBudgetBreakdown.expenses.labor * 12,
        overhead_budget: (totalExpenses - salonBudgetBreakdown.expenses.labor) * 12
      })
      setIsLoading(false)
    }, 1000)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const createSalonBudget = async () => {
    try {
      setIsLoading(true)

      // Create comprehensive salon budget using Universal API
      const budgetResult = await universalApi.createBudget({
        organizationId: salonOrg.organization_id,
        budgetName: `${salonOrg.organization_name} - 2024 Annual Budget`,
        budgetCode: 'SALON-BUDGET-2024',
        budgetType: 'operating',
        fiscalYear: 2024,
        budgetPeriod: 'annual',
        budgetMethod: 'driver_based',
        baseCurrency: 'AED'
      })

      if (budgetResult.success) {
        // Create detailed budget lines for salon services
        const budgetLines = []

        // Revenue lines by service category
        salonServices.forEach((category, catIndex) => {
          category.services.forEach((service, svcIndex) => {
            budgetLines.push({
              glAccountId: `GL_4${100 + catIndex}${svcIndex}`,
              accountCode: `4${100 + catIndex}${svcIndex}`,
              accountName: `Revenue - ${service.name}`,
              totalAmount: service.revenue * 12,
              budgetMethod: 'driver_based',
              budgetDriver: 'service_volume',
              driverAssumptions: {
                monthly_volume: service.monthly_volume,
                service_price: service.price,
                seasonal_variation: true
              },
              monthlyBreakdown: seasonalTrends.map(trend =>
                Math.round(service.revenue * trend.factor)
              ),
              dimensions: {
                costCenter: 'SALON_SERVICES',
                profitCenter: category.category.toUpperCase().replace(' ', '_'),
                productLine: service.name.toUpperCase().replace(/\s+/g, '_'),
                geography: 'MAIN_LOCATION'
              }
            })
          })
        })

        // Labor cost lines by staff member
        staffMetrics.forEach((staff, index) => {
          budgetLines.push({
            glAccountId: `GL_61${index + 1}0`,
            accountCode: `61${index + 1}0`,
            accountName: `Labor Cost - ${staff.name}`,
            totalAmount: staff.monthly_revenue * (staff.commission_rate / 100) * 12,
            budgetMethod: 'driver_based',
            budgetDriver: 'staff_productivity',
            driverAssumptions: {
              services_per_day: staff.services_per_day,
              commission_rate: staff.commission_rate,
              utilization_target: staff.utilization
            },
            monthlyBreakdown: Array(12).fill(staff.monthly_revenue * (staff.commission_rate / 100)),
            dimensions: {
              costCenter: 'SALON_LABOR',
              profitCenter: staff.role.toUpperCase().replace(/\s+/g, '_'),
              geography: 'MAIN_LOCATION'
            }
          })
        })

        await universalApi.createBudgetLineItems({
          budgetId: budgetResult.data.budget_id,
          organizationId: salonOrg.organization_id,
          lineItems: budgetLines
        })

        console.log('✅ Salon budget created successfully!')
      }
    } catch (error) {
      console.error('Error creating salon budget:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Scissors className="w-8 h-8 text-foreground" />
          </div>
          <p className="text-muted-foreground">Loading salon budgeting workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-gray-900">
      {/* Header */}
      <header className="border-b bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/budgeting')}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg">
                <Scissors className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {salonOrg.organization_name} - Budgeting
                </h1>
                <p className="text-sm text-muted-foreground">
                  Beauty salon budgeting with service-based revenue planning
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                <Sparkles className="w-4 h-4 mr-1" />
                Salon Demo
              </Badge>
              <Button onClick={createSalonBudget} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Budget
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-pink-900">
                    {formatCurrency(salonMetrics.totalRevenue)}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+12.5%</span>
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-pink-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Services/Month</p>
                  <p className="text-2xl font-bold text-purple-900">{salonMetrics.totalServices}</p>
                  <div className="flex items-center mt-2">
                    <Users className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-sm text-primary">{salonMetrics.servicesPerDay}/day</span>
                  </div>
                </div>
                <Scissors className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Average Ticket</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(salonMetrics.averageTicket)}
                  </p>
                  <div className="flex items-center mt-2">
                    <Target className="w-4 h-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">Target: {formatCurrency(95)}</span>
                  </div>
                </div>
                <Star className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Profit Margin</p>
                  <p className="text-2xl font-bold text-green-900">{profitMargin.toFixed(1)}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Target: 35%</span>
                  </div>
                </div>
                <Award className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {salonServices.map((category, index) => (
            <Card key={index} className="bg-background/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center`}
                  >
                    <category.icon className="w-5 h-5 text-foreground" />
                  </div>
                  {category.category}
                </CardTitle>
                <CardDescription>
                  Monthly revenue:{' '}
                  {formatCurrency(
                    category.services.reduce((sum, service) => sum + service.revenue, 0)
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.services.map((service, svcIndex) => (
                    <div
                      key={svcIndex}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-100">{service.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.monthly_volume} services × {formatCurrency(service.price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-100">
                          {formatCurrency(service.revenue)}
                        </div>
                        <div className="text-xs text-muted-foreground">monthly</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Staff Performance */}
        <Card className="mb-8 bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Staff Performance & Budget
            </CardTitle>
            <CardDescription>
              Individual stylist productivity and commission planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {staffMetrics.map((staff, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-100">{staff.name}</h4>
                      <p className="text-sm text-muted-foreground">{staff.role}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">
                      {staff.commission_rate}% Commission
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily Services:</span>
                      <span className="font-medium">{staff.services_per_day}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily Revenue:</span>
                      <span className="font-medium">{formatCurrency(staff.revenue_per_day)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Revenue:</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(staff.monthly_revenue)}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Utilization:</span>
                        <span className="font-medium">{staff.utilization}%</span>
                      </div>
                      <Progress value={staff.utilization} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Seasonal Trends */}
        <Card className="mb-8 bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Seasonal Revenue Planning
            </CardTitle>
            <CardDescription>Monthly revenue variations and special events impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {seasonalTrends.map((trend, index) => (
                <div
                  key={index}
                  className="text-center p-3 bg-gradient-to-br from-gray-900 to-gray-900 rounded-lg border"
                >
                  <div className="font-semibold text-gray-100 mb-1">{trend.month}</div>
                  <div
                    className={`text-sm font-medium mb-2 ${
                      trend.factor >= 1.2
                        ? 'text-green-600'
                        : trend.factor >= 1.0
                          ? 'text-primary'
                          : 'text-orange-600'
                    }`}
                  >
                    {(trend.factor * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(salonMetrics.totalRevenue * trend.factor)}
                  </div>
                  {trend.events.map((event, eventIndex) => (
                    <Badge key={eventIndex} variant="outline" className="text-xs mt-1 block">
                      {event}
                    </Badge>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Seasonal Strategy</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Peak seasons (May-Jun, Nov-Dec): Staff overtime budget, inventory increase
                </li>
                <li>• Wedding season marketing: Target brides with package deals</li>
                <li>• Holiday promotions: Gift card sales, special packages</li>
                <li>• Slow periods (Jan-Feb): Staff training, equipment maintenance</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Budget Summary */}
        <Card className="bg-gradient-to-r from-pink-600 to-purple-600 text-foreground">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <Crown className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-2">Annual Budget Summary</h3>
              <p className="text-pink-100">
                Complete financial planning for {salonOrg.organization_name}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {formatCurrency(salonBudgetBreakdown.revenue.total * 12)}
                </div>
                <div className="text-pink-100 text-sm">Annual Revenue Target</div>
                <div className="text-xs text-pink-200 mt-1">
                  Services: {formatCurrency(salonBudgetBreakdown.revenue.services * 12)}
                </div>
                <div className="text-xs text-pink-200">
                  Products: {formatCurrency(salonBudgetBreakdown.revenue.products * 12)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{formatCurrency(totalExpenses * 12)}</div>
                <div className="text-pink-100 text-sm">Annual Expenses</div>
                <div className="text-xs text-pink-200 mt-1">
                  Labor: {formatCurrency(salonBudgetBreakdown.expenses.labor * 12)} (40%)
                </div>
                <div className="text-xs text-pink-200">
                  Other:{' '}
                  {formatCurrency((totalExpenses - salonBudgetBreakdown.expenses.labor) * 12)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{formatCurrency(netIncome * 12)}</div>
                <div className="text-pink-100 text-sm">Net Income Target</div>
                <div className="text-xs text-pink-200 mt-1">Margin: {profitMargin.toFixed(1)}%</div>
                <div className="text-xs text-pink-200">Monthly: {formatCurrency(netIncome)}</div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={createSalonBudget}
                className="bg-background text-pink-600 hover:bg-pink-50"
              >
                <Target className="w-5 h-5 mr-2" />
                Generate Complete Budget
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
