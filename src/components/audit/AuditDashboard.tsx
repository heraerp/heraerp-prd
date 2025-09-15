'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HERAFooter } from '@/components/ui/HERAFooter'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Briefcase,
  TrendingUp,
  Shield,
  Calendar,
  Eye,
  FileCheck,
  ClipboardCheck,
  BarChart3,
  UserCheck,
  FileSignature,
  AlertTriangle,
  ChevronRight,
  Building,
  Sparkles,
  Circle,
  LogOut
} from 'lucide-react'
import { GSPU_AUDIT_PHASES, type AuditClient, type AuditPhase } from '@/types/audit.types'
import { NewEngagementModal } from './NewEngagementModal'
import { ClientDashboard } from './ClientDashboard'

interface ClientSummary {
  id: string
  name: string
  organization_id: string
  gspu_client_id: string
  audit_firm: string
  type: string
  risk_rating: string
  audit_year: string
  status: string
  phase: number
  completion: number
  partner: string
  manager: string
  deadline: string
}

interface DashboardStats {
  total_clients: number
  active_engagements: number
  documents_pending: number
  reviews_pending: number
  high_risk_clients: number
  upcoming_deadlines: number
}

interface AuditFirm {
  id: string
  organization_id: string
  entity_code: string
  entity_name: string
  metadata: {
    firm_type: string
    license_number: string
    registration_country: string
    partner_count: number
    staff_count: number
    office_locations: string[]
    specializations: string[]
  }
}

interface AuditDashboardProps {
  user?: {
    email: string
    name: string
    role: string
    firm: string
    organization_id: string
  }
}

