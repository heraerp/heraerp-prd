'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Receipt, CreditCard, MessageCircle, Send, AlertCircle, CheckCircle2, Clock, DollarSign } from 'lucide-react'
import { formatWhatsAppTemplate } from '@/lib/salon/whatsapp-templates'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface PaymentWhatsAppActionsProps {
  payment: {
    id: string
    amount: number
    date: string
    customer_name: string
    customer_phone?: string
    payment_method: string
    transaction_id: string
    services?: string
    status?: 'paid' | 'pending' | 'overdue'
  }
  organizationId: string
  onSendConfirmation?: () => void
  onSendReminder?: () => void
}

export function PaymentWhatsAppActions({ 
  payment, 
  organizationId, 
  onSendConfirmation,
  onSendReminder 
}: PaymentWhatsAppActionsProps) {
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState<'confirmation' | 'reminder' | null>(null)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSendConfirmation = async () => {
    if (!payment.customer_phone) {
      setResult({
        type: 'error',
        message: 'Customer phone number not available'
      })
      return
    }

    setSending(true)
    setResult(null)
    try {
      const messageData = {
        to: payment.customer_phone,
        templateName: 'payment_confirmation',
        parameters: {
          customer_name: payment.customer_name,
          amount: `AED ${payment.amount.toFixed(2)}`,
          payment_method: payment.payment_method,
          transaction_id: payment.transaction_id,
          services: payment.services || 'Salon Services',
          payment_date: format(new Date(payment.date), 'MMMM d, yyyy'),
          receipt_link: `https://salon.heraerp.com/receipt/${payment.id}`,
          salon_name: 'Hair Talkz Salon'
        }
      }

      // In production, this would send via WhatsApp API
      console.log('📱 Sending payment confirmation:', messageData)
      
      setResult({
        type: 'success',
        message: 'Payment confirmation sent successfully!'
      })
      setShowPreview(null)
      onSendConfirmation?.()
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Failed to send payment confirmation'
      })
    } finally {
      setSending(false)
    }
  }

  const handleSendReminder = async () => {
    if (!payment.customer_phone) {
      setResult({
        type: 'error',
        message: 'Customer phone number not available'
      })
      return
    }

    setSending(true)
    setResult(null)
    try {
      const messageData = {
        to: payment.customer_phone,
        templateName: 'payment_reminder',
        parameters: {
          customer_name: payment.customer_name,
          amount_due: `AED ${payment.amount.toFixed(2)}`,
          service_date: format(new Date(payment.date), 'MMMM d, yyyy'),
          services: payment.services || 'Salon Services',
          payment_link: `https://salon.heraerp.com/pay/${payment.id}`,
          salon_phone: '+971-4-123-4567',
          salon_name: 'Hair Talkz Salon'
        }
      }

      // In production, this would send via WhatsApp API
      console.log('📱 Sending payment reminder:', messageData)
      
      setResult({
        type: 'success',
        message: 'Payment reminder sent successfully!'
      })
      setShowPreview(null)
      onSendReminder?.()
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Failed to send payment reminder'
      })
    } finally {
      setSending(false)
    }
  }

  const getConfirmationPreview = () => {
    return formatWhatsAppTemplate('payment_confirmation', {
      customer_name: payment.customer_name,
      amount: `AED ${payment.amount.toFixed(2)}`,
      payment_method: payment.payment_method,
      transaction_id: payment.transaction_id,
      services: payment.services || 'Salon Services',
      payment_date: format(new Date(payment.date), 'MMMM d, yyyy'),
      receipt_link: `https://salon.heraerp.com/receipt/${payment.id}`,
      salon_name: 'Hair Talkz Salon'
    })
  }

  const getReminderPreview = () => {
    return formatWhatsAppTemplate('payment_reminder', {
      customer_name: payment.customer_name,
      amount_due: `AED ${payment.amount.toFixed(2)}`,
      service_date: format(new Date(payment.date), 'MMMM d, yyyy'),
      services: payment.services || 'Salon Services',
      payment_link: `https://salon.heraerp.com/pay/${payment.id}`,
      salon_phone: '+971-4-123-4567',
      salon_name: 'Hair Talkz Salon'
    })
  }

  return (
    <div className="space-y-3">
      {result && (
        <Alert className={cn(
          "mb-3",
          result.type === 'success' ? "border-green-500" : "border-red-500"
        )}>
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

      {/* Payment Confirmation */}
      {payment.status === 'paid' && (
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-green-500" />
              <div>
                <h4 className="text-sm font-semibold !text-gray-900 dark:!text-white">
                  Send Receipt
                </h4>
                <p className="text-xs !text-gray-600 dark:!text-gray-400">
                  Payment confirmation & digital receipt
                </p>
              </div>
            </div>
            <Dialog open={showPreview === 'confirmation'} onOpenChange={(open) => !open && setShowPreview(null)}>
              <Button
                size="sm"
                variant="outline"
                className="border-green-300 hover:bg-green-100 dark:border-green-700 dark:hover:bg-green-800/30"
                onClick={() => setShowPreview('confirmation')}
                disabled={!payment.customer_phone}
              >
                <Send className="w-4 h-4 mr-1" />
                Send
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Payment Confirmation</DialogTitle>
                  <DialogDescription>
                    Preview the payment confirmation message
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm !text-gray-700 dark:!text-gray-300 font-mono">
                      {getConfirmationPreview()}
                    </pre>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowPreview(null)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendConfirmation}
                      disabled={sending}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      {sending ? 'Sending...' : 'Send Confirmation'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      )}

      {/* Payment Reminder */}
      {(payment.status === 'pending' || payment.status === 'overdue') && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <h4 className="text-sm font-semibold !text-gray-900 dark:!text-white">
                  Payment Reminder
                </h4>
                <p className="text-xs !text-gray-600 dark:!text-gray-400">
                  Amount due: AED {payment.amount.toFixed(2)}
                </p>
                {payment.status === 'overdue' && (
                  <Badge className="mt-1 bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
            <Dialog open={showPreview === 'reminder'} onOpenChange={(open) => !open && setShowPreview(null)}>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-800/30"
                onClick={() => setShowPreview('reminder')}
                disabled={!payment.customer_phone}
              >
                <Send className="w-4 h-4 mr-1" />
                Send
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Payment Reminder</DialogTitle>
                  <DialogDescription>
                    Preview the payment reminder message
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm !text-gray-700 dark:!text-gray-300 font-mono">
                      {getReminderPreview()}
                    </pre>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowPreview(null)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendReminder}
                      disabled={sending}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      {sending ? 'Sending...' : 'Send Reminder'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="flex items-center justify-between text-xs !text-gray-600 dark:!text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            WhatsApp enabled
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            AED 0.05/msg
          </span>
        </div>
      </div>
    </div>
  )
}

export { PaymentWhatsAppActions }