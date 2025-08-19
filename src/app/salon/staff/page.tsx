// TODO: Update this page to use production data from useEmployee
// 1. Replace hardcoded data arrays with: const data = items.map(transformToUIEmployee)
// 2. Update create handlers to use: await createEmployee(formData)
// 3. Update delete handlers to use: await deleteEmployee(id)
// 4. Replace loading states with: loading ? <Skeleton /> : <YourComponent />

'use client'

import { useAuth } from '@/contexts/auth-context'
import { useUserContext } from '@/hooks/useUserContext'
import { useEmployee } from '@/hooks/useEmployee'

import React, { useState, useEffect } from 'react'
import '../salon-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SalonTeamsSidebar } from '@/components/salon-progressive/SalonTeamsSidebar'
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
  Save,
  TestTube,
  UserPlus,
  ArrowLeft,
  Scissors,
  Award,
  Users,
  Briefcase,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data
const initialStaff = [
  {
    id: 1,
    name: 'Emma Thompson',
    email: 'emma@salon.com',
    phone: '(555) 123-4567',
    role: 'Senior Stylist',
    department: 'Hair Services',
    hireDate: '2022-03-15',
    experience: '8 years',
    specialties: ['Hair Cutting', 'Color Specialist', 'Bridal Styling'],
    schedule: 'Mon-Fri 9:00-17:00',
    commission: 45,
    totalEarnings: 8500,
    clientRating: 4.9,
    status: 'active',
    certifications: ['L\'Oreal Certified', 'Bridal Specialist'],
    notes: 'Top performer, excellent with color work'
  },
  {
    id: 2,
    name: 'David Rodriguez',
    email: 'david@salon.com',
    phone: '(555) 987-6543',
    role: 'Barber',
    department: 'Men\'s Grooming',
    hireDate: '2023-01-10',
    experience: '5 years',
    specialties: ['Classic Cuts', 'Beard Styling', 'Hot Towel Shaves'],
    schedule: 'Tue-Sat 10:00-18:00',
    commission: 40,
    totalEarnings: 6200,
    clientRating: 4.8,
    status: 'active',
    certifications: ['Master Barber', 'Straight Razor Certified'],
    notes: 'Excellent with traditional men\'s cuts'
  },
  {
    id: 3,
    name: 'Alex Chen',
    email: 'alex@salon.com',
    phone: '(555) 456-7890',
    role: 'Junior Stylist',
    department: 'Hair Services',
    hireDate: '2024-06-01',
    experience: '2 years',
    specialties: ['Basic Cuts', 'Blow Drying', 'Treatments'],
    schedule: 'Mon-Fri 8:00-16:00',
    commission: 35,
    totalEarnings: 3800,
    clientRating: 4.6,
    status: 'active',
    certifications: ['Basic Cosmetology'],
    notes: 'Promising junior, eager to learn'
  },
  {
    id: 4,
    name: 'Sarah Kim',
    email: 'sarah@salon.com',
    phone: '(555) 321-9876',
    role: 'Nail Technician',
    department: 'Nail Services',
    hireDate: '2023-08-20',
    experience: '4 years',
    specialties: ['Manicures', 'Pedicures', 'Nail Art', 'Gel Applications'],
    schedule: 'Wed-Sun 9:00-17:00',
    commission: 30,
    totalEarnings: 4200,
    clientRating: 4.7,
    status: 'active',
    certifications: ['Nail Technology License', 'Gel Specialist'],
    notes: 'Creative nail artist, very popular'
  }
]

interface StaffMember {
  id: number
  name: string
  email: string
  phone: string
  role: string
  department: string
  hireDate: string
  experience: string
  specialties: string[]
  schedule: string
  commission: number
  totalEarnings: number
  clientRating: number
  status: 'active' | 'inactive' | 'on_leave'
  certifications: string[]
  notes: string
}

