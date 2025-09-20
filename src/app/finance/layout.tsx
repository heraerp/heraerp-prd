'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DollarSign,
  TrendingUp,
  FileText,
  CreditCard,
  Receipt,
  Building2,
  PieChart,
  BarChart3,
  Calculator,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Users,
  Package,
  Settings,
  Menu,
  X,
  ChevronRight,
  Landmark
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/finance/dashboard', icon: BarChart3 },
  { name: 'General Ledger', href: '/finance/gl', icon: BookOpen },
  { name: 'Accounts Payable', href: '/finance/ap', icon: ArrowDownRight },
  { name: 'Accounts Receivable', href: '/finance/ar', icon: ArrowUpRight },
  { name: 'Fixed Assets', href: '/finance/fa', icon: Building2 },
  { name: 'Cost Centers', href: '/finance/cost-centers', icon: Calculator },
  { name: 'Profit Centers', href: '/finance/profit-centers', icon: TrendingUp },
  { name: 'Profitability', href: '/finance/profitability', icon: PieChart },
  { name: 'Reports', href: '/finance/reports', icon: FileText },
  { name: 'Settings', href: '/finance/settings', icon: Settings }
]

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950/20">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[#00DDFF] to-[#0049B7] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-[#fff685] to-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
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
        className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl border-r border-border/10">
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-border/10">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg blur-lg opacity-60 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 p-2.5 rounded-lg">
                    <Landmark className="h-6 w-6 text-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-white/80 bg-clip-text text-transparent">
                    HERA Finance
                  </h1>
                  <p className="text-xs bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent font-medium">
                    Enterprise Financial Management
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-foreground/60 hover:text-foreground transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-4 py-4">
              {navigation.map((item, index) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                      isActive ? 'text-foreground' : 'text-foreground/70 hover:text-foreground'
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {/* Background gradient on active/hover */}
                    <div
                      className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-green-600/20 shadow-lg shadow-emerald-500/20'
                          : 'bg-transparent group-hover:bg-background/5'
                      }`}
                    />

                    {/* Icon with gradient on active */}
                    <div className="relative">
                      <item.icon
                        className={`h-5 w-5 transition-all duration-300 ${
                          isActive
                            ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            : 'text-foreground/70 group-hover:text-foreground'
                        }`}
                      />
                    </div>

                    <span className="relative">{item.name}</span>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute right-3 h-2 w-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 animate-pulse shadow-lg shadow-emerald-400/50" />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Financial Summary Card */}
            <div className="p-4">
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-green-600/20 to-[#00DDFF]/20 animate-gradient-shift" />
                <div className="relative bg-background/5 backdrop-blur-xl p-4 border border-border/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                        <DollarSign className="h-4 w-4 text-foreground" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        Financial Health
                      </span>
                    </div>
                    <span className="text-xs font-medium text-emerald-400">Good</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground/60">Revenue YTD</span>
                      <span className="text-emerald-400 font-medium">₹540 Cr</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground/60">Profit Margin</span>
                      <span className="text-[#fff685] font-medium">22.5%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground/60">Cash Flow</span>
                      <span className="text-[#00DDFF] font-medium">₹85 Cr</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground/60">Working Capital</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Healthy</span>
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
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/5 backdrop-blur-2xl border-b border-border/10">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-foreground/60 hover:text-foreground transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-6 ml-auto">
              {/* Quick Stats */}
              <div className="hidden sm:flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-xs text-foreground/60">Receivables</span>
                    <span className="text-xs font-semibold text-emerald-400">₹125 Cr</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <ArrowDownRight className="h-4 w-4 text-red-400" />
                  <div className="flex flex-col">
                    <span className="text-xs text-foreground/60">Payables</span>
                    <span className="text-xs font-semibold text-red-400">₹82 Cr</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#00DDFF]/10 border border-[#00DDFF]/20">
                  <Wallet className="h-4 w-4 text-[#00DDFF]" />
                  <div className="flex flex-col">
                    <span className="text-xs text-foreground/60">Cash Balance</span>
                    <span className="text-xs font-semibold text-[#00DDFF]">₹45 Cr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
