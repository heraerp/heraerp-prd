'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Wrench,
  Headphones,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Star,
  Award,
  Target,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Send,
  Archive,
  RefreshCw,
  FileText,
  Camera,
  Settings as Tool,
  Settings,
  Package,
  Truck,
  Building2,
  Users,
  Timer,
  PlayCircle,
  PauseCircle,
  XCircle,
  CheckSquare,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Globe,
  Shield,
  Zap,
  HardHat,
  ClipboardList,
  BookOpen,
  Home,
  Factory
} from 'lucide-react'

// TypeScript interfaces for enterprise service management
interface ServiceCustomer {
  id: string
  name: string
  type: 'individual' | 'business' | 'government'
  contactPerson: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    pincode: string
  }
  serviceContract?: {
    type: 'basic' | 'premium' | 'enterprise'
    startDate: string
    endDate: string
    responseTime: number
    coverageHours: string
  }
  preferredTechnician?: string
  serviceHistory: number
  totalSpent: number
  lastServiceDate?: string
}

interface ServiceTechnician {
  id: string
  name: string
  employeeId: string
  specialization: string[]
  experience: number
  certification: string[]
  rating: number
  availability: 'available' | 'busy' | 'on_leave' | 'off_duty'
  currentLocation: {
    lat: number
    lng: number
    address: string
  }
  assignedTickets: number
  completedToday: number
  skills: {
    category: string
    level: 'beginner' | 'intermediate' | 'expert' | 'master'
  }[]
  contact: {
    phone: string
    email: string
    emergencyContact: string
  }
  workingHours: {
    start: string
    end: string
    timezone: string
  }
  tools: string[]
  vehicleInfo?: {
    type: string
    registration: string
    gpsEnabled: boolean
  }
}

interface ServiceProduct {
  id: string
  name: string
  category: 'furniture' | 'hardware' | 'accessory'
  model: string
  serialNumber?: string
  purchaseDate: string
  warrantyStatus: 'active' | 'expired' | 'extended'
  warrantyEndDate: string
  lastServiceDate?: string
  serviceInterval: number
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  location: string
  specifications: Record<string, string>
  serviceHistory: {
    date: string
    type: string
    technician: string
    description: string
    cost: number
  }[]
}

interface ServiceTicket {
  id: string
  ticketNumber: string
  title: string
  description: string
  category: 'repair' | 'maintenance' | 'installation' | 'consultation' | 'warranty'
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical'
  status: 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'resolved' | 'closed' | 'cancelled'
  customer: ServiceCustomer
  product?: ServiceProduct
  assignedTechnician?: ServiceTechnician
  createdDate: string
  scheduledDate?: string
  startedDate?: string
  completedDate?: string
  estimatedDuration: number
  actualDuration?: number
  estimatedCost: number
  actualCost?: number
  location: {
    type: 'customer_site' | 'workshop' | 'remote'
    address: string
    coordinates?: {
      lat: number
      lng: number
    }
    accessInstructions?: string
  }
  serviceLevel: 'basic' | 'standard' | 'premium' | 'emergency'
  resolution?: {
    summary: string
    partsUsed: {
      name: string
      quantity: number
      cost: number
    }[]
    laborTime: number
    satisfactionRating?: number
    customerFeedback?: string
    followUpRequired: boolean
    nextServiceDate?: string
  }
  communications: {
    id: string
    timestamp: string
    type: 'call' | 'email' | 'sms' | 'chat' | 'note'
    from: string
    to: string
    message: string
    attachments?: string[]
  }[]
  attachments: {
    id: string
    name: string
    type: 'image' | 'document' | 'video' | 'audio'
    url: string
    uploadedBy: string
    uploadedAt: string
  }[]
  escalation?: {
    level: number
    escalatedTo: string
    escalatedAt: string
    reason: string
  }
  slaMetrics: {
    responseTime: number
    resolutionTime?: number
    responseTarget: number
    resolutionTarget: number
    breached: boolean
  }
  tags: string[]
  internalNotes: string[]
  approvals?: {
    type: 'cost' | 'parts' | 'method'
    approver: string
    status: 'pending' | 'approved' | 'rejected'
    date?: string
    comments?: string
  }[]
}

interface ServiceAnalytics {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  averageResolutionTime: number
  firstCallResolution: number
  customerSatisfaction: number
  technicianUtilization: number
  revenue: number
  costs: number
  profitMargin: number
  slaCompliance: number
  categoryBreakdown: {
    category: string
    count: number
    avgTime: number
    satisfaction: number
  }[]
  technicianPerformance: {
    technician: string
    tickets: number
    avgTime: number
    satisfaction: number
    revenue: number
  }[]
  monthlyTrends: {
    month: string
    tickets: number
    resolution: number
    satisfaction: number
  }[]
}

