'use client'

/**
 * Greenworms ERP - Demo Dashboard
 * Simplified version for customer demo (guaranteed to work)
 */

import React from 'react'
import Link from 'next/link'
import { 
  Users,
  FileText,
  MapPin,
  Route,
  Truck,
  UserCheck,
  Building2,
  Calculator,
  Activity,
  TrendingUp,
  Leaf,
  CheckCircle,
  Package2,
  Trash2
} from 'lucide-react'

export default function GreenwormsDemoPage() {
  const kpis = [
    {
      title: 'Active Customers',
      value: '1,247',
      change: '+12.3%',
      icon: Users,
      color: '#16a34a'
    },
    {
      title: 'Daily Collections',
      value: '89.5 tons',
      change: '+5.2%',
      icon: Trash2,
      color: '#dc2626'
    },
    {
      title: 'Fleet Efficiency',
      value: '94.2%',
      change: '+2.1%',
      icon: Truck,
      color: '#ea580c'
    },
    {
      title: 'RDF Production',
      value: '12.3 tons',
      change: '+8.7%',
      icon: Package2,
      color: '#0d9488'
    },
    {
      title: 'Pending Invoices',
      value: '24',
      change: '+3.2%',
      icon: FileText,
      color: '#dc2626'
    },
    {
      title: 'Monthly Revenue',
      value: '₹2.8L',
      change: '+15.4%',
      icon: TrendingUp,
      color: '#16a34a'
    }
  ]

  const modules = [
    {
      title: 'Customers',
      description: 'Manage waste collection customers',
      href: '/customers',
      icon: Users,
      color: '#16a34a',
      module: 'Customer Management'
    },
    {
      title: 'Contracts',
      description: 'Service agreements and pricing',
      href: '/greenworms/waste-management/contracts',
      icon: FileText,
      color: '#0891b2',
      module: 'Contract Management'
    },
    {
      title: 'Routes',
      description: 'Collection routes optimization',
      href: '/greenworms/waste-management/routes',
      icon: Route,
      color: '#7c3aed',
      module: 'Route Planning'
    },
    {
      title: 'Fleet',
      description: 'Vehicle and equipment management',
      href: '/greenworms/fleet-management/vehicles',
      icon: Truck,
      color: '#ea580c',
      module: 'Fleet Management'
    },
    {
      title: 'Locations',
      description: 'Facilities and service locations',
      href: '/greenworms/waste-management/locations',
      icon: MapPin,
      color: '#dc2626',
      module: 'Location Management'
    },
    {
      title: 'Staff',
      description: 'Drivers, helpers, supervisors',
      href: '/greenworms/waste-management/staff',
      icon: UserCheck,
      color: '#059669',
      module: 'Staff Management'
    },
    {
      title: 'Vendors',
      description: 'Supplier and vendor management',
      href: '/enterprise/procurement/purchasing-rebates/vendors',
      icon: Building2,
      color: '#0d7377',
      module: 'Vendor Management'
    },
    {
      title: 'Accounts',
      description: 'Financial chart of accounts',
      href: '/crm/accounts',
      icon: Calculator,
      color: '#0891b2',
      module: 'Financial Management'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Status Bar Spacer */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Mobile App Header */}
      <div className="md:hidden sticky top-0 z-50 bg-white border-b border-green-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Greenworms ERP</h1>
              <p className="text-xs text-gray-500">Waste Management Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="md:hidden bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome to Greenworms!</h2>
          <p className="text-green-100 mb-4">Sustainable waste management and RDF processing platform</p>
          <div className="flex items-center text-green-100 text-sm">
            <Activity className="w-4 h-4 mr-2" />
            System Status: All operations running smoothly
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
              <Leaf className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Greenworms ERP</h1>
              <p className="text-gray-600">Waste Management & RDF Processing Platform</p>
            </div>
          </div>
        </div>

        {/* KPI Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {kpis.map((kpi, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="h-6 w-6" style={{ color: kpi.color }} />
                <span className="text-xs font-medium text-green-600">
                  {kpi.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-sm text-gray-600">{kpi.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 md:hidden">Quick Actions</h3>
          <h3 className="text-xl font-semibold text-gray-900 mb-4 hidden md:block">Operations Dashboard</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {modules.map((action, index) => (
              <Link key={index} href={action.href}>
                <div className="bg-white rounded-xl p-4 hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
                  <div className="text-center">
                    <div 
                      className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                      style={{ backgroundColor: `${action.color}20` }}
                    >
                      <action.icon className="h-6 w-6" style={{ color: action.color }} />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{action.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">{action.description}</p>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {action.module}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h4 className="font-semibold text-green-800">System Status: Operational</h4>
              <p className="text-sm text-green-700">
                All modules are running smoothly. Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Recent Activity
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New customer added</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <Truck className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Route optimization completed</p>
                  <p className="text-xs text-gray-500">12 minutes ago</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <Package2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">RDF bale quality check passed</p>
                  <p className="text-xs text-gray-500">25 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Spacing for Mobile */}
        <div className="h-24 md:h-0" />
      </div>
    </div>
  )
}