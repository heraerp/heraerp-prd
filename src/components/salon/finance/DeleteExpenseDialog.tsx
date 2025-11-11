'use client'

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Trash2, AlertTriangle, Archive, DollarSign } from 'lucide-react'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

interface DeleteExpenseDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  expense: any | null
  loading?: boolean
}

export function DeleteExpenseDialog({
  open,
  onClose,
  onConfirm,
  expense,
  loading = false
}: DeleteExpenseDialogProps) {
  if (!expense) return null

  // Check if expense is posted to Finance DNA v2 GL
  const isPostedToFinance = expense.metadata?.awaiting_finance_posting === false ||
    expense.metadata?.finance_dna_version === 'v2.0' ||
    expense.transaction_status === 'posted'

  // Check payment status
  const isPaid = expense.status === 'paid' || expense.metadata?.payment_status === 'paid'

  const isPosted = isPostedToFinance || isPaid
  const amount = expense.total_amount || 0
  const vendor = expense.vendor_name || expense.entity_name || 'Unknown'
  const date = expense.transaction_date
    ? new Date(expense.transaction_date).toLocaleDateString('en-GB')
    : ''

  // Determine deletion reason
  const deletionReason = isPaid
    ? 'Payment already processed in GL'
    : isPostedToFinance
    ? 'Posted to Finance DNA v2 GL'
    : null

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent
        style={{
          backgroundColor: COLORS.charcoal,
          border: `1px solid ${COLORS.bronze}40`,
          boxShadow: '0 20px 30px rgba(0,0,0,0.3)'
        }}
      >
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: isPosted ? `${COLORS.gold}20` : '#FF6B6B20',
                border: `1px solid ${isPosted ? `${COLORS.gold}40` : '#FF6B6B40'}`
              }}
            >
              {isPosted ? (
                <Archive className="w-6 h-6" style={{ color: COLORS.gold }} />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div>
              <AlertDialogTitle
                className="text-xl font-semibold"
                style={{ color: COLORS.champagne }}
              >
                {isPosted ? '🏆 Financial Excellence Protected' : 'Delete Expense'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm mt-1" style={{ color: COLORS.lightText }}>
                {isPosted
                  ? 'Preserving audit integrity'
                  : 'This action cannot be undone'}
              </AlertDialogDescription>
            </div>
          </div>

          <div className="space-y-4" style={{ color: COLORS.lightText }}>
            {/* Expense Details Card */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.charcoalLight + '50',
                borderColor: COLORS.bronze + '20'
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: COLORS.gold + '20',
                    border: `1px solid ${COLORS.gold}40`
                  }}
                >
                  <DollarSign className="w-4 h-4" style={{ color: COLORS.gold }} />
                </div>
                <div>
                  <p className="font-medium" style={{ color: COLORS.champagne }}>
                    {vendor}
                  </p>
                  {date && (
                    <p className="text-sm" style={{ color: COLORS.lightText }}>
                      {date}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs" style={{ color: COLORS.lightText }}>
                    Amount
                  </p>
                  <p className="font-semibold mt-1" style={{ color: COLORS.gold }}>
                    AED {amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: COLORS.lightText }}>
                    Status
                  </p>
                  <p className="font-semibold mt-1" style={{ color: COLORS.champagne }}>
                    {expense.transaction_status?.toUpperCase() || 'DRAFT'}
                  </p>
                </div>
              </div>
            </div>

            {isPosted ? (
              /* Posted Transaction - Archive Instead */
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: COLORS.gold + '10',
                  borderColor: COLORS.gold + '30'
                }}
              >
                <div className="flex items-start gap-3">
                  <Archive className="w-5 h-5 mt-0.5" style={{ color: COLORS.gold }} />
                  <div>
                    <p className="font-medium mb-2" style={{ color: COLORS.gold }}>
                      🏆 Finance DNA v2 Integrity Protected
                    </p>
                    <p className="text-sm mb-3" style={{ color: COLORS.lightText }}>
                      {deletionReason}. This expense has been posted to your general ledger
                      and preserved for audit excellence.
                    </p>
                    <p className="text-sm" style={{ color: COLORS.lightText }}>
                      We'll gracefully <strong>cancel it</strong> instead of deletion to
                      maintain your financial records' integrity and audit trail.
                    </p>
                    {isPaid && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.gold + '20' }}>
                        <p className="text-xs" style={{ color: COLORS.bronze }}>
                          ✅ Payment transaction already recorded in GL
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Draft Transaction - Permanent Deletion Warning */
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: '#FF6B6B10',
                  borderColor: '#FF6B6B30'
                }}
              >
                <div className="flex items-start gap-3">
                  <Trash2 className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-400 mb-2">
                      Warning: Permanent Deletion
                    </p>
                    <ul className="text-sm space-y-1" style={{ color: COLORS.lightText }}>
                      <li>• Expense record will be permanently removed</li>
                      <li>• This action cannot be undone</li>
                      <li>• All associated data will be lost</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel
            onClick={onClose}
            disabled={loading}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={
              isPosted
                ? 'bg-gold hover:bg-goldDark text-black border-none'
                : 'bg-red-600 hover:bg-red-700 text-white border-none'
            }
            style={
              isPosted
                ? {
                    backgroundColor: COLORS.gold,
                    color: COLORS.black
                  }
                : undefined
            }
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : isPosted ? (
              '✨ Cancel Expense'
            ) : (
              'Delete Expense'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
