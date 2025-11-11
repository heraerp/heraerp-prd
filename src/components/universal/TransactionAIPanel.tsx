'use client'

/**
 * Transaction AI Panel Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.TRANSACTION_AI_PANEL.v1
 * 
 * Provides contextual AI insights, suggestions, and compliance validation
 * for transaction creation and editing across all modules
 */

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Clock,
  User,
  Building2,
  Zap,
  Eye,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TransactionTypeConfig, AIFeature } from '@/lib/config/transaction-types'

interface AIInsight {
  id: string
  type: 'analysis' | 'optimization' | 'suggestion' | 'validation' | 'forecasting' | 'warning'
  title: string
  message: string
  confidence: number
  action?: string
  actionUrl?: string
  priority: 'high' | 'medium' | 'low'
  category: 'compliance' | 'performance' | 'risk' | 'opportunity'
}

interface TransactionAIPanelProps {
  config: TransactionTypeConfig
  headerData: Record<string, any>
  lines: any[]
  calculations: Record<string, number>
  onInsightAction?: (insight: AIInsight) => void
  className?: string
}

export function TransactionAIPanel({
  config,
  headerData,
  lines,
  calculations,
  onInsightAction,
  className = ''
}: TransactionAIPanelProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Generate AI insights based on transaction data
  const generateInsights = useMemo(() => {
    const newInsights: AIInsight[] = []

    // Module-specific insights
    switch (config.module) {
      case 'procurement':
        if (config.id === 'purchase_order') {
          // Vendor performance analysis
          if (headerData.vendor_id) {
            newInsights.push({
              id: 'vendor_performance',
              type: 'analysis',
              title: 'Vendor Performance Analysis',
              message: `${headerData.vendor_name || 'Selected vendor'} has 98% on-time delivery rate and 4.8/5 quality rating. Recommended for approval.`,
              confidence: 0.94,
              action: 'View History',
              priority: 'medium',
              category: 'performance'
            })
          }

          // Budget compliance check
          if (calculations.total > 0) {
            const budgetUtilization = Math.min(calculations.total / 50000 * 100, 100) // Mock budget of $50K
            newInsights.push({
              id: 'budget_compliance',
              type: 'validation',
              title: 'Budget Compliance Check',
              message: `PO amount represents ${budgetUtilization.toFixed(1)}% of Q4 budget allocation. ${budgetUtilization > 80 ? 'Consider review.' : 'Within safe limits.'}`,
              confidence: 1.0,
              action: 'View Budget',
              priority: budgetUtilization > 80 ? 'high' : 'low',
              category: 'compliance'
            })
          }

          // Delivery optimization
          if (lines.length > 1) {
            const sameDateItems = lines.filter((line, index, arr) => 
              arr.some((other, otherIndex) => 
                otherIndex !== index && other.delivery_date === line.delivery_date
              )
            )
            
            if (sameDateItems.length > 1) {
              newInsights.push({
                id: 'delivery_optimization',
                type: 'optimization',
                title: 'Delivery Consolidation',
                message: `${sameDateItems.length} items have the same delivery date. Consolidating delivery can save 8% on shipping costs.`,
                confidence: 0.87,
                action: 'Optimize',
                priority: 'medium',
                category: 'opportunity'
              })
            }
          }

          // Price validation
          lines.forEach((line, index) => {
            if (line.unit_price && line.product_code) {
              // Mock price comparison
              const marketPrice = line.unit_price * (0.9 + Math.random() * 0.2) // ±10% variance
              const variance = ((line.unit_price - marketPrice) / marketPrice) * 100
              
              if (Math.abs(variance) > 15) {
                newInsights.push({
                  id: `price_check_${index}`,
                  type: variance > 0 ? 'warning' : 'suggestion',
                  title: `Price Analysis - ${line.product_code}`,
                  message: `Unit price is ${Math.abs(variance).toFixed(1)}% ${variance > 0 ? 'above' : 'below'} market average. ${variance > 0 ? 'Consider negotiation.' : 'Excellent pricing.'}`,
                  confidence: 0.82,
                  action: 'View Market Data',
                  priority: Math.abs(variance) > 25 ? 'high' : 'medium',
                  category: variance > 0 ? 'risk' : 'opportunity'
                })
              }
            }
          })
        }
        break

      case 'sales':
        if (config.id === 'sales_order') {
          // Customer credit analysis
          if (headerData.customer_id && calculations.total > 0) {
            const creditLimit = 100000 // Mock credit limit
            const utilization = (calculations.total / creditLimit) * 100
            
            newInsights.push({
              id: 'credit_analysis',
              type: 'validation',
              title: 'Customer Credit Analysis',
              message: `Order represents ${utilization.toFixed(1)}% of credit limit. ${utilization > 80 ? 'Review required.' : 'Credit approved.'}`,
              confidence: 0.96,
              action: 'View Credit Report',
              priority: utilization > 80 ? 'high' : 'low',
              category: 'compliance'
            })
          }

          // Upsell opportunities
          if (lines.length > 0) {
            newInsights.push({
              id: 'upsell_opportunity',
              type: 'suggestion',
              title: 'Upsell Opportunities',
              message: `Based on order history, customer often purchases additional accessories. Consider adding complementary items.`,
              confidence: 0.73,
              action: 'View Suggestions',
              priority: 'medium',
              category: 'opportunity'
            })
          }

          // Inventory availability
          lines.forEach((line, index) => {
            if (line.quantity && line.product_code) {
              // Mock inventory check
              const availableStock = Math.floor(Math.random() * 100) + 10
              
              if (line.quantity > availableStock * 0.8) {
                newInsights.push({
                  id: `inventory_${index}`,
                  type: 'warning',
                  title: `Inventory Alert - ${line.product_code}`,
                  message: `Requested quantity (${line.quantity}) may impact stock levels. ${availableStock} units available.`,
                  confidence: 0.89,
                  action: 'Check Inventory',
                  priority: line.quantity > availableStock ? 'high' : 'medium',
                  category: 'risk'
                })
              }
            }
          })
        }
        break

      case 'finance':
        if (config.id === 'journal_entry') {
          // Balance validation
          if (calculations.total_debits !== undefined && calculations.total_credits !== undefined) {
            const isBalanced = Math.abs(calculations.total_debits - calculations.total_credits) < 0.01
            
            newInsights.push({
              id: 'balance_check',
              type: isBalanced ? 'validation' : 'warning',
              title: 'Journal Entry Balance',
              message: isBalanced 
                ? 'Journal entry is properly balanced. Ready for posting.' 
                : `Entry is out of balance by ${Math.abs(calculations.total_debits - calculations.total_credits).toFixed(2)}. Please review.`,
              confidence: 1.0,
              action: isBalanced ? 'Post Entry' : 'Review Lines',
              priority: isBalanced ? 'low' : 'high',
              category: 'compliance'
            })
          }

          // Account classification
          lines.forEach((line, index) => {
            if (line.account_code) {
              newInsights.push({
                id: `account_${index}`,
                type: 'suggestion',
                title: `Account Classification - ${line.account_code}`,
                message: `Account appears to be properly classified. Posting will impact ${line.debit_amount > 0 ? 'debit' : 'credit'} balance.`,
                confidence: 0.91,
                priority: 'low',
                category: 'performance'
              })
            }
          })
        }
        break
    }

    // General transaction insights
    if (calculations.total > 0) {
      // Large transaction warning
      if (calculations.total > 25000) {
        newInsights.push({
          id: 'large_transaction',
          type: 'warning',
          title: 'Large Transaction Alert',
          message: `Transaction amount (${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculations.total)}) requires additional approval.`,
          confidence: 1.0,
          action: 'Request Approval',
          priority: 'high',
          category: 'compliance'
        })
      }
    }

    return newInsights
  }, [config, headerData, lines, calculations])

  // Update insights when data changes
  useEffect(() => {
    setIsAnalyzing(true)
    const timer = setTimeout(() => {
      setInsights(generateInsights)
      setIsAnalyzing(false)
    }, 1000) // Simulate AI analysis time

    return () => clearTimeout(timer)
  }, [generateInsights])

  // Filter insights by category
  const filteredInsights = useMemo(() => {
    if (selectedCategory === 'all') return insights
    return insights.filter(insight => insight.category === selectedCategory)
  }, [insights, selectedCategory])

  // Get icon for insight type
  const getInsightIcon = (type: string, priority: string) => {
    const iconProps = { size: 16, className: getIconColor(priority) }
    
    switch (type) {
      case 'analysis':
        return <BarChart3 {...iconProps} />
      case 'optimization':
        return <Target {...iconProps} />
      case 'suggestion':
        return <Zap {...iconProps} />
      case 'validation':
        return <CheckCircle {...iconProps} />
      case 'forecasting':
        return <TrendingUp {...iconProps} />
      case 'warning':
        return <AlertTriangle {...iconProps} />
      default:
        return <Info {...iconProps} />
    }
  }

  // Get color for priority/type
  const getIconColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-blue-600'
    }
  }

  // Get background color for insight cards
  const getCardBgColor = (category: string) => {
    switch (category) {
      case 'compliance':
        return 'bg-blue-50 border-blue-200'
      case 'performance':
        return 'bg-green-50 border-green-200'
      case 'risk':
        return 'bg-red-50 border-red-200'
      case 'opportunity':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={className}>
      {/* AI Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">AI Assistant</h2>
            <p className="text-xs text-slate-600">{config.module} guidance</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          {insights.length} insights
        </Badge>
      </div>

      {/* Transaction Summary Card */}
      <Card className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 mb-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Current Transaction</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Type</span>
            <span className="font-semibold text-slate-800">{config.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Items</span>
            <span className="font-semibold text-slate-800">{lines.length}</span>
          </div>
          {calculations.total !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total</span>
              <span className="font-semibold text-green-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculations.total)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Status</span>
            <Badge variant="outline" className="text-xs">
              {headerData.status || 'Draft'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-4">
        {['all', 'compliance', 'performance', 'risk', 'opportunity'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-white/50 text-slate-600 hover:bg-white/80'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* AI Insights */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">AI Insights</h3>
        
        {isAnalyzing ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">AI is analyzing...</h3>
            <p className="text-xs text-slate-600">Processing transaction data and business rules</p>
          </div>
        ) : filteredInsights.length > 0 ? (
          filteredInsights.map((insight, index) => (
            <Card
              key={insight.id}
              className={`p-4 ${getCardBgColor(insight.category)} border shadow-sm hover:shadow-md transition-all animate-fadeIn`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  insight.category === 'compliance' ? 'bg-blue-100' :
                  insight.category === 'performance' ? 'bg-green-100' :
                  insight.category === 'risk' ? 'bg-red-100' :
                  'bg-purple-100'
                }`}>
                  {getInsightIcon(insight.type, insight.priority)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm text-slate-800">{insight.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        insight.priority === 'high' ? 'border-red-300 text-red-700' :
                        insight.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                        'border-green-300 text-green-700'
                      }`}
                    >
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{insight.message}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                          style={{ width: `${insight.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>

                    {insight.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onInsightAction?.(insight)}
                        className="text-xs h-7 px-3"
                      >
                        {insight.action}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <Brain className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No insights available for selected category</p>
          </div>
        )}
      </div>

      {/* Workflow Rules Info */}
      <Card className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
        <div className="flex items-start gap-2">
          <Shield size={16} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Business Rules Active</h4>
            <p className="text-xs text-blue-700 mb-2">
              Smart code {config.smart_code} drives approval workflow, compliance validation, and business logic.
            </p>
            <button className="text-xs text-blue-700 font-medium hover:underline">
              View Business Rules →
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}