'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  ClipboardList, 
  Truck, 
  FileText, 
  ArrowRightLeft,
  Package,
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

const TRANSACTION_TYPES = [
  {
    id: 'purchase_order',
    title: 'Purchase Order',
    description: 'Create and manage vendor purchase orders with line items, delivery dates, and approval workflows.',
    icon: Package,
    module: 'Procurement',
    path: '/enterprise/procurement/po',
    status: 'Live',
    features: ['Multi-line items', 'Vendor management', 'AI assistant', 'Approval workflow'],
    bgGradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'sales_order',
    title: 'Sales Order',
    description: 'Process customer orders with product selection, pricing, and delivery scheduling.',
    icon: ShoppingCart,
    module: 'Sales',
    path: '/enterprise/sales/transactions/sales-order',
    status: 'Live',
    features: ['Customer integration', 'Pricing engine', 'Delivery tracking', 'Revenue recognition'],
    bgGradient: 'from-green-500 to-emerald-600'
  },
  {
    id: 'purchase_requisition',
    title: 'Purchase Requisition',
    description: 'Request approval for procurement purchases with budget validation and workflow.',
    icon: ClipboardList,
    module: 'Procurement',
    path: '/enterprise/procurement/requisitions',
    status: 'Live',
    features: ['Budget validation', 'Approval routing', 'Department codes', 'Justification tracking'],
    bgGradient: 'from-purple-500 to-violet-600'
  },
  {
    id: 'goods_receipt',
    title: 'Goods Receipt',
    description: 'Record receipt of goods with quality inspection and inventory updates.',
    icon: Truck,
    module: 'Procurement',
    path: '/enterprise/procurement/goods-receipt',
    status: 'Live',
    features: ['PO matching', 'Quality control', 'Batch tracking', 'Inventory integration'],
    bgGradient: 'from-orange-500 to-red-600'
  },
  {
    id: 'sales_invoice',
    title: 'Sales Invoice',
    description: 'Generate customer invoices with tax calculation and payment terms.',
    icon: FileText,
    module: 'Sales',
    path: '/enterprise/sales/transactions/sales-invoice',
    status: 'Template Ready',
    features: ['Tax engine', 'Payment terms', 'Multi-currency', 'Revenue posting'],
    bgGradient: 'from-teal-500 to-cyan-600'
  },
  {
    id: 'inventory_transfer',
    title: 'Inventory Transfer',
    description: 'Transfer inventory between locations with stock tracking and approvals.',
    icon: ArrowRightLeft,
    module: 'Inventory',
    path: '/enterprise/inventory/transfers',
    status: 'Live',
    features: ['Multi-location', 'Stock validation', 'Transfer tracking', 'Cost updates'],
    bgGradient: 'from-indigo-500 to-purple-600'
  }
]

const SYSTEM_STATS = [
  { label: 'Transaction Types', value: '6', icon: FileText, color: 'text-blue-600' },
  { label: 'Active Templates', value: '5', icon: CheckCircle, color: 'text-green-600' },
  { label: 'AI Integrations', value: '6', icon: Sparkles, color: 'text-purple-600' },
  { label: 'Modules Covered', value: '3', icon: Building2, color: 'text-orange-600' }
]

export default function HERATransactionsOverview() {
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()

  // Authentication checks
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access transaction management.</p>
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
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">HERA Transactions</h1>
              <p className="text-xs text-gray-600">Enterprise Transaction System</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        
        {/* Header section */}
        <div className="hidden lg:block mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HERA Transaction System</h1>
              <p className="text-lg text-gray-600">Futuristic transaction management with AI-powered assistance</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Complete Non-Financial Transaction Suite</h2>
                <p className="text-blue-100">Enterprise-grade transaction processing with HERA RPC integration, AI assistance, and mobile-first design</p>
              </div>
              <div className="hidden lg:block">
                <Sparkles className="w-12 h-12 text-blue-200" />
              </div>
            </div>
          </div>
        </div>

        {/* System statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {SYSTEM_STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-gray-200/50 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Transaction types grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Transaction Types</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRANSACTION_TYPES.map((transaction) => {
              const Icon = transaction.icon
              return (
                <div 
                  key={transaction.id} 
                  className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                  onClick={() => router.push(transaction.path)}
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200/50">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${transaction.bgGradient} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.status === 'Live' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{transaction.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{transaction.description}</p>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Module:</span>
                      <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {transaction.module}
                      </span>
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="p-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Key Features</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {transaction.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          <span className="text-xs text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* System architecture highlights */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">HERA Transaction Architecture</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">HERA RPC Integration</h3>
              <p className="text-sm text-gray-600">All transactions use <code>hera_txn_crud_v1</code> RPC for secure, audited processing with complete actor traceability.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h3>
              <p className="text-sm text-gray-600">Every transaction includes contextual AI assistance for validation, suggestions, and compliance checking.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile-First Design</h3>
              <p className="text-sm text-gray-600">Professional three-column layouts that adapt seamlessly from mobile to desktop with glassmorphic effects.</p>
            </div>
          </div>
        </div>

        {/* Technology stack */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Technology Stack</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">Frontend</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Next.js 15 App Router</li>
                <li>• React 18 with Hooks</li>
                <li>• Tailwind CSS</li>
                <li>• Lucide React Icons</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">Backend</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• HERA RPC Functions</li>
                <li>• Supabase Integration</li>
                <li>• Sacred Six Schema</li>
                <li>• Multi-tenant Architecture</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">AI & Analytics</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Claude AI Assistant</li>
                <li>• Smart Code Validation</li>
                <li>• Business Rules Engine</li>
                <li>• Real-time Calculations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">Security</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Actor-based Audit Trail</li>
                <li>• Organization Isolation</li>
                <li>• JWT Authentication</li>
                <li>• Guardrails v2.0</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile bottom spacing */}
      <div className="h-24 lg:h-0" />
    </div>
  )
}