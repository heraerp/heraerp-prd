'use client'

import React from 'react'
import { 
  Target, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  MoreHorizontal,
  Star,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { MobileButton } from '@/components/mobile'
import { CRM_STATUS_VALUES } from '@/lib/crm/smart-codes'

export interface CRMLead {
  id: string
  entity_name: string
  source: string
  company?: string
  email?: string
  phone?: string
  status?: string
  score?: number
  budget?: number
  timeline?: string
  created_date?: string
  last_activity_date?: string
  notes?: string
}

export interface CRMLeadCardProps {
  lead: CRMLead
  onConvert?: (lead: CRMLead) => void
  onCall?: (lead: CRMLead) => void
  onEmail?: (lead: CRMLead) => void
  onEdit?: (lead: CRMLead) => void
  onViewDetails?: (lead: CRMLead) => void
  compact?: boolean
  showActions?: boolean
  className?: string
}

export function CRMLeadCard({
  lead,
  onConvert,
  onCall,
  onEmail,
  onEdit,
  onViewDetails,
  compact = false,
  showActions = true,
  className = ''
}: CRMLeadCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800'
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800'
      case 'Qualified':
        return 'bg-green-100 text-green-800'
      case 'Unqualified':
        return 'bg-red-100 text-red-800'
      case 'Converted':
        return 'bg-purple-100 text-purple-800'
      case 'Nurturing':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'website':
        return <Globe className="w-3 h-3" />
      case 'referral':
        return <Star className="w-3 h-3" />
      case 'cold call':
        return <Phone className="w-3 h-3" />
      case 'email campaign':
        return <Mail className="w-3 h-3" />
      case 'social media':
        return <TrendingUp className="w-3 h-3" />
      default:
        return <Target className="w-3 h-3" />
    }
  }

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
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

  const isHighValue = (budget?: number) => {
    return budget && budget >= 50000
  }

  const isHotLead = (status?: string, score?: number) => {
    return status === 'Qualified' || (score && score >= 80)
  }

  return (
    <div 
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200
        ${isHotLead(lead.status, lead.score) ? 'ring-2 ring-green-200 border-green-300' : ''}
        ${compact ? 'p-3' : 'p-4'} ${className}
      `}
      onClick={() => onViewDetails?.(lead)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Lead Icon */}
          <div className={`flex-shrink-0 p-2 rounded-lg ${isHotLead(lead.status, lead.score) ? 'bg-green-100' : 'bg-orange-100'}`}>
            <Target className={`w-4 h-4 ${isHotLead(lead.status, lead.score) ? 'text-green-600' : 'text-orange-600'}`} />
          </div>
          
          {/* Lead Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
                {lead.entity_name}
              </h3>
              {isHighValue(lead.budget) && (
                <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" title="High Value Lead" />
              )}
              {isHotLead(lead.status, lead.score) && (
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="Hot Lead" />
              )}
            </div>
            
            {lead.company && (
              <div className="flex items-center gap-1 text-gray-600 mb-1">
                <Building2 className="w-3 h-3" />
                <span className={`truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                  {lead.company}
                </span>
              </div>
            )}

            {/* Source */}
            <div className="flex items-center gap-1 text-gray-500">
              {getSourceIcon(lead.source)}
              <span className={`${compact ? 'text-xs' : 'text-sm'}`}>
                {lead.source}
              </span>
            </div>
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

      {/* Status and Score */}
      <div className="flex items-center gap-2 mb-3">
        {lead.status && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
            {lead.status}
          </span>
        )}
        
        {lead.score !== undefined && (
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${getScoreColor(lead.score)}`}>
              Score: {lead.score}
            </span>
            <div className="w-12 bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${lead.score >= 80 ? 'bg-green-500' : lead.score >= 60 ? 'bg-yellow-500' : lead.score >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                style={{ width: `${lead.score}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Contact Info */}
      {!compact && (
        <div className="space-y-1 mb-3">
          {lead.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-3 h-3" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          
          {lead.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-3 h-3" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Lead Details */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        {lead.budget && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-green-600" />
            <span className="text-gray-900 font-medium">
              {formatCurrency(lead.budget)}
            </span>
          </div>
        )}
        
        {lead.timeline && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span className="text-gray-600 text-xs">
              {lead.timeline}
            </span>
          </div>
        )}
      </div>

      {/* Last Activity */}
      {lead.last_activity_date && !compact && (
        <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Last activity: {new Date(lead.last_activity_date).toLocaleDateString()}
        </div>
      )}

      {/* Quick Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {lead.phone && onCall && (
              <MobileButton
                size="small"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onCall(lead)
                }}
                icon={<Phone className="w-3 h-3" />}
                className="text-green-600 hover:bg-green-50"
              />
            )}
            
            {lead.email && onEmail && (
              <MobileButton
                size="small"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onEmail(lead)
                }}
                icon={<Mail className="w-3 h-3" />}
                className="text-blue-600 hover:bg-blue-50"
              />
            )}
          </div>

          {/* Convert Action */}
          {lead.status === 'Qualified' && onConvert && (
            <MobileButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                onConvert(lead)
              }}
              icon={<ArrowRight className="w-3 h-3" />}
              className="text-purple-600 hover:bg-purple-50"
            >
              Convert
            </MobileButton>
          )}
        </div>
      )}
    </div>
  )
}

// Compact list item version
export function CRMLeadListItem({
  lead,
  onSelect,
  selected = false,
  ...props
}: CRMLeadCardProps & {
  onSelect?: (lead: CRMLead) => void
  selected?: boolean
}) {
  return (
    <div className="relative">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect?.(lead)}
        className="absolute top-4 left-4 rounded z-10"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="pl-10">
        <CRMLeadCard
          lead={lead}
          compact={true}
          showActions={false}
          {...props}
        />
      </div>
    </div>
  )
}

// Lead conversion preview
export function CRMLeadConversionPreview({
  lead,
  conversionOptions,
  onConfirm,
  onCancel
}: {
  lead: CRMLead
  conversionOptions: {
    createAccount: boolean
    createContact: boolean
    createOpportunity: boolean
    opportunityAmount?: number
  }
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <CheckCircle className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Convert Lead</h3>
          <p className="text-sm text-gray-600">Create records from this qualified lead</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="font-medium text-gray-900 mb-1">{lead.entity_name}</div>
          <div className="text-sm text-gray-600">{lead.company}</div>
        </div>

        <div className="text-sm">
          <div className="font-medium text-gray-700 mb-2">Will create:</div>
          <ul className="space-y-1">
            {conversionOptions.createAccount && (
              <li className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                Account: {lead.company || lead.entity_name}
              </li>
            )}
            {conversionOptions.createContact && (
              <li className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                Contact: {lead.entity_name}
              </li>
            )}
            {conversionOptions.createOpportunity && (
              <li className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                Opportunity: {conversionOptions.opportunityAmount ? formatCurrency(conversionOptions.opportunityAmount) : 'TBD'}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="flex gap-3">
        <MobileButton
          onClick={onConfirm}
          className="flex-1"
          icon={<CheckCircle className="w-4 h-4" />}
        >
          Convert Lead
        </MobileButton>
        <MobileButton
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </MobileButton>
      </div>
    </div>
  )
}