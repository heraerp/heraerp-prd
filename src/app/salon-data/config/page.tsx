'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { RulesList, RuleEditor, RulePreview } from '@/components/admin/config'
import { RulesListMCP } from '@/components/admin/config/RulesListMCP'
import { TestingSummaryCard } from '@/components/salon/TestingSummaryCard'
import {
  Settings,
  Scale,
  Plus,
  TestTube,
  BookOpen,
  Zap,
  Users,
  DollarSign,
  MessageCircle
} from 'lucide-react'

export default function SalonConfigurationPage() {
  const { currentOrganization  } = useHERAAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const organizationId = currentOrganization?.id || 'demo-salon'

  const configCategories = [
    {
      id: 'booking',
      name: 'Booking Rules',
      icon: Users,
      description: 'Appointment policies, availability, and scheduling rules',
      smart_code: 'HERA.UNIV.CONFIG.BOOKING.*',
      examples: [
        'VIP early access (24h advance booking)',
        'Same-day booking restrictions',
        'Minimum lead time requirements',
        'Double booking policies'
      ],
      gradient: 'from-purple-500 to-purple-700'
    },
    {
      id: 'pricing',
      name: 'Pricing Rules',
      icon: DollarSign,
      description: 'Discounts, surcharges, and dynamic pricing',
      smart_code: 'HERA.UNIV.CONFIG.PRICING.*',
      examples: [
        'VIP member discounts (10-25%)',
        'Peak hour surcharges',
        'Seasonal promotions',
        'Bundle pricing rules'
      ],
      gradient: 'from-emerald-500 to-green-600'
    },
    {
      id: 'notifications',
      name: 'Notification Rules',
      icon: MessageCircle,
      description: 'SMS, email, and reminder configurations',
      smart_code: 'HERA.UNIV.CONFIG.NOTIFICATION.*',
      examples: [
        'Appointment reminders (24h, 2h)',
        'Cancellation notifications',
        'Birthday promotions',
        'Service follow-ups'
      ],
      gradient: 'from-blue-500 to-indigo-600'
    }
  ]

  return (
    <div className="min-h-screen bg-muted dark:bg-background">
      {/* Page Header */}
      <div className="border-b border-border dark:border-border bg-background dark:bg-muted">
        <div className="px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Scale className="w-5 h-5 text-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100 dark:text-foreground">
              Universal Configuration Rules (UCR)
            </h1>
          </div>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground max-w-2xl">
            Manage your salon's business rules with HERA's Universal Configuration Rules system.
            Configure booking policies, pricing strategies, and notification preferences with zero
            code changes.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              Organization: {currentOrganization?.name || 'Demo Salon'}
            </Badge>
            <Badge
              variant="outline"
              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              Smart Codes: HERA.UNIV.CONFIG.*
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex lg:h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Manage Rules
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Rule
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Test Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Configuration Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {configCategories.map(category => (
                <Card
                  key={category.id}
                  className="bg-background dark:bg-muted border border-border dark:border-border hover:shadow-lg transition-all duration-300"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-r ${category.gradient} flex items-center justify-center`}
                      >
                        <category.icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground font-mono">
                          {category.smart_code}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground dark:text-gray-300">
                      {category.description}
                    </p>
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Example Rules:
                      </h4>
                      <ul className="space-y-1">
                        {category.examples.map((example, index) => (
                          <li
                            key={index}
                            className="text-xs text-muted-foreground dark:text-muted-foreground flex items-center gap-1"
                          >
                            <span className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => setActiveTab('create')}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create {category.name.split(' ')[0]} Rule
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Testing Summary */}
            <TestingSummaryCard />

            {/* Quick Start Guide */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Zap className="w-5 h-5" />
                  Quick Start with UCR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold text-primary dark:text-blue-300">1</span>
                    </div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Define Rules
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Create business rules using our visual editor with conditions and actions.
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold text-primary dark:text-blue-300">2</span>
                    </div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Test Rules
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Use our preview system to test rules with real scenarios before deployment.
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold text-primary dark:text-blue-300">3</span>
                    </div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Deploy Live
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Activate rules instantly - no code deployments or downtime required.
                    </p>
                  </div>
                </div>
                <div className="flex justify-center pt-4">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-foreground"
                    onClick={() => setActiveTab('create')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules">
            <RulesListMCP
              organizationId={organizationId}
              onCreateRule={() => setActiveTab('create')}
            />
          </TabsContent>

          <TabsContent value="create">
            <RuleEditor
              organizationId={organizationId}
              onSave={() => {
                setActiveTab('rules')
              }}
            />
          </TabsContent>

          <TabsContent value="test">
            <RulePreview organizationId={organizationId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
