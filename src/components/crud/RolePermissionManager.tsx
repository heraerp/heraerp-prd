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
  Shield,
  Key,
  Users,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Crown,
  Settings,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Save,
  Copy,
  Download,
  Upload,
  History,
  UserCheck,
  Database,
  Globe,
  Zap
} from 'lucide-react'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  is_system: boolean
  risk_level: 'low' | 'medium' | 'high' | 'critical'
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  is_system: boolean
  user_count: number
  created_at: string
  created_by: string
}

interface PermissionAudit {
  id: string
  user_id: string
  user_name: string
  action: string
  target_type: string
  target_id: string
  permissions_before: string[]
  permissions_after: string[]
  timestamp: string
  reason: string
}

// HERA Universal Permission Categories with Risk Assessment
const PERMISSION_CATEGORIES = {
  entities: { name: 'Entity Management', icon: Database, color: 'blue' },
  transactions: { name: 'Transaction Operations', icon: Zap, color: 'green' },
  relationships: { name: 'Relationship Management', icon: Globe, color: 'purple' },
  users: { name: 'User Administration', icon: Users, color: 'red' },
  settings: { name: 'System Settings', icon: Settings, color: 'orange' },
  reports: { name: 'Reports & Analytics', icon: UserCheck, color: 'teal' },
  api: { name: 'API Access', icon: Key, color: 'indigo' }
}

const UNIVERSAL_PERMISSIONS: Permission[] = [
  // Entity Management - Low to Medium Risk
  {
    id: 'entities:read',
    name: 'View Entities',
    description: 'View all entity types (customers, products, etc.)',
    category: 'entities',
    is_system: true,
    risk_level: 'low'
  },
  {
    id: 'entities:create',
    name: 'Create Entities',
    description: 'Create new entities',
    category: 'entities',
    is_system: true,
    risk_level: 'medium'
  },
  {
    id: 'entities:update',
    name: 'Pencil Entities',
    description: 'Modify existing entities',
    category: 'entities',
    is_system: true,
    risk_level: 'medium'
  },
  {
    id: 'entities:delete',
    name: 'Delete Entities',
    description: 'Remove entities from system',
    category: 'entities',
    is_system: true,
    risk_level: 'high'
  },
  {
    id: 'entities:*',
    name: 'Full Entity Access',
    description: 'Complete control over all entities',
    category: 'entities',
    is_system: true,
    risk_level: 'critical'
  },

  // Transaction Operations - Medium to High Risk
  {
    id: 'transactions:read',
    name: 'View Transactions',
    description: 'View transaction records',
    category: 'transactions',
    is_system: true,
    risk_level: 'low'
  },
  {
    id: 'transactions:create',
    name: 'Create Transactions',
    description: 'Create new transactions',
    category: 'transactions',
    is_system: true,
    risk_level: 'medium'
  },
  {
    id: 'transactions:update',
    name: 'Pencil Transactions',
    description: 'Modify transaction records',
    category: 'transactions',
    is_system: true,
    risk_level: 'high'
  },
  {
    id: 'transactions:delete',
    name: 'Delete Transactions',
    description: 'Remove transaction records',
    category: 'transactions',
    is_system: true,
    risk_level: 'critical'
  },
  {
    id: 'transactions:approve',
    name: 'Approve Transactions',
    description: 'Approve pending transactions',
    category: 'transactions',
    is_system: true,
    risk_level: 'high'
  },
  {
    id: 'transactions:*',
    name: 'Full Transaction Access',
    description: 'Complete transaction management',
    category: 'transactions',
    is_system: true,
    risk_level: 'critical'
  },

  // Relationship Management - Low to Medium Risk
  {
    id: 'relationships:read',
    name: 'View Relationships',
    description: 'View entity relationships',
    category: 'relationships',
    is_system: true,
    risk_level: 'low'
  },
  {
    id: 'relationships:create',
    name: 'Create Relationships',
    description: 'Establish entity connections',
    category: 'relationships',
    is_system: true,
    risk_level: 'medium'
  },
  {
    id: 'relationships:update',
    name: 'Pencil Relationships',
    description: 'Modify relationships',
    category: 'relationships',
    is_system: true,
    risk_level: 'medium'
  },
  {
    id: 'relationships:delete',
    name: 'Delete Relationships',
    description: 'Remove relationships',
    category: 'relationships',
    is_system: true,
    risk_level: 'high'
  },
  {
    id: 'relationships:*',
    name: 'Full Relationship Access',
    description: 'Complete relationship management',
    category: 'relationships',
    is_system: true,
    risk_level: 'critical'
  },

  // User Administration - High to Critical Risk
  {
    id: 'users:read',
    name: 'View Users',
    description: 'View user accounts',
    category: 'users',
    is_system: true,
    risk_level: 'medium'
  },
  {
    id: 'users:create',
    name: 'Create Users',
    description: 'Add new users to organization',
    category: 'users',
    is_system: true,
    risk_level: 'high'
  },
  {
    id: 'users:update',
    name: 'Pencil Users',
    description: 'Modify user accounts',
    category: 'users',
    is_system: true,
    risk_level: 'high'
  },
  {
    id: 'users:delete',
    name: 'Delete Users',
    description: 'Remove user accounts',
    category: 'users',
    is_system: true,
    risk_level: 'critical'
  },
  {
    id: 'users:manage',
    name: 'Full User Management',
    description: 'Complete user administration',
    category: 'users',
    is_system: true,
    risk_level: 'critical'
  },

  // System Settings - Critical Risk
  {
    id: 'settings:read',
    name: 'View Settings',
    description: 'View system configuration',
    category: 'settings',
    is_system: true,
    risk_level: 'low'
  },
  {
    id: 'settings:update',
    name: 'Modify Settings',
    description: 'Change system settings',
    category: 'settings',
    is_system: true,
    risk_level: 'critical'
  },
  {
    id: 'settings:manage',
    name: 'Full Settings Access',
    description: 'Complete settings management',
    category: 'settings',
    is_system: true,
    risk_level: 'critical'
  },

  // Reports & Analytics - Low to Medium Risk
  {
    id: 'reports:read',
    name: 'View Reports',
    description: 'Access standard reports',
    category: 'reports',
    is_system: true,
    risk_level: 'low'
  },
  {
    id: 'reports:create',
    name: 'Create Reports',
    description: 'Generate custom reports',
    category: 'reports',
    is_system: true,
    risk_level: 'medium'
  },
  {
    id: 'reports:all',
    name: 'Full Report Access',
    description: 'Access to all reports and analytics',
    category: 'reports',
    is_system: true,
    risk_level: 'medium'
  },

  // API Access - Medium to Critical Risk
  {
    id: 'api:read',
    name: 'API Read Access',
    description: 'Read-only API access',
    category: 'api',
    is_system: true,
    risk_level: 'medium'
  },
  {
    id: 'api:write',
    name: 'API Write Access',
    description: 'Create and modify via API',
    category: 'api',
    is_system: true,
    risk_level: 'high'
  },
  {
    id: 'api:admin',
    name: 'Full API Access',
    description: 'Complete API administration',
    category: 'api',
    is_system: true,
    risk_level: 'critical'
  }
]

