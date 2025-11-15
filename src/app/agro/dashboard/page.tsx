import React from 'react'
/**
 * HERA Agro Dashboard - Wrapper Page
 * Smart Code: HERA.AGRO.DASHBOARD.v1
 *
 * This is a lightweight wrapper that uses the UniversalAppDashboard component
 * with Agro-specific configuration. All dashboard logic is centralized in the
 * universal component to eliminate code duplication.
 *
 * Configuration: /src/lib/config/apps/agro.config.ts
 * Universal Component: /src/components/universal/dashboard/UniversalAppDashboard.tsx
 */

import { UniversalAppDashboard } from '@/components/universal/dashboard/UniversalAppDashboard'
import { agroDashboardConfig } from '@/lib/config/apps/agro.config'

export default function AgroDashboard() {
  return <UniversalAppDashboard config={agroDashboardConfig} />
}
