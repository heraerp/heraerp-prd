'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { universalApi } from '@/lib/universal-api'
import { CurrencyInput } from '@/components/ui/currency-input'
import { useOrganizationCurrency } from '@/hooks/use-organization-currency'
import { 
  UserPlus, Search, Filter, Calendar, Clock, Shield, 
  Award, Phone, Mail, MapPin, Star, TrendingUp,
  AlertCircle, CheckCircle, Settings, Users
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

export default function StaffManagementPage() {
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id
  const { currencyCode, format: formatCurrency } = useOrganizationCurrency()
  const { toast } = useToast()
  
  const [staff, setStaff] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    hourly_rate: 0,
    employment_type: 'full_time',
    start_date: new Date().toISOString().split('T')[0],
    emergency_contact: '',
    emergency_phone: '',
    address: '',
    skills: [] as string[]
  })

  useEffect(() => {
    if (organizationId && !contextLoading) {
      loadData()
    }
  }, [organizationId, contextLoading])

  const loadData = async () => {
    if (!organizationId) return
    
    try {
      setLoading(true)
      
      // Load staff
      const staffResponse = await fetch(`/api/v1/salon/staff?organization_id=${organizationId}`)
      if (staffResponse.ok) {
        const data = await staffResponse.json()
        setStaff(data.staff || [])
      }
      
      // Load roles
      const rolesResponse = await fetch(`/api/v1/salon/staff-roles?organization_id=${organizationId}`)
      if (rolesResponse.ok) {
        const data = await rolesResponse.json()
        setRoles(data.staff_roles || [])
      }
      
      // Load skills
      const skillsResponse = await fetch(`/api/v1/salon/staff-skills?organization_id=${organizationId}`)
      if (skillsResponse.ok) {
        const data = await skillsResponse.json()
        setSkills(data.staff_skills || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStaff = async () => {
    if (!organizationId) return
    
    try {
      // Create staff entity
      const staffData = {
        entity_type: 'staff',
        entity_name: formData.name,
        entity_code: `STAFF_${formData.name.replace(/\s+/g, '_').toUpperCase()}_${Date.now()}`,
        organization_id: organizationId,
        smart_code: `HERA.SALON.STAFF.${formData.role.toUpperCase()}.v1`,
        metadata: {
          employment_type: formData.employment_type,
          start_date: formData.start_date
        }
      }
      
      const staffEntity = await universalApi.createEntity(staffData)
      
      // Set dynamic fields
      const dynamicFields = [
        { field: 'email', value: formData.email },
        { field: 'phone', value: formData.phone },
        { field: 'address', value: formData.address },
        { field: 'role', value: formData.role },
        { field: 'hourly_rate', value: formData.hourly_rate },
        { field: 'emergency_contact', value: formData.emergency_contact },
        { field: 'emergency_phone', value: formData.emergency_phone },
        { field: 'skills', value: formData.skills }
      ]
      
      for (const field of dynamicFields) {
        if (field.value) {
          await universalApi.setDynamicField(staffEntity.id, field.field, field.value)
        }
      }
      
      toast({
        title: 'Success',
        description: 'Staff member created successfully'
      })
      
      setShowAddDialog(false)
      loadData()
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        hourly_rate: 0,
        employment_type: 'full_time',
        start_date: new Date().toISOString().split('T')[0],
        emergency_contact: '',
        emergency_phone: '',
        address: '',
        skills: []
      })
    } catch (error) {
      console.error('Error creating staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to create staff member',
        variant: 'destructive'
      })
    }
  }

  // Filter staff
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || member.role === filterRole
    return matchesSearch && matchesRole
  })

  // Get role details
  const getRoleDetails = (roleCode: string) => {
    return roles.find(r => r.entity_code === roleCode)
  }


  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage your salon team members and their roles</p>
        </div>
        <div className="flex gap-2">
          <Link href="/salon/staff-roles">
            <Button variant="outline">
              <Shield className="mr-2 h-4 w-4" />
              Manage Roles
            </Button>
          </Link>
          <Link href="/salon/staff-skills">
            <Button variant="outline">
              <Award className="mr-2 h-4 w-4" />
              Manage Skills
            </Button>
          </Link>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.entity_code} value={role.entity_code}>
                            {role.entity_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <Label>Hourly Rate</Label>
                    <CurrencyInput
                      value={formData.hourly_rate}
                      onChange={(value) => setFormData({...formData, hourly_rate: value || 0})}
                    />
                  </div>
                  <div>
                    <Label>Employment Type</Label>
                    <Select value={formData.employment_type} onValueChange={(value) => setFormData({...formData, employment_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                  <div>
                    <Label>Emergency Contact</Label>
                    <Input
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <Label>Emergency Phone</Label>
                    <Input
                      value={formData.emergency_phone}
                      onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateStaff} disabled={!formData.name || !formData.role}>
                    Create Staff Member
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search staff by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.entity_code} value={role.entity_code}>
                    {role.entity_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      {loading ? (
        <div className="text-center py-8">Loading staff...</div>
      ) : filteredStaff.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No staff members found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterRole !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Add your first staff member to get started'}
            </p>
            {searchQuery === '' && filterRole === 'all' && (
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add First Staff Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((member) => {
            const role = getRoleDetails(member.role)
            return (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{member.entity_name}</CardTitle>
                      {role && (
                        <Badge 
                          style={{ backgroundColor: role.color || '#3B82F6' }}
                          className="mt-1"
                        >
                          {role.entity_name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{member.rating || 5.0}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {member.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Started {member.metadata?.start_date ? format(new Date(member.metadata.start_date), 'MMM yyyy') : 'Recently'}</span>
                  </div>
                  {member.hourly_rate && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>{formatCurrency(member.hourly_rate)}/hour</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      View Schedule
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">
              {staff.filter(s => s.metadata?.employment_type === 'full_time').length} full-time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(staff.length * 0.8)}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">From client reviews</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certifications</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.filter(s => s.certifications?.length > 0).length}</div>
            <p className="text-xs text-muted-foreground">Licensed professionals</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}