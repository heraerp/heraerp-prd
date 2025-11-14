'use client'
import React from 'react'

import { UniversalLayout } from '@/components/layout/UniversalLayout'
import {
  UtensilsCrossed,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Package,
  Clock,
  DollarSign,
  BookOpen,
  Coffee,
  CreditCard
} from 'lucide-react'
import { getModuleTheme } from '@/lib/theme/module-themes'

const theme = getModuleTheme('restaurant')

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Coffee className="w-5 h-5" />,
    href: '/restaurant',
    color: 'hover:bg-orange-100'
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: <ShoppingCart className="w-5 h-5" />,
    href: '/restaurant/orders',
    badge: '12',
    color: 'hover:bg-red-100'
  },
  {
    id: 'pos',
    label: 'Point of Sale',
    icon: <CreditCard className="w-5 h-5" />,
    href: '/restaurant/pos',
    color: 'hover:bg-purple-100',
    badge: 'NEW'
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: <BookOpen className="w-5 h-5" />,
    href: '/restaurant/menu',
    color: 'hover:bg-orange-100'
  },
  {
    id: 'tables',
    label: 'Tables',
    icon: <Users className="w-5 h-5" />,
    href: '/restaurant/tables',
    badge: '8/15',
    color: 'hover:bg-red-100'
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    icon: <Clock className="w-5 h-5" />,
    href: '/restaurant/kitchen',
    badge: 'Live',
    color: 'hover:bg-orange-100'
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <Package className="w-5 h-5" />,
    href: '/restaurant/inventory',
    badge: '!',
    color: 'hover:bg-red-100'
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: <Truck className="w-5 h-5" />,
    href: '/restaurant/suppliers',
    color: 'hover:bg-orange-100'
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: <DollarSign className="w-5 h-5" />,
    href: '/restaurant/payments',
    color: 'hover:bg-red-100'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '/restaurant/reports',
    color: 'hover:bg-orange-100'
  }
]

const quickActions = [
  {
    id: 'open-pos',
    label: 'Open POS',
    icon: <CreditCard className="w-5 h-5" />,
    href: '/restaurant/pos',
    color: 'hover:bg-purple-100',
    description: 'Launch Point of Sale'
  },
  {
    id: 'new-order',
    label: 'New Order',
    icon: <ShoppingCart className="w-5 h-5" />,
    href: '/restaurant/orders?action=new',
    color: 'hover:bg-orange-100',
    description: 'Take customer order'
  },
  {
    id: 'table-reservation',
    label: 'Reserve Table',
    icon: <Users className="w-5 h-5" />,
    href: '/restaurant/tables?action=reserve',
    color: 'hover:bg-red-100',
    description: 'Book table reservation'
  },
  {
    id: 'add-menu-item',
    label: 'Add Menu Item',
    icon: <BookOpen className="w-5 h-5" />,
    href: '/restaurant/menu?action=new',
    color: 'hover:bg-orange-100',
    description: 'Create new dish'
  },
  {
    id: 'kitchen-order',
    label: 'Kitchen Display',
    icon: <Clock className="w-5 h-5" />,
    href: '/restaurant/kitchen',
    color: 'hover:bg-red-100',
    description: 'View pending orders'
  },
  {
    id: 'stock-check',
    label: 'Stock Check',
    icon: <Package className="w-5 h-5" />,
    href: '/restaurant/inventory?action=check',
    color: 'hover:bg-orange-100',
    description: 'Check inventory levels'
  },
  {
    id: 'daily-sales',
    label: 'Daily Sales',
    icon: <DollarSign className="w-5 h-5" />,
    href: '/restaurant/reports?view=daily',
    color: 'hover:bg-red-100',
    description: "View today's revenue"
  }
]

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return (
    <UniversalLayout
      title="Restaurant Pro"
      subtitle="Management"
      icon={UtensilsCrossed}
      sidebarItems={sidebarItems}
      quickActions={quickActions}
      brandGradient={theme.brandGradient}
      accentGradient={theme.accentGradient}
      backgroundGradient={theme.backgroundGradient}
      baseUrl="/restaurant"
    >
      {children}
    </UniversalLayout>
  )
}
