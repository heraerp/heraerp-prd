/**
 * HERA DNA Pattern: Salon Luxe Card
 *
 * Reusable card component for salon CRUD pages
 */

import React from 'react'
import { MoreVertical, Edit2, Archive, Trash2, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { LUXE_COLORS } from '@/lib/constants/salon'

interface SalonLuxeCardProps {
  // Core data
  title: string
  subtitle?: string
  description?: string
  code?: string

  // Visual
  icon?: LucideIcon
  colorTag?: string
  status?: string

  // Actions
  onEdit?: () => void
  onArchive?: () => void
  onDelete?: () => void
  canEdit?: boolean
  canDelete?: boolean

  // Additional content
  badges?: Array<{ label: string; value: string | number; color?: string }>
  footer?: React.ReactNode

  // Metadata
  createdAt?: Date | string
  updatedAt?: Date | string
}

export function SalonLuxeCard({
  title,
  subtitle,
  description,
  code,
  icon: Icon,
  colorTag,
  status = 'active',
  onEdit,
  onArchive,
  onDelete,
  canEdit = true,
  canDelete = true,
  badges = [],
  footer,
  createdAt,
  updatedAt
}: SalonLuxeCardProps) {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return `bg-emerald-500/20 text-emerald-400 border border-emerald-500/30`
      case 'inactive':
        return `bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`
      case 'archived':
        return `bg-gray-500/20 text-gray-400 border border-gray-500/30`
      default:
        return `bg-gray-500/20 text-gray-400 border border-gray-500/30`
    }
  }

  const getColorTagStyle = (color?: string) => {
    if (!color) return {}
    return {
      backgroundColor: color + '20',
      borderColor: color + '50'
    }
  }

  return (
    <div
      className="group rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 hover:scale-[1.01] cursor-pointer"
      style={{
        backgroundColor: `${LUXE_COLORS.charcoalLight}F2`,
        border: `1px solid ${LUXE_COLORS.gold}20`
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}40`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `${LUXE_COLORS.gold}20`
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {Icon && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: colorTag ? colorTag + '20' : `${LUXE_COLORS.gold}20`,
                border: `1px solid ${colorTag || LUXE_COLORS.gold}30`
              }}
            >
              <Icon className="h-5 w-5" style={{ color: colorTag || LUXE_COLORS.gold }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate" style={{ color: LUXE_COLORS.champagne }}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm mt-1" style={{ color: LUXE_COLORS.bronze }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {(canEdit || canDelete) && (onEdit || onArchive || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: LUXE_COLORS.bronze }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 luxe-dropdown"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.gold}30`,
                boxShadow: `0 10px 30px ${LUXE_COLORS.black}80`
              }}
            >
              {canEdit && onEdit && (
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="cursor-pointer transition-all duration-200"
                  style={{ color: LUXE_COLORS.lightText }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = `${LUXE_COLORS.gold}20`
                    e.currentTarget.style.color = LUXE_COLORS.gold
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = LUXE_COLORS.lightText
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && onArchive && (
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    onArchive()
                  }}
                  className="cursor-pointer transition-all duration-200"
                  style={{ color: LUXE_COLORS.orange }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = `${LUXE_COLORS.orange}20`
                    e.currentTarget.style.color = LUXE_COLORS.goldDark
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = LUXE_COLORS.orange
                  }}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              {canDelete && onDelete && (
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="cursor-pointer transition-all duration-200"
                  style={{ color: LUXE_COLORS.ruby }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = `${LUXE_COLORS.ruby}20`
                    e.currentTarget.style.color = LUXE_COLORS.ruby
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = LUXE_COLORS.ruby
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {description && (
        <p className="text-sm mb-4 line-clamp-2" style={{ color: LUXE_COLORS.lightText }}>
          {description}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {code && (
          <Badge
            variant="secondary"
            className="font-mono text-xs"
            style={{
              backgroundColor: `${LUXE_COLORS.bronze}20`,
              color: LUXE_COLORS.bronze,
              border: `1px solid ${LUXE_COLORS.bronze}30`
            }}
          >
            {code}
          </Badge>
        )}

        {status && <Badge className={`text-xs ${getStatusBadgeColor(status)}`}>{status}</Badge>}

        {badges.map((badge, index) => (
          <Badge
            key={index}
            variant="outline"
            className="text-xs"
            style={{
              backgroundColor: badge.color ? badge.color + '20' : `${LUXE_COLORS.gold}20`,
              color: badge.color || LUXE_COLORS.gold,
              borderColor: badge.color ? badge.color + '30' : `${LUXE_COLORS.gold}30`
            }}
          >
            {badge.label}: {badge.value}
          </Badge>
        ))}
      </div>

      {footer && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: `${LUXE_COLORS.bronze}20` }}>
          {footer}
        </div>
      )}

      {(createdAt || updatedAt) && (
        <div
          className="mt-4 flex items-center justify-between text-xs"
          style={{ color: LUXE_COLORS.bronze }}
        >
          {createdAt && <span>Created {new Date(createdAt).toLocaleDateString()}</span>}
          {updatedAt && <span>Updated {new Date(updatedAt).toLocaleDateString()}</span>}
        </div>
      )}
    </div>
  )
}
