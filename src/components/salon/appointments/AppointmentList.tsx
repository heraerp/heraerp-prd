'use client'

import React, { useState } from 'react'
import { Calendar, Clock, User, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { WhatsAppNotificationBadge, WhatsAppNotificationHistory } from './WhatsAppNotificationBadge'

interface Appointment {
  id: string
  customerName: string
  serviceName: string
  staffName: string
  appointmentDate: Date
  appointmentTime: string
  duration: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  price: number
  notes?: string
}

interface AppointmentListProps {
  appointments: Appointment[]
  onConfirm: (id: string) => void
  onCancel: (id: string) => void
  loading?: boolean
}

export function AppointmentList({ appointments, onConfirm, onCancel, loading }: AppointmentListProps) {
  const [showNotificationHistory, setShowNotificationHistory] = useState<string | null>(null)
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
    }
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(31, 41, 55, 0.85) 0%, 
              rgba(17, 24, 39, 0.9) 100%
            )
          `,
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 4px 16px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `
        }}
      >
        <div className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-lg !text-gray-600 dark:!text-gray-400">No appointments found</p>
          <p className="text-sm !text-gray-500 dark:!text-gray-500 mt-2">Create your first appointment to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(31, 41, 55, 0.85) 0%, 
                rgba(17, 24, 39, 0.9) 100%
              )
            `,
            backdropFilter: 'blur(20px) saturate(120%)',
            WebkitBackdropFilter: 'blur(20px) saturate(120%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.5),
              0 4px 16px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.05)
            `
          }}
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg !text-gray-900 dark:!text-white">
                      {appointment.customerName}
                    </h3>
                    <p className="text-sm !text-gray-600 dark:!text-gray-400">
                      {appointment.serviceName}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn("ml-auto", getStatusStyle(appointment.status))}
                  >
                    <span className="flex items-center gap-1">
                      {getStatusIcon(appointment.status)}
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm !text-gray-700 dark:!text-gray-300">
                      {format(appointment.appointmentDate, 'MMMM d, yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm !text-gray-700 dark:!text-gray-300">
                      {appointment.appointmentTime} ({appointment.duration} min)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm !text-gray-700 dark:!text-gray-300">
                      {appointment.staffName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-semibold !text-gray-900 dark:!text-white">
                      AED {appointment.price.toFixed(2)}
                    </span>
                  </div>

                  {appointment.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCancel(appointment.id)}
                        className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onConfirm(appointment.id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                        disabled={loading}
                      >
                        Confirm
                      </Button>
                    </div>
                  )}
                </div>

                {appointment.notes && (
                  <div className="mt-3 p-3 rounded-lg bg-gray-800/50">
                    <p className="text-sm !text-gray-600 dark:!text-gray-400">
                      <span className="font-medium">Notes:</span> {appointment.notes}
                    </p>
                  </div>
                )}

                {/* WhatsApp Notifications */}
                {appointment.status === 'confirmed' && (
                  <div className="mt-3 p-3 rounded-lg bg-green-900/20 border border-green-800/30">
                    <WhatsAppNotificationBadge
                      notifications={[
                        {
                          id: `${appointment.id}-confirmation`,
                          type: 'confirmation',
                          status: 'sent',
                          sentAt: new Date(),
                          phoneNumber: '+971501234567' // This would come from customer data
                        }
                      ]}
                      onViewHistory={() => setShowNotificationHistory(appointment.id)}
                    />
                  </div>
                )}
                
                {appointment.status === 'cancelled' && (
                  <div className="mt-3 p-3 rounded-lg bg-red-900/20 border border-red-800/30">
                    <WhatsAppNotificationBadge
                      notifications={[
                        {
                          id: `${appointment.id}-cancellation`,
                          type: 'cancellation',
                          status: 'sent',
                          sentAt: new Date(),
                          phoneNumber: '+971501234567'
                        }
                      ]}
                      onViewHistory={() => setShowNotificationHistory(appointment.id)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* WhatsApp Notification History Modal */}
      {showNotificationHistory && (
        <WhatsAppNotificationHistory
          isOpen={true}
          onClose={() => setShowNotificationHistory(null)}
          notifications={[
            {
              id: `${showNotificationHistory}-confirmation`,
              type: 'confirmation',
              status: 'sent',
              sentAt: new Date(),
              phoneNumber: '+971501234567'
            }
          ]}
          appointmentId={showNotificationHistory}
        />
      )}
    </div>
  )
}