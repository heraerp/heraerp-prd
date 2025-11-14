'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/luxe-card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  Calculator,
  BarChart3,
  PieChart,
  Receipt,
  AlertCircle,
  CheckCircle,
  Calendar,
  Filter,
  Loader2,
  Building,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useLoadingCompletion } from '@/lib/hooks/useLoadingCompletion'

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#B794F4',
  emerald: '#0F6F5C',
  ruby: '#DC2626',
  sapphire: '#2563EB'
}

const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

interface FinancialMetric {
  label: string
  value: string
  change: number
  isPositive: boolean
  icon: React.ElementType
}

function FinancialCard({ metric }: { metric: FinancialMetric }) {
  const Icon = metric.icon

  return (
    <Card
      className="hover:scale-[1.02] transition-all duration-300"
      style={{
        backgroundColor: COLORS.charcoalLight,
        border: `1px solid ${COLORS.bronze}20`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p
              className="text-sm font-light tracking-wider uppercase mb-2"
              style={{ color: COLORS.bronze }}
            >
              {metric.label}
            </p>
            <p className="text-3xl font-light tracking-wide" style={{ color: COLORS.champagne }}>
              {metric.value}
            </p>
          </div>
          <div
            className="h-12 w-12 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
              boxShadow: `0 2px 10px ${COLORS.gold}40`
            }}
          >
            <Icon className="h-6 w-6" style={{ color: COLORS.black }} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {metric.isPositive ? (
            <ArrowUpRight className="h-4 w-4" style={{ color: COLORS.emerald }} />
          ) : (
            <ArrowDownRight className="h-4 w-4" style={{ color: COLORS.ruby }} />
          )}
          <span
            className="text-sm font-light"
            style={{
              color: metric.isPositive ? COLORS.emerald : COLORS.ruby
            }}
          >
            {Math.abs(metric.change)}% from last month
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ReportButton({
  icon: Icon,
  label,
  description,
  href,
  color = COLORS.gold
}: {
  icon: React.ElementType
  label: string
  description: string
  href: string
  color?: string
}) {
  return (
    <Link href={href}>
      <Card
        className="group cursor-pointer hover:scale-[1.02] transition-all duration-300"
        style={{
          backgroundColor: COLORS.charcoalLight,
          border: `1px solid ${COLORS.bronze}20`
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="h-12 w-12 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                backgroundColor: `${color}20`,
                color: color
              }}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-1" style={{ color: COLORS.champagne }}>
                {label}
              </h3>
              <p className="text-sm font-light" style={{ color: `${COLORS.bronze}90` }}>
                {description}
              </p>
            </div>
            <ArrowUpRight
              className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: COLORS.gold }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function AccountantDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentPeriod, setCurrentPeriod] = useState('December 2024')

  // ⚡ ENTERPRISE: Automatic loading completion using HERA hook
  useLoadingCompletion()

  const financialMetrics: FinancialMetric[] = [
    {
      label: 'Total Revenue',
      value: 'AED 165,420',
      change: 18.5,
      isPositive: true,
      icon: TrendingUp
    },
    {
      label: 'Net Profit',
      value: 'AED 48,230',
      change: 12.3,
      isPositive: true,
      icon: DollarSign
    },
    {
      label: 'Operating Expenses',
      value: 'AED 82,150',
      change: 5.2,
      isPositive: false,
      icon: Receipt
    },
    {
      label: 'VAT Collected',
      value: 'AED 8,271',
      change: 18.5,
      isPositive: true,
      icon: Calculator
    }
  ]

  useEffect(() => {
    checkAuth()
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const checkAuth = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session?.user) {
      router.push('/salon/auth')
      return
    }

    const userMetadata = session.user.user_metadata
    const userRole =
      userMetadata?.role?.toLowerCase() || localStorage.getItem('salonRole')?.toLowerCase()

    // Check organization
    if (userMetadata?.organization_id !== HAIRTALKZ_ORG_ID) {
      router.push('/salon/auth')
      return
    }

    // Check role
    if (userRole && userRole !== 'accountant') {
      // Redirect to appropriate dashboard based on role
      const redirectMap: Record<string, string> = {
        owner: '/salon/dashboard',
        receptionist: '/salon/receptionist',
        admin: '/salon/admin'
      }

      const redirectPath = redirectMap[userRole] || '/salon/auth'
      router.push(redirectPath)
      return
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.charcoal }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: COLORS.gold }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.charcoal }}>
      {/* Header */}
      <div
        className="border-b px-8 py-6"
        style={{
          backgroundColor: COLORS.charcoalLight,
          borderColor: `${COLORS.bronze}20`
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-light tracking-wider flex items-center gap-3"
              style={{ color: COLORS.champagne }}
            >
              <Calculator className="h-8 w-8" style={{ color: COLORS.gold }} />
              Financial Dashboard
            </h1>
            <p className="text-sm font-light mt-1" style={{ color: COLORS.bronze }}>
              {currentPeriod} • HairTalkz Salon Financial Overview
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="font-light"
              style={{
                borderColor: COLORS.bronze,
                color: COLORS.champagne
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Select Period
            </Button>

            <Button
              className="font-light"
              style={{
                backgroundColor: COLORS.gold,
                color: COLORS.black
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Reports
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {financialMetrics.map((metric, idx) => (
            <FinancialCard key={idx} metric={metric} />
          ))}
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Analysis */}
          <Card
            style={{
              backgroundColor: COLORS.charcoalLight,
              border: `1px solid ${COLORS.bronze}20`
            }}
          >
            <CardHeader>
              <CardTitle
                className="text-xl font-light tracking-wider flex items-center gap-3"
                style={{ color: COLORS.champagne }}
              >
                <BarChart3 className="h-5 w-5" style={{ color: COLORS.gold }} />
                Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: 'Hair Services', amount: 'AED 98,250', percentage: 59.4 },
                  { category: 'Product Sales', amount: 'AED 42,180', percentage: 25.5 },
                  { category: 'Treatment Services', amount: 'AED 18,990', percentage: 11.5 },
                  { category: 'Other Services', amount: 'AED 6,000', percentage: 3.6 }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-light" style={{ color: COLORS.lightText }}>
                        {item.category}
                      </span>
                      <span className="text-sm font-medium" style={{ color: COLORS.champagne }}>
                        {item.amount}
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: COLORS.charcoal }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          background: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                        }}
                      />
                    </div>
                    <p className="text-xs font-light mt-1" style={{ color: COLORS.bronze }}>
                      {item.percentage}% of total revenue
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Expense Summary */}
          <Card
            style={{
              backgroundColor: COLORS.charcoalLight,
              border: `1px solid ${COLORS.bronze}20`
            }}
          >
            <CardHeader>
              <CardTitle
                className="text-xl font-light tracking-wider flex items-center gap-3"
                style={{ color: COLORS.champagne }}
              >
                <PieChart className="h-5 w-5" style={{ color: COLORS.gold }} />
                Expense Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: 'Staff Salaries', amount: 'AED 48,500', trend: 'stable' },
                  { category: 'Product Inventory', amount: 'AED 15,200', trend: 'up' },
                  { category: 'Rent & Utilities', amount: 'AED 12,000', trend: 'stable' },
                  { category: 'Marketing', amount: 'AED 6,450', trend: 'down' }
                ].map((expense, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: COLORS.charcoal,
                      border: `1px solid ${COLORS.bronze}20`
                    }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: COLORS.lightText }}>
                        {expense.category}
                      </p>
                      <p className="text-sm font-light" style={{ color: COLORS.bronze }}>
                        {expense.amount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {expense.trend === 'up' && (
                        <TrendingUp className="h-4 w-4" style={{ color: COLORS.ruby }} />
                      )}
                      {expense.trend === 'down' && (
                        <TrendingDown className="h-4 w-4" style={{ color: COLORS.emerald }} />
                      )}
                      {expense.trend === 'stable' && (
                        <div className="h-0.5 w-4" style={{ backgroundColor: COLORS.bronze }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Reports */}
        <div className="mb-8">
          <h2
            className="text-xl font-light tracking-wider mb-6"
            style={{ color: COLORS.champagne }}
          >
            Financial Reports
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReportButton
              icon={FileText}
              label="Daily Sales Report"
              description="View today's sales performance and transactions"
              href="/salon/reports/branch-pnl"
              color={COLORS.emerald}
            />

            <ReportButton
              icon={BarChart3}
              label="Profit & Loss Statement"
              description="Monthly P&L analysis with comparisons"
              href="/salon-data/financials/p&l"
              color={COLORS.gold}
            />

            <ReportButton
              icon={Building}
              label="Balance Sheet"
              description="Assets, liabilities, and equity position"
              href="/salon-data/financials/bs"
              color={COLORS.sapphire}
            />

            <ReportButton
              icon={Receipt}
              label="VAT Report"
              description="UAE VAT compliance and filing report"
              href="/salon/finance"
              color={COLORS.plum}
            />

            <ReportButton
              icon={FileSpreadsheet}
              label="Cash Flow Statement"
              description="Monthly cash inflows and outflows"
              href="/salon/finance"
              color={COLORS.bronze}
            />

            <ReportButton
              icon={CreditCard}
              label="Payroll Report"
              description="Staff salaries and commission summary"
              href="/salon-data/payroll"
              color={COLORS.ruby}
            />
          </div>
        </div>

        {/* Pending Actions */}
        <Card
          style={{
            backgroundColor: COLORS.charcoalLight,
            border: `1px solid ${COLORS.bronze}20`
          }}
        >
          <CardHeader>
            <CardTitle
              className="text-xl font-light tracking-wider flex items-center gap-3"
              style={{ color: COLORS.champagne }}
            >
              <AlertCircle className="h-5 w-5" style={{ color: COLORS.gold }} />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { task: 'Review and approve December payroll', due: 'Due today', priority: 'high' },
                { task: 'Submit VAT return for November', due: 'Due in 3 days', priority: 'high' },
                { task: 'Reconcile bank statements', due: 'Due in 5 days', priority: 'medium' },
                { task: 'Update inventory valuation', due: 'Due in 7 days', priority: 'low' }
              ].map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{
                    backgroundColor: COLORS.charcoal,
                    border: `1px solid ${
                      action.priority === 'high' ? COLORS.ruby : COLORS.bronze
                    }20`
                  }}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle
                      className="h-5 w-5 mt-0.5"
                      style={{
                        color: action.priority === 'high' ? COLORS.ruby : COLORS.bronze
                      }}
                    />
                    <div>
                      <p style={{ color: COLORS.lightText }}>{action.task}</p>
                      <p className="text-sm font-light mt-1" style={{ color: COLORS.bronze }}>
                        {action.due}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-light"
                    style={{
                      borderColor: COLORS.bronze,
                      color: COLORS.champagne
                    }}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
