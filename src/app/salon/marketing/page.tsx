// TODO: Update this page to use production data from useCampaign
// 1. Replace hardcoded data arrays with: const data = items.map(transformToUICampaign)
// 2. Update create handlers to use: await createCampaign(formData)
// 3. Update delete handlers to use: await deleteCampaign(id)
// 4. Replace loading states with: loading ? <Skeleton /> : <YourComponent />

'use client'

import { useAuth } from '@/contexts/auth-context'
import { useUserContext } from '@/hooks/useUserContext'
import { useCampaign } from '@/hooks/useCampaign'

import React, { useState, useEffect } from 'react'
import '../salon-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { SalonTeamsSidebar } from '@/components/salon-progressive/SalonTeamsSidebar'
import { 
  Zap, 
  Search, 
  Plus, 
  Mail,
  MessageSquare,
  Users,
  TrendingUp,
  Save,
  TestTube,
  ArrowLeft,
  Send,
  Eye,
  MousePointer,
  Calendar,
  Target,
  BarChart3,
  Megaphone,
  Heart,
  Star,
  Gift,
  Smartphone,
  Share2
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data
const initialCampaigns = [
  {
    id: 1,
    name: 'Summer Hair Special',
    type: 'email',
    status: 'active',
    subject: 'Beat the Heat with 20% Off Color Services!',
    message: 'Transform your look this summer with our premium color treatments.',
    audience: 'loyal_customers',
    audienceSize: 156,
    scheduledDate: '2025-01-15',
    budget: 150,
    spent: 89,
    impressions: 1247,
    clicks: 89,
    conversions: 12,
    revenue: 1800,
    createdDate: '2025-01-08'
  },
  {
    id: 2,
    name: 'New Client Welcome Series',
    type: 'automated',
    status: 'active',
    subject: 'Welcome to HERA Salon - Your Beauty Journey Starts Here',
    message: 'Automated welcome sequence for new clients with special offers.',
    audience: 'new_clients',
    audienceSize: 34,
    scheduledDate: 'ongoing',
    budget: 200,
    spent: 156,
    impressions: 892,
    clicks: 67,
    conversions: 8,
    revenue: 960,
    createdDate: '2024-12-15'
  },
  {
    id: 3,
    name: 'Instagram Glow Up Contest',
    type: 'social',
    status: 'completed',
    subject: 'Show off your glow-up transformation!',
    message: 'Social media contest encouraging before/after photos.',
    audience: 'all_clients',
    audienceSize: 312,
    scheduledDate: '2025-01-01',
    budget: 300,
    spent: 280,
    impressions: 3456,
    clicks: 234,
    conversions: 18,
    revenue: 2160,
    createdDate: '2024-12-20'
  },
  {
    id: 4,
    name: 'Birthday Month Treats',
    type: 'sms',
    status: 'scheduled',
    subject: 'Happy Birthday! Enjoy 15% off your celebration style',
    message: 'Personalized birthday offers sent via SMS.',
    audience: 'birthday_clients',
    audienceSize: 23,
    scheduledDate: '2025-02-01',
    budget: 100,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    createdDate: '2025-01-09'
  }
]

const audienceSegments = [
  { id: 'all_clients', name: 'All Clients', size: 312, description: 'Your complete client database' },
  { id: 'loyal_customers', name: 'Loyal Customers', size: 156, description: 'Clients with 5+ visits in last 6 months' },
  { id: 'new_clients', name: 'New Clients', size: 34, description: 'Clients who joined in last 30 days' },
  { id: 'vip_clients', name: 'VIP Clients', size: 28, description: 'Platinum loyalty tier members' },
  { id: 'inactive_clients', name: 'Win-Back', size: 67, description: 'Clients who haven\'t visited in 3+ months' },
  { id: 'birthday_clients', name: 'Birthday This Month', size: 23, description: 'Clients celebrating birthdays' },
  { id: 'high_spenders', name: 'High Spenders', size: 45, description: 'Clients spending $200+ per visit' }
]

const campaignTemplates = [
  {
    id: 1,
    name: 'Seasonal Promotion',
    type: 'email',
    category: 'promotional',
    description: 'Limited-time seasonal offers and specials',
    subject: 'Limited Time: {Season} Special - {Discount}% Off!',
    preview: 'Don\'t miss out on our exclusive seasonal promotion...'
  },
  {
    id: 2,
    name: 'Appointment Reminder',
    type: 'sms',
    category: 'transactional',
    description: 'Automated appointment confirmations and reminders',
    subject: 'Reminder: Your appointment with {Stylist} tomorrow at {Time}',
    preview: 'Hi {Name}, this is a friendly reminder about your upcoming appointment...'
  },
  {
    id: 3,
    name: 'Social Media Contest',
    type: 'social',
    category: 'engagement',
    description: 'Interactive contests to boost social engagement',
    subject: 'Show us your transformation for a chance to win!',
    preview: 'Tag us in your before/after photos for a chance to win a complete makeover...'
  },
  {
    id: 4,
    name: 'Referral Program',
    type: 'email',
    category: 'growth',
    description: 'Encourage clients to refer friends and family',
    subject: 'Share the Love - Get $20 for Every Friend You Refer!',
    preview: 'Know someone who would love our services? Refer them and earn rewards...'
  }
]

interface Campaign {
  id: number
  name: string
  type: 'email' | 'sms' | 'social' | 'automated'
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused'
  subject: string
  message: string
  audience: string
  audienceSize: number
  scheduledDate: string
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  createdDate: string
}

export default function MarketingProgressive() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { 
    items, 
    stats, 
    loading, 
    error, 
    refetch, 
    createCampaign, 
    updateCampaign, 
    deleteCampaign 
  } = useCampaign(organizationId)

  const [testMode, setTestMode] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'social' | 'automated',
    subject: '',
    message: '',
    audience: '',
    scheduledDate: '',
    budget: 100
  })

  // Filter campaigns based on search and filters
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('Marketing data saved:', campaigns)
  }

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.subject) return

    const audienceSegment = audienceSegments.find(s => s.id === newCampaign.audience)
    const campaign: Campaign = {
      id: Date.now(),
      ...newCampaign,
      status: 'draft',
      audienceSize: audienceSegment?.size || 0,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdDate: new Date().toISOString().split('T')[0]
    }

    setCampaigns(prev => [...prev, campaign])
    setNewCampaign({
      name: '',
      type: 'email',
      subject: '',
      message: '',
      audience: '',
      scheduledDate: '',
      budget: 100
    })
    setShowCreateForm(false)
    setHasChanges(true)
  }

  const handleStatusChange = (id: number, status: Campaign['status']) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    setHasChanges(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'paused': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'social': return <Share2 className="h-4 w-4" />
      case 'automated': return <Zap className="h-4 w-4" />
      default: return <Mail className="h-4 w-4" />
    }
  }

  const getMarketingStats = () => {
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0)
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const roas = totalSpent > 0 ? totalRevenue / totalSpent : 0

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalBudget,
      totalSpent,
      totalImpressions,
      totalClicks,
      totalRevenue,
      avgCTR,
      roas
    }
  }

  const stats = getMarketingStats()


  if (!isAuthenticated) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">


        <Alert>


          <AlertCircle className="h-4 w-4" />


          <AlertDescription>


            Please log in to access marketing management.


          </AlertDescription>


        </Alert>


      </div>


    )


  }



  if (contextLoading) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">


        <div className="text-center">


          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />


          <p className="text-gray-600">Loading your profile...</p>


        </div>


      </div>


    )


  }



  if (!organizationId) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">


        <Alert variant="destructive">


          <AlertCircle className="h-4 w-4" />


          <AlertDescription>


            Organization not found. Please contact support.


          </AlertDescription>


        </Alert>


      </div>


    )


  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex">
      {/* Teams-Style Sidebar */}
      <SalonTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Progressive Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/salon-progressive">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Marketing Hub
                  </h1>
                  <p className="text-sm text-gray-600">Create campaigns and grow your client base</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {testMode && hasChanges && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveProgress}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    Save Progress
                  </Button>
                )}

                {lastSaved && (
                  <div className="text-xs text-gray-500">
                    Saved: {lastSaved.toLocaleTimeString()}
                  </div>
                )}

                <Badge variant="secondary" className="flex items-center gap-1">
                  <TestTube className="h-3 w-3" />
                  Test Mode
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {/* Marketing Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Megaphone className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-600">{stats.totalCampaigns}</p>
                  <p className="text-xs text-gray-600">Total Campaigns</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">{stats.activeCampaigns}</p>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold text-purple-600">{stats.totalImpressions.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Total Impressions</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">${stats.totalRevenue}</p>
                  <p className="text-xs text-gray-600">Revenue Generated</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Click-Through Rate</p>
                    <p className="text-xl font-bold text-blue-600">{stats.avgCTR.toFixed(1)}%</p>
                  </div>
                  <MousePointer className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Return on Ad Spend</p>
                    <p className="text-xl font-bold text-green-600">{stats.roas.toFixed(1)}x</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Budget Utilization</p>
                    <p className="text-xl font-bold text-purple-600">{((stats.totalSpent / stats.totalBudget) * 100).toFixed(0)}%</p>
                  </div>
                  <Target className="h-6 w-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Total Clicks</p>
                    <p className="text-xl font-bold text-orange-600">{stats.totalClicks}</p>
                  </div>
                  <MousePointer className="h-6 w-6 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="campaigns" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="audiences">Audiences</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search campaigns by name or subject..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="all" className="hera-select-item">All Types</SelectItem>
                    <SelectItem value="email" className="hera-select-item">Email</SelectItem>
                    <SelectItem value="sms" className="hera-select-item">SMS</SelectItem>
                    <SelectItem value="social" className="hera-select-item">Social</SelectItem>
                    <SelectItem value="automated" className="hera-select-item">Automated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="all" className="hera-select-item">All Status</SelectItem>
                    <SelectItem value="active" className="hera-select-item">Active</SelectItem>
                    <SelectItem value="scheduled" className="hera-select-item">Scheduled</SelectItem>
                    <SelectItem value="completed" className="hera-select-item">Completed</SelectItem>
                    <SelectItem value="draft" className="hera-select-item">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign List */}
                <div className="lg:col-span-2">
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-pink-500" />
                        Campaigns ({filteredCampaigns.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredCampaigns.map((campaign) => (
                          <div 
                            key={campaign.id} 
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              selectedCampaign?.id === campaign.id 
                                ? 'border-pink-300 bg-pink-50' 
                                : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                            }`}
                            onClick={() => setSelectedCampaign(campaign)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                                  {getTypeIcon(campaign.type)}
                                </div>
                                <div>
                                  <p className="font-medium">{campaign.name}</p>
                                  <p className="text-sm text-gray-600">{campaign.subject}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(campaign.status)}>
                                  {campaign.status.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4 text-center text-sm">
                              <div>
                                <p className="font-semibold text-blue-600">{campaign.impressions}</p>
                                <p className="text-xs text-gray-500">Impressions</p>
                              </div>
                              <div>
                                <p className="font-semibold text-green-600">{campaign.clicks}</p>
                                <p className="text-xs text-gray-500">Clicks</p>
                              </div>
                              <div>
                                <p className="font-semibold text-purple-600">{campaign.conversions}</p>
                                <p className="text-xs text-gray-500">Conversions</p>
                              </div>
                              <div>
                                <p className="font-semibold text-green-600">${campaign.revenue}</p>
                                <p className="text-xs text-gray-500">Revenue</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Campaign Details / Create Form */}
                <div>
                  {showCreateForm ? (
                    <Card className="bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="h-5 w-5 text-pink-500" />
                          Create Campaign
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="name">Campaign Name *</Label>
                          <Input
                            id="name"
                            value={newCampaign.name}
                            onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter campaign name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Type *</Label>
                          <Select
                            value={newCampaign.type}
                            onValueChange={(value) => setNewCampaign(prev => ({ ...prev, type: value as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="hera-select-content">
                              <SelectItem value="email" className="hera-select-item">Email</SelectItem>
                              <SelectItem value="sms" className="hera-select-item">SMS</SelectItem>
                              <SelectItem value="social" className="hera-select-item">Social Media</SelectItem>
                              <SelectItem value="automated" className="hera-select-item">Automated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="subject">Subject/Title *</Label>
                          <Input
                            id="subject"
                            value={newCampaign.subject}
                            onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Enter subject line"
                          />
                        </div>
                        <div>
                          <Label htmlFor="audience">Audience</Label>
                          <Select
                            value={newCampaign.audience}
                            onValueChange={(value) => setNewCampaign(prev => ({ ...prev, audience: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select audience" />
                            </SelectTrigger>
                            <SelectContent className="hera-select-content">
                              {audienceSegments.map((segment) => (
                                <SelectItem key={segment.id} value={segment.id} className="hera-select-item">
                                  {segment.name} ({segment.size})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="budget">Budget ($)</Label>
                          <Input
                            id="budget"
                            type="number"
                            min="0"
                            value={newCampaign.budget}
                            onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            value={newCampaign.message}
                            onChange={(e) => setNewCampaign(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Enter campaign message"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleCreateCampaign}
                            className="flex-1 bg-pink-600 hover:bg-pink-700"
                            disabled={!newCampaign.name || !newCampaign.subject}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Campaign
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowCreateForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : selectedCampaign ? (
                    <Card className="bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-pink-500" />
                            Campaign Details
                          </CardTitle>
                          <Select
                            value={selectedCampaign.status}
                            onValueChange={(status) => handleStatusChange(selectedCampaign.id, status as Campaign['status'])}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="hera-select-content">
                              <SelectItem value="draft" className="hera-select-item">Draft</SelectItem>
                              <SelectItem value="scheduled" className="hera-select-item">Scheduled</SelectItem>
                              <SelectItem value="active" className="hera-select-item">Active</SelectItem>
                              <SelectItem value="paused" className="hera-select-item">Paused</SelectItem>
                              <SelectItem value="completed" className="hera-select-item">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center pb-4 border-b">
                          <div className="h-16 w-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            {getTypeIcon(selectedCampaign.type)}
                          </div>
                          <h3 className="font-semibold text-lg">{selectedCampaign.name}</h3>
                          <Badge className={getStatusColor(selectedCampaign.status)} className="mt-2">
                            {selectedCampaign.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Subject/Title</Label>
                            <p className="text-sm">{selectedCampaign.subject}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Type</Label>
                            <div className="flex items-center gap-2 text-sm">
                              {getTypeIcon(selectedCampaign.type)}
                              <span className="capitalize">{selectedCampaign.type}</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Audience</Label>
                            <p className="text-sm">
                              {audienceSegments.find(s => s.id === selectedCampaign.audience)?.name || 'Custom'} 
                              ({selectedCampaign.audienceSize} recipients)
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Budget</Label>
                            <p className="text-sm">${selectedCampaign.budget} (${selectedCampaign.spent} spent)</p>
                            <Progress value={(selectedCampaign.spent / selectedCampaign.budget) * 100} className="mt-1" />
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <h4 className="font-medium">Performance Metrics</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Impressions</p>
                              <p className="font-semibold">{selectedCampaign.impressions.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Clicks</p>
                              <p className="font-semibold">{selectedCampaign.clicks}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Conversions</p>
                              <p className="font-semibold">{selectedCampaign.conversions}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Revenue</p>
                              <p className="font-semibold text-green-600">${selectedCampaign.revenue}</p>
                            </div>
                          </div>
                        </div>

                        {selectedCampaign.message && (
                          <div>
                            <Label className="text-sm font-medium">Message Preview</Label>
                            <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">
                              {selectedCampaign.message}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button className="flex-1" size="sm">
                            <Send className="h-4 w-4 mr-2" />
                            Send Now
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-8 text-center">
                        <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 mb-4">Select a campaign to view details</p>
                        <Button 
                          onClick={() => setShowCreateForm(true)}
                          className="bg-pink-600 hover:bg-pink-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Campaign
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audiences">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-pink-500" />
                    Audience Segments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {audienceSegments.map((segment) => (
                      <Card key={segment.id} className="border-2 border-dashed border-gray-200">
                        <CardContent className="p-4">
                          <div className="text-center">
                            <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                            <h3 className="font-semibold">{segment.name}</h3>
                            <p className="text-2xl font-bold text-blue-600 my-2">{segment.size}</p>
                            <p className="text-xs text-gray-600">{segment.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-pink-500" />
                    Campaign Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaignTemplates.map((template) => (
                      <Card key={template.id} className="border-2 border-dashed border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                              {getTypeIcon(template.type)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{template.name}</h3>
                              <Badge variant="outline" className="text-xs mb-2">
                                {template.category}
                              </Badge>
                              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                              <div className="bg-gray-50 p-2 rounded text-xs">
                                <p className="font-medium mb-1">{template.subject}</p>
                                <p className="text-gray-500">{template.preview}</p>
                              </div>
                              <Button size="sm" className="mt-3 w-full">
                                Use Template
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Progressive Features Notice */}
          {testMode && (
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TestTube className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Test Mode Active</p>
                    <p className="text-sm text-blue-700">
                      Create and manage marketing campaigns freely. Track performance, segment audiences, and grow your business. 
                      All changes are saved locally in test mode. Click "Save Progress" to persist your marketing data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}