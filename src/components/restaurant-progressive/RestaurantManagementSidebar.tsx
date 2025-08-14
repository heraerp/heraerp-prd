'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Home, 
  ShoppingCart, FileText, Utensils, Truck, Package
} from 'lucide-react'

export function RestaurantManagementSidebar() {
  const router = useRouter()

  const sidebarItems = [
    { id: 'back', icon: ArrowLeft, label: 'Back to Dashboard', action: () => router.push('/dashboard'), isBack: true },
    { id: 'home', icon: Home, label: 'Restaurant Management Home', action: () => router.push('/restaurant-progressive'), isActive: true },
    { id: 'pos', icon: ShoppingCart, label: 'Point of Sale', action: () => router.push('/restaurant-pos') },
    { id: 'menu', icon: FileText, label: 'Menu Management', action: () => router.push('/restaurant-progressive/menu') },
    { id: 'kitchen', icon: Utensils, label: 'Kitchen Display', action: () => router.push('/restaurant-progressive/kitchen') },
    { id: 'delivery', icon: Truck, label: 'Delivery Orders', action: () => router.push('/restaurant-progressive/delivery') },
    { id: 'inventory', icon: Package, label: 'Inventory', action: () => router.push('/restaurant-progressive/inventory') }
  ]

  return (
    <aside className="w-20 bg-gradient-to-b from-orange-500 to-red-600 flex flex-col">
      <div className="h-20 flex items-center justify-center border-b border-white/20">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <span className="text-lg font-bold text-white">R</span>
        </div>
      </div>

      <nav className="flex-1 py-4">
        <div className="space-y-2 px-3">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
                item.isActive 
                  ? 'bg-white/30 text-white shadow-lg' 
                  : item.isBack
                  ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
              
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </nav>
    </aside>
  )
}