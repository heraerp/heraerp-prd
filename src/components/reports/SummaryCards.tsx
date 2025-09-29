// ================================================================================
// REPORTS SUMMARY CARDS
// Smart Code: HERA.UI.REPORTS.SUMMARY.v1
// Big numbers display with trend indicators and drill-down support
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  ShoppingBag,
  Receipt,
  Users,
  Percent,
  Eye,
  ArrowUpRight
} from 'lucide-react'
import { ReportCalculations } from '@/lib/schemas/reports'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  value: number | string
  currency?: string
  locale?: string
  subtitle?: string
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  comparison?: {
    value: number
    label: string
    type: 'currency' | 'percentage' | 'number'
  }
  icon?: React.ReactNode
  variant?: 'default' | 'revenue' | 'expense' | 'neutral'
  isClickable?: boolean
  onClick?: () => void
  className?: string
}

export function SummaryCard({
  title,
  value,
  currency = 'AED',
  locale = 'en-AE',
  subtitle,
  trend,
  comparison,
  icon,
  variant = 'default',
  isClickable = false,
  onClick,
  className
}: SummaryCardProps) {
  const formatValue = (
    val: number | string,
    type: 'currency' | 'percentage' | 'number' = 'currency'
  ) => {
    if (typeof val === 'string') return val

    switch (type) {
      case 'currency':
        return ReportCalculations.formatCurrency(val, currency, locale)
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'number':
        return val.toLocaleString(locale)
      default:
        return val.toString()
    }
  }

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />
      case 'down':
        return <TrendingDown className="h-3 w-3" />
      case 'neutral':
        return <Minus className="h-3 w-3" />
    }
  }

  const getTrendColor = (direction: 'up' | 'down' | 'neutral', isRevenue: boolean = true) => {
    switch (direction) {
      case 'up':
        return isRevenue ? 'text-emerald-600' : 'text-red-600'
      case 'down':
        return isRevenue ? 'text-red-600' : 'text-emerald-600'
      case 'neutral':
        return 'text-gray-500'
    }
  }

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'revenue':
        return 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800'
      case 'expense':
        return 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800'
      case 'neutral':
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/30 border-violet-200 dark:border-violet-800'
    }
  }

  const CardWrapper = isClickable ? Button : 'div'
  const cardProps = isClickable
    ? {
        variant: 'ghost' as const,
        onClick,
        className: cn(
          'h-auto p-0 hover:bg-transparent',
          isClickable && 'cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md',
          className
        )
      }
    : { className }

  return (
    <CardWrapper {...cardProps}>
      <Card
        className={cn(
          'relative overflow-hidden transition-all',
          getVariantStyles(variant),
          isClickable && 'hover:shadow-lg',
          className
        )}
      >
        {isClickable && (
          <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="h-4 w-4 dark:ink-muted" />
          </div>
        )}

        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium ink dark:text-gray-300">
            <span className="flex items-center gap-2">
              {icon}
              {title}
            </span>
            {isClickable && <Eye className="h-3 w-3 ink-muted" />}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2">
            {/* Main Value */}
            <div className="text-2xl font-bold !ink dark:!text-gray-100">
              {typeof value === 'number' ? formatValue(value) : value}
            </div>

            {/* Subtitle */}
            {subtitle && <p className="text-xs dark:ink-muted">{subtitle}</p>}

            {/* Trend Indicator */}
            {trend && (
              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs px-1.5 py-0.5',
                    getTrendColor(trend.direction, variant === 'revenue')
                  )}
                >
                  {getTrendIcon(trend.direction)}
                  <span className="ml-1">
                    {trend.value > 0 ? '+' : ''}
                    {trend.value.toFixed(1)}%
                  </span>
                </Badge>
                <span className="text-xs dark:ink-muted">{trend.label}</span>
              </div>
            )}

            {/* Comparison */}
            {comparison && (
              <div className="text-xs dark:ink-muted">
                vs {formatValue(comparison.value, comparison.type)} {comparison.label}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  )
}

