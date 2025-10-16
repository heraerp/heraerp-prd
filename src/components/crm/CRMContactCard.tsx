'use client'

import React from 'react'
import { User, Phone, Mail, MessageCircle, Calendar, MapPin, Building2, ExternalLink } from 'lucide-react'

export interface CRMContact {
  id: string
  entity_name: string
  email?: string
  phone?: string
  mobile?: string
  job_title?: string
  department?: string
  company?: string
  linkedin_url?: string
  contact_role?: string
  last_activity_date?: string
  avatar_url?: string
}

export interface CRMContactCardProps {
  contact: CRMContact
  onCall?: (contact: CRMContact) => void
  onEmail?: (contact: CRMContact) => void
  onSMS?: (contact: CRMContact) => void
  onScheduleMeeting?: (contact: CRMContact) => void
  onViewProfile?: (contact: CRMContact) => void
  onEdit?: (contact: CRMContact) => void
  compact?: boolean
  showActions?: boolean
  className?: string
}

export function CRMContactCard({
  contact,
  onCall,
  onEmail,
  onSMS,
  onScheduleMeeting,
  onViewProfile,
  onEdit,
  compact = false,
  showActions = true,
  className = ''
}: CRMContactCardProps) {
  const initials = contact.entity_name
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const roleColors = {
    'Decision Maker': 'bg-red-100 text-red-800',
    'Influencer': 'bg-blue-100 text-blue-800',
    'User': 'bg-green-100 text-green-800',
    'Champion': 'bg-purple-100 text-purple-800',
    'Blocker': 'bg-yellow-100 text-yellow-800',
    'Gatekeeper': 'bg-gray-100 text-gray-800'
  }

  return (
    <div 
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 
        ${compact ? 'p-3' : 'p-4'} ${className}
      `}
      onClick={() => onViewProfile?.(contact)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {contact.avatar_url ? (
            <img
              src={contact.avatar_url}
              alt={contact.entity_name}
              className={`rounded-full object-cover ${compact ? 'w-10 h-10' : 'w-12 h-12'}`}
            />
          ) : (
            <div 
              className={`
                rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                flex items-center justify-center text-white font-medium
                ${compact ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-base'}
              `}
            >
              {initials}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and Role */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <h3 className={`font-semibold text-gray-900 truncate ${compact ? 'text-sm' : 'text-base'}`}>
                {contact.entity_name}
              </h3>
              {contact.job_title && (
                <p className={`text-gray-600 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                  {contact.job_title}
                  {contact.department && ` • ${contact.department}`}
                </p>
              )}
            </div>
            
            {contact.contact_role && (
              <span 
                className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shrink-0
                  ${roleColors[contact.contact_role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}
                `}
              >
                {contact.contact_role}
              </span>
            )}
          </div>

          {/* Company */}
          {contact.company && !compact && (
            <div className="flex items-center gap-1 mb-2 text-sm text-gray-600">
              <Building2 className="w-3 h-3" />
              <span className="truncate">{contact.company}</span>
            </div>
          )}

          {/* Contact Info */}
          <div className={`space-y-1 ${compact ? 'text-xs' : 'text-sm'}`}>
            {contact.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            
            {contact.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
                <span>{contact.phone}</span>
              </div>
            )}

            {contact.mobile && contact.mobile !== contact.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
                <span>{contact.mobile}</span>
              </div>
            )}
          </div>

          {/* Last Activity */}
          {contact.last_activity_date && !compact && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>Last activity: {new Date(contact.last_activity_date).toLocaleDateString()}</span>
            </div>
          )}

          {/* Quick Actions */}
          {showActions && (
            <div className="flex items-center gap-2 mt-3">
              {contact.phone && onCall && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCall(contact)
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  Call
                </button>
              )}
              
              {contact.email && onEmail && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEmail(contact)
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  Email
                </button>
              )}

              {contact.mobile && onSMS && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSMS(contact)
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
                >
                  <MessageCircle className="w-3 h-3" />
                  SMS
                </button>
              )}

              {onScheduleMeeting && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onScheduleMeeting(contact)
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                >
                  <Calendar className="w-3 h-3" />
                  Meet
                </button>
              )}

              {contact.linkedin_url && (
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  LinkedIn
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Compact version for lists
export function CRMContactListItem({
  contact,
  onSelect,
  selected = false,
  ...props
}: CRMContactCardProps & {
  onSelect?: (contact: CRMContact) => void
  selected?: boolean
}) {
  return (
    <div className="relative">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect?.(contact)}
        className="absolute top-4 left-4 rounded z-10"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="pl-10">
        <CRMContactCard
          contact={contact}
          compact={true}
          showActions={false}
          {...props}
        />
      </div>
    </div>
  )
}