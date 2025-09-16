// ================================================================================
// ROLE TABLE - SETTINGS COMPONENT
// Smart Code: HERA.UI.SETTINGS.ROLE_TABLE.v1
// Production-ready role grants table with chips and actions
// ================================================================================

'use client'

import React from 'react'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { 
  Edit, 
  Trash2,
  Mail,
  Clock,
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react'
import { RoleGrant, UserRole } from '@/src/lib/schemas/settings'

interface RoleTableProps {
  grants: RoleGrant[]
  onEdit: (grant: RoleGrant) => void
  onRevoke: (grant: RoleGrant) => void
  isRevoking: boolean
  showInactive?: boolean
}

const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    color: 'text-red-700 border-red-300 bg-red-50 dark:bg-red-950/30',
    icon: Shield,
    description: 'Full system access'
  },
  manager: {
    label: 'Manager',
    color: 'text-purple-700 border-purple-300 bg-purple-50 dark:bg-purple-950/30',
    icon: Users,
    description: 'Management and reports'
  },
  stylist: {
    label: 'Stylist',
    color: 'text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950/30',
    icon: Users,
    description: 'Service operations'
  },
  receptionist: {
    label: 'Receptionist',
    color: 'text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30',
    icon: Users,
    description: 'Front desk operations'
  }
}

export function RoleTable({ grants, onEdit, onRevoke, isRevoking, showInactive = false }: RoleTableProps) {
  const getRoleBadge = (role: UserRole) => {
    const config = ROLE_CONFIG[role]
    if (!config) return null

    return (
      <Badge 
        key={role}
        variant="outline" 
        className={`${config.color} text-xs font-medium`}
        title={config.description}
      >
        <config.icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getHighestRole = (roles: UserRole[]): UserRole => {
    const roleHierarchy: UserRole[] = ['owner', 'manager', 'stylist', 'receptionist']
    for (const role of roleHierarchy) {
      if (roles.includes(role)) {
        return role
      }
    }
    return 'stylist'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">
              User
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">
              Roles
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">
              Status
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">
              Granted
            </th>
            <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {grants.map((grant, index) => {
            const isEven = index % 2 === 0
            const highestRole = getHighestRole(grant.roles)
            const roleConfig = ROLE_CONFIG[highestRole]
            
            return (
              <tr 
                key={grant.user_email}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  isEven ? 'bg-gray-50/30 dark:bg-gray-800/20' : ''
                }`}
              >
                {/* User Column */}
                <td className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleConfig?.color || 'bg-gray-100'}`}>
                      {roleConfig ? (
                        <roleConfig.icon className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {grant.user_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {grant.user_email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Roles Column */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {grant.roles.length > 0 ? (
                      grant.roles.map(role => getRoleBadge(role))
                    ) : (
                      <Badge variant="outline" className="text-gray-500 border-gray-300">
                        No roles
                      </Badge>
                    )}
                  </div>
                </td>

                {/* Status Column */}
                <td className="py-4 px-4">
                  {grant.is_active ? (
                    <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 dark:bg-red-950/30">
                      <XCircle className="h-3 w-3 mr-1" />
                      Revoked
                    </Badge>
                  )}
                </td>

                {/* Granted Column */}
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {formatDate(grant.granted_at)}
                    </div>
                    {grant.granted_by && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        by {grant.granted_by}
                      </div>
                    )}
                  </div>
                </td>

                {/* Actions Column */}
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(grant)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    {grant.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRevoke(grant)}
                        disabled={isRevoking}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        {isRevoking ? (
                          <Clock className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}