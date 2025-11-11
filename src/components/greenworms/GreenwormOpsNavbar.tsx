'use client'

/**
 * Greenworms Operations Secondary Navigation
 * Smart Code: HERA.GREENWORMS.OPS.NAV.v1
 * 
 * Secondary navigation for all operations-related pages
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Activity,
  Package2,
  Route,
  MapPin,
  Calendar,
  ClipboardCheck,
  Recycle,
  Package,
  TrendingUp,
  Plus,
  BarChart3,
  Timer,
  Target,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Settings,
  Bell
} from 'lucide-react'

/**
 * Operations Navigation Item Interface
 */
interface OpsNavItem {
  id: string
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  badge?: string
  isNew?: boolean
}

/**
 * Operations Secondary Navbar Component
 */
export default function GreenwormOpsNavbar() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)

  // Operations navigation items
  const opsNavItems: OpsNavItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      href: '/greenworms/ops/dashboard',
      icon: Activity,
      description: 'Operations control center'
    },
    {
      id: 'service-orders',
      title: 'Service Orders',
      href: '/greenworms/ops/service-orders',
      icon: Package2,
      description: 'Collection service orders',
      badge: '12'
    },
    {
      id: 'new-service-order',
      title: 'New Order',
      href: '/greenworms/ops/service-orders/new',
      icon: Plus,
      description: 'Create service order'
    },
    {
      id: 'dispatch',
      title: 'Dispatch Board',
      href: '/greenworms/ops/dispatch',
      icon: MapPin,
      description: 'Route assignment & tracking'
    },
    {
      id: 'scheduling',
      title: 'Scheduling',
      href: '/greenworms/ops/scheduling',
      icon: Calendar,
      description: 'Collection scheduling'
    },
    {
      id: 'mrf-sorting',
      title: 'MRF Sorting',
      href: '/greenworms/ops/mrf-sorting',
      icon: Recycle,
      description: 'Material recovery facility',
      isNew: true
    },
    {
      id: 'rdf-baling',
      title: 'RDF Baling',
      href: '/greenworms/ops/rdf-baling',
      icon: Package,
      description: 'Refuse-derived fuel production'
    },
    {
      id: 'quality-control',
      title: 'Quality Control',
      href: '/greenworms/ops/quality-control',
      icon: CheckCircle,
      description: 'Quality inspections'
    },
    {
      id: 'transfers',
      title: 'Transfers',
      href: '/greenworms/ops/transfers',
      icon: Route,
      description: 'Inter-facility transfers'
    },
    {
      id: 'performance',
      title: 'Performance',
      href: '/greenworms/ops/performance',
      icon: TrendingUp,
      description: 'Operations analytics'
    },
    {
      id: 'alerts',
      title: 'Alerts',
      href: '/greenworms/ops/alerts',
      icon: AlertTriangle,
      description: 'System alerts & notifications',
      badge: '3'
    }
  ]

  const isActive = (href: string) => {
    if (href === '/greenworms/ops/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const getActiveItem = () => {
    return opsNavItems.find(item => isActive(item.href))
  }

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Operations</h2>
              <p className="text-xs text-gray-600">
                {getActiveItem()?.title || 'Control Center'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Mobile Expanded Menu */}
        {isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 gap-2 p-4">
              {opsNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsExpanded(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive(item.href)
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'text-gray-600 hover:bg-white hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {item.isNew && (
                      <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Operations Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Operations Center</h2>
                  <p className="text-sm text-gray-600">Waste Management & Processing Control</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  3
                </span>
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-0 overflow-x-auto">
              {opsNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive(item.href)
                        ? 'border-green-500 text-green-600 bg-green-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {item.isNew && (
                      <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        NEW
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}