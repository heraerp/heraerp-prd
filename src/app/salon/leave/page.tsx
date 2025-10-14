'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Calendar,
  Users,
  FileText,
  Settings,
  Plus,
  Search,
  Download,
  ChevronLeft,
  User
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useLeavePlaybook } from '@/hooks/useLeavePlaybook'

// Components
import { LeaveRequestList } from '@/components/salon/leave/LeaveRequestList'
import { LeaveRequestModal } from '@/components/salon/leave/LeaveRequestModal'
import { LeaveCalendar } from '@/components/salon/leave/LeaveCalendar'
import { AnnualLeaveReport } from '@/components/salon/leave/AnnualLeaveReport'
import { PolicyModal } from '@/components/salon/leave/PolicyModal'

import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

// Design tokens (map to SALON_LUXE_COLORS for consistency)
const COLORS = {
  black: SALON_LUXE_COLORS.charcoal.dark,
  charcoal: SALON_LUXE_COLORS.charcoal.base,
  gold: SALON_LUXE_COLORS.gold.base,
  goldDark: SALON_LUXE_COLORS.gold.dark,
  champagne: SALON_LUXE_COLORS.champagne.base,
  espresso: '#3E2723',
  bronze: '#8C7853',
  emerald: SALON_LUXE_COLORS.emerald.base,
  plum: SALON_LUXE_COLORS.plum.base,
  rose: SALON_LUXE_COLORS.rose.base,
  lightText: SALON_LUXE_COLORS.text.primary
}

const SoftCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -3
    const rotateY = ((x - centerX) / centerX) * 3
    cardRef.current.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.005)`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)'
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`p-4 md:p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.35)] group relative overflow-hidden ${className}`}
      style={{
        backgroundColor: COLORS.charcoal,
        border: `1px solid ${COLORS.black}`,
        transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
        willChange: 'transform'
      }}
    >
      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${COLORS.gold}15 0%, transparent 60%)`,
          transition: 'opacity 0.5s ease'
        }}
      />

      {/* Soft edge glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none rounded-2xl"
        style={{
          boxShadow: `inset 0 0 40px ${COLORS.gold}20, 0 0 60px ${COLORS.gold}10`,
          transition: 'opacity 0.5s ease'
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default function LeaveManagementPage() {
  const { organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [localOrgId, setLocalOrgId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('requests')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>()
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [policyModalOpen, setPolicyModalOpen] = useState(false)

  // Get branches from secured salon context
  const { availableBranches, isLoadingBranches } = useSecuredSalonContext()

  // Get organization ID from localStorage for demo mode
  useEffect(() => {
    const storedOrgId = localStorage.getItem('organizationId')
    if (storedOrgId) {
      setLocalOrgId(storedOrgId)
    }
  }, [])

  const {
    requests,
    balancesByStaff,
    policies,
    holidays,
    staff,
    loading,
    error,
    createLeave,
    approve,
    reject,
    exportAnnualReportCSV
  } = useLeavePlaybook({
    branchId: selectedBranch,
    query: searchQuery
  })

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as any).tagName)) {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      }
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setRequestModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Check for Hair Talkz subdomain
  const getEffectiveOrgId = () => {
    if (organization?.id) return organization.id
    if (localOrgId) return localOrgId

    // Check if we're on hairtalkz or heratalkz subdomain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (
        hostname.startsWith('hairtalkz.') ||
        hostname === 'hairtalkz.localhost' ||
        hostname.startsWith('heratalkz.') ||
        hostname === 'heratalkz.localhost'
      ) {
        return '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hair Talkz org ID
      }
    }

    return organization?.id || localOrgId
  }

  // Get effective organization ID
  const effectiveOrgId = getEffectiveOrgId()

  // Three-layer authorization pattern (adapted for demo mode)
  // Layer 1: Authentication check (skip for demo mode)
  if (!isAuthenticated && !localOrgId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access leave management.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Layer 2: Context loading check
  if (contextLoading && !localOrgId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
      </div>
    )
  }

  // Layer 3: Organization check
  if (!effectiveOrgId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No organization context found.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isAdmin = true // TODO: Check actual role

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: COLORS.black,
        backgroundImage: `linear-gradient(135deg, ${COLORS.black} 0%, ${COLORS.charcoal} 100%)`,
        color: COLORS.lightText
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-30 border-b ml-20 backdrop-blur-lg"
        style={{
          backgroundColor: COLORS.charcoal + 'F0',
          borderColor: COLORS.black,
          boxShadow: `0 4px 20px ${COLORS.black}60`
        }}
      >
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center relative group"
                style={{
                  backgroundColor: COLORS.charcoal,
                  boxShadow: `inset 0 0 0 1px ${COLORS.gold}30, 0 0 20px ${COLORS.gold}10`,
                  transition: 'all 0.3s ease'
                }}
              >
                <Calendar size={18} color={COLORS.gold} />
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle at center, ${COLORS.gold}20 0%, transparent 70%)`,
                    transition: 'opacity 0.3s ease'
                  }}
                />
              </div>
              <div>
                <div
                  className="text-xs uppercase tracking-wider transition-colors duration-300"
                  style={{ color: COLORS.bronze }}
                >
                  HERA • HR Management
                </div>
                <div
                  className="text-lg font-semibold transition-colors duration-300"
                  style={{ color: COLORS.champagne }}
                >
                  Leave Management
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Back to Staff */}
              <Button
                onClick={() => (window.location.href = '/salon/staff')}
                variant="outline"
                className="border text-sm px-3 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne,
                  backgroundColor: 'transparent'
                }}
              >
                <ChevronLeft size={14} className="mr-1" />
                <User size={14} className="mr-1" />
                <span className="hidden sm:inline">Back to Staff</span>
                <span className="sm:hidden">Staff</span>
              </Button>

              {/* Branch Selector */}
              <select
                className="px-3 py-1.5 rounded-lg border text-sm transition-all duration-300 hover:shadow-lg"
                style={{
                  borderColor: COLORS.bronze,
                  color: COLORS.champagne,
                  backgroundColor: COLORS.charcoal,
                  cursor: 'pointer'
                }}
                value={selectedBranch || ''}
                onChange={e => setSelectedBranch(e.target.value || undefined)}
                disabled={isLoadingBranches}
              >
                <option value="">All Branches</option>
                {availableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.entity_name}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative group">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                  color={COLORS.bronze}
                />
                <Input
                  id="search-input"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-48 lg:w-64 border transition-all duration-300 hover:shadow-lg"
                  style={{
                    borderColor: COLORS.bronze,
                    color: COLORS.champagne,
                    backgroundColor: COLORS.charcoal
                  }}
                />
              </div>

              {/* Actions */}
              <Button
                onClick={() => setRequestModalOpen(true)}
                className="border-0 font-semibold text-sm px-3 py-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black,
                  boxShadow: `0 4px 15px ${COLORS.gold}40`
                }}
              >
                <Plus size={14} className="mr-1" />
                <span className="hidden sm:inline">New Request</span>
                <span className="sm:hidden">New</span>
              </Button>

              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => setPolicyModalOpen(true)}
                  className="border text-sm px-3 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  style={{
                    borderColor: COLORS.bronze,
                    color: COLORS.champagne,
                    backgroundColor: 'transparent'
                  }}
                >
                  <Settings size={14} className="mr-1" />
                  <span className="hidden sm:inline">Policies</span>
                  <span className="sm:hidden">Settings</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 py-6 ml-20">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className="bg-transparent p-1 rounded-full border mb-6"
            style={{ borderColor: COLORS.bronze, boxShadow: `0 4px 20px ${COLORS.black}80` }}
          >
            <TabsTrigger
              value="requests"
              className="rounded-full data-[state=active]:text-black transition-all duration-300 hover:scale-105"
            >
              <span
                className="px-3 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300"
                style={{
                  background:
                    activeTab === 'requests'
                      ? `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                      : 'transparent',
                  color: activeTab === 'requests' ? COLORS.black : COLORS.champagne,
                  boxShadow:
                    activeTab === 'requests' ? `0 4px 15px ${COLORS.gold}40` : 'none'
                }}
              >
                <FileText size={16} />
                Requests
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="rounded-full data-[state=active]:text-black transition-all duration-300 hover:scale-105"
            >
              <span
                className="px-3 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300"
                style={{
                  background:
                    activeTab === 'calendar'
                      ? `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                      : 'transparent',
                  color: activeTab === 'calendar' ? COLORS.black : COLORS.champagne,
                  boxShadow:
                    activeTab === 'calendar' ? `0 4px 15px ${COLORS.gold}40` : 'none'
                }}
              >
                <Calendar size={16} />
                Calendar
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="report"
              className="rounded-full data-[state=active]:text-black transition-all duration-300 hover:scale-105"
            >
              <span
                className="px-3 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300"
                style={{
                  background:
                    activeTab === 'report'
                      ? `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                      : 'transparent',
                  color: activeTab === 'report' ? COLORS.black : COLORS.champagne,
                  boxShadow:
                    activeTab === 'report' ? `0 4px 15px ${COLORS.gold}40` : 'none'
                }}
              >
                <FileText size={16} />
                Report
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="policies"
              className="rounded-full data-[state=active]:text-black transition-all duration-300 hover:scale-105"
            >
              <span
                className="px-3 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300"
                style={{
                  background:
                    activeTab === 'policies'
                      ? `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                      : 'transparent',
                  color: activeTab === 'policies' ? COLORS.black : COLORS.champagne,
                  boxShadow:
                    activeTab === 'policies' ? `0 4px 15px ${COLORS.gold}40` : 'none'
                }}
              >
                <Settings size={16} />
                Policies
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Tabs Content */}
          <TabsContent value="requests">
            <LeaveRequestList
              requests={requests}
              staff={staff}
              onApprove={approve}
              onReject={reject}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <LeaveCalendar
              requests={requests.filter(r => r.current_status === 'APPROVED')}
              staff={staff}
              branchId={selectedBranch}
            />
          </TabsContent>

          <TabsContent value="report">
            <AnnualLeaveReport
              staff={staff}
              balances={balancesByStaff}
              branchId={selectedBranch}
              onExport={() =>
                exportAnnualReportCSV({ year: new Date().getFullYear(), branchId: selectedBranch })
              }
            />
          </TabsContent>

          <TabsContent value="policies">
            <SoftCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
                  Leave Policies
                </h3>
                {isAdmin && (
                  <Button
                    onClick={() => setPolicyModalOpen(true)}
                    size="sm"
                    className="border-0"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                      color: COLORS.black
                    }}
                  >
                    <Plus size={16} className="mr-2" />
                    Add Policy
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {policies.map(policy => (
                  <div
                    key={policy.id}
                    className="p-4 rounded-xl border"
                    style={{ backgroundColor: '#141414', borderColor: COLORS.black }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium" style={{ color: COLORS.champagne }}>
                          {policy.entity_name}
                        </h4>
                        <p className="text-sm opacity-70 mt-1">
                          {policy.metadata?.annual_entitlement} days • Carry-over:{' '}
                          {policy.metadata?.carry_over_cap} days • Notice:{' '}
                          {policy.metadata?.min_notice_days} days
                        </p>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPolicyModalOpen(true)}
                          style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SoftCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {requestModalOpen && (
        <LeaveRequestModal
          open={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          onSubmit={createLeave}
          staff={staff}
          policies={policies}
          holidays={holidays}
        />
      )}

      {policyModalOpen && (
        <PolicyModal
          open={policyModalOpen}
          onClose={() => setPolicyModalOpen(false)}
          policy={null} // TODO: Pass policy for editing
        />
      )}
    </div>
  )
}
