// ================================================================================
// REPORTS METADATA HOOK
// Smart Code: HERA.HOOK.REPORTS.METADATA.v1
// Manages report cards, categories, and role-based filtering
// ================================================================================

'use client'

import { useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Package,
  FileText
} from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'

// ============================================================================
// TYPES
// ============================================================================

export interface ReportCard {
  id: string
  title: string
  description: string
  icon: any
  href?: string
  color: string
  category: 'financial' | 'operational' | 'analytics'
  requiredRoles: string[]
  featured?: boolean
}

export type ReportCategory = 'all' | 'financial' | 'operational' | 'analytics'

// ============================================================================
// REPORT CARDS CONFIGURATION
// ============================================================================

const REPORT_CARDS: ReportCard[] = [
  {
    id: 'daily-sales',
    title: 'Daily Sales Report',
    description: 'Hourly revenue breakdown with real-time GL tracking',
    icon: Calendar,
    href: '/salon/reports/sales/daily',
    color: LUXE_COLORS.emerald,
    category: 'financial',
    requiredRoles: ['ORG_OWNER', 'OWNER', 'USER'], // Added USER role
    featured: true
  },
  {
    id: 'monthly-sales',
    title: 'Monthly Sales Report',
    description: 'Daily trends and growth analysis from GL data',
    icon: BarChart3,
    href: '/salon/reports/sales/monthly',
    color: LUXE_COLORS.gold,
    category: 'financial',
    requiredRoles: ['ORG_OWNER', 'OWNER', 'USER'], // Added USER role
    featured: true
  },
  {
    id: 'revenue',
    title: 'Revenue Report',
    description: 'Track sales, services, and product revenue by period',
    icon: TrendingUp,
    href: '/salon/finance#revenue',
    color: LUXE_COLORS.emerald,
    category: 'financial',
    requiredRoles: ['ORG_OWNER', 'OWNER', 'USER']
  },
  {
    id: 'pnl',
    title: 'Profit & Loss',
    description: 'Complete P&L statement with expense breakdowns',
    icon: BarChart3,
    href: '/salon/finance#pnl',
    color: LUXE_COLORS.gold,
    category: 'financial',
    requiredRoles: ['ORG_OWNER', 'OWNER', 'USER']
  },
  {
    id: 'branch-pnl',
    title: 'Branch P&L',
    description: 'Compare financial performance across branches',
    icon: BarChart3,
    href: '/salon/reports/branch-pnl',
    color: LUXE_COLORS.bronze,
    category: 'financial',
    requiredRoles: ['ORG_OWNER', 'OWNER', 'USER']
  },
  {
    id: 'customer-analytics',
    title: 'Customer Analytics',
    description: 'Customer retention, frequency, and spending patterns',
    icon: Users,
    href: '#',
    color: LUXE_COLORS.champagne,
    category: 'analytics',
    requiredRoles: ['ORG_OWNER', 'OWNER', 'USER']
  },
  {
    id: 'staff-performance',
    title: 'Staff Performance',
    description: 'Employee productivity, services, and commission reports',
    icon: Users,
    href: '#',
    color: LUXE_COLORS.emerald,
    category: 'operational',
    requiredRoles: ['ORG_OWNER', 'OWNER', 'USER']
  },
  {
    id: 'appointment-analytics',
    title: 'Appointment Analytics',
    description: 'Booking patterns, no-shows, and capacity utilization',
    icon: Calendar,
    href: '#',
    color: LUXE_COLORS.gold,
    category: 'operational',
    requiredRoles: ['ORG_OWNER', 'OWNER', 'USER']
  },
  {
    id: 'inventory',
    title: 'Inventory Report',
    description: 'Stock levels, usage patterns, and reorder suggestions',
    icon: Package,
    href: '#',
    color: LUXE_COLORS.bronze,
    category: 'operational',
    requiredRoles: ['ORG_OWNER', 'OWNER', 'USER']
  },
  {
    id: 'service-analytics',
    title: 'Service Analytics',
    description: 'Popular services, pricing analysis, and trends',
    icon: FileText,
    href: '#',
    color: LUXE_COLORS.champagne,
    category: 'analytics',
    requiredRoles: ['ORG_OWNER', 'OWNER', 'USER']
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow',
    description: 'Daily cash positions and payment method breakdowns',
    icon: DollarSign,
    href: '/salon/finance#cashflow',
    color: LUXE_COLORS.emerald,
    category: 'financial',
    requiredRoles: ['ORG_OWNER', 'OWNER', 'USER']
  }
]

// ============================================================================
// HOOK: useReportsMetadata
// ============================================================================

export interface UseReportsMetadataOptions {
  /** User role for permission filtering */
  userRole?: string
  /** Filter by category */
  selectedCategory?: ReportCategory
}

export interface UseReportsMetadataReturn {
  /** All available reports for the user */
  availableReports: ReportCard[]
  /** Featured reports (prominently displayed) */
  featuredReports: ReportCard[]
  /** Regular reports (non-featured) */
  regularReports: ReportCard[]
  /** Filtered reports based on selected category */
  filteredReports: ReportCard[]
  /** Available categories */
  categories: ReportCategory[]
  /** Total count of available reports */
  totalCount: number
  /** Count by category */
  countByCategory: Record<ReportCategory, number>
}

/**
 * Manages report metadata, categories, and role-based filtering
 *
 * Features:
 * - Role-based permission filtering
 * - Category-based filtering
 * - Featured vs regular report separation
 * - Memoized for performance
 *
 * @example
 * const {
 *   availableReports,
 *   featuredReports,
 *   filteredReports
 * } = useReportsMetadata({
 *   userRole: 'ORG_OWNER',
 *   selectedCategory: 'financial'
 * })
 */
export function useReportsMetadata(
  options: UseReportsMetadataOptions = {}
): UseReportsMetadataReturn {
  const { userRole, selectedCategory = 'all' } = options

  // Memoize report filtering
  const result = useMemo(() => {
    // Step 1: Filter by role permissions
    const roleFilteredReports = userRole
      ? REPORT_CARDS.filter(report => {
          const normalizedRole = userRole.toUpperCase()
          return report.requiredRoles.some(r => r === normalizedRole)
        })
      : REPORT_CARDS

    // Step 2: Filter by selected category
    const categoryFiltered =
      selectedCategory === 'all'
        ? roleFilteredReports
        : roleFilteredReports.filter(r => r.category === selectedCategory)

    // Step 3: Separate featured vs regular
    const featured = roleFilteredReports.filter(r => r.featured)
    const regular = roleFilteredReports.filter(r => !r.featured)

    // Step 4: Count by category
    const countByCategory: Record<ReportCategory, number> = {
      all: roleFilteredReports.length,
      financial: roleFilteredReports.filter(r => r.category === 'financial').length,
      operational: roleFilteredReports.filter(r => r.category === 'operational').length,
      analytics: roleFilteredReports.filter(r => r.category === 'analytics').length
    }

    return {
      availableReports: roleFilteredReports,
      featuredReports: featured,
      regularReports: regular,
      filteredReports: categoryFiltered,
      categories: ['all', 'financial', 'operational', 'analytics'] as ReportCategory[],
      totalCount: roleFilteredReports.length,
      countByCategory
    }
  }, [userRole, selectedCategory])

  return result
}
