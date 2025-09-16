'use client'

import React, { useState } from 'react'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/src/components/ui/dialog'
import { Gift, MessageCircle, Users, Send, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatWhatsAppTemplate } from '@/src/lib/salon/whatsapp-templates'
import { whatsAppCampaignService } from '@/src/lib/salon/whatsapp-campaign-service'
import { formatDate } from '@/src/lib/date-utils'
import { differenceInDays, addDays } from 'date-fns'
import { cn } from '@/src/lib/utils'

interface CustomerWhatsAppActionsProps {
  customer: {
    id: string
    name: string
    phone: string
    email?: string
    metadata?: {
      birthday?: string
      last_visit?: string
      total_visits?: number
      favorite_service?: string
      vip_status?: boolean
    }
  }
  organizationId: string
}

export function CustomerWhatsAppActions({
  customer,
  organizationId
}: CustomerWhatsAppActionsProps) {
  const [sendingBirthday, setSendingBirthday] = useState(false)
  const [sendingWinback, setSendingWinback] = useState(false)
  const [showPreview, setShowPreview] = useState<'birthday' | 'winback' | null>(null)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Calculate days since last visit
  const daysSinceLastVisit = (customer.metadata as any)?.last_visit
    ? differenceInDays(new Date(), new Date(customer.metadata.last_visit))
    : null

  // Check if birthday is within 30 days
  const isBirthdayNear = (customer.metadata as any)?.birthday
    ? (() => {
        const today = new Date()
        const birthday = new Date(customer.metadata.birthday)
        birthday.setFullYear(today.getFullYear())
        const daysUntilBirthday = differenceInDays(birthday, today)
        return daysUntilBirthday >= 0 && daysUntilBirthday <= 30
      })()
    : false

  const handleSendBirthdayMessage = async () => {
    setSendingBirthday(true)
    setResult(null)
    try {
      const messageData = {
        to: customer.phone,
        templateName: 'birthday_special',
        parameters: {
          customer_name: customer.name,
          salon_name: 'Hair Talkz Salon',
          birthday_offer: '25% off any service',
          promo_code: `BDAY${customer.id.substr(-4).toUpperCase()}`,
          valid_until: formatDate(addDays(new Date(), 30), 'MMMM d, yyyy')
        }
      }

      // In production, this would send via WhatsApp API
      console.log('📱 Sending birthday message:', messageData)

      setResult({
        type: 'success',
        message: 'Birthday special sent successfully!'
      })
      setShowPreview(null)
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Failed to send birthday message'
      })
    } finally {
      setSendingBirthday(false)
    }
  }

  const handleSendWinbackMessage = async () => {
    setSendingWinback(true)
    setResult(null)
    try {
      const messageData = {
        to: customer.phone,
        templateName: 'winback_offer',
        parameters: {
          customer_name: customer.name,
          last_visit_days: daysSinceLastVisit?.toString() || '90',
          salon_name: 'Hair Talkz Salon',
          special_offer: '30% off your comeback visit',
          favorite_service: (customer.metadata as any)?.favorite_service || 'your favorite service',
          valid_until: formatDate(addDays(new Date(), 30), 'MMMM d, yyyy')
        }
      }

      // In production, this would send via WhatsApp API
      console.log('📱 Sending win-back message:', messageData)

      setResult({
        type: 'success',
        message: 'Win-back offer sent successfully!'
      })
      setShowPreview(null)
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Failed to send win-back message'
      })
    } finally {
      setSendingWinback(false)
    }
  }

  const getBirthdayPreview = () => {
    return formatWhatsAppTemplate('birthday_special', {
      customer_name: customer.name,
      salon_name: 'Hair Talkz Salon',
      birthday_offer: '25% off any service',
      promo_code: `BDAY${customer.id.substr(-4).toUpperCase()}`,
      valid_until: formatDate(addDays(new Date(), 30), 'MMMM d, yyyy')
    })
  }

  const getWinbackPreview = () => {
    return formatWhatsAppTemplate('winback_offer', {
      customer_name: customer.name,
      last_visit_days: daysSinceLastVisit?.toString() || '90',
      salon_name: 'Hair Talkz Salon',
      special_offer: '30% off your comeback visit',
      favorite_service: (customer.metadata as any)?.favorite_service || 'your favorite service',
      valid_until: formatDate(addDays(new Date(), 30), 'MMMM d, yyyy')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="w-5 h-5 text-green-500" />
        <span className="text-sm font-semibold !text-gray-100 dark:!text-foreground">
          WhatsApp Actions
        </span>
      </div>

      {result && (
        <Alert
          className={cn('mb-4', result.type === 'success' ? 'border-green-500' : 'border-red-500')}
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

      {/* Birthday Campaign */}
      {(customer.metadata as any)?.birthday && (
        <Card className="p-4 bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-pink-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold !text-gray-100 dark:!text-foreground mb-1">
                  Birthday Special
                </h4>
                <p className="text-xs !text-muted-foreground dark:!text-muted-foreground">
                  Birthday: {formatDate(new Date(customer.metadata.birthday), 'MMMM d')}
                </p>
                {isBirthdayNear && (
                  <Badge className="mt-2 bg-pink-100 text-pink-700 dark:bg-pink-800/30 dark:text-pink-300">
                    Birthday coming soon!
                  </Badge>
                )}
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-pink-300 hover:bg-pink-100 dark:border-pink-700 dark:hover:bg-pink-800/30"
                  onClick={() => setShowPreview('birthday')}
                >
                  <Send className="w-4 h-4 mr-1" />
                  Send
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Birthday Special</DialogTitle>
                  <DialogDescription>Preview the birthday message before sending</DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                  <div className="bg-muted dark:bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm !text-gray-700 dark:!text-gray-300 font-mono">
                      {getBirthdayPreview()}
                    </pre>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowPreview(null)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendBirthdayMessage}
                      disabled={sendingBirthday}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-foreground"
                    >
                      {sendingBirthday ? 'Sending...' : 'Send Birthday Special'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      )}

      {/* Win-back Campaign */}
      {daysSinceLastVisit && daysSinceLastVisit > 60 && (
        <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold !text-gray-100 dark:!text-foreground mb-1">
                  Win-back Campaign
                </h4>
                <p className="text-xs !text-muted-foreground dark:!text-muted-foreground">
                  Last visit: {daysSinceLastVisit} days ago
                </p>
                <Badge className="mt-2 bg-orange-100 text-orange-700 dark:bg-orange-800/30 dark:text-orange-300">
                  Inactive customer
                </Badge>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-300 hover:bg-orange-100 dark:border-orange-700 dark:hover:bg-orange-800/30"
                  onClick={() => setShowPreview('winback')}
                >
                  <Send className="w-4 h-4 mr-1" />
                  Send
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Win-back Offer</DialogTitle>
                  <DialogDescription>Preview the win-back message before sending</DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                  <div className="bg-muted dark:bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm !text-gray-700 dark:!text-gray-300 font-mono">
                      {getWinbackPreview()}
                    </pre>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowPreview(null)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendWinbackMessage}
                      disabled={sendingWinback}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-foreground"
                    >
                      {sendingWinback ? 'Sending...' : 'Send Win-back Offer'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Schedule Follow-up
        </Button>
        <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          Custom Message
        </Button>
      </div>
    </div>
  )
}
