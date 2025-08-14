'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Home, 
  Package, Calendar, Truck, ShoppingCart, Package2, BarChart3, Tag, Users
} from 'lucide-react'

export function EnterpriseRetailSolutionSidebar() {
  const router = useRouter()

  const sidebarItems = [
    { id: 'back', icon: ArrowLeft, label: 'Back to Dashboard', action: () => router.push('/dashboard'), isBack: true },
    { id: 'home', icon: Home, label: 'Enterprise Retail Solution Home', action: () => router.push('/enterprise-retail-progressive'), isActive: true },
    { id: 'merchandising', icon: Package, label: 'Merchandising' },
    { id: 'planning', icon: Calendar, label: 'Planning & Buying' },
    { id: 'procurement', icon: Truck, label: 'Procurement' },
    { id: 'pos', icon: ShoppingCart, label: 'Point of Sale' },
    { id: 'inventory', icon: Package2, label: 'Inventory Mgmt' },
    { id: 'analytics', icon: BarChart3, label: 'Retail Analytics' },
    { id: 'promotions', icon: Tag, label: 'Promotions' },
    { id: 'customers', icon: Users, label: 'Customer Insights' }
  ]

  return (
    <aside className="w-20 bg-gradient-to-b from-blue-600 to-indigo-700 flex flex-col">
      <div className="h-20 flex items-center justify-center border-b border-white/20">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <span className="text-lg font-bold text-white">E</span>
        </div>
      </div>

      <nav className="flex-1 py-4">
        <div className="space-y-2 px-3">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action || (() => console.log('Navigate to', item.id))}
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