import { EntityPreset } from '../../types/preset'

export const AMPLIFY_SOCIAL_POST_PRESET: EntityPreset = {
  entityType: 'AMPLIFY_SOCIAL_POST',
  smartCode: 'HERA.AMPLIFY.SOCIAL.POST.ENTITY.V1',
  label: 'Social Posts',
  labels: {
    singular: 'Social Post',
    plural: 'Social Posts'
  },
  dynamicFields: [
    {
      name: 'platform',
      type: 'text',
      required: true,
      smart_code: 'HERA.AMPLIFY.SOCIAL.POST.DYN.PLATFORM.V1',
      ui: {
        widget: 'select',
        options: ['x', 'linkedin', 'instagram', 'tiktok', 'youtube_shorts']
      }
    },
    {
      name: 'body',
      type: 'text',
      required: true,
      smart_code: 'HERA.AMPLIFY.SOCIAL.POST.DYN.BODY.V1',
      ui: {
        widget: 'textarea'
      }
    },
    {
      name: 'schedule_at',
      type: 'date',
      smart_code: 'HERA.AMPLIFY.SOCIAL.POST.DYN.SCHEDULE_AT.V1'
    },
    {
      name: 'published_id',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.SOCIAL.POST.DYN.PUBLISHED_ID.V1'
    },
    {
      name: 'status',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.SOCIAL.POST.DYN.STATUS.V1',
      ui: {
        widget: 'badge',
        options: ['queued', 'scheduled', 'published', 'failed']
      }
    }
  ]
} as const