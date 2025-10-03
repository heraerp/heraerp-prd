import { EntityPreset } from '../../types/preset'

export const AMPLIFY_PERSONA_PRESET: EntityPreset = {
  entityType: 'AMPLIFY_PERSONA',
  smartCode: 'HERA.AMPLIFY.PERSONA.ENTITY.V1',
  label: 'Personas',
  labels: {
    singular: 'Persona',
    plural: 'Personas'
  },
  dynamicFields: [
    {
      name: 'tone',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.PERSONA.DYN.TONE.V1',
      ui: {
        widget: 'select',
        options: ['authoritative', 'playful', 'technical', 'storyteller']
      }
    },
    {
      name: 'bio',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.PERSONA.DYN.BIO.V1',
      ui: {
        widget: 'textarea'
      }
    },
    {
      name: 'style_guide',
      type: 'json',
      smart_code: 'HERA.AMPLIFY.PERSONA.DYN.STYLE_GUIDE.V1'
    }
  ]
} as const