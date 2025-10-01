'use client'

import React, { useState, useEffect } from 'react'
import {
  EntityQuickView,
  EntityQuickViewHeader,
  EntityQuickViewBody,
  EntityQuickViewFooter,
  EntityQuickViewSkeleton
} from '@/lib/dna/components/entity/EntityQuickView'
import { universalApi } from '@/lib/universal-api'
import { formatCurrency } from '@/lib/utils/format'
import {
  Package,
  Users,
  Building2,
  FileText,
  ShoppingCart,
  Eye,
  Edit,
  Hash,
  Mail,
  Phone,
  CreditCard,
  Calendar
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

// Mock data for demo
const DEMO_ENTITIES = [
  {
    id: 'cust-001',
    entity_type: 'customer',
    entity_name: 'TechVantage Solutions Inc.',
    entity_code: 'CUST-001',
    smart_code: 'HERA.CRM.CUST.ENT.PROF.V1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      industry: 'Technology'
    },
    dynamic_fields: {
      email: 'contact@techvantage.com',
      phone: '+1 (555) 123-4567',
      credit_limit: 50000,
      payment_terms: 'NET30'
    },
    recent_transactions: [
      {
        id: 'txn-1',
        transaction_type: 'sale',
        total_amount: 15000,
        transaction_date: new Date().toISOString()
      },
      {
        id: 'txn-2',
        transaction_type: 'payment',
        total_amount: 15000,
        transaction_date: new Date().toISOString()
      },
      {
        id: 'txn-3',
        transaction_type: 'sale',
        total_amount: 8500,
        transaction_date: new Date().toISOString()
      }
    ],
    related_entities: [
      {
        id: 'proj-1',
        entity_name: 'Website Redesign',
        entity_type: 'project',
        relationship_type: 'customer_of'
      },
      {
        id: 'inv-1',
        entity_name: 'INV-2025-001',
        entity_type: 'invoice',
        relationship_type: 'has_invoice'
      }
    ]
  },
  {
    id: 'vend-001',
    entity_type: 'vendor',
    entity_name: 'Global Supplies Co.',
    entity_code: 'VEND-001',
    smart_code: 'HERA.SCM.VEND.ENT.PROF.V1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    dynamic_fields: {
      email: 'orders@globalsupplies.com',
      phone: '+1 (555) 987-6543',
      payment_terms: 'NET45',
      tax_id: '12-3456789'
    }
  },
  {
    id: 'prod-001',
    entity_type: 'product',
    entity_name: 'Premium Office Chair',
    entity_code: 'PROD-001',
    smart_code: 'HERA.INV.PROD.ENT.FURN.V1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    dynamic_fields: {
      sku: 'CHR-PREM-001',
      price: 299.99,
      cost: 150.0,
      stock_quantity: 45
    }
  },
  {
    id: 'gl-001',
    entity_type: 'gl_account',
    entity_name: 'Sales Revenue',
    entity_code: 'GL-4000',
    smart_code: 'HERA.FIN.GL.ACC.REV.V1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    dynamic_fields: {
      account_number: '4000',
      account_type: 'revenue',
      balance: 125000,
      currency: 'USD'
    }
  }
]

