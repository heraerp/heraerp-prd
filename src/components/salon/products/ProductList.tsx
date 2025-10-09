'use client'

import React from 'react'
import Link from 'next/link'
import { Product } from '@/types/salon-product'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'
import {
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  MoreVertical,
  Package,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InventoryChip } from './InventoryChip'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { useInventorySettings, shouldDisplayInventoryChip } from '@/hooks/useInventorySettings'

interface ProductListProps {
  products: Product[]
  organizationId: string
  loading?: boolean
  viewMode?: 'grid' | 'list'
  currency?: string
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onArchive: (product: Product) => void
  onRestore: (product: Product) => void
}

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  rose: '#E8B4B8',
  plum: '#B794F4',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

export function ProductList({
  products,
  organizationId,
  loading = false,
  viewMode = 'list',
  currency = 'AED',
  onEdit,
  onDelete,
  onArchive,
  onRestore
}: ProductListProps) {
  const { selectedBranchId } = useBranchFilter()
  const { settings } = useInventorySettings(organizationId)

  if (loading) {
    return viewMode === 'grid' ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="relative p-5 rounded-xl overflow-hidden animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalLight}e8 0%, ${COLORS.charcoalDark}f0 100%)`,
              border: `1px solid ${COLORS.bronze}20`,
              minHeight: '280px'
            }}
          >
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(90deg, transparent, ${COLORS.champagne}10, transparent)`,
                animation: 'shimmer 2s infinite'
              }}
            />
            <div className="relative z-10 space-y-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-lg shrink-0"
                  style={{ backgroundColor: COLORS.gold + '15' }}
                />
                <div className="flex-1 space-y-2">
                  <div
                    className="h-5 rounded"
                    style={{ backgroundColor: COLORS.champagne + '15', width: '80%' }}
                  />
                  <div
                    className="h-4 rounded"
                    style={{ backgroundColor: COLORS.bronze + '12', width: '40%' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[...Array(4)].map((_, j) => (
                  <div
                    key={j}
                    className="h-14 rounded-lg"
                    style={{ backgroundColor: COLORS.charcoalDark + '40' }}
                  />
                ))}
              </div>
              <div
                className="h-10 rounded-lg"
                style={{ backgroundColor: COLORS.charcoalDark + '40' }}
              />
              <div className="flex gap-2">
                <div
                  className="h-7 flex-1 rounded"
                  style={{ backgroundColor: COLORS.gold + '12' }}
                />
                <div
                  className="h-7 w-16 rounded-lg"
                  style={{ backgroundColor: COLORS.gold + '12' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-lg overflow-hidden animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalLight}e8 0%, ${COLORS.charcoalDark}f0 100%)`,
              border: `1px solid ${COLORS.bronze}20`
            }}
          >
            <div
              className="h-full opacity-15"
              style={{
                background: `linear-gradient(90deg, transparent, ${COLORS.champagne}30, transparent)`,
                animation: 'shimmer 2s infinite'
              }}
            />
          </div>
        ))}
      </div>
    )
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            organizationId={organizationId}
            currency={currency}
            settings={settings}
            onEdit={onEdit}
            onDelete={onDelete}
            onArchive={onArchive}
            onRestore={onRestore}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: COLORS.charcoalLight + '95',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}
    >
      <Table>
        <TableHeader>
          <TableRow
            className="border-b hover:bg-transparent"
            style={{ borderColor: COLORS.bronze + '33' }}
          >
            <TableHead className="!text-[#F5E6C8]">Product</TableHead>
            <TableHead className="!text-[#F5E6C8]">Category</TableHead>
            <TableHead className="!text-[#F5E6C8]">Cost Price</TableHead>
            <TableHead className="!text-[#F5E6C8]">Selling Price</TableHead>
            <TableHead className="!text-[#F5E6C8]">Stock</TableHead>
            <TableHead className="!text-[#F5E6C8]">Inventory</TableHead>
            <TableHead className="!text-[#F5E6C8]">Value</TableHead>
            <TableHead className="!text-[#F5E6C8]">Status</TableHead>
            <TableHead className="!text-[#F5E6C8]">Updated</TableHead>
            <TableHead className="!text-[#F5E6C8] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => {
            const isArchived = product.status === 'archived'
            // Check for price in multiple locations (price_market, selling_price, price)
            const sellingPrice = product.price_market || product.selling_price || product.price || 0
            // Check for stock in multiple locations (stock_quantity, stock_level, qty_on_hand)
            const stockQty =
              product.stock_quantity || product.stock_level || product.qty_on_hand || 0
            const stockValue = sellingPrice * stockQty

            return (
              <TableRow
                key={product.id}
                className={cn(
                  'border-b transition-colors group',
                  index % 2 === 0 ? 'bg-gray-50/5' : 'bg-transparent',
                  'hover:bg-cyan-100/10',
                  isArchived && 'opacity-60'
                )}
                style={{ borderColor: COLORS.bronze + '20' }}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: COLORS.gold + '20',
                        border: `1px solid ${COLORS.gold}40`
                      }}
                    >
                      <Package className="w-4 h-4" style={{ color: COLORS.gold }} />
                    </div>
                    <div>
                      <p style={{ color: COLORS.champagne }}>{product.entity_name}</p>
                      {product.entity_code && (
                        <p className="text-sm mt-0.5" style={{ color: COLORS.lightText }}>
                          {product.entity_code}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {product.category ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    >
                      {product.category}
                    </Badge>
                  ) : (
                    <span className="text-sm" style={{ color: COLORS.lightText }}>
                      No category
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  {(() => {
                    // Check for cost price in multiple locations (price_cost, cost_price, metadata.cost)
                    const cost =
                      product.price_cost ||
                      product.cost_price ||
                      (product as any).metadata?.cost ||
                      (product as any).cost

                    if (cost !== null && cost !== undefined && cost !== '') {
                      return (
                        <span className="font-semibold" style={{ color: COLORS.lightText }}>
                          {currency} {parseFloat(String(cost)).toFixed(2)}
                        </span>
                      )
                    }

                    return (
                      <span className="text-sm" style={{ color: COLORS.lightText }}>
                        -
                      </span>
                    )
                  })()}
                </TableCell>

                <TableCell>
                  {sellingPrice ? (
                    <span className="font-semibold" style={{ color: COLORS.gold }}>
                      {currency} {sellingPrice.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-sm" style={{ color: COLORS.lightText }}>
                      -
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <span
                    className={cn(
                      'font-semibold',
                      stockQty < 10 ? 'text-red-400' : 'text-green-400'
                    )}
                  >
                    {stockQty}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <InventoryChip productId={product.id} organizationId={organizationId} />
                    <Link
                      href={`/salon/inventory?productId=${product.id}${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`}
                      className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                      aria-label={`View inventory for ${product.entity_name}`}
                    >
                      <span className="text-xs underline-offset-4 hover:underline">View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="font-semibold" style={{ color: COLORS.champagne }}>
                    {currency} {stockValue.toFixed(2)}
                  </span>
                </TableCell>

                <TableCell>
                  {isArchived ? (
                    <Badge
                      variant="secondary"
                      className="bg-muted/50 text-muted-foreground border-border/50"
                    >
                      Archived
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-green-500/20 text-green-400 border-green-500/30"
                    >
                      Active
                    </Badge>
                  )}
                </TableCell>

                <TableCell>
                  <span className="text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                    {product.updated_at
                      ? formatDistanceToNow(new Date(product.updated_at), { addSuffix: true })
                      : 'Unknown'}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" style={{ color: COLORS.lightText }} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      style={{
                        backgroundColor: COLORS.charcoal,
                        border: `1px solid ${COLORS.bronze}33`
                      }}
                    >
                      <DropdownMenuItem
                        onClick={() => onEdit(product)}
                        style={{ color: COLORS.lightText }}
                        className="hover:!bg-cyan-900/20 hover:!text-cyan-300"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>

                      <DropdownMenuSeparator style={{ backgroundColor: COLORS.bronze + '33' }} />

                      {isArchived ? (
                        <DropdownMenuItem
                          onClick={() => onRestore(product)}
                          style={{ color: COLORS.lightText }}
                          className="hover:!bg-green-900/20 hover:!text-green-300"
                        >
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          Restore
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onArchive(product)}
                          style={{ color: COLORS.lightText }}
                          className="hover:!bg-yellow-900/20 hover:!text-yellow-300"
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator style={{ backgroundColor: COLORS.bronze + '33' }} />

                      <DropdownMenuItem
                        onClick={() => onDelete(product)}
                        className="hover:!bg-red-900/20 hover:!text-red-300"
                        style={{ color: '#FF6B6B' }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}

          {products.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={10}
                className="h-32 text-center"
                style={{ color: COLORS.lightText, opacity: 0.5 }}
              >
                No products found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function ProductCard({
  product,
  organizationId,
  currency = 'AED',
  settings,
  onEdit,
  onDelete,
  onArchive,
  onRestore
}: {
  product: Product
  organizationId: string
  currency?: string
  settings?: any
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onArchive: (product: Product) => void
  onRestore: (product: Product) => void
}) {
  const { selectedBranchId } = useBranchFilter()
  const isArchived = product.status === 'archived'
  // Check for price in multiple locations (price_market, selling_price, price)
  const sellingPrice = product.price_market || product.selling_price || product.price || 0
  // Check for cost in multiple locations (price_cost, cost_price, metadata.cost)
  const costPrice = product.price_cost || product.cost_price || (product as any).metadata?.cost || 0
  // Check for stock in multiple locations (stock_quantity, stock_level, qty_on_hand)
  const stockQty = product.stock_quantity || product.stock_level || product.qty_on_hand || 0
  const stockValue = sellingPrice * stockQty
  const margin =
    sellingPrice > 0 ? (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1) : '0'

  return (
    <div
      className={cn(
        'group relative p-5 rounded-xl overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:shadow-xl hover:scale-[1.02]',
        isArchived && 'opacity-60'
      )}
      style={{
        background: `linear-gradient(135deg, ${COLORS.charcoalLight}e8 0%, ${COLORS.charcoalDark}f0 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${COLORS.bronze}20`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.2)`
      }}
    >
      {/* Subtle hover gradient */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${COLORS.gold}08 0%, transparent 100%)`
        }}
      />
      {/* Header: Icon, Name, Actions */}
      <div className="flex items-start gap-3 mb-4 relative z-10">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
            border: `1px solid ${COLORS.gold}40`
          }}
        >
          <Package className="w-5 h-5" style={{ color: COLORS.gold }} />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-base mb-1 leading-tight truncate"
            style={{ color: COLORS.champagne }}
          >
            {product.entity_name}
          </h3>
          {product.entity_code && (
            <code
              className="text-[9px] font-mono px-1.5 py-0.5 rounded inline-block truncate max-w-full"
              style={{
                backgroundColor: COLORS.bronze + '15',
                color: COLORS.bronze,
                border: `1px solid ${COLORS.bronze}30`
              }}
              title={product.entity_code}
            >
              {product.entity_code}
            </code>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: COLORS.lightText }}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            style={{ backgroundColor: COLORS.charcoal, border: `1px solid ${COLORS.bronze}33` }}
          >
            <DropdownMenuItem
              onClick={() => onEdit(product)}
              style={{ color: COLORS.lightText }}
              className="hover:!bg-cyan-900/20 hover:!text-cyan-300"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator style={{ backgroundColor: COLORS.bronze + '33' }} />
            {isArchived ? (
              <DropdownMenuItem
                onClick={() => onRestore(product)}
                style={{ color: COLORS.lightText }}
                className="hover:!bg-green-900/20 hover:!text-green-300"
              >
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Restore
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => onArchive(product)}
                style={{ color: COLORS.lightText }}
                className="hover:!bg-yellow-900/20 hover:!text-yellow-300"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator style={{ backgroundColor: COLORS.bronze + '33' }} />
            <DropdownMenuItem
              onClick={() => onDelete(product)}
              className="hover:!bg-red-900/20 hover:!text-red-300"
              style={{ color: '#FF6B6B' }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status & Category Badges */}
      <div className="flex gap-2 mb-3 relative z-10">
        {isArchived && (
          <Badge
            variant="secondary"
            className="text-[10px] font-medium"
            style={{
              backgroundColor: COLORS.bronze + '20',
              color: COLORS.champagne,
              border: `1px solid ${COLORS.bronze}40`
            }}
          >
            Archived
          </Badge>
        )}
        {product.category && (
          <Badge
            variant="secondary"
            className="text-[10px] font-medium"
            style={{
              backgroundColor: '#10B981' + '20',
              color: '#10B981',
              border: `1px solid #10B98140`
            }}
          >
            {product.category}
          </Badge>
        )}
      </div>

      {/* Metrics Grid - Cleaner, lighter design */}
      <div className="grid grid-cols-3 gap-2.5 mb-3 relative z-10">
        <div
          className="p-2.5 rounded-lg"
          style={{
            backgroundColor: COLORS.gold + '08',
            border: `1px solid ${COLORS.gold}20`
          }}
        >
          <p
            className="text-[9px] uppercase tracking-wide mb-0.5 font-medium opacity-60"
            style={{ color: COLORS.gold }}
          >
            Price
          </p>
          <p className="font-bold text-sm" style={{ color: COLORS.gold }}>
            {sellingPrice ? `${currency} ${sellingPrice.toFixed(2)}` : '-'}
          </p>
        </div>

        <div
          className="p-2.5 rounded-lg"
          style={{
            backgroundColor: COLORS.bronze + '08',
            border: `1px solid ${COLORS.bronze}20`
          }}
        >
          <p
            className="text-[9px] uppercase tracking-wide mb-0.5 font-medium opacity-60"
            style={{ color: COLORS.bronze }}
          >
            Cost
          </p>
          <p className="font-bold text-sm" style={{ color: COLORS.champagne }}>
            {costPrice ? `${currency} ${costPrice.toFixed(2)}` : '-'}
          </p>
        </div>

        <div
          className="p-2.5 rounded-lg"
          style={{
            backgroundColor: COLORS.champagne + '08',
            border: `1px solid ${COLORS.champagne}20`
          }}
        >
          <p
            className="text-[9px] uppercase tracking-wide mb-0.5 font-medium opacity-60"
            style={{ color: COLORS.champagne }}
          >
            Margin
          </p>
          <p className="font-bold text-sm" style={{ color: COLORS.champagne }}>
            {margin}%
          </p>
        </div>
      </div>

      {/* Inventory Section - Only show if inventory management is enabled */}
      {shouldDisplayInventoryChip(settings, product) && (
        <div className="flex items-center gap-2 relative z-10">
          <div className="flex-1">
            <InventoryChip
              productId={product.id}
              organizationId={organizationId}
              showStatus={false}
            />
          </div>
          <Link
            href={`/salon/inventory?productId=${product.id}${selectedBranchId ? `&branchId=${selectedBranchId}` : ''}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: COLORS.gold,
              backgroundColor: COLORS.gold + '12',
              border: `1px solid ${COLORS.gold}30`
            }}
          >
            Manage
          </Link>
        </div>
      )}
    </div>
  )
}
