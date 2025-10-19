/**
 * Receptionist Dashboard
 * Simplified dashboard for front-desk staff
 */
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  CreditCard,
  Search,
  UserPlus,
  Scissors,
  Sparkles,
  RefreshCw,
  Settings
} from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useSalonSecurity } from '@/hooks/useSalonSecurity'

export default function ReceptionistDashboard() {
  const router = useRouter()
  const { organization } = useSecuredSalonContext()
  const { user, role } = useSalonSecurity()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Redirect owner to their own dashboard
  React.useEffect(() => {
    if (role && role.toLowerCase() === 'owner') {
      router.push('/salon/dashboard')
    }
  }, [role, router])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Add refresh logic here
    setTimeout(() => setIsRefreshing(false), 800)
  }

  // Show loading if redirecting owner
  if (role && role.toLowerCase() === 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: LUXE_COLORS.black }}>
        <div className="text-center">
          <div className="text-lg font-medium" style={{ color: LUXE_COLORS.champagne }}>
            Redirecting to Owner Dashboard...
          </div>
        </div>
      </div>
    )
  }

  const quickActions = [
    { icon: UserPlus, label: 'New Appointment', href: '/salon/appointments/new', color: LUXE_COLORS.gold },
    { icon: CheckCircle, label: 'Check-In', href: '/salon/appointments', color: LUXE_COLORS.emerald },
    { icon: CreditCard, label: 'New Sale', href: '/salon/pos', color: LUXE_COLORS.plum },
    { icon: Users, label: 'Add Customer', href: '/salon/customers', color: LUXE_COLORS.bronze }
  ]

  const stats = [
    { label: "Today's Appointments", value: "12", icon: Calendar, color: LUXE_COLORS.gold },
    { label: 'Checked In', value: '8', icon: CheckCircle, color: LUXE_COLORS.emerald },
    { label: 'Pending', value: '4', icon: Clock, color: LUXE_COLORS.bronze },
    { label: 'Walk-Ins', value: '3', icon: Users, color: LUXE_COLORS.plum }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.black }}>
      {/* Elegant gradient background overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 10% 20%, ${LUXE_COLORS.gold}06 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, ${LUXE_COLORS.plum}04 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, ${LUXE_COLORS.emerald}03 0%, transparent 50%)
          `,
          opacity: 0.4
        }}
      />

      {/* Premium Header */}
      <div
        className="sticky top-0 z-30 mb-8"
        style={{
          background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`,
          border: `1px solid ${LUXE_COLORS.gold}20`,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px ${LUXE_COLORS.gold}10`,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Organization Icon */}
              <div
                className="p-4 rounded-xl transition-all duration-500 hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.gold}25 0%, ${LUXE_COLORS.gold}15 100%)`,
                  border: `1px solid ${LUXE_COLORS.gold}40`,
                  boxShadow: `0 0 20px ${LUXE_COLORS.gold}20`
                }}
              >
                <Scissors className="w-8 h-8" style={{ color: LUXE_COLORS.gold }} />
              </div>

              {/* Title and subtitle */}
              <div>
                <h1
                  className="text-4xl font-bold tracking-tight mb-1 flex items-center gap-3"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Receptionist Dashboard
                  <Sparkles className="w-6 h-6 animate-pulse" style={{ color: LUXE_COLORS.gold }} />
                </h1>
                <p
                  className="text-sm flex items-center gap-2"
                  style={{ color: LUXE_COLORS.bronze }}
                >
                  <span className="font-medium">Front Desk Operations</span>
                  <span>•</span>
                  <span>
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </p>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center gap-4">
              {/* User Info Card */}
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalDark}CC 0%, ${LUXE_COLORS.charcoal}CC 100%)`,
                  border: `1px solid ${LUXE_COLORS.bronze}30`,
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${LUXE_COLORS.gold}20 0%, ${LUXE_COLORS.gold}10 100%)`,
                    border: `1px solid ${LUXE_COLORS.gold}30`
                  }}
                >
                  <Users className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: LUXE_COLORS.champagne }}>
                    {user?.user_metadata?.full_name ||
                      user?.email?.split('@')[0] ||
                      localStorage.getItem('salonUserName') ||
                      'Receptionist'}
                  </div>
                  <div className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                    {user?.email || localStorage.getItem('salonUserEmail') || 'receptionist@hairtalkz.com'}
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.emerald}20 0%, ${LUXE_COLORS.emerald}10 100%)`,
                  border: `1px solid ${LUXE_COLORS.emerald}30`,
                  color: LUXE_COLORS.champagne,
                  boxShadow: isRefreshing ? `0 0 20px ${LUXE_COLORS.emerald}40` : undefined
                }}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Logout Button */}
              <Button
                onClick={async () => {
                  try {
                    const { supabase } = await import('@/lib/supabase/client')
                    await supabase.auth.signOut()
                    localStorage.removeItem('salonUserName')
                    localStorage.removeItem('salonUserEmail')
                    localStorage.removeItem('salonRole')
                    router.push('/salon-access')
                  } catch (error) {
                    console.error('Logout error:', error)
                    router.push('/salon-access')
                  }
                }}
                variant="outline"
                className="px-4 py-2.5 font-medium transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${LUXE_COLORS.ruby}20 0%, ${LUXE_COLORS.ruby}10 100%)`,
                  border: `1px solid ${LUXE_COLORS.ruby}40`,
                  color: LUXE_COLORS.ruby,
                  boxShadow: `0 0 0 1px ${LUXE_COLORS.ruby}20`
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: LUXE_COLORS.champagne }}>Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button key={index} onClick={() => router.push(action.href)} className="p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl" style={{ background: `linear-gradient(135deg, ${action.color}20 0%, ${action.color}10 100%)`, border: `1px solid ${action.color}40` }}>
                <action.icon className="w-8 h-8 mx-auto mb-3" style={{ color: action.color }} />
                <p className="text-sm font-medium text-center" style={{ color: LUXE_COLORS.champagne }}>{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: LUXE_COLORS.champagne }}>Today's Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0" style={{ background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`, border: `1px solid ${stat.color}20` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="w-8 h-8" style={{ color: stat.color }} />
                    <div className="text-3xl font-bold" style={{ color: LUXE_COLORS.champagne }}>{stat.value}</div>
                  </div>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="border-0" style={{ background: `linear-gradient(135deg, ${LUXE_COLORS.charcoalLight}E6 0%, ${LUXE_COLORS.charcoal}E6 100%)`, border: `1px solid ${LUXE_COLORS.gold}20` }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg" style={{ color: LUXE_COLORS.champagne }}>
              <Calendar className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="p-4 rounded-lg" style={{ background: `${LUXE_COLORS.charcoalDark}80`, border: `1px solid ${LUXE_COLORS.bronze}20` }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold" style={{ color: LUXE_COLORS.champagne }}>10:00 AM - Sarah Johnson</p>
                    <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: `${LUXE_COLORS.emerald}30`, color: LUXE_COLORS.emerald }}>Confirmed</span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: LUXE_COLORS.bronze }}>Haircut & Styling with Michele</p>
                  <Button size="sm" className="w-full" style={{ background: LUXE_COLORS.gold, color: LUXE_COLORS.charcoal }}>Check In</Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => router.push('/salon/appointments')} style={{ borderColor: LUXE_COLORS.gold, color: LUXE_COLORS.gold }}>View All Appointments</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
