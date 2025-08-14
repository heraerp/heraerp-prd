'use client'

import React, { useEffect } from 'react'
// Progressive Authentication - Don Norman Pattern
import { useAuth } from '@/contexts/auth-context'
import { AirlineTeamsSidebar } from '@/components/airline-progressive/AirlineTeamsSidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { 
  Plane, 
  Calendar, 
  MapPin, 
  Users, 
  Settings, 
  Trophy,
  Ticket,
  TrendingUp,
  ShoppingBag,
  BarChart3,
  DollarSign,
  ArrowRight,
  Zap,
  BookmarkPlus,
  Search,
  Bell,
  Plus,
  CheckCircle,
  Clock,
  Star
} from 'lucide-react'

export default function AirlineProgressivePage() {
  const { workspace, isAnonymous, startAnonymous, isLoading } = useAuth()
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sky-600 to-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Setting up your airline workspace...</p>
        </div>
      </div>
    )
  }
  
  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50">
      {/* Teams-Style Sidebar */}
      <AirlineTeamsSidebar />
      
      <div className="ml-16">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 shadow-lg">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  HERA Airlines
                </h1>
                <p className="text-sm text-slate-600">
                  {workspace.type === 'anonymous' ? 'Try it free - no signup required' : workspace.organization_name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAnonymous && (
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-100 text-sky-800 text-sm">
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
            Welcome to Your Airline Management System
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Complete airline booking system with lottery upgrades, check-in management, and loyalty programs. 
            Start booking flights and managing your airline operations instantly.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-700">487</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Active Flights</h3>
            <p className="text-sm text-slate-600">Scheduled for next 7 days</p>
            <div className="flex items-center mt-2 text-green-600 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+12% this week</span>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-700">127</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Lottery Winners</h3>
            <p className="text-sm text-slate-600">Upgrades won today</p>
            <div className="flex items-center mt-2 text-green-600 text-sm">
              <Star className="w-4 h-4 mr-1" />
              <span>25% win rate</span>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-700">94%</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">On-Time Rate</h3>
            <p className="text-sm text-slate-600">Flight performance</p>
            <div className="flex items-center mt-2 text-green-600 text-sm">
              <Clock className="w-4 h-4 mr-1" />
              <span>Industry leading</span>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-700">$2.4M</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Revenue</h3>
            <p className="text-sm text-slate-600">This month</p>
            <div className="flex items-center mt-2 text-green-600 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+18% growth</span>
            </div>
          </Card>
        </div>

        {/* Main Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Flight Search */}
          <Card className="p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg mr-4">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Flight Search</h3>
                <p className="text-sm text-slate-600">Find and book flights</p>
              </div>
            </div>
            <p className="text-slate-700 mb-4">Search available flights, compare prices, and book tickets with dynamic pricing and lottery eligibility.</p>
            <Button 
              onClick={() => router.push('/airline-progressive/search')}
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
            >
              Search Flights
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>

          {/* Booking Management */}
          <Card className="p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg mr-4">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">My Bookings</h3>
                <p className="text-sm text-slate-600">Manage reservations</p>
              </div>
            </div>
            <p className="text-slate-700 mb-4">View, modify, and manage your flight bookings with real-time status updates and check-in options.</p>
            <Button 
              onClick={() => router.push('/airline-progressive/bookings')}
              variant="outline" 
              className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              View Bookings
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>

          {/* Online Check-in */}
          <Card className="p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg mr-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Check-In</h3>
                <p className="text-sm text-slate-600">Online check-in service</p>
              </div>
            </div>
            <p className="text-slate-700 mb-4">Complete online check-in, select seats, add services, and get your boarding pass digitally.</p>
            <Button 
              onClick={() => router.push('/airline-progressive/checkin')}
              variant="outline" 
              className="w-full border-green-300 text-green-700 hover:bg-green-50"
            >
              Check In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>

          {/* Upgrade Lottery */}
          <Card className="p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg mr-4">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Upgrade Lottery</h3>
                <p className="text-sm text-slate-600">Win free upgrades</p>
              </div>
            </div>
            <p className="text-slate-700 mb-4">Spin the wheel for a chance to win cabin upgrades. 25% win probability with social sharing for winners!</p>
            <Button 
              onClick={() => router.push('/airline-progressive/lottery')}
              variant="outline" 
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              Try Lottery
              <Trophy className="w-4 h-4 ml-2" />
            </Button>
          </Card>

          {/* Loyalty Program */}
          <Card className="p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg mr-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Loyalty Program</h3>
                <p className="text-sm text-slate-600">Rewards & benefits</p>
              </div>
            </div>
            <p className="text-slate-700 mb-4">Track your miles, tier status, and exclusive benefits. Earn bonus lottery entries and priority services.</p>
            <Button 
              onClick={() => router.push('/airline-progressive/loyalty')}
              variant="outline" 
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              View Rewards
              <Star className="w-4 h-4 ml-2" />
            </Button>
          </Card>

          {/* Analytics Dashboard */}
          <Card className="p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-r from-gray-500 to-slate-600 rounded-lg mr-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Analytics</h3>
                <p className="text-sm text-slate-600">Performance insights</p>
              </div>
            </div>
            <p className="text-slate-700 mb-4">View comprehensive analytics including flight performance, revenue metrics, and customer insights.</p>
            <Button 
              onClick={() => router.push('/airline-progressive/analytics')}
              variant="outline" 
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              View Analytics
              <BarChart3 className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 p-6 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/airline-progressive/search')}
              className="flex items-center justify-center space-x-2 border-sky-300 text-sky-700 hover:bg-sky-50"
            >
              <Search className="w-4 h-4" />
              <span>Book Flight</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/airline-progressive/checkin')}
              className="flex items-center justify-center space-x-2 border-green-300 text-green-700 hover:bg-green-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Check In</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/airline-progressive/lottery')}
              className="flex items-center justify-center space-x-2 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Trophy className="w-4 h-4" />
              <span>Win Upgrade</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/airline-progressive/bookings')}
              className="flex items-center justify-center space-x-2 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Ticket className="w-4 h-4" />
              <span>My Trips</span>
            </Button>
          </div>
        </div>

        {/* Save Progress CTA */}
        {isAnonymous && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white text-center">
            <h3 className="text-xl font-bold mb-2">Ready to Save Your Data?</h3>
            <p className="mb-4 text-blue-100">
              Create an account to save your bookings, loyalty points, and preferences permanently.
            </p>
            <Button 
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
              onClick={() => router.push('/auth/register')}
            >
              <BookmarkPlus className="w-5 h-5 mr-2" />
              Save My Airline Data
            </Button>
          </div>
        )}
      </main>
      </div>
    </div>
  )
}