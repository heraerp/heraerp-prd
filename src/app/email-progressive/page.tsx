'use client'

import React, { useState, useEffect } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { UniversalTourProvider, TourElement } from '@/components/tours/SimpleTourProvider'
import { 
  Mail, 
  Send, 
  Inbox, 
  ArrowUp,
  FileText,
  Trash2,
  Archive,
  Star,
  Search,
  Plus,
  Reply,
  ReplyAll,
  Forward,
  Paperclip,
  Settings,
  Filter,
  RefreshCw,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Folder,
  Tag,
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Activity,
  Zap,
  Bot,
  Sparkles,
  Shield,
  Key,
  Megaphone,
  Users2,
  PlayCircle,
  PauseCircle,
  BarChart,
  Layers,
  MousePointer
} from 'lucide-react'

// Universal Email System using HERA's 6-Table Architecture
const sampleEmailData = {
  // Email accounts configured via core_entities (entity_type: 'email_account')
  accounts: [
    {
      id: 'ACCOUNT001',
      entity_name: 'Primary Business Account',
      entity_code: 'hello@heraerp.com',
      status: 'active',
      resend_api_key: '[CONFIGURED]',
      is_default: true,
      sent_count: 1247,
      delivered_rate: 98.2
    },
    {
      id: 'ACCOUNT002', 
      entity_name: 'Marketing Account',
      entity_code: 'marketing@heraerp.com',
      status: 'active',
      resend_api_key: '[CONFIGURED]',
      is_default: false,
      sent_count: 834,
      delivered_rate: 97.8
    }
  ],
  
  // Emails stored via core_entities (entity_type: 'email')
  emails: [
    {
      id: 'EMAIL001',
      entity_name: 'Welcome to HERA ERP Platform',
      entity_code: 'EMAIL-1691234567',
      status: 'sent',
      to_addresses: ['james.harrison@harrisontech.com'],
      cc_addresses: [],
      subject: 'Welcome to HERA ERP Platform',
      body_html: '<p>Dear James,</p><p>Welcome to the revolutionary HERA ERP platform...</p>',
      body_text: 'Dear James, Welcome to the revolutionary HERA ERP platform...',
      sent_at: '2024-08-08T10:30:00Z',
      read_status: 'read',
      priority: 'normal',
      folder: 'sent',
      from_account: 'hello@heraerp.com',
      resend_id: 're_abc123xyz'
    },
    {
      id: 'EMAIL002',
      entity_name: 'Your Monthly Analytics Report',
      entity_code: 'EMAIL-1691234568',
      status: 'sent',
      to_addresses: ['margaret.morrison@morrisonfamily.org'],
      cc_addresses: ['alex@heraerp.com'],
      subject: 'Your Monthly Analytics Report',
      body_html: '<p>Dear Margaret,</p><p>Your business analytics for July are ready...</p>',
      body_text: 'Dear Margaret, Your business analytics for July are ready...',
      sent_at: '2024-08-07T14:15:00Z',
      read_status: 'unread',
      priority: 'high',
      folder: 'sent',
      from_account: 'hello@heraerp.com',
      resend_id: 're_def456xyz'
    },
    {
      id: 'EMAIL003',
      entity_name: 'System Maintenance Notice',
      entity_code: 'EMAIL-1691234569',
      status: 'draft',
      to_addresses: ['all-customers@heraerp.com'],
      cc_addresses: [],
      subject: 'System Maintenance Notice - August 15th',
      body_html: '<p>Dear Valued Customer,</p><p>We will be performing scheduled maintenance...</p>',
      body_text: 'Dear Valued Customer, We will be performing scheduled maintenance...',
      priority: 'normal',
      folder: 'drafts',
      from_account: 'hello@heraerp.com'
    }
  ],
  
  // Folders stored via core_entities (entity_type: 'email_folder') 
  folders: [
    { id: 'inbox', name: 'Inbox', count: 23, icon: Inbox },
    { id: 'sent', name: 'Sent', count: 156, icon: ArrowUp },
    { id: 'drafts', name: 'Drafts', count: 3, icon: FileText },
    { id: 'archived', name: 'Archive', count: 89, icon: Archive },
    { id: 'trash', name: 'Trash', count: 5, icon: Trash2 }
  ],
  
  // Templates stored via core_entities (entity_type: 'email_template')
  templates: [
    {
      id: 'TEMPLATE001',
      entity_name: 'Welcome Email',
      template_subject: 'Welcome to {{company_name}}',
      template_body: '<p>Dear {{customer_name}},</p><p>Welcome to {{company_name}}! We are excited to have you...</p>'
    },
    {
      id: 'TEMPLATE002',
      entity_name: 'Monthly Report',
      template_subject: 'Your Monthly {{report_type}} Report',
      template_body: '<p>Dear {{customer_name}},</p><p>Your {{report_type}} report for {{month}} is ready...</p>'
    }
  ],
  
  // Analytics from universal_transactions (transaction_type: 'email_send')
  analytics: {
    total_sent: 2081,
    sent_this_month: 345,
    delivered_rate: 98.0,
    open_rate: 68.5,
    click_rate: 24.3,
    bounce_rate: 2.0,
    unsubscribe_rate: 0.8,
    top_performing_subject: 'Your Monthly Analytics Report',
    best_send_time: '10:30 AM',
    engagement_score: 8.7
  },
  
  // Marketing Campaigns - stored via core_entities (entity_type: 'email_campaign')
  campaigns: [
    {
      id: 'CAMPAIGN001',
      entity_name: 'Welcome Series - New Customers',
      entity_code: 'WELCOME-2024-001',
      status: 'active',
      campaign_type: 'welcome',
      target_audience: 'New Signups',
      total_recipients: 1247,
      emails_sent: 1247,
      emails_delivered: 1224,
      emails_opened: 856,
      emails_clicked: 312,
      leads_generated: 28,
      created_at: '2024-08-01T00:00:00Z',
      scheduled_send_date: null,
      open_rate: 69.9,
      click_rate: 25.5,
      conversion_rate: 2.2
    },
    {
      id: 'CAMPAIGN002', 
      entity_name: 'Product Update - Q3 Features',
      entity_code: 'PRODUCT-2024-002',
      status: 'scheduled',
      campaign_type: 'promotional',
      target_audience: 'Active Users',
      total_recipients: 3456,
      emails_sent: 0,
      emails_delivered: 0,
      emails_opened: 0,
      emails_clicked: 0,
      leads_generated: 0,
      created_at: '2024-08-08T00:00:00Z',
      scheduled_send_date: '2024-08-15T10:00:00Z',
      open_rate: 0,
      click_rate: 0,
      conversion_rate: 0
    },
    {
      id: 'CAMPAIGN003',
      entity_name: 'Monthly Newsletter - August',
      entity_code: 'NEWSLETTER-2024-08',
      status: 'sent',
      campaign_type: 'newsletter', 
      target_audience: 'All Subscribers',
      total_recipients: 5678,
      emails_sent: 5678,
      emails_delivered: 5523,
      emails_opened: 3567,
      emails_clicked: 892,
      leads_generated: 45,
      created_at: '2024-08-05T00:00:00Z',
      scheduled_send_date: null,
      open_rate: 64.6,
      click_rate: 16.1,
      conversion_rate: 0.8
    }
  ],
  
  // Email Templates for campaigns
  campaignTemplates: [
    {
      id: 'TEMPLATE_CAMP_001',
      entity_name: 'Welcome Email Template',
      template_type: 'welcome',
      subject: 'Welcome to {{company_name}} - Let\'s get started!',
      preview_text: 'Your journey begins here...',
      body_html: '<h1>Welcome {{customer_name}}!</h1><p>We\'re excited to have you join our community...</p>'
    },
    {
      id: 'TEMPLATE_CAMP_002', 
      entity_name: 'Product Announcement Template',
      template_type: 'promotional',
      subject: '🚀 New Feature: {{feature_name}} is now live!',
      preview_text: 'Discover what\'s new...',
      body_html: '<h1>Exciting News!</h1><p>We\'ve just launched {{feature_name}}...</p>'
    }
  ],
  
  // Audience Segments - stored via core_entities (entity_type: 'email_audience')
  audienceSegments: [
    {
      id: 'AUDIENCE001',
      entity_name: 'New Signups (Last 30 Days)',
      segment_size: 1247,
      criteria: { signup_date: 'last_30_days', status: 'active' },
      growth_rate: '+23%',
      engagement_score: 8.2
    },
    {
      id: 'AUDIENCE002',
      entity_name: 'Active Users (Monthly)',
      segment_size: 3456,
      criteria: { login_frequency: 'weekly', subscription: 'active' },
      growth_rate: '+8%',
      engagement_score: 7.8
    },
    {
      id: 'AUDIENCE003',
      entity_name: 'All Subscribers',
      segment_size: 5678,
      criteria: { subscribed: true, bounced: false },
      growth_rate: '+12%',
      engagement_score: 6.9
    },
    {
      id: 'AUDIENCE004',
      entity_name: 'High-Value Customers',
      segment_size: 892,
      criteria: { revenue: '>$1000', engagement: 'high' },
      growth_rate: '+18%',
      engagement_score: 9.1
    }
  ]
}

