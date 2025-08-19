/**
 * Customer Data Transformer
 * Transforms Universal API data to UI-friendly format
 */

import { CustomerData } from '@/hooks/useCustomers'

export interface UICustomer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  preferences: string
  notes: string
  totalSpent: number
  visits: number
  lastVisit: string
  favoriteServices: string[]
  loyaltyTier: string
  createdDate: string
}

/**
 * Transform customer data from Universal API format to UI format
 */
export function transformToUICustomer(customerData: CustomerData): UICustomer {
  const { entity, dynamicFields, transactions, relationships } = customerData
  
  // Calculate total spent from transactions
  const totalSpent = transactions.reduce((sum, transaction) => {
    // Only count completed transactions
    if (transaction.status === 'completed' || !transaction.status) {
      return sum + (transaction.total_amount || 0)
    }
    return sum
  }, 0)
  
  // Count visits (unique transaction dates)
  const visitDates = new Set(
    transactions
      .filter(t => t.transaction_date)
      .map(t => new Date(t.transaction_date).toDateString())
  )
  const visits = visitDates.size
  
  // Find last visit date
  const transactionDates = transactions
    .filter(t => t.transaction_date)
    .map(t => new Date(t.transaction_date))
    .filter(date => !isNaN(date.getTime()))
  
  const lastVisitDate = transactionDates.length > 0 
    ? new Date(Math.max(...transactionDates.map(d => d.getTime())))
    : null
  
  // Get loyalty tier from relationships
  const loyaltyRelation = relationships.find(r => 
    r.relationship_type === 'has_status' && 
    r.relationship_metadata?.status_type === 'loyalty_tier'
  )
  const loyaltyTier = loyaltyRelation?.relationship_metadata?.status_name || 'Bronze'
  
  // Get favorite services from relationships
  const favoriteServices = relationships
    .filter(r => r.relationship_type === 'favorite_service')
    .map(r => r.relationship_metadata?.service_name || r.metadata?.service_name)
    .filter(Boolean)
  
  // Format dates
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }
  
  return {
    id: entity.id,
    name: entity.entity_name || '',
    email: dynamicFields.email || '',
    phone: dynamicFields.phone || '',
    address: dynamicFields.address || '',
    dateOfBirth: formatDate(dynamicFields.date_of_birth),
    preferences: dynamicFields.preferences || '',
    notes: dynamicFields.notes || '',
    totalSpent,
    visits,
    lastVisit: lastVisitDate ? formatDate(lastVisitDate.toISOString()) : 'Never',
    favoriteServices,
    loyaltyTier,
    createdDate: formatDate(entity.created_at)
  }
}

/**
 * Calculate loyalty tier based on business rules
 */
export function calculateLoyaltyTier(totalSpent: number, visits: number): string {
  if (totalSpent >= 2000 || visits >= 15) {
    return 'Platinum'
  } else if (totalSpent >= 1000 || visits >= 10) {
    return 'Gold'
  } else if (totalSpent >= 500 || visits >= 5) {
    return 'Silver'
  }
  return 'Bronze'
}

/**
 * Get tier display properties
 */
export function getTierDisplayProps(tier: string) {
  switch (tier) {
    case 'Platinum':
      return {
        color: 'purple',
        bgClass: 'bg-purple-100',
        textClass: 'text-purple-800',
        borderClass: 'border-purple-200',
        icon: '💎'
      }
    case 'Gold':
      return {
        color: 'yellow',
        bgClass: 'bg-yellow-100',
        textClass: 'text-yellow-800',
        borderClass: 'border-yellow-200',
        icon: '⭐'
      }
    case 'Silver':
      return {
        color: 'gray',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-800',
        borderClass: 'border-gray-200',
        icon: '🥈'
      }
    default:
      return {
        color: 'orange',
        bgClass: 'bg-orange-100',
        textClass: 'text-orange-800',
        borderClass: 'border-orange-200',
        icon: '🥉'
      }
  }
}

/**
 * Transform UI customer back to API format for updates
 */
export function transformFromUICustomer(uiCustomer: Partial<UICustomer>) {
  const entityUpdate: any = {}
  const dynamicFields: Record<string, any> = {}
  
  if (uiCustomer.name !== undefined) {
    entityUpdate.entity_name = uiCustomer.name
  }
  
  if (uiCustomer.email !== undefined) {
    dynamicFields.email = uiCustomer.email
  }
  
  if (uiCustomer.phone !== undefined) {
    dynamicFields.phone = uiCustomer.phone
  }
  
  if (uiCustomer.address !== undefined) {
    dynamicFields.address = uiCustomer.address
  }
  
  if (uiCustomer.dateOfBirth !== undefined) {
    dynamicFields.date_of_birth = uiCustomer.dateOfBirth
  }
  
  if (uiCustomer.preferences !== undefined) {
    dynamicFields.preferences = uiCustomer.preferences
  }
  
  if (uiCustomer.notes !== undefined) {
    dynamicFields.notes = uiCustomer.notes
  }
  
  return {
    entityUpdate,
    dynamicFields
  }
}

/**
 * Get customer display initials
 */
export function getCustomerInitials(name: string): string {
  if (!name) return '?'
  
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format as (XXX) XXX-XXXX if US number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  // Return original if not standard format
  return phone
}

/**
 * Search filter for customers
 */
export function filterCustomers(customers: UICustomer[], searchTerm: string): UICustomer[] {
  if (!searchTerm) return customers
  
  const term = searchTerm.toLowerCase()
  
  return customers.filter(customer => 
    customer.name.toLowerCase().includes(term) ||
    customer.email.toLowerCase().includes(term) ||
    customer.phone.includes(term) ||
    customer.address.toLowerCase().includes(term)
  )
}