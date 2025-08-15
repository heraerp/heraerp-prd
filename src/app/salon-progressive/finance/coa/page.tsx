'use client'

import React, { useState, useEffect } from 'react'
import { 
  Building2, Calculator, TrendingUp, DollarSign, 
  Search, Filter, Plus, Edit, Eye, Download,
  ChevronRight, ChevronDown, Wallet, CreditCard,
  Home, Store, Users, Receipt, PiggyBank, FileText,
  AlertCircle, CheckCircle, Info, Sparkles, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SalonTeamsSidebar } from '@/components/salon-progressive/SalonTeamsSidebar'
import { UniversalCOATemplateGenerator } from '@/lib/coa/universal-coa-template'

interface GLAccount {
  id: string
  entity_code: string
  entity_name: string
  smart_code: string
  status: string
  account_type?: string
  normal_balance?: string
  vat_applicable?: string
  currency?: string
  // IFRS Lineage and Hierarchy - MANDATORY FIELDS
  ifrs_classification: string        // IFRS Statement Classification (e.g., "Current Assets", "Non-Current Liabilities")
  parent_account: string             // Parent account code for hierarchy (e.g., "1000" for assets under main Assets)
  account_level: number              // 1=Main Header, 2=Category, 3=SubCategory, 4=Account, 5=SubAccount
  ifrs_category: string              // IFRS Presentation Category (e.g., "Assets", "Liabilities", "Equity")
  presentation_order: number         // Order in financial statements (1, 2, 3...)
  is_header: boolean                 // True for header/summary accounts that don't hold balances
  rollup_account: string            // Account where this rolls up to for consolidation
  // Additional IFRS Fields
  ifrs_statement?: 'SFP' | 'SPL' | 'SCE' | 'SCF' | 'NOTES'  // Financial statement type
  ifrs_subcategory?: string          // Detailed IFRS subcategory
  consolidation_method?: 'sum' | 'net' | 'none'  // How to consolidate
  reporting_standard?: 'IFRS' | 'IFRS_SME' | 'LOCAL_GAAP'  // Applicable standard
}

interface AccountCategory {
  code: string
  name: string
  icon: React.ReactNode
  color: string
  accounts: GLAccount[]
  total?: number
}

