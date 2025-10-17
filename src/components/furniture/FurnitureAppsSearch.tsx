'use client'

import { useState, useEffect } from 'react'
import { Search, X, Armchair, Factory, Package, Users, BarChart3, Settings } from 'lucide-react'

interface FurnitureAppsSearchProps {
  isOpen: boolean
  onClose: () => void
}

const furnitureApps = [
  { name: 'Dashboard', href: '/furniture/dashboard', icon: Armchair, category: 'Core' },
  { name: 'Products', href: '/furniture/products', icon: Package, category: 'Core' },
  { name: 'Production Planning', href: '/furniture/production', icon: Factory, category: 'Manufacturing' },
  { name: 'Inventory', href: '/furniture/inventory', icon: Package, category: 'Operations' },
  { name: 'Customers', href: '/furniture/customers', icon: Users, category: 'Sales' },
  { name: 'Analytics', href: '/furniture/analytics', icon: BarChart3, category: 'Intelligence' },
  { name: 'Settings', href: '/furniture/settings', icon: Settings, category: 'Admin' },
  { name: 'Work Orders', href: '/furniture/work-orders', icon: Factory, category: 'Manufacturing' },
  { name: 'Quality Control', href: '/furniture/quality', icon: BarChart3, category: 'Manufacturing' },
  { name: 'Sales Orders', href: '/furniture/sales', icon: Users, category: 'Sales' },
  { name: 'Reports', href: '/furniture/reports', icon: BarChart3, category: 'Intelligence' }
]

export function FurnitureAppsSearch({ isOpen, onClose }: FurnitureAppsSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredApps, setFilteredApps] = useState(furnitureApps)

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredApps(furnitureApps)
    } else {
      const filtered = furnitureApps.filter(
        app =>
          app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredApps(filtered)
    }
  }, [searchQuery])

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setFilteredApps(furnitureApps)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 jewelry-glass-dropdown rounded-xl shadow-2xl border border-white/20">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold jewelry-text-luxury">Search Furniture Apps</h2>
            <button
              onClick={onClose}
              className="jewelry-glass-btn p-2 rounded-lg jewelry-text-luxury hover:jewelry-text-gold transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-300" />
            <input
              type="text"
              placeholder="Search apps, features, or categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 jewelry-glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredApps.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-300">No apps found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredApps.map(app => (
                  <a
                    key={app.href}
                    href={app.href}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 jewelry-glass-btn rounded-lg hover:bg-white/10 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <app.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium jewelry-text-luxury group-hover:jewelry-text-gold transition-colors">
                        {app.name}
                      </p>
                      <p className="text-sm text-gray-300">{app.category}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-300 text-center">
              Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}