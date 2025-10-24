'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Calculator,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  Globe,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Send,
  Download,
  Copy,
  Archive,
  Star,
  Award,
  Target,
  Activity,
  BarChart3,
  Package,
  TreePine,
  Settings,
  Zap,
  MapPin,
  Percent,
  RefreshCw,
  AlertTriangle,
  XCircle,
  PlayCircle,
  PauseCircle
} from 'lucide-react'

// TypeScript interfaces for enterprise quotes system
interface QuoteLineItem {
  id: string
  productCode: string
  productName: string
  description: string
  category: 'furniture' | 'accessories' | 'services' | 'materials'
  specifications: Record<string, string>
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  discountType: 'percentage' | 'fixed'
  netAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  deliveryTime: number
  notes?: string
}

interface QuoteCustomer {
  id: string
  name: string
  type: 'individual' | 'business' | 'government' | 'export'
  contactPerson: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    pincode: string
    country: string
  }
  gstNumber?: string
  panNumber?: string
  creditLimit: number
  paymentTerms: string
  preferredCurrency: 'INR' | 'USD' | 'EUR'
  region: 'domestic' | 'international'
}

interface QuoteTermsConditions {
  validityDays: number
  paymentTerms: string
  deliveryTerms: string
  warrantyPeriod: string
  installationIncluded: boolean
  transportationCost: number
  packagingCost: number
  customizationAllowed: boolean
  revisionLimit: number
  cancellationPolicy: string
}

interface Quote {
  id: string
  quoteNumber: string
  version: string
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'expired' | 'converted'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  customer: QuoteCustomer
  requestDate: string
  submissionDate?: string
  validUntil: string
  lastModified: string
  lineItems: QuoteLineItem[]
  subtotal: number
  totalDiscount: number
  totalTax: number
  grandTotal: number
  margin: number
  marginPercentage: number
  estimatedDelivery: string
  termsConditions: QuoteTermsConditions
  salesPerson: string
  approver?: string
  approvalDate?: string
  conversionDate?: string
  orderValue?: number
  notes: string[]
  attachments: string[]
  revisionHistory: {
    version: string
    date: string
    changes: string
    modifiedBy: string
  }[]
  competitorAnalysis?: {
    competitorName: string
    competitorPrice: number
    ourAdvantage: string
  }[]
  followUpDates: string[]
  probability: number
  expectedCloseDate: string
}

interface QuoteAnalytics {
  totalQuotes: number
  activeQuotes: number
  approvedQuotes: number
  conversionRate: number
  averageValue: number
  totalValue: number
  monthlyTrend: number
  topCategories: { category: string; value: number; count: number }[]
  salesPerformance: { salesperson: string; quotes: number; value: number; conversion: number }[]
}

