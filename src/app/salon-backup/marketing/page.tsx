'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { useToast } from '@/components/ui/use-toast'
import { useSalonSettings } from '@/contexts/salon-settings-context'
import { 
  ChevronLeft,
  Mail,
  MessageSquare,
  Users,
  Target,
  Send,
  Gift,
  TrendingUp,
  Calendar,
  Clock,
  Eye,
  MousePointer,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  BarChart3,
  Megaphone,
  Zap,
  Award,
  Heart,
  Star,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react'

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

interface Campaign {
  id: string
  entity_name: string
  metadata: {
    type: 'email' | 'sms' | 'both'
    status: 'draft' | 'scheduled' | 'active' | 'completed'
    subject?: string
    message: string
    targetSegment: string
    scheduledDate?: string
    sentCount?: number
    openRate?: number
    clickRate?: number
  }
  created_at: string
  updated_at: string
}

interface CustomerSegment {
  id: string
  entity_name: string
  metadata: {
    description: string
    criteria: {
      field: string
      operator: string
      value: any
    }[]
    customerCount?: number
  }
}

interface EmailTemplate {
  id: string
  entity_name: string
  metadata: {
    subject: string
    body: string
    category: string
    variables?: string[]
  }
}

interface MarketingAnalytics {
  totalCustomers: number
  emailSubscribers: number
  smsSubscribers: number
  activeCampaigns: number
  campaignsSent: number
  averageOpenRate: number
  averageClickRate: number
  revenue: number
}

export default function MarketingPage() {
  const router = useRouter()
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  const { toast } = useToast()
  const { settings } = useSalonSettings()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('campaigns')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [segments, setSegments] = useState<CustomerSegment[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [analytics, setAnalytics] = useState<MarketingAnalytics>({
    totalCustomers: 0,
    emailSubscribers: 0,
    smsSubscribers: 0,
    activeCampaigns: 0,
    campaignsSent: 0,
    averageOpenRate: 0,
    averageClickRate: 0,
    revenue: 0
  })

  // Dialog states
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [showSegmentDialog, setShowSegmentDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Form states
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'both',
    subject: '',
    message: '',
    targetSegment: 'all',
    scheduledDate: ''
  })

  const [segmentForm, setSegmentForm] = useState({
    name: '',
    description: '',
    criteria: [{ field: 'loyaltyPoints', operator: 'greater_than', value: '100' }]
  })

  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'promotional'
  })

  useEffect(() => {
    if (organizationId && !contextLoading) {
      fetchMarketingData()
    }
  }, [organizationId, contextLoading])

  const fetchMarketingData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/salon/marketing?organization_id=${organizationId}`)
      const data = await response.json()
      
      if (data.success) {
        setCampaigns(data.campaigns || [])
        setSegments(data.segments || [])
        setTemplates(data.templates || [])
        setAnalytics(data.analytics || {
          totalCustomers: 0,
          emailSubscribers: 0,
          smsSubscribers: 0,
          activeCampaigns: 0,
          campaignsSent: 0,
          averageOpenRate: 0,
          averageClickRate: 0,
          revenue: 0
        })
      }
    } catch (error) {
      console.error('Error fetching marketing data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load marketing data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/v1/salon/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          type: 'campaign',
          data: {
            ...campaignForm,
            status: campaignForm.scheduledDate ? 'scheduled' : 'draft'
          }
        })
      })

      if (!response.ok) throw new Error('Failed to create campaign')

      toast({
        title: 'Success',
        description: 'Campaign created successfully'
      })

      setShowCampaignDialog(false)
      setCampaignForm({
        name: '',
        type: 'email',
        subject: '',
        message: '',
        targetSegment: 'all',
        scheduledDate: ''
      })
      fetchMarketingData()
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive'
      })
    }
  }

  const handleCreateSegment = async () => {
    try {
      const response = await fetch('/api/v1/salon/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          type: 'segment',
          data: segmentForm
        })
      })

      if (!response.ok) throw new Error('Failed to create segment')

      toast({
        title: 'Success',
        description: 'Customer segment created successfully'
      })

      setShowSegmentDialog(false)
      setSegmentForm({
        name: '',
        description: '',
        criteria: [{ field: 'loyaltyPoints', operator: 'greater_than', value: '100' }]
      })
      fetchMarketingData()
    } catch (error) {
      console.error('Error creating segment:', error)
      toast({
        title: 'Error',
        description: 'Failed to create segment',
        variant: 'destructive'
      })
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/v1/salon/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          type: 'template',
          data: templateForm
        })
      })

      if (!response.ok) throw new Error('Failed to create template')

      toast({
        title: 'Success',
        description: 'Email template created successfully'
      })

      setShowTemplateDialog(false)
      setTemplateForm({
        name: '',
        subject: '',
        body: '',
        category: 'promotional'
      })
      fetchMarketingData()
    } catch (error) {
      console.error('Error creating template:', error)
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/v1/salon/marketing?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete item')

      toast({
        title: 'Success',
        description: 'Item deleted successfully'
      })

      fetchMarketingData()
    } catch (error) {
      console.error('Error deleting item:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive'
      })
    }
  }

  const getCampaignStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-700', icon: Edit },
      scheduled: { color: 'bg-blue-100 text-blue-700', icon: Clock },
      active: { color: 'bg-green-100 text-green-700', icon: Send },
      completed: { color: 'bg-purple-100 text-purple-700', icon: CheckCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (contextLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading marketing tools...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/salon')}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Marketing & Campaigns
                </h1>
                <p className="text-gray-600 text-lg">
                  Engage customers with targeted campaigns and promotions
                </p>
              </div>
            </div>
          </div>

          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Customers</p>
                    <p className="text-2xl font-bold">{analytics.totalCustomers}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Email Subscribers</p>
                    <p className="text-2xl font-bold">{analytics.emailSubscribers}</p>
                    <p className="text-xs text-gray-500">
                      {analytics.totalCustomers > 0 
                        ? `${Math.round((analytics.emailSubscribers / analytics.totalCustomers) * 100)}% of total`
                        : '0% of total'}
                    </p>
                  </div>
                  <Mail className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold">{analytics.activeCampaigns}</p>
                  </div>
                  <Megaphone className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Campaign Revenue</p>
                    <p className="text-2xl font-bold">
                      {settings?.payment_settings.currency || 'AED'} {analytics.revenue.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="segments">Customer Segments</TabsTrigger>
              <TabsTrigger value="templates">Email Templates</TabsTrigger>
            </TabsList>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Marketing Campaigns</h2>
                  <p className="text-gray-600">Create and manage email and SMS campaigns</p>
                </div>
                <Button
                  onClick={() => setShowCampaignDialog(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </div>

              {campaigns.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start engaging your customers with targeted campaigns
                    </p>
                    <Button onClick={() => setShowCampaignDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Campaign
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {campaigns.map((campaign) => (
                    <Card key={campaign.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{campaign.entity_name}</h3>
                              {getCampaignStatusBadge(campaign.metadata.status)}
                              <Badge variant="outline">
                                {campaign.metadata.type === 'email' && <Mail className="w-3 h-3 mr-1" />}
                                {campaign.metadata.type === 'sms' && <MessageSquare className="w-3 h-3 mr-1" />}
                                {campaign.metadata.type === 'both' && <Zap className="w-3 h-3 mr-1" />}
                                {campaign.metadata.type}
                              </Badge>
                            </div>
                            {campaign.metadata.subject && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Subject:</strong> {campaign.metadata.subject}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 mb-2">
                              {campaign.metadata.message.substring(0, 100)}...
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                {campaign.metadata.targetSegment}
                              </span>
                              {campaign.metadata.scheduledDate && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(campaign.metadata.scheduledDate).toLocaleDateString()}
                                </span>
                              )}
                              {campaign.metadata.sentCount && (
                                <span className="flex items-center gap-1">
                                  <Send className="w-4 h-4" />
                                  {campaign.metadata.sentCount} sent
                                </span>
                              )}
                              {campaign.metadata.openRate !== undefined && (
                                <span className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  {campaign.metadata.openRate}% open rate
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingItem(campaign)
                                setCampaignForm({
                                  name: campaign.entity_name,
                                  type: campaign.metadata.type,
                                  subject: campaign.metadata.subject || '',
                                  message: campaign.metadata.message,
                                  targetSegment: campaign.metadata.targetSegment,
                                  scheduledDate: campaign.metadata.scheduledDate || ''
                                })
                                setShowCampaignDialog(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(campaign.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Customer Segments Tab */}
            <TabsContent value="segments" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Customer Segments</h2>
                  <p className="text-gray-600">Define customer groups for targeted marketing</p>
                </div>
                <Button
                  onClick={() => setShowSegmentDialog(true)}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Segment
                </Button>
              </div>

              {segments.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No segments defined</h3>
                    <p className="text-gray-600 mb-4">
                      Create customer segments for targeted campaigns
                    </p>
                    <Button onClick={() => setShowSegmentDialog(true)} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Segment
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {segments.map((segment) => (
                    <Card key={segment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold">{segment.entity_name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(segment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {segment.metadata.description}
                        </p>
                        <div className="space-y-2">
                          {segment.metadata.criteria.map((criterion, index) => (
                            <div key={index} className="text-xs bg-gray-100 rounded px-2 py-1">
                              {criterion.field} {criterion.operator.replace('_', ' ')} {criterion.value}
                            </div>
                          ))}
                        </div>
                        {segment.metadata.customerCount !== undefined && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium">
                              {segment.metadata.customerCount} customers
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Email Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Email Templates</h2>
                  <p className="text-gray-600">Pre-designed templates for common communications</p>
                </div>
                <Button
                  onClick={() => setShowTemplateDialog(true)}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>

              {templates.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
                    <p className="text-gray-600 mb-4">
                      Create reusable email templates for faster campaigns
                    </p>
                    <Button onClick={() => setShowTemplateDialog(true)} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <Card key={template.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{template.entity_name}</h3>
                              <Badge variant="outline">{template.metadata.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Subject:</strong> {template.metadata.subject}
                            </p>
                            <p className="text-sm text-gray-500">
                              {template.metadata.body.substring(0, 150)}...
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingItem(template)
                                setTemplateForm({
                                  name: template.entity_name,
                                  subject: template.metadata.subject,
                                  body: template.metadata.body,
                                  category: template.metadata.category
                                })
                                setShowTemplateDialog(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(template.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Campaign Dialog */}
          <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Campaign' : 'Create New Campaign'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="Summer Sale Campaign"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaignType">Type</Label>
                    <Select
                      value={campaignForm.type}
                      onValueChange={(value: 'email' | 'sms' | 'both') => 
                        setCampaignForm({ ...campaignForm, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="both">Email & SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="targetSegment">Target Segment</Label>
                    <Select
                      value={campaignForm.targetSegment}
                      onValueChange={(value) => setCampaignForm({ ...campaignForm, targetSegment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        {segments.map((segment) => (
                          <SelectItem key={segment.id} value={segment.entity_name}>
                            {segment.entity_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {(campaignForm.type === 'email' || campaignForm.type === 'both') && (
                  <div>
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                      placeholder="Special offer just for you!"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={campaignForm.message}
                    onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                    placeholder="Write your campaign message..."
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledDate">Schedule Date (Optional)</Label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={campaignForm.scheduledDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, scheduledDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign}>
                  {editingItem ? 'Update' : 'Create'} Campaign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Segment Dialog */}
          <Dialog open={showSegmentDialog} onOpenChange={setShowSegmentDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Customer Segment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="segmentName">Segment Name</Label>
                  <Input
                    id="segmentName"
                    value={segmentForm.name}
                    onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                    placeholder="VIP Customers"
                  />
                </div>
                <div>
                  <Label htmlFor="segmentDescription">Description</Label>
                  <Textarea
                    id="segmentDescription"
                    value={segmentForm.description}
                    onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                    placeholder="Customers with high loyalty points..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Criteria</Label>
                  <div className="space-y-2 mt-2">
                    {segmentForm.criteria.map((criterion, index) => (
                      <div key={index} className="flex gap-2">
                        <Select
                          value={criterion.field}
                          onValueChange={(value) => {
                            const newCriteria = [...segmentForm.criteria]
                            newCriteria[index].field = value
                            setSegmentForm({ ...segmentForm, criteria: newCriteria })
                          }}
                        >
                          <SelectTrigger className="w-1/3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="loyaltyPoints">Loyalty Points</SelectItem>
                            <SelectItem value="totalSpent">Total Spent</SelectItem>
                            <SelectItem value="visitCount">Visit Count</SelectItem>
                            <SelectItem value="lastVisit">Last Visit</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={criterion.operator}
                          onValueChange={(value) => {
                            const newCriteria = [...segmentForm.criteria]
                            newCriteria[index].operator = value
                            setSegmentForm({ ...segmentForm, criteria: newCriteria })
                          }}
                        >
                          <SelectTrigger className="w-1/3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="greater_than">Greater than</SelectItem>
                            <SelectItem value="less_than">Less than</SelectItem>
                            <SelectItem value="equals">Equals</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          className="w-1/3"
                          value={criterion.value}
                          onChange={(e) => {
                            const newCriteria = [...segmentForm.criteria]
                            newCriteria[index].value = e.target.value
                            setSegmentForm({ ...segmentForm, criteria: newCriteria })
                          }}
                          placeholder="Value"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSegmentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSegment}>
                  Create Segment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Template Dialog */}
          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Template' : 'Create Email Template'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="Welcome Email"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={templateForm.category}
                    onValueChange={(value) => setTemplateForm({ ...templateForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="thank_you">Thank You</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="templateSubject">Subject Line</Label>
                  <Input
                    id="templateSubject"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    placeholder="Welcome to {salon_name}!"
                  />
                </div>
                <div>
                  <Label htmlFor="templateBody">Email Body</Label>
                  <Textarea
                    id="templateBody"
                    value={templateForm.body}
                    onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                    placeholder="Dear {customer_name},&#10;&#10;Welcome to our salon..."
                    rows={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use variables: {'{customer_name}'}, {'{salon_name}'}, {'{appointment_date}'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  {editingItem ? 'Update' : 'Create'} Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}