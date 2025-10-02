import { defineDocumentType, makeSource } from 'contentlayer/source-files'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  email: z.string().email().optional()
})

const LocationsSchema = z.object({
  hq: z.string().optional(),
  regions: z.array(z.string()).optional()
})

export const Partner = defineDocumentType(() => ({
  name: 'Partner',
  filePathPattern: `partners/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    name: {
      type: 'string',
      required: true
    },
    slug: {
      type: 'string',
      required: true
    },
    website: {
      type: 'string',
      required: false
    },
    logo: {
      type: 'string',
      required: false
    },
    summary: {
      type: 'string',
      required: false
    },
    tags: {
      type: 'list',
      of: { type: 'string' },
      required: false
    },
    locations: {
      type: 'json',
      required: false
    },
    specialties: {
      type: 'list',
      of: { type: 'string' },
      required: false
    },
    contacts: {
      type: 'json',
      required: false
    },
    smart_code: {
      type: 'string',
      required: true
    },
    seo_title: {
      type: 'string',
      required: false
    },
    seo_description: {
      type: 'string',
      required: false
    },
    published: {
      type: 'boolean',
      default: true,
      required: false
    },
    featured: {
      type: 'boolean',
      default: false,
      required: false
    }
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (doc) => `/partners/${doc.slug}`
    },
    ogTitle: {
      type: 'string',
      resolve: (doc) => doc.seo_title ?? doc.name
    },
    ogDescription: {
      type: 'string',
      resolve: (doc) => doc.seo_description ?? doc.summary ?? ''
    }
  }
}))

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Partner],
  disableImportAliasWarning: true
})