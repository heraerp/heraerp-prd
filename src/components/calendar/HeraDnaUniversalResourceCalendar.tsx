'use client'

/**
 * HERA DNA Universal Resource Calendar
 * Smart Code: HERA.UI.CALENDAR.RESOURCE.UNIVERSAL.v1
 *
 * Universal multi-resource calendar that adapts to any business vertical:
 * - Salon: Stylists, Stations, Services
 * - Healthcare: Doctors, Rooms, Appointments
 * - Consulting: Consultants, Meeting Rooms, Sessions
 * - Manufacturing: Operators, Machines, Jobs
 * - Education: Teachers, Classrooms, Classes
 *
 * Features:
 * - Multi-branch/organization support with head office view
 * - Resource-based view (columns per resource)
 * - Single calendar view with resource filtering
 * - Drag & drop scheduling with conflict prevention
 * - Per-resource business hours and availability
 * - Universal appointment types and statuses
 * - HERA 6-table architecture integration
 *
 * @example
 * // Salon Usage
 * <HeraDnaUniversalResourceCalendar
 *   businessType="salon"
 *   resourceType="stylist"
 *   appointmentType="service"
 *   organizations={salonBranches}
 * />
 *
 * // Healthcare Usage
 * <HeraDnaUniversalResourceCalendar
 *   businessType="healthcare"
 *   resourceType="doctor"
 *   appointmentType="consultation"
 *   organizations={clinicBranches}
 * />
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import '@/styles/microsoft-calendar.css'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  Video,
  Phone,
  MapPin,
  Star,
  Sparkles,
  Grid3x3,
  List,
  CalendarDays,
  User,
  Crown,
  Zap,
  Scissors,
  Palette,
  ChevronDown,
  MoreVertical,
  Bell,
  Settings,
  X,
  Columns,
  Square,
  CheckSquare,
  Building2,
  Stethoscope,
  UserCheck,
  Briefcase,
  GraduationCap,
  Wrench,
  UserX,
  Plane,
  Home,
  Coffee,
  Heart,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

// Universal Business Type Configurations
const BUSINESS_CONFIGS = {
  salon: {
    resourceName: 'Stylist',
    resourceNamePlural: 'Stylists',
    appointmentName: 'Service',
    appointmentNamePlural: 'Services',
    icon: <Scissors className="w-4 h-4" />,
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#10B981'
    },
    appointmentTypes: [
      { id: 'cut', name: 'Cut & Style', color: '#3B82F6', icon: <Scissors className="w-3 h-3" /> },
      {
        id: 'color',
        name: 'Color Treatment',
        color: '#EC4899',
        icon: <Palette className="w-3 h-3" />
      },
      {
        id: 'chemical',
        name: 'Chemical Treatment',
        color: '#8B5CF6',
        icon: <Zap className="w-3 h-3" />
      },
      {
        id: 'bridal',
        name: 'Bridal Package',
        color: '#F59E0B',
        icon: <Crown className="w-3 h-3" />
      },
      { id: 'spa', name: 'Spa Treatment', color: '#10B981', icon: <Sparkles className="w-3 h-3" /> }
    ],
    leaveTypes: [
      { id: 'sick', name: 'Sick Leave', color: '#EF4444', icon: <UserX className="w-3 h-3" /> },
      { id: 'vacation', name: 'Vacation', color: '#06B6D4', icon: <Plane className="w-3 h-3" /> },
      {
        id: 'personal',
        name: 'Personal Leave',
        color: '#8B5CF6',
        icon: <Home className="w-3 h-3" />
      },
      {
        id: 'emergency',
        name: 'Emergency Leave',
        color: '#F59E0B',
        icon: <Bell className="w-3 h-3" />
      }
    ]
  },
  healthcare: {
    resourceName: 'Doctor',
    resourceNamePlural: 'Doctors',
    appointmentName: 'Appointment',
    appointmentNamePlural: 'Appointments',
    icon: <Stethoscope className="w-4 h-4" />,
    colors: {
      primary: '#0EA5E9',
      secondary: '#10B981',
      accent: '#F59E0B'
    },
    appointmentTypes: [
      {
        id: 'consultation',
        name: 'Consultation',
        color: '#0EA5E9',
        icon: <Stethoscope className="w-3 h-3" />
      },
      {
        id: 'checkup',
        name: 'Check-up',
        color: '#10B981',
        icon: <UserCheck className="w-3 h-3" />
      },
      {
        id: 'procedure',
        name: 'Procedure',
        color: '#F59E0B',
        icon: <Settings className="w-3 h-3" />
      },
      {
        id: 'followup',
        name: 'Follow-up',
        color: '#6B7280',
        icon: <Calendar className="w-3 h-3" />
      },
      { id: 'emergency', name: 'Emergency', color: '#EF4444', icon: <Bell className="w-3 h-3" /> }
    ],
    leaveTypes: [
      { id: 'sick', name: 'Sick Leave', color: '#EF4444', icon: <UserX className="w-3 h-3" /> },
      { id: 'vacation', name: 'Vacation', color: '#06B6D4', icon: <Plane className="w-3 h-3" /> },
      {
        id: 'medical',
        name: 'Medical Leave',
        color: '#8B5CF6',
        icon: <Heart className="w-3 h-3" />
      },
      {
        id: 'conference',
        name: 'Conference/Training',
        color: '#10B981',
        icon: <GraduationCap className="w-3 h-3" />
      }
    ]
  },
  consulting: {
    resourceName: 'Consultant',
    resourceNamePlural: 'Consultants',
    appointmentName: 'Session',
    appointmentNamePlural: 'Sessions',
    icon: <Briefcase className="w-4 h-4" />,
    colors: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#EC4899'
    },
    appointmentTypes: [
      {
        id: 'strategy',
        name: 'Strategy Session',
        color: '#6366F1',
        icon: <Briefcase className="w-3 h-3" />
      },
      {
        id: 'review',
        name: 'Review Meeting',
        color: '#10B981',
        icon: <CheckSquare className="w-3 h-3" />
      },
      {
        id: 'training',
        name: 'Training',
        color: '#F59E0B',
        icon: <GraduationCap className="w-3 h-3" />
      },
      { id: 'workshop', name: 'Workshop', color: '#8B5CF6', icon: <Users className="w-3 h-3" /> },
      { id: 'audit', name: 'Audit', color: '#EF4444', icon: <Search className="w-3 h-3" /> }
    ],
    leaveTypes: [
      { id: 'vacation', name: 'Vacation', color: '#06B6D4', icon: <Plane className="w-3 h-3" /> },
      { id: 'sick', name: 'Sick Leave', color: '#EF4444', icon: <UserX className="w-3 h-3" /> },
      {
        id: 'business',
        name: 'Business Travel',
        color: '#8B5CF6',
        icon: <Briefcase className="w-3 h-3" />
      },
      {
        id: 'conference',
        name: 'Conference',
        color: '#10B981',
        icon: <GraduationCap className="w-3 h-3" />
      }
    ]
  },
  manufacturing: {
    resourceName: 'Operator',
    resourceNamePlural: 'Operators',
    appointmentName: 'Job',
    appointmentNamePlural: 'Jobs',
    icon: <Wrench className="w-4 h-4" />,
    colors: {
      primary: '#F97316',
      secondary: '#EAB308',
      accent: '#84CC16'
    },
    appointmentTypes: [
      {
        id: 'production',
        name: 'Production Run',
        color: '#F97316',
        icon: <Wrench className="w-3 h-3" />
      },
      {
        id: 'maintenance',
        name: 'Maintenance',
        color: '#EAB308',
        icon: <Settings className="w-3 h-3" />
      },
      {
        id: 'quality',
        name: 'Quality Check',
        color: '#10B981',
        icon: <CheckSquare className="w-3 h-3" />
      },
      {
        id: 'setup',
        name: 'Setup/Changeover',
        color: '#6B7280',
        icon: <Grid3x3 className="w-3 h-3" />
      },
      {
        id: 'training',
        name: 'Training',
        color: '#8B5CF6',
        icon: <GraduationCap className="w-3 h-3" />
      }
    ],
    leaveTypes: [
      {
        id: 'vacation',
        name: 'Annual Leave',
        color: '#06B6D4',
        icon: <Plane className="w-3 h-3" />
      },
      { id: 'sick', name: 'Sick Leave', color: '#EF4444', icon: <UserX className="w-3 h-3" /> },
      {
        id: 'safety',
        name: 'Safety Training',
        color: '#F59E0B',
        icon: <Shield className="w-3 h-3" />
      },
      {
        id: 'personal',
        name: 'Personal Leave',
        color: '#8B5CF6',
        icon: <Home className="w-3 h-3" />
      }
    ]
  }
}

interface HeraDnaUniversalResourceCalendarProps {
  className?: string
  businessType: keyof typeof BUSINESS_CONFIGS
  organizations?: Array<{
    id: string
    organization_code: string
    organization_name: string
  }>
  currentOrganizationId?: string
  canViewAllBranches?: boolean
  onNewBooking?: (bookingData: any) => void
  onAppointmentUpdate?: (appointmentData: any) => void
  onAppointmentDelete?: (appointmentId: string) => void

  // Data override props for custom implementations
  resources?: Resource[]
  appointments?: Appointment[]

  // Configuration overrides
  businessHours?: {
    start: number
    end: number
    slotDuration: number
  }

  // Smart codes for HERA integration
  smartCodes?: {
    calendar: string
    appointment: string
    resource: string
  }
}

interface TimeSlot {
  time: string
  displayTime: string
  appointments: any[]
}

interface Resource {
  id: string
  name: string
  title: string
  avatar: string
  color: string
  available: boolean
  status: string
  businessHours?: {
    start: number
    end: number
  }
  branchId: string
  // Dynamic fields for specialization
  specialties?: string[]
  certifications?: string[]
  rating?: number
  experience?: string
}

interface Appointment {
  id: string
  title: string
  client: string
  resourceId: string
  time: string
  date: Date
  duration: number
  type: string
  status: string
  price: string
  color: string
  icon: React.ReactNode
  branchId: string
  branchName?: string
  // Universal fields
  description?: string
  metadata?: Record<string, any>
  smartCode?: string
  // Leave-specific fields
  isLeave?: boolean
  leaveType?: string
  approvedBy?: string
  reason?: string
}

const DEFAULT_BUSINESS_HOURS = {
  start: 9,
  end: 21,
  slotDuration: 30 // minutes
}

export function HeraDnaUniversalResourceCalendar({
  className,
  businessType,
  organizations = [],
  currentOrganizationId,
  canViewAllBranches = false,
  onNewBooking,
  onAppointmentUpdate,
  onAppointmentDelete,
  resources: customResources,
  appointments: customAppointments,
  businessHours = DEFAULT_BUSINESS_HOURS,
  smartCodes = {
    calendar: `HERA.${businessType.toUpperCase()}.CALENDAR.RESOURCE.v1`,
    appointment: `HERA.${businessType.toUpperCase()}.APPOINTMENT.TXN.v1`,
    resource: `HERA.${businessType.toUpperCase()}.RESOURCE.ENT.v1`
  }
}: HeraDnaUniversalResourceCalendarProps) {
  const { currentOrganization  } = useHERAAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<'day' | 'week' | 'month'>('week')
  const [viewMode, setViewMode] = useState<'single' | 'resource'>('resource')
  const [selectedResources, setSelectedResources] = useState<string[]>(['all'])
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['all'])
  const [showSidebar, setShowSidebar] = useState(true)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingSlot, setBookingSlot] = useState<{
    date: Date
    time: string
    resourceId?: string
    branchId?: string
  } | null>(null)
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    date: Date
    time: string
    resourceId: string
  } | null>(null)

  // Leave management state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [leaveRequestSlot, setLeaveRequestSlot] = useState<{
    date: Date
    time: string
    resourceId?: string
    branchId?: string
  } | null>(null)
  const [showLeaveRequests, setShowLeaveRequests] = useState(true)
  const [dateRangeSelection, setDateRangeSelection] = useState<{
    start: Date | null
    end: Date | null
  }>({ start: null, end: null })
  const [isSelectingDateRange, setIsSelectingDateRange] = useState(false)

  // Get business configuration
  const config = BUSINESS_CONFIGS[businessType]

  // Generate universal resources based on business type
  const generateDefaultResources = (): (Resource & { branchId: string })[] => {
    const baseResources = {
      salon: [
        {
          id: 'resource1',
          name: 'Rocky',
          title: 'Celebrity Hair Artist',
          avatar: 'R',
          color: 'bg-purple-600',
          specialties: ['Brazilian Blowout', 'Bridal Styling']
        },
        {
          id: 'resource2',
          name: 'Maya',
          title: 'Color Specialist',
          avatar: 'M',
          color: 'bg-pink-600',
          specialties: ['Balayage', 'Color Correction']
        },
        {
          id: 'resource3',
          name: 'Sophia',
          title: 'Bridal Specialist',
          avatar: 'S',
          color: 'bg-amber-600',
          specialties: ['Bridal Hair', 'Updos']
        }
      ],
      healthcare: [
        {
          id: 'resource1',
          name: 'Dr. Smith',
          title: 'General Practitioner',
          avatar: 'DS',
          color: 'bg-blue-600',
          specialties: ['Family Medicine', 'Preventive Care']
        },
        {
          id: 'resource2',
          name: 'Dr. Johnson',
          title: 'Cardiologist',
          avatar: 'DJ',
          color: 'bg-green-600',
          specialties: ['Heart Conditions', 'Hypertension']
        },
        {
          id: 'resource3',
          name: 'Dr. Williams',
          title: 'Pediatrician',
          avatar: 'DW',
          color: 'bg-purple-600',
          specialties: ['Child Health', 'Vaccinations']
        }
      ],
      consulting: [
        {
          id: 'resource1',
          name: 'Alex Chen',
          title: 'Strategy Consultant',
          avatar: 'AC',
          color: 'bg-indigo-600',
          specialties: ['Business Strategy', 'Market Analysis']
        },
        {
          id: 'resource2',
          name: 'Sarah Miller',
          title: 'HR Consultant',
          avatar: 'SM',
          color: 'bg-rose-600',
          specialties: ['Talent Management', 'Organizational Development']
        },
        {
          id: 'resource3',
          name: 'Michael Brown',
          title: 'IT Consultant',
          avatar: 'MB',
          color: 'bg-cyan-600',
          specialties: ['Digital Transformation', 'Systems Integration']
        }
      ],
      manufacturing: [
        {
          id: 'resource1',
          name: 'John Martinez',
          title: 'Production Lead',
          avatar: 'JM',
          color: 'bg-orange-600',
          specialties: ['CNC Operations', 'Quality Control']
        },
        {
          id: 'resource2',
          name: 'Lisa Wang',
          title: 'Machine Operator',
          avatar: 'LW',
          color: 'bg-yellow-600',
          specialties: ['Assembly Line', 'Equipment Maintenance']
        },
        {
          id: 'resource3',
          name: 'David Rodriguez',
          title: 'Quality Inspector',
          avatar: 'DR',
          color: 'bg-green-600',
          specialties: ['Quality Assurance', 'Process Improvement']
        }
      ]
    }

    return (
      baseResources[businessType]?.map((resource, index) => ({
        ...resource,
        available: Math.random() > 0.3,
        status: ['available', 'busy', 'away'][Math.floor(Math.random() * 3)],
        businessHours: { start: 9 + index, end: 18 + index },
        branchId: organizations[index % organizations.length]?.id || 'default-branch',
        rating: 4.5 + Math.random() * 0.5,
        experience: `${3 + index * 2} years`
      })) || []
    )
  }

  // Generate universal appointments based on business type
  const generateDefaultAppointments = (): Appointment[] => {
    const appointmentTypes = config.appointmentTypes
    const appointments: Appointment[] = []
    const today = new Date()

    // Generate appointments for the next 14 days
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const appointmentDate = new Date(today.getTime() + dayOffset * 24 * 60 * 60 * 1000)

      // Generate 2-4 appointments per day randomly
      const dailyAppointmentCount = Math.floor(Math.random() * 3) + 2 // 2-4 appointments

      for (let i = 0; i < dailyAppointmentCount; i++) {
        const appointmentType =
          appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)]
        const resourceIndex = Math.floor(Math.random() * 3) // 0, 1, or 2
        const branchIndex = Math.floor(Math.random() * Math.max(organizations.length, 1))

        // Generate random time between 9 AM and 6 PM
        const hour = Math.floor(Math.random() * 9) + 9 // 9-17 (9 AM to 5 PM)
        const minute = Math.random() > 0.5 ? '00' : '30'
        const time = `${hour.toString().padStart(2, '0')}:${minute}`

        const clients = {
          salon: ['Sarah Johnson', 'Emma Davis', 'Lisa Chen', 'Maya Patel', 'Sophie Wilson'],
          healthcare: [
            'John Patient',
            'Mary Wilson',
            'David Brown',
            'Jennifer Lee',
            'Michael Rodriguez'
          ],
          consulting: ['ABC Corp', 'XYZ Inc', 'TechStart Ltd', 'Global Solutions', 'Innovation Co'],
          manufacturing: [
            'Production Job A',
            'Quality Check B',
            'Maintenance Task',
            'Setup Process',
            'Assembly Line'
          ]
        }

        const prices = {
          salon: ['AED 150', 'AED 200', 'AED 300', 'AED 450', 'AED 500'],
          healthcare: ['$100', '$150', '$200', '$250', '$300'],
          consulting: ['$300', '$500', '$750', '$1000', '$1500'],
          manufacturing: ['Job #' + (1000 + i + dayOffset), 'Task #' + (2000 + i + dayOffset)]
        }

        appointments.push({
          id: `${dayOffset}-${i}`,
          title: appointmentType.name,
          client: clients[businessType][Math.floor(Math.random() * clients[businessType].length)],
          resourceId: `resource${resourceIndex + 1}`,
          time,
          date: appointmentDate,
          duration: [60, 90, 120, 150][Math.floor(Math.random() * 4)],
          type: appointmentType.id,
          status: ['confirmed', 'pending', 'completed'][Math.floor(Math.random() * 3)],
          price: prices[businessType][Math.floor(Math.random() * prices[businessType].length)],
          color: appointmentType.color,
          icon: appointmentType.icon,
          branchId: organizations[branchIndex]?.id || 'default-branch',
          smartCode: smartCodes.appointment
        })
      }

      // Occasionally add leave requests (10% chance per day)
      if (Math.random() < 0.1 && config.leaveTypes) {
        const leaveType = config.leaveTypes[Math.floor(Math.random() * config.leaveTypes.length)]
        const resourceIndex = Math.floor(Math.random() * 3) // 0, 1, or 2
        const branchIndex = Math.floor(Math.random() * Math.max(organizations.length, 1))

        appointments.push({
          id: `leave-${dayOffset}`,
          title: leaveType.name,
          client: 'Staff Leave',
          resourceId: `resource${resourceIndex + 1}`,
          time: '09:00',
          date: appointmentDate,
          duration: 480, // Full day (8 hours)
          type: leaveType.id,
          status: ['pending', 'approved', 'denied'][Math.floor(Math.random() * 3)],
          price: 'N/A',
          color: leaveType.color,
          icon: leaveType.icon,
          branchId: organizations[branchIndex]?.id || 'default-branch',
          smartCode: `${smartCodes.appointment}.LEAVE`,
          isLeave: true,
          leaveType: leaveType.id,
          reason: `${leaveType.name} request`,
          approvedBy: Math.random() > 0.5 ? 'manager@company.com' : undefined
        })
      }
    }

    return appointments
  }

  // Use custom data or generate defaults
  const allResources = customResources || generateDefaultResources()
  const [appointments, setAppointments] = useState<Appointment[]>(
    customAppointments || generateDefaultAppointments()
  )

  // Filter resources based on selected branches
  const resources = useMemo(() => {
    if (selectedBranches.includes('all')) {
      return allResources
    }
    return allResources.filter(r => selectedBranches.includes(r.branchId))
  }, [allResources, selectedBranches])

  // Get selected resources for resource view
  const displayedResources = useMemo(() => {
    if (selectedResources.includes('all')) {
      return resources
    }
    return resources.filter(r => selectedResources.includes(r.id))
  }, [resources, selectedResources])

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = []
    const totalMinutes = (businessHours.end - businessHours.start) * 60
    const numberOfSlots = totalMinutes / businessHours.slotDuration

    for (let i = 0; i < numberOfSlots; i++) {
      const hour = businessHours.start + Math.floor((i * businessHours.slotDuration) / 60)
      const minute = (i * businessHours.slotDuration) % 60
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const displayTime = new Date(2024, 0, 1, hour, minute).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })

      slots.push({ time, displayTime, appointments: [] })
    }

    return slots
  }, [businessHours])

  // Get dates based on selected view
  const getViewDates = () => {
    const dates = []

    if (selectedView === 'day') {
      // For day view, just return the selected date
      dates.push(new Date(selectedDate))
    } else if (selectedView === 'week') {
      // For week view, get full week
      const startOfWeek = new Date(selectedDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day
      startOfWeek.setDate(diff)

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000)
        dates.push(date)
      }
    } else {
      // For month view, get current month's weeks (simplified to current week for now)
      const startOfWeek = new Date(selectedDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day
      startOfWeek.setDate(diff)

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000)
        dates.push(date)
      }
    }

    return dates
  }

  const viewDates = getViewDates()

  // Format date for display
  const formatDateHeader = (date: Date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNumber = date.getDate()

    return { dayName, dayNumber, isToday }
  }

  // Handle resource selection
  const handleResourceToggle = (resourceId: string) => {
    if (resourceId === 'all') {
      setSelectedResources(['all'])
    } else {
      setSelectedResources(prev => {
        const filtered = prev.filter(id => id !== 'all')
        if (filtered.includes(resourceId)) {
          const newSelection = filtered.filter(id => id !== resourceId)
          return newSelection.length === 0 ? ['all'] : newSelection
        } else {
          return [...filtered, resourceId]
        }
      })
    }
  }

  // Handle branch selection
  const handleBranchToggle = (branchId: string) => {
    if (branchId === 'all') {
      setSelectedBranches(['all'])
    } else {
      setSelectedBranches(prev => {
        const filtered = prev.filter(id => id !== 'all')
        if (filtered.includes(branchId)) {
          const newSelection = filtered.filter(id => id !== branchId)
          return newSelection.length === 0 ? ['all'] : newSelection
        } else {
          return [...filtered.filter(id => id !== 'all'), branchId]
        }
      })
    }
  }

  // Check if time slot is within resource's business hours
  const isWithinBusinessHours = (resource: Resource, time: string) => {
    const [hour] = time.split(':').map(Number)
    const resourceBusinessHours = resource.businessHours || businessHours
    return hour >= resourceBusinessHours.start && hour < resourceBusinessHours.end
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, date: Date, time: string, resourceId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget({ date, time, resourceId })
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent, date: Date, time: string, resourceId: string) => {
    e.preventDefault()
    if (!draggedAppointment) return

    // Update appointment with new time and resource
    setAppointments(prev =>
      prev.map(apt => (apt.id === draggedAppointment.id ? { ...apt, date, time, resourceId } : apt))
    )

    setDraggedAppointment(null)
    setDropTarget(null)

    // Callback for external handling
    onAppointmentUpdate?.({
      ...draggedAppointment,
      date,
      time,
      resourceId,
      smartCode: smartCodes.appointment
    })
  }

  // Handle new booking
  const handleNewBooking = (slot?: {
    date: Date
    time: string
    resourceId?: string
    branchId?: string
  }) => {
    setBookingSlot(slot || null)
    setIsBookingOpen(true)
    onNewBooking?.({
      date: slot?.date,
      time: slot?.time,
      resourceId: slot?.resourceId,
      branchId: slot?.branchId,
      businessType,
      smartCode: smartCodes.appointment
    })
  }

  // Handle leave request
  const handleLeaveRequest = (slot?: {
    date: Date
    time: string
    resourceId?: string
    branchId?: string
  }) => {
    // If we have a date range selection, use that
    if (dateRangeSelection.start && dateRangeSelection.end) {
      setLeaveRequestSlot({
        date: dateRangeSelection.start,
        time: slot?.time || '09:00',
        resourceId: slot?.resourceId,
        branchId: slot?.branchId
      })
    } else {
      setLeaveRequestSlot(slot || null)
    }
    setIsLeaveModalOpen(true)
    // Reset date range selection
    setDateRangeSelection({ start: null, end: null })
    setIsSelectingDateRange(false)
  }

  // Handle date range selection
  const handleDateRangeSelection = (date: Date, resourceId?: string, branchId?: string) => {
    if (!dateRangeSelection.start) {
      // First click - start selection
      setDateRangeSelection({ start: date, end: null })
      setIsSelectingDateRange(true)
    } else if (!dateRangeSelection.end) {
      // Second click - complete selection
      const start = dateRangeSelection.start
      const end = date

      // Ensure start is before end
      if (start > end) {
        setDateRangeSelection({ start: end, end: start })
      } else {
        setDateRangeSelection({ start, end })
      }

      // Auto-open leave request modal for the selected range
      setTimeout(() => {
        handleLeaveRequest({
          date: start > end ? end : start,
          time: '09:00',
          resourceId,
          branchId
        })
      }, 100)
    } else {
      // Reset and start new selection
      setDateRangeSelection({ start: date, end: null })
      setIsSelectingDateRange(true)
    }
  }

  // Check if a date is in the selected range
  const isDateInRange = (date: Date) => {
    if (!dateRangeSelection.start) return false
    if (!dateRangeSelection.end)
      return date.toDateString() === dateRangeSelection.start.toDateString()

    const start =
      dateRangeSelection.start < dateRangeSelection.end
        ? dateRangeSelection.start
        : dateRangeSelection.end
    const end =
      dateRangeSelection.start < dateRangeSelection.end
        ? dateRangeSelection.end
        : dateRangeSelection.start

    return date >= start && date <= end
  }

  // Cancel date range selection
  const cancelDateRangeSelection = () => {
    setDateRangeSelection({ start: null, end: null })
    setIsSelectingDateRange(false)
  }

  // Handle leave approval/denial
  const handleLeaveApproval = (appointmentId: string, approved: boolean) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === appointmentId && apt.isLeave
          ? { ...apt, status: approved ? 'approved' : 'denied' }
          : apt
      )
    )
    console.log(`Leave request ${appointmentId} ${approved ? 'approved' : 'denied'}`)
  }

  // Submit leave request
  const handleLeaveSubmit = (leaveData: any) => {
    if (!leaveRequestSlot) return

    const leaveType = config.leaveTypes?.find(lt => lt.id === leaveData.type)
    if (!leaveType) return

    const newLeaves: Appointment[] = []
    const startDate = leaveData.date
    const endDate = leaveData.endDate || leaveData.date
    const daysSelected = leaveData.daysSelected || 1

    // Create leave appointments for each day in the range
    for (let i = 0; i < daysSelected; i++) {
      const leaveDate = new Date(startDate)
      leaveDate.setDate(startDate.getDate() + i)

      const newLeave: Appointment = {
        id: `leave-${Date.now()}-${i}`,
        title: `${leaveType.name}${daysSelected > 1 ? ` (Day ${i + 1}/${daysSelected})` : ''}`,
        client: 'Staff Leave',
        resourceId: leaveRequestSlot.resourceId || 'resource1',
        time: leaveRequestSlot.time,
        date: leaveDate,
        duration: leaveData.duration || 480, // Full day default
        type: leaveType.id,
        status: 'pending',
        price: 'N/A',
        color: leaveType.color,
        icon: leaveType.icon,
        branchId: leaveRequestSlot.branchId || 'default-branch',
        smartCode: `${smartCodes.appointment}.LEAVE`,
        isLeave: true,
        leaveType: leaveType.id,
        reason: leaveData.reason,
        description:
          daysSelected > 1
            ? `${leaveData.description} (Multi-day leave: ${daysSelected} days from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})`
            : leaveData.description
      }

      newLeaves.push(newLeave)
    }

    setAppointments(prev => [...prev, ...newLeaves])
    setIsLeaveModalOpen(false)
    console.log(`${daysSelected}-day leave request submitted:`, newLeaves)
  }

  // Handle keyboard navigation
  const handleKeyNavigation = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return // Don't handle keyboard events when typing in inputs
      }

      const newDate = new Date(selectedDate)

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (selectedView === 'day') {
            newDate.setDate(newDate.getDate() - 1)
          } else if (selectedView === 'week') {
            newDate.setDate(newDate.getDate() - 7)
          } else {
            newDate.setMonth(newDate.getMonth() - 1)
          }
          console.log('Keyboard: Previous', {
            oldDate: selectedDate.toDateString(),
            newDate: newDate.toDateString(),
            view: selectedView
          })
          setSelectedDate(newDate)
          break
        case 'ArrowRight':
          e.preventDefault()
          if (selectedView === 'day') {
            newDate.setDate(newDate.getDate() + 1)
          } else if (selectedView === 'week') {
            newDate.setDate(newDate.getDate() + 7)
          } else {
            newDate.setMonth(newDate.getMonth() + 1)
          }
          console.log('Keyboard: Next', {
            oldDate: selectedDate.toDateString(),
            newDate: newDate.toDateString(),
            view: selectedView
          })
          setSelectedDate(newDate)
          break
        case 'Home':
          e.preventDefault()
          setSelectedDate(new Date())
          break
        case '1':
          e.preventDefault()
          setSelectedView('day')
          break
        case '2':
          e.preventDefault()
          setSelectedView('week')
          break
        case '3':
          e.preventDefault()
          setSelectedView('month')
          break
      }
    },
    [selectedDate, selectedView]
  )

  // Add keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyNavigation)
    return () => window.removeEventListener('keydown', handleKeyNavigation)
  }, [handleKeyNavigation])

  return (
    <div
      className={cn(
        'flex h-[800px] bg-background dark:bg-background rounded-lg overflow-hidden',
        className
      )}
    >
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-r border-border dark:border-border bg-muted dark:bg-muted/50 flex flex-col calendar-sidebar">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border dark:border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {config.icon}
                <h3 className="text-lg font-semibold text-gray-100 dark:text-foreground">
                  {config.resourceNamePlural} Calendar
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(false)}
                className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Branch Filter */}
            {organizations.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-100 dark:text-foreground mb-2">
                  Branch Filter
                </h4>
                <div className="space-y-2">
                  {/* All branches option */}
                  <div
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                      selectedBranches.includes('all')
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-muted dark:hover:bg-muted-foreground/10'
                    )}
                    onClick={() => handleBranchToggle('all')}
                  >
                    <Checkbox
                      checked={selectedBranches.includes('all')}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Building2 className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                    <span className="text-sm font-medium text-gray-100 dark:text-foreground">
                      All Branches
                    </span>
                  </div>

                  {/* Individual branches */}
                  {organizations
                    .filter(org => !org.organization_code.includes('GROUP'))
                    .map(org => (
                      <div
                        key={org.id}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all',
                          selectedBranches.includes(org.id)
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                            : 'hover:bg-muted dark:hover:bg-muted-foreground/10'
                        )}
                        onClick={() => handleBranchToggle(org.id)}
                      >
                        <Checkbox
                          checked={selectedBranches.includes(org.id)}
                          disabled={selectedBranches.includes('all')}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <MapPin className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                        <span className="text-sm text-gray-100 dark:text-foreground">
                          {org.organization_name.split('•')[1]?.trim() || org.organization_name}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={viewMode === 'single' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setViewMode('single')}
              >
                <User className="w-4 h-4 mr-2" />
                Single View
              </Button>
              <Button
                variant={viewMode === 'resource' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setViewMode('resource')}
              >
                <Columns className="w-4 h-4 mr-2" />
                Resource View
              </Button>
            </div>
          </div>

          {/* Resources List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-100 dark:text-foreground mb-3">
                {config.resourceNamePlural}
              </h4>

              {/* All resources option */}
              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all sidebar-item mb-2',
                  selectedResources.includes('all')
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                    : 'hover:bg-muted dark:hover:bg-muted-foreground/10'
                )}
                onClick={() => handleResourceToggle('all')}
              >
                <Checkbox
                  checked={selectedResources.includes('all')}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-100 dark:text-foreground">
                    All {config.resourceNamePlural}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                    View all team members
                  </p>
                </div>
              </div>

              {/* Individual resources */}
              <div className="space-y-2">
                {resources.map(resource => (
                  <div
                    key={resource.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all sidebar-item',
                      selectedResources.includes(resource.id)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-muted dark:hover:bg-muted-foreground/10'
                    )}
                    onClick={() => handleResourceToggle(resource.id)}
                  >
                    <Checkbox
                      checked={selectedResources.includes(resource.id)}
                      disabled={selectedResources.includes('all')}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <div className="relative">
                      <Avatar className={cn('h-10 w-10', resource.color)}>
                        <AvatarFallback className="text-foreground font-semibold">
                          {resource.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
                          resource.status === 'available'
                            ? 'bg-green-500'
                            : resource.status === 'busy'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                        )}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-100 dark:text-foreground">
                        {resource.name}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {resource.title}
                      </p>
                      {organizations.length > 0 && (
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
                          {organizations
                            .find(org => org.id === resource.branchId)
                            ?.organization_name.split('•')[1]
                            ?.trim() || 'Branch'}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        resource.available
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-muted text-muted-foreground dark:bg-muted-foreground/10 dark:text-gray-300'
                      )}
                    >
                      {resource.available ? 'Available' : 'Busy'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-border dark:border-border space-y-3">
            <Button
              className="w-full"
              style={{ backgroundColor: config.colors.primary }}
              onClick={() => handleNewBooking()}
            >
              <Plus className="w-4 h-4 mr-2" />
              New {config.appointmentName}
            </Button>

            <Button variant="outline" className="w-full" onClick={() => handleLeaveRequest()}>
              <UserX className="w-4 h-4 mr-2" />
              Request Leave
            </Button>

            {/* Multi-day leave selection */}
            <Button
              variant={isSelectingDateRange ? 'default' : 'outline'}
              className={cn(
                'w-full',
                isSelectingDateRange && 'bg-orange-500 hover:bg-orange-600 text-foreground'
              )}
              onClick={() => {
                if (isSelectingDateRange) {
                  cancelDateRangeSelection()
                } else {
                  setIsSelectingDateRange(true)
                  setDateRangeSelection({ start: null, end: null })
                }
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isSelectingDateRange ? 'Cancel Selection' : 'Select Date Range'}
            </Button>

            {/* Date range selection instructions */}
            {isSelectingDateRange && (
              <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                <strong>Multi-day leave:</strong> Click start date, then click end date to select
                range
              </div>
            )}

            {/* Leave visibility toggle */}
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={showLeaveRequests}
                onCheckedChange={setShowLeaveRequests}
                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Show leave requests</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        {/* Calendar Header */}
        <div className="p-4 border-b border-border dark:border-border bg-background dark:bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!showSidebar && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSidebar(true)}
                  className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-gray-200"
                >
                  <Grid3x3 className="w-5 h-5" />
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground dark:text-gray-300"
                  onClick={() => {
                    const newDate = new Date(selectedDate)
                    if (selectedView === 'day') {
                      newDate.setDate(newDate.getDate() - 1)
                    } else if (selectedView === 'week') {
                      newDate.setDate(newDate.getDate() - 7)
                    } else {
                      newDate.setMonth(newDate.getMonth() - 1)
                    }
                    console.log('Navigation: Previous', {
                      oldDate: selectedDate.toDateString(),
                      newDate: newDate.toDateString(),
                      view: selectedView
                    })
                    setSelectedDate(newDate)
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  className="text-sm font-medium min-w-[120px] text-gray-700 dark:text-gray-200"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground dark:text-gray-300"
                  onClick={() => {
                    const newDate = new Date(selectedDate)
                    if (selectedView === 'day') {
                      newDate.setDate(newDate.getDate() + 1)
                    } else if (selectedView === 'week') {
                      newDate.setDate(newDate.getDate() + 7)
                    } else {
                      newDate.setMonth(newDate.getMonth() + 1)
                    }
                    console.log('Navigation: Next', {
                      oldDate: selectedDate.toDateString(),
                      newDate: newDate.toDateString(),
                      view: selectedView
                    })
                    setSelectedDate(newDate)
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-gray-100 dark:text-foreground">
                  {selectedView === 'day'
                    ? selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : selectedView === 'week'
                      ? `Week of ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : selectedDate.toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {selectedView.charAt(0).toUpperCase() + selectedView.slice(1)} view •{' '}
                  {viewDates.length} day{viewDates.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tabs value={selectedView} onValueChange={v => setSelectedView(v as any)}>
                <TabsList className="bg-muted dark:bg-muted">
                  <TabsTrigger value="day" className="text-sm">
                    Day
                  </TabsTrigger>
                  <TabsTrigger value="week" className="text-sm">
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-sm">
                    Month
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground dark:text-gray-300"
                >
                  <Search className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground dark:text-gray-300"
                >
                  <Filter className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground dark:text-gray-300"
                  title="Keyboard Shortcuts: ← → Navigate, Home: Today, 1: Day, 2: Week, 3: Month"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Time Column */}
            <div className="w-20 border-r border-border dark:border-border bg-muted dark:bg-muted/30">
              <div
                className={cn(
                  'border-b border-border dark:border-border',
                  viewMode === 'resource' ? 'h-20' : 'h-14'
                )}
              />
              <ScrollArea
                className={cn(
                  'calendar-scrollbar',
                  viewMode === 'resource' ? 'h-[calc(100%-5rem)]' : 'h-[calc(100%-3.5rem)]'
                )}
              >
                {timeSlots.map((slot, idx) => (
                  <div
                    key={slot.time}
                    className="h-16 border-b border-gray-100 dark:border-gray-800 px-2 py-1"
                  >
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {slot.displayTime}
                    </span>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Days/Resources Grid */}
            <div className="flex-1 flex">
              <ScrollArea className="w-full calendar-scrollbar">
                <div className="flex">
                  {viewMode === 'single'
                    ? // Single view mode (day/week/month layout)
                      viewDates.map((date, dayIdx) => {
                        const { dayName, dayNumber, isToday } = formatDateHeader(date)

                        return (
                          <div
                            key={dayIdx}
                            className={cn(
                              'border-r border-border dark:border-border last:border-r-0 transition-all duration-300',
                              selectedView === 'day'
                                ? 'flex-1 min-w-[400px]'
                                : 'flex-1 min-w-[140px]'
                            )}
                          >
                            {/* Day Header */}
                            <div
                              className={cn(
                                'h-14 border-b border-border dark:border-border px-2 py-2 text-center day-header cursor-pointer transition-all',
                                isToday && 'today',
                                isSelectingDateRange &&
                                  'hover:bg-orange-50 dark:hover:bg-orange-900/20',
                                isDateInRange(date) &&
                                  'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700'
                              )}
                              onClick={() => {
                                if (isSelectingDateRange) {
                                  handleDateRangeSelection(date)
                                }
                              }}
                            >
                              <p
                                className={cn(
                                  'text-xs font-bold uppercase tracking-wider',
                                  isToday
                                    ? 'text-primary dark:text-blue-400'
                                    : isDateInRange(date)
                                      ? 'text-orange-700 dark:text-orange-300'
                                      : 'text-gray-700 dark:text-gray-300'
                                )}
                              >
                                {dayName}
                              </p>
                              <p
                                className={cn(
                                  'text-xl font-extrabold',
                                  isToday
                                    ? 'text-primary dark:text-blue-400'
                                    : isDateInRange(date)
                                      ? 'text-orange-700 dark:text-orange-300'
                                      : 'text-gray-100 dark:text-foreground'
                                )}
                              >
                                {dayNumber}
                              </p>
                              {isDateInRange(date) && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full mx-auto mt-1"></div>
                              )}
                            </div>

                            {/* Time Slots */}
                            <div>
                              {timeSlots.map((slot, slotIdx) => {
                                const slotAppointments = appointments.filter(
                                  apt =>
                                    apt.time === slot.time &&
                                    apt.date.toDateString() === date.toDateString() &&
                                    (selectedResources.includes('all') ||
                                      selectedResources.includes(apt.resourceId)) &&
                                    (selectedBranches.includes('all') ||
                                      selectedBranches.includes(apt.branchId)) &&
                                    (showLeaveRequests || !apt.isLeave)
                                )

                                return (
                                  <div
                                    key={`${dayIdx}-${slotIdx}`}
                                    className={cn(
                                      'h-16 border-b border-gray-100 dark:border-gray-800 relative group time-slot',
                                      'hover:bg-muted dark:hover:bg-muted/50 cursor-pointer'
                                    )}
                                    onClick={() => {
                                      if (!slotAppointments.length) {
                                        handleNewBooking({ date: date, time: slot.time })
                                      }
                                    }}
                                  >
                                    {/* Appointments */}
                                    {slotAppointments.map((apt, aptIdx) => {
                                      const durationSlots = Math.ceil(
                                        apt.duration / businessHours.slotDuration
                                      )
                                      const resourceInfo = resources.find(
                                        r => r.id === apt.resourceId
                                      )

                                      return (
                                        <div
                                          key={apt.id}
                                          draggable
                                          onDragStart={e => handleDragStart(e, apt)}
                                          className={cn(
                                            'absolute inset-x-1 top-1 mx-1 rounded-md p-2 cursor-move appointment-card',
                                            'transform transition-all hover:scale-[1.02] hover:shadow-md',
                                            'border-l-4'
                                          )}
                                          style={{
                                            backgroundColor: `${apt.color}15`,
                                            borderLeftColor: apt.color,
                                            height: `${durationSlots * 64 - 8}px`,
                                            zIndex: 5 + aptIdx
                                          }}
                                        >
                                          <div className="flex items-start gap-2">
                                            <div
                                              className="w-6 h-6 rounded-full flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0"
                                              style={{ backgroundColor: apt.color }}
                                            >
                                              {apt.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-semibold text-gray-100 dark:text-foreground truncate">
                                                {apt.title}
                                              </p>
                                              <p className="text-xs text-muted-foreground dark:text-gray-300 truncate">
                                                {apt.client}
                                              </p>
                                              <div className="flex items-center gap-2 mt-1">
                                                <Badge
                                                  variant="secondary"
                                                  className="text-xs px-1 py-0"
                                                  style={{
                                                    backgroundColor: `${apt.color}20`,
                                                    color: apt.color,
                                                    borderColor: apt.color
                                                  }}
                                                >
                                                  {apt.price}
                                                </Badge>
                                                {resourceInfo && (
                                                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                                                    {resourceInfo.name}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <MoreVertical className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )
                                    })}

                                    {/* Add appointment hint */}
                                    {!slotAppointments.length && (
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    : // Resource view mode
                      displayedResources.map((resource, resourceIdx) => (
                        <div
                          key={resource.id}
                          className="flex-1 min-w-[200px] border-r border-border dark:border-border last:border-r-0"
                        >
                          {/* Resource Header */}
                          <div className="h-20 border-b border-border dark:border-border px-2 py-2 bg-muted dark:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Avatar className={cn('h-10 w-10', resource.color)}>
                                <AvatarFallback className="text-foreground font-semibold">
                                  {resource.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-100 dark:text-foreground">
                                  {resource.name}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                  {resource.title}
                                </p>
                                {organizations.length > 0 && (
                                  <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                                    {organizations
                                      .find(org => org.id === resource.branchId)
                                      ?.organization_name.split('•')[1]
                                      ?.trim() || 'Branch'}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                              {resource.businessHours
                                ? `${resource.businessHours.start}:00 - ${resource.businessHours.end}:00`
                                : 'Standard hours'}
                            </p>
                          </div>

                          {/* Time Slots for this resource */}
                          <div>
                            {timeSlots.map((slot, slotIdx) => {
                              const slotAppointments = appointments.filter(
                                apt =>
                                  apt.time === slot.time &&
                                  apt.resourceId === resource.id &&
                                  apt.date.toDateString() === selectedDate.toDateString() &&
                                  (selectedBranches.includes('all') ||
                                    selectedBranches.includes(apt.branchId)) &&
                                  (showLeaveRequests || !apt.isLeave)
                              )

                              const isBusinessHour = isWithinBusinessHours(resource, slot.time)
                              const isDropTarget =
                                dropTarget &&
                                dropTarget.time === slot.time &&
                                dropTarget.resourceId === resource.id

                              return (
                                <div
                                  key={`${resource.id}-${slotIdx}`}
                                  className={cn(
                                    'h-16 border-b border-gray-100 dark:border-gray-800 relative group time-slot',
                                    !isBusinessHour && 'bg-muted dark:bg-muted/30',
                                    isBusinessHour &&
                                      'hover:bg-muted dark:hover:bg-muted/50 cursor-pointer',
                                    isDropTarget && 'bg-blue-50 dark:bg-blue-900/20'
                                  )}
                                  onClick={() => {
                                    if (!slotAppointments.length && isBusinessHour) {
                                      handleNewBooking({
                                        date: selectedDate,
                                        time: slot.time,
                                        resourceId: resource.id,
                                        branchId: resource.branchId
                                      })
                                    }
                                  }}
                                  onContextMenu={e => {
                                    e.preventDefault()
                                    if (isBusinessHour) {
                                      handleLeaveRequest({
                                        date: selectedDate,
                                        time: slot.time,
                                        resourceId: resource.id,
                                        branchId: resource.branchId
                                      })
                                    }
                                  }}
                                  onDragOver={e =>
                                    isBusinessHour &&
                                    handleDragOver(e, selectedDate, slot.time, resource.id)
                                  }
                                  onDrop={e =>
                                    isBusinessHour &&
                                    handleDrop(e, selectedDate, slot.time, resource.id)
                                  }
                                  onDragLeave={() => setDropTarget(null)}
                                >
                                  {/* Non-business hour overlay */}
                                  {!isBusinessHour && (
                                    <div className="absolute inset-0 bg-muted dark:bg-muted/30 z-10" />
                                  )}

                                  {/* Appointments */}
                                  {slotAppointments.map((apt, aptIdx) => {
                                    const durationSlots = Math.ceil(
                                      apt.duration / businessHours.slotDuration
                                    )

                                    return (
                                      <div
                                        key={apt.id}
                                        draggable
                                        onDragStart={e => handleDragStart(e, apt)}
                                        className={cn(
                                          'absolute inset-x-1 top-1 mx-1 rounded-md p-2 cursor-move appointment-card',
                                          'transform transition-all hover:scale-[1.02] hover:shadow-md',
                                          'border-l-4'
                                        )}
                                        style={{
                                          backgroundColor: `${apt.color}15`,
                                          borderLeftColor: apt.color,
                                          height: `${durationSlots * 64 - 8}px`,
                                          zIndex: 5 + aptIdx
                                        }}
                                      >
                                        <AppointmentCard
                                          appointment={apt}
                                          resource={resource}
                                          compact
                                          onLeaveApproval={handleLeaveApproval}
                                        />
                                      </div>
                                    )
                                  })}

                                  {/* Add appointment hint */}
                                  {!slotAppointments.length && isBusinessHour && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Plus className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSubmit={handleLeaveSubmit}
        resources={resources}
        leaveTypes={config.leaveTypes || []}
        slot={leaveRequestSlot}
        dateRange={dateRangeSelection}
      />
    </div>
  )
}

// Universal Appointment Card component
function AppointmentCard({
  appointment,
  resource,
  compact = false,
  onLeaveApproval
}: {
  appointment: Appointment
  resource?: Resource
  compact?: boolean
  onLeaveApproval?: (appointmentId: string, approved: boolean) => void
}) {
  // Special handling for leave requests
  if (appointment.isLeave) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: appointment.color }}
          >
            {appointment.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-100 dark:text-foreground truncate">
              {appointment.title}
            </p>
            <p className="text-xs text-muted-foreground dark:text-gray-300 truncate">
              {resource?.name || 'Employee'} • {appointment.reason || 'No reason provided'}
            </p>
            {appointment.description && (
              <p className="text-xs text-muted-foreground dark:text-muted-foreground truncate mt-1">
                {appointment.description}
              </p>
            )}
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'text-xs px-2 py-0.5',
              appointment.status === 'pending' &&
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
              appointment.status === 'approved' &&
                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
              appointment.status === 'denied' &&
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
            )}
          >
            {appointment.status === 'pending' && 'Pending'}
            {appointment.status === 'approved' && 'Approved'}
            {appointment.status === 'denied' && 'Denied'}
          </Badge>
        </div>

        {/* Leave approval buttons (for managers) */}
        {appointment.status === 'pending' && onLeaveApproval && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLeaveApproval(appointment.id, true)}
              className="flex-1 h-6 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-200"
            >
              <CheckSquare className="w-3 h-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLeaveApproval(appointment.id, false)}
              className="flex-1 h-6 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200"
            >
              <X className="w-3 h-3 mr-1" />
              Deny
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Regular appointment display
  return (
    <div className="flex items-start gap-2">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-foreground text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: appointment.color }}
      >
        {appointment.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-100 dark:text-foreground truncate">
          {appointment.title}
        </p>
        <p className="text-xs text-muted-foreground dark:text-gray-300 truncate">
          {appointment.client}
        </p>
        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className="text-xs px-1 py-0"
              style={{
                backgroundColor: `${appointment.color}20`,
                color: appointment.color,
                borderColor: appointment.color
              }}
            >
              {appointment.price}
            </Badge>
            {resource && (
              <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                {resource.name}
              </span>
            )}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreVertical className="w-3 h-3" />
      </Button>
    </div>
  )
}

// Leave Request Modal Component
interface LeaveRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (leaveData: any) => void
  resources: Resource[]
  leaveTypes: Array<{
    id: string
    name: string
    color: string
    icon: React.ReactNode
  }>
  slot: { date: Date; time: string; resourceId?: string; branchId?: string } | null
  dateRange?: { start: Date | null; end: Date | null }
}

function LeaveRequestModal({
  isOpen,
  onClose,
  onSubmit,
  resources,
  leaveTypes,
  slot,
  dateRange
}: LeaveRequestModalProps) {
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedResource, setSelectedResource] = useState<string>('')
  const [duration, setDuration] = useState<string>('full-day')
  const [reason, setReason] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Calculate days selected
  const calculateDaysSelected = () => {
    const start = dateRange?.start || startDate || slot?.date
    const end = dateRange?.end || endDate || slot?.date

    if (!start || !end) return 1

    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const daysSelected = calculateDaysSelected()

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedType(leaveTypes[0]?.id || '')
      setSelectedResource(slot?.resourceId || resources[0]?.id || '')
      setDuration(daysSelected > 1 ? 'multi-day' : 'full-day')
      setReason('')
      setDescription('')

      // Set date range from either dateRange prop or slot
      if (dateRange?.start && dateRange?.end) {
        setStartDate(dateRange.start)
        setEndDate(dateRange.end)
      } else if (slot?.date) {
        setStartDate(slot.date)
        setEndDate(slot.date)
      }
    }
  }, [isOpen, leaveTypes, resources, slot, dateRange, daysSelected])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType || !selectedResource || !slot) return

    const durationHours = {
      'half-day-morning': 240, // 4 hours
      'half-day-afternoon': 240, // 4 hours
      'full-day': 480, // 8 hours
      'multi-day': 480 // 8 hours per day (can be extended)
    }

    onSubmit({
      type: selectedType,
      resourceId: selectedResource,
      duration: durationHours[duration as keyof typeof durationHours] || daysSelected * 480, // 8 hours per day
      reason,
      description,
      date: startDate || slot.date,
      endDate: endDate || slot.date,
      daysSelected,
      time: slot.time || '09:00'
    })

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background dark:bg-muted rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
              <UserX className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-100 dark:text-foreground">
                Request Leave
              </h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                {startDate && endDate
                  ? daysSelected === 1
                    ? `For ${startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
                    : `${daysSelected} days: ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  : 'New leave request'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Leave Type Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-100 dark:text-foreground mb-3 block">
              Leave Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {leaveTypes.map(type => (
                <label
                  key={type.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                    selectedType === type.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-border dark:border-border hover:bg-muted dark:hover:bg-muted-foreground/10'
                  )}
                >
                  <input
                    type="radio"
                    name="leaveType"
                    value={type.id}
                    checked={selectedType === type.id}
                    onChange={e => setSelectedType(e.target.value)}
                    className="text-primary"
                  />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-foreground text-sm"
                    style={{ backgroundColor: type.color }}
                  >
                    {type.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-100 dark:text-foreground">
                    {type.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Resource Selection */}
          <div>
            <label
              htmlFor="resource"
              className="text-sm font-semibold text-gray-100 dark:text-foreground mb-2 block"
            >
              Employee
            </label>
            <Select value={selectedResource} onValueChange={setSelectedResource}>
              <SelectTrigger className="hera-select-trigger">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                {resources.map(resource => (
                  <SelectItem key={resource.id} value={resource.id} className="hera-select-item">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-foreground text-xs font-bold',
                          resource.color
                        )}
                      >
                        {resource.avatar}
                      </div>
                      <span>
                        {resource.name} - {resource.title}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-100 dark:text-foreground mb-3 block">
              Duration
            </label>

            {/* Multi-day indicator */}
            {daysSelected > 1 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Multi-day leave selected
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-300">
                      {daysSelected} consecutive days from{' '}
                      {startDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                      to {endDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              {[
                ...(daysSelected === 1
                  ? [
                      {
                        value: 'half-day-morning',
                        label: 'Half Day (Morning)',
                        hours: '9:00 AM - 1:00 PM'
                      },
                      {
                        value: 'half-day-afternoon',
                        label: 'Half Day (Afternoon)',
                        hours: '1:00 PM - 5:00 PM'
                      }
                    ]
                  : []),
                {
                  value: daysSelected > 1 ? 'multi-day' : 'full-day',
                  label: daysSelected > 1 ? `${daysSelected} Full Days` : 'Full Day',
                  hours:
                    daysSelected > 1
                      ? `${daysSelected} × 8 hours = ${daysSelected * 8} hours total`
                      : '9:00 AM - 5:00 PM'
                }
              ].map(option => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
                    duration === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-border dark:border-border hover:bg-muted dark:hover:bg-muted-foreground/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="duration"
                      value={option.value}
                      checked={duration === option.value}
                      onChange={e => setDuration(e.target.value)}
                      className="text-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-100 dark:text-foreground">
                        {option.label}
                      </span>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {option.hours}
                      </p>
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </label>
              ))}
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label
              htmlFor="reason"
              className="text-sm font-semibold text-gray-100 dark:text-foreground mb-2 block"
            >
              Reason
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="hera-select-trigger">
                <SelectValue placeholder="Select reason for leave" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="medical" className="hera-select-item">
                  Medical/Health
                </SelectItem>
                <SelectItem value="personal" className="hera-select-item">
                  Personal
                </SelectItem>
                <SelectItem value="family" className="hera-select-item">
                  Family Emergency
                </SelectItem>
                <SelectItem value="vacation" className="hera-select-item">
                  Vacation
                </SelectItem>
                <SelectItem value="training" className="hera-select-item">
                  Training/Education
                </SelectItem>
                <SelectItem value="other" className="hera-select-item">
                  Other
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div>
            <label
              htmlFor="description"
              className="text-sm font-semibold text-gray-100 dark:text-foreground mb-2 block"
            >
              Additional Notes (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide any additional details..."
              className="w-full px-3 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-muted-foreground/10 text-gray-100 dark:text-foreground placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex gap-3 pt-4 border-t border-border dark:border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border dark:border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedType || !selectedResource || !reason}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-foreground"
            >
              <UserX className="w-4 h-4 mr-2" />
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
