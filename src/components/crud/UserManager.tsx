'use client'

import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
  Users,
  Shield,
  Key,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Crown,
  Settings
} from 'lucide-react'

interface HERAUser {
  id: string
  entity_name: string
  entity_code?: string
  description?: string
  status: string
  created_at: string
  metadata?: {
    email?: string
    phone?: string
    department?: string
    job_title?: string
    hire_date?: string
    manager_id?: string
    location?: string
    password_hash?: string
    last_login?: string
    failed_login_attempts?: number
    account_locked?: boolean
  }
  properties?: Record<string, any>
}

interface UserFormData {
  entity_name: string
  entity_code: string
  description: string
  status: string
  email: string
  phone: string
  department: string
  job_title: string
  hire_date: string
  manager_id: string
  location: string
  role: string
  permissions: string[]
  password: string
  send_welcome_email: boolean
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

// HERA Universal Permissions System
const PERMISSION_CATEGORIES = {
  entities: 'Entity Management',
  transactions: 'Transaction Operations',
  relationships: 'Relationship Management',
  users: 'User Administration',
  settings: 'System Settings',
  reports: 'Reports & Analytics',
  api: 'API Access'
}

const UNIVERSAL_PERMISSIONS: Permission[] = [
  // Entity Management
  {
    id: 'entities:read',
    name: 'View Entities',
    description: 'View all entity types (customers, products, etc.)',
    category: 'entities'
  },
  {
    id: 'entities:create',
    name: 'Create Entities',
    description: 'Create new entities',
    category: 'entities'
  },
  {
    id: 'entities:update',
    name: 'Pencil Entities',
    description: 'Modify existing entities',
    category: 'entities'
  },
  {
    id: 'entities:delete',
    name: 'Delete Entities',
    description: 'Remove entities from system',
    category: 'entities'
  },
  {
    id: 'entities:*',
    name: 'Full Entity Access',
    description: 'Complete control over all entities',
    category: 'entities'
  },

  // Transaction Operations
  {
    id: 'transactions:read',
    name: 'View Transactions',
    description: 'View transaction records',
    category: 'transactions'
  },
  {
    id: 'transactions:create',
    name: 'Create Transactions',
    description: 'Create new transactions',
    category: 'transactions'
  },
  {
    id: 'transactions:update',
    name: 'Pencil Transactions',
    description: 'Modify transaction records',
    category: 'transactions'
  },
  {
    id: 'transactions:delete',
    name: 'Delete Transactions',
    description: 'Remove transaction records',
    category: 'transactions'
  },
  {
    id: 'transactions:approve',
    name: 'Approve Transactions',
    description: 'Approve pending transactions',
    category: 'transactions'
  },
  {
    id: 'transactions:*',
    name: 'Full Transaction Access',
    description: 'Complete transaction management',
    category: 'transactions'
  },

  // Relationship Management
  {
    id: 'relationships:read',
    name: 'View Relationships',
    description: 'View entity relationships',
    category: 'relationships'
  },
  {
    id: 'relationships:create',
    name: 'Create Relationships',
    description: 'Establish entity connections',
    category: 'relationships'
  },
  {
    id: 'relationships:update',
    name: 'Pencil Relationships',
    description: 'Modify relationships',
    category: 'relationships'
  },
  {
    id: 'relationships:delete',
    name: 'Delete Relationships',
    description: 'Remove relationships',
    category: 'relationships'
  },
  {
    id: 'relationships:*',
    name: 'Full Relationship Access',
    description: 'Complete relationship management',
    category: 'relationships'
  },

  // User Administration
  { id: 'users:read', name: 'View Users', description: 'View user accounts', category: 'users' },
  {
    id: 'users:create',
    name: 'Create Users',
    description: 'Add new users to organization',
    category: 'users'
  },
  {
    id: 'users:update',
    name: 'Pencil Users',
    description: 'Modify user accounts',
    category: 'users'
  },
  {
    id: 'users:delete',
    name: 'Delete Users',
    description: 'Remove user accounts',
    category: 'users'
  },
  {
    id: 'users:manage',
    name: 'Full User Management',
    description: 'Complete user administration',
    category: 'users'
  },

  // System Settings
  {
    id: 'settings:read',
    name: 'View Settings',
    description: 'View system configuration',
    category: 'settings'
  },
  {
    id: 'settings:update',
    name: 'Modify Settings',
    description: 'Change system settings',
    category: 'settings'
  },
  {
    id: 'settings:manage',
    name: 'Full Settings Access',
    description: 'Complete settings management',
    category: 'settings'
  },

  // Reports & Analytics
  {
    id: 'reports:read',
    name: 'View Reports',
    description: 'Access standard reports',
    category: 'reports'
  },
  {
    id: 'reports:create',
    name: 'Create Reports',
    description: 'Generate custom reports',
    category: 'reports'
  },
  {
    id: 'reports:all',
    name: 'Full Report Access',
    description: 'Access to all reports and analytics',
    category: 'reports'
  },

  // API Access
  { id: 'api:read', name: 'API Read Access', description: 'Read-only API access', category: 'api' },
  {
    id: 'api:write',
    name: 'API Write Access',
    description: 'Create and modify via API',
    category: 'api'
  },
  {
    id: 'api:admin',
    name: 'Full API Access',
    description: 'Complete API administration',
    category: 'api'
  }
]

const USER_ROLES = [
  {
    value: 'owner',
    label: 'Owner',
    description: 'Full system access',
    permissions: [
      'entities:*',
      'transactions:*',
      'relationships:*',
      'users:manage',
      'settings:manage',
      'reports:all',
      'api:admin'
    ]
  },
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Administrative access',
    permissions: [
      'entities:*',
      'transactions:*',
      'relationships:*',
      'users:manage',
      'settings:read',
      'reports:all',
      'api:write'
    ]
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Management level access',
    permissions: [
      'entities:*',
      'transactions:*',
      'relationships:read',
      'users:read',
      'reports:read',
      'api:read'
    ]
  },
  {
    value: 'user',
    label: 'Standard User',
    description: 'Basic user access',
    permissions: [
      'entities:read',
      'transactions:read',
      'relationships:read',
      'reports:read',
      'api:read'
    ]
  },
  {
    value: 'readonly',
    label: 'Read Only',
    description: 'View only access',
    permissions: ['entities:read', 'transactions:read', 'relationships:read', 'reports:read']
  },
  { value: 'custom', label: 'Custom Role', description: 'Custom permission set', permissions: [] }
]

