'use client'

import React from 'react'
import { HeraChatInterface } from './chat-interface-dna'
import {
  Sparkles,
  TruckIcon,
  Package,
  DollarSign,
  Users,
  Thermometer,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  IceCream,
  Activity,
  Calendar,
  Target
} from 'lucide-react'

// Example 1: Ice Cream Manager Implementation
export function IceCreamManagerExample() {
  return (
    <HeraChatInterface
      // Required props
      title="HERA Ice Cream Manager"
      subtitle="AI-Powered Ice Cream Business Management"
      apiEndpoint="/api/v1/icecream-manager/chat"
      organizationId="1471e87b-b27e-42ef-8192-343cc5e0d656"
      
      // Customization
      icon={IceCream}
      iconGradient="from-blue-600 to-cyan-400"
      
      // Quick Actions
      quickActions={[
        {
          icon: TruckIcon,
          label: 'Optimize Routes',
          description: 'Plan delivery routes',
          prompt: 'Optimize delivery routes for today',
          color: 'from-blue-600 to-cyan-400'
        },
        {
          icon: Package,
          label: 'Production Planning',
          description: 'Schedule production',
          prompt: 'Plan production based on demand forecast',
          color: 'from-purple-600 to-pink-400'
        },
        {
          icon: Activity,
          label: 'Quality Check',
          description: 'Monitor temperatures',
          prompt: 'Check cold chain compliance',
          color: 'from-green-600 to-emerald-400'
        },
        {
          icon: Target,
          label: 'Sales Forecast',
          description: 'Predict demand',
          prompt: 'Forecast ice cream demand for next week',
          color: 'from-orange-600 to-amber-400'
        },
        {
          icon: Calendar,
          label: 'Expiry Alert',
          description: 'Check expiring items',
          prompt: 'Show products expiring in next 7 days',
          color: 'from-red-600 to-pink-400'
        }
      ]}
      
      // Metrics
      quickMetrics={[
        {
          icon: Thermometer,
          label: 'Cold Chain',
          value: '✓ Compliant',
          trend: 100,
          color: 'from-blue-600 to-cyan-400'
        },
        {
          icon: Package,
          label: 'Production',
          value: '850 units',
          trend: 12,
          color: 'from-purple-600 to-pink-400'
        },
        {
          icon: TruckIcon,
          label: 'Deliveries',
          value: '47/52',
          trend: 90,
          color: 'from-green-600 to-emerald-400'
        },
        {
          icon: DollarSign,
          label: 'Revenue',
          value: '₹68,450',
          trend: 15,
          color: 'from-orange-600 to-amber-400'
        }
      ]}
      
      // Example prompts
      examplePrompts={[
        'Which flavors are selling best this week?',
        'Plan production for Mango Kulfi based on demand',
        'Check temperature compliance for all freezers'
      ]}
      
      // Welcome message
      welcomeMessage={`🍦 Welcome to HERA Ice Cream Manager!

I'm your AI assistant for ice cream business operations. I can help you with:

📊 **Demand Forecasting** - Predict sales and optimize inventory
🏭 **Production Planning** - Schedule manufacturing based on demand
🚚 **Route Optimization** - Efficient delivery planning
❄️ **Cold Chain Monitoring** - Temperature compliance tracking
📈 **Business Analytics** - Sales insights and recommendations

How can I help you optimize your ice cream business today?`}
      
      // Features
      enableHistory={true}
      enableAnalytics={true}
      enableProduction={true}
      enableDarkMode={true}
      defaultDarkMode={true}
      
      // Colors
      userMessageColorDark="from-[#0EA5E9] to-[#2563EB]"
      userMessageColorLight="from-[#3B82F6] to-[#1E40AF]"
      
      // Placeholder
      placeholder="Ask about sales, production, inventory, or deliveries..."
      
      // Callbacks
      onMessageSent={(message) => {
        console.log('Message sent:', message)
      }}
      onActionClicked={(action) => {
        console.log('Action clicked:', action)
      }}
    />
  )
}

// Example 2: Salon Manager Implementation
export function SalonManagerExample() {
  return (
    <HeraChatInterface
      title="HERA Salon Manager"
      subtitle="AI-Powered Salon Operations"
      apiEndpoint="/api/v1/salon-manager/chat"
      organizationId="550e8400-e29b-41d4-a716-446655440000"
      
      icon={Sparkles}
      iconGradient="from-purple-600 to-pink-400"
      
      quickActions={[
        {
          icon: Calendar,
          label: 'Book Appointment',
          description: 'Schedule client services',
          prompt: 'Book appointment for ',
          color: 'from-blue-600 to-blue-400'
        },
        {
          icon: Package,
          label: 'Check Inventory',
          description: 'View product stock levels',
          prompt: 'Check inventory levels',
          color: 'from-purple-600 to-purple-400'
        },
        {
          icon: DollarSign,
          label: "Today's Revenue",
          description: 'View sales performance',
          prompt: "Show today's revenue",
          color: 'from-green-600 to-green-400'
        },
        {
          icon: Users,
          label: 'Staff Performance',
          description: 'Calculate commissions',
          prompt: 'Show staff performance this week',
          color: 'from-orange-600 to-orange-400'
        }
      ]}
      
      examplePrompts={[
        'Book Sarah Johnson for highlights tomorrow at 2pm',
        "Who's available for a haircut today?",
        'Check blonde toner stock'
      ]}
      
      enableHistory={true}
      enableDarkMode={true}
      defaultDarkMode={false} // Start in light mode for salon
    />
  )
}

// Example 3: Minimal Implementation
export function MinimalChatExample() {
  return (
    <HeraChatInterface
      title="Customer Support Chat"
      subtitle="How can we help you today?"
      apiEndpoint="/api/v1/support/chat"
      organizationId="default-org-id"
      
      // Minimal configuration - everything else uses defaults
      enableDarkMode={true}
      defaultDarkMode={false}
    />
  )
}

