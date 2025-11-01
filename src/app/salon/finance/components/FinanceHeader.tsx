'use client'

import { Bell, Download, Calculator, RefreshCw } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

interface FinanceHeaderProps {
  user: any
  organizationId?: string
  canExportFinancial: boolean
  logFinancialAction: (action: string) => void
}

/**
 * 📱 FINANCE MOBILE HEADER
 *
 * iOS-style mobile header for finance page
 * ✅ Mobile-first responsive (hidden on desktop)
 * ✅ Touch-friendly 44px buttons
 * ✅ Active state feedback (active:scale-95)
 * ✅ Salon Luxe theme colors
 */
export default function FinanceHeader({
  user,
  organizationId,
  canExportFinancial,
  logFinancialAction
}: FinanceHeaderProps) {
  return (
    <>
      {/* Mobile Header - iOS Style */}
      <div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20 mb-4">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base}30 0%, ${SALON_LUXE_COLORS.gold.base}15 100%)`,
                border: `1px solid ${SALON_LUXE_COLORS.gold.base}60`
              }}
            >
              <Calculator className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.gold.base }} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                Financial Management
              </h1>
              <p className="text-xs" style={{ color: SALON_LUXE_COLORS.bronze.base }}>
                {user?.user_metadata?.full_name || 'Accountant'}
              </p>
            </div>
          </div>
          <button
            className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{
              background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base}10 0%, transparent 100%)`
            }}
          >
            <Bell className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.gold.base }} />
          </button>
        </div>
      </div>

      {/* Desktop Header - Enhanced */}
      <div className="hidden md:block mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light mb-2" style={{ color: SALON_LUXE_COLORS.gold.base }}>
              Financial Management
            </h1>
            <p className="text-sm" style={{ color: SALON_LUXE_COLORS.bronze.base }}>
              Comprehensive financial reports and VAT compliance for{' '}
              {user?.user_metadata?.full_name || 'Accountant'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-lg border transition-all hover:scale-105 active:scale-95 min-h-[44px]"
              style={{
                borderColor: SALON_LUXE_COLORS.bronze.base,
                color: SALON_LUXE_COLORS.champagne.base
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2 inline" />
              Refresh
            </button>
            {canExportFinancial && (
              <button
                className="px-4 py-2 rounded-lg border transition-all hover:scale-105 active:scale-95 min-h-[44px]"
                style={{
                  borderColor: SALON_LUXE_COLORS.bronze.base,
                  color: SALON_LUXE_COLORS.champagne.base
                }}
                onClick={() => logFinancialAction('financial_data_exported')}
              >
                <Download className="h-4 w-4 mr-2 inline" />
                Export
              </button>
            )}
            <button
              className="px-4 py-2 rounded-lg border transition-all hover:scale-105 active:scale-95 min-h-[44px]"
              style={{
                borderColor: SALON_LUXE_COLORS.bronze.base,
                color: SALON_LUXE_COLORS.champagne.base
              }}
            >
              <Calculator className="h-4 w-4 mr-2 inline" />
              Calculator
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
