'use client'

/**
 * Enterprise Home Dashboard
 * Smart Code: HERA.ENTERPRISE.HOME.v1
 * 
 * HERA Fiori-inspired enterprise dashboard with insights widgets
 */

import React, { useState } from 'react'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Building2,
  Calculator,
  FileText,
  Settings,
  Plus,
  Eye,
  Grid3X3,
  ChevronRight
} from 'lucide-react'

export default function EnterpriseHome() {
  const [activeTab, setActiveTab] = useState<'apps' | 'insights' | 'reports'>('apps')

  // Enterprise metrics data
  const enterpriseMetrics = {
    totalRevenue: 12450000,
    totalAssets: 1247,
    activeUsers: 156,
    systemHealth: 98.5,
    monthlyTransactions: 8734,
    avgResponseTime: 1.2
  }

  // Enterprise applications
  const enterpriseApps = [
    {
      id: 'finance-home',
      title: 'Finance Module',
      description: 'Financial Accounting & Management',
      icon: Calculator,
      color: 'bg-green-600',
      href: '/enterprise/finance/home'
    },
    {
      id: 'sales-home',
      title: 'Sales Module',
      description: 'Sales & Distribution Management',
      icon: ShoppingCart,
      color: 'bg-blue-600',
      href: '/enterprise/sales/home'
    },
    {
      id: 'hr-home',
      title: 'Human Resources',
      description: 'HR & Talent Management',
      icon: Users,
      color: 'bg-purple-600',
      href: '/enterprise/hr/home'
    },
    {
      id: 'materials-home',
      title: 'Materials Management',
      description: 'Procurement & Inventory',
      icon: Package,
      color: 'bg-orange-600',
      href: '/enterprise/materials/home'
    },
    {
      id: 'salon-home',
      title: 'Salon Management',
      description: 'Beauty Business Operations',
      icon: Settings, // Will use Scissors icon when available
      color: 'bg-pink-600',
      href: '/salon'
    },
    {
      id: 'fixed-assets',
      title: 'Fixed Assets',
      description: 'Asset management and depreciation',
      icon: Building2,
      color: 'bg-blue-500',
      href: '/finance1/fixed-assets'
    },
    {
      id: 'crm-demo',
      title: 'CRM Sales Demo',
      description: 'Lead and opportunity management',
      icon: Target,
      color: 'bg-pink-500',
      href: '/demo-org/00000000-0000-0000-0000-000000000001/crm-sales/dashboard'
    },
    {
      id: 'master-data',
      title: 'Master Data Management',
      description: 'Configure and manage master data templates',
      icon: FileText,
      color: 'bg-indigo-600',
      href: '/enterprise/master-data'
    },
    {
      id: 'system-administration',
      title: 'System Administration',
      description: 'User and system management',
      icon: Settings,
      color: 'bg-gray-600',
      href: '/enterprise/admin'
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const Widget = ({ title, children, className = "" }: any) => (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  )

  const MetricCard = ({ title, value, unit, target, deviation, trend, timeframe }: any) => (
    <div className="space-y-3">
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="text-lg text-gray-600">{unit}</span>
        {trend === 'up' ? (
          <TrendingUp className="h-4 w-4 text-green-600" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600" />
        )}
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Target</span>
          <span className="font-medium">{target}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Deviation</span>
          <span className={`font-medium ${deviation < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {deviation}%
          </span>
        </div>
      </div>
      <div className="text-xs text-gray-500">{timeframe}</div>
    </div>
  )

  return (
    <div className="sap-font min-h-screen bg-gray-100">
      <SapNavbar 
        title="HERA" 
        breadcrumb="Enterprise Portal"
        showBack={false}
        userInitials="JD"
        showSearch={true}
      />
      
      <main className="mt-12 min-h-[calc(100vh-48px)]">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  <Grid3X3 className="w-8 h-8 text-blue-600" />
                  HERA Enterprise Portal
                </h1>
                <p className="text-gray-600 mt-1">
                  Central hub for all enterprise applications and business insights
                </p>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
                <Activity className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-green-50">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(enterpriseMetrics.totalRevenue)}</p>
              <p className="text-sm text-green-600">+12.5% this month</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-blue-50">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Assets</h3>
              <p className="text-2xl font-bold text-gray-900">{enterpriseMetrics.totalAssets.toLocaleString()}</p>
              <p className="text-sm text-blue-600">Active assets</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-purple-50">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Active Users</h3>
              <p className="text-2xl font-bold text-gray-900">{enterpriseMetrics.activeUsers}</p>
              <p className="text-sm text-purple-600">Online now</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-orange-50">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">System Health</h3>
              <p className="text-2xl font-bold text-gray-900">{enterpriseMetrics.systemHealth}%</p>
              <p className="text-sm text-green-600">All systems operational</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'apps', name: 'Applications', icon: Grid3X3 },
                  { id: 'insights', name: 'Business Insights', icon: BarChart3 },
                  { id: 'reports', name: 'Reports & Analytics', icon: FileText }
                ].map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="p-6">
              {/* Applications Tab */}
              {activeTab === 'apps' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Enterprise Applications</h3>
                    <div className="flex space-x-1">
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">Favorites</button>
                      <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">Recently Used</button>
                      <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">Frequently Used</button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {enterpriseApps.map((app) => {
                      const Icon = app.icon
                      return (
                        <a
                          key={app.id}
                          href={app.href}
                          className="bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-all duration-200 text-left group border border-gray-200"
                          onClick={() => {
                            if (app.id === 'salon-home' && typeof window !== 'undefined') {
                              sessionStorage.setItem('salon-enterprise-mode', 'true')
                            }
                          }}
                        >
                          <div className="flex items-center mb-3">
                            <div className={`p-3 rounded-lg ${app.color} mr-3 group-hover:scale-105 transition-transform`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">{app.title}</h4>
                          <p className="text-sm text-gray-600">{app.description}</p>
                          <div className="flex items-center justify-end mt-3">
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Insights Tab */}
              {activeTab === 'insights' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Business Insights</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Transactions */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Monthly Transactions
                      </h4>
                      <div className="flex items-baseline space-x-3 mb-4">
                        <span className="text-3xl font-bold text-gray-900">{enterpriseMetrics.monthlyTransactions.toLocaleString()}</span>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-600">+8.3%</span>
                      </div>
                      <div className="h-32 bg-white rounded flex items-end justify-between px-2 py-2">
                        {[7200, 7800, 8100, 8400, 8734].map((value, index) => (
                          <div
                            key={index}
                            className="bg-blue-500 rounded-t min-w-[20px] transition-all duration-300 hover:bg-blue-600"
                            style={{ height: `${(value / 9000) * 100}%` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* System Performance */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        System Performance
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Avg Response Time</span>
                          <span className="font-semibold text-gray-900">{enterpriseMetrics.avgResponseTime}s</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">System Uptime</span>
                          <span className="font-semibold text-green-600">99.8%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Active Sessions</span>
                          <span className="font-semibold text-gray-900">{enterpriseMetrics.activeUsers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Database Health</span>
                          <span className="font-semibold text-green-600">Optimal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Reports & Analytics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { title: 'Financial Reports', description: 'P&L, Balance Sheet, Cash Flow', icon: Calculator, color: 'bg-green-600' },
                      { title: 'Sales Analytics', description: 'Sales performance and trends', icon: TrendingUp, color: 'bg-blue-600' },
                      { title: 'Asset Reports', description: 'Fixed assets and depreciation', icon: Building2, color: 'bg-purple-600' },
                      { title: 'User Activity', description: 'System usage and performance', icon: Users, color: 'bg-orange-600' },
                      { title: 'Compliance Reports', description: 'Regulatory and audit reports', icon: FileText, color: 'bg-red-600' },
                      { title: 'Custom Analytics', description: 'Build your own reports', icon: Settings, color: 'bg-gray-600' }
                    ].map((report) => {
                      const IconComponent = report.icon
                      return (
                        <div key={report.title} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                          <div className="flex items-center mb-4">
                            <div className={`p-3 rounded-lg ${report.color} mr-4`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{report.title}</h4>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Generate Report
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Helper components for icons not imported
const PlusCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

const Settings = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const Edit = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const Upload = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)