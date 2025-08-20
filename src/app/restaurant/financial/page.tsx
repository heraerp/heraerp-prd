'use client'

import React from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
// FinancialDashboard component removed - using simple card layout instead
import { Card } from '@/components/ui/card'
import { 
  ArrowLeft, 
  BarChart3, 
  DollarSign,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function FinancialReportsPage() {
  const { isAuthenticated, isLoading, user } = useAuth()

  // If user is already signed in (which they are), show Financial Dashboard immediately
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/restaurant"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Restaurant</span>
                </Link>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <h1 className="text-xl font-semibold text-gray-900">Financial Reports</h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Organization Info */}
                <div className="hidden md:flex items-center space-x-3 text-sm">
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {organization?.organization_name || "Mario's Italian Restaurant"}
                    </p>
                    <p className="text-gray-500">
                      {user?.full_name || 'Mario'} • {user?.role || 'Manager'}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Financial Dashboard */}
        <main className="py-8">
          <Card className="p-6">
            <div className="text-center space-y-4">
              <BarChart3 className="w-12 h-12 text-blue-500 mx-auto" />
              <h3 className="text-xl font-semibold">Restaurant Financial Dashboard</h3>
              <p className="text-gray-600">Financial reports and analytics coming soon</p>
            </div>
          </Card>
        </main>

        {/* Footer with HERA Info */}
        <footer className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Shield className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  HERA Universal Financial Intelligence
                </h3>
              </div>
              <p className="text-gray-600 mb-6 max-w-3xl mx-auto">
                This financial dashboard showcases HERA's revolutionary universal architecture - where restaurant orders, 
                healthcare billing, manufacturing costs, and professional services all use the same 6-table foundation 
                to generate comprehensive business intelligence.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Real-Time Analytics</h4>
                  <p className="text-sm text-gray-600">
                    Live financial insights from universal transaction data
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Universal Architecture</h4>
                  <p className="text-sm text-gray-600">
                    Same system handles any business type without schema changes
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Instant Deployment</h4>
                  <p className="text-sm text-gray-600">
                    Financial reporting ready out-of-the-box for any industry
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Powered by HERA • Universal 6-Table Architecture • 
                  <span className="mx-1">•</span>
                  Built with Next.js, TypeScript, and Supabase
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial dashboard...</p>
        </div>
      </div>
    )
  }

  // Not authenticated fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="p-8 text-center max-w-md">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
        <p className="text-gray-600 mb-4">
          Please sign in to access the financial dashboard.
        </p>
        <Link 
          href="/restaurant"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Restaurant Login
        </Link>
      </Card>
    </div>
  )
}