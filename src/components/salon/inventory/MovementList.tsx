'use client'

import React from 'react'
import { Movement } from '@/schemas/inventory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { format, formatDistanceToNow } from 'date-fns'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  SettingsIcon,
  MoreVertical,
  Eye,
  FileText,
  TruckIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MovementListProps {
  movements: Movement[]
  loading?: boolean
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

const typeConfig = {
  RECEIPT: {
    icon: ArrowDownIcon,
    color: '#10B981', // Green
    label: 'Receipt',
    bgColor: '#10B981'
  },
  ISSUE: {
    icon: ArrowUpIcon,
    color: '#EF4444', // Red
    label: 'Issue',
    bgColor: '#EF4444'
  },
  TRANSFER: {
    icon: ArrowRightIcon,
    color: '#3B82F6', // Blue
    label: 'Transfer',
    bgColor: '#3B82F6'
  },
  ADJUST: {
    icon: SettingsIcon,
    color: '#F59E0B', // Amber
    label: 'Adjustment',
    bgColor: '#F59E0B'
  }
}

export function MovementList({ movements, loading }: MovementListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount))
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-lg" />
        ))}
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <div className="text-center py-20">
        <TruckIcon className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.bronze }} />
        <h3 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
          No movements yet
        </h3>
        <p style={{ color: COLORS.lightText, opacity: 0.7 }}>
          Create your first movement to start tracking inventory changes
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {movements.map(movement => {
        const type = movement.metadata?.type || 'RECEIPT'
        const config = typeConfig[type as keyof typeof typeConfig]
        const Icon = config.icon
        const totalQty = movement.lines?.reduce((sum, line) => sum + Math.abs(line.qty), 0) || 0

        return (
          <div
            key={movement.id}
            className="p-4 rounded-lg border transition-all hover:shadow-md"
            style={{
              backgroundColor: COLORS.charcoal,
              borderColor: COLORS.bronze + '33'
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Type Icon */}
                <div className="p-3 rounded-lg" style={{ backgroundColor: config.bgColor + '20' }}>
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                </div>

                {/* Movement Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium" style={{ color: COLORS.champagne }}>
                      {config.label}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {movement.transaction_code}
                    </Badge>
                    {movement.metadata?.reference && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: COLORS.bronze + '50', color: COLORS.lightText }}
                      >
                        {movement.metadata.reference}
                      </Badge>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-4 text-sm"
                    style={{ color: COLORS.lightText }}
                  >
                    <span>{format(new Date(movement.when_ts), 'MMM dd, yyyy HH:mm')}</span>
                    {type === 'TRANSFER' && movement.from_entity_id && movement.to_entity_id && (
                      <>
                        <span>•</span>
                        <span>From: Branch {movement.from_entity_id.split('-').pop()}</span>
                        <span>→</span>
                        <span>To: Branch {movement.to_entity_id.split('-').pop()}</span>
                      </>
                    )}
                  </div>

                  {/* Movement Summary */}
                  <div className="flex items-center gap-6 mt-2">
                    <div>
                      <span
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.bronze }}
                      >
                        Items
                      </span>
                      <p className="font-medium" style={{ color: COLORS.lightText }}>
                        {movement.lines?.length || 0}
                      </p>
                    </div>
                    <div>
                      <span
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.bronze }}
                      >
                        Total Qty
                      </span>
                      <p className="font-medium" style={{ color: COLORS.lightText }}>
                        {totalQty}
                      </p>
                    </div>
                    <div>
                      <span
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.bronze }}
                      >
                        Value
                      </span>
                      <p className="font-medium" style={{ color: COLORS.champagne }}>
                        {formatCurrency(movement.total_amount)}
                      </p>
                    </div>
                    <div>
                      <span
                        className="text-xs uppercase tracking-wider"
                        style={{ color: COLORS.bronze }}
                      >
                        Status
                      </span>
                      <Badge
                        className={cn(
                          'mt-1',
                          movement.status === 'posted'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                            : 'bg-muted/20 text-muted-foreground border-muted-foreground/50'
                        )}
                      >
                        {movement.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    View Journal Entry
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Line Items Preview */}
            {movement.lines && movement.lines.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.bronze + '20' }}>
                <div className="flex flex-wrap gap-2">
                  {movement.lines.slice(0, 3).map((line, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-muted/30">
                      {line.metadata?.item_name || `Item ${line.entity_id}`} × {Math.abs(line.qty)}
                    </Badge>
                  ))}
                  {movement.lines.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-muted/30">
                      +{movement.lines.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Posted By */}
            {movement.metadata?.posted_by && (
              <div
                className="mt-3 flex items-center justify-between text-xs"
                style={{ color: COLORS.lightText, opacity: 0.7 }}
              >
                <span>Posted by {movement.metadata.posted_by}</span>
                <span>
                  {formatDistanceToNow(new Date(movement.created_at), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
