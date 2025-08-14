/**
 * Progressive Lead Capture System
 * Automatically captures and processes warm leads from progressive authentication
 */

import { getProgressiveAuthState } from '@/lib/auth/progressive-auth'

export interface ProgressiveLeadData {
  email: string
  workspace_id: string
  organization_id: string
  organization_name: string
  identified_at: string
  modules_used: string[]
  interactions_count: number
  data_size: number
  last_activity: string
  source: string
  user_agent: string
  referrer: string
}

/**
 * Capture lead data from progressive authentication
 */
export async function captureProgressiveLead(
  email: string,
  additionalData?: Partial<ProgressiveLeadData>
): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    // Get current progressive auth state
    const authState = getProgressiveAuthState()
    if (!authState.workspace) {
      return { success: false, error: 'No workspace found' }
    }

    // Gather data from localStorage
    const workspaceData = getWorkspaceAnalytics(authState.workspace.organization_id)
    
    // Determine source module based on current path or most used module
    const source = determineLeadSource(workspaceData.modules_used)

    const leadData: ProgressiveLeadData = {
      email,
      workspace_id: authState.workspace.id,
      organization_id: authState.workspace.organization_id,
      organization_name: authState.workspace.organization_name,
      identified_at: new Date().toISOString(),
      modules_used: workspaceData.modules_used,
      interactions_count: workspaceData.total_interactions,
      data_size: workspaceData.total_data_size,
      last_activity: workspaceData.last_activity,
      source,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      referrer: typeof document !== 'undefined' ? document.referrer : 'Direct',
      ...additionalData
    }

    // Send to warm leads API
    const response = await fetch('/api/v1/crm/warm-leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'add_lead',
        data: leadData
      })
    })

    const result = await response.json()

    if (result.success) {
      // Track the lead capture event
      trackLeadCaptureEvent(leadData)
      
      return { success: true, leadId: result.data.id }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error) {
    console.error('Lead capture error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Lead capture failed' 
    }
  }
}

/**
 * Get workspace analytics from localStorage
 */
function getWorkspaceAnalytics(organizationId: string) {
  try {
    const dataKey = `hera_data_${organizationId}`
    const metadataKey = `${dataKey}_metadata`
    
    const workspaceData = JSON.parse(localStorage.getItem(dataKey) || '{}')
    const metadata = JSON.parse(localStorage.getItem(metadataKey) || '{}')
    
    // Analyze modules used
    const modulesUsed = Object.keys(workspaceData).filter(key => 
      workspaceData[key] && typeof workspaceData[key] === 'object'
    )
    
    // Calculate total interactions
    let totalInteractions = 0
    let lastActivity = new Date(0)
    
    Object.values(metadata).forEach((meta: any) => {
      if (meta.interactions) totalInteractions += meta.interactions
      if (meta.lastModified) {
        const modDate = new Date(meta.lastModified)
        if (modDate > lastActivity) lastActivity = modDate
      }
    })
    
    // Calculate total data size
    const totalDataSize = JSON.stringify(workspaceData).length
    
    return {
      modules_used: modulesUsed,
      total_interactions: totalInteractions,
      total_data_size: totalDataSize,
      last_activity: lastActivity.toISOString(),
      workspace_data: workspaceData,
      metadata
    }
  } catch (error) {
    console.error('Analytics gathering error:', error)
    return {
      modules_used: [],
      total_interactions: 0,
      total_data_size: 0,
      last_activity: new Date().toISOString(),
      workspace_data: {},
      metadata: {}
    }
  }
}

/**
 * Determine lead source based on modules used
 */
function determineLeadSource(modulesUsed: string[]): string {
  // Priority order for source determination
  const sourceMap: Record<string, string> = {
    financial: 'financial',
    crm: 'crm',
    inventory: 'inventory',
    jewelry: 'jewelry',
    restaurant: 'restaurant',
    healthcare: 'healthcare'
  }
  
  // Check current path
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname
    for (const [key, source] of Object.entries(sourceMap)) {
      if (currentPath.includes(key)) {
        return source
      }
    }
  }
  
  // Fall back to most used module
  for (const module of modulesUsed) {
    if (sourceMap[module]) {
      return sourceMap[module]
    }
  }
  
  return 'other'
}

/**
 * Track lead capture event for analytics
 */
function trackLeadCaptureEvent(leadData: ProgressiveLeadData) {
  try {
    // Send to analytics service (replace with your analytics)
    console.log('🎯 Lead Captured:', {
      email: leadData.email,
      source: leadData.source,
      modules: leadData.modules_used,
      interactions: leadData.interactions_count,
      data_size: leadData.data_size
    })
    
    // Could integrate with Google Analytics, Mixpanel, etc.
    if (typeof gtag !== 'undefined') {
      gtag('event', 'progressive_lead_capture', {
        email_domain: leadData.email.split('@')[1],
        source: leadData.source,
        modules_count: leadData.modules_used.length,
        interactions: leadData.interactions_count
      })
    }
  } catch (error) {
    console.error('Lead tracking error:', error)
  }
}

/**
 * Update lead activity when user continues using the system
 */
export async function updateLeadActivity(
  email: string, 
  activity: {
    module?: string
    interactions_delta?: number
    data_size_delta?: number
  }
): Promise<void> {
  try {
    // Find lead by email and update activity
    const response = await fetch('/api/v1/crm/warm-leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update_activity',
        email,
        activity
      })
    })
    
    if (!response.ok) {
      console.warn('Failed to update lead activity')
    }
  } catch (error) {
    console.error('Lead activity update error:', error)
  }
}

/**
 * Get all warm leads for sales team
 */
export async function getWarmLeads(filters?: {
  status?: string
  source?: string
  min_score?: number
}) {
  try {
    const params = new URLSearchParams()
    params.append('action', 'list')
    
    if (filters?.status) params.append('status', filters.status)
    if (filters?.source) params.append('source', filters.source)
    if (filters?.min_score) params.append('min_score', filters.min_score.toString())
    
    const response = await fetch(`/api/v1/crm/warm-leads?${params}`)
    const result = await response.json()
    
    if (result.success) {
      return result.data
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Get warm leads error:', error)
    throw error
  }
}

/**
 * Get warm leads statistics
 */
export async function getWarmLeadsStats() {
  try {
    const response = await fetch('/api/v1/crm/warm-leads?action=stats')
    const result = await response.json()
    
    if (result.success) {
      return result.data
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Get warm leads stats error:', error)
    throw error
  }
}

/**
 * Export warm leads for email marketing
 */
export async function exportWarmLeadsForEmail() {
  try {
    const response = await fetch('/api/v1/crm/warm-leads?action=export')
    const result = await response.json()
    
    if (result.success) {
      // Create downloadable CSV
      const csvContent = convertToCSV(result.data)
      downloadCSV(csvContent, `warm-leads-${new Date().toISOString().split('T')[0]}.csv`)
      
      return result.data
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Export warm leads error:', error)
    throw error
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value
    ).join(',')
  )
  
  return [headers, ...rows].join('\n')
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}