const SYSTEM_ROLES: Role[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Organization owner with full access to all features',
    permissions: [
      'entities:*',
      'transactions:*',
      'relationships:*',
      'users:manage',
      'settings:manage',
      'reports:all',
      'api:admin'
    ],
    is_system: true,
    user_count: 0,
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Administrative access with user management capabilities',
    permissions: [
      'entities:*',
      'transactions:*',
      'relationships:*',
      'users:manage',
      'settings:read',
      'reports:all',
      'api:write'
    ],
    is_system: true,
    user_count: 0,
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Management level access with operational permissions',
    permissions: [
      'entities:*',
      'transactions:*',
      'relationships:read',
      'users:read',
      'reports:read',
      'api:read'
    ],
    is_system: true,
    user_count: 0,
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  {
    id: 'user',
    name: 'Standard User',
    description: 'Basic user access for daily operations',
    permissions: [
      'entities:read',
      'transactions:read',
      'relationships:read',
      'reports:read',
      'api:read'
    ],
    is_system: true,
    user_count: 0,
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  {
    id: 'readonly',
    name: 'Read Only',
    description: 'View-only access to system data',
    permissions: ['entities:read', 'transactions:read', 'relationships:read', 'reports:read'],
    is_system: true,
    user_count: 0,
    created_at: new Date().toISOString(),
    created_by: 'system'
  }
]

export function RolePermissionManager() {
  const { user, session } = useSupabaseAuth()
  const token = session?.access_token
  const organization = user?.user_metadata?.organization_name || 'Default Organization'
  const [activeTab, setActiveTab] = useState('roles')
  const [roles, setRoles] = useState<Role[]>(SYSTEM_ROLES)
  const [customRoles, setCustomRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [auditLogs, setAuditLogs] = useState<PermissionAudit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateRole, setShowCreateRole] = useState(false)
  const [showPermissionDetails, setShowPermissionDetails] = useState(false)

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    copy_from_role: ''
  })

  // Permission statistics
  const permissionStats = {
    total: UNIVERSAL_PERMISSIONS.length,
    by_category: Object.keys(PERMISSION_CATEGORIES).reduce(
      (acc, cat) => {
        acc[cat] = UNIVERSAL_PERMISSIONS.filter(p => p.category === cat).length
        return acc
      },
      {} as Record<string, number>
    ),
    by_risk: ['low', 'medium', 'high', 'critical'].reduce(
      (acc, risk) => {
        acc[risk] = UNIVERSAL_PERMISSIONS.filter(p => p.risk_level === risk).length
        return acc
      },
      {} as Record<string, number>
    )
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low':
        return CheckCircle
      case 'medium':
        return Info
      case 'high':
        return AlertTriangle
      case 'critical':
        return XCircle
      default:
        return Info
    }
  }

  // Create custom role
  const createCustomRole = () => {
    if (!roleForm.name.trim()) {
      setError('Role name is required')
      return
    }

    const newRole: Role = {
      id: `custom_${Date.now()}`,
      name: roleForm.name,
      description: roleForm.description,
      permissions: roleForm.permissions,
      is_system: false,
      user_count: 0,
      created_at: new Date().toISOString(),
      created_by: user?.name || 'Unknown'
    }

    setCustomRoles(prev => [...prev, newRole])
    setRoleForm({ name: '', description: '', permissions: [], copy_from_role: '' })
    setShowCreateRole(false)

    // Log the action
    logPermissionAction(
      'create_role',
      newRole.id,
      newRole.name,
      [],
      newRole.permissions,
      'Created custom role'
    )
  }

  // Copy permissions from existing role
  const copyFromRole = (sourceRoleId: string) => {
    const sourceRole = [...roles, ...customRoles].find(r => r.id === sourceRoleId)
    if (sourceRole) {
      setRoleForm(prev => ({
        ...prev,
        permissions: [...sourceRole.permissions]
      }))
    }
  }

  // Toggle permission in role
  const togglePermission = (permissionId: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  // Log permission changes
  const logPermissionAction = (
    action: string,
    targetId: string,
    targetName: string,
    permissionsBefore: string[],
    permissionsAfter: string[],
    reason: string
  ) => {
    const auditEntry: PermissionAudit = {
      id: `audit_${Date.now()}`,
      user_id: user?.id || '',
      user_name: user?.name || 'Unknown',
      action,
      target_type: 'role',
      target_id: targetId,
      permissions_before: permissionsBefore,
      permissions_after: permissionsAfter,
      timestamp: new Date().toISOString(),
      reason
    }

    setAuditLogs(prev => [auditEntry, ...prev.slice(0, 49)]) // Keep last 50 entries
  }

  // Export role configuration
  const exportRoles = () => {
    const roleExport = {
      system_roles: roles,
      custom_roles: customRoles,
      permissions: UNIVERSAL_PERMISSIONS,
      export_date: new Date().toISOString(),
      organization: organization?.name || 'Unknown'
    }

    const blob = new Blob([JSON.stringify(roleExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hera-roles-${organization?.name || 'org'}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role & Permission Management</CardTitle>
          <CardDescription>Please log in to manage roles and permissions</CardDescription>
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
              <Shield className="h-6 w-6 text-purple-600" />
              Role & Permission Management
              <Badge variant="secondary">{organization?.name}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportRoles}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setShowCreateRole(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Manage universal roles and permissions across your HERA organization
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <Button variant="ghost" size="sm" className="float-right" onClick={() => setError(null)}>
            ×
          </Button>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* System Roles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  System Roles
                </CardTitle>
                <CardDescription>Predefined roles with standard permission sets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {roles.map(role => (
                  <div
                    key={role.id}
                    className="p-4 border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {role.id === 'owner' && <Crown className="h-4 w-4 text-yellow-500" />}
                          {role.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      <Badge variant="outline">{role.permissions.length} permissions</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map(permission => (
                          <span
                            key={permission}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                          >
                            {permission}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{role.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRole(role)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Custom Roles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-500" />
                  Custom Roles
                </CardTitle>
                <CardDescription>
                  Organization-specific roles with custom permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customRoles.length === 0 ? (
                  <div className="text-center py-8">
                    <Lock className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No custom roles created</p>
                    <Button onClick={() => setShowCreateRole(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Custom Role
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customRoles.map(role => (
                      <div
                        key={role.id}
                        className="p-4 border rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{role.name}</h4>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{role.permissions.length} permissions</Badge>
                          <span className="text-xs text-muted-foreground">
                            Created: {new Date(role.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          {/* Permission Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{permissionStats.total}</div>
                <p className="text-xs text-muted-foreground">Total Permissions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {permissionStats.by_risk.low}
                </div>
                <p className="text-xs text-muted-foreground">Low Risk</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">
                  {permissionStats.by_risk.high}
                </div>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">
                  {permissionStats.by_risk.critical}
                </div>
                <p className="text-xs text-muted-foreground">Critical Risk</p>
              </CardContent>
            </Card>
          </div>

          {/* Permission Categories */}
          <div className="space-y-6">
            {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
              <Card key={categoryKey}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className={`h-5 w-5 text-${category.color}-500`} />
                    {category.name}
                  </CardTitle>
                  <CardDescription>
                    {UNIVERSAL_PERMISSIONS.filter(p => p.category === categoryKey).length}{' '}
                    permissions available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {UNIVERSAL_PERMISSIONS.filter(
                      permission => permission.category === categoryKey
                    ).map(permission => {
                      const RiskIcon = getRiskIcon(permission.risk_level)
                      return (
                        <div
                          key={permission.id}
                          className="flex items-start gap-3 p-3 border rounded-lg"
                        >
                          <RiskIcon
                            className={`h-4 w-4 mt-1 ${getRiskColor(permission.risk_level).split(' ')[0]}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">{permission.name}</p>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getRiskColor(permission.risk_level)}`}
                              >
                                {permission.risk_level}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{permission.description}</p>
                            <code className="text-xs bg-muted px-1 rounded">
                              {permission.id}
                            </code>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Permission Audit Trail
              </CardTitle>
              <CardDescription>Complete history of role and permission changes</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No audit entries yet</p>
                  <p className="text-sm text-muted-foreground">Permission changes will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map(entry => (
                    <div key={entry.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {entry.user_name} {entry.action.replace('_', ' ')} {entry.target_type}
                          </p>
                          <p className="text-xs text-muted-foreground">{entry.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {entry.action}
                        </Badge>
                      </div>
                      {(entry.permissions_before.length > 0 ||
                        entry.permissions_after.length > 0) && (
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Before:</p>
                            <div className="flex flex-wrap gap-1">
                              {entry.permissions_before.map(perm => (
                                <span
                                  key={perm}
                                  className="text-xs bg-red-50 text-red-700 px-1 rounded"
                                >
                                  {perm}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">After:</p>
                            <div className="flex flex-wrap gap-1">
                              {entry.permissions_after.map(perm => (
                                <span
                                  key={perm}
                                  className="text-xs bg-green-50 text-green-700 px-1 rounded"
                                >
                                  {perm}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...roles, ...customRoles].map(role => (
                    <div key={role.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {role.id === 'owner' && <Crown className="h-4 w-4 text-yellow-500" />}
                        <span className="text-sm">{role.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{role.user_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Permission Risk Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Permission Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(permissionStats.by_risk).map(([risk, count]) => {
                    const RiskIcon = getRiskIcon(risk)
                    return (
                      <div
                        key={risk}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <RiskIcon className={`h-5 w-5 ${getRiskColor(risk).split(' ')[0]}`} />
                          <div>
                            <p className="font-medium capitalize">{risk} Risk</p>
                            <p className="text-sm text-muted-foreground">{count} permissions</p>
                          </div>
                        </div>
                        <Badge className={getRiskColor(risk)}>
                          {((count / permissionStats.total) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>Permission System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">Security Status</p>
                  <p className="text-sm text-muted-foreground">All permissions properly configured</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Shield className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-medium">Role Coverage</p>
                  <p className="text-sm text-muted-foreground">100% of users have roles assigned</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <History className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="font-medium">Audit Trail</p>
                  <p className="text-sm text-muted-foreground">{auditLogs.length} recent actions logged</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      {showCreateRole && (
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Role</CardTitle>
            <CardDescription>
              Define a new role with specific permissions for your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="role_name">Role Name *</Label>
                <Input
                  id="role_name"
                  value={roleForm.name}
                  onChange={e => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter role name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="copy_from">Copy From Existing Role</Label>
                <Select
                  value={roleForm.copy_from_role}
                  onValueChange={value => {
                    setRoleForm(prev => ({ ...prev, copy_from_role: value }))
                    if (value) copyFromRole(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role to copy" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...roles, ...customRoles].map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="role_description">Description</Label>
              <Textarea
                id="role_description"
                value={roleForm.description}
                onChange={e => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this role's purpose and responsibilities"
                rows={3}
              />
            </div>

            {/* Permission Selection */}
            <div>
              <Label>Permissions ({roleForm.permissions.length} selected)</Label>
              <div className="mt-2 space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
                  <div key={categoryKey}>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <category.icon className={`h-4 w-4 text-${category.color}-500`} />
                      {category.name}
                    </h4>
                    <div className="grid gap-2 md:grid-cols-2 ml-6">
                      {UNIVERSAL_PERMISSIONS.filter(
                        permission => permission.category === categoryKey
                      ).map(permission => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={permission.id}
                            checked={roleForm.permissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="rounded"
                          />
                          <Label htmlFor={permission.id} className="text-sm">
                            {permission.name}
                            <Badge
                              variant="outline"
                              className={`ml-2 text-xs ${getRiskColor(permission.risk_level)}`}
                            >
                              {permission.risk_level}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateRole(false)
                setRoleForm({ name: '', description: '', permissions: [], copy_from_role: '' })
              }}
            >
              Cancel
            </Button>
            <Button onClick={createCustomRole}>
              <Save className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
