'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calculator, 
  Receipt, 
  FileText, 
  CreditCard, 
  Wallet, 
  BarChart3, 
  PieChart,
  Building2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  RefreshCw,
  Settings,
  Home,
  Sparkles,
  Bell,
  Search,
  Filter,
  Download,
  Eye,
  ChevronRight,
  Calendar,
  Banknote,
  CircleDollarSign
} from 'lucide-react'

export default function FinanceNewPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Mock financial data
  const [financeData] = useState({
    totalRevenue: 284500,
    totalExpenses: 156200,
    netProfit: 128300,
    cashBalance: 425600,
    accountsReceivable: 87300,
    accountsPayable: 45200,
    transactions: [
      {
        id: 1,
        date: '2024-10-31',
        description: 'Customer Payment - INV-2024-1056',
        amount: 12500,
        type: 'income',
        account: 'Accounts Receivable',
        reference: 'PAY-2024-456'
      },
      {
        id: 2,
        date: '2024-10-30',
        description: 'Office Rent Payment',
        amount: -8500,
        type: 'expense',
        account: 'Rent Expense',
        reference: 'EXP-2024-789'
      },
      {
        id: 3,
        date: '2024-10-30',
        description: 'Sales Invoice - Customer ABC',
        amount: 25600,
        type: 'income',
        account: 'Sales Revenue',
        reference: 'INV-2024-1057'
      },
      {
        id: 4,
        date: '2024-10-29',
        description: 'Supplier Payment - Vendor XYZ',
        amount: -15200,
        type: 'expense',
        account: 'Accounts Payable',
        reference: 'PAY-2024-457'
      },
      {
        id: 5,
        date: '2024-10-29',
        description: 'Bank Interest Received',
        amount: 450,
        type: 'income',
        account: 'Interest Income',
        reference: 'INT-2024-045'
      }
    ]
  })

  const quickActions = [
    {
      id: 'new-invoice',
      title: 'New Invoice',
      description: 'Create customer invoice',
      icon: FileText,
      color: 'bg-blue-500',
      href: '/finance-new/invoices/new'
    },
    {
      id: 'record-payment',
      title: 'Record Payment',
      description: 'Log customer payment',
      icon: CreditCard,
      color: 'bg-green-500',
      href: '/finance-new/payments/new'
    },
    {
      id: 'journal-entry',
      title: 'Journal Entry',
      description: 'Manual accounting entry',
      icon: Calculator,
      color: 'bg-purple-500',
      href: '/finance-new/journal/new'
    },
    {
      id: 'expense-report',
      title: 'Expense Report',
      description: 'Submit expense claim',
      icon: Receipt,
      color: 'bg-orange-500',
      href: '/finance-new/expenses/new'
    }
  ]

  const financeModules = [
    {
      id: 'accounts-receivable',
      title: 'Accounts Receivable',
      description: 'Manage customer invoices and payments',
      icon: Wallet,
      stats: 'AED 87,300',
      change: '+12%',
      trend: 'up',
      href: '/finance-new/ar'
    },
    {
      id: 'accounts-payable',
      title: 'Accounts Payable',
      description: 'Track vendor bills and payments',
      icon: CreditCard,
      stats: 'AED 45,200',
      change: '-8%',
      trend: 'down',
      href: '/finance-new/ap'
    },
    {
      id: 'general-ledger',
      title: 'General Ledger',
      description: 'Chart of accounts and journal entries',
      icon: BarChart3,
      stats: '156 Accounts',
      change: '+5',
      trend: 'up',
      href: '/finance-new/gl'
    },
    {
      id: 'reports',
      title: 'Financial Reports',
      description: 'P&L, Balance Sheet, Cash Flow',
      icon: PieChart,
      stats: '12 Reports',
      change: 'Updated',
      trend: 'neutral',
      href: '/finance-new/reports'
    },
    {
      id: 'budgeting',
      title: 'Budgeting',
      description: 'Budget planning and variance analysis',
      icon: Calculator,
      stats: '94% Accuracy',
      change: '+2%',
      trend: 'up',
      href: '/finance-new/budgets'
    },
    {
      id: 'fixed-assets',
      title: 'Fixed Assets',
      description: 'Asset tracking and depreciation',
      icon: Building2,
      stats: 'AED 1.2M',
      change: '+3%',
      trend: 'up',
      href: '/finance-new/assets'
    }
  ]

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Finance Module</h2>
          <p className="text-gray-600">Preparing your financial dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Finance</h1>
              <p className="text-xs text-gray-600">Financial Management</p>
            </div>
          </div>
          <button className="min-w-[44px] min-h-[44px] rounded-full bg-gray-100 flex items-center justify-center active:scale-95">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <CircleDollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Finance Dashboard</h1>
                <p className="text-blue-100 text-lg">Comprehensive financial management and reporting</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 backdrop-blur-sm"
              >
                <Home className="w-5 h-5" />
                Home
              </button>
              <button className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 backdrop-blur-sm">
                <Settings className="w-5 h-5" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Mobile Welcome Card */}
        <div className="md:hidden bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
          <p className="text-gray-600">Your finances are looking great today.</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +15%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              AED {financeData.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" />
                -8%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              AED {financeData.totalExpenses.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Expenses</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <CircleDollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +23%
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              AED {financeData.netProfit.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Net Profit</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Banknote className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-purple-600 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Stable
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              AED {financeData.cashBalance.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Cash Balance</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => router.push(action.href)}
                className="min-h-[80px] bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors text-left active:scale-95"
              >
                <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center mb-2`}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">{action.title}</div>
                <div className="text-xs text-gray-600">{action.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Finance Modules */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Finance Modules</h3>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {financeModules
              .filter(module => 
                module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                module.description.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((module) => (
              <div
                key={module.id}
                onClick={() => router.push(module.href)}
                className="group bg-gray-50 hover:bg-gray-100 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md active:scale-95"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <module.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {module.trend === 'up' && <ArrowUpRight className="w-4 h-4 text-green-600" />}
                    {module.trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-600" />}
                    {module.trend === 'neutral' && <Activity className="w-4 h-4 text-gray-600" />}
                    <span className={`font-medium ${
                      module.trend === 'up' ? 'text-green-600' : 
                      module.trend === 'down' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {module.change}
                    </span>
                  </div>
                </div>
                
                <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {module.title}
                </h4>
                <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                  {module.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-gray-900">
                    {module.stats}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Eye className="w-4 h-4 mr-2 inline" />
                View All
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-4 h-4 mr-2 inline" />
                Export
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {financeData.transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className={`w-5 h-5 text-green-600`} />
                    ) : (
                      <ArrowDownRight className={`w-5 h-5 text-red-600`} />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 mb-1">{transaction.description}</div>
                    <div className="text-sm text-gray-600">{transaction.account} • {transaction.reference}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : ''}AED {Math.abs(transaction.amount).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">{transaction.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom spacing for mobile */}
        <div className="h-24 md:h-0"></div>
      </div>
    </div>
  )
}