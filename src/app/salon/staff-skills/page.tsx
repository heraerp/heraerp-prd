/**
 * Staff Skills Management Page
 * Auto-generated using Universal Configuration Manager
 */

'use client'

import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { CONFIG_TYPES } from '@/lib/universal-config/config-types'

export default function StaffSkillsPage() {
  return (
    <div className="container mx-auto p-6">
      <UniversalConfigManager
        config={CONFIG_TYPES.STAFF_SKILL}
        apiEndpoint="/api/v1/salon/staff-skills"
        additionalFields={[
          // Add custom fields here
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            defaultValue: ''
          }
        ]}
      />
    </div>
  )
}