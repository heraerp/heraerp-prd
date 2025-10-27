'use client'

/**
 * Enterprise Navigation Component
 * Smart Code: HERA.ENTERPRISE.NAVIGATION.v1
 * 
 * HERA Fiori-inspired enterprise navigation with role-based modules
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Search,
  Bell,
  User,
  Settings,
  HelpCircle,
  ChevronDown,
  Grid3X3,
  Home,
  BarChart3,
  CreditCard,
  Workflow,
  Users,
  FileText,
  Building2,
  ShoppingCart,
  Briefcase,
  TrendingUp,
  Calculator,
  Shield,
  Globe,
  Package,
  Truck,
  UserCheck,
  Database
} from 'lucide-react'

interface NavigationModule {
  id: string
  name: string
  href: string
  icon: React.ComponentType<any>
  description: string
  apps: NavigationApp[]
  roles: string[]
}

interface NavigationApp {
  id: string
  name: string
  href: string
  icon: React.ComponentType<any>
  description: string
  category: string
  color: string
}

function EnterpriseNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isAppsOpen, setIsAppsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeModule, setActiveModule] = useState('my-home')

  // Enterprise modules based on SAP Cloud ERP structure
  const modules: NavigationModule[] = [
    {
      id: 'my-home',
      name: 'My Home',
      href: '/enterprise/home',
      icon: Home,
      description: 'Personal dashboard and shortcuts',
      apps: [],
      roles: ['all']
    },
    {
      id: 'finance',
      name: 'Finance',
      href: '/enterprise/finance',
      icon: Calculator,
      description: 'Financial management and accounting',
      apps: [
        {
          id: 'journal-entries',
          name: 'Journal Entries',
          href: '/enterprise/finance/journal-entries',
          icon: FileText,
          description: 'Manual GL posting and adjustments',
          category: 'Finance',
          color: 'bg-green-500'
        },
        {
          id: 'general-ledger',
          name: 'General Ledger',
          href: '/enterprise/finance/gl',
          icon: Calculator,
          description: 'Chart of accounts and reporting',
          category: 'Finance',
          color: 'bg-green-600'
        },
        {
          id: 'financial-analytics',
          name: 'Financial Analytics',
          href: '/enterprise/finance/analytics',
          icon: BarChart3,
          description: 'Financial performance metrics',
          category: 'Finance',
          color: 'bg-blue-500'
        }
      ],
      roles: ['all']
    },
    {
      id: 'procurement',
      name: 'Procurement',
      href: '/enterprise/procurement',
      icon: ShoppingCart,
      description: 'Source-to-pay operations',
      apps: [
        {
          id: 'purchase-orders',
          name: 'Purchase Orders',
          href: '/enterprise/procurement/orders',
          icon: FileText,
          description: 'Create and manage purchase orders',
          category: 'Procurement',
          color: 'bg-purple-500'
        },
        {
          id: 'suppliers',
          name: 'Supplier Management',
          href: '/enterprise/procurement/suppliers',
          icon: Users,
          description: 'Manage supplier relationships',
          category: 'Procurement',
          color: 'bg-indigo-500'
        }
      ],
      roles: ['all']
    },
    {
      id: 'supply-chain',
      name: 'Supply chain',
      href: '/enterprise/scm',
      icon: Truck,
      description: 'Supply chain management and logistics',
      apps: [
        {
          id: 'inventory',
          name: 'Inventory Management',
          href: '/enterprise/scm/inventory',
          icon: Package,
          description: 'Stock levels and warehouse operations',
          category: 'Supply Chain',
          color: 'bg-orange-500'
        },
        {
          id: 'transportation',
          name: 'Transportation',
          href: '/enterprise/scm/transportation',
          icon: Truck,
          description: 'Logistics and delivery management',
          category: 'Supply Chain',
          color: 'bg-yellow-500'
        }
      ],
      roles: ['all']
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing',
      href: '/enterprise/manufacturing',
      icon: Building2,
      description: 'Production planning and execution',
      apps: [
        {
          id: 'production-orders',
          name: 'Production Orders',
          href: '/enterprise/manufacturing/orders',
          icon: Building2,
          description: 'Manufacturing order management',
          category: 'Manufacturing',
          color: 'bg-red-500'
        },
        {
          id: 'quality-management',
          name: 'Quality Management',
          href: '/enterprise/manufacturing/quality',
          icon: Shield,
          description: 'Quality control and inspection',
          category: 'Manufacturing',
          color: 'bg-green-600'
        }
      ],
      roles: ['all']
    },
    {
      id: 'sales',
      name: 'Sales',
      href: '/enterprise/sales',
      icon: TrendingUp,
      description: 'Sales and customer relationship management',
      apps: [
        {
          id: 'crm',
          name: 'CRM',
          href: '/enterprise/sales/crm',
          icon: Users,
          description: 'Customer relationship management',
          category: 'Sales',
          color: 'bg-blue-600'
        },
        {
          id: 'sales-orders',
          name: 'Sales Orders',
          href: '/enterprise/sales/orders',
          icon: FileText,
          description: 'Sales order processing',
          category: 'Sales',
          color: 'bg-purple-600'
        }
      ],
      roles: ['all']
    },
    {
      id: 'services',
      name: 'Services',
      href: '/enterprise/services',
      icon: Briefcase,
      description: 'Service management and delivery',
      apps: [
        {
          id: 'project-management',
          name: 'Project Management',
          href: '/enterprise/services/projects',
          icon: Briefcase,
          description: 'Customer project management',
          category: 'Services',
          color: 'bg-teal-500'
        },
        {
          id: 'service-orders',
          name: 'Service Orders',
          href: '/enterprise/services/orders',
          icon: Workflow,
          description: 'Service order management',
          category: 'Services',
          color: 'bg-cyan-500'
        }
      ],
      roles: ['all']
    },
    {
      id: 'asset-management',
      name: 'Asset management',
      href: '/enterprise/assets',
      icon: UserCheck,
      description: 'Asset lifecycle and maintenance management',
      apps: [
        {
          id: 'asset-registry',
          name: 'Asset Registry',
          href: '/enterprise/assets/registry',
          icon: Database,
          description: 'Equipment master data',
          category: 'Assets',
          color: 'bg-gray-500'
        },
        {
          id: 'maintenance',
          name: 'Maintenance Management',
          href: '/enterprise/assets/maintenance',
          icon: Settings,
          description: 'Preventive and predictive maintenance',
          category: 'Assets',
          color: 'bg-slate-500'
        }
      ],
      roles: ['all']
    }
  ]

  // Get user role (in real implementation, this would come from auth context)
  const userRole = 'manager' // Demo role

  const filteredModules = modules.filter(module => 
    module.roles.includes('all') || module.roles.includes(userRole)
  )

  const allApps = modules.flatMap(module => module.apps)

  const filteredApps = allApps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Top Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* HERA Logo and Breadcrumbs */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-xs">HERA</span>
              </div>
              <ChevronDown className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">All products</span>
              <span className="text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">HERA Cloud ERP</span>
            </div>
          </div>

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
            {/* Global Search */}
            <div className="relative">
              <div className="flex items-center space-x-2">
                <select className="text-sm border border-gray-300 rounded px-2 py-1 bg-white">
                  <option>Apps</option>
                  <option>Data</option>
                  <option>Help</option>
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search in Apps"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1 border border-gray-300 rounded text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="p-1 text-gray-500 hover:text-gray-700">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <HelpCircle className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Settings className="h-4 w-4" />
              </button>
              <div className="flex items-center space-x-2 ml-4">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">JD</span>
                </div>
                <span className="text-sm text-gray-700">John Doe</span>
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-0">
          <div className="flex items-center max-w-7xl mx-auto">
            {/* Module Navigation */}
            <nav className="flex space-x-1 flex-1">
              {filteredModules.map((module) => {
                const Icon = module.icon
                const isActive = pathname.startsWith(module.href) || activeModule === module.id
                
                return (
                  <Link
                    key={module.id}
                    href={module.href}
                    className={`px-4 py-3 text-sm font-medium rounded-none border-b-3 transition-all duration-200 ${
                      isActive
                        ? 'text-blue-600 border-blue-600 bg-blue-50'
                        : 'text-gray-700 border-transparent hover:text-blue-600 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <Icon className="h-4 w-4" />
                      <span>{module.name}</span>
                    </div>
                  </Link>
                )
              })}
            </nav>

            {/* Apps Launcher */}
            <div className="relative">
              <button
                onClick={() => setIsAppsOpen(!isAppsOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <Grid3X3 className="h-5 w-5" />
              </button>

              {/* Apps Dropdown */}
              {isAppsOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Apps</h3>
                      <button
                        onClick={() => setIsAppsOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-4 mb-4 border-b">
                      <button className="pb-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                        Favorites
                      </button>
                      <button className="pb-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                        Recently Used
                      </button>
                      <button className="pb-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                        Frequently Used
                      </button>
                    </div>

                    {/* Apps Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      {(searchQuery ? filteredApps : allApps.slice(0, 9)).map((app) => {
                        const Icon = app.icon
                        return (
                          <Link
                            key={app.id}
                            href={app.href}
                            onClick={() => setIsAppsOpen(false)}
                            className="p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <div className="flex flex-col items-center text-center space-y-2">
                              <div className={`w-10 h-10 ${app.color} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-900">{app.name}</div>
                                <div className="text-xs text-gray-500">{app.category}</div>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>

                    {searchQuery && filteredApps.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No apps found for "{searchQuery}"</p>
                      </div>
                    )}

                    {/* More Apps Link */}
                    <div className="mt-4 pt-4 border-t">
                      <Link
                        href="/enterprise/apps"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => setIsAppsOpen(false)}
                      >
                        More →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

// Export for use in layouts
export { EnterpriseNavigation }
export default EnterpriseNavigation