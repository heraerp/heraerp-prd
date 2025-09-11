'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar, Clock, Users, TrendingUp, Plus, Filter, Search, Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAppointments } from '@/hooks/useAppointments'
import { AppointmentList } from './AppointmentList'
import { AppointmentCalendarView } from './AppointmentCalendarView'
import { NewAppointmentModal } from './NewAppointmentModal'
import { AppointmentStats } from './AppointmentStats'
import { formatDate } from '@/lib/date-utils'

interface AppointmentManagementDashboardProps {
  organizationId?: string
}

export function AppointmentManagementDashboard({ organizationId }: AppointmentManagementDashboardProps) {
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [activeView, setActiveView] = useState<'list' | 'calendar' | 'day'>('list')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const { 
    appointments, 
    loading, 
    stats,
    confirmAppointment,
    cancelAppointment,
    refreshAppointments 
  } = useAppointments({ organizationId })

  // Track mouse for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setMousePosition({ x, y })
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      return () => container.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Filter appointments based on search and status
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = !searchQuery || 
      apt.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.serviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.staffName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(0, 0, 0, 0.95) 0%, 
            rgba(17, 24, 39, 0.95) 25%,
            rgba(31, 41, 55, 0.9) 50%,
            rgba(17, 24, 39, 0.95) 75%,
            rgba(0, 0, 0, 0.95) 100%
          ),
          radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(147, 51, 234, 0.08) 0%, 
            rgba(59, 130, 246, 0.05) 25%,
            rgba(16, 185, 129, 0.03) 50%,
            transparent 70%
          ),
          #0a0a0a
        `
      }}
    >
      {/* WSAG Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Primary Light Orb */}
        <div 
          className="absolute w-96 h-96 rounded-full transition-all duration-[3000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(147, 51, 234, 0.15) 0%, 
              rgba(147, 51, 234, 0.08) 30%, 
              rgba(147, 51, 234, 0.02) 60%, 
              transparent 100%
            )`,
            filter: 'blur(60px)',
            left: `${20 + mousePosition.x * 0.1}%`,
            top: `${10 + mousePosition.y * 0.05}%`,
            transform: `translate(-50%, -50%) scale(${1 + mousePosition.x * 0.002})`
          }}
        />
        
        {/* Secondary Light Orb */}
        <div 
          className="absolute w-80 h-80 rounded-full transition-all duration-[4000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(59, 130, 246, 0.12) 0%, 
              rgba(59, 130, 246, 0.06) 30%, 
              rgba(59, 130, 246, 0.02) 60%, 
              transparent 100%
            )`,
            filter: 'blur(70px)',
            right: `${15 + mousePosition.x * 0.08}%`,
            top: `${60 + mousePosition.y * 0.03}%`,
            transform: `translate(50%, -50%) scale(${1 + mousePosition.y * 0.002})`
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold !text-gray-900 dark:!text-white flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(147, 51, 234, 0.15) 0%, 
                    rgba(59, 130, 246, 0.1) 100%
                  )
                `,
                backdropFilter: 'blur(20px) saturate(120%)',
                WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.4),
                  0 4px 16px rgba(147, 51, 234, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `
              }}
            >
              <Calendar className="w-6 h-6 text-white drop-shadow-md" />
            </div>
            Appointment Management
          </h1>
          <p className="!text-gray-600 dark:!text-gray-400 mt-2">
            Manage bookings, schedule services, and track customer appointments
          </p>
        </div>

        {/* Navigation and Actions Bar */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 justify-between">
          {/* View Tabs */}
          <div className="inline-flex rounded-lg p-1"
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
            <button
              onClick={() => setActiveView('list')}
              className={cn(
                "px-6 py-2 rounded-md transition-all duration-200 font-medium",
                activeView === 'list'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : '!text-gray-700 dark:!text-gray-300 hover:bg-white/10'
              )}
            >
              List View
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={cn(
                "px-6 py-2 rounded-md transition-all duration-200 font-medium",
                activeView === 'calendar'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : '!text-gray-700 dark:!text-gray-300 hover:bg-white/10'
              )}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveView('day')}
              className={cn(
                "px-6 py-2 rounded-md transition-all duration-200 font-medium",
                activeView === 'day'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : '!text-gray-700 dark:!text-gray-300 hover:bg-white/10'
              )}
            >
              Day View
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => setShowNewAppointment(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
            <Button
              variant="outline"
              onClick={refreshAppointments}
              className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/30 border-white/20 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-900/50"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by customer, service, or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 !text-white focus:border-indigo-500 hover:bg-gray-700/50"
            />
          </div>
          
          <div className="flex gap-2">
            {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={statusFilter === status 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                  : 'backdrop-blur-xl bg-white/10 dark:bg-gray-900/30 border-white/20 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-900/50'
                }
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <Badge variant="secondary" className="ml-2">
                    {appointments.filter(a => a.status === status).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <AppointmentStats stats={stats} organizationId={organizationId} />

        {/* Main Content Area */}
        {activeView === 'list' && (
          <AppointmentList 
            appointments={filteredAppointments}
            onConfirm={confirmAppointment}
            onCancel={cancelAppointment}
            loading={loading}
          />
        )}

        {activeView === 'calendar' && (
          <AppointmentCalendarView
            appointments={filteredAppointments}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        )}

        {activeView === 'day' && (
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
            <div className="p-6">
              <h3 className="text-xl font-semibold !text-gray-900 dark:!text-white mb-4">
                Day View - {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              {/* Day view implementation would go here */}
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="!text-gray-600 dark:!text-gray-400">Day view coming soon</p>
              </div>
            </div>
          </div>
        )}

        {/* New Appointment Modal */}
        {showNewAppointment && (
          <NewAppointmentModal 
            onClose={() => setShowNewAppointment(false)} 
            organizationId={organizationId}
            onSuccess={() => {
              setShowNewAppointment(false)
              refreshAppointments()
            }}
          />
        )}
      </div>
    </div>
  )
}