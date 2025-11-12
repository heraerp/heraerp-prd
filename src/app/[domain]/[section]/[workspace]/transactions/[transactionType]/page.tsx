/*
 * HERA Universal Dynamic Transaction Page
 * Smart Code: HERA.UNIVERSAL.TRANSACTION.DYNAMIC.v1
 * Style Source: /enterprise/procurement/po (proven transaction interface)
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, use } from 'react'
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
import { resolveUniversalConfig, generateUniversalSmartCode } from '@/lib/universal/config'
import { useInstantRouter } from '@/components/performance/InstantRouter'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

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

interface PageProps {
  params: Promise<{
    domain: string
    section: string
    workspace: string
    transactionType: string
  }>
}

export default function UniversalTransactionPage({ params }: PageProps) {
  // Resolve params using React 19 use() API
  const { domain, section, workspace, transactionType } = use(params)
  
  // HERA Auth and Navigation
  const router = useRouter()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const { navigate } = useInstantRouter()
  
  // Universal Configuration
  const config = resolveUniversalConfig(domain, section, workspace)
  const transactionConfig = config.transactionTypes.find(t => t.id === transactionType)
  
  // Component State
  const [activeTab, setActiveTab] = useState('header')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  })

  // Transaction Header State
  const [headerData, setHeaderData] = useState<Record<string, any>>({})
  
  // Transaction Lines State (if applicable)
  const [lines, setLines] = useState<any[]>([])

  // Initialize default header data
  useEffect(() => {
    if (!transactionConfig) return
    
    const defaultHeader: Record<string, any> = {
      transaction_type: transactionType,
      smart_code: generateUniversalSmartCode(domain, section, workspace, 'TRANSACTION', transactionType.toUpperCase()),
      transaction_status: transactionConfig.statuses[0] || 'draft'
    }
    
    // Add default values for configured fields
    transactionConfig.fields.forEach(field => {
      if (field.type === 'date') {
        defaultHeader[field.name] = new Date().toISOString().split('T')[0]
      } else if (field.type === 'number') {
        defaultHeader[field.name] = 0
      } else {
        defaultHeader[field.name] = ''
      }
    })
    
    setHeaderData(defaultHeader)
  }, [transactionConfig, transactionType, domain, section, workspace])

  // Initialize default lines if transaction has lines
  useEffect(() => {
    if (!transactionConfig?.hasLines) return
    
    setLines([
      {
        id: 1,
        line_number: 10,
        line_type: 'ITEM',
        description: 'Sample line item',
        quantity: 1,
        unit_price: 0,
        line_amount: 0,
        editing: false
      }
    ])
  }, [transactionConfig])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ isVisible: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 4000)
  }, [])

  const addLine = useCallback(() => {
    const newLineNumber = Math.max(...lines.map(l => l.line_number), 0) + 10
    const newLine = {
      id: Date.now(),
      line_number: newLineNumber,
      line_type: 'ITEM',
      description: '',
      quantity: 1,
      unit_price: 0,
      line_amount: 0,
      editing: true
    }
    setLines(prev => [...prev, newLine])
  }, [lines])

  const updateLine = useCallback((id: number, updates: Partial<any>) => {
    setLines(prev => prev.map(line => 
      line.id === id 
        ? { 
            ...line, 
            ...updates,
            line_amount: updates.quantity !== undefined || updates.unit_price !== undefined
              ? (updates.quantity ?? line.quantity) * (updates.unit_price ?? line.unit_price)
              : line.line_amount
          }
        : line
    ))
  }, [])

  const deleteLine = useCallback((id: number) => {
    setLines(prev => prev.filter(line => line.id !== id))
  }, [])

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => sum + line.line_amount, 0)
    const tax = subtotal * 0.05 // 5% tax
    const total = subtotal + tax
    
    return { subtotal, tax, total }
  }, [lines])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Prepare transaction data
      const transactionData = {
        ...headerData,
        total_amount: totals.total,
        organization_id: organization?.id
      }
      
      const transactionLines = transactionConfig?.hasLines ? lines : []
      
      console.log('Creating transaction:', {
        transaction: transactionData,
        lines: transactionLines
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      showToast(`${transactionConfig?.name.slice(0, -1)} created successfully!`, 'success')
      
      // Here you would call the HERA API v2
      // const result = await apiV2.post('transactions', transactionData)
      
    } catch (error) {
      showToast('Failed to create transaction. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Early returns for auth checks
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-slate-600">Please log in to access this page.</p>
        </div>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-slate-600">No organization context found.</p>
        </div>
      </div>
    )
  }

  if (!transactionConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-slate-600">Transaction type &quot;{transactionType}&quot; not found in workspace &quot;{workspace}&quot;.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Get transaction icon
  const TransactionIcon = FileText

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      
      <div className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <TransactionIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">{transactionConfig.name}</h1>
              <p className="text-xs text-slate-600">{transactionConfig.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
            >
              {isSubmitting ? 'Creating...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden md:block mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">New {transactionConfig.name.slice(0, -1)}</h1>
                <p className="text-slate-600">{transactionConfig.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="bg-white/70 border-slate-200/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save {transactionConfig.name.slice(0, -1)}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
            <div className="flex items-center space-x-6 border-b border-slate-200/50 pb-4 mb-6">
              <button
                onClick={() => setActiveTab('header')}
                className={`pb-2 border-b-2 transition-all ${
                  activeTab === 'header'
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Transaction Header
                </div>
              </button>
              {transactionConfig.hasLines && (
                <button
                  onClick={() => setActiveTab('lines')}
                  className={`pb-2 border-b-2 transition-all ${
                    activeTab === 'lines'
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Line Items ({lines.length})
                  </div>
                </button>
              )}
            </div>

            {/* Transaction Header Tab */}
            {activeTab === 'header' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {transactionConfig.fields.map((field) => (
                    <div key={field.id}>
                      <Label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      {field.type === 'select' ? (
                        <Select 
                          value={headerData[field.name] || ''} 
                          onValueChange={(value) => setHeaderData({...headerData, [field.name]: value})}
                        >
                          <SelectTrigger className="bg-white/70 border-slate-200/50 focus:bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option) => (
                              <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === 'date' ? (
                        <Input
                          id={field.name}
                          type="date"
                          value={headerData[field.name] || ''}
                          onChange={(e) => setHeaderData({...headerData, [field.name]: e.target.value})}
                          className="bg-white/70 border-slate-200/50 focus:bg-white"
                        />
                      ) : (
                        <Input
                          id={field.name}
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={headerData[field.name] || ''}
                          onChange={(e) => setHeaderData({...headerData, [field.name]: e.target.value})}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="bg-white/70 border-slate-200/50 focus:bg-white"
                        />
                      )}
                    </div>
                  ))}

                  <div>
                    <Label htmlFor="transaction_status" className="text-sm font-medium text-slate-700">Status</Label>
                    <Select 
                      value={headerData.transaction_status || ''} 
                      onValueChange={(value) => setHeaderData({...headerData, transaction_status: value})}
                    >
                      <SelectTrigger className="bg-white/70 border-slate-200/50 focus:bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionConfig.statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Transaction Summary */}
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/50">
                  <h3 className="font-semibold text-slate-800 mb-2">Transaction Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Type:</span>
                      <div className="font-medium">{transactionConfig.name.slice(0, -1)}</div>
                    </div>
                    <div>
                      <span className="text-slate-600">Status:</span>
                      <div className="font-medium">
                        <Badge variant="outline" className="capitalize">
                          {headerData.transaction_status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-600">Total Amount:</span>
                      <div className="font-medium text-green-600">${totals.total.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-slate-600">Lines:</span>
                      <div className="font-medium">{transactionConfig.hasLines ? lines.length : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Lines Tab */}
            {activeTab === 'lines' && transactionConfig.hasLines && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Line Items</h3>
                  <Button onClick={addLine} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </Button>
                </div>

                {/* Lines Table */}
                <div className="bg-white/80 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50/50 border-b border-slate-200/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Unit Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/30">
                        {lines.map((line) => (
                          <tr key={line.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-4 py-3 text-sm text-slate-900">{line.line_number}</td>
                            <td className="px-4 py-3">
                              <Input
                                value={line.description}
                                onChange={(e) => updateLine(line.id, { description: e.target.value })}
                                placeholder="Enter description"
                                className="text-sm border-0 bg-transparent focus:bg-white"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                value={line.quantity}
                                onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}
                                className="w-20 text-sm border-0 bg-transparent focus:bg-white"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                value={line.unit_price}
                                onChange={(e) => updateLine(line.id, { unit_price: Number(e.target.value) })}
                                className="w-24 text-sm border-0 bg-transparent focus:bg-white"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">
                              ${line.line_amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteLine(line.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {lines.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No line items</h3>
                      <p className="text-slate-500 mb-4">Add line items to build your transaction</p>
                      <Button onClick={addLine} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Line
                      </Button>
                    </div>
                  )}
                </div>

                {/* Totals Summary */}
                {lines.length > 0 && (
                  <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-200/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-slate-600">Subtotal</div>
                        <div className="text-xl font-bold text-slate-800">${totals.subtotal.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-slate-600">Tax (5%)</div>
                        <div className="text-xl font-bold text-slate-800">${totals.tax.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-slate-600">Total</div>
                        <div className="text-2xl font-bold text-green-600">${totals.total.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full min-h-[56px] bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-transform"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save {transactionConfig.name.slice(0, -1)}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Spacing for Mobile */}
      <div className="h-24 md:h-0" />

      {/* Professional Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  )
}