export function AuditDashboard({ user }: AuditDashboardProps = {}) {
  const router = useRouter()
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'dashboard' | 'client'>('dashboard')
  const [isNavigating, setIsNavigating] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    total_clients: 12,
    active_engagements: 8,
    documents_pending: 47,
    reviews_pending: 15,
    high_risk_clients: 3,
    upcoming_deadlines: 5
  })

  // All useState hooks must come before any conditional logic
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [auditFirm, setAuditFirm] = useState<AuditFirm | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFirmLoading, setIsFirmLoading] = useState(true)

  // Fetch audit firm data dynamically (no hardcoding)
  useEffect(() => {
    const fetchAuditFirm = async () => {
      try {
        setIsFirmLoading(true)

        // Get current audit firm from database (not hardcoded)
        const response = await fetch('/api/v1/audit/firm?action=current', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.organization_id || 'unknown'}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setAuditFirm(result.data)
            console.log(
              `✅ Audit Firm loaded from database: ${result.data.entity_name} (${result.data.entity_code})`
            )
            console.log(`Organization ID: ${result.data.organization_id}`)
          }
        } else {
          console.warn('Failed to fetch audit firm, using fallback')
          // Fallback firm data (last resort)
          setAuditFirm({
            id: 'firm_fallback',
            organization_id: 'unknown_audit_firm_org',
            entity_code: 'UNKNOWN',
            entity_name: 'Unknown Audit Firm',
            metadata: {
              firm_type: 'unknown',
              license_number: 'N/A',
              registration_country: 'Unknown',
              partner_count: 0,
              staff_count: 0,
              office_locations: [],
              specializations: []
            }
          })
        }
      } catch (error) {
        console.error('Error fetching audit firm:', error)
        setAuditFirm(null)
      } finally {
        setIsFirmLoading(false)
      }
    }

    fetchAuditFirm()
  }, [user?.organization_id])

  // Fetch audit clients from database
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true)

        // Fetch clients from HERA database API
        const response = await fetch('/api/v1/audit/clients', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.organization_id || 'gspu_audit_partners_org'}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data.clients) {
            // Transform HERA data to dashboard format (using dynamic audit firm)
            const transformedClients: ClientSummary[] = result.data.clients.map((client: any) => ({
              id: client.id,
              name: client.entity_name,
              organization_id: client.organization_id,
              gspu_client_id: client.entity_code,
              audit_firm: auditFirm?.entity_name || 'Unknown Audit Firm',
              type: client.metadata.client_type === 'public' ? 'Public Company' : 'Private Company',
              risk_rating: client.metadata.risk_rating,
              audit_year: '2025',
              status: client.status === 'active' ? 'fieldwork' : 'planning',
              phase: client.metadata.risk_rating === 'high' ? 2 : 4,
              completion: client.metadata.risk_rating === 'high' ? 30 : 65,
              partner:
                client.team_assignment?.partner_id === 'auditor_john_smith'
                  ? 'John Smith'
                  : 'Michael Brown',
              manager:
                client.team_assignment?.manager_id === 'auditor_sarah_johnson'
                  ? 'Sarah Johnson'
                  : 'Emily Davis',
              deadline: client.metadata.risk_rating === 'high' ? '2025-04-15' : '2025-03-31'
            }))

            setClients(transformedClients)

            // Update stats based on real data
            setStats({
              total_clients: transformedClients.length,
              active_engagements: transformedClients.filter(c => c.status === 'fieldwork').length,
              documents_pending: 47, // Keep static for demo
              reviews_pending: 15,
              high_risk_clients: transformedClients.filter(c => c.risk_rating === 'high').length,
              upcoming_deadlines: 5
            })
          }
        } else {
          console.warn('Failed to fetch clients, using fallback data')
          // Fallback to mock data if API fails
          setClients([
            {
              id: 'client_001',
              name: 'XYZ Manufacturing Ltd',
              organization_id: 'gspu_client_cli_2025_001_org',
              gspu_client_id: 'CLI-2025-001',
              audit_firm: auditFirm?.entity_name || 'Unknown Audit Firm',
              type: 'Private Company',
              risk_rating: 'moderate',
              audit_year: '2025',
              status: 'fieldwork',
              phase: 4,
              completion: 65,
              partner: 'John Smith',
              manager: 'Sarah Johnson',
              deadline: '2025-03-31'
            }
          ])
        }
      } catch (error) {
        console.error('Error fetching audit clients:', error)
        // Use fallback data on error
        setClients([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [user?.organization_id, auditFirm?.entity_name])

  const handleEngagementCreated = (engagement: any) => {
    // Update stats when new engagement is created
    setStats(prev => ({
      ...prev,
      total_clients: prev.total_clients + 1,
      active_engagements: prev.active_engagements + 1
    }))

    // Add new client to the list
    const newClient: ClientSummary = {
      id: engagement.id,
      name: engagement.client_name,
      organization_id:
        engagement.organization_id ||
        `gspu_client_${engagement.client_code?.toLowerCase().replace(/[^a-z0-9]/g, '_')}_org`,
      gspu_client_id: engagement.client_code || engagement.id,
      audit_firm: engagement.audit_firm || 'GSPU_AUDIT_PARTNERS',
      type:
        engagement.client_type === 'private'
          ? 'Private Company'
          : engagement.client_type === 'public'
            ? 'Public Company'
            : engagement.client_type === 'non_profit'
              ? 'Non-Profit Organization'
              : 'Government Entity',
      risk_rating: engagement.risk_rating,
      audit_year: engagement.audit_year,
      status: 'planning',
      phase: 1,
      completion: 10,
      partner: engagement.engagement_partner
        .replace('_', ' ')
        .replace(/\b\w/g, l => l.toUpperCase()),
      manager: engagement.audit_manager.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      deadline: engagement.target_completion_date || '2025-12-31'
    }

    setClients(prev => [newClient, ...prev])
  }

  const handleClientClick = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (client) {
      // Navigate to individual client page with organization ID
      const clientUrl = `/audit/clients/${clientId}?org=${client.organization_id}&gspu_id=${client.gspu_client_id}`
      console.log(`Navigating to client: ${client.name} (${client.gspu_client_id})`)
      console.log(`Organization ID: ${client.organization_id}`)
      console.log(`URL: ${clientUrl}`)

      // For now, show in same component, but URL structure is ready for routing
      setSelectedClient(clientId)
      setViewMode('client')

      // Update URL without navigation (for demonstration)
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', clientUrl)
      }
    }
  }

  const handleBackToDashboard = () => {
    setSelectedClient(null)
    setViewMode('dashboard')
  }

  // Show client dashboard if a client is selected
  if (viewMode === 'client' && selectedClient) {
    return <ClientDashboard clientId={selectedClient} onBack={handleBackToDashboard} />
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'very_high':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPhaseIcon = (phase: number) => {
    switch (phase) {
      case 1:
        return <UserCheck className="w-4 h-4" />
      case 2:
        return <ClipboardCheck className="w-4 h-4" />
      case 3:
        return <Shield className="w-4 h-4" />
      case 4:
        return <FileCheck className="w-4 h-4" />
      case 5:
        return <FileText className="w-4 h-4" />
      case 6:
        return <Eye className="w-4 h-4" />
      case 7:
        return <CheckCircle2 className="w-4 h-4" />
      case 8:
        return <FileSignature className="w-4 h-4" />
      case 9:
        return <BarChart3 className="w-4 h-4" />
      default:
        return <Circle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800'
      case 'fieldwork':
        return 'bg-purple-100 text-purple-800'
      case 'review':
        return 'bg-orange-100 text-orange-800'
      case 'reporting':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Audit Dashboard</h1>
            {isFirmLoading ? (
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            ) : auditFirm ? (
              <Badge variant="outline" className="text-sm">
                {auditFirm.entity_name} ({auditFirm.entity_code})
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-sm">
                No Firm Data
              </Badge>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            Friday, February 2, 2025 • 5 items need your attention
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, {user.name} ({user.role})
              {auditFirm && (
                <span className="text-emerald-600 ml-2">
                  • {auditFirm.metadata.registration_country} Licensed
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-red-100 text-red-800 px-3 py-1">
            <AlertTriangle className="w-3 h-3 mr-1" />2 Urgent
          </Badge>
          <Button
            variant="outline"
            onClick={() => router.push('/audit/engagements')}
            className="border-black text-black hover:bg-black hover:text-white"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Engagements
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/audit/workpapers')}
            className="border-black text-black hover:bg-black hover:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Working Papers
          </Button>
          <NewEngagementModal onEngagementCreated={handleEngagementCreated}>
            <Button className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700">
              <Briefcase className="w-4 h-4 mr-2" />
              New Client
            </Button>
          </NewEngagementModal>
        </div>
      </div>

      {/* Today's Priorities */}
      <Card className="border-l-4 border-l-red-500 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Action Required Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">
                    ABC Trading - Bank confirmations overdue
                  </p>
                  <p className="text-sm text-gray-600">Due 3 days ago • Partner: Michael Brown</p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  // Navigate to ABC Trading client dashboard
                  const abcClient = clients.find(c => c.name === 'ABC Trading Co')
                  if (abcClient) {
                    setSelectedClient(abcClient.id)
                    setViewMode('client')
                  } else {
                    alert('Client dashboard for ABC Trading Co is being loaded...')
                  }
                }}
              >
                Open File
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">
                    Tech Solutions - Partner review needed
                  </p>
                  <p className="text-sm text-gray-600">Waiting 2 days • Manager: David Wilson</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Navigate to Tech Solutions client dashboard
                  const techClient = clients.find(c => c.name === 'Tech Solutions Inc')
                  if (techClient) {
                    setSelectedClient(techClient.id)
                    setViewMode('client')
                  } else {
                    alert('Client dashboard for Tech Solutions Inc is being loaded...')
                  }
                }}
              >
                Review Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-gray-900">5</div>
          <div className="text-sm text-gray-600">Due This Week</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-blue-600">12</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-600">3</div>
          <div className="text-sm text-gray-600">Ready to Sign</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-orange-600">7</div>
          <div className="text-sm text-gray-600">Awaiting Docs</div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients">My Clients</TabsTrigger>
          <TabsTrigger value="team">Team Status</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
        </TabsList>

        {/* My Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4">
              {/* Loading skeletons */}
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-48"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {clients.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="space-y-3">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900">No audit clients found</h3>
                    <p className="text-gray-600">Start by creating a new engagement</p>
                  </div>
                </Card>
              ) : (
                clients.map(client => (
                  <Card
                    key={client.id}
                    className={`cursor-pointer hover:shadow-lg transition-all ${
                      client.status === 'review'
                        ? 'border-l-4 border-l-orange-500'
                        : client.deadline < '2025-02-15'
                          ? 'border-l-4 border-l-red-500'
                          : ''
                    }`}
                    onClick={() => handleClientClick(client.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                            <Badge className={getRiskColor(client.risk_rating)}>
                              {client.risk_rating}
                            </Badge>
                            {client.deadline < '2025-02-15' && (
                              <Badge className="bg-red-100 text-red-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Due Soon
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Partner:</span> {client.partner}
                            </div>
                            <div>
                              <span className="font-medium">Deadline:</span>{' '}
                              {new Date(client.deadline).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">Progress:</span> {client.completion}%
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600 font-mono">
                            <span className="font-medium">Org ID:</span> {client.organization_id}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={e => {
                              e.stopPropagation()
                              // Handle working papers
                            }}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Working Papers
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={e => {
                              e.stopPropagation()
                              // Handle client portal
                            }}
                          >
                            <Users className="w-3 h-3 mr-1" />
                            Client Portal
                          </Button>
                          <Button
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              handleClientClick(client.id)
                            }}
                          >
                            Open Audit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Team Status Tab */}
        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* My Team */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  My Team Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">SJ</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Sarah Johnson</p>
                        <p className="text-sm text-gray-600">Manager • XYZ Manufacturing</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Available</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600">ED</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Emily Davis</p>
                        <p className="text-sm text-gray-600">Manager • ABC Trading</p>
                      </div>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">Busy</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-600">DW</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">David Wilson</p>
                        <p className="text-sm text-gray-600">Manager • Tech Solutions</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">In Review</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Pending */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Reviews Waiting for Me
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium text-gray-900">Tech Solutions - Revenue Testing</p>
                    <p className="text-sm text-gray-600">Submitted by David Wilson • 2 days ago</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="sm">Review</Button>
                      <Button size="sm" variant="outline">
                        Request Changes
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <p className="font-medium text-gray-900">XYZ Manufacturing - Inventory Count</p>
                    <p className="text-sm text-gray-600">Submitted by Sarah Johnson • 1 day ago</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="sm">Review</Button>
                      <Button size="sm" variant="outline">
                        Request Changes
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deadlines Tab */}
        <TabsContent value="deadlines" className="space-y-4">
          <div className="grid gap-4">
            {/* This Week */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-red-900 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Due This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Tech Solutions Inc - Final Report</p>
                      <p className="text-sm text-red-600">Due: February 28, 2025 (4 days)</p>
                    </div>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      Priority
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">ABC Trading - Fieldwork Complete</p>
                      <p className="text-sm text-orange-600">Due: March 1, 2025 (5 days)</p>
                    </div>
                    <Button size="sm" variant="outline">
                      On Track
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Two Weeks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Coming Up (Next 2 Weeks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        XYZ Manufacturing - Planning Complete
                      </p>
                      <p className="text-sm text-gray-600">Due: March 15, 2025</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Scheduled
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Healthcare Corp - Risk Assessment</p>
                      <p className="text-sm text-gray-600">Due: March 20, 2025</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Scheduled
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* HERA Footer - Network Effect */}
      <HERAFooter className="mt-12 pb-4" />
    </div>
  )
}
