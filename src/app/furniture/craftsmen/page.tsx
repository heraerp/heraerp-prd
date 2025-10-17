'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  Users,
  User,
  UserPlus,
  UserCheck,
  UserX,
  Star,
  Award,
  Hammer,
  TreePine,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Settings,
  Plus,
  Minus,
  Save,
  X,
  RefreshCw,
  FileText,
  Camera,
  Briefcase,
  GraduationCap,
  BookOpen,
  Wrench,
  Palette,
  Ruler,
  Scissors,
  Package,
  Truck,
  Building2,
  Home,
  CreditCard,
  Receipt,
  Percent,
  Calculator,
  Globe,
  Smartphone,
  Wifi,
  MessageSquare,
  Video,
  Send,
  Share2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  MoreVertical,
  Copy,
  Archive,
  Bookmark,
  Flag,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Shield,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react'

interface Craftsman {
  id: string
  name: string
  photo: string
  specialty: string[]
  experience: number
  skillLevel: 'apprentice' | 'journeyman' | 'master' | 'grandmaster'
  status: 'active' | 'on_leave' | 'training' | 'retired' | 'inactive'
  location: string
  phone: string
  email: string
  joinDate: string
  birthDate: string
  address: string
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  payroll: {
    employeeId: string
    payType: 'hourly' | 'daily' | 'piece_rate' | 'monthly'
    rate: number
    overtimeRate: number
    benefits: string[]
  }
  performance: {
    qualityScore: number
    productivityScore: number
    attendanceRate: number
    customerRating: number
    completedProjects: number
    totalEarnings: number
  }
  skills: {
    [key: string]: number // skill name -> proficiency level (1-100)
  }
  certifications: {
    name: string
    issuer: string
    issueDate: string
    expiryDate?: string
    verified: boolean
  }[]
  projects: {
    id: string
    name: string
    role: string
    status: string
    startDate: string
    endDate?: string
    earnings: number
  }[]
  training: {
    id: string
    course: string
    provider: string
    status: 'enrolled' | 'in_progress' | 'completed' | 'failed'
    startDate: string
    endDate?: string
    score?: number
  }[]
  equipment: {
    id: string
    name: string
    type: string
    assignedDate: string
    condition: 'excellent' | 'good' | 'fair' | 'needs_repair'
    value: number
  }[]
  notes: string
  tags: string[]
}

interface CraftsmanMetrics {
  totalCraftsmen: number
  activeCraftsmen: number
  masterCraftsmen: number
  averageExperience: number
  averageQualityScore: number
  totalPayroll: number
  productivityIndex: number
  retentionRate: number
}

interface Skill {
  name: string
  category: string
  description: string
  importance: 'low' | 'medium' | 'high' | 'critical'
}