export default function EmailProgressivePage() {
  // Progressive page - no authentication required for demo/exploration
  const [activeView, setActiveView] = useState('inbox')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  })
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
  const [campaignData, setCampaignData] = useState({
    campaign_name: '',
    campaign_type: 'promotional',
    target_audience: '',
    subject_line: '',
    preview_text: '',
    template_id: '',
    scheduled_send_date: ''
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-amber-600'
      default: return 'text-slate-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600'
      case 'draft': return 'text-amber-600'
      case 'failed': return 'text-red-600'
      default: return 'text-slate-600'
    }
  }

  const filteredEmails = sampleEmailData.emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.to_addresses.some(addr => addr.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFolder = activeView === 'inbox' ? true : email.folder === activeView
    
    return matchesSearch && matchesFolder
  })

  const selectedEmailData = selectedEmail ? 
    sampleEmailData.emails.find(email => email.id === selectedEmail) : null

  const handleSendEmail = async () => {
    // In production, this would call the Universal Email API
    console.log('Sending email via Universal API:', composeData)
    
    // Mock successful send
    setIsComposing(false)
    setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' })
    
    // Show success notification
    alert('Email sent successfully via Universal Email System!')
  }

  const handleCreateCampaign = async () => {
    // In production, this would call the Email Campaign API
    console.log('Creating campaign via Email Campaign API:', campaignData)
    
    // Mock successful creation
    setIsCreatingCampaign(false)
    setCampaignData({
      campaign_name: '',
      campaign_type: 'promotional',
      target_audience: '',
      subject_line: '',
      preview_text: '',
      template_id: '',
      scheduled_send_date: ''
    })
    
    alert('Campaign created successfully! Ready for review and sending.')
  }

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-50 border-green-200'
      case 'active': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'scheduled': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'draft': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'paused': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'welcome': return Users2
      case 'promotional': return Megaphone
      case 'newsletter': return Layers
      case 'nurture': return Target
      default: return Mail
    }
  }

  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Compose Button */}
      <div className="p-4 border-b border-slate-200">
        <TourElement step={1} title="Compose Email" description="Create and send new emails with AI assistance">
          <Button 
            onClick={() => setIsComposing(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </TourElement>
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-auto">
        <TourElement step={2} title="Email Folders" description="Organize emails in smart folders">
          <div className="p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Folders</h3>
            <div className="space-y-1">
              {sampleEmailData.folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setActiveView(folder.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeView === folder.id 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center">
                    <folder.icon className="h-4 w-4 mr-2" />
                    {folder.name}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {folder.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </TourElement>

        {/* Email Accounts */}
        <TourElement step={3} title="Email Accounts" description="Manage multiple email accounts with Resend integration">
          <div className="p-4 border-t border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Accounts</h3>
            <div className="space-y-2">
              {sampleEmailData.accounts.map((account) => (
                <div key={account.id} className="p-2 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-blue-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{account.entity_name}</p>
                        <p className="text-xs text-slate-500">{account.entity_code}</p>
                      </div>
                    </div>
                    {account.is_default && (
                      <Badge variant="default" className="text-xs">Default</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Sent: {account.sent_count}</span>
                    <span>Rate: {account.delivered_rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TourElement>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 bg-blue-50 rounded-lg">
            <p className="text-lg font-semibold text-blue-600">{sampleEmailData.analytics.sent_this_month}</p>
            <p className="text-xs text-slate-600">This Month</p>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <p className="text-lg font-semibold text-green-600">{sampleEmailData.analytics.open_rate}%</p>
            <p className="text-xs text-slate-600">Open Rate</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderEmailList = () => (
    <div className="w-96 bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 capitalize">{activeView}</h2>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <TourElement step={4} title="Email Search" description="Find emails quickly with smart search">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search emails..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </TourElement>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-auto">
        <TourElement step={5} title="Email List" description="View and manage your emails with detailed information">
          <div className="divide-y divide-slate-200">
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email.id)}
                className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                  selectedEmail === email.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {email.to_addresses[0]}
                      </p>
                      {email.read_status === 'unread' && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                      <Badge className={getStatusColor(email.status)} variant="outline">
                        {email.status}
                      </Badge>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-slate-900 mb-1 truncate">
                      {email.subject}
                    </h3>
                    
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                      {email.body_text}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{email.sent_at ? formatDate(email.sent_at) : 'Draft'}</span>
                      <div className="flex items-center space-x-1">
                        {email.priority === 'high' && (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                        {email.cc_addresses.length > 0 && (
                          <Users className="h-3 w-3 text-slate-400" />
                        )}
                        {email.resend_id && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TourElement>
      </div>
    </div>
  )

  const renderSettingsView = () => (
    <div className="flex-1 bg-white flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Email Settings</h2>
        <p className="text-sm text-slate-600 mt-1">Configure your email accounts and Resend API integration</p>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl space-y-8">
          {/* Authentication Required Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start">
                <Key className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-900">Authentication Required</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    You need to be logged in to configure email accounts and API keys. This ensures secure management of your sensitive credentials.
                  </p>
                  <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700" onClick={() => window.location.href = '/login'}>
                    <User className="h-4 w-4 mr-1" />
                    Sign In to Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resend Integration Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 text-blue-500 mr-2" />
                Resend API Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Customer-Owned API Keys</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your Resend API keys are stored securely in your organization's encrypted storage. We never have access to your credentials.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Account Name</label>
                  <Input placeholder="Primary Business Email" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <Input placeholder="hello@yourcompany.com" disabled />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Resend API Key</label>
                <div className="flex space-x-2">
                  <Input 
                    type="password" 
                    placeholder="re_xxxxxxxxxx (requires authentication)" 
                    disabled 
                  />
                  <Button size="sm" variant="outline" disabled>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Get your API key from <a href="https://resend.com/api-keys" target="_blank" className="text-blue-600 hover:underline">Resend Dashboard</a>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="default-account" className="rounded" disabled />
                <label htmlFor="default-account" className="text-sm text-slate-600">Make this the default sending account</label>
              </div>

              <div className="flex space-x-2">
                <Button className="bg-blue-600 hover:bg-blue-700" disabled>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Save Configuration
                </Button>
                <Button variant="outline" disabled>
                  <Zap className="h-4 w-4 mr-1" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Email Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 text-emerald-500 mr-2" />
                Configured Email Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sampleEmailData.accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-slate-900">{account.entity_name}</p>
                        <p className="text-sm text-slate-600">{account.entity_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {account.is_default && (
                        <Badge variant="default">Default</Badge>
                      )}
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                      <Button size="sm" variant="outline" disabled>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="mt-4 w-full" variant="outline" disabled>
                <Plus className="h-4 w-4 mr-1" />
                Add Another Email Account
              </Button>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 text-purple-500 mr-2" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Default Send From</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-md" disabled>
                    <option>Primary Business Account</option>
                    <option>Marketing Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Signature</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-md" disabled>
                    <option>Default Signature</option>
                    <option>Custom Signature</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-save" className="rounded" disabled />
                  <label htmlFor="auto-save" className="text-sm text-slate-600">Auto-save drafts every 30 seconds</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="read-receipts" className="rounded" disabled />
                  <label htmlFor="read-receipts" className="text-sm text-slate-600">Request read receipts for sent emails</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="ai-suggestions" className="rounded" defaultChecked disabled />
                  <label htmlFor="ai-suggestions" className="text-sm text-slate-600">Enable AI writing suggestions</label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const renderEmailContent = () => {
    if (activeView === 'settings') {
      return renderSettingsView()
    }

    if (isComposing) {
      return (
        <div className="flex-1 bg-white flex flex-col">
          <TourElement step={6} title="Email Composer" description="Compose emails with AI assistance and templates">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Compose Email</h2>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <Bot className="h-4 w-4 mr-1" />
                    AI Assist
                  </Button>
                  <Button size="sm" variant="outline">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsComposing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSendEmail} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="To: recipient@example.com"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                />
                
                <div className="flex space-x-2">
                  <Input
                    placeholder="CC (optional)"
                    value={composeData.cc}
                    onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                  />
                  <Input
                    placeholder="BCC (optional)"
                    value={composeData.bcc}
                    onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })}
                  />
                </div>
                
                <Input
                  placeholder="Subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                />
              </div>

              <div className="flex-1">
                <Textarea
                  placeholder="Write your email..."
                  className="min-h-96 resize-none"
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                />
              </div>

              {/* AI Suggestions */}
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                <div className="flex items-start">
                  <Sparkles className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">AI Writing Assistant</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Try: "Write a professional follow-up email about our meeting" or "Make this more concise"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TourElement>
        </div>
      )
    }

    if (!selectedEmailData) {
      return (
        <div className="flex-1 bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <Mail className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">Select an email</h3>
            <p className="text-slate-500">Choose an email from the list to view its contents</p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 bg-white flex flex-col">
        {/* Email Header */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-slate-900">{selectedEmailData.subject}</h2>
              <Badge className={getStatusColor(selectedEmailData.status)} variant="outline">
                {selectedEmailData.status}
              </Badge>
              {selectedEmailData.priority === 'high' && (
                <Badge variant="destructive">High Priority</Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
              <Button size="sm" variant="outline">
                <ReplyAll className="h-4 w-4 mr-1" />
                Reply All
              </Button>
              <Button size="sm" variant="outline">
                <Forward className="h-4 w-4 mr-1" />
                Forward
              </Button>
              <Button size="sm" variant="outline">
                <Archive className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Email Meta */}
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">From: </span>
              <span className="text-slate-600">{selectedEmailData.from_account}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Date: </span>
              <span className="text-slate-600">
                {selectedEmailData.sent_at ? formatDate(selectedEmailData.sent_at) : 'Draft'}
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-700">To: </span>
              <span className="text-slate-600">{selectedEmailData.to_addresses.join(', ')}</span>
            </div>
            {selectedEmailData.cc_addresses.length > 0 && (
              <div>
                <span className="font-medium text-slate-700">CC: </span>
                <span className="text-slate-600">{selectedEmailData.cc_addresses.join(', ')}</span>
              </div>
            )}
          </div>
          
          {selectedEmailData.resend_id && (
            <div className="mt-2 flex items-center text-xs text-slate-500">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              Delivered via Resend (ID: {selectedEmailData.resend_id})
            </div>
          )}
        </div>

        {/* Email Content */}
        <div className="flex-1 p-4 overflow-auto">
          <div 
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedEmailData.body_html }}
          />
        </div>
      </div>
    )
  }

  const renderAnalyticsDashboard = () => (
    <div className="flex-1 bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Email Analytics</h2>
          <p className="text-slate-600">Track performance and engagement across all campaigns</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hera-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Sent</p>
                  <p className="text-3xl font-bold text-slate-900">{sampleEmailData.analytics.total_sent.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+12% from last month</span>
                  </div>
                </div>
                <Send className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hera-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Open Rate</p>
                  <p className="text-3xl font-bold text-slate-900">{sampleEmailData.analytics.open_rate}%</p>
                  <p className="text-sm text-slate-500">Industry avg: 21.3%</p>
                </div>
                <Eye className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hera-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Click Rate</p>
                  <p className="text-3xl font-bold text-slate-900">{sampleEmailData.analytics.click_rate}%</p>
                  <p className="text-sm text-slate-500">Industry avg: 2.6%</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hera-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Engagement Score</p>
                  <p className="text-3xl font-bold text-slate-900">{sampleEmailData.analytics.engagement_score}</p>
                  <p className="text-sm text-slate-500">Excellent performance</p>
                </div>
                <Activity className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hera-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Delivered Rate</span>
                  <span className="font-semibold text-slate-900">{sampleEmailData.analytics.delivered_rate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Bounce Rate</span>
                  <span className="font-semibold text-slate-900">{sampleEmailData.analytics.bounce_rate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Unsubscribe Rate</span>
                  <span className="font-semibold text-slate-900">{sampleEmailData.analytics.unsubscribe_rate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Best Send Time</span>
                  <span className="font-semibold text-slate-900">{sampleEmailData.analytics.best_send_time}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hera-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 text-purple-500 mr-2" />
                Top Performing Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Best Subject Line</p>
                  <p className="font-medium text-slate-900">"{sampleEmailData.analytics.top_performing_subject}"</p>
                  <p className="text-xs text-slate-500">74% open rate</p>
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">AI Recommendations</p>
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 rounded-lg text-sm">
                      <span className="font-medium text-blue-900">Send Time:</span> Consider sending at 2:30 PM for +15% open rate
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg text-sm">
                      <span className="font-medium text-green-900">Subject:</span> Add urgency words to increase opens by 8%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const renderCampaignDashboard = () => (
    <div className="flex-1 bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Email Marketing Campaigns</h2>
              <p className="text-slate-600">Create, manage and track marketing campaigns with lead conversion</p>
            </div>
            <Button 
              onClick={() => setIsCreatingCampaign(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Campaign Creation Modal */}
        {isCreatingCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Create New Campaign</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsCreatingCampaign(false)}
                  >
                    ×
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Name</label>
                    <Input
                      placeholder="Summer Sale Announcement"
                      value={campaignData.campaign_name}
                      onChange={(e) => setCampaignData({ ...campaignData, campaign_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Type</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 rounded-md"
                      value={campaignData.campaign_type}
                      onChange={(e) => setCampaignData({ ...campaignData, campaign_type: e.target.value })}
                    >
                      <option value="promotional">Promotional</option>
                      <option value="newsletter">Newsletter</option>
                      <option value="welcome">Welcome Series</option>
                      <option value="nurture">Lead Nurturing</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    value={campaignData.target_audience}
                    onChange={(e) => setCampaignData({ ...campaignData, target_audience: e.target.value })}
                  >
                    <option value="">Select audience segment</option>
                    {sampleEmailData.audienceSegments.map((segment) => (
                      <option key={segment.id} value={segment.id}>
                        {segment.entity_name} ({segment.segment_size.toLocaleString()} contacts)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject Line</label>
                  <Input
                    placeholder="🚀 Don't miss out on our summer sale!"
                    value={campaignData.subject_line}
                    onChange={(e) => setCampaignData({ ...campaignData, subject_line: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Preview Text</label>
                  <Input
                    placeholder="Save up to 50% on all products..."
                    value={campaignData.preview_text}
                    onChange={(e) => setCampaignData({ ...campaignData, preview_text: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Template</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    value={campaignData.template_id}
                    onChange={(e) => setCampaignData({ ...campaignData, template_id: e.target.value })}
                  >
                    <option value="">Choose a template</option>
                    {sampleEmailData.campaignTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.entity_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Schedule Send (Optional)</label>
                  <Input
                    type="datetime-local"
                    value={campaignData.scheduled_send_date}
                    onChange={(e) => setCampaignData({ ...campaignData, scheduled_send_date: e.target.value })}
                  />
                  <p className="text-xs text-slate-500 mt-1">Leave empty to create as draft</p>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingCampaign(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCampaign}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Campaign
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hera-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Campaigns</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {sampleEmailData.campaigns.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <PlayCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hera-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Leads Generated</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {sampleEmailData.campaigns.reduce((sum, c) => sum + c.leads_generated, 0)}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+18% this month</span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hera-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Conversion Rate</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {(sampleEmailData.campaigns.reduce((sum, c) => sum + c.conversion_rate, 0) / 
                     sampleEmailData.campaigns.length).toFixed(1)}%
                  </p>
                  <p className="text-sm text-slate-500">Industry avg: 1.8%</p>
                </div>
                <MousePointer className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hera-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Scheduled Campaigns</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {sampleEmailData.campaigns.filter(c => c.status === 'scheduled').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign List */}
        <Card className="hera-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Megaphone className="h-5 w-5 text-blue-500 mr-2" />
              All Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleEmailData.campaigns.map((campaign) => {
                const TypeIcon = getCampaignTypeIcon(campaign.campaign_type)
                return (
                  <div 
                    key={campaign.id} 
                    className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
                      selectedCampaign === campaign.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200'
                    }`}
                    onClick={() => setSelectedCampaign(selectedCampaign === campaign.id ? null : campaign.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <TypeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="font-medium text-slate-900">{campaign.entity_name}</h4>
                            <Badge className={`text-xs ${getCampaignStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <span>Type: {campaign.campaign_type}</span>
                            <span>Audience: {campaign.target_audience}</span>
                            <span>Recipients: {campaign.total_recipients.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm">
                        {campaign.status === 'sent' && (
                          <>
                            <div className="text-center">
                              <p className="font-semibold text-green-600">{campaign.open_rate}%</p>
                              <p className="text-slate-500">Open Rate</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-blue-600">{campaign.click_rate}%</p>
                              <p className="text-slate-500">Click Rate</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-purple-600">{campaign.leads_generated}</p>
                              <p className="text-slate-500">Leads</p>
                            </div>
                          </>
                        )}
                        
                        {campaign.status === 'scheduled' && (
                          <div className="text-center">
                            <p className="font-semibold text-amber-600">
                              {campaign.scheduled_send_date ? formatDate(campaign.scheduled_send_date) : 'Draft'}
                            </p>
                            <p className="text-slate-500">Send Date</p>
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          {campaign.status === 'scheduled' && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Send Now
                            </Button>
                          )}
                          {campaign.status === 'active' && (
                            <Button size="sm" variant="outline">
                              <PauseCircle className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Campaign Details */}
                    {selectedCampaign === campaign.id && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h5 className="font-medium text-slate-900 mb-2">Campaign Details</h5>
                            <div className="space-y-2 text-sm text-slate-600">
                              <div>Created: {formatDate(campaign.created_at)}</div>
                              <div>Code: {campaign.entity_code}</div>
                              <div>Type: {campaign.campaign_type}</div>
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-slate-900 mb-2">Performance</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Sent:</span>
                                <span className="font-medium">{campaign.emails_sent.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Delivered:</span>
                                <span className="font-medium">{campaign.emails_delivered.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Opened:</span>
                                <span className="font-medium">{campaign.emails_opened.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Clicked:</span>
                                <span className="font-medium">{campaign.emails_clicked.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-slate-900 mb-2">Lead Conversion</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Leads Generated:</span>
                                <span className="font-semibold text-green-600">{campaign.leads_generated}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Conversion Rate:</span>
                                <span className="font-medium">{campaign.conversion_rate}%</span>
                              </div>
                              <div className="p-2 bg-blue-50 rounded mt-3">
                                <p className="text-xs text-blue-900">
                                  <Sparkles className="h-3 w-3 inline mr-1" />
                                  AI Insight: High-performing campaign - consider replicating subject line
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Audience Segments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hera-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users2 className="h-5 w-5 text-emerald-500 mr-2" />
                Audience Segments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleEmailData.audienceSegments.map((segment) => (
                  <div key={segment.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-slate-900">{segment.entity_name}</h4>
                      <p className="text-sm text-slate-600">{segment.segment_size.toLocaleString()} contacts</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {segment.growth_rate}
                        </Badge>
                        <span className="text-sm text-slate-500">Score: {segment.engagement_score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-4 w-full" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Create New Segment
              </Button>
            </CardContent>
          </Card>

          <Card className="hera-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-5 w-5 text-purple-500 mr-2" />
                AI Campaign Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <Sparkles className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Re-engagement Campaign</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Target 1,234 inactive subscribers with a "We miss you" campaign. 
                        Expected +15% reactivation rate.
                      </p>
                      <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700">
                        Create Campaign
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Upsell Opportunity</h4>
                      <p className="text-sm text-green-700 mt-1">
                        High-value customers (892 contacts) show 85% engagement. 
                        Perfect for premium feature promotion.
                      </p>
                      <Button size="sm" className="mt-2 bg-green-600 hover:bg-green-700">
                        Create Campaign
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start">
                    <Target className="h-5 w-5 text-purple-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900">Lead Nurturing Sequence</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Set up a 5-email nurturing sequence for new leads. 
                        Estimated +32% conversion improvement.
                      </p>
                      <Button size="sm" className="mt-2 bg-purple-600 hover:bg-purple-700">
                        Set up Sequence
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <UniversalTourProvider>
      <div className="h-screen bg-slate-50 flex flex-col">
        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 text-yellow-300 mr-2" />
              <span className="font-medium">
                🎯 Progressive Demo - Try our Universal Email System (Authentication required for Resend API setup)
              </span>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              Demo Mode
            </Badge>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center mr-6">
                <Mail className="h-6 w-6 text-blue-600 mr-2" />
                <h1 className="text-2xl font-bold text-slate-900">Universal Email System</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button 
                  variant={activeView.startsWith('inbox') || activeView.startsWith('sent') || activeView.startsWith('draft') ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('inbox')}
                >
                  <Inbox className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button 
                  variant={activeView === 'campaigns' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('campaigns')}
                >
                  <Megaphone className="h-4 w-4 mr-1" />
                  Campaigns
                </Button>
                <Button 
                  variant={activeView === 'analytics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('analytics')}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analytics
                </Button>
                <Button 
                  variant={activeView === 'settings' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('settings')}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                HERA Universal Architecture
              </Badge>
              <Badge variant="outline" className="flex items-center">
                <Key className="h-3 w-3 mr-1" />
                Resend Integration
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {activeView === 'campaigns' ? (
            renderCampaignDashboard()
          ) : activeView === 'analytics' ? (
            renderAnalyticsDashboard()
          ) : activeView === 'settings' ? (
            renderSettingsView()
          ) : (
            <>
              {renderSidebar()}
              {renderEmailList()}
              {renderEmailContent()}
            </>
          )}
        </div>
      </div>
    </UniversalTourProvider>
  )
}