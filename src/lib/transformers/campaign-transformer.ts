import { formatDate } from '@/lib/date-utils'

export interface UICampaign {
  id: string
  name: string
  campaign_type: string
  start_date: string
  end_date: string
  target_audience: string
  budget: string
  status: string
  channel: string
  status: string
  createdAt: string
  relationships: any[]
}

export function transformToUICampaign(data: {
  entity: any
  dynamicFields: any[]
  relationships: any[]
}): UICampaign {
  const { entity, dynamicFields, relationships } = data
  
  // Helper to get field value
  const getField = (fieldName: string) => {
    const field = dynamicFields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || field?.field_value_date || ''
  }
  
  return {
    id: entity.id,
    name: entity.entity_name,
    campaign_type: getField('campaign_type'),
    start_date: getField('start_date'),
    end_date: getField('end_date'),
    target_audience: getField('target_audience'),
    budget: getField('budget'),
    status: getField('status'),
    channel: getField('channel'),
    status: entity.status,
    createdAt: formatDate(new Date(entity.created_at), 'MMM d, yyyy'),
    relationships
  }
}

export function filterCampaign(items: UICampaign[], searchTerm: string): UICampaign[] {
  if (!searchTerm) return items
  
  const term = searchTerm.toLowerCase()
  return items.filter(item => 
    item.name.toLowerCase().includes(term) ||
    item.campaign_type?.toLowerCase().includes(term) ||
    item.start_date?.toLowerCase().includes(term) ||
    item.end_date?.toLowerCase().includes(term) ||
    item.target_audience?.toLowerCase().includes(term) ||
    item.budget?.toLowerCase().includes(term) ||
    item.status?.toLowerCase().includes(term) ||
    item.channel?.toLowerCase().includes(term)
  )
}