'use client'

/**
 * Enterprise Home Page
 * Smart Code: HERA.ENTERPRISE.HOME.v1
 * 
 * Main enterprise dashboard with dynamic module access
 */

import React from 'react'
import { useNavigationConfig } from '@/hooks/useNavigationConfig'
import { 
  Building2, 
  BarChart3, 
  ShoppingCart, 
  TrendingUp,
  Calculator,
  Truck,
  UserCheck,
  Briefcase,
  ChevronRight,
  Sparkles,
  Target,
  Clock
} from 'lucide-react'
import Link from 'next/link'

// Icon mapping for modules
const MODULE_ICONS: Record<string, React.ComponentType<any>> = {
  'FIN': Calculator,
  'PROC': ShoppingCart,
  'SALES': TrendingUp,
  'SCM': Truck,
  'MFG': Building2,
  'SVC': Briefcase,
  'ASSETS': UserCheck,
  'HR': UserCheck
}

export default function EnterprisePage() {
  const navigation = useNavigationConfig()

  // Get available modules from navigation config
  const availableModules = Object.entries(navigation.availableModules).map(([code, config]) => ({
    code: code.toLowerCase(),
    name: config.name,
    icon: MODULE_ICONS[code] || Building2,
    description: `${config.name} operations and management`,
    href: `/enterprise/${code.toLowerCase()}`,
    areas: config.areas.length,
    color: getModuleColor(code)
  }))

  function getModuleColor(code: string): string {
    const colors: Record<string, string> = {
      'FIN': 'from-green-500 to-emerald-600',
      'PROC': 'from-purple-500 to-violet-600', 
      'SALES': 'from-blue-500 to-indigo-600',
      'SCM': 'from-orange-500 to-amber-600',
      'MFG': 'from-red-500 to-rose-600',
      'SVC': 'from-teal-500 to-cyan-600',
      'ASSETS': 'from-gray-500 to-slate-600',
      'HR': 'from-pink-500 to-rose-600'
    }
    return colors[code] || 'from-gray-500 to-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                HERA Enterprise
              </h1>
              <p className="text-gray-600 mt-2">
                Complete business management suite for your organization
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Welcome back</div>
              <div className="font-semibold text-gray-900">
                Enterprise User
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Modules</p>
                <p className="text-2xl font-bold text-gray-900">{availableModules.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Areas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {availableModules.reduce((sum, module) => sum + module.areas, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-green-600">Healthy</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Business Modules</h2>
            <div className="text-sm text-gray-500">
              JSON-driven • Dynamic routing • {availableModules.length} modules available
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {availableModules.map((module) => {
              const Icon = module.icon
              return (
                <Link
                  key={module.code}
                  href={module.href}
                  className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300"
                >
                  <div className="flex flex-col h-full">
                    <div className={`w-12 h-12 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {module.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 flex-1">
                      {module.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        {module.areas} areas
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* System Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                🚀 Dynamic Navigation System Active
              </h3>
              <p className="text-blue-800 text-sm mb-3">
                This enterprise system is powered by HERA's dynamic navigation architecture. 
                All modules and pages are generated from JSON configuration, enabling infinite scalability.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  JSON-driven
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Three-level navigation
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Industry-aware
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Performance optimized
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}