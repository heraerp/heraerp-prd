'use client'

import { useEffect, useState } from 'react'
import { universalApi } from '@/lib/universal-api-v2'
import { Calendar, TrendingUp, Users, DollarSign, Clock, Sparkles, AlertCircle, RefreshCw, Heart, Star, Gift, Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { SalonCard, SalonStatCard } from '@/components/salon/SalonCard'

// Hardcoded organization ID from the SQL setup
const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b'

interface Appointment {
  id: string
  customer_name: string
  service_name: string
  time: string
  stylist_name: string
  status: string
}

export default function SalonDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    todayAppointments: 0,
    todayRevenue: 0,
    activeCustomers: 0,
    availableStaff: 0
  })
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    // Set the organization context
    universalApi.setOrganizationId(SALON_ORG_ID)
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load appointments (today's date filter)
      const today = new Date().toISOString().split('T')[0]
      const appointmentsResponse = await universalApi.getTransactions({
        filters: { 
          transaction_type: 'appointment',
          transaction_date: { gte: today }
        }
      })
      const todayAppointments = appointmentsResponse.success ? appointmentsResponse.data || [] : []

      // Load customers
      const customersResponse = await universalApi.getEntities({
        filters: { entity_type: 'customer' }
      })
      const customers = customersResponse.success ? customersResponse.data || [] : []

      // Load staff/stylists
      const staffResponse = await universalApi.getEntities({
        filters: { entity_type: 'employee' }
      })
      const staff = staffResponse.success ? staffResponse.data || [] : []

      // Load today's sales (revenue)
      const salesResponse = await universalApi.getTransactions({
        filters: { 
          transaction_type: 'sale',
          transaction_date: { gte: today }
        }
      })
      const sales = salesResponse.success ? salesResponse.data || [] : []
      const todayRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)

      // Format appointments for display
      const formattedAppointments = todayAppointments.slice(0, 5).map(apt => ({
        id: apt.id,
        customer_name: apt.metadata?.customer_name || 'Walk-in',
        service_name: apt.metadata?.service_name || 'Service',
        time: apt.metadata?.appointment_time || '00:00',
        stylist_name: apt.metadata?.stylist_name || 'Available',
        status: apt.metadata?.status || 'scheduled'
      }))

      setStats({
        todayAppointments: todayAppointments.length,
        todayRevenue,
        activeCustomers: customers.length,
        availableStaff: staff.filter(s => s.metadata?.available !== false).length
      })
      setAppointments(formattedAppointments)
    } catch (err: any) {
      console.error('Dashboard data error:', err)
      setError(err.message || 'Failed to load dashboard data')
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400'
      case 'scheduled': return 'text-[#DD97E2]'
      case 'in-progress': return 'text-[#8332EC]'
      case 'completed': return 'text-[#CE8A73]'
      default: return 'text-white/60'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-[#DD97E2] mx-auto mb-4" />
          <p className="text-white/60">Loading your salon dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Salon Dashboard
          </h1>
          <p className="text-white/60 mt-1">Welcome back! Here's your salon overview</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-[#DD97E2] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#DD97E2]/40 transition-all duration-300"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SalonStatCard
          label="Today's Appointments"
          value={stats.todayAppointments}
          icon={Calendar}
          trend={{ value: 12, isPositive: true }}
        />
        <SalonStatCard
          label="Today's Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 8, isPositive: true }}
        />
        <SalonStatCard
          label="Active Customers"
          value={stats.activeCustomers}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <SalonStatCard
          label="Available Staff"
          value={stats.availableStaff}
          icon={Heart}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <SalonCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Today's Appointments</h2>
              <span className="text-sm text-[#DD97E2]">{new Date().toLocaleDateString()}</span>
            </div>
            
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-[#DD97E2]">
                        <Scissors className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{apt.customer_name}</p>
                        <p className="text-sm text-white/60">{apt.service_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{apt.time}</p>
                      <p className="text-xs text-white/60">with {apt.stylist_name}</p>
                      <p className={`text-xs font-medium ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">No appointments scheduled for today</p>
              </div>
            )}
          </SalonCard>
        </div>

        {/* Quick Actions & Services */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <SalonCard>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full relative group">
                <div className="absolute -inset-0.5 bg-[#DD97E2] rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center space-x-2 px-4 py-3 bg-[#DD97E2] text-white rounded-lg font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment</span>
                </div>
              </button>
              
              <button className="w-full relative group">
                <div className="absolute -inset-0.5 bg-[#E7D8D5] rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center space-x-2 px-4 py-3 bg-[#E7D8D5] text-[#2D1B2E] rounded-lg font-medium">
                  <Users className="w-4 h-4" />
                  <span>Add Customer</span>
                </div>
              </button>
              
              <button className="w-full relative group">
                <div className="absolute -inset-0.5 bg-white/20 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center space-x-2 px-4 py-3 bg-white/20 text-white rounded-lg font-medium">
                  <DollarSign className="w-4 h-4" />
                  <span>Process Payment</span>
                </div>
              </button>
            </div>
          </SalonCard>

          {/* Popular Services */}
          <SalonCard>
            <h3 className="text-lg font-semibold text-white mb-4">Popular Services</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#DD97E2]" />
                  <span className="text-sm text-white/80">Hair Color</span>
                </div>
                <span className="text-sm font-medium text-[#DD97E2]">₹2,500</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#8332EC]" />
                  <span className="text-sm text-white/80">Hair Spa</span>
                </div>
                <span className="text-sm font-medium text-[#DD97E2]">₹1,800</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#CE8A73]" />
                  <span className="text-sm text-white/80">Haircut & Style</span>
                </div>
                <span className="text-sm font-medium text-[#DD97E2]">₹800</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-white/60" />
                  <span className="text-sm text-white/80">Facial</span>
                </div>
                <span className="text-sm font-medium text-[#DD97E2]">₹1,500</span>
              </div>
            </div>
          </SalonCard>
        </div>
      </div>
    </div>
  )
}