export default function ServicePage(): JSX.Element {
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>([])
  const [technicians, setTechnicians] = useState<ServiceTechnician[]>([])
  const [customers, setCustomers] = useState<ServiceCustomer[]>([])
  const [analytics, setAnalytics] = useState<ServiceAnalytics | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null)

  // Sample enterprise service data
  const sampleTickets: ServiceTicket[] = [
    {
      id: 'SRV-001',
      ticketNumber: 'KFW-SRV-2024-001',
      title: 'Executive Table Wobbling Issue',
      description: 'Customer reports that the executive boardroom table has developed a wobble after 6 months of use. Table is used for daily meetings and the wobbling is affecting presentations.',
      category: 'repair',
      priority: 'high',
      status: 'assigned',
      customer: {
        id: 'CUST-001',
        name: 'ITC Grand Chola Chennai',
        type: 'business',
        contactPerson: 'Facilities Manager',
        email: 'facilities@itchotels.in',
        phone: '+91 44 2220 0000',
        address: {
          street: '63, Mount Road',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600032'
        },
        serviceContract: {
          type: 'premium',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          responseTime: 4,
          coverageHours: '24x7'
        },
        serviceHistory: 3,
        totalSpent: 45000,
        lastServiceDate: '2023-11-15'
      },
      product: {
        id: 'PROD-001',
        name: 'Executive Boardroom Table',
        category: 'furniture',
        model: 'KFW-EXEC-001',
        serialNumber: 'KFW001-2023-07-15',
        purchaseDate: '2023-07-15',
        warrantyStatus: 'active',
        warrantyEndDate: '2028-07-15',
        lastServiceDate: '2023-11-15',
        serviceInterval: 180,
        condition: 'good',
        location: 'Conference Room A, 5th Floor',
        specifications: {
          'Material': 'Premium Teak',
          'Dimensions': '14ft x 6ft x 30in',
          'Finish': 'High Gloss Polyurethane',
          'Weight': '180 kg'
        },
        serviceHistory: [
          {
            date: '2023-11-15',
            type: 'maintenance',
            technician: 'Raman Nair',
            description: 'Routine polish and hardware check',
            cost: 5500
          }
        ]
      },
      assignedTechnician: {
        id: 'TECH-001',
        name: 'Raman Nair',
        employeeId: 'KFW-EMP-001',
        specialization: ['Premium Furniture', 'Teak Work', 'Corporate Installations'],
        experience: 15,
        certification: ['Master Craftsman', 'Corporate Service'],
        rating: 4.8,
        availability: 'busy',
        currentLocation: {
          lat: 13.0827,
          lng: 80.2707,
          address: 'Chennai Central Area'
        },
        assignedTickets: 3,
        completedToday: 1,
        skills: [
          { category: 'Wood Repair', level: 'expert' },
          { category: 'Hardware Adjustment', level: 'expert' },
          { category: 'Refinishing', level: 'master' }
        ],
        contact: {
          phone: '+91 94474 11111',
          email: 'raman.nair@keralafurniture.com',
          emergencyContact: '+91 94474 11112'
        },
        workingHours: {
          start: '08:00',
          end: '18:00',
          timezone: 'IST'
        },
        tools: ['Precision Level', 'Wood Repair Kit', 'Adjustment Tools'],
        vehicleInfo: {
          type: 'Service Van',
          registration: 'KL-01-AB-1234',
          gpsEnabled: true
        }
      },
      createdDate: '2024-01-15T09:30:00Z',
      scheduledDate: '2024-01-16T10:00:00Z',
      startedDate: '2024-01-16T10:15:00Z',
      estimatedDuration: 2,
      actualDuration: 1.5,
      estimatedCost: 8500,
      actualCost: 7200,
      location: {
        type: 'customer_site',
        address: '63, Mount Road, Chennai, Tamil Nadu 600032',
        coordinates: {
          lat: 13.0827,
          lng: 80.2707
        },
        accessInstructions: 'Visit reception, ask for Facilities Manager. Conference Room A on 5th floor.'
      },
      serviceLevel: 'premium',
      resolution: {
        summary: 'Table wobbling was caused by loose bolts in the base structure. All hardware tightened and leveled properly. Applied furniture protectors under legs.',
        partsUsed: [
          { name: 'Furniture Protectors', quantity: 4, cost: 200 },
          { name: 'Hardware Kit', quantity: 1, cost: 500 }
        ],
        laborTime: 1.5,
        satisfactionRating: 5,
        customerFeedback: 'Excellent service. Table is perfectly stable now. Technician was professional and cleaned up well.',
        followUpRequired: false
      },
      communications: [
        {
          id: 'COMM-001',
          timestamp: '2024-01-15T09:30:00Z',
          type: 'call',
          from: 'Customer',
          to: 'Service Desk',
          message: 'Initial complaint about table wobbling'
        },
        {
          id: 'COMM-002',
          timestamp: '2024-01-15T14:30:00Z',
          type: 'sms',
          from: 'Service Desk',
          to: 'Customer',
          message: 'Service scheduled for tomorrow 10 AM. Technician: Raman Nair'
        }
      ],
      attachments: [
        {
          id: 'ATT-001',
          name: 'table_wobble_video.mp4',
          type: 'video',
          url: '/attachments/table_wobble.mp4',
          uploadedBy: 'Customer',
          uploadedAt: '2024-01-15T09:35:00Z'
        }
      ],
      slaMetrics: {
        responseTime: 4,
        resolutionTime: 24,
        responseTarget: 4,
        resolutionTarget: 48,
        breached: false
      },
      tags: ['warranty', 'corporate', 'furniture', 'wobbling'],
      internalNotes: [
        'Customer has premium contract - prioritize',
        'Table was installed 6 months ago, check installation quality'
      ]
    },
    {
      id: 'SRV-002',
      ticketNumber: 'KFW-SRV-2024-002',
      title: 'Chair Upholstery Repair',
      description: 'Leather upholstery on executive chair showing wear and small tears. Customer requests repair or replacement of upholstery.',
      category: 'repair',
      priority: 'medium',
      status: 'in_progress',
      customer: {
        id: 'CUST-002',
        name: 'Heritage Resort Kumarakom',
        type: 'business',
        contactPerson: 'Maintenance Head',
        email: 'maintenance@heritageresorts.com',
        phone: '+91 481 252 4900',
        address: {
          street: 'Kumarakom',
          city: 'Kottayam',
          state: 'Kerala',
          pincode: '686563'
        },
        serviceContract: {
          type: 'basic',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          responseTime: 8,
          coverageHours: '9AM-6PM'
        },
        serviceHistory: 8,
        totalSpent: 125000,
        lastServiceDate: '2023-12-10'
      },
      product: {
        id: 'PROD-002',
        name: 'Executive Chair',
        category: 'furniture',
        model: 'KFW-CHAIR-EXEC-001',
        serialNumber: 'KFW002-2022-03-20',
        purchaseDate: '2022-03-20',
        warrantyStatus: 'active',
        warrantyEndDate: '2027-03-20',
        serviceInterval: 365,
        condition: 'fair',
        location: 'Manager Office, Resort',
        specifications: {
          'Material': 'Leather Upholstery',
          'Frame': 'Teak Wood',
          'Type': 'Executive Swivel Chair',
          'Color': 'Black Leather'
        },
        serviceHistory: [
          {
            date: '2023-12-10',
            type: 'maintenance',
            technician: 'Suresh Kumar',
            description: 'Oiling and mechanism check',
            cost: 3500
          }
        ]
      },
      assignedTechnician: {
        id: 'TECH-002',
        name: 'Suresh Kumar',
        employeeId: 'KFW-EMP-002',
        specialization: ['Upholstery Repair', 'Chair Mechanisms', 'Leather Work'],
        experience: 12,
        certification: ['Upholstery Specialist', 'Leather Craftsman'],
        rating: 4.6,
        availability: 'busy',
        currentLocation: {
          lat: 9.5982,
          lng: 76.4827,
          address: 'Kottayam District'
        },
        assignedTickets: 2,
        completedToday: 0,
        skills: [
          { category: 'Upholstery', level: 'expert' },
          { category: 'Leather Repair', level: 'expert' },
          { category: 'Chair Mechanisms', level: 'intermediate' }
        ],
        contact: {
          phone: '+91 94474 22222',
          email: 'suresh.kumar@keralafurniture.com',
          emergencyContact: '+91 94474 22223'
        },
        workingHours: {
          start: '09:00',
          end: '17:00',
          timezone: 'IST'
        },
        tools: ['Upholstery Kit', 'Leather Repair Tools', 'Sewing Machine'],
        vehicleInfo: {
          type: 'Motorcycle',
          registration: 'KL-05-CD-5678',
          gpsEnabled: true
        }
      },
      createdDate: '2024-01-18T11:00:00Z',
      scheduledDate: '2024-01-19T14:00:00Z',
      startedDate: '2024-01-19T14:30:00Z',
      estimatedDuration: 3,
      estimatedCost: 12000,
      location: {
        type: 'customer_site',
        address: 'Heritage Resort, Kumarakom, Kottayam, Kerala 686563',
        accessInstructions: 'Enter through main gate, ask for Maintenance Head. Chair is in Manager office.'
      },
      serviceLevel: 'standard',
      communications: [
        {
          id: 'COMM-003',
          timestamp: '2024-01-18T11:00:00Z',
          type: 'email',
          from: 'Customer',
          to: 'Service Desk',
          message: 'Chair upholstery needs repair - photos attached'
        }
      ],
      attachments: [
        {
          id: 'ATT-002',
          name: 'chair_damage_photos.jpg',
          type: 'image',
          url: '/attachments/chair_damage.jpg',
          uploadedBy: 'Customer',
          uploadedAt: '2024-01-18T11:05:00Z'
        }
      ],
      slaMetrics: {
        responseTime: 6,
        responseTarget: 8,
        resolutionTarget: 72,
        breached: false
      },
      tags: ['upholstery', 'leather', 'chair', 'repair'],
      internalNotes: [
        'Chair is 2 years old, normal wear expected',
        'Customer prefers on-site repair if possible'
      ]
    },
    {
      id: 'SRV-003',
      ticketNumber: 'KFW-SRV-2024-003',
      title: 'New Workstation Installation',
      description: 'Installation of 25 new modular workstations in the new office wing. Includes assembly, positioning, and cable management setup.',
      category: 'installation',
      priority: 'medium',
      status: 'open',
      customer: {
        id: 'CUST-003',
        name: 'TechPark Solutions',
        type: 'business',
        contactPerson: 'IT Manager',
        email: 'it.manager@techpark.com',
        phone: '+91 471 123 4567',
        address: {
          street: 'Technopark Phase 2',
          city: 'Trivandrum',
          state: 'Kerala',
          pincode: '695581'
        },
        serviceHistory: 2,
        totalSpent: 85000
      },
      createdDate: '2024-01-20T09:00:00Z',
      scheduledDate: '2024-01-25T08:00:00Z',
      estimatedDuration: 8,
      estimatedCost: 25000,
      location: {
        type: 'customer_site',
        address: 'TechPark Solutions, Technopark Phase 2, Trivandrum, Kerala 695581',
        accessInstructions: 'Security clearance required. Contact IT Manager for access.'
      },
      serviceLevel: 'standard',
      communications: [
        {
          id: 'COMM-004',
          timestamp: '2024-01-20T09:00:00Z',
          type: 'call',
          from: 'Customer',
          to: 'Service Desk',
          message: 'Need installation team for 25 workstations next week'
        }
      ],
      attachments: [
        {
          id: 'ATT-003',
          name: 'office_layout_plan.pdf',
          type: 'document',
          url: '/attachments/layout_plan.pdf',
          uploadedBy: 'Customer',
          uploadedAt: '2024-01-20T09:15:00Z'
        }
      ],
      slaMetrics: {
        responseTime: 0,
        responseTarget: 8,
        resolutionTarget: 48,
        breached: false
      },
      tags: ['installation', 'workstation', 'new-office', 'assembly'],
      internalNotes: [
        'Large installation - assign experienced team',
        'Customer requires completion before staff move-in on 26th'
      ]
    }
  ]

  const sampleTechnicians: ServiceTechnician[] = [
    {
      id: 'TECH-001',
      name: 'Raman Nair',
      employeeId: 'KFW-EMP-001',
      specialization: ['Premium Furniture', 'Teak Work', 'Corporate Installations'],
      experience: 15,
      certification: ['Master Craftsman', 'Corporate Service'],
      rating: 4.8,
      availability: 'busy',
      currentLocation: {
        lat: 13.0827,
        lng: 80.2707,
        address: 'Chennai Central Area'
      },
      assignedTickets: 3,
      completedToday: 1,
      skills: [
        { category: 'Wood Repair', level: 'expert' },
        { category: 'Hardware Adjustment', level: 'expert' },
        { category: 'Refinishing', level: 'master' }
      ],
      contact: {
        phone: '+91 94474 11111',
        email: 'raman.nair@keralafurniture.com',
        emergencyContact: '+91 94474 11112'
      },
      workingHours: {
        start: '08:00',
        end: '18:00',
        timezone: 'IST'
      },
      tools: ['Precision Level', 'Wood Repair Kit', 'Adjustment Tools'],
      vehicleInfo: {
        type: 'Service Van',
        registration: 'KL-01-AB-1234',
        gpsEnabled: true
      }
    },
    {
      id: 'TECH-002',
      name: 'Suresh Kumar',
      employeeId: 'KFW-EMP-002',
      specialization: ['Upholstery Repair', 'Chair Mechanisms', 'Leather Work'],
      experience: 12,
      certification: ['Upholstery Specialist', 'Leather Craftsman'],
      rating: 4.6,
      availability: 'busy',
      currentLocation: {
        lat: 9.5982,
        lng: 76.4827,
        address: 'Kottayam District'
      },
      assignedTickets: 2,
      completedToday: 0,
      skills: [
        { category: 'Upholstery', level: 'expert' },
        { category: 'Leather Repair', level: 'expert' },
        { category: 'Chair Mechanisms', level: 'intermediate' }
      ],
      contact: {
        phone: '+91 94474 22222',
        email: 'suresh.kumar@keralafurniture.com',
        emergencyContact: '+91 94474 22223'
      },
      workingHours: {
        start: '09:00',
        end: '17:00',
        timezone: 'IST'
      },
      tools: ['Upholstery Kit', 'Leather Repair Tools', 'Sewing Machine']
    },
    {
      id: 'TECH-003',
      name: 'Priya Menon',
      employeeId: 'KFW-EMP-003',
      specialization: ['Installation', 'Assembly', 'Office Setup'],
      experience: 8,
      certification: ['Installation Specialist', 'Team Lead'],
      rating: 4.7,
      availability: 'available',
      currentLocation: {
        lat: 8.5241,
        lng: 76.9366,
        address: 'Trivandrum'
      },
      assignedTickets: 1,
      completedToday: 2,
      skills: [
        { category: 'Assembly', level: 'expert' },
        { category: 'Installation', level: 'expert' },
        { category: 'Project Management', level: 'intermediate' }
      ],
      contact: {
        phone: '+91 94474 33333',
        email: 'priya.menon@keralafurniture.com',
        emergencyContact: '+91 94474 33334'
      },
      workingHours: {
        start: '08:30',
        end: '17:30',
        timezone: 'IST'
      },
      tools: ['Assembly Tools', 'Power Tools', 'Measuring Equipment']
    }
  ]

  const sampleAnalytics: ServiceAnalytics = {
    totalTickets: 156,
    openTickets: 23,
    resolvedTickets: 133,
    averageResolutionTime: 18.5,
    firstCallResolution: 78.2,
    customerSatisfaction: 4.6,
    technicianUtilization: 85.3,
    revenue: 2840000,
    costs: 1560000,
    profitMargin: 45.1,
    slaCompliance: 92.4,
    categoryBreakdown: [
      { category: 'Repair', count: 89, avgTime: 16.2, satisfaction: 4.5 },
      { category: 'Maintenance', count: 34, avgTime: 12.8, satisfaction: 4.7 },
      { category: 'Installation', count: 21, avgTime: 28.5, satisfaction: 4.8 },
      { category: 'Consultation', count: 12, avgTime: 8.2, satisfaction: 4.4 }
    ],
    technicianPerformance: [
      { technician: 'Raman Nair', tickets: 42, avgTime: 15.2, satisfaction: 4.8, revenue: 890000 },
      { technician: 'Suresh Kumar', tickets: 38, avgTime: 17.8, satisfaction: 4.6, revenue: 756000 },
      { technician: 'Priya Menon', tickets: 35, avgTime: 22.1, satisfaction: 4.7, revenue: 685000 }
    ],
    monthlyTrends: [
      { month: 'Oct', tickets: 45, resolution: 16.8, satisfaction: 4.4 },
      { month: 'Nov', tickets: 52, resolution: 18.2, satisfaction: 4.5 },
      { month: 'Dec', tickets: 59, resolution: 19.1, satisfaction: 4.6 }
    ]
  }

  useEffect(() => {
    setServiceTickets(sampleTickets)
    setTechnicians(sampleTechnicians)
    setAnalytics(sampleAnalytics)
  }, [])

  const filteredTickets = serviceTickets.filter((ticket: ServiceTicket) => {
    const matchesSearch = ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: ServiceTicket['status']): string => {
    const colors: Record<ServiceTicket['status'], string> = {
      'open': 'bg-blue-500/10 text-blue-700 border-blue-500/30',
      'assigned': 'bg-amber-500/10 text-amber-700 border-amber-500/30',
      'in_progress': 'bg-purple-500/10 text-purple-700 border-purple-500/30',
      'on_hold': 'bg-gray-500/10 text-gray-700 border-gray-500/30',
      'resolved': 'bg-green-500/10 text-green-700 border-green-500/30',
      'closed': 'bg-green-500/10 text-green-700 border-green-500/30',
      'cancelled': 'bg-red-500/10 text-red-700 border-red-500/30'
    }
    return colors[status] || colors.open
  }

  const getPriorityColor = (priority: ServiceTicket['priority']): string => {
    const colors: Record<ServiceTicket['priority'], string> = {
      'low': 'bg-gray-500/10 text-gray-700 border-gray-500/30',
      'medium': 'bg-amber-500/10 text-amber-700 border-amber-500/30',
      'high': 'bg-orange-500/10 text-orange-700 border-orange-500/30',
      'urgent': 'bg-red-500/10 text-red-700 border-red-500/30',
      'critical': 'bg-red-600/10 text-red-800 border-red-600/30'
    }
    return colors[priority] || colors.medium
  }

  const getStatusIcon = (status: ServiceTicket['status']) => {
    const icons: Record<ServiceTicket['status'], React.ElementType> = {
      'open': ClipboardList,
      'assigned': User,
      'in_progress': PlayCircle,
      'on_hold': PauseCircle,
      'resolved': CheckCircle,
      'closed': CheckSquare,
      'cancelled': XCircle
    }
    return icons[status] || ClipboardList
  }

  const getCategoryIcon = (category: ServiceTicket['category']) => {
    const icons: Record<ServiceTicket['category'], React.ElementType> = {
      'repair': Wrench,
      'maintenance': Settings,
      'installation': Package,
      'consultation': MessageSquare,
      'warranty': Shield
    }
    return icons[category] || Wrench
  }

  const getAvailabilityColor = (availability: ServiceTechnician['availability']): string => {
    const colors: Record<ServiceTechnician['availability'], string> = {
      'available': 'bg-green-500/10 text-green-700 border-green-500/30',
      'busy': 'bg-red-500/10 text-red-700 border-red-500/30',
      'on_leave': 'bg-gray-500/10 text-gray-700 border-gray-500/30',
      'off_duty': 'bg-amber-500/10 text-amber-700 border-amber-500/30'
    }
    return colors[availability] || colors.available
  }

  const calculateTotalRevenue = (): number => {
    return serviceTickets.reduce((sum: number, ticket: ServiceTicket) => sum + (ticket.actualCost || ticket.estimatedCost), 0)
  }

  const getAverageResolutionTime = (): number => {
    const resolvedTickets = serviceTickets.filter(ticket => ticket.status === 'resolved' || ticket.status === 'closed')
    const totalTime = resolvedTickets.reduce((sum, ticket) => sum + (ticket.actualDuration || 0), 0)
    return resolvedTickets.length > 0 ? totalTime / resolvedTickets.length : 0
  }

  const getCustomerSatisfaction = (): number => {
    const ratedTickets = serviceTickets.filter(ticket => ticket.resolution?.satisfactionRating)
    const totalRating = ratedTickets.reduce((sum, ticket) => sum + (ticket.resolution?.satisfactionRating || 0), 0)
    return ratedTickets.length > 0 ? totalRating / ratedTickets.length : 0
  }

  const getSLACompliance = (): number => {
    const completedTickets = serviceTickets.filter(ticket => ticket.slaMetrics.resolutionTime !== undefined)
    const onTimeTickets = completedTickets.filter(ticket => !ticket.slaMetrics.breached)
    return completedTickets.length > 0 ? (onTimeTickets.length / completedTickets.length) * 100 : 0
  }

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <Wrench className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Service Management</h1>
                  <p className="text-lg text-gray-300">Kerala Furniture Customer Service Operations</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/10 text-green-700 border-green-500/30">
                  <Activity className="h-3 w-3 mr-1" />
                  Service Active
                </Badge>
                <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                  <Plus className="h-4 w-4" />
                  New Ticket
                </Button>
              </div>
            </div>
          </div>

          {/* Service KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Service Revenue</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">₹{(calculateTotalRevenue() / 100000).toFixed(1)}L</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Total service income</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Timer className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Avg Resolution</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getAverageResolutionTime().toFixed(1)}h</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Resolution time</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Satisfaction</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getCustomerSatisfaction().toFixed(1)}/5</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Customer rating</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">SLA Compliance</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getSLACompliance().toFixed(1)}%</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">On-time resolution</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="jewelry-glass-card p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input
                    placeholder="Search tickets, customers, or products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 jewelry-glass-input"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                  className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                >
                  All Status
                </Button>
                <Button
                  variant={filterStatus === 'open' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('open')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <ClipboardList className="h-4 w-4" />
                  Open
                </Button>
                <Button
                  variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('in_progress')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <PlayCircle className="h-4 w-4" />
                  In Progress
                </Button>
                <Button
                  variant={filterPriority === 'urgent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterPriority(filterPriority === 'urgent' ? 'all' : 'urgent')}
                  className="jewelry-glass-btn gap-1 text-red-700 hover:text-red-600"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Urgent
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="tickets" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="tickets" className="jewelry-glass-btn jewelry-text-luxury">Service Tickets</TabsTrigger>
              <TabsTrigger value="technicians" className="jewelry-glass-btn jewelry-text-luxury">Technicians</TabsTrigger>
              <TabsTrigger value="analytics" className="jewelry-glass-btn jewelry-text-luxury">Analytics</TabsTrigger>
              <TabsTrigger value="knowledge" className="jewelry-glass-btn jewelry-text-luxury">Knowledge Base</TabsTrigger>
            </TabsList>

            {/* Service Tickets */}
            <TabsContent value="tickets" className="space-y-4">
              <div className="space-y-4">
                {filteredTickets.map((ticket: ServiceTicket) => {
                  const StatusIcon = getStatusIcon(ticket.status)
                  const CategoryIcon = getCategoryIcon(ticket.category)
                  
                  return (
                    <div key={ticket.id} className="jewelry-glass-card p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                            <StatusIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold jewelry-text-luxury">{ticket.title}</h3>
                              <Badge className={getStatusColor(ticket.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.replace('_', ' ').slice(1)}
                              </Badge>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                              </Badge>
                              <Badge variant="outline" className="jewelry-badge-text">
                                <CategoryIcon className="h-3 w-3 mr-1" />
                                {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-300 mb-4">{ticket.description}</p>
                            
                            {/* Customer & Service Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium text-gray-200">Customer:</span> {ticket.customer.name}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Ticket:</span> {ticket.ticketNumber}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Created:</span> {new Date(ticket.createdDate).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Service Level:</span> {ticket.serviceLevel.charAt(0).toUpperCase() + ticket.serviceLevel.slice(1)}
                              </div>
                            </div>

                            {/* Technician & Progress */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium text-gray-200">Technician:</span> {ticket.assignedTechnician?.name || 'Unassigned'}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Est. Duration:</span> {ticket.estimatedDuration}h
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Est. Cost:</span> ₹{ticket.estimatedCost.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Location:</span> {ticket.location.type.replace('_', ' ')}
                              </div>
                            </div>

                            {/* Product Info */}
                            {ticket.product && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-300 mb-4">
                                <div>
                                  <span className="font-medium text-gray-200">Product:</span> {ticket.product.name}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-200">Model:</span> {ticket.product.model}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-200">Warranty:</span> {ticket.product.warrantyStatus}
                                </div>
                              </div>
                            )}

                            {/* Resolution Info */}
                            {ticket.resolution && (
                              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 mb-4">
                                <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Resolution Summary
                                </div>
                                <p className="text-sm text-gray-300 mb-2">{ticket.resolution.summary}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-amber-500" />
                                    <span className="jewelry-text-luxury">{ticket.resolution.satisfactionRating}/5</span>
                                  </div>
                                  <div className="text-gray-300">
                                    Labor: {ticket.resolution.laborTime}h
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* SLA Metrics */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">SLA Progress</span>
                                <span className="text-sm font-medium jewelry-text-luxury">
                                  {ticket.slaMetrics.resolutionTime || 0}h / {ticket.slaMetrics.resolutionTarget}h
                                </span>
                              </div>
                              <Progress 
                                value={Math.min(((ticket.slaMetrics.resolutionTime || 0) / ticket.slaMetrics.resolutionTarget) * 100, 100)} 
                                className="h-2" 
                              />
                              <div className="flex justify-between text-xs text-gray-300">
                                <span>Response: {ticket.slaMetrics.responseTime}h</span>
                                <span className={ticket.slaMetrics.breached ? 'text-red-500' : 'text-green-500'}>
                                  {ticket.slaMetrics.breached ? 'SLA Breached' : 'On Track'}
                                </span>
                              </div>
                            </div>

                            {/* Tags */}
                            {ticket.tags.length > 0 && (
                              <div>
                                <div className="flex flex-wrap gap-2">
                                  {ticket.tags.map((tag: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs jewelry-badge-text">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <MessageSquare className="h-3 w-3" />
                            Message
                          </Button>
                          {ticket.status === 'open' && (
                            <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 text-blue-700">
                              <User className="h-3 w-3" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Technicians */}
            <TabsContent value="technicians" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {technicians.map((technician: ServiceTechnician) => (
                  <div key={technician.id} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold jewelry-text-luxury">{technician.name}</h3>
                          <p className="text-sm text-gray-300">{technician.employeeId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="font-medium jewelry-text-luxury">{technician.rating}/5</span>
                        </div>
                        <Badge className={getAvailabilityColor(technician.availability)}>
                          {technician.availability.replace('_', ' ').charAt(0).toUpperCase() + technician.availability.replace('_', ' ').slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div>
                          <span className="font-medium text-gray-200">Experience:</span> {technician.experience} years
                        </div>
                        <div>
                          <span className="font-medium text-gray-200">Assigned:</span> {technician.assignedTickets} tickets
                        </div>
                        <div>
                          <span className="font-medium text-gray-200">Completed Today:</span> {technician.completedToday}
                        </div>
                        <div>
                          <span className="font-medium text-gray-200">Location:</span> {technician.currentLocation.address}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury mb-2">Specializations:</p>
                        <div className="flex flex-wrap gap-2">
                          {technician.specialization.map((spec: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury mb-2">Skills:</p>
                        <div className="space-y-2">
                          {technician.skills.slice(0, 3).map((skill, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm text-gray-300">{skill.category}</span>
                              <Badge variant="outline" className="text-xs">
                                {skill.level.charAt(0).toUpperCase() + skill.level.slice(1)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury mb-2">Certifications:</p>
                        <div className="flex flex-wrap gap-2">
                          {technician.certification.map((cert: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs jewelry-badge-text">
                              <Award className="h-3 w-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                          <Eye className="h-3 w-3" />
                          Profile
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                          <Calendar className="h-3 w-3" />
                          Schedule
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                          <MessageSquare className="h-3 w-3" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              {analytics && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Category Performance */}
                    <div className="jewelry-glass-card p-6">
                      <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Service Category Performance</h3>
                      <div className="space-y-4">
                        {analytics.categoryBreakdown.map((category, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div>
                              <div className="font-medium jewelry-text-luxury">{category.category}</div>
                              <div className="text-sm text-gray-300">{category.count} tickets</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold jewelry-text-luxury">{category.avgTime.toFixed(1)}h avg</div>
                              <div className="text-sm text-green-600">{category.satisfaction.toFixed(1)}/5 rating</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technician Performance */}
                    <div className="jewelry-glass-card p-6">
                      <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Technician Performance</h3>
                      <div className="space-y-4">
                        {analytics.technicianPerformance.map((tech, index: number) => (
                          <div key={index} className="p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium jewelry-text-luxury">{tech.technician}</div>
                              <div className="font-semibold jewelry-text-luxury">₹{(tech.revenue / 100000).toFixed(1)}L</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm text-gray-300">
                              <div>{tech.tickets} tickets</div>
                              <div>{tech.avgTime.toFixed(1)}h avg</div>
                              <div>{tech.satisfaction.toFixed(1)}/5 rating</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Key Performance Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="jewelry-glass-card p-6 text-center">
                      <div className="text-3xl font-bold jewelry-text-gold">{analytics.firstCallResolution.toFixed(1)}%</div>
                      <div className="text-sm text-gray-300">First Call Resolution</div>
                      <div className="text-xs text-gray-300 mt-1">Target: &gt;75%</div>
                    </div>
                    <div className="jewelry-glass-card p-6 text-center">
                      <div className="text-3xl font-bold jewelry-text-gold">{analytics.technicianUtilization.toFixed(1)}%</div>
                      <div className="text-sm text-gray-300">Technician Utilization</div>
                      <div className="text-xs text-gray-300 mt-1">Optimal: 80-90%</div>
                    </div>
                    <div className="jewelry-glass-card p-6 text-center">
                      <div className="text-3xl font-bold jewelry-text-gold">₹{(analytics.revenue / 1000000).toFixed(1)}M</div>
                      <div className="text-sm text-gray-300">Service Revenue</div>
                      <div className="text-xs text-gray-300 mt-1">This quarter</div>
                    </div>
                    <div className="jewelry-glass-card p-6 text-center">
                      <div className="text-3xl font-bold jewelry-text-gold">{analytics.profitMargin.toFixed(1)}%</div>
                      <div className="text-sm text-gray-300">Profit Margin</div>
                      <div className="text-xs text-gray-300 mt-1">After costs</div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Knowledge Base */}
            <TabsContent value="knowledge" className="space-y-4">
              <div className="jewelry-glass-card p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium jewelry-text-luxury mb-2">Service Knowledge Base</h3>
                <p className="text-gray-300 mb-4">Comprehensive documentation and troubleshooting guides</p>
                <Button className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                  Browse Articles
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}