'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useSalonSecurity } from '@/hooks/useSalonSecurity'
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
  ChevronRight,
  AlertCircle,
  ArrowRight,
  Clock,
  CalendarDays,
  Sparkles
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import Link from 'next/link'
import { LUXE_COLORS } from '@/lib/constants/salon'

interface ReportCard {
  id: string
  title: string
  description: string
  icon: any
  href?: string
  color: string
  category: 'financial' | 'operational' | 'analytics'
  requiredRoles: string[]
  featured?: boolean
}

const reportCards: ReportCard[] = [
  {
    id: 'daily-sales',
    title: 'Daily Sales Report',
    description: 'Hourly revenue breakdown with real-time GL tracking',
    icon: Calendar,
    href: '/salon/reports/sales/daily',
    color: LUXE_COLORS.emerald,
    category: 'financial',
    requiredRoles: ['ORG_OWNER'],
    featured: true
  },
  {
    id: 'monthly-sales',
    title: 'Monthly Sales Report',
    description: 'Daily trends and growth analysis from GL data',
    icon: BarChart3,
    href: '/salon/reports/sales/monthly',
    color: LUXE_COLORS.gold,
    category: 'financial',
    requiredRoles: ['ORG_OWNER'],
    featured: true
  },
  {
    id: 'revenue',
    title: 'Revenue Report',
    description: 'Track sales, services, and product revenue by period',
    icon: TrendingUp,
    href: '/salon/finance#revenue',
    color: LUXE_COLORS.emerald,
    category: 'financial',
    requiredRoles: ['ORG_OWNER']
  },
  {
    id: 'pnl',
    title: 'Profit & Loss',
    description: 'Complete P&L statement with expense breakdowns',
    icon: BarChart3,
    href: '/salon/finance#pnl',
    color: LUXE_COLORS.gold,
    category: 'financial',
    requiredRoles: ['ORG_OWNER']
  },
  {
    id: 'branch-pnl',
    title: 'Branch P&L',
    description: 'Compare financial performance across branches',
    icon: BarChart3,
    href: '/salon/reports/branch-pnl',
    color: LUXE_COLORS.bronze,
    category: 'financial',
    requiredRoles: ['ORG_OWNER']
  },
  {
    id: 'customer-analytics',
    title: 'Customer Analytics',
    description: 'Customer retention, frequency, and spending patterns',
    icon: Users,
    href: '#',
    color: LUXE_COLORS.champagne,
    category: 'analytics',
    requiredRoles: ['ORG_OWNER']
  },
  {
    id: 'staff-performance',
    title: 'Staff Performance',
    description: 'Employee productivity, services, and commission reports',
    icon: Users,
    href: '#',
    color: LUXE_COLORS.emerald,
    category: 'operational',
    requiredRoles: ['ORG_OWNER']
  },
  {
    id: 'appointment-analytics',
    title: 'Appointment Analytics',
    description: 'Booking patterns, no-shows, and capacity utilization',
    icon: Calendar,
    href: '#',
    color: LUXE_COLORS.gold,
    category: 'operational',
    requiredRoles: ['ORG_OWNER']
  },
  {
    id: 'inventory',
    title: 'Inventory Report',
    description: 'Stock levels, usage patterns, and reorder suggestions',
    icon: Package,
    href: '#',
    color: LUXE_COLORS.bronze,
    category: 'operational',
    requiredRoles: ['ORG_OWNER']
  },
  {
    id: 'service-analytics',
    title: 'Service Analytics',
    description: 'Popular services, pricing analysis, and trends',
    icon: FileText,
    href: '#',
    color: LUXE_COLORS.champagne,
    category: 'analytics',
    requiredRoles: ['ORG_OWNER']
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow',
    description: 'Daily cash positions and payment method breakdowns',
    icon: DollarSign,
    href: '/salon/finance#cashflow',
    color: LUXE_COLORS.emerald,
    category: 'financial',
    requiredRoles: ['ORG_OWNER']
  }
]

interface ReportStats {
  totalRevenue: number
  totalCustomers: number
  totalAppointments: number
  averageTicket: number
}

