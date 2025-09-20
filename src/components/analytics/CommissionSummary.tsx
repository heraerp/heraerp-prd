// ================================================================================
// HERA COMMISSION SUMMARY
// Smart Code: HERA.UI.ANALYTICS.COMMISSION.v1
// Commission calculation display (preview only)
// ================================================================================

'use client'

import { TrendingUp, User, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CommissionInfo } from '@/lib/schemas/pos'

interface CommissionSummaryProps {
  commission: CommissionInfo
  stylistName?: string
}

export function CommissionSummary({ commission, stylistName }: CommissionSummaryProps) {
  const formatCurrency = (amount: number) => {
    return `${commission.currency} ${amount.toFixed(2)}`
  }

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(0)}%`
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Commission Preview</h3>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
            {formatPercentage(commission.commission_rate)}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Service Total</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(commission.service_subtotal)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Rate</span>
            </div>
            <p className="text-lg font-semibold">{formatPercentage(commission.commission_rate)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span className="text-sm">Commission</span>
            </div>
            <p className="text-lg font-semibold text-purple-700">
              {formatCurrency(commission.commission_amount)}
            </p>
          </div>
        </div>

        {stylistName && (
          <div className="pt-3 border-t border-purple-200">
            <p className="text-sm text-gray-600">
              Stylist: <span className="font-medium text-gray-800">{stylistName}</span>
            </p>
          </div>
        )}

        <div className="bg-purple-100/50 rounded-lg p-3">
          <p className="text-xs text-purple-700">
            <strong>Note:</strong> This is a preview only. Actual commission will be calculated during payroll processing based on your salon's commission structure and policies.
          </p>
        </div>
      </div>
    </Card>
  )
}