'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, Building2, Target, CheckSquare, BarChart3, Settings, 
  Plus, Search, Filter, Mail, Phone, Calendar, DollarSign,
  User, Building, Star, Clock, TrendingUp, ArrowRight,
  UserPlus, Briefcase, AlertCircle, Trophy, Zap,
  RefreshCw, Database, CheckCircle, Loader2, AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { useProgressiveAuth } from "@/components/auth/ProgressiveAuthProvider"
import { useProductionCRM } from '@/hooks/use-production-crm'
import { CRMContact, CRMOpportunity, CRMTask } from '@/lib/crm/production-api'
import { EmailComposer } from '@/components/crm/EmailComposer'
import { EmailHistory } from '@/components/crm/EmailHistory'
import { DocumentManager } from '@/components/crm/DocumentManager'
import { DataImportExport } from '@/components/crm/DataImportExport'

/**
 * Production CRM Page
 * Replaces mock data with real HERA API integration
 * 
 * PROJECT MANAGER IMPLEMENTATION: Data Persistence Foundation
 */
export default function ProductionCRMPage() {
  const { isAuthenticated, isRegistered, workspace } = useProgressiveAuth()
  const {
    contacts,
    opportunities,
    tasks,
    analytics,
    isLoading,
    error,
    refreshAll,
    createContact,
    updateContact,
    deleteContact
  } = useProductionCRM()

  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null)
  const [showEmailComposer, setShowEmailComposer] = useState(false)
  const [showEmailHistory, setShowEmailHistory] = useState(false)
  const [showDocumentManager, setShowDocumentManager] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)

  // New contact form state
  const [newContact, setNewContact] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'lead' as const,
    industry: '',
    value: 0,
    assignedTo: '',
    source: '',
    notes: ''
  })

  // Loading and error states
  if (!isAuthenticated) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="w-96">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600 mb-4">Please log in to access the production CRM system.</p>
              <Button asChild>
                <Link href="/auth">Login to Continue</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </CRMLayout>
    )
  }

  if (isLoading && contacts.length === 0) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="w-96">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Loading CRM Data</h3>
              <p className="text-gray-600">Connecting to HERA API and loading your business data...</p>
            </CardContent>
          </Card>
        </div>
      </CRMLayout>
    )
  }

  if (error) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="w-96 border-red-200">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2 text-red-700">API Connection Error</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={refreshAll} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/crm-progressive/demo">View Demo Instead</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CRMLayout>
    )
  }

  // Handle create contact
  const handleCreateContact = async () => {
    try {
      await createContact(newContact)
      setShowCreateModal(false)
      setNewContact({
        name: '',
        company: '',
        email: '',
        phone: '',
        status: 'lead',
        industry: '',
        value: 0,
        assignedTo: '',
        source: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error creating contact:', error)
      // TODO: Show error toast
    }
  }

  // Handle email actions
  const handleSendEmail = (contact: CRMContact) => {
    setSelectedContact(contact)
    setShowEmailComposer(true)
  }

  const handleViewEmailHistory = (contact: CRMContact) => {
    setSelectedContact(contact)
    setShowEmailHistory(true)
  }

  const handleManageDocuments = (contact: CRMContact) => {
    setSelectedContact(contact)
    setShowDocumentManager(true)
  }

  const handleEmailSent = (messageId: string) => {
    console.log('Email sent with ID:', messageId)
    // Refresh contact data to update last contact date
    refreshAll()
  }

  const handleImportComplete = (result: any) => {
    console.log('Import completed:', result)
    // Refresh all data to show newly imported items
    refreshAll()
  }

  // Filter contacts based on search and filter
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = selectedFilter === 'all' || contact.status === selectedFilter
    
    return matchesSearch && matchesFilter
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-gray-100 text-gray-800'
      case 'prospect': return 'bg-blue-100 text-blue-800'
      case 'customer': return 'bg-green-100 text-green-800'
      case 'champion': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header with Production Status */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production CRM</h1>
            <p className="text-gray-600 mt-1">
              Real business data from HERA API • Organization: {organization?.organization_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-800 px-3 py-1">
              <Database className="h-3 w-3 mr-1" />
              Live Production Data
            </Badge>
            <Button onClick={refreshAll} disabled={isLoading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Real-time Analytics Dashboard */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Pipeline</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(analytics.totalPipelineValue)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    Real-time calculation
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">Weighted Pipeline</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {formatCurrency(analytics.weightedPipeline)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="mt-4 flex items-center">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mr-1" />
                  <span className="text-sm text-emerald-600 font-medium">
                    {analytics.conversionRate.toFixed(1)}% conversion rate
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Average Deal</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(analytics.averageDealSize)}
                    </p>
                  </div>
                  <Trophy className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-4 flex items-center">
                  <ArrowRight className="h-4 w-4 text-purple-600 mr-1" />
                  <span className="text-sm text-purple-600 font-medium">
                    {analytics.averageSalesCycle} day cycle
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600">Data Status</p>
                    <p className="text-2xl font-bold text-amber-900">{contacts.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-amber-600" />
                </div>
                <div className="mt-4 flex items-center">
                  <Zap className="h-4 w-4 text-amber-600 mr-1" />
                  <span className="text-sm text-amber-600 font-medium">
                    Live contacts
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main CRM Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities ({opportunities.length})</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stage Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Pipeline by Stage (Live Data)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.stageMetrics.length ? (
                    <div className="space-y-4">
                      {analytics.stageMetrics.map((stage, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">
                              {stage.stage}
                            </Badge>
                            <span className="font-medium">{stage.count} deals</span>
                          </div>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(stage.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No pipeline data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Industry Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Industry Breakdown (Live Data)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.industryBreakdown.length ? (
                    <div className="space-y-4">
                      {analytics.industryBreakdown.map((industry, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="font-medium">{industry.industry}</span>
                            <p className="text-sm text-gray-600">{industry.deals} active deals</p>
                          </div>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(industry.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No industry data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="prospect">Prospects</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="champion">Champions</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline"
                onClick={() => setShowImportExport(true)}
              >
                <Database className="h-4 w-4 mr-2" />
                Import/Export
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>

            {/* Contacts List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Production Contacts ({filteredContacts.length})
                  </span>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredContacts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>
                              {contact.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{contact.name}</h3>
                            <p className="text-sm text-gray-600">{contact.company}</p>
                            <p className="text-sm text-gray-500">{contact.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getStatusColor(contact.status)}>
                                {contact.status}
                              </Badge>
                              {contact.industry && (
                                <span className="text-xs text-gray-500">{contact.industry}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(contact.value)}</p>
                          {contact.probability && (
                            <p className="text-sm text-gray-600">{contact.probability}% probability</p>
                          )}
                          <div className="flex items-center gap-1 mt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSendEmail(contact)
                              }}
                              title="Send Email"
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewEmailHistory(contact)
                              }}
                              title="Email History"
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleManageDocuments(contact)
                              }}
                              title="Documents"
                            >
                              <Briefcase className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" title="Call Contact">
                              <Phone className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" title="Edit Contact">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || selectedFilter !== 'all' ? 
                        'No contacts match your search criteria.' :
                        'Start building your customer database by adding your first contact.'
                      }
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Contact
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Production Opportunities ({opportunities.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {opportunities.length > 0 ? (
                  <div className="space-y-4">
                    {opportunities.map((opportunity) => (
                      <div key={opportunity.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{opportunity.name}</h3>
                            <p className="text-gray-600 mb-2">{opportunity.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>Contact: {opportunity.contact}</span>
                              <span>Close: {opportunity.closeDate}</span>
                              <span>Owner: {opportunity.assignedTo}</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-xl">{formatCurrency(opportunity.value)}</p>
                            <Badge variant="outline">
                              {opportunity.stage}
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">{opportunity.probability}% probability</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No opportunities found</h3>
                    <p className="text-gray-600 mb-4">Start tracking your sales pipeline by creating your first opportunity.</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Opportunity
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Production Tasks ({tasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length > 0 ? (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={task.status === 'completed'}
                            onChange={() => {
                              // TODO: Update task status
                            }}
                            className="h-4 w-4"
                          />
                          <div>
                            <h4 className="font-semibold">{task.title}</h4>
                            <p className="text-sm text-gray-600">Due: {task.dueDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{task.priority}</Badge>
                          <Badge className={task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                    <p className="text-gray-600 mb-4">Stay organized by creating tasks and follow-ups.</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Production Status Footer */}
        <Card className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Database className="h-5 w-5" />
              <span className="font-semibold">Production CRM System Active</span>
            </div>
            <p className="text-emerald-100">
              Connected to HERA Universal API • Real-time data persistence • Multi-tenant secure
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Badge className="bg-white/20 text-white">
                Organization: {organization?.organization_name}
              </Badge>
              <Badge className="bg-white/20 text-white">
                Contacts: {contacts.length}
              </Badge>
              <Badge className="bg-white/20 text-white">
                Live Data: ✓
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Contact Modal - TODO: Implement proper modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-w-full mx-4">
            <CardHeader>
              <CardTitle>Create New Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newContact.company}
                  onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@acme.com"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateContact} disabled={!newContact.name || !newContact.email}>
                  Create Contact
                </Button>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Composer Modal */}
      {selectedContact && (
        <EmailComposer
          contact={selectedContact}
          isOpen={showEmailComposer}
          onClose={() => {
            setShowEmailComposer(false)
            setSelectedContact(null)
          }}
          organizationId={organization?.organization_id || ''}
          onEmailSent={handleEmailSent}
        />
      )}

      {/* Email History Modal */}
      {selectedContact && showEmailHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <EmailHistory
              contact={selectedContact}
              organizationId={organization?.organization_id || ''}
              onComposeReply={(contact) => {
                setShowEmailHistory(false)
                setShowEmailComposer(true)
              }}
            />
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailHistory(false)
                  setSelectedContact(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Manager Modal */}
      {selectedContact && (
        <DocumentManager
          contact={selectedContact}
          isOpen={showDocumentManager}
          onClose={() => {
            setShowDocumentManager(false)
            setSelectedContact(null)
          }}
          organizationId={organization?.organization_id || ''}
        />
      )}

      {/* Data Import/Export Modal */}
      <DataImportExport
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        organizationId={organization?.organization_id || ''}
        onImportComplete={handleImportComplete}
      />
    </CRMLayout>
  )
}