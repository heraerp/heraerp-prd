'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, Plus, Trash2, Save, Send, X, CheckCircle, AlertCircle, 
  Sparkles, Calculator, TrendingUp, DollarSign, Calendar, Building2,
  User, Package, ChevronDown, ChevronRight, Copy, Upload, Download,
  Eye, EyeOff, Zap, Target, Clock, Edit2, MoreVertical, Search,
  Filter, RefreshCw, Lock, Unlock, AlertTriangle, Info, ClipboardList
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Professional Toast Component
const Toast = ({ message, type, isVisible, onClose }: {
  message: string
  type: 'success' | 'error' | 'info'
  isVisible: boolean
  onClose: () => void
}) => {
  if (!isVisible) return null

  const getToastStyles = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'info': return <Building2 className="w-5 h-5 text-blue-600" />
      default: return null
    }
  }

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right duration-300">
      <div className={`${getToastStyles()} rounded-xl border p-4 shadow-lg backdrop-blur-xl bg-white/90 min-w-[320px] max-w-md`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-relaxed">{message}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

const HERAPURCHASEREQUISITIONApp = () => {
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()
  
  const [activeTab, setActiveTab] = useState('header')
  const [transactionType, setTransactionType] = useState('PURCHASE_REQUISITION')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  })

  // Transaction Header Data
  const [headerData, setHeaderData] = useState({
    pr_number: 'PR-2025-001',
    requester_id: '',
    department: '',
    pr_date: new Date().toISOString().split('T')[0],
    required_date: new Date().toISOString().split('T')[0],
    priority: 'Low',
    currency_code: 'USD',
    budget_code: '',
    justification: '',
    smart_code: 'HERA.PROCUREMENT.TXN.PURCHASE_REQUISITION.v1',
    status: 'draft',
    total_amount: 0.00
  })

  // Transaction Lines
  const [lines, setLines] = useState([
    { 
      id: 1, 
      line_number: 10, 
      item_description: '',
      specification: '',
      quantity: 1, // Default quantity to 1
      estimated_cost: 0, // Default quantity to 1
      preferred_vendor: '',
      required_date: new Date().toISOString().split('T')[0],
      line_amount: 0.00,
      editing: false 
    }
  ])

  // Toast helper functions
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 5000)
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])

  // Update header data
  const updateHeaderData = useCallback((field: string, value: string | number) => {
    setHeaderData(prev => ({ ...prev, [field]: value }))
  }, [])

  // Add new line
  const addLine = useCallback(() => {
    const newLineNumber = Math.max(...lines.map(l => l.line_number)) + 10
    const newLine = {
      id: Date.now(),
      line_number: newLineNumber,
      item_description: '',
      specification: '',
      quantity: 1,
      estimated_cost: 0,
      preferred_vendor: '',
      required_date: new Date().toISOString().split('T')[0],
      line_amount: 0.00,
      editing: true
    }
    setLines(prev => [...prev, newLine])
  }, [lines])

  // Remove line
  const removeLine = useCallback((lineId: number) => {
    setLines(prev => prev.filter(line => line.id !== lineId))
  }, [])

  // Update line data
  const updateLineData = useCallback((lineId: number, field: string, value: string | number) => {
    setLines(prev => prev.map(line => {
      if (line.id === lineId) {
        const updatedLine = { ...line, [field]: value }
        
        // Auto-calculate line amount based on quantity and unit price
        if (field === 'quantity' || field === 'unit_price' || field === 'estimated_cost') {
          const qty = field === 'quantity' ? Number(value) : Number(updatedLine.quantity || updatedLine.transfer_qty || 1)
          const price = field === 'unit_price' ? Number(value) : 
                      field === 'estimated_cost' ? Number(value) :
                      Number(updatedLine.unit_price || updatedLine.estimated_cost || 0)
          updatedLine.line_amount = qty * price
        }
        
        return updatedLine
      }
      return line
    }))
  }, [])

  // Calculate total amount
  useEffect(() => {
    const total = lines.reduce((sum, line) => sum + (line.line_amount || 0), 0)
    setHeaderData(prev => ({ ...prev, total_amount: total }))
  }, [lines])

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!user?.id || !organization?.id) {
      showToast('Authentication required. Please log in.', 'error')
      return
    }

    if (lines.length === 0) {
      showToast('Please add at least one line item.', 'error')
      return
    }

    setIsSubmitting(true)
    showToast('Creating purchase requisition...', 'info')

    try {
      // Prepare transaction data for HERA API v2
      const transactionData = {
        transaction_type: 'purchase_requisition',
        transaction_code: headerData.pr_number,
        smart_code: headerData.smart_code,
        organization_id: organization.id,
        requester_entity_id: headerData.requester_id,
        total_amount: headerData.total_amount,
        transaction_currency_code: headerData.currency_code,
        transaction_date: headerData.pr_date,
        transaction_status: headerData.status
      }
      
      // Prepare transaction lines for RPC call
      const transactionLines = lines.map((line, index) => ({
        line_number: line.line_number,
        line_type: 'ITEM',
        entity_id: line.item_description,
        description: line.description,
        quantity: line.quantity || line.transfer_qty || line.received_qty || 1,
        unit_amount: line.unit_price || line.estimated_cost || 0,
        line_amount: line.line_amount,
        line_data: {
          quantity: line.quantity,
          estimated_cost: line.estimated_cost,
          preferred_vendor: line.preferred_vendor,
          required_date: line.required_date
        }
      }))
      
      console.log('Purchase Requisition transaction data:', { transactionData, transactionLines })
      
      // RPC call structure ready for hera_txn_crud_v1
      /*
      const result = await callRPC('hera_txn_crud_v1', {
        p_action: 'CREATE',
        // ✅ HERA v2.4: Use USER entity ID (not auth UID)
        p_actor_user_id: user?.entity_id || user?.id,
        p_organization_id: organization.id,
        p_transaction: transactionData,
        p_lines: transactionLines,
        p_options: {}
      })
      */
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      showToast(`Purchase Requisition "${headerData.pr_number}" created successfully! Redirecting...`, 'success')
      
      setTimeout(() => {
        router.push('/enterprise/procurement')
      }, 2000)
      
    } catch (error) {
      console.error('Submit error:', error)
      showToast('Failed to create purchase requisition. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [headerData, lines, organization?.id, user?.id, router, showToast])

  // Authentication checks
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access purchase requisition management.</p>
        </div>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Organization Context Required</h2>
          <p className="text-gray-600">Please select an organization to continue.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Mobile header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      
      <div className="md:hidden sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Purchase Requisition</h1>
              <p className="text-xs text-gray-600">HERA PROCUREMENT</p>
            </div>
          </div>
          <button className="min-w-[44px] min-h-[44px] rounded-full bg-gray-100 flex items-center justify-center active:scale-95">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 lg:p-6">
          
          {/* Left sidebar - Status & Controls */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6 space-y-6">
              
              {/* Transaction Status Card */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      {headerData.status.charAt(0).toUpperCase() + headerData.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Lines</span>
                    <span className="text-sm font-medium text-gray-900">{lines.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-sm font-medium text-gray-900">
                      {headerData.currency_code} {headerData.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                    <Save className="w-4 h-4" />
                    Save Draft
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                    <Upload className="w-4 h-4" />
                    Import Lines
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl">
              
              {/* Header with tabs */}
              <div className="p-6 border-b border-gray-200/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Purchase Requisition</h1>
                    <p className="text-gray-600">Request approval for procurement purchases</p>
                  </div>
                </div>
                
                {/* Tab navigation */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  {['header', 'lines', 'preview'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                        activeTab === tab
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Tab content */}
              <div className="p-6">
                {activeTab === 'header' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">Transaction Header</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Requisition Number *
                        </label>
                        <input
                          type="text"
                          value={headerData.pr_number}
                          onChange={(e) => updateHeaderData('pr_number', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="PR-2025-001"
                          readOnly
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Requester *
                        </label>
                        <select
                          value={headerData.requester_id}
                          onChange={(e) => updateHeaderData('requester_id', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select requester</option>

                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department *
                        </label>
                        <select
                          value={headerData.department}
                          onChange={(e) => updateHeaderData('department', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select department</option>

                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Request Date *
                        </label>
                        <input
                          type="date"
                          value={headerData.pr_date}
                          onChange={(e) => updateHeaderData('pr_date', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder=""
                          
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Required By Date *
                        </label>
                        <input
                          type="date"
                          value={headerData.required_date}
                          onChange={(e) => updateHeaderData('required_date', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder=""
                          
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority *
                        </label>
                        <select
                          value={headerData.priority}
                          onChange={(e) => updateHeaderData('priority', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select priority</option>
                          <option value="Low">Low</option>
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency *
                        </label>
                        <select
                          value={headerData.currency_code}
                          onChange={(e) => updateHeaderData('currency_code', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select currency</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="AED">AED</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Budget Code 
                        </label>
                        <select
                          value={headerData.budget_code}
                          onChange={(e) => updateHeaderData('budget_code', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          
                        >
                          <option value="">Select budget</option>

                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Justification *
                        </label>
                        <textarea
                          value={headerData.justification}
                          onChange={(e) => updateHeaderData('justification', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Explain the business need for this requisition"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'lines' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Transaction Lines</h2>
                      <button
                        onClick={addLine}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add Line
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {lines.map((line, index) => (
                        <div key={line.id} className="bg-gray-50 rounded-lg p-4 border">
                          <div className="flex items-center justify-between mb-4">
                            <span className="font-medium text-gray-900">Line {line.line_number}</span>
                            <button
                              onClick={() => removeLine(line.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Item Description *
                              </label>
                              <input
                                type="text"
                                value={line.item_description}
                                onChange={(e) => updateLineData(line.id, 'item_description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Describe the item needed"
                                
                              />
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Specifications 
                              </label>
                              <textarea
                                value={line.specification}
                                onChange={(e) => updateLineData(line.id, 'specification', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Technical specifications"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity *
                              </label>
                              <input
                                type="number"
                                value={line.quantity}
                                onChange={(e) => updateLineData(line.id, 'quantity', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="1"
                                
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estimated Unit Cost *
                              </label>
                              <input
                                type="number"
                                value={line.estimated_cost}
                                onChange={(e) => updateLineData(line.id, 'estimated_cost', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                                
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Preferred Vendor 
                              </label>
                              <select
                                value={line.preferred_vendor}
                                onChange={(e) => updateLineData(line.id, 'preferred_vendor', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select vendor</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Required Date *
                              </label>
                              <input
                                type="date"
                                value={line.required_date}
                                onChange={(e) => updateLineData(line.id, 'required_date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder=""
                                
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Line Amount</label>
                              <input
                                type="number"
                                value={line.line_amount}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'preview' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">Purchase Requisition Preview</h2>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Requisition Summary</h3>
                      <div className="text-sm text-gray-600">
                        Preview content for requisition summary will be displayed here.
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Requester Details</h3>
                      <div className="text-sm text-gray-600">
                        Preview content for requester details will be displayed here.
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Line Items</h3>
                      <div className="text-sm text-gray-600">
                        Preview content for line items will be displayed here.
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Approval Workflow</h3>
                      <div className="text-sm text-gray-600">
                        Preview content for approval workflow will be displayed here.
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer with submit button */}
              <div className="px-6 py-4 border-t border-gray-200/50 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {lines.length} line{lines.length !== 1 ? 's' : ''} • Total: {headerData.currency_code} {headerData.total_amount.toFixed(2)}
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateHeaderData('status', 'draft')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Create Purchase Requisition
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right sidebar - AI Assistant */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    I can help you with purchase requisition creation and approval workflow. Ask me about:
                  </div>
                  
                  <div className="space-y-2">
                    <button className="w-full text-left p-3 text-sm bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700">
                      💡 Suggest line items based on previous transactions
                    </button>
                    <button className="w-full text-left p-3 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700">
                      📊 Validate pricing and calculations
                    </button>
                    <button className="w-full text-left p-3 text-sm bg-green-50 hover:bg-green-100 rounded-lg text-green-700">
                      ✅ Check compliance requirements
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <textarea
                      placeholder="Ask me anything about this purchase requisition..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      rows={3}
                    />
                    <button className="w-full mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                      Ask AI Assistant
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile bottom spacing */}
      <div className="h-24 lg:h-0" />

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  )
}

export default HERAPURCHASEREQUISITIONApp