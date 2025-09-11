import { formatDate } from '@/lib/date-utils'

export interface UIAppointment {
  id: string
  name: string
  date: string
  time: string
  duration: string
  notes: string
  status: string
  status: string
  createdAt: string
  relationships: any[]
}

export function transformToUIAppointment(data: {
  entity: any
  dynamicFields: any[]
  relationships: any[]
}): UIAppointment {
  const { entity, dynamicFields, relationships } = data
  
  // Helper to get field value
  const getField = (fieldName: string) => {
    const field = dynamicFields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || field?.field_value_date || ''
  }
  
  return {
    id: entity.id,
    name: entity.entity_name,
    date: getField('date'),
    time: getField('time'),
    duration: getField('duration'),
    notes: getField('notes'),
    status: getField('status'),
    status: entity.status,
    createdAt: formatDate(new Date(entity.created_at), 'MMM d, yyyy'),
    relationships
  }
}

export function filterAppointment(items: UIAppointment[], searchTerm: string): UIAppointment[] {
  if (!searchTerm) return items
  
  const term = searchTerm.toLowerCase()
  return items.filter(item => 
    item.name.toLowerCase().includes(term) ||
    item.date?.toLowerCase().includes(term) ||
    item.time?.toLowerCase().includes(term) ||
    item.duration?.toLowerCase().includes(term) ||
    item.notes?.toLowerCase().includes(term) ||
    item.status?.toLowerCase().includes(term)
  )
}