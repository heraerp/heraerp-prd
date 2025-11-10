'use client'

import { lazy, Suspense } from 'react'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useSalonFinancialSecurity } from '@/hooks/useSalonSecurity'

// Lazy load major sections for instant page load
const FinanceKPIs = lazy(() => import('./components/FinanceKPIs'))
const FinanceTabs = lazy(() => import('./components/FinanceTabs'))
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import { TrendingUp, Bell } from 'lucide-react'

/**
 * 🏦 HERA SALON FINANCE PAGE - ENTERPRISE GRADE
 *
 * ✅ Uses SalonLuxePage wrapper for consistent layout
 * ✅ Uses useUniversalTransactionV1 for real GL data (no demo APIs)
 * ✅ Uses useUniversalEntityV1 for expenses and invoices
 * ✅ Lazy loading for instant page load (<1.5s)
 * ✅ Mobile-first responsive design with iOS-style header
 * ✅ No direct Supabase calls - RPC only through hooks
 * ✅ Enterprise security with role-based access control
 *
 * Smart Code: HERA.SALON.FINANCE.PAGE.v1
 */
export default function SalonFinancePage() {
  const {
    organizationId,
    role,
    user,
    isLoading: authLoading,
    isAuthenticated
  } = useSecuredSalonContext()

  const {
    canViewFinancials,
    canExportFinancial,
    canManagePricing,
    logFinancialAction
  } = useSalonFinancialSecurity()

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (authLoading) {
    return (
      <SalonLuxePage
        title="Financial Management"
        description="Loading financial dashboard..."
        maxWidth="full"
        padding="lg"
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-4 border-gold/30 border-t-gold animate-spin mx-auto mb-4" />
            <p className="text-champagne/80 text-sm">Loading financial data...</p>
          </div>
        </div>
      </SalonLuxePage>
    )
  }

  // ============================================================================
  // ACCESS CONTROL
  // ============================================================================

  if (!canViewFinancials) {
    const AccessDenied = require('@/components/salon/AccessDenied').default
    return (
      <AccessDenied
        title="Financial Access Restricted"
        message="Financial data access is restricted to owners, managers, and accountants. Please contact your manager for access."
        returnPath={role === 'receptionist' ? '/salon/receptionist' : '/salon/dashboard'}
        returnLabel={role === 'receptionist' ? 'Return to My Dashboard' : 'Return to Dashboard'}
      />
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <SalonLuxePage
      title="Financial Management"
      description="Real-time financial reports and VAT compliance"
      maxWidth="full"
      padding="lg"
    >
      {/* Mobile App Header - ENTERPRISE PATTERN */}
      <PremiumMobileHeader
        title="Financial Management"
        subtitle="Real-time financial reports"
        icon={TrendingUp}
        showNotifications={false}
        shrinkOnScroll={true}
      />

      {/* KPI Cards Section - Lazy Loaded */}
      <Suspense fallback={<KPISkeleton />}>
        <FinanceKPIs organizationId={organizationId} />
      </Suspense>

      {/* Finance Tabs Section - Lazy Loaded */}
      <Suspense fallback={<TabsSkeleton />}>
        <FinanceTabs
          organizationId={organizationId}
          canExportFinancial={canExportFinancial}
          logFinancialAction={logFinancialAction}
        />
      </Suspense>

      {/* Role and Permissions Info - Desktop Only */}
      <div className="hidden md:block mt-8 text-sm text-center text-bronze/80">
        Logged in as: {role?.toUpperCase()} • Organization: {organizationId?.substring(0, 8)}...
        <br />
        Access: Financial Reports, VAT Compliance, P&L Statements
      </div>

      {/* Bottom spacing for mobile navigation */}
      <div className="h-24 md:h-0" />
    </SalonLuxePage>
  )
}

// ============================================================================
// LOADING SKELETONS
// ============================================================================

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="h-32 md:h-36 rounded-xl bg-charcoalLight/50 animate-pulse"
          style={{
            background: 'linear-gradient(90deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      ))}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}

function TabsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Tabs skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="h-10 w-32 rounded-lg bg-charcoalLight/50 animate-pulse flex-shrink-0"
          />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="h-96 rounded-xl bg-charcoalLight/50 animate-pulse" />
    </div>
  )
}
