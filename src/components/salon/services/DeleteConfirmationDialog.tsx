'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { AlertTriangle, Trash2, X, CheckCircle } from 'lucide-react'
import { ServiceWithDynamicData } from '@/schemas/service'
import { PrimaryButtonDNA, SecondaryButtonDNA } from '@/lib/dna/components/ui'

interface DeleteConfirmationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  services: ServiceWithDynamicData[]
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
  dangerDark: '#CC5555',
  emerald: '#0F6F5C'
}

export function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  services,
  loading = false
}: DeleteConfirmationDialogProps) {
  const isMultiple = services.length > 1

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
                {isMultiple ? `Delete ${services.length} Services?` : 'Delete Service?'}
              </DialogTitle>
              <DialogDescription style={{ color: COLORS.lightText, opacity: 0.8 }} className="mt-1">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {isMultiple ? (
            <div>
              <p className="text-sm" style={{ color: COLORS.lightText }}>
                You are about to permanently delete the following services:
              </p>
              <div
                className="mt-3 max-h-48 overflow-y-auto rounded-lg p-3 space-y-2"
                style={{
                  backgroundColor: COLORS.black + '40',
                  border: `1px solid ${COLORS.bronze}33`
                }}
              >
                {services.map(service => (
                  <div
                    key={service.id}
                    className="text-sm flex items-center justify-between"
                    style={{ color: COLORS.champagne }}
                  >
                    <span className="font-medium">{service.name}</span>
                    {service.code && <span className="text-xs opacity-60">({service.code})</span>}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm font-medium" style={{ color: COLORS.rose }}>
                ⚠️ This will remove all service history and cannot be recovered.
              </p>
            </div>
          ) : services.length > 0 ? (
            <div>
              <div
                className="rounded-lg p-4"
                style={{
                  backgroundColor: COLORS.black + '40',
                  border: `1px solid ${COLORS.bronze}33`
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                      Service Name
                    </span>
                    <span className="font-medium" style={{ color: COLORS.champagne }}>
                      {services[0].name}
                    </span>
                  </div>
                  {services[0].code && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                        Service Code
                      </span>
                      <span className="text-sm" style={{ color: COLORS.champagne }}>
                        {services[0].code}
                      </span>
                    </div>
                  )}
                  {services[0].category && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: COLORS.lightText, opacity: 0.7 }}>
                        Category
                      </span>
                      <span className="text-sm" style={{ color: COLORS.champagne }}>
                        {services[0].category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-4 text-sm font-medium" style={{ color: COLORS.rose }}>
                ⚠️ This will permanently delete this service and all associated data.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <SecondaryButtonDNA type="button" icon={X} onClick={onClose} disabled={loading}>
            Cancel
          </SecondaryButtonDNA>
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
            {isMultiple ? `Delete ${services.length} Services` : 'Delete Service'}
          </PrimaryButtonDNA>
        </div>
      </DialogContent>
    </Dialog>
  )
}