// Sales Summary Cards Component
interface SalesSummaryCardsProps {
  summary: {
    total_gross: number
    total_net: number
    total_vat: number
    total_tips?: number
    total_service: number
    total_product: number
    transaction_count: number
    average_ticket: number
    service_mix_percent?: number
    product_mix_percent?: number
  }
  currency?: string
  locale?: string
  onDrillDown?: (type: 'service' | 'product' | 'vat' | 'tips') => void
  className?: string
}

export function SalesSummaryCards({
  summary,
  currency = 'AED',
  locale = 'en-AE',
  onDrillDown,
  className
}: SalesSummaryCardsProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {/* Gross Revenue */}
      <SummaryCard
        title="Gross Revenue"
        value={summary.total_gross}
        currency={currency}
        locale={locale}
        subtitle="Total sales including VAT"
        icon={<DollarSign className="h-4 w-4" />}
        variant="revenue"
        isClickable={!!onDrillDown}
        onClick={() => onDrillDown?.('service')} // Generic drill-down
      />

      {/* Net Revenue */}
      <SummaryCard
        title="Net Revenue"
        value={summary.total_net}
        currency={currency}
        locale={locale}
        subtitle="Revenue excluding VAT"
        icon={<Receipt className="h-4 w-4" />}
        variant="revenue"
      />

      {/* Service Revenue */}
      <SummaryCard
        title="Service Revenue"
        value={summary.total_service}
        currency={currency}
        locale={locale}
        subtitle={`${summary.service_mix_percent?.toFixed(1) || '0'}% of total sales`}
        icon={<Users className="h-4 w-4" />}
        variant="default"
        isClickable={!!onDrillDown}
        onClick={() => onDrillDown?.('service')}
      />

      {/* Product Revenue */}
      <SummaryCard
        title="Product Revenue"
        value={summary.total_product}
        currency={currency}
        locale={locale}
        subtitle={`${summary.product_mix_percent?.toFixed(1) || '0'}% of total sales`}
        icon={<ShoppingBag className="h-4 w-4" />}
        variant="default"
        isClickable={!!onDrillDown}
        onClick={() => onDrillDown?.('product')}
      />

      {/* VAT Collected */}
      <SummaryCard
        title="VAT Collected"
        value={summary.total_vat}
        currency={currency}
        locale={locale}
        subtitle="5% VAT on sales"
        icon={<Percent className="h-4 w-4" />}
        variant="neutral"
        isClickable={!!onDrillDown}
        onClick={() => onDrillDown?.('vat')}
      />

      {/* Tips (if available) */}
      {summary.total_tips !== undefined && (
        <SummaryCard
          title="Tips Collected"
          value={summary.total_tips}
          currency={currency}
          locale={locale}
          subtitle="Staff tips and gratuities"
          icon={<DollarSign className="h-4 w-4" />}
          variant="neutral"
          isClickable={!!onDrillDown}
          onClick={() => onDrillDown?.('tips')}
        />
      )}

      {/* Transaction Count */}
      <SummaryCard
        title="Transactions"
        value={summary.transaction_count.toLocaleString(locale)}
        subtitle="Total number of sales"
        icon={<Receipt className="h-4 w-4" />}
        variant="neutral"
      />

      {/* Average Ticket */}
      <SummaryCard
        title="Average Ticket"
        value={summary.average_ticket}
        currency={currency}
        locale={locale}
        subtitle="Revenue per transaction"
        icon={<DollarSign className="h-4 w-4" />}
        variant="default"
      />
    </div>
  )
}

// Financial Summary Cards Component
interface FinancialSummaryCardsProps {
  summary: {
    total_revenue?: number
    total_cogs?: number
    gross_profit?: number
    gross_margin_percent?: number
    total_expenses?: number
    operating_profit?: number
    operating_margin_percent?: number
    net_income?: number
    net_margin_percent?: number

    // Balance Sheet specific
    total_assets?: number
    total_liabilities?: number
    total_equity?: number
    current_ratio?: number
    debt_to_equity?: number

    balance_check?: {
      is_balanced: boolean
      difference: number
    }
  }
  reportType: 'pnl' | 'balance_sheet'
  currency?: string
  locale?: string
  onDrillDown?: (group: string) => void
  className?: string
}

