'use client'

import React from 'react'
import { useEntitiesList, useEntityUpsert, useHera } from '@/lib/hooks/hera'
import { Package, Search, Printer, Edit3, Save } from 'lucide-react'

export default function InventoryCatalogPage() {
  const { auth } = useHera()
  const [search, setSearch] = React.useState('')
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
        reorder_point: row.reorder_point
      }
    })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card glass-sage">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-gradient-to-br from-[#BB8D3F]/30 to-[#8B4729]/20">
            <Package className="w-6 h-6 text-[#8B4729]" />
          </div>
          <h1 className="text-2xl font-bold text-[#45492D]">Product Catalog</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#818865]" />
            <input
              className="glass-input w-full pl-10"
              placeholder="Search products by name, code, or serial number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            className="glass-btn-accent flex items-center gap-2 px-4 py-2" 
            onClick={() => window.print()}
            title="Print Barcodes"
          >
            <Printer className="w-4 h-4" />
            Print Barcodes
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card">
        {isLoading ? (
          <div className="glass-loading p-8 text-center text-[#818865]">
            Loading products...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-[#818865] mx-auto mb-3" />
            <p className="text-[#818865] mb-2">No products found</p>
            <p className="text-sm text-[#818865]/60">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="glass-table">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#818865]/20">
                  <th className="text-left p-3 font-semibold text-[#45492D]">Product Name</th>
                  <th className="text-left p-3 font-semibold text-[#45492D]">SKU/Code</th>
                  <th className="text-left p-3 font-semibold text-[#45492D]">Brand</th>
                  <th className="text-left p-3 font-semibold text-[#45492D]">Category</th>
                  <th className="text-left p-3 font-semibold text-[#45492D]">Reorder Point</th>
                  <th className="text-left p-3 font-semibold text-[#45492D]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it: any) => (
                  <EditableRow key={it.id || it.entity_id} row={it} onSave={onSaveRow} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="text-center text-sm text-[#818865]">
        Showing {items.length} products
      </div>
    </div>
  )
}

function EditableRow({ row, onSave }: { row: any; onSave: (r: any) => Promise<void> }) {
  const [state, setState] = React.useState(() => ({
    name: row.entity_name || row.name || '',
    code: row.entity_code || row.sku || '',
    brand: row.brand || '',
    category: row.attributes?.category || row.category || '',
    reorder_point: row.attributes?.reorder_point || row.reorder_point || ''
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

  const hasChanges = JSON.stringify({
    name: row.entity_name || row.name || '',
    code: row.entity_code || row.sku || '',
    brand: row.brand || '',
    category: row.attributes?.category || row.category || '',
    reorder_point: row.attributes?.reorder_point || row.reorder_point || ''
  }) !== JSON.stringify(state)

  return (
    <tr className="hover:bg-[#818865]/5 transition-colors">
      <td className="p-3">
        {isEditing ? (
          <input
            className="glass-input w-full text-sm"
            value={state.name}
            onChange={e => setState(s => ({ ...s, name: e.target.value }))}
            placeholder="Product name"
          />
        ) : (
          <div className="font-medium text-[#45492D]">{state.name || 'Unnamed Product'}</div>
        )}
      </td>
      <td className="p-3">
        {isEditing ? (
          <input
            className="glass-input w-full text-sm"
            value={state.code}
            onChange={e => setState(s => ({ ...s, code: e.target.value }))}
            placeholder="SKU/Code"
          />
        ) : (
          <div className="font-mono text-sm text-[#818865]">{state.code || '—'}</div>
        )}
      </td>
      <td className="p-3">
        {isEditing ? (
          <input
            className="glass-input w-full text-sm"
            value={state.brand}
            onChange={e => setState(s => ({ ...s, brand: e.target.value }))}
            placeholder="Brand"
          />
        ) : (
          <div className="text-[#45492D]">{state.brand || '—'}</div>
        )}
      </td>
      <td className="p-3">
        {isEditing ? (
          <input
            className="glass-input w-full text-sm"
            value={state.category}
            onChange={e => setState(s => ({ ...s, category: e.target.value }))}
            placeholder="Category"
          />
        ) : (
          <div className="text-[#45492D]">{state.category || '—'}</div>
        )}
      </td>
      <td className="p-3">
        {isEditing ? (
          <input
            className="glass-input w-20 text-sm"
            value={state.reorder_point}
            onChange={e => setState(s => ({ ...s, reorder_point: e.target.value }))}
            placeholder="0"
            type="number"
          />
        ) : (
          <div className="text-[#45492D]">{state.reorder_point || '0'}</div>
        )}
      </td>
      <td className="p-3">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={save} 
                className="glass-btn-primary text-xs px-3 py-1 flex items-center gap-1" 
                disabled={saving || !hasChanges}
                title="Save Changes"
              >
                <Save className="w-3 h-3" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false)
                  setState({
                    name: row.entity_name || row.name || '',
                    code: row.entity_code || row.sku || '',
                    brand: row.brand || '',
                    category: row.attributes?.category || row.category || '',
                    reorder_point: row.attributes?.reorder_point || row.reorder_point || ''
                  })
                }} 
                className="glass-btn-secondary text-xs px-3 py-1"
                title="Cancel Edit"
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="glass-btn-accent text-xs px-3 py-1 flex items-center gap-1"
              title="Edit Product"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
