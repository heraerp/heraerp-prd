'use client'

import React, { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Users, FileText, Settings, Plus, Search, Download } from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useLeavePlaybook } from '@/hooks/useLeavePlaybook'

// Components
import { LeaveRequestList } from '@/components/salon/leave/LeaveRequestList'
import { LeaveRequestModal } from '@/components/salon/leave/LeaveRequestModal'
import { LeaveCalendar } from '@/components/salon/leave/LeaveCalendar'
import { AnnualLeaveReport } from '@/components/salon/leave/AnnualLeaveReport'
import { PolicyModal } from '@/components/salon/leave/PolicyModal'

// Design tokens (reuse from dashboard)
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  espresso: '#3E2723',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#5A2A40',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
}

const SoftCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`p-4 md:p-6 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.35)] ${className}`}
    style={{ backgroundColor: COLORS.charcoal, border: `1px solid ${COLORS.black}` }}
  >
    {children}
  </div>
)

export default function LeaveManagementPage() {
  const { organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [activeTab, setActiveTab] = useState('requests')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBranch, setSelectedBranch] = useState<string>()
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [policyModalOpen, setPolicyModalOpen] = useState(false)

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
    exportAnnualReportCSV,
  } = useLeavePlaybook({
    branchId: selectedBranch,
    query: searchQuery,
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

  // Auth checks
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access leave management.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
      </div>
    )
  }

  if (!organization) {
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
      <div className="sticky top-0 z-20 border-b" style={{ backgroundColor: COLORS.charcoal, borderColor: COLORS.black }}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.charcoal, boxShadow: 'inset 0 0 0 1px #000' }}>
                <Calendar size={18} color={COLORS.gold} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider" style={{ color: COLORS.bronze }}>
                  HERA • HR Management
                </div>
                <div className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
                  Leave Management
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Branch Selector */}
              <select 
                className="px-3 py-1.5 rounded-lg bg-transparent border text-sm"
                style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                value={selectedBranch || ''}
                onChange={(e) => setSelectedBranch(e.target.value || undefined)}
              >
                <option value="">All Branches</option>
                <option value="branch-1">Main Branch</option>
                <option value="branch-2">Downtown</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" color={COLORS.bronze} />
                <Input
                  id="search-input"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-transparent border"
                  style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                />
              </div>

              {/* Actions */}
              <Button
                onClick={() => setRequestModalOpen(true)}
                className="border-0 font-semibold"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black,
                }}
              >
                <Plus size={16} className="mr-2" />
                New Request
              </Button>

              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => setPolicyModalOpen(true)}
                  className="border"
                  style={{ borderColor: COLORS.bronze, color: COLORS.champagne }}
                >
                  <Settings size={16} className="mr-2" />
                  Policies
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent p-1 rounded-full border mb-6" style={{ borderColor: COLORS.bronze }}>
            <TabsTrigger value="requests" className="rounded-full data-[state=active]:text-black">
              <span className="px-3 py-1.5 rounded-full flex items-center gap-2" style={{ 
                background: activeTab === 'requests' ? `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)` : 'transparent',
                color: activeTab === 'requests' ? COLORS.black : COLORS.champagne
              }}>
                <FileText size={16} />
                Requests
              </span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-full data-[state=active]:text-black">
              <span className="px-3 py-1.5 rounded-full flex items-center gap-2" style={{ 
                background: activeTab === 'calendar' ? `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)` : 'transparent',
                color: activeTab === 'calendar' ? COLORS.black : COLORS.champagne
              }}>
                <Calendar size={16} />
                Calendar
              </span>
            </TabsTrigger>
            <TabsTrigger value="report" className="rounded-full data-[state=active]:text-black">
              <span className="px-3 py-1.5 rounded-full flex items-center gap-2" style={{ 
                background: activeTab === 'report' ? `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)` : 'transparent',
                color: activeTab === 'report' ? COLORS.black : COLORS.champagne
              }}>
                <FileText size={16} />
                Report
              </span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="rounded-full data-[state=active]:text-black">
              <span className="px-3 py-1.5 rounded-full flex items-center gap-2" style={{ 
                background: activeTab === 'policies' ? `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)` : 'transparent',
                color: activeTab === 'policies' ? COLORS.black : COLORS.champagne
              }}>
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
              requests={requests.filter(r => r.status === 'approved')}
              staff={staff}
              branchId={selectedBranch}
            />
          </TabsContent>

          <TabsContent value="report">
            <AnnualLeaveReport
              staff={staff}
              balances={balancesByStaff}
              branchId={selectedBranch}
              onExport={() => exportAnnualReportCSV({ year: new Date().getFullYear(), branchId: selectedBranch })}
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
                      color: COLORS.black,
                    }}
                  >
                    <Plus size={16} className="mr-2" />
                    Add Policy
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {policies.map((policy) => (
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
                          {policy.metadata?.annual_entitlement} days • 
                          Carry-over: {policy.metadata?.carry_over_cap} days • 
                          Notice: {policy.metadata?.min_notice_days} days
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