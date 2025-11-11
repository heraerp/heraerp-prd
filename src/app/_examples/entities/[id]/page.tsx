// app/examples/entities/[id]/page.tsx - Entity detail with dynamic data

import React from 'react'
import { ObjectHeader, DataTable, useEntity, useDynamicData } from '@/ui'
import { useRouter } from 'next/navigation'

export default function EntityDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: entity, isLoading: entityLoading } = useEntity(params.id)
  const { data: dynamicData, isLoading: dynamicLoading } = useDynamicData(params.id)

  const isLoading = entityLoading || dynamicLoading

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Entity not found</h3>
          <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800">
            Go back
          </button>
        </div>
      </div>
    )
  }

  // Transform dynamic data for display
  const dynamicFields =
    dynamicData?.map((field: any) => {
      let value =
        field.field_value_text ||
        field.field_value_number ||
        field.field_value_boolean ||
        field.field_value_date ||
        field.field_value_json

      if (field.field_value_json) {
        value = JSON.stringify(field.field_value_json, null, 2)
      }

      return {
        ...field,
        display_value: value
      }
    }) || []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
      >
        ← Back to list
      </button>

      <ObjectHeader
        title={
          <>
            {entity.entity_name}
            {entity.entity_code && (
              <span className="ml-2 text-sm text-gray-500">({entity.entity_code})</span>
            )}
          </>
        }
        subtitle={
          <div className="space-y-1">
            <div className="capitalize">{entity.entity_type}</div>
            {entity.smart_code && (
              <div className="font-mono text-xs text-gray-500">{entity.smart_code}</div>
            )}
          </div>
        }
        tags={[entity.status, entity.parent_entity_id && 'Has Parent'].filter(Boolean)}
        right={
          <div className="text-sm text-gray-600">
            Created {new Date(entity.created_at).toLocaleDateString()}
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        {/* Core Entity Details */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-lg font-medium mb-3">Entity Information</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">ID</dt>
              <dd className="font-mono text-xs mt-1">{entity.id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Organization</dt>
              <dd className="font-mono text-xs mt-1">{entity.organization_id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="capitalize mt-1">{entity.entity_type}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd className="mt-1">{entity.status || 'active'}</dd>
            </div>
            {entity.entity_description && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Description</dt>
                <dd className="mt-1">{entity.entity_description}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Dynamic Fields */}
        {dynamicFields.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Dynamic Fields</h3>
            <DataTable
              rows={dynamicFields}
              columns={[
                {
                  header: 'Field Name',
                  key: 'field_name',
                  render: row => (
                    <div>
                      <div className="font-medium">{row.field_name}</div>
                      <div className="text-xs text-gray-500">{row.field_type}</div>
                    </div>
                  )
                },
                {
                  header: 'Value',
                  key: 'display_value',
                  render: row => {
                    if (row.field_type === 'json') {
                      return (
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-w-md">
                          {row.display_value}
                        </pre>
                      )
                    }
                    if (row.field_type === 'boolean') {
                      return row.display_value ? '✓ Yes' : '✗ No'
                    }
                    return row.display_value || '-'
                  }
                },
                {
                  header: 'Smart Code',
                  key: 'smart_code',
                  width: '200px',
                  render: row =>
                    row.smart_code ? (
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {row.smart_code}
                      </code>
                    ) : (
                      '-'
                    )
                },
                {
                  header: 'Updated',
                  key: 'updated_at',
                  width: '150px',
                  render: row => new Date(row.updated_at).toLocaleDateString()
                }
              ]}
            />
          </div>
        )}
      </div>
    </div>
  )
}
