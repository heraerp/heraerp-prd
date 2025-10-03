import { EntityPreset } from '../../types/preset'

export const AMPLIFY_CAMPAIGN_PRESET: EntityPreset = {
  entityType: 'AMPLIFY_CAMPAIGN',
  smartCode: 'HERA.AMPLIFY.CAMPAIGN.ENTITY.V1',
  label: 'Campaigns',
  dynamicFields: [
    {
      name: 'status',
      type: 'text',
      required: true,
      smart_code: 'HERA.AMPLIFY.CAMPAIGN.DYN.STATUS.V1',
      ui: {
        widget: 'select',
        options: ['draft', 'active', 'paused', 'completed']
      }
    },
    {
      name: 'goal',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.CAMPAIGN.DYN.GOAL.V1'
    },
    {
      name: 'kpis',
      type: 'json',
      smart_code: 'HERA.AMPLIFY.CAMPAIGN.DYN.KPIS.V1'
    },
    {
      name: 'budget',
      type: 'number',
      smart_code: 'HERA.AMPLIFY.CAMPAIGN.DYN.BUDGET.V1',
      ui: {
        widget: 'currency',
        visible: (role) => ['owner', 'manager'].includes(role)
      }
    },
    {
      name: 'schedule',
      type: 'json', // {start, end, cadence}
      smart_code: 'HERA.AMPLIFY.CAMPAIGN.DYN.SCHEDULE.V1'
    }
  ],
  relationships: [
    {
      type: 'CAMPAIGN_HAS_PERSONA',
      smart_code: 'HERA.AMPLIFY.CAMPAIGN.REL.HAS_PERSONA.V1',
      cardinality: 'many'
    },
    {
      type: 'CAMPAIGN_HAS_CHANNEL',
      smart_code: 'HERA.AMPLIFY.CAMPAIGN.REL.HAS_CHANNEL.V1',
      cardinality: 'many'
    },
    {
      type: 'CAMPAIGN_HAS_CONTENT',
      smart_code: 'HERA.AMPLIFY.CAMPAIGN.REL.HAS_CONTENT.V1',
      cardinality: 'many'
    },
    {
      type: 'CAMPAIGN_HAS_REPORT',
      smart_code: 'HERA.AMPLIFY.CAMPAIGN.REL.HAS_REPORT.V1',
      cardinality: 'many'
    }
  ]
} as const