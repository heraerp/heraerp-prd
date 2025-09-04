'use client'

/**
 * HERA Employee Manager Demo
 * Smart Code: HERA.HR.EMPLOYEE.MANAGER.DEMO.v1
 * 
 * Demonstrates role-based employee leave management system
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Crown, 
  User, 
  Shield,
  Info,
  Briefcase,
  Scissors,
  Stethoscope,
  Wrench
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmployeeManagerView } from '@/components/calendar/EmployeeManagerView'

export default function EmployeeManagerDemo() {
  const [selectedRole, setSelectedRole] = useState<'employee' | 'manager' | 'admin'>('employee')
  const [selectedBusiness, setSelectedBusiness] = useState<'salon' | 'healthcare' | 'consulting' | 'manufacturing'>('salon')
  const [selectedUser, setSelectedUser] = useState<string>('resource1')

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

  const roles = [
    {
      id: 'employee',
      name: 'Employee',
      description: 'View own schedule and request leave',
      icon: <User className="w-5 h-5" />,
      color: 'from-blue-500 to-cyan-600',
      permissions: ['View own schedule', 'Request leave', 'View leave status']
    },
    {
      id: 'manager',
      name: 'Manager',
      description: 'Manage team schedules and approve leave',
      icon: <Crown className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-600',
      permissions: ['View team schedules', 'Approve/deny leave', 'Manage appointments', 'View reports']
    },
    {
      id: 'admin',
      name: 'Admin',
      description: 'Full system access and configuration',
      icon: <Shield className="w-5 h-5" />,
      color: 'from-orange-500 to-red-600',
      permissions: ['All manager permissions', 'System configuration', 'User management', 'Multi-branch access']
    }
  ]

  const businessTypes = [
    {
      id: 'salon',
      name: 'Hair Salon',
      icon: <Scissors className="w-5 h-5" />,
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'healthcare', 
      name: 'Healthcare',
      icon: <Stethoscope className="w-5 h-5" />,
      color: 'from-blue-500 to-teal-600'
    },
    {
      id: 'consulting',
      name: 'Consulting',
      icon: <Briefcase className="w-5 h-5" />,
      color: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing',
      icon: <Wrench className="w-5 h-5" />,
      color: 'from-orange-500 to-yellow-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  HERA Employee Manager System
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  Role-based leave management with approval workflows
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Production Ready
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
            <strong>Employee-Manager System:</strong> Role-based interface where employees can request leave 
            and managers can approve requests. Switch between roles and business types to see different views.
          </AlertDescription>
        </Alert>

        {/* Configuration Panel */}
        <Card className="mb-8 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Demo Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">User Role</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <Card
                    key={role.id}
                    className={cn(
                      "cursor-pointer transition-all transform hover:scale-105",
                      selectedRole === role.id
                        ? "ring-2 ring-blue-500 shadow-lg"
                        : "hover:shadow-md"
                    )}
                    onClick={() => setSelectedRole(role.id as any)}
                  >
                    <CardContent className="p-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3",
                        role.color
                      )}>
                        <div className="text-white">{role.icon}</div>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {role.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {role.description}
                      </p>
                      
                      <div className="space-y-1">
                        {role.permissions.slice(0, 2).map((permission, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {permission}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Business Type Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Business Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {businessTypes.map((business) => (
                  <Button
                    key={business.id}
                    variant={selectedBusiness === business.id ? 'default' : 'outline'}
                    onClick={() => setSelectedBusiness(business.id as any)}
                    className="flex items-center gap-2 h-12"
                  >
                    {business.icon}
                    {business.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Manager View */}
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <CardContent className="p-0">
            <EmployeeManagerView
              userRole={selectedRole}
              currentUserId={selectedUser}
              businessType={selectedBusiness}
              organizations={businessOrganizations[selectedBusiness]}
              className="p-6"
            />
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Employee Experience
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Employees can easily request leave, view their schedule, and track request status with a clean interface.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Manager Dashboard
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Managers get dedicated views to approve requests, manage team schedules, and monitor leave patterns.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Universal Architecture
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Built on HERA's 6-table foundation with multi-tenant security and smart codes for business intelligence.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}