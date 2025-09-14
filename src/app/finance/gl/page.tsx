'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  BookOpen,
  Search,
  Filter,
  Download,
  Plus,
  ChevronRight,
  ChevronDown,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  RefreshCw,
  Eye,
  Edit,
  MoreVertical
} from 'lucide-react'

// Kerala Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface GLAccount {
  id: string
  accountCode: string
  accountName: string
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  parentAccount?: string
  balance: number
  currency: string
  status: 'active' | 'inactive'
  lastActivity: string
  description?: string
}

interface JournalEntry {
  id: string
  entryDate: string
  entryNumber: string
  description: string
  status: 'posted' | 'draft' | 'pending'
  createdBy: string
  totalDebit: number
  totalCredit: number
  lines: {
    accountCode: string
    accountName: string
    debit: number
    credit: number
    description?: string
  }[]
}

export default function GeneralLedgerPage() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'journal'>('accounts')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccountType, setSelectedAccountType] = useState('all')
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // GL Accounts with hierarchical structure
  const [glAccounts] = useState<GLAccount[]>([
    // Assets
    { id: '1', accountCode: '1000', accountName: 'Assets', accountType: 'asset', balance: 185000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '2', accountCode: '1100', accountName: 'Current Assets', accountType: 'asset', parentAccount: '1000', balance: 103000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '3', accountCode: '1110', accountName: 'Cash and Cash Equivalents', accountType: 'asset', parentAccount: '1100', balance: 45000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '4', accountCode: '1120', accountName: 'Accounts Receivable', accountType: 'asset', parentAccount: '1100', balance: 125000000, currency: 'INR', status: 'active', lastActivity: '2024-06-14' },
    { id: '5', accountCode: '1130', accountName: 'Inventory', accountType: 'asset', parentAccount: '1100', balance: 8000000, currency: 'INR', status: 'active', lastActivity: '2024-06-13' },
    { id: '6', accountCode: '1200', accountName: 'Fixed Assets', accountType: 'asset', parentAccount: '1000', balance: 82000000, currency: 'INR', status: 'active', lastActivity: '2024-06-10' },
    { id: '7', accountCode: '1210', accountName: 'Network Equipment', accountType: 'asset', parentAccount: '1200', balance: 65000000, currency: 'INR', status: 'active', lastActivity: '2024-06-10' },
    { id: '8', accountCode: '1220', accountName: 'Buildings', accountType: 'asset', parentAccount: '1200', balance: 17000000, currency: 'INR', status: 'active', lastActivity: '2024-05-31' },
    
    // Liabilities
    { id: '9', accountCode: '2000', accountName: 'Liabilities', accountType: 'liability', balance: 82000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '10', accountCode: '2100', accountName: 'Current Liabilities', accountType: 'liability', parentAccount: '2000', balance: 52000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '11', accountCode: '2110', accountName: 'Accounts Payable', accountType: 'liability', parentAccount: '2100', balance: 82000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '12', accountCode: '2120', accountName: 'Accrued Expenses', accountType: 'liability', parentAccount: '2100', balance: 15000000, currency: 'INR', status: 'active', lastActivity: '2024-06-14' },
    { id: '13', accountCode: '2200', accountName: 'Long-term Liabilities', accountType: 'liability', parentAccount: '2000', balance: 30000000, currency: 'INR', status: 'active', lastActivity: '2024-06-01' },
    
    // Equity
    { id: '14', accountCode: '3000', accountName: 'Equity', accountType: 'equity', balance: 226000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '15', accountCode: '3100', accountName: 'Share Capital', accountType: 'equity', parentAccount: '3000', balance: 100000000, currency: 'INR', status: 'active', lastActivity: '2024-01-01' },
    { id: '16', accountCode: '3200', accountName: 'Retained Earnings', accountType: 'equity', parentAccount: '3000', balance: 126000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    
    // Revenue
    { id: '17', accountCode: '4000', accountName: 'Revenue', accountType: 'revenue', balance: 540000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '18', accountCode: '4100', accountName: 'Service Revenue', accountType: 'revenue', parentAccount: '4000', balance: 486000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '19', accountCode: '4110', accountName: 'Broadband Revenue', accountType: 'revenue', parentAccount: '4100', balance: 324000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '20', accountCode: '4120', accountName: 'Cable TV Revenue', accountType: 'revenue', parentAccount: '4100', balance: 129600000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '21', accountCode: '4200', accountName: 'Other Revenue', accountType: 'revenue', parentAccount: '4000', balance: 54000000, currency: 'INR', status: 'active', lastActivity: '2024-06-14' },
    
    // Expenses
    { id: '22', accountCode: '5000', accountName: 'Expenses', accountType: 'expense', balance: 417400000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '23', accountCode: '5100', accountName: 'Operating Expenses', accountType: 'expense', parentAccount: '5000', balance: 350000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '24', accountCode: '5110', accountName: 'Network Operations', accountType: 'expense', parentAccount: '5100', balance: 150000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '25', accountCode: '5120', accountName: 'Staff Costs', accountType: 'expense', parentAccount: '5100', balance: 120000000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' },
    { id: '26', accountCode: '5130', accountName: 'Marketing & Sales', accountType: 'expense', parentAccount: '5100', balance: 40000000, currency: 'INR', status: 'active', lastActivity: '2024-06-14' },
    { id: '27', accountCode: '5200', accountName: 'Administrative Expenses', accountType: 'expense', parentAccount: '5000', balance: 67400000, currency: 'INR', status: 'active', lastActivity: '2024-06-15' }
  ])

  // Recent Journal Entries
  const [journalEntries] = useState<JournalEntry[]>([
    {
      id: '1',
      entryDate: '2024-06-15',
      entryNumber: 'JE-2024-0615',
      description: 'Monthly revenue recognition',
      status: 'posted',
      createdBy: 'System',
      totalDebit: 45000000,
      totalCredit: 45000000,
      lines: [
        { accountCode: '1120', accountName: 'Accounts Receivable', debit: 45000000, credit: 0 },
        { accountCode: '4110', accountName: 'Broadband Revenue', debit: 0, credit: 32000000 },
        { accountCode: '4120', accountName: 'Cable TV Revenue', debit: 0, credit: 13000000 }
      ]
    },
    {
      id: '2',
      entryDate: '2024-06-14',
      entryNumber: 'JE-2024-0614',
      description: 'Network equipment purchase',
      status: 'posted',
      createdBy: 'Finance Manager',
      totalDebit: 5000000,
      totalCredit: 5000000,
      lines: [
        { accountCode: '1210', accountName: 'Network Equipment', debit: 5000000, credit: 0 },
        { accountCode: '2110', accountName: 'Accounts Payable', debit: 0, credit: 5000000 }
      ]
    },
    {
      id: '3',
      entryDate: '2024-06-13',
      entryNumber: 'JE-2024-0613',
      description: 'Staff salary payment',
      status: 'posted',
      createdBy: 'HR System',
      totalDebit: 10000000,
      totalCredit: 10000000,
      lines: [
        { accountCode: '5120', accountName: 'Staff Costs', debit: 10000000, credit: 0 },
        { accountCode: '1110', accountName: 'Cash and Cash Equivalents', debit: 0, credit: 10000000 }
      ]
    }
  ])

  const supabase = createClientComponentClient()

  const toggleAccountExpansion = (accountCode: string) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(accountCode)) {
        newSet.delete(accountCode)
      } else {
        newSet.add(accountCode)
      }
      return newSet
    })
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'text-emerald-400'
      case 'liability': return 'text-red-400'
      case 'equity': return 'text-purple-400'
      case 'revenue': return 'text-[#00DDFF]'
      case 'expense': return 'text-yellow-400'
      default: return 'text-white'
    }
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return '📊'
      case 'liability': return '📉'
      case 'equity': return '💰'
      case 'revenue': return '📈'
      case 'expense': return '💸'
      default: return '📁'
    }
  }

  const filteredAccounts = glAccounts.filter(account => {
    const matchesSearch = account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.accountCode.includes(searchTerm)
    const matchesType = selectedAccountType === 'all' || account.accountType === selectedAccountType
    return matchesSearch && matchesType
  })

  const renderAccountRow = (account: GLAccount, level: number = 0) => {
    const hasChildren = glAccounts.some(a => a.parentAccount === account.accountCode)
    const isExpanded = expandedAccounts.has(account.accountCode)
    
    return (
      <>
        <tr key={account.id} className="hover:bg-white/5 transition-colors">
          <td className="py-3 pl-4">
            <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleAccountExpansion(account.accountCode)}
                  className="mr-2 text-white/40 hover:text-white transition-colors"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              <span className="font-mono text-sm text-white/80">{account.accountCode}</span>
            </div>
          </td>
          <td className="py-3">
            <div className="flex items-center space-x-2">
              <span>{getAccountTypeIcon(account.accountType)}</span>
              <span className="text-white font-medium">{account.accountName}</span>
            </div>
          </td>
          <td className="py-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.accountType)}`}>
              {account.accountType}
            </span>
          </td>
          <td className="py-3 text-right">
            <span className="text-white font-medium">
              ₹{(account.balance / 10000000).toFixed(2)} Cr
            </span>
          </td>
          <td className="py-3 text-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              account.status === 'active' 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {account.status}
            </span>
          </td>
          <td className="py-3 text-right pr-4">
            <button className="text-white/40 hover:text-white transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </td>
        </tr>
        {hasChildren && isExpanded && 
          glAccounts
            .filter(a => a.parentAccount === account.accountCode)
            .map(childAccount => renderAccountRow(childAccount, level + 1))
        }
      </>
    )
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    // Fetch GL data from Supabase
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            General Ledger
          </h1>
          <p className="text-white/60 mt-1">Chart of accounts and journal entries management</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={refreshData}
            className={`flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300">
            <Plus className="h-5 w-5" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 backdrop-blur-xl p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'accounts'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Chart of Accounts
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'journal'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Journal Entries
        </button>
      </div>

      {activeTab === 'accounts' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search by account name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            
            <select
              value={selectedAccountType}
              onChange={(e) => setSelectedAccountType(e.target.value)}
              className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Account Types</option>
              <option value="asset">Assets</option>
              <option value="liability">Liabilities</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expenses</option>
            </select>

            <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>

          {/* Chart of Accounts Table */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left py-4 pl-4 text-sm font-medium text-white/60">Account Code</th>
                    <th className="text-left py-4 text-sm font-medium text-white/60">Account Name</th>
                    <th className="text-left py-4 text-sm font-medium text-white/60">Type</th>
                    <th className="text-right py-4 text-sm font-medium text-white/60">Balance</th>
                    <th className="text-center py-4 text-sm font-medium text-white/60">Status</th>
                    <th className="text-right py-4 pr-4 text-sm font-medium text-white/60">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAccounts
                    .filter(account => !account.parentAccount)
                    .map(account => renderAccountRow(account))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Journal Entries Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search journal entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            
            <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
              <Calendar className="h-5 w-5" />
              <span>Date Range</span>
            </button>

            <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
              <Filter className="h-5 w-5" />
              <span>Filter</span>
            </button>
          </div>

          {/* Journal Entries List */}
          <div className="space-y-4">
            {journalEntries.map((entry) => (
              <div key={entry.id} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{entry.entryNumber}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.status === 'posted' 
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : entry.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="text-white/80">{entry.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-white/60">
                        <span>{new Date(entry.entryDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Created by {entry.createdBy}</span>
                      </div>
                    </div>
                    <button className="text-white/40 hover:text-white transition-colors">
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-white/10">
                          <th className="pb-2 text-sm font-medium text-white/60">Account</th>
                          <th className="pb-2 text-sm font-medium text-white/60 text-right">Debit</th>
                          <th className="pb-2 text-sm font-medium text-white/60 text-right">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {entry.lines.map((line, index) => (
                          <tr key={index}>
                            <td className="py-2">
                              <div>
                                <span className="font-mono text-sm text-white/60">{line.accountCode}</span>
                                <span className="ml-2 text-white">{line.accountName}</span>
                              </div>
                            </td>
                            <td className="py-2 text-right">
                              {line.debit > 0 && (
                                <span className="text-emerald-400 font-medium">
                                  ₹{(line.debit / 10000000).toFixed(2)} Cr
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right">
                              {line.credit > 0 && (
                                <span className="text-red-400 font-medium">
                                  ₹{(line.credit / 10000000).toFixed(2)} Cr
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-white/10">
                          <td className="pt-2 text-sm font-medium text-white">Total</td>
                          <td className="pt-2 text-right">
                            <span className="text-emerald-400 font-bold">
                              ₹{(entry.totalDebit / 10000000).toFixed(2)} Cr
                            </span>
                          </td>
                          <td className="pt-2 text-right">
                            <span className="text-red-400 font-bold">
                              ₹{(entry.totalCredit / 10000000).toFixed(2)} Cr
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}