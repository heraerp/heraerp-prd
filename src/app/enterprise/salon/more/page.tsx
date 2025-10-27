// Force dynamic rendering to prevent SSG issues with SecuredSalonProvider
export const dynamic = "force-dynamic";

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
import { PremiumCard, PremiumListItem } from '@/components/salon/mobile/PremiumCard'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
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
  Home
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

  const userRole = salonRole?.toLowerCase() || 'owner'

  // Filter items based on user role
  const filteredItems = moreItems.filter((item) => item.roles.includes(userRole))

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <SalonLuxePage title="More" description="Additional features and settings" maxWidth="lg" padding="none">
      {/* 📱 PREMIUM MOBILE HEADER */}
      <PremiumMobileHeader title="More" subtitle="Features & Settings" shrinkOnScroll={false} />

      <div className="p-5">
        {/* Premium List - Clean iOS Style */}
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

        {/* Bottom spacing for mobile nav */}
        <div className="h-24" />
      </div>
    </SalonLuxePage>
  )
}