const DEPARTMENTS = [
  'Administration',
  'Accounting',
  'Sales',
  'Marketing',
  'Operations',
  'Human Resources',
  'IT',
  'Customer Service',
  'Finance',
  'Legal',
  'Engineering',
  'Research',
  'Quality Assurance',
  'Other'
]

export function UserManager() {
  const { user, session } = useSupabaseAuth()
  const token = session?.access_token
  const organization = user?.user_metadata?.organization_name || 'Default Organization'
  const [users, setUsers] = useState<HERAUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<HERAUser | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('users')

  const [formData, setFormData] = useState<UserFormData>({
    entity_name: '',
    entity_code: '',
    description: '',
    status: 'active',
    email: '',
    phone: '',
    department: '',
    job_title: '',
    hire_date: '',
    manager_id: '',
    location: '',
    role: 'user',
    permissions: [],
    password: '',
    send_welcome_email: true
  })

  // Fetch users from the system
  const fetchUsers = async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (selectedDepartment !== 'all') {
        params.append('department', selectedDepartment)
      }
      if (selectedRole !== 'all') {
        params.append('role', selectedRole)
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }
      params.append('include_inactive', 'true')

      const response = await fetch(`/api/v1/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const result = await response.json()
      if (result.success) {
        setUsers(Array.isArray(result.data) ? result.data : [])
      } else {
        throw new Error(result.message || 'Failed to fetch users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  // Create or update user
  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      // Prepare user data
      const userData = {
        entity_name: formData.entity_name,
        entity_code: formData.entity_code || generateUserCode(formData.entity_name),
        description: formData.description,
        status: formData.status,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        job_title: formData.job_title,
        hire_date: formData.hire_date,
        manager_id: formData.manager_id || null,
        location: formData.location,
        role: formData.role,
        permissions: formData.permissions,
        password: formData.password,
        send_welcome_email: formData.send_welcome_email
      }

      const url = editingUser ? '/api/v1/users' : '/api/v1/users'
      const method = editingUser ? 'PUT' : 'POST'
      const body = editingUser ? { ...userData, id: editingUser.id } : userData

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingUser ? 'update' : 'create'} user`)
      }

      const result = await response.json()
      if (result.success) {
        setShowForm(false)
        setEditingUser(null)
        resetForm()
        fetchUsers()
      } else {
        throw new Error(result.message || 'Failed to save user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  // Delete user
  const deleteUser = async (userId: string) => {
    if (
      !token ||
      !confirm('Are you sure you want to delete this user? This action cannot be undone.')
    )
      return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      const result = await response.json()
      if (result.success) {
        fetchUsers()
      } else {
        throw new Error(result.message || 'Failed to delete user')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setLoading(false)
    }
  }

  // Toggle user status
  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    if (!token) return

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

    try {
      const response = await fetch('/api/v1/users', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: userId,
          status: newStatus
        })
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (err) {
      console.error('Failed to toggle user status:', err)
    }
  }

  // Start editing
  const startEdit = (userData: HERAUser) => {
    setEditingUser(userData)
    setFormData({
      entity_name: userData.entity_name,
      entity_code: userData.entity_code || '',
      description: userData.description || '',
      status: userData.status,
      email: (userData.metadata as any)?.email || '',
      phone: (userData.metadata as any)?.phone || '',
      department: (userData.metadata as any)?.department || '',
      job_title: (userData.metadata as any)?.job_title || '',
      hire_date: (userData.metadata as any)?.hire_date || '',
      manager_id: (userData.metadata as any)?.manager_id || '',
      location: (userData.metadata as any)?.location || '',
      role: (userData.metadata as any)?.role || 'user',
      permissions: (userData.metadata as any)?.permissions || [],
      password: '',
      send_welcome_email: false
    })
    setShowForm(true)
  }

  // Reset form
  const resetForm = () => {
    setShowForm(false)
    setEditingUser(null)
    setFormData({
      entity_name: '',
      entity_code: '',
      description: '',
      status: 'active',
      email: '',
      phone: '',
      department: '',
      job_title: '',
      hire_date: '',
      manager_id: '',
      location: '',
      role: 'user',
      permissions: [],
      password: '',
      send_welcome_email: true
    })
  }

  // Handle role change
  const handleRoleChange = (newRole: string) => {
    setFormData(prev => {
      const role = USER_ROLES.find(r => r.value === newRole)
      return {
        ...prev,
        role: newRole,
        permissions: role ? role.permissions : []
      }
    })
  }

  // Handle permission toggle
  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  // Utility functions
  const generateUserCode = (name: string): string => {
    return `USER${Date.now()}`
  }

  const generatePassword = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesDepartment =
      selectedDepartment === 'all' || (user.metadata as any)?.department === selectedDepartment
    const matchesRole = selectedRole === 'all' || (user.metadata as any)?.role === selectedRole
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus

    return matchesDepartment && matchesRole && matchesStatus
  })

  useEffect(() => {
    if (user && token) {
      fetchUsers()
    }
  }, [user, token, selectedDepartment, selectedRole, selectedStatus])

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Please log in to manage users</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              User Management
              <Badge variant="secondary">{organization?.name}</Badge>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowForm(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
              <Button variant="outline" onClick={fetchUsers} size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Manage users and permissions for your organization using HERA's Universal User
            Architecture
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label>Department</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {USER_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          {loading && users.length === 0 && (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading users...</p>
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-8 w-8 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-4">No users found</p>
              <Button onClick={() => setShowForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add First User
              </Button>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map(userData => (
                <Card key={userData.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                          {userData.entity_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{userData.entity_name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Badge
                              variant={
                                (userData.metadata as any)?.role === 'owner'
                                  ? 'default'
                                  : (userData.metadata as any)?.role === 'admin'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className="text-xs"
                            >
                              {(userData.metadata as any)?.role === 'owner' && (
                                <Crown className="h-3 w-3 mr-1" />
                              )}
                              {USER_ROLES.find(r => r.value === (userData.metadata as any)?.role)
                                ?.label || 'User'}
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={userData.status === 'active' ? 'default' : 'secondary'}>
                        {userData.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {(userData.metadata as any)?.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        {userData.metadata.email}
                      </div>
                    )}
                    {(userData.metadata as any)?.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {userData.metadata.phone}
                      </div>
                    )}
                    {(userData.metadata as any)?.department && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="h-4 w-4" />
                        {userData.metadata.department}
                      </div>
                    )}
                    {(userData.metadata as any)?.job_title && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Settings className="h-4 w-4" />
                        {userData.metadata.job_title}
                      </div>
                    )}
                    {(userData.metadata as any)?.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {userData.metadata.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      Created: {new Date(userData.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 flex justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(userData)}
                        disabled={
                          (userData.metadata as any)?.role === 'owner' && user?.role !== 'owner'
                        }
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserStatus(userData.id, userData.status)}
                        disabled={
                          (userData.metadata as any)?.role === 'owner' && user?.role !== 'owner'
                        }
                      >
                        {userData.status === 'active' ? (
                          <UserX className="h-3 w-3" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(userData.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={
                          (userData.metadata as any)?.role === 'owner' || userData.id === user?.id
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                HERA Universal Permission System
              </CardTitle>
              <CardDescription>
                Role-based permissions that work across all HERA modules and organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Predefined Roles */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Predefined Roles</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {USER_ROLES.filter(role => role.value !== 'custom').map(role => (
                      <Card key={role.value} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {role.value === 'owner' && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                              {role.label}
                            </h4>
                            <p className="text-sm text-gray-600">{role.description}</p>
                          </div>
                          <Badge variant="outline">{role.permissions.length} permissions</Badge>
                        </div>
                        <div className="space-y-1">
                          {role.permissions.map(permission => (
                            <div
                              key={permission}
                              className="text-xs bg-gray-50 px-2 py-1 rounded inline-block mr-1 mb-1"
                            >
                              {permission}
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Permission Categories */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Available Permissions</h3>
                  <div className="space-y-4">
                    {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryName]) => (
                      <Card key={category} className="p-4">
                        <h4 className="font-medium mb-3">{categoryName}</h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {UNIVERSAL_PERMISSIONS.filter(
                            permission => permission.category === category
                          ).map(permission => (
                            <div
                              key={permission.id}
                              className="flex items-start gap-3 p-2 bg-gray-50 rounded"
                            >
                              <Key className="h-4 w-4 mt-0.5 text-gray-400" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{permission.name}</p>
                                <p className="text-xs text-gray-600">{permission.description}</p>
                                <code className="text-xs bg-gray-200 px-1 rounded">
                                  {permission.id}
                                </code>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-gray-500">Active organization users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.status === 'active').length}
                </div>
                <p className="text-xs text-gray-500">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Administrators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {
                    users.filter(u => ['owner', 'admin'].includes((u.metadata as any)?.role || ''))
                      .length
                  }
                </div>
                <p className="text-xs text-gray-500">Admin level access</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(users.map(u => (u.metadata as any)?.department).filter(Boolean)).size}
                </div>
                <p className="text-xs text-gray-500">Active departments</p>
              </CardContent>
            </Card>
          </div>

          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DEPARTMENTS.map(dept => {
                  const count = users.filter(u => (u.metadata as any)?.department === dept).length
                  const percentage = users.length > 0 ? (count / users.length) * 100 : 0
                  return (
                    <div key={dept} className="flex items-center justify-between">
                      <span className="text-sm">{dept}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Pencil User Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? 'Pencil User' : 'Add New User'}</CardTitle>
            <CardDescription>
              {editingUser
                ? 'Update user information and permissions'
                : 'Create a new user account for your organization'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={saveUser}>
            <CardContent className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="contact">Contact & Role</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="entity_name">Full Name *</Label>
                      <Input
                        id="entity_name"
                        value={formData.entity_name}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, entity_name: e.target.value }))
                        }
                        placeholder="Enter full name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="entity_code">User Code</Label>
                      <Input
                        id="entity_code"
                        value={formData.entity_code}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, entity_code: e.target.value }))
                        }
                        placeholder="Auto-generated if empty"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Brief description or notes about this user"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Account Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* Contact & Role Tab */}
                <TabsContent value="contact" className="space-y-4 mt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="user@organization.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={formData.department}
                        onValueChange={value =>
                          setFormData(prev => ({ ...prev, department: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map(dept => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        value={formData.job_title}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, job_title: e.target.value }))
                        }
                        placeholder="Enter job title"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="hire_date">Hire Date</Label>
                      <Input
                        id="hire_date"
                        type="date"
                        value={formData.hire_date}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, hire_date: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Office location or remote"
                      />
                    </div>
                  </div>

                  {!editingUser && (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={e =>
                                setFormData(prev => ({ ...prev, password: e.target.value }))
                              }
                              placeholder="Enter password"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setFormData(prev => ({ ...prev, password: generatePassword() }))
                            }
                          >
                            Generate
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="send_welcome_email"
                          checked={formData.send_welcome_email}
                          onCheckedChange={checked =>
                            setFormData(prev => ({ ...prev, send_welcome_email: checked }))
                          }
                        />
                        <Label htmlFor="send_welcome_email">
                          Send welcome email with login instructions
                        </Label>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Permissions Tab */}
                <TabsContent value="permissions" className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="role">User Role</Label>
                    <Select value={formData.role} onValueChange={handleRoleChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              {role.value === 'owner' && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                              <div>
                                <div className="font-medium">{role.label}</div>
                                <div className="text-xs text-gray-500">{role.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Permissions (if custom role selected) */}
                  {formData.role === 'custom' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Custom Permissions</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Select specific permissions for this user
                        </p>
                      </div>

                      {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryName]) => (
                        <Card key={category} className="p-4">
                          <h5 className="font-medium mb-3">{categoryName}</h5>
                          <div className="space-y-2">
                            {UNIVERSAL_PERMISSIONS.filter(
                              permission => permission.category === category
                            ).map(permission => (
                              <div key={permission.id} className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  id={permission.id}
                                  checked={formData.permissions.includes(permission.id)}
                                  onChange={() => togglePermission(permission.id)}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <Label htmlFor={permission.id} className="font-medium text-sm">
                                    {permission.name}
                                  </Label>
                                  <p className="text-xs text-gray-600">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Selected Permissions Preview */}
                  {formData.role !== 'custom' && (
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">Assigned Permissions</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.permissions.map(permission => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingUser ? 'Update' : 'Create'} User
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  )
}
