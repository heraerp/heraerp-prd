'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import {
  Building2,
  Plus,
  Search,
  Filter,
  Globe,
  Users,
  DollarSign,
  Calendar,
  MoreVertical,
  Edit,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  ChevronRight,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

// Organization resolution: use auth/demo org if available; fallback will be resolved via API

interface Account {
  id: string
  name: string
  industry: string
  segment: string
  revenue: number
  employees: number
  website: string
  status: 'active' | 'inactive' | 'prospect'
  rating: number
  lastContact: string
  opportunities: number
  wonDeals: number
  openCases: number
}

export default function AccountsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isCreating, setIsCreating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    industry: '',
    segment: 'Enterprise',
    website: '',
    revenue: '',
    employees: '',
    status: 'active'
  })

  // Sample accounts data
  const [accounts, setAccounts] = useState<Account[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; status: 'active' | 'inactive' }>({
    name: '',
    status: 'active'
  })
  const [editBusy, setEditBusy] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const { organizationId: demoOrgId } = useDemoOrganization()
  const [resolvedOrgId, setResolvedOrgId] = useState<string>('')

  // Resolve org id once (auth/demo or fallback from server)
  useEffect(() => {
    async function resolveOrg() {
      if (demoOrgId) {
        setResolvedOrgId(demoOrgId)
        return
      }
      try {
        const r = await fetch('/api/playbook/org/default', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          setResolvedOrgId(j.id)
        }
      } catch {}
    }
    resolveOrg()
  }, [demoOrgId])

  useEffect(() => {
    if (resolvedOrgId) loadAccounts()
  }, [resolvedOrgId])

  async function loadAccounts() {
    try {
      console.debug('[accounts] using orgId', resolvedOrgId)
      const res = await fetch(`/api/playbook/crm/accounts?orgId=${resolvedOrgId}`, {
        cache: 'no-store'
      })
      if (!res.ok) throw new Error('Failed to load accounts')
      const data = await res.json()
      const items = (data.items || []).map((r: any) => ({
        id: r.id,
        name: r.entity_name,
        industry: r.industry || 'General',
        segment: r.segment || 'Enterprise',
        website: r.website || '-',
        revenue: r.revenue || 0,
        employees: r.employees || 0,
        status: (r.status === 'archived' ? 'inactive' : r.status || 'active') as Account['status'],
        rating: 3,
        lastContact: r.updated_at || r.created_at,
        opportunities: 0,
        wonDeals: 0,
        openCases: 0
      }))
      setAccounts(items)
    } catch (e) {
      console.error(e)
    }
  }

  function startEdit(acc: Account) {
    setEditingId(acc.id)
    setEditError(null)
    setEditForm({ name: acc.name, status: acc.status === 'inactive' ? 'inactive' : 'active' })
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!resolvedOrgId || !editingId) return
    setEditBusy(true)
    setEditError(null)
    try {
      const res = await fetch('/api/playbook/crm/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: resolvedOrgId,
          smart_code: 'HERA.CRM.ACCOUNT.UPDATE.v1',
          idempotency_key: `${Date.now()}-${editingId}`,
          actor_user_id: '00000000-0000-0000-0000-000000000000',
          account: {
            id: editingId,
            entity_name: editForm.name,
            status: editForm.status === 'inactive' ? 'archived' : 'active'
          }
        })
      })
      if (!res.ok) throw new Error(await res.text())
      setEditingId(null)
      await loadAccounts()
    } catch (err: any) {
      setEditError(err?.message || 'Update failed')
    } finally {
      setEditBusy(false)
    }
  }

  async function performDelete(id: string) {
    if (!resolvedOrgId) return
    if (!confirm('Archive this account?')) return
    try {
      const res = await fetch('/api/playbook/crm/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: resolvedOrgId,
          smart_code: 'HERA.CRM.ACCOUNT.DELETE.v1',
          id
        })
      })
      if (!res.ok) throw new Error(await res.text())
      await loadAccounts()
    } catch (e: any) {
      console.error(e)
      alert('Delete failed: ' + (e?.message || 'Unknown'))
    }
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setCreateError('Account name is required')
      return
    }
    setCreateError(null)
    setCreating(true)
    try {
      // Create account via Playbook API (DB-backed)
      if (!resolvedOrgId) throw new Error('No organization selected')
      const res = await fetch('/api/playbook/crm/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: resolvedOrgId,
          smart_code: 'HERA.CRM.ACCOUNT.CREATE.v1',
          idempotency_key: `${Date.now()}-${form.name}`,
          actor_user_id: '00000000-0000-0000-0000-000000000000',
          account: {
            entity_name: form.name,
            website: form.website || undefined,
            industry: form.industry || undefined,
            owner_id: undefined,
            phone: undefined
          }
        })
      })
      if (!res.ok) throw new Error('Account creation failed')
      await loadAccounts()
      setIsCreating(false)
      setForm({
        name: '',
        industry: '',
        segment: 'Enterprise',
        website: '',
        revenue: '',
        employees: '',
        status: 'active'
      })
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create account')
    } finally {
      setCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'inactive':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'prospect':
        return 'bg-[#FF5A09]/20 text-[#FF5A09] border-[#FF5A09]/30'
      default:
        return 'bg-gray-9000/20 text-muted-foreground border-gray-500/30'
    }
  }

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'Enterprise':
        return 'from-[#FF5A09] to-[#ec7f37]'
      case 'SMB':
        return 'from-[#ec7f37] to-[#be4f0c]'
      case 'Startup':
        return 'from-[#be4f0c] to-[#FF5A09]'
      default:
        return 'from-gray-9000 to-gray-600'
    }
  }

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.industry.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSegment = selectedSegment === 'all' || account.segment === selectedSegment
    const matchesStatus = selectedStatus === 'all' || account.status === selectedStatus
    return matchesSearch && matchesSegment && matchesStatus
  })

  const stats = [
    {
      label: 'Total Accounts',
      value: accounts.length,
      icon: Building2,
      color: 'from-[#FF5A09] to-[#ec7f37]'
    },
    {
      label: 'Active Accounts',
      value: accounts.filter(a => a.status === 'active').length,
      icon: CheckCircle,
      color: 'from-emerald-500 to-green-600'
    },
    {
      label: 'Total Revenue',
      value: `₹${(accounts.reduce((sum, a) => sum + a.revenue, 0) / 100000000).toFixed(0)}Cr`,
      icon: DollarSign,
      color: 'from-[#ec7f37] to-[#be4f0c]'
    },
    {
      label: 'Avg Deal Size',
      value: '₹9.4L',
      icon: TrendingUp,
      color: 'from-[#be4f0c] to-[#FF5A09]'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
          <p className="text-foreground/60 mt-1">Manage your customer accounts and relationships</p>
        </div>
        <button
          data-testid="new-account-button"
          onClick={() => setIsCreating(true)}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-lg text-foreground font-medium hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all duration-300"
        >
          <Plus className="h-5 w-5" />
          <span>New Account</span>
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={submitCreate}
          className="bg-background/5 backdrop-blur-xl border border-border/10 rounded-xl p-4 space-y-3"
          data-testid="create-account-form"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              data-testid="account-name-input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Account name"
              className="px-3 py-2 rounded-md bg-background/5 border border-border/10"
              required
            />
            <input
              value={form.industry}
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
              placeholder="Industry"
              className="px-3 py-2 rounded-md bg-background/5 border border-border/10"
            />
            <select
              value={form.segment}
              onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}
              className="px-3 py-2 rounded-md bg-background/5 border border-border/10"
            >
              <option>Enterprise</option>
              <option>SMB</option>
              <option>Startup</option>
            </select>
            <input
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="Website"
              className="px-3 py-2 rounded-md bg-background/5 border border-border/10 md:col-span-2"
            />
            <input
              value={form.revenue}
              onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))}
              placeholder="Revenue (number)"
              className="px-3 py-2 rounded-md bg-background/5 border border-border/10"
              inputMode="numeric"
            />
            <input
              value={form.employees}
              onChange={e => setForm(f => ({ ...f, employees: e.target.value }))}
              placeholder="Employees"
              className="px-3 py-2 rounded-md bg-background/5 border border-border/10"
              inputMode="numeric"
            />
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 rounded-md bg-background/5 border border-border/10"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
          {createError && <p className="text-sm text-red-400">{createError}</p>}
          <div className="flex gap-2">
            <button
              disabled={creating}
              data-testid="create-account-submit"
              className="px-4 py-2 rounded-md bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] text-foreground"
            >
              {creating ? 'Creating...' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-md border border-border/10"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/50 to-[#ec7f37]/50 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">+12%</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-foreground/60 mt-1">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-[#FF5A09] transition-colors"
          />
        </div>

        <select
          value={selectedSegment}
          onChange={e => setSelectedSegment(e.target.value)}
          className="px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Segments</option>
          <option value="Enterprise">Enterprise</option>
          <option value="SMB">SMB</option>
          <option value="Startup">Startup</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="prospect">Prospect</option>
        </select>

        <button className="flex items-center space-x-2 px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-colors">
          <Filter className="h-5 w-5" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="accounts-list">
        {filteredAccounts.map(account => (
          <div key={account.id} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/30 to-[#ec7f37]/30 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${getSegmentColor(account.segment)}`}
                  >
                    <Building2 className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{account.name}</h3>
                    <p className="text-sm text-foreground/60">{account.industry}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(account.status)}`}
                  >
                    {account.status}
                  </span>
                  <button
                    type="button"
                    data-testid={`account-edit-${account.id}`}
                    onClick={() => startEdit(account)}
                    className="px-2 py-1 text-xs rounded-md border border-border/10 hover:bg-background/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    data-testid={`account-delete-${account.id}`}
                    onClick={() => performDelete(account.id)}
                    className="px-2 py-1 text-xs rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingId === account.id && (
                <form
                  onSubmit={submitEdit}
                  className="mt-3 p-3 border border-border/10 rounded-lg bg-background/5"
                  data-testid={`account-edit-form-${account.id}`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="px-2 py-2 rounded-md bg-background/5 border border-border/10"
                      placeholder="Account name"
                    />
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm(f => ({ ...f, status: e.target.value as any }))}
                      className="px-2 py-2 rounded-md bg-background/5 border border-border/10"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        disabled={editBusy}
                        className="px-3 py-2 rounded-md bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] text-foreground"
                      >
                        {editBusy ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-2 rounded-md border border-border/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  {editError && <p className="text-sm text-red-400 mt-2">{editError}</p>}
                </form>
              )}

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= account.rating
                        ? 'text-[#FF5A09] fill-[#FF5A09]'
                        : 'text-foreground/20'
                    }`}
                  />
                ))}
                <span className="text-xs text-foreground/60 ml-2">({account.rating}.0)</span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-foreground/60 mb-1">Annual Revenue</p>
                  <p className="text-sm font-semibold text-foreground">
                    ₹{(account.revenue / 10000000).toFixed(0)} Cr
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60 mb-1">Employees</p>
                  <p className="text-sm font-semibold text-foreground">
                    {(account.employees / 1000).toFixed(0)}K
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60 mb-1">Segment</p>
                  <p className="text-sm font-semibold text-foreground">{account.segment}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/60 mb-1">Last Contact</p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(account.lastContact).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-3 mb-4 text-xs">
                <div className="flex items-center space-x-1 text-foreground/60">
                  <Globe className="h-3 w-3" />
                  <span>{account.website}</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/10">
                <div className="text-center">
                  <p className="text-lg font-semibold text-[#FF5A09]">{account.opportunities}</p>
                  <p className="text-xs text-foreground/60">Open Opps</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-emerald-400">{account.wonDeals}</p>
                  <p className="text-xs text-foreground/60">Won Deals</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-red-400">{account.openCases}</p>
                  <p className="text-xs text-foreground/60">Open Cases</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/10">
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-foreground/40 hover:text-[#FF5A09] transition-colors">
                    <Mail className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-foreground/40 hover:text-[#FF5A09] transition-colors">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-foreground/40 hover:text-[#FF5A09] transition-colors">
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
                <button className="flex items-center space-x-1 text-[#FF5A09] hover:text-[#ec7f37] transition-colors">
                  <span className="text-sm">View Details</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAccounts.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No accounts found</h3>
          <p className="text-foreground/60">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
