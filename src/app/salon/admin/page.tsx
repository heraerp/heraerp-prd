'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/luxe-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Shield,
  Users,
  Settings,
  Database,
  Lock,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Wifi,
  HardDrive,
  UserPlus,
  UserX,
  Key,
  FileText,
  Download,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#B794F4',
  emerald: '#0F6F5C',
  ruby: '#DC2626',
  sapphire: '#2563EB',
  orange: '#F97316'
}

const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

interface SystemStatus {
  label: string
  status: 'operational' | 'warning' | 'error'
  value: string
  icon: React.ElementType
}

interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  lastActive: string
}

function StatusIndicator({ status }: { status: SystemStatus['status'] }) {
  const colors = {
    operational: COLORS.emerald,
    warning: COLORS.orange,
    error: COLORS.ruby
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-2 rounded-full animate-pulse"
        style={{ backgroundColor: colors[status] }}
      />
      <span
        className="text-xs font-light uppercase tracking-wider"
        style={{ color: colors[status] }}
      >
        {status}
      </span>
    </div>
  )
}

function SystemCard({ system }: { system: SystemStatus }) {
  const Icon = system.icon

  return (
    <Card
      style={{
        backgroundColor: COLORS.charcoalLight,
        border: `1px solid ${COLORS.bronze}20`
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: `${COLORS.bronze}20`,
              color: COLORS.bronze
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <StatusIndicator status={system.status} />
        </div>

        <h3
          className="text-sm font-light tracking-wider uppercase mb-1"
          style={{ color: COLORS.bronze }}
        >
          {system.label}
        </h3>
        <p className="text-lg font-light" style={{ color: COLORS.champagne }}>
          {system.value}
        </p>
      </CardContent>
    </Card>
  )
}

function UserRow({ user }: { user: User }) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg hover:scale-[1.005] transition-all"
      style={{
        backgroundColor: COLORS.charcoal,
        border: `1px solid ${COLORS.bronze}20`
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: `${COLORS.gold}20`,
            color: COLORS.gold
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ color: COLORS.lightText }} className="font-medium">
            {user.name}
          </p>
          <p style={{ color: COLORS.bronze }} className="text-sm font-light">
            {user.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p style={{ color: COLORS.champagne }} className="text-sm">
            {user.role}
          </p>
          <p style={{ color: COLORS.bronze }} className="text-xs font-light">
            Last active: {user.lastActive}
          </p>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.status === 'active'
              ? `bg-emerald-900/20 text-emerald-500`
              : `bg-gray-900/20 text-gray-500`
          }`}
        >
          {user.status}
        </div>

        <Button size="sm" variant="ghost" style={{ color: COLORS.bronze }}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const systemStatuses: SystemStatus[] = [
    {
      label: 'Database',
      status: 'operational',
      value: '99.9% uptime',
      icon: Database
    },
    {
      label: 'API Server',
      status: 'operational',
      value: '< 50ms response',
      icon: Server
    },
    {
      label: 'Network',
      status: 'operational',
      value: '100 Mbps',
      icon: Wifi
    },
    {
      label: 'Storage',
      status: 'warning',
      value: '78% used',
      icon: HardDrive
    }
  ]

  const users: User[] = [
    {
      id: '1',
      name: 'Michele Rodriguez',
      email: 'michele@hairtalkz.ae',
      role: 'Owner',
      status: 'active',
      lastActive: '2 mins ago'
    },
    {
      id: '2',
      name: 'Emily Johnson',
      email: 'emily@hairtalkz.ae',
      role: 'Receptionist',
      status: 'active',
      lastActive: '15 mins ago'
    },
    {
      id: '3',
      name: 'Michael Chen',
      email: 'michael@hairtalkz.ae',
      role: 'Accountant',
      status: 'active',
      lastActive: '1 hour ago'
    },
    {
      id: '4',
      name: 'Sarah Martinez',
      email: 'sarah@hairtalkz.ae',
      role: 'Stylist',
      status: 'inactive',
      lastActive: '2 days ago'
    }
  ]

  useEffect(() => {
    checkAuth()
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const checkAuth = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session?.user) {
      router.push('/salon/auth')
      return
    }

    const userMetadata = session.user.user_metadata
    const userRole =
      userMetadata?.role?.toLowerCase() || localStorage.getItem('salonRole')?.toLowerCase()

    // Check organization
    if (userMetadata?.organization_id !== HAIRTALKZ_ORG_ID) {
      router.push('/salon/auth')
      return
    }

    // Check role
    if (userRole && userRole !== 'admin' && userRole !== 'administrator') {
      // Redirect to appropriate dashboard based on role
      const redirectMap: Record<string, string> = {
        owner: '/salon/dashboard',
        receptionist: '/salon/receptionist',
        accountant: '/salon/accountant'
      }

      const redirectPath = redirectMap[userRole] || '/salon/auth'
      router.push(redirectPath)
      return
    }
  }

  const filteredUsers = users.filter(
    user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.charcoal }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: COLORS.gold }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.charcoal }}>
      {/* Header */}
      <div
        className="border-b px-8 py-6"
        style={{
          backgroundColor: COLORS.charcoalLight,
          borderColor: `${COLORS.bronze}20`
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-3xl font-light tracking-wider flex items-center gap-3"
              style={{ color: COLORS.champagne }}
            >
              <Shield className="h-8 w-8" style={{ color: COLORS.gold }} />
              System Administration
            </h1>
            <p className="text-sm font-light mt-1" style={{ color: COLORS.bronze }}>
              Manage users, settings, and system configuration
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="font-light"
              style={{
                borderColor: COLORS.bronze,
                color: COLORS.champagne
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>

            <Button
              className="font-light"
              style={{
                backgroundColor: COLORS.gold,
                color: COLORS.black
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* System Status */}
        <div className="mb-8">
          <h2
            className="text-xl font-light tracking-wider mb-6"
            style={{ color: COLORS.champagne }}
          >
            System Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemStatuses.map((system, idx) => (
              <SystemCard key={idx} system={system} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card
            style={{
              backgroundColor: COLORS.charcoalLight,
              border: `1px solid ${COLORS.bronze}20`
            }}
          >
            <CardHeader>
              <CardTitle
                className="text-lg font-light tracking-wider"
                style={{ color: COLORS.champagne }}
              >
                Database Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start font-light"
                variant="outline"
                style={{
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne
                }}
              >
                <Database className="h-4 w-4 mr-3" />
                Backup Database
              </Button>

              <Button
                className="w-full justify-start font-light"
                variant="outline"
                style={{
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne
                }}
              >
                <RefreshCw className="h-4 w-4 mr-3" />
                Restore Database
              </Button>

              <Button
                className="w-full justify-start font-light"
                variant="outline"
                style={{
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne
                }}
              >
                <Activity className="h-4 w-4 mr-3" />
                View Activity Log
              </Button>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: COLORS.charcoalLight,
              border: `1px solid ${COLORS.bronze}20`
            }}
          >
            <CardHeader>
              <CardTitle
                className="text-lg font-light tracking-wider"
                style={{ color: COLORS.champagne }}
              >
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start font-light"
                variant="outline"
                style={{
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne
                }}
              >
                <Lock className="h-4 w-4 mr-3" />
                Password Policy
              </Button>

              <Button
                className="w-full justify-start font-light"
                variant="outline"
                style={{
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne
                }}
              >
                <Key className="h-4 w-4 mr-3" />
                API Keys
              </Button>

              <Button
                className="w-full justify-start font-light"
                variant="outline"
                style={{
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne
                }}
              >
                <Shield className="h-4 w-4 mr-3" />
                Access Control
              </Button>
            </CardContent>
          </Card>

          <Card
            style={{
              backgroundColor: COLORS.charcoalLight,
              border: `1px solid ${COLORS.bronze}20`
            }}
          >
            <CardHeader>
              <CardTitle
                className="text-lg font-light tracking-wider"
                style={{ color: COLORS.champagne }}
              >
                Integration Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start font-light"
                variant="outline"
                style={{
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne
                }}
                asChild
              >
                <Link href="/salon/whatsapp">
                  <MessageSquare className="h-4 w-4 mr-3" />
                  WhatsApp Config
                </Link>
              </Button>

              <Button
                className="w-full justify-start font-light"
                variant="outline"
                style={{
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne
                }}
              >
                <CreditCard className="h-4 w-4 mr-3" />
                Payment Gateway
              </Button>

              <Button
                className="w-full justify-start font-light"
                variant="outline"
                style={{
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne
                }}
              >
                <Mail className="h-4 w-4 mr-3" />
                Email Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card
          style={{
            backgroundColor: COLORS.charcoalLight,
            border: `1px solid ${COLORS.bronze}20`
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle
                className="text-xl font-light tracking-wider"
                style={{ color: COLORS.champagne }}
              >
                User Management
              </CardTitle>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: COLORS.bronze }}
                  />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 w-64 font-light"
                    style={{
                      backgroundColor: COLORS.charcoal,
                      border: `1px solid ${COLORS.bronze}50`,
                      color: COLORS.champagne
                    }}
                  />
                </div>

                <Button
                  className="font-light"
                  style={{
                    backgroundColor: COLORS.gold,
                    color: COLORS.black
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <UserRow key={user.id} user={user} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card
          className="mt-8"
          style={{
            backgroundColor: COLORS.charcoalLight,
            border: `1px solid ${COLORS.bronze}20`
          }}
        >
          <CardHeader>
            <CardTitle
              className="text-xl font-light tracking-wider flex items-center gap-3"
              style={{ color: COLORS.champagne }}
            >
              <AlertTriangle className="h-5 w-5" style={{ color: COLORS.orange }} />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  type: 'warning',
                  message: 'Storage usage is above 75% threshold',
                  action: 'Clean up old backups',
                  time: '2 hours ago'
                },
                {
                  type: 'info',
                  message: 'System update available (v2.4.1)',
                  action: 'Schedule update',
                  time: '1 day ago'
                },
                {
                  type: 'success',
                  message: 'Daily backup completed successfully',
                  action: null,
                  time: '3 hours ago'
                }
              ].map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-lg"
                  style={{
                    backgroundColor: COLORS.charcoal,
                    border: `1px solid ${
                      alert.type === 'warning' ? COLORS.orange : COLORS.bronze
                    }20`
                  }}
                >
                  {alert.type === 'warning' && (
                    <AlertTriangle className="h-5 w-5 mt-0.5" style={{ color: COLORS.orange }} />
                  )}
                  {alert.type === 'success' && (
                    <CheckCircle className="h-5 w-5 mt-0.5" style={{ color: COLORS.emerald }} />
                  )}
                  {alert.type === 'info' && (
                    <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: COLORS.sapphire }} />
                  )}

                  <div className="flex-1">
                    <p style={{ color: COLORS.lightText }}>{alert.message}</p>
                    <p className="text-sm font-light mt-1" style={{ color: COLORS.bronze }}>
                      {alert.time}
                    </p>
                  </div>

                  {alert.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-light"
                      style={{
                        borderColor: COLORS.bronze,
                        color: COLORS.champagne
                      }}
                    >
                      {alert.action}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Add missing import
import { Mail } from 'lucide-react'