export default function ReportsPage() {
  const router = useRouter()
  const { organizationId, role } = useSecuredSalonContext()
  const { isAuthenticated, role: userRole } = useSalonSecurity()
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

  // Auth check (matching dashboard pattern)
  if (!isAuthenticated || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: LUXE_COLORS.black }}>
        <Alert className="border-red-200 bg-red-50 max-w-md">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {!isAuthenticated
              ? 'Please log in to access reports.'
              : 'No role assigned. Please contact your administrator.'}
            <button
              onClick={() => router.push('/salon-access')}
              className="ml-2 underline hover:no-underline"
            >
              Go to Login
            </button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const currentRole = (role || userRole)?.toUpperCase()

  useEffect(() => {
    if (!organizationId) return
    loadStats()
  }, [organizationId])

  const loadStats = async () => {
    if (!organizationId) return

    try {
      setLoading(true)
      universalApi.setOrganizationId(organizationId)

      // TODO: Load real stats from API
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
    const roleMatch = report.requiredRoles.some(r => r === currentRole)
    return categoryMatch && roleMatch
  })

  const featuredReports = filteredReports.filter(r => r.featured)
  const regularReports = filteredReports.filter(r => !r.featured)

  if (!organizationId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <div
          className="text-center p-8 rounded-xl"
          style={{
            backgroundColor: LUXE_COLORS.charcoal,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h2 className="text-xl font-medium mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Loading...
          </h2>
          <p style={{ color: LUXE_COLORS.lightText, opacity: 0.7 }}>Setting up reports.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: LUXE_COLORS.black }}>
      {/* Mobile Header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      <div className="md:hidden sticky top-0 z-50 mb-6" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: `${LUXE_COLORS.gold}20` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${LUXE_COLORS.gold}20` }}>
              <BarChart3 className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: LUXE_COLORS.champagne }}>Reports</h1>
              <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>Analytics & Insights</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-4 md:p-8 max-w-7xl mx-auto"
        style={{
          backgroundColor: LUXE_COLORS.charcoal,
          border: `1px solid ${LUXE_COLORS.gold}20`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Desktop Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-sm mb-6">
          <span style={{ color: LUXE_COLORS.bronze }}>HERA</span>
          <ChevronRight className="w-4 h-4" style={{ color: LUXE_COLORS.bronze }} />
          <span style={{ color: LUXE_COLORS.bronze }}>SALON OS</span>
          <ChevronRight className="w-4 h-4" style={{ color: LUXE_COLORS.bronze }} />
          <span style={{ color: LUXE_COLORS.champagne }}>Reports</span>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{
                background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Reports & Analytics
            </h1>
            <p style={{ color: LUXE_COLORS.bronze }}>
              Comprehensive insights into your salon performance
            </p>
          </div>
          <Button
            style={{
              background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
              color: LUXE_COLORS.black,
              border: 'none'
            }}
            className="hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All Reports
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
          {[
            {
              title: 'Total Revenue',
              value: `AED ${stats.totalRevenue.toLocaleString()}`,
              desc: 'This month',
              icon: DollarSign,
              color: LUXE_COLORS.emerald
            },
            {
              title: 'Customers',
              value: stats.totalCustomers,
              desc: 'Active',
              icon: Users,
              color: LUXE_COLORS.gold
            },
            {
              title: 'Appointments',
              value: stats.totalAppointments,
              desc: 'This month',
              icon: Calendar,
              color: LUXE_COLORS.bronze
            },
            {
              title: 'Avg Ticket',
              value: `AED ${stats.averageTicket}`,
              desc: 'Per visit',
              icon: TrendingUp,
              color: LUXE_COLORS.champagne
            }
          ].map((stat, index) => (
            <Card
              key={index}
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.gold}20`,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium" style={{ color: LUXE_COLORS.bronze }}>
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                  {stat.value}
                </div>
                <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  {stat.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Featured Sales Reports - Prominent Section */}
        {featuredReports.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: LUXE_COLORS.gold }} />
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                  Sales Reports
                </h2>
              </div>
              <Badge
                style={{
                  backgroundColor: `${LUXE_COLORS.emerald}20`,
                  color: LUXE_COLORS.emerald,
                  border: `1px solid ${LUXE_COLORS.emerald}40`
                }}
              >
                GL-Powered
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {featuredReports.map(report => (
                <Link
                  key={report.id}
                  href={report.href || '#'}
                  className="block group"
                >
                  <Card
                    style={{
                      backgroundColor: LUXE_COLORS.charcoalLight,
                      border: `2px solid ${LUXE_COLORS.gold}30`,
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                      cursor: 'pointer'
                    }}
                    className="h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="p-3 rounded-xl"
                          style={{
                            backgroundColor: `${report.color}20`,
                            border: `1px solid ${report.color}40`
                          }}
                        >
                          <report.icon className="h-6 w-6 md:h-8 md:w-8" style={{ color: report.color }} />
                        </div>
                        <ArrowRight
                          className="h-5 w-5 transition-transform group-hover:translate-x-1"
                          style={{ color: LUXE_COLORS.gold }}
                        />
                      </div>
                      <CardTitle className="text-lg md:text-xl font-bold" style={{ color: LUXE_COLORS.champagne }}>
                        {report.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4" style={{ color: LUXE_COLORS.bronze }}>
                        {report.description}
                      </p>
                      <div className="flex items-center gap-2">
                        {report.id === 'daily-sales' && (
                          <div className="flex items-center gap-2 text-xs" style={{ color: LUXE_COLORS.emerald }}>
                            <Clock className="w-4 h-4" />
                            <span>Hourly Breakdown</span>
                          </div>
                        )}
                        {report.id === 'monthly-sales' && (
                          <div className="flex items-center gap-2 text-xs" style={{ color: LUXE_COLORS.gold }}>
                            <CalendarDays className="w-4 h-4" />
                            <span>Daily Trends</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-6">
          <span className="text-sm md:text-base font-medium" style={{ color: LUXE_COLORS.bronze }}>
            Filter by category:
          </span>
          <div className="flex flex-wrap gap-2">
            {['all', 'financial', 'operational', 'analytics'].map(category => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category as any)}
                style={{
                  backgroundColor: selectedCategory === category ? LUXE_COLORS.gold : 'transparent',
                  borderColor: LUXE_COLORS.gold,
                  color: selectedCategory === category ? LUXE_COLORS.black : LUXE_COLORS.champagne
                }}
                className="hover:opacity-80 transition-opacity"
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Other Reports Grid */}
        {regularReports.length > 0 && (
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-4" style={{ color: LUXE_COLORS.champagne }}>
              All Reports
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {regularReports.map(report => (
                <Link
                  key={report.id}
                  href={report.href || '#'}
                  className="block transition-all duration-200 hover:scale-[1.02]"
                >
                  <Card
                    style={{
                      backgroundColor: LUXE_COLORS.charcoalLight,
                      border: `1px solid ${LUXE_COLORS.gold}20`,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                      cursor: report.href ? 'pointer' : 'not-allowed',
                      opacity: report.href ? 1 : 0.7
                    }}
                    className="h-full"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <report.icon className="h-6 w-6 md:h-8 md:w-8" style={{ color: report.color }} />
                        {!report.href && (
                          <Badge
                            style={{
                              backgroundColor: `${LUXE_COLORS.bronze}20`,
                              color: LUXE_COLORS.bronze,
                              border: `1px solid ${LUXE_COLORS.bronze}40`
                            }}
                          >
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base md:text-lg mt-3" style={{ color: LUXE_COLORS.champagne }}>
                        {report.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
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
          </div>
        )}

        {/* Empty State */}
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: LUXE_COLORS.bronze }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: LUXE_COLORS.champagne }}>
              No reports available
            </h3>
            <p style={{ color: LUXE_COLORS.bronze }}>
              You don't have access to any reports in this category.
            </p>
          </div>
        )}
      </div>

      {/* Mobile Bottom Spacing */}
      <div className="h-24 md:h-0" />
    </div>
  )
}
