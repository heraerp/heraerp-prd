/**
 * HERA Dashboard-Specific Formatters
 *
 * Specialized presentation formatters for finance dashboard UCRs
 * Provides interactive, real-time dashboard components
 *
 * @module HERA.URP.FORMATTERS.DASHBOARD.V1
 */

import { FormatterOptions, FormattedResult } from '../types/report-types'

export interface DashboardFormatterOptions extends FormatterOptions {
  include_sparklines?: boolean
  include_charts?: boolean
  highlight_variances?: boolean
  comparison_type?: 'period' | 'budget' | 'forecast'
  alert_thresholds?: {
    [key: string]: {
      warning: number
      critical: number
    }
  }
}

/**
 * Format cashflow data for dashboard display
 */
export function formatCashflowDashboard(
  data: any,
  options: DashboardFormatterOptions
): FormattedResult {
  const { current_period, historical, forecast, benchmarks, kpis, details } = data

  return {
    summary_cards: [
      {
        id: 'net_cash_flow',
        title: 'Net Cash Flow',
        value: kpis.net_cash_flow,
        format: 'currency',
        trend: calculateTrend(kpis.net_cash_flow, historical),
        status: getStatus(kpis.net_cash_flow, options.alert_thresholds?.net_cash_flow),
        sparkline: options.include_sparklines
          ? generateSparklineData(historical, 'net_cash_flow')
          : null,
        smart_code: 'HERA.FIN.KPI.CASH.POSITION.V1'
      },
      {
        id: 'cash_runway',
        title: 'Cash Runway',
        value: kpis.cash_runway_days,
        format: 'days',
        subtitle: `${kpis.cash_runway_days} days remaining`,
        status:
          kpis.cash_runway_days < 90
            ? 'critical'
            : kpis.cash_runway_days < 180
              ? 'warning'
              : 'healthy',
        smart_code: 'HERA.GUI.DASH.CARD.RUNWAY.V1'
      },
      {
        id: 'operating_margin',
        title: 'Operating Cash Margin',
        value: kpis.operating_cash_margin * 100,
        format: 'percentage',
        benchmark: benchmarks?.operating_cash_margin * 100,
        benchmark_label: 'Industry Avg',
        status:
          kpis.operating_cash_margin >= benchmarks?.operating_cash_margin ? 'healthy' : 'warning',
        smart_code: 'HERA.FIN.KPI.GROSS.MARGIN.V1'
      },
      {
        id: 'burn_rate',
        title: 'Daily Burn Rate',
        value: kpis.cash_burn_rate,
        format: 'currency',
        subtitle: 'Per day',
        trend: calculateTrend(kpis.cash_burn_rate, historical, true), // Inverse - lower is better
        smart_code: 'HERA.FIN.KPI.BURN.RATE.V1'
      }
    ],

    activity_breakdown: {
      title: 'Cash Flow Activities',
      data: [
        {
          category: 'Operating Activities',
          amount: kpis.operating_cash_flow,
          percentage: calculatePercentage(kpis.operating_cash_flow, kpis.net_cash_flow),
          items: formatActivityItems(details.operating),
          smart_code: 'HERA.FIN.REPORT.CASHFLOW.OPERATING.V1'
        },
        {
          category: 'Investing Activities',
          amount: details.investing.reduce((sum: number, t: any) => sum + t.amount, 0),
          percentage: calculatePercentage(
            details.investing.reduce((sum: number, t: any) => sum + t.amount, 0),
            kpis.net_cash_flow
          ),
          items: formatActivityItems(details.investing),
          smart_code: 'HERA.FIN.REPORT.CASHFLOW.INVESTING.V1'
        },
        {
          category: 'Financing Activities',
          amount: details.financing.reduce((sum: number, t: any) => sum + t.amount, 0),
          percentage: calculatePercentage(
            details.financing.reduce((sum: number, t: any) => sum + t.amount, 0),
            kpis.net_cash_flow
          ),
          items: formatActivityItems(details.financing),
          smart_code: 'HERA.FIN.REPORT.CASHFLOW.FINANCING.V1'
        }
      ]
    },

    trend_chart: options.include_charts
      ? {
          title: 'Cash Flow Trend',
          type: 'line',
          data: formatTrendChartData(historical, forecast),
          options: {
            show_forecast: true,
            show_confidence_bands: true,
            interactive: true
          },
          smart_code: 'HERA.GUI.DASH.CHART.CASHFLOW.V1'
        }
      : null,

    forecast_section: forecast
      ? {
          title: 'Cash Flow Forecast',
          periods: forecast.map((f: any) => ({
            period: f.period,
            amount: f.forecast_amount,
            confidence: f.confidence,
            variance_band: {
              upper: f.forecast_amount * 1.1,
              lower: f.forecast_amount * 0.9
            }
          })),
          smart_code: 'HERA.FIN.REPORT.CASHFLOW.FORECAST.V1'
        }
      : null,

    benchmark_comparison: benchmarks
      ? {
          title: 'Industry Benchmarks',
          your_score: benchmarks.peer_comparison.your_performance,
          scores: [
            {
              label: 'Your Performance',
              value: benchmarks.peer_comparison.your_performance * 100,
              format: 'percentage',
              highlight: true
            },
            {
              label: 'Industry Average',
              value: benchmarks.peer_comparison.industry_average * 100,
              format: 'percentage'
            },
            {
              label: 'Top Quartile',
              value: benchmarks.peer_comparison.top_quartile * 100,
              format: 'percentage'
            }
          ],
          metrics: [
            {
              metric: 'Cash Conversion Cycle',
              value: benchmarks.cash_conversion_cycle,
              unit: 'days',
              benchmark: 7,
              status: benchmarks.cash_conversion_cycle <= 7 ? 'healthy' : 'warning'
            },
            {
              metric: 'Days Sales Outstanding',
              value: benchmarks.days_sales_outstanding,
              unit: 'days',
              benchmark: 30,
              status: benchmarks.days_sales_outstanding <= 30 ? 'healthy' : 'warning'
            }
          ],
          smart_code: 'HERA.GUI.DASH.SECTION.BENCHMARK.V1'
        }
      : null,

    alerts: generateAlerts(kpis, options.alert_thresholds),

    refresh_metadata: {
      last_updated: new Date().toISOString(),
      next_refresh: new Date(Date.now() + 300000).toISOString(), // 5 minutes
      auto_refresh: true,
      smart_code: 'HERA.GUI.DASH.META.REFRESH.V1'
    }
  }
}

