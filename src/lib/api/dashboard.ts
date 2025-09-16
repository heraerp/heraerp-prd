// ================================================================================
// HERA DASHBOARD API HOOKS
// Smart Code: HERA.API.DASHBOARD.v1
// React Query hooks for dashboard data
// ================================================================================

import { useQuery, useMutation } from '@tanstack/react-query'
import { universalApi } from '@/src/lib/universal-api'

export interface DashboardMetrics {
  // General metrics
  grossSales: number
  netRevenue: number
  appointmentsToday: number
  averageTicketSize: number
  whatsappDelivered: number
  lowStockCount: number
  
  // Financial metrics
  monthlyRevenue?: number
  outstandingReceivables?: number
  monthlyExpenses?: number
  netProfitMargin?: number
}

export interface StaffMetrics {
  staffId: string
  staffName: string
  utilization: number
  appointmentsCompleted: number
  revenue: number
}

export interface AppointmentData {
  id: string
  customerName: string
  serviceName: string
  time: string
  staffName: string
  status: string
}

export interface AlertData {
  id: string
  type: 'warning' | 'error' | 'info'
  message: string
  action?: string
  actionUrl?: string
}

/**
 * Fetch dashboard metrics
 */
export function useDashboardMetrics(organizationId: string) {
  return useQuery({
    queryKey: ['dashboard-metrics', organizationId],
    queryFn: async () => {
      if (!organizationId) return null
      
      // Fetch transactions for today
      const today = new Date().toISOString().split('T')[0]
      const transactions = await universalApi.read({
        table: 'universal_transactions',
        filter: {
          organization_id: organizationId,
          transaction_type: 'sale',
          transaction_date: today
        }
      })
      
      // Calculate metrics
      const grossSales = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      const netRevenue = grossSales * 0.85 // Assuming 15% costs
      
      // Mock other metrics for now
      return {
        grossSales,
        netRevenue,
        appointmentsToday: 12,
        averageTicketSize: grossSales / Math.max(transactions.length, 1),
        whatsappDelivered: 45,
        lowStockCount: 3,
        monthlyRevenue: grossSales * 30,
        outstandingReceivables: 5420,
        monthlyExpenses: grossSales * 0.65,
        netProfitMargin: 22.5
      } as DashboardMetrics
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

/**
 * Fetch staff utilization metrics
 */
export function useStaffMetrics(organizationId: string) {
  return useQuery({
    queryKey: ['staff-metrics', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      
      // Mock staff metrics
      return [
        { staffId: '1', staffName: 'Sarah Johnson', utilization: 85, appointmentsCompleted: 8, revenue: 680 },
        { staffId: '2', staffName: 'Maria Garcia', utilization: 72, appointmentsCompleted: 6, revenue: 520 },
        { staffId: '3', staffName: 'Emily Chen', utilization: 90, appointmentsCompleted: 9, revenue: 820 },
        { staffId: '4', staffName: 'Lisa Williams', utilization: 68, appointmentsCompleted: 5, revenue: 450 }
      ] as StaffMetrics[]
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000 // 10 minutes
  })
}

/**
 * Fetch upcoming appointments
 */
export function useUpcomingAppointments(organizationId: string) {
  return useQuery({
    queryKey: ['upcoming-appointments', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      
      // Mock appointments
      return [
        { id: '1', customerName: 'Jane Smith', serviceName: 'Hair Color & Cut', time: '10:00 AM', staffName: 'Sarah', status: 'confirmed' },
        { id: '2', customerName: 'Emma Wilson', serviceName: 'Manicure & Pedicure', time: '11:30 AM', staffName: 'Maria', status: 'confirmed' },
        { id: '3', customerName: 'Olivia Brown', serviceName: 'Hair Treatment', time: '2:00 PM', staffName: 'Emily', status: 'pending' },
        { id: '4', customerName: 'Sophia Davis', serviceName: 'Facial', time: '3:30 PM', staffName: 'Lisa', status: 'confirmed' }
      ] as AppointmentData[]
    },
    enabled: !!organizationId,
    staleTime: 1 * 60 * 1000 // 1 minute
  })
}

/**
 * Fetch dashboard alerts
 */
export function useDashboardAlerts(organizationId: string) {
  return useQuery({
    queryKey: ['dashboard-alerts', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      
      // Mock alerts
      const alerts: AlertData[] = []
      
      // Check for low stock
      const lowStockCount = 3
      if (lowStockCount > 0) {
        alerts.push({
          id: 'low-stock',
          type: 'warning',
          message: `${lowStockCount} products are running low on stock`,
          action: 'View Products',
          actionUrl: '/inventory/alerts'
        })
      }
      
      // Check for pending appointments
      alerts.push({
        id: 'pending-appts',
        type: 'info',
        message: '2 appointments need confirmation',
        action: 'View Appointments',
        actionUrl: '/appointments?status=pending'
      })
      
      return alerts
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

/**
 * Fetch revenue data for sparkline
 */
export function useRevenueData(organizationId: string, days: number = 7) {
  return useQuery({
    queryKey: ['revenue-data', organizationId, days],
    queryFn: async () => {
      if (!organizationId) return []
      
      // Generate mock data for the last N days
      const data = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        
        // Mock revenue between 500-1500
        const revenue = 500 + Math.random() * 1000
        
        data.push({
          date: date.toISOString().split('T')[0],
          revenue: Math.round(revenue)
        })
      }
      
      return data
    },
    enabled: !!organizationId,
    staleTime: 15 * 60 * 1000 // 15 minutes
  })
}