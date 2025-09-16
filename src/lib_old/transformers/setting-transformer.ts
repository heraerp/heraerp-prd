import { formatDate } from '@/lib/date-utils'

export interface UISetting {
  id: string
  name: string
  setting_key: string
  setting_value: string
  setting_type: string
  description: string
  updated_by: string
  status: string
  createdAt: string
  relationships: any[]
}

export function transformToUISetting(data: {
  entity: any
  dynamicFields: any[]
  relationships: any[]
}): UISetting {
  const { entity, dynamicFields, relationships } = data

  // Helper to get field value
  const getField = (fieldName: string) => {
    const field = dynamicFields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || field?.field_value_date || ''
  }

  return {
    id: entity.id,
    name: entity.entity_name,
    setting_key: getField('setting_key'),
    setting_value: getField('setting_value'),
    setting_type: getField('setting_type'),
    description: getField('description'),
    updated_by: getField('updated_by'),
    status: entity.status,
    createdAt: formatDate(new Date(entity.created_at), 'MMM d, yyyy'),
    relationships
  }
}

export function filterSetting(items: UISetting[], searchTerm: string): UISetting[] {
  if (!searchTerm) return items

  const term = searchTerm.toLowerCase()
  return items.filter(
    item =>
      item.name.toLowerCase().includes(term) ||
      item.setting_key?.toLowerCase().includes(term) ||
      item.setting_value?.toLowerCase().includes(term) ||
      item.setting_type?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.updated_by?.toLowerCase().includes(term)
  )
}
