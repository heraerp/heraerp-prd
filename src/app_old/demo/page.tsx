'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Scissors,
  IceCream2,
  UtensilsCrossed,
  Stethoscope,
  Factory,
  Store,
  Briefcase,
  GraduationCap,
  ArrowRight,
  Clock,
  Shield,
  Zap,
  Globe,
  Users,
  TrendingUp,
  Sparkles,
  Play,
  Building,
  ChevronRight,
  Check,
  Star,
  Rocket,
  Menu,
  X,
  BarChart3,
  Search,
  Filter,
  ExternalLink,
  FileText,
  Code,
  Palette,
  ShoppingCart,
  Heart,
  Package,
  Activity,
  DollarSign,
  Layers,
  Grid3x3,
  MessageSquare,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Demo apps data - comprehensive list
const demoApps = [
  {
    id: 'salon',
    title: 'Salon & Spa Management',
    shortTitle: 'Salon',
    description: 'Complete salon management with appointments, inventory, and customer loyalty',
    icon: Scissors,
    category: 'Service Industry',
    tags: ['Appointments', 'Staff Management', 'Inventory', 'WhatsApp'],
    color: 'from-purple-500 to-pink-600',
    bgColor: 'from-purple-50 to-pink-50',
    darkBgColor: 'dark:from-purple-900/20 dark:to-pink-900/20',
    features: [
      'Appointment Calendar',
      'Staff Scheduling',
      'Inventory Tracking',
      'WhatsApp Integration',
      'Customer Loyalty',
      'Service Analytics'
    ],
    demoUrl: '/salon-data',
    docsUrl: '/docs/salon-guide',
    stats: {
      activeUsers: '2,456',
      transactionsProcessed: '124K',
      rating: 4.8,
      setupTime: '30 seconds'
    },
    status: 'live'
  },
  {
    id: 'furniture',
    title: 'Furniture Manufacturing',
    shortTitle: 'Furniture',
    description: 'End-to-end furniture manufacturing with BOM, production planning, and inventory',
    icon: Package,
    category: 'Manufacturing',
    tags: ['Production', 'BOM', 'Inventory', 'Quality Control'],
    color: 'from-amber-500 to-orange-600',
    bgColor: 'from-amber-50 to-orange-50',
    darkBgColor: 'dark:from-amber-900/20 dark:to-orange-900/20',
    features: [
      'Bill of Materials',
      'Production Planning',
      'Quality Control',
      'Order Tracking',
      'Warehouse Management',
      'Cost Analysis'
    ],
    demoUrl: '/furniture',
    docsUrl: '/docs/furniture-guide',
    stats: {
      activeUsers: '892',
      transactionsProcessed: '45K',
      rating: 4.9,
      setupTime: '45 seconds'
    },
    status: 'live'
  },
  {
    id: 'restaurant',
    title: 'Restaurant POS & Kitchen',
    shortTitle: 'Restaurant',
    description: 'Full restaurant operations from menu to kitchen, billing to analytics',
    icon: UtensilsCrossed,
    category: 'Food & Beverage',
    tags: ['POS', 'Kitchen Display', 'Menu', 'Billing'],
    color: 'from-orange-500 to-red-600',
    bgColor: 'from-orange-50 to-red-50',
    darkBgColor: 'dark:from-orange-900/20 dark:to-red-900/20',
    features: [
      'Table Management',
      'Kitchen Display System',
      'Online Ordering',
      'Inventory Tracking',
      'Staff Management',
      'Financial Reports'
    ],
    demoUrl: '/org/restaurant',
    docsUrl: '/docs/restaurant-guide',
    stats: {
      activeUsers: '3,241',
      transactionsProcessed: '256K',
      rating: 4.7,
      setupTime: '60 seconds'
    },
    status: 'live'
  },
  {
    id: 'healthcare',
    title: 'Healthcare Practice',
    shortTitle: 'Healthcare',
    description: 'Patient management, appointments, prescriptions, and insurance billing',
    icon: Heart,
    category: 'Healthcare',
    tags: ['EMR', 'Appointments', 'Prescriptions', 'Insurance'],
    color: 'from-green-500 to-emerald-600',
    bgColor: 'from-green-50 to-emerald-50',
    darkBgColor: 'dark:from-green-900/20 dark:to-emerald-900/20',
    features: [
      'Electronic Medical Records',
      'Appointment Scheduling',
      'E-Prescriptions',
      'Insurance Claims',
      'Lab Integration',
      'Patient Portal'
    ],
    demoUrl: '/healthcare',
    docsUrl: '/docs/healthcare-guide',
    stats: {
      activeUsers: '856',
      transactionsProcessed: '89K',
      rating: 4.9,
      setupTime: '90 seconds'
    },
    status: 'live'
  },
  {
    id: 'retail',
    title: 'Retail Chain Management',
    shortTitle: 'Retail',
    description: 'Multi-store retail operations with inventory sync and analytics',
    icon: ShoppingCart,
    category: 'Retail',
    tags: ['Multi-store', 'Inventory', 'POS', 'Analytics'],
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'from-blue-50 to-indigo-50',
    darkBgColor: 'dark:from-blue-900/20 dark:to-indigo-900/20',
    features: [
      'Multi-store Management',
      'Inventory Sync',
      'Point of Sale',
      'Customer Analytics',
      'Supply Chain',
      'Promotions Engine'
    ],
    demoUrl: '/retail',
    docsUrl: '/docs/retail-guide',
    stats: {
      activeUsers: '1,523',
      transactionsProcessed: '342K',
      rating: 4.6,
      setupTime: '2 minutes'
    },
    status: 'beta'
  },
  {
    id: 'professional',
    title: 'Professional Services',
    shortTitle: 'Services',
    description: 'Project management, time tracking, and client billing for service firms',
    icon: Briefcase,
    category: 'Professional Services',
    tags: ['Projects', 'Time Tracking', 'Billing', 'CRM'],
    color: 'from-slate-500 to-gray-600',
    bgColor: 'from-slate-50 to-gray-900',
    darkBgColor: 'dark:from-slate-900/20 dark:to-gray-900/20',
    features: [
      'Project Management',
      'Time Tracking',
      'Resource Planning',
      'Client Billing',
      'Document Management',
      'Profitability Analysis'
    ],
    demoUrl: '/professional',
    docsUrl: '/docs/professional-guide',
    stats: {
      activeUsers: '645',
      transactionsProcessed: '28K',
      rating: 4.7,
      setupTime: '45 seconds'
    },
    status: 'beta'
  },
  {
    id: 'universal-ui',
    title: 'Universal UI Components',
    shortTitle: 'UI Demo',
    description: "Explore HERA's universal UI component library with live examples",
    icon: Palette,
    category: 'Developer Tools',
    tags: ['Components', 'Design System', 'Glassmorphism', 'Templates'],
    color: 'from-pink-500 to-rose-600',
    bgColor: 'from-pink-50 to-rose-50',
    darkBgColor: 'dark:from-pink-900/20 dark:to-rose-900/20',
    features: [
      'Component Gallery',
      'Live Code Examples',
      'Theme Customization',
      'Animation Library',
      'Responsive Layouts',
      'Dark Mode Support'
    ],
    demoUrl: '/universal-ui/demo',
    docsUrl: '/docs/ui-components',
    stats: {
      activeUsers: '5,234',
      transactionsProcessed: 'N/A',
      rating: 4.9,
      setupTime: 'Instant'
    },
    status: 'live'
  },
  {
    id: 'analytics',
    title: 'Business Analytics Suite',
    shortTitle: 'Analytics',
    description: 'Universal business intelligence and analytics dashboards',
    icon: Activity,
    category: 'Analytics',
    tags: ['Dashboards', 'Reports', 'KPIs', 'Real-time'],
    color: 'from-cyan-500 to-teal-600',
    bgColor: 'from-cyan-50 to-teal-50',
    darkBgColor: 'dark:from-cyan-900/20 dark:to-teal-900/20',
    features: [
      'Real-time Dashboards',
      'Custom Reports',
      'KPI Tracking',
      'Data Visualization',
      'Predictive Analytics',
      'Export & Integration'
    ],
    demoUrl: '/analytics-demo',
    docsUrl: '/docs/analytics-guide',
    stats: {
      activeUsers: '3,892',
      transactionsProcessed: '1.2M queries',
      rating: 4.8,
      setupTime: 'Instant'
    },
    status: 'live'
  },
  {
    id: 'finance',
    title: 'Financial Management',
    shortTitle: 'Finance',
    description: 'Complete financial management with GL, AP/AR, and reporting',
    icon: DollarSign,
    category: 'Finance',
    tags: ['Accounting', 'GL', 'Reports', 'Compliance'],
    color: 'from-emerald-500 to-green-600',
    bgColor: 'from-emerald-50 to-green-50',
    darkBgColor: 'dark:from-emerald-900/20 dark:to-green-900/20',
    features: [
      'General Ledger',
      'Accounts Payable/Receivable',
      'Financial Reporting',
      'Budget Management',
      'Tax Compliance',
      'Audit Trail'
    ],
    demoUrl: '/finance-demo',
    docsUrl: '/docs/finance-guide',
    stats: {
      activeUsers: '2,156',
      transactionsProcessed: '456K',
      rating: 4.9,
      setupTime: '2 minutes'
    },
    status: 'live'
  }
]

