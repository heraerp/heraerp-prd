'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, Plus, Trash2, Save, Send, X, CheckCircle, AlertCircle, 
  Sparkles, Calculator, TrendingUp, DollarSign, Calendar, Building2,
  User, Package, ChevronDown, ChevronRight, Copy, Upload, Download,
  Eye, EyeOff, Zap, Target, Clock, Edit2, MoreVertical, Search,
  Filter, RefreshCw, Lock, Unlock, AlertTriangle, Info, Truck,
  MapPin, Phone, Mail, Hash, CreditCard, ShoppingCart
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { OrganizationSelector } from '@/components/transaction/OrganizationSelector'

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
      case 'success': return 'bg-green-50 border-green-300 text-green-900 border-2'
      case 'error': return 'bg-red-50 border-red-300 text-red-900 border-2'
      case 'info': return 'bg-blue-50 border-blue-300 text-blue-900 border-2'
      default: return 'bg-gray-50 border-gray-300 text-gray-900 border-2'
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
    <div className="fixed top-4 right-4 z-[9999] transform transition-all duration-300 ease-out">
      <div className={`${getToastStyles()} rounded-lg border p-4 shadow-xl min-w-[320px] max-w-md`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-relaxed">{message}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 hover:bg-gray-100 rounded p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

const HERAPurchaseOrderApp = () => {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()
  
  const [activeTab, setActiveTab] = useState('header')
  const [transactionType, setTransactionType] = useState('PURCHASE_ORDER')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  })

  // Purchase Order Lines
  const [lines, setLines] = useState([
    { 
      id: 1, 
      line_number: 10, 
      product_code: 'LAPTOP-001', 
      description: 'Dell Laptop i7 16GB RAM', 
      quantity: 5, 
      unit_price: 1200.00, 
      line_amount: 6000.00,
      delivery_date: '2025-11-15',
      product_category: 'ELECTRONICS',
      editing: false 
    },
    { 
      id: 2, 
      line_number: 20, 
      product_code: 'DESK-001', 
      description: 'Office Desk Ergonomic', 
      quantity: 10, 
      unit_price: 450.00, 
      line_amount: 4500.00,
      delivery_date: '2025-11-20',
      product_category: 'FURNITURE',
      editing: false 
    },
    { 
      id: 3, 
      line_number: 30, 
      product_code: 'CHAIR-001', 
      description: 'Executive Office Chair', 
      quantity: 10, 
      unit_price: 250.00, 
      line_amount: 2500.00,
      delivery_date: '2025-11-20',
      product_category: 'FURNITURE',
      editing: false 
    }
  ])

  // Purchase Order Header
  const [headerData, setHeaderData] = useState({
    po_number: 'PO-2025-000123',
    po_date: '2025-10-29',
    currency_code: 'AED',
    exchange_rate: 1.0,
    total_amount: 13000.00,
    smart_code: 'HERA.PROCUREMENT.TXN.PURCHASE_ORDER.v1',
    status: 'draft',
    vendor_id: 'VEN-001',
    vendor_name: 'Tech Solutions LLC',
    delivery_address: 'Office Building A, Floor 5, Business Bay, Dubai',
    payment_terms: 'NET_30',
    delivery_terms: 'FOB',
    notes: 'Urgent requirement for Q4 expansion project'
  })

  const [showAI, setShowAI] = useState(true)
  const [postingMode, setPostingMode] = useState('draft') // draft, validate, approve, send

  // ALL CALLBACK HOOKS - ALWAYS CALLED
  // Toast helper functions
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 5000)
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])

  // Calculate totals using useMemo to prevent infinite re-renders
  const { subtotal, tax, total } = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + (line.line_amount || 0), 0)
    const tax = subtotal * 0.05 // 5% VAT
    const total = subtotal + tax
    return { subtotal, tax, total }
  }, [lines])

  // Update header data when totals change - SEPARATE useEffect
  useEffect(() => {
    setHeaderData(prev => ({ ...prev, total_amount: total }))
  }, [total])

  // ALL REMAINING FUNCTIONS - ALWAYS DEFINED
  // Transaction type templates
  const transactionTypes = {
    PURCHASE_ORDER: { 
      icon: ShoppingCart, 
      label: 'Purchase Order', 
      color: '#0070F3',
      smart_code: 'HERA.PROCUREMENT.TXN.PURCHASE_ORDER.v1',
      description: 'Purchase order for goods and services'
    },
    PURCHASE_REQUISITION: { 
      icon: FileText, 
      label: 'Purchase Requisition', 
      color: '#FF0080',
      smart_code: 'HERA.PROCUREMENT.TXN.REQUISITION.v1',
      description: 'Internal purchase request requiring approval'
    },
    GOODS_RECEIPT: { 
      icon: Package, 
      label: 'Goods Receipt', 
      color: '#18A058',
      smart_code: 'HERA.PROCUREMENT.TXN.RECEIPT.v1',
      description: 'Receipt confirmation of delivered goods'
    },
    PURCHASE_RETURN: { 
      icon: Truck, 
      label: 'Purchase Return', 
      color: '#F59E0B',
      smart_code: 'HERA.PROCUREMENT.TXN.RETURN.v1',
      description: 'Return of goods to supplier'
    }
  }

  const currentType = transactionTypes[transactionType]

  // Sample vendors
  const vendors = [
    { id: 'VEN-001', name: 'Tech Solutions LLC', contact: '+971-50-123-4567' },
    { id: 'VEN-002', name: 'Office Supplies Co.', contact: '+971-55-987-6543' },
    { id: 'VEN-003', name: 'Furniture World', contact: '+971-52-456-7890' }
  ]

  // Sample products
  const products = [
    { code: 'LAPTOP-001', name: 'Dell Laptop i7 16GB RAM', category: 'ELECTRONICS', unit_price: 1200.00 },
    { code: 'DESK-001', name: 'Office Desk Ergonomic', category: 'FURNITURE', unit_price: 450.00 },
    { code: 'CHAIR-001', name: 'Executive Office Chair', category: 'FURNITURE', unit_price: 250.00 },
    { code: 'MONITOR-001', name: '27" 4K Monitor', category: 'ELECTRONICS', unit_price: 350.00 },
    { code: 'PHONE-001', name: 'Business IP Phone', category: 'ELECTRONICS', unit_price: 120.00 }
  ]

  // ALL LINE MANAGEMENT FUNCTIONS - ALWAYS DEFINED
  // Add new line
  const addLine = () => {
    const newLineNumber = lines.length > 0 ? Math.max(...lines.map(l => l.line_number)) + 10 : 10
    setLines([...lines, {
      id: Date.now(),
      line_number: newLineNumber,
      product_code: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      line_amount: 0,
      delivery_date: '',
      product_category: '',
      editing: true
    }])
  }

  // Remove line
  const removeLine = (id: number) => {
    const updatedLines = lines.filter(l => l.id !== id)
    setLines(updatedLines)
  }

  // Update line
  const updateLine = (id: number, field: string, value: any) => {
    const updatedLines = lines.map(l => {
      if (l.id === id) {
        const updatedLine = { ...l, [field]: value }
        
        // Auto-calculate line amount when quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
          updatedLine.line_amount = (updatedLine.quantity || 0) * (updatedLine.unit_price || 0)
        }
        
        // Auto-fill product details when product_code changes
        if (field === 'product_code') {
          const product = products.find(p => p.code === value)
          if (product) {
            updatedLine.description = product.name
            updatedLine.product_category = product.category
            updatedLine.unit_price = product.unit_price
            updatedLine.line_amount = (updatedLine.quantity || 0) * product.unit_price
          }
        }
        
        return updatedLine
      }
      return l
    })
    setLines(updatedLines)
  }

  // Submit Purchase Order using HERA RPC - ALWAYS DEFINED
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    
    try {
      // Prepare transaction data for HERA API v2
      const transactionData = {
        transaction_type: 'purchase_order',
        transaction_code: headerData.po_number,
        smart_code: headerData.smart_code,
        organization_id: organization.id,
        source_entity_id: headerData.vendor_id, // Vendor
        total_amount: headerData.total_amount,
        transaction_currency_code: headerData.currency_code,
        transaction_date: headerData.po_date,
        transaction_status: headerData.status
      }

      // Prepare transaction lines
      const transactionLines = lines.map((line, index) => ({
        line_number: line.line_number,
        line_type: 'PRODUCT',
        entity_id: line.product_code, // Product entity reference
        description: line.description,
        quantity: line.quantity,
        unit_amount: line.unit_price,
        line_amount: line.line_amount,
        line_data: {
          product_category: line.product_category,
          delivery_date: line.delivery_date,
          product_code: line.product_code
        }
      }))

      // Here you would call the HERA RPC function
      console.log('Creating Purchase Order with HERA RPC:', {
        transactionData,
        transactionLines
      })

      // Simulate API call to hera_txn_crud_v1
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

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      showToast(
        `Purchase Order "${headerData.po_number}" has been successfully created for ${headerData.vendor_name}. Total amount: ${headerData.currency_code} ${headerData.total_amount.toFixed(2)}`,
        'success'
      )

      // Reset form or redirect
      setTimeout(() => {
        router.push('/enterprise/procurement')
      }, 2000)

    } catch (error) {
      console.error('Error creating Purchase Order:', error)
      showToast('Failed to create Purchase Order. Please check your inputs and try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }, [headerData, lines, organization?.id, user?.id, router, showToast])

  // ALL useEffect HOOKS - ALWAYS CALLED
  // Note: Total calculation is now handled by useMemo above

  // ALL DATA DEFINITIONS - ALWAYS DEFINED
  // AI Suggestions
  const aiSuggestions = [
    {
      type: 'procurement',
      title: 'Vendor Analysis',
      message: `${headerData.vendor_name} has excellent delivery performance (98%). Recommended approval.`,
      confidence: 0.94,
      action: 'View History'
    },
    {
      type: 'validation',
      title: 'Budget Check',
      message: `PO amount ${headerData.currency_code} ${headerData.total_amount.toFixed(2)} is within Q4 budget allocation.`,
      confidence: 1.0,
      action: 'View Budget'
    },
    {
      type: 'optimization',
      title: 'Cost Optimization',
      message: 'Consider bundling delivery for items with same delivery date to save 8% on shipping.',
      confidence: 0.87,
      action: 'Optimize'
    }
  ]

  // Totals are now calculated using useMemo above

  // EARLY RETURNS ONLY AFTER ALL HOOKS AND FUNCTIONS ARE DEFINED
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access procurement management.</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top Navigation Bar */}
      <nav className="h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-semibold text-slate-800">HERA</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
            <span className="text-sm text-slate-600">Procurement</span>
            <ChevronRight size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-800">Purchase Order</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Organization Selector */}
            <OrganizationSelector showFullName={true} showId={true} />
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
              <Clock size={14} className="text-slate-600" />
              <span className="text-xs font-medium text-slate-700">Auto-save: 30s ago</span>
            </div>
            
            <div className="h-6 w-px bg-slate-200" />
            
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Search size={18} className="text-slate-600" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <RefreshCw size={18} className="text-slate-600" />
            </button>
            
            {/* Test Toast Buttons - TEMPORARY for debugging (can be removed) */}
            <div className="flex gap-1">
              <button 
                onClick={() => showToast('✅ Success! Operation completed successfully.', 'success')}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                title="Test Success Toast"
              >
                ✅
              </button>
              <button 
                onClick={() => showToast('❌ Error! Something went wrong.', 'error')}
                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                title="Test Error Toast"
              >
                ❌
              </button>
              <button 
                onClick={() => showToast('ℹ️ Info: This is an informational message.', 'info')}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                title="Test Info Toast"
              >
                ℹ️
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Transaction Type Selector */}
      <div className="px-6 py-4 bg-white/60 backdrop-blur-xl border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Object.entries(transactionTypes).map(([key, type]) => {
              const Icon = type.icon
              return (
                <button
                  key={key}
                  onClick={() => {
                    setTransactionType(key)
                    setHeaderData({...headerData, smart_code: type.smart_code})
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
                    transactionType === key
                      ? 'bg-white shadow-lg scale-105 border-2'
                      : 'bg-white/50 hover:bg-white/80 border-2 border-transparent'
                  }`}
                  style={{
                    borderColor: transactionType === key ? type.color : 'transparent'
                  }}
                >
                  <Icon size={18} style={{ color: type.color }} />
                  <span className="font-medium text-slate-700 text-sm">{type.label}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-xl transition-all">
              <Upload size={16} className="text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Import</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-xl transition-all">
              <Copy size={16} className="text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Duplicate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-9rem)] overflow-hidden">
        
        {/* LEFT - Status & Controls */}
        <div className="w-80 bg-white/70 backdrop-blur-xl border-r border-slate-200/50 overflow-y-auto">
          <div className="p-4 space-y-4">
            
            {/* Purchase Order Status Card */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">PO Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    headerData.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    headerData.status === 'approved' ? 'bg-green-100 text-green-700' :
                    headerData.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {headerData.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Line Items</span>
                  <span className="text-sm font-bold text-slate-800">{lines.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Total Amount</span>
                  <span className="text-sm font-bold text-slate-800">
                    {headerData.currency_code} {headerData.total_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Vendor</span>
                  <span className="text-xs font-medium text-slate-800">{headerData.vendor_name}</span>
                </div>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Amount Breakdown</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Subtotal</span>
                  <span className="text-sm font-bold text-slate-800">
                    {headerData.currency_code} {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">VAT (5%)</span>
                  <span className="text-sm font-bold text-slate-800">
                    {headerData.currency_code} {tax.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Total</span>
                    <span className="text-sm font-bold text-green-600">
                      {headerData.currency_code} {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <Sparkles size={16} className="text-blue-600" />
                  <span>Auto-Add Items</span>
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <Calculator size={16} className="text-green-600" />
                  <span>Bulk Pricing</span>
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <TrendingUp size={16} className="text-purple-600" />
                  <span>Price History</span>
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <Truck size={16} className="text-indigo-600" />
                  <span>Track Delivery</span>
                </button>
              </div>
            </div>

            {/* Approval Mode */}
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Processing Mode</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setPostingMode('draft')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    postingMode === 'draft' 
                      ? 'bg-blue-100 border-2 border-blue-500' 
                      : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Edit2 size={16} className="text-slate-600" />
                    <span className="text-sm font-medium">Save as Draft</span>
                  </div>
                  {postingMode === 'draft' && <CheckCircle size={16} className="text-blue-600" />}
                </button>
                
                <button
                  onClick={() => setPostingMode('validate')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    postingMode === 'validate' 
                      ? 'bg-yellow-100 border-2 border-yellow-500' 
                      : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-slate-600" />
                    <span className="text-sm font-medium">Submit for Approval</span>
                  </div>
                  {postingMode === 'validate' && <CheckCircle size={16} className="text-yellow-600" />}
                </button>
                
                <button
                  onClick={() => setPostingMode('send')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    postingMode === 'send' 
                      ? 'bg-green-100 border-2 border-green-500' 
                      : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Send size={16} className="text-slate-600" />
                    <span className="text-sm font-medium">Send to Vendor</span>
                  </div>
                  {postingMode === 'send' && <CheckCircle size={16} className="text-green-600" />}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* MIDDLE - Header & Lines */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setActiveTab('header')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'header'
                    ? 'bg-white shadow-md text-slate-800'
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                PO Details
              </button>
              <button
                onClick={() => setActiveTab('lines')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'lines'
                    ? 'bg-white shadow-md text-slate-800'
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                Line Items ({lines.length})
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white shadow-md text-slate-800'
                    : 'text-slate-600 hover:bg-white/50'
                }`}
              >
                Review & Submit
              </button>
            </div>

            {/* HEADER TAB */}
            {activeTab === 'header' && (
              <div className="space-y-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <ShoppingCart size={20} className="text-slate-600" />
                    <h2 className="text-lg font-bold text-slate-800">Purchase Order Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          PO Number *
                        </label>
                        <input
                          type="text"
                          value={headerData.po_number}
                          onChange={(e) => setHeaderData({...headerData, po_number: e.target.value})}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                          placeholder="PO-2025-000123"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          PO Date *
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={headerData.po_date}
                            onChange={(e) => setHeaderData({...headerData, po_date: e.target.value})}
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                          />
                          <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Vendor *
                        </label>
                        <select
                          value={headerData.vendor_id}
                          onChange={(e) => {
                            const vendor = vendors.find(v => v.id === e.target.value)
                            setHeaderData({
                              ...headerData, 
                              vendor_id: e.target.value,
                              vendor_name: vendor?.name || ''
                            })
                          }}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                        >
                          {vendors.map(vendor => (
                            <option key={vendor.id} value={vendor.id}>
                              {vendor.name} - {vendor.contact}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Currency *
                        </label>
                        <select
                          value={headerData.currency_code}
                          onChange={(e) => setHeaderData({...headerData, currency_code: e.target.value})}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                        >
                          <option value="AED">AED - UAE Dirham</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                        </select>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Payment Terms
                        </label>
                        <select
                          value={headerData.payment_terms}
                          onChange={(e) => setHeaderData({...headerData, payment_terms: e.target.value})}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                        >
                          <option value="NET_30">Net 30 Days</option>
                          <option value="NET_15">Net 15 Days</option>
                          <option value="COD">Cash on Delivery</option>
                          <option value="ADVANCE">Advance Payment</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Delivery Terms
                        </label>
                        <select
                          value={headerData.delivery_terms}
                          onChange={(e) => setHeaderData({...headerData, delivery_terms: e.target.value})}
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                        >
                          <option value="FOB">FOB - Free on Board</option>
                          <option value="CIF">CIF - Cost, Insurance & Freight</option>
                          <option value="EXW">EXW - Ex Works</option>
                          <option value="DDP">DDP - Delivered Duty Paid</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Smart Code *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={headerData.smart_code}
                            onChange={(e) => setHeaderData({...headerData, smart_code: e.target.value})}
                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                            placeholder="HERA.PROCUREMENT.TXN.PURCHASE_ORDER.v1"
                          />
                          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                            <Sparkles size={18} className="text-blue-600" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Smart code drives approval workflow and posting rules
                        </p>
                      </div>
                    </div>

                    {/* Full Width */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Delivery Address *
                      </label>
                      <textarea
                        rows={3}
                        value={headerData.delivery_address}
                        onChange={(e) => setHeaderData({...headerData, delivery_address: e.target.value})}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                        placeholder="Complete delivery address including building, floor, and contact details"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Notes & Special Instructions
                      </label>
                      <textarea
                        rows={3}
                        value={headerData.notes}
                        onChange={(e) => setHeaderData({...headerData, notes: e.target.value})}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                        placeholder="Any special instructions, requirements, or notes for this purchase order"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LINES TAB */}
            {activeTab === 'lines' && (
              <div className="space-y-4">
                
                {/* Add Line Button */}
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-800">Purchase Order Line Items</h2>
                  <button
                    onClick={addLine}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    <Plus size={18} />
                    <span className="font-medium">Add Item</span>
                  </button>
                </div>

                {/* Lines Table */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-16">Line</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-32">Product Code</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-20">Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider w-28">Unit Price</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider w-32">Line Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-32">Delivery Date</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {lines.map((line, index) => (
                          <tr key={line.id} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-slate-700">
                              {line.line_number}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={line.product_code}
                                onChange={(e) => updateLine(line.id, 'product_code', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                              >
                                <option value="">Select...</option>
                                {products.map(product => (
                                  <option key={product.code} value={product.code}>
                                    {product.code}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={line.description}
                                onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                placeholder="Product description..."
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={line.quantity}
                                onChange={(e) => updateLine(line.id, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 text-sm text-center bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                placeholder="1"
                                min="1"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={line.unit_price}
                                onChange={(e) => updateLine(line.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 text-sm text-right font-mono bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.01"
                                value={line.line_amount}
                                readOnly
                                className="w-full px-2 py-1.5 text-sm text-right font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={line.delivery_date}
                                onChange={(e) => updateLine(line.id, 'delivery_date', e.target.value)}
                                className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => removeLine(line.id)}
                                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gradient-to-r from-slate-50 to-slate-100 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan="5" className="px-4 py-3 text-right text-sm font-bold text-slate-800">
                            SUBTOTAL:
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">
                            {headerData.currency_code} {subtotal.toFixed(2)}
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                        <tr>
                          <td colSpan="5" className="px-4 py-3 text-right text-sm font-bold text-slate-800">
                            VAT (5%):
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">
                            {headerData.currency_code} {tax.toFixed(2)}
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                        <tr>
                          <td colSpan="5" className="px-4 py-3 text-right text-sm font-bold text-slate-800">
                            TOTAL AMOUNT:
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-green-600 bg-green-50">
                            {headerData.currency_code} {total.toFixed(2)}
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Quick Add Products */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Add Products</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {products.map(product => (
                      <button
                        key={product.code}
                        onClick={() => {
                          const newLine = {
                            id: Date.now(),
                            line_number: (lines.length + 1) * 10,
                            product_code: product.code,
                            description: product.name,
                            quantity: 1,
                            unit_price: product.unit_price,
                            line_amount: product.unit_price,
                            delivery_date: '',
                            product_category: product.category,
                            editing: false
                          }
                          setLines([...lines, newLine])
                        }}
                        className="p-3 text-left bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all"
                      >
                        <div className="text-sm font-medium text-slate-800">{product.name}</div>
                        <div className="text-xs text-slate-600">{product.code}</div>
                        <div className="text-xs font-semibold text-blue-600">{headerData.currency_code} {product.unit_price.toFixed(2)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PREVIEW TAB */}
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-6">Purchase Order Review</h2>
                  
                  {/* Header Summary */}
                  <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                    <h3 className="font-semibold text-slate-800 mb-3">Purchase Order Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-slate-600">PO Number:</span>
                        <p className="font-semibold text-slate-800">{headerData.po_number}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Date:</span>
                        <p className="font-semibold text-slate-800">{headerData.po_date}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Vendor:</span>
                        <p className="font-semibold text-slate-800">{headerData.vendor_name}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Currency:</span>
                        <p className="font-semibold text-slate-800">{headerData.currency_code}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Payment Terms:</span>
                        <p className="font-semibold text-slate-800">{headerData.payment_terms.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Delivery Terms:</span>
                        <p className="font-semibold text-slate-800">{headerData.delivery_terms}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-600">Total Amount:</span>
                        <p className="font-bold text-green-600 text-lg">{headerData.currency_code} {headerData.total_amount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lines Summary */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-800 mb-3">Line Items Summary</h3>
                    <div className="space-y-2">
                      {lines.map((line, index) => (
                        <div key={line.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">
                              {line.product_code} • {line.description}
                            </p>
                            <p className="text-xs text-slate-600">
                              Qty: {line.quantity} × {headerData.currency_code} {line.unit_price.toFixed(2)} | 
                              Delivery: {line.delivery_date || 'TBD'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">
                              {headerData.currency_code} {line.line_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amount Summary */}
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <span className="text-slate-600 block">Subtotal</span>
                        <span className="font-bold text-slate-800">{headerData.currency_code} {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-600 block">VAT (5%)</span>
                        <span className="font-bold text-slate-800">{headerData.currency_code} {tax.toFixed(2)}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-600 block">Total Amount</span>
                        <span className="font-bold text-green-600 text-lg">{headerData.currency_code} {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
                  <button 
                    onClick={() => router.push('/enterprise/procurement')}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <X size={18} />
                    <span>Cancel</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm hover:shadow-md">
                      <Save size={18} className="text-slate-600" />
                      <span className="font-medium text-slate-700">Save Draft</span>
                    </button>

                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting || lines.length === 0}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl ${
                        isSubmitting || lines.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          <span className="font-medium">Create Purchase Order</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT - AI Assistant */}
        {showAI && (
          <div className="w-96 bg-gradient-to-br from-indigo-50 to-purple-50 border-l border-slate-200/50 overflow-y-auto">
            <div className="p-6">
              
              {/* AI Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-800">AI Assistant</h2>
                    <p className="text-xs text-slate-600">Procurement guidance</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAI(!showAI)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <EyeOff size={18} className="text-slate-600" />
                </button>
              </div>

              {/* Purchase Order Info Card */}
              <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50 mb-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Current Purchase Order</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Vendor</span>
                    <span className="font-semibold text-slate-800">{headerData.vendor_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Items</span>
                    <span className="font-semibold text-slate-800">{lines.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Total</span>
                    <span className="font-semibold text-green-600">{headerData.currency_code} {headerData.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">AI Insights</h3>
                
                {aiSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        suggestion.type === 'procurement' ? 'bg-blue-100' :
                        suggestion.type === 'validation' ? 'bg-green-100' :
                        'bg-yellow-100'
                      }`}>
                        {suggestion.type === 'procurement' && <Building2 size={16} className="text-blue-600" />}
                        {suggestion.type === 'validation' && <CheckCircle size={16} className="text-green-600" />}
                        {suggestion.type === 'optimization' && <Target size={16} className="text-yellow-600" />}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-slate-800 mb-1">{suggestion.title}</h4>
                        <p className="text-sm text-slate-600 mb-2">{suggestion.message}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                                style={{ width: `${suggestion.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600">
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>

                          <button className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg transition-all">
                            {suggestion.action}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Procurement Rules Info */}
              <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Procurement Rules Active</h4>
                    <p className="text-xs text-blue-700 mb-2">
                      Smart code {headerData.smart_code} drives approval workflow, vendor validation, and budget compliance.
                    </p>
                    <button className="text-xs text-blue-700 font-medium hover:underline">
                      View Procurement Policy →
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
          animation-fill-mode: both;
        }

        /* Modern scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.5);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
      `}</style>
    </div>
  )
}

export default HERAPurchaseOrderApp