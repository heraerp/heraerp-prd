'use client'

import { UniversalLayout } from '@/components/layout/UniversalLayout'
import { 
  Scissors, Calendar, Users, Package, CreditCard, 
  BarChart, Settings, Heart, Star, Sparkles, Wallet
} from 'lucide-react'
import { getModuleTheme } from '@/lib/theme/module-themes'
import { SalonSettingsProvider } from '@/contexts/salon-settings-context'

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = getModuleTheme('salon')
  
  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Sparkles className="w-5 h-5" />,
      href: '/salon',
      color: 'hover:bg-pink-100'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: <Calendar className="w-5 h-5" />,
      href: '/salon/appointments',
      badge: '12',
      color: 'hover:bg-pink-100'
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: <Users className="w-5 h-5" />,
      href: '/salon/clients',
      color: 'hover:bg-purple-100'
    },
    {
      id: 'services',
      label: 'Services',
      icon: <Scissors className="w-5 h-5" />,
      href: '/salon/services',
      color: 'hover:bg-pink-100'
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: <Star className="w-5 h-5" />,
      href: '/salon/staff',
      color: 'hover:bg-purple-100'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Package className="w-5 h-5" />,
      href: '/salon/inventory',
      badge: '8',
      badgeVariant: 'warning' as const,
      color: 'hover:bg-purple-100'
    },
    {
      id: 'pos',
      label: 'Point of Sale',
      icon: <CreditCard className="w-5 h-5" />,
      href: '/salon/pos',
      color: 'hover:bg-pink-100'
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <Wallet className="w-5 h-5" />,
      href: '/salon/payments',
      color: 'hover:bg-purple-100'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart className="w-5 h-5" />,
      href: '/salon/reports',
      color: 'hover:bg-purple-100'
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: <Heart className="w-5 h-5" />,
      href: '/salon/marketing',
      color: 'hover:bg-pink-100'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      href: '/salon/settings',
      color: 'hover:bg-pink-100'
    }
  ]

  const quickActions = [
    {
      id: 'new-appointment',
      label: 'Book Appointment',
      icon: <Calendar className="w-5 h-5" />,
      href: '/salon/appointments?action=new',
      color: 'hover:bg-pink-100',
      description: 'Schedule a client appointment'
    },
    {
      id: 'new-client',
      label: 'Add Client',
      icon: <Users className="w-5 h-5" />,
      href: '/salon/clients?action=new',
      color: 'hover:bg-purple-100',
      description: 'Register new client'
    },
    {
      id: 'quick-sale',
      label: 'Quick Sale',
      icon: <CreditCard className="w-5 h-5" />,
      href: '/salon/pos',
      color: 'hover:bg-pink-100',
      description: 'Process a quick sale'
    },
    {
      id: 'view-schedule',
      label: 'Today\'s Schedule',
      icon: <Calendar className="w-5 h-5" />,
      href: '/salon/appointments?view=today',
      color: 'hover:bg-purple-100',
      description: 'View today\'s appointments'
    }
  ]
  return (
    <SalonSettingsProvider>
      <UniversalLayout
        title="Luxury Salon"
        subtitle="Beauty & Wellness"
        icon={Heart}
        sidebarItems={sidebarItems}
        quickActions={quickActions}
        {...theme}
        baseUrl="/salon"
      >
        {children}
      </UniversalLayout>
    </SalonSettingsProvider>
  )
}