'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  Package2, 
  TruckIcon, 
  BarChart,
  Plus,
  Upload,
  Search,
  Filter,
  ArrowLeft,
  ChevronRight
} from 'lucide-react'
import { ItemList } from '@/components/salon/inventory/ItemList'
import { ItemModal } from '@/components/salon/inventory/ItemModal'
import { MovementList } from '@/components/salon/inventory/MovementList'
import { MovementModal } from '@/components/salon/inventory/MovementModal'
import { ValuationCard } from '@/components/salon/inventory/ValuationCard'
import { useInventoryPlaybook } from '@/hooks/useInventoryPlaybook'
import { useMovementsPlaybook } from '@/hooks/useMovementsPlaybook'
import { ItemWithStock, MovementForm } from '@/schemas/inventory'
import { cn } from '@/lib/utils'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',  // Darker shade for depth
  charcoalLight: '#232323',  // Lighter shade for elements
  plum: '#5A2A40',  // Added for gradient accent
  emerald: '#0F6F5C'  // Added for accent
}

export default function SalonInventoryPage() {
  const { organization, isAuthenticated, contextLoading } = useHERAAuth()
  const organizationId = organization?.id || ''
  
  const [activeTab, setActiveTab] = useState('items')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedMovements, setSelectedMovements] = useState<Set<string>>(new Set())
  
  // Modal states
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemWithStock | null>(null)
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  
  // Branch state (TODO: Implement branch selector)
  const [currentBranch] = useState('BRN-001')

  // Use inventory hook
  const {
    items,
    total: itemsTotal,
    loading: itemsLoading,
    lowStockItems,
    saveItem,
    archiveMany,
    restoreMany,
    exportCSV: exportItems
  } = useInventoryPlaybook({
    organizationId,
    branchId: currentBranch,
    query: searchQuery,
    status: statusFilter
  })

  // Use movements hook
  const {
    movements,
    total: movementsTotal,
    loading: movementsLoading,
    createMovement,
    exportCSV: exportMovements
  } = useMovementsPlaybook({
    organizationId,
    branchId: currentBranch
  })

  // Calculate valuation summary
  const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0)
  const totalItems = items.filter(i => i.status === 'active').length
  const outOfStock = items.filter(i => i.on_hand === 0).length

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--hera-black)' }}>
        <div className="text-center p-8 rounded-xl" 
             style={{ 
               backgroundColor: COLORS.charcoal,
               boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
             }}>
          <h2 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
            Please log in to access inventory
          </h2>
        </div>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--hera-black)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" 
             style={{ borderColor: COLORS.gold }} />
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--hera-black)' }}>
        <div className="text-center p-8 rounded-xl" 
             style={{ 
               backgroundColor: COLORS.charcoal,
               boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
             }}>
          <h2 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
            No organization context found
          </h2>
          <p style={{ color: COLORS.lightText, opacity: 0.7 }}>
            Please select an organization to continue
          </p>
        </div>
      </div>
    )
  }

  const handleSelectAllItems = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map(i => i.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedItems(newSelected)
  }

  const handleArchiveSelected = async () => {
    const ids = Array.from(selectedItems)
    await archiveMany(ids)
    setSelectedItems(new Set())
  }

  const handleRestoreSelected = async () => {
    const ids = Array.from(selectedItems)
    await restoreMany(ids)
    setSelectedItems(new Set())
  }

  const handleSaveItem = async (data: any) => {
    await saveItem(data, editingItem?.id)
    setItemModalOpen(false)
    setEditingItem(null)
  }

  const handleEditItem = (item: ItemWithStock) => {
    setEditingItem(item)
    setItemModalOpen(true)
  }

  const handleDuplicateItem = (item: ItemWithStock) => {
    const duplicated = { ...item, name: `${item.name} (Copy)`, sku: undefined, id: '' }
    setEditingItem(duplicated)
    setItemModalOpen(true)
  }

  const handleArchiveItem = async (ids: string[]) => {
    await archiveMany(ids)
  }

  const handleRestoreItem = async (ids: string[]) => {
    await restoreMany(ids)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--hera-black)' }}>
      {/* Main content wrapper with charcoal background for depth */}
      <div className="relative" style={{ minHeight: '100vh' }}>
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 pointer-events-none"
             style={{
               background: `radial-gradient(circle at 20% 80%, ${COLORS.gold}08 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, ${COLORS.bronze}05 0%, transparent 50%),
                           radial-gradient(circle at 40% 40%, ${COLORS.plum}03 0%, transparent 50%)`,
             }} />
        
        {/* Content container */}
        <div className="container mx-auto px-6 py-8 relative" 
             style={{ 
               backgroundColor: COLORS.charcoal,
               minHeight: '100vh',
               boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
             }}>
        {/* Header */}
        <div className="mb-8 p-6 rounded-xl" 
             style={{ 
               backgroundColor: COLORS.charcoalLight,
               boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
               border: `1px solid ${COLORS.bronze}20`
             }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <span style={{ color: COLORS.bronze }}>HERA</span>
            <ChevronRight className="w-4 h-4" style={{ color: COLORS.bronze }} />
            <span style={{ color: COLORS.bronze }}>SALON OS</span>
            <ChevronRight className="w-4 h-4" style={{ color: COLORS.bronze }} />
            <span style={{ color: COLORS.champagne }}>Inventory</span>
          </div>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold" style={{ color: COLORS.champagne }}>
              Inventory Management
            </h1>
            
            <div className="flex items-center gap-3">
              {/* TODO: Branch Selector */}
              <div className="px-4 py-2 rounded-lg border text-sm"
                   style={{ 
                     borderColor: COLORS.bronze + '33',
                     backgroundColor: COLORS.charcoalDark,
                     color: COLORS.lightText,
                     boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                   }}>
                Main Branch
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: COLORS.bronze }} />
                <input
                  type="text"
                  placeholder="Search items, movements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border text-sm w-64"
                  style={{
                    borderColor: COLORS.bronze + '33',
                    backgroundColor: COLORS.charcoalDark,
                    color: COLORS.lightText,
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <Button
                variant="outline"
                onClick={() => setMovementModalOpen(true)}
                className="gap-2"
                style={{
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne
                }}
              >
                <Upload className="w-4 h-4" />
                New Movement
              </Button>
              
              <Button
                onClick={() => {
                  setEditingItem(null)
                  setItemModalOpen(true)
                }}
                className="gap-2"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black
                }}
              >
                <Plus className="w-4 h-4" />
                New Item
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="p-0 border-b w-full justify-start h-auto rounded-none"
                    style={{ 
                      borderColor: COLORS.bronze + '33',
                      backgroundColor: COLORS.charcoalLight,
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                    }}>
            <TabsTrigger 
              value="items" 
              className="rounded-none px-6 py-3 relative transition-colors"
              style={{
                backgroundColor: activeTab === 'items' ? COLORS.charcoal : 'transparent'
              }}
            >
              <div className="flex items-center gap-2">
                <Package2 className="w-4 h-4" style={{ color: activeTab === 'items' ? COLORS.gold : COLORS.champagne }} />
                <span style={{ color: activeTab === 'items' ? COLORS.champagne : COLORS.lightText }}>Items</span>
                <Badge variant="secondary" className="ml-2"
                       style={{ 
                         backgroundColor: COLORS.charcoalDark,
                         color: COLORS.champagne,
                         border: `1px solid ${COLORS.gold}33`
                       }}>
                  {itemsTotal}
                </Badge>
                {lowStockItems > 0 && (
                  <Badge className="ml-1" 
                         style={{ 
                           backgroundColor: 'rgba(220, 38, 38, 0.2)',
                           color: '#EF4444',
                           borderColor: 'rgba(220, 38, 38, 0.5)'
                         }}>
                    {lowStockItems} low
                  </Badge>
                )}
              </div>
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-0.5 transition-all",
                activeTab === 'items' ? 'opacity-100' : 'opacity-0'
              )} style={{ backgroundColor: COLORS.gold }} />
            </TabsTrigger>

            <TabsTrigger 
              value="movements" 
              className="rounded-none px-6 py-3 relative transition-colors"
              style={{
                backgroundColor: activeTab === 'movements' ? COLORS.charcoal : 'transparent'
              }}
            >
              <div className="flex items-center gap-2">
                <TruckIcon className="w-4 h-4" style={{ color: activeTab === 'movements' ? COLORS.gold : COLORS.champagne }} />
                <span style={{ color: activeTab === 'movements' ? COLORS.champagne : COLORS.lightText }}>Movements</span>
                <Badge variant="secondary" className="ml-2"
                       style={{ 
                         backgroundColor: COLORS.charcoalDark,
                         color: COLORS.champagne,
                         border: `1px solid ${COLORS.gold}33`
                       }}>
                  {movementsTotal}
                </Badge>
              </div>
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-0.5 transition-all",
                activeTab === 'movements' ? 'opacity-100' : 'opacity-0'
              )} style={{ backgroundColor: COLORS.gold }} />
            </TabsTrigger>

            <TabsTrigger 
              value="valuation" 
              className="rounded-none px-6 py-3 relative transition-colors"
              style={{
                backgroundColor: activeTab === 'valuation' ? COLORS.charcoal : 'transparent'
              }}
            >
              <div className="flex items-center gap-2">
                <BarChart className="w-4 h-4" style={{ color: activeTab === 'valuation' ? COLORS.gold : COLORS.champagne }} />
                <span style={{ color: activeTab === 'valuation' ? COLORS.champagne : COLORS.lightText }}>Valuation</span>
              </div>
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-0.5 transition-all",
                activeTab === 'valuation' ? 'opacity-100' : 'opacity-0'
              )} style={{ backgroundColor: COLORS.gold }} />
            </TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg border text-sm"
                  style={{
                    borderColor: COLORS.bronze + '33',
                    backgroundColor: COLORS.charcoalDark,
                    color: COLORS.lightText,
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <option value="active">Active Items</option>
                  <option value="archived">Archived Items</option>
                  <option value="all">All Items</option>
                </select>

                {lowStockItems > 0 && (
                  <Badge 
                    className="cursor-pointer"
                    style={{ 
                      backgroundColor: '#DC2626' + '20',
                      color: '#DC2626',
                      borderColor: '#DC2626' + '50'
                    }}
                  >
                    <Filter className="w-3 h-3 mr-1" />
                    {lowStockItems} Low Stock
                  </Badge>
                )}
              </div>

              {/* Bulk Actions */}
              {selectedItems.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: COLORS.lightText }}>
                    {selectedItems.size} selected
                  </span>
                  {statusFilter === 'active' ? (
                    <Button size="sm" variant="outline"
                            onClick={handleArchiveSelected}
                            style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}>
                      Archive
                    </Button>
                  ) : statusFilter === 'archived' ? (
                    <Button size="sm" variant="outline"
                            onClick={handleRestoreSelected}
                            style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}>
                      Restore
                    </Button>
                  ) : null}
                  <Button size="sm" variant="outline"
                          onClick={exportItems}
                          style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}>
                    Export CSV
                  </Button>
                </div>
              )}
            </div>

            {/* Items List */}
            <ItemList
              items={items}
              loading={itemsLoading}
              selectedIds={selectedItems}
              onSelectAll={handleSelectAllItems}
              onSelectOne={handleSelectItem}
              onEdit={handleEditItem}
              onDuplicate={handleDuplicateItem}
              onArchive={handleArchiveItem}
              onRestore={handleRestoreItem}
            />
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements" className="space-y-6">
            {/* Movement Filters */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Type filter chips */}
                {['All', 'Receipt', 'Issue', 'Transfer', 'Adjust'].map(type => (
                  <Badge
                    key={type}
                    variant="outline"
                    className="cursor-pointer"
                    style={{
                      borderColor: COLORS.bronze + '50',
                      color: COLORS.champagne
                    }}
                  >
                    {type}
                  </Badge>
                ))}
              </div>

              {movementsTotal > 0 && (
                <Button size="sm" variant="outline"
                        onClick={exportMovements}
                        style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}>
                  Export CSV
                </Button>
              )}
            </div>

            {/* Movements List */}
            <MovementList
              movements={movements}
              loading={movementsLoading}
            />
          </TabsContent>

          {/* Valuation Tab */}
          <TabsContent value="valuation" className="space-y-6">
            {/* Valuation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ValuationCard
                branch_id={currentBranch}
                branch_name="Main Branch"
                total_items={totalItems}
                total_value={totalValue}
                low_stock_items={lowStockItems}
                out_of_stock_items={outOfStock}
                valuation_method="WAC"
                last_updated={new Date().toISOString()}
              />
              
              {/* Additional branch cards would go here */}
            </div>

            {/* Valuation Settings */}
            <div className="p-6 rounded-xl border"
                 style={{ 
                   backgroundColor: COLORS.charcoalLight,
                   borderColor: COLORS.bronze + '33',
                   boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                 }}>
              <h3 className="text-lg font-medium mb-4" style={{ color: COLORS.champagne }}>
                Valuation Configuration
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span style={{ color: COLORS.lightText }}>Organization Valuation Method</span>
                  <select className="px-3 py-1.5 rounded-lg border text-sm"
                          style={{
                            borderColor: COLORS.bronze + '33',
                            backgroundColor: COLORS.charcoalDark,
                            color: COLORS.lightText,
                            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                          }}>
                    <option>Weighted Average Cost (WAC)</option>
                    <option>First In First Out (FIFO)</option>
                  </select>
                </div>
                <p className="text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                  This setting applies to all items unless overridden at the item level
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Item Modal */}
        {itemModalOpen && (
          <ItemModal
            open={itemModalOpen}
            onClose={() => {
              setItemModalOpen(false)
              setEditingItem(null)
            }}
            item={editingItem}
            onSave={handleSaveItem}
            categories={['Hair Care', 'Color', 'Tools', 'Retail', 'Supplies', 'Equipment']}
          />
        )}

        {/* Movement Modal */}
        {movementModalOpen && (
          <MovementModal
            open={movementModalOpen}
            onClose={() => setMovementModalOpen(false)}
            items={items}
            branches={[
              { id: 'BRN-001', name: 'Main Branch' },
              { id: 'BRN-002', name: 'Downtown Branch' },
              { id: 'BRN-003', name: 'Mall Branch' }
            ]}
            currentBranch={currentBranch}
            onSave={createMovement}
          />
        )}
      </div>
    </div>
  </div>
  )
}