// HERA DNA Design System - Premium UI Standards
// This is the standardized design system for all HERA applications
// Based on the successful Enterprise Retail Progressive design

import React from 'react'
import { 
  Package, Calendar, ShoppingBag, CreditCard, BarChart3, TrendingUp,
  Megaphone, Users, Sparkles, Store, Palette, Target, Zap,
  ChevronRight, ArrowUpRight, Bell, Search, MoreHorizontal,
  DollarSign, Building, Heart, Briefcase, Truck, Globe,
  Settings, Shield, Activity, FileText, Database, Cloud
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// HERA DNA Design System Configuration
export const HERA_DESIGN_SYSTEM = {
  // Color Gradients for modules
  gradients: {
    purple: 'from-purple-500 to-pink-600',
    blue: 'from-blue-500 to-cyan-600',
    green: 'from-green-500 to-emerald-600',
    orange: 'from-orange-500 to-red-600',
    indigo: 'from-indigo-500 to-purple-600',
    teal: 'from-teal-500 to-cyan-600',
    amber: 'from-amber-500 to-orange-600',
    rose: 'from-rose-500 to-pink-600',
    gray: 'from-gray-500 to-gray-700',
    emerald: 'from-emerald-500 to-teal-600'
  },

  // Icon mappings for different industries
  icons: {
    // Retail
    merchandising: Palette,
    planning: Calendar,
    procurement: ShoppingBag,
    pos: CreditCard,
    inventory: Package,
    analytics: BarChart3,
    promotions: Megaphone,
    customers: Users,
    
    // Healthcare
    patients: Heart,
    appointments: Calendar,
    billing: DollarSign,
    prescriptions: FileText,
    reports: BarChart3,
    
    // Restaurant
    menu: FileText,
    kitchen: Store,
    delivery: Truck,
    
    // Jewelry
    jewelry: Sparkles,
    repair: Settings,
    
    // General
    finance: DollarSign,
    operations: Activity,
    security: Shield,
    settings: Settings,
    data: Database,
    cloud: Cloud,
    business: Building,
    briefcase: Briefcase,
    global: Globe
  }
}

// Premium Module Card Component
export const HeraDnaModuleCard = ({ 
  module, 
  hoveredModule, 
  setHoveredModule, 
  onClick 
}: {
  module: any
  hoveredModule: string | null
  setHoveredModule: (id: string | null) => void
  onClick: () => void
}) => {
  const ModuleIcon = module.icon
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHoveredModule(module.id)}
      onMouseLeave={() => setHoveredModule(null)}
      className="group cursor-pointer"
    >
      <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-gray-100 overflow-hidden h-full">
        {/* Premium gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity duration-700`}></div>
        
        {/* Floating icon */}
        <div className="relative z-10 mb-6">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
            <ModuleIcon className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
            {module.title}
          </h3>
          
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            {module.description}
          </p>

          {/* Stats */}
          {module.stats && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-900">{module.stats}</span>
              {module.trend && (
                <Badge className="bg-green-100 text-green-700 border-0">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {module.trend}
                </Badge>
              )}
            </div>
          )}
          
          {/* Action */}
          <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
            <span>Explore</span>
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Premium shine effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000"></div>
      </div>
    </div>
  )
}

// Premium Header Component
export const HeraDnaHeader = ({ 
  title, 
  organizationName, 
  metrics = [] 
}: {
  title: string
  organizationName: string
  metrics?: Array<{
    label: string
    value: string
    change: string
    positive: boolean
  }>
}) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              {title}
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                HERA Powered
              </Badge>
            </h1>
            <p className="text-gray-600 mt-1">{organizationName}</p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="relative">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Key Metrics Bar */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                  <span className={`text-sm font-medium flex items-center gap-1 ${
                    metric.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`w-3 h-3 ${!metric.positive ? 'rotate-180' : ''}`} />
                    {metric.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}

// Premium Page Layout Template
export const HeraDnaPageTemplate = ({ 
  industry,
  modules,
  quickActions,
  user,
  workspace,
  children
}: {
  industry: string
  modules: any[]
  quickActions?: any[]
  user: any
  workspace: any
  children?: React.ReactNode
}) => {
  const [hoveredModule, setHoveredModule] = React.useState<string | null>(null)
  
  // Industry-specific configuration
  const industryConfig = {
    retail: {
      title: 'Enterprise Retail Command Center',
      icon: Store,
      greeting: 'Your retail empire at a glance'
    },
    restaurant: {
      title: 'Restaurant Command Center',
      icon: Store,
      greeting: 'Your culinary empire awaits'
    },
    healthcare: {
      title: 'Healthcare Command Center',
      icon: Heart,
      greeting: 'Caring for your practice, caring for patients'
    },
    jewelry: {
      title: 'Jewelry Command Center',
      icon: Sparkles,
      greeting: 'Crafting brilliance, managing excellence'
    },
    default: {
      title: 'Business Command Center',
      icon: Building,
      greeting: 'Your business at your fingertips'
    }
  }
  
  const config = industryConfig[industry] || industryConfig.default
  const IndustryIcon = config.icon
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      <div className="flex-1 flex flex-col">
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Welcome Section */}
            <div className="text-center max-w-4xl mx-auto mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl mb-6 shadow-2xl">
                <IndustryIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-5xl font-thin text-gray-900 mb-4">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'there'}
              </h2>
              <p className="text-xl text-gray-600 font-light">
                {config.greeting}. Everything you need to excel.
              </p>
            </div>

            {/* Module Grid - Premium Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {modules.map((module) => (
                <HeraDnaModuleCard
                  key={module.id}
                  module={module}
                  hoveredModule={hoveredModule}
                  setHoveredModule={setHoveredModule}
                  onClick={() => window.location.href = module.url}
                />
              ))}
            </div>

            {/* Quick Actions */}
            {quickActions && quickActions.length > 0 && (
              <div className="mt-16 max-w-4xl mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Quick Actions</h3>
                <div className="flex justify-center gap-4">
                  {quickActions.map((action, index) => (
                    <Button 
                      key={index}
                      className={index === 0 ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transition-all duration-300" : ""}
                      variant={index === 0 ? "default" : "outline"}
                    >
                      <action.icon className="w-4 h-4 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom content */}
            {children}

            {/* Footer */}
            <div className="mt-24 text-center text-sm text-gray-500">
              <p>Powered by HERA Universal Architecture • Real-time Data • Enterprise Grade</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Export design tokens for consistency
export const HERA_DESIGN_TOKENS = {
  animation: {
    duration: '700ms',
    hover: 'hover:-translate-y-2',
    scale: 'group-hover:scale-110',
    shine: 'transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]'
  },
  shadows: {
    card: 'shadow-lg hover:shadow-2xl',
    icon: 'shadow-lg group-hover:shadow-xl'
  },
  borders: {
    radius: {
      card: 'rounded-3xl',
      icon: 'rounded-2xl',
      metric: 'rounded-xl'
    }
  },
  spacing: {
    card: 'p-8',
    section: 'mb-16',
    grid: 'gap-8'
  },
  typography: {
    title: 'text-5xl font-thin',
    cardTitle: 'text-2xl font-bold',
    metric: 'text-2xl font-bold'
  }
}