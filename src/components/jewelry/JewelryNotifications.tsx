'use client'

import { useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Bell, Diamond, Scale, Crown, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const sampleNotifications = [
  {
    id: 1,
    title: 'High-value appraisal completed',
    message: 'Diamond necklace appraised at $45,000',
    time: '5 minutes ago',
    type: 'appraisal',
    icon: Scale
  },
  {
    id: 2,
    title: 'VIP customer inquiry',
    message: 'Mrs. Johnson is asking about custom engagement rings',
    time: '15 minutes ago',
    type: 'vip',
    icon: Crown
  },
  {
    id: 3,
    title: 'Inventory alert',
    message: 'Low stock: Premium diamond studs (2 remaining)',
    time: '1 hour ago',
    type: 'inventory',
    icon: Diamond
  },
  {
    id: 4,
    title: 'Appointment reminder',
    message: 'Custom design consultation at 3:00 PM',
    time: '2 hours ago',
    type: 'appointment',
    icon: Clock
  }
]

export function JewelryNotifications() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appraisal':
        return 'border-l-yellow-500 bg-yellow-500/5'
      case 'vip':
        return 'border-l-purple-500 bg-purple-500/5'
      case 'inventory':
        return 'border-l-blue-500 bg-blue-500/5'
      case 'appointment':
        return 'border-l-green-500 bg-green-500/5'
      default:
        return 'border-l-gray-500 bg-gray-500/5'
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        ref={triggerRef}
        className="relative jewelry-glass-btn p-2 rounded-lg jewelry-text-luxury hover:jewelry-text-gold transition-colors focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
        <span className="sr-only">Notifications</span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="jewelry-glass-dropdown rounded-xl shadow-2xl w-96 p-4 will-change-[opacity,transform] border border-yellow-500/20"
          sideOffset={8}
          align="end"
          onCloseAutoFocus={() => triggerRef.current?.focus()}
        >
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold jewelry-text-luxury flex items-center gap-2">
                  <Bell className="h-4 w-4 jewelry-text-gold" />
                  Notifications
                </h3>
                <span className="text-xs jewelry-text-muted">{sampleNotifications.length} new</span>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto" role="region" aria-live="polite">
                {sampleNotifications.map(notification => {
                  const Icon = notification.icon
                  return (
                    <motion.div
                      key={notification.id}
                      className={`p-3 rounded-lg border-l-4 transition-all hover:bg-white/5 cursor-pointer ${getNotificationColor(notification.type)}`}
                      whileHover={prefersReducedMotion ? {} : { x: 2 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="jewelry-crown-glow p-1.5 rounded-lg mt-0.5">
                          <Icon className="h-4 w-4 jewelry-text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium jewelry-text-luxury">
                            {notification.title}
                          </p>
                          <p className="text-sm jewelry-text-muted mt-1">{notification.message}</p>
                          <p className="text-xs jewelry-text-muted mt-2">{notification.time}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <div className="pt-2 border-t border-yellow-500/20">
                <button className="w-full text-sm jewelry-text-gold hover:jewelry-text-luxury transition-colors font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
