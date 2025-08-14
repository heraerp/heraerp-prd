'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { 
  DollarSign, Users, Package, Gem, ChefHat, 
  Heart, Building, Scale, FileText, Briefcase,
  Activity, LucideIcon
} from 'lucide-react'

export interface UniversalModuleConfig {
  id: string
  name: string
  title: string
  description: string
  smartCodePrefix: string
  icon: LucideIcon
  primaryColor: string
  gradientColors: string
  navigationItems: ModuleNavigationItem[]
  dataKeys: string[]
  features: string[]
  sampleDataGenerator?: () => any
  customActions?: ModuleAction[]
}

export interface ModuleNavigationItem {
  id: string
  title: string
  description: string
  icon: LucideIcon
  url: string
  smartCode: string
  badge?: string
  isPrimary?: boolean
}

export interface ModuleAction {
  id: string
  title: string
  description: string
  icon: LucideIcon
  action: () => void
  variant?: 'primary' | 'secondary' | 'outline'
}

interface UniversalProgressiveContextType {
  moduleConfig: UniversalModuleConfig
  progressiveAuth: ReturnType<typeof useProgressiveAuth>
}

const UniversalProgressiveContext = createContext<UniversalProgressiveContextType | undefined>(undefined)

interface UniversalProgressiveProviderProps {
  children: ReactNode
  module: UniversalModuleConfig
}

export function UniversalProgressiveProvider({ children, module }: UniversalProgressiveProviderProps) {
  const progressiveAuth = useAuth()

  const contextValue: UniversalProgressiveContextType = {
    moduleConfig: module,
    progressiveAuth
  }

  return (
    <UniversalProgressiveContext.Provider value={contextValue}>
      {children}
    </UniversalProgressiveContext.Provider>
  )
}

export function useUniversalProgressive() {
  const context = useContext(UniversalProgressiveContext)
  if (context === undefined) {
    throw new Error('useUniversalProgressive must be used within a UniversalProgressiveProvider')
  }
  return context
}

