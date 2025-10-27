// Force dynamic rendering to prevent SSG issues with SecuredSalonProvider
export const dynamic = "force-dynamic";

'use client'

import { useState, useEffect } from 'react'
import { useSecuredSalonContext } from '../EnterpriseSecuredSalonProvider'
import { SalonAuthGuard } from '@/components/salon/auth/SalonAuthGuard'
import { universalApi } from '@/lib/universal-api-v2'
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Download,
  Filter,
  ChevronRight
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { cn } from '@/lib/utils'
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
  emerald: '#0F6F5C'
}

interface ReportCard {
  id: string
  title: string
  description: string
  icon: any
  href?: string
  color: string
  category: 'financial' | 'operational' | 'analytics'
  requiredRoles: string[]
}

const reportCards: ReportCard[] = [
  {
    id: 'revenue',
    title: 'Revenue Report',
    description: 'Track sales, services, and product revenue by period',
    icon: TrendingUp,
    href: '/salon/finance#revenue',
    color: COLORS.emerald,
    category: 'financial',
    requiredRoles: ['owner', 'accountant', 'administrator']
  },
  {
    id: 'pnl',
    title: 'Profit & Loss',
    description: 'Complete P&L statement with expense breakdowns',
    icon: BarChart3,
    href: '/salon/finance#pnl',
    color: COLORS.gold,
    category: 'financial',
    requiredRoles: ['owner', 'accountant']
  },
  {
    id: 'branch-pnl',
    title: 'Branch P&L',
    description: 'Compare financial performance across branches',
    icon: BarChart3,
    href: '/salon/reports/branch-pnl',
    color: COLORS.bronze,
    category: 'financial',
    requiredRoles: ['owner', 'accountant']
  },
  {
    id: 'customer-analytics',
    title: 'Customer Analytics',
    description: 'Customer retention, frequency, and spending patterns',
    icon: Users,
    href: '#',
    color: COLORS.champagne,
    category: 'analytics',
    requiredRoles: ['owner', 'administrator', 'receptionist']
  },
  {
    id: 'staff-performance',
    title: 'Staff Performance',
    description: 'Employee productivity, services, and commission reports',
    icon: Users,
    href: '#',
    color: COLORS.emerald,
    category: 'operational',
    requiredRoles: ['owner', 'administrator']
  },
  {
    id: 'appointment-analytics',
    title: 'Appointment Analytics',
    description: 'Booking patterns, no-shows, and capacity utilization',
    icon: Calendar,
    href: '#',
    color: COLORS.gold,
    category: 'operational',
    requiredRoles: ['owner', 'administrator', 'receptionist']
  },
  {
    id: 'inventory',
    title: 'Inventory Report',
    description: 'Stock levels, usage patterns, and reorder suggestions',
    icon: Package,
    href: '#',
    color: COLORS.bronze,
    category: 'operational',
    requiredRoles: ['owner', 'administrator']
  },
  {
    id: 'service-analytics',
    title: 'Service Analytics',
    description: 'Popular services, pricing analysis, and trends',
    icon: FileText,
    href: '#',
    color: COLORS.champagne,
    category: 'analytics',
    requiredRoles: ['owner', 'administrator']
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow',
    description: 'Daily cash positions and payment method breakdowns',
    icon: DollarSign,
    href: '/salon/finance#cashflow',
    color: COLORS.emerald,
    category: 'financial',
    requiredRoles: ['owner', 'accountant']
  }
]

interface ReportStats {
  totalRevenue: number
  totalCustomers: number
  totalAppointments: number
  averageTicket: number
}

