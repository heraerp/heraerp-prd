import { format } from 'date-fns'

export interface UIReport {
  id: string
  name: string
  report_type: string
  frequency: string
  parameters: string
  last_run: string
  recipients: string
  format: string
  status: string
  createdAt: string
  relationships: any[]
}

export function transformToUIReport(data: {
  entity: any
  dynamicFields: any[]
  relationships: any[]
}): UIReport {
  const { entity, dynamicFields, relationships } = data
  
  // Helper to get field value
  const getField = (fieldName: string) => {
    const field = dynamicFields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || field?.field_value_date || ''
  }
  
  return {
    id: entity.id,
    name: entity.entity_name,
    report_type: getField('report_type'),
    frequency: getField('frequency'),
    parameters: getField('parameters'),
    last_run: getField('last_run'),
    recipients: getField('recipients'),
    format: getField('format'),
    status: entity.status,
    createdAt: format(new Date(entity.created_at), 'MMM d, yyyy'),
    relationships
  }
}

export function filterReport(items: UIReport[], searchTerm: string): UIReport[] {
  if (!searchTerm) return items
  
  const term = searchTerm.toLowerCase()
  return items.filter(item => 
    item.name.toLowerCase().includes(term) ||
    item.report_type?.toLowerCase().includes(term) ||
    item.frequency?.toLowerCase().includes(term) ||
    item.parameters?.toLowerCase().includes(term) ||
    item.last_run?.toLowerCase().includes(term) ||
    item.recipients?.toLowerCase().includes(term) ||
    item.format?.toLowerCase().includes(term)
  )
}