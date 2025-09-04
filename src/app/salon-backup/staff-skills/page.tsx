/**
 * Staff Skills Management Page
 * Auto-generated using Universal Configuration Manager
 */

'use client'

import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { CONFIG_TYPES } from '@/lib/universal-config/config-types'

export default function StaffSkillsPage() {
  const proficiencyLevels = [
    { value: 'beginner', label: 'Beginner - Learning basics' },
    { value: 'intermediate', label: 'Intermediate - Can perform with supervision' },
    { value: 'advanced', label: 'Advanced - Can perform independently' },
    { value: 'expert', label: 'Expert - Can train others' },
    { value: 'master', label: 'Master - Industry leader' }
  ]

  const serviceCategories = [
    { value: 'HAIR', label: 'Hair Services' },
    { value: 'NAILS', label: 'Nail Services' },
    { value: 'SKIN', label: 'Skin Care' },
    { value: 'BODY', label: 'Body Treatments' },
    { value: 'MAKEUP', label: 'Makeup Services' },
    { value: 'LASHES', label: 'Lash & Brow' },
    { value: 'MASSAGE', label: 'Massage Therapy' },
    { value: 'OTHER', label: 'Other Services' }
  ]

  return (
    <div className="container mx-auto p-6">
      <UniversalConfigManager
        config={CONFIG_TYPES.STAFF_SKILL}
        apiEndpoint="/api/v1/salon/staff-skills"
        additionalFields={[
          {
            name: 'description',
            label: 'Skill Description',
            type: 'textarea',
            defaultValue: '',
            placeholder: 'Describe what this skill involves and any special techniques'
          },
          {
            name: 'service_category',
            label: 'Service Category',
            type: 'select',
            options: serviceCategories,
            defaultValue: 'HAIR',
            required: true
          },
          {
            name: 'certification_required',
            label: 'Certification Required',
            type: 'checkbox',
            defaultValue: false,
            helpText: 'This skill requires professional certification or license'
          },
          {
            name: 'training_hours',
            label: 'Training Hours Required',
            type: 'number',
            defaultValue: 0,
            min: 0,
            placeholder: 'Number of training hours needed',
            helpText: 'Hours of training required to achieve basic proficiency'
          },
          {
            name: 'experience_months',
            label: 'Experience Required (months)',
            type: 'number',
            defaultValue: 0,
            min: 0,
            placeholder: 'Months of experience needed',
            helpText: 'Recommended months of experience for this skill'
          },
          {
            name: 'proficiency_levels',
            label: 'Available Proficiency Levels',
            type: 'multiselect',
            options: proficiencyLevels,
            defaultValue: ['beginner', 'intermediate', 'advanced'],
            helpText: 'Select all proficiency levels that can be achieved for this skill'
          },
          {
            name: 'assessment_required',
            label: 'Requires Assessment',
            type: 'checkbox',
            defaultValue: false,
            helpText: 'Staff must pass an assessment to be certified in this skill'
          },
          {
            name: 'renewal_period_days',
            label: 'Renewal Period (days)',
            type: 'number',
            defaultValue: 0,
            min: 0,
            placeholder: '0 for no renewal required',
            helpText: 'Days before skill certification needs renewal (0 = no renewal)'
          }
        ]}
        customColumns={[
          {
            key: 'category',
            header: 'Category',
            render: (item) => (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {item.service_category || 'General'}
              </span>
            )
          },
          {
            key: 'certification',
            header: 'Certification',
            render: (item) => (
              <span className="text-sm">
                {item.certification_required ? '🏆 Required' : '➖ Optional'}
              </span>
            )
          },
          {
            key: 'training',
            header: 'Training',
            render: (item) => (
              <span className="text-sm text-muted-foreground">
                {item.training_hours ? `${item.training_hours} hours` : 'None'}
              </span>
            )
          }
        ]}
        showAnalytics={true}
        analyticsConfig={{
          title: 'Skills Overview',
          metrics: [
            {
              label: 'Total Skills',
              value: (items) => items.length
            },
            {
              label: 'Certified Skills',
              value: (items) => items.filter(item => item.certification_required).length
            },
            {
              label: 'Categories',
              value: (items) => {
                const categories = new Set(items.map(item => item.service_category).filter(Boolean))
                return categories.size
              }
            }
          ]
        }}
      />
    </div>
  )
}