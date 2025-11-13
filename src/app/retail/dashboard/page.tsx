/**
 * HERA Retail Dashboard - Wrapper Page
 * Smart Code: HERA.RETAIL.DASHBOARD.v1
 *
 * This is a lightweight wrapper that uses the UniversalAppDashboard component
 * with Retail-specific configuration. All dashboard logic is centralized in the
 * universal component to eliminate code duplication.
 *
 * Configuration: /src/lib/config/apps/retail.config.ts
 * Universal Component: /src/components/universal/dashboard/UniversalAppDashboard.tsx
 */

import { UniversalAppDashboard } from '@/components/universal/dashboard/UniversalAppDashboard'
import { retailDashboardConfig } from '@/lib/config/apps/retail.config'

export default function RetailDashboard() {
  return <UniversalAppDashboard config={retailDashboardConfig} />
}
