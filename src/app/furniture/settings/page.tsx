'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { Card } from '@/src/components/ui/card'
import Link from 'next/link'
import { Settings, Shield, Users, Building2, Code, Database, Bell, Key, Globe } from 'lucide-react'

const settingSections = [
  {
    title: 'Business Configuration',
    items: [
      {
        name: 'Universal Configuration Rules',
        description: 'Manage business logic without code changes',
        icon: Code,
        href: '/furniture/settings/ucr',
        color: 'text-[var(--color-text-primary)]'
      },
      {
        name: 'Organization Settings',
        description: 'Company details and preferences',
        icon: Building2,
        href: '/furniture/settings/organization',
        color: 'text-[var(--color-text-primary)]'
      },
      {
        name: 'User Management',
        description: 'Manage users and permissions',
        icon: Users,
        href: '/furniture/settings/users',
        color: 'text-[var(--color-text-primary)]'
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
        color: 'text-[var(--color-text-primary)]'
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
    <div className="min-h-screen bg-[var(--color-body)] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-900 dark:to-gray-300 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Configure your furniture business settings and preferences
          </p>
        </div>

        {/* Setting Sections */}
        {settingSections.map(section => (
          <div key={section.title} className="bg-[var(--color-body)] space-y-4">
            <h2 className="bg-[var(--color-body)] text-xl font-semibold text-[var(--color-text-primary)]">{section.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map(item => (
                <Link key={item.name} href={item.href}>
                  <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 hover:scale-105 transition-transform cursor-pointer bg-[var(--color-body)]/70 border-[var(--color-border)] backdrop-blur-sm h-full">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-muted-foreground/10/50 ${item.color}`}>
                        <item.icon className="bg-[var(--color-body)] h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="bg-[var(--color-body)] font-semibold text-[var(--color-text-primary)] mb-1">{item.name}</h3>
                        <p className="text-sm text-[var(--color-text-secondary)]">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* UCR Highlight Card */}
        <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-gradient-to-r from-amber-500/20 to-orange-600/20 border-[var(--color-accent-teal)]/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[var(--color-body)]/20">
              <Code className="h-8 w-8 text-[#37353E]" />
            </div>
            <div className="flex-1">
              <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                Revolutionary: Universal Configuration Rules (UCR)
              </h3>
              <p className="text-gray-300 mb-3">
                Change business logic without touching code. Configure validation rules, pricing strategies, approval workflows, and more through a visual interface.
              </p>
              <Link href="/furniture/settings/ucr">
                <span className="text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] font-medium">
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
