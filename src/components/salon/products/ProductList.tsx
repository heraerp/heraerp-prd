'use client'

import React from 'react'
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
import { Edit, Trash2, Archive, ArchiveRestore, MoreVertical, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductListProps {
  products: Product[]
  loading?: boolean
  viewMode?: 'grid' | 'list'
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
  loading = false,
  viewMode = 'list',
  onEdit,
  onDelete,
  onArchive,
  onRestore
}: ProductListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
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
            <TableHead className="!text-[#F5E6C8]">Price</TableHead>
            <TableHead className="!text-[#F5E6C8]">Stock</TableHead>
            <TableHead className="!text-[#F5E6C8]">Value</TableHead>
            <TableHead className="!text-[#F5E6C8]">Status</TableHead>
            <TableHead className="!text-[#F5E6C8]">Updated</TableHead>
            <TableHead className="!text-[#F5E6C8] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => {
            const isArchived = product.status === 'archived'
            const stockValue = (product.price || 0) * product.qty_on_hand

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
                        <p
                          className="text-sm opacity-60 mt-0.5"
                          style={{ color: COLORS.lightText }}
                        >
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
                    <span className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                      No category
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  {product.price ? (
                    <span className="font-semibold" style={{ color: COLORS.gold }}>
                      AED {product.price.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                      No price
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <span
                    className={cn(
                      'font-semibold',
                      product.qty_on_hand < 10 ? 'text-red-400' : 'text-green-400'
                    )}
                  >
                    {product.qty_on_hand}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-semibold" style={{ color: COLORS.champagne }}>
                    AED {stockValue.toFixed(2)}
                  </span>
                </TableCell>

                <TableCell>
                  {isArchived ? (
                    <Badge
                      variant="secondary"
                      className="bg-gray-500/20 text-gray-400 border-gray-500/30"
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
                colSpan={8}
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
  onEdit,
  onDelete,
  onArchive,
  onRestore
}: {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onArchive: (product: Product) => void
  onRestore: (product: Product) => void
}) {
  const isArchived = product.status === 'archived'
  const stockValue = (product.price || 0) * product.qty_on_hand

  return (
    <div
      className={cn(
        'relative p-6 rounded-xl transition-all duration-200',
        'hover:shadow-xl hover:scale-[1.02]',
        isArchived && 'opacity-60'
      )}
      style={{
        backgroundColor: COLORS.charcoalLight,
        border: `1px solid ${COLORS.bronze}20`,
        boxShadow: `0 4px 12px rgba(0,0,0,0.2)`
      }}
    >
      {/* Status Badge */}
      {isArchived && (
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 text-xs"
          style={{
            backgroundColor: COLORS.bronze + '20',
            color: COLORS.bronze
          }}
        >
          Archived
        </Badge>
      )}

      {/* Icon and Actions */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: COLORS.gold + '20',
            border: `1px solid ${COLORS.gold}40`
          }}
        >
          <Package className="w-6 h-6" style={{ color: COLORS.gold }} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 rounded hover:bg-black/20 transition-colors"
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

      {/* Product Name */}
      <h3 className="font-semibold text-lg mb-2" style={{ color: COLORS.champagne }}>
        {product.entity_name}
      </h3>

      {/* Category */}
      {product.category && (
        <Badge
          variant="secondary"
          className="mb-3 bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        >
          {product.category}
        </Badge>
      )}

      {/* Price and Stock */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs opacity-60" style={{ color: COLORS.lightText }}>
            Price
          </p>
          <p className="font-semibold" style={{ color: COLORS.gold }}>
            {product.price ? `AED ${product.price.toFixed(2)}` : 'No price'}
          </p>
        </div>
        <div>
          <p className="text-xs opacity-60" style={{ color: COLORS.lightText }}>
            Stock
          </p>
          <p
            className={cn(
              'font-semibold',
              product.qty_on_hand < 10 ? 'text-red-400' : 'text-green-400'
            )}
          >
            {product.qty_on_hand}
          </p>
        </div>
      </div>

      {/* Total Value */}
      <div
        className="flex items-center justify-between pt-4 border-t"
        style={{ borderColor: COLORS.bronze + '20' }}
      >
        <span className="text-sm" style={{ color: COLORS.lightText, opacity: 0.6 }}>
          Total Value
        </span>
        <span className="font-semibold" style={{ color: COLORS.champagne }}>
          AED {stockValue.toFixed(2)}
        </span>
      </div>

      {/* Code */}
      {product.entity_code && (
        <p className="text-xs mt-2 font-mono" style={{ color: COLORS.bronze, opacity: 0.6 }}>
          {product.entity_code}
        </p>
      )}
    </div>
  )
}
