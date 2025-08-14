'use client'

import React, { useState } from 'react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EntityManager } from '@/components/crud/EntityManager'
import { UserManager } from '@/components/crud/UserManager'
import { RolePermissionManager } from '@/components/crud/RolePermissionManager'
import { VibeProvider } from '@/components/vibe/VibeProvider'
import { VibeDashboard } from '@/components/vibe/VibeDashboard'
import { VibeContextIndicator } from '@/components/vibe/VibeContextIndicator'
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

// HERA Enterprise Applications - Complete Ecosystem
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
    id: 'manufacturing',
    title: 'Manufacturing ERP',
    description: 'Complete manufacturing operations with production planning and quality control',
    icon: Settings,
    color: 'from-gray-500 to-slate-600',
    url: '/manufacturing-progressive',
    complexity: 'Enterprise',
    implementationDays: 7,
    features: ['Production Planning', 'Quality Control', 'Supply Chain', 'Maintenance Scheduling', 'Cost Tracking'],
    category: 'Manufacturing',
    status: 'Development'
  },
  {
    id: 'legal',
    title: 'Legal Practice Management',
    description: 'Complete law firm management with case tracking, time billing, and document management',
    icon: FileText,
    color: 'from-amber-500 to-yellow-600',
    url: '/legal-progressive',
    complexity: 'Advanced',
    implementationDays: 6,
    features: ['Case Management', 'Time Tracking', 'Document Library', 'Client Portal', 'Billing System'],
    category: 'Legal Services',
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
    url: '/dashboard',
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
    icon: Search
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell
  },
  {
    id: 'messages',
    title: 'Messages',
    icon: MessageSquare
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: Calendar
  }
]

