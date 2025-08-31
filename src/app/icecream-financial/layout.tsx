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
  { name: 'Financial', href: '/icecream-financial', icon: DollarSign, badge: 'Active', badgeVariant: 'default' as const },
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
    name: 'Warehouse Manager',
    icon: Warehouse,
    href: '/icecream/warehouse',
    description: 'Cold storage management',
    color: 'from-purple-500 to-pink-600'
  },
  {
    name: 'AI Assistant',
    icon: Bot,
    href: '/icecream-manager',
    description: 'Natural language ice cream operations',
    color: 'from-green-500 to-emerald-600'
  },
  {
    name: 'Digital Accountant',
    icon: Calculator,
    href: '/digital-accountant',
    description: 'AI-powered accounting automation',
    color: 'from-indigo-500 to-purple-600'
  },
  {
    name: 'Quality Lab',
    icon: FlaskConical,
    href: '/icecream/lab',
    description: 'Advanced quality testing',
    color: 'from-orange-500 to-red-600'
  },
  {
    name: 'Customer Portal',
    icon: UserCheck,
    href: '/icecream/customer-portal',
    description: 'B2B ordering system',
    color: 'from-cyan-500 to-blue-600'
  },
  {
    name: 'Fleet Manager',
    icon: Truck,
    href: '/icecream/fleet',
    description: 'Refrigerated vehicle tracking',
    color: 'from-gray-500 to-gray-700'
  },
  {
    name: 'Compliance Hub',
    icon: ClipboardList,
    href: '/icecream/compliance',
    description: 'FSSAI & regulatory management',
    color: 'from-red-500 to-pink-600'
  },
  {
    name: 'Franchise Portal',
    icon: Building,
    href: '/icecream/franchise',
    description: 'Franchise management system',
    color: 'from-yellow-500 to-orange-600'
  }
]

export default function IceCreamFinancialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DemoOrgProvider>
      <HeraSidebar
        title="Kochi Ice Cream"
        subtitle="Manufacturing ERP"
        logo={Snowflake}
        navigation={navigation}
        additionalApps={additionalApps}
        theme={{
          primary: 'from-blue-500 to-cyan-600',
          sidebar: 'from-gray-900 to-gray-950',
          accent: 'from-blue-500 to-cyan-600'
        }}
        bottomWidget={{
          title: "Today's Production",
          value: "2,150 L",
          subtitle: "94.2% capacity",
          icon: Activity,
          gradient: 'from-cyan-500 to-blue-600'
        }}
      >
        {children}
      </HeraSidebar>
    </DemoOrgProvider>
  )
}