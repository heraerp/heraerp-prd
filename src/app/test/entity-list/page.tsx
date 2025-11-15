'use client'

import React from 'react'
import UniversalEntityList from '@/components/micro-apps/UniversalEntityList'

/**
 * Universal Entity List Test Page
 * Tests the complete entity list functionality
 */
export default function EntityListTestPage() {
  const testWorkspaceContext = {
    domain: 'retail',
    section: 'ops',
    organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'test-org'
  }

  const handleEntitySelect = (entity: any) => {
    console.log('Selected entity:', entity)
    alert(`Selected: ${entity.entity_name}`)
  }

  const handleEntityEdit = (entity: any) => {
    console.log('Edit entity:', entity)
    alert(`Edit: ${entity.entity_name}`)
  }

  const handleEntityDelete = (entity: any) => {
    console.log('Delete entity:', entity)
    if (confirm(`Are you sure you want to delete "${entity.entity_name}"?`)) {
      alert('Entity deleted (simulation)')
    }
  }

  const handleEntityCreate = () => {
    console.log('Create new entity')
    alert('Opening entity creation form...')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Universal Entity List Test
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Testing the advanced glassmorphism SAP Fiori style entity list component
          </p>
        </div>

        <UniversalEntityList
          workspaceContext={testWorkspaceContext}
          onEntitySelect={handleEntitySelect}
          onEntityEdit={handleEntityEdit}
          onEntityDelete={handleEntityDelete}
          onEntityCreate={handleEntityCreate}
          showSearch={true}
          showFilters={true}
          showActions={true}
          showSelection={true}
          showExport={true}
          enableRealTimeUpdates={false}
          customActions={[
            {
              id: 'duplicate',
              label: 'Duplicate',
              icon: ({ className }) => (
                <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              ),
              handler: (entity: any) => {
                alert(`Duplicating: ${entity.entity_name}`)
              }
            }
          ]}
        />
      </div>
    </div>
  )
}