'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Package,
  DollarSign,
  Activity,
  BarChart3,
  Gem,
  Crown,
  Star,
  Zap,
  Bot,
  Eye,
  ArrowRight,
  RefreshCw,
  Settings
} from 'lucide-react'
import {
  UniversalAIInventory,
  InventoryAIEngine,
  INVENTORY_SMART_CODES
} from '@/lib/inventory/universal-ai-inventory'

// HERA Universal AI Inventory Dashboard
// Smart Code: HERA.INV.AI.DASHBOARD.v1

interface AIMetrics {
  totalItems: number
  totalValue: number
  aiPredictions: {
    demandScore: number
    reorderAlerts: number
    priceOptimizations: number
  }
  stockHealth: {
    optimal: number
    warning: number
    critical: number
  }
  aiConfidence: number
}

interface InventoryAlert {
  id: string
  itemName: string
  alertType: 'stock_low' | 'demand_spike' | 'price_opportunity' | 'quality_issue'
  urgency: 'critical' | 'high' | 'medium' | 'low'
  aiRecommendation: string
  smartCode: string
}

export function UniversalAIInventoryDashboard({ organizationId }: { organizationId: string }) {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null)
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [isAIProcessing, setIsAIProcessing] = useState(false)
  const [selectedView, setSelectedView] = useState<'overview' | 'ai-insights' | 'predictions'>(
    'overview'
  )

  // Initialize AI Engine
  const aiInventory = new UniversalAIInventory(organizationId)
  const aiEngine = new InventoryAIEngine(organizationId)

  useEffect(() => {
    loadAIMetrics()
    loadAlerts()
  }, [organizationId])

  const loadAIMetrics = async () => {
    // Simulate loading AI-enhanced metrics
    setMetrics({
      totalItems: 156,
      totalValue: 487500,
      aiPredictions: {
        demandScore: 87,
        reorderAlerts: 5,
        priceOptimizations: 12
      },
      stockHealth: {
        optimal: 78,
        warning: 15,
        critical: 7
      },
      aiConfidence: 92
    })
  }

  const loadAlerts = async () => {
    // Simulate AI-generated alerts
    setAlerts([
      {
        id: '1',
        itemName: 'Diamond Solitaire Ring - 2ct',
        alertType: 'demand_spike',
        urgency: 'high',
        aiRecommendation: 'Increase stock by 30% for wedding season',
        smartCode: INVENTORY_SMART_CODES.AI_DEMAND_FORECAST
      },
      {
        id: '2',
        itemName: 'Gold Chain - 22K',
        alertType: 'stock_low',
        urgency: 'critical',
        aiRecommendation: 'Reorder immediately - only 2 units left',
        smartCode: INVENTORY_SMART_CODES.AI_REORDER_POINT
      },
      {
        id: '3',
        itemName: 'Pearl Necklace Set',
        alertType: 'price_opportunity',
        urgency: 'medium',
        aiRecommendation: 'Increase price by 15% based on market trends',
        smartCode: INVENTORY_SMART_CODES.AI_PRICE_OPTIMIZATION
      }
    ])
  }

  const runAIPredictions = async () => {
    setIsAIProcessing(true)

    // Simulate AI processing
    setTimeout(() => {
      setIsAIProcessing(false)
      // Update metrics with new predictions
      if (metrics) {
        setMetrics({
          ...metrics,
          aiPredictions: {
            ...metrics.aiPredictions,
            demandScore: Math.min(100, metrics.aiPredictions.demandScore + 2)
          }
        })
      }
    }, 2000)
  }

  const getAlertIcon = (type: string) => {
    const icons = {
      stock_low: <Package className="w-4 h-4" />,
      demand_spike: <TrendingUp className="w-4 h-4" />,
      price_opportunity: <DollarSign className="w-4 h-4" />,
      quality_issue: <AlertTriangle className="w-4 h-4" />
    }
    return icons[type as keyof typeof icons] || <AlertTriangle className="w-4 h-4" />
  }

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return colors[urgency as keyof typeof colors] || 'bg-muted text-gray-800'
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading AI Inventory System...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with AI Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            Universal AI Inventory System
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Powered by HERA's 6-Table Universal Architecture • Smart Code: HERA.INV.AI.SYSTEM.v1
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">AI Confidence</p>
            <div className="flex items-center gap-2">
              <Progress value={metrics.aiConfidence} className="w-24 h-2" />
              <span className="text-sm font-semibold">{metrics.aiConfidence}%</span>
            </div>
          </div>

          <Button
            onClick={runAIPredictions}
            disabled={isAIProcessing}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isAIProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        {(['overview', 'ai-insights', 'predictions'] as const).map(view => (
          <Button
            key={view}
            variant={selectedView === view ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView(view)}
            className="capitalize"
          >
            {view === 'ai-insights' ? 'AI Insights' : view}
          </Button>
        ))}
      </div>

      {/* Overview View */}
      {selectedView === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
                <Package className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalItems}</div>
                <p className="text-xs text-muted-foreground mt-1">AI-classified items</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics.totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">AI-optimized pricing</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Demand Score</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.aiPredictions.demandScore}%</div>
                <Progress value={metrics.aiPredictions.demandScore} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alerts.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active recommendations</p>
              </CardContent>
            </Card>
          </div>

          {/* Stock Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Stock Health Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Optimal Stock</span>
                    <span className="text-sm text-muted-foreground">{metrics.stockHealth.optimal}%</span>
                  </div>
                  <Progress value={metrics.stockHealth.optimal} className="h-2 bg-green-100" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Warning Level</span>
                    <span className="text-sm text-muted-foreground">{metrics.stockHealth.warning}%</span>
                  </div>
                  <Progress value={metrics.stockHealth.warning} className="h-2 bg-yellow-100" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Critical Level</span>
                    <span className="text-sm text-muted-foreground">{metrics.stockHealth.critical}%</span>
                  </div>
                  <Progress value={metrics.stockHealth.critical} className="h-2 bg-red-100" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                AI-Generated Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between p-4 rounded-lg bg-muted hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-background">{getAlertIcon(alert.alertType)}</div>
                      <div>
                        <h4 className="font-medium text-gray-900">{alert.itemName}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{alert.aiRecommendation}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getUrgencyColor(alert.urgency)}>{alert.urgency}</Badge>
                          <span className="text-xs text-muted-foreground">{alert.smartCode}</span>
                        </div>
                      </div>
                    </div>

                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* AI Insights View */}
      {selectedView === 'ai-insights' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-purple-600" />
                Jewelry Demand Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-background rounded-lg">
                  <h4 className="font-medium mb-2">Wedding Season Impact</h4>
                  <p className="text-sm text-muted-foreground">
                    AI predicts 45% increase in engagement ring demand over next 2 months
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">High Confidence</span>
                  </div>
                </div>

                <div className="p-4 bg-background rounded-lg">
                  <h4 className="font-medium mb-2">Precious Metal Trends</h4>
                  <p className="text-sm text-muted-foreground">
                    Gold jewelry showing steady demand, platinum experiencing luxury growth
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Market Analysis</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Price Optimization Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-background rounded-lg">
                  <h4 className="font-medium mb-2">Dynamic Pricing Opportunities</h4>
                  <p className="text-sm text-muted-foreground">
                    12 items identified for price optimization with average 18% margin improvement
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      $45K potential revenue
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-background rounded-lg">
                  <h4 className="font-medium mb-2">Competitive Positioning</h4>
                  <p className="text-sm text-muted-foreground">
                    Your pricing is 5% below market average with room for premium positioning
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">Premium Strategy</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                Smart Code Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries({
                  'Goods Receipt': INVENTORY_SMART_CODES.GOODS_RECEIPT,
                  'AI Demand': INVENTORY_SMART_CODES.AI_DEMAND_FORECAST,
                  'Price Optimize': INVENTORY_SMART_CODES.AI_PRICE_OPTIMIZATION,
                  'Quality Score': INVENTORY_SMART_CODES.AI_QUALITY_SCORE
                }).map(([name, code]) => (
                  <div key={code} className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{name}</p>
                    <p className="text-xs font-mono text-purple-600">{code}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Predictions View */}
      {selectedView === 'predictions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI Demand Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Next 7 Days</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Diamond Jewelry</span>
                        <span className="font-medium text-green-600">+23%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Gold Items</span>
                        <span className="font-medium text-primary">+15%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Silver Collection</span>
                        <span className="font-medium text-muted-foreground">+8%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Next 30 Days</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Engagement Rings</span>
                        <span className="font-medium text-green-600">+45%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Wedding Bands</span>
                        <span className="font-medium text-green-600">+38%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Custom Orders</span>
                        <span className="font-medium text-primary">+20%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Seasonal Trends</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Valentine's Day</span>
                        <Badge className="bg-pink-100 text-pink-800">Peak</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Wedding Season</span>
                        <Badge className="bg-green-100 text-green-800">High</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Holiday Period</span>
                        <Badge className="bg-blue-100 text-blue-800">Rising</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="text-center">
                <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI-Powered Inventory Intelligence</h3>
                <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
                  HERA's Universal AI system continuously learns from your inventory patterns,
                  market trends, and customer behavior to provide actionable insights and
                  predictions.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure AI Settings
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    View Full Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
