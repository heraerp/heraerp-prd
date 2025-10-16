'use client'

import React from 'react'
import { 
  Building2, 
  Globe, 
  Phone, 
  Mail, 
  Users, 
  DollarSign, 
  TrendingUp,
  MapPin,
  Star,
  MoreHorizontal,
  ExternalLink,
  UserPlus,
  Target,
  Calendar
} from 'lucide-react'
import { MobileButton } from '@/components/mobile'

export interface CRMAccount {
  id: string
  entity_name: string
  industry?: string
  account_type?: string
  website?: string
  phone?: string
  email?: string
  annual_revenue?: number
  employee_count?: number
  rating?: string
  billing_address?: string
  shipping_address?: string
  description?: string
  created_date?: string
  last_activity_date?: string
  contact_count?: number
  opportunity_count?: number
  total_opportunity_value?: number
}

export interface CRMAccountCardProps {
  account: CRMAccount
  onAddContact?: (account: CRMAccount) => void
  onCreateOpportunity?: (account: CRMAccount) => void
  onCall?: (account: CRMAccount) => void
  onEmail?: (account: CRMAccount) => void
  onVisitWebsite?: (account: CRMAccount) => void
  onEdit?: (account: CRMAccount) => void
  onViewDetails?: (account: CRMAccount) => void
  compact?: boolean
  showActions?: boolean
  className?: string
}

