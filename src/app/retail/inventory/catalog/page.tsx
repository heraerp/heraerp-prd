'use client'

import React from 'react'
import { useEntitiesList, useEntityUpsert, useHera } from '@/lib/hooks/hera'
import { 
  Package, Search, Printer, Edit3, Save, Plus, 
  Filter, Grid, List, MoreVertical, Eye, Archive,
  TrendingUp, AlertTriangle, CheckCircle
} from 'lucide-react'

export default function RetailInventoryCatalogPage() {
  const { auth } = useHera()
  const [search, setSearch] = React.useState('')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list')
  const { data, isLoading } = useEntitiesList({
    entity_type: 'PRODUCT',
    search,
    page: 1,
    page_size: 50
  })
  const upsert = useEntityUpsert()

  const items = (data as any)?.items || []

  async function onSaveRow(row: any) {
    await upsert.mutateAsync({
      organization_id: auth.organization_id,
      entity_type: 'PRODUCT',
      primary: {
        entity_id: row.entity_id || row.id,
        name: row.entity_name || row.name,
        sku: row.entity_code || row.sku,
        brand: row.brand
      },
      dynamic: {
        category: row.category,
        reorder_point: row.reorder_point,
        cost_price: row.cost_price,
        selling_price: row.selling_price
      }
    })
  }

  const stockLevels = {
    low: items.filter((item: any) => item.stock_quantity < item.reorder_point).length,
    normal: items.filter((item: any) => item.stock_quantity >= item.reorder_point).length,
    outOfStock: items.filter((item: any) => item.stock_quantity === 0).length
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="modern-card modern-primary">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-[#1E88E5]/30 to-[#1565C0]/20">
              <Package className="w-7 h-7 text-[#1565C0]" />
            </div>
            <div>
              <h1 className="modern-heading text-2xl text-[#1E1E20]">Product Catalog</h1>
              <p className="modern-subheading">Manage your inventory and product information</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="modern-btn-secondary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </button>
            <button 
              className="modern-btn-accent flex items-center gap-2" 
              onClick={() => window.print()}
              title="Print Barcodes"
            >
              <Printer className="w-4 h-4" />
              Print Barcodes
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="modern-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="modern-caption text-[#4B5563] mb-1">Total Products</div>
              <div className="modern-heading text-2xl text-[#1E1E20]">{items.length}</div>
            </div>
            <div className="p-3 rounded-full bg-[#1E88E5]/10">
              <Package className="w-6 h-6 text-[#1E88E5]" />
            </div>
          </div>
        </div>
        
        <div className="modern-card modern-kpi-success">
          <div className="flex items-center justify-between">
            <div>
              <div className="modern-caption text-[#4B5563] mb-1">In Stock</div>
              <div className="modern-heading text-2xl text-[#1E1E20]">{stockLevels.normal}</div>
            </div>
            <div className="p-3 rounded-full bg-[#81C784]/10">
              <CheckCircle className="w-6 h-6 text-[#81C784]" />
            </div>
          </div>
        </div>
        
        <div className="modern-card modern-kpi-warning">
          <div className="flex items-center justify-between">
            <div>
              <div className="modern-caption text-[#4B5563] mb-1">Low Stock</div>
              <div className="modern-heading text-2xl text-[#1E1E20]">{stockLevels.low}</div>
            </div>
            <div className="p-3 rounded-full bg-[#FFB74D]/10">
              <AlertTriangle className="w-6 h-6 text-[#FFB74D]" />
            </div>
          </div>
        </div>
        
        <div className="modern-card modern-kpi-error">
          <div className="flex items-center justify-between">
            <div>
              <div className="modern-caption text-[#4B5563] mb-1">Out of Stock</div>
              <div className="modern-heading text-2xl text-[#1E1E20]">{stockLevels.outOfStock}</div>
            </div>
            <div className="p-3 rounded-full bg-[#E53935]/10">
              <Archive className="w-6 h-6 text-[#E53935]" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="modern-card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
              <input
                className="modern-input w-full pl-10"
                placeholder="Search products by name, SKU, or barcode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="modern-btn-secondary flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="modern-surface rounded-lg p-1 flex">
              <button
                className={`p-2 rounded ${viewMode === 'list' ? 'modern-btn-primary' : 'hover:bg-[#F3F4F6]'}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                className={`p-2 rounded ${viewMode === 'grid' ? 'modern-btn-primary' : 'hover:bg-[#F3F4F6]'}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products List/Grid */}
      <div className="modern-card">
        {isLoading ? (
          <div className="modern-loading p-12 text-center">
            <Package className="w-8 h-8 text-[#4B5563] mx-auto mb-3 animate-pulse" />
            <p className="modern-subheading">Loading products...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-[#4B5563] mx-auto mb-4" />
            <p className="modern-heading text-xl text-[#1E1E20] mb-2">No products found</p>
            <p className="modern-subheading mb-6">Try adjusting your search terms or add your first product</p>
            <button className="modern-btn-primary flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="modern-table">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="modern-caption text-left p-4">PRODUCT</th>
                  <th className="modern-caption text-left p-4">SKU</th>
                  <th className="modern-caption text-left p-4">CATEGORY</th>
                  <th className="modern-caption text-left p-4">STOCK</th>
                  <th className="modern-caption text-left p-4">COST PRICE</th>
                  <th className="modern-caption text-left p-4">SELLING PRICE</th>
                  <th className="modern-caption text-left p-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <EditableRow key={item.id || item.entity_id} row={item} onSave={onSaveRow} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item: any) => (
              <ProductCard key={item.id || item.entity_id} product={item} onSave={onSaveRow} />
            ))}
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="modern-caption text-[#4B5563]">
          Showing {items.length} products • Last updated {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  )
}

function EditableRow({ row, onSave }: { row: any; onSave: (r: any) => Promise<void> }) {
  const [state, setState] = React.useState(() => ({
    name: row.entity_name || row.name || '',
    sku: row.entity_code || row.sku || '',
    brand: row.brand || '',
    category: row.attributes?.category || row.category || '',
    reorder_point: row.attributes?.reorder_point || row.reorder_point || '',
    cost_price: row.attributes?.cost_price || row.cost_price || '',
    selling_price: row.attributes?.selling_price || row.selling_price || ''
  }))
  const [saving, setSaving] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)

  async function save() {
    setSaving(true)
    try {
      await onSave({ ...row, ...state })
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const stockStatus = row.stock_quantity === 0 ? 'out' : row.stock_quantity < row.reorder_point ? 'low' : 'normal'
  const stockColor = {
    'out': 'text-[#E53935]',
    'low': 'text-[#FFB74D]',
    'normal': 'text-[#81C784]'
  }[stockStatus]

  return (
    <tr className="border-b border-[#E5E7EB] hover:bg-[#F3F4F6]/50 transition-colors">
      <td className="p-4">
        {isEditing ? (
          <input
            className="modern-input w-full"
            value={state.name}
            onChange={e => setState(s => ({ ...s, name: e.target.value }))}
            placeholder="Product name"
          />
        ) : (
          <div>
            <div className="modern-heading text-[#1E1E20] font-medium">{state.name || 'Unnamed Product'}</div>
            <div className="modern-caption text-[#4B5563]">{state.brand || 'No brand'}</div>
          </div>
        )}
      </td>
      <td className="p-4">
        {isEditing ? (
          <input
            className="modern-input w-full"
            value={state.sku}
            onChange={e => setState(s => ({ ...s, sku: e.target.value }))}
            placeholder="SKU"
          />
        ) : (
          <div className="font-mono text-sm text-[#4B5563]">{state.sku || '—'}</div>
        )}
      </td>
      <td className="p-4">
        {isEditing ? (
          <input
            className="modern-input w-full"
            value={state.category}
            onChange={e => setState(s => ({ ...s, category: e.target.value }))}
            placeholder="Category"
          />
        ) : (
          <div className="modern-body text-[#1E1E20]">{state.category || '—'}</div>
        )}
      </td>
      <td className="p-4">
        <div className={`font-medium ${stockColor}`}>
          {row.stock_quantity || 0} units
        </div>
        <div className="modern-caption text-[#4B5563]">
          Reorder: {row.reorder_point || 0}
        </div>
      </td>
      <td className="p-4">
        {isEditing ? (
          <input
            className="modern-input w-24"
            value={state.cost_price}
            onChange={e => setState(s => ({ ...s, cost_price: e.target.value }))}
            placeholder="0.00"
            type="number"
            step="0.01"
          />
        ) : (
          <div className="modern-body text-[#1E1E20]">
            ₹{Number(state.cost_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        )}
      </td>
      <td className="p-4">
        {isEditing ? (
          <input
            className="modern-input w-24"
            value={state.selling_price}
            onChange={e => setState(s => ({ ...s, selling_price: e.target.value }))}
            placeholder="0.00"
            type="number"
            step="0.01"
          />
        ) : (
          <div className="modern-heading text-[#1E88E5] font-medium">
            ₹{Number(state.selling_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={save} 
                className="modern-btn-primary text-xs px-3 py-1 flex items-center gap-1" 
                disabled={saving}
                title="Save Changes"
              >
                <Save className="w-3 h-3" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="modern-btn-secondary text-xs px-3 py-1"
                title="Cancel"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(true)} 
                className="modern-btn-secondary text-xs px-3 py-1 flex items-center gap-1"
                title="Edit Product"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
              <button 
                className="p-2 rounded hover:bg-[#F3F4F6] text-[#4B5563]"
                title="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

function ProductCard({ product, onSave }: { product: any; onSave: (r: any) => Promise<void> }) {
  const stockStatus = product.stock_quantity === 0 ? 'out' : product.stock_quantity < product.reorder_point ? 'low' : 'normal'
  const stockBadge = {
    'out': { color: 'modern-status-error', text: 'Out of Stock' },
    'low': { color: 'modern-status-warning', text: 'Low Stock' },
    'normal': { color: 'modern-status-success', text: 'In Stock' }
  }[stockStatus]

  return (
    <div className="modern-elevated rounded-xl p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="modern-heading text-[#1E1E20] font-medium mb-1 line-clamp-2">
            {product.entity_name || product.name || 'Unnamed Product'}
          </h3>
          <p className="modern-caption text-[#4B5563] mb-2">{product.brand || 'No brand'}</p>
        </div>
        <div className={`${stockBadge.color} px-2 py-1 rounded-full text-xs font-medium`}>
          {stockBadge.text}
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="modern-caption">SKU</span>
          <span className="font-mono text-xs text-[#4B5563]">{product.entity_code || product.sku || '—'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="modern-caption">Stock</span>
          <span className="font-medium">{product.stock_quantity || 0} units</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="modern-caption">Price</span>
          <span className="modern-heading text-[#1E88E5]">
            ₹{Number(product.selling_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button className="modern-btn-secondary flex-1 text-xs flex items-center justify-center gap-1">
          <Eye className="w-3 h-3" />
          View
        </button>
        <button className="modern-btn-secondary flex-1 text-xs flex items-center justify-center gap-1">
          <Edit3 className="w-3 h-3" />
          Edit
        </button>
      </div>
    </div>
  )
}