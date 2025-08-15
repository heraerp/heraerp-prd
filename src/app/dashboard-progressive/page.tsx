'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  LogOut, 
  User, 
  Building, 
  Users, 
  DollarSign, 
  FileText, 
  GraduationCap,
  Wallet,
  Bot,
  BarChart3,
  PieChart,
  Settings,
  Package,
  ShoppingCart,
  Calculator,
  BookOpen,
  Shield,
  Zap,
  TrendingUp,
  Database,
  Globe,
  ChevronRight,
  Sparkles,
  Crown,
  Target,
  Home,
  Search,
  Bell,
  MessageSquare,
  Calendar,
  Plus,
  MoreHorizontal,
  Gem,
  Scissors,
  MapPin,
  Palette,
  Clock,
  Brain,
  Zap as UpgradeIcon,
  Code,
  CreditCard,
  Calendar as CalendarIcon,
  CheckCircle,
  ArrowRight,
  Gift,
  Rocket,
  Mail,
  Plane,
  Utensils
} from 'lucide-react'

// HERA Progressive Applications - Public Showcase
const heraApplications = [
  {
    id: 'customers',
    title: 'CRM & Sales',
    description: 'Complete customer relationship management with sales pipeline, lead tracking, and automated workflows',
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    url: '/crm-progressive',
    complexity: 'Standard',
    implementationDays: 5,
    features: ['Lead Management', 'Sales Pipeline', 'Customer Analytics', 'Email Integration', 'Mobile CRM'],
    category: 'Sales & Marketing',
    status: 'Production Ready'
  },
  {
    id: 'finance',
    title: 'Financial Management',
    description: 'Comprehensive accounting, budgeting, and financial reporting with real-time insights',
    icon: DollarSign,
    color: 'from-green-500 to-green-600',
    url: '/financial-progressive',
    complexity: 'Advanced',
    implementationDays: 7,
    features: ['General Ledger', 'AP/AR Management', 'Financial Reporting', 'Budget Planning', 'Tax Compliance'],
    category: 'Finance & Accounting',
    status: 'Production Ready'
  },
  {
    id: 'profitability',
    title: 'Profitability & Cost Accounting',
    description: 'Advanced cost accounting with activity-based costing, profit center analysis, and BOM integration',
    icon: PieChart,
    color: 'from-blue-500 to-purple-600',
    url: '/profitability-progressive',
    complexity: 'Advanced',
    implementationDays: 5,
    features: ['Activity-Based Costing', 'Profit Center Analysis', 'BOM Integration', 'Cost Variance Analysis', 'Profitability Reports'],
    category: 'Finance & Accounting',
    status: 'Production Ready'
  },
  {
    id: 'learn',
    title: 'Learning Management',
    description: 'AI-powered education platform with personalized learning paths and performance tracking',
    icon: GraduationCap,
    color: 'from-emerald-500 to-emerald-600',
    url: '/learning/ca-final',
    complexity: 'Standard',
    implementationDays: 4,
    features: ['AI Tutoring', 'Progress Tracking', 'Mock Tests', 'Gamification', 'Multi-Subject Support'],
    category: 'Education & Training',
    status: 'Production Ready'
  },
  {
    id: 'jewelry',
    title: 'Jewelry Management',
    description: 'Specialized jewelry business management with inventory, certifications, and appraisals',
    icon: Gem,
    color: 'from-purple-500 to-pink-600',
    url: '/jewelry-progressive',
    complexity: 'Specialized',
    implementationDays: 6,
    features: ['Inventory Tracking', 'Certification Management', 'Appraisal System', 'Customer Registry', 'Repair Tracking'],
    category: 'Retail & Specialty',
    status: 'Production Ready'
  },
  {
    id: 'restaurant',
    title: 'Restaurant Management',
    description: 'Complete restaurant POS system with offline support, kitchen display, inventory, and staff management',
    icon: Utensils,
    color: 'from-orange-500 to-red-600',
    url: '/restaurant-progressive',
    complexity: 'Advanced',
    implementationDays: 4,
    features: ['Offline-First POS', 'Kitchen Display System', 'Multi-Service Modes', 'Real-time Sync', 'Staff Management'],
    category: 'Food & Beverage',
    status: 'Production Ready'
  },
  {
    id: 'audit',
    title: 'Audit Management',
    description: 'GSPU 2025 compliant audit workflow with document management and client tracking',
    icon: BarChart3,
    color: 'from-indigo-500 to-indigo-600',
    url: '/audit-progressive',
    complexity: 'Advanced',
    implementationDays: 7,
    features: ['GSPU Compliance', 'Document Management', 'Audit Trail', 'Client Dashboards', 'Regulatory Reporting'],
    category: 'Professional Services',
    status: 'Production Ready'
  },
  {
    id: 'retail',
    title: 'Enterprise Retail',
    description: 'Complete retail operations management with POS, inventory, and multi-location support',
    icon: ShoppingCart,
    color: 'from-orange-500 to-red-600',
    url: 'http://localhost:3002/enterprise-retail-progressive',
    complexity: 'Enterprise',
    implementationDays: 7,
    features: ['Multi-Location POS', 'Inventory Management', 'Supply Chain', 'Customer Loyalty', 'Analytics Dashboard'],
    category: 'Retail & E-commerce',
    status: 'Production Ready'
  },
  {
    id: 'pwm-progressive',
    title: 'Private Wealth Management',
    description: 'Ultra-High Net Worth client management with portfolio tracking and compliance',
    icon: Crown,
    color: 'from-purple-600 to-indigo-600',
    url: '/pwm-progressive',
    complexity: 'Enterprise',
    implementationDays: 7,
    features: ['Portfolio Management', 'Risk Assessment', 'Compliance Tracking', 'Client Reporting', 'Document Vault'],
    category: 'Financial Services',
    status: 'Production Ready'
  },
  {
    id: 'salon-progressive',
    title: 'Salon & Spa Management',
    description: 'Complete beauty and wellness business management with booking and customer care',
    icon: Scissors,
    color: 'from-pink-500 to-purple-600',
    url: '/salon-progressive',
    complexity: 'Standard',
    implementationDays: 5,
    features: ['Appointment Booking', 'Customer Management', 'Service Catalog', 'Staff Scheduling', 'Inventory Control'],
    category: 'Beauty & Wellness',
    status: 'Production Ready'
  },
  {
    id: 'bpo-progressive',
    title: 'BPO Invoice Workflow',
    description: 'Complete BPO outsourcing invoice workflow with Head Office and Back Office role separation',
    icon: Building,
    color: 'from-blue-500 to-purple-600',
    url: '/bpo-progressive',
    complexity: 'Enterprise',
    implementationDays: 3,
    features: ['Role-Based Access', 'Invoice Upload', 'Work Queue Management', 'SLA Monitoring', 'Communication Hub'],
    category: 'BPO & Outsourcing',
    status: 'Production Ready'
  },
  {
    id: 'healthcare',
    title: 'Healthcare Management',
    description: 'HIPAA-compliant patient management system with appointment scheduling and records',
    icon: Shield,
    color: 'from-teal-500 to-cyan-600',
    url: '/healthcare-progressive',
    complexity: 'Enterprise',
    implementationDays: 7,
    features: ['Patient Records', 'Appointment System', 'HIPAA Compliance', 'Billing Integration', 'Telemedicine'],
    category: 'Healthcare',
    status: 'Development'
  },
  {
    id: 'airline',
    title: 'Airline Management',
    description: 'Complete airline booking system with lottery upgrades, check-in, and loyalty management',
    icon: Plane,
    color: 'from-sky-500 to-blue-600',
    url: '/airline-progressive',
    complexity: 'Enterprise',
    implementationDays: 6,
    features: ['Flight Booking', 'Lottery Upgrades', 'Online Check-in', 'Loyalty Program', 'Revenue Management'],
    category: 'Transportation',
    status: 'Production Ready'
  },
  {
    id: 'email-progressive',
    title: 'Email Management',
    description: 'Universal email system with AI assistance, lead scoring, and campaign management',
    icon: Mail,
    color: 'from-rose-500 to-pink-600',
    url: '/email-progressive',
    complexity: 'Standard',
    implementationDays: 4,
    features: ['AI Email Generation', 'Lead Scoring', 'Campaign Management', 'Analytics Dashboard', 'Multi-Provider'],
    category: 'Communication',
    status: 'Production Ready'
  }
]

