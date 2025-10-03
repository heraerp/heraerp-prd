import { EntityPreset } from '../../types/preset'

export const AMPLIFY_CONTENT_PRESET: EntityPreset = {
  entityType: 'AMPLIFY_CONTENT',
  smartCode: 'HERA.AMPLIFY.CONTENT.ENTITY.V1',
  label: 'Content',
  labels: {
    singular: 'Content',
    plural: 'Content'
  },
  dynamicFields: [
    {
      name: 'source_type',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.CONTENT.DYN.SOURCE_TYPE.V1',
      ui: {
        widget: 'select',
        options: ['topic', 'draft', 'article']
      }
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      smart_code: 'HERA.AMPLIFY.CONTENT.DYN.TITLE.V1'
    },
    {
      name: 'body',
      type: 'text',
      required: true,
      smart_code: 'HERA.AMPLIFY.CONTENT.DYN.BODY.V1',
      ui: {
        widget: 'markdown'
      }
    },
    {
      name: 'seo_title',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.CONTENT.DYN.SEO_TITLE.V1'
    },
    {
      name: 'meta_description',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.CONTENT.DYN.META_DESCRIPTION.V1'
    },
    {
      name: 'keywords',
      type: 'json',
      smart_code: 'HERA.AMPLIFY.CONTENT.DYN.KEYWORDS.V1'
    },
    {
      name: 'schema_jsonld',
      type: 'json',
      smart_code: 'HERA.AMPLIFY.CONTENT.DYN.SCHEMA_JSONLD.V1'
    },
    {
      name: 'internal_links',
      type: 'json',
      smart_code: 'HERA.AMPLIFY.CONTENT.DYN.INTERNAL_LINKS.V1'
    },
    {
      name: 'external_links',
      type: 'json',
      smart_code: 'HERA.AMPLIFY.CONTENT.DYN.EXTERNAL_LINKS.V1'
    },
    {
      name: 'status',
      type: 'text',
      smart_code: 'HERA.AMPLIFY.CONTENT.DYN.STATUS.V1',
      ui: {
        widget: 'badge',
        options: ['ingested', 'optimized', 'ready', 'published']
      }
    }
  ],
  relationships: [
    {
      type: 'CONTENT_PUBLISHED_AS',
      smart_code: 'HERA.AMPLIFY.CONTENT.REL.PUBLISHED_AS.V1',
      cardinality: 'one'
    },
    {
      type: 'CONTENT_HAS_ASSET',
      smart_code: 'HERA.AMPLIFY.CONTENT.REL.HAS_ASSET.V1',
      cardinality: 'many'
    },
    {
      type: 'CONTENT_TO_SOCIAL_POST',
      smart_code: 'HERA.AMPLIFY.CONTENT.REL.TO_SOCIAL_POST.V1',
      cardinality: 'many'
    }
  ]
} as const