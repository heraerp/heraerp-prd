import { EntityPreset } from '../../types/preset'

export const AMPLIFY_ANALYTIC_EVENT_PRESET: EntityPreset = {
  entityType: 'AMPLIFY_ANALYTIC_EVENT',
  smartCode: 'HERA.AMPLIFY.ANALYTIC.EVENT.ENTITY.V1',
  label: 'Analytics',
  labels: {
    singular: 'Analytic Event',
    plural: 'Analytic Events'
  },
  dynamicFields: [
    {
      name: 'source',
      type: 'text',
      required: true,
      smart_code: 'HERA.AMPLIFY.ANALYTIC.EVENT.DYN.SOURCE.V1',
      ui: {
        widget: 'select',
        options: ['ga', 'medium', 'x', 'linkedin', 'instagram', 'tiktok']
      }
    },
    {
      name: 'metric',
      type: 'text',
      required: true,
      smart_code: 'HERA.AMPLIFY.ANALYTIC.EVENT.DYN.METRIC.V1'
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      smart_code: 'HERA.AMPLIFY.ANALYTIC.EVENT.DYN.VALUE.V1'
    },
    {
      name: 'ts',
      type: 'date',
      smart_code: 'HERA.AMPLIFY.ANALYTIC.EVENT.DYN.TS.V1'
    },
    {
      name: 'payload',
      type: 'json',
      smart_code: 'HERA.AMPLIFY.ANALYTIC.EVENT.DYN.PAYLOAD.V1'
    }
  ]
} as const