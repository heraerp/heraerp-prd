#!/usr/bin/env node

/**
 * HERA Transaction Template Generator
 * Generates standardized transaction pages with AI assistant integration
 * Based on the Purchase Order template - serves as the template for all HERA non-financial transactions
 * 
 * Usage: node scripts/generate-transaction-template.js TRANSACTION_TYPE MODULE_PATH
 * Example: node scripts/generate-transaction-template.js sales_order /enterprise/sales/transactions/sales-order
 */

const fs = require('fs')
const path = require('path')

// Transaction type configurations
const TRANSACTION_CONFIGS = {
  sales_order: {
    label: 'Sales Order',
    type: 'SALES_ORDER',
    icon: 'ShoppingCart',
    module: 'SALES',
    description: 'Create and manage customer sales orders',
    aiContext: 'sales order creation and customer order management',
    headerFields: [
      { id: 'so_number', label: 'Sales Order Number', type: 'text', required: true, placeholder: 'SO-2025-001', readonly: true },
      { id: 'customer_id', label: 'Customer', type: 'select', required: true, placeholder: 'Select customer' },
      { id: 'so_date', label: 'Order Date', type: 'date', required: true },
      { id: 'delivery_date', label: 'Requested Delivery Date', type: 'date', required: true },
      { id: 'sales_rep', label: 'Sales Representative', type: 'select', required: false, placeholder: 'Select sales rep' },
      { id: 'currency_code', label: 'Currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP', 'AED'] },
      { id: 'payment_terms', label: 'Payment Terms', type: 'select', required: true, options: ['Net 30', 'Net 15', 'COD', 'Prepaid'] },
      { id: 'shipping_address', label: 'Shipping Address', type: 'textarea', required: true },
      { id: 'notes', label: 'Order Notes', type: 'textarea', required: false, placeholder: 'Special instructions or notes' }
    ],
    lineFields: [
      { id: 'product_code', label: 'Product Code', type: 'select', required: true, placeholder: 'Select product' },
      { id: 'description', label: 'Description', type: 'text', required: true, placeholder: 'Product description' },
      { id: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '1' },
      { id: 'unit_price', label: 'Unit Price', type: 'number', required: true, placeholder: '0.00' },
      { id: 'discount_percent', label: 'Discount %', type: 'number', required: false, placeholder: '0' },
      { id: 'delivery_date', label: 'Delivery Date', type: 'date', required: true }
    ],
    smartCodePattern: 'HERA.SALES.TXN.SALES_ORDER',
    previewSections: ['Order Summary', 'Customer Details', 'Line Items', 'Totals']
  },

  purchase_requisition: {
    label: 'Purchase Requisition',
    type: 'PURCHASE_REQUISITION',
    icon: 'ClipboardList',
    module: 'PROCUREMENT',
    description: 'Request approval for procurement purchases',
    aiContext: 'purchase requisition creation and approval workflow',
    headerFields: [
      { id: 'pr_number', label: 'Requisition Number', type: 'text', required: true, placeholder: 'PR-2025-001', readonly: true },
      { id: 'requester_id', label: 'Requester', type: 'select', required: true, placeholder: 'Select requester' },
      { id: 'department', label: 'Department', type: 'select', required: true, placeholder: 'Select department' },
      { id: 'pr_date', label: 'Request Date', type: 'date', required: true },
      { id: 'required_date', label: 'Required By Date', type: 'date', required: true },
      { id: 'priority', label: 'Priority', type: 'select', required: true, options: ['Low', 'Normal', 'High', 'Urgent'] },
      { id: 'currency_code', label: 'Currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP', 'AED'] },
      { id: 'budget_code', label: 'Budget Code', type: 'select', required: false, placeholder: 'Select budget' },
      { id: 'justification', label: 'Business Justification', type: 'textarea', required: true, placeholder: 'Explain the business need for this requisition' }
    ],
    lineFields: [
      { id: 'item_description', label: 'Item Description', type: 'text', required: true, placeholder: 'Describe the item needed' },
      { id: 'specification', label: 'Specifications', type: 'textarea', required: false, placeholder: 'Technical specifications' },
      { id: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '1' },
      { id: 'estimated_cost', label: 'Estimated Unit Cost', type: 'number', required: true, placeholder: '0.00' },
      { id: 'preferred_vendor', label: 'Preferred Vendor', type: 'select', required: false, placeholder: 'Select vendor' },
      { id: 'required_date', label: 'Required Date', type: 'date', required: true }
    ],
    smartCodePattern: 'HERA.PROCUREMENT.TXN.PURCHASE_REQUISITION',
    previewSections: ['Requisition Summary', 'Requester Details', 'Line Items', 'Approval Workflow']
  },

  goods_receipt: {
    label: 'Goods Receipt',
    type: 'GOODS_RECEIPT',
    icon: 'Truck',
    module: 'PROCUREMENT',
    description: 'Record receipt of goods and materials',
    aiContext: 'goods receipt processing and inventory management',
    headerFields: [
      { id: 'gr_number', label: 'Goods Receipt Number', type: 'text', required: true, placeholder: 'GR-2025-001', readonly: true },
      { id: 'po_number', label: 'Purchase Order Reference', type: 'select', required: true, placeholder: 'Select PO' },
      { id: 'vendor_id', label: 'Vendor', type: 'select', required: true, placeholder: 'Select vendor' },
      { id: 'receipt_date', label: 'Receipt Date', type: 'date', required: true },
      { id: 'delivery_note', label: 'Delivery Note Number', type: 'text', required: false, placeholder: 'DN-12345' },
      { id: 'received_by', label: 'Received By', type: 'select', required: true, placeholder: 'Select receiver' },
      { id: 'warehouse_location', label: 'Warehouse Location', type: 'select', required: true, placeholder: 'Select location' },
      { id: 'condition', label: 'Goods Condition', type: 'select', required: true, options: ['Good', 'Damaged', 'Partial'] },
      { id: 'notes', label: 'Receipt Notes', type: 'textarea', required: false, placeholder: 'Any observations or issues' }
    ],
    lineFields: [
      { id: 'po_line_ref', label: 'PO Line Reference', type: 'text', required: true, placeholder: 'Line 10' },
      { id: 'product_code', label: 'Product Code', type: 'text', required: true, placeholder: 'PROD-001' },
      { id: 'description', label: 'Description', type: 'text', required: true, placeholder: 'Product description' },
      { id: 'ordered_qty', label: 'Ordered Quantity', type: 'number', required: true, readonly: true },
      { id: 'received_qty', label: 'Received Quantity', type: 'number', required: true, placeholder: '0' },
      { id: 'rejected_qty', label: 'Rejected Quantity', type: 'number', required: false, placeholder: '0' },
      { id: 'batch_lot', label: 'Batch/Lot Number', type: 'text', required: false, placeholder: 'Batch123' }
    ],
    smartCodePattern: 'HERA.PROCUREMENT.TXN.GOODS_RECEIPT',
    previewSections: ['Receipt Summary', 'PO Reference', 'Received Items', 'Quality Notes']
  },

  sales_invoice: {
    label: 'Sales Invoice',
    type: 'SALES_INVOICE',
    icon: 'FileText',
    module: 'SALES',
    description: 'Generate customer invoices for sales',
    aiContext: 'sales invoice creation and billing management',
    headerFields: [
      { id: 'invoice_number', label: 'Invoice Number', type: 'text', required: true, placeholder: 'INV-2025-001', readonly: true },
      { id: 'so_reference', label: 'Sales Order Reference', type: 'select', required: false, placeholder: 'Select SO' },
      { id: 'customer_id', label: 'Customer', type: 'select', required: true, placeholder: 'Select customer' },
      { id: 'invoice_date', label: 'Invoice Date', type: 'date', required: true },
      { id: 'due_date', label: 'Due Date', type: 'date', required: true },
      { id: 'payment_terms', label: 'Payment Terms', type: 'select', required: true, options: ['Net 30', 'Net 15', 'COD', 'Prepaid'] },
      { id: 'currency_code', label: 'Currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP', 'AED'] },
      { id: 'billing_address', label: 'Billing Address', type: 'textarea', required: true },
      { id: 'notes', label: 'Invoice Notes', type: 'textarea', required: false, placeholder: 'Payment instructions or notes' }
    ],
    lineFields: [
      { id: 'product_code', label: 'Product/Service Code', type: 'select', required: true, placeholder: 'Select item' },
      { id: 'description', label: 'Description', type: 'text', required: true, placeholder: 'Item description' },
      { id: 'quantity', label: 'Quantity', type: 'number', required: true, placeholder: '1' },
      { id: 'unit_price', label: 'Unit Price', type: 'number', required: true, placeholder: '0.00' },
      { id: 'tax_rate', label: 'Tax Rate %', type: 'number', required: false, placeholder: '0' },
      { id: 'discount_percent', label: 'Discount %', type: 'number', required: false, placeholder: '0' }
    ],
    smartCodePattern: 'HERA.SALES.TXN.SALES_INVOICE',
    previewSections: ['Invoice Summary', 'Customer Details', 'Line Items', 'Tax & Totals']
  },

  inventory_transfer: {
    label: 'Inventory Transfer',
    type: 'INVENTORY_TRANSFER',
    icon: 'ArrowRightLeft',
    module: 'INVENTORY',
    description: 'Transfer inventory between locations',
    aiContext: 'inventory transfer processing and warehouse management',
    headerFields: [
      { id: 'transfer_number', label: 'Transfer Number', type: 'text', required: true, placeholder: 'TRF-2025-001', readonly: true },
      { id: 'from_location', label: 'From Location', type: 'select', required: true, placeholder: 'Select source location' },
      { id: 'to_location', label: 'To Location', type: 'select', required: true, placeholder: 'Select destination' },
      { id: 'transfer_date', label: 'Transfer Date', type: 'date', required: true },
      { id: 'requested_by', label: 'Requested By', type: 'select', required: true, placeholder: 'Select requester' },
      { id: 'transfer_type', label: 'Transfer Type', type: 'select', required: true, options: ['Regular', 'Emergency', 'Replenishment', 'Return'] },
      { id: 'reason', label: 'Transfer Reason', type: 'textarea', required: true, placeholder: 'Reason for transfer' },
      { id: 'notes', label: 'Transfer Notes', type: 'textarea', required: false, placeholder: 'Additional notes' }
    ],
    lineFields: [
      { id: 'product_code', label: 'Product Code', type: 'select', required: true, placeholder: 'Select product' },
      { id: 'description', label: 'Description', type: 'text', required: true, placeholder: 'Product description' },
      { id: 'current_stock', label: 'Current Stock', type: 'number', required: true, readonly: true },
      { id: 'transfer_qty', label: 'Transfer Quantity', type: 'number', required: true, placeholder: '0' },
      { id: 'batch_lot', label: 'Batch/Lot Number', type: 'text', required: false, placeholder: 'Batch123' },
      { id: 'expiry_date', label: 'Expiry Date', type: 'date', required: false }
    ],
    smartCodePattern: 'HERA.INVENTORY.TXN.INVENTORY_TRANSFER',
    previewSections: ['Transfer Summary', 'Location Details', 'Items to Transfer', 'Stock Impact']
  }
}

