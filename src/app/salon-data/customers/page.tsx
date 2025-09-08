'use client'
/**
 * HERA Salon Customer Master & CRM
 * Smart Code: HERA.SALON.CRM.CUSTOMER.PROFILE.v1
 * 
 * Complete customer management with preferences, loyalty, memberships,
 * gift cards, deposits, and full activity history - all on 6 tables
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { universalApi } from '@/lib/universal-api'
import { handleError } from '@/lib/salon/error-handler'
import { CustomerWhatsAppActions } from '@/components/salon/whatsapp/CustomerWhatsAppActions'
import type { CustomerMetadata, CustomerBusinessRules } from '@/types/salon.types'
import { 
  Users,
  User,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Star,
  Tag,
  Gift,
  CreditCard,
  Wallet,
  Heart,
  MessageCircle,
  History,
  FileText,
  Camera,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Send,
  Award,
  Crown,
  Clock,
  MapPin,
  Scissors,
  UserPlus,
  UserMinus,
  RefreshCw,
  Download,
  Upload,
  Edit,
  Trash2,
  Shield,
  Key,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  BookOpen,
  Settings,
  Share2,
  UserCheck,
  XCircle,
  Ban,
  Info,
  Home,
  Building,
  Briefcase,
  Baby,
  Cake,
  Palette,
  Gem,
  Coffee,
  Instagram,
  Facebook,
  Globe,
  Smartphone,
  Percent,
  CalendarCheck,
  CalendarX,
  Receipt,
  Package,
  ShoppingBag,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  PieChart,
  TrendingDown,
  Activity,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModalPortal } from '@/components/ui/modal-portal'
import { CustomerFormModal } from '@/components/salon/CustomerFormModal'
import { useToast } from '@/components/ui/use-toast'

// ----------------------------- Types & Interfaces ------------------------------------

interface Customer {
  id: string
  entity_type: 'customer'
  entity_name: string
  entity_code?: string
  smart_code: string
  status: 'active' | 'inactive' | 'blacklisted'
  created_at: string
  updated_at: string
  business_rules?: {
    vip?: boolean
    deposit_required?: boolean
    preferred_location_id?: string
    preferred_staff_id?: string
  }
  metadata?: CustomerMetadata
  // Dynamic data fields (flattened for display)
  email?: string
  phone?: string
  whatsapp?: string
  address?: string
  dob?: string
  gender?: string
  hair_type?: string
  skin_type?: string
  color_formula?: string
  marketing_consent?: boolean
  sms_consent?: boolean
  whatsapp_consent?: boolean
  preferred_staff?: string
  preferred_location?: string
  tags?: string[]
  // Computed fields
  last_visit?: Date
  next_appointment?: Date
  lifetime_value?: number
  loyalty_balance?: number
  membership_status?: 'active' | 'expired' | 'none'
  membership_name?: string
  gift_card_balance?: number
  deposit_balance?: number
  no_show_count?: number
  visit_count?: number
  average_ticket?: number
  referral_count?: number
}

interface CustomerActivity {
  id: string
  transaction_type: string
  transaction_date: Date
  smart_code: string
  description?: string
  amount?: number
  type?: string
  metadata?: Record<string, any>
}

interface LoyaltyTransaction {
  id: string
  date: Date
  type: 'EARN' | 'REDEEM' | 'ADJUST'
  points: number
  description: string
  balance_after: number
}

interface Membership {
  id: string
  plan_name: string
  status: 'active' | 'expired' | 'cancelled' | 'frozen'
  start_date: Date
  next_billing_date?: Date
  monthly_fee?: number
  benefits?: string[]
}

interface GiftCard {
  id: string
  code: string
  issued_date: Date
  expiry_date?: Date
  initial_value: number
  current_balance: number
  status: 'active' | 'expired' | 'depleted'
}

// ----------------------------- Mock Data Generation ------------------------------------

const generateMockCustomers = (): Customer[] => {
  const firstNames = ['Sarah', 'Emma', 'Olivia', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn',
                      'Michael', 'James', 'William', 'Daniel', 'Matthew', 'Joseph', 'David', 'Andrew', 'Ryan', 'Anthony']
  const lastNames = ['Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Anderson', 'Wilson',
                     'Moore', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Robinson', 'Clark']
  
  const hairTypes = ['Straight', 'Wavy', 'Curly', 'Coily', 'Fine', 'Medium', 'Thick']
  const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive']
  const tags = ['VIP', 'Regular', 'New', 'At Risk', 'Birthday Month', 'Color Client', 'Treatment Lover', 'Product Enthusiast']
  const staff = ['Rocky', 'Vinay', 'Maya', 'Sophia', 'Fatima', 'Aisha']
  const locations = ['Park Regis', 'Mercure Gold']
  
  return Array.from({ length: 150 }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const isVip = Math.random() > 0.85
    const hasAppointment = Math.random() > 0.3
    const lastVisitDays = Math.floor(Math.random() * 180)
    const visitCount = Math.floor(Math.random() * 50) + 1
    const avgTicket = 150 + Math.random() * 350
    
    return {
      id: `cus-${String(i + 1).padStart(4, '0')}`,
      entity_type: 'customer' as const,
      entity_name: `${firstName} ${lastName}`,
      entity_code: `CUS-${String(1000 + i).padStart(5, '0')}`,
      smart_code: 'HERA.SALON.CRM.CUSTOMER.PROFILE.v1',
      status: Math.random() > 0.02 ? 'active' : Math.random() > 0.5 ? 'inactive' : 'blacklisted',
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
      business_rules: {
        vip: isVip,
        deposit_required: Math.random() > 0.9,
        preferred_location_id: Math.random() > 0.7 ? `loc-${Math.floor(Math.random() * 2) + 1}` : undefined,
        preferred_staff_id: Math.random() > 0.6 ? `staff-${Math.floor(Math.random() * 6) + 1}` : undefined
      },
      // Contact info
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+971 50 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
      whatsapp: Math.random() > 0.7 ? `+971 50 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}` : undefined,
      address: Math.random() > 0.5 ? `${Math.floor(Math.random() * 999 + 1)} ${['Sheikh Zayed Road', 'Al Wasl Road', 'Jumeirah Beach Road', 'Al Khawaneej Road'][Math.floor(Math.random() * 4)]}, Dubai` : undefined,
      // Personal info
      dob: Math.random() > 0.4 ? new Date(1960 + Math.floor(Math.random() * 45), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : undefined,
      gender: Math.random() > 0.3 ? (firstName.match(/^(Michael|James|William|Daniel|Matthew|Joseph|David|Andrew|Ryan|Anthony)$/) ? 'Male' : 'Female') : undefined,
      // Preferences
      hair_type: Math.random() > 0.6 ? hairTypes[Math.floor(Math.random() * hairTypes.length)] : undefined,
      skin_type: Math.random() > 0.5 ? skinTypes[Math.floor(Math.random() * skinTypes.length)] : undefined,
      color_formula: Math.random() > 0.3 && Math.random() > 0.5 ? `Formula #${Math.floor(Math.random() * 900 + 100)}` : undefined,
      // Consents
      marketing_consent: Math.random() > 0.4,
      sms_consent: Math.random() > 0.5,
      whatsapp_consent: Math.random() > 0.6,
      // Staff/Location
      preferred_staff: isVip && Math.random() > 0.6 ? staff[Math.floor(Math.random() * staff.length)] : undefined,
      preferred_location: Math.random() > 0.7 ? locations[Math.floor(Math.random() * locations.length)] : undefined,
      // Tags
      tags: Array.from({ length: Math.floor(Math.random() * 4) }, () => tags[Math.floor(Math.random() * tags.length)]).filter((v, i, a) => a.indexOf(v) === i),
      // Activity metrics
      last_visit: new Date(Date.now() - lastVisitDays * 24 * 60 * 60 * 1000),
      next_appointment: hasAppointment ? new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : undefined,
      lifetime_value: visitCount * avgTicket,
      loyalty_balance: isVip ? Math.floor(Math.random() * 2000) : Math.floor(Math.random() * 500),
      membership_status: Math.random() > 0.7 ? 'active' : Math.random() > 0.9 ? 'expired' : 'none',
      membership_name: Math.random() > 0.7 ? ['Glam Club', 'VIP Elite', 'Beauty Pass'][Math.floor(Math.random() * 3)] : undefined,
      gift_card_balance: Math.random() > 0.9 ? Math.floor(Math.random() * 500) : 0,
      deposit_balance: Math.random() > 0.95 ? Math.floor(Math.random() * 200) : 0,
      no_show_count: Math.floor(Math.random() * Math.random() * 5),
      visit_count: visitCount,
      average_ticket: avgTicket,
      referral_count: isVip ? Math.floor(Math.random() * 5) : 0
    }
  })
}

// ----------------------------- Helper Functions ------------------------------------

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (date?: Date | string): string => {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-AE', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatPhone = (phone?: string): string => {
  if (!phone) return '-'
  return phone.replace(/(\+\d{3})\s(\d{2})\s(\d{3})\s(\d{4})/, '$1 $2 $3 $4')
}

const getDaysSinceLastVisit = (lastVisit?: Date): number => {
  if (!lastVisit) return 999
  return Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
}

const getCustomerSegment = (customer: Customer): string => {
  if (customer.business_rules?.vip) return 'VIP'
  if (getDaysSinceLastVisit(customer.last_visit) > 120) return 'At Risk'
  if (customer.visit_count && customer.visit_count > 20) return 'Loyal'
  if (customer.visit_count && customer.visit_count < 3) return 'New'
  return 'Regular'
}

const getSegmentColor = (segment: string): string => {
  switch (segment) {
    case 'VIP': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
    case 'At Risk': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
    case 'Loyal': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
    case 'New': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
  }
}

// ----------------------------- Customer Detail Modal ------------------------------------

const CustomerDetailModal = ({ customer, onClose, onEdit, onDelete, organizationId }: { customer: Customer | null, onClose: () => void, onEdit?: (customer: Customer) => void, onDelete?: (customerId: string) => void, organizationId: string }) => {
  const [activeTab, setActiveTab] = useState('profile')
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  if (!mounted || !customer) return null

  const segment = getCustomerSegment(customer)
  const daysSinceVisit = getDaysSinceLastVisit(customer.last_visit)

  // Only show activity data for customers with visits (not new customers)
  const activities: CustomerActivity[] = customer.visit_count && customer.visit_count > 0 ? [
    {
      id: '1',
      transaction_type: 'APPOINTMENT',
      transaction_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      smart_code: 'HERA.SALON.CUSTOMER.EVENT.APPOINTMENT.v1',
      description: 'Hair Color & Highlights with Rocky',
      amount: 280,
      type: 'completed'
    },
    {
      id: '2',
      transaction_type: 'PURCHASE',
      transaction_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      smart_code: 'HERA.SALON.CUSTOMER.EVENT.PURCHASE.v1',
      description: 'Kerastase Shampoo & Conditioner',
      amount: 180,
      type: 'product'
    },
    {
      id: '3',
      transaction_type: 'LOYALTY',
      transaction_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      smart_code: 'HERA.SALON.LOYALTY.POINTS.v1',
      description: 'Earned 46 points',
      amount: 46,
      type: 'earn'
    }
  ] : []

  const loyaltyHistory: LoyaltyTransaction[] = customer.loyalty_balance && customer.loyalty_balance > 0 ? [
    {
      id: '1',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      type: 'EARN',
      points: 46,
      description: 'Purchase - Hair Color & Products',
      balance_after: customer.loyalty_balance || 0
    },
    {
      id: '2',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      type: 'REDEEM',
      points: -100,
      description: 'Redeemed for discount',
      balance_after: (customer.loyalty_balance || 0) - 46
    }
  ] : []

  const currentMembership: Membership | null = customer.membership_status === 'active' ? {
    id: '1',
    plan_name: customer.membership_name || 'Glam Club',
    status: 'active',
    start_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    next_billing_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    monthly_fee: 199,
    benefits: ['20% off all services', 'Priority booking', 'Free birthday treatment', 'Exclusive events']
  } : null

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
        
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
                {customer.entity_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {customer.entity_name}
                  {customer.business_rules?.vip && <Crown className="w-5 h-5 text-purple-600" />}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Customer since {formatDate(customer.created_at)} • {customer.entity_code}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={cn(getSegmentColor(segment))}>
                    {segment}
                  </Badge>
                  <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                    {customer.status}
                  </Badge>
                  {customer.membership_status === 'active' && (
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      <Award className="w-3 h-3 mr-1" />
                      {customer.membership_name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">Lifetime Value</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(customer.lifetime_value || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Visits</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {customer.visit_count || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg. Ticket</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(customer.average_ticket || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">Loyalty Points</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {customer.loyalty_balance || 0}
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <History className="w-4 h-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="value" className="gap-2">
                <DollarSign className="w-4 h-4" />
                Value Programs
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-2">
                <FileText className="w-4 h-4" />
                Files
              </TabsTrigger>
              <TabsTrigger value="ledger" className="gap-2">
                <Receipt className="w-4 h-4" />
                Ledger
              </TabsTrigger>
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile" className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                        <p className="font-medium">{customer.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                        <p className="font-medium">{formatPhone(customer.phone)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">WhatsApp</p>
                        <p className="font-medium">{formatPhone(customer.whatsapp) || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Home className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                        <p className="font-medium">{customer.address || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Cake className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
                        <p className="font-medium">{customer.dob ? formatDate(customer.dob) : '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Gender</p>
                        <p className="font-medium">{customer.gender || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Last Visit</p>
                        <p className="font-medium">
                          {customer.last_visit ? `${formatDate(customer.last_visit)} (${daysSinceVisit} days ago)` : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CalendarCheck className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Next Appointment</p>
                        <p className="font-medium">{customer.next_appointment ? formatDate(customer.next_appointment) : 'None scheduled'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Hair Type</p>
                        <p className="font-medium">{customer.hair_type || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Palette className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Color Formula</p>
                        <p className="font-medium">{customer.color_formula || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Gem className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Skin Type</p>
                        <p className="font-medium">{customer.skin_type || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Scissors className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Preferred Stylist</p>
                        <p className="font-medium">{customer.preferred_staff || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Preferred Location</p>
                        <p className="font-medium">{customer.preferred_location || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Consents & Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Marketing & Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Consent Status</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Email Marketing</span>
                          {customer.marketing_consent ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Opted In
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <X className="w-3 h-3 mr-1" />
                              Opted Out
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">SMS Marketing</span>
                          {customer.sms_consent ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Opted In
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <X className="w-3 h-3 mr-1" />
                              Opted Out
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">WhatsApp</span>
                          {customer.whatsapp_consent ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Opted In
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <X className="w-3 h-3 mr-1" />
                              Opted Out
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {customer.tags?.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        <Button variant="outline" size="sm">
                          <Plus className="w-3 h-3 mr-1" />
                          Add Tag
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* WhatsApp Actions */}
                {customer.whatsapp_consent && customer.whatsapp && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">WhatsApp Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CustomerWhatsAppActions 
                        customer={{
                          id: customer.id,
                          name: customer.entity_name,
                          phone: customer.whatsapp || customer.phone || '',
                          email: customer.email,
                          metadata: {
                            birthday: customer.dob,
                            last_visit: customer.last_visit,
                            total_visits: customer.visit_count,
                            favorite_service: customer.color_formula ? 'Hair Color' : undefined,
                            vip_status: customer.business_rules?.vip
                          }
                        }}
                        organizationId={organizationId}
                      />
                    </CardContent>
                  </Card>
                )}
                
              </div>
            </TabsContent>
            
            {/* Activity Tab */}
            <TabsContent value="activity" className="p-6">
              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">No activity yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Customer activities will appear here once they start booking appointments.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            activity.transaction_type === 'APPOINTMENT' ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30" :
                            activity.transaction_type === 'PURCHASE' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30" :
                            "bg-green-100 text-green-600 dark:bg-green-900/30"
                          )}>
                            {activity.transaction_type === 'APPOINTMENT' ? <Calendar className="w-5 h-5" /> :
                             activity.transaction_type === 'PURCHASE' ? <ShoppingBag className="w-5 h-5" /> :
                             <Gift className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {activity.description}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {formatDate(activity.transaction_date)}
                            </p>
                          </div>
                        </div>
                        {activity.amount && (
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {activity.type === 'earn' ? '+' : ''}{formatCurrency(activity.amount)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Value Programs Tab */}
            <TabsContent value="value" className="p-6 space-y-6">
              
              {/* Loyalty Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      Loyalty Points
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      {customer.loyalty_balance || 0} pts
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loyaltyHistory.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-semibold",
                            transaction.type === 'EARN' ? "text-green-600" : "text-red-600"
                          )}>
                            {transaction.type === 'EARN' ? '+' : ''}{transaction.points} pts
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Balance: {transaction.balance_after}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="flex-1">
                      <Plus className="w-4 h-4 mr-1" />
                      Award Points
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <ArrowDownRight className="w-4 h-4 mr-1" />
                      Redeem Points
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Membership */}
              {currentMembership ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-purple-600" />
                        Membership
                      </span>
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        {currentMembership.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Plan</span>
                        <span className="font-medium">{currentMembership.plan_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Monthly Fee</span>
                        <span className="font-medium">{formatCurrency(currentMembership.monthly_fee || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Next Billing</span>
                        <span className="font-medium">{formatDate(currentMembership.next_billing_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Member Since</span>
                        <span className="font-medium">{formatDate(currentMembership.start_date)}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Benefits</p>
                        <ul className="space-y-1">
                          {currentMembership.benefits?.map((benefit, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No active membership</p>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Enroll in Membership
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Gift Cards & Deposits */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gift className="w-5 h-5 text-blue-600" />
                      Gift Cards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-3xl font-bold text-blue-600">
                        {formatCurrency(customer.gift_card_balance || 0)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Available Balance
                      </p>
                      <Button size="sm" className="mt-4">
                        <Plus className="w-4 h-4 mr-1" />
                        Issue Gift Card
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-green-600" />
                      Deposits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(customer.deposit_balance || 0)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        On Account
                      </p>
                      <Button size="sm" className="mt-4">
                        <Plus className="w-4 h-4 mr-1" />
                        Collect Deposit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
            </TabsContent>
            
            {/* Files Tab */}
            <TabsContent value="files" className="p-6">
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No files uploaded yet</p>
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            </TabsContent>
            
            {/* Ledger Tab */}
            <TabsContent value="ledger" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Financial Transactions</h3>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Description</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 text-sm">{formatDate(new Date())}</td>
                        <td className="py-3 px-4 text-sm">Sale</td>
                        <td className="py-3 px-4 text-sm">Hair Color & Products</td>
                        <td className="py-3 px-4 text-sm text-right font-medium">+{formatCurrency(460)}</td>
                        <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(460)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            
          </Tabs>
        </div>
        
        {/* Footer Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (onEdit) {
                    onEdit(customer)
                    onClose()
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-1" />
                Book Appointment
              </Button>
              <Button variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-1" />
                Send Message
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  if (onDelete && confirm(`Are you sure you want to delete ${customer.entity_name}? This action cannot be undone.`)) {
                    onDelete(customer.id)
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
        
        </div>
      </div>
    </ModalPortal>
  )
}

// ----------------------------- Main Component ------------------------------------

export default function SalonCustomersPage() {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<{
    status?: string
    segment?: string
    membership?: string
    location?: string
    staff?: string
    consent?: string
  }>({})
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Default organization ID for salon - Hair Talkz Park Regis
  const organizationId = currentOrganization?.id || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
  
  // Fetch customers from Supabase
  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      
      // Set the organization context for the API
      universalApi.setOrganizationId(organizationId)
      
      // Fetch customer entities using getEntities method
      const entitiesResponse = await universalApi.getEntities('customer', organizationId)
      
      if (!entitiesResponse.success || !entitiesResponse.data) {
        throw new Error(entitiesResponse.error || 'Failed to fetch customers')
      }
      
      // For each customer, fetch their dynamic data
      const customersData: Customer[] = []
      
      for (const entity of entitiesResponse.data) {
        // Fetch dynamic fields for this customer
        const fieldsResponse = await universalApi.getDynamicData(entity.id, organizationId)
        
        let dynamicData: any = {}
        if (fieldsResponse.success && fieldsResponse.data) {
          // Convert dynamic fields array to object
          fieldsResponse.data.forEach((field: any) => {
            // Check field type and extract value from appropriate column
            if (field.field_type === 'text' && field.field_value !== null) {
              dynamicData[field.field_name] = field.field_value
            } else if (field.field_type === 'number' && field.field_value_number !== null) {
              dynamicData[field.field_name] = field.field_value_number
            } else if (field.field_type === 'boolean' && field.field_value_boolean !== null) {
              dynamicData[field.field_name] = field.field_value_boolean
            } else if (field.field_type === 'date' && field.field_value_date !== null) {
              dynamicData[field.field_name] = field.field_value_date
            } else if (field.field_type === 'json' && field.field_value_json !== null) {
              try {
                dynamicData[field.field_name] = typeof field.field_value_json === 'string' 
                  ? JSON.parse(field.field_value_json)
                  : field.field_value_json
              } catch {
                dynamicData[field.field_name] = field.field_value_json
              }
            }
          })
        }
        
        // Parse metadata for business rules and notes
        let businessRules = {}
        let notes = ''
        if (entity.metadata) {
          if (entity.metadata.business_rules) {
            businessRules = entity.metadata.business_rules
          }
          if (entity.metadata.notes) {
            notes = entity.metadata.notes
          }
        }
        
        // Create customer object
        const customer: Customer = {
          id: entity.id,
          entity_type: 'customer',
          entity_name: entity.entity_name,
          entity_code: entity.entity_code,
          smart_code: entity.smart_code,
          status: entity.status || 'active',
          created_at: entity.created_at,
          updated_at: entity.updated_at,
          business_rules: businessRules,
          metadata: { notes },
          // Spread dynamic data
          ...dynamicData,
          // Ensure required fields have defaults
          email: dynamicData.email || '',
          phone: dynamicData.phone || '',
          membership_status: dynamicData.membership_status || 'none',
          lifetime_value: dynamicData.lifetime_value || 0,
          loyalty_balance: dynamicData.loyalty_balance || 0,
          gift_card_balance: dynamicData.gift_card_balance || 0,
          deposit_balance: dynamicData.deposit_balance || 0,
          no_show_count: dynamicData.no_show_count || 0,
          visit_count: dynamicData.visit_count || 0,
          average_ticket: dynamicData.average_ticket || 0,
          referral_count: dynamicData.referral_count || 0,
          tags: dynamicData.tags || []
        }
        
        customersData.push(customer)
      }
      
      // Sort by created date (newest first)
      customersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setCustomers(customersData)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      })
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Initialize customers - fetch from Supabase
  useEffect(() => {
    if (organizationId) {
      fetchCustomers()
    }
  }, [organizationId])
  
  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!customer.entity_name.toLowerCase().includes(query) &&
          !customer.email?.toLowerCase().includes(query) &&
          !customer.phone?.includes(searchQuery)) {
        return false
      }
    }
    
    // Status filter
    if (selectedFilters.status && customer.status !== selectedFilters.status) {
      return false
    }
    
    // Segment filter
    if (selectedFilters.segment) {
      const segment = getCustomerSegment(customer)
      if (segment !== selectedFilters.segment) return false
    }
    
    // Membership filter
    if (selectedFilters.membership && customer.membership_status !== selectedFilters.membership) {
      return false
    }
    
    // Location filter
    if (selectedFilters.location && customer.preferred_location !== selectedFilters.location) {
      return false
    }
    
    // Staff filter
    if (selectedFilters.staff && customer.preferred_staff !== selectedFilters.staff) {
      return false
    }
    
    // Consent filter
    if (selectedFilters.consent) {
      if (selectedFilters.consent === 'email' && !customer.marketing_consent) return false
      if (selectedFilters.consent === 'sms' && !customer.sms_consent) return false
      if (selectedFilters.consent === 'whatsapp' && !customer.whatsapp_consent) return false
    }
    
    return true
  })
  
  // Compute summary stats
  const totalCustomers = filteredCustomers.length
  const activeCustomers = filteredCustomers.filter(c => c.status === 'active').length
  const vipCustomers = filteredCustomers.filter(c => c.business_rules?.vip).length
  const totalLTV = filteredCustomers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0)
  const avgLTV = totalCustomers > 0 ? totalLTV / totalCustomers : 0
  const atRiskCustomers = filteredCustomers.filter(c => getDaysSinceLastVisit(c.last_visit) > 120).length
  const withAppointments = filteredCustomers.filter(c => c.next_appointment).length
  
  const toggleCustomerSelection = (customerId: string) => {
    const newSelection = new Set(selectedCustomers)
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId)
    } else {
      newSelection.add(customerId)
    }
    setSelectedCustomers(newSelection)
  }
  
  const handleCreateCustomer = async (formData: any) => {
    try {
      // Set the organization context for the API
      universalApi.setOrganizationId(organizationId)
      
      // Create the customer entity in Supabase
      const entityResponse = await universalApi.createEntity({
        entity_type: 'customer',
        entity_name: formData.entity_name,
        entity_code: `CUS-${String(Date.now()).slice(-6)}`, // Generate unique code
        smart_code: 'HERA.SALON.CRM.CUSTOMER.PROFILE.v1',
        status: 'active',
        organization_id: organizationId,
        metadata: {
          business_rules: {
            vip: formData.tags?.includes('VIP'),
            deposit_required: false,
            preferred_location_id: formData.preferred_location,
            preferred_staff_id: formData.preferred_staff
          },
          notes: formData.notes
        }
      })
      
      if (!entityResponse.success || !entityResponse.data) {
        throw new Error(entityResponse.error || 'Failed to create customer entity')
      }
      
      const customerId = entityResponse.data.id
      
      // Set dynamic fields for the customer
      const dynamicFields = [
        // Text fields
        { field_name: 'email', field_value: formData.email, field_type: 'text' },
        { field_name: 'phone', field_value: formData.phone, field_type: 'text' },
        { field_name: 'whatsapp', field_value: formData.whatsapp || '', field_type: 'text' },
        { field_name: 'address', field_value: formData.address || '', field_type: 'text' },
        { field_name: 'dob', field_value: formData.dob || '', field_type: 'date' },
        { field_name: 'gender', field_value: formData.gender || '', field_type: 'text' },
        { field_name: 'hair_type', field_value: formData.hair_type || '', field_type: 'text' },
        { field_name: 'skin_type', field_value: formData.skin_type || '', field_type: 'text' },
        { field_name: 'color_formula', field_value: formData.color_formula || '', field_type: 'text' },
        { field_name: 'marketing_consent', field_value: formData.marketing_consent ? '1' : '0', field_type: 'boolean' },
        { field_name: 'sms_consent', field_value: formData.sms_consent ? '1' : '0', field_type: 'boolean' },
        { field_name: 'whatsapp_consent', field_value: formData.whatsapp_consent ? '1' : '0', field_type: 'boolean' },
        { field_name: 'preferred_staff', field_value: formData.preferred_staff || '', field_type: 'text' },
        { field_name: 'preferred_location', field_value: formData.preferred_location || '', field_type: 'text' },
        { field_name: 'tags', field_value: JSON.stringify(formData.tags || []), field_type: 'json' },
        // Initialize metrics
        { field_name: 'lifetime_value', field_value: '0', field_type: 'number' },
        { field_name: 'loyalty_balance', field_value: '0', field_type: 'number' },
        { field_name: 'membership_status', field_value: 'none', field_type: 'text' },
        { field_name: 'gift_card_balance', field_value: '0', field_type: 'number' },
        { field_name: 'deposit_balance', field_value: '0', field_type: 'number' },
        { field_name: 'no_show_count', field_value: '0', field_type: 'number' },
        { field_name: 'visit_count', field_value: '0', field_type: 'number' },
        { field_name: 'average_ticket', field_value: '0', field_type: 'number' },
        { field_name: 'referral_count', field_value: '0', field_type: 'number' }
      ]
      
      // Set all dynamic fields
      for (const field of dynamicFields) {
        const fieldData = {
          entity_id: customerId,
          field_name: field.field_name,
          field_type: field.field_type,
          field_label: field.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          smart_code: 'HERA.SALON.CRM.CUSTOMER.FIELD.v1',
          organization_id: organizationId
        }
        
        // Set the appropriate value field based on type
        if (field.field_type === 'number') {
          fieldData.field_value_number = parseFloat(field.field_value) || 0
        } else if (field.field_type === 'boolean') {
          fieldData.field_value_boolean = field.field_value === '1'
        } else if (field.field_type === 'date') {
          fieldData.field_value_date = field.field_value || null
        } else if (field.field_type === 'json') {
          fieldData.field_value_json = field.field_value
        } else {
          fieldData.field_value = field.field_value
        }
        
        const fieldResponse = await universalApi.create('core_dynamic_data', fieldData, organizationId)
        
        if (!fieldResponse.success) {
          console.error(`Failed to set field ${field.field_name}:`, fieldResponse.error)
          // Continue with other fields even if one fails
        }
      }
      
      // Create a customer object for the UI
      const newCustomer: Customer = {
        id: customerId,
        entity_type: 'customer',
        entity_name: formData.entity_name,
        entity_code: entityResponse.data.entity_code,
        smart_code: 'HERA.SALON.CRM.CUSTOMER.PROFILE.v1',
        status: 'active',
        created_at: entityResponse.data.created_at,
        updated_at: entityResponse.data.updated_at,
        business_rules: {
          vip: formData.tags?.includes('VIP'),
          deposit_required: false,
          preferred_location_id: formData.preferred_location,
          preferred_staff_id: formData.preferred_staff
        },
        // Contact info
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        address: formData.address,
        // Personal info
        dob: formData.dob,
        gender: formData.gender,
        // Preferences
        hair_type: formData.hair_type,
        skin_type: formData.skin_type,
        color_formula: formData.color_formula,
        // Consents
        marketing_consent: formData.marketing_consent,
        sms_consent: formData.sms_consent,
        whatsapp_consent: formData.whatsapp_consent,
        // Staff/Location
        preferred_staff: formData.preferred_staff,
        preferred_location: formData.preferred_location,
        // Tags
        tags: formData.tags || [],
        // Initialize metrics
        last_visit: undefined,
        next_appointment: undefined,
        lifetime_value: 0,
        loyalty_balance: 0,
        membership_status: 'none',
        gift_card_balance: 0,
        deposit_balance: 0,
        no_show_count: 0,
        visit_count: 0,
        average_ticket: 0,
        referral_count: 0,
        // Notes
        metadata: {
          notes: formData.notes
        }
      }
      
      toast({
        title: "Success",
        description: "Customer created successfully!",
      })
      setShowCreateModal(false)
      
      // Clear search to show the new customer
      setSearchQuery('')
      
      // Refresh the customer list to get the latest data
      await fetchCustomers()
      
    } catch (error) {
      console.error('Error creating customer:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create customer. Please try again.",
        variant: "destructive",
      })
      throw error // Re-throw to keep the form in loading state
    }
  }
  
  const handleUpdateCustomer = async (formData: any) => {
    try {
      if (!editingCustomer) return
      
      // Set the organization context for the API
      universalApi.setOrganizationId(organizationId)
      
      // Update the entity in Supabase
      const updateResponse = await universalApi.updateEntity(editingCustomer.id, {
        entity_name: formData.entity_name,
        metadata: {
          business_rules: {
            vip: formData.tags?.includes('VIP'),
            deposit_required: false,
            preferred_location_id: formData.preferred_location,
            preferred_staff_id: formData.preferred_staff
          },
          notes: formData.notes
        }
      })
      
      if (!updateResponse.success) {
        throw new Error(updateResponse.error || 'Failed to update customer entity')
      }
      
      // For updates, we need to delete existing dynamic fields and create new ones
      // First, get existing fields
      const existingFields = await universalApi.getDynamicData(editingCustomer.id, organizationId)
      
      // Delete existing fields for fields we're updating
      if (existingFields.success && existingFields.data) {
        const fieldsToUpdate = ['email', 'phone', 'whatsapp', 'address', 'dob', 'gender', 
                               'hair_type', 'skin_type', 'color_formula', 'marketing_consent', 
                               'sms_consent', 'whatsapp_consent', 'preferred_staff', 
                               'preferred_location', 'tags']
        
        for (const field of existingFields.data) {
          if (fieldsToUpdate.includes(field.field_name)) {
            await universalApi.delete('core_dynamic_data', field.id, organizationId)
          }
        }
      }
      
      // Create new dynamic fields
      const dynamicFields = [
        { field_name: 'email', field_value: formData.email, field_type: 'text' },
        { field_name: 'phone', field_value: formData.phone, field_type: 'text' },
        { field_name: 'whatsapp', field_value: formData.whatsapp || '', field_type: 'text' },
        { field_name: 'address', field_value: formData.address || '', field_type: 'text' },
        { field_name: 'dob', field_value: formData.dob || '', field_type: 'date' },
        { field_name: 'gender', field_value: formData.gender || '', field_type: 'text' },
        { field_name: 'hair_type', field_value: formData.hair_type || '', field_type: 'text' },
        { field_name: 'skin_type', field_value: formData.skin_type || '', field_type: 'text' },
        { field_name: 'color_formula', field_value: formData.color_formula || '', field_type: 'text' },
        { field_name: 'marketing_consent', field_value: formData.marketing_consent ? '1' : '0', field_type: 'boolean' },
        { field_name: 'sms_consent', field_value: formData.sms_consent ? '1' : '0', field_type: 'boolean' },
        { field_name: 'whatsapp_consent', field_value: formData.whatsapp_consent ? '1' : '0', field_type: 'boolean' },
        { field_name: 'preferred_staff', field_value: formData.preferred_staff || '', field_type: 'text' },
        { field_name: 'preferred_location', field_value: formData.preferred_location || '', field_type: 'text' },
        { field_name: 'tags', field_value: JSON.stringify(formData.tags || []), field_type: 'json' }
      ]
      
      // Create all dynamic fields
      for (const field of dynamicFields) {
        const fieldData = {
          entity_id: editingCustomer.id,
          field_name: field.field_name,
          field_type: field.field_type,
          field_label: field.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          smart_code: 'HERA.SALON.CRM.CUSTOMER.FIELD.v1',
          organization_id: organizationId
        }
        
        // Set the appropriate value field based on type
        if (field.field_type === 'number') {
          fieldData.field_value_number = parseFloat(field.field_value) || 0
        } else if (field.field_type === 'boolean') {
          fieldData.field_value_boolean = field.field_value === '1'
        } else if (field.field_type === 'date') {
          fieldData.field_value_date = field.field_value || null
        } else if (field.field_type === 'json') {
          fieldData.field_value_json = field.field_value
        } else {
          fieldData.field_value = field.field_value
        }
        
        const fieldResponse = await universalApi.create('core_dynamic_data', fieldData, organizationId)
        
        if (!fieldResponse.success) {
          console.error(`Failed to update field ${field.field_name}:`, fieldResponse.error)
          // Continue with other fields even if one fails
        }
      }
      
      // Update the customer in the state
      setCustomers(prevCustomers => 
        prevCustomers.map(customer => 
          customer.id === editingCustomer.id
            ? {
                ...customer,
                entity_name: formData.entity_name,
                email: formData.email,
                phone: formData.phone,
                whatsapp: formData.whatsapp,
                address: formData.address,
                dob: formData.dob,
                gender: formData.gender,
                hair_type: formData.hair_type,
                skin_type: formData.skin_type,
                color_formula: formData.color_formula,
                marketing_consent: formData.marketing_consent,
                sms_consent: formData.sms_consent,
                whatsapp_consent: formData.whatsapp_consent,
                preferred_staff: formData.preferred_staff,
                preferred_location: formData.preferred_location,
                tags: formData.tags || [],
                updated_at: new Date().toISOString(),
                business_rules: {
                  ...customer.business_rules,
                  vip: formData.tags?.includes('VIP'),
                  preferred_location_id: formData.preferred_location,
                  preferred_staff_id: formData.preferred_staff
                },
                metadata: {
                  ...customer.metadata,
                  notes: formData.notes
                }
              }
            : customer
        )
      )
      
      toast({
        title: "Success", 
        description: "Customer updated successfully!",
      })
      setEditingCustomer(null)
      
      // If the updated customer is currently selected, update it too
      if (selectedCustomer?.id === editingCustomer.id) {
        setSelectedCustomer(null)
      }
      
    } catch (error) {
      console.error('Error updating customer:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update customer. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }
  
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      // Set the organization context for the API
      universalApi.setOrganizationId(organizationId)
      
      // Delete the customer entity from Supabase
      const deleteResponse = await universalApi.deleteEntity(customerId)
      
      if (!deleteResponse.success) {
        throw new Error(deleteResponse.error || 'Failed to delete customer')
      }
      
      // Remove from state
      setCustomers(prevCustomers => prevCustomers.filter(c => c.id !== customerId))
      
      toast({
        title: "Success",
        description: "Customer deleted successfully!",
      })
      
      // Close the detail modal if this customer was being viewed
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(null)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete customer. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  const selectAllCustomers = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set())
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)))
    }
  }
  
  if (contextLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading customer data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-8 h-8 text-purple-600" />
              Customers
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage customer profiles, preferences, and loyalty programs
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchCustomers()}
              disabled={isLoading}
              className="bg-white dark:bg-gray-800"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white dark:bg-gray-800"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {Object.keys(selectedFilters).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {Object.keys(selectedFilters).length}
                </Badge>
              )}
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalCustomers}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {activeCustomers}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">VIPs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {vipCustomers}
                  </p>
                </div>
                <Crown className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">At Risk</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {atRiskCustomers}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg LTV</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(avgLTV).split(' ')[1]}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Booked</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {withAppointments}
                  </p>
                </div>
                <CalendarCheck className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {selectedCustomers.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedCustomers.size} selected
                  </span>
                  <Button size="sm" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                  <Button size="sm" variant="outline">
                    <Tag className="w-4 h-4 mr-1" />
                    Tag
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              )}
            </div>
            
            {/* Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <select
                    value={selectedFilters.status || ''}
                    onChange={(e) => setSelectedFilters({...selectedFilters, status: e.target.value || undefined})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blacklisted">Blacklisted</option>
                  </select>
                  
                  <select
                    value={selectedFilters.segment || ''}
                    onChange={(e) => setSelectedFilters({...selectedFilters, segment: e.target.value || undefined})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="">All Segments</option>
                    <option value="VIP">VIP</option>
                    <option value="Loyal">Loyal</option>
                    <option value="Regular">Regular</option>
                    <option value="New">New</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                  
                  <select
                    value={selectedFilters.membership || ''}
                    onChange={(e) => setSelectedFilters({...selectedFilters, membership: e.target.value || undefined})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="">All Memberships</option>
                    <option value="active">Active Member</option>
                    <option value="expired">Expired Member</option>
                    <option value="none">No Membership</option>
                  </select>
                  
                  <select
                    value={selectedFilters.location || ''}
                    onChange={(e) => setSelectedFilters({...selectedFilters, location: e.target.value || undefined})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="">All Locations</option>
                    <option value="Park Regis">Park Regis</option>
                    <option value="Mercure Gold">Mercure Gold</option>
                  </select>
                  
                  <select
                    value={selectedFilters.staff || ''}
                    onChange={(e) => setSelectedFilters({...selectedFilters, staff: e.target.value || undefined})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="">All Staff</option>
                    <option value="Rocky">Rocky</option>
                    <option value="Vinay">Vinay</option>
                    <option value="Maya">Maya</option>
                    <option value="Sophia">Sophia</option>
                  </select>
                  
                  <select
                    value={selectedFilters.consent || ''}
                    onChange={(e) => setSelectedFilters({...selectedFilters, consent: e.target.value || undefined})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="">All Consents</option>
                    <option value="email">Email Opt-in</option>
                    <option value="sms">SMS Opt-in</option>
                    <option value="whatsapp">WhatsApp Opt-in</option>
                  </select>
                </div>
                
                {Object.keys(selectedFilters).length > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setSelectedFilters({})}
                    className="mt-2 text-purple-600"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Grid */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
                        onChange={selectAllCustomers}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Customer
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contact
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tags
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Visit
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      LTV
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Loyalty
                    </th>
                    <th className="text-center px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Users className="w-12 h-12 text-gray-300 mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                            No customers found
                          </p>
                          <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                            {searchQuery ? `No results for "${searchQuery}"` : 'Start by adding your first customer'}
                          </p>
                          {!searchQuery && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                              onClick={() => setShowCreateModal(true)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add First Customer
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : filteredCustomers.slice(0, 20).map((customer) => {
                    const segment = getCustomerSegment(customer)
                    const daysSinceVisit = getDaysSinceLastVisit(customer.last_visit)
                    
                    return (
                      <tr 
                        key={customer.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.has(customer.id)}
                            onChange={() => toggleCustomerSelection(customer.id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center text-white font-medium">
                              {customer.entity_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                {customer.entity_name}
                                {customer.business_rules?.vip && <Crown className="w-4 h-4 text-purple-600" />}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge className={cn("text-xs", getSegmentColor(segment))}>
                                  {segment}
                                </Badge>
                                {customer.status !== 'active' && (
                                  <Badge variant="secondary" className="text-xs">
                                    {customer.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {customer.email}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatPhone(customer.phone)}
                            </p>
                            <div className="flex items-center gap-2">
                              {customer.marketing_consent && (
                                <Mail className="w-3 h-3 text-green-500" title="Email opt-in" />
                              )}
                              {customer.sms_consent && (
                                <Smartphone className="w-3 h-3 text-green-500" title="SMS opt-in" />
                              )}
                              {customer.whatsapp_consent && (
                                <MessageCircle className="w-3 h-3 text-green-500" title="WhatsApp opt-in" />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {customer.tags?.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {customer.tags && customer.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{customer.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {customer.last_visit ? formatDate(customer.last_visit) : 'Never'}
                            </p>
                            {customer.last_visit && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {daysSinceVisit} days ago
                              </p>
                            )}
                            {customer.next_appointment && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                Next: {formatDate(customer.next_appointment)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(customer.lifetime_value || 0)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {customer.visit_count || 0} visits
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="space-y-1">
                            {customer.loyalty_balance ? (
                              <p className="font-semibold text-purple-600">
                                {customer.loyalty_balance} pts
                              </p>
                            ) : null}
                            {customer.membership_status === 'active' && (
                              <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs">
                                {customer.membership_name}
                              </Badge>
                            )}
                            {customer.gift_card_balance ? (
                              <p className="text-xs text-blue-600">
                                GC: {formatCurrency(customer.gift_card_balance)}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Calendar className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end" 
                                className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
                              >
                                <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                <DropdownMenuItem 
                                  onClick={() => setSelectedCustomer(customer)}
                                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                >
                                  <ChevronRight className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setEditingCustomer(customer)}
                                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Customer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Book Appointment
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                  <Receipt className="w-4 h-4 mr-2" />
                                  View Transactions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                                <DropdownMenuItem 
                                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete ${customer.entity_name}? This action cannot be undone.`)) {
                                      handleDeleteCustomer(customer.id)
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Customer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing 1 to {Math.min(20, filteredCustomers.length)} of {filteredCustomers.length} customers
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={filteredCustomers.length <= 20}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal 
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEdit={(customer) => setEditingCustomer(customer)}
          onDelete={handleDeleteCustomer}
          organizationId={organizationId}
        />
      )}
      
      {/* Create Customer Modal */}
      <CustomerFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCustomer}
        mode="create"
      />
      
      {/* Edit Customer Modal */}
      {editingCustomer && (
        <CustomerFormModal
          isOpen={true}
          onClose={() => setEditingCustomer(null)}
          onSubmit={handleUpdateCustomer}
          initialData={{
            entity_name: editingCustomer.entity_name,
            email: editingCustomer.email || '',
            phone: editingCustomer.phone || '',
            whatsapp: editingCustomer.whatsapp || '',
            address: editingCustomer.address || '',
            dob: editingCustomer.dob || '',
            gender: editingCustomer.gender || '',
            hair_type: editingCustomer.hair_type || '',
            skin_type: editingCustomer.skin_type || '',
            color_formula: editingCustomer.color_formula || '',
            preferred_staff: editingCustomer.preferred_staff || 'none',
            preferred_location: editingCustomer.preferred_location || 'none',
            marketing_consent: editingCustomer.marketing_consent || false,
            sms_consent: editingCustomer.sms_consent || false,
            whatsapp_consent: editingCustomer.whatsapp_consent || false,
            tags: editingCustomer.tags || [],
          }}
          mode="edit"
        />
      )}
    </div>
  )
}