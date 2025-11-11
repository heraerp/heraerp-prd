'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  testCrudOperations,
  initializeStandardData,
  customerCrud,
  vendorCrud,
  productCrud,
  salesOrderCrud,
  invoiceCrud,
  MasterDataEntity,
  TransactionEntity,
  STANDARD_DEMO_ORGANIZATION,
  getStandardOrgId
} from '@/lib/crud/hera-crud-operations'
import {
  Database,
  Users,
  Package,
  FileText,
  DollarSign,
  Building2,
  Play,
  CheckCircle,
  XCircle,
  RefreshCw,
  Home,
  Plus,
  Eye,
  Edit3,
  Trash2,
  ArrowRight
} from 'lucide-react'

export default function CrudDemoPage() {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const [customers, setCustomers] = useState<MasterDataEntity[]>([])
  const [vendors, setVendors] = useState<MasterDataEntity[]>([])
  const [products, setProducts] = useState<MasterDataEntity[]>([])
  const [transactions, setTransactions] = useState<TransactionEntity[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  const [newCustomer, setNewCustomer] = useState({
    entity_name: '',
    email: '',
    phone: '',
    credit_limit: 0
  })

  const [newTransaction, setNewTransaction] = useState({
    source_entity_id: '',
    total_amount: 0,
    description: 'Test transaction'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const customersData = await customerCrud.read() as MasterDataEntity[]
      const vendorsData = await vendorCrud.read() as MasterDataEntity[]
      const productsData = await productCrud.read() as MasterDataEntity[]
      const transactionsData = await salesOrderCrud.read() as TransactionEntity[]

      setCustomers(customersData)
      setVendors(vendorsData)
      setProducts(productsData)
      setTransactions(transactionsData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const runFullTest = async () => {
    setIsRunning(true)
    setTestResults([])
    
    const addResult = (message: string) => {
      setTestResults(prev => [...prev, message])
    }

    try {
      addResult('🔧 Starting HERA CRUD Operations Test...')
      
      const success = await testCrudOperations()
      
      if (success) {
        addResult('✅ All CRUD operations completed successfully!')
        addResult('🎯 Master data and transactions working properly')
        addResult(`🏢 Using standard organization: HERA Demo Corporation`)
        addResult(`🆔 Organization ID: 550e8400-e29b-41d4-a716-446655440000`)
        await loadData()
      } else {
        addResult('❌ Some operations failed')
      }
    } catch (error) {
      addResult(`❌ Test failed: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  const initializeData = async () => {
    setIsRunning(true)
    try {
      await initializeStandardData()
      setTestResults(['✅ Standard demo data initialized'])
      await loadData()
    } catch (error) {
      setTestResults([`❌ Initialization failed: ${error}`])
    } finally {
      setIsRunning(false)
    }
  }

  const createCustomer = async () => {
    try {
      await customerCrud.create({
        entity_name: newCustomer.entity_name,
        core_dynamic_data: {
          email: newCustomer.email,
          phone: newCustomer.phone,
          credit_limit: newCustomer.credit_limit
        }
      })
      
      setNewCustomer({ entity_name: '', email: '', phone: '', credit_limit: 0 })
      await loadData()
      setTestResults(prev => [...prev, `✅ Customer "${newCustomer.entity_name}" created`])
    } catch (error) {
      setTestResults(prev => [...prev, `❌ Failed to create customer: ${error}`])
    }
  }

  const createSalesOrder = async () => {
    try {
      const order = await salesOrderCrud.create({
        source_entity_id: newTransaction.source_entity_id,
        total_amount: newTransaction.total_amount,
        transaction_status: 'PENDING'
      })

      await salesOrderCrud.addLine(order.id, {
        description: newTransaction.description,
        quantity: 1,
        unit_amount: newTransaction.total_amount,
        line_amount: newTransaction.total_amount
      })

      setNewTransaction({ source_entity_id: '', total_amount: 0, description: 'Test transaction' })
      await loadData()
      setTestResults(prev => [...prev, `✅ Sales order "${order.transaction_code}" created`])
    } catch (error) {
      setTestResults(prev => [...prev, `❌ Failed to create sales order: ${error}`])
    }
  }

  const deleteEntity = async (type: string, id: string, name: string) => {
    try {
      if (type === 'customer') {
        await customerCrud.delete(id)
      } else if (type === 'vendor') {
        await vendorCrud.delete(id)
      } else if (type === 'product') {
        await productCrud.delete(id)
      } else if (type === 'transaction') {
        await salesOrderCrud.delete(id)
      }
      
      await loadData()
      setTestResults(prev => [...prev, `✅ ${type} "${name}" deleted`])
    } catch (error) {
      setTestResults(prev => [...prev, `❌ Failed to delete ${type}: ${error}`])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">CRUD Demo</h1>
              <p className="text-xs text-gray-600">Test Operations</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="min-w-[44px] min-h-[44px] rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
          >
            <Home className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">HERA CRUD Operations Demo</h1>
                <p className="text-green-100 text-lg">Test master data and transaction CRUD operations</p>
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Organization Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Standard Demo Organization</h3>
              <p className="text-gray-600">All operations use this organization context</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <p className="text-gray-900">HERA Demo Corporation</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">ID:</span>
                <p className="text-gray-900 font-mono text-xs">550e8400-e29b-41d4-a716-446655440000</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Currency:</span>
                <p className="text-gray-900">AED</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Operations</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={runFullTest}
              disabled={isRunning}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Run Full CRUD Test
            </button>
            
            <button
              onClick={initializeData}
              disabled={isRunning}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Initialize Demo Data
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
            <div className="bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="text-green-400 font-mono text-sm mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'transactions', label: 'Transactions', icon: FileText },
                { id: 'create', label: 'Create New', icon: Plus }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
                  <div className="text-sm text-gray-600">Customers</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{vendors.length}</div>
                  <div className="text-sm text-gray-600">Vendors</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{products.length}</div>
                  <div className="text-sm text-gray-600">Products</div>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
                  <div className="text-sm text-gray-600">Transactions</div>
                </div>
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Customer Master Data</h4>
                {customers.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    No customers found. Run initialization to create demo data.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customers.map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{customer.entity_name}</div>
                          <div className="text-sm text-gray-600">
                            Code: {customer.entity_code} | Smart Code: {customer.smart_code}
                          </div>
                          {customer.core_dynamic_data?.email && (
                            <div className="text-sm text-gray-600">
                              Email: {customer.core_dynamic_data.email}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteEntity('customer', customer.id, customer.entity_name)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Transaction Data</h4>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    No transactions found. Create a sales order to test transactions.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.transaction_code} ({transaction.transaction_type})
                          </div>
                          <div className="text-sm text-gray-600">
                            Amount: AED {transaction.total_amount.toLocaleString()} | Status: {transaction.transaction_status}
                          </div>
                          <div className="text-sm text-gray-600">
                            Lines: {transaction.lines?.length || 0} | Smart Code: {transaction.smart_code}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEntity('transaction', transaction.id, transaction.transaction_code)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'create' && (
              <div className="space-y-8">
                {/* Create Customer */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Create New Customer</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={newCustomer.entity_name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, entity_name: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Credit Limit"
                      value={newCustomer.credit_limit}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, credit_limit: Number(e.target.value) }))}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={createCustomer}
                    disabled={!newCustomer.entity_name}
                    className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    Create Customer
                  </button>
                </div>

                {/* Create Sales Order */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Create New Sales Order</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={newTransaction.source_entity_id}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, source_entity_id: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.entity_name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={newTransaction.total_amount}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, total_amount: Number(e.target.value) }))}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                    />
                  </div>
                  <button
                    onClick={createSalesOrder}
                    disabled={!newTransaction.source_entity_id || !newTransaction.total_amount}
                    className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    Create Sales Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom spacing for mobile */}
        <div className="h-24 md:h-0"></div>
      </div>
    </div>
  )
}