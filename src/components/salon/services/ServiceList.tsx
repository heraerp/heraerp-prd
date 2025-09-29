'use client'

import React, { useState } from 'react'
import { ServiceWithDynamicData } from '@/schemas/service'
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
  Trash2,
  Archive,
  ArchiveRestore,
  MoreVertical,
  Clock,
  DollarSign,
  Percent
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ServiceListProps {
  services: ServiceWithDynamicData[]
  loading?: boolean
  selectedIds: Set<string>
  onSelectAll: (checked: boolean) => void
  onSelectOne: (id: string, checked: boolean) => void
  onEdit: (service: ServiceWithDynamicData) => void
  onDelete: (ids: string[]) => void
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
  plum: '#5A2A40',
  rose: '#E8B4B8',
  lightText: '#E0E0E0'
}

export function ServiceList({
  services,
  loading,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onEdit,
  onDelete,
  onArchive,
  onRestore
}: ServiceListProps) {
  const allSelected = services.length > 0 && selectedIds.size === services.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < services.length

  const formatDuration = (mins?: number) => {
    if (!mins) return '-'
    const hours = Math.floor(mins / 60)
    const minutes = mins % 60
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }
    return `${minutes}m`
  }

  const formatPrice = (price?: number, currency = 'AED') => {
    if (price === undefined) return '-'
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const formatCommission = (type?: string, value?: number, currency = 'AED') => {
    if (!type || value === undefined) return '-'
    if (type === 'percent') {
      return `${value}%`
    }
    return formatPrice(value, currency)
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

  if (services.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">✨</div>
        <h3 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
          No services yet
        </h3>
        <p style={{ color: COLORS.lightText, opacity: 0.7 }}>
          Create your first service to start building your catalog
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: COLORS.charcoal }}>
      <Table>
        <TableHeader>
          <TableRow className="border-b" style={{ borderColor: COLORS.champagne + '44' }}>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected || someSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all services"
                className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
              />
            </TableHead>
            <TableHead className="!text-[#F5E6C8]">Service</TableHead>
            <TableHead className="!text-[#F5E6C8]">Category</TableHead>
            <TableHead className="!text-[#F5E6C8]">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#F5E6C8]" />
                Duration
              </div>
            </TableHead>
            <TableHead className="!text-[#F5E6C8]">Price</TableHead>
            <TableHead className="!text-[#F5E6C8]">Status</TableHead>
            <TableHead className="!text-[#F5E6C8]">Updated</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map(service => (
            <TableRow
              key={service.id}
              className={cn(
                'border-b transition-colors',
                selectedIds.has(service.id) && 'bg-muted/50'
              )}
              style={{ borderColor: COLORS.black }}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(service.id)}
                  onCheckedChange={checked => onSelectOne(service.id, checked as boolean)}
                  aria-label={`Select ${service.name}`}
                />
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium" style={{ color: COLORS.champagne }}>
                    {service.name || service.entity_name || service.code || '-'}
                  </div>
                  {service.code && (
                    <div className="text-xs" style={{ color: COLORS.lightText }}>
                      {service.code}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {service.category || service.metadata?.category ? (
                  <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">
                    {service.category || service.metadata?.category}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell style={{ color: COLORS.lightText }}>
                {formatDuration(service.duration_mins || service.metadata?.duration_mins)}
              </TableCell>
              <TableCell style={{ color: COLORS.champagne }}>
                {formatPrice(service.price, service.currency)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={service.status === 'active' ? 'default' : 'secondary'}
                  className={cn(
                    service.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-muted/20 text-muted-foreground border-muted-foreground/50'
                  )}
                >
                  {service.status}
                </Badge>
              </TableCell>
              <TableCell style={{ color: COLORS.lightText }}>
                {service.updated_at
                  ? formatDistanceToNow(new Date(service.updated_at), { addSuffix: true })
                  : '-'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(service)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete([service.id])}
                      className="text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {service.status === 'active' ? (
                      <DropdownMenuItem
                        onClick={() => onArchive([service.id])}
                        className="text-red-400"
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => onRestore([service.id])}
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
