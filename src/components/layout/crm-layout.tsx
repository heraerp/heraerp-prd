'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  Users,
  Target,
  UserPlus,
  Megaphone,
  Headphones,
  Activity,
  FileText,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Menu,
  X
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
}

interface CRMLayoutProps {
  children: React.ReactNode
}

export function CRMLayout({ children }: CRMLayoutProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
    {
      name: 'Accounts',
      href: '/crm/accounts',
      icon: Building2,
      badge: '324',
      badgeColor: 'bg-[#FF5A09]'
    },
    {
      name: 'Contacts',
      href: '/crm/contacts',
      icon: Users,
      badge: '1,248',
      badgeColor: 'bg-[#ec7f37]'
    },
    {
      name: 'Opportunities',
      href: '/crm/opportunities',
      icon: Target,
      badge: '89',
      badgeColor: 'bg-[#be4f0c]'
    },
    { name: 'Leads', href: '/crm/leads', icon: UserPlus, badge: '156', badgeColor: 'bg-[#FF5A09]' },
    {
      name: 'Campaigns',
      href: '/crm/campaigns',
      icon: Megaphone,
      badge: '12',
      badgeColor: 'bg-[#ec7f37]'
    },
    {
      name: 'Cases',
      href: '/crm/cases',
      icon: Headphones,
      badge: '45',
      badgeColor: 'bg-[#be4f0c]'
    },
    { name: 'Activities', href: '/crm/activities', icon: Activity },
    { name: 'Reports', href: '/crm/reports', icon: FileText },
    { name: 'Settings', href: '/crm/settings', icon: Settings }
  ]

  const stats = [
    { label: 'Pipeline Value', value: '₹8.4 Cr', change: '+12.5%', positive: true },
    { label: 'Win Rate', value: '68%', change: '+5.2%', positive: true },
    { label: 'Avg Deal Size', value: '₹9.4L', change: '-2.1%', positive: false },
    { label: 'Activities', value: '342', change: '+18%', positive: true }
  ]

  return (
    <div className="min-h-screen bg-[#393939]">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background/10 backdrop-blur-xl border border-border/20 rounded-lg"
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5 text-foreground" />
        ) : (
          <Menu className="h-5 w-5 text-foreground" />
        )}
      </button>

      {/* Sidebar - Desktop */}
      <div
        className={`hidden lg:flex fixed inset-y-0 left-0 z-50 flex-col transition-all duration-300 ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF5A09]/20 via-[#ec7f37]/10 to-[#be4f0c]/20 backdrop-blur-xl border-r border-border/10" />

        {/* Navigation */}
        <div className="relative flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center px-4 mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-xl blur opacity-60" />
              <div className="relative p-3 bg-gradient-to-br from-[#FF5A09] to-[#be4f0c] rounded-xl">
                <Users className="h-6 w-6 text-foreground" />
              </div>
            </div>
            {isExpanded && (
              <div className="ml-3">
                <h2 className="text-lg font-bold text-foreground">CRM Pro</h2>
                <p className="text-xs text-foreground/60">Sales Excellence</p>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF5A09]/20 to-[#ec7f37]/20 text-foreground border border-[#FF5A09]/30'
                      : 'text-foreground/70 hover:text-foreground hover:bg-background/5'
                  }`}
                >
                  <item.icon
                    className={`${
                      isExpanded ? 'mr-3' : 'mx-auto'
                    } h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                      isActive ? 'text-[#FF5A09]' : 'text-foreground/70 group-hover:text-foreground'
                    }`}
                  />
                  {isExpanded && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`ml-auto px-2 py-0.5 text-xs font-medium rounded-full text-foreground ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Stats Summary (expanded only) */}
          {isExpanded && (
            <div className="px-4 mt-6 mb-4">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/50 to-[#ec7f37]/50 rounded-xl blur" />
                <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-xl p-4">
                  <h3 className="text-xs font-medium text-foreground/60 mb-3">
                    Today's Performance
                  </h3>
                  <div className="space-y-2">
                    {stats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs text-foreground/70">{stat.label}</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium text-foreground">{stat.value}</span>
                          <span
                            className={`text-xs ${stat.positive ? 'text-emerald-400' : 'text-red-400'}`}
                          >
                            {stat.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Mobile */}
      <div className={`lg:hidden fixed inset-0 z-40 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-background/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-gradient-to-b from-[#FF5A09]/20 via-[#ec7f37]/10 to-[#be4f0c]/20 backdrop-blur-xl border-r border-border/10">
          {/* Same navigation content as desktop */}
          <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center px-4 mb-8">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-xl blur opacity-60" />
                <div className="relative p-3 bg-gradient-to-br from-[#FF5A09] to-[#be4f0c] rounded-xl">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-bold text-foreground">CRM Pro</h2>
                <p className="text-xs text-foreground/60">Sales Excellence</p>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center px-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FF5A09]/20 to-[#ec7f37]/20 text-foreground border border-[#FF5A09]/30'
                        : 'text-foreground/70 hover:text-foreground hover:bg-background/5'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                        isActive
                          ? 'text-[#FF5A09]'
                          : 'text-foreground/70 group-hover:text-foreground'
                      }`}
                    />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`ml-auto px-2 py-0.5 text-xs font-medium rounded-full text-foreground ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isExpanded ? 'lg:pl-64' : 'lg:pl-20'
        } pt-14 lg:pt-0`}
      >
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
