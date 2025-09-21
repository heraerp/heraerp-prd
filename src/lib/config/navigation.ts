// ================================================================================
// HERA NAVIGATION CONFIG - Role-aware navigation
// Smart Code: HERA.CONFIG.NAVIGATION.v1
// Dynamic navigation based on user roles
// ================================================================================

import {
  Home,
  Calendar,
  CreditCard,
  Package,
  BarChart3,
  DollarSign,
  MessageSquare,
  Settings,
  Shield,
  Clock,
  User,
  Lock,
  FileText
} from 'lucide-react'
import { Role, ROLE_NAVIGATION } from '@/lib/auth/rbac'

export interface NavItem {
  title: string
  href: string
  icon: any
  badge?: string
  badgeColor?: string
  children?: NavItem[]
}

/**
 * Get navigation items for a specific role
 */
export function navItems(role: Role): NavItem[] {
  const roleNav = ROLE_NAVIGATION[role] || []

  // Map string icons to actual components
  return roleNav.map(item => ({
    ...item,
    icon: getIconComponent(item.icon)
  }))
}

/**
 * Map icon names to Lucide components
 */
function getIconComponent(iconName: string): any {
  const icons: Record<string, any> = {
    Home,
    Calendar,
    CreditCard,
    Package,
    BarChart3,
    DollarSign,
    MessageSquare,
    Settings,
    Shield,
    Clock,
    User,
    Lock,
    FileText
  }

  return icons[iconName] || Home
}

/**
 * Get branding from organization context
 */
export interface BrandingConfig {
  logo?: string
  primaryColor?: string
  secondaryColor?: string
  companyName?: string
}

export function getDefaultBranding(): BrandingConfig {
  return {
    companyName: 'HERA Salon',
    primaryColor: '#8B5CF6', // Violet
    secondaryColor: '#EC4899' // Pink
  }
}
