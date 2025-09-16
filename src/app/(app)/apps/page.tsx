// ================================================================================
// HERA APP STORE PAGE
// Smart Code: HERA.APPS.STORE.PAGE.v1
// Browse and install business applications
// ================================================================================

'use client'

import React, { useState } from 'react'
import { useOrganization } from '@/src/components/organization/OrganizationProvider'
import { 
  Scissors,
  Store,
  ShoppingBag,
  Factory,
  Stethoscope,
  DollarSign,
  FileText,
  Package,
  Users,
  Brain,
  Code2,
  Activity,
  Check,
  Plus,
  Star,
  TrendingUp,
  Clock,
  Shield,
  Zap
} from 'lucide-react'

interface AppListing {
  id: string
  name: string
  icon: React.ElementType
  category: string
  description: string
  features: string[]
  pricing: {
    monthly: number
    yearly: number
  }
  rating: number
  reviews: number
  status: 'available' | 'coming_soon' | 'beta'
}

const appListings: AppListing[] = [
  {
    id: 'salon',
    name: 'Salon Manager Pro',
    icon: Scissors,
    category: 'Service Business',
    description: 'Complete salon and spa management with appointment booking, staff management, and client tracking.',
    features: ['Appointment Calendar', 'Staff Scheduling', 'Client Management', 'POS System', 'Inventory Tracking'],
    pricing: { monthly: 49, yearly: 490 },
    rating: 4.8,
    reviews: 127,
    status: 'available'
  },
  {
    id: 'restaurant',
    name: 'Restaurant POS Ultimate',
    icon: Store,
    category: 'Food & Beverage',
    description: 'Full-featured restaurant management with table management, kitchen display, and online ordering.',
    features: ['Table Management', 'Kitchen Display System', 'Menu Management', 'Online Orders', 'Inventory Control'],
    pricing: { monthly: 79, yearly: 790 },
    rating: 4.9,
    reviews: 234,
    status: 'available'
  },
  {
    id: 'retail',
    name: 'Retail Suite Enterprise',
    icon: ShoppingBag,
    category: 'Retail',
    description: 'Omnichannel retail solution with inventory, sales, and customer management.',
    features: ['Multi-Store Management', 'Barcode Scanning', 'Customer Loyalty', 'E-commerce Integration', 'Analytics'],
    pricing: { monthly: 99, yearly: 990 },
    rating: 4.7,
    reviews: 189,
    status: 'available'
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing Hub',
    icon: Factory,
    category: 'Manufacturing',
    description: 'Production planning, inventory control, and quality management for manufacturers.',
    features: ['Production Planning', 'BOM Management', 'Quality Control', 'Supply Chain', 'Cost Analysis'],
    pricing: { monthly: 149, yearly: 1490 },
    rating: 4.9,
    reviews: 87,
    status: 'available'
  },
  {
    id: 'healthcare',
    name: 'HealthCare Plus',
    icon: Stethoscope,
    category: 'Healthcare',
    description: 'Patient management, appointment scheduling, and medical records for healthcare providers.',
    features: ['Patient Records', 'Appointment Booking', 'Billing & Insurance', 'Prescription Management', 'Telemedicine'],
    pricing: { monthly: 199, yearly: 1990 },
    rating: 0,
    reviews: 0,
    status: 'coming_soon'
  },
  {
    id: 'finance',
    name: 'Finance Hub Pro',
    icon: DollarSign,
    category: 'Financial Management',
    description: 'Complete financial management with accounting, budgeting, and reporting.',
    features: ['General Ledger', 'Accounts Payable/Receivable', 'Financial Reporting', 'Budgeting', 'Tax Management'],
    pricing: { monthly: 69, yearly: 690 },
    rating: 4.8,
    reviews: 156,
    status: 'available'
  },
  {
    id: 'ai',
    name: 'AI Business Assistant',
    icon: Brain,
    category: 'AI & Automation',
    description: 'AI-powered insights, automation, and decision support for your business.',
    features: ['Predictive Analytics', 'Process Automation', 'Natural Language Processing', 'Smart Recommendations', 'Anomaly Detection'],
    pricing: { monthly: 299, yearly: 2990 },
    rating: 4.6,
    reviews: 43,
    status: 'beta'
  }
]

export default function AppsPage() {
  const { currentOrganization, isAppInstalled } = useOrganization()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const categories = ['all', ...new Set(appListings.map(app => app.category))]

  const filteredApps = selectedCategory === 'all' 
    ? appListings 
    : appListings.filter(app => app.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-lg font-semibold text-white">App Store</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Organization: <span className="text-white">{currentOrganization?.name}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mb-8">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-white mb-4">
                Expand Your Business Capabilities
              </h2>
              <p className="text-lg text-blue-100 mb-6">
                Install powerful applications to manage every aspect of your business. 
                All apps integrate seamlessly with HERA's universal architecture.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 text-white">
                  <Zap className="w-5 h-5" />
                  <span>Instant Setup</span>
                </div>
                <div className="flex items-center space-x-2 text-white">
                  <Shield className="w-5 h-5" />
                  <span>Enterprise Security</span>
                </div>
                <div className="flex items-center space-x-2 text-white">
                  <TrendingUp className="w-5 h-5" />
                  <span>Free Updates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Filter by:</span>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {category === 'all' ? 'All Apps' : category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Billing Toggle */}
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          {/* App Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => {
              const Icon = app.icon
              const installed = isAppInstalled(app.id)
              const price = billingCycle === 'monthly' ? app.pricing.monthly : app.pricing.yearly

              return (
                <div
                  key={app.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="p-6">
                    {/* App Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          app.status === 'available' 
                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                            : app.status === 'beta'
                            ? 'bg-gradient-to-br from-yellow-600 to-orange-600'
                            : 'bg-gray-700'
                        }`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{app.name}</h3>
                          <p className="text-xs text-gray-400">{app.category}</p>
                        </div>
                      </div>
                      {app.status === 'beta' && (
                        <span className="text-xs bg-yellow-600/20 text-yellow-500 px-2 py-1 rounded">BETA</span>
                      )}
                      {app.status === 'coming_soon' && (
                        <span className="text-xs bg-gray-600 text-gray-400 px-2 py-1 rounded">SOON</span>
                      )}
                    </div>

                    <p className="text-sm text-gray-400 mb-4">{app.description}</p>

                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      {app.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                      {app.features.length > 3 && (
                        <p className="text-xs text-gray-500 pl-6">
                          +{app.features.length - 3} more features
                        </p>
                      )}
                    </div>

                    {/* Rating */}
                    {app.rating > 0 && (
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(app.rating)
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-400">
                          {app.rating} ({app.reviews} reviews)
                        </span>
                      </div>
                    )}

                    {/* Pricing and Action */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-white">
                          ${price}
                          <span className="text-sm font-normal text-gray-400">
                            /{billingCycle === 'monthly' ? 'mo' : 'year'}
                          </span>
                        </p>
                        {billingCycle === 'yearly' && (
                          <p className="text-xs text-green-500">
                            Save ${app.pricing.monthly * 12 - app.pricing.yearly}/year
                          </p>
                        )}
                      </div>
                      {installed ? (
                        <button className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                          Installed
                        </button>
                      ) : app.status === 'available' ? (
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Install
                        </button>
                      ) : (
                        <button className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed">
                          {app.status === 'beta' ? 'Join Beta' : 'Coming Soon'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}