'use client'

import { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { SalonAuthGuard } from '@/components/salon/auth/SalonAuthGuard'
import { universalApi } from '@/lib/universal-api-v2'
import {
  Plus,
  Clock,
  Calendar,
  UserCheck,
  TrendingUp,
  Users,
  Search,
  Edit,
  Trash2
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/luxe-dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  emerald: '#0F6F5C'
}

interface Staff {
  id: string
  entity_name: string
  entity_code: string
  metadata?: any
  dynamic_data?: Record<string, any>
  created_at: string
}

interface StaffStats {
  totalStaff: number
  activeToday: number
  onLeave: number
  averageRating: number
}

function StaffContent() {
  const { user, organization } = useHERAAuth()
  const [localOrgId, setLocalOrgId] = useState<string | null>(null)
  const { toast } = useToast()

  // Get organization ID from localStorage for demo mode
  useEffect(() => {
    const storedOrgId = localStorage.getItem('organizationId')
    if (storedOrgId) {
      setLocalOrgId(storedOrgId)
    }
  }, [])

  const organizationId = organization?.id || localOrgId

  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StaffStats>({
    totalStaff: 0,
    activeToday: 0,
    onLeave: 0,
    averageRating: 4.8
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddingStaff, setIsAddingStaff] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'stylist',
    phone: '',
    email: '',
    hourly_rate: '',
    commission_rate: ''
  })

  useEffect(() => {
    if (!organizationId) return
    loadStaff()
  }, [organizationId])

  const loadStaff = async () => {
    if (!organizationId) return

    try {
      setLoading(true)
      universalApi.setOrganizationId(organizationId)

      // Load staff entities
      const staffResponse = await universalApi.read({
        table: 'core_entities',
        filters: [
          { field: 'organization_id', operator: 'eq', value: organizationId },
          { field: 'entity_type', operator: 'eq', value: 'staff' }
        ]
      })

      if (staffResponse?.data) {
        // Load dynamic data for each staff member
        const staffWithDetails = await Promise.all(
          staffResponse.data.map(async (s: any) => {
            const dynamicResponse = await universalApi.read({
              table: 'core_dynamic_data',
              filters: [
                { field: 'organization_id', operator: 'eq', value: organizationId },
                { field: 'entity_id', operator: 'eq', value: s.id }
              ]
            })

            const dynamicDataMap = (dynamicResponse?.data || []).reduce((acc: any, dd: any) => {
              acc[dd.field_name] =
                dd.field_value_text || dd.field_value_number || dd.field_value_boolean
              return acc
            }, {})

            return { ...s, dynamic_data: dynamicDataMap }
          })
        )

        setStaff(staffWithDetails)
        setStats({
          totalStaff: staffWithDetails.length,
          activeToday: Math.floor(staffWithDetails.length * 0.8),
          onLeave: Math.floor(staffWithDetails.length * 0.2),
          averageRating: 4.8
        })
      }
    } catch (error) {
      console.error('Error loading staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async () => {
    if (!organizationId || !newStaff.name) return

    try {
      setIsAddingStaff(true)
      universalApi.setOrganizationId(organizationId)

      // Create staff entity
      const staffResponse = await universalApi.create('core_entities', {
        organization_id: organizationId,
        entity_type: 'staff',
        entity_name: newStaff.name,
        entity_code: `STAFF-${Date.now()}`,
        smart_code: 'HERA.SALON.STAFF.ENTITY.V1',
        metadata: { role: newStaff.role }
      })

      if (staffResponse?.success && staffResponse?.data) {
        // Add dynamic fields
        const dynamicFields = [
          { field_name: 'phone', field_value_text: newStaff.phone },
          { field_name: 'email', field_value_text: newStaff.email },
          { field_name: 'hourly_rate', field_value_number: parseFloat(newStaff.hourly_rate) || 0 },
          {
            field_name: 'commission_rate',
            field_value_number: parseFloat(newStaff.commission_rate) || 0
          },
          { field_name: 'role', field_value_text: newStaff.role }
        ]

        for (const field of dynamicFields) {
          if (field.field_value_text || field.field_value_number) {
            await universalApi.create('core_dynamic_data', {
              organization_id: organizationId,
              entity_id: staffResponse.data.id,
              field_name: field.field_name,
              field_value_text: field.field_value_text,
              field_value_number: field.field_value_number,
              smart_code: `HERA.SALON.STAFF.DYN.${field.field_name.toUpperCase()}.V1`
            })
          }
        }

        toast({
          title: 'Success',
          description: 'Staff member added successfully'
        })

        // Reset form and reload
        setNewStaff({
          name: '',
          role: 'stylist',
          phone: '',
          email: '',
          hourly_rate: '',
          commission_rate: ''
        })
        loadStaff()
      }
    } catch (error) {
      console.error('Error adding staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to add staff member',
        variant: 'destructive'
      })
    } finally {
      setIsAddingStaff(false)
    }
  }

  const filteredStaff = staff.filter(
    s =>
      s.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.dynamic_data?.role?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!organizationId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.black }}
      >
        <div
          className="text-center p-8 rounded-xl"
          style={{
            backgroundColor: COLORS.charcoal,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h2 className="text-xl font-medium mb-2" style={{ color: COLORS.champagne }}>
            Loading...
          </h2>
          <p style={{ color: COLORS.lightText, opacity: 0.7 }}>Setting up staff management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.black }}>
      <div
        className="rounded-2xl p-8"
        style={{
          backgroundColor: COLORS.charcoal,
          border: `1px solid ${COLORS.gold}20`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{
                background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Staff Management
            </h1>
            <p style={{ color: COLORS.bronze }}>Manage your salon team members</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black,
                  border: 'none'
                }}
                className="hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newStaff.name}
                    onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                    placeholder="Staff member name"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="w-full px-3 py-2 border rounded-md"
                    value={newStaff.role}
                    onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                  >
                    <option value="stylist">Stylist</option>
                    <option value="senior_stylist">Senior Stylist</option>
                    <option value="manager">Manager</option>
                    <option value="receptionist">Receptionist</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newStaff.phone}
                    onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="+971 50 123 4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStaff.email}
                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="staff@salon.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourly_rate">Hourly Rate (AED)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      value={newStaff.hourly_rate}
                      onChange={e => setNewStaff({ ...newStaff, hourly_rate: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="commission_rate">Commission %</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      value={newStaff.commission_rate}
                      onChange={e => setNewStaff({ ...newStaff, commission_rate: e.target.value })}
                      placeholder="20"
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddStaff}
                  disabled={isAddingStaff || !newStaff.name}
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                    color: COLORS.black,
                    border: 'none'
                  }}
                >
                  {isAddingStaff ? 'Adding...' : 'Add Staff Member'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Staff',
              value: stats.totalStaff,
              desc: 'Team members',
              icon: Users,
              color: COLORS.emerald
            },
            {
              title: 'Active Today',
              value: stats.activeToday,
              desc: 'Working now',
              icon: UserCheck,
              color: COLORS.gold
            },
            {
              title: 'On Leave',
              value: stats.onLeave,
              desc: 'Away today',
              icon: Calendar,
              color: COLORS.bronze
            },
            {
              title: 'Avg Rating',
              value: stats.averageRating,
              desc: 'Out of 5.0',
              icon: TrendingUp,
              color: COLORS.champagne
            }
          ].map((stat, index) => (
            <Card
              key={index}
              style={{
                backgroundColor: COLORS.charcoalLight,
                border: `1px solid ${COLORS.gold}20`,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium" style={{ color: COLORS.bronze }}>
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
                  {stat.value}
                </div>
                <p className="text-xs" style={{ color: COLORS.bronze }}>
                  {stat.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
              style={{ color: COLORS.bronze }}
            />
            <Input
              placeholder="Search by name or role..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 max-w-md"
              style={{
                backgroundColor: COLORS.charcoalLight,
                border: `1px solid ${COLORS.gold}30`,
                color: COLORS.champagne
              }}
            />
          </div>
        </div>

        {/* Staff List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: COLORS.gold }}
            />
            <span className="ml-3" style={{ color: COLORS.bronze }}>
              Loading staff data...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map(member => (
              <Card
                key={member.id}
                className="transition-all duration-200 hover:scale-[1.02]"
                style={{
                  backgroundColor: COLORS.charcoalLight,
                  border: `1px solid ${COLORS.gold}20`,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar
                      className="h-12 w-12"
                      style={{
                        backgroundColor: COLORS.gold,
                        color: COLORS.black
                      }}
                    >
                      <AvatarFallback style={{ backgroundColor: COLORS.gold, color: COLORS.black }}>
                        {member.entity_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg" style={{ color: COLORS.champagne }}>
                        {member.entity_name}
                      </h3>
                      <Badge
                        className="mt-1"
                        style={{
                          backgroundColor: `${COLORS.emerald}20`,
                          color: COLORS.emerald,
                          border: `1px solid ${COLORS.emerald}40`
                        }}
                      >
                        {member.dynamic_data?.role || 'Stylist'}
                      </Badge>
                      <div className="mt-3 space-y-1 text-sm" style={{ color: COLORS.bronze }}>
                        {member.dynamic_data?.phone && <div>📱 {member.dynamic_data.phone}</div>}
                        {member.dynamic_data?.email && <div>✉️ {member.dynamic_data.email}</div>}
                        <div className="flex gap-4 mt-2">
                          {member.dynamic_data?.hourly_rate && (
                            <span>💰 AED {member.dynamic_data.hourly_rate}/hr</span>
                          )}
                          {member.dynamic_data?.commission_rate && (
                            <span>📊 {member.dynamic_data.commission_rate}%</span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-xs" style={{ color: COLORS.bronze, opacity: 0.7 }}>
                        Joined {format(new Date(member.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.bronze }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: COLORS.champagne }}>
              No staff members found
            </h3>
            <p style={{ color: COLORS.bronze }}>
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Add your first staff member to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StaffPage() {
  return (
    <SalonAuthGuard requiredRoles={['Owner', 'Administrator']}>
      <StaffContent />
    </SalonAuthGuard>
  )
}
