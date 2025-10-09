/**
 * Salon Owner Dashboard (Luxe Version)
 *
 * Premium salon owner dashboard with mobile-optimized layout,
 * luxurious design, and comprehensive business metrics.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { LuxeCard, SalonStatsCard, SalonTeamCard } from '@/components/ui/salon/luxe-card'
import { LuxeButton, SalonActionButton, SalonQuickAction } from '@/components/ui/salon/luxe-button'
import { MobileLayout, ResponsiveGrid, MobileContainer } from '@/components/salon/mobile-layout'
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Star,
  Scissors,
  Sparkles,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Plus,
  ChevronRight,
  Activity,
  Crown,
  Gem,
  Zap,
  Heart,
  Award
} from 'lucide-react'

interface DashboardData {
  todayStats: {
    revenue: number
    appointments: number
    clients: number
    avgRating: number
  }
  weeklyGrowth: {
    revenue: number
    clients: number
    bookings: number
  }
  chairStatus: Array<{
    id: string
    stylist: string
    client?: string
    service?: string
    timeRemaining?: number
    status: 'occupied' | 'available' | 'break'
  }>
  topStylists: Array<{
    id: string
    name: string
    avatar?: string
    revenue: number
    clients: number
    rating: number
    status: 'online' | 'offline'
  }>
  recentTransactions: Array<{
    id: string
    type: string
    amount: number
    description: string
    time: string
  }>
  upcomingTasks: Array<{
    id: string
    task: string
    priority: 'high' | 'medium' | 'low'
    dueTime: string
  }>
}

export default function SalonOwnerDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [selectedView, setSelectedView] = useState('overview')

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    loadDashboardData()
    return () => clearInterval(timer)
  }, [])

  const loadDashboardData = async () => {
    // Mock data - in production, this would fetch from the MDA system
    setDashboardData({
      todayStats: {
        revenue: 8450,
        appointments: 32,
        clients: 28,
        avgRating: 4.8
      },
      weeklyGrowth: {
        revenue: 12.5,
        clients: 8.3,
        bookings: 15.2
      },
      chairStatus: [
        {
          id: '1',
          stylist: 'Sarah M.',
          client: 'Emma Johnson',
          service: 'Hair Color',
          timeRemaining: 45,
          status: 'occupied'
        },
        { id: '2', stylist: 'Maya K.', status: 'available' },
        {
          id: '3',
          stylist: 'Alex R.',
          client: 'Lisa Chen',
          service: 'Cut & Style',
          timeRemaining: 25,
          status: 'occupied'
        },
        { id: '4', stylist: 'Jordan T.', status: 'break' },
        {
          id: '5',
          stylist: 'Taylor S.',
          client: 'Maria Garcia',
          service: 'Highlights',
          timeRemaining: 90,
          status: 'occupied'
        },
        { id: '6', stylist: 'Casey L.', status: 'available' }
      ],
      topStylists: [
        {
          id: '1',
          name: 'Sarah Mitchell',
          avatar: '/avatars/sarah.jpg',
          revenue: 2850,
          clients: 12,
          rating: 4.9,
          status: 'online'
        },
        {
          id: '2',
          name: 'Maya Patel',
          avatar: '/avatars/maya.jpg',
          revenue: 2240,
          clients: 9,
          rating: 4.8,
          status: 'online'
        },
        {
          id: '3',
          name: 'Alex Rodriguez',
          avatar: '/avatars/alex.jpg',
          revenue: 1980,
          clients: 8,
          rating: 4.7,
          status: 'offline'
        },
        {
          id: '4',
          name: 'Taylor Chen',
          avatar: '/avatars/taylor.jpg',
          revenue: 1750,
          clients: 7,
          rating: 4.8,
          status: 'online'
        }
      ],
      recentTransactions: [
        {
          id: '1',
          type: 'Service',
          amount: 185,
          description: 'Hair Color - Emma J.',
          time: '2:30 PM'
        },
        {
          id: '2',
          type: 'Product',
          amount: 45,
          description: 'Shampoo Set - Lisa C.',
          time: '2:15 PM'
        },
        {
          id: '3',
          type: 'Service',
          amount: 120,
          description: 'Cut & Style - Maria G.',
          time: '1:45 PM'
        },
        { id: '4', type: 'Tip', amount: 25, description: 'Tip - Sarah M.', time: '1:30 PM' }
      ],
      upcomingTasks: [
        { id: '1', task: 'Review weekly inventory', priority: 'high', dueTime: '4:00 PM' },
        { id: '2', task: 'Staff meeting preparation', priority: 'medium', dueTime: '5:30 PM' },
        { id: '3', task: 'Monthly expense review', priority: 'low', dueTime: 'Tomorrow' }
      ]
    })
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-500" />
          <p>Loading your salon dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <MobileLayout>
      <MobileContainer maxWidth="full" padding={false}>
        <div className="px-4 md:px-6 lg:px-8">
          {/* Quick Stats */}
          <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 4, xl: 4 }} className="mb-6 md:mb-8">
            <SalonStatsCard
              title="Today's Revenue"
              value={`$${dashboardData.todayStats.revenue.toLocaleString()}`}
              subtitle={`+${dashboardData.weeklyGrowth.revenue}% this week`}
              trend="up"
              icon={<DollarSign className="h-6 w-6" />}
              color="gold"
            />

            <SalonStatsCard
              title="Appointments"
              value={dashboardData.todayStats.appointments}
              subtitle={`+${dashboardData.weeklyGrowth.bookings}% this week`}
              trend="up"
              icon={<Calendar className="h-6 w-6" />}
              color="purple"
            />

            <SalonStatsCard
              title="Active Clients"
              value={dashboardData.todayStats.clients}
              subtitle={`+${dashboardData.weeklyGrowth.clients}% this week`}
              trend="up"
              icon={<Users className="h-6 w-6" />}
              color="rose"
            />

            <SalonStatsCard
              title="Avg Rating"
              value={dashboardData.todayStats.avgRating.toFixed(1)}
              subtitle="Based on 124 reviews"
              trend="up"
              icon={<Star className="h-6 w-6" />}
              color="blue"
            />
          </ResponsiveGrid>

          {/* Main Content */}
          <ResponsiveGrid
            cols={{ sm: 1, md: 1, lg: 3, xl: 3 }}
            className="items-start gap-6 md:gap-8"
          >
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* Chair Status */}
              <LuxeCard
                variant="glass"
                title="Salon Floor Status"
                description="Real-time chair occupancy"
                icon={<Scissors className="h-5 w-5 text-purple-500" />}
                action={
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    4/6 Active
                  </Badge>
                }
              >
                <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3, xl: 3 }}>
                  {dashboardData.chairStatus.map(chair => (
                    <div
                      key={chair.id}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        chair.status === 'occupied'
                          ? 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20'
                          : chair.status === 'available'
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                            : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">Chair {chair.id}</h4>
                        <Badge
                          variant={
                            chair.status === 'occupied'
                              ? 'default'
                              : chair.status === 'available'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={`text-xs ${
                            chair.status === 'occupied'
                              ? 'bg-purple-100 text-purple-700'
                              : chair.status === 'available'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {chair.status}
                        </Badge>
                      </div>

                      <p className="text-sm font-medium mb-1">{chair.stylist}</p>

                      {chair.client && (
                        <>
                          <p className="text-xs text-gray-600 mb-1">{chair.client}</p>
                          <p className="text-xs text-gray-500 mb-2">{chair.service}</p>
                          {chair.timeRemaining && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span>Time remaining</span>
                                <span className="font-medium">{chair.timeRemaining}m</span>
                              </div>
                              <Progress
                                value={((120 - chair.timeRemaining) / 120) * 100}
                                className="h-2"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </ResponsiveGrid>
              </LuxeCard>

              {/* Performance Chart */}
              <LuxeCard
                variant="floating"
                title="Performance Analytics"
                description="Revenue and booking trends"
                icon={<BarChart3 className="h-5 w-5 text-purple-500" />}
              >
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-purple-50 to-rose-50 dark:from-purple-900/20 dark:to-rose-900/20 rounded-xl">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                    <p className="text-gray-600">Interactive chart coming soon</p>
                    <p className="text-sm text-gray-500">Revenue trending +15% this month</p>
                  </div>
                </div>
              </LuxeCard>
            </div>

            {/* Right Column */}
            <div className="space-y-6 md:space-y-8">
              {/* Quick Actions */}
              <LuxeCard
                variant="gradient"
                gradientType="sunset"
                title="Quick Actions"
                className="text-white"
              >
                <ResponsiveGrid cols={{ sm: 2, md: 2, lg: 2, xl: 2 }}>
                  <SalonQuickAction icon={<Plus />} label="New Booking" variant="glass" />
                  <SalonQuickAction icon={<DollarSign />} label="Add Payment" variant="glass" />
                  <SalonQuickAction icon={<Users />} label="Staff Check-in" variant="glass" />
                  <SalonQuickAction icon={<Settings />} label="Settings" variant="glass" />
                </ResponsiveGrid>
              </LuxeCard>

              {/* Top Stylists */}
              <LuxeCard
                variant="floating"
                title="Top Performers Today"
                description="Leading stylists by revenue"
                icon={<Award className="h-5 w-5 text-gold-500" />}
              >
                <div className="space-y-3">
                  {dashboardData.topStylists.map((stylist, index) => (
                    <SalonTeamCard
                      key={stylist.id}
                      name={stylist.name}
                      role={`#${index + 1} Today`}
                      avatar={stylist.avatar}
                      online={stylist.status === 'online'}
                      stats={[
                        { label: 'Revenue', value: `$${stylist.revenue}` },
                        { label: 'Clients', value: stylist.clients.toString() },
                        { label: 'Rating', value: `${stylist.rating}⭐` }
                      ]}
                    />
                  ))}
                </div>
              </LuxeCard>

              {/* Recent Activity */}
              <LuxeCard
                variant="floating"
                title="Recent Transactions"
                description="Latest financial activity"
                icon={<Activity className="h-5 w-5 text-purple-500" />}
              >
                <div className="space-y-3">
                  {dashboardData.recentTransactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">{transaction.description}</p>
                        <p className="text-xs text-gray-600">{transaction.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          +${transaction.amount}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <LuxeButton
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4"
                  icon={<ChevronRight className="h-4 w-4" />}
                  iconPosition="right"
                >
                  View All Transactions
                </LuxeButton>
              </LuxeCard>
            </div>
          </ResponsiveGrid>

          {/* Bottom Actions */}
          <div className="mt-6 md:mt-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <SalonActionButton
                action="Schedule Staff"
                icon={<Calendar className="h-5 w-5" />}
                color="purple"
                className="flex-1 sm:flex-none"
              />
              <SalonActionButton
                action="Financial Reports"
                icon={<BarChart3 className="h-5 w-5" />}
                color="gold"
                className="flex-1 sm:flex-none"
              />
              <SalonActionButton
                action="Inventory Check"
                count={3}
                icon={<Gem className="h-5 w-5" />}
                color="rose"
                className="flex-1 sm:flex-none"
              />
            </div>
          </div>
        </div>
      </MobileContainer>
    </MobileLayout>
  )
}
