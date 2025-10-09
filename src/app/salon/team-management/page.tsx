/**
 * Salon Team Management (Luxe Version)
 *
 * Photo-rich staff management interface with role assignment,
 * permission management, and social media-inspired design.
 * Mobile-optimized with responsive layouts.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { LuxeCard, SalonTeamCard } from '@/components/ui/salon/luxe-card'
import { LuxeButton } from '@/components/ui/salon/luxe-button'
import { MobileLayout, ResponsiveGrid, MobileContainer } from '@/components/salon/mobile-layout'
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Crown,
  Shield,
  User,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Star,
  Award,
  Clock,
  DollarSign,
  Scissors,
  Palette,
  Sparkles,
  Camera,
  Settings,
  Users
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: 'owner' | 'manager' | 'stylist' | 'receptionist' | 'trainee'
  status: 'active' | 'inactive' | 'on_leave'
  joinDate: string
  lastActive: string
  specialties: string[]
  permissions: {
    [key: string]: boolean
  }
  stats: {
    clientsToday: number
    revenue: number
    rating: number
    completedServices: number
  }
  workSchedule: {
    [key: string]: { start: string; end: string } | null
  }
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  color: string
  icon: React.ReactNode
}

const roles: Role[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full system access and business control',
    permissions: ['all'],
    color: 'bg-gradient-to-r from-purple-500 to-purple-600',
    icon: <Crown className="h-4 w-4" />
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Staff management and operations oversight',
    permissions: ['staff_management', 'scheduling', 'reports', 'inventory'],
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    icon: <Shield className="h-4 w-4" />
  },
  {
    id: 'stylist',
    name: 'Stylist',
    description: 'Service provider with client management',
    permissions: ['appointments', 'client_management', 'services'],
    color: 'bg-gradient-to-r from-rose-500 to-rose-600',
    icon: <Scissors className="h-4 w-4" />
  },
  {
    id: 'receptionist',
    name: 'Receptionist',
    description: 'Front desk operations and booking management',
    permissions: ['appointments', 'client_contact', 'payments'],
    color: 'bg-gradient-to-r from-green-500 to-green-600',
    icon: <User className="h-4 w-4" />
  },
  {
    id: 'trainee',
    name: 'Trainee',
    description: 'Limited access for learning and development',
    permissions: ['basic_access'],
    color: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    icon: <Star className="h-4 w-4" />
  }
]

const specialtyOptions = [
  'Hair Cutting',
  'Hair Coloring',
  'Highlights',
  'Perms',
  'Styling',
  'Bridal Hair',
  'Extensions',
  'Treatments',
  'Manicures',
  'Pedicures',
  'Eyebrow Threading',
  'Facial Treatments',
  'Makeup'
]

export default function SalonTeamManagementPage() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<StaffMember | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadStaffMembers()
  }, [])

  useEffect(() => {
    filterStaff()
  }, [staffMembers, searchQuery, selectedRole, selectedStatus])

  const loadStaffMembers = async () => {
    // Mock data - in production, this would fetch from the API
    const mockStaff: StaffMember[] = [
      {
        id: '1',
        name: 'Sarah Mitchell',
        email: 'sarah@luxesalon.com',
        phone: '+971 50 123 4567',
        avatar: '/avatars/sarah.jpg',
        role: 'stylist',
        status: 'active',
        joinDate: '2023-01-15',
        lastActive: '2 minutes ago',
        specialties: ['Hair Cutting', 'Hair Coloring', 'Bridal Hair'],
        permissions: {
          appointments: true,
          client_management: true,
          services: true,
          reports: false
        },
        stats: {
          clientsToday: 8,
          revenue: 2450,
          rating: 4.9,
          completedServices: 156
        },
        workSchedule: {
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          wednesday: { start: '09:00', end: '18:00' },
          thursday: { start: '09:00', end: '18:00' },
          friday: { start: '09:00', end: '20:00' },
          saturday: { start: '08:00', end: '19:00' },
          sunday: null
        }
      },
      {
        id: '2',
        name: 'Maya Patel',
        email: 'maya@luxesalon.com',
        phone: '+971 50 234 5678',
        avatar: '/avatars/maya.jpg',
        role: 'manager',
        status: 'active',
        joinDate: '2022-08-20',
        lastActive: '1 hour ago',
        specialties: ['Management', 'Staff Training', 'Customer Service'],
        permissions: {
          appointments: true,
          client_management: true,
          services: true,
          staff_management: true,
          scheduling: true,
          reports: true,
          inventory: true
        },
        stats: {
          clientsToday: 0,
          revenue: 0,
          rating: 4.8,
          completedServices: 0
        },
        workSchedule: {
          monday: { start: '08:00', end: '17:00' },
          tuesday: { start: '08:00', end: '17:00' },
          wednesday: { start: '08:00', end: '17:00' },
          thursday: { start: '08:00', end: '17:00' },
          friday: { start: '08:00', end: '17:00' },
          saturday: { start: '09:00', end: '16:00' },
          sunday: null
        }
      },
      {
        id: '3',
        name: 'Alex Rodriguez',
        email: 'alex@luxesalon.com',
        phone: '+971 50 345 6789',
        avatar: '/avatars/alex.jpg',
        role: 'stylist',
        status: 'on_leave',
        joinDate: '2023-03-10',
        lastActive: '3 days ago',
        specialties: ['Hair Cutting', 'Styling', 'Extensions'],
        permissions: {
          appointments: true,
          client_management: true,
          services: true,
          reports: false
        },
        stats: {
          clientsToday: 0,
          revenue: 0,
          rating: 4.7,
          completedServices: 89
        },
        workSchedule: {
          monday: { start: '10:00', end: '19:00' },
          tuesday: { start: '10:00', end: '19:00' },
          wednesday: null,
          thursday: { start: '10:00', end: '19:00' },
          friday: { start: '10:00', end: '19:00' },
          saturday: { start: '09:00', end: '18:00' },
          sunday: { start: '10:00', end: '16:00' }
        }
      },
      {
        id: '4',
        name: 'Jordan Kim',
        email: 'jordan@luxesalon.com',
        phone: '+971 50 456 7890',
        avatar: '/avatars/jordan.jpg',
        role: 'receptionist',
        status: 'active',
        joinDate: '2023-06-01',
        lastActive: '30 minutes ago',
        specialties: ['Customer Service', 'Booking Management', 'Point of Sale'],
        permissions: {
          appointments: true,
          client_contact: true,
          payments: true,
          reports: false
        },
        stats: {
          clientsToday: 0,
          revenue: 0,
          rating: 4.6,
          completedServices: 0
        },
        workSchedule: {
          monday: { start: '08:30', end: '17:30' },
          tuesday: { start: '08:30', end: '17:30' },
          wednesday: { start: '08:30', end: '17:30' },
          thursday: { start: '08:30', end: '17:30' },
          friday: { start: '08:30', end: '19:30' },
          saturday: { start: '08:00', end: '18:00' },
          sunday: null
        }
      }
    ]

    setStaffMembers(mockStaff)
  }

  const filterStaff = () => {
    let filtered = staffMembers

    if (searchQuery) {
      filtered = filtered.filter(
        member =>
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.specialties.some(specialty =>
            specialty.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(member => member.role === selectedRole)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(member => member.status === selectedStatus)
    }

    setFilteredStaff(filtered)
  }

  const getRoleInfo = (roleId: string) => {
    return roles.find(role => role.id === roleId) || roles[4]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const handleAddUser = () => {
    setIsAddUserOpen(true)
  }

  const handleEditUser = (user: StaffMember) => {
    setEditingUser(user)
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      setStaffMembers(prev => prev.filter(member => member.id !== userId))
    }
  }

  return (
    <MobileLayout>
      <MobileContainer maxWidth="full" padding={false}>
        <div className="px-4 md:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent mb-2">
                Team Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                Manage your salon team, roles, and permissions
              </p>
            </div>

            <LuxeButton
              variant="gradient"
              gradientType="primary"
              icon={<Plus className="h-5 w-5" />}
              onClick={handleAddUser}
              className="w-full sm:w-auto"
            >
              Add Team Member
            </LuxeButton>
          </div>

          {/* Filters */}
          <LuxeCard variant="glass" className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full sm:w-40 rounded-xl">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center space-x-2">
                          {role.icon}
                          <span>{role.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-40 rounded-xl">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2 border rounded-xl p-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="flex-1 sm:flex-none"
                  >
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="flex-1 sm:flex-none"
                  >
                    List
                  </Button>
                </div>
              </div>
            </div>
          </LuxeCard>

          {/* Team Overview Stats */}
          <ResponsiveGrid cols={{ sm: 2, md: 2, lg: 4, xl: 4 }} className="mb-6 md:mb-8">
            <LuxeCard variant="floating">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Team</p>
                  <p className="text-2xl font-bold text-purple-600">{staffMembers.length}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </LuxeCard>

            <LuxeCard variant="floating">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Today</p>
                  <p className="text-2xl font-bold text-green-600">
                    {staffMembers.filter(s => s.status === 'active').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </LuxeCard>

            <LuxeCard variant="floating">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {(
                      staffMembers.reduce((acc, s) => acc + s.stats.rating, 0) / staffMembers.length
                    ).toFixed(1)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </LuxeCard>

            <LuxeCard variant="floating">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today Revenue</p>
                  <p className="text-2xl font-bold text-rose-600">
                    ${staffMembers.reduce((acc, s) => acc + s.stats.revenue, 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-rose-100 dark:bg-rose-900/20 rounded-xl">
                  <DollarSign className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </LuxeCard>
          </ResponsiveGrid>

          {/* Team Members */}
          {viewMode === 'grid' ? (
            <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3, xl: 3 }}>
              {filteredStaff.map(member => {
                const roleInfo = getRoleInfo(member.role)
                return (
                  <LuxeCard
                    key={member.id}
                    variant="floating"
                    className="hover:scale-105 transition-transform duration-300"
                  >
                    <div className="relative">
                      {/* Member Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="w-12 md:w-16 h-12 md:h-16">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white text-lg">
                                {member.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 md:w-5 h-4 md:h-5 rounded-full border-2 border-white ${
                                member.status === 'active'
                                  ? 'bg-green-500'
                                  : member.status === 'on_leave'
                                    ? 'bg-yellow-500'
                                    : 'bg-gray-400'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                              {member.name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${roleInfo.color} text-white border-0 text-xs`}>
                                <div className="flex items-center space-x-1">
                                  {roleInfo.icon}
                                  <span>{roleInfo.name}</span>
                                </div>
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      </div>

                      {/* Specialties */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">SPECIALTIES</p>
                        <div className="flex flex-wrap gap-1">
                          {member.specialties.slice(0, 2).map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {member.specialties.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{member.specialties.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      {member.role === 'stylist' && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-purple-600">
                              {member.stats.clientsToday}
                            </p>
                            <p className="text-xs text-gray-500">Clients Today</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-600">
                              ${member.stats.revenue}
                            </p>
                            <p className="text-xs text-gray-500">Revenue</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <LuxeButton
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          icon={<Edit className="h-4 w-4" />}
                          onClick={() => handleEditUser(member)}
                        >
                          Edit
                        </LuxeButton>
                        <LuxeButton
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="h-4 w-4" />}
                          onClick={() => handleDeleteUser(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </LuxeButton>
                      </div>
                    </div>
                  </LuxeCard>
                )
              })}
            </ResponsiveGrid>
          ) : (
            <LuxeCard variant="glass">
              <div className="space-y-4">
                {filteredStaff.map(member => {
                  const roleInfo = getRoleInfo(member.role)
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white">
                            {member.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {member.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {member.email}
                          </p>
                        </div>

                        <div className="hidden sm:flex items-center space-x-3">
                          <Badge className={`${roleInfo.color} text-white border-0`}>
                            <div className="flex items-center space-x-1">
                              {roleInfo.icon}
                              <span className="text-xs">{roleInfo.name}</span>
                            </div>
                          </Badge>

                          <Badge className={getStatusColor(member.status)}>
                            {member.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {member.role === 'stylist' && (
                          <div className="hidden md:flex space-x-4 text-sm mr-4">
                            <div className="text-center">
                              <p className="font-semibold text-purple-600">
                                {member.stats.clientsToday}
                              </p>
                              <p className="text-xs text-gray-500">Clients</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold text-green-600">
                                ${member.stats.revenue}
                              </p>
                              <p className="text-xs text-gray-500">Revenue</p>
                            </div>
                          </div>
                        )}

                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(member)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </LuxeCard>
          )}

          {/* Add/Edit User Dialog */}
          <Dialog
            open={isAddUserOpen || !!editingUser}
            onOpenChange={open => {
              if (!open) {
                setIsAddUserOpen(false)
                setEditingUser(null)
              }
            }}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Edit Team Member' : 'Add New Team Member'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? 'Update team member information and permissions.'
                    : 'Add a new team member to your salon.'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter full name" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter email address" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="Enter phone number" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center space-x-2">
                              {role.icon}
                              <span>{role.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Photo</Label>
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-400 transition-colors cursor-pointer">
                      <div className="text-center">
                        <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Upload Photo</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Specialties</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {specialtyOptions.slice(0, 6).map(specialty => (
                        <div key={specialty} className="flex items-center space-x-2">
                          <Switch id={specialty} />
                          <Label htmlFor={specialty} className="text-xs">
                            {specialty}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddUserOpen(false)
                    setEditingUser(null)
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <LuxeButton variant="gradient" gradientType="primary" className="w-full sm:w-auto">
                  {editingUser ? 'Update Member' : 'Add Member'}
                </LuxeButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </MobileContainer>
    </MobileLayout>
  )
}
