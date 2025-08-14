'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  MoreHorizontal,
  BookOpen,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  Package,
  Users,
  Zap
} from 'lucide-react'
import { DualAuthProvider } from '@/components/auth/DualAuthProvider'

interface GLAccount {
  id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  category: string
  balance: number
  isActive: boolean
  lastTransaction: string
  description: string
  parentAccount?: string
  hasChildren: boolean
}

interface AccountStats {
  totalAccounts: number
  activeAccounts: number
  assets: number
  liabilities: number
  revenue: number
  expenses: number
}

export default function GLAccountsManagement() {
  const [accounts, setAccounts] = useState<GLAccount[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<GLAccount[]>([])
  const [stats, setStats] = useState<AccountStats>({
    totalAccounts: 0,
    activeAccounts: 0,
    assets: 0,
    liabilities: 0,
    revenue: 0,
    expenses: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadGLAccounts()
  }, [])

  useEffect(() => {
    filterAccounts()
  }, [accounts, searchTerm, filterType])

  const loadGLAccounts = async () => {
    try {
      // Mock data - replace with actual API call
      const mockAccounts: GLAccount[] = [
        {
          id: '1',
          code: '1000',
          name: 'Cash - Operating Account',
          type: 'asset',
          category: 'Current Assets',
          balance: 45000.00,
          isActive: true,
          lastTransaction: '2024-01-29',
          description: 'Primary operating cash account',
          hasChildren: false
        },
        {
          id: '2',
          code: '1200',
          name: 'Accounts Receivable',
          type: 'asset',
          category: 'Current Assets',
          balance: 12500.00,
          isActive: true,
          lastTransaction: '2024-01-28',
          description: 'Customer outstanding balances',
          hasChildren: true
        },
        {
          id: '3',
          code: '1300',
          name: 'Inventory - Food',
          type: 'asset',
          category: 'Current Assets',
          balance: 8750.00,
          isActive: true,
          lastTransaction: '2024-01-29',
          description: 'Food inventory for restaurant operations',
          hasChildren: false
        },
        {
          id: '4',
          code: '2000',
          name: 'Accounts Payable',
          type: 'liability',
          category: 'Current Liabilities',
          balance: -15600.00,
          isActive: true,
          lastTransaction: '2024-01-27',
          description: 'Vendor outstanding balances',
          hasChildren: false
        },
        {
          id: '5',
          code: '4000',
          name: 'Food Sales Revenue',
          type: 'revenue',
          category: 'Operating Revenue',
          balance: -89450.00,
          isActive: true,
          lastTransaction: '2024-01-29',
          description: 'Revenue from food sales',
          hasChildren: false
        },
        {
          id: '6',
          code: '5000',
          name: 'Cost of Goods Sold - Food',
          type: 'expense',
          category: 'Cost of Sales',
          balance: 32100.00,
          isActive: true,
          lastTransaction: '2024-01-29',
          description: 'Direct cost of food sold',
          hasChildren: false
        },
        {
          id: '7',
          code: '6000',
          name: 'Labor - Kitchen Staff',
          type: 'expense',
          category: 'Operating Expenses',
          balance: 18750.00,
          isActive: true,
          lastTransaction: '2024-01-28',
          description: 'Kitchen staff wages and benefits',
          hasChildren: false
        },
        {
          id: '8',
          code: '7000',
          name: 'Rent Expense',
          type: 'expense',
          category: 'Operating Expenses',
          balance: 6500.00,
          isActive: true,
          lastTransaction: '2024-01-01',
          description: 'Monthly rent for restaurant location',
          hasChildren: false
        }
      ]

      setAccounts(mockAccounts)
      
      // Calculate stats
      const activeAccounts = mockAccounts.filter(acc => acc.isActive)
      const assets = mockAccounts.filter(acc => acc.type === 'asset').reduce((sum, acc) => sum + acc.balance, 0)
      const liabilities = Math.abs(mockAccounts.filter(acc => acc.type === 'liability').reduce((sum, acc) => sum + acc.balance, 0))
      const revenue = Math.abs(mockAccounts.filter(acc => acc.type === 'revenue').reduce((sum, acc) => sum + acc.balance, 0))
      const expenses = mockAccounts.filter(acc => acc.type === 'expense').reduce((sum, acc) => sum + acc.balance, 0)

      setStats({
        totalAccounts: mockAccounts.length,
        activeAccounts: activeAccounts.length,
        assets,
        liabilities,
        revenue,
        expenses
      })
      
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load GL accounts:', error)
      setIsLoading(false)
    }
  }

  const filterAccounts = () => {
    let filtered = accounts

    if (searchTerm) {
      filtered = filtered.filter(account => 
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.code.includes(searchTerm) ||
        account.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(account => account.type === filterType)
    }

    setFilteredAccounts(filtered)
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <TrendingUp className="w-4 h-4 text-emerald-600" />
      case 'liability': return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'equity': return <Building className="w-4 h-4 text-purple-600" />
      case 'revenue': return <DollarSign className="w-4 h-4 text-blue-600" />
      case 'expense': return <Package className="w-4 h-4 text-amber-600" />
      default: return <BookOpen className="w-4 h-4 text-slate-600" />
    }
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'liability': return 'bg-red-100 text-red-800 border-red-200'
      case 'equity': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'revenue': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'expense': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(amount))
  }

  return (
    <DualAuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/coa')}
                  className="p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    GL Accounts Management
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Manage your General Ledger account structure
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                  <Plus className="w-4 h-4 mr-2" />
                  New Account
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-600 mb-1">Total Accounts</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalAccounts}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-600 mb-1">Assets</p>
                    <p className="text-xl font-bold text-emerald-900">{formatCurrency(stats.assets)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-1">Liabilities</p>
                    <p className="text-xl font-bold text-red-900">{formatCurrency(stats.liabilities)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-purple-600 mb-1">Revenue</p>
                    <p className="text-xl font-bold text-purple-900">{formatCurrency(stats.revenue)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-600 mb-1">Expenses</p>
                    <p className="text-xl font-bold text-amber-900">{formatCurrency(stats.expenses)}</p>
                  </div>
                  <Package className="w-8 h-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Active</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.activeAccounts}</p>
                  </div>
                  <Zap className="w-8 h-8 text-slate-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="border-0 shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search accounts by name, code, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="asset">Assets</option>
                    <option value="liability">Liabilities</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expenses</option>
                  </select>
                  <Button variant="outline" className="flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accounts Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>General Ledger Accounts</span>
                <Badge variant="outline" className="px-3 py-1">
                  {filteredAccounts.length} accounts
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Account</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Type</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700">Category</th>
                      <th className="text-right py-4 px-6 font-semibold text-slate-700">Balance</th>
                      <th className="text-center py-4 px-6 font-semibold text-slate-700">Status</th>
                      <th className="text-center py-4 px-6 font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12">
                          <div className="flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mr-3" />
                            Loading accounts...
                          </div>
                        </td>
                      </tr>
                    ) : filteredAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12">
                          <div className="text-slate-500">
                            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                            <p className="text-lg font-medium mb-2">No accounts found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAccounts.map((account) => (
                        <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              {getAccountTypeIcon(account.type)}
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {account.code} - {account.name}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {account.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={`${getAccountTypeColor(account.type)} border`}>
                              {account.type}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-slate-700">{account.category}</span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className={`font-semibold ${
                              account.balance < 0 ? 'text-red-600' : 'text-emerald-600'
                            }`}>
                              {formatCurrency(account.balance)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Badge 
                              variant={account.isActive ? "default" : "secondary"}
                              className={account.isActive ? "bg-emerald-100 text-emerald-800" : ""}
                            >
                              {account.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <Button variant="ghost" size="sm" className="p-2">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-2">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-2">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DualAuthProvider>
  )
}