'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Calendar,
  Users,
  Package,
  MessageSquare,
  FileText,
  DollarSign,
  Settings,
  CreditCard,
  Scissors,
  BarChart3,
  Grid3x3,
  ChevronRight,
  LogOut,
  Shield,
  Clock,
  TrendingUp,
  Brain,
  Gift,
  ShoppingBag
} from 'lucide-react'

// Luxe color palette matching POS2
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#5A2A40',
  emerald: '#0F6F5C'
}

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
}

// Main sidebar items
const sidebarItems: SidebarItem[] = [
  { title: 'Dashboard', href: '/salon/dashboard', icon: Home },
  {
    title: 'Appointments',
    href: '/salon/appointments',
    icon: Calendar,
    badge: '3',
    badgeColor: COLORS.emerald
  },
  { title: 'POS Terminal', href: '/salon/pos2', icon: CreditCard },
  { title: 'Kanban Board', href: '/salon/kanban', icon: Grid3x3 },
  { title: 'Customers', href: '/salon/customers', icon: Users },
  { title: 'Services', href: '/salon/services', icon: Scissors },
  { title: 'Products', href: '/salon/products', icon: ShoppingBag },
  {
    title: 'WhatsApp',
    href: '/salon/whatsapp',
    icon: MessageSquare,
    badge: '5',
    badgeColor: COLORS.gold
  }
]

const bottomItems: SidebarItem[] = [
  { title: 'Reports', href: '/salon/reports', icon: BarChart3 },
  { title: 'Finance', href: '/salon/finance', icon: DollarSign },
  { title: 'AI Insights', href: '/salon/ai-insights', icon: Brain },
  { title: 'Settings', href: '/salon/settings', icon: Settings }
]

interface SalonLuxeSidebarProps {
  onNavigate?: () => void
}

export default function SalonLuxeSidebar({ onNavigate }: SalonLuxeSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('Staff')
  const [userName, setUserName] = useState<string>('User')
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Get user info from localStorage
    const role = localStorage.getItem('salonRole') || 'Staff'
    const name = localStorage.getItem('salonUserName') || 'User'
    setUserRole(role)
    setUserName(name)

    // Check if this is a demo session
    const demoLogin = sessionStorage.getItem('isDemoLogin') === 'true'
    const demoModule = sessionStorage.getItem('demoModule')
    setIsDemoMode(demoLogin && demoModule === 'salon')
  }, [])

  const isActive = (href: string) => {
    if (href === '/salon/dashboard' && pathname === '/salon/dashboard') return true
    if (href !== '/salon/dashboard' && pathname?.startsWith(href)) return true
    return false
  }

  const handleSignOut = () => {
    // Clear session data
    localStorage.removeItem('salonRole')
    localStorage.removeItem('salonUserName')
    sessionStorage.removeItem('isDemoLogin')
    sessionStorage.removeItem('demoModule')
    router.push('/salon/auth')
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40"
      style={{
        backgroundColor: COLORS.charcoal,
        borderRight: `1px solid ${COLORS.bronze}20`,
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 0% 0%, ${COLORS.gold}08 0%, transparent 40%),
                       radial-gradient(circle at 100% 100%, ${COLORS.plum}05 0%, transparent 40%)`
        }}
      />

      {/* Logo Section */}
      <div
        className="relative p-6 border-b"
        style={{
          borderColor: `${COLORS.bronze}20`,
          backgroundColor: COLORS.charcoalLight,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}
      >
        <Link href="/salon/dashboard" className="block">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                boxShadow: '0 4px 6px rgba(212, 175, 55, 0.3)'
              }}
            >
              <Scissors className="w-5 h-5" style={{ color: COLORS.black }} />
            </div>
            <div>
              <h1
                className="text-xl font-bold"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                HERA SALON
              </h1>
              <p className="text-xs" style={{ color: COLORS.bronze }}>
                {isDemoMode ? 'Demo Mode' : 'Hair Talkz'}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div
        className="relative p-4 border-b"
        style={{
          borderColor: `${COLORS.bronze}20`,
          backgroundColor: COLORS.charcoalDark
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: `${COLORS.gold}20`,
              border: `1px solid ${COLORS.gold}40`
            }}
          >
            <Shield className="w-5 h-5" style={{ color: COLORS.gold }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium" style={{ color: COLORS.champagne }}>
              {userName}
            </div>
            <div className="text-xs" style={{ color: COLORS.bronze }}>
              {userRole}
            </div>
          </div>
          <Clock className="w-4 h-4" style={{ color: COLORS.bronze, opacity: 0.6 }} />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="relative flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {sidebarItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'hover:scale-[1.02]'
                )}
                style={{
                  backgroundColor: active ? `${COLORS.gold}15` : 'transparent',
                  borderLeft: active ? `3px solid ${COLORS.gold}` : '3px solid transparent',
                  color: active ? COLORS.champagne : COLORS.lightText
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = `${COLORS.gold}08`
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <Icon
                  className="w-5 h-5 flex-shrink-0"
                  style={{
                    color: active ? COLORS.gold : COLORS.bronze
                  }}
                />
                <span className="text-sm font-medium">{item.title}</span>
                {item.badge && (
                  <span
                    className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: `${item.badgeColor}20`,
                      color: item.badgeColor,
                      border: `1px solid ${item.badgeColor}40`
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Bottom Navigation Items */}
        <div className="mt-8 pt-4 border-t" style={{ borderColor: `${COLORS.bronze}20` }}>
          <div className="space-y-1">
            {bottomItems.map(item => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200'
                  )}
                  style={{
                    backgroundColor: active ? `${COLORS.gold}15` : 'transparent',
                    color: active ? COLORS.champagne : COLORS.lightText
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = `${COLORS.gold}08`
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <Icon
                    className="w-5 h-5 flex-shrink-0"
                    style={{
                      color: active ? COLORS.gold : COLORS.bronze
                    }}
                  />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Sign Out Section */}
      <div
        className="relative p-4 border-t"
        style={{
          borderColor: `${COLORS.bronze}20`,
          backgroundColor: COLORS.charcoalLight
        }}
      >
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
          style={{
            backgroundColor: 'transparent',
            color: COLORS.bronze
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = `${COLORS.gold}08`
            e.currentTarget.style.color = COLORS.champagne
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = COLORS.bronze
          }}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">{isDemoMode ? 'Exit Demo' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  )
}
