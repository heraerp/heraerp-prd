'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Progress } from '@/src/components/ui/progress'
import {
  ArrowLeft,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  Eye,
  FileCheck,
  ClipboardCheck,
  BarChart3,
  UserCheck,
  FileSignature,
  AlertTriangle,
  Shield,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Globe,
  Download,
  Upload,
  MessageSquare,
  Activity
} from 'lucide-react'

interface ClientDashboardProps {
  clientId: string
  onBack: () => void
}

interface ClientDetails {
  id: string
  name: string
  code: string
  organization_id: string
  gspu_client_id: string
  audit_firm: string
  type: string
  industry: string
  status: string
  risk_rating: string
  audit_year: string
  partner: string
  manager: string
  deadline: string
  completion: number
  phase: number
  contact: {
    email: string
    phone: string
    address: string
    website: string
  }
  financials: {
    revenue: number
    assets: number
    materiality: number
    fees: number
  }
}

export function ClientDashboard({ clientId, onBack }: ClientDashboardProps) {
  // Mock client data - in production, this would be fetched based on clientId
  const [client] = useState<ClientDetails>({
    id: clientId,
    name: 'XYZ Manufacturing Ltd',
    code: 'CLI-2025-001',
    organization_id: 'gspu_client_cli_2025_001_org', // Each GSPU client gets their own org
    gspu_client_id: 'CLI-2025-001', // Internal GSPU client reference
    audit_firm: 'GSPU_AUDIT_PARTNERS', // GSPU is the audit firm using HERA
    type: 'Private Company',
    industry: 'Manufacturing',
    status: 'fieldwork',
    risk_rating: 'moderate',
    audit_year: '2025',
    partner: 'John Smith',
    manager: 'Sarah Johnson',
    deadline: '2025-03-31',
    completion: 65,
    phase: 4,
    contact: {
      email: 'finance@xyzmanufacturing.com',
      phone: '+973 1234 5678',
      address: 'Building 123, Manama, Bahrain',
      website: 'www.xyzmanufacturing.com'
    },
    financials: {
      revenue: 2500000,
      assets: 5200000,
      materiality: 125000,
      fees: 45000
    }
  })

  const [documents] = useState([
    {
      id: 1,
      name: 'Commercial Registration',
      category: 'A.1',
      status: 'received',
      date: '2025-01-15'
    },
    { id: 2, name: 'Financial Statements', category: 'B.2', status: 'pending', date: null },
    {
      id: 3,
      name: 'Bank Confirmations',
      category: 'D.11',
      status: 'in_review',
      date: '2025-01-20'
    },
    { id: 4, name: 'VAT Filings', category: 'E.2', status: 'received', date: '2025-01-18' }
  ])

  const [workingPapers] = useState([
    { id: 1, section: 'Cash & Bank', progress: 90, reviewer: 'Sarah Johnson', status: 'completed' },
    {
      id: 2,
      section: 'Accounts Receivable',
      progress: 75,
      reviewer: 'David Wilson',
      status: 'in_progress'
    },
    { id: 3, section: 'Inventory', progress: 45, reviewer: 'Emily Davis', status: 'in_progress' },
    { id: 4, section: 'Fixed Assets', progress: 0, reviewer: 'Not Assigned', status: 'planned' }
  ])

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
        return 'text-muted-foreground bg-muted border-border'
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
        return 'bg-muted text-gray-200'
      default:
        return 'bg-muted text-gray-200'
    }
  }

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800'
      case 'in_review':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-muted text-gray-200'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">{client.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline">{client.code}</Badge>
                <Badge className={getRiskColor(client.risk_rating)}>
                  {client.risk_rating} risk
                </Badge>
                <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>
                  <strong>Organization ID:</strong> {client.organization_id}
                </span>
                <span>
                  <strong>Audit Firm:</strong> {client.audit_firm}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Message Client
          </Button>
          <Button className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold text-gray-100">{client.completion}%</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <Progress value={client.completion} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Days to Deadline</p>
                <p className="text-2xl font-bold text-orange-600">58</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Materiality</p>
                <p className="text-2xl font-bold text-green-600">
                  ${client.financials.materiality / 1000}K
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Audit Fees</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${client.financials.fees / 1000}K
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Info */}
        <div className="space-y-6">
          {/* Client Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Industry</p>
                <p className="font-medium">{client.industry}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Annual Revenue</p>
                <p className="font-medium">${client.financials.revenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="font-medium">${client.financials.assets.toLocaleString()}</p>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">HERA Organization ID</p>
                <p className="font-mono text-xs bg-muted p-2 rounded">
                  {client.organization_id}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Each GSPU audit client has isolated data via unique organization ID
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">GSPU Client ID</p>
                <p className="font-medium">{client.gspu_client_id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{client.contact.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{client.contact.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{client.contact.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{client.contact.website}</span>
              </div>
            </CardContent>
          </Card>

          {/* Team Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Audit Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Engagement Partner</p>
                <p className="font-medium">{client.partner}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Audit Manager</p>
                <p className="font-medium">{client.manager}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Completion</p>
                <p className="font-medium">{new Date(client.deadline).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="documents" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="workingpapers">Working Papers</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Document Status
                    </span>
                    <Button size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Request Documents
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                              {doc.category}
                            </Badge>
                            <span className="font-medium">{doc.name}</span>
                            <Badge className={getDocumentStatusColor(doc.status)}>
                              {doc.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {doc.date && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Received: {new Date(doc.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.status === 'received' && (
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          )}
                          {doc.status === 'pending' && (
                            <Button size="sm" variant="outline">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Follow Up
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Working Papers Tab */}
            <TabsContent value="workingpapers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5" />
                      Working Papers Progress
                    </span>
                    <Button size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Create Section
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workingPapers.map(wp => (
                      <div key={wp.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{wp.section}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{wp.status.replace('_', ' ')}</Badge>
                            <Button size="sm" variant="outline">
                              Open
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Progress</span>
                          <span className="text-sm font-bold">{wp.progress}%</span>
                        </div>
                        <Progress value={wp.progress} className="h-2 mb-2" />
                        <p className="text-sm text-muted-foreground">Reviewer: {wp.reviewer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Audit Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium">Engagement Accepted</p>
                        <p className="text-sm text-muted-foreground">January 15, 2025</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Independence confirmed, team assigned
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium">Planning Phase Complete</p>
                        <p className="text-sm text-muted-foreground">January 28, 2025</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Risk assessment, materiality set
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium">Fieldwork In Progress</p>
                        <p className="text-sm text-muted-foreground">February 1, 2025</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cash, AR testing complete. Inventory in progress
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 bg-gray-300 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-muted-foreground">Manager Review</p>
                        <p className="text-sm text-muted-foreground">March 15, 2025 (Planned)</p>
                        <p className="text-xs text-muted-foreground mt-1">Comprehensive file review</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-3 h-3 bg-gray-300 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-muted-foreground">Report Completion</p>
                        <p className="text-sm text-muted-foreground">March 31, 2025 (Target)</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Final report and client presentation
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
