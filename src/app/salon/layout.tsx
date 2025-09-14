'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { NavigationLoadingProvider } from '@/components/navigation/NavigationLoadingProvider'
import { NavigationLink } from '@/components/navigation/NavigationLink'
import { 
  Calendar, 
  Users, 
  ShoppingCart, 
  Package, 
  Settings,
  BarChart3,
  Scissors,
  Home,
  CreditCard,
  UserCircle,
  Sparkles,
  Heart,
  Gift,
  Star,
  TrendingUp,
  Palette,
  Shield,
  UserPlus,
  Clock,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Zap,
  Award,
  Briefcase,
  Target,
  Database,
  Brain,
  Calculator,
  Truck,
  Menu,
  Activity
} from 'lucide-react'
import { salonPinterest2025Theme } from '@/lib/dna/themes/salon-pinterest-2025'

// Navigation items
const navigation = [
  { name: 'Dashboard', href: '/salon/dashboard', icon: Home },
  { name: 'Appointments', href: '/salon/appointments', icon: Calendar },
  { name: 'POS', href: '/salon/pos', icon: CreditCard },
  { name: 'Customers', href: '/salon/customers', icon: Users },
  { name: 'Staff', href: '/salon/staff', icon: UserCircle },
  { name: 'Services', href: '/salon/services', icon: Scissors },
  { name: 'Inventory', href: '/salon/inventory', icon: Package },
  { name: 'Finance', href: '/salon/finance', icon: DollarSign },
  { name: 'Analytics', href: '/salon/analytics', icon: BarChart3 },
]

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const theme = salonPinterest2025Theme

  return (
    <NavigationLoadingProvider>
      <div className="min-h-screen bg-gradient-to-b from-[#8332EC] to-[#CE8A73]">
      {/* Animated background elements with new colors */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#8332EC] to-[#DD97E2] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[#DD97E2] to-[#CE8A73] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-[#762866] to-[#8332EC] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full bg-[#762866] border-r border-white/10">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#DD97E2] rounded-lg blur-lg opacity-80 animate-pulse" />
                  <div className="relative bg-[#DD97E2] p-2 rounded-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">
                    Premium Salon
                  </h1>
                  <p className="text-xs text-white/80 font-medium">
                    Beauty & Wellness
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white/60 hover:text-white transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item, index) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <NavigationLink
                    key={item.name}
                    href={item.href}
                    icon={item.icon}
                    className={`group relative space-x-3 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                    activeClassName="bg-[#DD97E2]/20"
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {/* Background gradient on active/hover */}
                    <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-[#DD97E2]/20'
                        : 'bg-transparent group-hover:bg-white/5'
                    }`} />
                    
                    <span className="relative">{item.name}</span>
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute right-3 h-2 w-2 rounded-full bg-[#DD97E2] animate-pulse" />
                    )}
                  </NavigationLink>
                )
              })}
            </nav>

            {/* Bottom Stats Card */}
            <div className="p-4">
              <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-[#DD97E2]">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-white">Today's Status</span>
                    </div>
                    <span className="text-xs font-medium text-[#DD97E2]">Live</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Appointments</span>
                      <span className="text-white font-medium">12</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Walk-ins</span>
                      <span className="text-white font-medium">3</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Revenue</span>
                      <span className="text-[#DD97E2] font-medium">₹24.5K</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/60">Staff Online</span>
                      <div className="flex -space-x-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full border-2 border-[#762866] bg-[#DD97E2]"
                          />
                        ))}
                        <div className="w-6 h-6 rounded-full border-2 border-[#762866] bg-[#762866]/50 flex items-center justify-center">
                          <span className="text-[8px] text-white/60">+2</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[#762866]/80 backdrop-blur-2xl border-b border-white/10">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white/60 hover:text-white transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-6 ml-auto">
              {/* Quick Stats */}
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                <div className="relative">
                  <CheckCircle className="h-4 w-4 text-[#DD97E2]" />
                  <div className="absolute inset-0 animate-ping">
                    <CheckCircle className="h-4 w-4 text-[#DD97E2]" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-white/60">Available Slots</span>
                  <span className="text-xs font-semibold text-white">8 Today</span>
                </div>
              </div>
              
              {/* Active Clients */}
              <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                <Heart className="h-4 w-4 text-[#DD97E2]" />
                <div className="flex flex-col">
                  <span className="text-xs text-white/60">Active Clients</span>
                  <span className="text-sm font-bold text-white">
                    248
                  </span>
                </div>
              </div>
              
              {/* Revenue Indicator */}
              <div className="hidden lg:flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                <TrendingUp className="h-4 w-4 text-[#DD97E2]" />
                <div className="flex flex-col">
                  <span className="text-xs text-white/60">Today's Revenue</span>
                  <span className="text-sm font-bold text-[#DD97E2]">
                    ₹24,500
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
    </NavigationLoadingProvider>
  )
}