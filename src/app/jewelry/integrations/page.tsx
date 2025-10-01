'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Zap,
  Settings,
  Globe,
  CreditCard,
  Truck,
  Mail,
  MessageSquare,
  Phone,
  Users,
  Package,
  BarChart3,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Percent,
  Clock,
  Calendar,
  MapPin,
  Navigation,
  Shield,
  Lock,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Share2,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Copy,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Star,
  Crown,
  Gem,
  Diamond,
  Sparkles,
  Activity,
  Layers,
  Database,
  Cloud,
  Server,
  Cpu,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  Signal,
  Battery,
  Volume2,
  Bell,
  Bookmark,
  Flag,
  Tag,
  Hash,
  Home,
  Store,
  Warehouse,
  Building,
  Factory
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface Integration {
  id: string
  name: string
  category: 'payment' | 'shipping' | 'accounting' | 'crm' | 'marketing' | 'analytics' | 'communication' | 'security'
  provider: string
  description: string
  logo: string
  status: 'connected' | 'disconnected' | 'error' | 'pending' | 'testing'
  lastSync: string
  syncFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'manual'
  configuration: {
    apiKey?: string
    webhookUrl?: string
    settings: Record<string, any>
  }
  features: string[]
  pricing: {
    plan: string
    cost: number
    billing: 'monthly' | 'yearly' | 'transaction' | 'usage'
  }
  metrics: {
    totalTransactions?: number
    successRate?: number
    avgResponseTime?: number
    errorCount?: number
    lastError?: string
  }
  health: {
    status: 'excellent' | 'good' | 'fair' | 'poor'
    uptime: number
    latency: number
    errors: number
  }
}

interface IntegrationTemplate {
  id: string
  name: string
  category: string
  description: string
  provider: string
  complexity: 'simple' | 'moderate' | 'complex'
  setupTime: string
  requirements: string[]
  benefits: string[]
  pricing: string
  documentation: string
  supportLevel: 'basic' | 'standard' | 'premium' | 'enterprise'
}

interface WebhookEvent {
  id: string
  integrationId: string
  eventType: string
  timestamp: string
  status: 'success' | 'failed' | 'pending' | 'retry'
  payload: any
  response: any
  attempts: number
  nextRetry?: string
  error?: string
}

interface APIMonitoring {
  integrationId: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  avgResponseTime: number
  successRate: number
  errorRate: number
  totalRequests: number
  lastRequest: string
  status: 'healthy' | 'degraded' | 'down'
  alerts: {
    type: string
    message: string
    timestamp: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }[]
}

