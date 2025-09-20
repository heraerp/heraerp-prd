import { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'

interface PatientData {
  entity: any
  dynamicFields: any[]
  relationships: any[]
  transactions?: any[]
}

export function usePatient(organizationId?: string) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })

  const fetchData = async () => {
    if (!organizationId) return

    try {
      setLoading(true)
      setError(null)

      // 1. Get entities
      const entitiesRes = await universalApi.getEntities('patient', organizationId)
      if (!entitiesRes.success) throw new Error(entitiesRes.error)

      const entities = entitiesRes.data || []
      const entityIds = entities.map(e => e.id)

      if (entityIds.length === 0) {
        setItems([])
        setStats({ total: 0, active: 0, inactive: 0 })
        return
      }

      // 2. Get dynamic fields
      const fieldsPromises = entityIds.map(id => universalApi.getDynamicFields(id, organizationId))
      const fieldsResults = await Promise.all(fieldsPromises)

      // 3. Get relationships
      const relPromises = entityIds.map(id => universalApi.getRelationships(id, organizationId))
      const relResults = await Promise.all(relPromises)

      // 4. Transform data
      const transformedItems = entities.map((entity, index) => ({
        entity,
        dynamicFields: fieldsResults[index].data || [],
        relationships: relResults[index].data || []
      }))

      setItems(transformedItems)

      // Calculate stats
      setStats({
        total: entities.length,
        active: entities.filter(e => e.status === 'active').length,
        inactive: entities.filter(e => e.status === 'inactive').length
      })
    } catch (err) {
      console.error('Error fetching patient data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // CRUD operations
  const createPatient = async (data: any) => {
    if (!organizationId) throw new Error('No organization ID')

    const result = await universalApi.createEntity(
      {
        entity_type: 'patient',
        entity_name: data.name || data.title || data.description,
        entity_code: `PATIENT-${Date.now()}`,
        smart_code: 'HERA.HLTH.PATIENT.v1',
        status: 'active'
      },
      organizationId
    )

    if (!result.success) throw new Error(result.error)

    // Add dynamic fields
    const fieldPromises = []
    if (data.medical_record_number) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'medical_record_number',
          data.medical_record_number,
          'text',
          organizationId
        )
      )
    }
    if (data.date_of_birth) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'date_of_birth',
          data.date_of_birth,
          'text',
          organizationId
        )
      )
    }
    if (data.blood_type) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'blood_type',
          data.blood_type,
          'text',
          organizationId
        )
      )
    }
    if (data.allergies) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'allergies',
          data.allergies,
          'text',
          organizationId
        )
      )
    }
    if (data.medications) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'medications',
          data.medications,
          'text',
          organizationId
        )
      )
    }
    if (data.insurance_info) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'insurance_info',
          data.insurance_info,
          'text',
          organizationId
        )
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh

    return result.data
  }

  const updatePatient = async (id: string, updates: any) => {
    if (!organizationId) throw new Error('No organization ID')

    // Update entity
    if (updates.name || updates.status) {
      const entityUpdate = await universalApi.updateEntity(
        id,
        {
          entity_name: updates.name,
          status: updates.status
        },
        organizationId
      )

      if (!entityUpdate.success) throw new Error(entityUpdate.error)
    }

    // Update dynamic fields
    const fieldPromises = []
    if (updates.medical_record_number !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'medical_record_number',
          updates.medical_record_number,
          'text',
          organizationId
        )
      )
    }
    if (updates.date_of_birth !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'date_of_birth',
          updates.date_of_birth,
          'text',
          organizationId
        )
      )
    }
    if (updates.blood_type !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'blood_type', updates.blood_type, 'text', organizationId)
      )
    }
    if (updates.allergies !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'allergies', updates.allergies, 'text', organizationId)
      )
    }
    if (updates.medications !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'medications', updates.medications, 'text', organizationId)
      )
    }
    if (updates.insurance_info !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'insurance_info',
          updates.insurance_info,
          'text',
          organizationId
        )
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh
  }

  const deletePatient = async (id: string) => {
    if (!organizationId) throw new Error('No organization ID')

    const result = await universalApi.deleteEntity(id, organizationId)
    if (!result.success) throw new Error(result.error)

    await fetchData() // Refresh
  }

  return {
    items,
    loading,
    error,
    stats,
    refetch: fetchData,
    createPatient,
    updatePatient,
    deletePatient
  }
}
