'use client'

/**
 * HERA DNA Universal Calendar Demo
 * Smart Code: HERA.DNA.DEMO.CALENDAR.UNIVERSAL.v1
 * 
 * Demonstrates the universal calendar across multiple business types
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Scissors,
  Stethoscope,
  Briefcase,
  Wrench,
  Building2,
  Users,
  Calendar,
  Zap,
  Star,
  CheckCircle2,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HeraDnaUniversalResourceCalendar } from '@/components/calendar/HeraDnaUniversalResourceCalendar'

export default function HeraDnaCalendarDemo() {
  const [selectedBusiness, setSelectedBusiness] = useState<'salon' | 'healthcare' | 'consulting' | 'manufacturing'>('salon')

  // Sample organizations for different business types
  const businessOrganizations = {
    salon: [
      {
        id: "salon-branch-1",
        organization_code: "SALON-BR1",
        organization_name: "Hair Talkz • Park Regis Kris Kin (Karama)"
      },
      {
        id: "salon-branch-2", 
        organization_code: "SALON-BR2",
        organization_name: "Hair Talkz • Mercure Gold (Al Mina Rd)"
      }
    ],
    healthcare: [
      {
        id: "clinic-branch-1",
        organization_code: "CLINIC-BR1", 
        organization_name: "HealthCare Plus • Downtown Medical Center"
      },
      {
        id: "clinic-branch-2",
        organization_code: "CLINIC-BR2",
        organization_name: "HealthCare Plus • Marina Family Clinic"
      }
    ],
    consulting: [
      {
        id: "consulting-branch-1",
        organization_code: "CONSULT-BR1",
        organization_name: "BizConsult • Dubai Financial District"
      },
      {
        id: "consulting-branch-2", 
        organization_code: "CONSULT-BR2",
        organization_name: "BizConsult • Abu Dhabi Business Hub"
      }
    ],
    manufacturing: [
      {
        id: "manufacturing-branch-1",
        organization_code: "MFG-BR1",
        organization_name: "TechMfg • Jebel Ali Industrial Zone"
      },
      {
        id: "manufacturing-branch-2",
        organization_code: "MFG-BR2", 
        organization_name: "TechMfg • Sharjah Industrial Area"
      }
    ]
  }

  const businessTypes = [
    {
      id: 'salon',
      name: 'Hair Salon',
      description: 'Beauty salon with stylists, services, and multi-branch operations',
      icon: <Scissors className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-600',
      features: ['Stylist scheduling', 'Service appointments', 'Multi-branch management', 'Client tracking']
    },
    {
      id: 'healthcare', 
      name: 'Healthcare Clinic',
      description: 'Medical practice with doctors, appointments, and patient management',
      icon: <Stethoscope className="w-6 h-6" />,
      color: 'from-blue-500 to-teal-600',
      features: ['Doctor schedules', 'Patient appointments', 'Multi-clinic support', 'Medical records']
    },
    {
      id: 'consulting',
      name: 'Business Consulting',
      description: 'Consulting firm with consultants, client sessions, and project management',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-600', 
      features: ['Consultant availability', 'Client sessions', 'Multi-office support', 'Project tracking']
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing Plant',
      description: 'Production facility with operators, job scheduling, and equipment management',
      icon: <Wrench className="w-6 h-6" />,
      color: 'from-orange-500 to-yellow-600',
      features: ['Operator shifts', 'Production jobs', 'Multi-plant support', 'Equipment tracking']
    }
  ]

  const handleNewBooking = (bookingData: any) => {
    console.log('New booking requested:', bookingData)
    // Handle booking creation
  }

  const handleAppointmentUpdate = (appointmentData: any) => {
    console.log('Appointment updated:', appointmentData)
    // Handle appointment updates
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  HERA DNA Universal Calendar
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  One Calendar System • Any Business Type
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Production Ready
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Zap className="w-3 h-3 mr-1" />
                DNA System
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Alert */}
        <Alert className="mb-8 bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-700">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <strong>HERA DNA Universal Calendar:</strong> One calendar component that adapts to any business type. 
            Same codebase, different configurations. Perfect for multi-tenant SaaS platforms.
          </AlertDescription>
        </Alert>

        {/* Business Type Selector */}
        <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Business Types
            </CardTitle>
            <CardDescription>
              Select a business type to see how the universal calendar adapts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {businessTypes.map((business) => (
                <Card
                  key={business.id}
                  className={cn(
                    "cursor-pointer transition-all transform hover:scale-105",
                    selectedBusiness === business.id
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : "hover:shadow-md"
                  )}
                  onClick={() => setSelectedBusiness(business.id as any)}
                >
                  <CardContent className="p-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3",
                      business.color
                    )}>
                      <div className="text-white">{business.icon}</div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {business.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {business.description}
                    </p>
                    
                    <div className="space-y-1">
                      {business.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Universal Calendar */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
                  businessTypes.find(b => b.id === selectedBusiness)?.color || 'from-blue-500 to-purple-600'
                )}>
                  <div className="text-white">
                    {businessTypes.find(b => b.id === selectedBusiness)?.icon}
                  </div>
                </div>
                <div>
                  <CardTitle>
                    {businessTypes.find(b => b.id === selectedBusiness)?.name} Calendar
                  </CardTitle>
                  <CardDescription>
                    Universal resource scheduling adapted for {selectedBusiness} operations
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Smart Code: HERA.{selectedBusiness.toUpperCase()}.CALENDAR.RESOURCE.v1
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <HeraDnaUniversalResourceCalendar
              businessType={selectedBusiness}
              organizations={businessOrganizations[selectedBusiness]}
              canViewAllBranches={true}
              onNewBooking={handleNewBooking}
              onAppointmentUpdate={handleAppointmentUpdate}
              className="min-h-[800px]"
            />
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Universal Resources
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stylists, doctors, consultants, or operators - same calendar handles all resource types with intelligent configuration.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-600 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Multi-Branch Support
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Perfect for multi-location businesses. Head office gets consolidated view, branches see local data.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                HERA Integration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Built on HERA's universal 6-table architecture with smart codes and multi-tenant security by default.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}