export default function EntityQuickViewDemo() {
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [customDelay, setCustomDelay] = useState(500)
  const [position, setPosition] = useState<'auto' | 'top' | 'bottom' | 'left' | 'right'>('auto')
  const [showTransactions, setShowTransactions] = useState(true)
  const [showRelated, setShowRelated] = useState(true)
  const [showActions, setShowActions] = useState(true)

  const handleAction = (action: string, entity: any) => {
    toast({
      title: `${action === 'view' ? 'Viewing' : 'Editing'} ${entity.entity_name}`,
      description: `Entity ID: ${entity.id}`
    })
    console.log(`Action: ${action}`, entity)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold ink dark:text-gray-100 mb-2">
          EntityQuickView Component Demo
        </h1>
        <p className="dark:ink-muted">
          Hover over or click entities to see quick preview information. Long-press on mobile
          devices.
        </p>
      </div>

      {/* Configuration Panel */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Delay (ms)</label>
            <input
              type="range"
              min="0"
              max="2000"
              step="100"
              value={customDelay}
              onChange={e => setCustomDelay(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs ink-muted mt-1">{customDelay}ms</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Position</label>
            <select
              value={position}
              onChange={e => setPosition(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            >
              <option value="auto">Auto</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showTransactions}
                onChange={e => setShowTransactions(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show Transactions</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showRelated}
                onChange={e => setShowRelated(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show Related</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showActions}
                onChange={e => setShowActions(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show Actions</span>
            </label>
          </div>
        </div>
      </div>

      {/* Demo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Examples */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-3">Basic Entity Previews</h3>

          {DEMO_ENTITIES.map(entity => (
            <EntityQuickView
              key={entity.id}
              entity={entity}
              delay={customDelay}
              position={position}
              showTransactions={showTransactions}
              showRelated={showRelated}
              showActions={showActions}
              onAction={handleAction}
              onShow={() => console.log('Preview shown:', entity.entity_name)}
              onHide={() => console.log('Preview hidden:', entity.entity_name)}
            >
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  {entity.entity_type === 'customer' && (
                    <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                  )}
                  {entity.entity_type === 'vendor' && (
                    <Building2 className="w-5 h-5 text-purple-500 mt-0.5" />
                  )}
                  {entity.entity_type === 'product' && (
                    <Package className="w-5 h-5 text-green-500 mt-0.5" />
                  )}
                  {entity.entity_type === 'gl_account' && (
                    <FileText className="w-5 h-5 text-orange-500 mt-0.5" />
                  )}

                  <div className="flex-1">
                    <h4 className="font-medium ink dark:text-gray-100">{entity.entity_name}</h4>
                    <p className="text-sm dark:ink-muted">
                      {entity.entity_code} • {entity.entity_type}
                    </p>
                  </div>
                </div>
              </div>
            </EntityQuickView>
          ))}
        </div>

        {/* Custom Content Example */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-3">Custom Content Renderer</h3>

          <EntityQuickView
            entity={DEMO_ENTITIES[2]} // Product
            delay={customDelay}
            position={position}
            renderContent={entity => (
              <>
                <EntityQuickViewHeader>
                  <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-green-500" />
                    <div>
                      <h3 className="font-semibold text-lg">{entity.entity_name}</h3>
                      <p className="text-sm ink-muted">SKU: {entity.dynamic_fields?.sku}</p>
                    </div>
                  </div>
                </EntityQuickViewHeader>

                <EntityQuickViewBody>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(entity.dynamic_fields?.price || 0)}
                      </div>
                      <div className="text-sm dark:ink-muted">
                        Cost: {formatCurrency(entity.dynamic_fields?.cost || 0)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm dark:ink-muted">In Stock</span>
                      <span className="font-medium">
                        {entity.dynamic_fields?.stock_quantity} units
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm dark:ink-muted">Margin</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {(
                          (1 -
                            (entity.dynamic_fields?.cost || 0) /
                              (entity.dynamic_fields?.price || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </EntityQuickViewBody>

                <EntityQuickViewFooter>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </EntityQuickViewFooter>
              </>
            )}
          >
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:shadow-lg transition-shadow">
              <Package className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
              <h4 className="font-semibold ink dark:text-gray-100 mb-1">Custom Product Preview</h4>
              <p className="text-sm dark:ink-muted">Hover to see custom rendered content</p>
            </div>
          </EntityQuickView>

          {/* Inline Example */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm dark:ink-muted mb-2">
              EntityQuickView also works inline with text. For example,{' '}
              <EntityQuickView
                entity={DEMO_ENTITIES[0]}
                delay={200}
                showActions={false}
                onAction={handleAction}
              >
                <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">
                  TechVantage Solutions
                </span>
              </EntityQuickView>{' '}
              is one of our valued customers.
            </p>
          </div>

          {/* Table Example */}
          <div>
            <h4 className="text-md font-medium mb-2">In Tables</h4>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium dark:ink-muted uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium dark:ink-muted uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {DEMO_ENTITIES.slice(0, 3).map(entity => (
                    <tr key={entity.id}>
                      <td className="px-4 py-3">
                        <EntityQuickView
                          entity={entity}
                          delay={customDelay}
                          position={position}
                          showTransactions={false}
                          showRelated={false}
                          onAction={handleAction}
                        >
                          <span className="text-sm font-medium ink dark:text-gray-100 cursor-help hover:text-blue-600 dark:hover:text-blue-400">
                            {entity.entity_name}
                          </span>
                        </EntityQuickView>
                      </td>
                      <td className="px-4 py-3 text-sm dark:ink-muted">{entity.entity_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State Demo */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Loading State</h3>
        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <EntityQuickViewSkeleton />
        </div>
      </div>

      {/* Usage Notes */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Usage Notes</h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>• Hover over entities to see preview (configurable delay)</li>
          <li>• Long-press on touch devices for mobile support</li>
          <li>• Use Tab + Enter/Space for keyboard navigation</li>
          <li>• Press Escape to close an open preview</li>
          <li>• Preview automatically positions to stay within viewport</li>
          <li>• Supports custom content rendering for specialized views</li>
        </ul>
      </div>
    </div>
  )
}