// Categories for filtering
const categories = [
  { id: 'all', name: 'All Apps', count: demoApps.length },
  { id: 'Service Industry', name: 'Service Industry', count: 1 },
  { id: 'Manufacturing', name: 'Manufacturing', count: 1 },
  { id: 'Food & Beverage', name: 'Food & Beverage', count: 1 },
  { id: 'Healthcare', name: 'Healthcare', count: 1 },
  { id: 'Retail', name: 'Retail', count: 1 },
  { id: 'Professional Services', name: 'Professional Services', count: 1 },
  { id: 'Developer Tools', name: 'Developer Tools', count: 1 },
  { id: 'Analytics', name: 'Analytics', count: 1 },
  { id: 'Finance', name: 'Finance', count: 1 }
]

// Featured apps IDs
const featuredAppIds = ['salon', 'furniture', 'restaurant', 'universal-ui']

// Statistics for the hero section
const stats = [
  { value: '12', label: 'Demo Apps', icon: Grid3x3 },
  { value: '10K+', label: 'Active Users', icon: Users },
  { value: '2.5M', label: 'Transactions', icon: Activity },
  { value: '4.8', label: 'Avg Rating', icon: Star }
]

// Coming soon apps
const comingSoonApps = [
  {
    title: 'Education Management',
    icon: GraduationCap,
    description: 'Student enrollment, course management, and grading',
    category: 'Education'
  },
  {
    title: 'Logistics & Shipping',
    icon: Package,
    description: 'Fleet management, route optimization, and tracking',
    category: 'Logistics'
  },
  {
    title: 'Hotel Management',
    icon: Building,
    description: 'Room booking, housekeeping, and guest services',
    category: 'Hospitality'
  },
  {
    title: 'Agricultural Operations',
    icon: Layers,
    description: 'Farm management, crop tracking, and supply chain',
    category: 'Agriculture'
  }
]

