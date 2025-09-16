'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { NavigationLoadingProvider } from '@/src/components/navigation/NavigationLoadingProvider'
import NavigationLink from '@/src/components/navigation/NavigationLink'
import {
  Wifi,
  Users,
  CreditCard,
  Network,
  UserCheck,
  BarChart,
  Settings,
  TrendingUp,
  Globe,
  Radio,
  Menu,
  Signal,
  Activity,
  Target
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/isp/dashboard', icon: BarChart },
  { name: 'Subscribers', href: '/isp/subscribers', icon: Users },
  { name: 'Billing', href: '/isp/billing', icon: CreditCard },
  { name: 'Network', href: '/isp/network', icon: Network },
  { name: 'Agents', href: '/isp/agents', icon: UserCheck },
  { name: 'Analytics', href: '/isp/analytics', icon: TrendingUp },
  { name: 'AI Manager', href: '/isp/ai-manager', icon: Activity },
  { name: 'IPO Readiness', href: '/isp/ipo', icon: Target },
  { name: 'Settings', href: '/isp/settings', icon: Settings }
]

export default function ISPLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <NavigationLoadingProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#0049B7] via-slate-950 to-[#001A3D]">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#E91E63] to-[#C2185B] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[#0099CC] to-[#0049B7] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-[#FFD700] to-[#0099CC] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
        </div>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full bg-gradient-to-b from-background/50 to-background/20 backdrop-blur-2xl border-r-[0.5px] border-border/20">
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="flex h-16 items-center justify-between px-4 border-b-[0.5px] border-border/20">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0099CC] to-[#0049B7] rounded-lg blur-lg opacity-80 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-[#0099CC] to-[#0049B7] p-2 rounded-lg">
                      <Radio className="h-6 w-6 text-foreground" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-white/80 bg-clip-text text-transparent">
                      India Vision
                    </h1>
                    <p className="text-xs bg-gradient-to-r from-[#0099CC] to-[#FFD700] bg-clip-text text-transparent font-medium">
                      ISP Management System
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-foreground/60 hover:text-foreground transition-colors"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item, index) => {
                  const isActive = pathname === item.href
                  return (
                    <NavigationLink
                      key={item.name}
                      href={item.href}
                      icon={item.icon}
                      className="text-sm font-medium text-foreground/70 hover:text-foreground"
                      activeClassName="!bg-gradient-to-r from-[#E91E63]/30 to-[#C2185B]/30 !text-foreground shadow-lg shadow-[#E91E63]/30"
                    >
                      {item.name}
                    </NavigationLink>
                  )
                })}
              </nav>

              {/* IPO Status Card */}
              <div className="p-4">
                <div className="relative rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E91E63]/30 via-[#C2185B]/30 to-[#FFD700]/30 animate-gradient-shift" />
                  <div className="relative bg-card backdrop-blur-xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#0099CC]">
                          <Globe className="h-4 w-4 text-[#0049B7]" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">IPO Readiness</span>
                      </div>
                      <span className="text-xs font-medium text-[#FFD700]">2028</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground/60">Progress</span>
                        <span className="text-[#0099CC] font-medium">72%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full w-[72%] bg-gradient-to-r from-[#0099CC] via-[#FFD700] to-[#E91E63] animate-gradient-shift rounded-full" />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <p className="text-xs text-foreground/60">SEBI Score</p>
                        <p className="text-sm font-bold text-[#0099CC]">8.5/10</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-foreground/60">Compliance</p>
                        <p className="text-sm font-bold text-[#FFD700]">96%</p>
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
          <header className="sticky top-0 z-20 bg-card backdrop-blur-2xl border-0">
            <div className="flex h-16 items-center justify-between px-4 lg:px-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-foreground/60 hover:text-foreground transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="flex items-center space-x-6 ml-auto">
                {/* Network Status */}
                <div className="hidden sm:flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                  <div className="relative">
                    <Signal className="h-4 w-4 text-emerald-400" />
                    <div className="absolute inset-0 animate-ping">
                      <Signal className="h-4 w-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-foreground/60">Network</span>
                    <span className="text-xs font-semibold text-emerald-400">Operational</span>
                  </div>
                </div>

                {/* Active Subscribers */}
                <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0099CC]/20 to-[#0049B7]/20 border border-[#0099CC]/30">
                  <Activity className="h-4 w-4 text-[#0099CC]" />
                  <div className="flex flex-col">
                    <span className="text-xs text-foreground/60">Active Users</span>
                    <span className="text-sm font-bold bg-gradient-to-r from-[#0099CC] to-[#FFD700] bg-clip-text text-transparent">
                      45,832
                    </span>
                  </div>
                </div>

                {/* Revenue Indicator */}
                <div className="hidden lg:flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-[#E91E63]/20 to-[#C2185B]/20 border border-[#E91E63]/30">
                  <TrendingUp className="h-4 w-4 text-[#E91E63]" />
                  <div className="flex flex-col">
                    <span className="text-xs text-foreground/60">Monthly Revenue</span>
                    <span className="text-sm font-bold bg-gradient-to-r from-[#E91E63] to-[#C2185B] bg-clip-text text-transparent">
                      ₹4.2 Cr
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </NavigationLoadingProvider>
  )
}
