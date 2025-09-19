'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Archive, ArchiveRestore, Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div
          className="flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.bronze}33`
          }}
        >
          <span style={{ color: COLORS.champagne }} className="font-medium">
            {selectedCount} selected
          </span>

          <div className="h-6 w-px bg-border" />

          {showRestore ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRestore}
              className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
            >
              <ArchiveRestore className="w-4 h-4 mr-1" />
              Restore
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={onArchive}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <Archive className="w-4 h-4 mr-1" />
              Archive
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onExport}
            className="hover:bg-muted"
            style={{ color: COLORS.lightText }}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button size="sm" variant="ghost" onClick={onClear} className="hover:bg-muted">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