export default function StaffProgressive() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { 
    items, 
    stats, 
    loading, 
    error, 
    refetch, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee 
  } = useEmployee(organizationId)

  const [testMode, setTestMode] = useState(true)
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
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

  // Filter staff based on search and department
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter
    return matchesSearch && matchesDepartment
  })

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('Staff data saved:', staff)
  }

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email) return

    const member: StaffMember = {
      id: Date.now(),
      ...newStaff,
      hireDate: new Date().toISOString().split('T')[0],
      specialties: newStaff.specialties.split(',').map(s => s.trim()).filter(s => s),
      certifications: newStaff.certifications.split(',').map(s => s.trim()).filter(s => s),
      totalEarnings: 0,
      clientRating: 0,
      status: 'active'
    }

    setStaff(prev => [...prev, member])
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
    setHasChanges(true)
  }

  const handleDeleteStaff = (id: number) => {
    setStaff(prev => prev.filter(s => s.id !== id))
    setHasChanges(true)
    setSelectedStaff(null)
  }

  const handleStatusChange = (id: number, status: StaffMember['status']) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    setHasChanges(true)
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
      totalEarnings: staff.reduce((sum, s) => sum + s.totalEarnings, 0),
      avgRating: staff.reduce((sum, s) => sum + s.clientRating, 0) / staff.length,
      avgCommission: staff.reduce((sum, s) => sum + s.commission, 0) / staff.length
    }
  }

  const getDepartments = () => {
    return [...new Set(staff.map(s => s.department))]
  }

  const staffStats = getStaffStats()
  const departments = getDepartments()


  if (!isAuthenticated) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">


        <Alert>


          <AlertCircle className="h-4 w-4" />


          <AlertDescription>


            Please log in to access staff management.


          </AlertDescription>


        </Alert>


      </div>


    )


  }



  if (contextLoading) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">


        <div className="text-center">


          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />


          <p className="text-gray-600">Loading your profile...</p>


        </div>


      </div>


    )


  }



  if (!organizationId) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">


        <Alert variant="destructive">


          <AlertCircle className="h-4 w-4" />


          <AlertDescription>


            Organization not found. Please contact support.


          </AlertDescription>


        </Alert>


      </div>


    )


  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex">
      {/* Teams-Style Sidebar */}
      <SalonTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Progressive Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/salon-progressive">
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
                {testMode && hasChanges && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveProgress}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    Save Progress
                  </Button>
                )}

                {lastSaved && (
                  <div className="text-xs text-gray-500">
                    Saved: {lastSaved.toLocaleTimeString()}
                  </div>
                )}

                <Badge variant="secondary" className="flex items-center gap-1">
                  <TestTube className="h-3 w-3" />
                  Test Mode
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
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-gray-600">{member.role} • {member.department}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(member.status)}>
                              {member.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <div className="text-right text-sm">
                              <p className="font-medium text-green-600">${member.totalEarnings}</p>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-gray-500">{member.clientRating}</span>
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
                        disabled={!newStaff.name || !newStaff.email}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Staff Member
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddForm(false)}
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
                      <h3 className="font-semibold text-lg">{selectedStaff.name}</h3>
                      <p className="text-gray-600">{selectedStaff.role}</p>
                      <Badge className={getStatusColor(selectedStaff.status)} className="mt-2">
                        {selectedStaff.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedStaff.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{selectedStaff.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span>{selectedStaff.department}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Hired: {selectedStaff.hireDate}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{selectedStaff.schedule}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <p className="font-semibold text-green-600">${selectedStaff.totalEarnings}</p>
                        <p className="text-xs text-gray-600">Total Earnings</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <Star className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                        <p className="font-semibold text-yellow-600">{selectedStaff.clientRating}</p>
                        <p className="text-xs text-gray-600">Client Rating</p>
                      </div>
                    </div>

                    {selectedStaff.specialties.length > 0 && (
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

                    {selectedStaff.certifications.length > 0 && (
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

          {/* Progressive Features Notice */}
          {testMode && (
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TestTube className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Test Mode Active</p>
                    <p className="text-sm text-blue-700">
                      Add, edit, and manage staff members freely. Track performance, schedules, and commissions. 
                      All changes are saved locally in test mode. Click "Save Progress" to persist your staff database.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}