// HERA Value Propositions
const valuePropositions = [
  {
    id: 'local-partner',
    title: 'Local Partner',
    description: 'Dedicated support in your timezone',
    icon: MapPin,
    color: 'from-blue-500 to-cyan-500',
    gradient: 'bg-gradient-to-br from-blue-50 to-cyan-50'
  },
  {
    id: 'fully-customizable',
    title: 'Fully Customizable',
    description: 'Tailored exactly to your business',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    gradient: 'bg-gradient-to-br from-purple-50 to-pink-50'
  },
  {
    id: 'one-week-production',
    title: 'One Week to Production',
    description: 'Live and running in 7 days guaranteed',
    icon: Clock,
    color: 'from-orange-500 to-red-500',
    gradient: 'bg-gradient-to-br from-orange-50 to-red-50'
  },
  {
    id: 'embedded-ai',
    title: 'Embedded AI Insights',
    description: 'Smart recommendations built-in',
    icon: Brain,
    color: 'from-emerald-500 to-teal-500',
    gradient: 'bg-gradient-to-br from-emerald-50 to-teal-50'
  },
  {
    id: 'auto-upgrade',
    title: 'Auto Upgrade',
    description: 'Always latest features, zero downtime',
    icon: UpgradeIcon,
    color: 'from-indigo-500 to-blue-500',
    gradient: 'bg-gradient-to-br from-indigo-50 to-blue-50'
  },
  {
    id: 'free-prototype',
    title: 'Free Custom Prototype',
    description: 'Your unique needs, prototyped free',
    icon: Gift,
    color: 'from-pink-500 to-rose-500',
    gradient: 'bg-gradient-to-br from-pink-50 to-rose-50'
  }
]

