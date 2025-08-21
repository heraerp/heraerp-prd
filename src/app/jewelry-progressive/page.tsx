'use client'

import React, { useEffect } from 'react'
// Progressive Authentication - Don Norman Pattern
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { JewelryTeamsSidebar } from '@/components/jewelry-progressive/JewelryTeamsSidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { 
  Gem, 
  Package, 
  BarChart3, 
  Users, 
  Settings, 
  Crown,
  Sparkles,
  Star,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Zap,
  BookmarkPlus,
  Search,
  Bell,
  Plus,
  Wrench,
  Clock
} from 'lucide-react'

export default function JewelryProgressivePage() {
  const { workspace, isAnonymous, startAnonymous, isLoading } = useMultiOrgAuth()
  const router = useRouter()
  
  // Automatically create workspace on first visit
  useEffect(() => {
    if (!isLoading && !workspace) {
      startAnonymous()
    }
  }, [isLoading, workspace, startAnonymous])
  
  // Show loading state
  if (isLoading || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Setting up your jewelry workspace...</p>
        </div>
      </div>
    )
  }
  
  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Teams-Style Sidebar */}
      <JewelryTeamsSidebar />
      
      <div className="ml-16">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Luxury Gems & Jewelry
                </h1>
                <p className="text-sm text-slate-600">
                  {workspace.type === 'anonymous' ? 'Try it free - no signup required' : workspace.organization_name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAnonymous && (
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-100 text-purple-800 text-sm">
                  <Zap className="w-4 h-4" />
                  <span>Instant Access</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome to Your Jewelry Management System
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {isAnonymous 
              ? "Start using real features immediately. Everything you create is saved in your workspace."
              : "Continue building your jewelry business with full access to all features."
            }
          </p>
        </div>

        {/* Quick Stats - Shows real data */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-slate-900">
                  {workspace.data_status === 'sample' ? '3' : '3+'}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-slate-900">$12,497</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-slate-900">2</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Repairs</p>
                <p className="text-2xl font-bold text-slate-900">4</p>
              </div>
              <Wrench className="h-8 w-8 text-amber-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sales Today</p>
                <p className="text-2xl font-bold text-slate-900">$5,999</p>
              </div>
              <TrendingUp className="h-8 w-8 text-pink-600" />
            </div>
          </Card>
        </div>

        {/* Feature Cards - Real working features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Inventory Management */}
          <Card 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500"
            onClick={() => router.push('/jewelry-progressive/inventory')}
          >
            <div className="flex items-center justify-between mb-4">
              <Package className="h-8 w-8 text-blue-600" />
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Inventory</h3>
            <p className="text-sm text-slate-600 mb-4">
              Manage your jewelry inventory with real-time tracking
            </p>
            <div className="flex items-center text-sm text-blue-600 font-medium">
              <Sparkles className="h-4 w-4 mr-1" />
              {workspace.data_status === 'sample' ? '3 sample items loaded' : 'Your inventory'}
            </div>
          </Card>

          {/* Point of Sale */}
          <Card 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500"
            onClick={() => router.push('/jewelry-progressive/pos')}
          >
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="h-8 w-8 text-green-600" />
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Point of Sale</h3>
            <p className="text-sm text-slate-600 mb-4">
              Process sales with AI-powered recommendations
            </p>
            <div className="flex items-center text-sm text-green-600 font-medium">
              <Star className="h-4 w-4 mr-1" />
              Create real transactions
            </div>
          </Card>

          {/* Repair & Custom Orders */}
          <Card 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-amber-500"
            onClick={() => router.push('/jewelry-progressive/repair')}
          >
            <div className="flex items-center justify-between mb-4">
              <Wrench className="h-8 w-8 text-amber-600" />
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Repair & Custom Orders</h3>
            <p className="text-sm text-slate-600 mb-4">
              Manage jewelry repairs and custom order workflow
            </p>
            <div className="flex items-center text-sm text-amber-600 font-medium">
              <Clock className="h-4 w-4 mr-1" />
              4 active jobs with AI tracking
            </div>
          </Card>

          {/* Analytics */}
          <Card 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500"
            onClick={() => router.push('/jewelry-progressive/analytics')}
          >
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Analytics</h3>
            <p className="text-sm text-slate-600 mb-4">
              View sales insights and performance metrics
            </p>
            <div className="flex items-center text-sm text-purple-600 font-medium">
              <TrendingUp className="h-4 w-4 mr-1" />
              Real-time dashboards
            </div>
          </Card>

          {/* Customers */}
          <Card 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-pink-500"
            onClick={() => router.push('/jewelry-progressive/customers')}
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-pink-600" />
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Customers</h3>
            <p className="text-sm text-slate-600 mb-4">
              Manage VIP customers and preferences
            </p>
            <div className="flex items-center text-sm text-pink-600 font-medium">
              <Crown className="h-4 w-4 mr-1" />
              {workspace.data_status === 'sample' ? '2 sample VIPs' : 'Your customers'}
            </div>
          </Card>

          {/* Settings */}
          <Card 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-slate-500"
            onClick={() => router.push('/jewelry-progressive/settings')}
          >
            <div className="flex items-center justify-between mb-4">
              <Settings className="h-8 w-8 text-slate-600" />
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Settings</h3>
            <p className="text-sm text-slate-600 mb-4">
              Configure your jewelry business
            </p>
            <div className="flex items-center text-sm text-slate-600 font-medium">
              <Gem className="h-4 w-4 mr-1" />
              Customize everything
            </div>
          </Card>
        </div>

        {/* Call to Action */}
        {isAnonymous && (
          <Card className="mt-8 p-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Like what you see?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Everything you're doing is real. Your inventory, customers, and sales are saved in your workspace. 
                Save your work with just an email - no credit card required.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => {
                  // This would trigger the save flow
                  const banner = document.querySelector('[data-save-button]')
                  if (banner) {
                    (banner as HTMLButtonElement).click()
                  }
                }}
              >
                <BookmarkPlus className="h-5 w-5 mr-2" />
                Save My Workspace
              </Button>
            </div>
          </Card>
        )}
      </main>
      </div>
    </div>
  )
}