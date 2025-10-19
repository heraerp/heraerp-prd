/**
 * Receptionist Dashboard
 * Simplified dashboard for front-desk staff
 */
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  CreditCard,
  Search,
  UserPlus
} from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import { useRouter } from 'next/navigation'

export default function ReceptionistDashboard() {
  const router = useRouter()

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
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: LUXE_COLORS.black }}>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Receptionist Dashboard
        </h1>
        <p className="text-sm sm:text-base" style={{ color: LUXE_COLORS.bronze }}>
          Manage appointments, check-ins, and front desk operations
        </p>
      </div>

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
  )
}
