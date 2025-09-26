'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Shield,
  Key,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Settings,
  Lock,
  Unlock,
  UserPlus,
  UserX,
  Trash2,
  Edit,
  Download,
  Filter,
  Search,
  RefreshCw,
  Globe,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  History,
  Bell,
  Mail,
  Activity,
  Database,
  Server,
  CloudOff,
  Zap,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserMinus,
  Plus,
  MoreVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SecurityEvent {
  id: string
  timestamp: string
  event: string
  user: string
  ip: string
  location: string
  status: 'success' | 'warning' | 'danger'
  details: string
}

interface UserSession {
  id: string
  user: string
  email: string
  device: string
  location: string
  lastActive: string
  status: 'active' | 'idle' | 'expired'
  ipAddress: string
}

interface SecurityAlert {
  id: string
  type: 'login_attempt' | 'permission_change' | 'data_access' | 'system_change'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: string
  status: 'new' | 'investigating' | 'resolved'
  user?: string
}

const mockSecurityEvents: SecurityEvent[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:30:15',
    event: 'User Login',
    user: 'sarah.johnson@city.gov',
    ip: '192.168.1.45',
    location: 'Toronto, CA',
    status: 'success',
    details: 'Successful login via web browser'
  },
  {
    id: '2',
    timestamp: '2024-01-15 14:25:08',
    event: 'Failed Login',
    user: 'unknown@attacker.com',
    ip: '203.45.67.89',
    location: 'Unknown',
    status: 'danger',
    details: 'Multiple failed login attempts'
  },
  {
    id: '3',
    timestamp: '2024-01-15 14:20:33',
    event: 'Permission Updated',
    user: 'admin@city.gov',
    ip: '192.168.1.10',
    location: 'Toronto, CA',
    status: 'warning',
    details: 'Grant access updated for constituency module'
  },
  {
    id: '4',
    timestamp: '2024-01-15 14:15:22',
    event: 'Data Export',
    user: 'mike.thompson@city.gov',
    ip: '192.168.1.67',
    location: 'Toronto, CA',
    status: 'success',
    details: 'Exported constituent data (100 records)'
  },
  {
    id: '5',
    timestamp: '2024-01-15 14:10:11',
    event: 'System Settings',
    user: 'admin@city.gov',
    ip: '192.168.1.10',
    location: 'Toronto, CA',
    status: 'warning',
    details: 'Security policy updated'
  }
]

const mockUserSessions: UserSession[] = [
  {
    id: '1',
    user: 'Sarah Johnson',
    email: 'sarah.johnson@city.gov',
    device: 'Chrome on Windows',
    location: 'Toronto, CA',
    lastActive: '2 minutes ago',
    status: 'active',
    ipAddress: '192.168.1.45'
  },
  {
    id: '2',
    user: 'Mike Thompson',
    email: 'mike.thompson@city.gov',
    device: 'Safari on macOS',
    location: 'Toronto, CA',
    lastActive: '15 minutes ago',
    status: 'active',
    ipAddress: '192.168.1.67'
  },
  {
    id: '3',
    user: 'Lisa Chen',
    email: 'lisa.chen@city.gov',
    device: 'Mobile App iOS',
    location: 'Toronto, CA',
    lastActive: '1 hour ago',
    status: 'idle',
    ipAddress: '192.168.1.89'
  }
]

const mockSecurityAlerts: SecurityAlert[] = [
  {
    id: '1',
    type: 'login_attempt',
    severity: 'high',
    title: 'Suspicious Login Activity',
    description: 'Multiple failed login attempts from unknown IP address',
    timestamp: '2024-01-15 14:25:08',
    status: 'new'
  },
  {
    id: '2',
    type: 'data_access',
    severity: 'medium',
    title: 'Large Data Export',
    description: 'User exported large dataset outside normal hours',
    timestamp: '2024-01-15 02:30:15',
    status: 'investigating'
  },
  {
    id: '3',
    type: 'permission_change',
    severity: 'low',
    title: 'Permission Update',
    description: 'User role permissions were modified',
    timestamp: '2024-01-15 09:15:22',
    status: 'resolved'
  }
]

