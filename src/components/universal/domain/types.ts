/**
 * Universal Domain TypeScript Interfaces
 * Shared types for HERA app domain pages (Retail, Agro, Waste, Salon, etc.)
 */

import { LucideIcon } from 'lucide-react'

// Main domain configuration interface
export interface DomainConfig {
  appCode: string                                    // 'RETAIL' | 'AGRO' | 'WASTE' | 'SALON'
  appName: string                                    // 'HERA Retail' | 'HERA Agro'
  theme: DomainTheme                                 // Color scheme and branding
  navigation: DomainNavigation                       // Routes and breadcrumbs
  sectionIconMap?: Record<string, string>            // Section code → icon name mapping
  components?: DomainComponents                      // Optional component overrides
}

// Domain theme configuration
export interface DomainTheme {
  primaryColor: string        // Tailwind color class (e.g., 'indigo-600', 'green-600')
  accentColor: string         // Hex color for accents (e.g., '#3B82F6', '#10B981')
  borderColorClass: string    // Border color class (e.g., 'border-slate-200/50')
  brandIcon?: string          // Optional brand icon name (e.g., 'Sprout' for Agro)
}

// Domain navigation configuration
export interface DomainNavigation {
  dashboardRoute: string      // Route to app dashboard (e.g., '/retail/dashboard')
  subtitleText: string        // Subtitle text (e.g., 'Retail • Enterprise Overview')
}

// Optional component configuration
export interface DomainComponents {
  customNewsPanel?: boolean   // Use custom news panel component
  customInsights?: boolean    // Use custom insights component
  customAppsTab?: boolean     // Use custom apps tab component
  customAssistant?: boolean   // Use custom assistant component
}

// Section entity interface (from database)
export interface DomainSection {
  id: string
  entity_id: string
  entity_name: string
  entity_code: string
  entity_description?: string
  smart_code: string
  parent_entity_id: string
  metadata?: {
    slug?: string
    subtitle?: string
    icon?: string
    color?: string
  }
}

// Domain entity interface (from database)
export interface DomainEntity {
  id: string
  entity_id: string
  entity_name: string
  entity_code: string
  entity_description?: string
  smart_code: string
  metadata?: {
    slug?: string
    subtitle?: string
    icon?: string
    color?: string
  }
}

// Processed section module interface
export interface SectionModule {
  id: string
  entity_id: string
  title: string
  subtitle: string
  icon: LucideIcon
  iconName: string
  bgColor: string
  textColor: string
  domain: string
  section: string
  entity_code: string
  smart_code: string
  slug: string
}