export default function JewelryIntegrationsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showIntegrationModal, setShowIntegrationModal] = useState(false)
  const [showWebhooks, setShowWebhooks] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Mock data for integrations
  const integrations: Integration[] = [
    {
      id: 'RAZORPAY_001',
      name: 'Razorpay',
      category: 'payment',
      provider: 'Razorpay',
      description: 'Complete payment gateway with UPI, cards, wallets, and net banking support',
      logo: '/integrations/razorpay.png',
      status: 'connected',
      lastSync: '2024-01-15T14:30:00Z',
      syncFrequency: 'real-time',
      configuration: {
        apiKey: 'rzp_live_***************',
        webhookUrl: 'https://api.herajewelry.com/webhooks/razorpay',
        settings: {
          capturePayments: true,
          enableWallets: true,
          enableUPI: true,
          enableCardSaving: false
        }
      },
      features: ['UPI Payments', 'Card Processing', 'Wallet Integration', 'EMI Options', 'International Cards'],
      pricing: {
        plan: 'Business',
        cost: 2.5,
        billing: 'transaction'
      },
      metrics: {
        totalTransactions: 2847,
        successRate: 98.5,
        avgResponseTime: 1.2,
        errorCount: 3
      },
      health: {
        status: 'excellent',
        uptime: 99.8,
        latency: 120,
        errors: 0
      }
    },
    {
      id: 'BLUEDART_001',
      name: 'BlueDart Express',
      category: 'shipping',
      provider: 'BlueDart',
      description: 'Premium shipping and logistics for jewelry with insurance and tracking',
      logo: '/integrations/bluedart.png',
      status: 'connected',
      lastSync: '2024-01-15T13:45:00Z',
      syncFrequency: 'hourly',
      configuration: {
        apiKey: 'bd_live_***************',
        webhookUrl: 'https://api.herajewelry.com/webhooks/bluedart',
        settings: {
          insuranceEnabled: true,
          signatureRequired: true,
          priorityDelivery: true,
          smsNotifications: true
        }
      },
      features: ['Express Delivery', 'Insurance Coverage', 'Real-time Tracking', 'SMS Notifications', 'Signature Confirmation'],
      pricing: {
        plan: 'Premium',
        cost: 185,
        billing: 'monthly'
      },
      metrics: {
        totalTransactions: 1289,
        successRate: 96.8,
        avgResponseTime: 2.8,
        errorCount: 12
      },
      health: {
        status: 'good',
        uptime: 98.2,
        latency: 280,
        errors: 2
      }
    },
    {
      id: 'WHATSAPP_001',
      name: 'WhatsApp Business',
      category: 'communication',
      provider: 'Meta',
      description: 'WhatsApp Business API for customer communication and order updates',
      logo: '/integrations/whatsapp.png',
      status: 'connected',
      lastSync: '2024-01-15T14:15:00Z',
      syncFrequency: 'real-time',
      configuration: {
        apiKey: 'wa_live_***************',
        webhookUrl: 'https://api.herajewelry.com/webhooks/whatsapp',
        settings: {
          orderUpdates: true,
          marketingMessages: false,
          customerSupport: true,
          appointmentReminders: true
        }
      },
      features: ['Order Updates', 'Customer Support', 'Appointment Reminders', 'Media Sharing', 'Template Messages'],
      pricing: {
        plan: 'Business',
        cost: 0.04,
        billing: 'usage'
      },
      metrics: {
        totalTransactions: 5672,
        successRate: 99.2,
        avgResponseTime: 0.8,
        errorCount: 8
      },
      health: {
        status: 'excellent',
        uptime: 99.9,
        latency: 80,
        errors: 0
      }
    },
    {
      id: 'QUICKBOOKS_001',
      name: 'QuickBooks Online',
      category: 'accounting',
      provider: 'Intuit',
      description: 'Accounting integration for automated bookkeeping and financial reporting',
      logo: '/integrations/quickbooks.png',
      status: 'connected',
      lastSync: '2024-01-15T12:00:00Z',
      syncFrequency: 'daily',
      configuration: {
        apiKey: 'qb_live_***************',
        settings: {
          autoSyncSales: true,
          autoSyncExpenses: true,
          autoSyncCustomers: true,
          taxCalculation: true
        }
      },
      features: ['Sales Sync', 'Expense Tracking', 'Customer Sync', 'Tax Calculation', 'Financial Reports'],
      pricing: {
        plan: 'Plus',
        cost: 4500,
        billing: 'monthly'
      },
      metrics: {
        totalTransactions: 892,
        successRate: 97.8,
        avgResponseTime: 3.2,
        errorCount: 18
      },
      health: {
        status: 'good',
        uptime: 97.5,
        latency: 320,
        errors: 1
      }
    },
    {
      id: 'MAILCHIMP_001',
      name: 'Mailchimp',
      category: 'marketing',
      provider: 'Mailchimp',
      description: 'Email marketing automation with customer segmentation and campaigns',
      logo: '/integrations/mailchimp.png',
      status: 'connected',
      lastSync: '2024-01-15T11:30:00Z',
      syncFrequency: 'daily',
      configuration: {
        apiKey: 'mc_live_***************',
        settings: {
          autoSegmentation: true,
          abandonedCartEmails: true,
          birthdayEmails: true,
          newProductAlerts: false
        }
      },
      features: ['Email Campaigns', 'Customer Segmentation', 'Automation', 'Analytics', 'A/B Testing'],
      pricing: {
        plan: 'Standard',
        cost: 2990,
        billing: 'monthly'
      },
      metrics: {
        totalTransactions: 1456,
        successRate: 98.9,
        avgResponseTime: 1.8,
        errorCount: 5
      },
      health: {
        status: 'excellent',
        uptime: 99.5,
        latency: 180,
        errors: 0
      }
    },
    {
      id: 'GOOGLE_ANALYTICS_001',
      name: 'Google Analytics 4',
      category: 'analytics',
      provider: 'Google',
      description: 'Advanced web analytics and e-commerce tracking for data-driven insights',
      logo: '/integrations/google-analytics.png',
      status: 'connected',
      lastSync: '2024-01-15T14:00:00Z',
      syncFrequency: 'real-time',
      configuration: {
        apiKey: 'ga4_live_***************',
        settings: {
          ecommerceTracking: true,
          enhancedMeasurement: true,
          customDimensions: true,
          audienceSegments: true
        }
      },
      features: ['E-commerce Tracking', 'Custom Events', 'Audience Insights', 'Conversion Tracking', 'Real-time Data'],
      pricing: {
        plan: 'Free',
        cost: 0,
        billing: 'monthly'
      },
      metrics: {
        totalTransactions: 15672,
        successRate: 99.7,
        avgResponseTime: 0.5,
        errorCount: 2
      },
      health: {
        status: 'excellent',
        uptime: 99.9,
        latency: 50,
        errors: 0
      }
    },
    {
      id: 'OKTA_001',
      name: 'Okta SSO',
      category: 'security',
      provider: 'Okta',
      description: 'Single Sign-On and identity management for secure employee access',
      logo: '/integrations/okta.png',
      status: 'testing',
      lastSync: '2024-01-15T10:00:00Z',
      syncFrequency: 'real-time',
      configuration: {
        apiKey: 'okta_test_***************',
        settings: {
          multiFactorAuth: true,
          sessionTimeout: 480,
          passwordPolicy: 'strong',
          auditLogging: true
        }
      },
      features: ['Single Sign-On', 'Multi-Factor Auth', 'User Provisioning', 'Audit Logs', 'API Access Management'],
      pricing: {
        plan: 'Workforce Identity',
        cost: 580,
        billing: 'monthly'
      },
      metrics: {
        totalTransactions: 234,
        successRate: 94.2,
        avgResponseTime: 1.5,
        errorCount: 8
      },
      health: {
        status: 'fair',
        uptime: 96.8,
        latency: 150,
        errors: 3
      }
    }
  ]

  const integrationTemplates: IntegrationTemplate[] = [
    {
      id: 'PAYU_TEMPLATE',
      name: 'PayU',
      category: 'payment',
      description: 'Alternative payment gateway with competitive rates and local payment methods',
      provider: 'PayU',
      complexity: 'simple',
      setupTime: '30 minutes',
      requirements: ['Business registration', 'Bank account', 'KYC documents'],
      benefits: ['Lower transaction fees', 'Local payment methods', 'Easy integration'],
      pricing: '2.3% per transaction',
      documentation: 'https://docs.payu.in',
      supportLevel: 'standard'
    },
    {
      id: 'DELHIVERY_TEMPLATE',
      name: 'Delhivery',
      category: 'shipping',
      description: 'Pan-India logistics network with jewelry-specific packaging and insurance',
      provider: 'Delhivery',
      complexity: 'moderate',
      setupTime: '2 hours',
      requirements: ['Business license', 'GST registration', 'Address verification'],
      benefits: ['Wide coverage', 'Jewelry packaging', 'Competitive rates'],
      pricing: 'Variable based on weight/distance',
      documentation: 'https://developers.delhivery.com',
      supportLevel: 'premium'
    },
    {
      id: 'ZOHO_CRM_TEMPLATE',
      name: 'Zoho CRM',
      category: 'crm',
      description: 'Comprehensive CRM with sales automation and customer lifecycle management',
      provider: 'Zoho',
      complexity: 'complex',
      setupTime: '4 hours',
      requirements: ['Zoho account', 'Data mapping', 'User training'],
      benefits: ['Complete CRM suite', 'Sales automation', 'Custom workflows'],
      pricing: '¹1,200/user/month',
      documentation: 'https://help.zoho.com/portal/crm',
      supportLevel: 'enterprise'
    }
  ]

  const recentWebhooks: WebhookEvent[] = [
    {
      id: 'WH001',
      integrationId: 'RAZORPAY_001',
      eventType: 'payment.captured',
      timestamp: '2024-01-15T14:25:00Z',
      status: 'success',
      payload: { payment_id: 'pay_123456', amount: 450000, status: 'captured' },
      response: { status: 'processed', order_id: 'ORD-2024-001' },
      attempts: 1
    },
    {
      id: 'WH002',
      integrationId: 'BLUEDART_001',
      eventType: 'shipment.delivered',
      timestamp: '2024-01-15T13:45:00Z',
      status: 'success',
      payload: { awb: 'BD123456789', status: 'delivered', location: 'Mumbai' },
      response: { status: 'updated', tracking_updated: true },
      attempts: 1
    },
    {
      id: 'WH003',
      integrationId: 'WHATSAPP_001',
      eventType: 'message.failed',
      timestamp: '2024-01-15T12:30:00Z',
      status: 'failed',
      payload: { to: '+919876543210', message: 'Order confirmation', type: 'template' },
      response: null,
      attempts: 3,
      nextRetry: '2024-01-15T15:30:00Z',
      error: 'Phone number not registered on WhatsApp'
    }
  ]

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Grid },
    { key: 'connected', label: 'Connected', icon: CheckCircle },
    { key: 'available', label: 'Available', icon: Package },
    { key: 'monitoring', label: 'Monitoring', icon: Activity },
    { key: 'webhooks', label: 'Webhooks', icon: Zap },
    { key: 'settings', label: 'Settings', icon: Settings }
  ]

  const categories = [
    { value: 'all', label: 'All Categories', icon: Grid },
    { value: 'payment', label: 'Payment', icon: CreditCard },
    { value: 'shipping', label: 'Shipping', icon: Truck },
    { value: 'accounting', label: 'Accounting', icon: BarChart3 },
    { value: 'marketing', label: 'Marketing', icon: TrendingUp },
    { value: 'communication', label: 'Communication', icon: MessageSquare },
    { value: 'analytics', label: 'Analytics', icon: Target },
    { value: 'security', label: 'Security', icon: Shield }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'jewelry-status-active'
      case 'testing': return 'jewelry-status-pending'
      case 'disconnected':
      case 'error': return 'jewelry-status-inactive'
      default: return 'jewelry-status-inactive'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle size={16} className="text-green-500" />
      case 'testing': return <Clock size={16} className="text-yellow-500" />
      case 'pending': return <RefreshCw size={16} className="text-blue-500 animate-spin" />
      case 'disconnected': return <XCircle size={16} className="text-gray-500" />
      case 'error': return <AlertTriangle size={16} className="text-red-500" />
      default: return <Info size={16} className="text-gray-500" />
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-500'
      case 'good': return 'text-blue-500'
      case 'fair': return 'text-yellow-500'
      case 'poor': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return <CreditCard size={20} />
      case 'shipping': return <Truck size={20} />
      case 'accounting': return <BarChart3 size={20} />
      case 'marketing': return <TrendingUp size={20} />
      case 'communication': return <MessageSquare size={20} />
      case 'analytics': return <Target size={20} />
      case 'security': return <Shield size={20} />
      default: return <Package size={20} />
    }
  }

  const formatCurrency = (amount: number) => {
    return `¹${amount.toLocaleString()}`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const filteredIntegrations = integrations.filter(integration => 
    selectedCategory === 'all' || integration.category === selectedCategory
  )

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <Zap className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Enterprise Integrations
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Connect with payment gateways, shipping providers, and business applications
            </p>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="jewelry-glass-panel"
          >
            <div className="flex flex-wrap gap-2 p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'jewelry-btn-primary'
                      : 'jewelry-btn-secondary'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Integration Statistics */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <div className="jewelry-glass-card jewelry-float p-6 text-center">
                  <CheckCircle className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">7</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Connected</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+2 this month</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.1s' }}>
                  <Activity className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">98.7%</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Uptime</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <CheckCircle size={16} />
                    <span className="text-xs ml-1">Excellent</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.2s' }}>
                  <Zap className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">28,156</h3>
                  <p className="jewelry-text-muted text-sm font-medium">API Calls</p>
                  <div className="flex items-center justify-center mt-2 text-blue-500">
                    <Activity size={16} />
                    <span className="text-xs ml-1">Last 24h</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.3s' }}>
                  <DollarSign className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">¹18,450</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Monthly Cost</p>
                  <div className="flex items-center justify-center mt-2 text-yellow-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+8.5%</span>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Integration Health */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="jewelry-glass-panel"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                      <Activity className="jewelry-icon-gold" size={24} />
                      Integration Health
                    </h3>
                    <button className="jewelry-btn-secondary p-2">
                      <RefreshCw className="jewelry-icon-gold" size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {integrations.slice(0, 4).map((integration) => (
                      <div key={integration.id} className="jewelry-glass-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-lg flex items-center justify-center">
                              {getCategoryIcon(integration.category)}
                            </div>
                            <div>
                              <h4 className="jewelry-text-high-contrast font-semibold text-sm">{integration.name}</h4>
                              <p className="jewelry-text-muted text-xs">{integration.category}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(integration.status)}
                            <span className={`text-sm font-medium ${getHealthColor(integration.health.status)}`}>
                              {integration.health.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="jewelry-text-muted block">Uptime</span>
                            <span className="jewelry-text-high-contrast">{formatPercentage(integration.health.uptime)}</span>
                          </div>
                          <div>
                            <span className="jewelry-text-muted block">Latency</span>
                            <span className="jewelry-text-high-contrast">{integration.health.latency}ms</span>
                          </div>
                          <div>
                            <span className="jewelry-text-muted block">Success Rate</span>
                            <span className="jewelry-text-high-contrast">{formatPercentage(integration.metrics.successRate || 0)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="jewelry-glass-panel"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                      <Clock className="jewelry-icon-gold" size={24} />
                      Recent Activity
                    </h3>
                    <button 
                      onClick={() => setActiveTab('webhooks')}
                      className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-1"
                    >
                      <Eye className="jewelry-icon-gold" size={14} />
                      <span className="text-sm">View All</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {recentWebhooks.map((webhook) => (
                      <div key={webhook.id} className="jewelry-glass-card p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="jewelry-text-high-contrast font-semibold text-sm">{webhook.eventType}</h4>
                            <p className="jewelry-text-muted text-xs">
                              {integrations.find(i => i.id === webhook.integrationId)?.name}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {webhook.status === 'success' && <CheckCircle size={14} className="text-green-500" />}
                            {webhook.status === 'failed' && <XCircle size={14} className="text-red-500" />}
                            {webhook.status === 'pending' && <Clock size={14} className="text-yellow-500" />}
                            <span className={`text-xs font-medium ${
                              webhook.status === 'success' ? 'text-green-500' :
                              webhook.status === 'failed' ? 'text-red-500' : 'text-yellow-500'
                            }`}>
                              {webhook.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs jewelry-text-muted">
                          <span>{new Date(webhook.timestamp).toLocaleString()}</span>
                          <span>Attempts: {webhook.attempts}</span>
                        </div>
                        
                        {webhook.error && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                            {webhook.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Connected Tab */}
          {activeTab === 'connected' && (
            <div className="space-y-6">
              
              {/* Controls */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="jewelry-glass-panel"
              >
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex space-x-2">
                      {categories.map((category) => (
                        <button
                          key={category.value}
                          onClick={() => setSelectedCategory(category.value)}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedCategory === category.value
                              ? 'jewelry-btn-primary'
                              : 'jewelry-btn-secondary'
                          }`}
                        >
                          <category.icon size={14} />
                          <span>{category.label}</span>
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="jewelry-btn-secondary p-2"
                    >
                      {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                      <RefreshCw className="jewelry-icon-gold" size={18} />
                      <span>Sync All</span>
                    </button>
                    
                    <button 
                      onClick={() => setActiveTab('available')}
                      className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2"
                    >
                      <Plus className="jewelry-icon-gold" size={18} />
                      <span>Add Integration</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Connected Integrations */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="jewelry-glass-panel"
              >
                <div className="p-6">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredIntegrations.map((integration) => (
                        <motion.div
                          key={integration.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="jewelry-glass-card jewelry-scale-hover cursor-pointer"
                          onClick={() => {
                            setSelectedIntegration(integration)
                            setShowIntegrationModal(true)
                          }}
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-lg flex items-center justify-center">
                                {getCategoryIcon(integration.category)}
                              </div>
                              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(integration.status)}`}>
                                {integration.status}
                              </span>
                            </div>
                            
                            <h4 className="jewelry-text-high-contrast font-semibold text-lg mb-2">{integration.name}</h4>
                            <p className="jewelry-text-muted text-sm mb-4 line-clamp-2">{integration.description}</p>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="jewelry-text-muted">Last Sync:</span>
                                <span className="jewelry-text-high-contrast">
                                  {new Date(integration.lastSync).toLocaleTimeString()}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="jewelry-text-muted">Health:</span>
                                <span className={`font-medium ${getHealthColor(integration.health.status)}`}>
                                  {integration.health.status}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="jewelry-text-muted">Success Rate:</span>
                                <span className="jewelry-text-high-contrast">
                                  {formatPercentage(integration.metrics.successRate || 0)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2 mt-4">
                              <button className="flex-1 jewelry-btn-secondary py-2 text-xs">
                                <Settings size={12} className="mr-1" />
                                Configure
                              </button>
                              <button className="flex-1 jewelry-btn-primary py-2 text-xs">
                                <Eye size={12} className="mr-1" />
                                Monitor
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredIntegrations.map((integration) => (
                        <motion.div
                          key={integration.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="jewelry-glass-card p-4 flex items-center space-x-4 jewelry-scale-hover cursor-pointer"
                          onClick={() => {
                            setSelectedIntegration(integration)
                            setShowIntegrationModal(true)
                          }}
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-lg flex items-center justify-center">
                            {getCategoryIcon(integration.category)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="jewelry-text-high-contrast font-semibold">{integration.name}</h4>
                                <p className="jewelry-text-muted text-sm">{integration.provider} " {integration.category}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(integration.status)}`}>
                                  {integration.status}
                                </span>
                                <button className="text-gray-400 hover:text-gray-600">
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="jewelry-text-muted block">Health</span>
                                <span className={`font-medium ${getHealthColor(integration.health.status)}`}>
                                  {integration.health.status}
                                </span>
                              </div>
                              <div>
                                <span className="jewelry-text-muted block">Uptime</span>
                                <span className="jewelry-text-high-contrast">{formatPercentage(integration.health.uptime)}</span>
                              </div>
                              <div>
                                <span className="jewelry-text-muted block">Success Rate</span>
                                <span className="jewelry-text-high-contrast">{formatPercentage(integration.metrics.successRate || 0)}</span>
                              </div>
                              <div>
                                <span className="jewelry-text-muted block">Last Sync</span>
                                <span className="jewelry-text-high-contrast">
                                  {new Date(integration.lastSync).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Available Integrations Tab */}
          {activeTab === 'available' && (
            <div className="space-y-6">
              
              {/* Available Integration Templates */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="jewelry-glass-panel"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                    <Package className="jewelry-icon-gold" size={24} />
                    Available Integrations
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 jewelry-icon-muted" size={16} />
                      <input
                        type="text"
                        placeholder="Search integrations..."
                        className="pl-10 pr-4 py-2 border border-jewelry-blue-200 rounded-lg jewelry-text-high-contrast text-sm w-64"
                      />
                    </div>
                    <button className="jewelry-btn-secondary p-2">
                      <Filter className="jewelry-icon-gold" size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {integrationTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="jewelry-glass-card jewelry-scale-hover"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-lg flex items-center justify-center">
                            {getCategoryIcon(template.category)}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            template.complexity === 'simple' ? 'bg-green-100 text-green-800' :
                            template.complexity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {template.complexity}
                          </span>
                        </div>
                        
                        <h4 className="jewelry-text-high-contrast font-semibold text-lg mb-2">{template.name}</h4>
                        <p className="jewelry-text-muted text-sm mb-4 line-clamp-2">{template.description}</p>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="jewelry-text-muted">Setup Time:</span>
                            <span className="jewelry-text-high-contrast">{template.setupTime}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="jewelry-text-muted">Support:</span>
                            <span className="jewelry-text-high-contrast capitalize">{template.supportLevel}</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="jewelry-text-muted">Pricing:</span>
                            <span className="jewelry-text-high-contrast">{template.pricing}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <h5 className="jewelry-text-luxury font-semibold text-sm">Key Benefits:</h5>
                          <div className="space-y-1">
                            {template.benefits.slice(0, 2).map((benefit, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <CheckCircle size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="jewelry-text-muted text-xs">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="flex-1 jewelry-btn-secondary py-2 text-xs">
                            <ExternalLink size={12} className="mr-1" />
                            Learn More
                          </button>
                          <button className="flex-1 jewelry-btn-primary py-2 text-xs">
                            <Plus size={12} className="mr-1" />
                            Install
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Other tabs rendered as placeholders */}
          {(['monitoring', 'webhooks', 'settings'].includes(activeTab)) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="jewelry-glass-panel"
            >
              <div className="p-12 text-center">
                <Zap className="mx-auto mb-4 jewelry-icon-gold" size={64} />
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">
                  {activeTab === 'monitoring' && 'API Monitoring & Performance'}
                  {activeTab === 'webhooks' && 'Webhook Management & Logs'}
                  {activeTab === 'settings' && 'Integration Settings & Configuration'}
                </h3>
                <p className="jewelry-text-muted">
                  {activeTab === 'monitoring' && 'Real-time API performance monitoring, error tracking, and health analytics for all integrations.'}
                  {activeTab === 'webhooks' && 'Webhook event management, retry logic, payload inspection, and delivery tracking systems.'}
                  {activeTab === 'settings' && 'Global integration settings, security configurations, rate limiting, and access management.'}
                </p>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center mt-12 mb-6"
          >
            <p className="jewelry-text-muted text-sm">
              Enterprise integrations powered by <span className="jewelry-text-luxury font-semibold">HERA Integration Platform</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}