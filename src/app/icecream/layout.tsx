'use client'

import { useEffect, useState } from 'react'
import { HeraSidebar } from '@/lib/dna/components/layout/hera-sidebar-dna'
import { supabase } from '@/lib/supabase'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { ThemeProviderDNA, ThemeToggle } from '@/lib/dna/theme/theme-provider-dna'
import { getDemoOrganizationInfo } from '@/lib/demo-org-resolver'
import { usePathname } from 'next/navigation'
// TODO: Re-enable onboarding imports once React 18 implementation is complete
// import { HeraOnboardingProvider } from '@/lib/onboarding'
// import { allIceCreamTours } from '@/lib/onboarding/tours/icecream-tours'
// import { iceCreamMessages } from '@/lib/onboarding/i18n/icecream-messages'
// import { defaultMessages } from '@/lib/onboarding/i18n'
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
  Building,
  RefreshCw
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

function IceCreamLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { currentOrganization, isAuthenticated } = useMultiOrgAuth()
  const [demoOrg, setDemoOrg] = useState<{ id: string; name: string } | null>(null)
  
  // Use authenticated org if available, otherwise use demo org, fallback to Kochi Ice Cream
  const organizationId = currentOrganization?.id || demoOrg?.id || '1471e87b-b27e-42ef-8192-343cc5e0d656'
  const organizationName = currentOrganization?.name || demoOrg?.name || 'Kochi Ice Cream Manufacturing'
  const [productionData, setProductionData] = useState({
    totalProduction: 0,
    efficiency: 0
  })

  // Load demo organization if not authenticated
  useEffect(() => {
    async function loadDemoOrg() {
      if (!isAuthenticated && !currentOrganization) {
        const orgInfo = await getDemoOrganizationInfo(pathname)
        if (orgInfo) {
          setDemoOrg({ id: orgInfo.id, name: orgInfo.name })
          console.log('Demo organization loaded for layout:', orgInfo)
        }
      }
    }
    loadDemoOrg()
  }, [isAuthenticated, currentOrganization, pathname])

  useEffect(() => {
    async function fetchProductionData() {
      if (!organizationId) return

      try {
        // Get today's production batches
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const { data: transactions } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('transaction_type', 'production_batch')
          .gte('transaction_date', today.toISOString())
        
        // Calculate total production and efficiency
        let totalLiters = 0
        let totalEfficiency = 0
        let batchCount = 0
        
        transactions?.forEach(txn => {
          if (txn.metadata?.actual_output_liters) {
            totalLiters += parseFloat(txn.metadata.actual_output_liters)
          }
          if (txn.metadata?.yield_variance_percent !== undefined) {
            totalEfficiency += (100 + parseFloat(txn.metadata.yield_variance_percent))
            batchCount++
          }
        })
        
        const avgEfficiency = batchCount > 0 ? totalEfficiency / batchCount : 0
        
        setProductionData({
          totalProduction: totalLiters,
          efficiency: avgEfficiency
        })
      } catch (error) {
        console.error('Error fetching production data:', error)
      }
    }

    fetchProductionData()
    // Refresh every minute
    const interval = setInterval(fetchProductionData, 60000)
    
    return () => clearInterval(interval)
  }, [organizationId])

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
            Organization: {organizationName || 'Loading...'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <ThemeToggle showLabel />
        
        {/* User Menu */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-700 dark:text-gray-300">Admin</span>
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-md" />
        </div>
      </div>
    </div>
  )

  return (
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
        value: productionData.totalProduction > 0 
          ? `${productionData.totalProduction.toLocaleString()} L` 
          : "0 L",
        subtitle: productionData.efficiency > 0 
          ? `${productionData.efficiency.toFixed(2)}% efficiency` 
          : "No production yet",
        icon: Activity,
        gradient: 'from-cyan-500 to-blue-600'
      }}
      headerContent={headerContent}
    >
      {children}
    </HeraSidebar>
  )
}

export default function IceCreamLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Re-enable onboarding once React 18 implementation is complete
  // Register ice cream tours
  // useEffect(() => {
  //   // Import dynamically to avoid SSR issues
  //   import('@/lib/onboarding').then(({ registerTour }) => {
  //     allIceCreamTours.forEach(tour => registerTour(tour))
  //   })
  // }, [])

  // // Combine messages
  // const allMessages = { ...defaultMessages, ...iceCreamMessages }

  // // Get enabled tours from localStorage (could also come from user preferences)
  // const enabledTours = allIceCreamTours.map(tour => tour.tourSmartCode)

  return (
    <ThemeProviderDNA defaultTheme="ice-cream-enterprise" defaultMode="system">
      {/* TODO: Re-enable HeraOnboardingProvider once React 18 implementation is complete */}
      {/* <HeraOnboardingProvider
        organizationId="demo-ice-cream-org"
        enabledTours={enabledTours}
        messages={allMessages}
        theme="light"
        onEmit={(txn, lines) => {
          // Log events for demo
          console.log('Ice Cream Onboarding Event:', { txn, lines })
          
          // Store completion status
          if (txn.metadata.event === 'tour_completed') {
            const tourCode = txn.smart_code
            localStorage.setItem(`hera_onboarding_${tourCode}_completed`, 'true')
          }
        }}
        debug={false}
      > */}
        <IceCreamLayoutContent>{children}</IceCreamLayoutContent>
      {/* </HeraOnboardingProvider> */}
    </ThemeProviderDNA>
  )
}