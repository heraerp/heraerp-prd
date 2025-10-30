'use client'

/**
 * CRM Sales Demo Layout
 * Smart Code: HERA.DEMO.CRM.LAYOUT.v1
 * 
 * Demo layout for CRM Sales/Lead Management module
 */

import React from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  UserPlus, 
  Target, 
  Users, 
  FileText, 
  UsersIcon 
} from 'lucide-react'

interface CRMLayoutProps {
  children: React.ReactNode
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  const params = useParams()
  const pathname = usePathname()
  const orgId = params?.orgId as string

  const navigation = [
    {
      name: 'Dashboard',
      href: `/demo-org/${orgId}/crm-sales/dashboard`,
      icon: LayoutDashboard,
      description: 'Sales metrics and pipeline overview'
    },
    {
      name: 'Leads',
      href: `/demo-org/${orgId}/crm-sales/leads`,
      icon: UserPlus,
      description: 'Lead capture and qualification'
    },
    {
      name: 'Opportunities',
      href: `/demo-org/${orgId}/crm-sales/opportunities`,
      icon: Target,
      description: 'Sales pipeline management'
    },
    {
      name: 'Customers',
      href: `/demo-org/${orgId}/crm-sales/customers`,
      icon: Users,
      description: 'Customer relationship management'
    },
    {
      name: 'Quotes',
      href: `/demo-org/${orgId}/crm-sales/quotes`,
      icon: FileText,
      description: 'Proposal and quote generation'
    },
    {
      name: 'Sales Team',
      href: `/demo-org/${orgId}/crm-sales/sales-reps`,
      icon: UsersIcon,
      description: 'Sales representative management'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-sm border-b border-blue-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  HERA CRM Demo
                </h1>
                <p className="text-xs text-gray-500">Sales & Lead Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Demo Org: <span className="font-medium">{orgId}</span>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                DEMO MODE
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white/50 backdrop-blur-sm border-r border-blue-200/50 min-h-screen p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className={`text-xs ${
                      isActive ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Demo Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Demo Features</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 4-Step Master Data Wizards</li>
              <li>• AI-Powered Lead Scoring</li>
              <li>• Automated Quote Generation</li>
              <li>• Pipeline Management</li>
              <li>• Real-time Analytics</li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}