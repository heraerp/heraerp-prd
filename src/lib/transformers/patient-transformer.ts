import { formatDate } from '@/src/lib/date-utils'

export interface UIPatient {
  id: string
  name: string
  medical_record_number: string
  date_of_birth: string
  blood_type: string
  allergies: string
  medications: string
  insurance_info: string
  status: string
  createdAt: string
  relationships: any[]
}

export function transformToUIPatient(data: {
  entity: any
  dynamicFields: any[]
  relationships: any[]
}): UIPatient {
  const { entity, dynamicFields, relationships } = data

  // Helper to get field value
  const getField = (fieldName: string) => {
    const field = dynamicFields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || field?.field_value_date || ''
  }

  return {
    id: entity.id,
    name: entity.entity_name,
    medical_record_number: getField('medical_record_number'),
    date_of_birth: getField('date_of_birth'),
    blood_type: getField('blood_type'),
    allergies: getField('allergies'),
    medications: getField('medications'),
    insurance_info: getField('insurance_info'),
    status: entity.status,
    createdAt: formatDate(new Date(entity.created_at), 'MMM d, yyyy'),
    relationships
  }
}

export function filterPatient(items: UIPatient[], searchTerm: string): UIPatient[] {
  if (!searchTerm) return items

  const term = searchTerm.toLowerCase()
  return items.filter(
    item =>
      item.name.toLowerCase().includes(term) ||
      item.medical_record_number?.toLowerCase().includes(term) ||
      item.date_of_birth?.toLowerCase().includes(term) ||
      item.blood_type?.toLowerCase().includes(term) ||
      item.allergies?.toLowerCase().includes(term) ||
      item.medications?.toLowerCase().includes(term) ||
      item.insurance_info?.toLowerCase().includes(term)
  )
}
