'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
  User, Building, Users, Shield, Crown,
  RefreshCw, ArrowRight, Check
} from 'lucide-react'
import { BPOUserRole } from '@/lib/bpo/bpo-entities'
import { MOCK_BPO_USERS } from '@/lib/bpo/bpo-auth'

export function BPOQuickRoleSwitcher() {
  const [selectedUserId, setSelectedUserId] = useState(MOCK_BPO_USERS[0].id)
  const [isChanging, setIsChanging] = useState(false)

  const currentUser = MOCK_BPO_USERS.find(user => user.id === selectedUserId) || MOCK_BPO_USERS[0]

  const handleRoleChange = async (userId: string) => {
    if (userId === selectedUserId) return
    
    setIsChanging(true)
    setSelectedUserId(userId)
    
    const newUser = MOCK_BPO_USERS.find(user => user.id === userId)
    if (newUser) {
      // Store in localStorage for persistence
      localStorage.setItem('bpo-current-user', JSON.stringify(newUser))
      
      // Simulate role switching delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
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
      case 'head-office': return 'from-blue-500 to-blue-600'
      case 'back-office': return 'from-green-500 to-green-600'
      case 'supervisor': return 'from-purple-500 to-purple-600'
      case 'admin': return 'from-red-500 to-red-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getRoleBadgeColor = (role: BPOUserRole) => {
    switch (role) {
      case 'head-office': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'back-office': return 'bg-green-100 text-green-700 border-green-200'
      case 'supervisor': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'admin': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (isChanging) {
    return (
      <Card className="p-6 bg-white">
        <div className="flex items-center justify-center gap-3 py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-blue-600 font-medium">Switching role...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-white shadow-lg">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Role</h3>
        <p className="text-gray-600">Test different user perspectives in the BPO system</p>
      </div>

      {/* Current User */}
      <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRoleColor(currentUser.role)} flex items-center justify-center text-white font-bold text-lg`}>
              {currentUser.name[0]}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{currentUser.name}</h4>
              <p className="text-sm text-gray-600">{currentUser.department}</p>
            </div>
          </div>
          <Badge className={getRoleBadgeColor(currentUser.role)}>
            {getRoleIcon(currentUser.role)}
            <span className="ml-2 capitalize font-medium">
              {currentUser.role.replace('-', ' ')}
            </span>
          </Badge>
        </div>
      </div>

      {/* Role Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MOCK_BPO_USERS.map((user) => (
          <Button
            key={user.id}
            onClick={() => handleRoleChange(user.id)}
            variant={selectedUserId === user.id ? "default" : "outline"}
            className={`p-4 h-auto text-left relative ${
              selectedUserId === user.id 
                ? `bg-gradient-to-r ${getRoleColor(user.role)} text-white border-0 shadow-lg` 
                : 'hover:shadow-md border-2 hover:border-blue-300'
            }`}
            disabled={isChanging}
          >
            <div className="flex items-center gap-3 w-full">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                selectedUserId === user.id 
                  ? 'bg-white/20 text-white' 
                  : `bg-gradient-to-br ${getRoleColor(user.role)} text-white`
              }`}>
                {user.name[0]}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm">{user.name}</div>
                <div className={`text-xs ${
                  selectedUserId === user.id ? 'text-white/80' : 'text-gray-500'
                }`}>
                  {user.department}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className={`p-0.5 rounded ${
                    selectedUserId === user.id 
                      ? 'bg-white/20' 
                      : getRoleBadgeColor(user.role)
                  }`}>
                    {getRoleIcon(user.role)}
                  </div>
                  <span className={`text-xs capitalize font-medium ${
                    selectedUserId === user.id ? 'text-white' : 'text-gray-600'
                  }`}>
                    {user.role.replace('-', ' ')}
                  </span>
                </div>
              </div>
              {selectedUserId === user.id && (
                <Check className="w-5 h-5 text-white" />
              )}
            </div>
          </Button>
        ))}
      </div>

      {/* Action Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Button
          onClick={() => window.location.href = '/bpo-progressive'}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 text-lg hover:shadow-lg transition-all duration-300"
        >
          <span>Go to {currentUser.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Dashboard</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Feature Preview */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h5 className="font-semibold text-gray-800 text-sm mb-2">
          {currentUser.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Features:
        </h5>
        <div className="text-xs text-gray-600">
          {currentUser.role === 'head-office' && (
            <span>Invoice Upload • Analytics • Communication • Audit Trail</span>
          )}
          {currentUser.role === 'back-office' && (
            <span>Work Queue • Processing • Verification • Query Resolution</span>
          )}
          {(currentUser.role === 'supervisor' || currentUser.role === 'admin') && (
            <span>All Features • Team Management • System Configuration</span>
          )}
        </div>
      </div>
    </Card>
  )
}