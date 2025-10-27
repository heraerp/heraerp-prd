/**
 * Role Management Interface
 * Smart Code: HERA.RBAC.ADMIN.v1
 * 
 * Administrative interface for managing user roles and permissions
 */

'use client'

import React, { useState } from 'react'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { useAccessControl } from '@/hooks/useAccessControl'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  Users, 
  Shield, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Search,
  Filter,
  Download,
  UserCheck,
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  department: string
  roles: string[]
  lastLogin: string
  status: 'active' | 'inactive' | 'pending'
}

interface RoleAssignmentRequest {
  id: string
  userId: string
  userName: string
  requestedRole: string
  requestedBy: string
  requestDate: string
  status: 'pending' | 'approved' | 'rejected'
  justification: string
}

export default function RoleManagementPage() {
  const { user } = useHERAAuth()
  const userId = user?.id || 'admin-user'
  const { userRoles } = useAccessControl({ userId })

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'requests'>('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRoleAssignment, setShowRoleAssignment] = useState(false)

  // Mock data for demonstration
  const mockUsers: User[] = [
    {
      id: 'user1',
      email: 'john.doe@company.com',
      name: 'John Doe',
      department: 'Finance',
      roles: ['finance_manager', 'accounts_payable_clerk'],
      lastLogin: '2024-01-15T10:30:00Z',
      status: 'active'
    },
    {
      id: 'user2',
      email: 'jane.smith@company.com',
      name: 'Jane Smith',
      department: 'Sales',
      roles: ['sales_manager'],
      lastLogin: '2024-01-15T09:15:00Z',
      status: 'active'
    },
    {
      id: 'user3',
      email: 'mike.wilson@company.com',
      name: 'Mike Wilson',
      department: 'HR',
      roles: ['hr_specialist'],
      lastLogin: '2024-01-14T16:45:00Z',
      status: 'inactive'
    }
  ]

  const mockRequests: RoleAssignmentRequest[] = [
    {
      id: 'req1',
      userId: 'user4',
      userName: 'Sarah Johnson',
      requestedRole: 'finance_manager',
      requestedBy: 'hr_manager',
      requestDate: '2024-01-15T08:00:00Z',
      status: 'pending',
      justification: 'Promotion to Finance Manager position'
    },
    {
      id: 'req2',
      userId: 'user5',
      userName: 'Tom Brown',
      requestedRole: 'sales_rep',
      requestedBy: 'sales_manager',
      requestDate: '2024-01-14T14:30:00Z',
      status: 'pending',
      justification: 'New hire - Sales Representative'
    }
  ]

  const availableRoles = [
    { id: 'finance_manager', name: 'Finance Manager', category: 'Finance' },
    { id: 'accounts_payable_clerk', name: 'Accounts Payable Clerk', category: 'Finance' },
    { id: 'sales_manager', name: 'Sales Manager', category: 'Sales' },
    { id: 'sales_rep', name: 'Sales Representative', category: 'Sales' },
    { id: 'hr_specialist', name: 'HR Specialist', category: 'HR' },
    { id: 'procurement_specialist', name: 'Procurement Specialist', category: 'Materials' }
  ]

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRoleAssignment = (userId: string, roleId: string, action: 'assign' | 'remove') => {
    // In real implementation, this would call an API
    console.log(`${action} role ${roleId} for user ${userId}`)
  }

  const handleRequestApproval = (requestId: string, action: 'approve' | 'reject') => {
    // In real implementation, this would call an API
    console.log(`${action} request ${requestId}`)
  }

  return (
    <ProtectedPage requiredPermissions={['system.admin']}>
      <div className="sap-font min-h-screen bg-gray-100">
        <SapNavbar 
          title="HERA" 
          breadcrumb="System Administration > Role Management"
          showBack={true}
          userInitials={user?.email?.charAt(0).toUpperCase() || 'A'}
          showSearch={true}
          onBack={() => window.history.back()}
        />
        
        <main className="mt-12 min-h-[calc(100vh-48px)]">
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-600" />
                    Role & Access Management
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage user roles, permissions, and access control across the enterprise
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add User</span>
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    { id: 'users', name: 'Users & Roles', icon: Users, count: mockUsers.length },
                    { id: 'roles', name: 'Role Definitions', icon: Settings, count: availableRoles.length },
                    { id: 'requests', name: 'Pending Requests', icon: Clock, count: mockRequests.length }
                  ].map((tab) => {
                    const IconComponent = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 mr-2" />
                        {tab.name}
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {tab.count}
                        </span>
                      </button>
                    )
                  })}
                </nav>
              </div>

              <div className="p-6">
                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    {/* Search and Filters */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                          <Filter className="h-4 w-4" />
                          <span>Filter</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Users Table */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Roles
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Login
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">
                                      {user.name.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.department}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-1">
                                  {user.roles.map((role, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                                    >
                                      {role.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(user.lastLogin).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.status === 'active' 
                                    ? 'bg-green-100 text-green-800'
                                    : user.status === 'inactive'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setShowRoleAssignment(true)
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button className="text-red-600 hover:text-red-900">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Roles Tab */}
                {activeTab === 'roles' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableRoles.map((role) => (
                        <div key={role.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">{role.name}</h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {role.category}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            Users with this role: {mockUsers.filter(u => u.roles.includes(role.id)).length}
                          </div>
                          <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                            View Permissions
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                  <div className="space-y-4">
                    {mockRequests.map((request) => (
                      <div key={request.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <UserCheck className="h-5 w-5 text-blue-600" />
                              <div>
                                <h3 className="font-semibold text-gray-900">{request.userName}</h3>
                                <p className="text-sm text-gray-600">
                                  Requesting: <span className="font-medium">{request.requestedRole.replace(/_/g, ' ')}</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{request.justification}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleRequestApproval(request.id, 'approve')}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                            >
                              <Check className="h-3 w-3" />
                              <span>Approve</span>
                            </button>
                            <button 
                              onClick={() => handleRequestApproval(request.id, 'reject')}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center space-x-1"
                            >
                              <X className="h-3 w-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>

        {/* Role Assignment Modal */}
        {showRoleAssignment && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Manage Roles for {selectedUser.name}
                </h3>
                <div className="space-y-3">
                  {availableRoles.map((role) => {
                    const isAssigned = selectedUser.roles.includes(role.id)
                    return (
                      <div key={role.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{role.name}</div>
                          <div className="text-sm text-gray-500">{role.category}</div>
                        </div>
                        <button
                          onClick={() => handleRoleAssignment(selectedUser.id, role.id, isAssigned ? 'remove' : 'assign')}
                          className={`px-3 py-1 rounded text-sm ${
                            isAssigned
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {isAssigned ? 'Remove' : 'Assign'}
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRoleAssignment(false)
                      setSelectedUser(null)
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  )
}