function ReportsContent() {
  const { organizationId, role } = useSecuredSalonContext()
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'financial' | 'operational' | 'analytics'
  >('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ReportStats>({
    totalRevenue: 0,
    totalCustomers: 0,
    totalAppointments: 0,
    averageTicket: 0
  })
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })

  useEffect(() => {
    if (!organizationId) return
    loadStats()
  }, [organizationId])

  const loadStats = async () => {
    if (!organizationId) return

    try {
      setLoading(true)

      // Set organization context for universal API
      universalApi.setOrganizationId(organizationId)

      // Load basic stats (you can expand this with real data)
      // For now, using mock data
      setStats({
        totalRevenue: 125000,
        totalCustomers: 342,
        totalAppointments: 1250,
        averageTicket: 100
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter reports based on category and user role
  const filteredReports = reportCards.filter(report => {
    const categoryMatch = selectedCategory === 'all' || report.category === selectedCategory
    const roleMatch = report.requiredRoles.some(r => r.toLowerCase() === role?.toLowerCase())
    return categoryMatch && roleMatch
  })

  if (!organizationId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.black }}
      >
        <div
          className="text-center p-8 rounded-xl"
          style={{
            backgroundColor: COLORS.charcoal,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h2 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
            Loading...
          </h2>
          <p style={{ color: COLORS.lightText, opacity: 0.7 }}>Setting up reports.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.black }}>
      <div
        className="rounded-2xl p-8"
        style={{
          backgroundColor: COLORS.charcoal,
          border: `1px solid ${COLORS.gold}20`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <span style={{ color: COLORS.bronze }}>HERA</span>
          <ChevronRight className="w-4 h-4" style={{ color: COLORS.bronze }} />
          <span style={{ color: COLORS.bronze }}>SALON OS</span>
          <ChevronRight className="w-4 h-4" style={{ color: COLORS.bronze }} />
          <span style={{ color: COLORS.champagne }}>Reports</span>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{
                background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Reports & Analytics
            </h1>
            <p style={{ color: COLORS.bronze }}>
              Comprehensive insights into your salon performance
            </p>
          </div>
          <Button
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
              color: COLORS.black,
              border: 'none'
            }}
            className="hover:opacity-90"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All Reports
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Revenue',
              value: `$${stats.totalRevenue.toLocaleString()}`,
              desc: 'This month',
              icon: DollarSign,
              color: COLORS.emerald
            },
            {
              title: 'Total Customers',
              value: stats.totalCustomers,
              desc: 'Active customers',
              icon: Users,
              color: COLORS.gold
            },
            {
              title: 'Appointments',
              value: stats.totalAppointments,
              desc: 'This month',
              icon: Calendar,
              color: COLORS.bronze
            },
            {
              title: 'Average Ticket',
              value: `$${stats.averageTicket}`,
              desc: 'Per appointment',
              icon: TrendingUp,
              color: COLORS.champagne
            }
          ].map((stat, index) => (
            <Card
              key={index}
              style={{
                backgroundColor: COLORS.charcoalLight,
                border: `1px solid ${COLORS.gold}20`,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: COLORS.bronze }}>
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
                  {stat.value}
                </div>
                <p className="text-xs" style={{ color: COLORS.bronze }}>
                  {stat.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-4 mb-6">
          <span style={{ color: COLORS.bronze }}>Filter by category:</span>
          <div className="flex gap-2">
            {['all', 'financial', 'operational', 'analytics'].map(category => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category as any)}
                style={{
                  backgroundColor: selectedCategory === category ? COLORS.gold : 'transparent',
                  borderColor: COLORS.gold,
                  color: selectedCategory === category ? COLORS.black : COLORS.champagne
                }}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map(report => (
            <Link
              key={report.id}
              href={report.href || '#'}
              className="block transition-all duration-200 hover:scale-[1.02]"
            >
              <Card
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.gold}20`,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                  cursor: report.href ? 'pointer' : 'not-allowed',
                  opacity: report.href ? 1 : 0.7
                }}
                className="h-full"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <report.icon className="h-8 w-8" style={{ color: report.color }} />
                    {!report.href && (
                      <Badge
                        style={{
                          backgroundColor: `${COLORS.bronze}20`,
                          color: COLORS.bronze,
                          border: `1px solid ${COLORS.bronze}40`
                        }}
                      >
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-3" style={{ color: COLORS.champagne }}>
                    {report.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm" style={{ color: COLORS.bronze }}>
                    {report.description}
                  </p>
                  <div className="mt-3">
                    <Badge
                      style={{
                        backgroundColor: `${report.color}20`,
                        color: report.color,
                        border: `1px solid ${report.color}40`
                      }}
                    >
                      {report.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.bronze }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: COLORS.champagne }}>
              No reports available
            </h3>
            <p style={{ color: COLORS.bronze }}>
              You don't have access to any reports in this category.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <SalonAuthGuard
      requiredRoles={[
        'Owner',
        'Accountant',
        'Administrator',
        'owner',
        'accountant',
        'administrator'
      ]}
    >
      <ReportsContent />
    </SalonAuthGuard>
  )
}
