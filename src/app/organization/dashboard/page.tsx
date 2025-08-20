'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { useUserContext } from '@/hooks/useUserContext'
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Building2, Users, Shield, Activity, CreditCard, 
  TrendingUp, Calendar, Settings, ExternalLink,
  BarChart3, Clock, CheckCircle, AlertCircle,
  ArrowRight, Sparkles, Zap, Target, UserPlus,
  Database
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface OrganizationStats {
  totalMembers: number
  activeMembers: number
  pendingInvitations: number
  storageUsed: number
  storageLimit: number
  apiCalls: number
  apiLimit: number
}

export default function OrganizationDashboard() {
  const { supabaseUser } = useAuth()
  const { organizationId, userContext } = useUserContext()
  const [stats, setStats] = useState<OrganizationStats>({
    totalMembers: 0,
    activeMembers: 0,
    pendingInvitations: 0,
    storageUsed: 0,
    storageLimit: 100, // GB
    apiCalls: 0,
    apiLimit: 10000
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    if (organizationId) {
      fetchOrganizationStats()
      fetchRecentActivity()
    }
  }, [organizationId])

  const fetchOrganizationStats = async () => {
    try {
      setLoading(true)
      // TODO: Implement actual API call
      // Simulated data for now
      setTimeout(() => {
        setStats({
          totalMembers: 12,
          activeMembers: 10,
          pendingInvitations: 3,
          storageUsed: 23.5,
          storageLimit: 100,
          apiCalls: 3847,
          apiLimit: 10000
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching organization stats:', error)
      setLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    // Simulated recent activity
    setRecentActivity([
      {
        id: 1,
        type: 'member_joined',
        user: 'Emma Wilson',
        action: 'joined the organization',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 2,
        type: 'settings_updated',
        user: 'Admin User',
        action: 'updated organization settings',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        id: 3,
        type: 'role_assigned',
        user: 'John Doe',
        action: 'was assigned Manager role',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ])
  }

  const getSubscriptionTier = () => {
    return userContext?.organization?.settings?.subscription_tier || 'free'
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'member_joined':
        return <Users className="w-4 h-4 text-green-500" />
      case 'settings_updated':
        return <Settings className="w-4 h-4 text-blue-500" />
      case 'role_assigned':
        return <Shield className="w-4 h-4 text-purple-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Dashboard</h1>
            <p className="text-gray-600">Manage your organization settings and members</p>
          </div>
          <OrganizationSwitcher />
        </div>

        {/* Organization Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {userContext?.organization?.name || 'Organization'}
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="secondary" className="capitalize">
                      {userContext?.organization?.type || 'business'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="bg-white border-blue-300 text-blue-700"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {getSubscriptionTier()} plan
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Created {userContext?.organization?.created_at ? 
                        format(new Date(userContext.organization.created_at), 'MMM d, yyyy') : 
                        'Recently'
                      }
                    </span>
                  </div>
                </div>
              </div>
              <Button asChild>
                <Link href="/organization/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-sm text-gray-500">{stats.activeMembers} active</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.pendingInvitations}</p>
                <Link href="/organization/invitations" className="text-sm text-blue-600 hover:underline">
                  View invitations →
                </Link>
              </div>
              <UserPlus className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.storageUsed} GB</p>
                <Database className="w-8 h-8 text-purple-500" />
              </div>
              <Progress value={(stats.storageUsed / stats.storageLimit) * 100} className="h-2" />
              <p className="text-xs text-gray-500">of {stats.storageLimit} GB</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">API Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.apiCalls.toLocaleString()}</p>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <Progress value={(stats.apiCalls / stats.apiLimit) * 100} className="h-2" />
              <p className="text-xs text-gray-500">of {stats.apiLimit.toLocaleString()} calls</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common organization management tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/organization/members">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Manage Members</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          View and manage organization members
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/organization/invitations">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Invite Members</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Send invitations to new members
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/organization/roles">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Roles & Permissions</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Configure access controls
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/organization/billing">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Billing & Subscription</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Manage billing and upgrade plan
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/organization/activity">
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{' '}
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(activity.timestamp, 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Banner */}
      {getSubscriptionTier() === 'free' && (
        <Card className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Upgrade to Professional</h3>
                <p className="text-indigo-100">
                  Unlock advanced features, unlimited members, and priority support
                </p>
              </div>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/organization/billing">
                  <Target className="w-5 h-5 mr-2" />
                  Upgrade Now
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}