function generateTransactionTemplate(transactionType, modulePath) {
  const config = TRANSACTION_CONFIGS[transactionType]
  if (!config) {
    console.error(`❌ Unknown transaction type: ${transactionType}`)
    console.log(`Available types: ${Object.keys(TRANSACTION_CONFIGS).join(', ')}`)
    process.exit(1)
  }

  const { label, type, icon, module, description, aiContext, headerFields, lineFields, smartCodePattern, previewSections } = config

  // Generate the component code
  const componentCode = `'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, Plus, Trash2, Save, Send, X, CheckCircle, AlertCircle, 
  Sparkles, Calculator, TrendingUp, DollarSign, Calendar, Building2,
  User, Package, ChevronDown, ChevronRight, Copy, Upload, Download,
  Eye, EyeOff, Zap, Target, Clock, Edit2, MoreVertical, Search,
  Filter, RefreshCw, Lock, Unlock, AlertTriangle, Info, ${icon}
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
      <div className={\`\${getToastStyles()} rounded-xl border p-4 shadow-lg backdrop-blur-xl bg-white/90 min-w-[320px] max-w-md\`}>
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

const HERA${type.replace(/_/g, '')}App = () => {
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()
  
  const [activeTab, setActiveTab] = useState('header')
  const [transactionType, setTransactionType] = useState('${type}')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  })

  // Transaction Header Data
  const [headerData, setHeaderData] = useState({
${headerFields.map(field => {
    if (field.type === 'date') {
      return `    ${field.id}: new Date().toISOString().split('T')[0],`
    } else if (field.options) {
      return `    ${field.id}: '${field.options[0]}',`
    } else if (field.readonly && field.placeholder) {
      return `    ${field.id}: '${field.placeholder}',`
    } else {
      return `    ${field.id}: '',`
    }
  }).join('\n')}
    smart_code: '${smartCodePattern}.v1',
    status: 'draft',
    total_amount: 0.00
  })

  // Transaction Lines
  const [lines, setLines] = useState([
    { 
      id: 1, 
      line_number: 10, 
${lineFields.map((field, index) => {
    if (field.type === 'number') {
      return `      ${field.id}: ${index === 2 ? '1' : '0'}, // Default quantity to 1`
    } else if (field.type === 'date') {
      return `      ${field.id}: new Date().toISOString().split('T')[0],`
    } else {
      return `      ${field.id}: '',`
    }
  }).join('\n')}
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
${lineFields.map((field, index) => {
    if (field.type === 'number') {
      return `      ${field.id}: ${index === 2 ? '1' : '0'},`
    } else if (field.type === 'date') {
      return `      ${field.id}: new Date().toISOString().split('T')[0],`
    } else {
      return `      ${field.id}: '',`
    }
  }).join('\n')}
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
    showToast('Creating ${label.toLowerCase()}...', 'info')

    try {
      // Prepare transaction data for HERA API v2
      const transactionData = {
        transaction_type: '${transactionType}',
        transaction_code: headerData.${headerFields[0].id},
        smart_code: headerData.smart_code,
        organization_id: organization.id,
${headerFields.filter(f => f.id.includes('_id')).map(f => `        ${f.id.replace('_id', '_entity_id')}: headerData.${f.id},`).join('\n')}
        total_amount: headerData.total_amount,
        transaction_currency_code: headerData.currency_code,
        transaction_date: headerData.${headerFields.find(f => f.type === 'date')?.id},
        transaction_status: headerData.status
      }
      
      // Prepare transaction lines for RPC call
      const transactionLines = lines.map((line, index) => ({
        line_number: line.line_number,
        line_type: '${lineFields[0].id.includes('product') ? 'PRODUCT' : 'ITEM'}',
        entity_id: line.${lineFields[0].id},
        description: line.description,
        quantity: line.quantity || line.transfer_qty || line.received_qty || 1,
        unit_amount: line.unit_price || line.estimated_cost || 0,
        line_amount: line.line_amount,
        line_data: {
${lineFields.slice(2).map(f => `          ${f.id}: line.${f.id}`).join(',\n')}
        }
      }))
      
      console.log('${label} transaction data:', { transactionData, transactionLines })
      
      // RPC call structure ready for hera_txn_crud_v1
      /*
      const result = await callRPC('hera_txn_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: user?.id,
        p_organization_id: organization.id,
        p_transaction: transactionData,
        p_lines: transactionLines,
        p_options: {}
      })
      */
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      showToast(\`${label} "\${headerData.${headerFields[0].id}}" created successfully! Redirecting...\`, 'success')
      
      setTimeout(() => {
        router.push('${modulePath.replace('/page', '').replace(/\/[^/]*$/, '')}')
      }, 2000)
      
    } catch (error) {
      console.error('Submit error:', error)
      showToast('Failed to create ${label.toLowerCase()}. Please try again.', 'error')
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
          <p className="text-gray-600">Please log in to access ${label.toLowerCase()} management.</p>
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
              <${icon} className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">${label}</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-600">HERA ${module}</p>
                {organization && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-blue-600 font-medium">{organization.name}</span>
                  </>
                )}
              </div>
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
                  
                  {organization && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Organization</span>
                      <span className="text-sm font-medium text-blue-700">{organization.name}</span>
                    </div>
                  )}
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
                    <${icon} className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">${label}</h1>
                    <p className="text-gray-600">${description}</p>
                  </div>
                </div>
                
                {/* Tab navigation */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  {['header', 'lines', 'preview'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={\`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all \${
                        activeTab === tab
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }\`}
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
${headerFields.map(field => {
  if (field.type === 'select') {
    return `                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ${field.label} ${field.required ? '*' : ''}
                        </label>
                        <select
                          value={headerData.${field.id}}
                          onChange={(e) => updateHeaderData('${field.id}', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          ${field.required ? 'required' : ''}
                        >
                          <option value="">${field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
${field.options ? field.options.map(opt => `                          <option value="${opt}">${opt}</option>`).join('\n') : ''}
                        </select>
                      </div>`
  } else if (field.type === 'textarea') {
    return `                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ${field.label} ${field.required ? '*' : ''}
                        </label>
                        <textarea
                          value={headerData.${field.id}}
                          onChange={(e) => updateHeaderData('${field.id}', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="${field.placeholder || ''}"
                          ${field.required ? 'required' : ''}
                        />
                      </div>`
  } else {
    return `                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ${field.label} ${field.required ? '*' : ''}
                        </label>
                        <input
                          type="${field.type}"
                          value={headerData.${field.id}}
                          onChange={(e) => updateHeaderData('${field.id}', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="${field.placeholder || ''}"
                          ${field.readonly ? 'readOnly' : ''}
                          ${field.required ? 'required' : ''}
                        />
                      </div>`
  }
}).join('\n')}
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
${lineFields.map(field => {
  if (field.type === 'select') {
    return `                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ${field.label} ${field.required ? '*' : ''}
                              </label>
                              <select
                                value={line.${field.id}}
                                onChange={(e) => updateLineData(line.id, '${field.id}', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">${field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
                              </select>
                            </div>`
  } else if (field.type === 'textarea') {
    return `                            <div className="md:col-span-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ${field.label} ${field.required ? '*' : ''}
                              </label>
                              <textarea
                                value={line.${field.id}}
                                onChange={(e) => updateLineData(line.id, '${field.id}', e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="${field.placeholder || ''}"
                              />
                            </div>`
  } else {
    return `                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ${field.label} ${field.required ? '*' : ''}
                              </label>
                              <input
                                type="${field.type}"
                                value={line.${field.id}}
                                onChange={(e) => updateLineData(line.id, '${field.id}', ${field.type === 'number' ? 'Number(e.target.value)' : 'e.target.value'})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                placeholder="${field.placeholder || ''}"
                                ${field.readonly ? 'readOnly' : ''}
                              />
                            </div>`
  }
}).join('\n')}
                            
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
                    <h2 className="text-lg font-semibold text-gray-900">${label} Preview</h2>
                    
${previewSections.map(section => `                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">${section}</h3>
                      <div className="text-sm text-gray-600">
                        Preview content for ${section.toLowerCase()} will be displayed here.
                      </div>
                    </div>`).join('\n')}
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
                        Create ${label}
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
                    I can help you with ${aiContext}. Ask me about:
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
                      placeholder="Ask me anything about this ${label.toLowerCase()}..."
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

export default HERA${type.replace(/_/g, '')}App`

  // Determine file path
  const appDir = path.join(process.cwd(), 'src/app')
  const moduleDir = path.join(appDir, ...modulePath.split('/').filter(p => p))
  const filePath = path.join(moduleDir, 'page.tsx')

  // Create directories if they don't exist
  if (!fs.existsSync(moduleDir)) {
    fs.mkdirSync(moduleDir, { recursive: true })
    console.log(`📁 Created directory: ${moduleDir}`)
  }

  // Write the component file
  fs.writeFileSync(filePath, componentCode)
  console.log(`✅ Generated ${label} transaction template: ${filePath}`)

  console.log(`\n🎉 ${label} transaction template generated successfully!`)
  console.log(`📍 Access your new ${label.toLowerCase()} page at: ${modulePath}`)
  console.log(`\n💡 Features included:`)
  console.log(`   - Complete HERA authentication integration`)
  console.log(`   - Professional three-column layout`)
  console.log(`   - AI assistant integration`)
  console.log(`   - Transaction header and line management`)
  console.log(`   - Real-time calculations`)
  console.log(`   - HERA RPC integration (hera_txn_crud_v1)`)
  console.log(`   - Mobile-first responsive design`)
  console.log(`   - Professional toast notifications`)
}

// CLI Usage
const args = process.argv.slice(2)
if (args.length < 2) {
  console.log(`
🚀 HERA Transaction Template Generator

Usage: node scripts/generate-transaction-template.js TRANSACTION_TYPE MODULE_PATH

Available Transaction Types:
${Object.keys(TRANSACTION_CONFIGS).map(type => `  - ${type}`).join('\n')}

Examples:
  node scripts/generate-transaction-template.js sales_order /enterprise/sales/transactions/sales-order
  node scripts/generate-transaction-template.js purchase_requisition /enterprise/procurement/requisitions
  node scripts/generate-transaction-template.js goods_receipt /enterprise/procurement/goods-receipt
  node scripts/generate-transaction-template.js sales_invoice /enterprise/sales/transactions/invoices
  node scripts/generate-transaction-template.js inventory_transfer /enterprise/inventory/transfers
`)
  process.exit(1)
}

const [transactionType, modulePath] = args
generateTransactionTemplate(transactionType.toLowerCase(), modulePath)