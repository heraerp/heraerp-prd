// ================================================================================
// SALE DETAILS DIALOG
// Smart Code: HERA.SALON.POS.DIALOG.SALE.DETAILS.V1
// Shows complete transaction details with line items using RPC API v2
// ================================================================================

'use client'

import { useEffect, useState } from 'react'
import { useUniversalTransaction } from '@/hooks/useUniversalTransaction'
import { getTransactions, getEntities } from '@/lib/universal-api-v2-client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Receipt,
  User,
  Calendar,
  DollarSign,
  CreditCard,
  Package,
  Scissors,
  X,
  Loader2,
  Users,
  Clock,
  Phone,
  Mail,
  Building2
} from 'lucide-react'
import { format } from 'date-fns'

interface SaleDetailsDialogProps {
  open: boolean
  onClose: () => void
  saleId: string
  organizationId: string
}

// Luxury salon color palette (matching payments page)
const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4'
}

export function SaleDetailsDialog({
  open,
  onClose,
  saleId,
  organizationId
}: SaleDetailsDialogProps) {
  const [transaction, setTransaction] = useState<any>(null)
  const [lines, setLines] = useState<any[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [staff, setStaff] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch transaction details when dialog opens
  useEffect(() => {
    async function fetchTransactionDetails() {
      if (!open || !saleId || !organizationId) return

      setIsLoading(true)
      try {
        // Fetch the transaction using RPC API v2
        const response = await fetch(
          `/api/v2/transactions/${saleId}?organization_id=${organizationId}`,
          {
            headers: {
              'x-hera-api-version': 'v2'
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch transaction details')
        }

        const data = await response.json()
        console.log('[SaleDetailsDialog] Fetched transaction:', data)

        setTransaction(data.transaction || data)
        setLines(data.lines || [])

        // ✅ Fetch customer entity if exists
        if (data.transaction?.source_entity_id) {
          try {
            const customerData = await getEntities('', {
              p_organization_id: organizationId,
              p_entity_type: 'CUSTOMER',
              p_include_dynamic: false,
              p_include_relationships: false
            })
            const foundCustomer = customerData.find(
              (c: any) => c.id === data.transaction.source_entity_id
            )
            setCustomer(foundCustomer || null)
          } catch (err) {
            console.error('[SaleDetailsDialog] Error fetching customer:', err)
          }
        }

        // ✅ Fetch staff entity if exists
        if (data.transaction?.target_entity_id) {
          try {
            const staffData = await getEntities('', {
              p_organization_id: organizationId,
              p_entity_type: 'STAFF',
              p_include_dynamic: false,
              p_include_relationships: false
            })
            const foundStaff = staffData.find(
              (s: any) => s.id === data.transaction.target_entity_id
            )
            setStaff(foundStaff || null)
          } catch (err) {
            console.error('[SaleDetailsDialog] Error fetching staff:', err)
          }
        }
      } catch (error) {
        console.error('[SaleDetailsDialog] Error fetching transaction:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactionDetails()
  }, [open, saleId, organizationId])

  if (!open) return null

  const metadata = transaction?.metadata || {}

  // ✅ Calculate amounts from transaction lines (enterprise-grade accuracy)
  const serviceLines = lines.filter((l: any) => l.line_type === 'service' || l.line_type === 'product')
  const taxLines = lines.filter((l: any) => l.line_type === 'tax')
  const discountLines = lines.filter((l: any) => l.line_type === 'discount')
  const paymentLines = lines.filter((l: any) => l.line_type === 'payment')

  const subtotal = serviceLines.reduce((sum: number, line: any) => sum + (line.line_amount || 0), 0)
  const taxAmount = taxLines.reduce((sum: number, line: any) => sum + (line.line_amount || 0), 0)
  const discountAmount = Math.abs(discountLines.reduce((sum: number, line: any) => sum + (line.line_amount || 0), 0))
  const tipAmount = metadata.tip_amount || 0
  const totalAmount = transaction?.total_amount || 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: LUXE_COLORS.black,
          border: `1px solid ${LUXE_COLORS.gold}40`,
          boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.2)',
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 20% 30%, ${LUXE_COLORS.gold}08 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 80% 70%, ${LUXE_COLORS.plum}06 0%, transparent 50%)
          `
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle
                className="text-2xl font-bold"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Sale Details
              </DialogTitle>
              <DialogDescription style={{ color: LUXE_COLORS.bronze }}>
                Complete transaction information
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              style={{ color: LUXE_COLORS.bronze }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
          </div>
        ) : !transaction ? (
          <div className="text-center py-12" style={{ color: LUXE_COLORS.bronze }}>
            Transaction not found
          </div>
        ) : (
          <div className="space-y-6">
            {/* Transaction Header */}
            <div
              className="rounded-xl p-6"
              style={{
                background: `linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.08) 100%)`,
                border: `1px solid ${LUXE_COLORS.gold}30`,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 16px rgba(212,175,55,0.1)'
              }}
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: LUXE_COLORS.bronze }}
                    >
                      Transaction Code
                    </span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: LUXE_COLORS.champagne }}>
                    {transaction.transaction_code}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: LUXE_COLORS.bronze }}
                    >
                      Date & Time
                    </span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: LUXE_COLORS.champagne }}>
                    {format(new Date(transaction.transaction_date), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: LUXE_COLORS.bronze }}
                    >
                      Customer
                    </span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: LUXE_COLORS.champagne }}>
                    {customer?.entity_name || 'Walk-in Customer'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" style={{ color: LUXE_COLORS.plum }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: LUXE_COLORS.bronze }}
                    >
                      Staff Member
                    </span>
                  </div>
                  <p className="text-lg font-bold" style={{ color: LUXE_COLORS.plum }}>
                    {staff?.entity_name || 'Unassigned'}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: LUXE_COLORS.bronze }}
                    >
                      Total Amount
                    </span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: LUXE_COLORS.gold }}>
                    AED {totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Line Items - Only show services and products */}
            <div>
              <h3
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: LUXE_COLORS.champagne }}
              >
                <Package className="w-5 h-5" />
                Services & Products
              </h3>
              <div className="space-y-2">
                {serviceLines.length === 0 ? (
                  <p className="text-center py-4" style={{ color: LUXE_COLORS.bronze }}>
                    No items found
                  </p>
                ) : (
                  serviceLines.map((line: any, index: number) => (
                    <div
                      key={line.id || index}
                      className="rounded-lg p-4 transition-all duration-300 hover:transform hover:translateX(4px)"
                      style={{
                        background: `linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)`,
                        border: `1px solid ${LUXE_COLORS.gold}20`,
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {line.line_type === 'service' ? (
                            <Scissors
                              className="w-5 h-5"
                              style={{ color: LUXE_COLORS.plum }}
                            />
                          ) : (
                            <Package
                              className="w-5 h-5"
                              style={{ color: LUXE_COLORS.emerald }}
                            />
                          )}
                          <div>
                            <p
                              className="font-medium"
                              style={{ color: LUXE_COLORS.champagne }}
                            >
                              {line.description || `${line.line_type} item`}
                            </p>
                            <Badge
                              style={{
                                background: `${LUXE_COLORS.gold}20`,
                                color: LUXE_COLORS.gold,
                                fontSize: '0.75rem'
                              }}
                            >
                              {line.line_type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className="text-sm"
                            style={{ color: LUXE_COLORS.bronze }}
                          >
                            {line.quantity} × AED {(line.unit_amount || 0).toFixed(2)}
                          </p>
                          <p
                            className="text-lg font-bold"
                            style={{ color: LUXE_COLORS.gold }}
                          >
                            AED {(line.line_amount || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment Summary */}
            <div
              className="rounded-xl p-6"
              style={{
                background: `linear-gradient(135deg, rgba(15,111,92,0.15) 0%, rgba(15,111,92,0.08) 100%)`,
                border: `1px solid ${LUXE_COLORS.emerald}30`,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 16px rgba(15,111,92,0.1)'
              }}
            >
              <h3
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{ color: LUXE_COLORS.champagne }}
              >
                <CreditCard className="w-5 h-5" />
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ color: LUXE_COLORS.bronze }}>Subtotal</span>
                  <span style={{ color: LUXE_COLORS.champagne }}>
                    AED {subtotal.toFixed(2)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: LUXE_COLORS.bronze }}>Discount</span>
                    <span style={{ color: LUXE_COLORS.champagne }}>
                      -AED {discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: LUXE_COLORS.bronze }}>Tax (5%)</span>
                    <span style={{ color: LUXE_COLORS.champagne }}>
                      AED {taxAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                {tipAmount > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: LUXE_COLORS.bronze }}>Tip</span>
                    <span style={{ color: LUXE_COLORS.champagne }}>
                      AED {tipAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div
                  className="flex justify-between pt-3 border-t"
                  style={{ borderColor: `${LUXE_COLORS.gold}20` }}
                >
                  <span
                    className="text-lg font-bold"
                    style={{ color: LUXE_COLORS.champagne }}
                  >
                    Total
                  </span>
                  <span className="text-2xl font-bold" style={{ color: LUXE_COLORS.gold }}>
                    AED {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Methods - From Transaction Lines */}
              {paymentLines.length > 0 && (
                <div className="mt-6 pt-6 border-t" style={{ borderColor: `${LUXE_COLORS.gold}20` }}>
                  <h4
                    className="text-sm font-medium mb-3"
                    style={{ color: LUXE_COLORS.bronze }}
                  >
                    Payment Methods
                  </h4>
                  <div className="space-y-2">
                    {paymentLines.map((line: any, index: number) => {
                      const methodName = line.metadata?.payment_method ||
                                        line.description?.replace('Payment - ', '') ||
                                        'cash'
                      return (
                        <div key={index} className="flex justify-between items-center">
                          <Badge
                            style={{
                              background: `${LUXE_COLORS.emerald}20`,
                              color: LUXE_COLORS.emerald,
                              textTransform: 'uppercase',
                              fontWeight: '600'
                            }}
                          >
                            {methodName}
                          </Badge>
                          <span
                            className="text-lg font-bold"
                            style={{ color: LUXE_COLORS.emerald }}
                          >
                            AED {(line.line_amount || 0).toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {metadata.notes && (
              <div
                className="rounded-xl p-6"
                style={{
                  background: `linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.04) 100%)`,
                  border: `1px solid ${LUXE_COLORS.gold}20`,
                  backdropFilter: 'blur(4px)'
                }}
              >
                <h3
                  className="text-sm font-medium mb-2"
                  style={{ color: LUXE_COLORS.bronze }}
                >
                  Notes
                </h3>
                <p style={{ color: LUXE_COLORS.champagne }}>{metadata.notes}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