// Example 4: Using the DNA component with dynamic configuration
export function DynamicConfigExample() {
  const config = {
    restaurant: {
      icon: DollarSign,
      iconGradient: 'from-green-600 to-emerald-400',
      quickActions: [
        {
          icon: Calendar,
          label: 'Reservations',
          description: 'Manage bookings',
          prompt: 'Show today\'s reservations',
          color: 'from-blue-600 to-cyan-400'
        }
      ]
    },
    healthcare: {
      icon: Activity,
      iconGradient: 'from-red-600 to-pink-400',
      quickActions: [
        {
          icon: Calendar,
          label: 'Appointments',
          description: 'Patient scheduling',
          prompt: 'Show today\'s appointments',
          color: 'from-blue-600 to-cyan-400'
        }
      ]
    }
  }
  
  const businessType = 'restaurant' // or 'healthcare'
  const selectedConfig = config[businessType]
  
  return (
    <HeraChatInterface
      title={`HERA ${businessType.charAt(0).toUpperCase() + businessType.slice(1)} Manager`}
      subtitle="AI-Powered Business Management"
      apiEndpoint={`/api/v1/${businessType}/chat`}
      organizationId="dynamic-org-id"
      
      icon={selectedConfig.icon}
      iconGradient={selectedConfig.iconGradient}
      quickActions={selectedConfig.quickActions}
      
      enableDarkMode={true}
      defaultDarkMode={true}
    />
  )
}

// Example 5: Complete Feature Showcase
export function FullFeatureShowcase() {
  return (
    <HeraChatInterface
      // Core Configuration
      title="HERA Enterprise Assistant"
      subtitle="AI-Powered Business Intelligence"
      apiEndpoint="/api/v1/enterprise/chat"
      organizationId="enterprise-org-id"
      
      // Visual Customization
      icon={Sparkles}
      iconGradient="from-indigo-600 to-purple-400"
      
      // Quick Actions - All gradient colors supported
      quickActions={[
        {
          icon: TrendingUp,
          label: 'Analytics',
          description: 'View insights',
          prompt: 'Show business analytics dashboard',
          color: 'from-blue-600 to-cyan-400'
        },
        {
          icon: Target,
          label: 'Goals',
          description: 'Track objectives',
          prompt: 'Show quarterly goals progress',
          color: 'from-purple-600 to-pink-400'
        },
        {
          icon: Activity,
          label: 'Performance',
          description: 'KPI monitoring',
          prompt: 'Display key performance indicators',
          color: 'from-green-600 to-emerald-400'
        },
        {
          icon: Calendar,
          label: 'Schedule',
          description: 'View calendar',
          prompt: 'Show upcoming events and deadlines',
          color: 'from-orange-600 to-amber-400'
        },
        {
          icon: AlertCircle,
          label: 'Alerts',
          description: 'Critical items',
          prompt: 'Show critical business alerts',
          color: 'from-red-600 to-pink-400'
        }
      ]}
      
      // Comprehensive Metrics
      quickMetrics={[
        {
          icon: DollarSign,
          label: 'Revenue',
          value: '$125,430',
          trend: 23,
          color: 'from-green-600 to-emerald-400'
        },
        {
          icon: Users,
          label: 'Customers',
          value: '2,847',
          trend: 15,
          color: 'from-blue-600 to-cyan-400'
        },
        {
          icon: Package,
          label: 'Orders',
          value: '347',
          trend: -5,
          color: 'from-purple-600 to-pink-400'
        },
        {
          icon: CheckCircle2,
          label: 'Success Rate',
          value: '94.2%',
          trend: 2,
          color: 'from-orange-600 to-amber-400'
        }
      ]}
      
      // Rich Example Prompts
      examplePrompts={[
        'Analyze revenue trends for Q3 2024',
        'Compare this month\'s performance to last year',
        'Identify top performing products by region',
        'Generate executive summary for board meeting',
        'Forecast sales for next quarter'
      ]}
      
      // Detailed Welcome Message
      welcomeMessage={`🚀 Welcome to HERA Enterprise Assistant!

I'm your AI-powered business intelligence companion. I can help you with:

📊 **Analytics & Insights** - Real-time business intelligence
🎯 **Goal Tracking** - Monitor KPIs and objectives
💰 **Financial Analysis** - Revenue, costs, and profitability
👥 **Customer Intelligence** - Behavior patterns and trends
📈 **Predictive Forecasting** - Data-driven predictions
🔍 **Anomaly Detection** - Identify unusual patterns
📋 **Report Generation** - Executive summaries and deep dives

I use advanced analytics to provide actionable insights. How can I help you make better business decisions today?`}
      
      // All Features Enabled
      enableHistory={true}
      enableAnalytics={true}
      enableProduction={true}
      enableDarkMode={true}
      defaultDarkMode={true}
      
      // Custom Colors
      userMessageColorDark="from-[#0EA5E9] to-[#2563EB]"
      userMessageColorLight="from-[#3B82F6] to-[#1E40AF]"
      
      // Custom Placeholder
      placeholder="Ask me anything about your business metrics, analytics, or insights..."
      
      // Event Handlers
      onMessageSent={(message) => {
        console.log('Enterprise message:', message)
        // Could trigger analytics tracking here
      }}
      
      onActionClicked={(action) => {
        console.log('Enterprise action:', action)
        // Could handle custom actions here
        switch(action.action) {
          case 'view-report':
            // Open report viewer
            break
          case 'export-data':
            // Export functionality
            break
          case 'schedule-meeting':
            // Calendar integration
            break
        }
      }}
    />
  )
}