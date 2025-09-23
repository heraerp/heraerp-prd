'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { Category } from '@/types/salon-category'
import * as Icons from 'lucide-react'
import {
  PrimaryButtonDNA,
  SecondaryButtonDNA
} from '@/lib/dna/components/ui'

interface DeleteCategoryDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  category: Category | null
  loading?: boolean
}

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
  danger: '#FF6B6B',
  dangerDark: '#CC5555'
}

export function DeleteCategoryDialog({
  open,
  onClose,
  onConfirm,
  category,
  loading = false
}: DeleteCategoryDialogProps) {
  if (!category) return null

  const IconComponent = (Icons as any)[category.icon] || Icons.Tag
  const hasServices = category.service_count > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        style={{ backgroundColor: COLORS.charcoal, color: COLORS.lightText }}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: COLORS.danger + '20',
                border: `2px solid ${COLORS.danger}40`
              }}
            >
              <AlertTriangle className="w-6 h-6" style={{ color: COLORS.danger }} />
            </div>
            <div className="flex-1">
              <DialogTitle style={{ color: COLORS.champagne }} className="text-xl">
                {hasServices ? 'Cannot Delete Category' : 'Delete Category?'}
              </DialogTitle>
              <DialogDescription style={{ color: COLORS.lightText, opacity: 0.8 }} className="mt-1">
                {hasServices 
                  ? 'This category has linked services'
                  : 'This action cannot be undone'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {hasServices ? (
            <div>
              <div
                className="rounded-lg p-4"
                style={{
                  backgroundColor: COLORS.danger + '10',
                  border: `1px solid ${COLORS.danger}30`
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: category.color + '20',
                      border: `1px solid ${category.color}40`
                    }}
                  >
                    <IconComponent className="w-5 h-5" style={{ color: category.color }} />
                  </div>
                  <div>
                    <h4 className="font-medium" style={{ color: COLORS.champagne }}>
                      {category.entity_name}
                    </h4>
                    <p className="text-sm" style={{ color: COLORS.danger }}>
                      {category.service_count} active service{category.service_count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm" style={{ color: COLORS.lightText }}>
                You must reassign or remove all services from this category before deleting it.
              </p>
              <ul className="mt-3 space-y-1 text-sm" style={{ color: COLORS.bronze }}>
                <li>• Move services to another category</li>
                <li>• Archive the services</li>
                <li>• Or archive this category instead</li>
              </ul>
            </div>
          ) : (
            <div>
              <div
                className="rounded-lg p-4"
                style={{
                  backgroundColor: COLORS.black + '40',
                  border: `1px solid ${COLORS.bronze}33`
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: category.color + '20',
                      border: `1px solid ${category.color}40`
                    }}
                  >
                    <IconComponent className="w-5 h-5" style={{ color: category.color }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium" style={{ color: COLORS.champagne }}>
                      {category.entity_name}
                    </h4>
                    {category.entity_code && (
                      <p className="text-xs font-mono opacity-60">
                        {category.entity_code}
                      </p>
                    )}
                  </div>
                </div>
                {category.description && (
                  <p className="mt-3 text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                    {category.description}
                  </p>
                )}
              </div>
              <p
                className="mt-4 text-sm font-medium"
                style={{ color: COLORS.rose }}
              >
                ⚠️ This will permanently delete this category.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <SecondaryButtonDNA
            type="button"
            icon={X}
            onClick={onClose}
            disabled={loading}
          >
            {hasServices ? 'Close' : 'Cancel'}
          </SecondaryButtonDNA>
          {!hasServices && (
            <PrimaryButtonDNA
              type="button"
              icon={Trash2}
              onClick={onConfirm}
              loading={loading}
              loadingText="Deleting..."
              className="min-w-[120px]"
              style={{
                background: `linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%)`,
                color: 'white',
                fontWeight: '600'
              }}
            >
              Delete Category
            </PrimaryButtonDNA>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}