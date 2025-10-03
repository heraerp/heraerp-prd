/**
 * HERA DNA SECURITY: Secured Financial Content Components
 * Demo DNA Component: HERA.DNA.SECURITY.SALON.FINANCIAL.DEMO.v1
 *
 * Demonstrates the power of HERA DNA Security framework with real-world examples
 * of how to protect sensitive financial data using permission-based UI patterns.
 *
 * Key DNA Features:
 * - Permission-based component rendering with HOC pattern
 * - Financial data masking for unauthorized roles
 * - Graceful access denied messaging with role-specific instructions
 * - Audit logging for all financial data access attempts
 * - Luxury salon theming with security-first design
 */

'use client'

import React from 'react'
import { withSalonPermissions, SALON_PERMISSIONS } from '@/hooks/useSalonSecurity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { DollarSign, Receipt, TrendingUp, FileText, Download, AlertTriangle } from 'lucide-react'

// Protected financial summary component
const FinancialSummaryComponent: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card
        className="border-0"
        style={{
          backgroundColor: LUXE_COLORS.charcoalLight,
          borderColor: `${LUXE_COLORS.bronze}30`
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                Monthly Revenue
              </p>
              <p className="text-2xl font-light mt-1" style={{ color: LUXE_COLORS.gold }}>
                AED 125,000
              </p>
              <p className="text-xs mt-1" style={{ color: LUXE_COLORS.emerald }}>
                +12% from last month
              </p>
            </div>
            <DollarSign className="h-8 w-8 opacity-50" style={{ color: LUXE_COLORS.gold }} />
          </div>
        </CardContent>
      </Card>

      <Card
        className="border-0"
        style={{
          backgroundColor: LUXE_COLORS.charcoalLight,
          borderColor: `${LUXE_COLORS.bronze}30`
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                Total Expenses
              </p>
              <p className="text-2xl font-light mt-1" style={{ color: LUXE_COLORS.champagne }}>
                AED 75,000
              </p>
              <p className="text-xs mt-1" style={{ color: LUXE_COLORS.ruby }}>
                -5% from last month
              </p>
            </div>
            <Receipt className="h-8 w-8 opacity-50" style={{ color: LUXE_COLORS.ruby }} />
          </div>
        </CardContent>
      </Card>

      <Card
        className="border-0"
        style={{
          backgroundColor: LUXE_COLORS.charcoalLight,
          borderColor: `${LUXE_COLORS.bronze}30`
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                Net Profit
              </p>
              <p className="text-2xl font-light mt-1" style={{ color: LUXE_COLORS.emerald }}>
                AED 50,000
              </p>
              <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                40% margin
              </p>
            </div>
            <TrendingUp className="h-8 w-8 opacity-50" style={{ color: LUXE_COLORS.emerald }} />
          </div>
        </CardContent>
      </Card>

      <Card
        className="border-0"
        style={{
          backgroundColor: LUXE_COLORS.charcoalLight,
          borderColor: `${LUXE_COLORS.bronze}30`
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                VAT Collected
              </p>
              <p className="text-2xl font-light mt-1" style={{ color: LUXE_COLORS.plum }}>
                AED 6,250
              </p>
            </div>
            <FileText className="h-8 w-8 opacity-50" style={{ color: LUXE_COLORS.plum }} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Fallback component for users without financial permissions
const FinancialAccessDenied: React.FC = () => {
  return (
    <Card
      className="border-0"
      style={{
        backgroundColor: LUXE_COLORS.charcoalLight,
        borderColor: `${LUXE_COLORS.bronze}30`
      }}
    >
      <CardContent className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" style={{ color: LUXE_COLORS.ruby }} />
        <h3 className="text-xl mb-2" style={{ color: LUXE_COLORS.gold }}>
          Financial Data Restricted
        </h3>
        <p style={{ color: LUXE_COLORS.bronze }}>
          You need financial permissions to view revenue and expense data.
        </p>
      </CardContent>
    </Card>
  )
}

// Protected export functionality
const FinancialExportComponent: React.FC = () => {
  const handleExport = () => {
    // Implement actual export logic here
    console.log('Exporting financial data...')
  }

  return (
    <Card
      className="border-0"
      style={{
        backgroundColor: LUXE_COLORS.charcoalLight,
        borderColor: `${LUXE_COLORS.bronze}30`
      }}
    >
      <CardHeader>
        <CardTitle style={{ color: LUXE_COLORS.gold }}>Export Financial Data</CardTitle>
        <CardDescription style={{ color: LUXE_COLORS.bronze }}>
          Download comprehensive financial reports and statements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button
            onClick={handleExport}
            className="w-full"
            style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.charcoal }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export P&L Statement
          </Button>
          <Button
            onClick={handleExport}
            className="w-full"
            variant="outline"
            style={{ borderColor: LUXE_COLORS.bronze, color: LUXE_COLORS.bronze }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export VAT Report
          </Button>
          <Button
            onClick={handleExport}
            className="w-full"
            variant="outline"
            style={{ borderColor: LUXE_COLORS.bronze, color: LUXE_COLORS.bronze }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Cash Flow
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Apply permission-based protection using HOC
export const SecuredFinancialSummary = withSalonPermissions(
  [SALON_PERMISSIONS.FINANCE.VIEW_REVENUE, SALON_PERMISSIONS.FINANCE.VIEW_EXPENSES],
  FinancialAccessDenied
)(FinancialSummaryComponent)

export const SecuredFinancialExport = withSalonPermissions([
  SALON_PERMISSIONS.FINANCE.EXPORT_FINANCIAL
])(FinancialExportComponent)

// Demo component showing how to use multiple permission levels
export const FinancialPermissionsDemo: React.FC = () => {
  return (
    <div className="space-y-6">
      <SecuredFinancialSummary />
      <SecuredFinancialExport />
    </div>
  )
}
