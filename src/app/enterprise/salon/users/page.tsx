// Force dynamic rendering to prevent SSG issues with SecuredSalonProvider
export const dynamic = "force-dynamic";

'use client'

import React, { useState, useEffect } from 'react'
import { useSecuredSalonContext } from '../EnterpriseSecuredSalonProvider'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import {
  Plus,
  Users,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  UserX,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  emerald: '#0F6F5C',
  rose: '#E8B4B8'
}

const SALON_ROLES = [
  { value: 'owner', label: 'Owner', description: 'Full access to all features' },
  { value: 'manager', label: 'Manager', description: 'Manage staff, services, and reports' },
  { value: 'receptionist', label: 'Receptionist', description: 'Book appointments and manage customers' },
  { value: 'stylist', label: 'Stylist', description: 'View schedule and customer details' },
  { value: 'accountant', label: 'Accountant', description: 'Access to financial reports only' }
]

interface User {
  id: string
  email: string
  full_name: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  last_sign_in: string | null
  created_at: string
}

interface Invitation {
  id: string
  email: string
  role: string
  invited_by: string
  invited_at: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired'
}

function UserManagementContent() {
  const { organizationId, salonRole } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // State
  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')

  // Invitation modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('receptionist')
  const [sendingInvite, setSendingInvite] = useState(false)

  // Permission check: only owner and manager can manage users
  const canManageUsers = ['owner', 'manager'].includes(salonRole || '')

  // Fetch users and invitations
  const fetchData = async () => {
    if (!organizationId) return

    setIsLoading(true)
    try {
      // Fetch users (members of this organization)
      const usersResponse = await fetch(`/api/v2/users?organization_id=${organizationId}`)
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }

      // Fetch pending invitations
      const invitationsResponse = await fetch(`/api/v2/invitations?organization_id=${organizationId}`)
      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json()
        setInvitations(invitationsData.invitations || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // Send invitation
  const handleSendInvitation = async () => {
    if (!inviteEmail || !inviteRole) {
      showError('Missing information', 'Please enter email and select role')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      showError('Invalid email', 'Please enter a valid email address')
      return
    }

    setSendingInvite(true)
    const loadingId = showLoading('Sending invitation...', 'Please wait')

    try {
      const { supabase } = await import('@/lib/supabase/client')
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const response = await fetch('/api/v2/invitations/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          organization_id: organizationId,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          app_type: 'salon'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send invitation')
      }

      removeToast(loadingId)
      showSuccess('Invitation sent!', `An email has been sent to ${inviteEmail}`)
      setInviteModalOpen(false)
      setInviteEmail('')
      setInviteRole('receptionist')
      fetchData() // Refresh data
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to send invitation', error.message)
    } finally {
      setSendingInvite(false)
    }
  }

  // Resend invitation
  const handleResendInvitation = async (invitationId: string, email: string) => {
    const loadingId = showLoading('Resending invitation...', 'Please wait')

    try {
      const { supabase } = await import('@/lib/supabase/client')
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const response = await fetch(`/api/v2/invitations/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          invitation_id: invitationId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to resend invitation')
      }

      removeToast(loadingId)
      showSuccess('Invitation resent!', `A new email has been sent to ${email}`)
      fetchData()
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to resend invitation', error.message)
    }
  }

  // Cancel invitation
  const handleCancelInvitation = async (invitationId: string, email: string) => {
    const loadingId = showLoading('Canceling invitation...', 'Please wait')

    try {
      const { supabase } = await import('@/lib/supabase/client')
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const response = await fetch(`/api/v2/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to cancel invitation')
      }

      removeToast(loadingId)
      showSuccess('Invitation canceled', `Invitation to ${email} has been canceled`)
      fetchData()
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to cancel invitation', error.message)
    }
  }

  // Deactivate user
  const handleDeactivateUser = async (userId: string, userName: string) => {
    const loadingId = showLoading('Deactivating user...', 'Please wait')

    try {
      const { supabase } = await import('@/lib/supabase/client')
      const {
        data: { session }
      } = await supabase.auth.getSession()

      const response = await fetch(`/api/v2/users/${userId}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          organization_id: organizationId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to deactivate user')
      }

      removeToast(loadingId)
      showSuccess('User deactivated', `${userName} has been deactivated`)
      fetchData()
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to deactivate user', error.message)
    }
  }

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    pendingInvitations: invitations.filter(i => i.status === 'pending').length,
    totalInvitations: invitations.length
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  if (!organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.black }}>
        <div
          className="text-center p-8 rounded-xl"
          style={{
            backgroundColor: COLORS.charcoal,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h2 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
            Loading...
          </h2>
          <p style={{ color: COLORS.lightText, opacity: 0.7 }}>Setting up user management.</p>
        </div>
      </div>
    )
  }

  return (
    <SalonLuxePage
      title="User Management"
      description="Manage user accounts, roles, and access control"
      actions={
        <>
          <SalonLuxeButton
            variant="outline"
            size="md"
            onClick={() => fetchData()}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </SalonLuxeButton>
          {canManageUsers && (
            <SalonLuxeButton
              variant="primary"
              size="md"
              onClick={() => setInviteModalOpen(true)}
              icon={<Mail className="w-4 h-4" />}
            >
              Invite User
            </SalonLuxeButton>
          )}
        </>
      }
    >
      {/* Mobile-first status bar spacer */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Mobile app header */}
      <div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-champagne">User Management</h1>
              <p className="text-xs text-bronze">{stats.totalUsers} users</p>
            </div>
          </div>
          {canManageUsers && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="min-w-[44px] min-h-[44px] rounded-full bg-gold/10 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Invite user"
            >
              <Mail className="w-5 h-5 text-gold" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
          {[
            {
              title: 'Total Users',
              value: stats.totalUsers,
              icon: Users,
              color: COLORS.gold,
              gradient: `linear-gradient(135deg, ${COLORS.gold}30 0%, ${COLORS.gold}20 20%, ${COLORS.charcoal}dd 60%, ${COLORS.charcoal}cc 100%)`
            },
            {
              title: 'Active Users',
              value: stats.activeUsers,
              icon: CheckCircle2,
              color: COLORS.emerald,
              gradient: `linear-gradient(135deg, ${COLORS.emerald}30 0%, ${COLORS.emerald}20 20%, ${COLORS.charcoal}dd 60%, ${COLORS.charcoal}cc 100%)`
            },
            {
              title: 'Pending Invites',
              value: stats.pendingInvitations,
              icon: Clock,
              color: COLORS.bronze,
              gradient: `linear-gradient(135deg, ${COLORS.bronze}30 0%, ${COLORS.bronze}20 20%, ${COLORS.charcoal}dd 60%, ${COLORS.charcoal}cc 100%)`
            },
            {
              title: 'Total Invites',
              value: stats.totalInvitations,
              icon: Mail,
              color: COLORS.goldDark,
              gradient: `linear-gradient(135deg, ${COLORS.goldDark}30 0%, ${COLORS.goldDark}20 20%, ${COLORS.charcoal}dd 60%, ${COLORS.charcoal}cc 100%)`
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="group relative p-3 md:p-4 lg:p-5 rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-95 hover:shadow-2xl cursor-pointer animate-in fade-in slide-in-from-bottom-2 min-h-[100px] md:min-h-[120px]"
              style={{
                background: stat.gradient,
                border: `2px solid ${stat.color}90`,
                boxShadow: `0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 ${stat.color}35, 0 0 40px ${stat.color}20`,
                animationDelay: `${index * 100}ms`
              }}
            >
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1">
                  <p
                    className="text-xs md:text-sm font-medium mb-1 md:mb-2"
                    style={{ color: COLORS.bronze, opacity: 0.9 }}
                  >
                    {stat.title}
                  </p>
                  <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: COLORS.champagne }}>
                    {stat.value}
                  </p>
                </div>
                <div
                  className="p-1.5 md:p-2 rounded-lg flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${stat.color}40 0%, ${stat.color}20 100%)`,
                    border: `1.5px solid ${stat.color}80`,
                    boxShadow: `0 6px 20px ${stat.color}30`
                  }}
                >
                  <stat.icon className="h-3 w-3 md:h-4 md:w-4" style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: COLORS.bronze }}
            />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: COLORS.charcoal,
                border: `1px solid ${COLORS.gold}30`,
                color: COLORS.champagne,
                caretColor: COLORS.gold
              }}
            />
          </div>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 min-w-[200px]"
            style={{
              backgroundColor: COLORS.charcoal,
              border: `1px solid ${COLORS.gold}30`,
              color: COLORS.champagne
            }}
          >
            <option value="all">All Roles</option>
            {SALON_ROLES.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Permission Notice */}
        {!canManageUsers && (
          <div
            className="p-4 rounded-xl mb-6"
            style={{
              backgroundColor: `${COLORS.bronze}20`,
              border: `1px solid ${COLORS.bronze}40`
            }}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" style={{ color: COLORS.bronze }} />
              <p style={{ color: COLORS.lightText }}>
                You have view-only access. Only owners and managers can invite or manage users.
              </p>
            </div>
          </div>
        )}

        {/* Users List */}
        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.gold}30`
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: `${COLORS.gold}20` }}>
            <h3 className="font-semibold text-lg" style={{ color: COLORS.champagne }}>
              Active Users ({filteredUsers.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: COLORS.gold }} />
              <p style={{ color: COLORS.bronze }}>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.bronze }} />
              <p style={{ color: COLORS.lightText }}>No users found</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: `${COLORS.gold}10` }}>
              {filteredUsers.map(user => (
                <div key={user.id} className="p-4 hover:bg-charcoalLight transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium" style={{ color: COLORS.champagne }}>
                          {user.full_name}
                        </h4>
                        <span
                          className="px-2 py-1 rounded-lg text-xs font-medium capitalize"
                          style={{
                            backgroundColor: `${user.status === 'active' ? COLORS.emerald : COLORS.rose}20`,
                            color: user.status === 'active' ? COLORS.emerald : COLORS.rose
                          }}
                        >
                          {user.status}
                        </span>
                        <span
                          className="px-2 py-1 rounded-lg text-xs font-medium capitalize"
                          style={{
                            backgroundColor: `${COLORS.gold}20`,
                            color: COLORS.gold
                          }}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: COLORS.bronze }}>
                        {user.email}
                      </p>
                      {user.last_sign_in && (
                        <p className="text-xs mt-1" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                          Last sign in: {new Date(user.last_sign_in).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {canManageUsers && user.role !== 'owner' && (
                      <button
                        onClick={() => handleDeactivateUser(user.id, user.full_name)}
                        className="p-2 rounded-lg hover:bg-rose/20 transition-colors"
                        title="Deactivate user"
                      >
                        <UserX className="w-4 h-4" style={{ color: COLORS.rose }} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: COLORS.charcoal,
              border: `1px solid ${COLORS.gold}30`
            }}
          >
            <div className="p-4 border-b" style={{ borderColor: `${COLORS.gold}20` }}>
              <h3 className="font-semibold text-lg" style={{ color: COLORS.champagne }}>
                Pending Invitations ({invitations.filter(i => i.status === 'pending').length})
              </h3>
            </div>

            <div className="divide-y" style={{ borderColor: `${COLORS.gold}10` }}>
              {invitations
                .filter(i => i.status === 'pending')
                .map(invitation => (
                  <div key={invitation.id} className="p-4 hover:bg-charcoalLight transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium" style={{ color: COLORS.champagne }}>
                            {invitation.email}
                          </h4>
                          <span
                            className="px-2 py-1 rounded-lg text-xs font-medium capitalize"
                            style={{
                              backgroundColor: `${COLORS.bronze}20`,
                              color: COLORS.bronze
                            }}
                          >
                            {invitation.role}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: COLORS.bronze }}>
                          Invited {new Date(invitation.invited_at).toLocaleDateString()} • Expires{' '}
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </div>

                      {canManageUsers && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                            className="p-2 rounded-lg hover:bg-gold/20 transition-colors"
                            title="Resend invitation"
                          >
                            <RefreshCw className="w-4 h-4" style={{ color: COLORS.gold }} />
                          </button>
                          <button
                            onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                            className="p-2 rounded-lg hover:bg-rose/20 transition-colors"
                            title="Cancel invitation"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: COLORS.rose }} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Bottom spacing for mobile */}
        <div className="h-20 md:h-0" />
      </div>

      {/* Invite User Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent
          className="sm:max-w-[500px]"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.gold}30`
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: COLORS.champagne }}>Invite New User</DialogTitle>
            <DialogDescription style={{ color: COLORS.bronze }}>
              Send an invitation email to add a new user to your salon
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email" style={{ color: COLORS.champagne }}>
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                disabled={sendingInvite}
                className="mt-2"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.gold}30`,
                  color: COLORS.champagne
                }}
              />
            </div>

            <div>
              <Label htmlFor="role" style={{ color: COLORS.champagne }}>
                Role
              </Label>
              <select
                id="role"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                disabled={sendingInvite}
                className="mt-2 w-full px-3 py-2 rounded-md transition-all focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.gold}30`,
                  color: COLORS.champagne
                }}
              >
                {SALON_ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setInviteModalOpen(false)}
              disabled={sendingInvite}
              className="px-4 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: COLORS.charcoalLight,
                border: `1px solid ${COLORS.gold}30`,
                color: COLORS.champagne
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSendInvitation}
              disabled={sendingInvite}
              className="px-4 py-2 rounded-lg transition-all flex items-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                color: COLORS.black,
                fontWeight: 600
              }}
            >
              {sendingInvite ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Invitation
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SalonLuxePage>
  )
}

export default function UsersPage() {
  return (
    <StatusToastProvider>
      <UserManagementContent />
    </StatusToastProvider>
  )
}
