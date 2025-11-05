'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import { PremiumCard, PremiumListItem } from '@/components/salon/mobile/PremiumCard'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
import { supabase } from '@/lib/supabase/client'
import {
  Scissors,
  Package,
  UserPlus,
  Building2,
  DollarSign,
  BarChart3,
  Settings,
  MessageCircle,
  FolderOpen,
  ChevronRight,
  Sparkles,
  Home,
  LogOut,
  Loader2
} from 'lucide-react'

interface MoreItem {
  title: string
  description: string
  href: string
  icon: any
  color: string
  roles: string[]
}

const moreItems: MoreItem[] = [
  {
    title: 'Services',
    description: 'Manage salon services and pricing',
    href: '/salon/services',
    icon: Scissors,
    color: SALON_LUXE_COLORS.gold,
    roles: ['owner', 'receptionist', 'manager']
  },
  {
    title: 'Products',
    description: 'Product inventory and catalog',
    href: '/salon/products',
    icon: Package,
    color: SALON_LUXE_COLORS.champagne.base,
    roles: ['owner', 'receptionist', 'manager']
  },
  {
    title: 'Staff & Roles',
    description: 'Team members and roles',
    href: '/salon/staffs',
    icon: UserPlus,
    color: '#0F6F5C',
    roles: ['owner', 'manager']
  },
  {
    title: 'Branches',
    description: 'Location management',
    href: '/salon/branches',
    icon: Building2,
    color: SALON_LUXE_COLORS.bronze,
    roles: ['owner']
  },
  {
    title: 'Finance',
    description: 'Financial overview and reports',
    href: '/salon/finance',
    icon: DollarSign,
    color: SALON_LUXE_COLORS.gold,
    roles: ['owner', 'accountant']
  },
  {
    title: 'Reports',
    description: 'Analytics and insights',
    href: '/salon/reports',
    icon: BarChart3,
    color: SALON_LUXE_COLORS.champagne.base,
    roles: ['owner', 'accountant', 'manager']
  },
  {
    title: 'Inventory',
    description: 'Stock management',
    href: '/salon/inventory',
    icon: FolderOpen,
    color: '#8C7853',
    roles: ['owner', 'manager']
  },
  {
    title: 'WhatsApp',
    description: 'Customer messaging',
    href: '/salon/whatsapp',
    icon: MessageCircle,
    color: '#0F6F5C',
    roles: ['owner', 'receptionist']
  },
  {
    title: 'Settings',
    description: 'System configuration',
    href: '/salon/settings',
    icon: Settings,
    color: SALON_LUXE_COLORS.bronze,
    roles: ['owner', 'admin']
  }
]

export default function MorePage() {
  const router = useRouter()
  const { salonRole } = useSecuredSalonContext()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const userRole = salonRole?.toLowerCase() || 'owner'

  // Filter items based on user role
  const filteredItems = moreItems.filter((item) => item.roles.includes(userRole))

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

      // Clear localStorage
      localStorage.removeItem('salonRole')
      localStorage.removeItem('organizationId')
      localStorage.removeItem('userPermissions')
      localStorage.removeItem('selectedBranchId')

      // Sign out from Supabase
      await supabase.auth.signOut()

      // Redirect to auth page
      router.push('/salon/auth')
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <SalonLuxePage title="More" description="Additional features and settings" maxWidth="lg" padding="none">
      {/* 📱 PREMIUM MOBILE HEADER */}
      <PremiumMobileHeader title="More" subtitle="Features & Settings" shrinkOnScroll={false} />

      <div className="p-5">
        {/* Premium List - Clean iOS Style */}
        {filteredItems.length > 0 ? (
          <PremiumCard elevation="flat" padding="none" className="overflow-hidden">
            {filteredItems.map((item, index) => {
              const Icon = item.icon
              return (
                <React.Fragment key={item.href}>
                  <PremiumListItem
                    title={item.title}
                    subtitle={item.description}
                    icon={<Icon className="w-5 h-5" style={{ color: item.color }} />}
                    onClick={() => handleNavigation(item.href)}
                  />
                  {index < filteredItems.length - 1 && (
                    <div
                      className="mx-4 h-[0.5px]"
                      style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </PremiumCard>
        ) : (
          <PremiumCard elevation="medium" padding="lg">
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base}20 0%, ${SALON_LUXE_COLORS.gold.dark}10 100%)`,
                  border: `1px solid ${SALON_LUXE_COLORS.gold.base}30`
                }}
              >
                <Settings className="w-8 h-8" style={{ color: SALON_LUXE_COLORS.gold.base }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                No Additional Features
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: SALON_LUXE_COLORS.bronze }}>
                Your role currently doesn't have access to additional features. Contact your administrator for more information.
              </p>
            </div>
          </PremiumCard>
        )}

        {/* Logout Button - Premium Danger Style */}
        <div className="mt-6">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full min-h-[56px] rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-200 active:scale-95 hover:shadow-2xl"
            style={{
              background: isLoggingOut
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(220, 38, 38, 0.3) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)',
              color: isLoggingOut ? '#FCA5A5' : '#EF4444',
              border: isLoggingOut ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(239, 68, 68, 0.5)',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.25)',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              opacity: isLoggingOut ? 0.7 : 1
            }}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Logging Out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </>
            )}
          </button>
        </div>

        {/* Bottom spacing for mobile nav */}
        <div className="h-24" />
      </div>
    </SalonLuxePage>
  )
}
