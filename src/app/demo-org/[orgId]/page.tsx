'use client'

/**
 * Demo Organization Home
 * Smart Code: HERA.DEMO.ORG.HOME.v1
 * 
 * Landing page for demo organization with module access
 */

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  Building2, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  ArrowRight,
  Zap,
  Globe,
  Shield
} from 'lucide-react'

export default function DemoOrgHome() {
  const params = useParams()
  const orgId = params?.orgId as string

  const modules = [
    {
      id: 'crm-sales',
      name: 'CRM Sales & Lead Management',
      description: 'Complete sales pipeline with AI-powered lead scoring',
      icon: Users,
      color: 'bg-blue-500',
      status: 'Available',
      href: `/demo-org/${orgId}/crm-sales/dashboard`,
      features: ['Lead Management', 'Opportunity Pipeline', 'Quote Generation', 'AI Scoring']
    },
    {
      id: 'sd',
      name: 'Sales & Distribution',
      description: 'Order processing and customer management',
      icon: ShoppingCart,
      color: 'bg-green-500',
      status: 'Coming Soon',
      href: '#',
      features: ['Order Management', 'Pricing', 'Billing', 'Shipping']
    },
    {
      id: 'mm',
      name: 'Materials Management',
      description: 'Procurement and inventory optimization',
      icon: Package,
      color: 'bg-purple-500',
      status: 'Coming Soon',
      href: '#',
      features: ['Procurement', 'Inventory', 'Vendor Management', 'MRP']
    },
    {
      id: 'fi',
      name: 'Financial Accounting',
      description: 'Complete financial management suite',
      icon: BarChart3,
      color: 'bg-orange-500',
      status: 'Coming Soon',
      href: '#',
      features: ['General Ledger', 'Accounts Payable', 'Accounts Receivable', 'Asset Accounting']
    },
    {
      id: 'co',
      name: 'Controlling',
      description: 'Cost accounting and profitability analysis',
      icon: Target,
      color: 'bg-red-500',
      status: 'Coming Soon',
      href: '#',
      features: ['Cost Centers', 'Profit Centers', 'Product Costing', 'Profitability Analysis']
    },
    {
      id: 'hcm',
      name: 'Human Capital Management',
      description: 'Complete HR and payroll solution',
      icon: UserCheck,
      color: 'bg-indigo-500',
      status: 'Coming Soon',
      href: '#',
      features: ['Personnel Management', 'Payroll', 'Time Management', 'Talent Management']
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-sm border-b border-blue-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  HERA Enterprise Demo
                </h1>
                <p className="text-xs text-gray-500">Organization: {orgId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/enterprise/home"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2"
              >
                <Globe className="h-4 w-4" />
                <span>Enterprise Portal</span>
              </Link>
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                DEMO MODE
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to HERA Enterprise Demo
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience the full power of our modern enterprise platform. 
            Each module demonstrates modern UX patterns with AI-powered insights and automation.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">6</div>
            <div className="text-sm text-gray-600">Enterprise Modules</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">1</div>
            <div className="text-sm text-gray-600">Module Active</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">100%</div>
            <div className="text-sm text-gray-600">Test Coverage</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">24</div>
            <div className="text-sm text-gray-600">Tests Passed</div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Available Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
              const Icon = module.icon
              const isAvailable = module.status === 'Available'
              
              return (
                <div key={module.id} className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:shadow-lg transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        isAvailable 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {module.status}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{module.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      {module.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs text-gray-600">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {isAvailable ? (
                      <Link
                        href={module.href}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                      >
                        <span>Launch Module</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
                      >
                        Coming Soon
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Demo Information */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200/50">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Demo Environment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Organization Information</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Organization ID: {orgId}</div>
                <div>Name: HERA Demo Organization</div>
                <div>Type: Demo Environment</div>
                <div>Region: Global</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Available Features</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• 4-Step Master Data Wizards</div>
                <div>• AI-Powered Lead Scoring</div>
                <div>• Real-time Analytics Dashboard</div>
                <div>• Role-based Access Control</div>
                <div>• Automated Workflow Engine</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper components
const Package = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const Target = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const UserCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)