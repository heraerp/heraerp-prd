'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/luxe-card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Star,
  Package,
  UserCheck,
  Clock,
  Scissors,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Crown,
  TrendingDown,
  FileText,
  Settings,
  Building,
  CreditCard,
  Heart
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { universalApi } from '@/lib/universal-api'
import Link from 'next/link'

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#B794F4',
  emerald: '#0F6F5C',
  ruby: '#DC2626'
}

// Michele's salon organization ID
const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: {
    value: number
    isUp: boolean
  }
  gradientFrom?: string
  gradientTo?: string
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  gradientFrom = COLORS.gold,
  gradientTo = COLORS.goldDark
}: MetricCardProps) {
  return (
    <Card
      className="relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
      style={{
        backgroundColor: COLORS.charcoalLight,
        border: `1px solid ${COLORS.bronze}20`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: `radial-gradient(circle at 100% 0%, ${gradientFrom} 0%, transparent 50%)`
        }}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle 
          className="text-sm font-light tracking-wider uppercase"
          style={{ color: COLORS.bronze }}
        >
          {title}
        </CardTitle>
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
            boxShadow: `0 2px 10px ${gradientFrom}40`
          }}
        >
          <Icon className="h-5 w-5" style={{ color: COLORS.black }} />
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="text-3xl font-light tracking-wide"
          style={{ color: COLORS.champagne }}
        >
          {value}
        </div>
        {subtitle && (
          <p 
            className="text-xs mt-2 font-light"
            style={{ color: `${COLORS.bronze}90` }}
          >
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.bronze}20` }}>
            {trend.isUp ? (
              <ArrowUpRight className="h-4 w-4" style={{ color: COLORS.emerald }} />
            ) : (
              <ArrowDownRight className="h-4 w-4" style={{ color: COLORS.ruby }} />
            )}
            <span
              className="text-sm font-light"
              style={{
                color: trend.isUp ? COLORS.emerald : COLORS.ruby
              }}
            >
              {trend.value}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuickActionButton({
  icon: Icon,
  label,
  href,
  description
}: {
  icon: React.ElementType
  label: string
  href: string
  description?: string
}) {
  return (
    <Link href={href}>
      <Card
        className="group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
        style={{
          backgroundColor: COLORS.charcoalLight,
          border: `1px solid ${COLORS.bronze}20`,
        }}
      >
        <CardContent className="p-6 text-center">
          <div
            className="h-14 w-14 rounded-xl mx-auto mb-4 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${COLORS.bronze} 0%, ${COLORS.gold} 100%)`,
              boxShadow: `0 2px 10px ${COLORS.gold}30`
            }}
          >
            <Icon className="h-7 w-7" style={{ color: COLORS.black }} />
          </div>
          <h3 
            className="font-medium tracking-wide mb-1"
            style={{ color: COLORS.champagne }}
          >
            {label}
          </h3>
          {description && (
            <p 
              className="text-xs font-light"
              style={{ color: `${COLORS.bronze}80` }}
            >
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export default function HairTalkzOwnerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [dashboardData, setDashboardData] = useState({
    todayRevenue: 0,
    monthlyRevenue: 0,
    activeAppointments: 0,
    newCustomers: 0,
    staffPresent: 0,
    productsSold: 0,
    averageRating: 0,
    pendingPayments: 0
  })

  useEffect(() => {
    checkAuth()
    loadDashboardData()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.replace('/salon/auth')
        return
      }

      const userMetadata = session.user.user_metadata
      const userRole = userMetadata?.role?.toLowerCase() || localStorage.getItem('salonRole')?.toLowerCase()
      
      // Just set the username, don't redirect if already on the right page
      setUserName(userMetadata.full_name || localStorage.getItem('salonUserName') || 'Owner')
      
      // Only redirect if user has wrong role
      if (userRole && userRole !== 'owner') {
        const redirectMap: Record<string, string> = {
          'receptionist': '/salon/receptionist',
          'accountant': '/salon/accountant',
          'admin': '/salon/admin'
        }
        
        const redirectPath = redirectMap[userRole]
        if (redirectPath) {
          router.replace(redirectPath)
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.replace('/salon/auth')
    }
  }

  const loadDashboardData = async () => {
    try {
      universalApi.setOrganizationId(HAIRTALKZ_ORG_ID)
      
      // Load today's transactions
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      
      // Get transactions for revenue
      const { data: transactions } = await universalApi.read('universal_transactions')
      const todayTransactions = transactions?.filter((t: any) => 
        new Date(t.created_at) >= todayStart && 
        t.transaction_type === 'sale'
      ) || []
      
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      
      const monthTransactions = transactions?.filter((t: any) => 
        new Date(t.created_at) >= monthStart && 
        t.transaction_type === 'sale'
      ) || []

      // Calculate metrics
      const todayRevenue = todayTransactions.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0)
      const monthlyRevenue = monthTransactions.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0)

      // Get entities for other metrics
      const { data: entities } = await universalApi.read('core_entities')
      const customers = entities?.filter((e: any) => e.entity_type === 'customer') || []
      const newCustomersThisMonth = customers.filter((c: any) => 
        new Date(c.created_at) >= monthStart
      ).length

      // Mock some data for demo
      setDashboardData({
        todayRevenue,
        monthlyRevenue,
        activeAppointments: 12,
        newCustomers: newCustomersThisMonth || 47,
        staffPresent: 8,
        productsSold: 24,
        averageRating: 4.9,
        pendingPayments: 3
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.charcoal }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: COLORS.gold }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.charcoal }}>
      {/* Header */}
      <div 
        className="border-b px-8 py-6"
        style={{ 
          backgroundColor: COLORS.charcoalLight,
          borderColor: `${COLORS.bronze}20`
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-3xl font-light tracking-wider flex items-center gap-3"
              style={{ color: COLORS.champagne }}
            >
              <Crown className="h-8 w-8" style={{ color: COLORS.gold }} />
              Welcome back, Michele
            </h1>
            <p 
              className="text-sm font-light mt-1"
              style={{ color: COLORS.bronze }}
            >
              Here's your salon performance overview
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="font-light"
              style={{
                borderColor: COLORS.bronze,
                color: COLORS.champagne
              }}
              asChild
            >
              <Link href="/salon/reports/branch-pnl">
                <FileText className="h-4 w-4 mr-2" />
                View Reports
              </Link>
            </Button>
            
            <Button
              className="font-light"
              style={{
                backgroundColor: COLORS.gold,
                color: COLORS.black
              }}
              asChild
            >
              <Link href="/salon/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Today's Revenue"
            value={`AED ${dashboardData.todayRevenue.toLocaleString()}`}
            subtitle="12 transactions"
            icon={DollarSign}
            trend={{ value: 18, isUp: true }}
            gradientFrom={COLORS.emerald}
            gradientTo={COLORS.gold}
          />
          
          <MetricCard
            title="Monthly Revenue"
            value={`AED ${dashboardData.monthlyRevenue.toLocaleString()}`}
            subtitle="Target: AED 180,000"
            icon={TrendingUp}
            trend={{ value: 24, isUp: true }}
            gradientFrom={COLORS.gold}
            gradientTo={COLORS.goldDark}
          />
          
          <MetricCard
            title="Active Appointments"
            value={dashboardData.activeAppointments}
            subtitle="Next: 2:30 PM"
            icon={Calendar}
            gradientFrom={COLORS.plum}
            gradientTo="#9333EA"
          />
          
          <MetricCard
            title="New Customers"
            value={dashboardData.newCustomers}
            subtitle="This month"
            icon={Users}
            trend={{ value: 12, isUp: true }}
            gradientFrom="#06B6D4"
            gradientTo="#0891B2"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Staff Present"
            value={`${dashboardData.staffPresent}/10`}
            subtitle="2 on leave"
            icon={UserCheck}
            gradientFrom="#10B981"
            gradientTo="#059669"
          />
          
          <MetricCard
            title="Products Sold"
            value={dashboardData.productsSold}
            subtitle="Today"
            icon={Package}
            trend={{ value: 8, isUp: true }}
            gradientFrom="#F59E0B"
            gradientTo="#D97706"
          />
          
          <MetricCard
            title="Average Rating"
            value={dashboardData.averageRating}
            subtitle="Last 30 days"
            icon={Star}
            gradientFrom="#EAB308"
            gradientTo="#CA8A04"
          />
          
          <MetricCard
            title="Pending Payments"
            value={dashboardData.pendingPayments}
            subtitle="AED 4,500"
            icon={CreditCard}
            gradientFrom="#EF4444"
            gradientTo="#DC2626"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 
            className="text-xl font-light tracking-wider mb-6"
            style={{ color: COLORS.champagne }}
          >
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              icon={FileText}
              label="Daily Sales Report"
              href="/salon/reports/branch-pnl"
              description="View today's performance"
            />
            
            <QuickActionButton
              icon={BarChart3}
              label="P&L Statement"
              href="/salon-data/financials/p&l"
              description="Monthly profit & loss"
            />
            
            <QuickActionButton
              icon={Building}
              label="Balance Sheet"
              href="/salon-data/financials/bs"
              description="Financial position"
            />
            
            <QuickActionButton
              icon={Users}
              label="Staff Performance"
              href="/salon/staff"
              description="Team analytics"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <Card
          style={{
            backgroundColor: COLORS.charcoalLight,
            border: `1px solid ${COLORS.bronze}20`
          }}
        >
          <CardHeader>
            <CardTitle className="text-xl font-light tracking-wider flex items-center gap-3">
              <Clock className="h-5 w-5" style={{ color: COLORS.gold }} />
              <span style={{ color: COLORS.champagne }}>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '10 mins ago', action: 'New appointment booked', client: 'Sarah Johnson', service: 'Hair Color & Style' },
                { time: '25 mins ago', action: 'Payment received', amount: 'AED 450', method: 'Credit Card' },
                { time: '1 hour ago', action: 'Product sale', product: 'Luxury Hair Serum', qty: '2 units' },
                { time: '2 hours ago', action: 'Staff check-in', staff: 'Maria Lopez', role: 'Senior Stylist' }
              ].map((activity, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-4 pb-4"
                  style={{ borderBottom: idx < 3 ? `1px solid ${COLORS.bronze}20` : undefined }}
                >
                  <div 
                    className="text-xs font-light"
                    style={{ color: COLORS.bronze, minWidth: '80px' }}
                  >
                    {activity.time}
                  </div>
                  <div className="flex-1">
                    <p style={{ color: COLORS.champagne }} className="text-sm">
                      {activity.action}
                    </p>
                    <p 
                      className="text-xs font-light mt-1"
                      style={{ color: `${COLORS.bronze}80` }}
                    >
                      {activity.client && `Client: ${activity.client}`}
                      {activity.service && ` • ${activity.service}`}
                      {activity.amount && `Amount: ${activity.amount}`}
                      {activity.method && ` • ${activity.method}`}
                      {activity.product && `${activity.product}`}
                      {activity.qty && ` • ${activity.qty}`}
                      {activity.staff && `${activity.staff}`}
                      {activity.role && ` • ${activity.role}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}