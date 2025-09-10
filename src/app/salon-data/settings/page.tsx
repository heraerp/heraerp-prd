'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { 
  Settings, 
  Shield, 
  Users, 
  Building2, 
  Code,
  Database,
  Bell,
  Key,
  Globe,
  Sparkles,
  CreditCard,
  Calendar,
  FileText
} from 'lucide-react'

const settingSections = [
  {
    title: 'Business Configuration',
    items: [
      { 
        name: 'Universal Configuration Rules', 
        description: 'Manage salon business logic without code changes',
        icon: Code,
        href: '/salon-data/settings/ucr',
        color: 'text-champagne-500'
      },
      { 
        name: 'Organization Settings', 
        description: 'Salon details and preferences',
        icon: Building2,
        href: '/salon-data/settings/organization',
        color: 'text-sage-500'
      },
      { 
        name: 'Staff Management', 
        description: 'Manage stylists and permissions',
        icon: Users,
        href: '/salon-data/settings/staff',
        color: 'text-dusty-rose-500'
      }
    ]
  },
  {
    title: 'Salon Operations',
    items: [
      { 
        name: 'Service Menu', 
        description: 'Hair and beauty services configuration',
        icon: Sparkles,
        href: '/salon-data/settings/services',
        color: 'text-sage-600'
      },
      { 
        name: 'Appointment Rules', 
        description: 'Booking and scheduling settings',
        icon: Calendar,
        href: '/salon-data/settings/appointments',
        color: 'text-dusty-rose-600'
      },
      { 
        name: 'Pricing & Promotions', 
        description: 'Service pricing and special offers',
        icon: CreditCard,
        href: '/salon-data/settings/pricing',
        color: 'text-champagne-600'
      }
    ]
  },
  {
    title: 'System Configuration',
    items: [
      { 
        name: 'Security', 
        description: 'Authentication and access control',
        icon: Shield,
        href: '/salon-data/settings/security',
        color: 'text-red-500'
      },
      { 
        name: 'Notifications', 
        description: 'Appointment reminders and alerts',
        icon: Bell,
        href: '/salon-data/settings/notifications',
        color: 'text-yellow-500'
      },
      { 
        name: 'Reports & Analytics', 
        description: 'Performance tracking and insights',
        icon: FileText,
        href: '/salon-data/settings/reports',
        color: 'text-indigo-500'
      }
    ]
  }
]

export default function SalonDataSettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-dusty-rose-50 to-champagne-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sage-700 via-dusty-rose-600 to-champagne-600 bg-clip-text text-transparent">
            Salon Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your Hair Talkz salon settings and preferences
          </p>
        </div>

        {/* Setting Sections */}
        {settingSections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h2 className="text-xl font-semibold text-sage-800">{section.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Card className="p-6 hover:scale-105 transition-transform cursor-pointer bg-white/80 border-sage-200/50 backdrop-blur-sm h-full hover:shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br from-white to-sage-50/50 ${item.color}`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sage-900 mb-1">{item.name}</h3>
                        <p className="text-sm text-sage-600">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* UCR Highlight Card */}
        <Card className="p-6 bg-gradient-to-r from-champagne-100/80 to-sage-100/80 border-champagne-300/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-champagne-200 to-champagne-300">
              <Code className="h-8 w-8 text-champagne-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-sage-900 mb-1">
                Revolutionary: Universal Configuration Rules (UCR) for Salons
              </h3>
              <p className="text-sage-700 mb-3">
                Change salon business logic without touching code. Configure service pricing, appointment rules, 
                staff commissions, loyalty programs, and more through a visual interface tailored for beauty businesses.
              </p>
              <Link href="/salon-data/settings/ucr">
                <span className="text-champagne-600 hover:text-champagne-700 font-medium">
                  Manage Salon UCR Rules →
                </span>
              </Link>
            </div>
          </div>
        </Card>

        {/* Back to Dashboard */}
        <div className="flex justify-center pt-6">
          <Link href="/salon-data">
            <span className="text-sage-600 hover:text-sage-700 font-medium flex items-center gap-2">
              ← Back to Salon Dashboard
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}