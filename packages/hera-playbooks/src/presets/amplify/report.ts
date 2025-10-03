import { EntityPreset } from '../../types/preset'

export const AMPLIFY_REPORT_PRESET: EntityPreset = {
  entityType: 'AMPLIFY_REPORT',
  smartCode: 'HERA.AMPLIFY.REPORT.ENTITY.V1',
  label: 'Reports',
  labels: {
    singular: 'Report',
    plural: 'Reports'
  },
  dynamicFields: [
    {
      name: 'period',
      type: 'json', // {start, end}
      required: true,
      smart_code: 'HERA.AMPLIFY.REPORT.DYN.PERIOD.V1'
    },
    {
      name: 'metrics',
      type: 'json',
      required: true,
      smart_code: 'HERA.AMPLIFY.REPORT.DYN.METRICS.V1'
    },
    {
      name: 'branding',
      type: 'json', // logo/colors
      smart_code: 'HERA.AMPLIFY.REPORT.DYN.BRANDING.V1'
    },
    {
      name: 'url',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.REPORT.DYN.URL.V1'
    },
    {
      name: 'pdf_url',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.REPORT.DYN.PDF_URL.V1'
    }
  ]
} as const