export default function QuotesPage(): JSX.Element {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [analytics, setAnalytics] = useState<QuoteAnalytics | null>(null)

  // Sample enterprise quotes data
  const sampleQuotes: Quote[] = [
    {
      id: 'QUO-001',
      quoteNumber: 'KFW-Q-2024-001',
      version: '2.1',
      status: 'approved',
      priority: 'high',
      customer: {
        id: 'CUST-001',
        name: 'ITC Grand Chola Chennai',
        type: 'business',
        contactPerson: 'Rajesh Menon',
        email: 'procurement@itchotels.in',
        phone: '+91 44 2220 0000',
        address: {
          street: '63, Mount Road',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600032',
          country: 'India'
        },
        gstNumber: '33AAACI1681G1Z4',
        creditLimit: 5000000,
        paymentTerms: '30 days',
        preferredCurrency: 'INR',
        region: 'domestic'
      },
      requestDate: '2024-01-10',
      submissionDate: '2024-01-15',
      validUntil: '2024-02-15',
      lastModified: '2024-01-18',
      lineItems: [
        {
          id: 'LI-001',
          productCode: 'KFW-EXEC-TABLE-001',
          productName: 'Executive Boardroom Table',
          description: 'Handcrafted teak boardroom table with brass fittings',
          category: 'furniture',
          specifications: {
            'Dimensions': '14ft x 6ft x 30in',
            'Wood Type': 'Premium Teak',
            'Finish': 'High Gloss Polyurethane',
            'Seating Capacity': '16 persons'
          },
          quantity: 1,
          unit: 'piece',
          unitPrice: 750000,
          discount: 50000,
          discountType: 'fixed',
          netAmount: 700000,
          taxRate: 18,
          taxAmount: 126000,
          totalAmount: 826000,
          deliveryTime: 35,
          notes: 'Custom logo engraving included'
        },
        {
          id: 'LI-002',
          productCode: 'KFW-CHAIR-EXEC-001',
          productName: 'Executive Chairs Set',
          description: 'Matching executive chairs with leather upholstery',
          category: 'furniture',
          specifications: {
            'Chair Count': '16 pieces',
            'Upholstery': 'Premium Leather',
            'Frame': 'Teak Wood',
            'Features': 'Ergonomic design'
          },
          quantity: 16,
          unit: 'pieces',
          unitPrice: 45000,
          discount: 72000,
          discountType: 'fixed',
          netAmount: 648000,
          taxRate: 18,
          taxAmount: 116640,
          totalAmount: 764640,
          deliveryTime: 28,
          notes: 'Bulk discount applied'
        }
      ],
      subtotal: 1348000,
      totalDiscount: 122000,
      totalTax: 242640,
      grandTotal: 1590640,
      margin: 420000,
      marginPercentage: 35.8,
      estimatedDelivery: '2024-02-20',
      termsConditions: {
        validityDays: 30,
        paymentTerms: '40% advance, 40% on completion, 20% after installation',
        deliveryTerms: 'Ex-works Kochi, Installation included',
        warrantyPeriod: '5 years structural, 2 years finish',
        installationIncluded: true,
        transportationCost: 25000,
        packagingCost: 15000,
        customizationAllowed: true,
        revisionLimit: 3,
        cancellationPolicy: '48 hours notice required'
      },
      salesPerson: 'Priya Nair',
      approver: 'Sales Manager',
      approvalDate: '2024-01-18',
      notes: [
        'Client specifically requested teak wood',
        'Installation team confirmed for Feb 20',
        'Logo engraving design approved'
      ],
      attachments: [
        'Technical_Drawings.pdf',
        'Material_Specifications.pdf',
        'Installation_Guide.pdf'
      ],
      revisionHistory: [
        {
          version: '1.0',
          date: '2024-01-10',
          changes: 'Initial quote created',
          modifiedBy: 'Priya Nair'
        },
        {
          version: '2.0',
          date: '2024-01-15',
          changes: 'Added bulk discount, updated delivery terms',
          modifiedBy: 'Priya Nair'
        },
        {
          version: '2.1',
          date: '2024-01-18',
          changes: 'Minor specification updates',
          modifiedBy: 'Sales Manager'
        }
      ],
      competitorAnalysis: [
        {
          competitorName: 'Premium Furniture Co',
          competitorPrice: 1750000,
          ourAdvantage: 'Better quality wood, faster delivery'
        }
      ],
      followUpDates: ['2024-01-25', '2024-02-01'],
      probability: 85,
      expectedCloseDate: '2024-02-05'
    },
    {
      id: 'QUO-002',
      quoteNumber: 'KFW-Q-2024-002',
      version: '1.3',
      status: 'under_review',
      priority: 'medium',
      customer: {
        id: 'CUST-002',
        name: 'Heritage Resort Kumarakom',
        type: 'business',
        contactPerson: 'Anitha Nambiar',
        email: 'orders@heritageresorts.com',
        phone: '+91 481 252 4900',
        address: {
          street: 'Kumarakom',
          city: 'Kottayam',
          state: 'Kerala',
          pincode: '686563',
          country: 'India'
        },
        gstNumber: '32AABCH5678L1Z5',
        creditLimit: 2000000,
        paymentTerms: '15 days',
        preferredCurrency: 'INR',
        region: 'domestic'
      },
      requestDate: '2024-01-12',
      submissionDate: '2024-01-16',
      validUntil: '2024-02-16',
      lastModified: '2024-01-20',
      lineItems: [
        {
          id: 'LI-003',
          productCode: 'KFW-DINING-TRAD-001',
          productName: 'Traditional Kerala Dining Set',
          description: 'Handcrafted rosewood dining set with traditional carvings',
          category: 'furniture',
          specifications: {
            'Table Size': '8ft x 4ft',
            'Chair Count': '8 chairs',
            'Wood Type': 'Rosewood',
            'Style': 'Traditional Kerala'
          },
          quantity: 1,
          unit: 'set',
          unitPrice: 320000,
          discount: 20000,
          discountType: 'fixed',
          netAmount: 300000,
          taxRate: 18,
          taxAmount: 54000,
          totalAmount: 354000,
          deliveryTime: 40,
          notes: 'Weather-resistant finish for outdoor use'
        }
      ],
      subtotal: 300000,
      totalDiscount: 20000,
      totalTax: 54000,
      grandTotal: 354000,
      margin: 85000,
      marginPercentage: 28.3,
      estimatedDelivery: '2024-02-25',
      termsConditions: {
        validityDays: 30,
        paymentTerms: '50% advance, 50% on delivery',
        deliveryTerms: 'Resort delivery and setup',
        warrantyPeriod: '3 years structural',
        installationIncluded: true,
        transportationCost: 8000,
        packagingCost: 5000,
        customizationAllowed: false,
        revisionLimit: 2,
        cancellationPolicy: '7 days notice required'
      },
      salesPerson: 'Arjun Kumar',
      notes: [
        'Resort prefers traditional designs',
        'Weather resistance is mandatory',
        'Bulk ordering for multiple properties possible'
      ],
      attachments: [
        'Traditional_Design_Reference.jpg',
        'Weather_Resistance_Certificate.pdf'
      ],
      revisionHistory: [
        {
          version: '1.0',
          date: '2024-01-12',
          changes: 'Initial quote',
          modifiedBy: 'Arjun Kumar'
        },
        {
          version: '1.3',
          date: '2024-01-20',
          changes: 'Added weather-resistant coating',
          modifiedBy: 'Arjun Kumar'
        }
      ],
      followUpDates: ['2024-01-28', '2024-02-05'],
      probability: 60,
      expectedCloseDate: '2024-02-10'
    },
    {
      id: 'QUO-003',
      quoteNumber: 'KFW-Q-2024-003',
      version: '1.0',
      status: 'draft',
      priority: 'urgent',
      customer: {
        id: 'CUST-003',
        name: 'Infosys Trivandrum Campus',
        type: 'business',
        contactPerson: 'Rakesh Krishnan',
        email: 'facilities@infosys.com',
        phone: '+91 471 664 4000',
        address: {
          street: 'Technopark',
          city: 'Trivandrum',
          state: 'Kerala',
          pincode: '695581',
          country: 'India'
        },
        gstNumber: '32AABCI5678M1Z6',
        creditLimit: 10000000,
        paymentTerms: '45 days',
        preferredCurrency: 'INR',
        region: 'domestic'
      },
      requestDate: '2024-01-22',
      validUntil: '2024-02-22',
      lastModified: '2024-01-22',
      lineItems: [
        {
          id: 'LI-004',
          productCode: 'KFW-WORKSTATION-MOD-001',
          productName: 'Modern Office Workstations',
          description: 'Modular workstations with integrated storage',
          category: 'furniture',
          specifications: {
            'Unit Count': '100 workstations',
            'Dimensions': '1200mm x 800mm',
            'Material': 'Engineered wood with teak veneer',
            'Features': 'Cable management, CPU holder'
          },
          quantity: 100,
          unit: 'units',
          unitPrice: 18500,
          discount: 0,
          discountType: 'percentage',
          netAmount: 1850000,
          taxRate: 18,
          taxAmount: 333000,
          totalAmount: 2183000,
          deliveryTime: 60,
          notes: 'Phased delivery required'
        }
      ],
      subtotal: 1850000,
      totalDiscount: 0,
      totalTax: 333000,
      grandTotal: 2183000,
      margin: 555000,
      marginPercentage: 30.0,
      estimatedDelivery: '2024-03-20',
      termsConditions: {
        validityDays: 30,
        paymentTerms: '30% advance, 50% on delivery, 20% after installation',
        deliveryTerms: 'Phased delivery and installation',
        warrantyPeriod: '2 years comprehensive',
        installationIncluded: true,
        transportationCost: 50000,
        packagingCost: 25000,
        customizationAllowed: true,
        revisionLimit: 5,
        cancellationPolicy: '15 days notice required'
      },
      salesPerson: 'Deepa Menon',
      notes: [
        'Large volume order - potential for future business',
        'Requires detailed installation plan',
        'Quality standards are very high'
      ],
      attachments: [
        'Workstation_Specifications.pdf',
        'Installation_Timeline.xlsx'
      ],
      revisionHistory: [
        {
          version: '1.0',
          date: '2024-01-22',
          changes: 'Initial draft created',
          modifiedBy: 'Deepa Menon'
        }
      ],
      followUpDates: ['2024-01-30'],
      probability: 75,
      expectedCloseDate: '2024-02-15'
    }
  ]

  const sampleAnalytics: QuoteAnalytics = {
    totalQuotes: 24,
    activeQuotes: 8,
    approvedQuotes: 6,
    conversionRate: 68.2,
    averageValue: 450000,
    totalValue: 10800000,
    monthlyTrend: 15.3,
    topCategories: [
      { category: 'Furniture', value: 8500000, count: 18 },
      { category: 'Accessories', value: 1500000, count: 4 },
      { category: 'Services', value: 800000, count: 2 }
    ],
    salesPerformance: [
      { salesperson: 'Priya Nair', quotes: 8, value: 4200000, conversion: 75 },
      { salesperson: 'Arjun Kumar', quotes: 6, value: 2800000, conversion: 66.7 },
      { salesperson: 'Deepa Menon', quotes: 5, value: 2400000, conversion: 60 },
      { salesperson: 'Rajesh Pillai', quotes: 5, value: 1400000, conversion: 80 }
    ]
  }

  useEffect(() => {
    setQuotes(sampleQuotes)
    setAnalytics(sampleAnalytics)
  }, [])

  const filteredQuotes = quotes.filter((quote: Quote) => {
    const matchesSearch = quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quote.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quote.salesPerson.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || quote.status === filterStatus
    const matchesPriority = filterPriority === 'all' || quote.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: Quote['status']): string => {
    const colors: Record<Quote['status'], string> = {
      'draft': 'bg-gray-500/10 text-gray-700 border-gray-500/30',
      'submitted': 'bg-blue-500/10 text-blue-700 border-blue-500/30',
      'under_review': 'bg-amber-500/10 text-amber-700 border-amber-500/30',
      'approved': 'bg-green-500/10 text-green-700 border-green-500/30',
      'rejected': 'bg-red-500/10 text-red-700 border-red-500/30',
      'expired': 'bg-red-500/10 text-red-700 border-red-500/30',
      'converted': 'bg-purple-500/10 text-purple-700 border-purple-500/30'
    }
    return colors[status] || colors.draft
  }

  const getPriorityColor = (priority: Quote['priority']): string => {
    const colors: Record<Quote['priority'], string> = {
      'low': 'bg-gray-500/10 text-gray-700 border-gray-500/30',
      'medium': 'bg-amber-500/10 text-amber-700 border-amber-500/30',
      'high': 'bg-orange-500/10 text-orange-700 border-orange-500/30',
      'urgent': 'bg-red-500/10 text-red-700 border-red-500/30'
    }
    return colors[priority] || colors.medium
  }

  const getStatusIcon = (status: Quote['status']) => {
    const icons: Record<Quote['status'], React.ElementType> = {
      'draft': Edit,
      'submitted': Send,
      'under_review': Clock,
      'approved': CheckCircle,
      'rejected': XCircle,
      'expired': AlertCircle,
      'converted': Star
    }
    return icons[status] || Edit
  }

  const calculateTotalQuoteValue = (): number => {
    return quotes.reduce((sum: number, quote: Quote) => sum + quote.grandTotal, 0)
  }

  const getActiveQuotesCount = (): number => {
    return quotes.filter((quote: Quote) => ['submitted', 'under_review', 'approved'].includes(quote.status)).length
  }

  const getConversionRate = (): number => {
    const convertedQuotes = quotes.filter((quote: Quote) => quote.status === 'converted').length
    const totalQuotes = quotes.length
    return totalQuotes > 0 ? (convertedQuotes / totalQuotes) * 100 : 0
  }

  const getAverageQuoteValue = (): number => {
    return quotes.length > 0 ? calculateTotalQuoteValue() / quotes.length : 0
  }

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <FileText className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Quotes Management</h1>
                  <p className="text-lg text-gray-300">Kerala Furniture Sales Quotations</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30">
                  <Calculator className="h-3 w-3 mr-1" />
                  Sales Active
                </Badge>
                <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                  <Plus className="h-4 w-4" />
                  New Quote
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Quote Value</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">₹{(calculateTotalQuoteValue() / 100000).toFixed(1)}L</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Pipeline value</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Active Quotes</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getActiveQuotesCount()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Pending decisions</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Conversion Rate</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getConversionRate().toFixed(1)}%</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Quote to order</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Average Value</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">₹{(getAverageQuoteValue() / 1000).toFixed(0)}K</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Per quote</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="jewelry-glass-card p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input
                    placeholder="Search quotes, customers, or sales person..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 jewelry-glass-input"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                  className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                >
                  All Status
                </Button>
                <Button
                  variant={filterStatus === 'submitted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('submitted')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <Send className="h-4 w-4" />
                  Submitted
                </Button>
                <Button
                  variant={filterStatus === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('approved')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approved
                </Button>
                <Button
                  variant={filterPriority === 'urgent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterPriority(filterPriority === 'urgent' ? 'all' : 'urgent')}
                  className="jewelry-glass-btn gap-1 text-red-700 hover:text-red-600"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Urgent
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="quotes" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="quotes" className="jewelry-glass-btn jewelry-text-luxury">Quotes</TabsTrigger>
              <TabsTrigger value="pipeline" className="jewelry-glass-btn jewelry-text-luxury">Sales Pipeline</TabsTrigger>
              <TabsTrigger value="analytics" className="jewelry-glass-btn jewelry-text-luxury">Analytics</TabsTrigger>
              <TabsTrigger value="templates" className="jewelry-glass-btn jewelry-text-luxury">Templates</TabsTrigger>
            </TabsList>

            {/* Quotes List */}
            <TabsContent value="quotes" className="space-y-4">
              <div className="space-y-4">
                {filteredQuotes.map((quote: Quote) => {
                  const StatusIcon = getStatusIcon(quote.status)
                  
                  return (
                    <div key={quote.id} className="jewelry-glass-card p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                            <StatusIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold jewelry-text-luxury">{quote.quoteNumber}</h3>
                              <Badge className={getStatusColor(quote.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {quote.status.replace('_', ' ').charAt(0).toUpperCase() + quote.status.replace('_', ' ').slice(1)}
                              </Badge>
                              <Badge className={getPriorityColor(quote.priority)}>
                                {quote.priority.charAt(0).toUpperCase() + quote.priority.slice(1)} Priority
                              </Badge>
                              <Badge variant="outline" className="text-xs jewelry-badge-text">
                                v{quote.version}
                              </Badge>
                            </div>
                            
                            {/* Customer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium text-gray-200">Customer:</span> {quote.customer.name}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Contact:</span> {quote.customer.contactPerson}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Sales Person:</span> {quote.salesPerson}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Valid Until:</span> {quote.validUntil}
                              </div>
                            </div>

                            {/* Quote Value & Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium text-gray-200">Quote Value:</span> ₹{quote.grandTotal.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Margin:</span> {quote.marginPercentage.toFixed(1)}%
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Items:</span> {quote.lineItems.length}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Probability:</span> {quote.probability}%
                              </div>
                            </div>

                            {/* Line Items Preview */}
                            <div className="mb-4">
                              <p className="text-sm font-medium jewelry-text-luxury mb-2">Products:</p>
                              <div className="space-y-1">
                                {quote.lineItems.slice(0, 2).map((item: QuoteLineItem) => (
                                  <div key={item.id} className="text-sm text-gray-300 flex justify-between">
                                    <span>{item.productName} ({item.quantity} {item.unit})</span>
                                    <span>₹{item.totalAmount.toLocaleString()}</span>
                                  </div>
                                ))}
                                {quote.lineItems.length > 2 && (
                                  <div className="text-xs text-gray-400">
                                    +{quote.lineItems.length - 2} more items
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Notes */}
                            {quote.notes.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-medium jewelry-text-luxury mb-2">Recent Notes:</p>
                                <div className="space-y-1">
                                  {quote.notes.slice(0, 2).map((note: string, index: number) => (
                                    <div key={index} className="text-sm text-gray-300 flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      {note}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Progress Indicator for Probability */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Conversion Probability</span>
                                <span className="text-sm font-medium jewelry-text-luxury">{quote.probability}%</span>
                              </div>
                              <Progress value={quote.probability} className="h-2" />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Copy className="h-3 w-3" />
                            Clone
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Download className="h-3 w-3" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Sales Pipeline */}
            <TabsContent value="pipeline" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pipeline Stages */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Sales Pipeline Stages</h3>
                  <div className="space-y-4">
                    {[
                      { stage: 'Draft', count: quotes.filter(q => q.status === 'draft').length, value: quotes.filter(q => q.status === 'draft').reduce((sum, q) => sum + q.grandTotal, 0) },
                      { stage: 'Submitted', count: quotes.filter(q => q.status === 'submitted').length, value: quotes.filter(q => q.status === 'submitted').reduce((sum, q) => sum + q.grandTotal, 0) },
                      { stage: 'Under Review', count: quotes.filter(q => q.status === 'under_review').length, value: quotes.filter(q => q.status === 'under_review').reduce((sum, q) => sum + q.grandTotal, 0) },
                      { stage: 'Approved', count: quotes.filter(q => q.status === 'approved').length, value: quotes.filter(q => q.status === 'approved').reduce((sum, q) => sum + q.grandTotal, 0) },
                      { stage: 'Converted', count: quotes.filter(q => q.status === 'converted').length, value: quotes.filter(q => q.status === 'converted').reduce((sum, q) => sum + q.grandTotal, 0) }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="font-medium jewelry-text-luxury">{item.stage}</div>
                          <div className="text-sm text-gray-300">{item.count} quotes</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold jewelry-text-luxury">₹{(item.value / 100000).toFixed(1)}L</div>
                          <div className="text-sm text-gray-300">
                            {((item.value / calculateTotalQuoteValue()) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Opportunities */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Top Opportunities</h3>
                  <div className="space-y-4">
                    {quotes
                      .filter(q => ['submitted', 'under_review', 'approved'].includes(q.status))
                      .sort((a, b) => b.grandTotal - a.grandTotal)
                      .slice(0, 5)
                      .map((quote) => (
                        <div key={quote.id} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium jewelry-text-luxury">{quote.customer.name}</h4>
                            <span className="font-semibold jewelry-text-luxury">₹{(quote.grandTotal / 100000).toFixed(1)}L</span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-300">{quote.quoteNumber}</span>
                            <Badge className={getStatusColor(quote.status)}>
                              {quote.status.replace('_', ' ').charAt(0).toUpperCase() + quote.status.replace('_', ' ').slice(1)}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-300">Probability</span>
                              <span className="text-sm font-medium jewelry-text-luxury">{quote.probability}%</span>
                            </div>
                            <Progress value={quote.probability} className="h-1" />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              {analytics && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance Metrics */}
                    <div className="jewelry-glass-card p-6">
                      <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Sales Performance</h3>
                      <div className="space-y-4">
                        {analytics.salesPerformance.map((person, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div>
                              <div className="font-medium jewelry-text-luxury">{person.salesperson}</div>
                              <div className="text-sm text-gray-300">{person.quotes} quotes</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold jewelry-text-luxury">₹{(person.value / 100000).toFixed(1)}L</div>
                              <div className="text-sm text-green-600">{person.conversion}% conversion</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Category Performance */}
                    <div className="jewelry-glass-card p-6">
                      <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Category Performance</h3>
                      <div className="space-y-4">
                        {analytics.topCategories.map((category, index) => (
                          <div key={index} className="p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium jewelry-text-luxury">{category.category}</div>
                              <div className="font-semibold jewelry-text-luxury">₹{(category.value / 100000).toFixed(1)}L</div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-300">{category.count} quotes</span>
                              <span className="text-sm text-gray-300">
                                {((category.value / analytics.totalValue) * 100).toFixed(1)}% of total
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Key Performance Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="jewelry-glass-card p-6 text-center">
                      <div className="text-3xl font-bold jewelry-text-gold">{analytics.conversionRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-300">Conversion Rate</div>
                      <div className="text-xs text-gray-300 mt-1">Target: &gt;70%</div>
                    </div>
                    <div className="jewelry-glass-card p-6 text-center">
                      <div className="text-3xl font-bold jewelry-text-gold">₹{(analytics.averageValue / 1000).toFixed(0)}K</div>
                      <div className="text-sm text-gray-300">Average Quote Value</div>
                      <div className="text-xs text-gray-300 mt-1">+{analytics.monthlyTrend}% this month</div>
                    </div>
                    <div className="jewelry-glass-card p-6 text-center">
                      <div className="text-3xl font-bold jewelry-text-gold">{analytics.activeQuotes}</div>
                      <div className="text-sm text-gray-300">Active Quotes</div>
                      <div className="text-xs text-gray-300 mt-1">Pending decisions</div>
                    </div>
                    <div className="jewelry-glass-card p-6 text-center">
                      <div className="text-3xl font-bold jewelry-text-gold">₹{(analytics.totalValue / 1000000).toFixed(1)}M</div>
                      <div className="text-sm text-gray-300">Total Pipeline Value</div>
                      <div className="text-xs text-gray-300 mt-1">All quotes combined</div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Templates */}
            <TabsContent value="templates" className="space-y-4">
              <div className="jewelry-glass-card p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium jewelry-text-luxury mb-2">Quote Templates</h3>
                <p className="text-gray-300 mb-4">Standardized quote templates for different product categories</p>
                <Button className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                  Create Template
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}