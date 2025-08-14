'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  User, Building, Users, Shield, Crown,
  RefreshCw, CheckCircle, ArrowLeftRight
} from 'lucide-react'
import { BPOUserRole } from '@/lib/bpo/bpo-entities'
import { MOCK_BPO_USERS } from '@/lib/bpo/bpo-auth'

interface BPORoleSwitcherProps {
  onRoleChange?: (user: typeof MOCK_BPO_USERS[0]) => void
  className?: string
}

export function BPORoleSwitcher({ onRoleChange, className = '' }: BPORoleSwitcherProps) {
  const [selectedUserId, setSelectedUserId] = useState(MOCK_BPO_USERS[0].id)
  const [isChanging, setIsChanging] = useState(false)

  const currentUser = MOCK_BPO_USERS.find(user => user.id === selectedUserId) || MOCK_BPO_USERS[0]

  const handleRoleChange = async (userId: string) => {
    setIsChanging(true)
    setSelectedUserId(userId)
    
    const newUser = MOCK_BPO_USERS.find(user => user.id === userId)
    if (newUser) {
      // Simulate role switching delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Store in localStorage for persistence
      localStorage.setItem('bpo-current-user', JSON.stringify(newUser))
      
      if (onRoleChange) {
        onRoleChange(newUser)
      }
      
      // Refresh the page to apply new role
      window.location.reload()
    }
    
    setIsChanging(false)
  }

  const getRoleIcon = (role: BPOUserRole) => {
    switch (role) {
      case 'head-office': return <Building className="w-4 h-4" />
      case 'back-office': return <Users className="w-4 h-4" />
      case 'supervisor': return <Shield className="w-4 h-4" />
      case 'admin': return <Crown className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: BPOUserRole) => {
    switch (role) {
      case 'head-office': return 'bg-blue-100 text-blue-700'
      case 'back-office': return 'bg-green-100 text-green-700'
      case 'supervisor': return 'bg-purple-100 text-purple-700'
      case 'admin': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getUsersByRole = () => {
    const grouped = MOCK_BPO_USERS.reduce((acc, user) => {
      if (!acc[user.role]) acc[user.role] = []
      acc[user.role].push(user)
      return acc
    }, {} as Record<BPOUserRole, typeof MOCK_BPO_USERS>)

    return grouped
  }

  const usersByRole = getUsersByRole()

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Demo Role Switcher</h3>
        </div>
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Testing Mode
        </Badge>
      </div>

      {/* Current User Display */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {currentUser.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{currentUser.name}</span>
              <Badge className={getRoleColor(currentUser.role)}>
                {getRoleIcon(currentUser.role)}
                <span className="ml-1 capitalize">{currentUser.role.replace('-', ' ')}</span>
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{currentUser.department}</p>
          </div>
        </div>
      </div>

      {/* Role Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Switch to User:</label>
        <Select value={selectedUserId} onValueChange={handleRoleChange} disabled={isChanging}>
          <SelectTrigger className="bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50 max-h-96 overflow-y-auto">
            {Object.entries(usersByRole).map(([role, users]) => (
              <div key={role}>
                <div className="px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                  {role.replace('-', ' ')} Users
                </div>
                {users.map(user => (
                  <SelectItem 
                    key={user.id} 
                    className="px-3 py-3 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 bg-white text-gray-900 border-b border-gray-50 last:border-b-0" 
                    value={user.id}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={`p-1 rounded ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.department}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>

        {isChanging && (
          <div className="flex items-center justify-center gap-2 py-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-600">Switching role...</span>
          </div>
        )}
      </div>

      {/* Role Permissions Preview */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Features:</h4>
        <div className="space-y-1">
          {currentUser.role === 'head-office' && (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Invoice Upload & Management
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Communication with Back Office
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Analytics & Reporting
              </div>
            </>
          )}
          
          {currentUser.role === 'back-office' && (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Work Queue Management
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Invoice Processing & Verification
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Query Resolution
              </div>
            </>
          )}

          {(currentUser.role === 'supervisor' || currentUser.role === 'admin') && (
            <>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500" />
                All Head Office Features
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500" />
                All Back Office Features
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Team Management
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Role changes will refresh the page to show different interface modules
        </p>
      </div>
    </div>
  )
}