'use client'

import React from 'react'
import { ItemWithStock } from '@/schemas/inventory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  Copy,
  Archive,
  ArchiveRestore,
  MoreVertical,
  Package,
  AlertTriangle,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ItemListProps {
  items: ItemWithStock[]
  loading?: boolean
  selectedIds: Set<string>
  onSelectAll: (checked: boolean) => void
  onSelectOne: (id: string, checked: boolean) => void
  onEdit: (item: ItemWithStock) => void
  onDuplicate: (item: ItemWithStock) => void
  onArchive: (ids: string[]) => void
  onRestore: (ids: string[]) => void
}

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  rose: '#E8B4B8',
  lightText: '#E0E0E0'
}

export function ItemList({
  items,
  loading,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore
}: ItemListProps) {
  const allSelected = items.length > 0 && selectedIds.size === items.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <Package className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.bronze }} />
        <h3 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
          No items found
        </h3>
        <p style={{ color: COLORS.lightText, opacity: 0.7 }}>
          Create your first inventory item to start tracking stock
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: COLORS.charcoal }}>
      <Table>
        <TableHeader>
          <TableRow className="border-b" style={{ borderColor: COLORS.bronze + '33' }}>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected || someSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all items"
                className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
              />
            </TableHead>
            <TableHead style={{ color: COLORS.bronze }}>Item / SKU</TableHead>
            <TableHead style={{ color: COLORS.bronze }}>Category</TableHead>
            <TableHead style={{ color: COLORS.bronze }}>UoM</TableHead>
            <TableHead style={{ color: COLORS.bronze }}>On Hand</TableHead>
            <TableHead style={{ color: COLORS.bronze }}>Reorder</TableHead>
            <TableHead style={{ color: COLORS.bronze }}>Avg Cost</TableHead>
            <TableHead style={{ color: COLORS.bronze }}>Value</TableHead>
            <TableHead style={{ color: COLORS.bronze }}>Status</TableHead>
            <TableHead style={{ color: COLORS.bronze }}>Updated</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow
              key={item.id}
              className={cn(
                'border-b transition-colors',
                selectedIds.has(item.id) && 'bg-muted/50'
              )}
              style={{ borderColor: COLORS.black }}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={checked => onSelectOne(item.id, checked as boolean)}
                  aria-label={`Select ${item.name}`}
                />
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium" style={{ color: COLORS.champagne }}>
                    {item.name}
                  </div>
                  {item.sku && (
                    <div className="text-xs opacity-70" style={{ color: COLORS.lightText }}>
                      {item.sku}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {item.category ? (
                  <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">
                    {item.category}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell style={{ color: COLORS.lightText }}>
                {item.uom || 'unit'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {item.low_stock && (
                    <AlertTriangle className="w-4 h-4" style={{ color: '#DC2626' }} />
                  )}
                  <span style={{ color: item.low_stock ? '#DC2626' : COLORS.lightText }}>
                    {item.on_hand || 0}
                  </span>
                </div>
              </TableCell>
              <TableCell style={{ color: COLORS.lightText }}>
                {item.metadata?.reorder_level || '-'}
              </TableCell>
              <TableCell style={{ color: COLORS.lightText }}>
                {formatCurrency(item.avg_cost || 0)}
              </TableCell>
              <TableCell style={{ color: COLORS.champagne }}>
                {formatCurrency(item.value || 0)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={item.status === 'active' ? 'default' : 'secondary'}
                  className={cn(
                    item.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-muted/20 text-muted-foreground border-muted-foreground/50'
                  )}
                >
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell style={{ color: COLORS.lightText }}>
                {formatDistanceToNow(new Date(item.updated_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(item)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {item.status === 'active' ? (
                      <DropdownMenuItem
                        onClick={() => onArchive([item.id])}
                        className="text-red-400"
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => onRestore([item.id])}
                        className="text-green-400"
                      >
                        <ArchiveRestore className="mr-2 h-4 w-4" />
                        Restore
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}