// Dashboard component that shows after login
function DashboardContent() {
  const { user, logout } = useSupabaseAuth()
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showEntityManager, setShowEntityManager] = useState(false)
  const [showUserManager, setShowUserManager] = useState(false)
  const [showRoleManager, setShowRoleManager] = useState(false)
  const [showVibeDashboard, setShowVibeDashboard] = useState(false)

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

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login-supabase'
  }

  // Display user info from Supabase auth
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest'
  const organizationName = user?.user_metadata?.organization_name || 'Sample Business'

  return (
    <VibeProvider autoInitialize={true}>
      <div className="min-h-screen bg-white flex">
      {/* Teams-Style Sidebar */}
      <aside className="w-20 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">H</span>
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
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-sm hover:shadow-md'
                }`}
                title={item.title}
              >
                <item.icon className="w-5 h-5" />
                
                {/* Tooltip */}
                <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
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
                className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
                title={action.title}
              >
                <action.icon className="w-4 h-4" />
                
                {/* Tooltip */}
                <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {action.title}
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-200">
          <div className="space-y-2">
            {/* Add Button */}
            <button 
              className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
              title="Add New"
            >
              <Plus className="w-4 h-4" />
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Add New
              </div>
            </button>

            {/* Settings */}
            <button 
              className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Settings
              </div>
            </button>

            {/* User Profile */}
            <button 
              onClick={handleLogout}
              className="w-14 h-14 rounded-xl bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all duration-200 group relative shadow-sm"
              title={`${displayName} - Sign out`}
            >
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute left-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                Sign out
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Enterprise Applications</h1>
            <p className="text-sm text-gray-500">{organizationName} • <span className="text-purple-600 font-medium">{heraApplications.length}</span> apps available</p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-4">
            <Button 
              variant={showEntityManager ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                setShowEntityManager(!showEntityManager)
                if (!showEntityManager) {
                  setShowUserManager(false)
                  setShowRoleManager(false)
                  setShowVibeDashboard(false)
                }
              }}
            >
              <Database className="w-4 h-4 mr-2" />
              {showEntityManager ? 'Hide' : 'Show'} Entity Manager
            </Button>
            <Button 
              variant={showUserManager ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                setShowUserManager(!showUserManager)
                if (!showUserManager) {
                  setShowEntityManager(false)
                  setShowRoleManager(false)
                  setShowVibeDashboard(false)
                }
              }}
            >
              <Users className="w-4 h-4 mr-2" />
              {showUserManager ? 'Hide' : 'Show'} User Manager
            </Button>
            <Button 
              variant={showRoleManager ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                setShowRoleManager(!showRoleManager)
                if (!showRoleManager) {
                  setShowEntityManager(false)
                  setShowUserManager(false)
                  setShowVibeDashboard(false)
                }
              }}
            >
              <Shield className="w-4 h-4 mr-2" />
              {showRoleManager ? 'Hide' : 'Show'} Role Manager
            </Button>
            <Button 
              variant={showVibeDashboard ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                setShowVibeDashboard(!showVibeDashboard)
                if (!showVibeDashboard) {
                  setShowEntityManager(false)
                  setShowUserManager(false)
                  setShowRoleManager(false)
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
            >
              <Brain className="w-4 h-4 mr-2" />
              {showVibeDashboard ? 'Hide' : 'Show'} Vibe System
            </Button>
            <Button variant="ghost" size="sm">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8">
        
        {/* Entity Manager Section */}
        {showEntityManager && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 border border-blue-100">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">HERA</span> Entity Manager
              </h2>
              <p className="text-gray-600">
                Authenticated CRUD operations using HERA's Universal 6-Table Architecture. 
                This demonstrates how the authentication system integrates with the universal API endpoints.
              </p>
            </div>
            <EntityManager />
          </div>
        )}

        {/* User Manager Section */}
        {showUserManager && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border border-green-100">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">HERA</span> User Management
              </h2>
              <p className="text-gray-600">
                Universal User Management system with role-based permissions. Users are stored as entities in the 
                core_entities table, enabling consistent management across all organizations.
              </p>
            </div>
            <UserManager />
          </div>
        )}

        {/* Role & Permission Manager Section */}
        {showRoleManager && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-purple-100">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">HERA</span> Role & Permission Management
              </h2>
              <p className="text-gray-600">
                Universal Role-Based Access Control (RBAC) system with comprehensive permission management. 
                Define custom roles and manage permissions across all HERA modules and organizations.
              </p>
            </div>
            <RolePermissionManager />
          </div>
        )}
        
        {/* Vibe Coding System Dashboard */}
        {showVibeDashboard && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-cyan-50 rounded-2xl p-6 mb-6 border border-purple-100 shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">HERA</span> Vibe Coding System
              </h2>
              <p className="text-gray-600">
                Revolutionary 100% Vibe Coding System with manufacturing-grade seamless continuity, zero amnesia architecture, 
                and universal integration weaving. Experience the future of development workflow.
              </p>
            </div>
            <VibeDashboard />
          </div>
        )}
        
        {/* App Search Header */}
        <div className="mb-12">
          <div className="text-center max-w-4xl mx-auto mb-8">
            <h2 className="text-4xl font-thin text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">HERA</span> Enterprise Applications
            </h2>
            <p className="text-xl text-gray-600 font-light mb-4">
              Revolutionary business solutions, delivered in <span className="font-medium text-emerald-600">days</span> not months
            </p>
            
            {/* Bold Value Proposition */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 mb-8 shadow-lg">
              <p className="text-2xl font-bold mb-2">
                SAP-grade ERP at <span className="text-amber-300">1/3 the price</span>, live in <span className="text-emerald-300">2 weeks</span> or implementation is <span className="text-red-300">free</span>
              </p>
              <p className="text-blue-100 text-sm">
                <span className="text-amber-200">(conditions apply)</span> • Enterprise-grade quality • Guaranteed timeline • Risk-free promise
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-colors"
                />
              </div>
              
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hera-select-content"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hera-select-content"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status}
                  </option>
                ))}
              </select>
              
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-sm text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-sm text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  List
                </button>
              </div>
            </div>
            
            {/* Results Summary */}
            <div className="text-center text-gray-600">
              Showing <span className="font-medium text-blue-600">{filteredApplications.length}</span> of <span className="font-medium text-purple-600">{heraApplications.length}</span> applications
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
                  <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-3 border border-gray-100 overflow-hidden">
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
                            {app.implementationDays}d setup
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                          {app.title}
                        </h3>
                        <span className="text-sm text-gray-500 font-medium">{app.category}</span>
                      </div>
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-6">
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
                          <span className="mr-2">Explore</span>
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
            <div className="max-w-7xl mx-auto space-y-4">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => window.location.href = app.url}
                  className="group cursor-pointer bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
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
                          <span className="text-sm text-gray-500">
                            {app.implementationDays} days
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
                          {app.complexity} Implementation
                        </span>
                        <div className="flex items-center text-sm text-gray-400 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                          <span className="mr-2">Launch Application</span>
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
            <p className="text-lg text-gray-600 font-light">Enterprise solutions, delivered with <span className="text-emerald-600 font-medium">elegance</span></p>
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

        {/* Custom Request CTA */}
        <div className="mb-20">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-light mb-4">Need Something Custom?</h3>
              <p className="text-xl text-blue-100 font-light mb-8 leading-relaxed">
                Don't see exactly what you need? We'll build your custom prototype absolutely free. 
                Our team delivers enterprise-grade solutions tailored specifically for your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-50 hover:scale-105 text-lg px-8 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
                  onClick={() => window.location.href = '/custom-request'}
                >
                  <Code className="w-5 h-5 mr-2" />
                  Request Free Prototype
                </Button>
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle className="w-5 h-5 text-emerald-300" />
                  <span><span className="text-emerald-300">100% Free</span> • No Commitment • <span className="text-amber-300">7-Day Delivery</span></span>
                </div>
              </div>
            </div>
            
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
          </div>
        </div>

        {/* Additional Tools - Enhanced Premium Design */}
        <div className="max-w-3xl mx-auto">
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
      </div>
      </div>
      <VibeContextIndicator position="bottom-right" compact={false} />
    </VibeProvider>
  )
}


// Main dashboard page component  
export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useSupabaseAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse shadow-lg">
            <span className="text-2xl font-bold text-white">H</span>
          </div>
          <p className="text-gray-600">Loading <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-medium">HERA</span> Dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    window.location.href = '/login-supabase'
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse shadow-lg">
            <span className="text-2xl font-bold text-white">H</span>
          </div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <DashboardContent />
}