'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { useUserContext } from '@/hooks/useUserContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Users, Search, MoreVertical, Mail, Shield, 
  UserX, UserCog, Clock, CheckCircle, XCircle,
  UserPlus
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Member {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  joinedAt: Date
  lastActiveAt: Date
  avatar?: string
}

export default function OrganizationMembersPage() {
  const { organizationId, userContext } = useUserContext()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (organizationId) {
      fetchMembers()
    }
  }, [organizationId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      // TODO: Implement actual API call
      // Simulated data for now
      setTimeout(() => {
        setMembers([
          {
            id: '1',
            name: 'John Smith',
            email: 'john@example.com',
            role: 'owner',
            status: 'active',
            joinedAt: new Date('2024-01-15'),
            lastActiveAt: new Date(),
          },
          {
            id: '2',
            name: 'Emma Wilson',
            email: 'emma@example.com',
            role: 'admin',
            status: 'active',
            joinedAt: new Date('2024-02-20'),
            lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            id: '3',
            name: 'Michael Chen',
            email: 'michael@example.com',
            role: 'manager',
            status: 'active',
            joinedAt: new Date('2024-03-10'),
            lastActiveAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          {
            id: '4',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            role: 'member',
            status: 'inactive',
            joinedAt: new Date('2024-04-05'),
            lastActiveAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        ])
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching members:', error)
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'manager':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Members</h1>
            <p className="text-gray-600">Manage members and their roles</p>
          </div>
          <Button asChild>
            <Link href="/organization/invitations">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Members
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search members by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Members ({filteredMembers.length})</CardTitle>
            <CardDescription>
              All members with access to {userContext?.organization?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{member.name}</h3>
                        {getStatusIcon(member.status)}
                      </div>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge 
                          variant="outline" 
                          className={getRoleBadgeColor(member.role)}
                        >
                          {member.role}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Joined {format(member.joinedAt, 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs text-gray-500">
                          Last active {format(member.lastActiveAt, 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserCog className="w-4 h-4 mr-2" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Shield className="w-4 h-4 mr-2" />
                        View Permissions
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <UserX className="w-4 h-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}