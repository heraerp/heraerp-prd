'use client'
/**
 * HERA Salon Modern Full-Screen Dashboard
 * Smart Code: HERA.SALON.MODERN.DASHBOARD.v1
 * 
 * Full-screen mobile-friendly modern salon interface
 */

import React, { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { salonApiClient } from '@/lib/salon/salon-api-client'
import { BookAppointmentModal } from '@/components/salon/BookAppointmentModal'
import type { DashboardData, Organization } from '@/types/salon.types'
import { handleError, withErrorHandler } from '@/lib/salon/error-handler'
import { universalConfigService } from '@/lib/universal-config/universal-config-service'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Star,
  Clock,
  Scissors,
  Package,
  Sparkles,
  CalendarCheck,
  UserCheck,
  TrendingUp,
  Plus,
  Loader2,
  RefreshCw,
  Heart,
  Crown,
  Palette,
  Gem,
  Zap,
  Instagram,
  Phone,
  MapPin,
  ChevronRight,
  Menu,
  X,
  MessageCircle,
  CreditCard,
  TrendingDown,
  BarChart3,
  Scale,
  TestTube,
  Rocket,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Default organization ID for salon - Hair Talkz Park Regis
const DEFAULT_SALON_ORG_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'

export default function SalonModernDashboard() {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [subdomainOrg, setSubdomainOrg] = useState<Organization | null>(null)
  const [loadingSubdomainOrg, setLoadingSubdomainOrg] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const isFetchingRef = useRef(false)
  const [data, setData] = useState<DashboardData>({
    appointments: 0,
    customers: 0,
    todayRevenue: 0,
    products: 0,
    recentAppointments: [],
    topServices: [],
    staffMembers: [],
    loading: true,
    error: null
  })
  const [salonConfig, setSalonConfig] = useState<any>({})
  const [configLoading, setConfigLoading] = useState(true)

  // Sample organization data for demo (always show for demo purposes)
  const salonOrganizations = [
    {
      id: "e3a9ff9e-bb83-43a8-b062-b85e7a2b4258",
      organization_code: "SALON-BR1",
      organization_name: "Hair Talkz • Park Regis Kris Kin (Karama)"
    },
    {
      id: "0b1b37cd-4096-4718-8cd4-e370f234005b",
      organization_code: "SALON-BR2",
      organization_name: "Hair Talkz • Mercure Gold (Al Mina Rd)"
    },
    {
      id: "849b6efe-2bf0-438f-9c70-01835ac2fe15",
      organization_code: "SALON-GROUP",
      organization_name: "Salon Group"
    }
  ]

  // Check for subdomain and get organization
  useEffect(() => {
    const checkSubdomain = async () => {
      if (typeof window === 'undefined') return

      const hostname = window.location.hostname
      console.log('Checking subdomain:', hostname)

      // Skip for localhost or if we already have an organization context
      if (hostname === 'localhost' || hostname.includes('localhost:')) {
        setLoadingSubdomainOrg(false)
        return
      }

      // Extract subdomain
      const parts = hostname.split('.')
      if (parts.length >= 3) { // e.g., acme.app.com or acme.vercel.app
        const subdomain = parts[0]
        if (subdomain && subdomain !== 'app' && subdomain !== 'www') {
          try {
            const response = await fetch(`/api/v1/organizations/by-subdomain/${subdomain}`)
            if (response.ok) {
              const orgData = await response.json()
              console.log('Found organization for subdomain:', orgData)
              setSubdomainOrg(orgData)
            } else {
              console.log('No organization found for subdomain:', subdomain)
            }
          } catch (error) {
            console.error('Error fetching subdomain org:', error)
          }
        }
      }

      setLoadingSubdomainOrg(false)
    }

    checkSubdomain()
  }, [])

  // Determine which organization to use
  const organizationId = subdomainOrg?.id || currentOrganization?.id || DEFAULT_SALON_ORG_ID
  const isHeadOffice = organizationId === '849b6efe-2bf0-438f-9c70-01835ac2fe15'

  // Track mouse for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setMousePosition({ x, y })
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      return () => container.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Load salon configuration using UCR
  const loadSalonConfig = useCallback(async () => {
    if (!organizationId) return

    setConfigLoading(true)
    try {
      // Set organization context for UCR service
      universalConfigService.setOrganizationId(organizationId)

      // Load key salon configuration rules
      const context = {
        organization_id: organizationId,
        business_type: 'salon',
        branch_id: organizationId, // Using org as branch for demo
        now: new Date(),
        utilization: 0.75 // Mock current utilization
      }

      // Resolve multiple configuration families
      const [bookingRules, pricingRules, notificationRules] = await Promise.all([
        universalConfigService.resolve({
          family: 'HERA.UNIV.CONFIG.BOOKING.AVAILABILITY',
          context
        }),
        universalConfigService.resolve({
          family: 'HERA.UNIV.CONFIG.PRICING.DISCOUNT', 
          context
        }),
        universalConfigService.resolve({
          family: 'HERA.UNIV.CONFIG.NOTIFICATION.SMS',
          context
        })
      ])

      // Extract configuration values
      const config = {
        booking: {
          advance_booking_days: bookingRules[0]?.payload?.max_advance_days || 30,
          min_lead_minutes: bookingRules[0]?.payload?.min_lead_minutes || 60,
          allow_same_day: bookingRules[0]?.payload?.allow_same_day || true,
          double_booking: bookingRules[0]?.payload?.allow_double_booking || false
        },
        pricing: {
          vip_discount: pricingRules[0]?.payload?.vip_discount_percentage || 10,
          peak_surcharge: pricingRules[0]?.payload?.peak_hour_surcharge || 1.2,
          cancellation_fee: pricingRules[0]?.payload?.cancellation_fee_percentage || 25
        },
        notifications: {
          reminder_hours: notificationRules[0]?.payload?.reminder_hours || [24, 2],
          sms_enabled: notificationRules[0]?.payload?.sms_enabled || true,
          email_enabled: notificationRules[0]?.payload?.email_enabled || true
        },
        rules_applied: {
          booking_rules: bookingRules.length,
          pricing_rules: pricingRules.length,
          notification_rules: notificationRules.length
        }
      }

      setSalonConfig(config)
      console.log('Salon configuration loaded:', config)
    } catch (error) {
      console.error('Failed to load salon configuration:', error)
      // Fallback to default configuration
      setSalonConfig({
        booking: { advance_booking_days: 30, min_lead_minutes: 60, allow_same_day: true },
        pricing: { vip_discount: 10, peak_surcharge: 1.2, cancellation_fee: 25 },
        notifications: { reminder_hours: [24, 2], sms_enabled: true, email_enabled: true },
        rules_applied: { booking_rules: 0, pricing_rules: 0, notification_rules: 0 }
      })
    } finally {
      setConfigLoading(false)
    }
  }, [organizationId])

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!organizationId || isFetchingRef.current) return

    console.log('Fetching dashboard data for organization:', organizationId)
    isFetchingRef.current = true
    setRefreshing(true)
    
    try {
      const dashboardData = await salonApiClient.getDashboardData(organizationId)
      console.log('Dashboard data fetched:', dashboardData)
      
      setData({
        appointments: dashboardData.appointments || 0,
        customers: dashboardData.customers || 0,
        todayRevenue: dashboardData.todayRevenue || 0,
        products: dashboardData.products || 0,
        recentAppointments: dashboardData.recentAppointments || [],
        topServices: dashboardData.topServices || [],
        staffMembers: dashboardData.staffMembers || [],
        loading: false,
        error: null
      })
    } catch (error) {
      const { message } = handleError(error, 'dashboard-fetch', {
        fallbackMessage: 'Failed to fetch dashboard data',
        showToast: true
      })
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: message 
      }))
    } finally {
      setRefreshing(false)
      isFetchingRef.current = false
    }
  }, [organizationId])

  // Initial data fetch
  useEffect(() => {
    if (organizationId) {
      loadSalonConfig()
      fetchDashboardData()
    }
  }, [organizationId, loadSalonConfig, fetchDashboardData])

  // Loading state
  if (contextLoading || loadingSubdomainOrg || data.loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 animate-pulse shadow-2xl" />
            <Scissors className="w-10 h-10 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-400 mt-4 font-medium">Loading your salon...</p>
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Today\'s Appointments',
      value: data.appointments.toString(),
      subtitle: 'appointments',
      icon: CalendarCheck,
      gradient: 'from-purple-500 to-purple-700',
      bgGradient: 'from-white to-purple-50/50',
      darkBgGradient: 'dark:from-gray-800 dark:to-gray-800/95'
    },
    {
      title: 'Active Clients',
      value: data.customers.toString(),
      subtitle: 'total clients',
      icon: UserCheck,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-white to-blue-50/50',
      darkBgGradient: 'dark:from-gray-800 dark:to-gray-800/95'
    },
    {
      title: 'Today\'s Revenue',
      value: `AED ${data.todayRevenue.toFixed(0)}`,
      subtitle: 'revenue',
      icon: DollarSign,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-white to-emerald-50/50',
      darkBgGradient: 'dark:from-gray-800 dark:to-gray-800/95'
    },
    {
      title: 'Products Sold',
      value: data.products.toString(),
      subtitle: 'products',
      icon: Package,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-white to-amber-50/50',
      darkBgGradient: 'dark:from-gray-800 dark:to-gray-800/95'
    }
  ]

  // Sample services data
  const services = [
    {
      name: 'Bridal Package Premium',
      duration: '6 hours',
      price: 'AED 800',
      category: 'Bridal',
      popular: true,
      icon: <Crown className="w-5 h-5" />,
      gradient: 'from-pink-400 to-rose-600'
    },
    {
      name: 'Keratin Treatment',
      duration: '3 hours',
      price: 'AED 350',
      category: 'Chemical Treatment',
      icon: <Sparkles className="w-5 h-5" />,
      gradient: 'from-indigo-400 to-purple-600'
    },
    {
      name: 'Hair Color & Highlights',
      duration: '3 hours',
      price: 'AED 280',
      category: 'Color',
      icon: <Palette className="w-5 h-5" />,
      gradient: 'from-rose-400 to-pink-600'
    },
    {
      name: 'Premium Cut & Style',
      duration: '1.5 hours',
      price: 'AED 150',
      category: 'Cut & Style',
      icon: <Scissors className="w-5 h-5" />,
      gradient: 'from-teal-400 to-emerald-600'
    },
    {
      name: 'Luxury Spa Treatment',
      duration: '2 hours',
      price: 'AED 300',
      category: 'Spa',
      icon: <Gem className="w-5 h-5" />,
      gradient: 'from-amber-400 to-orange-600'
    }
  ]

  // Use staff members from API data, or fallback to sample data
  const team = data.staffMembers.length > 0 ? data.staffMembers.map((staff, index) => ({
    name: staff.entity_name,
    title: staff.metadata?.title || 'Hair Stylist',
    specialties: staff.specialties || [],
    rating: staff.rating || 4.5,
    reviews: Math.floor(Math.random() * 250) + 50,
    instagram: staff.metadata?.instagram || `@${staff.entity_name.toLowerCase().replace(' ', '_')}`,
    avatar: staff.entity_name.charAt(0).toUpperCase(),
    gradient: [
      'from-purple-400 to-pink-600',
      'from-blue-400 to-indigo-600',
      'from-pink-400 to-rose-600',
      'from-amber-400 to-orange-600'
    ][index % 4],
    available: staff.available ?? true
  })) : [
    {
      name: 'Rocky',
      title: 'Celebrity Hair Artist',
      specialties: ['Brazilian Blowout', 'Bridal Styling', 'Color Specialist'],
      rating: 4.9,
      reviews: 247,
      instagram: '@rocky_hair_dubai',
      avatar: 'R',
      gradient: 'from-purple-400 to-pink-600',
      available: true
    },
    {
      name: 'Vinay',
      title: 'Senior Hair Stylist',
      specialties: ['Cutting Expert', 'Men\'s Styling', 'Color'],
      rating: 4.7,
      reviews: 156,
      instagram: '@vinay_styles',
      avatar: 'V',
      gradient: 'from-blue-400 to-indigo-600',
      available: true
    },
    {
      name: 'Maya',
      title: 'Color Specialist',
      specialties: ['Balayage', 'Color Correction', 'Highlights'],
      rating: 4.8,
      reviews: 189,
      instagram: '@maya_colorist',
      avatar: 'M',
      gradient: 'from-pink-400 to-rose-600',
      available: false
    },
    {
      name: 'Sophia',
      title: 'Bridal Specialist',
      specialties: ['Bridal Hair', 'Updos', 'Special Events'],
      rating: 4.9,
      reviews: 203,
      instagram: '@sophia_bridal',
      avatar: 'S',
      gradient: 'from-amber-400 to-orange-600',
      available: true
    }
  ]

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Sparkles className="w-5 h-5" />, href: '/salon-data' },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" />, href: '/salon-data/calendar' },
    { id: 'customers', label: 'Customers', icon: <Users className="w-5 h-5" />, href: '/salon-data/customers' },
    { id: 'services', label: 'Services', icon: <Scissors className="w-5 h-5" />, href: '/salon-data/services' },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-5 h-5" />, href: '/salon-data/inventory' },
    { id: 'pos', label: 'POS', icon: <CreditCard className="w-5 h-5" />, href: '/salon-data/pos' },
    { id: 'templates', label: 'Templates', icon: <FileText className="w-5 h-5" />, href: '/salon-data/templates', badge: 'New' },
    { id: 'config', label: 'UCR Rules', icon: <Scale className="w-5 h-5" />, href: '/salon-data/config' },
    { id: 'finance', label: 'Finance', icon: <TrendingDown className="w-5 h-5" />, href: '/salon-data/finance' },
    { id: 'pnl', label: 'P&L', icon: <BarChart3 className="w-5 h-5" />, href: '/salon-data/financials/p&l' },
    { id: 'bs', label: 'Balance Sheet', icon: <Scale className="w-5 h-5" />, href: '/salon-data/financials/bs' },
    { id: 'payroll', label: 'Payroll', icon: <DollarSign className="w-5 h-5" />, href: '/salon-data/payroll' },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-5 h-5" />, href: '/salon-data/whatsapp' }
  ]

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(0, 0, 0, 0.95) 0%, 
            rgba(17, 24, 39, 0.95) 25%,
            rgba(31, 41, 55, 0.9) 50%,
            rgba(17, 24, 39, 0.95) 75%,
            rgba(0, 0, 0, 0.95) 100%
          ),
          radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(147, 51, 234, 0.08) 0%, 
            rgba(59, 130, 246, 0.05) 25%,
            rgba(16, 185, 129, 0.03) 50%,
            transparent 70%
          ),
          #0a0a0a
        `
      }}
    >
      {/* WSAG Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Primary Light Orb */}
        <div 
          className="absolute w-96 h-96 rounded-full transition-all duration-[3000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(147, 51, 234, 0.15) 0%, 
              rgba(147, 51, 234, 0.08) 30%, 
              rgba(147, 51, 234, 0.02) 60%, 
              transparent 100%
            )`,
            filter: 'blur(60px)',
            left: `${20 + mousePosition.x * 0.1}%`,
            top: `${10 + mousePosition.y * 0.05}%`,
            transform: `translate(-50%, -50%) scale(${1 + mousePosition.x * 0.002})`
          }}
        />
        
        {/* Secondary Light Orb */}
        <div 
          className="absolute w-80 h-80 rounded-full transition-all duration-[4000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(59, 130, 246, 0.12) 0%, 
              rgba(59, 130, 246, 0.06) 30%, 
              rgba(59, 130, 246, 0.02) 60%, 
              transparent 100%
            )`,
            filter: 'blur(70px)',
            right: `${15 + mousePosition.x * 0.08}%`,
            top: `${60 + mousePosition.y * 0.03}%`,
            transform: `translate(50%, -50%) scale(${1 + mousePosition.y * 0.002})`
          }}
        />

        {/* Tertiary Light Orb */}
        <div 
          className="absolute w-64 h-64 rounded-full transition-all duration-[5000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(16, 185, 129, 0.1) 0%, 
              rgba(16, 185, 129, 0.05) 40%, 
              rgba(16, 185, 129, 0.01) 70%, 
              transparent 100%
            )`,
            filter: 'blur(50px)',
            left: `${70 + mousePosition.y * 0.06}%`,
            bottom: `${20 + mousePosition.x * 0.04}%`,
            transform: `translate(-50%, 50%) scale(${1 + (mousePosition.x + mousePosition.y) * 0.001})`
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10">
      {/* Header with WSAG Glassmorphism */}
      <header 
        className="sticky top-0 z-50 border-b shadow-lg"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(17, 24, 39, 0.85) 0%, 
              rgba(31, 41, 55, 0.8) 50%,
              rgba(17, 24, 39, 0.85) 100%
            )
          `,
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 4px 16px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3)
          `
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo with WSAG Glassmorphism */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transform transition-all duration-300 cursor-pointer"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(147, 51, 234, 0.15) 0%, 
                      rgba(59, 130, 246, 0.1) 100%
                    )
                  `,
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.4),
                    0 4px 16px rgba(147, 51, 234, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                  `,
                  transform: `perspective(1000px) rotateX(${mousePosition.y * 0.01 - 0.5}deg) rotateY(${mousePosition.x * 0.01 - 0.5}deg)`
                }}
              >
                <Scissors className="w-5 h-5 text-white drop-shadow-md" />
              </div>
              <div>
                <h1 className="text-xl font-bold !text-gray-900 dark:!text-white">
                  Hair Talkz
                </h1>
                <p className="text-xs !text-gray-600 dark:!text-gray-300 font-medium">
                  {isHeadOffice ? 'Head Office - All Branches' : 
                   (currentOrganization?.organization_name?.includes('•') 
                     ? currentOrganization.organization_name.split('•')[1]?.trim() 
                     : currentOrganization?.organization_name) || 'Dubai Marina'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation with WSAG Glassmorphism */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-500 hover:scale-105",
                    "!text-gray-700 dark:!text-gray-300 hover:!text-white"
                  )}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="bg-blue-500 text-white text-xs px-1.5 py-0.5 ml-1">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-gray-900/95 backdrop-blur-xl">
            <nav className="px-4 py-2 space-y-1">
              {navigationItems.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all",
                    "!text-gray-300 hover:bg-gray-800"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="bg-blue-500 text-white text-xs px-1.5 py-0.5 ml-1">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6 animate-fadeIn">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <Button 
                onClick={() => setIsBookingOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
              <Button 
                variant="outline" 
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>

            {/* Stats Grid with WSAG Glassmorphism */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsCards.map((stat, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-xl p-6 cursor-pointer group transition-all duration-700 hover:-translate-y-2"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(31, 41, 55, 0.85) 0%, 
                        rgba(17, 24, 39, 0.9) 100%
                      )
                    `,
                    backdropFilter: 'blur(20px) saturate(120%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: `
                      0 8px 32px rgba(0, 0, 0, 0.5),
                      0 4px 16px rgba(${
                        stat.gradient.includes('purple') ? '147, 51, 234' :
                        stat.gradient.includes('blue') ? '59, 130, 246' :
                        stat.gradient.includes('emerald') ? '16, 185, 129' : '245, 158, 11'
                      }, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.05)
                    `,
                    transform: `translateY(${Math.sin((Date.now() + index * 1000) * 0.001) * 2}px)`
                  }}
                >
                  {/* Animated Specular Highlight */}
                  <div 
                    className="absolute inset-0 transition-all duration-1000 opacity-30 group-hover:opacity-60"
                    style={{
                      background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                        rgba(255, 255, 255, 0.08) 0%, 
                        rgba(255, 255, 255, 0.03) 30%, 
                        transparent 70%
                      )`,
                      pointerEvents: 'none',
                      borderRadius: 'inherit'
                    }}
                  />
                  <div className={cn(
                    "absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br opacity-20",
                    stat.gradient,
                    "blur-2xl"
                  )} />
                  <div className="relative">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, 
                          rgba(${
                            stat.gradient.includes('purple') ? '147, 51, 234' :
                            stat.gradient.includes('blue') ? '59, 130, 246' :
                            stat.gradient.includes('emerald') ? '16, 185, 129' : '245, 158, 11'
                          }, 0.15) 0%, 
                          rgba(${
                            stat.gradient.includes('purple') ? '147, 51, 234' :
                            stat.gradient.includes('blue') ? '59, 130, 246' :
                            stat.gradient.includes('emerald') ? '16, 185, 129' : '245, 158, 11'
                          }, 0.05) 100%
                        )`,
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: `0 4px 16px rgba(${
                          stat.gradient.includes('purple') ? '147, 51, 234' :
                          stat.gradient.includes('blue') ? '59, 130, 246' :
                          stat.gradient.includes('emerald') ? '16, 185, 129' : '245, 158, 11'
                        }, 0.2)`
                      }}
                    >
                      <stat.icon className="w-6 h-6 text-white drop-shadow-md" />
                    </div>
                    <p className="text-3xl font-bold !text-gray-900 dark:!text-white relative z-10">
                      {stat.value}
                    </p>
                    <p className="text-sm !text-gray-700 dark:!text-gray-300 mt-1 font-medium">
                      {stat.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* UCR Configuration Display */}
            {!configLoading && salonConfig.rules_applied && (
              <div className="bg-white/10 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold !text-gray-900 dark:!text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-blue-400" />
                    Business Configuration Rules (UCR)
                  </h2>
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {salonConfig.rules_applied.booking_rules + salonConfig.rules_applied.pricing_rules + salonConfig.rules_applied.notification_rules} rules active
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Booking Configuration */}
                  <div className="bg-white/5 dark:bg-gray-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CalendarCheck className="w-4 h-4 text-purple-400" />
                      <h3 className="font-semibold !text-gray-900 dark:!text-white">Booking Rules</h3>
                      <Badge variant="secondary" className="text-xs">
                        {salonConfig.rules_applied.booking_rules} rules
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="!text-gray-700 dark:!text-gray-300">Advance booking:</span>
                        <span className="!text-gray-900 dark:!text-white font-medium">{salonConfig.booking?.advance_booking_days || 30} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="!text-gray-700 dark:!text-gray-300">Min lead time:</span>
                        <span className="!text-gray-900 dark:!text-white font-medium">{salonConfig.booking?.min_lead_minutes || 60} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="!text-gray-700 dark:!text-gray-300">Same day booking:</span>
                        <span className={cn("font-medium", 
                          salonConfig.booking?.allow_same_day ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {salonConfig.booking?.allow_same_day ? 'Allowed' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Configuration */}
                  <div className="bg-white/5 dark:bg-gray-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-semibold !text-gray-900 dark:!text-white">Pricing Rules</h3>
                      <Badge variant="secondary" className="text-xs">
                        {salonConfig.rules_applied.pricing_rules} rules
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="!text-gray-700 dark:!text-gray-300">VIP discount:</span>
                        <span className="!text-gray-900 dark:!text-white font-medium">{salonConfig.pricing?.vip_discount || 10}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="!text-gray-700 dark:!text-gray-300">Peak surcharge:</span>
                        <span className="!text-gray-900 dark:!text-white font-medium">{((salonConfig.pricing?.peak_surcharge || 1.2) - 1) * 100}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="!text-gray-700 dark:!text-gray-300">Cancellation fee:</span>
                        <span className="!text-gray-900 dark:!text-white font-medium">{salonConfig.pricing?.cancellation_fee || 25}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Notification Configuration */}
                  <div className="bg-white/5 dark:bg-gray-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                      <h3 className="font-semibold !text-gray-900 dark:!text-white">Notification Rules</h3>
                      <Badge variant="secondary" className="text-xs">
                        {salonConfig.rules_applied.notification_rules} rules
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="!text-gray-700 dark:!text-gray-300">Reminders:</span>
                        <span className="!text-gray-900 dark:!text-white font-medium">{salonConfig.notifications?.reminder_hours?.join(', ') || '24, 2'}h before</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="!text-gray-700 dark:!text-gray-300">SMS enabled:</span>
                        <span className={cn("font-medium", 
                          salonConfig.notifications?.sms_enabled ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {salonConfig.notifications?.sms_enabled ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="!text-gray-700 dark:!text-gray-300">Email enabled:</span>
                        <span className={cn("font-medium", 
                          salonConfig.notifications?.email_enabled ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {salonConfig.notifications?.email_enabled ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50/10 dark:bg-blue-900/20 rounded-lg border border-blue-200/20 dark:border-blue-700/30">
                  <p className="text-xs !text-gray-700 dark:!text-gray-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-blue-400" />
                    Configuration loaded via HERA Universal Configuration Rules (UCR) - Smart Codes: HERA.UNIV.CONFIG.*
                  </p>
                </div>
              </div>
            )}

            {/* Configuration Loading State */}
            {configLoading && (
              <div className="bg-white/10 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="!text-gray-700 dark:!text-gray-300">Loading salon configuration...</span>
                </div>
              </div>
            )}

            {/* UCR Management Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* UCR Templates Quick Access */}
              <Card 
                className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200/20 dark:border-purple-700/30 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-500 cursor-pointer group"
                style={{
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold !text-gray-900 dark:!text-white mb-1">
                          Business Rule Templates
                        </h3>
                        <p className="text-sm !text-gray-600 dark:!text-gray-400">
                          Ready-to-use configurations
                        </p>
                      </div>
                    </div>
                    <Link href="/salon-data/templates">
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      >
                        Browse
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                      Booking Rules
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300">
                      Pricing
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                      Notifications
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* UCR Dashboard Access */}
              <Card 
                className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-200/20 dark:border-blue-700/30 hover:from-blue-500/20 hover:to-indigo-500/20 transition-all duration-500 cursor-pointer group"
                style={{
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold !text-gray-900 dark:!text-white mb-1">
                          UCR Control Center
                        </h3>
                        <p className="text-sm !text-gray-600 dark:!text-gray-400">
                          Chat & manage rules with AI
                        </p>
                      </div>
                    </div>
                    <Link href="/salon-data/config">
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      >
                        Open
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="!text-gray-700 dark:!text-gray-300">AI Ready</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      MCP Orchestrator
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Services Grid */}
            <div>
              <h2 className="text-2xl font-bold !text-gray-900 dark:!text-white mb-6 text-center">
                Popular Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service, index) => (
                  <Card
                    key={index}
                    className="bg-white/10 dark:bg-gray-800/70 backdrop-blur-xl border-gray-700 hover:bg-white/20 dark:hover:bg-gray-800/80 transition-all duration-300 transform hover:scale-105 cursor-pointer overflow-hidden group"
                    style={{
                      background: `
                        linear-gradient(135deg, 
                          rgba(31, 41, 55, 0.7) 0%, 
                          rgba(17, 24, 39, 0.8) 100%
                        )
                      `,
                      backdropFilter: 'blur(20px) saturate(120%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className={cn("h-2 bg-gradient-to-r", service.gradient)} />
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "w-12 h-12 rounded-lg bg-gradient-to-r flex items-center justify-center",
                          service.gradient,
                          "shadow-lg"
                        )}>
                          {service.icon}
                        </div>
                        {service.popular && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold !text-gray-900 dark:!text-white mb-2">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm !text-gray-600 dark:!text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration}</span>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                        <span className="text-sm !text-gray-600 dark:!text-gray-400">
                          {service.category}
                        </span>
                        <span className="text-lg font-bold !text-gray-900 dark:!text-white">
                          {service.price}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Team Section */}
            <div>
              <h2 className="text-2xl font-bold !text-gray-900 dark:!text-white mb-6 text-center">
                Our Expert Team
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {team.map((member, index) => (
                  <Card
                    key={index}
                    className="bg-white/10 dark:bg-gray-800/70 backdrop-blur-xl border-gray-700 hover:bg-white/20 dark:hover:bg-gray-800/80 transition-all duration-300 transform hover:scale-105 overflow-hidden group"
                    style={{
                      background: `
                        linear-gradient(135deg, 
                          rgba(31, 41, 55, 0.7) 0%, 
                          rgba(17, 24, 39, 0.8) 100%
                        )
                      `,
                      backdropFilter: 'blur(20px) saturate(120%)',
                      WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={cn(
                        "w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r flex items-center justify-center text-2xl font-bold text-white shadow-xl",
                        member.gradient
                      )}>
                        {member.avatar}
                      </div>
                      <h3 className="text-lg font-semibold !text-gray-900 dark:!text-white mb-1">
                        {member.name}
                      </h3>
                      <p className="text-sm !text-gray-600 dark:!text-gray-400 mb-3">
                        {member.title}
                      </p>
                      <div className="flex items-center justify-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-4 h-4",
                              i < Math.floor(member.rating)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-600"
                            )}
                          />
                        ))}
                        <span className="text-sm !text-gray-600 dark:!text-gray-400 ml-1">
                          {member.rating}
                        </span>
                      </div>
                      <p className="text-xs !text-gray-600 dark:!text-gray-400 mb-3">
                        {member.reviews} reviews
                      </p>
                      <Badge
                        variant={member.available ? "default" : "secondary"}
                        className={cn(
                          "text-xs",
                          member.available
                            ? "bg-green-500/20 text-green-300 border-green-500/50"
                            : "bg-gray-500/20 text-gray-300 border-gray-500/50"
                        )}
                      >
                        {member.available ? "Available" : "Busy"}
                      </Badge>
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex flex-wrap gap-1 justify-center mb-2">
                          {member.specialties.slice(0, 2).map((specialty, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs border-gray-600 text-gray-300"
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs !text-gray-600 dark:!text-gray-400 flex items-center justify-center gap-1">
                          <Instagram className="w-3 h-3" />
                          {member.instagram}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* UCR Activity Summary */}
            <div className="mb-6">
              <Card
                className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-200/20 dark:border-indigo-700/30"
                style={{
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-white">
                      <Scale className="w-5 h-5 text-indigo-400" />
                      UCR Activity
                    </CardTitle>
                    <Link href="/salon-data/config?tab=rules">
                      <Button variant="ghost" size="sm" className="text-xs">
                        View All
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Active Rules */}
                    <div className="bg-white/5 dark:bg-gray-900/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Active Rules</span>
                      </div>
                      <p className="text-2xl font-bold !text-gray-900 dark:!text-white">
                        {salonConfig.rules_applied ? 
                          salonConfig.rules_applied.booking_rules + 
                          salonConfig.rules_applied.pricing_rules + 
                          salonConfig.rules_applied.notification_rules : 0}
                      </p>
                    </div>

                    {/* Draft Rules */}
                    <div className="bg-white/5 dark:bg-gray-900/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-yellow-400" />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Draft Rules</span>
                      </div>
                      <p className="text-2xl font-bold !text-gray-900 dark:!text-white">3</p>
                    </div>

                    {/* Tests Run */}
                    <div className="bg-white/5 dark:bg-gray-900/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <TestTube className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Tests Run</span>
                      </div>
                      <p className="text-2xl font-bold !text-gray-900 dark:!text-white">24</p>
                    </div>

                    {/* Recent Deployments */}
                    <div className="bg-white/5 dark:bg-gray-900/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Rocket className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Deployments</span>
                      </div>
                      <p className="text-2xl font-bold !text-gray-900 dark:!text-white">7</p>
                    </div>
                  </div>

                  {/* Recent Activity Timeline */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">Recent Activity</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span className="!text-gray-700 dark:!text-gray-300">Deployed "Salon Cancellation Policy" to production</span>
                        <span className="text-gray-500 ml-auto">2h ago</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <span className="!text-gray-700 dark:!text-gray-300">Tested "VIP Discount Rules" - 100% pass rate</span>
                        <span className="text-gray-500 ml-auto">5h ago</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                        <span className="!text-gray-700 dark:!text-gray-300">Created new rule from "Peak Hour Pricing" template</span>
                        <span className="text-gray-500 ml-auto">1d ago</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Appointments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card
                className="bg-white/10 dark:bg-gray-800/70 backdrop-blur-xl border-gray-700"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(31, 41, 55, 0.7) 0%, 
                      rgba(17, 24, 39, 0.8) 100%
                    )
                  `,
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-white">
                    <CalendarCheck className="w-5 h-5 text-purple-400" />
                    Recent Appointments
                  </CardTitle>
                  <CardDescription className="!text-gray-600 dark:!text-gray-400">
                    Latest customer bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.recentAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {data.recentAppointments.slice(0, 5).map((appointment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium !text-gray-900 dark:!text-white">
                                {appointment.customer_name || 'Guest Customer'}
                              </p>
                              <p className="text-sm !text-gray-600 dark:!text-gray-400">
                                {appointment.service_name || 'General Service'} • {appointment.staff_name || 'Any Staff'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium !text-gray-900 dark:!text-white">
                              {appointment.transaction_date ? new Date(appointment.transaction_date).toLocaleDateString() : 'N/A'}
                            </p>
                            <p className="text-xs !text-gray-600 dark:!text-gray-400">
                              {appointment.status || 'Confirmed'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarCheck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="!text-gray-600 dark:!text-gray-400">
                        No recent appointments
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card
                className="bg-white/10 dark:bg-gray-800/70 backdrop-blur-xl border-gray-700"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(31, 41, 55, 0.7) 0%, 
                      rgba(17, 24, 39, 0.8) 100%
                    )
                  `,
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-white">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Top Services
                  </CardTitle>
                  <CardDescription className="!text-gray-600 dark:!text-gray-400">
                    Most booked services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.topServices.length > 0 ? (
                    <div className="space-y-3">
                      {data.topServices.slice(0, 5).map((service, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full bg-gradient-to-r flex items-center justify-center",
                              index === 0 ? "from-amber-500 to-orange-500" :
                              index === 1 ? "from-purple-500 to-pink-500" :
                              index === 2 ? "from-blue-500 to-cyan-500" :
                              "from-gray-500 to-gray-600"
                            )}>
                              <Scissors className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium !text-gray-900 dark:!text-white">
                                {service.entity_name || service.service_name || 'Service'}
                              </p>
                              <p className="text-sm !text-gray-600 dark:!text-gray-400">
                                AED {service.price || 0}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium !text-gray-900 dark:!text-white">
                              {service.metadata?.booking_count || 0} bookings
                            </p>
                            <p className="text-xs !text-gray-600 dark:!text-gray-400">
                              {service.metadata?.percentage || 0}% of total
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="!text-gray-600 dark:!text-gray-400">
                        No service data available
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
      </main>

      {/* Floating Action Button (Mobile) */}
      <button 
        onClick={() => setIsBookingOpen(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white transform hover:scale-110 transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-800 bg-gray-900/50 backdrop-blur-xl">
        <div className="px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold !text-gray-900 dark:!text-white mb-4">
                Hair Talkz {isHeadOffice ? '- All Branches' : ''}
              </h3>
              <p className="!text-gray-600 dark:!text-gray-400 text-sm">
                Premium hair salon services in Dubai. Expert stylists, premium products, exceptional service.
              </p>
            </div>
            <div>
              <h4 className="font-semibold !text-gray-900 dark:!text-white mb-3">Contact</h4>
              <div className="space-y-2 text-sm !text-gray-600 dark:!text-gray-400">
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  +971 4 123 4567
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Park Regis Kris Kin, Karama, Dubai
                </p>
                <p className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  @hairtalkzdubai
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold !text-gray-900 dark:!text-white mb-3">Hours</h4>
              <div className="space-y-1 text-sm !text-gray-600 dark:!text-gray-400">
                <p>Monday - Friday: 9:00 AM - 9:00 PM</p>
                <p>Saturday: 9:00 AM - 10:00 PM</p>
                <p>Sunday: 10:00 AM - 8:00 PM</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm !text-gray-600 dark:!text-gray-400">
            <p>© 2024 Hair Talkz Dubai. All rights reserved. Powered by HERA ERP.</p>
          </div>
        </div>
      </footer>

      {/* Book Appointment Modal */}
      <BookAppointmentModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBookingComplete={(booking) => {
          // Booking completed successfully
          setIsBookingOpen(false)
          // Refresh dashboard data
          fetchDashboardData()
        }}
      />
      
      </div>
    </div>
  )
}