export default function SalonCOAPage() {
  const [accounts, setAccounts] = useState<GLAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['assets', 'revenue', 'cost_of_sales', 'direct_expenses'])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<GLAccount | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New account form state
  const [newAccount, setNewAccount] = useState({
    account_code: '',
    account_name: '',
    account_type: 'assets',
    normal_balance: 'debit',
    vat_applicable: false,
    description: '',
    // IFRS Fields
    ifrs_classification: '',
    parent_account: '',
    account_level: 4,
    is_header: false
  })

  // Edit account form state
  const [editAccount, setEditAccount] = useState({
    account_code: '',
    account_name: '',
    account_type: 'assets',
    normal_balance: 'debit',
    vat_applicable: false,
    description: '',
    // IFRS Fields
    ifrs_classification: '',
    parent_account: '',
    account_level: 4,
    is_header: false
  })

  const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Dubai Salon

  useEffect(() => {
    loadCOAData()
  }, [])

  const loadCOAData = async () => {
    try {
      setLoading(true)

      // Progressive mode: Use localStorage for COA data
      const savedAccounts = localStorage.getItem('salon_coa_accounts')
      
      if (savedAccounts) {
        console.log('✅ Loading COA from localStorage')
        const parsedAccounts = JSON.parse(savedAccounts)
        setAccounts(parsedAccounts)
      } else {
        // Initialize with default Dubai Salon COA structure for progressive mode
        console.log('🔄 Initializing default Dubai Salon COA for progressive mode')
        const defaultAccounts = initializeDefaultCOA()
        setAccounts(defaultAccounts)
        localStorage.setItem('salon_coa_accounts', JSON.stringify(defaultAccounts))
      }
      
    } catch (error) {
      console.error('❌ Error loading COA data:', error)
      // Fallback to default accounts
      const defaultAccounts = initializeDefaultCOA()
      setAccounts(defaultAccounts)
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaultCOA = (): GLAccount[] => {
    // Use the enhanced Universal COA Template Generator with complete IFRS lineage
    const generator = new UniversalCOATemplateGenerator()
    const coaTemplate = generator.generateUniversalCOA('salon', 'AE', 'Dubai Salon Progressive')
    
    // Convert UniversalCOAAccount[] to GLAccount[] format
    return coaTemplate.accounts.map(account => ({
      id: account.id,
      entity_code: account.entity_code,
      entity_name: account.entity_name,
      smart_code: account.smart_code,
      status: account.status,
      account_type: account.account_type,
      normal_balance: account.normal_balance,
      vat_applicable: account.vat_applicable,
      currency: account.currency,
      // Complete IFRS Lineage from Universal Template
      ifrs_classification: account.ifrs_classification,
      parent_account: account.parent_account,
      account_level: account.account_level,
      ifrs_category: account.ifrs_category,
      presentation_order: account.presentation_order,
      is_header: account.is_header,
      rollup_account: account.rollup_account,
      ifrs_statement: account.ifrs_statement,
      ifrs_subcategory: account.ifrs_subcategory,
      consolidation_method: account.consolidation_method,
      reporting_standard: account.reporting_standard
    }))
  }

  const getAccountCategories = (useFiltered = false): AccountCategory[] => {
    const accountsToUse = useFiltered ? filteredAccounts : accounts
    const categories: AccountCategory[] = [
      {
        code: 'assets',
        name: 'Assets',
        icon: <Home className="w-5 h-5" />,
        color: 'bg-blue-500/20 text-blue-800 border-blue-500/30',
        accounts: accountsToUse.filter(acc => acc.entity_code.startsWith('1'))
      },
      {
        code: 'liabilities',
        name: 'Liabilities',
        icon: <CreditCard className="w-5 h-5" />,
        color: 'bg-red-500/20 text-red-800 border-red-500/30',
        accounts: accountsToUse.filter(acc => acc.entity_code.startsWith('2'))
      },
      {
        code: 'equity',
        name: 'Equity',
        icon: <PiggyBank className="w-5 h-5" />,
        color: 'bg-purple-500/20 text-purple-800 border-purple-500/30',
        accounts: accountsToUse.filter(acc => acc.entity_code.startsWith('3'))
      },
      {
        code: 'revenue',
        name: 'Revenue',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'bg-green-500/20 text-green-800 border-green-500/30',
        accounts: accountsToUse.filter(acc => acc.entity_code.startsWith('4'))
      },
      {
        code: 'cost_of_sales',
        name: 'Cost of Sales',
        icon: <DollarSign className="w-5 h-5" />,
        color: 'bg-amber-500/20 text-amber-800 border-amber-500/30',
        accounts: accountsToUse.filter(acc => acc.entity_code.startsWith('5'))
      },
      {
        code: 'direct_expenses',
        name: 'Direct Expenses',
        icon: <Receipt className="w-5 h-5" />,
        color: 'bg-orange-500/20 text-orange-800 border-orange-500/30',
        accounts: accountsToUse.filter(acc => acc.entity_code.startsWith('6'))
      },
      {
        code: 'indirect_expenses',
        name: 'Indirect Expenses',
        icon: <FileText className="w-5 h-5" />,
        color: 'bg-red-500/20 text-red-800 border-red-500/30',
        accounts: accountsToUse.filter(acc => acc.entity_code.startsWith('7'))
      },
      {
        code: 'taxes_extraordinary',
        name: 'Taxes & Extraordinary',
        icon: <AlertCircle className="w-5 h-5" />,
        color: 'bg-purple-600/20 text-purple-800 border-purple-600/30',
        accounts: accountsToUse.filter(acc => acc.entity_code.startsWith('8'))
      },
      {
        code: 'statistical',
        name: 'Statistical Accounts',
        icon: <Info className="w-5 h-5" />,
        color: 'bg-slate-500/20 text-slate-800 border-slate-500/30',
        accounts: accountsToUse.filter(acc => acc.entity_code.startsWith('9'))
      }
    ]

    return categories
  }

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.entity_code.includes(searchTerm)
    const matchesCategory = selectedCategory === 'all' || 
                           getAccountCategories().find(cat => 
                             cat.code === selectedCategory && 
                             cat.accounts.some(acc => acc.id === account.id)
                           )
    return matchesSearch && matchesCategory
  })

  const toggleCategoryExpansion = (categoryCode: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryCode) 
        ? prev.filter(c => c !== categoryCode)
        : [...prev, categoryCode]
    )
  }

  const saveAccountsToStorage = (updatedAccounts: GLAccount[]) => {
    localStorage.setItem('salon_coa_accounts', JSON.stringify(updatedAccounts))
    setAccounts(updatedAccounts)
  }

  const handleAddAccount = async () => {
    if (!newAccount.account_code || !newAccount.account_name) {
      alert('Please fill in Account Code and Account Name')
      return
    }

    // Check if account code already exists
    const existingAccount = accounts.find(acc => acc.entity_code === newAccount.account_code)
    if (existingAccount) {
      alert('Account code already exists. Please use a different code.')
      return
    }

    setIsSubmitting(true)

    try {
      const newAccountData: GLAccount = {
        id: `progressive_${Date.now()}_${newAccount.account_code}`,
        entity_code: newAccount.account_code,
        entity_name: newAccount.account_name,
        smart_code: `HERA.AE.SALON.GL.${newAccount.account_type.toUpperCase()}.${newAccount.account_code}.v1`,
        status: 'active',
        account_type: newAccount.account_type,
        normal_balance: newAccount.normal_balance,
        vat_applicable: newAccount.vat_applicable.toString(),
        currency: 'AED',
        // IFRS Lineage
        ifrs_classification: newAccount.ifrs_classification || newAccount.account_type,
        parent_account: newAccount.parent_account,
        account_level: newAccount.account_level,
        ifrs_category: newAccount.account_type,
        presentation_order: 999, // User accounts go to the bottom
        is_header: newAccount.is_header,
        rollup_account: newAccount.parent_account
      }

      const updatedAccounts = [...accounts, newAccountData]
      saveAccountsToStorage(updatedAccounts)

      // Reset form
      setNewAccount({
        account_code: '',
        account_name: '',
        account_type: 'assets',
        normal_balance: 'debit',
        vat_applicable: false,
        description: '',
        // IFRS Fields
        ifrs_classification: '',
        parent_account: '',
        account_level: 4,
        is_header: false
      })

      setShowAddModal(false)
      console.log('✅ Account added successfully:', newAccountData)
      
    } catch (error) {
      console.error('❌ Error adding account:', error)
      alert('Failed to add account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = (accountId: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      const updatedAccounts = accounts.filter(acc => acc.id !== accountId)
      saveAccountsToStorage(updatedAccounts)
      console.log('✅ Account deleted successfully')
    }
  }

  const resetCOAData = () => {
    if (confirm('This will reset all account data to defaults. Are you sure?')) {
      localStorage.removeItem('salon_coa_accounts')
      loadCOAData()
      console.log('✅ COA data reset to defaults')
    }
  }

  const handleViewAccount = (account: GLAccount) => {
    setSelectedAccount(account)
    setShowViewModal(true)
  }

  const handleEditAccount = (account: GLAccount) => {
    setSelectedAccount(account)
    setEditAccount({
      account_code: account.entity_code,
      account_name: account.entity_name,
      account_type: account.account_type || 'assets',
      normal_balance: account.normal_balance || 'debit',
      vat_applicable: account.vat_applicable === 'true',
      description: ''
    })
    setShowEditModal(true)
  }

  const handleUpdateAccount = async () => {
    if (!selectedAccount || !editAccount.account_code || !editAccount.account_name) {
      alert('Please fill in Account Code and Account Name')
      return
    }

    // Check if account code already exists (excluding current account)
    const existingAccount = accounts.find(acc => 
      acc.entity_code === editAccount.account_code && acc.id !== selectedAccount.id
    )
    if (existingAccount) {
      alert('Account code already exists. Please use a different code.')
      return
    }

    setIsSubmitting(true)

    try {
      const updatedAccountData: GLAccount = {
        ...selectedAccount,
        entity_code: editAccount.account_code,
        entity_name: editAccount.account_name,
        account_type: editAccount.account_type,
        normal_balance: editAccount.normal_balance,
        vat_applicable: editAccount.vat_applicable.toString(),
        smart_code: `HERA.AE.SALON.GL.${editAccount.account_type.toUpperCase()}.${editAccount.account_code}.v1`
      }

      const updatedAccounts = accounts.map(acc => 
        acc.id === selectedAccount.id ? updatedAccountData : acc
      )
      saveAccountsToStorage(updatedAccounts)

      setShowEditModal(false)
      setSelectedAccount(null)
      console.log('✅ Account updated successfully:', updatedAccountData)
      
    } catch (error) {
      console.error('❌ Error updating account:', error)
      alert('Failed to update account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Sparkles className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Loading Chart of Accounts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Salon Sidebar */}
      <SalonTeamsSidebar />
      
      {/* Main Content with left margin for sidebar */}
      <div className="ml-16 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl shadow-black/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-xl">
                <Calculator className="w-8 h-8 text-pink-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Chart of Accounts</h1>
                <p className="text-slate-600">Dubai Luxury Salon & Spa - Financial Structure</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-500/20 text-green-800 border-green-500/30 px-3 py-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                {accounts.length} Accounts
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-800 border-blue-500/30 px-3 py-1">
                🇦🇪 UAE Compliant
              </Badge>
            </div>
          </div>

          {/* COA Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {getAccountCategories(searchTerm || selectedCategory !== 'all').map(category => (
              <div key={category.code} className="text-center p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30">
                <div className="flex items-center justify-center mb-2">
                  {category.icon}
                </div>
                <div className="text-2xl font-bold text-slate-800">{category.accounts.length}</div>
                <div className="text-sm text-slate-600 font-medium">{category.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl shadow-black/10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search accounts by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-10 backdrop-blur-sm transition-all duration-200 ${
                  searchTerm 
                    ? 'bg-blue-50/80 border-blue-300/50 ring-2 ring-blue-300/20' 
                    : 'bg-white/60 border-white/30'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg text-slate-700 font-medium"
              >
                <option value="all">All Categories</option>
                {getAccountCategories().map(cat => (
                  <option key={cat.code} value={cat.code}>{cat.name}</option>
                ))}
              </select>
              <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-pink-500/90 to-purple-600/90 hover:from-pink-600 hover:to-purple-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-slate-800">
                      <div className="p-2 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-lg">
                        <Plus className="h-6 w-6 text-pink-600" />
                      </div>
                      <span className="text-xl font-bold">Add New Account</span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="account_code" className="text-sm font-medium text-slate-700">Account Code *</Label>
                        <Input
                          id="account_code"
                          placeholder="e.g. 1500"
                          value={newAccount.account_code}
                          onChange={(e) => setNewAccount({...newAccount, account_code: e.target.value})}
                          className="bg-white/60 backdrop-blur-sm border-white/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account_type" className="text-sm font-medium text-slate-700">Account Type *</Label>
                        <select
                          id="account_type"
                          value={newAccount.account_type}
                          onChange={(e) => setNewAccount({
                            ...newAccount, 
                            account_type: e.target.value,
                            normal_balance: ['assets', 'cost_of_sales', 'direct_expenses', 'indirect_expenses', 'taxes_extraordinary', 'statistical'].includes(e.target.value) ? 'debit' : 'credit'
                          })}
                          className="w-full px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg text-slate-700"
                        >
                          <option value="assets">1000-1999: Assets</option>
                          <option value="liabilities">2000-2999: Liabilities</option>
                          <option value="equity">3000-3999: Equity</option>
                          <option value="revenue">4000-4999: Revenue</option>
                          <option value="cost_of_sales">5000-5999: Cost of Sales</option>
                          <option value="direct_expenses">6000-6999: Direct Expenses</option>
                          <option value="indirect_expenses">7000-7999: Indirect Expenses</option>
                          <option value="taxes_extraordinary">8000-8999: Taxes & Extraordinary</option>
                          <option value="statistical">9000-9999: Statistical Accounts</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="account_name" className="text-sm font-medium text-slate-700">Account Name *</Label>
                      <Input
                        id="account_name"
                        placeholder="e.g. Equipment and Furniture"
                        value={newAccount.account_name}
                        onChange={(e) => setNewAccount({...newAccount, account_name: e.target.value})}
                        className="bg-white/60 backdrop-blur-sm border-white/30"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="normal_balance" className="text-sm font-medium text-slate-700">Normal Balance</Label>
                        <select
                          id="normal_balance"
                          value={newAccount.normal_balance}
                          onChange={(e) => setNewAccount({...newAccount, normal_balance: e.target.value})}
                          className="w-full px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg text-slate-700"
                        >
                          <option value="debit">Debit</option>
                          <option value="credit">Credit</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <input
                          type="checkbox"
                          id="vat_applicable"
                          checked={newAccount.vat_applicable}
                          onChange={(e) => setNewAccount({...newAccount, vat_applicable: e.target.checked})}
                          className="rounded border-white/30"
                        />
                        <Label htmlFor="vat_applicable" className="text-sm font-medium text-slate-700">VAT Applicable (5%)</Label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of this account..."
                        value={newAccount.description}
                        onChange={(e) => setNewAccount({...newAccount, description: e.target.value})}
                        className="bg-white/60 backdrop-blur-sm border-white/30"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                      className="border-white/30 text-slate-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddAccount}
                      disabled={isSubmitting || !newAccount.account_code || !newAccount.account_name}
                      className="bg-gradient-to-r from-pink-500/90 to-purple-600/90 hover:from-pink-600 hover:to-purple-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Account
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* HERA Progressive Mode Alert */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert className="bg-blue-50/80 backdrop-blur-sm border-blue-200/50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 font-medium">
              <strong>📱 Progressive Mode Active!</strong> Your COA data is stored locally with {accounts.length} accounts. 
              Full CRUD functionality available - add, edit, delete accounts instantly!
            </AlertDescription>
          </Alert>
          
          <Alert className="bg-amber-50/80 backdrop-blur-sm border-amber-200/50">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 font-medium flex items-center justify-between">
              <span><strong>🔄 Reset Available:</strong> Restore default accounts anytime.</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={resetCOAData}
                className="ml-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                Reset COA
              </Button>
            </AlertDescription>
          </Alert>
        </div>

        {/* Account Categories */}
        <div className="space-y-4">
          {getAccountCategories(true).filter(category => category.accounts.length > 0).length === 0 ? (
            <Card className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/10 p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <Search className="w-12 h-12 text-slate-400" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No accounts found</h3>
                  <p className="text-slate-600">
                    {searchTerm ? (
                      <>No accounts match your search "<strong className="text-slate-800">{searchTerm}</strong>"</>
                    ) : (
                      <>No accounts found in the selected category</>
                    )}
                  </p>
                  {(searchTerm || selectedCategory !== 'all') && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedCategory('all')
                      }}
                      className="mt-4 border-white/30 text-slate-600"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            getAccountCategories(true).filter(category => category.accounts.length > 0).map(category => (
            <Card key={category.code} className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/10 overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-white/30 transition-all duration-200"
                onClick={() => toggleCategoryExpansion(category.code)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {expandedCategories.includes(category.code) ? (
                        <ChevronDown className="w-5 h-5 text-slate-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                      )}
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{category.name}</h3>
                      <p className="text-slate-600">{category.accounts.length} accounts</p>
                    </div>
                  </div>
                  <Badge className={`${category.color} px-3 py-1 font-medium`}>
                    {category.code === 'assets' && '1000-1999'}
                    {category.code === 'liabilities' && '2000-2999'}
                    {category.code === 'equity' && '3000-3999'}
                    {category.code === 'revenue' && '4000-4999'}
                    {category.code === 'expenses' && '5000-7999'}
                  </Badge>
                </div>
              </div>

              {expandedCategories.includes(category.code) && (
                <div className="border-t border-white/20 bg-white/10 backdrop-blur-sm">
                  <div className="p-4 space-y-3">
                    {category.accounts
                      .sort((a, b) => (a.presentation_order || 0) - (b.presentation_order || 0))
                      .map(account => (
                      <div key={account.id} className={`flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/60 transition-all duration-200 group ${
                        account.is_header ? 'bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border-blue-200/40' : ''
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <div className={`text-lg font-bold ${
                              account.is_header ? 'text-blue-800' : 'text-slate-800'
                            }`}>{account.entity_code}</div>
                            {account.account_level && (
                              <div className="text-xs text-slate-500">L{account.account_level}</div>
                            )}
                          </div>
                          <div className="flex-1">
                            {/* Hierarchical indentation based on account level */}
                            <div style={{ marginLeft: `${((account.account_level || 1) - 1) * 20}px` }}>
                              <h4 className={`${
                                account.is_header 
                                  ? 'font-bold text-blue-900 text-lg' 
                                  : 'font-semibold text-slate-800'
                              } group-hover:text-slate-900`}>
                                {account.is_header && '▶ '}{account.entity_name}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                                <span>Balance: {account.normal_balance}</span>
                                
                                {/* IFRS Classification Badge */}
                                {account.ifrs_classification && (
                                  <Badge className="bg-green-500/20 text-green-800 border-green-500/30 text-xs">
                                    IFRS: {account.ifrs_classification}
                                  </Badge>
                                )}
                                
                                {/* Parent Account Link */}
                                {account.parent_account && (
                                  <Badge className="bg-purple-500/20 text-purple-800 border-purple-500/30 text-xs">
                                    ↳ {account.parent_account}
                                  </Badge>
                                )}
                                
                                {account.vat_applicable === 'true' && (
                                  <Badge className="bg-blue-500/20 text-blue-800 border-blue-500/30 text-xs">
                                    VAT 5%
                                  </Badge>
                                )}
                                <Badge className="bg-slate-500/20 text-slate-800 border-slate-500/30 text-xs">
                                  AED
                                </Badge>
                              </div>
                              
                              {/* Rollup Information */}
                              {account.rollup_account && account.rollup_account !== account.parent_account && (
                                <div className="text-xs text-slate-500 mt-1">
                                  Rolls up to: {account.rollup_account}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-slate-600 hover:text-slate-800"
                            onClick={() => handleViewAccount(account)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-slate-600 hover:text-slate-800"
                            onClick={() => handleEditAccount(account)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {account.id.startsWith('progressive_') && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteAccount(account.id)}
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )))}
        </div>

        {/* IFRS Compliance Information */}
        <Card className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/10 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-2">IFRS-Compliant Hierarchical Structure</h3>
              <p className="text-slate-600 mb-4">
                Complete IFRS-compliant Chart of Accounts with proper lineage, parent-child relationships, 
                and hierarchical presentation following International Financial Reporting Standards.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 bg-white/40 backdrop-blur-sm rounded-lg">
                  <div className="font-medium text-slate-800 mb-2">Hierarchical Levels:</div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>• Level 1: Statement Categories (ASSETS, LIABILITIES)</div>
                    <div>• Level 2: Main Classifications (Current Assets, PPE)</div>
                    <div>• Level 3: Sub-classifications (Cash & Equivalents)</div>
                    <div>• Level 4: Detailed Accounts (CBD Bank Account)</div>
                  </div>
                </div>
                <div className="p-3 bg-white/40 backdrop-blur-sm rounded-lg">
                  <div className="font-medium text-slate-800 mb-2">IFRS Classifications:</div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>• Statement of Financial Position</div>
                    <div>• Statement of Profit or Loss</div>
                    <div>• Trade and Other Receivables</div>
                    <div>• Property, Plant and Equipment</div>
                  </div>
                </div>
                <div className="p-3 bg-white/40 backdrop-blur-sm rounded-lg">
                  <div className="font-medium text-slate-800 mb-2">Lineage Features:</div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>• Parent-Child Relationships</div>
                    <div>• Rollup Account Mapping</div>
                    <div>• Presentation Order Sorting</div>
                    <div>• Header Account Identification</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Smart Code Information */}
        <Card className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/10 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl">
              <Info className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-2">HERA Smart Code Integration</h3>
              <p className="text-slate-600 mb-4">
                Every account includes intelligent business context through HERA Smart Codes (HERA.AE.SALON.*) 
                enabling automatic GL posting, AI-powered insights, and cross-industry learning.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-white/40 backdrop-blur-sm rounded-lg">
                  <div className="font-medium text-slate-800">Sample Smart Codes:</div>
                  <div className="text-sm text-slate-600 space-y-1 mt-2">
                    <div>• HERA.AE.SALON.GL.REVENUE.4000.v1</div>
                    <div>• HERA.AE.SALON.GL.ASSETS.1000.v1</div>
                    <div>• HERA.AE.SALON.GL.LIABILITIES.2100.v1</div>
                  </div>
                </div>
                <div className="p-3 bg-white/40 backdrop-blur-sm rounded-lg">
                  <div className="font-medium text-slate-800">UAE Compliance Features:</div>
                  <div className="text-sm text-slate-600 space-y-1 mt-2">
                    <div>• 5% VAT Input/Output tracking</div>
                    <div>• MOHRE & Trade License accounts</div>
                    <div>• Multi-bank support (CBD, Emirates NBD)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* View Account Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-slate-800">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xl font-bold">Account Details</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedAccount && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50/50 backdrop-blur-sm rounded-lg">
                    <Label className="text-sm font-medium text-slate-600">Account Code</Label>
                    <div className="text-lg font-bold text-slate-800">{selectedAccount.entity_code}</div>
                  </div>
                  <div className="p-3 bg-blue-50/50 backdrop-blur-sm rounded-lg">
                    <Label className="text-sm font-medium text-slate-600">Account Type</Label>
                    <div className="text-lg font-semibold text-slate-800 capitalize">{selectedAccount.account_type}</div>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50/50 backdrop-blur-sm rounded-lg">
                  <Label className="text-sm font-medium text-slate-600">Account Name</Label>
                  <div className="text-lg font-semibold text-slate-800">{selectedAccount.entity_name}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50/50 backdrop-blur-sm rounded-lg">
                    <Label className="text-sm font-medium text-slate-600">Normal Balance</Label>
                    <div className="text-sm font-semibold text-slate-800 capitalize">{selectedAccount.normal_balance}</div>
                  </div>
                  <div className="p-3 bg-blue-50/50 backdrop-blur-sm rounded-lg">
                    <Label className="text-sm font-medium text-slate-600">VAT Applicable</Label>
                    <div className="flex items-center gap-2">
                      <Badge className={selectedAccount.vat_applicable === 'true' ? 'bg-green-500/20 text-green-800 border-green-500/30' : 'bg-gray-500/20 text-gray-800 border-gray-500/30'}>
                        {selectedAccount.vat_applicable === 'true' ? 'Yes (5%)' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* IFRS Lineage Information */}
                {(selectedAccount.ifrs_classification || selectedAccount.parent_account || selectedAccount.account_level) && (
                  <div className="p-3 bg-emerald-50/50 backdrop-blur-sm rounded-lg border border-emerald-200/30">
                    <Label className="text-sm font-medium text-emerald-700 mb-2 block">IFRS Lineage & Hierarchy</Label>
                    <div className="space-y-2">
                      {selectedAccount.ifrs_classification && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">IFRS Classification:</span>
                          <Badge className="bg-emerald-500/20 text-emerald-800 border-emerald-500/30 text-xs">
                            {selectedAccount.ifrs_classification}
                          </Badge>
                        </div>
                      )}
                      {selectedAccount.account_level && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Account Level:</span>
                          <Badge className="bg-blue-500/20 text-blue-800 border-blue-500/30 text-xs">
                            Level {selectedAccount.account_level}
                          </Badge>
                        </div>
                      )}
                      {selectedAccount.parent_account && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Parent Account:</span>
                          <Badge className="bg-purple-500/20 text-purple-800 border-purple-500/30 text-xs">
                            {selectedAccount.parent_account}
                          </Badge>
                        </div>
                      )}
                      {selectedAccount.rollup_account && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Rolls up to:</span>
                          <Badge className="bg-indigo-500/20 text-indigo-800 border-indigo-500/30 text-xs">
                            {selectedAccount.rollup_account}
                          </Badge>
                        </div>
                      )}
                      {selectedAccount.is_header && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Account Type:</span>
                          <Badge className="bg-orange-500/20 text-orange-800 border-orange-500/30 text-xs">
                            Header Account
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-blue-50/50 backdrop-blur-sm rounded-lg">
                  <Label className="text-sm font-medium text-slate-600">Smart Code</Label>
                  <div className="text-sm font-mono text-slate-700 bg-white/60 p-2 rounded border mt-1">
                    {selectedAccount.smart_code}
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 backdrop-blur-sm rounded-lg">
                  <Label className="text-sm font-medium text-slate-600">Status & Currency</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-green-500/20 text-green-800 border-green-500/30">
                      {selectedAccount.status}
                    </Badge>
                    <Badge className="bg-slate-500/20 text-slate-800 border-slate-500/30">
                      AED
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
                className="border-white/30 text-slate-600"
              >
                Close
              </Button>
              {selectedAccount && (
                <Button
                  onClick={() => {
                    setShowViewModal(false)
                    handleEditAccount(selectedAccount)
                  }}
                  className="bg-gradient-to-r from-blue-500/90 to-indigo-600/90 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Account
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Account Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-slate-800">
                <div className="p-2 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-lg">
                  <Edit className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-xl font-bold">Edit Account</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_account_code" className="text-sm font-medium text-slate-700">Account Code *</Label>
                  <Input
                    id="edit_account_code"
                    placeholder="e.g. 1500"
                    value={editAccount.account_code}
                    onChange={(e) => setEditAccount({...editAccount, account_code: e.target.value})}
                    className="bg-white/60 backdrop-blur-sm border-white/30"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_account_type" className="text-sm font-medium text-slate-700">Account Type *</Label>
                  <select
                    id="edit_account_type"
                    value={editAccount.account_type}
                    onChange={(e) => setEditAccount({
                      ...editAccount, 
                      account_type: e.target.value,
                      normal_balance: ['assets', 'cost_of_sales', 'direct_expenses', 'indirect_expenses', 'taxes_extraordinary', 'statistical'].includes(e.target.value) ? 'debit' : 'credit'
                    })}
                    className="w-full px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg text-slate-700"
                  >
                    <option value="assets">1000-1999: Assets</option>
                    <option value="liabilities">2000-2999: Liabilities</option>
                    <option value="equity">3000-3999: Equity</option>
                    <option value="revenue">4000-4999: Revenue</option>
                    <option value="cost_of_sales">5000-5999: Cost of Sales</option>
                    <option value="direct_expenses">6000-6999: Direct Expenses</option>
                    <option value="indirect_expenses">7000-7999: Indirect Expenses</option>
                    <option value="taxes_extraordinary">8000-8999: Taxes & Extraordinary</option>
                    <option value="statistical">9000-9999: Statistical Accounts</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_account_name" className="text-sm font-medium text-slate-700">Account Name *</Label>
                <Input
                  id="edit_account_name"
                  placeholder="e.g. Equipment and Furniture"
                  value={editAccount.account_name}
                  onChange={(e) => setEditAccount({...editAccount, account_name: e.target.value})}
                  className="bg-white/60 backdrop-blur-sm border-white/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_normal_balance" className="text-sm font-medium text-slate-700">Normal Balance</Label>
                  <select
                    id="edit_normal_balance"
                    value={editAccount.normal_balance}
                    onChange={(e) => setEditAccount({...editAccount, normal_balance: e.target.value})}
                    className="w-full px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-lg text-slate-700"
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="edit_vat_applicable"
                    checked={editAccount.vat_applicable}
                    onChange={(e) => setEditAccount({...editAccount, vat_applicable: e.target.checked})}
                    className="rounded border-white/30"
                  />
                  <Label htmlFor="edit_vat_applicable" className="text-sm font-medium text-slate-700">VAT Applicable (5%)</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="border-white/30 text-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAccount}
                disabled={isSubmitting || !editAccount.account_code || !editAccount.account_name}
                className="bg-gradient-to-r from-orange-500/90 to-red-600/90 hover:from-orange-600 hover:to-red-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Account
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  )
}