'use client'
/**
 * Quick Expense Grid Component
 * Smart Code: HERA.SALON.DIGITAL.ACCOUNTANT.EXPENSES.V1
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Zap,
  Home,
  Users,
  Car,
  Phone,
  Wifi,
  ShoppingBag,
  Sparkles,
  Receipt,
  CreditCard,
  DollarSign,
  TrendingUp,
  Coffee,
  Scissors
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpenseCategory {
  id: string
  name: string
  category: string
  icon: React.ElementType
  color: string
  commonAmounts?: number[]
  vatRate?: number
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    id: 'hair-products',
    name: 'Hair Products',
    category: 'Salon Supplies',
    icon: Package,
    color: 'text-purple-600',
    commonAmounts: [100, 250, 500],
    vatRate: 0.05
  },
  {
    id: 'color-supplies',
    name: 'Color & Chemicals',
    category: 'Salon Supplies',
    icon: Sparkles,
    color: 'text-pink-600',
    commonAmounts: [150, 300, 600]
  },
  {
    id: 'electricity',
    name: 'Electricity Bill',
    category: 'Utilities',
    icon: Zap,
    color: 'text-yellow-600',
    commonAmounts: [500, 750, 1000]
  },
  {
    id: 'rent',
    name: 'Shop Rent',
    category: 'Rent',
    icon: Home,
    color: 'text-primary',
    commonAmounts: [5000, 8000, 10000]
  },
  {
    id: 'staff-salary',
    name: 'Staff Salary',
    category: 'Payroll',
    icon: Users,
    color: 'text-green-600',
    commonAmounts: [2000, 3000, 5000]
  },
  {
    id: 'transport',
    name: 'Transport/Fuel',
    category: 'Transport',
    icon: Car,
    color: 'text-orange-600',
    commonAmounts: [50, 100, 200]
  },
  {
    id: 'phone-bill',
    name: 'Phone Bill',
    category: 'Utilities',
    icon: Phone,
    color: 'text-indigo-600',
    commonAmounts: [100, 150, 200]
  },
  {
    id: 'internet',
    name: 'Internet',
    category: 'Utilities',
    icon: Wifi,
    color: 'text-cyan-600',
    commonAmounts: [200, 300, 400]
  },
  {
    id: 'marketing',
    name: 'Marketing/Ads',
    category: 'Marketing',
    icon: TrendingUp,
    color: 'text-red-600',
    commonAmounts: [500, 1000, 2000]
  },
  {
    id: 'towels-supplies',
    name: 'Towels & Capes',
    category: 'Operating Supplies',
    icon: ShoppingBag,
    color: 'text-muted-foreground',
    commonAmounts: [100, 200, 300]
  },
  {
    id: 'refreshments',
    name: 'Client Refreshments',
    category: 'Hospitality',
    icon: Coffee,
    color: 'text-amber-600',
    commonAmounts: [50, 100, 150]
  },
  {
    id: 'equipment',
    name: 'Equipment/Tools',
    category: 'Equipment',
    icon: Scissors,
    color: 'text-teal-600',
    commonAmounts: [200, 500, 1000]
  }
]

interface QuickExpenseGridProps {
  onExpenseSelect: (expense: ExpenseCategory, amount?: number) => void
  selectedCategory?: string
}

export function QuickExpenseGrid({ onExpenseSelect, selectedCategory }: QuickExpenseGridProps) {
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null)

  const handleCategoryClick = (expense: ExpenseCategory) => {
    if (expandedCategory === expense.id) {
      setExpandedCategory(null)
    } else {
      setExpandedCategory(expense.id)
    }
  }

  const handleAmountClick = (expense: ExpenseCategory, amount: number) => {
    onExpenseSelect(expense, amount)
    setExpandedCategory(null)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {EXPENSE_CATEGORIES.map(expense => (
          <div key={expense.id} className="relative">
            <Button
              variant={selectedCategory === expense.id ? 'default' : 'outline'}
              className={cn(
                'w-full h-auto flex flex-col items-center justify-center p-4 space-y-2',
                'hover:scale-105 transition-transform duration-200',
                selectedCategory === expense.id && 'ring-2 ring-purple-600'
              )}
              onClick={() => handleCategoryClick(expense)}
            >
              <expense.icon className={cn('w-8 h-8', expense.color)} />
              <div className="text-center">
                <p className="font-medium text-sm">{expense.name}</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  {expense.category}
                </p>
              </div>
            </Button>

            {/* Quick amount selection */}
            {expandedCategory === expense.id && expense.commonAmounts && (
              <div className="absolute z-10 top-full mt-2 left-0 right-0 bg-background dark:bg-muted rounded-lg shadow-lg border border-border dark:border-border p-2">
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-2">
                  Common amounts:
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {expense.commonAmounts.map(amount => (
                    <Button
                      key={amount}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAmountClick(expense, amount)}
                      className="text-xs"
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onExpenseSelect(expense)
                    setExpandedCategory(null)
                  }}
                  className="w-full mt-2 text-xs"
                >
                  Custom Amount
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Category Summary */}
      {selectedCategory && (
        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {EXPENSE_CATEGORIES.find(e => e.id === selectedCategory)?.icon && (
                  <div className="p-2 bg-background dark:bg-muted rounded-lg">
                    {React.createElement(
                      EXPENSE_CATEGORIES.find(e => e.id === selectedCategory)!.icon,
                      {
                        className: cn(
                          'w-5 h-5',
                          EXPENSE_CATEGORIES.find(e => e.id === selectedCategory)?.color
                        )
                      }
                    )}
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {EXPENSE_CATEGORIES.find(e => e.id === selectedCategory)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Ready to record expense
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {EXPENSE_CATEGORIES.find(e => e.id === selectedCategory)?.category}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