// Pricing guarantees
const guarantees = [
  {
    id: 'saas',
    title: 'SaaS Based',
    description: 'Cloud-native, always accessible',
    icon: Globe
  },
  {
    id: 'money-back',
    title: '30-Day Money Back',
    description: 'Risk-free guarantee',
    icon: CheckCircle
  },
  {
    id: 'annual-only',
    title: 'Annual Subscription',
    description: 'Best value, maximum savings',
    icon: CalendarIcon
  }
]

// Sidebar navigation items (production ready apps only)
const sidebarItems = [
  {
    id: 'home',
    title: 'Home',
    icon: Home,
    url: '/dashboard-progressive',
    active: true
  },
  ...heraApplications
    .filter(app => app.status === 'Production Ready')
    .slice(0, 7)
    .map(app => ({
      id: app.id,
      title: app.title.split(' ')[0], // First word for sidebar
      icon: app.icon,
      url: app.url
    }))
]

// Secondary tools
const secondaryTools = [
  {
    id: 'wealth',
    title: 'Wealth',
    icon: Wallet,
    url: '/pwm'
  },
  {
    id: 'assistant',
    title: 'Assistant',
    icon: Bot,
    url: '/api/v1/ai/universal'
  }
]

// Quick actions in sidebar
const quickActions = [
  {
    id: 'search',
    title: 'Search',
    icon: Search,
    action: () => console.log('Search clicked')
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    action: () => console.log('Notifications clicked'),
    badge: 3
  },
  {
    id: 'messages',
    title: 'Messages',
    icon: MessageSquare,
    action: () => console.log('Messages clicked'),
    badge: 12
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: Calendar,
    action: () => console.log('Calendar clicked')
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: BarChart3,
    action: () => window.location.href = '/analytics'
  },
  {
    id: 'help',
    title: 'Help & Support',
    icon: MessageSquare,
    action: () => console.log('Help clicked')
  }
]

