import React from 'react'
import { Button } from '@/components/ui/button'
import { Archive, ArchiveRestore, Download, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BulkActionsBarProps {
  selectedCount: number
  onArchive: () => void
  onRestore: () => void
  onExport: () => void
  onClear: () => void
  showRestore?: boolean
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

export function BulkActionsBar({
  selectedCount,
  onArchive,
  onRestore,
  onExport,
  onClear,
  showRestore = false
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 p-4',
        'border-t transition-all duration-300 ease-out'
      )}
      style={{
        backgroundColor: COLORS.charcoal,
        borderColor: COLORS.black
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium" style={{ color: COLORS.lightText }}>
            {selectedCount} item{selectedCount === 1 ? '' : 's'} selected
          </span>
          <Button variant="ghost" size="sm" onClick={onClear} className="hover:bg-muted/20">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {showRestore ? (
            <Button
              onClick={onRestore}
              variant="outline"
              className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/20"
            >
              <ArchiveRestore className="h-4 w-4 mr-2" />
              Restore {selectedCount > 1 ? 'All' : ''}
            </Button>
          ) : (
            <Button
              onClick={onArchive}
              variant="outline"
              className="border-red-500/50 text-red-500 hover:bg-red-500/20"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive {selectedCount > 1 ? 'All' : ''}
            </Button>
          )}

          <Button onClick={onExport} variant="outline" className="border-border hover:bg-muted">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </div>
  )
}