export default function DemoAppsPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showRequestForm, setShowRequestForm] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Filter demo apps based on search and category
  const filteredApps = demoApps.filter(app => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const featuredApps = demoApps.filter(app => featuredAppIds.includes(app.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Glassmorphic Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 dark:bg-background/60 border-b border-border/20 dark:border-slate-800/50 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/25">
                <span className="text-foreground font-bold text-lg sm:text-xl">H</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-gray-900 dark:to-slate-200 bg-clip-text text-transparent">
                  HERA Demo Apps
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
                  Explore Live Business Applications
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                href="/docs"
                className="text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/pricing"
                className="text-muted-foreground hover:text-foreground dark:text-slate-300 dark:hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="!text-slate-700 dark:!text-slate-200 border-input/50 hover:border-input"
                onClick={() => setShowRequestForm(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Request Demo
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 !text-foreground dark:!text-foreground shadow-lg shadow-blue-600/25"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-background/50 dark:bg-muted/50 backdrop-blur-sm"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-muted-foreground dark:text-slate-300" />
              ) : (
                <Menu className="w-5 h-5 text-muted-foreground dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background/95 dark:bg-background/95 backdrop-blur-xl border-t border-border/20 dark:border-slate-800/50">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Link href="/" className="block py-2 text-slate-700 dark:text-slate-300">
                Home
              </Link>
              <Link href="/docs" className="block py-2 text-slate-700 dark:text-slate-300">
                Documentation
              </Link>
              <Link href="/pricing" className="block py-2 text-slate-700 dark:text-slate-300">
                Pricing
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowRequestForm(true)
                }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Request Demo
              </Button>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-8 sm:pt-16 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 sm:space-y-8">
            {/* Animated Badge */}
            <div
              className={`inline-flex transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-50 animate-pulse"></div>
                <Badge className="relative px-4 py-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-blue-600/20 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 mr-2 text-primary" />
                  <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    12 Live Demo Apps Available
                  </span>
                </Badge>
              </div>
            </div>

            {/* Main Title */}
            <h1
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold transition-all duration-700 delay-100 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-gray-900 dark:via-slate-200 dark:to-gray-900 bg-clip-text text-transparent">
                Experience HERA
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Through Live Demos
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className={`text-lg sm:text-xl text-muted-foreground dark:text-slate-300 max-w-3xl mx-auto transition-all duration-700 delay-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Explore fully-functional business applications built on HERA's universal architecture.
              Each demo is a real implementation you can try, customize, and deploy.
            </p>
          </div>

          {/* Statistics */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                <div className="inline-flex p-3 rounded-2xl bg-background/50 dark:bg-muted/50 backdrop-blur-sm border border-border/20 dark:border-border/50 shadow-lg mb-3">
                  <stat.icon className="w-6 h-6 text-primary dark:text-blue-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="relative py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search demo apps by name, category, or features..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-base rounded-2xl border-border/50 dark:border-border/50 bg-background/70 dark:bg-muted/70 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 !text-foreground border-0'
                      : 'bg-background/50 dark:bg-muted/50 backdrop-blur-sm border-border/50 dark:border-border/50'
                  }
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2 bg-background/20 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Apps Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-foreground mb-2">
              Featured Demo Apps
            </h2>
            <p className="text-muted-foreground dark:text-slate-300">
              Popular apps that showcase HERA's capabilities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {featuredApps.map((app, index) => (
              <div
                key={app.id}
                className={`group transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Card className="h-full overflow-hidden bg-background/70 dark:bg-muted/70 backdrop-blur-sm border-border/20 dark:border-border/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`h-2 bg-gradient-to-r ${app.color}`} />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${app.bgColor} ${app.darkBgColor} backdrop-blur-sm`}
                      >
                        <app.icon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      >
                        {app.status === 'live' ? 'Live' : 'Beta'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground dark:text-foreground">
                      {app.shortTitle}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground dark:text-slate-300 line-clamp-2">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground dark:text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{app.stats.activeUsers}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span>{app.stats.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{app.stats.setupTime}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 !text-foreground"
                      onClick={() => router.push(app.demoUrl)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Try Demo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Demo Apps Grid */}
      <section className="py-12 bg-gradient-to-b from-transparent via-slate-50/50 to-transparent dark:via-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-foreground mb-2">
              All Demo Applications
            </h2>
            <p className="text-muted-foreground dark:text-slate-300">
              {filteredApps.length} apps matching your criteria
            </p>
          </div>

          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="grid">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {filteredApps.map((app, index) => (
                  <div
                    key={app.id}
                    className={`group transition-all duration-700 ${
                      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <Card className="h-full overflow-hidden bg-background/80 dark:bg-muted/80 backdrop-blur-md border-white/50 dark:border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
                      <div
                        className={`h-1 bg-gradient-to-r ${app.color} transition-all duration-300 group-hover:h-2`}
                      />
                      <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={`p-4 rounded-2xl bg-gradient-to-br ${app.bgColor} ${app.darkBgColor} backdrop-blur-sm shadow-lg`}
                          >
                            <app.icon className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge
                              variant="secondary"
                              className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            >
                              {app.category}
                            </Badge>
                            {app.status === 'beta' && (
                              <Badge
                                variant="outline"
                                className="text-xs border-orange-300 text-orange-700 dark:text-orange-300"
                              >
                                Beta
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-xl font-bold text-foreground dark:text-foreground mb-2">
                          {app.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground dark:text-slate-300 line-clamp-2">
                          {app.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Features */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-slate-700 dark:text-foreground uppercase tracking-wider">
                            Key Features
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {app.features.slice(0, 3).map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs py-0.5 px-2">
                                {feature}
                              </Badge>
                            ))}
                            {app.features.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-xs py-0.5 px-2 bg-slate-50 dark:bg-muted"
                              >
                                +{app.features.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-border/50">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-foreground dark:text-foreground">
                              {app.stats.activeUsers}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-muted-foreground">Users</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                              <span className="text-sm font-semibold text-foreground dark:text-foreground">
                                {app.stats.rating}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-muted-foreground">Rating</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-foreground dark:text-foreground">
                              {app.stats.setupTime}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-muted-foreground">Setup</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 !text-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                            onClick={() => router.push(app.demoUrl)}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Launch Demo
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => router.push(app.docsUrl)}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Docs
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => window.open(app.demoUrl, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              New Tab
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="list">
              <div className="space-y-4 max-w-5xl mx-auto">
                {filteredApps.map((app, index) => (
                  <div
                    key={app.id}
                    className={`transition-all duration-700 ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <Card className="overflow-hidden bg-background/80 dark:bg-muted/80 backdrop-blur-md border-white/50 dark:border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-6 p-6">
                        <div
                          className={`p-4 rounded-2xl bg-gradient-to-br ${app.bgColor} ${app.darkBgColor} backdrop-blur-sm shrink-0`}
                        >
                          <app.icon className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-foreground dark:text-foreground">
                                {app.title}
                              </h3>
                              <p className="text-sm text-muted-foreground dark:text-slate-300">
                                {app.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <Badge variant="secondary" className="text-xs">
                                {app.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                <span className="font-medium">{app.stats.rating}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 mt-3">
                            <div className="flex flex-wrap gap-2 flex-1">
                              {app.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600"
                                onClick={() => router.push(app.demoUrl)}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Try Demo
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(app.docsUrl)}
                              >
                                <FileText className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {filteredApps.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-muted mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2">
                No apps found
              </h3>
              <p className="text-muted-foreground dark:text-slate-300 mb-4">
                Try adjusting your search or filters
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-foreground mb-3">
              Coming Soon
            </h2>
            <p className="text-muted-foreground dark:text-slate-300">
              Next-generation demo apps in development
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {comingSoonApps.map((app, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Card className="h-full bg-background/80 dark:bg-muted/80 backdrop-blur-sm border-border/50 dark:border-border/50 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mb-3">
                      <app.icon className="w-6 h-6 text-slate-500 dark:text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg text-foreground dark:text-foreground">
                      {app.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground dark:text-muted-foreground">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant="outline"
                      className="w-full justify-center py-1 text-slate-700 dark:text-slate-300 border-input dark:border-input"
                    >
                      {app.category}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request Demo Form Modal */}
      {showRequestForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/50 backdrop-blur-sm"
          onClick={() => setShowRequestForm(false)}
        >
          <div
            className="bg-background dark:bg-background rounded-2xl shadow-2xl p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground dark:text-foreground">
                Request a New Demo
              </h3>
              <button
                onClick={() => setShowRequestForm(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Your Name
                </label>
                <Input type="text" placeholder="John Doe" className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <Input type="email" placeholder="john@company.com" className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Industry/App Type
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Hotel Management, Logistics"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Tell us about your business needs..."
                  className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-muted text-foreground dark:text-foreground focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50"
                  rows={3}
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 !text-foreground"
                onClick={e => {
                  e.preventDefault()
                  setShowRequestForm(false)
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Final CTA */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Build Your Business App?
            </h2>
            <p className="text-lg md:text-xl text-slate-300 mb-8">
              Start with a demo, customize it to your needs, and deploy in minutes
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-slate-100 !text-foreground px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => router.push('/auth/signup')}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white !text-foreground hover:bg-background hover:!text-foreground px-8 py-6 text-lg"
                onClick={() => setShowRequestForm(true)}
              >
                Request Custom Demo
                <MessageSquare className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Deploy instantly
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background dark:bg-background border-t border-border dark:border-slate-800 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground">
              © 2025 HERA ERP. All rights reserved. •
              <Link href="/privacy" className="hover:text-foreground dark:hover:text-foreground">
                {' '}
                Privacy
              </Link>{' '}
              •
              <Link href="/terms" className="hover:text-foreground dark:hover:text-foreground">
                {' '}
                Terms
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