/**
 * Format financial KPIs for dashboard cards
 */
export function formatKPIDashboard(
  kpiData: any,
  options: DashboardFormatterOptions
): FormattedResult {
  return {
    kpi_grid: [
      {
        id: 'revenue',
        title: 'Revenue',
        primary_value: kpiData.revenue_run_rate.monthly_run_rate,
        primary_label: 'Monthly Run Rate',
        secondary_value: kpiData.revenue_run_rate.annual_run_rate,
        secondary_label: 'Annual Run Rate',
        format: 'currency',
        trend: 'up',
        trend_value: 15.2,
        trend_label: 'vs last month',
        smart_code: 'HERA.FIN.KPI.REVENUE.RUNRATE.V1'
      },
      {
        id: 'gross_margin',
        title: 'Gross Margin',
        primary_value: kpiData.gross_margin.gross_margin_percent,
        primary_label: 'Margin %',
        secondary_value: kpiData.gross_margin.gross_profit,
        secondary_label: 'Gross Profit',
        format: 'percentage',
        status: kpiData.gross_margin.gross_margin_percent >= 60 ? 'healthy' : 'warning',
        smart_code: 'HERA.FIN.KPI.GROSS.MARGIN.V1'
      },
      {
        id: 'cash_position',
        title: 'Cash Position',
        primary_value: kpiData.cash_position.total_cash,
        primary_label: 'Total Cash',
        secondary_value: kpiData.cash_position.accounts.length,
        secondary_label: 'Accounts',
        format: 'currency',
        breakdown: kpiData.cash_position.accounts,
        smart_code: 'HERA.FIN.KPI.CASH.POSITION.V1'
      },
      {
        id: 'working_capital',
        title: 'Working Capital',
        primary_value: kpiData.working_capital.working_capital,
        primary_label: 'Net Working Capital',
        secondary_value: kpiData.working_capital.current_ratio,
        secondary_label: 'Current Ratio',
        format: 'currency',
        status: kpiData.working_capital.current_ratio >= 1.5 ? 'healthy' : 'warning',
        smart_code: 'HERA.FIN.KPI.WORKING.CAPITAL.V1'
      }
    ],

    mini_charts: options.include_charts ? generateMiniCharts(kpiData) : null,

    quick_actions: [
      {
        label: 'View Full Report',
        action: 'view_report',
        smart_code: 'HERA.GUI.ACTION.VIEW.REPORT.V1'
      },
      {
        label: 'Export Dashboard',
        action: 'export_dashboard',
        smart_code: 'HERA.GUI.ACTION.EXPORT.DASHBOARD.V1'
      },
      {
        label: 'Configure Alerts',
        action: 'configure_alerts',
        smart_code: 'HERA.GUI.ACTION.CONFIG.ALERTS.V1'
      }
    ]
  }
}