export default function SecurityPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(mockSecurityEvents)
  const [userSessions, setUserSessions] = useState<UserSession[]>(mockUserSessions)
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(mockSecurityAlerts)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)
  
  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: true,
    passwordExpiry: true,
    sessionTimeout: true,
    loginNotifications: true,
    ipWhitelist: false,
    auditLogging: true,
    dataEncryption: true,
    backupEncryption: true
  })

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    toast({
      title: 'Data Refreshed',
      description: 'Security data has been updated'
    })
  }

  const handleTerminateSession = (sessionId: string) => {
    setUserSessions(prev => prev.filter(session => session.id !== sessionId))
    toast({
      title: 'Session Terminated',
      description: 'User session has been terminated'
    })
  }

  const handleResolveAlert = (alertId: string) => {
    setSecurityAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      )
    )
    toast({
      title: 'Alert Resolved',
      description: 'Security alert has been marked as resolved'
    })
  }

  const handleSecuritySettingChange = (setting: string, value: boolean) => {
    setSecuritySettings(prev => ({ ...prev, [setting]: value }))
    toast({
      title: 'Security Setting Updated',
      description: `${setting} has been ${value ? 'enabled' : 'disabled'}`
    })
  }

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = event.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.details.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || event.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'danger':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-text-300" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-blue-500 bg-blue-500/10'
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10'
      case 'high':
        return 'text-orange-500 bg-orange-500/10'
      case 'critical':
        return 'text-red-500 bg-red-500/10'
      default:
        return 'text-text-300 bg-text-300/10'
    }
  }

  const getSessionStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="h-2 w-2 bg-green-500 rounded-full" />
      case 'idle':
        return <div className="h-2 w-2 bg-yellow-500 rounded-full" />
      case 'expired':
        return <div className="h-2 w-2 bg-red-500 rounded-full" />
      default:
        return <div className="h-2 w-2 bg-text-300 rounded-full" />
    }
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[rgb(0,166,166)]/20">
              <Shield className="h-8 w-8 text-[rgb(0,166,166)]" />
            </div>
            Security Center
          </h1>
          <p className="text-text-200 mt-1">
            Monitor and manage your organization's security
          </p>
        </div>
        <Button
          onClick={refreshData}
          disabled={isLoading}
          className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="sessions">User Sessions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Security Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-panel border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-200">Security Score</p>
                    <p className="text-3xl font-bold text-green-500">94%</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-full">
                    <ShieldCheck className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <p className="text-xs text-text-300 mt-2">
                  <span className="text-green-500">+2%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-200">Active Sessions</p>
                    <p className="text-3xl font-bold text-text-100">{userSessions.filter(s => s.status === 'active').length}</p>
                  </div>
                  <div className="p-3 bg-[rgb(0,166,166)]/20 rounded-full">
                    <Users className="h-6 w-6 text-[rgb(0,166,166)]" />
                  </div>
                </div>
                <p className="text-xs text-text-300 mt-2">
                  {userSessions.length} total sessions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-200">Security Alerts</p>
                    <p className="text-3xl font-bold text-yellow-500">{securityAlerts.filter(a => a.status === 'new').length}</p>
                  </div>
                  <div className="p-3 bg-yellow-500/20 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
                <p className="text-xs text-text-300 mt-2">
                  {securityAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length} high priority
                </p>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-200">Failed Logins</p>
                    <p className="text-3xl font-bold text-red-500">7</p>
                  </div>
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <XCircle className="h-6 w-6 text-red-500" />
                  </div>
                </div>
                <p className="text-xs text-text-300 mt-2">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-panel border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Security Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-panel-alt">
                      {getStatusIcon(event.status)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-100">{event.event}</p>
                        <p className="text-xs text-text-300">{event.user} • {event.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Security Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-panel-alt">
                      <Badge className={cn('text-xs', getSeverityColor(alert.severity))}>
                        {alert.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-100">{alert.title}</p>
                        <p className="text-xs text-text-300">{alert.timestamp}</p>
                      </div>
                      {alert.status === 'new' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResolveAlert(alert.id)}
                          className="text-text-300 hover:text-text-100"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Security Events Log</CardTitle>
              <CardDescription>
                Monitor all security-related activities in your organization
              </CardDescription>
              <div className="flex items-center gap-4 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-300 h-4 w-4" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-panel-alt border-border"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 bg-panel-alt border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-panel border-border">
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="danger">Danger</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-border">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Status</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id} className="border-border">
                        <TableCell>{getStatusIcon(event.status)}</TableCell>
                        <TableCell className="font-medium">{event.event}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{event.user}</p>
                            <p className="text-xs text-text-300">{event.ip}</p>
                          </div>
                        </TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>{event.timestamp}</TableCell>
                        <TableCell className="max-w-xs truncate">{event.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Active User Sessions</CardTitle>
              <CardDescription>
                Monitor and manage all active user sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Status</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userSessions.map((session) => (
                      <TableRow key={session.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSessionStatusIcon(session.status)}
                            <span className="capitalize text-sm">{session.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{session.user}</p>
                            <p className="text-xs text-text-300">{session.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {session.device.includes('Mobile') ? (
                              <Smartphone className="h-4 w-4 text-text-300" />
                            ) : (
                              <Monitor className="h-4 w-4 text-text-300" />
                            )}
                            <span className="text-sm">{session.device}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{session.location}</p>
                            <p className="text-xs text-text-300">{session.ipAddress}</p>
                          </div>
                        </TableCell>
                        <TableCell>{session.lastActive}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTerminateSession(session.id)}
                            className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                          >
                            Terminate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid gap-4">
            {securityAlerts.map((alert) => (
              <Card key={alert.id} className="bg-panel border-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Badge className={cn('mt-1', getSeverityColor(alert.severity))}>
                        {alert.severity}
                      </Badge>
                      <div>
                        <h3 className="font-semibold text-text-100">{alert.title}</h3>
                        <p className="text-text-200 mt-1">{alert.description}</p>
                        <p className="text-xs text-text-300 mt-2">{alert.timestamp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        alert.status === 'new' && 'border-yellow-500/20 text-yellow-500',
                        alert.status === 'investigating' && 'border-blue-500/20 text-blue-500',
                        alert.status === 'resolved' && 'border-green-500/20 text-green-500'
                      )}>
                        {alert.status}
                      </Badge>
                      {alert.status === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                          className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
                        >
                          Investigate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-panel border-border">
              <CardHeader>
                <CardTitle>Authentication Settings</CardTitle>
                <CardDescription>
                  Configure user authentication and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-text-100">Two-Factor Authentication</Label>
                    <p className="text-sm text-text-300">Require 2FA for all users</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSecuritySettingChange('twoFactorAuth', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-text-100">Password Expiry</Label>
                    <p className="text-sm text-text-300">Force password changes every 90 days</p>
                  </div>
                  <Switch
                    checked={securitySettings.passwordExpiry}
                    onCheckedChange={(checked) => handleSecuritySettingChange('passwordExpiry', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-text-100">Session Timeout</Label>
                    <p className="text-sm text-text-300">Auto-logout after 30 minutes of inactivity</p>
                  </div>
                  <Switch
                    checked={securitySettings.sessionTimeout}
                    onCheckedChange={(checked) => handleSecuritySettingChange('sessionTimeout', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-text-100">Login Notifications</Label>
                    <p className="text-sm text-text-300">Email alerts for new logins</p>
                  </div>
                  <Switch
                    checked={securitySettings.loginNotifications}
                    onCheckedChange={(checked) => handleSecuritySettingChange('loginNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-panel border-border">
              <CardHeader>
                <CardTitle>System Security</CardTitle>
                <CardDescription>
                  Configure system-wide security policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-text-100">IP Whitelist</Label>
                    <p className="text-sm text-text-300">Restrict access to approved IP addresses</p>
                  </div>
                  <Switch
                    checked={securitySettings.ipWhitelist}
                    onCheckedChange={(checked) => handleSecuritySettingChange('ipWhitelist', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-text-100">Audit Logging</Label>
                    <p className="text-sm text-text-300">Log all user activities and system changes</p>
                  </div>
                  <Switch
                    checked={securitySettings.auditLogging}
                    onCheckedChange={(checked) => handleSecuritySettingChange('auditLogging', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-text-100">Data Encryption</Label>
                    <p className="text-sm text-text-300">Encrypt sensitive data at rest</p>
                  </div>
                  <Switch
                    checked={securitySettings.dataEncryption}
                    onCheckedChange={(checked) => handleSecuritySettingChange('dataEncryption', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-text-100">Backup Encryption</Label>
                    <p className="text-sm text-text-300">Encrypt all backup files</p>
                  </div>
                  <Switch
                    checked={securitySettings.backupEncryption}
                    onCheckedChange={(checked) => handleSecuritySettingChange('backupEncryption', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Policies */}
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>
                Configure organization-wide security policies and compliance settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-text-200">Password Policy</Label>
                    <Select defaultValue="strong">
                      <SelectTrigger className="bg-panel-alt border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-panel border-border">
                        <SelectItem value="basic">Basic (8+ characters)</SelectItem>
                        <SelectItem value="strong">Strong (12+ chars, mixed case, numbers)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (16+ chars, special chars)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-text-200">Session Duration</Label>
                    <Select defaultValue="30">
                      <SelectTrigger className="bg-panel-alt border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-panel border-border">
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-text-200">Failed Login Threshold</Label>
                    <Select defaultValue="5">
                      <SelectTrigger className="bg-panel-alt border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-panel border-border">
                        <SelectItem value="3">3 attempts</SelectItem>
                        <SelectItem value="5">5 attempts</SelectItem>
                        <SelectItem value="10">10 attempts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-text-200">Account Lockout Duration</Label>
                    <Select defaultValue="15">
                      <SelectTrigger className="bg-panel-alt border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-panel border-border">
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}