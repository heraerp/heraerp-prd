/**
 * Expense Categories Management Page
 * Auto-generated using Universal Configuration Manager
 * Enhanced with enterprise features for financial management
 */

'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { CONFIG_TYPES } from '@/lib/universal-config/config-types'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CurrencyDisplay } from '@/components/ui/currency-input'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function ExpenseCategoriesPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-6">
      <UniversalConfigManager
        config={CONFIG_TYPES.EXPENSE_CATEGORY}
        apiEndpoint="/api/v1/finance/expense-categories"
        additionalFields={[
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            defaultValue: ''
          },
          {
            name: 'gl_account_code',
            label: 'GL Account Code',
            type: 'text',
            defaultValue: '',
            required: true
          },
          {
            name: 'budget_limit',
            label: 'Monthly Budget Limit',
            type: 'currency',
            defaultValue: 0
          },
          {
            name: 'tax_deductible',
            label: 'Tax Deductible',
            type: 'checkbox',
            defaultValue: false
          },
          {
            name: 'requires_receipt',
            label: 'Requires Receipt',
            type: 'checkbox',
            defaultValue: true
          },
          {
            name: 'approval_required',
            label: 'Requires Approval',
            type: 'checkbox',
            defaultValue: false
          },
          {
            name: 'approval_threshold',
            label: 'Approval Threshold',
            type: 'currency',
            defaultValue: 1000
          },
          {
            name: 'category_type',
            label: 'Category Type',
            type: 'select',
            options: [
              { value: 'operating', label: 'Operating Expense' },
              { value: 'capital', label: 'Capital Expense' },
              { value: 'cost_of_goods', label: 'Cost of Goods Sold' },
              { value: 'other', label: 'Other Expense' }
            ],
            defaultValue: 'operating'
          }
        ]}
        customColumns={[
          {
            key: 'gl_account',
            header: 'GL Account',
            render: (item) => (
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                {item.gl_account_code || 'Not Set'}
              </code>
            )
          },
          {
            key: 'budget',
            header: 'Monthly Budget',
            render: (item) => (
              <CurrencyDisplay 
                value={item.budget_limit || 0} 
                className="font-medium"
              />
            )
          },
          {
            key: 'ytd_spending',
            header: 'YTD Spending',
            render: (item) => {
              const spending = item.ytd_spending || 0
              const budget = (item.budget_limit || 0) * 12
              const percentage = budget > 0 ? (spending / budget) * 100 : 0
              const isOverBudget = percentage > 100
              
              return (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CurrencyDisplay value={spending} />
                    {percentage > 80 && (
                      isOverBudget ? 
                        <TrendingUp className="w-4 h-4 text-destructive" /> :
                        <TrendingDown className="w-4 h-4 text-warning" />
                    )}
                  </div>
                  {budget > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}% of budget
                    </div>
                  )}
                </div>
              )
            }
          },
          {
            key: 'attributes',
            header: 'Attributes',
            render: (item) => (
              <div className="flex gap-1">
                {item.tax_deductible && (
                  <Badge variant="secondary" className="text-xs">
                    Tax Deductible
                  </Badge>
                )}
                {item.requires_receipt && (
                  <Badge variant="outline" className="text-xs">
                    Receipt Required
                  </Badge>
                )}
                {item.approval_required && (
                  <Badge variant="destructive" className="text-xs">
                    Approval Required
                  </Badge>
                )}
              </div>
            )
          }
        ]}
        onItemClick={(item) => {
          // Navigate to expense transactions filtered by this category
          router.push(`/finance/expenses?category=${item.entity_code}`)
        }}
        showAnalytics={true}
        analyticsConfig={{
          title: 'Expense Analytics',
          metrics: [
            {
              label: 'Total YTD Spending',
              value: (items) => {
                const total = items.reduce((sum, item) => 
                  sum + (item.ytd_spending || 0), 0
                )
                return <CurrencyDisplay value={total} className="text-2xl font-bold" />
              }
            },
            {
              label: 'Categories Over Budget',
              value: (items) => {
                const overBudget = items.filter(item => {
                  const spending = item.ytd_spending || 0
                  const budget = (item.budget_limit || 0) * 12
                  return budget > 0 && spending > budget
                }).length
                return (
                  <div className="text-2xl font-bold text-destructive">
                    {overBudget}
                  </div>
                )
              }
            },
            {
              label: 'Tax Deductible %',
              value: (items) => {
                const deductible = items.filter(item => item.tax_deductible).length
                const percentage = items.length > 0 ? 
                  (deductible / items.length) * 100 : 0
                return (
                  <div className="text-2xl font-bold">
                    {percentage.toFixed(0)}%
                  </div>
                )
              }
            }
          ]
        }}
      />
    </div>
  )
}