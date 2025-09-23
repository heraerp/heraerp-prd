'use client'

import React from 'react'
import { Category } from '@/types/salon-category'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  MoreVertical
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryCardProps {
  category: Category
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
  lightText: '#E0E0E0',
  charcoalLight: '#232323'
}

export function CategoryCard({
  category,
  onEdit,
  onDelete,
  onArchive,
  onRestore
}: CategoryCardProps) {
  const IconComponent = (Icons as any)[category.icon] || Icons.Tag
  const isArchived = category.status === 'archived'

  return (
    <div
      className={cn(
        "relative p-6 rounded-xl transition-all duration-200",
        "hover:shadow-xl hover:scale-[1.02]",
        isArchived && "opacity-60"
      )}
      style={{
        backgroundColor: COLORS.charcoalLight,
        border: `1px solid ${category.color}20`,
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

      {/* Icon and Name */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: category.color + '20',
            border: `1px solid ${category.color}40`
          }}
        >
          <IconComponent className="w-6 h-6" style={{ color: category.color }} />
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
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Category Name */}
      <h3 
        className="font-semibold text-lg mb-2"
        style={{ color: COLORS.champagne }}
      >
        {category.entity_name}
      </h3>

      {/* Description */}
      {category.description && (
        <p 
          className="text-sm mb-4 line-clamp-2"
          style={{ color: COLORS.lightText, opacity: 0.7 }}
        >
          {category.description}
        </p>
      )}

      {/* Service Count */}
      <div
        className="flex items-center justify-between pt-4 border-t"
        style={{ borderColor: COLORS.bronze + '20' }}
      >
        <span className="text-sm" style={{ color: COLORS.lightText, opacity: 0.6 }}>
          Services
        </span>
        <span 
          className="font-semibold"
          style={{ color: category.color }}
        >
          {category.service_count}
        </span>
      </div>

      {/* Code */}
      {category.entity_code && (
        <p 
          className="text-xs mt-2 font-mono"
          style={{ color: COLORS.bronze, opacity: 0.6 }}
        >
          {category.entity_code}
        </p>
      )}
    </div>
  )
}