export function CRMAccountCard({
  account,
  onAddContact,
  onCreateOpportunity,
  onCall,
  onEmail,
  onVisitWebsite,
  onEdit,
  onViewDetails,
  compact = false,
  showActions = true,
  className = ''
}: CRMAccountCardProps) {
  const getAccountTypeColor = (type?: string) => {
    switch (type) {
      case 'Customer':
        return 'bg-green-100 text-green-800'
      case 'Prospect':
        return 'bg-blue-100 text-blue-800'
      case 'Partner':
        return 'bg-purple-100 text-purple-800'
      case 'Competitor':
        return 'bg-red-100 text-red-800'
      case 'Former Customer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'Hot':
        return 'text-red-600'
      case 'Warm':
        return 'text-yellow-600'
      case 'Cold':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getCompanySize = (employees?: number) => {
    if (!employees) return null
    if (employees < 10) return 'Startup'
    if (employees < 50) return 'Small'
    if (employees < 200) return 'Medium'
    if (employees < 1000) return 'Large'
    return 'Enterprise'
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const isHighValue = (revenue?: number, oppValue?: number) => {
    return (revenue && revenue >= 1000000) || (oppValue && oppValue >= 100000)
  }

  const initials = account.entity_name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div 
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200
        ${isHighValue(account.annual_revenue, account.total_opportunity_value) ? 'ring-2 ring-blue-200 border-blue-300' : ''}
        ${compact ? 'p-3' : 'p-4'} ${className}
      `}
      onClick={() => onViewDetails?.(account)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Company Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
              {initials}
            </div>
          </div>
          
          {/* Company Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
                {account.entity_name}
              </h3>
              {isHighValue(account.annual_revenue, account.total_opportunity_value) && (
                <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" title="High Value Account" />
              )}
            </div>
            
            {account.industry && (
              <div className="flex items-center gap-1 text-gray-600 mb-1">
                <TrendingUp className="w-3 h-3" />
                <span className={`truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                  {account.industry}
                </span>
              </div>
            )}

            {account.website && !compact && (
              <div className="flex items-center gap-1 text-gray-500">
                <Globe className="w-3 h-3" />
                <span className="text-sm truncate">
                  {account.website.replace(/^https?:\/\//, '')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Handle menu
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Status and Type */}
      <div className="flex items-center gap-2 mb-3">
        {account.account_type && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.account_type)}`}>
            {account.account_type}
          </span>
        )}
        
        {account.rating && (
          <div className="flex items-center gap-1">
            <Star className={`w-3 h-3 ${getRatingColor(account.rating)}`} />
            <span className={`text-xs font-medium ${getRatingColor(account.rating)}`}>
              {account.rating}
            </span>
          </div>
        )}
      </div>

      {/* Contact Info */}
      {!compact && (
        <div className="space-y-1 mb-3">
          {account.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-3 h-3" />
              <span className="truncate">{account.email}</span>
            </div>
          )}
          
          {account.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-3 h-3" />
              <span>{account.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Company Stats */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        {account.annual_revenue && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-green-600" />
            <div>
              <div className="text-gray-900 font-medium">
                {formatCurrency(account.annual_revenue)}
              </div>
              <div className="text-xs text-gray-500">Revenue</div>
            </div>
          </div>
        )}
        
        {account.employee_count && (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-600" />
            <div>
              <div className="text-gray-900 font-medium">
                {account.employee_count.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                {getCompanySize(account.employee_count)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CRM Stats */}
      {(account.contact_count || account.opportunity_count) && (
        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
          {account.contact_count !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-purple-600" />
              <div>
                <div className="text-gray-900 font-medium">
                  {account.contact_count}
                </div>
                <div className="text-xs text-gray-500">Contacts</div>
              </div>
            </div>
          )}
          
          {account.opportunity_count !== undefined && (
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-orange-600" />
              <div>
                <div className="text-gray-900 font-medium">
                  {account.opportunity_count}
                </div>
                <div className="text-xs text-gray-500">Opportunities</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Opportunity Value */}
      {account.total_opportunity_value && account.total_opportunity_value > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            <div>
              <div className="text-sm font-medium text-green-800">
                {formatCurrency(account.total_opportunity_value)}
              </div>
              <div className="text-xs text-green-600">Pipeline Value</div>
            </div>
          </div>
        </div>
      )}

      {/* Last Activity */}
      {account.last_activity_date && !compact && (
        <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Last activity: {new Date(account.last_activity_date).toLocaleDateString()}
        </div>
      )}

      {/* Quick Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {account.phone && onCall && (
              <MobileButton
                size="small"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onCall(account)
                }}
                icon={<Phone className="w-3 h-3" />}
                className="text-green-600 hover:bg-green-50 p-1"
              />
            )}
            
            {account.email && onEmail && (
              <MobileButton
                size="small"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onEmail(account)
                }}
                icon={<Mail className="w-3 h-3" />}
                className="text-blue-600 hover:bg-blue-50 p-1"
              />
            )}

            {account.website && onVisitWebsite && (
              <MobileButton
                size="small"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onVisitWebsite(account)
                }}
                icon={<ExternalLink className="w-3 h-3" />}
                className="text-purple-600 hover:bg-purple-50 p-1"
              />
            )}
          </div>

          <div className="flex-1" />

          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            {onAddContact && (
              <MobileButton
                size="small"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddContact(account)
                }}
                icon={<UserPlus className="w-3 h-3" />}
                className="text-xs"
              >
                Add Contact
              </MobileButton>
            )}

            {onCreateOpportunity && (
              <MobileButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateOpportunity(account)
                }}
                icon={<Target className="w-3 h-3" />}
                className="text-xs"
              >
                New Opp
              </MobileButton>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact list item version
export function CRMAccountListItem({
  account,
  onSelect,
  selected = false,
  ...props
}: CRMAccountCardProps & {
  onSelect?: (account: CRMAccount) => void
  selected?: boolean
}) {
  return (
    <div className="relative">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect?.(account)}
        className="absolute top-4 left-4 rounded z-10"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="pl-10">
        <CRMAccountCard
          account={account}
          compact={true}
          showActions={false}
          {...props}
        />
      </div>
    </div>
  )
}

// Account summary widget
export function CRMAccountSummary({
  account,
  className = ''
}: {
  account: CRMAccount
  className?: string
}) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
          {account.entity_name.split(' ').map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {account.entity_name}
          </div>
          
          {account.industry && (
            <div className="text-sm text-gray-600 truncate">
              {account.industry}
            </div>
          )}
          
          <div className="flex items-center gap-4 mt-2 text-sm">
            {account.contact_count !== undefined && (
              <div className="flex items-center gap-1 text-gray-500">
                <Users className="w-3 h-3" />
                {account.contact_count} contacts
              </div>
            )}
            
            {account.opportunity_count !== undefined && (
              <div className="flex items-center gap-1 text-gray-500">
                <Target className="w-3 h-3" />
                {account.opportunity_count} opportunities
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}