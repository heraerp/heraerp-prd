'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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
  Globe
} from 'lucide-react'

const settingSections = [
  {
    title: 'Business Configuration',
    items: [
      { 
        name: 'Universal Configuration Rules', 
        description: 'Manage business logic without code changes',
        icon: Code,
        href: '/furniture/settings/ucr',
        color: 'text-amber-500'
      },
      { 
        name: 'Organization Settings', 
        description: 'Company details and preferences',
        icon: Building2,
        href: '/furniture/settings/organization',
        color: 'text-blue-500'
      },
      { 
        name: 'User Management', 
        description: 'Manage users and permissions',
        icon: Users,
        href: '/furniture/settings/users',
        color: 'text-purple-500'
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
        href: '/furniture/settings/security',
        color: 'text-red-500'
      },
      { 
        name: 'API & Integrations', 
        description: 'External connections and webhooks',
        icon: Key,
        href: '/furniture/settings/integrations',
        color: 'text-green-500'
      },
      { 
        name: 'Data Management', 
        description: 'Backup, export, and archival',
        icon: Database,
        href: '/furniture/settings/data',
        color: 'text-cyan-500'
      }
    ]
  },
  {
    title: 'Preferences',
    items: [
      { 
        name: 'Notifications', 
        description: 'Alert and notification settings',
        icon: Bell,
        href: '/furniture/settings/notifications',
        color: 'text-yellow-500'
      },
      { 
        name: 'Localization', 
        description: 'Language, currency, and regional settings',
        icon: Globe,
        href: '/furniture/settings/localization',
        color: 'text-indigo-500'
      }
    ]
  }
]

export default function FurnitureSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your furniture business settings and preferences
          </p>
        </div>

        {/* Setting Sections */}
        {settingSections.map((section) => (
          <div key={section.title} className="space-y-4">
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Card className="p-6 hover:scale-105 transition-transform cursor-pointer bg-gray-800/70 border-gray-700 backdrop-blur-sm h-full">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-gray-700/50 ${item.color}`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* UCR Highlight Card */}
        <Card className="p-6 bg-gradient-to-r from-amber-500/20 to-orange-600/20 border-amber-500/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/20">
              <Code className="h-8 w-8 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                Revolutionary: Universal Configuration Rules (UCR)
              </h3>
              <p className="text-gray-300 mb-3">
                Change business logic without touching code. Configure validation rules, pricing strategies, 
                approval workflows, and more through a visual interface.
              </p>
              <Link href="/furniture/settings/ucr">
                <span className="text-amber-500 hover:text-amber-400 font-medium">
                  Manage UCR Rules →
                </span>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}