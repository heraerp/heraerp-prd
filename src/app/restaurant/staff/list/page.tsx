'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, Clock, DollarSign, Search, Plus, Edit, Trash2, Eye, 
  Phone, Mail, Calendar, Star, ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * 👥 All Staff Members - Complete Staff List with CRUD
 * Customer-focused staff management that restaurant owners understand
 * 
 * Steve Jobs: "Simplicity is the ultimate sophistication"
 */

export default function StaffListPage() {
  const router = useRouter()
  const [staffMembers, setStaffMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  // Demo organization ID (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  // Staff Analytics Stats
  const [staffStats, setStaffStats] = useState({
    totalStaff: 24,
    activeStaff: 22,
    totalHours: 1280,
    avgHourlyRate: 16.75,
    weeklyLaborCost: 21440,
    efficiency: 94.2
  })

  // Staff roles for filtering
  const staffRoles = [
    'Server', 'Cook', 'Manager', 'Host/Hostess', 'Bartender', 
    'Kitchen Helper', 'Dishwasher', 'Delivery Driver', 'Cashier'
  ]

  useEffect(() => {
    loadStaffData()
  }, [])

  // Load staff data
  const loadStaffData = async () => {
    setLoading(true)
    try {
      // Fetch staff members using universal entities API
      const response = await fetch(`/api/v1/staff/entities?organization_id=${organizationId}&entity_type=staff_employee&include_dynamic_data=true`)
      const result = await response.json()
      
      if (result.success) {
        setStaffMembers(result.data || [])
        
        // Update stats based on real data
        const activeStaff = result.data.filter(member => member.status === 'active').length
        const totalHours = result.data.reduce((sum, member) => {
          return sum + (member.dynamic_fields?.weekly_hours?.value || 40)
        }, 0)
        const avgRate = result.data.reduce((sum, member) => sum + (member.dynamic_fields?.hourly_rate?.value || 0), 0) / result.data.length
        
        setStaffStats(prev => ({
          ...prev,
          totalStaff: result.data.length,
          activeStaff,
          totalHours,
          avgHourlyRate: avgRate || 16.75,
          weeklyLaborCost: Math.round(totalHours * (avgRate || 16.75))
        }))
      }
      
    } catch (error) {
      console.error('Error loading staff data:', error)
      setNotificationMessage('Failed to load staff data')
      setShowNotification(true)
    } finally {
      setLoading(false)
    }
  }

  // Filter staff members
  const filteredStaffMembers = staffMembers.filter(member => {
    const matchesSearch = member.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.dynamic_fields?.role?.value?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === 'all' || member.dynamic_fields?.role?.value === selectedRole
    return matchesSearch && matchesRole
  })

  // Delete staff member
  const deleteStaffMember = async (memberId, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from your team?`)) return
    
    try {
      // In a real implementation, you'd call a DELETE API
      // For now, we'll just remove from the local state
      setStaffMembers(prev => prev.filter(member => member.id !== memberId))
      setNotificationMessage(`${memberName} removed from team`)
      setShowNotification(true)
    } catch (error) {
      console.error('Error deleting staff member:', error)
      setNotificationMessage('Failed to remove team member')
      setShowNotification(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.push('/restaurant/staff/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
              Mario's Restaurant
            </Badge>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                👥 All Staff Members
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your team, track hours, control labor costs
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/restaurant/staff/form')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </div>
          </div>
        </div>

        {/* Staff Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold">{staffStats.totalStaff}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold">{staffStats.activeStaff}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Weekly Hours</p>
                  <p className="text-2xl font-bold">{staffStats.totalHours.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Rate</p>
                  <p className="text-2xl font-bold">${staffStats.avgHourlyRate.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Labor Cost</p>
                  <p className="text-2xl font-bold">${staffStats.weeklyLaborCost.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Efficiency</p>
                  <p className="text-2xl font-bold">{staffStats.efficiency}%</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({filteredStaffMembers.length})
              </CardTitle>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search staff members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  {staffRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4">
                  <div className="animate-spin w-full h-full border-4 border-blue-200 border-t-blue-500 rounded-full" />
                </div>
                <p className="text-gray-600">Loading staff members...</p>
              </div>
            ) : filteredStaffMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Staff Members Found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || selectedRole !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start building your team by adding your first member'
                  }
                </p>
                <Button
                  onClick={() => router.push('/restaurant/staff/form')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Team Member
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStaffMembers.map((member) => {
                  const firstName = member.dynamic_fields?.first_name?.value || ''
                  const lastName = member.dynamic_fields?.last_name?.value || ''
                  const role = member.dynamic_fields?.role?.value || 'Staff Member'
                  const hourlyRate = member.dynamic_fields?.hourly_rate?.value || 0
                  const phone = member.dynamic_fields?.phone?.value || ''
                  const email = member.dynamic_fields?.email?.value || ''
                  const hireDate = member.dynamic_fields?.hire_date?.value || ''
                  const skills = member.dynamic_fields?.skills?.value || []
                  
                  return (
                    <Card key={member.id} className="hover:shadow-lg transition-all hover:scale-105">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg">{member.entity_name}</h3>
                          <Badge className="bg-blue-100 text-blue-800">
                            {role}
                          </Badge>
                        </div>
                        
                        {hourlyRate > 0 && (
                          <p className="text-green-600 font-semibold mb-2">
                            ${hourlyRate.toFixed(2)}/hour
                          </p>
                        )}
                        
                        <div className="space-y-2 mb-4">
                          {phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2" />
                              {phone}
                            </div>
                          )}
                          {email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2" />
                              {email}
                            </div>
                          )}
                          {hireDate && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              Hired: {new Date(hireDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        {Array.isArray(skills) && skills.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {skills.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-3">
                          <Badge className={`text-xs ${
                            member.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.status}
                          </Badge>
                          {member.entity_code && (
                            <span className="text-xs text-gray-500">ID: {member.entity_code}</span>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteStaffMember(member.id, member.entity_name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {member.smart_code && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-blue-600 font-mono">{member.smart_code}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Why This Matters */}
        <Card className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold">🎯 Why Your Staff Management Matters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <strong className="text-blue-600">Control Labor Costs:</strong><br/>
                Track every hour and dollar spent on staffing - your second biggest expense.
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <strong className="text-emerald-600">Perfect Scheduling:</strong><br/>
                Right people, right time, every shift. No more overstaffing or understaffing.
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <strong className="text-orange-600">Track Performance:</strong><br/>
                See who your best performers are and reward them accordingly.
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-violet-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <strong className="text-purple-600">Build Better Teams:</strong><br/>
                Match skills to tasks and create teams that work together perfectly.
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Notification */}
        {showNotification && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className="p-4 rounded-lg shadow-lg bg-green-500 text-white">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                {notificationMessage}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
