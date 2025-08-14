'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Gem, 
  Home, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Wrench,
  ArrowLeft 
} from 'lucide-react'

export function JewelryTeamsSidebar() {
  const router = useRouter()

  const sidebarItems = [
    {
      id: 'back',
      icon: ArrowLeft,
      label: 'Back to Dashboard',
      action: () => router.push('/dashboard'),
      isBack: true
    },
    {
      id: 'home',
      icon: Home,
      label: 'Jewelry Home',
      action: () => router.push('/jewelry-progressive'),
      isActive: true
    },
    {
      id: 'pos',
      icon: ShoppingCart,
      label: 'Point of Sale',
      action: () => router.push('/jewelry-progressive/pos')
    },
    {
      id: 'inventory', 
      icon: Package,
      label: 'Inventory',
      action: () => router.push('/jewelry-progressive/inventory')
    },
    {
      id: 'customers',
      icon: Users,
      label: 'Customers',
      action: () => router.push('/jewelry-progressive/customers')
    },
    {
      id: 'repair',
      icon: Wrench,
      label: 'Repair Services',
      action: () => router.push('/jewelry-progressive/repair')
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: 'Analytics',
      action: () => router.push('/jewelry-progressive/analytics')
    }
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-white/80 backdrop-blur-md border-r border-gray-200 z-40 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-100">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
          <Gem className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4">
        <div className="space-y-2 px-3">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant={item.isActive ? 'default' : 'ghost'}
              size="sm"
              className={`
                w-10 h-10 p-0 
                ${item.isBack ? 'text-gray-400 hover:text-gray-600' : ''}
                ${item.isActive ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : ''}
              `}
              onClick={item.action}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </Button>
          ))}
        </div>
      </nav>
    </div>
  )
}