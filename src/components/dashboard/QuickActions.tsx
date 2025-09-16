'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Calendar,
  CreditCard,
  MessageSquare,
  Receipt,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'

interface QuickActionsProps {
  organizationId: string
}

export function QuickActions({ organizationId }: QuickActionsProps) {
  const router = useRouter()

  const actions = [
    {
      title: 'New Appointment',
      icon: Calendar,
      color: 'from-violet-500 to-violet-600',
      href: '/appointments/new',
      description: 'Book a new appointment'
    },
    {
      title: 'Open POS',
      icon: CreditCard,
      color: 'from-pink-500 to-pink-600',
      href: '/pos/sale',
      description: 'Process a sale'
    },
    {
      title: 'Send WhatsApp Campaign',
      icon: MessageSquare,
      color: 'from-emerald-500 to-emerald-600',
      href: '/whatsapp/templates',
      description: 'Message customers'
    },
    {
      title: 'Add Expense',
      icon: Receipt,
      color: 'from-orange-500 to-orange-600',
      href: '/reports/finance/pnl?mode=add-expense',
      description: 'Record expense'
    }
  ]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            
            return (
              <Link
                key={index}
                href={action.href}
                className="group focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg"
              >
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3 px-4 hover:shadow-md transition-all group-hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg bg-gradient-to-br",
                      action.color
                    )}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">
                        {action.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}