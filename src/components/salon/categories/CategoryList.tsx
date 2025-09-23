'use client'

import React from 'react'
import { Category } from '@/types/salon-category'
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
  MoreVertical
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryListProps {
  categories: Category[]
  loading?: boolean
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onArchive: (category: Category) => void
  onRestore: (category: Category) => void
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

export function CategoryList({
  categories,
  loading = false,
  onEdit,
  onDelete,
  onArchive,
  onRestore
}: CategoryListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
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
            <TableHead className="!text-[#F5E6C8]">Category</TableHead>
            <TableHead className="!text-[#F5E6C8]">Services</TableHead>
            <TableHead className="!text-[#F5E6C8]">Order</TableHead>
            <TableHead className="!text-[#F5E6C8]">Status</TableHead>
            <TableHead className="!text-[#F5E6C8]">Updated</TableHead>
            <TableHead className="!text-[#F5E6C8] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category, index) => {
            const IconComponent = (Icons as any)[category.icon] || Icons.Tag
            const isArchived = category.status === 'archived'

            return (
              <TableRow 
                key={category.id}
                className={cn(
                  "border-b transition-colors group",
                  index % 2 === 0 ? "bg-gray-50/5" : "bg-transparent",
                  "hover:bg-cyan-100/10",
                  isArchived && "opacity-60"
                )}
                style={{ borderColor: COLORS.bronze + '20' }}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: category.color + '20',
                        border: `1px solid ${category.color}40`
                      }}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: category.color }} />
                    </div>
                    <div>
                      <p style={{ color: COLORS.champagne }}>{category.entity_name}</p>
                      {category.description && (
                        <p className="text-sm opacity-60 mt-0.5" style={{ color: COLORS.lightText }}>
                          {category.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="font-semibold" style={{ color: category.color }}>
                    {category.service_count}
                  </span>
                </TableCell>

                <TableCell>
                  <span style={{ color: COLORS.lightText }}>
                    {category.sort_order}
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
                      style={{
                        backgroundColor: category.color + '20',
                        color: category.color,
                        borderColor: category.color + '30'
                      }}
                    >
                      Active
                    </Badge>
                  )}
                </TableCell>

                <TableCell>
                  <span className="text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                    {formatDistanceToNow(new Date(category.updated_at), { addSuffix: true })}
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
                      style={{ backgroundColor: COLORS.charcoal, border: `1px solid ${COLORS.bronze}33` }}
                    >
                      <DropdownMenuItem 
                        onClick={() => onEdit(category)}
                        style={{ color: COLORS.lightText }}
                        className="hover:!bg-cyan-900/20 hover:!text-cyan-300"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator style={{ backgroundColor: COLORS.bronze + '33' }} />
                      
                      {isArchived ? (
                        <DropdownMenuItem
                          onClick={() => onRestore(category)}
                          style={{ color: COLORS.lightText }}
                          className="hover:!bg-green-900/20 hover:!text-green-300"
                        >
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          Restore
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onArchive(category)}
                          style={{ color: COLORS.lightText }}
                          className="hover:!bg-yellow-900/20 hover:!text-yellow-300"
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator style={{ backgroundColor: COLORS.bronze + '33' }} />
                      
                      <DropdownMenuItem
                        onClick={() => onDelete(category)}
                        className="hover:!bg-red-900/20 hover:!text-red-300"
                        style={{ color: '#FF6B6B' }}
                        disabled={category.service_count > 0}
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

          {categories.length === 0 && (
            <TableRow>
              <TableCell 
                colSpan={6} 
                className="h-32 text-center"
                style={{ color: COLORS.lightText, opacity: 0.5 }}
              >
                No categories found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}