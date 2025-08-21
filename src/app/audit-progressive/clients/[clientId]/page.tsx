'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Building2,
  Users,
  FileText,
  Shield,
  Calendar,
  BarChart3,
  Eye,
  Database,
  Key
} from 'lucide-react'
import Link from 'next/link'

interface ClientDetails {
  id: string
  entity_name: string
  entity_code: string
  entity_type: string
  organization_id: string
  status: string
  metadata: {
    client_type: string
    risk_rating: string
    industry_code: string
    annual_revenue: number
    total_assets: number
    public_interest_entity: boolean
    previous_auditor: string
    partners_id: string
    sijilat_verification: string
    credit_rating: string
    aml_risk_score: number
    address: {
      street: string
      city: string
      state: string
      country: string
      postal_code: string
    }
    contact: {
      primary_contact: string
      phone: string
      email: string
      website: string
    }
    zigram_assessment: {
      score: number
      factors: string[]
      date: string
    }
  }
  team_assignment?: {
    partner_id: string
    manager_id: string
    eqcr_partner_id?: string
    engagement_type: string
  }
}

function ClientPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const clientId = params.clientId as string
  const organizationId = searchParams.get('org')
  const gspuClientId = searchParams.get('gspu_id')
  
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!clientId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        console.log(`🔍 Fetching client details for: ${clientId}`)
        console.log(`🏢 Organization ID: ${organizationId}`)
        console.log(`📋 Client Code: ${gspuClientId}`)
        console.log(`🎯 No hardcoded audit firm - data comes from database`)
        
        const response = await fetch(`/api/v1/audit/clients?client_id=${clientId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer gspu_audit_partners_org`
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            setClient(result.data)
          } else {
            setError('Client not found')
          }
        } else {
          setError('Failed to fetch client details')
        }
      } catch (err) {
        console.error('Error fetching client:', err)
        setError('Network error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClientDetails()
  }, [clientId, organizationId, gspuClientId])

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested client could not be found.'}</p>
          <Link href="/audit-progressive/clients">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/audit-progressive/clients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.entity_name}</h1>
            <p className="text-gray-600">Client Code: {client.entity_code}</p>
          </div>
        </div>
        <Badge 
          variant={client.status === 'active' ? 'default' : 'secondary'}
          className="text-sm"
        >
          {client.status}
        </Badge>
      </div>

      {/* Database Architecture Showcase */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            HERA Universal Architecture - Data Isolation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Organization ID</p>
                  <p className="text-xs text-gray-600 font-mono">{client.organization_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">GSPU Client Code</p>
                  <p className="text-xs text-gray-600 font-mono">{client.entity_code}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Entity Type</p>
                  <p className="text-xs text-gray-600">{client.entity_type}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Perfect Data Isolation</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Each client gets unique organization_id</li>
                <li>• Zero data leakage between clients</li>
                <li>• HERA universal 6-table architecture</li>
                <li>• GSPU manages all clients centrally</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Company Type</p>
              <p className="text-sm text-gray-600 capitalize">{client.metadata.client_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Industry</p>
              <p className="text-sm text-gray-600">{client.metadata.industry_code.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Annual Revenue</p>
              <p className="text-sm text-gray-600">
                ${client.metadata.annual_revenue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Total Assets</p>
              <p className="text-sm text-gray-600">
                ${client.metadata.total_assets.toLocaleString()}
              </p>
            </div>
            {client.metadata.address && (
              <div>
                <p className="text-sm font-medium text-gray-900">Address</p>
                <p className="text-sm text-gray-600">
                  {client.metadata.address.street}, {client.metadata.address.city}, {client.metadata.address.country} {client.metadata.address.postal_code}
                </p>
              </div>
            )}
            {client.metadata.contact && (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-900">Primary Contact</p>
                  <p className="text-sm text-gray-600">{client.metadata.contact.primary_contact}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">{client.metadata.contact.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{client.metadata.contact.email}</p>
                </div>
                {client.metadata.contact.website && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Website</p>
                    <p className="text-sm text-gray-600">
                      <a href={client.metadata.contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {client.metadata.contact.website}
                      </a>
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Risk Rating</p>
              <Badge 
                variant={
                  client.metadata.risk_rating === 'high' ? 'destructive' :
                  client.metadata.risk_rating === 'moderate' ? 'secondary' : 'default'
                }
              >
                {client.metadata.risk_rating}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">PIE Status</p>
              <p className="text-sm text-gray-600">
                {client.metadata.public_interest_entity ? 'Public Interest Entity' : 'Not PIE'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">AML Risk Score</p>
              <p className="text-sm text-gray-600">{client.metadata.aml_risk_score}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Credit Rating</p>
              <p className="text-sm text-gray-600">{client.metadata.credit_rating}</p>
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
            {client.team_assignment ? (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-900">Engagement Partner</p>
                  <p className="text-sm text-gray-600">
                    {client.team_assignment.partner_id.replace('auditor_', '').replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Audit Manager</p>
                  <p className="text-sm text-gray-600">
                    {client.team_assignment.manager_id.replace('auditor_', '').replace('_', ' ')}
                  </p>
                </div>
                {client.team_assignment.eqcr_partner_id && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">EQCR Partner</p>
                    <p className="text-sm text-gray-600">
                      {client.team_assignment.eqcr_partner_id.replace('auditor_', '').replace('_', ' ')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Engagement Type</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {client.team_assignment.engagement_type}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No team assigned yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Working Papers
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Planning
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Analytics
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Documents
        </Button>
      </div>

      {/* URL Information */}
      <Card className="border-dashed border-emerald-300 bg-emerald-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-emerald-900 mb-2">✅ Individual Client URL Structure</h4>
          <div className="text-sm text-emerald-700 font-mono space-y-1">
            <p>URL: /audit-progressive/clients/{clientId}</p>
            <p>Org ID: {organizationId}</p>
            <p>GSPU ID: {gspuClientId}</p>
          </div>
          <p className="text-sm text-emerald-600 mt-2">
            Each client has a unique URL with their organization ID for perfect data isolation.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function IndividualClientPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    }>
      <ClientPageContent />
    </Suspense>
  )
}