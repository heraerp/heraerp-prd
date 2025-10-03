/**
 * HERA DNA SECURITY: Demo User Selector
 * Quick testing component for HERA DNA SECURITY framework
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, User, Calculator, Shield, Users, Scissors, Lock, TestTube } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'

interface DemoUser {
  email: string
  password: string
  role: string
  fullName: string
  description: string
  icon: React.ElementType
  permissions: string[]
  testScenarios: string[]
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'michele@hairtalkz.com',
    password: 'HairTalkz2024!',
    role: 'owner',
    fullName: 'Michele Hair (Owner)',
    description: 'Complete system access with all financial data',
    icon: Crown,
    permissions: [
      'All financial data',
      'Staff management',
      'POS operations',
      'Export functionality',
      'System settings'
    ],
    testScenarios: [
      'View all dashboard widgets',
      'Access complete financial reports',
      'Export data successfully',
      'Manage all staff and customers'
    ]
  },
  {
    email: 'manager@hairtalkz.com',
    password: 'Manager2024!',
    role: 'manager',
    fullName: 'Sarah Manager',
    description: 'Operational management with limited financial access',
    icon: Users,
    permissions: [
      'Operations dashboard',
      'Staff scheduling',
      'Inventory management',
      'Customer management',
      'Basic financial reports'
    ],
    testScenarios: [
      'Manage daily operations',
      'Schedule staff shifts',
      'View operational metrics',
      'Limited financial access'
    ]
  },
  {
    email: 'receptionist@hairtalkz.com',
    password: 'Reception2024!',
    role: 'receptionist',
    fullName: 'Emma Receptionist',
    description: 'Front desk operations with customer management',
    icon: User,
    permissions: [
      'Appointment management',
      'Customer check-in',
      'Basic POS operations',
      'Service booking',
      'Customer information'
    ],
    testScenarios: [
      'Financial data should be hidden',
      'POS access for basic sales',
      'Customer management only',
      'No export functionality'
    ]
  },
  {
    email: 'stylist@hairtalkz.com',
    password: 'Stylist2024!',
    role: 'stylist',
    fullName: 'Jessica Stylist',
    description: 'Individual stylist with personal appointments only',
    icon: Scissors,
    permissions: [
      'Own appointments only',
      'Assigned customers',
      'Personal schedule',
      'Service completion',
      'Basic client notes'
    ],
    testScenarios: [
      'See only own appointments',
      'No financial data access',
      'No POS access',
      'Limited navigation menu'
    ]
  },
  {
    email: 'accountant@hairtalkz.com',
    password: 'Accounts2024!',
    role: 'accountant',
    fullName: 'David Accountant',
    description: 'Financial specialist with reports and compliance access',
    icon: Calculator,
    permissions: [
      'All financial reports',
      'VAT compliance',
      'Export financial data',
      'Transaction history',
      'P&L statements'
    ],
    testScenarios: [
      'Full financial data access',
      'Export capabilities',
      'No POS access',
      'VAT and compliance features'
    ]
  },
  {
    email: 'admin@hairtalkz.com',
    password: 'Admin2024!',
    role: 'admin',
    fullName: 'Alex Admin',
    description: 'System administrator with user management',
    icon: Shield,
    permissions: [
      'User management',
      'System settings',
      'Security controls',
      'Audit logs',
      'Integration management'
    ],
    testScenarios: [
      'Manage user accounts',
      'Configure system settings',
      'View security logs',
      'Limited business data access'
    ]
  }
]

interface DemoUserSelectorProps {
  onUserSelect: (email: string, password: string) => void
  isLoading?: boolean
}

export function DemoUserSelector({ onUserSelect, isLoading = false }: DemoUserSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0" style={{ backgroundColor: LUXE_COLORS.charcoalLight }}>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TestTube className="h-6 w-6" style={{ color: LUXE_COLORS.gold }} />
            <CardTitle style={{ color: LUXE_COLORS.gold }}>HERA DNA SECURITY Demo</CardTitle>
          </div>
          <CardDescription style={{ color: LUXE_COLORS.bronze }}>
            Test the security framework with different user roles and permissions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Demo Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_USERS.map(user => {
          const Icon = user.icon
          return (
            <Card
              key={user.email}
              className="border-0 hover:scale-[1.02] transition-transform cursor-pointer"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                borderColor: `${LUXE_COLORS.bronze}30`
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${LUXE_COLORS.gold}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: LUXE_COLORS.gold }} />
                  </div>
                  <div>
                    <CardTitle className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                      {user.fullName}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: LUXE_COLORS.bronze,
                        color: LUXE_COLORS.bronze
                      }}
                    >
                      {user.role.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                  {user.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Login Credentials */}
                <div
                  className="p-3 rounded-lg text-xs"
                  style={{ backgroundColor: LUXE_COLORS.charcoal }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Lock className="h-3 w-3" style={{ color: LUXE_COLORS.bronze }} />
                    <span style={{ color: LUXE_COLORS.bronze }}>Credentials</span>
                  </div>
                  <div style={{ color: LUXE_COLORS.champagne }}>
                    <div>Email: {user.email}</div>
                    <div>Password: {user.password}</div>
                  </div>
                </div>

                {/* Key Permissions */}
                <div>
                  <div className="text-xs font-medium mb-2" style={{ color: LUXE_COLORS.bronze }}>
                    Key Permissions:
                  </div>
                  <div className="space-y-1">
                    {user.permissions.slice(0, 3).map((permission, idx) => (
                      <div
                        key={idx}
                        className="text-xs flex items-center gap-2"
                        style={{ color: LUXE_COLORS.champagne }}
                      >
                        <div
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: LUXE_COLORS.gold }}
                        />
                        {permission}
                      </div>
                    ))}
                    {user.permissions.length > 3 && (
                      <div className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                        +{user.permissions.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Scenarios */}
                <div>
                  <div className="text-xs font-medium mb-2" style={{ color: LUXE_COLORS.bronze }}>
                    Test Scenarios:
                  </div>
                  <div className="space-y-1">
                    {user.testScenarios.slice(0, 2).map((scenario, idx) => (
                      <div
                        key={idx}
                        className="text-xs flex items-center gap-2"
                        style={{ color: LUXE_COLORS.champagne }}
                      >
                        <div
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: LUXE_COLORS.emerald }}
                        />
                        {scenario}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  onClick={() => onUserSelect(user.email, user.password)}
                  disabled={isLoading}
                  className="w-full"
                  style={{
                    backgroundColor: LUXE_COLORS.gold,
                    color: LUXE_COLORS.charcoal
                  }}
                >
                  {isLoading ? 'Logging in...' : `Login as ${user.role}`}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Testing Instructions */}
      <Card className="border-0" style={{ backgroundColor: LUXE_COLORS.charcoalLight }}>
        <CardHeader>
          <CardTitle style={{ color: LUXE_COLORS.gold }}>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div style={{ color: LUXE_COLORS.bronze }}>
            <div className="font-medium mb-2">🧪 How to Test HERA DNA SECURITY:</div>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Login with different roles using the buttons above</li>
              <li>Navigate to /salon/dashboard - notice role-based widgets</li>
              <li>Try /salon/finance - see permission-based access</li>
              <li>Test /salon/pos - verify role restrictions</li>
              <li>Check financial data masking for unauthorized roles</li>
              <li>Verify audit logging in browser dev tools</li>
            </ol>
          </div>

          <div
            className="mt-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: LUXE_COLORS.charcoal }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" style={{ color: LUXE_COLORS.emerald }} />
              <span style={{ color: LUXE_COLORS.emerald }}>Security Features Active</span>
            </div>
            <div style={{ color: LUXE_COLORS.champagne }}>
              • Multi-tenant isolation enforced
              <br />
              • Role-based access control active
              <br />
              • Audit logging enabled
              <br />• Real-time permission checking
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