// Helper functions

function calculateTrend(current: number, historical: any[], inverse = false): any {
  if (!historical || historical.length === 0) return null

  const previous = historical[0]?.data?.total || 0
  const change = current - previous
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0

  return {
    direction: inverse ? (change < 0 ? 'up' : 'down') : change > 0 ? 'up' : 'down',
    value: Math.abs(changePercent),
    label: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`
  }
}

function getStatus(value: number, thresholds?: any): string {
  if (!thresholds) return 'normal'

  if (value <= thresholds.critical) return 'critical'
  if (value <= thresholds.warning) return 'warning'
  return 'healthy'
}

function generateSparklineData(historical: any[], metric: string): number[] {
  return historical.map(h => h.data[metric] || 0).reverse()
}

function calculatePercentage(part: number, whole: number): number {
  return whole !== 0 ? Math.round((part / whole) * 100) : 0
}

function formatActivityItems(activities: any[]): any[] {
  return activities
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 5)
    .map(activity => ({
      name: activity.description || activity.transaction_type,
      amount: activity.amount,
      count: activity.count || 1
    }))
}

function formatTrendChartData(historical: any[], forecast: any[]): any {
  const historicalData = historical.map(h => ({
    x: h.period,
    y: h.data.total || 0,
    type: 'actual'
  }))

  const forecastData =
    forecast?.map(f => ({
      x: f.period,
      y: f.forecast_amount,
      type: 'forecast',
      confidence: f.confidence
    })) || []

  return [...historicalData, ...forecastData]
}

function generateAlerts(kpis: any, thresholds: any): any[] {
  const alerts = []

  if (kpis.cash_runway_days < 90) {
    alerts.push({
      type: 'critical',
      message: `Cash runway critically low: ${kpis.cash_runway_days} days`,
      smart_code: 'HERA.GUI.DASH.ALERT.THRESHOLD.V1'
    })
  }

  if (kpis.operating_cash_margin < 0.1) {
    alerts.push({
      type: 'warning',
      message: `Operating cash margin below 10%: ${(kpis.operating_cash_margin * 100).toFixed(1)}%`,
      smart_code: 'HERA.GUI.DASH.ALERT.THRESHOLD.V1'
    })
  }

  return alerts
}

function generateMiniCharts(kpiData: any): any[] {
  return [
    {
      id: 'revenue_trend',
      type: 'sparkline',
      data: [100, 110, 108, 115, 120, 118, 125], // Sample data
      color: '#10B981',
      smart_code: 'HERA.GUI.CHART.SPARK.REVENUE.V1'
    },
    {
      id: 'cash_trend',
      type: 'sparkline',
      data: [200, 195, 185, 190, 188, 192, 195], // Sample data
      color: '#3B82F6',
      smart_code: 'HERA.GUI.CHART.SPARK.CASH.V1'
    }
  ]
}

// Export formatters
export const dashboardFormatters = {
  cashflow: formatCashflowDashboard,
  kpis: formatKPIDashboard
}
