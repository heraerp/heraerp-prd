'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sparkles,
  MessageCircle,
  Send,
  AlertCircle,
  CheckCircle2,
  Users,
  Gift,
  Rocket
} from 'lucide-react'
import { formatWhatsAppTemplate } from '@/lib/salon/whatsapp-templates'
import { formatDate } from '@/lib/date-utils'
import { addDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface ServiceWhatsAppActionsProps {
  service: {
    id: string
    name: string
    price: number
    duration: number
    description?: string
    category?: string
    isNew?: boolean
  }
  organizationId: string
  onCampaignSent?: () => void
}

export function ServiceWhatsAppActions({
  service,
  organizationId,
  onCampaignSent
}: ServiceWhatsAppActionsProps) {
  const [sending, setSending] = useState(false)
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Campaign configuration
  const [campaignConfig, setCampaignConfig] = useState({
    launchOffer: '20% off for first 50 customers',
    launchDate: formatDate(addDays(new Date(), 7), 'MMMM d, yyyy'),
    targetAudience: 'all' as 'all' | 'vip' | 'specific',
    estimatedRecipients: 324
  })

  const handleSendNewServiceCampaign = async () => {
    setSending(true)
    setResult(null)
    try {
      // In production, this would:
      // 1. Get customer list based on targetAudience
      // 2. Send WhatsApp messages via API
      // 3. Track campaign in universal_transactions

      const campaignData = {
        campaignType: 'new_service_launch',
        templateName: 'new_service_launch',
        parameters: {
          service_name: service.name,
          intro_price: `AED ${service.price.toFixed(2)}`,
          duration: `${service.duration} minutes`,
          launch_offer: campaignConfig.launchOffer,
          launch_date: campaignConfig.launchDate,
          salon_name: 'Hair Talkz Salon'
        },
        targetAudience: campaignConfig.targetAudience,
        estimatedRecipients: campaignConfig.estimatedRecipients
      }

      console.log('🚀 Launching new service campaign:', campaignData)

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      setResult({
        type: 'success',
        message: `Campaign sent to ${campaignConfig.estimatedRecipients} customers!`
      })
      setShowCampaignDialog(false)
      onCampaignSent?.()
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Failed to launch campaign'
      })
    } finally {
      setSending(false)
    }
  }

  const getCampaignPreview = () => {
    return formatWhatsAppTemplate('new_service_launch', {
      customer_name: 'Sarah Johnson',
      service_name: service.name,
      intro_price: `AED ${service.price.toFixed(2)}`,
      duration: `${service.duration} minutes`,
      launch_offer: campaignConfig.launchOffer,
      launch_date: campaignConfig.launchDate,
      salon_name: 'Hair Talkz Salon'
    })
  }

  const estimateRecipients = (audience: string) => {
    const estimates = {
      all: 324,
      vip: 48,
      specific: 100
    }
    return estimates[audience] || 0
  }

  return (
    <div className="space-y-3">
      {result && (
        <Alert
          className={cn('mb-3', result.type === 'success' ? 'border-green-500' : 'border-red-500')}
        >
          <AlertDescription className="flex items-center gap-2">
            {result.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            {result.message}
          </AlertDescription>
        </Alert>
      )}

      {/* New Service Launch Campaign */}
      {service.isNew && (
        <Card className="p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Rocket className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold !text-gray-100 dark:!text-foreground flex items-center gap-2">
                  New Service Launch
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-800/30 dark:text-purple-300">
                    NEW
                  </Badge>
                </h4>
                <p className="text-xs !text-muted-foreground dark:!text-muted-foreground">
                  Announce this service to your customers
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-purple-300 hover:bg-purple-100 dark:border-purple-700 dark:hover:bg-purple-800/30"
              onClick={() => setShowCampaignDialog(true)}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Launch
            </Button>
          </div>
        </Card>
      )}

      {/* Service Update Notifications */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs flex items-center gap-1 justify-start"
          disabled
        >
          <Gift className="w-3 h-3" />
          Service Promo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs flex items-center gap-1 justify-start"
          disabled
        >
          <Users className="w-3 h-3" />
          Target Clients
        </Button>
      </div>

      {/* Campaign Configuration Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Launch New Service Campaign</DialogTitle>
            <DialogDescription>Configure and preview your WhatsApp announcement</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Service Details */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Service Details</Label>
              <div className="bg-muted dark:bg-muted p-3 rounded-lg space-y-1">
                <p className="text-sm font-semibold !text-gray-100 dark:!text-foreground">
                  {service.name}
                </p>
                <p className="text-xs !text-muted-foreground dark:!text-muted-foreground">
                  Price: AED {service.price} • Duration: {service.duration} minutes
                </p>
              </div>
            </div>

            {/* Launch Configuration */}
            <div className="space-y-2">
              <Label htmlFor="launch-offer">Launch Offer</Label>
              <Input
                id="launch-offer"
                value={campaignConfig.launchOffer}
                onChange={e =>
                  setCampaignConfig(prev => ({ ...prev, launchOffer: e.target.value }))
                }
                placeholder="e.g., 20% off for first 50 customers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="launch-date">Launch Date</Label>
              <Input
                id="launch-date"
                value={campaignConfig.launchDate}
                onChange={e => setCampaignConfig(prev => ({ ...prev, launchDate: e.target.value }))}
                placeholder="September 15, 2025"
              />
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <div className="grid grid-cols-3 gap-2">
                {['all', 'vip', 'specific'].map(audience => (
                  <Button
                    key={audience}
                    variant={campaignConfig.targetAudience === audience ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCampaignConfig(prev => ({
                        ...prev,
                        targetAudience: audience as any,
                        estimatedRecipients: estimateRecipients(audience)
                      }))
                    }}
                    className="capitalize"
                  >
                    {audience === 'all'
                      ? 'All Customers'
                      : audience === 'vip'
                        ? 'VIP Only'
                        : 'Specific Group'}
                  </Button>
                ))}
              </div>
              <p className="text-xs !text-muted-foreground dark:!text-muted-foreground">
                Estimated recipients: {campaignConfig.estimatedRecipients} customers
              </p>
            </div>

            {/* Message Preview */}
            <div className="space-y-2">
              <Label>Message Preview</Label>
              <div className="bg-muted dark:bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-xs !text-gray-700 dark:!text-gray-300 font-mono">
                  {getCampaignPreview()}
                </pre>
              </div>
            </div>

            {/* Cost Estimate */}
            <Alert className="border-blue-200 dark:border-blue-800">
              <AlertDescription className="text-sm">
                <div className="flex items-center justify-between">
                  <span>Estimated campaign cost:</span>
                  <span className="font-semibold">
                    AED {(campaignConfig.estimatedRecipients * 0.05).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs !text-muted-foreground dark:!text-muted-foreground mt-1">
                  {campaignConfig.estimatedRecipients} messages × AED 0.05 per message
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendNewServiceCampaign}
              disabled={sending}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-foreground"
            >
              {sending ? (
                <>
                  <MessageCircle className="w-4 h-4 mr-2 animate-pulse" />
                  Sending to {campaignConfig.estimatedRecipients} customers...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Launch Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