// Progressive Dashboard component (no authentication required)
export default function ProgressiveDashboard() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Get unique categories and statuses
  const categories = ['all', ...Array.from(new Set(heraApplications.map(app => app.category)))]
  const statuses = ['all', ...Array.from(new Set(heraApplications.map(app => app.status)))]

  // Filter applications based on search and filters
  const filteredApplications = heraApplications.filter(app => {
    const matchesSearch = app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.features.some(feature => feature.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Enterprise Glassmorphism Sidebar */}
      <aside className="w-20 bg-white/20 backdrop-blur-xl border-r border-white/20 flex flex-col shadow-2xl shadow-black/10">
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-white/20">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/90 to-purple-600/90 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/20 backdrop-blur-sm border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-200 group">
            <span className="text-white font-black text-xl drop-shadow-sm group-hover:scale-110 transition-transform">H</span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-4">
          <div className="space-y-2 px-3">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => window.location.href = item.url}
                className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
                  item.active 
                    ? 'bg-gradient-to-br from-indigo-500/90 to-purple-600/90 text-white shadow-lg shadow-indigo-500/20 backdrop-blur-sm border border-white/20' 
                    : 'bg-white/30 backdrop-blur-sm text-slate-600 hover:bg-white/50 hover:text-slate-800 hover:shadow-lg border border-white/20'
                }`}
                title={item.title}
              >
                <item.icon className="w-5 h-5" />
                
                {/* Tooltip */}
                <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[100]">
                  {item.title}
                </div>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="mx-6 my-6 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Quick Actions */}
          <div className="space-y-2 px-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className="w-14 h-14 rounded-xl bg-white/30 backdrop-blur-sm text-slate-600 hover:bg-white/50 hover:text-slate-800 flex items-center justify-center transition-all duration-300 group relative shadow-sm hover:shadow-lg border border-white/20 hover:border-white/30"
                title={action.title}
              >
                <action.icon className="w-4 h-4" />
                
                {/* Badge for notifications/messages */}
                {action.badge && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                    {action.badge > 9 ? '9+' : action.badge}
                  </div>
                )}
                
                {/* Tooltip */}
                <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[100]">
                  {action.title}
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/20">
          <div className="space-y-3">
            {/* Add Button - Premium Styling */}
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 flex items-center justify-center transition-all duration-300 group relative shadow-lg hover:shadow-xl hover:scale-105 border border-white/20"
              title="Sign Up for Full Access"
            >
              <Plus className="w-5 h-5" />
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] shadow-xl">
                <div className="font-semibold">Get Started</div>
                <div className="text-gray-300 text-xs">Sign up for full access</div>
              </div>
            </button>

            {/* Settings */}
            <button 
              onClick={() => console.log('Settings clicked')}
              className="w-14 h-14 rounded-xl bg-white/30 backdrop-blur-sm text-slate-600 hover:bg-white/50 hover:text-slate-800 flex items-center justify-center transition-all duration-300 group relative shadow-sm hover:shadow-lg border border-white/20 hover:border-white/30"
              title="Demo Settings"
            >
              <Settings className="w-4 h-4" />
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[100]">
                Demo Settings
              </div>
            </button>

            {/* Divider */}
            <div className="mx-2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Demo User */}
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-14 h-14 rounded-xl bg-white/30 backdrop-blur-sm text-slate-600 hover:bg-white/50 hover:text-slate-800 flex items-center justify-center transition-all duration-300 group relative shadow-sm hover:shadow-lg border border-white/20 hover:border-white/30"
              title="Demo User - Click to sign up"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg">
                D
              </div>
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] shadow-xl">
                <div className="font-semibold">Demo User</div>
                <div className="text-gray-300 text-xs">Click to sign up</div>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Enterprise Glassmorphism Header - Sticky */}
        <header className="sticky top-0 z-50 h-20 bg-white/30 backdrop-blur-2xl border-b border-white/30 flex items-center justify-between px-8 shadow-xl shadow-black/10 transition-all duration-300">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Progressive Applications</h1>
            <p className="text-sm text-slate-700 font-medium">Public Demo • <span className="text-indigo-600 font-bold">{heraApplications.length}</span> apps available • <span className="text-emerald-600 font-bold">No Login Required</span></p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              size="sm"
            >
              <User className="w-4 h-4 mr-2" />
              Sign Up for Full Access
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="bg-white/30 backdrop-blur-xl border border-white/20 text-slate-600 hover:bg-white/50 hover:text-slate-800 hover:shadow-lg transition-all duration-300"
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="bg-white/30 backdrop-blur-xl border border-white/20 text-slate-600 hover:bg-white/50 hover:text-slate-800 hover:shadow-lg transition-all duration-300"
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="bg-white/30 backdrop-blur-xl border border-white/20 text-slate-600 hover:bg-white/50 hover:text-slate-800 hover:shadow-lg transition-all duration-300"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8 bg-gradient-to-br from-slate-50/50 via-blue-50/50 to-indigo-100/50">
        
        {/* App Search Header */}
        <div className="mb-12">
          <div className="text-center max-w-4xl mx-auto mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">HERA</span> Progressive Applications
            </h2>
            <p className="text-xl text-slate-700 font-medium mb-4">
              Try our <span className="font-bold text-emerald-600">live demos</span> without any login required
            </p>
            
            {/* Bold Value Proposition */}
            <div className="bg-gradient-to-r from-emerald-600/90 to-green-600/90 backdrop-blur-sm text-white rounded-2xl p-6 mb-8 shadow-xl border border-white/20">
              <p className="text-2xl font-bold mb-2">
                <span className="text-amber-300">Free to Try</span> • <span className="text-blue-200">No Registration</span> • <span className="text-pink-200">Instant Access</span>
              </p>
              <p className="text-green-100 text-sm">
                Experience enterprise-grade applications instantly • Full functionality • Ready for your business
              </p>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-center mb-8">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:bg-white/80 transition-all text-slate-800 placeholder:text-slate-500"
                />
              </div>
              
              {/* Category Filter - Enterprise Glassmorphism */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-white/40 backdrop-blur-xl border border-white/20 text-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-400/20 hera-select-content"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              
              {/* Status Filter - Enterprise Glassmorphism */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 bg-white/40 backdrop-blur-xl border border-white/20 text-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-400/20 hera-select-content"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status}
                  </option>
                ))}
              </select>
              
              {/* View Toggle - Enterprise Glassmorphism */}
              <div className="flex bg-white/30 backdrop-blur-xl border border-white/20 rounded-2xl p-1 shadow-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg text-white backdrop-blur-xl' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/40 backdrop-blur-sm'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg text-white backdrop-blur-xl' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white/40 backdrop-blur-sm'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  List
                </button>
              </div>
            </div>
            
            {/* Results Summary */}
            <div className="text-center text-gray-600">
              Showing <span className="font-medium text-blue-600">{filteredApplications.length}</span> of <span className="font-medium text-purple-600">{heraApplications.length}</span> progressive applications
            </div>
          </div>
        </div>

        {/* Applications Grid/List View */}
        <div className="mb-24">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => window.location.href = app.url}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 border border-white/20 overflow-hidden">
                    {/* Premium gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-5 transition-opacity duration-700 rounded-3xl`}></div>
                    
                    {/* Header with Icon and Status */}
                    <div className="relative z-10 mb-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                          <app.icon className="w-8 h-8 text-white drop-shadow-sm" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            app.status === 'Production Ready' 
                              ? 'bg-green-100 text-green-700' 
                              : app.status === 'Beta Testing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {app.status}
                          </span>
                          <span className="px-2 py-1 rounded-md text-xs bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium border border-indigo-100">
                            Try Now →
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                          {app.title}
                        </h3>
                        <span className="text-sm text-slate-600 font-medium">{app.category}</span>
                      </div>
                      
                      <p className="text-slate-700 text-sm leading-relaxed mb-6">
                        {app.description}
                      </p>
                      
                      {/* Features */}
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                          {app.features.slice(0, 3).map((feature, index) => (
                            <span key={index} className="px-2 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">
                              {feature}
                            </span>
                          ))}
                          {app.features.length > 3 && (
                            <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-md">
                              +{app.features.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Complexity Badge */}
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          app.complexity === 'Standard' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : app.complexity === 'Advanced'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : app.complexity === 'Enterprise'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}>
                          {app.complexity}
                        </span>
                        <div className="flex items-center text-sm text-gray-400 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                          <span className="mr-2">Try Now</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Premium shine effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => window.location.href = app.url}
                  className="group cursor-pointer bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="flex items-center gap-6">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-300`}>
                      <app.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                            {app.title}
                          </h3>
                          <p className="text-sm text-gray-500">{app.category}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            app.status === 'Production Ready' 
                              ? 'bg-green-100 text-green-700' 
                              : app.status === 'Beta Testing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {app.status}
                          </span>
                          <span className="text-sm text-emerald-600 font-semibold">
                            Try Free
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">
                        {app.description}
                      </p>
                      
                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {app.features.slice(0, 5).map((feature, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
                            {feature}
                          </span>
                        ))}
                        {app.features.length > 5 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-md">
                            +{app.features.length - 5} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          app.complexity === 'Standard' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : app.complexity === 'Advanced'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : app.complexity === 'Enterprise'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}>
                          {app.complexity} Demo
                        </span>
                        <div className="flex items-center text-sm text-gray-400 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                          <span className="mr-2">Launch Demo</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Value Propositions - HERA Advantages */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-light text-gray-900 mb-4">Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-medium">HERA</span></h3>
            <p className="text-lg text-gray-600 font-light">Progressive applications, delivered with <span className="text-emerald-600 font-medium">simplicity</span></p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
            {valuePropositions.map((prop) => (
              <div key={prop.id} className="group">
                <div className={`relative ${prop.gradient} rounded-2xl p-8 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-gray-100`}>
                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${prop.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-all duration-300`}>
                      <prop.icon className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">{prop.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{prop.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Guarantees */}
          <div className="text-center">
            <div className="inline-flex items-center gap-8 bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              {guarantees.map((guarantee, index) => (
                <div key={guarantee.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <guarantee.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm">{guarantee.title}</p>
                    <p className="text-gray-600 text-xs">{guarantee.description}</p>
                  </div>
                  {index < guarantees.length - 1 && <div className="w-px h-10 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-200 ml-6" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sign Up CTA */}
        <div className="mb-20">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-light mb-4">Ready to Get Started?</h3>
              <p className="text-xl text-blue-100 font-light mb-8 leading-relaxed">
                Sign up now for full access to all enterprise applications with management tools, 
                user authentication, and complete customization capabilities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-50 hover:scale-105 text-lg px-8 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <User className="w-5 h-5 mr-2" />
                  Sign Up - Full Access
                </Button>
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle className="w-5 h-5 text-emerald-300" />
                  <span><span className="text-emerald-300">30-Day Free Trial</span> • No Credit Card • <span className="text-amber-300">Instant Setup</span></span>
                </div>
              </div>
            </div>
            
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
          </div>
        </div>

        {/* Additional Tools - Enhanced Premium Design */}
        <div className="max-w-3xl mx-auto mb-20">
          <div className="flex justify-center gap-12">
            {secondaryTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => window.location.href = tool.url}
                className="group flex flex-col items-center p-8 hover:bg-white hover:shadow-xl rounded-2xl transition-all duration-500 hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 group-hover:from-gray-200 group-hover:to-gray-300 group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <tool.icon className="w-8 h-8 text-gray-600 group-hover:text-gray-700" />
                </div>
                <span className="text-base text-gray-700 font-medium group-hover:text-gray-900 transition-colors duration-300">{tool.title}</span>
                <div className="mt-2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300 rounded-full"></div>
              </button>
            ))}
          </div>
        </div>
        
        </main>

        {/* Enterprise Glassmorphism Footer */}
        <footer className="bg-white/20 backdrop-blur-xl border-t border-white/20 shadow-lg shadow-black/5">
          <div className="max-w-7xl mx-auto px-8 py-12">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
              {/* HERA Brand Section */}
              <div className="lg:col-span-1">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/90 to-purple-600/90 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/20 backdrop-blur-sm border border-white/20 mr-3">
                    <span className="text-white font-black text-2xl drop-shadow-sm">H</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">HERA</h3>
                    <p className="text-sm text-slate-600 font-medium">Progressive Applications</p>
                  </div>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">
                  Revolutionary enterprise platform that handles infinite business complexity with zero configuration. 
                  Try our progressive applications instantly without any registration.
                </p>
                <div className="flex space-x-3">
                  <button className="w-10 h-10 bg-white/40 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center hover:shadow-lg transition-all duration-300 text-slate-600 hover:text-indigo-600">
                    <Globe className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 bg-white/40 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center hover:shadow-lg transition-all duration-300 text-slate-600 hover:text-indigo-600">
                    <Mail className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 bg-white/40 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center hover:shadow-lg transition-all duration-300 text-slate-600 hover:text-indigo-600">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Links */}
              <div className="lg:col-span-1">
                <h4 className="text-lg font-bold text-slate-800 mb-4">Try Applications</h4>
                <div className="space-y-3">
                  {sidebarItems.slice(1, 6).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => window.location.href = item.url}
                      className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors duration-300 text-sm group"
                    >
                      <item.icon className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform duration-300" />
                      <span className="group-hover:translate-x-1 transition-transform duration-300">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Progressive Features */}
              <div className="lg:col-span-1">
                <h4 className="text-lg font-bold text-slate-800 mb-4">Progressive Features</h4>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-600 text-sm">
                    <CheckCircle className="w-4 h-4 mr-3 text-green-600" />
                    <span>No Login Required</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm">
                    <CheckCircle className="w-4 h-4 mr-3 text-green-600" />
                    <span>Instant Access</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm">
                    <CheckCircle className="w-4 h-4 mr-3 text-green-600" />
                    <span>Full Functionality</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm">
                    <CheckCircle className="w-4 h-4 mr-3 text-green-600" />
                    <span>Mobile Responsive</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm">
                    <CheckCircle className="w-4 h-4 mr-3 text-green-600" />
                    <span>Enterprise Grade</span>
                  </div>
                </div>
              </div>

              {/* Demo Status */}
              <div className="lg:col-span-1">
                <h4 className="text-lg font-bold text-slate-800 mb-4">Demo Status</h4>
                <div className="space-y-4">
                  <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Demo Health</span>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs text-green-700 font-medium">Live</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600">All demos operational</div>
                  </div>
                  <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Response Time</span>
                      <span className="text-xs text-indigo-700 font-bold">&lt; 100ms</span>
                    </div>
                    <div className="text-xs text-slate-600">Progressive PWA</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="border-t border-white/20 pt-8">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                <div className="flex flex-col lg:flex-row items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-green-600" />
                    <span>Progressive Web Apps</span>
                  </div>
                  <div className="hidden lg:block w-px h-4 bg-slate-300"></div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    <span>Instant Access</span>
                  </div>
                  <div className="hidden lg:block w-px h-4 bg-slate-300"></div>
                  <div className="flex items-center">
                    <Database className="w-4 h-4 mr-2 text-purple-600" />
                    <span>Demo Platform v2.1</span>
                  </div>
                </div>
                
                <div className="flex flex-col lg:flex-row items-center gap-4 text-sm text-slate-600">
                  <span>© 2025 HERA Progressive Applications</span>
                  <div className="hidden lg:block w-px h-4 bg-slate-300"></div>
                  <div className="flex items-center gap-4">
                    <button className="hover:text-indigo-600 transition-colors duration-300">Privacy</button>
                    <button className="hover:text-indigo-600 transition-colors duration-300">Terms</button>
                    <button className="hover:text-indigo-600 transition-colors duration-300">Support</button>
                  </div>
                </div>
              </div>
              
              {/* Version & Build Info */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex justify-center">
                  <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-3">
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center">
                        <Code className="w-3 h-3 mr-1 text-indigo-600" />
                        <span>Demo: {new Date().toISOString().slice(0, 10)}</span>
                      </div>
                      <div className="w-px h-3 bg-slate-300"></div>
                      <div className="flex items-center">
                        <Zap className="w-3 h-3 mr-1 text-purple-600" />
                        <span>Progressive Web Apps</span>
                      </div>
                      <div className="w-px h-3 bg-slate-300"></div>
                      <div className="flex items-center">
                        <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
                        <span>No Login Required</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}