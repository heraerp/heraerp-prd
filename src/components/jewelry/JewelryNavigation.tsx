'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Users, 
  Gem, 
  ShoppingBag,
  BarChart3,
  Wrench,
  TrendingUp,
  Crown
} from 'lucide-react'

interface NavigationItem {
  id: string
  title: string
  icon: any
  url: string
  color: string
}

const navigationItems: NavigationItem[] = [
  {
    id: 'inventory',
    title: 'Inventory',
    icon: Package,
    url: '/jewelry/inventory',
    color: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
  },
  {
    id: 'customers',
    title: 'Customers',
    icon: Crown,
    url: '/jewelry/customers',
    color: 'text-green-600 hover:text-green-700 hover:bg-green-50'
  },
  {
    id: 'pos',
    title: 'POS',
    icon: ShoppingBag,
    url: '/jewelry/pos',
    color: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    url: '/jewelry/analytics',
    color: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Gem,
    url: '/jewelry',
    color: 'text-pink-600 hover:text-pink-700 hover:bg-pink-50'
  }
]

interface JewelryNavigationProps {
  currentPage?: string
  className?: string
}

export function JewelryNavigation({ currentPage, className = '' }: JewelryNavigationProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {navigationItems
        .filter(item => item.id !== currentPage) // Hide current page
        .slice(0, 3) // Show max 3 items to avoid clutter
        .map((item) => (
          <Button 
            key={item.id}
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = item.url}
            className={item.color}
          >
            <item.icon className="w-4 h-4 mr-2" />
            {item.title}
          </Button>
        ))}
    </div>
  )
}

export default JewelryNavigation