export function FinancialSummaryCards({
  summary,
  reportType,
  currency = 'AED',
  locale = 'en-AE',
  onDrillDown,
  className
}: FinancialSummaryCardsProps) {
  if (reportType === 'pnl') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        <SummaryCard
          title="Total Revenue"
          value={summary.total_revenue || 0}
          currency={currency}
          locale={locale}
          subtitle="Gross sales revenue"
          icon={<DollarSign className="h-4 w-4" />}
          variant="revenue"
          isClickable={!!onDrillDown}
          onClick={() => onDrillDown?.('revenue')}
        />

        <SummaryCard
          title="Gross Profit"
          value={summary.gross_profit || 0}
          currency={currency}
          locale={locale}
          subtitle={`${summary.gross_margin_percent?.toFixed(1) || '0'}% margin`}
          icon={<TrendingUp className="h-4 w-4" />}
          variant="revenue"
        />

        <SummaryCard
          title="Operating Profit"
          value={summary.operating_profit || 0}
          currency={currency}
          locale={locale}
          subtitle={`${summary.operating_margin_percent?.toFixed(1) || '0'}% margin`}
          icon={<TrendingUp className="h-4 w-4" />}
          variant="default"
        />

        <SummaryCard
          title="Net Income"
          value={summary.net_income || 0}
          currency={currency}
          locale={locale}
          subtitle={`${summary.net_margin_percent?.toFixed(1) || '0'}% margin`}
          icon={
            summary.net_income && summary.net_income >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )
          }
          variant={summary.net_income && summary.net_income >= 0 ? 'revenue' : 'expense'}
        />
      </div>
    )
  }

  // Balance Sheet cards
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      <SummaryCard
        title="Total Assets"
        value={summary.total_assets || 0}
        currency={currency}
        locale={locale}
        subtitle="Current + Non-current"
        icon={<DollarSign className="h-4 w-4" />}
        variant="neutral"
        isClickable={!!onDrillDown}
        onClick={() => onDrillDown?.('assets')}
      />

      <SummaryCard
        title="Total Liabilities"
        value={summary.total_liabilities || 0}
        currency={currency}
        locale={locale}
        subtitle="Current + Non-current"
        icon={<Receipt className="h-4 w-4" />}
        variant="expense"
        isClickable={!!onDrillDown}
        onClick={() => onDrillDown?.('liabilities')}
      />

      <SummaryCard
        title="Total Equity"
        value={summary.total_equity || 0}
        currency={currency}
        locale={locale}
        subtitle="Owner's equity"
        icon={<TrendingUp className="h-4 w-4" />}
        variant="revenue"
        isClickable={!!onDrillDown}
        onClick={() => onDrillDown?.('equity')}
      />

      <SummaryCard
        title="Balance Check"
        value={summary.balance_check?.is_balanced ? '✅ Balanced' : '⚠️ Unbalanced'}
        subtitle={
          summary.balance_check?.is_balanced
            ? 'Assets = Liabilities + Equity'
            : `Difference: ${ReportCalculations.formatCurrency(summary.balance_check?.difference || 0, currency, locale)}`
        }
        icon={
          summary.balance_check?.is_balanced ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )
        }
        variant={summary.balance_check?.is_balanced ? 'revenue' : 'expense'}
      />

      {/* Financial Ratios */}
      {summary.current_ratio && (
        <SummaryCard
          title="Current Ratio"
          value={`${summary.current_ratio.toFixed(2)}:1`}
          subtitle="Current Assets / Current Liabilities"
          icon={<Percent className="h-4 w-4" />}
          variant={
            summary.current_ratio >= 2
              ? 'revenue'
              : summary.current_ratio >= 1
                ? 'default'
                : 'expense'
          }
        />
      )}

      {summary.debt_to_equity && (
        <SummaryCard
          title="Debt-to-Equity"
          value={`${summary.debt_to_equity.toFixed(2)}:1`}
          subtitle="Total Liabilities / Total Equity"
          icon={<Percent className="h-4 w-4" />}
          variant={
            summary.debt_to_equity <= 1
              ? 'revenue'
              : summary.debt_to_equity <= 2
                ? 'default'
                : 'expense'
          }
        />
      )}
    </div>
  )
}
