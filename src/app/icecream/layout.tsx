'use client'

import { DemoOrgProvider } from '@/components/providers/DemoOrgProvider'
import { HeraSidebar } from '@/lib/dna/components/layout/hera-sidebar-dna'
import { 
  LayoutDashboard, 
  Factory, 
  Package, 
  FlaskConical,
  TruckIcon,
  ShoppingCart,
  BarChart3,
  FileText,
  Snowflake,
  ChefHat,
  Store,
  Activity,
  DollarSign,
  MessageSquare,
  Warehouse,
  Bot,
  Calculator,
  UserCheck,
  Truck,
  ClipboardList,
  Building
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/icecream', icon: LayoutDashboard },
  { name: 'Production', href: '/icecream/production', icon: Factory },
  { name: 'Inventory', href: '/icecream/inventory', icon: Package },
  { name: 'Quality Control', href: '/icecream/quality', icon: FlaskConical },
  { name: 'Distribution', href: '/icecream/distribution', icon: TruckIcon },
  { name: 'POS Terminal', href: '/icecream/pos', icon: ShoppingCart },
  { name: 'Financial', href: '/icecream-financial', icon: DollarSign },
  { name: 'Analytics', href: '/icecream/analytics', icon: BarChart3 },
  { name: 'Recipes', href: '/icecream/recipes', icon: ChefHat },
  { name: 'Outlets', href: '/icecream/outlets', icon: Store },
  { name: 'Reports', href: '/icecream/reports', icon: FileText },
]

const additionalApps = [
  {
    name: 'Analytics Chat',
    icon: MessageSquare,
    href: '/analytics-chat',
    description: 'AI-powered business insights',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    name: 'Warehouse Management',
    icon: Warehouse,
    href: '/icecream/warehouse',
    description: 'Advanced warehouse operations',
    color: 'from-orange-500 to-red-600'
  },
  {
    name: 'AI Assistant',
    icon: Bot,
    href: '/ai-assistants',
    description: 'Digital accountant & helpers',
    color: 'from-purple-500 to-pink-600'
  },
  {
    name: 'Financial Reports',
    icon: Calculator,
    href: '/icecream/financial-reports',
    description: 'Advanced financial analytics',
    color: 'from-green-500 to-emerald-600'
  },
  {
    name: 'HR Management',
    icon: UserCheck,
    href: '/icecream/hr',
    description: 'Employee & payroll management',
    color: 'from-indigo-500 to-purple-600'
  },
  {
    name: 'Fleet Management',
    icon: Truck,
    href: '/icecream/fleet',
    description: 'Vehicle tracking & maintenance',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    name: 'Compliance',
    icon: ClipboardList,
    href: '/icecream/compliance',
    description: 'Regulatory & quality compliance',
    color: 'from-red-500 to-pink-600'
  },
  {
    name: 'Fixed Assets',
    icon: Building,
    href: '/icecream/assets',
    description: 'Equipment & asset management',
    color: 'from-gray-500 to-gray-700'
  }
]

// Ice cream inspired color palette
const iceCreamTheme = {
  primary: 'from-pink-400 to-purple-400', // Strawberry to Grape
  secondary: 'from-cyan-400 to-blue-400', // Mint to Blueberry
  accent: 'from-yellow-400 to-orange-400', // Vanilla to Mango
  background: 'from-slate-50 via-blue-50 to-purple-50', // Cool, creamy background
  dark: 'from-slate-900 via-purple-900 to-blue-900'
}

export default function IceCreamLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Convert navigation to new format
  const navigationItems = navigation.map(item => ({
    ...item,
    badge: item.name === 'Quality Control' ? '3' : 
           item.name === 'Financial' ? 'New' : undefined,
    badgeVariant: item.name === 'Financial' ? 'secondary' as const : undefined
  }))

  // Header content with temperature alert
  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-4">
        <div className="hidden sm:block">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Organization: Kochi Ice Cream Manufacturing
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {/* Temperature Alert */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 rounded-full">
          <Snowflake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">-19.5°C</span>
        </div>
        
        {/* User Menu */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-700 dark:text-gray-300">Admin</span>
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-md" />
        </div>
      </div>
    </div>
  )

  return (
    <DemoOrgProvider>
      <HeraSidebar
        title="Kochi Ice Cream"
        subtitle="Manufacturing ERP"
        logo={Snowflake}
        navigation={navigationItems}
        additionalApps={additionalApps}
        theme={{
          primary: 'from-pink-500 to-purple-600',
          sidebar: 'from-gray-900 to-gray-950',
          accent: 'from-pink-500 to-purple-600'
        }}
        bottomWidget={{
          title: "Today's Production",
          value: "1,420 L",
          subtitle: "97.93% efficiency",
          icon: Activity,
          gradient: 'from-cyan-500 to-blue-600'
        }}
        headerContent={headerContent}
      >
        {children}
      </HeraSidebar>
    </DemoOrgProvider>
  )
}