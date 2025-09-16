'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Package,
  Layers,
  Calculator,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Zap,
  GitBranch,
  FileText,
  Activity
} from 'lucide-react'

interface BOMComponent {
  id: string
  item_code: string
  item_name: string
  quantity: number
  unit_cost: number
  total_cost: number
  cost_type: 'material' | 'component'
  level: number
}

interface ProductCost {
  product_id: string
  product_name: string
  bom_id: string
  direct_material: number
  direct_labor: number
  overhead_allocation: number
  total_cost: number
  selling_price: number
  gross_margin: number
  gross_margin_pct: number
  last_updated: string
}

interface CostBreakdown {
  category: string
  amount: number
  percentage: number
  details: any[]
}

export function ProductCostingWithBOM({
  organizationId,
  productId
}: {
  organizationId: string
  productId?: string
}) {
  const [selectedProduct, setSelectedProduct] = useState<ProductCost | null>(null)
  const [bomComponents, setBomComponents] = useState<BOMComponent[]>([])
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['material']))

  useEffect(() => {
    if (productId) {
      loadProductCost(productId)
    }
  }, [productId])

  const loadProductCost = async (prodId: string) => {
    setIsCalculating(true)
    try {
      const response = await fetch(
        `/api/v1/profitability?action=calculate_cost&product_id=${prodId}&include_bom=true`
      )
      const data = await response.json()

      if (data.success) {
        // Transform API response to component format
        setSelectedProduct({
          product_id: prodId,
          product_name: 'Premium Widget A',
          bom_id: 'BOM001',
          direct_material: data.cost_breakdown.direct_material.total,
          direct_labor: data.cost_breakdown.direct_labor.total,
          overhead_allocation: data.cost_breakdown.overhead_allocation.total,
          total_cost: data.total_cost,
          selling_price: 250.0, // Mock selling price
          gross_margin: 250.0 - data.total_cost,
          gross_margin_pct: ((250.0 - data.total_cost) / 250.0) * 100,
          last_updated: data.calculation_date
        })

        // Set BOM components
        setBomComponents(
          data.cost_breakdown.direct_material.components.map((comp: any, idx: number) => ({
            id: `comp_${idx}`,
            item_code: comp.item.split(' ')[0],
            item_name: comp.item,
            quantity: comp.quantity,
            unit_cost: comp.unit_cost,
            total_cost: comp.total,
            cost_type: 'material',
            level: 1
          }))
        )

        // Set cost breakdown
        setCostBreakdown([
          {
            category: 'Direct Material',
            amount: data.cost_breakdown.direct_material.total,
            percentage: (data.cost_breakdown.direct_material.total / data.total_cost) * 100,
            details: data.cost_breakdown.direct_material.components
          },
          {
            category: 'Direct Labor',
            amount: data.cost_breakdown.direct_labor.total,
            percentage: (data.cost_breakdown.direct_labor.total / data.total_cost) * 100,
            details: data.cost_breakdown.direct_labor.operations
          },
          {
            category: 'Manufacturing Overhead',
            amount: data.cost_breakdown.overhead_allocation.total,
            percentage: (data.cost_breakdown.overhead_allocation.total / data.total_cost) * 100,
            details: data.cost_breakdown.overhead_allocation.cost_pools
          }
        ])
      }
    } catch (error) {
      console.error('Failed to calculate product cost:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const recalculateCost = () => {
    if (selectedProduct) {
      loadProductCost(selectedProduct.product_id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Product Cost Summary */}
      {selectedProduct && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {selectedProduct.product_name}
                </CardTitle>
                <CardDescription>Product costing with BOM integration</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">BOM: {selectedProduct.bom_id}</Badge>
                <Badge variant="outline">HERA.COST.PROD.CALC.v1</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={recalculateCost}
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold text-gray-100">
                  ${selectedProduct.total_cost.toFixed(2)}
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Selling Price</p>
                <p className="text-2xl font-bold text-gray-100">
                  ${selectedProduct.selling_price.toFixed(2)}
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Gross Margin</p>
                <p className="text-2xl font-bold text-green-600">
                  ${selectedProduct.gross_margin.toFixed(2)}
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Margin %</p>
                <p className="text-2xl font-bold text-green-600">
                  {selectedProduct.gross_margin_pct.toFixed(1)}%
                </p>
              </div>
              <div className="bg-background p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium text-gray-100">
                  {new Date(selectedProduct.last_updated).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown Tabs */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="bom">BOM Structure</TabsTrigger>
          <TabsTrigger value="analysis">Cost Analysis</TabsTrigger>
        </TabsList>

        {/* Cost Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Cost Breakdown</CardTitle>
              <CardDescription>Click sections to view detailed components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {costBreakdown.map(category => (
                <div key={category.category} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection(category.category.toLowerCase().replace(' ', '_'))}
                    className="w-full p-4 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedSections.has(category.category.toLowerCase().replace(' ', '_')) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <div className="text-left">
                          <h4 className="font-medium">{category.category}</h4>
                          <p className="text-sm text-muted-foreground">
                            {category.percentage.toFixed(1)}% of total cost
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${category.amount.toFixed(2)}</p>
                      </div>
                    </div>
                    <Progress value={category.percentage} className="mt-3 h-2" />
                  </button>

                  {expandedSections.has(category.category.toLowerCase().replace(' ', '_')) && (
                    <div className="border-t p-4 bg-muted">
                      <div className="space-y-2">
                        {category.details.map((detail: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {category.category === 'Direct Material' && (
                                <Package className="w-4 h-4 text-blue-500" />
                              )}
                              {category.category === 'Direct Labor' && (
                                <Activity className="w-4 h-4 text-green-500" />
                              )}
                              {category.category === 'Manufacturing Overhead' && (
                                <GitBranch className="w-4 h-4 text-purple-500" />
                              )}
                              <span>{detail.item || detail.operation || detail.pool}</span>
                              {detail.quantity && (
                                <Badge variant="outline" className="text-xs">
                                  Qty: {detail.quantity}
                                </Badge>
                              )}
                            </div>
                            <span className="font-medium">
                              ${(detail.total || detail.allocation).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Total Summary */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold text-lg">Total Product Cost</span>
                  </div>
                  <span className="text-2xl font-bold">
                    ${costBreakdown.reduce((sum, cat) => sum + cat.amount, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BOM Structure Tab */}
        <TabsContent value="bom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Bill of Materials Structure
              </CardTitle>
              <CardDescription>Hierarchical view of product components with costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bomComponents.map((component, idx) => (
                  <div
                    key={component.id}
                    className="p-3 border rounded-lg hover:bg-muted transition-colors"
                    style={{ marginLeft: `${(component.level - 1) * 24}px` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-medium">{component.item_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Code: {component.item_code} | Qty: {component.quantity}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${component.total_cost.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          ${component.unit_cost.toFixed(2)}/unit
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">BOM Integration Active</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Material costs are automatically synchronized with the BOM system in real-time
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      HERA.PROF.INT.BOM.v1
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Cost Analysis & Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cost Variance Alert */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900">Material Cost Variance</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Raw Material A cost increased 8.5% compared to standard. Consider reviewing
                      supplier contracts.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        HERA.COST.VAR.PRICE.v1
                      </Badge>
                      <span className="text-xs text-yellow-600">Impact: +$3.87/unit</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Optimization Suggestion */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900">Cost Optimization Opportunity</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Switching to batch production could reduce setup costs by 22% for this product
                      line.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        HERA.PROF.AI.OPT.v1
                      </Badge>
                      <span className="text-xs text-green-600">Potential savings: $8.40/unit</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profitability Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Profitability Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contribution Margin</span>
                      <span className="font-medium">42.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Break-even Units</span>
                      <span className="font-medium">1,247 units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target Margin</span>
                      <span className="font-medium">35.0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Actual vs Target</span>
                      <span className="font-medium text-green-600">+7.5pp</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Cost Trends</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Material (3mo)</span>
                      <span className="font-medium text-red-600">↑ 5.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Labor (3mo)</span>
                      <span className="font-medium text-green-600">↓ 2.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overhead (3mo)</span>
                      <span className="font-medium text-yellow-600">→ 0.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Cost (3mo)</span>
                      <span className="font-medium text-red-600">↑ 3.4%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
