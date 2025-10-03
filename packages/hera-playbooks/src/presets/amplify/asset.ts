import { EntityPreset } from '../../types/preset'

export const AMPLIFY_ASSET_PRESET: EntityPreset = {
  entityType: 'AMPLIFY_ASSET',
  smartCode: 'HERA.AMPLIFY.ASSET.ENTITY.V1',
  label: 'Assets',
  dynamicFields: [
    {
      name: 'type',
      type: 'text',
      required: true,
      smart_code: 'HERA.AMPLIFY.ASSET.DYN.TYPE.V1',
      ui: {
        widget: 'select',
        options: ['thread', 'carousel', 'video_script', 'infographic']
      }
    },
    {
      name: 'content',
      type: 'json',
      required: true,
      smart_code: 'HERA.AMPLIFY.ASSET.DYN.CONTENT.V1'
    },
    {
      name: 'media_urls',
      type: 'json',
      smart_code: 'HERA.AMPLIFY.ASSET.DYN.MEDIA_URLS.V1'
    },
    {
      name: 'status',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.ASSET.DYN.STATUS.V1',
      ui: {
        widget: 'badge',
        options: ['draft', 'ready', 'used']
      }
    }
  ]
} as const