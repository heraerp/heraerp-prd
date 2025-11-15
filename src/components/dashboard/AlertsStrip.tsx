'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { AlertTriangle, FileText, Package, MessageSquare, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { salonClasses } from '@/lib/theme/salon-theme'
import { useClosingStatus } from '@/lib/api/closing'
import { useInventoryAlerts } from '@/lib/api/inventory'
import { useWhatsappFailures } from '@/lib/api/whatsapp'

interface AlertsStripProps {
  organizationId: string
}

export function AlertsStrip({ organizationId }: AlertsStripProps) {
  const [dismissedAlerts, setDismissedAlerts] = React.useState<string[]>([])

  // Fetch various alert sources
  const { data: closingStatus } = useClosingStatus({ organizationId })
  const { data: inventoryAlerts } = useInventoryAlerts({ organizationId })
  const { data: whatsappFailures } = useWhatsappFailures({ organizationId, period: '24h' })

  const alerts = React.useMemo(() => {
    const activeAlerts = []

    // Unposted journal entries
    if (closingStatus?.unposted_count && closingStatus.unposted_count > 0) {
      activeAlerts.push({
        id: 'unposted-je',
        type: 'warning',
        icon: FileText,
        message: `${closingStatus.unposted_count} unposted journal entries`,
        link: '/finance/closing',
        color: 'from-amber-400 to-orange-400'
      })
    }

    // Overdue inventory receipts
    if (inventoryAlerts?.overdue_receipts && inventoryAlerts.overdue_receipts > 0) {
      activeAlerts.push({
        id: 'overdue-inventory',
        type: 'warning',
        icon: Package,
        message: `${inventoryAlerts.overdue_receipts} overdue inventory receipts`,
        link: '/inventory/receipts',
        color: 'from-orange-400 to-rose-400'
      })
    }

    // WhatsApp failures
    if (whatsappFailures?.failed_count && whatsappFailures.failed_count > 0) {
      activeAlerts.push({
        id: 'wa-failures',
        type: 'error',
        icon: MessageSquare,
        message: `${whatsappFailures.failed_count} failed WhatsApp messages`,
        link: '/whatsapp/history?status=failed',
        color: 'from-rose-500 to-red-500'
      })
    }

    return activeAlerts.filter(alert => !dismissedAlerts.includes(alert.id))
  }, [closingStatus, inventoryAlerts, whatsappFailures, dismissedAlerts])

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId])
  }

  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="space-y-2 mb-6">
      {alerts.map(alert => {
        const Icon = alert.icon

        return (
          <Alert
            key={alert.id}
            variant={alert.type === 'error' ? 'destructive' : 'default'}
            className={cn(
              'relative pr-12 border-purple-200/50 dark:border-purple-800/50',
              'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm',
              'shadow-lg shadow-purple-500/10'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg bg-gradient-to-br', alert.color)}>
                <Icon className="h-4 w-4 text-white" />
              </div>

              <AlertDescription className="flex-1">
                <Link
                  href={alert.link}
                  className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-purple-500 rounded ink dark:text-gray-300"
                >
                  {alert.message}
                </Link>
              </AlertDescription>

              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-2 h-6 w-6"
                onClick={() => handleDismiss(alert.id)}
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        )
      })}
    </div>
  )
}
