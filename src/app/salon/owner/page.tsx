'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  UserCheck,
  DollarSign,
  Package,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface KPIData {
  monthlyRevenue: { amount: number; growth: number }
  todaysAppointments: { count: number }
  activeCustomers: { count: number; growth: number }
  staffMembers: { count: number }
  totalExpenses: { amount: number; growth: number }
  lowStockItems: { count: number }
}

interface FinancialData {
  month_name: string
  month_start: string
  total_revenue_aed: number
  total_expenses_aed: number
  net_profit_aed: number
  profit_margin_percentage: number
  top_services_revenue_aed: number
  top_products_revenue_aed: number
}

interface InventoryItem {
  product_id: string
  product_name: string
  current_stock: number
  reorder_level: number
  unit_of_measure: string
  stock_status: 'low' | 'out_of_stock' | 'normal'
}

export default function OwnerDashboard() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [financialData, setFinancialData] = useState<FinancialData[]>([])
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch KPIs
      const kpiResponse = await fetch('/api/dashboard/kpis')
      if (!kpiResponse.ok) throw new Error('Failed to fetch KPIs')
      const kpiData = await kpiResponse.json()
      setKpiData(kpiData)

      // Fetch Financial Data
      const financialResponse = await fetch('/api/dashboard/financial')
      if (!financialResponse.ok) throw new Error('Failed to fetch financial data')
      const financialData = await financialResponse.json()
      setFinancialData(financialData)

      // Fetch Inventory Data
      const inventoryResponse = await fetch('/api/dashboard/inventory')
      if (!inventoryResponse.ok) throw new Error('Failed to fetch inventory data')
      const inventoryData = await inventoryResponse.json()
      setInventoryData(
        inventoryData.filter(
          (item: InventoryItem) =>
            item.stock_status === 'low' || item.stock_status === 'out_of_stock'
        )
      )

      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch and auto-refresh every 5 minutes
  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format percentage with arrow
  const formatGrowth = (percentage: number) => {
    const isPositive = percentage >= 0
    return (
      <span
        className="flex items-center"
        style={{
          color: isPositive ? '#0F6F5C' : '#FF6B6B'
        }}
      >
        {isPositive ? (
          <TrendingUp className="w-4 h-4 mr-1" />
        ) : (
          <TrendingDown className="w-4 h-4 mr-1" />
        )}
        {Math.abs(percentage).toFixed(1)}%
      </span>
    )
  }

  // Chart data for revenue trends
  const revenueChartData = {
    labels: financialData.map(d => d.month_name).slice(-6),
    datasets: [
      {
        label: 'Revenue',
        data: financialData.map(d => d.total_revenue_aed).slice(-6),
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        tension: 0.4,
        borderWidth: 2
      },
      {
        label: 'Expenses',
        data: financialData.map(d => d.total_expenses_aed).slice(-6),
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.4,
        borderWidth: 2
      },
      {
        label: 'Net Profit',
        data: financialData.map(d => d.net_profit_aed).slice(-6),
        borderColor: '#0F6F5C',
        backgroundColor: 'rgba(15, 111, 92, 0.1)',
        tension: 0.4,
        borderWidth: 2
      }
    ]
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#B8B8B8',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 26, 0.9)',
        titleColor: '#F5E6C8',
        bodyColor: '#B8B8B8',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#B8B8B8'
        },
        grid: {
          color: 'rgba(184, 184, 184, 0.1)'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#B8B8B8',
          callback: function (value) {
            return formatCurrency(Number(value))
          }
        },
        grid: {
          color: 'rgba(184, 184, 184, 0.1)'
        }
      }
    }
  }

  // Revenue breakdown chart data
  const latestMonth = financialData[financialData.length - 1]
  const revenueBreakdownData = latestMonth
    ? {
        labels: ['Services', 'Products'],
        datasets: [
          {
            data: [
              latestMonth.top_services_revenue_aed || 0,
              latestMonth.top_products_revenue_aed || 0
            ],
            backgroundColor: ['#D4AF37', '#0F6F5C'],
            borderWidth: 0
          }
        ]
      }
    : null

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#B8B8B8',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 26, 0.9)',
        titleColor: '#F5E6C8',
        bodyColor: '#B8B8B8',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderWidth: 1
      }
    }
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#1A1A1A' }}
      >
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#D4AF37' }} />
          <p style={{ color: '#B8B8B8' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#1A1A1A' }}
      >
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4" style={{ color: '#FF6B6B' }} />
          <p className="mb-4" style={{ color: '#FF6B6B' }}>
            {error}
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 rounded-lg transition-all duration-300"
            style={{
              backgroundColor: 'rgba(212, 175, 55, 0.2)',
              color: '#F5E6C8',
              border: '1px solid rgba(212, 175, 55, 0.3)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A1A1A' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#F5E6C8' }}>
                Welcome back, Michele
              </h1>
              <p style={{ color: '#B8B8B8' }}>
                Owner •{' '}
                {new Date().toLocaleDateString('en-AE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center px-4 py-2 text-sm transition-all duration-300 rounded-lg"
              style={{
                color: '#B8B8B8',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.2)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.2)'
                e.currentTarget.style.color = '#F5E6C8'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'rgba(212, 175, 55, 0.1)'
                e.currentTarget.style.color = '#B8B8B8'
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Last updated:{' '}
              {lastRefresh.toLocaleTimeString('en-AE', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Revenue */}
          <div
            className="p-6 rounded-xl transition-all duration-300"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }}
              >
                <DollarSign className="w-6 h-6" style={{ color: '#D4AF37' }} />
              </div>
              {kpiData && formatGrowth(kpiData.monthlyRevenue.growth)}
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#B8B8B8' }}>
              Monthly Revenue
            </h3>
            <p className="text-2xl font-bold mt-1" style={{ color: '#F5E6C8' }}>
              {kpiData && formatCurrency(kpiData.monthlyRevenue.amount)}
            </p>
          </div>

          {/* Today's Appointments */}
          <div
            className="p-6 rounded-xl transition-all duration-300"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(15, 111, 92, 0.2)' }}>
                <Calendar className="w-6 h-6" style={{ color: '#0F6F5C' }} />
              </div>
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#B8B8B8' }}>
              Today's Appointments
            </h3>
            <p className="text-2xl font-bold mt-1" style={{ color: '#F5E6C8' }}>
              {kpiData?.todaysAppointments.count || 0}
            </p>
          </div>

          {/* Active Customers */}
          <div
            className="p-6 rounded-xl transition-all duration-300"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(15, 111, 92, 0.2)' }}>
                <Users className="w-6 h-6" style={{ color: '#0F6F5C' }} />
              </div>
              {kpiData && kpiData.activeCustomers.growth > 0 && (
                <span className="text-sm" style={{ color: '#0F6F5C' }}>
                  +{kpiData.activeCustomers.growth} new
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#B8B8B8' }}>
              Active Customers
            </h3>
            <p className="text-2xl font-bold mt-1" style={{ color: '#F5E6C8' }}>
              {kpiData?.activeCustomers.count || 0}
            </p>
          </div>

          {/* Staff Members */}
          <div
            className="p-6 rounded-xl transition-all duration-300"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(140, 120, 83, 0.2)' }}
              >
                <UserCheck className="w-6 h-6" style={{ color: '#8C7853' }} />
              </div>
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#B8B8B8' }}>
              Staff Members
            </h3>
            <p className="text-2xl font-bold mt-1" style={{ color: '#F5E6C8' }}>
              {kpiData?.staffMembers.count || 0}
            </p>
          </div>

          {/* Total Expenses */}
          <div
            className="p-6 rounded-xl transition-all duration-300"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(255, 107, 107, 0.2)' }}
              >
                <DollarSign className="w-6 h-6" style={{ color: '#FF6B6B' }} />
              </div>
              {kpiData && formatGrowth(kpiData.totalExpenses.growth)}
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#B8B8B8' }}>
              Total Expenses
            </h3>
            <p className="text-2xl font-bold mt-1" style={{ color: '#F5E6C8' }}>
              {kpiData && formatCurrency(kpiData.totalExpenses.amount)}
            </p>
          </div>

          {/* Low Stock Items */}
          <div
            className="p-6 rounded-xl transition-all duration-300"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              border:
                kpiData && kpiData.lowStockItems.count > 0
                  ? '2px solid rgba(255, 107, 107, 0.5)'
                  : '1px solid rgba(212, 175, 55, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor:
                    kpiData && kpiData.lowStockItems.count > 0
                      ? 'rgba(255, 107, 107, 0.2)'
                      : 'rgba(184, 184, 184, 0.1)'
                }}
              >
                <Package
                  className="w-6 h-6"
                  style={{
                    color: kpiData && kpiData.lowStockItems.count > 0 ? '#FF6B6B' : '#B8B8B8'
                  }}
                />
              </div>
              {kpiData && kpiData.lowStockItems.count > 0 && (
                <span className="text-sm font-medium" style={{ color: '#FF6B6B' }}>
                  Alert
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium" style={{ color: '#B8B8B8' }}>
              Low Stock Items
            </h3>
            <p
              className="text-2xl font-bold mt-1"
              style={{
                color: kpiData && kpiData.lowStockItems.count > 0 ? '#FF6B6B' : '#F5E6C8'
              }}
            >
              {kpiData?.lowStockItems.count || 0}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Trends Chart */}
          <div
            className="lg:col-span-2 p-6 rounded-xl"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#F5E6C8' }}>
              Financial Trends
            </h2>
            <div className="h-64">
              {financialData.length > 0 && <Line data={revenueChartData} options={chartOptions} />}
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div
            className="p-6 rounded-xl"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#F5E6C8' }}>
              Revenue Breakdown
            </h2>
            <div className="h-64">
              {revenueBreakdownData && (
                <Doughnut data={revenueBreakdownData} options={doughnutOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alert Table */}
        {inventoryData.length > 0 && (
          <div
            className="p-6 rounded-xl"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.8)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <h2
              className="text-lg font-semibold mb-4 flex items-center"
              style={{ color: '#F5E6C8' }}
            >
              <AlertCircle className="w-5 h-5 mr-2" style={{ color: '#FF6B6B' }} />
              Inventory Alerts
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: '#B8B8B8' }}
                    >
                      Product
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: '#B8B8B8' }}
                    >
                      Current Stock
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: '#B8B8B8' }}
                    >
                      Reorder Level
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: '#B8B8B8' }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.map((item, index) => (
                    <tr
                      key={item.product_id}
                      style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        style={{ color: '#F5E6C8' }}
                      >
                        {item.product_name}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: '#B8B8B8' }}
                      >
                        {item.current_stock} {item.unit_of_measure}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm"
                        style={{ color: '#B8B8B8' }}
                      >
                        {item.reorder_level} {item.unit_of_measure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor:
                              item.stock_status === 'out_of_stock'
                                ? 'rgba(255, 107, 107, 0.2)'
                                : 'rgba(212, 175, 55, 0.2)',
                            color: item.stock_status === 'out_of_stock' ? '#FF6B6B' : '#D4AF37',
                            border: `1px solid ${
                              item.stock_status === 'out_of_stock'
                                ? 'rgba(255, 107, 107, 0.3)'
                                : 'rgba(212, 175, 55, 0.3)'
                            }`
                          }}
                        >
                          {item.stock_status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