// Predefined module configurations
export const UNIVERSAL_MODULE_CONFIGS: Record<string, UniversalModuleConfig> = {
  financial: {
    id: 'financial',
    name: 'financial',
    title: 'Financial Management',
    description: 'Comprehensive accounting, budgeting, and financial reporting with real-time insights',
    smartCodePrefix: 'HERA.FIN',
    icon: DollarSign,
    primaryColor: 'green-600',
    gradientColors: 'from-green-600 to-blue-600',
    dataKeys: ['transactions', 'accounts', 'invoices', 'bills', 'budgets', 'kpis'],
    features: ['General Ledger', 'AP/AR Management', 'Financial Reporting', 'Budget Planning', 'Tax Compliance'],
    navigationItems: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Financial overview and KPIs',
        icon: DollarSign,
        url: '/financial-progressive',
        smartCode: 'HERA.FIN.DASH.v1',
        isPrimary: true
      },
      {
        id: 'gl',
        title: 'General Ledger',
        description: 'Chart of accounts and journal entries',
        icon: FileText,
        url: '/financial-progressive/gl',
        smartCode: 'HERA.FIN.GL.v1',
        badge: '247'
      },
      {
        id: 'ar',
        title: 'Accounts Receivable',
        description: 'Customer invoicing and payments',
        icon: Users,
        url: '/financial-progressive/ar',
        smartCode: 'HERA.FIN.AR.v1',
        badge: '92'
      }
    ]
  },
  
  crm: {
    id: 'crm',
    name: 'crm',
    title: 'Customer Relationship Management',
    description: 'Complete customer management with sales pipeline and analytics',
    smartCodePrefix: 'HERA.CRM',
    icon: Users,
    primaryColor: 'blue-600',
    gradientColors: 'from-blue-600 to-purple-600',
    dataKeys: ['contacts', 'opportunities', 'activities', 'tasks', 'pipeline'],
    features: ['Contact Management', 'Sales Pipeline', 'Activity Tracking', 'Deal Management', 'Reports'],
    navigationItems: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Sales overview and pipeline',
        icon: Users,
        url: '/crm-progressive',
        smartCode: 'HERA.CRM.DASH.v1',
        isPrimary: true
      },
      {
        id: 'contacts',
        title: 'Contacts',
        description: 'Customer and lead management',
        icon: Users,
        url: '/crm-progressive/contacts',
        smartCode: 'HERA.CRM.CONT.v1',
        badge: '156'
      }
    ]
  },

  inventory: {
    id: 'inventory',
    name: 'inventory',
    title: 'Inventory Management',
    description: 'Stock control, procurement, and warehouse management',
    smartCodePrefix: 'HERA.INV',
    icon: Package,
    primaryColor: 'orange-600',
    gradientColors: 'from-orange-600 to-red-600',
    dataKeys: ['products', 'categories', 'suppliers', 'stockMovements', 'orders'],
    features: ['Product Catalog', 'Stock Control', 'Procurement', 'Warehouse Management', 'Reports'],
    navigationItems: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Inventory overview and alerts',
        icon: Package,
        url: '/inventory-progressive',
        smartCode: 'HERA.INV.DASH.v1',
        isPrimary: true
      }
    ]
  },

  jewelry: {
    id: 'jewelry',
    name: 'jewelry',
    title: 'Jewelry Business Management',
    description: 'Specialized jewelry retail with gemstone tracking and precious metal management',
    smartCodePrefix: 'HERA.JEW',
    icon: Gem,
    primaryColor: 'purple-600',
    gradientColors: 'from-purple-600 to-pink-600',
    dataKeys: ['jewelry', 'gemstones', 'metals', 'customers', 'orders', 'appraisals'],
    features: ['Jewelry Catalog', 'Gemstone Tracking', 'Metal Weight Management', 'Custom Orders', 'Appraisals'],
    navigationItems: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Jewelry business overview',
        icon: Gem,
        url: '/jewelry-progressive',
        smartCode: 'HERA.JEW.DASH.v1',
        isPrimary: true
      },
      {
        id: 'inventory',
        title: 'Inventory',
        description: 'Jewelry and gemstone catalog',
        icon: Package,
        url: '/jewelry-progressive/inventory',
        smartCode: 'HERA.JEW.INV.v1',
        badge: '328'
      }
    ]
  },

  restaurant: {
    id: 'restaurant',
    name: 'restaurant',
    title: 'Restaurant Management',
    description: 'Complete restaurant operations with menu management and POS integration',
    smartCodePrefix: 'HERA.REST',
    icon: ChefHat,
    primaryColor: 'red-600',
    gradientColors: 'from-red-600 to-orange-600',
    dataKeys: ['menu', 'orders', 'inventory', 'staff', 'tables', 'analytics'],
    features: ['Menu Management', 'POS Integration', 'Table Management', 'Staff Scheduling', 'Analytics'],
    navigationItems: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Restaurant operations overview',
        icon: ChefHat,
        url: '/restaurant-progressive',
        smartCode: 'HERA.REST.DASH.v1',
        isPrimary: true
      }
    ]
  },

  healthcare: {
    id: 'healthcare',
    name: 'healthcare',
    title: 'Healthcare Management',
    description: 'Patient management with HIPAA compliance and medical records',
    smartCodePrefix: 'HERA.HEALTH',
    icon: Heart,
    primaryColor: 'green-600',
    gradientColors: 'from-green-600 to-teal-600',
    dataKeys: ['patients', 'appointments', 'medical_records', 'staff', 'billing'],
    features: ['Patient Management', 'Appointment Scheduling', 'Medical Records', 'HIPAA Compliance', 'Billing'],
    navigationItems: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Healthcare operations overview',
        icon: Heart,
        url: '/healthcare-progressive',
        smartCode: 'HERA.HEALTH.DASH.v1',
        isPrimary: true
      }
    ]
  }
}

// Helper function to create custom module configurations
export function createModuleConfig(
  id: string,
  title: string,
  smartCodePrefix: string,
  customOptions: Partial<UniversalModuleConfig>
): UniversalModuleConfig {
  return {
    id,
    name: id,
    title,
    description: customOptions.description || `${title} management system`,
    smartCodePrefix,
    icon: customOptions.icon || Briefcase,
    primaryColor: customOptions.primaryColor || 'gray-600',
    gradientColors: customOptions.gradientColors || 'from-gray-600 to-gray-800',
    dataKeys: customOptions.dataKeys || ['data'],
    features: customOptions.features || ['Management', 'Analytics', 'Reports'],
    navigationItems: customOptions.navigationItems || [],
    sampleDataGenerator: customOptions.sampleDataGenerator,
    customActions: customOptions.customActions
  }
}