export default function CraftsmenManagement() {
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([])
  const [selectedCraftsman, setSelectedCraftsman] = useState<Craftsman | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSkillLevel, setFilterSkillLevel] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Sample craftsmen data for Kerala furniture business
  const sampleCraftsmen: Craftsman[] = [
    {
      id: 'CRF-001',
      name: 'Raman Master',
      photo: '/craftsmen/raman.jpg',
      specialty: ['Traditional Carving', 'Mortise & Tenon', 'Hand Finishing'],
      experience: 35,
      skillLevel: 'grandmaster',
      status: 'active',
      location: 'Thrissur, Kerala',
      phone: '+91 98470 12345',
      email: 'raman.master@keralafurniture.com',
      joinDate: '1998-03-15',
      birthDate: '1965-08-22',
      address: 'TC 12/456, Vadakkumnathan Temple Road, Thrissur 680001',
      emergencyContact: {
        name: 'Lakshmi Raman',
        relationship: 'Wife',
        phone: '+91 94470 54321'
      },
      payroll: {
        employeeId: 'EMP001',
        payType: 'monthly',
        rate: 45000,
        overtimeRate: 500,
        benefits: ['Health Insurance', 'Provident Fund', 'Skill Bonus', 'Festival Bonus']
      },
      performance: {
        qualityScore: 98,
        productivityScore: 92,
        attendanceRate: 96,
        customerRating: 4.9,
        completedProjects: 187,
        totalEarnings: 1580000
      },
      skills: {
        'Traditional Carving': 98,
        'Wood Selection': 95,
        'Mortise & Tenon': 100,
        'Hand Finishing': 96,
        'Design Understanding': 90,
        'Tool Maintenance': 94
      },
      certifications: [
        {
          name: 'Master Craftsman Certificate',
          issuer: 'Kerala Handicrafts Board',
          issueDate: '2005-12-01',
          verified: true
        },
        {
          name: 'Traditional Arts Preservation Award',
          issuer: 'Government of Kerala',
          issueDate: '2018-08-15',
          verified: true
        }
      ],
      projects: [
        {
          id: 'PRJ-001',
          name: 'ITC Grand Chola Executive Suite',
          role: 'Lead Craftsman',
          status: 'completed',
          startDate: '2024-01-01',
          endDate: '2024-01-15',
          earnings: 35000
        }
      ],
      training: [
        {
          id: 'TRN-001',
          course: 'Modern CAD for Traditional Crafts',
          provider: 'Kerala Institute of Technology',
          status: 'completed',
          startDate: '2023-11-01',
          endDate: '2023-12-15',
          score: 87
        }
      ],
      equipment: [
        {
          id: 'EQP-001',
          name: 'Premium Chisel Set',
          type: 'Hand Tools',
          assignedDate: '2023-01-01',
          condition: 'excellent',
          value: 15000
        }
      ],
      notes: 'Exceptional traditional craftsman. Mentor to 5 apprentices. Specializes in intricate temple-style carvings.',
      tags: ['Master', 'Mentor', 'Traditional', 'Reliable']
    },
    {
      id: 'CRF-002',
      name: 'Suresh Kumar',
      photo: '/craftsmen/suresh.jpg',
      specialty: ['Modern Joinery', 'CNC Programming', 'Assembly'],
      experience: 18,
      skillLevel: 'master',
      status: 'active',
      location: 'Kochi, Kerala',
      phone: '+91 98471 23456',
      email: 'suresh.kumar@keralafurniture.com',
      joinDate: '2006-07-20',
      birthDate: '1978-03-10',
      address: 'Flat 204, Skyline Apartments, Marine Drive, Kochi 682031',
      emergencyContact: {
        name: 'Priya Suresh',
        relationship: 'Wife',
        phone: '+91 94471 65432'
      },
      payroll: {
        employeeId: 'EMP002',
        payType: 'monthly',
        rate: 38000,
        overtimeRate: 450,
        benefits: ['Health Insurance', 'Provident Fund', 'Technology Bonus']
      },
      performance: {
        qualityScore: 94,
        productivityScore: 96,
        attendanceRate: 98,
        customerRating: 4.7,
        completedProjects: 142,
        totalEarnings: 1120000
      },
      skills: {
        'CNC Programming': 92,
        'Modern Joinery': 95,
        'CAD Software': 88,
        'Quality Control': 91,
        'Team Leadership': 85,
        'Process Optimization': 89
      },
      certifications: [
        {
          name: 'CNC Operator Certification',
          issuer: 'Industrial Training Institute',
          issueDate: '2019-06-15',
          expiryDate: '2024-06-15',
          verified: true
        }
      ],
      projects: [
        {
          id: 'PRJ-002',
          name: 'Marriott Hotel Furniture',
          role: 'Assembly Lead',
          status: 'in_progress',
          startDate: '2024-01-10',
          earnings: 28000
        }
      ],
      training: [
        {
          id: 'TRN-002',
          course: 'Advanced CNC Techniques',
          provider: 'Technical Training Center',
          status: 'in_progress',
          startDate: '2024-01-01'
        }
      ],
      equipment: [
        {
          id: 'EQP-002',
          name: 'Festool Domino Joiner',
          type: 'Power Tools',
          assignedDate: '2023-06-01',
          condition: 'good',
          value: 45000
        }
      ],
      notes: 'Excellent with modern techniques. Bridge between traditional and contemporary methods.',
      tags: ['Modern', 'Technical', 'Efficient', 'Trainer']
    },
    {
      id: 'CRF-003',
      name: 'Anitha Nair',
      photo: '/craftsmen/anitha.jpg',
      specialty: ['Upholstery', 'Fabric Selection', 'Cushion Making'],
      experience: 12,
      skillLevel: 'journeyman',
      status: 'on_leave',
      location: 'Kozhikode, Kerala',
      phone: '+91 98472 34567',
      email: 'anitha.nair@keralafurniture.com',
      joinDate: '2012-02-14',
      birthDate: '1985-11-05',
      address: 'House No. 45, Malappuram Road, Kozhikode 673001',
      emergencyContact: {
        name: 'Rajesh Nair',
        relationship: 'Husband',
        phone: '+91 94472 76543'
      },
      payroll: {
        employeeId: 'EMP003',
        payType: 'daily',
        rate: 1200,
        overtimeRate: 150,
        benefits: ['Health Insurance', 'Maternity Benefits']
      },
      performance: {
        qualityScore: 89,
        productivityScore: 87,
        attendanceRate: 92,
        customerRating: 4.6,
        completedProjects: 95,
        totalEarnings: 480000
      },
      skills: {
        'Hand Stitching': 94,
        'Pattern Making': 87,
        'Fabric Knowledge': 92,
        'Color Coordination': 89,
        'Detail Work': 95,
        'Customer Consultation': 78
      },
      certifications: [
        {
          name: 'Textile Design Certificate',
          issuer: 'Kerala State Institute of Design',
          issueDate: '2015-09-01',
          verified: true
        }
      ],
      projects: [
        {
          id: 'PRJ-003',
          name: 'Luxury Villa Seating',
          role: 'Upholstery Specialist',
          status: 'on_hold',
          startDate: '2023-12-01',
          earnings: 15000
        }
      ],
      training: [
        {
          id: 'TRN-003',
          course: 'International Upholstery Standards',
          provider: 'Furniture Institute',
          status: 'enrolled',
          startDate: '2024-02-01'
        }
      ],
      equipment: [
        {
          id: 'EQP-003',
          name: 'Industrial Sewing Machine',
          type: 'Upholstery Equipment',
          assignedDate: '2022-08-01',
          condition: 'good',
          value: 25000
        }
      ],
      notes: 'Currently on maternity leave. Expected to return in March 2024. Excellent attention to detail.',
      tags: ['Upholstery', 'Detail-Oriented', 'Creative', 'Reliable']
    },
    {
      id: 'CRF-004',
      name: 'Pradeep Chandran',
      photo: '/craftsmen/pradeep.jpg',
      specialty: ['Wood Finishing', 'Polishing', 'Staining'],
      experience: 22,
      skillLevel: 'master',
      status: 'active',
      location: 'Palakkad, Kerala',
      phone: '+91 98473 45678',
      email: 'pradeep.chandran@keralafurniture.com',
      joinDate: '2002-09-05',
      birthDate: '1972-04-18',
      address: 'Craftsman Colony, Palakkad Road, Palakkad 678001',
      emergencyContact: {
        name: 'Meera Pradeep',
        relationship: 'Wife',
        phone: '+91 94473 87654'
      },
      payroll: {
        employeeId: 'EMP004',
        payType: 'piece_rate',
        rate: 2500,
        overtimeRate: 0,
        benefits: ['Health Insurance', 'Performance Bonus']
      },
      performance: {
        qualityScore: 96,
        productivityScore: 91,
        attendanceRate: 94,
        customerRating: 4.8,
        completedProjects: 163,
        totalEarnings: 1340000
      },
      skills: {
        'French Polish': 98,
        'Spray Finishing': 94,
        'Wood Staining': 96,
        'Surface Preparation': 93,
        'Color Matching': 91,
        'Quality Inspection': 89
      },
      certifications: [
        {
          name: 'Advanced Finishing Techniques',
          issuer: 'Wood Technology Institute',
          issueDate: '2010-03-20',
          verified: true
        }
      ],
      projects: [
        {
          id: 'PRJ-004',
          name: 'Export Quality Dining Sets',
          role: 'Finish Specialist',
          status: 'completed',
          startDate: '2023-12-15',
          endDate: '2024-01-10',
          earnings: 32000
        }
      ],
      training: [
        {
          id: 'TRN-004',
          course: 'Eco-Friendly Finishing',
          provider: 'Green Technology Center',
          status: 'completed',
          startDate: '2023-09-01',
          endDate: '2023-10-15',
          score: 92
        }
      ],
      equipment: [
        {
          id: 'EQP-004',
          name: 'Professional Spray Gun Set',
          type: 'Finishing Equipment',
          assignedDate: '2023-03-01',
          condition: 'excellent',
          value: 35000
        }
      ],
      notes: 'Expert in traditional French polishing and modern spray techniques. Trains new finishers.',
      tags: ['Finishing Expert', 'Traditional', 'Trainer', 'Quality Focus']
    },
    {
      id: 'CRF-005',
      name: 'Arjun Menon',
      photo: '/craftsmen/arjun.jpg',
      specialty: ['Apprentice Carving', 'Basic Joinery'],
      experience: 2,
      skillLevel: 'apprentice',
      status: 'training',
      location: 'Thiruvananthapuram, Kerala',
      phone: '+91 98474 56789',
      email: 'arjun.menon@keralafurniture.com',
      joinDate: '2022-06-01',
      birthDate: '1998-12-03',
      address: 'Student Hostel, Industrial Training Institute, Trivandrum 695001',
      emergencyContact: {
        name: 'Vinod Menon',
        relationship: 'Father',
        phone: '+91 94474 98765'
      },
      payroll: {
        employeeId: 'EMP005',
        payType: 'monthly',
        rate: 18000,
        overtimeRate: 200,
        benefits: ['Training Allowance', 'Tool Allowance']
      },
      performance: {
        qualityScore: 76,
        productivityScore: 82,
        attendanceRate: 95,
        customerRating: 4.2,
        completedProjects: 12,
        totalEarnings: 54000
      },
      skills: {
        'Basic Carving': 65,
        'Wood Identification': 72,
        'Tool Handling': 78,
        'Safety Protocols': 89,
        'Learning Aptitude': 92,
        'Following Instructions': 88
      },
      certifications: [
        {
          name: 'Basic Woodworking Certificate',
          issuer: 'Industrial Training Institute',
          issueDate: '2023-06-01',
          verified: true
        }
      ],
      projects: [
        {
          id: 'PRJ-005',
          name: 'Simple Chair Assembly',
          role: 'Apprentice',
          status: 'in_progress',
          startDate: '2024-01-05',
          earnings: 2000
        }
      ],
      training: [
        {
          id: 'TRN-005',
          course: 'Traditional Carving Fundamentals',
          provider: 'Kerala Craftsman Guild',
          status: 'in_progress',
          startDate: '2023-10-01'
        }
      ],
      equipment: [
        {
          id: 'EQP-005',
          name: 'Basic Carving Tools',
          type: 'Apprentice Kit',
          assignedDate: '2022-06-01',
          condition: 'good',
          value: 5000
        }
      ],
      notes: 'Promising young apprentice. Shows good aptitude for traditional techniques. Under Raman Master\'s guidance.',
      tags: ['Apprentice', 'Promising', 'Traditional Path', 'Eager Learner']
    }
  ]

  // Sample skills database
  const skillsDatabase: Skill[] = [
    { name: 'Traditional Carving', category: 'Craftsmanship', description: 'Hand carving of intricate patterns and designs', importance: 'critical' },
    { name: 'Mortise & Tenon', category: 'Joinery', description: 'Traditional joinery technique for strong connections', importance: 'critical' },
    { name: 'Modern Joinery', category: 'Joinery', description: 'Contemporary joining methods using modern tools', importance: 'high' },
    { name: 'CNC Programming', category: 'Technology', description: 'Computer-controlled machining programming', importance: 'high' },
    { name: 'Hand Finishing', category: 'Finishing', description: 'Manual surface finishing and polishing', importance: 'high' },
    { name: 'French Polish', category: 'Finishing', description: 'Traditional shellac finishing technique', importance: 'medium' },
    { name: 'Upholstery', category: 'Upholstery', description: 'Fabric and cushion work for seating', importance: 'medium' },
    { name: 'Wood Selection', category: 'Materials', description: 'Identifying and selecting appropriate wood types', importance: 'high' },
    { name: 'Quality Control', category: 'Management', description: 'Inspection and quality assurance processes', importance: 'high' },
    { name: 'Safety Protocols', category: 'Safety', description: 'Workshop safety and accident prevention', importance: 'critical' }
  ]

  // Calculate metrics
  const calculateMetrics = (): CraftsmanMetrics => {
    const total = craftsmen.length
    const active = craftsmen.filter(c => c.status === 'active').length
    const masters = craftsmen.filter(c => ['master', 'grandmaster'].includes(c.skillLevel)).length
    const avgExp = craftsmen.reduce((sum, c) => sum + c.experience, 0) / total || 0
    const avgQuality = craftsmen.reduce((sum, c) => sum + c.performance.qualityScore, 0) / total || 0
    const totalPay = craftsmen.reduce((sum, c) => sum + c.performance.totalEarnings, 0)
    const avgProd = craftsmen.reduce((sum, c) => sum + c.performance.productivityScore, 0) / total || 0
    const avgAttendance = craftsmen.reduce((sum, c) => sum + c.performance.attendanceRate, 0) / total || 0

    return {
      totalCraftsmen: total,
      activeCraftsmen: active,
      masterCraftsmen: masters,
      averageExperience: avgExp,
      averageQualityScore: avgQuality,
      totalPayroll: totalPay,
      productivityIndex: avgProd,
      retentionRate: avgAttendance
    }
  }

  useEffect(() => {
    setCraftsmen(sampleCraftsmen)
  }, [])

  const metrics = calculateMetrics()

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'bg-green-500/10 text-green-600 border-green-500/20',
      'on_leave': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'training': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'retired': 'bg-gray-500/10 text-gray-300 border-gray-500/20',
      'inactive': 'bg-red-500/10 text-red-600 border-red-500/20'
    }
    return colors[status] || colors.inactive
  }

  const getSkillLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'apprentice': 'text-blue-500',
      'journeyman': 'text-amber-500',
      'master': 'text-purple-500',
      'grandmaster': 'text-gold-500'
    }
    return colors[level] || colors.apprentice
  }

  const getSkillLevelIcon = (level: string) => {
    const icons: Record<string, React.ElementType> = {
      'apprentice': BookOpen,
      'journeyman': Wrench,
      'master': Award,
      'grandmaster': Star
    }
    return icons[level] || BookOpen
  }

  const filteredAndSortedCraftsmen = craftsmen
    .filter(craftsman => {
      const matchesSearch = craftsman.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           craftsman.specialty.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           craftsman.location.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesSpecialty = filterSpecialty === 'all' || 
                              craftsman.specialty.some(s => s.toLowerCase().includes(filterSpecialty.toLowerCase()))
      
      const matchesStatus = filterStatus === 'all' || craftsman.status === filterStatus
      const matchesSkillLevel = filterSkillLevel === 'all' || craftsman.skillLevel === filterSkillLevel
      
      return matchesSearch && matchesSpecialty && matchesStatus && matchesSkillLevel
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'experience':
          comparison = a.experience - b.experience
          break
        case 'quality':
          comparison = a.performance.qualityScore - b.performance.qualityScore
          break
        case 'earnings':
          comparison = a.performance.totalEarnings - b.performance.totalEarnings
          break
        default:
          comparison = a.name.localeCompare(b.name)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const openCraftsmanDetails = (craftsman: Craftsman) => {
    setSelectedCraftsman(craftsman)
    setActiveTab('details')
  }

  const closeCraftsmanDetails = () => {
    setSelectedCraftsman(null)
    setIsEditing(false)
    setActiveTab('overview')
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
                  <Users className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Craftsmen Management</h1>
                  <p className="text-lg text-gray-300">Kerala Traditional Furniture Master Craftsmen</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Users className="h-3 w-3 mr-1" />
                  {metrics.activeCraftsmen} Active
                </Badge>
                <Button 
                  className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold"
                  onClick={() => setIsCreating(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Add Craftsman
                </Button>
              </div>
            </div>
          </div>

          {/* Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="jewelry-glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Total Craftsmen</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{metrics.totalCraftsmen}</p>
                </div>
                <Users className="h-8 w-8 jewelry-text-gold" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-gray-300">{metrics.masterCraftsmen} Masters</span>
                </div>
              </div>
            </div>

            <div className="jewelry-glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Avg Experience</p>
                  <p className="text-2xl font-bold text-blue-500">{metrics.averageExperience.toFixed(1)} years</p>
                </div>
                <Award className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <Progress value={(metrics.averageExperience / 40) * 100} className="h-2" />
              </div>
            </div>

            <div className="jewelry-glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Quality Score</p>
                  <p className="text-2xl font-bold text-green-500">{metrics.averageQualityScore.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2">
                <Progress value={metrics.averageQualityScore} className="h-2" />
              </div>
            </div>

            <div className="jewelry-glass-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Total Earnings</p>
                  <p className="text-2xl font-bold jewelry-text-gold">₹{(metrics.totalPayroll / 100000).toFixed(1)}L</p>
                </div>
                <DollarSign className="h-8 w-8 jewelry-text-gold" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">+12% this quarter</span>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="overview" className="jewelry-glass-btn jewelry-text-luxury">
                Overview
              </TabsTrigger>
              <TabsTrigger value="skills" className="jewelry-glass-btn jewelry-text-luxury">
                Skills Matrix
              </TabsTrigger>
              <TabsTrigger value="performance" className="jewelry-glass-btn jewelry-text-luxury">
                Performance
              </TabsTrigger>
              <TabsTrigger value="payroll" className="jewelry-glass-btn jewelry-text-luxury">
                Payroll
              </TabsTrigger>
              <TabsTrigger value="training" className="jewelry-glass-btn jewelry-text-luxury">
                Training
              </TabsTrigger>
              {selectedCraftsman && (
                <TabsTrigger value="details" className="jewelry-glass-btn jewelry-text-luxury">
                  <User className="h-3 w-3 mr-1" />
                  {selectedCraftsman.name}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Search and Filters */}
              <div className="jewelry-glass-card p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search craftsmen by name, specialty, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 jewelry-glass-input"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterSpecialty}
                      onChange={(e) => setFilterSpecialty(e.target.value)}
                      className="px-3 py-2 jewelry-glass-input w-40"
                    >
                      <option value="all">All Specialties</option>
                      <option value="carving">Carving</option>
                      <option value="joinery">Joinery</option>
                      <option value="finishing">Finishing</option>
                      <option value="upholstery">Upholstery</option>
                    </select>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 jewelry-glass-input w-32"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="on_leave">On Leave</option>
                      <option value="training">Training</option>
                      <option value="retired">Retired</option>
                    </select>
                    <select
                      value={filterSkillLevel}
                      onChange={(e) => setFilterSkillLevel(e.target.value)}
                      className="px-3 py-2 jewelry-glass-input w-36"
                    >
                      <option value="all">All Levels</option>
                      <option value="apprentice">Apprentice</option>
                      <option value="journeyman">Journeyman</option>
                      <option value="master">Master</option>
                      <option value="grandmaster">Grandmaster</option>
                    </select>
                    <div className="flex bg-white/10 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'jewelry-text-luxury'}`}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'jewelry-text-luxury'}`}
                      >
                        <Activity className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Craftsmen Grid/List */}
              <div className={viewMode === 'grid' ? 
                'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
                'space-y-4'
              }>
                {filteredAndSortedCraftsmen.map((craftsman) => {
                  const SkillIcon = getSkillLevelIcon(craftsman.skillLevel)
                  return (
                    <div 
                      key={craftsman.id} 
                      className={`jewelry-glass-card p-6 jewelry-scale-hover cursor-pointer ${
                        viewMode === 'list' ? 'flex items-center gap-6' : ''
                      }`}
                      onClick={() => openCraftsmanDetails(craftsman)}
                    >
                      <div className={viewMode === 'list' ? 'flex-1' : ''}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold jewelry-text-luxury">{craftsman.name}</h3>
                              <p className="text-sm text-gray-300">{craftsman.experience} years experience</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={getStatusColor(craftsman.status)}>
                              {craftsman.status.replace('_', ' ')}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <SkillIcon className={`h-3 w-3 ${getSkillLevelColor(craftsman.skillLevel)}`} />
                              <span className={`text-xs ${getSkillLevelColor(craftsman.skillLevel)}`}>
                                {craftsman.skillLevel}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium jewelry-text-luxury mb-1">Specialties:</p>
                            <div className="flex flex-wrap gap-1">
                              {craftsman.specialty.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs jewelry-badge-text">
                                  {skill}
                                </Badge>
                              ))}
                              {craftsman.specialty.length > 3 && (
                                <Badge variant="outline" className="text-xs jewelry-badge-text">
                                  +{craftsman.specialty.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Target className="h-3 w-3 jewelry-text-gold" />
                              <span className="text-gray-300">Quality: {craftsman.performance.qualityScore}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-3 w-3 jewelry-text-gold" />
                              <span className="text-gray-300">Projects: {craftsman.performance.completedProjects}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 jewelry-text-gold" />
                              <span className="text-gray-300">{craftsman.location.split(',')[0]}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="h-3 w-3 jewelry-text-gold" />
                              <span className="text-gray-300">Rating: {craftsman.performance.customerRating}</span>
                            </div>
                          </div>

                          <div className="pt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="jewelry-text-luxury">Performance</span>
                              <span className="text-gray-300">{craftsman.performance.productivityScore}%</span>
                            </div>
                            <Progress value={craftsman.performance.productivityScore} className="h-2" />
                          </div>
                        </div>
                      </div>

                      {viewMode === 'list' && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                            <Phone className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Skills Matrix Tab */}
            <TabsContent value="skills" className="space-y-6">
              <div className="jewelry-glass-card p-6">
                <h2 className="text-xl font-semibold jewelry-text-luxury mb-6">Skills Matrix & Competency Mapping</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-3 jewelry-text-luxury">Craftsman</th>
                        {skillsDatabase.slice(0, 6).map((skill) => (
                          <th key={skill.name} className="text-center p-2 jewelry-text-luxury text-xs">
                            {skill.name}
                          </th>
                        ))}
                        <th className="text-center p-3 jewelry-text-luxury">Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {craftsmen.map((craftsman) => (
                        <tr key={craftsman.id} className="border-b border-white/5">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium jewelry-text-luxury text-sm">{craftsman.name}</p>
                                <p className="text-xs text-gray-300">{craftsman.skillLevel}</p>
                              </div>
                            </div>
                          </td>
                          {skillsDatabase.slice(0, 6).map((skill) => {
                            const level = craftsman.skills[skill.name] || 0
                            return (
                              <td key={skill.name} className="p-2 text-center">
                                <div className="w-12 h-12 mx-auto relative">
                                  <div className="w-full h-full rounded-full bg-white/10">
                                    <div 
                                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                                      style={{ width: `${level}%` }}
                                    />
                                  </div>
                                  <span className="absolute inset-0 flex items-center justify-center text-xs jewelry-text-luxury">
                                    {level}
                                  </span>
                                </div>
                              </td>
                            )
                          })}
                          <td className="p-3 text-center">
                            <span className="font-medium jewelry-text-gold">
                              {Math.round(Object.values(craftsman.skills).reduce((sum, val) => sum + val, 0) / Object.keys(craftsman.skills).length)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Skills Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Skill Gaps Analysis</h3>
                  <div className="space-y-3">
                    {skillsDatabase.filter(s => s.importance === 'critical').map((skill) => {
                      const avgLevel = craftsmen.reduce((sum, c) => sum + (c.skills[skill.name] || 0), 0) / craftsmen.length
                      const gap = 90 - avgLevel
                      return (
                        <div key={skill.name} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium jewelry-text-luxury">{skill.name}</span>
                            <Badge className={gap > 20 ? 'bg-red-500/10 text-red-600' : gap > 10 ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'}>
                              {gap > 0 ? `${gap.toFixed(0)}% gap` : 'Sufficient'}
                            </Badge>
                          </div>
                          <Progress value={avgLevel} className="h-2" />
                          <p className="text-xs text-gray-300 mt-1">Team average: {avgLevel.toFixed(0)}%</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Training Recommendations</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <div className="flex items-center gap-2 text-amber-600 font-medium">
                        <GraduationCap className="h-4 w-4" />
                        CNC Programming Training
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        5 craftsmen need advanced CNC training to meet export requirements
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-600 font-medium">
                        <BookOpen className="h-4 w-4" />
                        Traditional Carving Workshop
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Apprentices need basic traditional carving fundamentals
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <Shield className="h-4 w-4" />
                        Safety Protocol Update
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        All craftsmen need updated safety training for new equipment
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Top Performers</h3>
                  <div className="space-y-3">
                    {craftsmen
                      .sort((a, b) => b.performance.qualityScore - a.performance.qualityScore)
                      .slice(0, 5)
                      .map((craftsman, index) => (
                        <div key={craftsman.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                            }`}>
                              <span className="text-xs font-bold text-white">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium jewelry-text-luxury">{craftsman.name}</p>
                              <p className="text-xs text-gray-300">{craftsman.specialty[0]}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-500">{craftsman.performance.qualityScore}%</p>
                            <p className="text-xs text-gray-300">{craftsman.performance.completedProjects} projects</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Performance Distribution</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm jewelry-text-luxury">Excellent (90%+)</span>
                        <span className="text-sm text-gray-300">
                          {craftsmen.filter(c => c.performance.qualityScore >= 90).length} craftsmen
                        </span>
                      </div>
                      <Progress value={(craftsmen.filter(c => c.performance.qualityScore >= 90).length / craftsmen.length) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm jewelry-text-luxury">Good (80-89%)</span>
                        <span className="text-sm text-gray-300">
                          {craftsmen.filter(c => c.performance.qualityScore >= 80 && c.performance.qualityScore < 90).length} craftsmen
                        </span>
                      </div>
                      <Progress value={(craftsmen.filter(c => c.performance.qualityScore >= 80 && c.performance.qualityScore < 90).length / craftsmen.length) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm jewelry-text-luxury">Average (70-79%)</span>
                        <span className="text-sm text-gray-300">
                          {craftsmen.filter(c => c.performance.qualityScore >= 70 && c.performance.qualityScore < 80).length} craftsmen
                        </span>
                      </div>
                      <Progress value={(craftsmen.filter(c => c.performance.qualityScore >= 70 && c.performance.qualityScore < 80).length / craftsmen.length) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm jewelry-text-luxury">Needs Improvement (&lt;70%)</span>
                        <span className="text-sm text-gray-300">
                          {craftsmen.filter(c => c.performance.qualityScore < 70).length} craftsmen
                        </span>
                      </div>
                      <Progress value={(craftsmen.filter(c => c.performance.qualityScore < 70).length / craftsmen.length) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Performance List */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Individual Performance Overview</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-3 jewelry-text-luxury">Craftsman</th>
                        <th className="text-center p-3 jewelry-text-luxury">Quality</th>
                        <th className="text-center p-3 jewelry-text-luxury">Productivity</th>
                        <th className="text-center p-3 jewelry-text-luxury">Attendance</th>
                        <th className="text-center p-3 jewelry-text-luxury">Rating</th>
                        <th className="text-center p-3 jewelry-text-luxury">Projects</th>
                        <th className="text-center p-3 jewelry-text-luxury">Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {craftsmen.map((craftsman) => (
                        <tr key={craftsman.id} className="border-b border-white/5">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium jewelry-text-luxury">{craftsman.name}</p>
                                <p className="text-xs text-gray-300">{craftsman.skillLevel}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`font-medium ${
                              craftsman.performance.qualityScore >= 90 ? 'text-green-500' :
                              craftsman.performance.qualityScore >= 80 ? 'text-blue-500' :
                              craftsman.performance.qualityScore >= 70 ? 'text-amber-500' : 'text-red-500'
                            }`}>
                              {craftsman.performance.qualityScore}%
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="jewelry-text-luxury">{craftsman.performance.productivityScore}%</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="jewelry-text-luxury">{craftsman.performance.attendanceRate}%</span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3 w-3 text-amber-500" />
                              <span className="jewelry-text-luxury">{craftsman.performance.customerRating}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="jewelry-text-luxury">{craftsman.performance.completedProjects}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="jewelry-text-luxury">₹{(craftsman.performance.totalEarnings / 100000).toFixed(1)}L</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Payroll Tab */}
            <TabsContent value="payroll" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payroll Summary */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Payroll Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Total Monthly</span>
                      <span className="font-bold jewelry-text-gold">₹{craftsmen.reduce((sum, c) => sum + (c.payroll.payType === 'monthly' ? c.payroll.rate : c.payroll.rate * 30), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Average per Craftsman</span>
                      <span className="jewelry-text-luxury">₹{(craftsmen.reduce((sum, c) => sum + (c.payroll.payType === 'monthly' ? c.payroll.rate : c.payroll.rate * 30), 0) / craftsmen.length).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Benefits Cost</span>
                      <span className="jewelry-text-luxury">₹45,000</span>
                    </div>
                    <div className="border-t border-white/10 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium jewelry-text-luxury">Total Cost</span>
                        <span className="font-bold text-green-500">₹{(craftsmen.reduce((sum, c) => sum + (c.payroll.payType === 'monthly' ? c.payroll.rate : c.payroll.rate * 30), 0) + 45000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pay Structure Distribution */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Pay Structure</h3>
                  <div className="space-y-3">
                    {['monthly', 'daily', 'piece_rate', 'hourly'].map((type) => {
                      const count = craftsmen.filter(c => c.payroll.payType === type).length
                      const percentage = (count / craftsmen.length) * 100
                      return (
                        <div key={type} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="jewelry-text-luxury capitalize">{type.replace('_', ' ')}</span>
                            <span className="text-gray-300">{count} craftsmen</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <p className="text-xs text-gray-300 mt-1">{percentage.toFixed(0)}% of workforce</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Benefits Overview */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Benefits Coverage</h3>
                  <div className="space-y-3">
                    {['Health Insurance', 'Provident Fund', 'Skill Bonus', 'Performance Bonus'].map((benefit) => {
                      const count = craftsmen.filter(c => c.payroll.benefits.includes(benefit)).length
                      const percentage = (count / craftsmen.length) * 100
                      return (
                        <div key={benefit} className="flex items-center justify-between p-2">
                          <span className="text-sm jewelry-text-luxury">{benefit}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-300">{count}/{craftsmen.length}</span>
                            <CheckCircle className={`h-3 w-3 ${percentage === 100 ? 'text-green-500' : 'text-amber-500'}`} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Detailed Payroll Table */}
              <div className="jewelry-glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold jewelry-text-luxury">Individual Payroll Details</h3>
                  <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                    <Download className="h-4 w-4" />
                    Export Payroll
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-3 jewelry-text-luxury">Employee</th>
                        <th className="text-center p-3 jewelry-text-luxury">ID</th>
                        <th className="text-center p-3 jewelry-text-luxury">Pay Type</th>
                        <th className="text-center p-3 jewelry-text-luxury">Rate</th>
                        <th className="text-center p-3 jewelry-text-luxury">Monthly Est.</th>
                        <th className="text-center p-3 jewelry-text-luxury">Benefits</th>
                        <th className="text-center p-3 jewelry-text-luxury">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {craftsmen.map((craftsman) => (
                        <tr key={craftsman.id} className="border-b border-white/5">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium jewelry-text-luxury">{craftsman.name}</p>
                                <p className="text-xs text-gray-300">{craftsman.skillLevel}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-sm jewelry-text-luxury">{craftsman.payroll.employeeId}</span>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="jewelry-badge-text">
                              {craftsman.payroll.payType.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <span className="jewelry-text-luxury">₹{craftsman.payroll.rate.toLocaleString()}</span>
                            <span className="text-xs text-gray-300 block">
                              {craftsman.payroll.payType === 'monthly' ? '/month' : 
                               craftsman.payroll.payType === 'daily' ? '/day' :
                               craftsman.payroll.payType === 'hourly' ? '/hour' : '/piece'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="jewelry-text-luxury">
                              ₹{(craftsman.payroll.payType === 'monthly' ? craftsman.payroll.rate : craftsman.payroll.rate * 30).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-xs jewelry-text-luxury">{craftsman.payroll.benefits.length} benefits</span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                                <Receipt className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Training Tab */}
            <TabsContent value="training" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Training Programs */}
                <div className="jewelry-glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold jewelry-text-luxury">Active Training Programs</h3>
                    <Button size="sm" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                      <Plus className="h-3 w-3" />
                      New Program
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Traditional Carving Fundamentals', enrolled: 3, duration: '6 weeks', status: 'ongoing' },
                      { name: 'Modern CAD for Craftsmen', enrolled: 5, duration: '8 weeks', status: 'starting' },
                      { name: 'Advanced Finishing Techniques', enrolled: 2, duration: '4 weeks', status: 'completed' },
                      { name: 'Safety & Quality Standards', enrolled: 8, duration: '2 weeks', status: 'ongoing' }
                    ].map((program, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium jewelry-text-luxury">{program.name}</span>
                          <Badge className={
                            program.status === 'ongoing' ? 'bg-blue-500/10 text-blue-600' :
                            program.status === 'starting' ? 'bg-green-500/10 text-green-600' :
                            'bg-gray-500/10 text-gray-300'
                          }>
                            {program.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span>{program.enrolled} enrolled</span>
                          <span>{program.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Training Calendar */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Upcoming Training Sessions</h3>
                  <div className="space-y-3">
                    {[
                      { date: '2024-01-20', time: '09:00', session: 'Wood Selection Techniques', trainer: 'Raman Master' },
                      { date: '2024-01-22', time: '14:00', session: 'CNC Programming Basics', trainer: 'Suresh Kumar' },
                      { date: '2024-01-25', time: '10:00', session: 'Hand Tool Maintenance', trainer: 'Pradeep Chandran' },
                      { date: '2024-01-27', time: '15:00', session: 'Quality Control Methods', trainer: 'External Expert' }
                    ].map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium jewelry-text-luxury text-sm">{session.session}</p>
                            <p className="text-xs text-gray-300">{session.date} at {session.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs jewelry-text-luxury">{session.trainer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Individual Training Progress */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Individual Training Progress</h3>
                <div className="space-y-4">
                  {craftsmen.filter(c => c.training.length > 0).map((craftsman) => (
                    <div key={craftsman.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium jewelry-text-luxury">{craftsman.name}</span>
                        </div>
                        <Badge variant="outline" className="jewelry-badge-text">
                          {craftsman.training.filter(t => t.status === 'completed').length} completed
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {craftsman.training.map((training) => (
                          <div key={training.id} className="p-2 bg-white/5 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm jewelry-text-luxury">{training.course}</span>
                              <Badge className={
                                training.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                                training.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600' :
                                training.status === 'enrolled' ? 'bg-amber-500/10 text-amber-600' :
                                'bg-red-500/10 text-red-600'
                              }>
                                {training.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-300">{training.provider}</p>
                            {training.score && (
                              <p className="text-xs text-green-500 mt-1">Score: {training.score}%</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Individual Craftsman Details */}
            {selectedCraftsman && (
              <TabsContent value="details" className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={closeCraftsmanDetails}
                    className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Overview
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                      className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold"
                    >
                      <Edit className="h-4 w-4" />
                      {isEditing ? 'Cancel Edit' : 'Edit'}
                    </Button>
                    <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <div className="jewelry-glass-card p-6">
                    <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
                          <User className="h-12 w-12 text-white" />
                        </div>
                        <h4 className="text-xl font-bold jewelry-text-luxury">{selectedCraftsman.name}</h4>
                        <p className="text-gray-300">{selectedCraftsman.skillLevel}</p>
                        <Badge className={getStatusColor(selectedCraftsman.status)}>
                          {selectedCraftsman.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium jewelry-text-luxury mb-1">Employee ID</label>
                          <Input
                            value={selectedCraftsman.payroll.employeeId}
                            disabled={!isEditing}
                            className="jewelry-glass-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium jewelry-text-luxury mb-1">Experience</label>
                          <Input
                            value={`${selectedCraftsman.experience} years`}
                            disabled
                            className="jewelry-glass-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium jewelry-text-luxury mb-1">Join Date</label>
                          <Input
                            value={selectedCraftsman.joinDate}
                            disabled={!isEditing}
                            className="jewelry-glass-input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium jewelry-text-luxury mb-1">Location</label>
                          <Input
                            value={selectedCraftsman.location}
                            disabled={!isEditing}
                            className="jewelry-glass-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Personal */}
                  <div className="jewelry-glass-card p-6">
                    <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Contact & Personal</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium jewelry-text-luxury mb-1">Phone</label>
                        <Input
                          value={selectedCraftsman.phone}
                          disabled={!isEditing}
                          className="jewelry-glass-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium jewelry-text-luxury mb-1">Email</label>
                        <Input
                          value={selectedCraftsman.email}
                          disabled={!isEditing}
                          className="jewelry-glass-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium jewelry-text-luxury mb-1">Address</label>
                        <Textarea
                          value={selectedCraftsman.address}
                          disabled={!isEditing}
                          className="jewelry-glass-input"
                          rows={3}
                        />
                      </div>
                      
                      <div className="border-t border-white/10 pt-4">
                        <h4 className="font-medium jewelry-text-luxury mb-3">Emergency Contact</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs jewelry-text-luxury mb-1">Name</label>
                            <Input
                              value={selectedCraftsman.emergencyContact.name}
                              disabled={!isEditing}
                              className="jewelry-glass-input"
                            />
                          </div>
                          <div>
                            <label className="block text-xs jewelry-text-luxury mb-1">Relationship</label>
                            <Input
                              value={selectedCraftsman.emergencyContact.relationship}
                              disabled={!isEditing}
                              className="jewelry-glass-input"
                            />
                          </div>
                          <div>
                            <label className="block text-xs jewelry-text-luxury mb-1">Phone</label>
                            <Input
                              value={selectedCraftsman.emergencyContact.phone}
                              disabled={!isEditing}
                              className="jewelry-glass-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance & Skills */}
                  <div className="space-y-6">
                    <div className="jewelry-glass-card p-6">
                      <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Performance Metrics</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm jewelry-text-luxury">Quality Score</span>
                          <span className="font-bold text-green-500">{selectedCraftsman.performance.qualityScore}%</span>
                        </div>
                        <Progress value={selectedCraftsman.performance.qualityScore} className="h-2" />
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm jewelry-text-luxury">Productivity</span>
                          <span className="font-bold text-blue-500">{selectedCraftsman.performance.productivityScore}%</span>
                        </div>
                        <Progress value={selectedCraftsman.performance.productivityScore} className="h-2" />
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm jewelry-text-luxury">Attendance</span>
                          <span className="font-bold jewelry-text-gold">{selectedCraftsman.performance.attendanceRate}%</span>
                        </div>
                        <Progress value={selectedCraftsman.performance.attendanceRate} className="h-2" />
                        
                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
                          <div className="text-center">
                            <p className="text-2xl font-bold jewelry-text-luxury">{selectedCraftsman.performance.completedProjects}</p>
                            <p className="text-xs text-gray-300">Projects</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold jewelry-text-luxury">{selectedCraftsman.performance.customerRating}</p>
                            <p className="text-xs text-gray-300">Rating</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="jewelry-glass-card p-6">
                      <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Specialties</h3>
                      <div className="space-y-2">
                        {selectedCraftsman.specialty.map((skill, index) => (
                          <Badge key={index} variant="outline" className="mr-2 mb-2 jewelry-badge-text">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      
                      <h4 className="font-medium jewelry-text-luxury mt-4 mb-3">Skill Levels</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedCraftsman.skills).map(([skill, level]) => (
                          <div key={skill} className="flex items-center justify-between">
                            <span className="text-sm jewelry-text-luxury">{skill}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-white/10 rounded-full h-2">
                                <div 
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                                  style={{ width: `${level}%` }}
                                />
                              </div>
                              <span className="text-xs jewelry-text-luxury w-8">{level}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Projects */}
                  <div className="jewelry-glass-card p-6">
                    <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Recent Projects</h3>
                    <div className="space-y-3">
                      {selectedCraftsman.projects.map((project) => (
                        <div key={project.id} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium jewelry-text-luxury">{project.name}</span>
                            <Badge className={
                              project.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                              project.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600' :
                              'bg-amber-500/10 text-amber-600'
                            }>
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-300">
                            <p>Role: {project.role}</p>
                            <p>Started: {project.startDate}</p>
                            {project.endDate && <p>Completed: {project.endDate}</p>}
                            <p>Earnings: ₹{project.earnings.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Equipment & Tools */}
                  <div className="jewelry-glass-card p-6">
                    <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Assigned Equipment</h3>
                    <div className="space-y-3">
                      {selectedCraftsman.equipment.map((item) => (
                        <div key={item.id} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium jewelry-text-luxury">{item.name}</span>
                            <Badge className={
                              item.condition === 'excellent' ? 'bg-green-500/10 text-green-600' :
                              item.condition === 'good' ? 'bg-blue-500/10 text-blue-600' :
                              item.condition === 'fair' ? 'bg-amber-500/10 text-amber-600' :
                              'bg-red-500/10 text-red-600'
                            }>
                              {item.condition}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-300">
                            <p>Type: {item.type}</p>
                            <p>Assigned: {item.assignedDate}</p>
                            <p>Value: ₹{item.value.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes and Tags */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Notes & Tags</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium jewelry-text-luxury mb-2">Notes</label>
                      <Textarea
                        value={selectedCraftsman.notes}
                        disabled={!isEditing}
                        className="jewelry-glass-input"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium jewelry-text-luxury mb-2">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedCraftsman.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="jewelry-badge-text">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}