'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { universalApi } from '@/lib/universal-api'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { 
  User, 
  Search, 
  Plus, 
  Edit3,
  Trash2,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  UserPlus,
  ArrowLeft,
  Scissors,
  Award,
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface StaffMember {
  id: string
  entity_name: string
  entity_type: string
  entity_code?: string
  organization_id: string
  smart_code?: string
  created_at?: string
  updated_at?: string
  // Dynamic fields
  email?: string
  phone?: string
  role?: string
  department?: string
  hire_date?: string
  experience?: string
  specialties?: string[]
  schedule?: string
  commission?: number
  total_earnings?: number
  client_rating?: number
  status?: 'active' | 'inactive' | 'on_leave'
  certifications?: string[]
  notes?: string
}

export default function StaffProduction() {
  const { organization, isAuthenticated, isLoading } = useAuth()
  const organizationId = organization?.id
  const { toast } = useToast()
  const router = useRouter()
  const [staff, setStaff] = useState<StaffMember[]>([])
  
  // Debug log for organization ID
  console.log('StaffProduction render:', { organizationId, organization })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    experience: '',
    schedule: '',
    commission: 30,
    specialties: '',
    certifications: '',
    notes: ''
  })

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    } else if (!isLoading && isAuthenticated && !organizationId) {
      // User is logged in but has no organization
      toast({
        title: 'Organization Required',
        description: 'You need to be associated with an organization to access this page.',
        variant: 'destructive'
      })
      router.push('/onboarding')
    }
  }, [isLoading, isAuthenticated, organizationId, router, toast])

  // Set organization ID for API
  useEffect(() => {
    if (organizationId) {
      universalApi.setOrganizationId(organizationId)
    }
  }, [organizationId])

  // Load staff from Supabase
  const loadStaff = async () => {
    if (!organizationId) return
    
    setLoading(true)
    try {
      // Get all employee entities
      const response = await universalApi.read('core_entities', {
        entity_type: 'employee',
        organization_id: organizationId
      })

      if (response.success && response.data) {
        // For each staff member, load dynamic data
        const staffWithData = await Promise.all(
          response.data.map(async (entity: any) => {
            const dynamicData = await universalApi.getDynamicFields(entity.id)
            
            return {
              id: entity.id,
              entity_name: entity.entity_name,
              entity_type: entity.entity_type,
              entity_code: entity.entity_code,
              organization_id: entity.organization_id,
              smart_code: entity.smart_code,
              created_at: entity.created_at,
              updated_at: entity.updated_at,
              // Map dynamic fields
              email: dynamicData.email || '',
              phone: dynamicData.phone || '',
              role: dynamicData.role || '',
              department: dynamicData.department || '',
              hire_date: dynamicData.hire_date || entity.created_at?.split('T')[0],
              experience: dynamicData.experience || '',
              specialties: dynamicData.specialties ? JSON.parse(dynamicData.specialties) : [],
              schedule: dynamicData.schedule || '',
              commission: parseFloat(dynamicData.commission || '30'),
              total_earnings: parseFloat(dynamicData.total_earnings || '0'),
              client_rating: parseFloat(dynamicData.client_rating || '0'),
              status: dynamicData.status || 'active',
              certifications: dynamicData.certifications ? JSON.parse(dynamicData.certifications) : [],
              notes: dynamicData.notes || ''
            }
          })
        )

        setStaff(staffWithData)
      }
    } catch (error) {
      console.error('Error loading staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Load staff on mount
  useEffect(() => {
    loadStaff()
  }, [organizationId])

  // Filter staff based on search and department
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.role?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (member.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter
    return matchesSearch && matchesDepartment
  })

  const handleAddStaff = async () => {
    console.log('handleAddStaff called', { newStaff, organizationId })
    
    if (!newStaff.name || !newStaff.email || !organizationId) {
      console.log('Validation failed:', { 
        name: newStaff.name, 
        email: newStaff.email, 
        organizationId 
      })
      if (!newStaff.name) {
        toast({
          title: 'Error',
          description: 'Please enter staff member name',
          variant: 'destructive'
        })
      }
      if (!newStaff.email) {
        toast({
          title: 'Error',
          description: 'Please enter staff member email',
          variant: 'destructive'
        })
      }
      if (!organizationId) {
        // This shouldn't happen as we redirect above, but just in case
        return
      }
      return
    }

    setSaving(true)
    try {
      console.log('Creating staff member...')
      // Create employee entity
      const entityResponse = await universalApi.createEntity({
        entity_type: 'employee',
        entity_name: newStaff.name,
        entity_code: `EMP-${Date.now()}`,
        organization_id: organizationId,
        smart_code: 'HERA.SALON.EMPLOYEE.v1'
      })
      
      console.log('Entity response:', entityResponse)

      if (entityResponse.success && entityResponse.data) {
        const entityId = entityResponse.data.id

        // Set dynamic fields
        const dynamicFields = {
          email: newStaff.email,
          phone: newStaff.phone,
          role: newStaff.role,
          department: newStaff.department,
          hire_date: new Date().toISOString().split('T')[0],
          experience: newStaff.experience,
          specialties: JSON.stringify(newStaff.specialties.split(',').map(s => s.trim()).filter(s => s)),
          schedule: newStaff.schedule,
          commission: newStaff.commission.toString(),
          total_earnings: '0',
          client_rating: '0',
          status: 'active',
          certifications: JSON.stringify(newStaff.certifications.split(',').map(s => s.trim()).filter(s => s)),
          notes: newStaff.notes
        }

        // Save each dynamic field
        for (const [field, value] of Object.entries(dynamicFields)) {
          if (value) {
            await universalApi.setDynamicField(entityId, field, value)
          }
        }

        // Show success notification
        toast({
          title: 'Success',
          description: 'Staff member added successfully!',
          duration: 3000
        })

        // Reset form
        setNewStaff({
          name: '',
          email: '',
          phone: '',
          role: '',
          department: '',
          experience: '',
          schedule: '',
          commission: 30,
          specialties: '',
          certifications: '',
          notes: ''
        })
        setShowAddForm(false)

        // Reload staff
        await loadStaff()
      }
    } catch (error) {
      console.error('Error adding staff member:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add staff member. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      const response = await universalApi.delete('core_entities', id)
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Staff member deleted successfully!',
          duration: 3000
        })
        setSelectedStaff(null)
        await loadStaff()
      }
    } catch (error) {
      console.error('Error deleting staff member:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete staff member. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleStatusChange = async (id: string, status: StaffMember['status']) => {
    try {
      await universalApi.setDynamicField(id, 'status', status)
      
      toast({
        title: 'Success',
        description: 'Staff status updated!',
        duration: 2000
      })
      
      await loadStaff()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'on_leave': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStaffStats = () => {
    return {
      total: staff.length,
      active: staff.filter(s => s.status === 'active').length,
      totalEarnings: staff.reduce((sum, s) => sum + (s.total_earnings || 0), 0),
      avgRating: staff.length > 0 
        ? staff.reduce((sum, s) => sum + (s.client_rating || 0), 0) / staff.length
        : 0,
      avgCommission: staff.length > 0
        ? staff.reduce((sum, s) => sum + (s.commission || 0), 0) / staff.length
        : 0
    }
  }

  const getDepartments = () => {
    return [...new Set(staff.map(s => s.department).filter(d => d))]
  }

  const staffStats = getStaffStats()
  const departments = getDepartments()

  if (loading && staff.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading staff members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex">
      {/* Teams-Style Sidebar */}
      <SalonProductionSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/salon">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Staff Management
                  </h1>
                  <p className="text-sm text-gray-600">Manage your team and track performance</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Live Mode
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {/* Staff Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-600">{staffStats.total}</p>
                  <p className="text-xs text-gray-600">Total Staff</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">{staffStats.active}</p>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">${staffStats.totalEarnings}</p>
                  <p className="text-xs text-gray-600">Total Earnings</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold text-yellow-600">{staffStats.avgRating.toFixed(1)}</p>
                  <p className="text-xs text-gray-600">Avg Rating</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold text-purple-600">{staffStats.avgCommission.toFixed(0)}%</p>
                  <p className="text-xs text-gray-600">Avg Commission</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search staff by name, role, or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept} className="hera-select-item">{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Staff List */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-pink-500" />
                    Staff Members ({filteredStaff.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredStaff.map((member) => (
                      <div 
                        key={member.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedStaff?.id === member.id 
                            ? 'border-pink-300 bg-pink-50' 
                            : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                        }`}
                        onClick={() => setSelectedStaff(member)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{member.entity_name}</p>
                              <p className="text-sm text-gray-600">{member.role} • {member.department}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(member.status || 'active')}>
                              {(member.status || 'active').replace('_', ' ').toUpperCase()}
                            </Badge>
                            <div className="text-right text-sm">
                              <p className="font-medium text-green-600">${member.total_earnings}</p>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-gray-500">{member.client_rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Staff Details / Add Form */}
            <div>
              {showAddForm ? (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-pink-500" />
                      Add New Staff Member
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newStaff.name}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter staff name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStaff.email}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="staff@salon.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newStaff.phone}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={newStaff.role}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="e.g., Senior Stylist, Barber"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={newStaff.department}
                        onValueChange={(value) => setNewStaff(prev => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="Hair Services" className="hera-select-item">Hair Services</SelectItem>
                          <SelectItem value="Men's Grooming" className="hera-select-item">Men's Grooming</SelectItem>
                          <SelectItem value="Nail Services" className="hera-select-item">Nail Services</SelectItem>
                          <SelectItem value="Spa Services" className="hera-select-item">Spa Services</SelectItem>
                          <SelectItem value="Reception" className="hera-select-item">Reception</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="commission">Commission Rate (%)</Label>
                      <Input
                        id="commission"
                        type="number"
                        min="0"
                        max="100"
                        value={newStaff.commission}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, commission: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="specialties">Specialties (comma separated)</Label>
                      <Input
                        id="specialties"
                        value={newStaff.specialties}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, specialties: e.target.value }))}
                        placeholder="Hair Cutting, Color, Styling"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAddStaff}
                        className="flex-1 bg-pink-600 hover:bg-pink-700"
                        disabled={!newStaff.name || !newStaff.email || saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Staff Member
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddForm(false)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : selectedStaff ? (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-pink-500" />
                        Staff Details
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedStaff.status}
                          onValueChange={(status) => handleStatusChange(selectedStaff.id, status as StaffMember['status'])}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="hera-select-content">
                            <SelectItem value="active" className="hera-select-item">Active</SelectItem>
                            <SelectItem value="on_leave" className="hera-select-item">On Leave</SelectItem>
                            <SelectItem value="inactive" className="hera-select-item">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteStaff(selectedStaff.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center pb-4 border-b">
                      <div className="h-16 w-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg">{selectedStaff.entity_name}</h3>
                      <p className="text-gray-600">{selectedStaff.role}</p>
                      <Badge className={getStatusColor(selectedStaff.status || 'active')} className="mt-2">
                        {(selectedStaff.status || 'active').replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedStaff.email}</span>
                      </div>
                      {selectedStaff.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{selectedStaff.phone}</span>
                        </div>
                      )}
                      {selectedStaff.department && (
                        <div className="flex items-center gap-3 text-sm">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          <span>{selectedStaff.department}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Hired: {selectedStaff.hire_date}</span>
                      </div>
                      {selectedStaff.schedule && (
                        <div className="flex items-center gap-3 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{selectedStaff.schedule}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <p className="font-semibold text-green-600">${selectedStaff.total_earnings}</p>
                        <p className="text-xs text-gray-600">Total Earnings</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <Star className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                        <p className="font-semibold text-yellow-600">{selectedStaff.client_rating}</p>
                        <p className="text-xs text-gray-600">Client Rating</p>
                      </div>
                    </div>

                    {selectedStaff.specialties && selectedStaff.specialties.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Specialties</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedStaff.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedStaff.certifications && selectedStaff.certifications.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Certifications</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedStaff.certifications.map((cert, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Award className="h-3 w-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedStaff.notes && (
                      <div>
                        <Label className="text-sm font-medium">Notes</Label>
                        <p className="text-sm text-gray-600 mt-1">{selectedStaff.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Select a staff member to view details</p>
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Staff Member
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}