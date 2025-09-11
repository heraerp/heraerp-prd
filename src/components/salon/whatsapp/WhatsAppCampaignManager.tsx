'use client'

import React, { useState } from 'react'
import { MessageCircle, Send, Users, Calendar, Gift, DollarSign, AlertCircle, ChevronRight, Filter, BarChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/date-utils'

interface Campaign {
  id: string
  name: string
  type: 'birthday' | 'winback' | 'promotion' | 'post_service' | 'payment' | 'emergency'
  status: 'draft' | 'scheduled' | 'active' | 'completed'
  targetAudience: string
  totalRecipients: number
  sent: number
  failed: number
  scheduled?: Date
  lastRun?: Date
  cost: number
}

interface WhatsAppCampaignManagerProps {
  organizationId?: string
  onCampaignCreate?: (campaign: any) => void
  onCampaignRun?: (campaignId: string) => void
}

export function WhatsAppCampaignManager({ organizationId, onCampaignCreate, onCampaignRun }: WhatsAppCampaignManagerProps) {
  const [selectedCampaignType, setSelectedCampaignType] = useState<string>('all')
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Birthday Special - 25% Off',
      type: 'birthday',
      status: 'active',
      targetAudience: 'Birthday customers this month',
      totalRecipients: 45,
      sent: 12,
      failed: 0,
      lastRun: new Date(Date.now() - 86400000),
      cost: 0.60
    },
    {
      id: '2',
      name: 'Win Back Campaign - 30% Off',
      type: 'winback',
      status: 'scheduled',
      targetAudience: 'Inactive 90+ days',
      totalRecipients: 128,
      sent: 0,
      failed: 0,
      scheduled: new Date(Date.now() + 86400000 * 3),
      cost: 0
    },
    {
      id: '3',
      name: 'Post-Service Follow-up',
      type: 'post_service',
      status: 'active',
      targetAudience: 'Automatic after service',
      totalRecipients: 324,
      sent: 298,
      failed: 6,
      lastRun: new Date(),
      cost: 14.90
    },
    {
      id: '4',
      name: 'Payment Confirmations',
      type: 'payment',
      status: 'active',
      targetAudience: 'After payment',
      totalRecipients: 567,
      sent: 567,
      failed: 0,
      lastRun: new Date(),
      cost: 28.35
    }
  ])

  const campaignTypes = {
    birthday: { label: 'Birthday', icon: Gift, color: 'text-pink-500' },
    winback: { label: 'Win-back', icon: Users, color: 'text-orange-500' },
    promotion: { label: 'Promotion', icon: Gift, color: 'text-purple-500' },
    post_service: { label: 'Follow-up', icon: MessageCircle, color: 'text-blue-500' },
    payment: { label: 'Payment', icon: DollarSign, color: 'text-green-500' },
    emergency: { label: 'Emergency', icon: AlertCircle, color: 'text-red-500' }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
      case 'scheduled':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Scheduled</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">Completed</Badge>
      default:
        return <Badge>Draft</Badge>
    }
  }

  const filteredCampaigns = selectedCampaignType === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.type === selectedCampaignType)

  const totalStats = {
    totalSent: campaigns.reduce((sum, c) => sum + c.sent, 0),
    totalFailed: campaigns.reduce((sum, c) => sum + c.failed, 0),
    totalCost: campaigns.reduce((sum, c) => sum + c.cost, 0),
    activeCampaigns: campaigns.filter(c => c.status === 'active').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold !text-gray-900 dark:!text-white flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-500" />
            WhatsApp Campaign Manager
          </h2>
          <p className="text-sm !text-gray-600 dark:!text-gray-400">
            Automated marketing and notification campaigns
          </p>
        </div>
        <Button
          onClick={() => onCampaignCreate?.({ type: 'new' })}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
        >
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-gray-600 dark:!text-gray-400">Messages Sent</p>
              <p className="text-2xl font-bold !text-gray-900 dark:!text-white">
                {totalStats.totalSent.toLocaleString()}
              </p>
            </div>
            <Send className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-gray-600 dark:!text-gray-400">Failed</p>
              <p className="text-2xl font-bold !text-gray-900 dark:!text-white">
                {totalStats.totalFailed}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-gray-600 dark:!text-gray-400">Total Cost</p>
              <p className="text-2xl font-bold !text-gray-900 dark:!text-white">
                AED {totalStats.totalCost.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm !text-gray-600 dark:!text-gray-400">Active Campaigns</p>
              <p className="text-2xl font-bold !text-gray-900 dark:!text-white">
                {totalStats.activeCampaigns}
              </p>
            </div>
            <BarChart className="w-8 h-8 text-purple-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Campaign Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-400" />
        <Select value={selectedCampaignType} onValueChange={setSelectedCampaignType}>
          <SelectTrigger className="w-48 bg-gray-800/50 border-gray-700">
            <SelectValue placeholder="Filter campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {Object.entries(campaignTypes).map(([key, type]) => (
              <SelectItem key={key} value={key}>
                {type.label} Campaigns
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.map(campaign => {
          const campaignType = campaignTypes[campaign.type]
          const Icon = campaignType.icon
          const successRate = campaign.sent > 0 
            ? ((campaign.sent - campaign.failed) / campaign.sent * 100).toFixed(1) 
            : '0'

          return (
            <Card
              key={campaign.id}
              className="p-6 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer"
              style={{
                backdropFilter: 'blur(10px) saturate(120%)',
                WebkitBackdropFilter: 'blur(10px) saturate(120%)'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gray-800",
                    campaignType.color.replace('text-', 'bg-').replace('500', '500/20')
                  )}>
                    <Icon className={cn("w-6 h-6", campaignType.color)} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg !text-gray-900 dark:!text-white">
                        {campaign.name}
                      </h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    
                    <p className="text-sm !text-gray-600 dark:!text-gray-400 mb-3">
                      {campaign.targetAudience}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="!text-gray-700 dark:!text-gray-300">
                          {campaign.totalRecipients} recipients
                        </span>
                      </div>
                      
                      {campaign.sent > 0 && (
                        <div className="flex items-center gap-2">
                          <Send className="w-4 h-4 text-gray-400" />
                          <span className="!text-gray-700 dark:!text-gray-300">
                            {campaign.sent} sent ({successRate}% success)
                          </span>
                        </div>
                      )}
                      
                      {campaign.cost > 0 && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="!text-gray-700 dark:!text-gray-300">
                            AED {campaign.cost.toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {campaign.scheduled && campaign.status === 'scheduled' && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="!text-gray-700 dark:!text-gray-300">
                            Scheduled: {formatDate(campaign.scheduled, 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      
                      {campaign.lastRun && campaign.status === 'active' && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="!text-gray-700 dark:!text-gray-300">
                            Last run: {formatDate(campaign.lastRun, 'MMM d, h:mm a')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCampaignRun?.(campaign.id)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredCampaigns.length === 0 && (
        <Card className="p-12 bg-gray-800/50 border-gray-700 text-center">
          <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-lg !text-gray-600 dark:!text-gray-400">
            No {selectedCampaignType === 'all' ? '' : campaignTypes[selectedCampaignType]?.label.toLowerCase()} campaigns found
          </p>
          <p className="text-sm !text-gray-500 dark:!text-gray-500 mt-2">
            Create your first campaign to start engaging with customers
          </p>
          <Button
            onClick={() => onCampaignCreate?.({ type: selectedCampaignType })}
            className="mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            Create Campaign
          </Button>
        </Card>
      )}
    </div>
  )
}